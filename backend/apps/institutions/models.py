from django.db import models
from common.models import UUIDModel, TimeStampedModel

class Organization(UUIDModel, TimeStampedModel):
    """Represents a parent trust, society, or educational umbrella organization."""
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=100, unique=True)
    billing_email = models.EmailField(max_length=255)

    class Meta:
        db_table = 'organizations'
        ordering = ['name']

    def __str__(self):
        return self.name

class Institution(UUIDModel, TimeStampedModel):
    """
    Primary multi-tenant boundary representing a school or college.
    """
    INSTITUTION_TYPES = (
        ('SCHOOL', 'School'),
        ('COLLEGE', 'College'),
        ('HYBRID', 'Hybrid'),
    )

    organization = models.ForeignKey(
        Organization,
        on_delete=models.RESTRICT,
        related_name='institutions'
    )
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50)
    institution_type = models.CharField(max_length=20, choices=INSTITUTION_TYPES, default='SCHOOL')
    timezone = models.CharField(max_length=50, default='UTC')
    currency_code = models.CharField(max_length=3, default='USD')
    is_active = models.BooleanField(default=True)
    settings = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'institutions'
        constraints = [
            models.UniqueConstraint(
                fields=['organization', 'code'],
                name='unique_org_institution_code'
            )
        ]
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"
