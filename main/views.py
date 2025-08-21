from django.shortcuts import render, redirect
from django.contrib.auth import get_user_model, authenticate, logout, login as auth_login
from rest_framework import viewsets, generics, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from django.views import View
from django.contrib import messages


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


class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Patient.objects.filter(created_by=self.request.user, is_active=True)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_destroy(self, instance):
    # Soft delete instead of hard delete
        instance.is_active = False
        instance.save()

class DoctorViewSet(viewsets.ModelViewSet):
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Doctor.objects.filter( is_active=True)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_destroy(self, instance):
        # Soft delete
        instance.is_active = False
        instance.save()


class PatientDoctorMappingViewSet(viewsets.ModelViewSet):
    serializer_class = PatientDoctorMappingSerializer
    permission_classes = [permissions.IsAuthenticated]


    def get_queryset(self):
        user = self.request.user
        # Only mappings for patients the user owns
        return PatientDoctorMapping.objects.filter(patient__created_by=user, is_active=True)


    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)


    def perform_destroy(self, instance):
    # Soft delete
        instance.is_active = False
        instance.save()

class IsNotAuthenticated(permissions.BasePermission):
    """
    Permission class that allows access only to unauthenticated users.
    """
    def has_permission(self, request, view):
        return not request.user or not request.user.is_authenticated

class LoginTemplateView(View):
    def get(self, request):
        # redirect logged in users away from login page
        if request.user.is_authenticated:
            messages.info(request, "You are already logged in.")
            return redirect('home')
        return render(request, 'main/login.html')

    def post(self, request):
        if request.user.is_authenticated:
            messages.info(request, "You are already logged in.")
            return redirect('home')
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user:
            auth_login(request, user)
            return redirect('home')
        messages.error(request, 'Invalid username or password')
        return redirect('login')

class RegisterTemplateView(View):
    template_name = "main/register.html"

    def get(self, request):
        # redirect logged in users away from register page
        if request.user.is_authenticated:
            messages.info(request, "You are already logged in.")
            return redirect('home')
        form = UserSerializer()
        return render(request, self.template_name, {"form": form})

    def post(self, request):
        if request.user.is_authenticated:
            messages.info(request, "You are already logged in.")
            return redirect('home')
        serializer = UserSerializer(data=request.POST)
        if serializer.is_valid():
            password = request.POST.get("password")
            user = serializer.save(is_active=True, is_staff=False)

            # authenticate then login so Django sets the sessionid cookie
            login_user = authenticate(request, username=user.username, password=password)
            if login_user is not None:
                auth_login(request, login_user)
            else:
                user.backend = "django.contrib.auth.backends.ModelBackend"
                auth_login(request, user)

            return redirect("home")

        return render(request, self.template_name, {"form": serializer})

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsNotAuthenticated]  # only unauthenticated users allowed

    def perform_create(self, serializer):
        serializer.save(is_active=True, is_staff=False)
        # Optionally, you can set other fields like is_superuser, etc.

class LogoutView(View):
    def get(self, request):
        logout(request)
        return redirect('login')