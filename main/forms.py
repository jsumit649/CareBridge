from django import forms
from django.contrib.auth import get_user_model
from .models import Patient, Doctor, PatientDoctorMapping


from django import forms
from .models import Patient, Doctor

class PatientForm(forms.ModelForm):
    class Meta:
        model = Patient
        fields = ['name', 'age', 'gender', 'phone', 'email', 'address', 'blood_group', 'allergies', 'medical_history', 'emergency_contact']

class DoctorForm(forms.ModelForm):
    class Meta:
        model = Doctor
        fields = ['name', 'specialization', 'experience', 'qualifications', 'license_number', 'email', 'phone', 'address']