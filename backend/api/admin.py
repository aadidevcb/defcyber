from django.contrib import admin
from .models import FileHash

@admin.register(FileHash)
class FileHashAdmin(admin.ModelAdmin):
    list_display = ('hash_key',)
