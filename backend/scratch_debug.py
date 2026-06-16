import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import User, Family, FamilyMember, MatrimonyProfile

print("=== USERS & MEMBER PROFILES ===")
for u in User.objects.all():
    member = getattr(u, 'member_profile', None)
    if member:
        print(f"User: {u.username} (ID: {u.id}) -> Member: {member.name} (ID: {member.id}), Role: {member.role}, Community: {member.community.name if member.community else 'None'}")
    else:
        print(f"User: {u.username} (ID: {u.id}) -> No Member Profile")

print("\n=== FAMILIES ===")
for f in Family.objects.all():
    print(f"Family: {f.id}, Head: {f.head}, Village: {f.village}, Member Link ID: {f.member_id}")
    for m in f.members.all():
        print(f"  - Member: {m.name} (ID: {m.id}), Relation: {m.relation}")

print("\n=== MATRIMONY PROFILES ===")
for p in MatrimonyProfile.objects.all():
    print(f"Profile: {p.id}, Name: {p.name}, Family Member ID: {p.family_member_id}, User ID: {p.user_id}, Status: {p.status}, Deleted: {p.deleted_at}")
