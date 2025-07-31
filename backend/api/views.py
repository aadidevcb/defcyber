from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.views import View
from django.contrib.auth.hashers import check_password
from django.conf import settings
from django.utils.decorators import method_decorator
from .models import ApiUser
import jwt

# Strawberry GraphQL JWT Auth

from strawberry.django.views import GraphQLView
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.views import View
from django.contrib.auth.hashers import check_password
from .models import ApiUser
import jwt

@method_decorator(csrf_exempt, name='dispatch')
class AuthGraphQLView(GraphQLView):
    def get_context(self, request, response):
        token = request.headers.get('Authorization')
        if token and token.startswith('Bearer '):
            token = token.split(' ', 1)[1]
            try:
                payload = jwt.decode(token, 'your-secret-key', algorithms=['HS256'])
                user_id = payload.get('user_id')
                user = ApiUser.objects.filter(id=user_id).first()
                request.user = user
            except Exception:
                request.user = None
        else:
            request.user = None
        return super().get_context(request, response)

@method_decorator(csrf_exempt, name='dispatch')
class ApiTokenView(View):
    def post(self, request):
        import json
        data = json.loads(request.body.decode())
        username = data.get('username')
        password = data.get('password')
        try:
            user = ApiUser.objects.get(username=username)
            if check_password(password, user.password):
                import jwt
                payload = {'user_id': user.id}
                token = jwt.encode(payload, 'your-secret-key', algorithm='HS256')
                return JsonResponse({'token': token})
            else:
                return JsonResponse({'detail': 'Invalid credentials'}, status=401)
        except ApiUser.DoesNotExist:
            return JsonResponse({'detail': 'Invalid credentials'}, status=401)
