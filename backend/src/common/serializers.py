from django.conf import settings
from rest_framework import serializers
from rest_framework.serializers import ImageField as ApiImageField
from django.contrib.humanize.templatetags.humanize import naturaltime
from rest_framework.serializers import Serializer, FileField
import logging
from easy_thumbnails.files import get_thumbnailer
from easy_thumbnails import exceptions as easy_thumbnails_exceptions

from .models import LogDBEntry, BigLog

THUMBNAIL_ALIASES = getattr(settings, 'THUMBNAIL_ALIASES', {})


def get_url(request, instance, alias_obj, alias=None):
    """Return a fully-qualified URL for the image or thumbnail.

    This function tolerates invalid image files by catching thumbnail
    generation errors and falling back to the original file URL when
    possible. If no URL can be produced, returns None.
    """
    logger = logging.getLogger(__name__)
    try:
        if alias is not None:
            thumb = get_thumbnailer(instance).get_thumbnail(alias_obj[alias])
            return request.build_absolute_uri(thumb.url)
        elif alias is None:
            return request.build_absolute_uri(instance.url)
        else:
            raise TypeError("Unsupported field type")
    except easy_thumbnails_exceptions.InvalidImageFormatError:
        # Source file isn't a valid image — fall back to original URL if available.
        logger.warning("Invalid image format when generating thumbnail for %s", getattr(instance, 'name', str(instance)))
        try:
            return request.build_absolute_uri(instance.url)
        except Exception:
            return None
    except Exception as exc:
        # Catch-all to avoid serializer crashes when unusual file issues occur.
        logger.exception("Error building image URL: %s", exc)
        try:
            return request.build_absolute_uri(instance.url)
        except Exception:
            return None


def image_sizes(request, instance, alias_obj):
    i_sizes = list(alias_obj.keys())
    sizes = {'original': get_url(request, instance, alias_obj)}
    for k in i_sizes:
        url = get_url(request, instance, alias_obj, k)
        if url:
            sizes[k] = url
    return sizes


class ThumbnailerJSONSerializer(ApiImageField):
    def __init__(self, alias_target, **kwargs):
        self.alias_target = THUMBNAIL_ALIASES.get(alias_target)
        super(ThumbnailerJSONSerializer, self).__init__(**kwargs)

    def to_representation(self, instance):
        if instance:
            try:
                return image_sizes(self.context['request'], instance, self.alias_target)
            except Exception:
                # Defensive: ensure serializer never raises for malformed files
                return None
        return None


class UploadSerializer(Serializer):
    file_uploaded = FileField()
    
    class Meta:
        fields = ['file_uploaded']



class LogDBEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = LogDBEntry
        fields = '__all__'

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['since'] = naturaltime(instance.date_created)
        return representation


class BigLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = BigLog
        fields = '__all__'

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['since'] = naturaltime(instance.date_created)
        return representation


class EmptySerializer(serializers.Serializer):
    pass