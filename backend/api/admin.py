from django.contrib import admin
from .models import (
    Community, Member, Committee, Event, Job,
    Business, MatrimonyProfile, Campaign, Donation,
    News, Family, FamilyMember, EventRegistration
)

@admin.register(Community)
class CommunityAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'state', 'plan', 'status')
    list_filter = ('type', 'plan', 'status')
    search_fields = ('name', 'state', 'district')

@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'community', 'role', 'status')
    list_filter = ('role', 'status', 'community')
    search_fields = ('name', 'email', 'phone')

@admin.register(Committee)
class CommitteeAdmin(admin.ModelAdmin):
    list_display = ('name', 'designation', 'community', 'since')
    list_filter = ('community',)
    search_fields = ('name', 'designation')

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'type', 'date', 'venue', 'attendees', 'status')
    list_filter = ('status', 'type', 'community')
    search_fields = ('title', 'venue')

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('role', 'company', 'location', 'type', 'posted_date')
    list_filter = ('type', 'community')
    search_fields = ('role', 'company')

@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'owner', 'location', 'rating', 'verified')
    list_filter = ('verified', 'community')
    search_fields = ('name', 'owner')

@admin.register(MatrimonyProfile)
class MatrimonyProfileAdmin(admin.ModelAdmin):
    list_display = ('name', 'gender', 'age', 'education', 'city', 'status')
    list_filter = ('gender', 'status', 'community')
    search_fields = ('name',)

from .models import MatrimonyPhoto, PartnerPreference, ProfileVisibility, InterestRequest, Wishlist, ProfileView, MatrimonyAuditLog

@admin.register(MatrimonyPhoto)
class MatrimonyPhotoAdmin(admin.ModelAdmin):
    list_display = ('profile', 'category', 'is_private', 'order')
    list_filter = ('category', 'is_private')

@admin.register(PartnerPreference)
class PartnerPreferenceAdmin(admin.ModelAdmin):
    list_display = ('profile', 'gender', 'min_age', 'max_age')

@admin.register(ProfileVisibility)
class ProfileVisibilityAdmin(admin.ModelAdmin):
    list_display = ('user', 'visibility_type')

@admin.register(InterestRequest)
class InterestRequestAdmin(admin.ModelAdmin):
    list_display = ('sender', 'receiver', 'status', 'created_at')
    list_filter = ('status',)

@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ('user', 'profile', 'created_at')

@admin.register(ProfileView)
class ProfileViewAdmin(admin.ModelAdmin):
    list_display = ('viewer', 'profile', 'viewed_at')

@admin.register(MatrimonyAuditLog)
class MatrimonyAuditLogAdmin(admin.ModelAdmin):
    list_display = ('profile', 'action', 'performed_by', 'timestamp')

@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ('title', 'goal', 'raised', 'community')
    list_filter = ('community',)
    search_fields = ('title',)

@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ('donor', 'amount', 'campaign', 'date', 'method', 'status')
    list_filter = ('method', 'status', 'campaign')
    search_fields = ('donor', 'note')

@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'date', 'community')
    list_filter = ('category', 'community')
    search_fields = ('title', 'excerpt')

@admin.register(Family)
class FamilyAdmin(admin.ModelAdmin):
    list_display = ('head', 'village', 'community')
    list_filter = ('community',)
    search_fields = ('head', 'village')

@admin.register(FamilyMember)
class FamilyMemberAdmin(admin.ModelAdmin):
    list_display = ('name', 'relation', 'family', 'age', 'occupation')
    list_filter = ('relation',)
    search_fields = ('name', 'occupation')

@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'event', 'attendees', 'registration_date')
    list_filter = ('event', 'registration_date')
    search_fields = ('name', 'email', 'phone')

from .models import CommunityApprovalHistory, Notification, EmailTemplate, EmailLog

@admin.register(CommunityApprovalHistory)
class CommunityApprovalHistoryAdmin(admin.ModelAdmin):
    list_display = ('community', 'approval_level', 'approved_by', 'approved_date', 'status')
    list_filter = ('approval_level', 'status')
    search_fields = ('community__name', 'approved_by__username')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'title', 'created_at', 'is_read', 'notification_type')
    list_filter = ('is_read', 'notification_type')
    search_fields = ('recipient__username', 'title', 'message')

@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'subject', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('name', 'subject')

@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'subject', 'trigger_event', 'status', 'sent_at')
    list_filter = ('status', 'trigger_event')
    search_fields = ('recipient', 'subject')

from .models import (
    BookingProperty, PropertyResource, ResourcePricing, ResourceLock,
    VenueBooking, BookingInspection, BookingRefund, BookingWaitingList
)

@admin.register(BookingProperty)
class BookingPropertyAdmin(admin.ModelAdmin):
    list_display = ('name', 'community', 'property_type', 'status', 'ownership')
    list_filter = ('status', 'property_type', 'community')
    search_fields = ('name', 'city')

@admin.register(PropertyResource)
class PropertyResourceAdmin(admin.ModelAdmin):
    list_display = ('name', 'property', 'resource_type', 'booking_type', 'status')
    list_filter = ('status', 'booking_type')
    search_fields = ('name',)

@admin.register(ResourcePricing)
class ResourcePricingAdmin(admin.ModelAdmin):
    list_display = ('resource', 'member_type', 'seasonality', 'price')
    list_filter = ('member_type', 'seasonality')

@admin.register(VenueBooking)
class VenueBookingAdmin(admin.ModelAdmin):
    list_display = ('booking_number', 'event_name', 'property', 'member', 'status', 'payment_status', 'start_date')
    list_filter = ('status', 'payment_status')
    search_fields = ('booking_number', 'event_name')

@admin.register(BookingInspection)
class BookingInspectionAdmin(admin.ModelAdmin):
    list_display = ('booking', 'deposit_settlement_status', 'total_additional_charges')
    list_filter = ('deposit_settlement_status',)

@admin.register(BookingRefund)
class BookingRefundAdmin(admin.ModelAdmin):
    list_display = ('booking', 'amount', 'status')
    list_filter = ('status',)

@admin.register(BookingWaitingList)
class BookingWaitingListAdmin(admin.ModelAdmin):
    list_display = ('property', 'member', 'position', 'notified')
    list_filter = ('notified',)
