import uuid
from django.conf import settings
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError('The Username must be set')
        username = self.model.normalize_username(username)
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(username, password, **extra_fields)

class User(AbstractUser):
    name = models.CharField(max_length=200, null=True)
    email = models.EmailField(unique=True, null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    username = models.CharField(max_length=150, unique=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = []

    objects = UserManager()


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        abstract = True

class Patient(TimestampedModel):


    GENDER_MALE = 'M'
    GENDER_FEMALE = 'F'
    GENDER_OTHER = 'O'
    GENDER_UNKNOWN = 'U'
    GENDER_CHOICES = [
        (GENDER_MALE, 'Male'),
        (GENDER_FEMALE, 'Female'),
        (GENDER_OTHER, 'Other'),
        (GENDER_UNKNOWN, 'Unknown'),
    ]


    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='patients'
    )


    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150, blank=True)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, default=GENDER_UNKNOWN)


    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)


    blood_group = models.CharField(max_length=5, blank=True)
    # Flexible JSON for things like ["penicillin"] or structured objects
    allergies = models.JSONField(default=list, blank=True)
    # Use JSONField for medical data that may be structured; default is empty dict
    medical_history = models.JSONField(default=dict, blank=True)
    emergency_contact = models.JSONField(default=dict, blank=True)


    is_active = models.BooleanField(default=True)


    class Meta:
        indexes = [
            models.Index(fields=['created_by']),
            models.Index(fields=['last_name', 'first_name']),
        ]
        ordering = ['-created_at']


    def __str__(self):
        return f"{self.first_name} {self.last_name or ''}".strip()