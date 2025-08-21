from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Patient, Doctor, PatientDoctorMapping

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "username", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user


class PatientSerializer(serializers.ModelSerializer):
    created_by = serializers.ReadOnlyField(source="created_by.id")

    class Meta:
        model = Patient
        fields = [
            "id",
            "created_by",
            "first_name",
            "last_name",
            "dob",
            "gender",
            "phone",
            "email",
            "address",
            "blood_group",
            "allergies",
            "medical_history",
            "emergency_contact",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]


class DoctorSerializer(serializers.ModelSerializer):
    created_by = serializers.ReadOnlyField(source="created_by.id")

    class Meta:
        model = Doctor
        fields = [
            "id",
            "created_by",
            "full_name",
            "specialization",
            "qualifications",
            "license_number",
            "email",
            "phone",
            "hospital_affiliation",
            "years_experience",
            "availability",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]


class PatientDoctorMappingSerializer(serializers.ModelSerializer):
    patient = serializers.PrimaryKeyRelatedField(queryset=Patient.objects.all())
    doctor = serializers.PrimaryKeyRelatedField(queryset=Doctor.objects.all())
    assigned_by = serializers.ReadOnlyField(source="assigned_by.id")

    def __init__(self, *args, **kwargs):
        # ensure patient choices are limited to the request user's patients
        super().__init__(*args, **kwargs)
        request = self.context.get("request", None)
        if request and getattr(request, "user", None) and not request.user.is_anonymous:
            self.fields["patient"].queryset = Patient.objects.filter(created_by=request.user, is_active=True)
        else:
            # anonymous users (or missing request) get no patient options
            self.fields["patient"].queryset = Patient.objects.none()

    class Meta:
        model = PatientDoctorMapping
        fields = [
            "id",
            "patient",
            "doctor",
            "assigned_by",
            "assigned_at",
            "relationship_type",
            "notes",
            "is_active",
        ]
        read_only_fields = ["id", "assigned_by", "assigned_at"]

    def validate(self, data):
        request = self.context.get("request")
        if not request or not getattr(request, "user", None) or request.user.is_anonymous:
            raise serializers.ValidationError("Authentication required to assign doctors.")
        if request.user != data["patient"].created_by:
            raise serializers.ValidationError("You can only assign doctors to your own patients.")
        return data

    def create(self, validated_data):
        # set assigned_by from the request user
        request = self.context.get("request")
        if request and getattr(request, "user", None) and not request.user.is_anonymous:
            validated_data["assigned_by"] = request.user
        return super().create(validated_data)
