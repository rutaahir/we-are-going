import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.urls import get_resolver
from django.urls.resolvers import RoutePattern, RegexPattern

def show_urls(resolver, prefix=''):
    lines = []
    for pattern in resolver.url_patterns:
        if hasattr(pattern, 'url_patterns'):
            lines.extend(show_urls(pattern, prefix + getattr(pattern.pattern, '_route', '') + '/'))
        else:
            path = prefix + getattr(pattern.pattern, '_route', '')
            lines.append(f"URL: {path} -> {pattern.callback}")
    return lines

with open('urls_output.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(show_urls(get_resolver())))
