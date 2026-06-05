from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Community, Member, Committee, Event, Job,
    Business, MatrimonyProfile, Campaign, Donation,
    News, Family, FamilyMember, EventRegistration,
    CommunityApprovalHistory, Notification
)

# User Serializer
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'password')
        
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

# Community Serializer
class CommunitySerializer(serializers.ModelSerializer):
    logo = serializers.SerializerMethodField()
    cover = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    events_count = serializers.SerializerMethodField()
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    approval_history = serializers.SerializerMethodField()
    admin_name = serializers.SerializerMethodField()
    admin_email = serializers.SerializerMethodField()
    
    class Meta:
        model = Community
        fields = '__all__'

    def get_logo(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return obj.logo_url

    def get_cover(self, obj):
        if obj.cover:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover.url)
            return obj.cover.url
        return obj.cover_url

    def get_member_count(self, obj):
        return obj.members.count()

    def get_approval_history(self, obj):
        history = obj.approval_history.all().order_by('approved_date')
        return CommunityApprovalHistorySerializer(history, many=True).data
    
    def get_events_count(self, obj):
        return obj.events.count()

    def get_admin_name(self, obj):
        admin = obj.members.filter(role='community_admin').first()
        return admin.name if admin else "N/A"

    def get_admin_email(self, obj):
        admin = obj.members.filter(role='community_admin').first()
        return admin.email if admin else "N/A"

# Member Serializer
class MemberSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    community_name = serializers.CharField(source='community.name', read_only=True)

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
    photo = serializers.SerializerMethodField()
    community_name = serializers.CharField(source='community.name', read_only=True)
    
    class Meta:
        model = Committee
        fields = '__all__'
    
    def get_photo(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return obj.photo_url

# Event Serializer
class EventSerializer(serializers.ModelSerializer):
    img = serializers.SerializerMethodField()
    community_name = serializers.CharField(source='community.name', read_only=True)
    
    class Meta:
        model = Event
        fields = '__all__'
    
    def get_img(self, obj):
        if obj.img:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.img.url)
            return obj.img.url
        return obj.img_url

# Job Serializer
class JobSerializer(serializers.ModelSerializer):
    community_name = serializers.CharField(source='community.name', read_only=True, allow_null=True)
    
    class Meta:
        model = Job
        fields = '__all__'

# Business Serializer
class BusinessSerializer(serializers.ModelSerializer):
    img = serializers.SerializerMethodField()
    community_name = serializers.CharField(source='community.name', read_only=True)
    
    class Meta:
        model = Business
        fields = '__all__'
    
    def get_img(self, obj):
        if obj.img:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.img.url)
            return obj.img.url
        return obj.img_url

# Matrimony Profile Serializer
class MatrimonyProfileSerializer(serializers.ModelSerializer):
    photo = serializers.SerializerMethodField()
    community_name = serializers.CharField(source='community.name', read_only=True)
    
    class Meta:
        model = MatrimonyProfile
        fields = '__all__'
    
    def get_photo(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return obj.photo_url

# Campaign Serializer
class CampaignSerializer(serializers.ModelSerializer):
    img = serializers.SerializerMethodField()
    donations_count = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()
    
    class Meta:
        model = Campaign
        fields = '__all__'
    
    def get_img(self, obj):
        if obj.img:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.img.url)
            return obj.img.url
        return obj.img_url
    
    def get_donations_count(self, obj):
        return obj.donations.count()
    
    def get_progress(self, obj):
        if obj.goal > 0:
            return int((obj.raised / obj.goal) * 100)
        return 0

# Donation Serializer
class DonationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Donation
        fields = '__all__'

# News Serializer
class NewsSerializer(serializers.ModelSerializer):
    img = serializers.SerializerMethodField()
    community_name = serializers.CharField(source='community.name', read_only=True)
    
    class Meta:
        model = News
        fields = '__all__'
    
    def get_img(self, obj):
        if obj.img:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.img.url)
            return obj.img.url
        return obj.img_url

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

class CommitteeSerializer(serializers.ModelSerializer):
    photo = serializers.SerializerMethodField()

    class Meta:
        model = Committee
        fields = '__all__'

    def get_photo(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return obj.photo_url

class EventSerializer(serializers.ModelSerializer):
    img = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = '__all__'

    def get_img(self, obj):
        if obj.img:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.img.url)
            return obj.img.url
        return obj.img_url

class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = '__all__'

class BusinessSerializer(serializers.ModelSerializer):
    img = serializers.SerializerMethodField()

    class Meta:
        model = Business
        fields = '__all__'

    def get_img(self, obj):
        if obj.img:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.img.url)
            return obj.img.url
        return obj.img_url

class MatrimonyProfileSerializer(serializers.ModelSerializer):
    photo = serializers.SerializerMethodField()

    class Meta:
        model = MatrimonyProfile
        fields = '__all__'

    def get_photo(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return obj.photo_url

class CampaignSerializer(serializers.ModelSerializer):
    img = serializers.SerializerMethodField()

    class Meta:
        model = Campaign
        fields = '__all__'

    def get_img(self, obj):
        if obj.img:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.img.url)
            return obj.img.url
        return obj.img_url

class DonationSerializer(serializers.ModelSerializer):
    campaign_title = serializers.CharField(source='campaign.title', read_only=True)

    class Meta:
        model = Donation
        fields = '__all__'

class NewsSerializer(serializers.ModelSerializer):
    img = serializers.SerializerMethodField()

    class Meta:
        model = News
        fields = '__all__'

    def get_img(self, obj):
        if obj.img:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.img.url)
            return obj.img.url
        return obj.img_url

class FamilyMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = FamilyMember
        fields = '__all__'

class FamilySerializer(serializers.ModelSerializer):
    members = FamilyMemberSerializer(many=True, read_only=True)

    class Meta:
        model = Family
        fields = '__all__'

class EventRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventRegistration
        fields = '__all__'

class CommunityApprovalHistorySerializer(serializers.ModelSerializer):
    approved_by_username = serializers.CharField(source='approved_by.username', read_only=True)
    
    class Meta:
        model = CommunityApprovalHistory
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
