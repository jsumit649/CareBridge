from django.contrib.auth import get_user_model
from rest_framework import viewsets, generics, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView


from .models import Patient, Doctor, PatientDoctorMapping
from .serializers import (
UserSerializer,
PatientSerializer,
DoctorSerializer,
PatientDoctorMappingSerializer,
)
from django.views.generic import TemplateView


class HomeView(TemplateView):
    template_name = 'main/home.html'


