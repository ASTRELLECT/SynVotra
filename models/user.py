from django.db import models

class User(models.Model):
    first_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, default="employee")  # Added role field
    avatar_url = models.URLField(blank=True, null=True)

    def __str__(self):
        return self.first_name