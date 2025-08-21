from . import views
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('', views.HomeView.as_view(), name='home'),

    # Template pages (for your HTML login/register forms)
    path('login/', views.LoginTemplateView.as_view(), name='login'),
    path('register/', views.RegisterTemplateView.as_view(), name='register'),
    path('logout/', views.LogoutView.as_view(), name='logout'),

    # Patient and Doctor template pages
    path('patients/', views.PatientsView.as_view(), name='patients'),
    path('patient-details/<uuid:id>/', views.PatientDetailsView.as_view(), name='patient-details'),
    path('doctors/', views.DoctorsView.as_view(), name='doctors'),
    path('doctor-details/<uuid:id>/', views.DoctorDetailsView.as_view(), name='doctor-details'),

    # Add mapping page
    path('mappings/', views.MappingsView.as_view(), name='mappings'),

    # Authentication API endpoints
    path('api/register/', views.RegisterView.as_view(), name='api-register'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Patient / Doctor / Mapping APIs
    path('api/patients/', views.PatientViewSet.as_view({'get': 'list', 'post': 'create'}), name='patient-list'),
    path('api/patients/<uuid:pk>/', views.PatientViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='patient-detail'),

    path('api/doctors/', views.DoctorViewSet.as_view({'get': 'list', 'post': 'create'}), name='doctor-list'),
    path('api/doctors/<uuid:pk>/', views.DoctorViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='doctor-detail'),

    path('api/mappings/', views.PatientDoctorMappingViewSet.as_view({'get': 'list', 'post': 'create'}), name='mapping-list'),
    path('api/mappings/<uuid:pk>/', views.PatientDoctorMappingViewSet.as_view({'get': 'retrieve', 'delete': 'destroy'}), name='mapping-detail'),
]
