import logging
import string
import re

from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.http import HttpResponse

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import (
    AuthenticationFailed,
    NotFound,
    PermissionDenied,
    ValidationError,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.throttling import UserRateThrottle

from drf_spectacular.utils import extend_schema


from src.common.serializers import EmptySerializer
from src.lib.django.views_mixin import ViewSetHelperMixin
from src.lib.utils.uuid7 import uuid7
from src.notifications.Notifier import NotifyUser
from src.users.models import User, RecoveryCode, WaitList
from src.users.permissions import IsVerifiedUser
from src.users.serializers import (
    UpdateUserSerializer,
    UserSerializer,
)


logger = logging.getLogger("app")


# ─────────────────────────────────────────────
# THROTTLES
# ─────────────────────────────────────────────

class OtpRateThrottle(UserRateThrottle):
    rate = "3/min"


# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

# ─────────────────────────────────────────────
# USER VIEWSET
# ─────────────────────────────────────────────

class UserViewSet(ViewSetHelperMixin, viewsets.GenericViewSet):
    """
    Handles authenticated user self-service: read, update, delete.
    """

    queryset = User.objects.all()
    serializers = {
        "default": UserSerializer,
        "update_me": UpdateUserSerializer,

    }
    permissions = {
        "default": [IsVerifiedUser],
    }

    def perform_update(self, serializer):
        if self.request.user != serializer.instance:
            raise PermissionDenied("You can only update your own account.")
        serializer.save()

    @action(detail=False, methods=["get"])
    def me(self, request):
        """Return the authenticated user's profile."""
        return Response(
            UserSerializer(request.user, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], url_path="memberships")
    def memberships(self, request):
        """Return active organization memberships for the signed-in user."""
        memberships = (
            OrganizationMembership.objects.filter(
                user=request.user,
                status=OrganizationMembershipStatus.ACTIVE,
            )
            .select_related("organization", "role")
            .order_by("organization__name")
        )

        active_org_id = (
            str(request.user.active_organization_id)
            if request.user.active_organization_id
            else None
        )

        return Response(
            {
                "active_organization_id": active_org_id,
                "memberships": [
                    {
                        "id": str(membership.id),
                        "status": membership.status,
                        "organization": {
                            "id": str(membership.organization_id),
                            "name": membership.organization.name,
                            "description": membership.organization.description,
                            "logo": membership.organization.logo.url
                            if membership.organization.logo
                            else None,
                            "status": membership.organization.status,
                            "settings": membership.organization.settings,
                        },
                        "role": {
                            "id": str(membership.role_id),
                            "name": membership.role.name,
                            "role_type": membership.role.role_type,
                            "permissions": membership.role.permissions,
                            "is_system": membership.role.is_system,
                        },
                    }
                    for membership in memberships
                ],
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"], url_path="active-org")
    def active_org(self, request):
        """Persist the active organization preference for the signed-in user."""
        organization_id = request.data.get("organization_id") or request.data.get("orgId")
        if not organization_id:
            raise ValidationError({"organization_id": "This field is required."})

        organization = Organization.objects.filter(pk=organization_id).first()
        if not organization:
            raise NotFound("Organization not found.")

        is_member = OrganizationMembership.objects.filter(
            organization=organization,
            user=request.user,
            status=OrganizationMembershipStatus.ACTIVE,
        ).exists()
        if not is_member:
            raise PermissionDenied("You do not have access to this organization.")

        request.user.active_organization = organization
        request.user.save(update_fields=["active_organization"])

        return Response(
            {"active_organization_id": str(organization.id)},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["patch"])
    def update_me(self, request):
        """Partially update the authenticated user's profile."""
        instance = request.user
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        new_username = serializer.validated_data.get("username")
        if new_username and new_username != instance.username:
            if User.objects.exclude(pk=instance.pk).filter(username=new_username).exists():
                raise ValidationError({"username": "this username is already taken"})

        self.perform_update(serializer)

        # Bust any prefetch cache on the instance.
        if getattr(instance, "_prefetched_objects_cache", None):
            instance._prefetched_objects_cache = {}

        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["delete"])
    def delete_me(self, request):
        """
        Soft/hard delete the authenticated user's account.
        TODO: implement account deletion policy (soft-delete, data retention, etc.)
        """
        # Intentionally not implemented until deletion policy is finalised.
        return Response(status=status.HTTP_204_NO_CONTENT)
