from django.contrib import admin
from django import forms
from django.contrib.auth.hashers import make_password
from .models import FileHash, ApiUser
from django.contrib.auth.admin import UserAdmin

@admin.register(FileHash)
class FileHashAdmin(admin.ModelAdmin):
    list_display = ('hash_key',)

class ApiUserAdminForm(forms.ModelForm):
    class Meta:
        model = ApiUser
        fields = '__all__'

    def clean_password(self):
        password = self.cleaned_data['password']
        # Only hash if not already hashed
        if not password.startswith('pbkdf2_'):
            return make_password(password)
        return password
@admin.register(ApiUser)
class ApiUserAdmin(admin.ModelAdmin):
    form = ApiUserAdminForm
    list_display = ('username',)
    search_fields = ('username',)

    def save_model(self, request, obj, form, change):
        from django.contrib.auth.hashers import make_password
        if not obj.password.startswith('pbkdf2_'):
            obj.password = make_password(obj.password)
        super().save_model(request, obj, form, change)
