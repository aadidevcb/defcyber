
from django.db import models
from django.db import models


class ApiUser(models.Model):
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=128)  # Hashed

    def __str__(self):
        return self.username


class FileHash(models.Model):
    
    hash_key = models.CharField(max_length=256)
    
    def __str__(self):
        return self.hash_key.split('  ')[0]
