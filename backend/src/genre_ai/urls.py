from django.urls import path
from rest_framework.routers import SimpleRouter

from . views import GenreAIViewset


genre_router = SimpleRouter()
genre_router.register(r'genre-ai', GenreAIViewset, basename='genre-ai')
