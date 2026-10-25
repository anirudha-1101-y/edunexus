from django.db import models

class TenantQuerySet(models.QuerySet):
    """QuerySet that filters records by institution tenant."""

    def for_institution(self, institution_id):
        if not institution_id:
            return self.none()
        return self.filter(institution_id=institution_id)

class TenantManager(models.Manager):
    """Manager providing tenant-scoped query capabilities."""

    def get_queryset(self):
        return TenantQuerySet(self.model, using=self._db)

    def for_institution(self, institution_id):
        return self.get_queryset().for_institution(institution_id)
