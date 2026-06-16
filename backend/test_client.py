import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.test import Client

c = Client()
res1 = c.get('/api/matrimony/')
res2 = c.get('/api/matrimony-profiles/')
res3 = c.get('/api/matrimony/family-members/')
res4 = c.get('/api/matrimony-profiles/family-members/')

print(f"GET /api/matrimony/ -> Status: {res1.status_code}")
print(f"GET /api/matrimony-profiles/ -> Status: {res2.status_code}")
print(f"GET /api/matrimony/family-members/ -> Status: {res3.status_code}")
print(f"GET /api/matrimony-profiles/family-members/ -> Status: {res4.status_code}")
