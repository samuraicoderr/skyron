import logging

from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import render
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import (
    AuthenticationFailed,
    NotFound,
    PermissionDenied,
    ValidationError,
)

from src.lib.django.views_mixin import ViewSetHelperMixin
from src.common.serializers import EmptySerializer
from src.users.permissions import IsVerifiedUser, IsVerifiedAdminUser



class GenreAIViewset(ViewSetHelperMixin, viewsets.GenericViewSet):
    serializers = {
        "default": EmptySerializer,
    }
    permissions = {
        "default": [AllowAny],
    }


    @action(detail=False, methods=["get"])
    def dummy_endpoint(self, request):
        return Response({
            "message": "This is a dummy endpoint for Genre AI."
        })
