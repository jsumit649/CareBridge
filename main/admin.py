from django.contrib import admin

# Register your models here.
from . import models

admin.site.register(models.User)
admin.site.register(models.Patient)
admin.site.register(models.Doctor)
admin.site.register(models.PatientDoctorMapping)
admin.site.register(models.AuditLog)

