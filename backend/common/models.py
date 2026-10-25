import uuid
from django.db import models
from common.managers import TenantManager

class UUIDModel(models.Model):
    """Abstract model using UUID as primary key."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True

class TimeStampedModel(models.Model):
    """Abstract model tracking creation and update timestamps."""
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class TenantModel(UUIDModel, TimeStampedModel):
    """
    Abstract model for all tenant-owned entities.
    Enforces foreign key linkage to institutions.Institution.
    """
    institution = models.ForeignKey(
        'institutions.Institution',
        on_delete=models.RESTRICT,
        related_name="%(app_label)s_%(class)s_set",
        db_index=True
    )

    objects = TenantManager()

    class Meta:
        abstract = True
