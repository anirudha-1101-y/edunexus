import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from common.models import UUIDModel, TimeStampedModel

class UserManager(BaseUserManager):
    """Custom user manager supporting email-based authentication."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email address is required')
        email = self.normalize_email(email).lower()
        extra_fields.setdefault('is_active', True)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_platform_admin', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin, UUIDModel, TimeStampedModel):
    """Global user identity. Represents an individual human in EduNexus."""

    email = models.EmailField(max_length=255, unique=True, db_index=True)
    phone_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    is_platform_admin = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        db_table = 'users'
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

class Permission(models.Model):
    """Atomic privilege identifier (e.g. 'students:view')."""
    id = models.CharField(max_length=100, primary_key=True)
    category = models.CharField(max_length=50)
    description = models.TextField()

    class Meta:
        db_table = 'permissions'
        ordering = ['category', 'id']

    def __str__(self):
        return f"{self.category}: {self.id}"

class Role(UUIDModel, TimeStampedModel):
    """
    Role defining a bundle of permissions.
    institution=None indicates a system default template.
    institution!=None indicates an institution-specific role.
    """
    institution = models.ForeignKey(
        'institutions.Institution',
        on_delete=models.RESTRICT,
        null=True,
        blank=True,
        related_name='roles'
    )
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    permissions = models.ManyToManyField(Permission, related_name='roles', blank=True)

    class Meta:
        db_table = 'roles'
        constraints = [
            models.UniqueConstraint(
                fields=['institution', 'code'],
                name='unique_institution_role_code'
            )
        ]
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"

class InstitutionMembership(UUIDModel, TimeStampedModel):
    """
    Binds a global user to a specific institution tenant.
    """
    MEMBERSHIP_TYPES = (
        ('STUDENT', 'Student'),
        ('FACULTY', 'Faculty'),
        ('STAFF', 'Staff'),
        ('PARENT', 'Parent'),
    )

    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('SUSPENDED', 'Suspended'),
        ('ALUMNI', 'Alumni'),
    )

    institution = models.ForeignKey(
        'institutions.Institution',
        on_delete=models.RESTRICT,
        related_name='memberships'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    membership_type = models.CharField(max_length=30, choices=MEMBERSHIP_TYPES)
    identification_number = models.CharField(max_length=100)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='ACTIVE')
    roles = models.ManyToManyField(Role, related_name='memberships', blank=True)

    class Meta:
        db_table = 'institution_memberships'
        constraints = [
            models.UniqueConstraint(
                fields=['institution', 'user'],
                name='unique_institution_user_membership'
            ),
            models.UniqueConstraint(
                fields=['institution', 'identification_number'],
                name='unique_institution_id_number'
            )
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.institution.code} ({self.membership_type})"
