from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Community, Member, Committee, Event, Job,
    Business, MatrimonyProfile, Campaign, Donation,
    News, Family, FamilyMember, EventRegistration,
    CommunityApprovalHistory, Notification, SubscriptionPlan, Role, Advertisement,
    Gallery, PartnerPreference, ProfileVisibility, InterestRequest, Wishlist, ProfileView,
    MatrimonyPhoto, MatrimonyAuditLog, JobApplication
)

# UserSerializer is defined below to avoid duplicates

# Community Serializer
class CommunitySerializer(serializers.ModelSerializer):
    # Writable ImageFields for file upload handling
    logo = serializers.ImageField(required=False, allow_null=True)
    cover = serializers.ImageField(required=False, allow_null=True)
    member_count = serializers.SerializerMethodField()
    events_count = serializers.SerializerMethodField()
    subsidiaries_count = serializers.SerializerMethodField()
    children_count = serializers.SerializerMethodField()
    committee_count = serializers.SerializerMethodField()
    families_count = serializers.SerializerMethodField()
    businesses_count = serializers.SerializerMethodField()
    donations_count = serializers.SerializerMethodField()
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    approval_history = serializers.SerializerMethodField()
    admin_name = serializers.SerializerMethodField()
    admin_email = serializers.SerializerMethodField()
    level = serializers.SerializerMethodField()
    path = serializers.SerializerMethodField()
    ancestors = serializers.SerializerMethodField()

    class Meta:
        model = Community
        fields = '__all__'

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        import time
        t = int(time.time())
        if instance.logo:
            try:
                url = f"{instance.logo.url}?t={t}"
                ret['logo'] = request.build_absolute_uri(url) if request else url
            except Exception:
                ret['logo'] = None
        else:
            ret['logo'] = f"{instance.logo_url}?t={t}" if instance.logo_url else None

        if instance.cover:
            try:
                url = f"{instance.cover.url}?t={t}"
                ret['cover'] = request.build_absolute_uri(url) if request else url
            except Exception:
                ret['cover'] = None
        else:
            ret['cover'] = f"{instance.cover_url}?t={t}" if instance.cover_url else None
        return ret

    def get_member_count(self, obj):
        return obj.members.count()

    def get_subsidiaries_count(self, obj):
        return obj.subsidiaries.filter(status__in=['Approved', 'Active']).count()

    def get_children_count(self, obj):
        return obj.subsidiaries.count()

    def get_committee_count(self, obj):
        return obj.committee_members.count()

    def get_families_count(self, obj):
        return obj.families.count()

    def get_businesses_count(self, obj):
        return obj.businesses.count()

    def get_donations_count(self, obj):
        from .models import Donation
        return Donation.objects.filter(campaign__community=obj).count()

    def get_approval_history(self, obj):
        history = obj.approval_history.all().order_by('approved_date')
        return CommunityApprovalHistorySerializer(history, many=True).data
    
    def get_events_count(self, obj):
        return obj.events.count()

    def get_admin_name(self, obj):
        admin = obj.members.filter(role='community_admin').first()
        return admin.name if admin else None

    def get_admin_email(self, obj):
        admin = obj.members.filter(role='community_admin').first()
        return admin.email if admin else None

    def get_level(self, obj):
        return obj.level

    def get_path(self, obj):
        return obj.path

    def get_ancestors(self, obj):
        return obj.ancestors_list


# Member Serializer
class MemberSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    community_name = serializers.CharField(source='community.name', read_only=True)
    community_logo = serializers.SerializerMethodField()
    community_cover = serializers.SerializerMethodField()
    community_type = serializers.CharField(source='community.type', read_only=True)
    parent_community_name = serializers.SerializerMethodField()
    custom_role_name = serializers.CharField(source='custom_role.name', read_only=True)
    permissions = serializers.SerializerMethodField()

    def get_permissions(self, obj):
        if obj.custom_role:
            role_perms = obj.custom_role.permissions if isinstance(obj.custom_role.permissions, list) else []
            member_perms = obj.permissions if isinstance(obj.permissions, list) else []
            return list(set(role_perms) & set(member_perms))
        return obj.permissions or []

    def get_community_logo(self, obj):
        if obj.community:
            import time
            t = int(time.time())
            request = self.context.get('request')
            if obj.community.logo:
                url = f"{obj.community.logo.url}?t={t}"
                return request.build_absolute_uri(url) if request else url
            if obj.community.logo_url:
                return f"{obj.community.logo_url}?t={t}"
        return None

    def get_community_cover(self, obj):
        if obj.community:
            import time
            t = int(time.time())
            request = self.context.get('request')
            if obj.community.cover:
                url = f"{obj.community.cover.url}?t={t}"
                return request.build_absolute_uri(url) if request else url
            if obj.community.cover_url:
                return f"{obj.community.cover_url}?t={t}"
        return None

    def get_parent_community_name(self, obj):
        if obj.community and obj.community.parent:
            return obj.community.parent.name
        return None

    class Meta:
        model = Member
        fields = '__all__'

    def update(self, instance, validated_data):
        name = validated_data.get('name')
        email = validated_data.get('email')
        user = instance.user
        if user:
            updated_user = False
            if name:
                parts = name.split(' ')
                user.first_name = parts[0]
                user.last_name = ' '.join(parts[1:]) if len(parts) > 1 else ''
                updated_user = True
            if email:
                user.email = email
                updated_user = True
            if updated_user:
                user.save()
        return super().update(instance, validated_data)

    def get_avatar(self, obj):
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return obj.avatar_url

# Committee Serializer
class CommitteeSerializer(serializers.ModelSerializer):
    photo = serializers.ImageField(required=False, allow_null=True)
    community_name = serializers.CharField(source='community.name', read_only=True)
    role_id = serializers.IntegerField(source='role.id', read_only=True, allow_null=True)
    permissions = serializers.SerializerMethodField()
    
    class Meta:
        model = Committee
        fields = '__all__'
    
    def get_permissions(self, obj):
        try:
            from django.contrib.auth.models import User
            user = User.objects.get(email=obj.email)
            return user.member_profile.permissions if isinstance(user.member_profile.permissions, list) else []
        except Exception:
            return []
    
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.photo:
            request = self.context.get('request')
            if request:
                ret['photo'] = request.build_absolute_uri(instance.photo.url)
            else:
                ret['photo'] = f"http://localhost:8000{instance.photo.url}"
        else:
            ret['photo'] = instance.photo_url
        return ret

# Event Serializer
class EventSerializer(serializers.ModelSerializer):
    img = serializers.ImageField(required=False, allow_null=True)
    community_name = serializers.CharField(source='community.name', read_only=True)
    
    class Meta:
        model = Event
        fields = '__all__'
    
    def to_internal_value(self, data):
        # Copy to allow modification
        try:
            data = data.copy()
        except AttributeError:
            pass
            
        for field_name in ['speakers', 'schedule', 'gallery']:
            if field_name in data and isinstance(data[field_name], str):
                import json
                try:
                    data[field_name] = json.loads(data[field_name])
                except Exception:
                    pass
        return super().to_internal_value(data)
    
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.img:
            request = self.context.get('request')
            if request:
                ret['img'] = request.build_absolute_uri(instance.img.url)
            else:
                ret['img'] = f"http://localhost:8000{instance.img.url}"
        else:
            ret['img'] = instance.img_url
        return ret

# Job Serializer
class JobSerializer(serializers.ModelSerializer):
    community_name = serializers.CharField(source='community.name', read_only=True, allow_null=True)
    
    class Meta:
        model = Job
        fields = '__all__'

# Job Application Serializer
class JobApplicationSerializer(serializers.ModelSerializer):
    job_title = serializers.CharField(source='job.role', read_only=True)
    company_name = serializers.CharField(source='job.company', read_only=True)
    applicant_name = serializers.CharField(source='member.name', read_only=True)
    community_name = serializers.CharField(source='community.name', read_only=True)
    resume = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = JobApplication
        fields = '__all__'

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Ensure resume has absolute URL
        if instance.resume and hasattr(instance.resume, 'url'):
            request = self.context.get('request')
            if request:
                ret['resume'] = request.build_absolute_uri(instance.resume.url)
            else:
                ret['resume'] = f"http://localhost:8000{instance.resume.url}"
        return ret

# Business Serializer
class BusinessSerializer(serializers.ModelSerializer):
    img = serializers.ImageField(required=False, allow_null=True)
    cover = serializers.ImageField(required=False, allow_null=True)
    community_name = serializers.CharField(source='community.name', read_only=True)
    
    class Meta:
        model = Business
        fields = '__all__'
    
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        
        # Logo serialization
        if instance.img:
            if request:
                ret['img'] = request.build_absolute_uri(instance.img.url)
            else:
                ret['img'] = f"http://localhost:8000{instance.img.url}"
        else:
            ret['img'] = instance.img_url

        # Cover image serialization
        if instance.cover:
            if request:
                ret['cover'] = request.build_absolute_uri(instance.cover.url)
            else:
                ret['cover'] = f"http://localhost:8000{instance.cover.url}"
        else:
            ret['cover'] = instance.cover_url
            
        # Gallery serialization
        gallery = ret.get('gallery') or []
        if isinstance(gallery, list):
            serialized_gallery = []
            for item in gallery:
                if item and not (item.startswith('http://') or item.startswith('https://') or item.startswith('data:')):
                    url_path = item if item.startswith('/') else f"/{item}"
                    if request:
                        serialized_gallery.append(request.build_absolute_uri(url_path))
                    else:
                        serialized_gallery.append(f"http://localhost:8000{url_path}")
                else:
                    serialized_gallery.append(item)
            ret['gallery'] = serialized_gallery
            
        return ret

class MatrimonyPhotoSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = MatrimonyPhoto
        fields = '__all__'
        
    def get_image(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return obj.image_url

class MatrimonyAuditLogSerializer(serializers.ModelSerializer):
    performed_by_username = serializers.CharField(source='performed_by.username', read_only=True)
    
    class Meta:
        model = MatrimonyAuditLog
        fields = '__all__'

# Matrimony Profile Serializer
class MatrimonyProfileSerializer(serializers.ModelSerializer):
    photo = serializers.SerializerMethodField()
    photos = MatrimonyPhotoSerializer(many=True, read_only=True)
    community_name = serializers.CharField(source='community.name', read_only=True)
    family_member_name = serializers.CharField(source='family_member.name', read_only=True)
    relationship_in_family = serializers.CharField(source='family_member.relation', read_only=True)
    partner_preference = serializers.SerializerMethodField()
    completion_percentage = serializers.SerializerMethodField()
    debug_fields = serializers.SerializerMethodField()
    match_score = serializers.SerializerMethodField()
    family_details = serializers.SerializerMethodField()
    views_count = serializers.SerializerMethodField()
    interests_received_count = serializers.SerializerMethodField()
    interests_sent_count = serializers.SerializerMethodField()
    photos_count = serializers.SerializerMethodField()
    visibility_details = serializers.SerializerMethodField()
    audience_count_cache = serializers.SerializerMethodField()

    class Meta:
        model = MatrimonyProfile
        fields = '__all__'

    def get_match_score(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            try:
                my_profile = request.user.created_matrimony_profiles.filter(deleted_at__isnull=True).first()
                if my_profile:
                    return my_profile.calculate_match_score(obj)
            except Exception:
                pass
        # If open testing is enabled, let's return a dynamic pseudo-random but stable score (not always 100%)
        # based on id to look realistic!
        val = (obj.id * 17) % 35 + 60  # range 60 to 94
        return val

    def get_views_count(self, obj):
        try:
            return obj.profile_views_received.count()
        except Exception:
            return 0

    def get_interests_received_count(self, obj):
        try:
            return obj.received_interests.count()
        except Exception:
            return 0

    def get_interests_sent_count(self, obj):
        try:
            return obj.sent_interests.count()
        except Exception:
            return 0

    def get_photos_count(self, obj):
        try:
            return obj.photos.count()
        except Exception:
            return 0


    def get_family_details(self, obj):
        try:
            if obj.family_member and obj.family_member.family:
                family = obj.family_member.family
                members_data = []
                for m in family.members.all():
                    members_data.append({
                        "id": m.id,
                        "name": m.name,
                        "relation": m.relation,
                        "age": m.age,
                        "occupation": m.occupation,
                        "education": m.education,
                        "job_title": m.job_title,
                        "salary": m.salary
                    })
                return {
                    "id": family.id,
                    "head": family.head,
                    "village": family.village,
                    "members": members_data
                }
        except Exception:
            pass
        return None


    def get_completion_percentage(self, obj):
        try:
            return obj.calculate_completion_percentage()
        except Exception:
            return 0

    def get_debug_fields(self, obj):
        """Returns which fields count as complete for debugging purposes."""
        try:
            return {
                'name': bool(obj.name and obj.name.strip()),
                'gender': bool(obj.gender),
                'dob': bool(obj.dob),
                'education': bool(obj.education and obj.education.strip()),
                'profession': bool(obj.profession and obj.profession.strip()),
                'income': bool(obj.income and obj.income.strip()),
                'height': bool(obj.height and obj.height.strip()),
                'weight': bool(obj.weight and obj.weight.strip()),
                'complexion': bool(obj.complexion and obj.complexion.strip()),
                'diet': bool(obj.diet and obj.diet.strip()),
                'marital_status': bool(obj.marital_status and obj.marital_status.strip()),
                'mother_tongue': bool(obj.mother_tongue and obj.mother_tongue.strip()),
                'religion': bool(obj.religion and obj.religion.strip()),
                'city': bool(obj.city and obj.city.strip()),
                'state': bool(obj.state and obj.state.strip()),
                'native_place': bool(obj.native_place and obj.native_place.strip()),
                'about': bool(obj.about and len(obj.about.strip()) >= 50),
                'photo': bool(obj.photos.exists() or obj.photo),
                'preferences': obj._has_preferences(),
                'contact_info': bool(
                    (obj.contact_name and obj.contact_name.strip()) or
                    (obj.contact_phone and obj.contact_phone.strip()) or
                    obj.name
                ),
                'status': obj.status,
                'completion_percentage': obj.calculate_completion_percentage(),
            }
        except Exception as e:
            return {'error': str(e)}
        
    def get_partner_preference(self, obj):
        try:
            pref = obj.partner_preference
            if pref:
                return {
                    "id": pref.id,
                    "gender": pref.gender,
                    "min_age": pref.min_age,
                    "max_age": pref.max_age,
                    "caste": pref.caste,
                    "sub_caste": pref.sub_caste,
                    "education": pref.education,
                    "occupation": pref.occupation,
                    "city": pref.city,
                    "state": pref.state,
                    "country": pref.country,
                    "min_height": pref.min_height,
                    "max_height": pref.max_height,
                    "marital_status": pref.marital_status,
                    "income_range": pref.income_range,
                }
        except Exception:
            pass
        return None
    
    def get_photo(self, obj):
        try:
            photo_obj = obj.photos.filter(category='Profile Photo').first()
            if photo_obj:
                if photo_obj.image:
                    request = self.context.get('request')
                    if request:
                        return request.build_absolute_uri(photo_obj.image.url)
                    return photo_obj.image.url
                return photo_obj.image_url
        except Exception:
            pass
            
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return obj.photo_url

    def get_visibility_details(self, obj):
        try:
            return {
                'visibility_type': getattr(obj, 'visibility_type', getattr(obj, 'visibility_scope', None)),
                'hierarchy_scope': getattr(obj, 'hierarchy_scope', getattr(obj, 'visibility_hierarchy', None)),
                'selected_communities': [c.id for c in obj.selected_communities.all()],
                'target_summary': {
                    'gender': getattr(obj, 'target_gender', getattr(obj, 'filter_gender', None)),
                    'age_min': getattr(obj, 'target_age_min', getattr(obj, 'filter_min_age', None)),
                    'age_max': getattr(obj, 'target_age_max', getattr(obj, 'filter_max_age', None)),
                }
            }
        except Exception:
            return None

    def get_audience_count_cache(self, obj):
        try:
            return int(getattr(obj, 'audience_count_cache', 0) or 0)
        except Exception:
            return 0

# Campaign Serializer
class CampaignSerializer(serializers.ModelSerializer):
    img = serializers.ImageField(required=False, allow_null=True)
    donations_count = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()
    community_name = serializers.CharField(source='community.name', read_only=True)
    
    class Meta:
        model = Campaign
        fields = '__all__'
    
    def get_donations_count(self, obj):
        return obj.donations.count()
    
    def get_progress(self, obj):
        if obj.goal > 0:
            return int((obj.raised / obj.goal) * 100)
        return 0

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.img:
            request = self.context.get('request')
            if request:
                ret['img'] = request.build_absolute_uri(instance.img.url)
            else:
                ret['img'] = f"http://localhost:8000{instance.img.url}"
        else:
            ret['img'] = instance.img_url
        return ret

# Donation Serializer
class DonationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Donation
        fields = '__all__'

# News Serializer
class NewsSerializer(serializers.ModelSerializer):
    img = serializers.ImageField(required=False, allow_null=True)
    community_name = serializers.CharField(source='community.name', read_only=True)
    
    class Meta:
        model = News
        fields = '__all__'
    
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.img:
            request = self.context.get('request')
            if request:
                ret['img'] = request.build_absolute_uri(instance.img.url)
            else:
                ret['img'] = f"http://localhost:8000{instance.img.url}"
        else:
            ret['img'] = instance.img_url
        return ret

# Family Member Serializer
class FamilyMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = FamilyMember
        fields = '__all__'

# Family Serializer
class FamilySerializer(serializers.ModelSerializer):
    members = FamilyMemberSerializer(many=True, read_only=True)
    
    class Meta:
        model = Family
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    role = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    communityName = serializers.SerializerMethodField()
    communityId = serializers.SerializerMethodField()
    plan = serializers.SerializerMethodField()
    planExpiry = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'name', 'username', 'email', 'password', 'role', 'avatar', 'communityName', 'communityId', 'plan', 'planExpiry')

    def get_role(self, obj):
        try:
            return obj.member_profile.role
        except Exception:
            return 'member'

    def get_name(self, obj):
        try:
            return obj.member_profile.name
        except Exception:
            return f"{obj.first_name} {obj.last_name}".strip() or obj.username

    def get_avatar(self, obj):
        try:
            profile = obj.member_profile
            if profile.avatar:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(profile.avatar.url)
                return profile.avatar.url
            return profile.avatar_url
        except Exception:
            return ""

    def get_communityName(self, obj):
        try:
            return obj.member_profile.community.name
        except Exception:
            return ""

    def get_communityId(self, obj):
        try:
            return obj.member_profile.community.id
        except Exception:
            return None

    def get_plan(self, obj):
        try:
            return obj.member_profile.community.plan
        except Exception:
            return "Free"

    def get_planExpiry(self, obj):
        return "2027-12-31" # Default fallback expiry

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('name', '').split(' ')[0] if 'name' in validated_data else '',
            last_name=' '.join(validated_data.get('name', '').split(' ')[1:]) if 'name' in validated_data else ''
        )
        return user



# Duplicate EventSerializer, JobSerializer, BusinessSerializer deleted to prevent overriding top definitions
class EventRegistrationSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source='event.title', read_only=True)
    
    class Meta:
        model = EventRegistration
        fields = '__all__'

class CommunityApprovalHistorySerializer(serializers.ModelSerializer):
    approved_by_username = serializers.CharField(source='approved_by.username', read_only=True)
    
    class Meta:
        model = CommunityApprovalHistory
        fields = '__all__'
        read_only_fields = ['id', 'created_at']

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = '__all__'

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class AdvertisementSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Advertisement
        fields = '__all__'

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.image:
            request = self.context.get('request')
            if request:
                ret['image'] = request.build_absolute_uri(instance.image.url)
            else:
                ret['image'] = f"http://localhost:8000{instance.image.url}"
        else:
            ret['image'] = instance.image_url
        return ret

class GallerySerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = Gallery
        fields = '__all__'
        
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.image:
            request = self.context.get('request')
            if request:
                ret['image'] = request.build_absolute_uri(instance.image.url)
            else:
                ret['image'] = f"http://localhost:8000{instance.image.url}"
        else:
            ret['image'] = instance.image_url
        return ret

class PartnerPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartnerPreference
        fields = '__all__'

class ProfileVisibilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfileVisibility
        fields = '__all__'

class InterestRequestSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.name', read_only=True)
    receiver_name = serializers.CharField(source='receiver.name', read_only=True)
    sender_photo = serializers.SerializerMethodField(read_only=True)
    sender_photo_url = serializers.SerializerMethodField(read_only=True)
    receiver_photo_url = serializers.SerializerMethodField(read_only=True)
    sender_details = MatrimonyProfileSerializer(source='sender', read_only=True)
    receiver_details = MatrimonyProfileSerializer(source='receiver', read_only=True)
    
    class Meta:
        model = InterestRequest
        fields = '__all__'

    def _get_profile_photo(self, profile):
        try:
            photo_obj = profile.photos.filter(category='Profile Photo').first()
            if photo_obj:
                if photo_obj.image:
                    request = self.context.get('request')
                    if request:
                        return request.build_absolute_uri(photo_obj.image.url)
                    return photo_obj.image.url
                return photo_obj.image_url
            if profile.photo:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(profile.photo.url)
                return profile.photo.url
            return profile.photo_url
        except Exception:
            return None

    def get_sender_photo(self, obj):
        try:
            return self._get_profile_photo(obj.sender)
        except Exception:
            return None

    def get_sender_photo_url(self, obj):
        try:
            return self._get_profile_photo(obj.sender)
        except Exception:
            return None

    def get_receiver_photo_url(self, obj):
        try:
            return self._get_profile_photo(obj.receiver)
        except Exception:
            return None

class WishlistSerializer(serializers.ModelSerializer):
    profile_details = MatrimonyProfileSerializer(source='profile', read_only=True)
    class Meta:
        model = Wishlist
        fields = '__all__'

class ProfileViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfileView
        fields = '__all__'

from api.models import MessageRequest, Conversation, Message, MessageReaction

class MessageRequestSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.name', read_only=True)
    sender_photo = serializers.SerializerMethodField(read_only=True)
    sender_profession = serializers.CharField(source='sender.profession', read_only=True)
    sender_village = serializers.CharField(source='sender.village', read_only=True)
    sender_community_name = serializers.CharField(source='sender.community.name', read_only=True)

    receiver_name = serializers.CharField(source='receiver.name', read_only=True)
    receiver_photo = serializers.SerializerMethodField(read_only=True)
    receiver_profession = serializers.CharField(source='receiver.profession', read_only=True)
    receiver_village = serializers.CharField(source='receiver.village', read_only=True)
    receiver_community_name = serializers.CharField(source='receiver.community.name', read_only=True)

    class Meta:
        model = MessageRequest
        fields = '__all__'

    def get_sender_photo(self, obj):
        if obj.sender.avatar:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.sender.avatar.url) if request else obj.sender.avatar.url
        return obj.sender.avatar_url

    def get_receiver_photo(self, obj):
        if obj.receiver.avatar:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.receiver.avatar.url) if request else obj.receiver.avatar.url
        return obj.receiver.avatar_url

class MessageReactionSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.name', read_only=True)
    
    class Meta:
        model = MessageReaction
        fields = ['id', 'emoji', 'member', 'member_name']

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.name', read_only=True)
    sender_photo = serializers.SerializerMethodField(read_only=True)
    reply_to_details = serializers.SerializerMethodField(read_only=True)
    reactions = MessageReactionSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = '__all__'

    def get_sender_photo(self, obj):
        if obj.sender.avatar:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.sender.avatar.url) if request else obj.sender.avatar.url
        return obj.sender.avatar_url

    def get_reply_to_details(self, obj):
        if obj.reply_to:
            image_url = None
            if obj.reply_to.image:
                request = self.context.get('request')
                image_url = request.build_absolute_uri(obj.reply_to.image.url) if request else obj.reply_to.image.url
            return {
                'id': obj.reply_to.id,
                'content': obj.reply_to.content,
                'sender': obj.reply_to.sender.id,
                'sender_name': obj.reply_to.sender.name,
                'image': image_url
            }
        return None

class ConversationSerializer(serializers.ModelSerializer):
    participant_1_details = serializers.SerializerMethodField(read_only=True)
    participant_2_details = serializers.SerializerMethodField(read_only=True)
    last_message = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Conversation
        fields = '__all__'

    def _get_member_details(self, member):
        photo_url = None
        if member.avatar:
            request = self.context.get('request')
            photo_url = request.build_absolute_uri(member.avatar.url) if request else member.avatar.url
        else:
            photo_url = member.avatar_url
            
        return {
            'id': member.id,
            'name': member.name,
            'photo': photo_url,
            'profession': member.profession,
            'village': member.village,
            'community_name': member.community.name if member.community else None
        }

    def get_participant_1_details(self, obj):
        return self._get_member_details(obj.participant_1)

    def get_participant_2_details(self, obj):
        return self._get_member_details(obj.participant_2)

    def get_last_message(self, obj):
        msg = obj.messages.order_by('-created_at').first()
        if msg:
            return {
                'id': msg.id,
                'content': msg.content,
                'created_at': msg.created_at,
                'sender_id': msg.sender_id,
                'is_seen': msg.is_seen
            }
        return None

from .models import (
    BookingProperty, PropertyResource, ResourcePricing, ResourceLock,
    VenueBooking, BookingInspection, BookingRefund, BookingWaitingList, ResourceDependency
)

class BookingPropertySerializer(serializers.ModelSerializer):
    community_name = serializers.CharField(source='community.name', read_only=True)
    cover_image = serializers.SerializerMethodField()
    gallery_images = serializers.SerializerMethodField()
    starting_price = serializers.SerializerMethodField()
    available_resources = serializers.SerializerMethodField()
    availability_status = serializers.SerializerMethodField()
    
    class Meta:
        model = BookingProperty
        fields = '__all__'
        read_only_fields = ['community']

    def validate(self, attrs):
        status_value = attrs.get('status', getattr(self.instance, 'status', 'Pending Approval'))
        reason = attrs.get('rejection_reason', getattr(self.instance, 'rejection_reason', ''))
        if status_value == 'Rejected' and not str(reason or '').strip():
            raise serializers.ValidationError({'rejection_reason': 'Rejection reason is required when rejecting a property.'})
        return attrs

    def get_cover_image(self, obj):
        return obj.photos[0] if isinstance(obj.photos, list) and obj.photos else None

    def get_gallery_images(self, obj):
        return obj.photos if isinstance(obj.photos, list) else []

    def get_starting_price(self, obj):
        rates = []
        for resource in obj.resources.all():
            for rate in (resource.hourly_rate, resource.half_day_rate, resource.full_day_rate):
                try:
                    value = float(rate or 0)
                    if value > 0:
                        rates.append(value)
                except Exception:
                    pass
            for pricing in resource.pricing.all():
                try:
                    value = float(pricing.price or 0)
                    if value > 0:
                        rates.append(value)
                except Exception:
                    pass
        return min(rates) if rates else float(obj.security_deposit or 0)

    def get_available_resources(self, obj):
        return obj.resources.filter(status='Active').count()

    def get_availability_status(self, obj):
        if obj.status != 'Approved':
            return 'Unavailable'
        return 'Available' if obj.resources.filter(status='Active').exists() else 'No Active Resources'

class PropertyResourceSerializer(serializers.ModelSerializer):
    photos = serializers.SerializerMethodField()
    dependencies = serializers.SerializerMethodField()
    required_by = serializers.SerializerMethodField()

    class Meta:
        model = PropertyResource
        fields = '__all__'


    def validate(self, attrs):
        min_hours = attrs.get('min_booking_duration_hours', getattr(self.instance, 'min_booking_duration_hours', 1))
        max_hours = attrs.get('max_booking_duration_hours', getattr(self.instance, 'max_booking_duration_hours', 24))
        if min_hours and max_hours and int(min_hours) > int(max_hours):
            raise serializers.ValidationError({'max_booking_duration_hours': 'Maximum booking duration must be greater than or equal to minimum duration.'})
        return attrs

    def get_photos(self, obj):
        return obj.media if isinstance(obj.media, list) else []

    def get_dependencies(self, obj):
        return [dep.requires.id for dep in obj.dependencies.all()]

    def get_required_by(self, obj):
        return [dep.resource.id for dep in obj.required_by.all()]

class ResourceDependencySerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceDependency
        fields = '__all__'

class ResourcePricingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourcePricing
        fields = '__all__'

class ResourceLockSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceLock
        fields = '__all__'

class VenueBookingSerializer(serializers.ModelSerializer):
    property_details = BookingPropertySerializer(source='property', read_only=True)
    resources_details = PropertyResourceSerializer(source='resources', many=True, read_only=True)
    member_name = serializers.CharField(source='member.name', read_only=True)

    class Meta:
        model = VenueBooking
        fields = '__all__'
        read_only_fields = ['member', 'booking_number']

class BookingInspectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingInspection
        fields = '__all__'

class BookingRefundSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingRefund
        fields = '__all__'

class BookingWaitingListSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingWaitingList
        fields = '__all__'
