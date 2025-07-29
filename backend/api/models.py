from django.db import models

class FileHash(models.Model):
    
    hash_key = models.CharField(max_length=256)
    
    def __str__(self):
        return "Hash Key"
