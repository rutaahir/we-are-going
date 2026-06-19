from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.conf import settings
from django.db.models import Q
from django.http import HttpResponse
from django.utils import timezone
from decimal import Decimal, ROUND_HALF_UP
import datetime
import logging
import random

import json
import os
import threading
import tempfile

class FileOTPStore:
    def __init__(self, filepath=None):
        if filepath is None:
            self.filepath = os.path.join(tempfile.gettempdir(), 'wag_otp_store.json')
        else:
            self.filepath = filepath
        self.lock = threading.Lock()
        # Initialize file if not exists
        if not os.path.exists(self.filepath):
            self.write_store({})

    def read_store(self):
        with self.lock:
            try:
                if os.path.exists(self.filepath):
                    with open(self.filepath, 'r') as f:
                        data = json.load(f)
                        # Convert expiry_time strings back to datetime objects
                        for email, otp_data in data.items():
                            if 'expiry_time' in otp_data and isinstance(otp_data['expiry_time'], str):
                                otp_data['expiry_time'] = datetime.datetime.fromisoformat(otp_data['expiry_time'])
                        return data
            except Exception as e:
                print(f"Error reading OTP store: {e}")
            return {}

    def write_store(self, data):
        with self.lock:
            try:
                # Convert datetime objects to ISO strings for JSON serialization
                serialized = {}
                for email, otp_data in data.items():
                    item = otp_data.copy()
                    if 'expiry_time' in item and isinstance(item['expiry_time'], datetime.datetime):
                        item['expiry_time'] = item['expiry_time'].isoformat()
                    serialized[email] = item
                with open(self.filepath, 'w') as f:
                    json.dump(serialized, f)
            except Exception as e:
                print(f"Error writing OTP store: {e}")

    def get(self, email):
        return self.read_store().get(email)

    def keys(self):
        return self.read_store().keys()

    def __setitem__(self, email, value):
        data = self.read_store()
        data[email] = value
        self.write_store(data)

    def pop(self, email, default=None):
        data = self.read_store()
        val = data.pop(email, default)
        self.write_store(data)
        return val

OTP_STORE = FileOTPStore()

# Print active OTPs on startup
try:
    active_otps = OTP_STORE.read_store()
    now = datetime.datetime.now()
    has_active = False
    for email, otp_data in list(active_otps.items()):
        if otp_data.get('expiry_time') and otp_data['expiry_time'] > now:
            if not has_active:
                import sys
                sys.stderr.write("\n============================================================\n")
                sys.stderr.write("ACTIVE OTP SESSIONS RETRIEVED FROM PERSISTENT STORE:\n")
                has_active = True
            sys.stderr.write(f"- Email: {email} | OTP: {otp_data.get('otp')} | Purpose: {otp_data.get('purpose')} | Expiry: {otp_data.get('expiry_time')}\n")
    if has_active:
        sys.stderr.write("============================================================\n\n")
        sys.stderr.flush()
except Exception as e:
    print(f"Error printing active OTPs on startup: {e}")

from .models import (
    Community, Member, Committee, Event, Job,
    Business, MatrimonyProfile, Campaign, Donation,
    News, Family, FamilyMember, EventRegistration,
    CommunityApprovalHistory, Notification, SubscriptionPlan, Role, Advertisement, Gallery,
    PartnerPreference, ProfileVisibility, InterestRequest, Wishlist, ProfileView,
    CommunityActivityLog, MatrimonyPhoto, MatrimonyAuditLog, JobApplication
)
from .serializers import (
    CommunitySerializer, MemberSerializer, UserSerializer,
    CommitteeSerializer, EventSerializer, JobSerializer,
    BusinessSerializer, MatrimonyProfileSerializer, CampaignSerializer,
    DonationSerializer, NewsSerializer, FamilySerializer, FamilyMemberSerializer,
    EventRegistrationSerializer, CommunityApprovalHistorySerializer, NotificationSerializer,
    SubscriptionPlanSerializer, RoleSerializer, AdvertisementSerializer, GallerySerializer,
    PartnerPreferenceSerializer, ProfileVisibilitySerializer, InterestRequestSerializer,
    WishlistSerializer, ProfileViewSerializer, MatrimonyPhotoSerializer, MatrimonyAuditLogSerializer,
    JobApplicationSerializer
)

BOOKING_ACTIVE_STATUSES = ['Pending Approval', 'Pending Payment', 'Confirmed', 'Checked In', 'Refund Requested']

def _money(value):
    return Decimal(str(value or 0)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

def _booking_window(start_date, end_date, start_time, end_time):
    return (
        datetime.datetime.combine(start_date, start_time),
        datetime.datetime.combine(end_date, end_time),
    )

def _parse_booking_request(data):
    start_date = datetime.datetime.strptime(data.get('start_date'), '%Y-%m-%d').date()
    end_date = datetime.datetime.strptime(data.get('end_date') or data.get('start_date'), '%Y-%m-%d').date()
    start_time = datetime.datetime.strptime((data.get('start_time') or '00:00')[:5], '%H:%M').time()
    end_time = datetime.datetime.strptime((data.get('end_time') or '23:59')[:5], '%H:%M').time()
    if end_date < start_date:
        raise ValueError('End date cannot be before start date.')
    start_dt, end_dt = _booking_window(start_date, end_date, start_time, end_time)
    if end_dt <= start_dt:
        raise ValueError('End time must be after start time.')
    return start_date, end_date, start_time, end_time, start_dt, end_dt

def _minutes_to_label(minutes):
    hours = minutes // 60
    mins = minutes % 60
    suffix = 'AM' if hours < 12 else 'PM'
    display_hour = hours % 12 or 12
    return f'{display_hour}:{mins:02d} {suffix}'

def _format_datetime_range(start_dt, end_dt):
    return f'{start_dt.strftime("%b %d, %I:%M %p")} - {end_dt.strftime("%b %d, %I:%M %p")}'

def _resource_conflicts(resource, start_dt, end_dt, exclude_booking_id=None):
    bookings = VenueBooking.objects.filter(
        resources=resource,
        start_date__lte=end_dt.date(),
        end_date__gte=start_dt.date(),
        status__in=BOOKING_ACTIVE_STATUSES,
    )
    if exclude_booking_id:
        bookings = bookings.exclude(id=exclude_booking_id)

    intervals = []

    for booking in bookings:
        booking_start_dt, booking_end_dt = _booking_window(booking.start_date, booking.end_date, booking.start_time, booking.end_time)
        booking_start_dt -= datetime.timedelta(hours=float(resource.setup_buffer_hours or 0))
        booking_end_dt += datetime.timedelta(hours=float(resource.cleanup_buffer_hours or 0))

        if booking_start_dt < end_dt and booking_end_dt > start_dt:
            overlap_start = max(start_dt, booking_start_dt)
            overlap_end = min(end_dt, booking_end_dt)
            if overlap_start < overlap_end:
                intervals.append({
                    'type': 'booking',
                    'booking_id': booking.id,
                    'booking_number': booking.booking_number,
                    'start': overlap_start.timestamp(),
                    'end': overlap_end.timestamp(),
                    'label': _format_datetime_range(overlap_start, overlap_end),
                })

    req_start_aw = timezone.make_aware(start_dt) if timezone.is_naive(start_dt) else start_dt
    req_end_aw = timezone.make_aware(end_dt) if timezone.is_naive(end_dt) else end_dt
    for lock in ResourceLock.objects.filter(resource=resource, expires_at__gt=timezone.now()):
        if lock.start_time < req_end_aw and lock.end_time > req_start_aw:
            lock_start = timezone.make_naive(lock.start_time) if timezone.is_aware(lock.start_time) else lock.start_time
            lock_end = timezone.make_naive(lock.end_time) if timezone.is_aware(lock.end_time) else lock.end_time
            overlap_start = max(start_dt, lock_start)
            overlap_end = min(end_dt, lock_end)
            if overlap_start < overlap_end:
                intervals.append({
                    'type': 'lock',
                    'start': overlap_start.timestamp(),
                    'end': overlap_end.timestamp(),
                    'label': _format_datetime_range(overlap_start, overlap_end),
                })
    intervals.sort(key=lambda item: item['start'])
    return intervals

def _availability_for_resources(property_obj, resource_ids, start_dt, end_dt, exclude_booking_id=None):
    resources = property_obj.resources.filter(id__in=resource_ids, status='Active')
    requested_ids = {int(rid) for rid in resource_ids}
    found_ids = {res.id for res in resources}
    req_start_ts = start_dt.timestamp()
    req_end_ts = end_dt.timestamp()
    details = []
    all_available = True

    for missing_id in sorted(requested_ids - found_ids):
        all_available = False
        details.append({
            'resource_id': missing_id,
            'resource_name': 'Unknown resource',
            'status': 'unavailable',
            'available': False,
            'conflicts': [{'label': 'Resource is inactive or not part of this property'}],
            'available_slots': [],
            'unavailable_slots': [{'label': _format_datetime_range(start_dt, end_dt)}],
        })

    for res in resources:
        conflicts = _resource_conflicts(res, start_dt, end_dt, exclude_booking_id)
        occupied = []
        for item in conflicts:
            if not occupied or item['start'] > occupied[-1]['end']:
                occupied.append({'start': item['start'], 'end': item['end']})
            else:
                occupied[-1]['end'] = max(occupied[-1]['end'], item['end'])

        available_segments = []
        cursor = req_start_ts
        for block in occupied:
            if cursor < block['start']:
                s_dt = datetime.datetime.fromtimestamp(cursor)
                e_dt = datetime.datetime.fromtimestamp(block['start'])
                available_segments.append({'start': cursor, 'end': block['start'], 'label': _format_datetime_range(s_dt, e_dt)})
            cursor = max(cursor, block['end'])
        if cursor < req_end_ts:
            s_dt = datetime.datetime.fromtimestamp(cursor)
            e_dt = datetime.datetime.fromtimestamp(req_end_ts)
            available_segments.append({'start': cursor, 'end': req_end_ts, 'label': _format_datetime_range(s_dt, e_dt)})

        if not occupied:
            resource_status = 'available'
        elif available_segments:
            resource_status = 'partial'
            all_available = False
        else:
            resource_status = 'unavailable'
            all_available = False

        details.append({
            'resource_id': res.id,
            'resource_name': res.name,
            'resource_type': res.resource_type,
            'status': resource_status,
            'available': resource_status == 'available',
            'conflicts': conflicts,
            'available_slots': available_segments,
            'unavailable_slots': [{**block, 'label': _format_datetime_range(datetime.datetime.fromtimestamp(block['start']), datetime.datetime.fromtimestamp(block['end']))} for block in occupied],
        })
    return all_available, details

def _calculate_booking_price(resources, start_dt, end_dt, extra_charges=0):
    hours = Decimal(str((end_dt - start_dt).total_seconds() / 3600))
    days = Decimal(str(max(1, (end_dt.date() - start_dt.date()).days + 1)))
    resource_lines = []
    subtotal = Decimal('0.00')
    deposit = Decimal('0.00')

    for res in resources:
        hourly = _money(res.hourly_rate)
        half_day = _money(res.half_day_rate)
        full_day = _money(res.full_day_rate)
        if hours <= Decimal('4') and hourly > 0:
            amount = hourly * hours
            rate_label = 'Hourly'
        elif hours <= Decimal('6') and half_day > 0:
            amount = half_day
            rate_label = 'Half Day'
        elif full_day > 0:
            amount = full_day * days
            rate_label = 'Full Day'
        elif hourly > 0:
            amount = hourly * hours
            rate_label = 'Hourly'
        else:
            amount = Decimal('0.00')
            rate_label = 'No Rate'

        amount = amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        subtotal += amount
        deposit += _money(res.security_deposit)
        resource_lines.append({
            'resource_id': res.id,
            'resource_name': res.name,
            'resource_type': res.resource_type,
            'rate_type': rate_label,
            'duration_hours': float(hours),
            'amount': float(amount),
            'deposit': float(_money(res.security_deposit)),
        })

    extra = _money(extra_charges)
    taxable = subtotal + extra
    tax = (taxable * Decimal('0.18')).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    total = taxable + tax + deposit
    return {
        'resources': resource_lines,
        'duration_hours': float(hours),
        'subtotal': float(subtotal),
        'extra_charges': float(extra),
        'deposit': float(deposit),
        'tax': float(tax),
        'grand_total': float(total),
    }

def _notify_user(user, title, message, notification_type='booking'):
    if user:
        Notification.objects.create(recipient=user, title=title, message=message, notification_type=notification_type)

# ========================
# Authentication Views
# ========================

def enforce_community_isolation(request, queryset, community_field='community_id'):
    """Ensures community admins can only access their own community's data."""
    user = request.user
    if user.is_authenticated and not user.is_superuser:
        try:
            member = user.member_profile
            if member.role == 'community_admin' and member.community_id:
                return queryset.filter(**{community_field: member.community_id})
        except Exception:
            pass
    return queryset

def filter_by_community(queryset, community_id, community_field='community_id'):
    if not community_id:
        return queryset
    if ',' in str(community_id):
        try:
            ids = [int(x.strip()) for x in str(community_id).split(',') if x.strip().isdigit()]
            if ids:
                return queryset.filter(**{f"{community_field}__in": ids})
        except Exception:
            pass
    return queryset.filter(**{community_field: community_id})

class HasCustomRolePermission(permissions.BasePermission):
    """
    Checks if a committee member with a custom role has the required permissions for the endpoint.
    """
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return True # Let other permission classes handle anonymous/unauthenticated checks

        if user.is_superuser:
            return True

        try:
            member = user.member_profile
        except Exception:
            # User has no member profile, could be staff
            return user.is_staff

        if member.role == 'super_admin':
            return True

        if member.role == 'community_admin' and not member.custom_role:
            return True

        # If they are a committee member (role = community_admin and custom_role is set)
        if member.role == 'community_admin' and member.custom_role:
            role_perms = member.custom_role.permissions if isinstance(member.custom_role.permissions, list) else []
            member_perms = member.permissions if isinstance(member.permissions, list) else []
            permissions_list = list(set(role_perms) & set(member_perms))
            view_name = view.__class__.__name__

            def has(perm):
                return perm in permissions_list

            method = request.method
            action = getattr(view, 'action', None)

            # --- Member Management ---
            if view_name == 'MemberViewSet':
                if method in ['GET', 'HEAD', 'OPTIONS']: return has('View Members')
                if method == 'POST': return has('Add Members')
                if method in ['PUT', 'PATCH']: 
                    if action in ['approve', 'reject']: return has('Approve Members')
                    return has('Edit Members')
                if method == 'DELETE': return has('Delete Members')

            # --- Committee Management ---
            elif view_name == 'CommitteeViewSet':
                if method in ['GET', 'HEAD', 'OPTIONS']: return has('View Committee')
                if method == 'POST': return has('Add Committee Members')
                if method in ['PUT', 'PATCH']: return has('Edit Committee Members')
                if method == 'DELETE': return has('Remove Committee Members')

            # --- Family Management ---
            elif view_name == 'FamilyViewSet' or view_name == 'FamilyMemberViewSet':
                if method in ['GET', 'HEAD', 'OPTIONS']: return has('View Families')
                if method == 'POST': return has('Add Families')
                if method in ['PUT', 'PATCH']: return has('Edit Families')
                if method == 'DELETE': return has('Delete Families')

            # --- Event Management ---
            elif view_name == 'EventViewSet':
                if method in ['GET', 'HEAD', 'OPTIONS']: return has('View Events')
                if method == 'POST': return has('Create Events')
                if method in ['PUT', 'PATCH']: return has('Edit Events')
                if method == 'DELETE': return has('Delete Events')

            # --- News Management ---
            elif view_name == 'NewsViewSet':
                if method in ['GET', 'HEAD', 'OPTIONS']: return has('View News')
                if method == 'POST': return has('Create News')
                if method in ['PUT', 'PATCH']: return has('Edit News')
                if method == 'DELETE': return has('Delete News')

            # --- Gallery Management ---
            elif view_name == 'GalleryViewSet':
                if method in ['GET', 'HEAD', 'OPTIONS']: return has('View Gallery')
                if method == 'POST': return has('Upload Photos')
                if method in ['PUT', 'PATCH']: return has('Edit Photos')
                if method == 'DELETE': return has('Delete Photos')

            # --- Donation Management ---
            elif view_name == 'DonationViewSet' or view_name == 'FundraisingCampaignViewSet':
                if method in ['GET', 'HEAD', 'OPTIONS']: return has('View Donations')
                return has('Manage Donations')

            # --- Jobs Management ---
            elif view_name == 'JobViewSet':
                if method in ['GET', 'HEAD', 'OPTIONS']: return has('View Jobs')
                if method == 'POST': return has('Create Jobs')
                if method in ['PUT', 'PATCH']: return has('Edit Jobs')
                if method == 'DELETE': return has('Delete Jobs')

            # --- Business Management ---
            elif view_name == 'BusinessViewSet':
                if method in ['GET', 'HEAD', 'OPTIONS']: return has('View Businesses')
                if method == 'POST': return has('Add Businesses')
                if method in ['PUT', 'PATCH']: return has('Edit Businesses')
                if method == 'DELETE': return has('Delete Businesses')

            # --- Matrimony Management ---
            elif view_name == 'MatrimonyProfileViewSet':
                if method in ['GET', 'HEAD', 'OPTIONS']: return has('View Profiles')
                if method in ['PUT', 'PATCH']:
                    # We allow PATCH if they have any of these permissions
                    return has('Approve Profiles') or has('Edit Profiles') or has('Manage Interests') or has('Manage Matches')
                if method == 'DELETE': return has('Approve Profiles') # Fallback for deleting

            # --- Community Management ---
            elif view_name == 'CommunityViewSet':
                if method in ['GET', 'HEAD', 'OPTIONS']: return has('View Hierarchy') or has('Manage Community Information')
                if method in ['PUT', 'PATCH']: return has('Edit Community Profile') or has('Manage Logo') or has('Manage Banner')
                if method == 'POST': return has('Manage Subsidiaries')
                if method == 'DELETE': return has('Manage Subsidiaries')

            # --- Super Admin specific fallbacks ---
            elif view_name == 'RoleViewSet':
                if method in ['GET', 'HEAD']: return True
                return False # Super admin only
            elif view_name == 'AdvertisementViewSet':
                if method in ['GET', 'HEAD']: return True
                return False # Super admin only
            elif view_name == 'SubscriptionPlanViewSet':
                if method in ['GET', 'HEAD']: return True
                return False # Super admin only
            
            return False

        return True

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = attrs.get(self.username_field)
        password = attrs.get("password")
        try:
            # Try to resolve user by username, email, or member phone
            user = None
            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                try:
                    user = User.objects.get(email=username)
                except User.DoesNotExist:
                    try:
                        member = Member.objects.get(phone=username)
                        user = member.user
                    except Member.DoesNotExist:
                        pass
            
            if user:
                # Update attrs username with the actual username so super().validate(attrs) works
                attrs[self.username_field] = user.username
                
                if user.check_password(password):
                    try:
                        member = user.member_profile
                        if not member.email_verified:
                            from rest_framework import serializers
                            raise serializers.ValidationError({
                                "detail": "Please verify your email before logging in."
                            })
                        if member.role == 'member':
                            # First check Aadhaar status
                            if member.aadhaar_status == 'Rejected':
                                from rest_framework import serializers
                                raise serializers.ValidationError({
                                    "detail": "Your login request was rejected due to an invalid Aadhaar number."
                                })
                            elif member.aadhaar_status == 'Pending':
                                from rest_framework import serializers
                                raise serializers.ValidationError({
                                    "detail": "Your Aadhaar verification is pending approval. You can login only after the community admin verifies your Aadhaar number."
                                })
                            # Then check general profile status
                            elif member.status not in ['Verified', 'Active']:
                                from rest_framework import serializers
                                raise serializers.ValidationError({
                                    "detail": "Your member profile is pending approval. You can login only after the community admin approves your request."
                                })
                        elif member.role == 'community_admin':
                            community = member.community
                            if community and community.status in [
                                'Pending Super Admin Approval',
                                'Pending Parent Community Approval',
                                'Rejected By Super Admin',
                                'Rejected By Parent Community Admin',
                                'Pending',
                                'Inactive'
                            ]:
                                from rest_framework import serializers
                                raise serializers.ValidationError({
                                    "detail": "Your community registration is under review. Access will be granted after all approval stages are completed."
                                })
                    except Member.DoesNotExist:
                        pass
        except serializers.ValidationError:
            raise
        except Exception:
            pass

        data = super().validate(attrs)
        
        # Check first successful login for community admins
        try:
            member = Member.objects.get(user=self.user)
            if member.role == 'community_admin' and self.user.last_login is None:
                from .emails import send_project_email
                send_project_email(
                    recipient=self.user.email,
                    template_name='first_successful_login',
                    context={'community_name': member.community.name if member.community else 'N/A'},
                    trigger_event='First Successful Login'
                )
        except Exception:
            pass

        user_serializer = UserSerializer(self.user, context={'request': self.context.get('request')})
        
        # Add member profile info
        try:
            member = Member.objects.get(user=self.user)
            logo_url = None
            cover_url = None
            if member.community:
                if member.community.logo:
                    logo_url = member.community.logo.url
                elif member.community.logo_url:
                    logo_url = member.community.logo_url
                if member.community.cover:
                    cover_url = member.community.cover.url
                elif member.community.cover_url:
                    cover_url = member.community.cover_url
            
            permissions_list = member.permissions or []
            if member.custom_role:
                role_perms = member.custom_role.permissions if isinstance(member.custom_role.permissions, list) else []
                member_perms = member.permissions if isinstance(member.permissions, list) else []
                permissions_list = list(set(role_perms) & set(member_perms))
            
            data['member'] = {
                'id': member.id,
                'name': member.name,
                'role': member.role,
                'custom_role_name': member.custom_role.name if member.custom_role else None,
                'permissions': permissions_list,
                'community_id': member.community.id if member.community else None,
                'community_name': member.community.name if member.community else None,
                'community_logo': logo_url,
                'community_cover': cover_url,
                'community_type': member.community.type if member.community else None,
                'parent_community_name': (member.community.parent.name if member.community and member.community.parent else None),
                'parent_community_type': (member.community.parent.type if member.community and member.community.parent else None),
                'parent_community_id': (member.community.parent.id if member.community and member.community.parent else None),
                'status': member.status
            }
        except Member.DoesNotExist:
            if self.user.is_superuser:
                data['member'] = {
                    'id': 'superadmin',
                    'name': self.user.get_full_name() or 'Super Admin',
                    'role': 'super_admin',
                    'community_id': None,
                    'status': 'Verified'
                }
            else:
                data['member'] = None
            
        data['user'] = user_serializer.data
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            password = request.data.get('password')
            if not password:
                return Response({"password": ["This field is required."]}, status=status.HTTP_400_BAD_REQUEST)
            
            user = serializer.save()
            user.set_password(password)
            user.save()
            
            community_id = request.data.get('communityId')
            community = None
            if community_id:
                try:
                    community = Community.objects.get(id=community_id)
                except (Community.DoesNotExist, ValueError):
                    pass
            
            if not community:
                community = Community.objects.first()
                if not community:
                    community = Community.objects.create(
                        name="Rampara Ahir Samaj",
                        type="Subsidiary",
                        state="Gujarat",
                        district="Amreli",
                        taluka="Rajula",
                        village="Rampara",
                        plan="Pro",
                        status="Active",
                        gradient="from-blue-600 to-indigo-700"
                    )
            
            name = request.data.get('name', user.username)
            role = request.data.get('role', 'member')
            aadhaar = request.data.get('aadhaar', '')
            
            avatar = request.FILES.get('avatar')
            aadhaar_photo = request.FILES.get('aadhaar_photo')
            
            member = Member.objects.create(
                user=user,
                name=name,
                email=user.email or f"{user.username}@example.com",
                phone=request.data.get('phone', '+91 9999999999'),
                avatar=avatar,
                aadhaar_photo=aadhaar_photo,
                age=request.data.get('age'),
                gender=request.data.get('gender', 'Male'),
                state=request.data.get('state', 'Gujarat'),
                district=request.data.get('district', 'Amreli'),
                taluka=request.data.get('taluka', 'Rajula'),
                village=request.data.get('village', 'Rampara'),
                profession=request.data.get('profession', 'Software Engineer'),
                education=request.data.get('education', 'B.Tech'),
                school=request.data.get('school'),
                college=request.data.get('college'),
                degree=request.data.get('degree'),
                field_of_study=request.data.get('fieldOfStudy'),
                passing_year=request.data.get('passingYear'),
                profession_type=request.data.get('professionType'),
                job_title=request.data.get('jobTitle'),
                company=request.data.get('company'),
                industry=request.data.get('industry'),
                salary=request.data.get('salary'),
                business_name=request.data.get('businessName'),
                business_category=request.data.get('businessCategory'),
                gst_no=request.data.get('gstNo'),
                business_years=request.data.get('businessYears'),
                community=community,
                role=role,
                status='Verified' if role in ['community_admin', 'super_admin'] else 'Pending',
                email_verified=False,
                aadhaar=aadhaar,
                aadhaar_status='Pending'
            )
            
            # If profession is Business, also create a Business object
            if request.data.get('professionType') == 'Business':
                from django.core.files.storage import default_storage
                import json
                import uuid
                
                # Parse hours
                hours_raw = request.data.get('businessHours')
                hours_dict = {}
                if hours_raw:
                    try:
                        hours_dict = json.loads(hours_raw) if isinstance(hours_raw, str) else hours_raw
                    except Exception:
                        pass
                
                # Socials
                socials_dict = {
                    'instagram': request.data.get('businessInstagram', ''),
                    'facebook': request.data.get('businessFacebook', ''),
                    'youtube': request.data.get('businessYoutube', ''),
                    'linkedin': request.data.get('businessLinkedin', '')
                }
                
                # Process Business Gallery Uploads
                gallery_urls = []
                for key in request.FILES:
                    if key.startswith('business_gallery_'):
                        file = request.FILES[key]
                        ext = os.path.splitext(file.name)[1]
                        filename = f"businesses/gallery/{uuid.uuid4()}{ext}"
                        saved_path = default_storage.save(filename, file)
                        url_path = default_storage.url(saved_path)
                        gallery_urls.append(url_path)
                
                # Create Business Object
                Business.objects.create(
                    name=request.data.get('businessName', 'My Business'),
                    category=request.data.get('businessCategory', 'Other'),
                    owner=name,
                    location=request.data.get('businessAddress', request.data.get('village', '')),
                    phone=request.data.get('businessPhone', request.data.get('phone', '')),
                    whatsapp=request.data.get('businessWhatsapp', ''),
                    email=request.data.get('businessEmail', ''),
                    website=request.data.get('businessWebsite', ''),
                    desc=request.data.get('businessDesc', ''),
                    address=request.data.get('businessAddress', ''),
                    city=request.data.get('businessCity', ''),
                    state=request.data.get('businessState', ''),
                    pincode=request.data.get('businessPincode', ''),
                    gst_no=request.data.get('gstNo', ''),
                    business_years=request.data.get('businessYears', ''),
                    hours=hours_dict,
                    socials=socials_dict,
                    gallery=gallery_urls,
                    img=request.FILES.get('business_logo'),
                    community=community,
                    status='PENDING'
                )
            
            # Generate and send registration OTP
            otp_code = str(random.randint(100000, 999999))
            expiry_time = datetime.datetime.now() + datetime.timedelta(minutes=10)
            OTP_STORE[user.email.strip().lower()] = {
                'otp': otp_code,
                'expiry_time': expiry_time,
                'attempt_count': 0,
                'purpose': 'register'
            }
            import sys
            sys.stderr.write(f"\n============================================================\n[REGISTRATION OTP] Email: {user.email} | OTP: {otp_code} | Expiry: {expiry_time}\n============================================================\n")
            sys.stderr.flush()
            from .emails import send_project_email
            try:
                send_project_email(
                    recipient=user.email,
                    template_name='forgot_password_otp',
                    context={'otp_code': otp_code},
                    trigger_event='Registration OTP'
                )
            except Exception as e:
                print(f"Failed to send registration email: {e}")
            
            user_data = UserSerializer(user, context={'request': request}).data
            return Response(user_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user, context={'request': request})
        try:
            member = Member.objects.get(user=request.user)
            member_data = MemberSerializer(member, context={'request': request}).data
            # Enrich with full community context
            if member.community:
                c = member.community
                import time
                t = int(time.time())
                logo_url = None
                cover_url = None
                if c.logo:
                    logo_url = f"{request.build_absolute_uri(c.logo.url)}?t={t}"
                elif c.logo_url:
                    logo_url = f"{c.logo_url}?t={t}" if "?" in c.logo_url else f"{c.logo_url}?t={t}"
                if c.cover:
                    cover_url = f"{request.build_absolute_uri(c.cover.url)}?t={t}"
                elif c.cover_url:
                    cover_url = f"{c.cover_url}?t={t}" if "?" in c.cover_url else f"{c.cover_url}?t={t}"
                member_data['community_name'] = c.name
                member_data['community_logo'] = logo_url
                member_data['community_cover'] = cover_url
                member_data['community_type'] = c.type
                member_data['community_id'] = c.id
                member_data['parent_community_name'] = c.parent.name if c.parent else None
                member_data['parent_community_type'] = c.parent.type if c.parent else None
                member_data['parent_community_id'] = c.parent.id if c.parent else None
        except Member.DoesNotExist:
            member_data = None
            
        data = serializer.data
        data['member'] = member_data
        return Response(data)

# ========================
# ViewSets
# ========================

class CommunityViewSet(viewsets.ModelViewSet):
    serializer_class = CommunitySerializer
    permission_classes = [permissions.AllowAny, HasCustomRolePermission]
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        print(f"\n[COMMUNITY IMAGE LOAD]")
        print(f"Community ID: {instance.id}")
        logo_url = instance.logo.url if instance.logo else instance.logo_url
        cover_url = instance.cover.url if instance.cover else instance.cover_url
        print(f"Logo URL: {logo_url if logo_url else 'None'}")
        print(f"Banner URL: {cover_url if cover_url else 'None'}\n")
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def hierarchy(self, request):
        """Return unlimited-depth community tree."""
        state = request.query_params.get('state')
        district = request.query_params.get('district')
        search = request.query_params.get('search')

        def get_community_stats(community):
            from django.db.models import Sum
            members = Member.objects.filter(community=community)
            total_members = members.count()
            male_members = members.filter(gender='Male').count()
            female_members = members.filter(gender='Female').count()
            active_events = Event.objects.filter(community=community).count()
            matrimony_profiles = MatrimonyProfile.objects.filter(community=community).count()
            jobs_posted = Job.objects.filter(community=community).count()
            donations = Donation.objects.filter(campaign__community=community)
            donations_sum = donations.aggregate(Sum('amount'))['amount__sum'] or 0
            total_subs = community.subsidiaries.count()
            return {
                'total_members': total_members,
                'male_members': male_members,
                'female_members': female_members,
                'active_events': active_events,
                'matrimony_profiles': matrimony_profiles,
                'jobs_posted': jobs_posted,
                'donations_sum': donations_sum,
                'total_subsidiaries': total_subs,
            }

        def build_tree(community, current_level=1):
            """Recursively build unlimited-depth tree."""
            children = []
            for child in community.subsidiaries.filter(deleted_at__isnull=True):
                children.append(build_tree(child, current_level + 1))

            logo_url = None
            if community.logo:
                logo_url = request.build_absolute_uri(community.logo.url)
            elif community.logo_url:
                logo_url = community.logo_url

            admin_member = Member.objects.filter(community=community, role='community_admin').first()
            return {
                'id': community.id,
                'name': community.name,
                'type': community.type,
                'status': community.status,
                'state': community.state,
                'district': community.district,
                'logo_url': logo_url,
                'level': current_level,
                'path': community.path,
                'parent_id': community.parent_id,
                'parent_name': community.parent.name if community.parent else None,
                'admin_name': admin_member.name if admin_member else 'N/A',
                'stats': get_community_stats(community),
                'children': children,
                'children_count': len(children),
            }

        user = request.user
        is_super_admin = user.is_superuser
        member = None
        try:
            member = user.member_profile
            if member.role == 'super_admin':
                is_super_admin = True
        except Exception:
            pass

        if is_super_admin:
            roots = Community.objects.filter(parent__isnull=True)
        else:
            if member and member.community:
                # Show from the community's own root upward
                root_community = member.community
                while root_community.parent:
                    root_community = root_community.parent
                roots = Community.objects.filter(id=root_community.id)
            else:
                roots = Community.objects.none()
                
        if state:
            roots = roots.filter(state__icontains=state)
        if district:
            roots = roots.filter(district__icontains=district)
        if search:
            # For search, return flat matching list
            matches = Community.objects.filter(name__icontains=search)
            return Response([build_tree(c, c.level) for c in matches])

        data = [build_tree(root, 1) for root in roots]
        return Response(data)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def ancestors(self, request, pk=None):
        """Return ancestor chain from root to this community."""
        community = self.get_object()
        result = []
        node = community.parent
        while node:
            logo_url = None
            if node.logo:
                logo_url = request.build_absolute_uri(node.logo.url)
            elif node.logo_url:
                logo_url = node.logo_url
            result.append({
                'id': node.id,
                'name': node.name,
                'type': node.type,
                'status': node.status,
                'logo_url': logo_url,
                'level': node.level,
                'children_count': node.subsidiaries.count(),
            })
            node = node.parent
        return Response(list(reversed(result)))

    def get_queryset(self):
        queryset = Community.objects.all().order_by('name')
        
        status_param = self.request.query_params.get('status')
        type_param = self.request.query_params.get('type')
        
        if status_param:
            queryset = queryset.filter(status=status_param)
        if type_param:
            if type_param in ['Super', 'Super Community']:
                queryset = queryset.filter(type__in=['Super', 'Super Community'])
            elif type_param in ['Subsidiary', 'Subsidiary Community']:
                queryset = queryset.filter(type__in=['Subsidiary', 'Subsidiary Community'])
            else:
                queryset = queryset.filter(type=type_param)
                
        return queryset

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        user = request.user
        is_super = user.is_superuser
        try:
            if user.member_profile.role == 'super_admin':
                is_super = True
        except Exception:
            pass
            
        if not is_super:
            return Response({"detail": "Only platform super admins can delete communities."}, status=403)
            
        from django.utils import timezone
        instance.deleted_at = timezone.now()
        instance.status = 'Inactive'
        instance.save()
        
        # Deactivate all users of this community
        from django.contrib.auth.models import User
        from api.models import Member
        user_ids = Member.objects.filter(community=instance).values_list('user_id', flat=True)
        User.objects.filter(id__in=user_ids).update(is_active=False)
        
        return Response({"detail": "Community successfully deleted."}, status=204)

    def create(self, request, *args, **kwargs):
        data = request.data.copy()

        # Extract admin fields before passing to serializer
        admin_name = data.pop('admin_name', None)
        admin_email = data.pop('admin_email', None)
        admin_phone = data.pop('admin_phone', None)
        admin_password = data.pop('admin_password', None)

        # Handle MultiValueDict from FormData — extract single values
        if isinstance(admin_name, list): admin_name = admin_name[0] if admin_name else None
        if isinstance(admin_email, list): admin_email = admin_email[0] if admin_email else None
        if isinstance(admin_phone, list): admin_phone = admin_phone[0] if admin_phone else None
        if isinstance(admin_password, list): admin_password = admin_password[0] if admin_password else None

        # Derive type from parent field — parent presence is the source of truth
        parent_val = data.get('parent')
        if isinstance(parent_val, list): parent_val = parent_val[0] if parent_val else None
        if parent_val and str(parent_val).strip():
            data['type'] = 'Subsidiary'
        else:
            data['type'] = 'Super'
            data['parent'] = None

        data['status'] = 'Pending Super Admin Approval'

        # Ensure optional text fields are stored as None/NULL if empty
        optional_fields = [
            'caste', 'sub_caste', 'email', 'phone', 'est_year',
            'registration_no', 'office_address', 'website',
            'vision_mission', 'social_fb', 'social_tw', 'social_yt', 'doc_name',
            'logo_url', 'cover_url'
        ]
        for field in optional_fields:
            val = data.get(field)
            if isinstance(val, list): val = val[0] if val else None
            data[field] = val if val not in ("", None) else None

        # Serialize and validate text fields only (files handled separately below)
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        community = serializer.save()

        # Save uploaded image files directly to the model after initial save
        # This is the reliable pattern for multipart ImageField uploads in DRF
        needs_save = False
        if 'logo' in request.FILES:
            community.logo = request.FILES['logo']
            community.logo_url = community.logo.url
            needs_save = True
        if 'cover' in request.FILES:
            community.cover = request.FILES['cover']
            community.cover_url = community.cover.url
            needs_save = True
        if needs_save:
            community.save(update_fields=[f for f in ['logo', 'cover', 'logo_url', 'cover_url'] if f in request.FILES or f in ['logo_url', 'cover_url']])
            
        print("\n[UPLOAD SUCCESS]")
        print(f"Community: {community.name}")
        print(f"Logo: {community.logo.path if community.logo else 'None'}")
        print(f"Cover: {community.cover.path if community.cover else 'None'}\n")
        
        if admin_email and admin_password:
            user, created = User.objects.get_or_create(
                username=admin_email,
                defaults={
                    'email': admin_email,
                    'is_active': True
                }
            )
            # Always update or set password to ensure it matches the registration form
            user.set_password(admin_password)
            user.is_active = True
            user.save()
                
            member, member_created = Member.objects.get_or_create(
                user=user,
                defaults={
                    'name': admin_name or admin_email.split('@')[0],
                    'email': admin_email,
                    'phone': admin_phone or '',
                    'community': community,
                    'role': 'community_admin',
                    'status': 'Pending',
                    'email_verified': False,
                    'profession': 'Community Administrator',
                    'education': 'N/A',
                    'gender': 'Other'
                }
            )
            if not member_created:
                member.community = community
                member.role = 'community_admin'
                member.status = 'Pending'
                member.email_verified = False
                if admin_name:
                    member.name = admin_name
                if admin_phone:
                    member.phone = admin_phone
                member.save()

            # Generate and send registration OTP
            otp_code = str(random.randint(100000, 999999))
            expiry_time = datetime.datetime.now() + datetime.timedelta(minutes=10)
            OTP_STORE[admin_email.strip().lower()] = {
                'otp': otp_code,
                'expiry_time': expiry_time,
                'attempt_count': 0,
                'purpose': 'register'
            }
            import sys
            sys.stderr.write(f"\n============================================================\n[REGISTRATION OTP] Email: {admin_email} | OTP: {otp_code} | Expiry: {expiry_time}\n============================================================\n")
            sys.stderr.flush()
            from .emails import send_project_email
            try:
                send_project_email(
                    recipient=admin_email,
                    template_name='forgot_password_otp',
                    context={'otp_code': otp_code},
                    trigger_event='Registration OTP'
                )
            except Exception as e:
                print(f"Failed to send registration email: {e}")

        CommunityApprovalHistory.objects.create(
            community=community,
            approval_level="Submission",
            status="Pending Super Admin Approval",
            remarks="Community registration submitted."
        )

        from .emails import send_project_email
        import datetime
        reg_date_str = datetime.date.today().strftime('%Y-%m-%d')

        # Send email to Community Admin
        if admin_email:
            send_project_email(
                recipient=admin_email,
                template_name='community_registration_submitted',
                context={
                    'community_name': community.name,
                    'community_type': community.type
                },
                trigger_event='Community Registration Submitted'
            )

        superadmins = User.objects.filter(is_superuser=True)
        for sa in superadmins:
            Notification.objects.create(
                recipient=sa,
                title="New Community Registration",
                message=f"A new community '{community.name}' has been submitted for approval.",
                notification_type="community_registration"
            )
            # Send email to Super Admin
            if sa.email:
                send_project_email(
                    recipient=sa.email,
                    template_name='super_admin_new_approval_request',
                    context={
                        'community_name': community.name,
                        'community_type': community.type,
                        'registration_date': reg_date_str,
                        'admin_name': admin_name or admin_email.split('@')[0],
                        'admin_email': admin_email or ''
                    },
                    trigger_event='New Community Approval Request'
                )

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Check permissions
        user = request.user
        if not user.is_authenticated:
            return Response({'detail': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
            
        is_authorized = user.is_superuser
        if not is_authorized:
            try:
                member = user.member_profile
                if member.role == 'super_admin' or (member.role == 'community_admin' and member.community_id == instance.id):
                    is_authorized = True
            except Exception:
                pass
                
        if not is_authorized:
            return Response({'detail': 'You do not have permission to edit this community.'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data.copy()
        
        optional_fields = [
            'name', 'desc', 'vision_mission', 'office_address', 'website', 
            'email', 'phone', 'social_fb', 'social_tw', 'social_yt',
            'caste', 'sub_caste', 'est_year', 'registration_no',
            'state', 'district', 'taluka', 'village'
        ]
        
        changed_fields = []
        for field in optional_fields:
            if field in data:
                val = data.get(field)
                if isinstance(val, list): val = val[0] if val else None
                if val == "": val = None
                
                old_val = getattr(instance, field)
                if str(old_val or '') != str(val or ''):
                    changed_fields.append(field)
                
                data[field] = val

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        needs_save = False
        if 'logo' in request.FILES:
            instance.logo = request.FILES['logo']
            if 'logo' not in changed_fields: changed_fields.append('logo')
            needs_save = True
        if 'cover' in request.FILES:
            instance.cover = request.FILES['cover']
            if 'cover' not in changed_fields: changed_fields.append('cover')
            needs_save = True
            
        if needs_save:
            instance.save(update_fields=[f for f in ['logo', 'cover'] if f in request.FILES])
            if 'logo' in request.FILES:
                instance.logo_url = request.build_absolute_uri(instance.logo.url)
            if 'cover' in request.FILES:
                instance.cover_url = request.build_absolute_uri(instance.cover.url)
            instance.save(update_fields=['logo_url', 'cover_url'])
            
        logo_url = instance.logo_url if instance.logo else instance.logo_url
        cover_url = request.build_absolute_uri(instance.cover.url) if instance.cover else instance.cover_url
        print(f"\n[COMMUNITY UPDATE REQUEST]\nCommunity ID: {instance.id}\n")
        print(f"[DATABASE UPDATED]\nlogo_url={logo_url}\ncover_url={cover_url}\n")
            
        if changed_fields:
            CommunityActivityLog.objects.create(
                community=instance,
                updated_by=request.user if request.user.is_authenticated else None,
                changed_fields=changed_fields
            )
            
        fresh_serializer = self.get_serializer(instance)
        return Response(fresh_serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        community = self.get_object()
        user = request.user
        
        is_super_admin = user.is_superuser
        try:
            member = user.member_profile
            if member.role == 'super_admin':
                is_super_admin = True
        except Member.DoesNotExist:
            member = None
            
        remarks = request.data.get('remarks', 'Approved.')

        community_admins = Member.objects.filter(community=community, role='community_admin')

        # STEP 1: Super Admin initial approval — move to parent's pending queue
        if community.status == 'Pending Super Admin Approval':
            if not is_super_admin:
                return Response({'detail': 'Only Super Admins can perform the initial approval.'}, status=status.HTTP_403_FORBIDDEN)

            if community.parent:
                # Has a parent — needs parent's approval next
                community.status = 'Pending Parent Community Approval'
                community.save()

                CommunityApprovalHistory.objects.create(
                    community=community,
                    approval_level="Super Admin",
                    approved_by=user,
                    status="Pending Parent Community Approval",
                    remarks=remarks
                )

                for admin_member in community_admins:
                    if admin_member.user:
                        Notification.objects.create(
                            recipient=admin_member.user,
                            title="Super Admin Approved",
                            message=f"Your community '{community.name}' was approved by the Super Admin. Pending approval from parent community '{community.parent.name}'.",
                            notification_type="approval"
                        )

                parent_admins = Member.objects.filter(community=community.parent, role='community_admin')
                import datetime
                reg_date_str = datetime.date.today().strftime('%Y-%m-%d')
                for pa in parent_admins:
                    if pa.user:
                        Notification.objects.create(
                            recipient=pa.user,
                            title="New Community Approval Required",
                            message=f"Community '{community.name}' is requesting to join under your community. Please review.",
                            notification_type="community_registration"
                        )
                        if pa.user.email:
                            from .emails import send_project_email
                            sub_admin = community_admins.first()
                            send_project_email(
                                recipient=pa.user.email,
                                template_name='parent_community_approval_request',
                                context={
                                    'community_name': community.name,
                                    'admin_name': sub_admin.name if sub_admin else 'Community Admin',
                                    'admin_email': sub_admin.email if sub_admin else '',
                                    'registration_date': reg_date_str
                                },
                                trigger_event='Parent Community Approval Request'
                            )

                return Response({'status': 'pending_parent_approval', 'detail': f"Approved by Super Admin. Forwarded to parent community '{community.parent.name}' for final approval."})
            else:
                # Root community — just approve it
                community.status = 'Approved'
                community.save()

                for admin_member in community_admins:
                    if admin_member.user:
                        admin_member.user.is_active = True
                        admin_member.user.save()
                    admin_member.status = 'Active'
                    admin_member.save()
                    if admin_member.user:
                        Notification.objects.create(
                            recipient=admin_member.user,
                            title="Community Approved",
                            message=f"Congratulations! Your root community '{community.name}' has been approved.",
                            notification_type="approval"
                        )
                        if admin_member.user.email:
                            from .emails import send_project_email
                            send_project_email(
                                recipient=admin_member.user.email,
                                template_name='super_community_approved',
                                context={'community_name': community.name},
                                trigger_event='Root Community Approved'
                            )

                CommunityApprovalHistory.objects.create(
                    community=community,
                    approval_level="Super Admin",
                    approved_by=user,
                    status="Approved",
                    remarks=remarks
                )
                return Response({'status': 'approved', 'detail': 'Root community approved successfully.'})

        # STEP 2: Parent Community Admin approval
        elif community.status == 'Pending Parent Community Approval':
            if not community.parent:
                return Response({'detail': 'This community has no parent assigned.'}, status=status.HTTP_400_BAD_REQUEST)

            is_parent_admin = False
            if member and member.role == 'community_admin' and member.community == community.parent:
                is_parent_admin = True
            if is_super_admin:
                is_parent_admin = True

            if not is_parent_admin:
                return Response({'detail': 'Only the direct parent community admin or Super Admin can approve.'}, status=status.HTTP_403_FORBIDDEN)

            community.status = 'Active'
            community.save()

            for admin_member in community_admins:
                if admin_member.user:
                    admin_member.user.is_active = True
                    admin_member.user.save()
                admin_member.status = 'Active'
                admin_member.save()
                if admin_member.user:
                    Notification.objects.create(
                        recipient=admin_member.user,
                        title="Community Activated",
                        message=f"Your community '{community.name}' has been activated under '{community.parent.name}'.",
                        notification_type="approval"
                    )
                    if admin_member.user.email:
                        from .emails import send_project_email
                        send_project_email(
                            recipient=admin_member.user.email,
                            template_name='subsidiary_community_approved',
                            context={'community_name': community.name},
                            trigger_event='Community Activated'
                        )

            CommunityApprovalHistory.objects.create(
                community=community,
                approval_level="Parent Community Admin",
                approved_by=user,
                status="Active",
                remarks=remarks
            )
            return Response({'status': 'active', 'detail': f"Community '{community.name}' activated under '{community.parent.name}'."})

        else:
            return Response({'detail': f'Community is not in an approvable status (current: {community.status}).'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reject(self, request, pk=None):
        community = self.get_object()
        user = request.user
        
        is_super_admin = user.is_superuser
        try:
            member = user.member_profile
            if member.role == 'super_admin':
                is_super_admin = True
        except Member.DoesNotExist:
            member = None
            
        remarks = request.data.get('remarks')
        if not remarks or not remarks.strip():
            return Response({'detail': 'Rejection reason is mandatory.'}, status=status.HTTP_400_BAD_REQUEST)
            
        community_admins = Member.objects.filter(community=community, role='community_admin')

        def notify_and_deactivate(reason_msg, template_name, trigger_event, rejection_context):
            for admin_member in community_admins:
                admin_member.status = 'Inactive'
                admin_member.save()
                if admin_member.user:
                    admin_member.user.is_active = False
                    admin_member.user.save()
                    Notification.objects.create(
                        recipient=admin_member.user,
                        title="Community Registration Rejected",
                        message=reason_msg,
                        notification_type="rejection"
                    )
                    if admin_member.user.email:
                        from .emails import send_project_email
                        send_project_email(
                            recipient=admin_member.user.email,
                            template_name=template_name,
                            context=rejection_context,
                            trigger_event=trigger_event
                        )

        if community.status == 'Pending Super Admin Approval':
            if not is_super_admin:
                return Response({'detail': 'Only Super Admins can reject at this stage.'}, status=status.HTTP_403_FORBIDDEN)

            community.status = 'Rejected By Super Admin'
            community.save()

            CommunityApprovalHistory.objects.create(
                community=community, approval_level="Super Admin",
                approved_by=user, status="Rejected By Super Admin", remarks=remarks
            )
            notify_and_deactivate(
                reason_msg=f"Your community '{community.name}' was rejected by the Super Admin. Reason: {remarks}",
                template_name='super_community_rejected',
                trigger_event='Community Rejected by Super Admin',
                rejection_context={'community_name': community.name, 'rejection_reason': remarks}
            )
            return Response({'status': 'rejected', 'detail': 'Community rejected by Super Admin.'})

        elif community.status == 'Pending Parent Community Approval':
            if not community.parent:
                return Response({'detail': 'No parent community assigned.'}, status=status.HTTP_400_BAD_REQUEST)

            is_parent_admin = is_super_admin or (
                member and member.role == 'community_admin' and member.community == community.parent
            )
            if not is_parent_admin:
                return Response({'detail': 'Only the parent community admin or Super Admin can reject.'}, status=status.HTTP_403_FORBIDDEN)

            community.status = 'Rejected By Parent Community Admin'
            community.save()

            CommunityApprovalHistory.objects.create(
                community=community, approval_level="Parent Community Admin",
                approved_by=user, status="Rejected By Parent Community Admin", remarks=remarks
            )
            notify_and_deactivate(
                reason_msg=f"Your community '{community.name}' was rejected by '{community.parent.name}'. Reason: {remarks}",
                template_name='subsidiary_community_rejected',
                trigger_event='Community Rejected by Parent Admin',
                rejection_context={
                    'community_name': community.name,
                    'parent_name': community.parent.name,
                    'rejection_reason': remarks
                }
            )
            return Response({'status': 'rejected', 'detail': f"Community rejected by '{community.parent.name}'."})

        else:
            return Response({'detail': f'Cannot reject at status: {community.status}.'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        community = self.get_object()
        return Response({
            'members': community.members.count(),
            'events': community.events.count(),
            'businesses': community.businesses.count(),
            'jobs': community.jobs.count(),
            'news': community.news.count(),
            'campaigns': community.campaigns.count(),
        })

class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.all().order_by('-joined_date')
    serializer_class = MemberSerializer
    permission_classes = [permissions.AllowAny, HasCustomRolePermission]
    
    def get_queryset(self):
        queryset = Member.objects.all().order_by('-joined_date')
        community_id = self.request.query_params.get('community_id') or self.request.query_params.get('communityId')
        role = self.request.query_params.get('role')
        status = self.request.query_params.get('status')
        
        if community_id:
            queryset = filter_by_community(queryset, community_id)
        if role:
            queryset = queryset.filter(role=role)
        if status:
            queryset = queryset.filter(status=status)
            
        return queryset

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_status = old_instance.status
        
        member = serializer.save()
        new_status = member.status
        
        # Trigger email notifications on status change
        if old_status != new_status:
            from .emails import send_project_email
            recipient_email = member.email or (member.user.email if member.user else None)
            if recipient_email:
                if new_status == 'Suspended':
                    send_project_email(
                        recipient=recipient_email,
                        template_name='account_suspended',
                        context={},
                        trigger_event='Account Suspended'
                    )
                elif new_status in ['Active', 'Verified'] and old_status == 'Suspended':
                    send_project_email(
                        recipient=recipient_email,
                        template_name='account_reactivated',
                        context={},
                        trigger_event='Account Reactivated'
                    )
    @action(detail=False, methods=['get'])
    def community_members(self, request):
        community_id = request.query_params.get('community_id') or request.query_params.get('communityId')
        if community_id:
            members = Member.objects.filter(community_id=community_id).order_by('-joined_date')
            serializer = self.get_serializer(members, many=True)
            return Response(serializer.data)
        return Response([], status=status.HTTP_400_BAD_REQUEST)

class CommitteeViewSet(viewsets.ModelViewSet):
    queryset = Committee.objects.all().order_by('since')
    serializer_class = CommitteeSerializer
    permission_classes = [permissions.AllowAny, HasCustomRolePermission]
    
    def get_queryset(self):
        queryset = Committee.objects.all().order_by('since')
        community_id = self.request.query_params.get('community_id') or self.request.query_params.get('communityId')
        if community_id:
            queryset = queryset.filter(community_id=community_id)
        return enforce_community_isolation(self.request, queryset)

    def create(self, request, *args, **kwargs):
        data = request.data
        name = data.get('name')
        email = data.get('email')
        phone = data.get('phone', '')
        since = data.get('since')
        community_id = data.get('community')
        role_id = data.get('role_id')
        role_name = data.get('designation')
        password = data.get('password')
        confirm_password = data.get('confirm_password')
        photo_url = data.get('photo_url', '')

        # Validate required fields
        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not name:
            return Response({"detail": "Full name is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not password:
            return Response({"detail": "Password is required."}, status=status.HTTP_400_BAD_REQUEST)
        if password != confirm_password:
            return Response({"detail": "Passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)
        if not community_id:
            return Response({"detail": "Community Association is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Check user availability
        if User.objects.filter(username=email).exists() or User.objects.filter(email=email).exists():
            return Response({"detail": "A user account with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        # Resolve Community
        try:
            community = Community.objects.get(id=community_id)
        except Community.DoesNotExist:
            return Response({"detail": "Community not found."}, status=status.HTTP_400_BAD_REQUEST)

        # Resolve Custom Role and Permissions
        custom_role = None
        permissions_list = []
        frontend_permissions = data.get('permissions')
        
        if role_id:
            try:
                custom_role = Role.objects.get(id=role_id)
                role_name = custom_role.name
                role_perms = custom_role.permissions if isinstance(custom_role.permissions, list) else []
                if isinstance(frontend_permissions, list):
                    permissions_list = list(set(role_perms) & set(frontend_permissions))
                else:
                    permissions_list = role_perms
            except Role.DoesNotExist:
                pass
        
        if not custom_role and role_name:
            try:
                custom_role = Role.objects.get(name=role_name)
                role_perms = custom_role.permissions if isinstance(custom_role.permissions, list) else []
                if isinstance(frontend_permissions, list):
                    permissions_list = list(set(role_perms) & set(frontend_permissions))
                else:
                    permissions_list = role_perms
            except Role.DoesNotExist:
                pass

        if not role_name:
            role_name = "Committee Member"

        # 1. Create Django User
        first_name = name.split(' ')[0] if name else ''
        last_name = ' '.join(name.split(' ')[1:]) if len(name.split(' ')) > 1 else ''
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_active=True
        )

        # 2. Create Member Profile
        member = Member.objects.create(
            user=user,
            name=name,
            email=email,
            phone=phone,
            community=community,
            role='community_admin',
            custom_role=custom_role,
            permissions=permissions_list,
            status='Verified',
            aadhaar_status='Verified'
        )

        # 3. Create Committee record
        if not since:
            import datetime
            since = datetime.date.today()

        committee_member = Committee.objects.create(
            name=name,
            designation=role_name,
            since=since,
            phone=phone,
            email=email,
            photo_url=photo_url,
            community=community,
            role=custom_role
        )

        serializer = self.get_serializer(committee_member)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        data = request.data

        # Fetch associated user/member
        user = None
        member = None
        try:
            user = User.objects.get(email=instance.email)
            member = user.member_profile
        except (User.DoesNotExist, Member.DoesNotExist):
            try:
                user = User.objects.get(username=instance.email)
                member = user.member_profile
            except Exception:
                pass

        response = super().update(request, *args, **kwargs)
        
        if user and member:
            name = data.get('name')
            if name:
                first_name = name.split(' ')[0]
                last_name = ' '.join(name.split(' ')[1:]) if len(name.split(' ')) > 1 else ''
                user.first_name = first_name
                user.last_name = last_name
            
            email = data.get('email')
            if email and email != user.email:
                if not User.objects.filter(username=email).exclude(id=user.id).exists():
                    user.username = email
                    user.email = email
                    member.email = email
            
            user.save()

            phone = data.get('phone')
            if phone:
                member.phone = phone
            
            community_id = data.get('community')
            if community_id:
                try:
                    community = Community.objects.get(id=community_id)
                    member.community = community
                except Community.DoesNotExist:
                    pass

            role_id = data.get('role_id')
            role_name = data.get('designation')
            frontend_permissions = data.get('permissions')
            custom_role = None
            permissions_list = []
            if role_id:
                try:
                    custom_role = Role.objects.get(id=role_id)
                    role_perms = custom_role.permissions if isinstance(custom_role.permissions, list) else []
                    if isinstance(frontend_permissions, list):
                        permissions_list = list(set(role_perms) & set(frontend_permissions))
                    else:
                        permissions_list = role_perms
                except Role.DoesNotExist:
                    pass
            elif role_name:
                try:
                    custom_role = Role.objects.get(name=role_name)
                    role_perms = custom_role.permissions if isinstance(custom_role.permissions, list) else []
                    if isinstance(frontend_permissions, list):
                        permissions_list = list(set(role_perms) & set(frontend_permissions))
                    else:
                        permissions_list = role_perms
                except Role.DoesNotExist:
                    pass
            
            if custom_role:
                member.custom_role = custom_role
                member.permissions = permissions_list
                member.role = 'community_admin'
                instance.role = custom_role
                instance.save()
                
            member.save()

        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            user = User.objects.get(email=instance.email)
            user.delete()
        except User.DoesNotExist:
            try:
                user = User.objects.get(username=instance.email)
                user.delete()
            except User.DoesNotExist:
                pass
        return super().destroy(request, *args, **kwargs)

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('-date')
    serializer_class = EventSerializer
    permission_classes = [permissions.AllowAny, HasCustomRolePermission]
    
    def get_queryset(self):
        queryset = Event.objects.all().order_by('-date')
        community_id = self.request.query_params.get('community_id') or self.request.query_params.get('communityId')
        status = self.request.query_params.get('status')
        
        if community_id:
            queryset = filter_by_community(queryset, community_id)
        if status:
            queryset = queryset.filter(status=status)
            
        return queryset
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        events = Event.objects.filter(status='Upcoming').order_by('date')[:5]
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)

class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all().order_by('-posted_date')
    serializer_class = JobSerializer
    permission_classes = [permissions.AllowAny, HasCustomRolePermission]

    def get_queryset(self):
        queryset = Job.objects.all().order_by('-posted_date')
        community_id = self.request.query_params.get('community_id') or self.request.query_params.get('communityId')
        job_type = self.request.query_params.get('type')
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        
        if community_id:
            queryset = filter_by_community(queryset, community_id)
        if job_type:
            queryset = queryset.filter(type=job_type)
        if category:
            queryset = queryset.filter(category=category)
        if search:
            queryset = queryset.filter(Q(role__icontains=search) | Q(company__icontains=search))
            
        return queryset

    @action(detail=True, methods=['post'], url_path='apply', permission_classes=[permissions.IsAuthenticated])
    def apply(self, request, pk=None):
        job = self.get_object()
        user = request.user
        member = getattr(user, 'member_profile', None)
        applicant_name = member.name if member else user.username
        applicant_email = user.email or (member.email if member else '')

        # Increment applicants count
        job.applicants += 1
        job.save()

        # Send email to Applicant
        from .emails import send_project_email
        send_project_email(
            recipient=applicant_email,
            template_name='job_application_submitted',
            context={
                'job_role': job.role,
                'company_name': job.company
            },
            trigger_event='Job Application Submitted'
        )

        # Send email to Employer (Community Admins)
        if job.community:
            admins = Member.objects.filter(community=job.community, role='community_admin')
            for admin_member in admins:
                if admin_member.user and admin_member.user.email:
                    send_project_email(
                        recipient=admin_member.user.email,
                        template_name='new_application_received',
                        context={
                            'job_role': job.role,
                            'applicant_name': applicant_name,
                            'applicant_email': applicant_email
                        },
                        trigger_event='New Job Application Received'
                    )

        return Response({"status": "applied", "applicants": job.applicants})

class JobApplicationViewSet(viewsets.ModelViewSet):
    queryset = JobApplication.objects.all().order_by('-applied_at')
    serializer_class = JobApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = JobApplication.objects.all().order_by('-applied_at')
        
        # Check permissions
        is_admin = False
        viewer_community_id = None
        if hasattr(user, 'member_profile'):
            member = user.member_profile
            if member:
                viewer_community_id = member.community_id
                if member.role in ['community_admin', 'super_admin']:
                    is_admin = True
        
        if user.is_superuser:
            pass
        elif is_admin:
            if viewer_community_id:
                queryset = queryset.filter(community_id=viewer_community_id)
            else:
                queryset = queryset.none()
        else:
            if hasattr(user, 'member_profile') and user.member_profile:
                queryset = queryset.filter(member=user.member_profile)
            else:
                queryset = queryset.none()

        job_id = self.request.query_params.get('job_id') or self.request.query_params.get('jobId')
        if job_id:
            queryset = queryset.filter(job_id=job_id)
            
        return queryset

    def create(self, request, *args, **kwargs):
        job_id = request.data.get('job')
        if not job_id:
            return Response({"error": "Job ID is required"}, status=400)
            
        user = request.user
        member = getattr(user, 'member_profile', None)
        if not member:
            return Response({"error": "Only community members can apply for jobs"}, status=400)
            
        if JobApplication.objects.filter(job_id=job_id, member=member).exists():
            return Response({"error": "You have already applied for this job"}, status=400)
            
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        user = self.request.user
        member = getattr(user, 'member_profile', None)
        job = serializer.validated_data['job']
        community = job.community or (member.community if member else None)
        
        instance = serializer.save(member=member, community=community)
        
        # Update job applicants counter
        job.applicants += 1
        job.save()
        
        # Member Notification
        if member and member.user:
            Notification.objects.create(
                recipient=member.user,
                title="Job Application Submitted",
                message=f"You have successfully applied for the position of {job.role} at {job.company}.",
                notification_type="job_application"
            )
            # Send Email Notification
            from .emails import send_project_email
            try:
                send_project_email(
                    recipient=member.user.email,
                    template_name='job_application_submitted',
                    context={
                        'job_role': job.role,
                        'company_name': job.company
                    },
                    trigger_event='Job Application Submitted'
                )
            except Exception as e:
                print("Failed to send email to applicant:", e)
                
        # Community Admin Notification
        if community:
            admins = Member.objects.filter(community=community, role='community_admin')
            for admin_member in admins:
                if admin_member.user:
                    Notification.objects.create(
                        recipient=admin_member.user,
                        title="New Job Application",
                        message=f"{instance.full_name} has applied for {job.role}.",
                        notification_type="job_application"
                    )
                    # Send Email Notification
                    try:
                        send_project_email(
                            recipient=admin_member.user.email,
                            template_name='new_application_received',
                            context={
                                'job_role': job.role,
                                'applicant_name': instance.full_name,
                                'applicant_email': instance.email
                            },
                            trigger_event='New Job Application Received'
                        )
                    except Exception as e:
                        print("Failed to send email to admin:", e)

    def perform_update(self, serializer):
        instance = serializer.save()
        
        # Notify member of status change
        status = instance.status
        recipient_user = instance.member.user
        if recipient_user:
            title = f"Job Application Update: {status}"
            message = f"Your application for {instance.job.role} at {instance.job.company} is now {status}."
            Notification.objects.create(
                recipient=recipient_user,
                title=title,
                message=message,
                notification_type="job_application"
            )
            # Send Email Notification
            from .emails import send_project_email
            try:
                send_project_email(
                    recipient=recipient_user.email,
                    template_name='job_application_status_updated',
                    context={
                        'job_role': instance.job.role,
                        'company_name': instance.job.company,
                        'status': status
                    },
                    trigger_event=f"Job Application Status: {status}"
                )
            except Exception as e:
                print("Failed to send status update email:", e)

class BusinessViewSet(viewsets.ModelViewSet):
    queryset = Business.objects.all().order_by('-featured', '-rating', '-id')
    serializer_class = BusinessSerializer
    permission_classes = [permissions.AllowAny, HasCustomRolePermission]

    def perform_create(self, serializer):
        instance = serializer.save()
        self.handle_gallery_uploads(instance)

    def perform_update(self, serializer):
        instance = serializer.save()
        self.handle_gallery_uploads(instance)

    def handle_gallery_uploads(self, instance):
        from django.core.files.storage import default_storage
        from urllib.parse import urlparse
        import json
        import uuid
        
        gallery = []
        raw_gallery = self.request.data.get('gallery')
        if raw_gallery:
            if isinstance(raw_gallery, str):
                try:
                    gallery = json.loads(raw_gallery)
                except Exception:
                    gallery = [raw_gallery]
            elif isinstance(raw_gallery, list):
                gallery = raw_gallery
        else:
            gallery = instance.gallery or []
            if isinstance(gallery, str):
                try:
                    gallery = json.loads(gallery)
                except Exception:
                    gallery = []

        # Clean existing URLs to extract relative path only (remove protocol, host, port, leading slash)
        cleaned_gallery = []
        for item in gallery:
            if isinstance(item, str):
                if item.startswith('http://') or item.startswith('https://'):
                    parsed = urlparse(item)
                    path = parsed.path
                else:
                    path = item
                if path.startswith('/'):
                    path = path[1:]
                if path and path not in cleaned_gallery:
                    cleaned_gallery.append(path)

        # Now handle newly uploaded files
        for key in self.request.FILES:
            if key == 'gallery' or key == 'gallery[]' or key.startswith('gallery_') or key.startswith('business_gallery_'):
                file_list = self.request.FILES.getlist(key)
                for file in file_list:
                    ext = os.path.splitext(file.name)[1]
                    filename = f"businesses/gallery/{uuid.uuid4()}{ext}"
                    saved_path = default_storage.save(filename, file)
                    url_path = default_storage.url(saved_path)
                    
                    if url_path.startswith('http://') or url_path.startswith('https://'):
                        parsed = urlparse(url_path)
                        clean_path = parsed.path
                    else:
                        clean_path = url_path
                    if clean_path.startswith('/'):
                        clean_path = clean_path[1:]
                    
                    if clean_path not in cleaned_gallery:
                        cleaned_gallery.append(clean_path)

        # Always save the updated gallery list so that deletions and additions are both persisted
        instance.gallery = cleaned_gallery
        instance.save(update_fields=['gallery'])
    
    def get_queryset(self):
        user = self.request.user
        is_admin = False
        viewer_community_id = None
        
        if user and user.is_authenticated:
            if user.is_superuser:
                is_admin = True
            else:
                member = getattr(user, 'member_profile', None)
                if member and member.role in ('community_admin', 'super_admin'):
                    is_admin = True
                    viewer_community_id = member.community_id
        
        if is_admin:
            if user.is_superuser:
                queryset = Business.objects.all().order_by('-featured', '-rating', '-id')
            else:
                queryset = Business.objects.filter(
                    Q(community_id=viewer_community_id) | Q(status='VERIFIED')
                ).order_by('-featured', '-rating', '-id')
        else:
            queryset = Business.objects.filter(status='VERIFIED').order_by('-featured', '-rating', '-id')
            
        community_id = self.request.query_params.get('community_id') or self.request.query_params.get('communityId')
        category = self.request.query_params.get('category')
        verified = self.request.query_params.get('verified')
        status_param = self.request.query_params.get('status')
        featured_param = self.request.query_params.get('featured')
        search = self.request.query_params.get('search')
        
        if community_id:
            queryset = queryset.filter(community_id=community_id)
        if category and category != 'All':
            queryset = queryset.filter(category=category)
        if verified:
            queryset = queryset.filter(verified=verified.lower() == 'true')
        if status_param:
            queryset = queryset.filter(status=status_param)
        if featured_param:
            queryset = queryset.filter(featured=featured_param.lower() == 'true')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(category__icontains=search) | 
                Q(owner__icontains=search) |
                Q(location__icontains=search) |
                Q(city__icontains=search) |
                Q(state__icontains=search)
            )
            
        return queryset

    @action(detail=True, methods=['post'], url_path='track-click', permission_classes=[permissions.AllowAny])
    def track_click(self, request, pk=None):
        business = self.get_object()
        click_type = request.data.get('click_type')
        if click_type == 'view':
            business.views += 1
        elif click_type == 'open':
            business.opens += 1
        elif click_type == 'whatsapp':
            business.whatsapp_clicks += 1
        elif click_type == 'call':
            business.call_clicks += 1
        elif click_type == 'website':
            business.website_visits += 1
        business.save()
        return Response({
            "status": "success", 
            "analytics": {
                "views": business.views,
                "opens": business.opens,
                "whatsapp_clicks": business.whatsapp_clicks,
                "call_clicks": business.call_clicks,
                "website_visits": business.website_visits,
            }
        })

def get_ancestors_for_community(community):
    ancestors = []
    curr = community.parent
    while curr:
        ancestors.append(curr)
        curr = curr.parent
    return ancestors

def get_descendants_for_community(community):
    descendants = []
    stack = list(community.subsidiaries.all())
    while stack:
        curr = stack.pop()
        descendants.append(curr)
        stack.extend(list(curr.subsidiaries.all()))
    return descendants

class MatrimonyProfileViewSet(viewsets.ModelViewSet):
    queryset = MatrimonyProfile.objects.filter(deleted_at__isnull=True).order_by('-id')
    serializer_class = MatrimonyProfileSerializer
    permission_classes = [permissions.AllowAny, HasCustomRolePermission]

    def _matching_mode(self):
        return getattr(settings, 'MATCHING_MODE', 'SMART_MATCHING')

    def _open_testing_enabled(self):
        return self._matching_mode() in ('OPEN_TEST', 'OPEN_TESTING')

    def _open_test_profiles(self):
        return MatrimonyProfile.objects.filter(
            deleted_at__isnull=True,
            status__in=['Approved', 'Active', 'Featured']
        )


    def _open_testing_exclusion_reason(self, profile, current_user=None):
        if profile.deleted_at is not None:
            return 'deleted_profile'
        if current_user and current_user.is_authenticated:
            # Check if viewer has an approved profile (admins allowed)
            is_admin = current_user.is_superuser
            if not is_admin:
                try:
                    member = current_user.member_profile
                    if member.role in ('community_admin', 'super_admin'):
                        is_admin = True
                except Exception:
                    pass
            
            if not is_admin:
                if profile.user_id == current_user.id:
                    return None
                viewer_profile = MatrimonyProfile.objects.filter(user=current_user, deleted_at__isnull=True).first()
                if not viewer_profile or viewer_profile.status not in ('Approved', 'Active', 'Featured'):
                    return 'viewer_not_approved'

        if profile.status not in ('Approved', 'Active', 'Featured'):
            return f"status_excluded:{profile.status}"
        return None



    def _log_open_testing_recommendation_debug(self, current_user, returned_ids):
        logger = logging.getLogger(__name__)
        all_profiles = MatrimonyProfile.objects.all()
        total_profiles = all_profiles.count()
        active_profiles = all_profiles.filter(status='Active', deleted_at__isnull=True).count()
        approved_profiles = all_profiles.filter(is_verified=True, deleted_at__isnull=True).count()
        open_test_eligible_profiles = self._open_test_profiles().count()
        returned_count = len(returned_ids)

        logger.warning(
            "OPEN_TEST matrimony recommendations: current_user_id=%s total_profiles=%s active_status_profiles=%s approved_profiles=%s eligible_profiles=%s returned_profiles=%s",
            getattr(current_user, 'id', None),
            total_profiles,
            active_profiles,
            approved_profiles,
            open_test_eligible_profiles,
            returned_count,
        )

        for profile in all_profiles.exclude(id__in=returned_ids).select_related('user'):
            reason = self._open_testing_exclusion_reason(profile, current_user)
            if reason:
                logger.warning(
                    "OPEN_TEST matrimony profile excluded: candidate_id=%s candidate_user_id=%s candidate_username=%s reason=%s status=%s is_verified=%s deleted=%s",
                    profile.id,
                    profile.user_id,
                    getattr(profile.user, 'username', None),
                    reason,
                    profile.status,
                    profile.is_verified,
                    profile.deleted_at is not None,
                )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if self._open_testing_enabled():
            if instance.user_id == getattr(request.user, 'id', None) or not self._open_testing_exclusion_reason(instance, request.user):
                serializer = self.get_serializer(instance)
                return Response(serializer.data)
            return Response({'detail': 'You do not have permission to view this profile.'}, status=status.HTTP_403_FORBIDDEN)

        # Enforce visibility on direct profile URL access
        if not instance.is_visible_to_user(request.user):
            return Response({'detail': 'You do not have permission to view this profile.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_update(self, serializer):
        old_profile = self.get_object()
        old_status = old_profile.status
        old_notes = old_profile.review_notes
        
        new_status = serializer.validated_data.get('status', old_status)
        if new_status in ('Active', 'Approved', 'Featured') and not old_profile.is_verified:
            serializer.validated_data['is_verified'] = True

        # Save updated model
        profile = serializer.save()
        
        # Log status/notes changes
        changes = []
        if old_status != profile.status:
            changes.append(f"Status changed from '{old_status}' to '{profile.status}'")
        if old_notes != profile.review_notes:
            changes.append("Review notes updated")
            
        if changes:
            MatrimonyAuditLog.objects.create(
                profile=profile,
                action="Admin Review Update",
                performed_by=self.request.user if self.request.user and self.request.user.is_authenticated else None,
                details="; ".join(changes)
            )

    @action(detail=False, methods=['get'], url_path='admin-stats')
    def admin_stats(self, request):
        try:
            is_admin = request.user.is_superuser or request.user.member_profile.role in ('community_admin', 'super_admin')
        except Exception:
            is_admin = False
            
        if not is_admin:
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
        community_id = request.query_params.get('community_id') or request.query_params.get('communityId')
        if not community_id:
            try:
                community_id = request.user.member_profile.community_id
            except Exception:
                pass
                
        if not community_id:
            return Response({"detail": "community_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        profiles = MatrimonyProfile.objects.filter(community_id=community_id, deleted_at__isnull=True)
        
        # Calculate stats
        total_profiles = profiles.count()
        ready_for_review = profiles.filter(status='Ready For Review').count()
        active = profiles.filter(status='Active').count()
        featured = profiles.filter(status='Featured').count()
        rejected = profiles.filter(status='Rejected').count()
        
        from django.db.models import Q
        profile_ids = list(profiles.values_list('id', flat=True))
        
        interests_sent = InterestRequest.objects.filter(sender_id__in=profile_ids).count()
        
        matches = InterestRequest.objects.filter(
            Q(sender_id__in=profile_ids) | Q(receiver_id__in=profile_ids),
            status='Accepted'
        ).distinct().count()
        
        return Response({
            "total_profiles": total_profiles,
            "ready_for_review": ready_for_review,
            "active_profiles": active,
            "featured_profiles": featured,
            "rejected_profiles": rejected,
            "total_interests_sent": interests_sent,
            "total_matches": matches,
        })

    
    def get_queryset(self):
        user = self.request.user
        is_admin = False
        if user and user.is_authenticated:
            if user.is_superuser:
                is_admin = True
            else:
                try:
                    member = user.member_profile
                    if member.role in ('community_admin', 'super_admin'):
                        is_admin = True
                except Exception:
                    pass

        queryset = MatrimonyProfile.objects.filter(deleted_at__isnull=True)

        if not is_admin:
            # Check if current user has an approved profile
            viewer_profile = None
            if user and user.is_authenticated:
                viewer_profile = MatrimonyProfile.objects.filter(user=user, deleted_at__isnull=True).first()
            
            has_approved_profile = viewer_profile and viewer_profile.status in ('Approved', 'Active', 'Featured')

            if not has_approved_profile:
                # If they are not approved, they can ONLY see their own profile
                if user and user.is_authenticated:
                    return queryset.filter(user=user).order_by('-id')
                return queryset.none()

            if self._open_testing_enabled():
                if user and user.is_authenticated:
                    logger = logging.getLogger(__name__)
                    queryset = self._open_test_profiles()
                    logger.warning(
                        "OPEN_TEST matrimony profile list: current_user_id=%s returned_profiles=%s",
                        user.id,
                        queryset.count(),
                    )
                    return queryset.order_by('-id')
                return self._open_test_profiles().order_by('-id')

            # For non-admins, filter approved / active profiles OR profiles owned by current logged-in user
            if user and user.is_authenticated:
                queryset = queryset.filter(Q(status__in=['Approved', 'Active', 'Featured']) | Q(user=user))
            else:
                queryset = queryset.filter(status__in=['Approved', 'Active', 'Featured'])

            
            # Apply visibility scope and audience filters
            if not user or not user.is_authenticated:
                # Unauthenticated users may only see platform-wide profiles
                queryset = queryset.filter(visibility_type__in=['PLATFORM_WIDE'])
            else:
                try:
                    viewer_member = user.member_profile
                    viewer_community = viewer_member.community
                except Exception:
                    viewer_community = None

                # For authenticated users, do a two-stage filter: coarse DB-level filter then precise per-object check
                possible_q = queryset.filter(Q(visibility_type__in=['PLATFORM_WIDE', 'COMMUNITY_NETWORK', 'CUSTOM_AUDIENCE']) | Q(user=user))
                # Materialize a limited candidate set to run precise permission checks
                candidates = list(possible_q[:2000])
                visible_ids = []
                for p in candidates:
                    try:
                        if p.is_visible_to_user(user):
                            visible_ids.append(p.id)
                    except Exception:
                        continue
                queryset = queryset.filter(id__in=visible_ids)

        # Apply Global Search & Filters
        community_id = self.request.query_params.get('community_id') or self.request.query_params.get('communityId')
        gender = self.request.query_params.get('gender')
        status_param = self.request.query_params.get('status')
        caste = self.request.query_params.get('caste')
        sub_caste = self.request.query_params.get('sub_caste')
        state = self.request.query_params.get('state')
        city = self.request.query_params.get('city')
        marital_status = self.request.query_params.get('marital_status')
        education = self.request.query_params.get('education')
        profession = self.request.query_params.get('profession') or self.request.query_params.get('occupation')
        income = self.request.query_params.get('income')
        religion = self.request.query_params.get('religion')
        verified_only = self.request.query_params.get('verified_only') or self.request.query_params.get('verifiedOnly')
        premium_only = self.request.query_params.get('premium_only') or self.request.query_params.get('premiumOnly')
        with_photo = self.request.query_params.get('with_photo') or self.request.query_params.get('withPhoto')
        age_min = self.request.query_params.get('age_min') or self.request.query_params.get('ageMin')
        age_max = self.request.query_params.get('age_max') or self.request.query_params.get('ageMax')
        search = self.request.query_params.get('search')

        if community_id:
            queryset = filter_by_community(queryset, community_id)
        if gender:
            queryset = queryset.filter(gender=gender)
        if status_param:
            queryset = queryset.filter(status=status_param)
        if caste and caste != 'Any':
            queryset = queryset.filter(caste__icontains=caste)
        if sub_caste and sub_caste != 'Any':
            queryset = queryset.filter(sub_caste__icontains=sub_caste)
        if state and state != 'Any':
            queryset = queryset.filter(state__icontains=state)
        if city and city != 'Any':
            queryset = queryset.filter(city__icontains=city)
        if marital_status:
            queryset = queryset.filter(marital_status__iexact=marital_status)
        if education and education != 'Any':
            queryset = queryset.filter(education__icontains=education)
        if profession:
            queryset = queryset.filter(profession__icontains=profession)
        if income:
            queryset = queryset.filter(income__icontains=income)
        if religion:
            queryset = queryset.filter(religion__icontains=religion)
        if verified_only and verified_only.lower() == 'true':
            queryset = queryset.filter(is_verified=True)
        if premium_only and premium_only.lower() == 'true':
            queryset = queryset.filter(community__plan__in=['Pro', 'Enterprise'])
        if with_photo and with_photo.lower() == 'true':
            queryset = queryset.filter(Q(photos__isnull=False) | Q(photo__isnull=False) | Q(photo_url__isnull=False)).distinct()
        if age_min:
            queryset = queryset.filter(age__gte=int(age_min))
        if age_max:
            queryset = queryset.filter(age__lte=int(age_max))
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(caste__icontains=search) | 
                Q(education__icontains=search) | 
                Q(profession__icontains=search) |
                Q(city__icontains=search)
            )

        return queryset.order_by('-id')

    def _normalize_preference_list(self, value):
        if not value:
            return []
        if isinstance(value, str):
            return [item.strip().lower() for item in value.split(',') if item.strip()]
        try:
            return [str(item).strip().lower() for item in value if str(item).strip()]
        except Exception:
            return [str(value).strip().lower()]

    def _normalize_gender_preference(self, value):
        if not value:
            return None
        normalized = str(value).strip()
        lowered = normalized.lower()
        if lowered in ('female only', 'bride profiles', 'bride'):
            return 'Bride'
        if lowered in ('male only', 'groom profiles', 'groom'):
            return 'Groom'
        if normalized in ('Bride', 'Groom'):
            return normalized
        return None

    def _profile_is_active_and_approved(self, profile):
        return bool(profile and profile.status in ('Approved', 'Active', 'Featured') and profile.is_verified and profile.deleted_at is None)

    def _load_partner_preference(self, profile, user):
        if profile:
            try:
                return PartnerPreference.objects.get(profile=profile)
            except PartnerPreference.DoesNotExist:
                pass
        if user:
            try:
                return PartnerPreference.objects.get(user=user)
            except PartnerPreference.DoesNotExist:
                pass
        return None

    def _profile_visibility_reason(self, profile, viewer_user, viewer_profile=None):
        if viewer_user and viewer_user.is_authenticated and profile.user_id == viewer_user.id:
            return True, 'owner'

        visibility_type = getattr(profile, 'visibility_type', None) or 'COMMUNITY_NETWORK'

        if visibility_type == 'PRIVATE':
            if not viewer_profile:
                return False, 'private_requires_viewer_profile'
            has_accepted_interest = InterestRequest.objects.filter(
                Q(sender=profile, receiver=viewer_profile, status='Accepted') |
                Q(sender=viewer_profile, receiver=profile, status='Accepted')
            ).exists()
            if not has_accepted_interest:
                return False, 'private_without_accepted_interest'
            return True, 'private_accepted_interest'

        if visibility_type == 'PLATFORM_WIDE':
            return True, 'platform_wide'

        viewer_community = getattr(viewer_profile, 'community', None)
        if not viewer_community:
            return False, 'missing_viewer_community'

        if visibility_type == 'COMMUNITY_NETWORK':
            hierarchy_scope = getattr(profile, 'hierarchy_scope', 'My Community')
            profile_community = getattr(profile, 'community', None)
            if not profile_community:
                return False, 'missing_candidate_community'

            allowed_ids = {profile_community.id}
            if hierarchy_scope == 'Parent Community':
                if profile_community.parent_id:
                    allowed_ids.add(profile_community.parent_id)
            elif hierarchy_scope == 'Child Communities':
                allowed_ids.update(c.id for c in get_descendants_for_community(profile_community))
            elif hierarchy_scope in ('Entire Hierarchy Chain', 'Entire Network'):
                allowed_ids.update(c.id for c in get_ancestors_for_community(profile_community))
                allowed_ids.update(c.id for c in get_descendants_for_community(profile_community))
            elif hierarchy_scope == 'Selected Communities':
                allowed_ids = set(profile.selected_communities.values_list('id', flat=True))
            elif hierarchy_scope not in ('My Community', 'My Community Only'):
                allowed_ids = {profile_community.id}

            if viewer_community.id not in allowed_ids:
                return False, f'community_network_scope_mismatch:{hierarchy_scope}'
            return True, f'community_network:{hierarchy_scope}'

        if visibility_type == 'CUSTOM_AUDIENCE':
            if profile.target_communities.exists() and not profile.target_communities.filter(id=viewer_community.id).exists():
                return False, 'custom_audience_community_mismatch'
            if profile.selected_communities.exists() and not profile.selected_communities.filter(id=viewer_community.id).exists():
                return False, 'custom_audience_selected_community_mismatch'

            if profile.target_castes:
                allowed_castes = self._normalize_preference_list(profile.target_castes)
                if allowed_castes and not self._value_matches_exact_list(getattr(viewer_profile, 'caste', ''), allowed_castes):
                    return False, 'custom_audience_caste_mismatch'
            if profile.target_subcastes:
                allowed_subcastes = self._normalize_preference_list(profile.target_subcastes)
                if allowed_subcastes and not self._value_matches_exact_list(getattr(viewer_profile, 'sub_caste', ''), allowed_subcastes):
                    return False, 'custom_audience_sub_caste_mismatch'
            if profile.target_states:
                allowed_states = self._normalize_preference_list(profile.target_states)
                if allowed_states and not self._value_matches_exact_list(getattr(viewer_profile, 'state', ''), allowed_states):
                    return False, 'custom_audience_state_mismatch'
            if profile.target_cities:
                allowed_cities = self._normalize_preference_list(profile.target_cities)
                if allowed_cities and not self._value_matches_exact_list(getattr(viewer_profile, 'city', ''), allowed_cities):
                    return False, 'custom_audience_city_mismatch'

            target_gender = (profile.target_gender or '').strip()
            if target_gender and target_gender not in ('Everyone', 'All'):
                viewer_gender = getattr(viewer_profile, 'gender', '')
                if target_gender in ('Male Only', 'Groom Profiles', 'Groom') and viewer_gender != 'Groom':
                    return False, 'custom_audience_gender_mismatch'
                if target_gender in ('Female Only', 'Bride Profiles', 'Bride') and viewer_gender != 'Bride':
                    return False, 'custom_audience_gender_mismatch'

            viewer_age = getattr(viewer_profile, 'age', None)
            if viewer_age is None or not (profile.target_age_min <= viewer_age <= profile.target_age_max):
                return False, 'custom_audience_age_mismatch'

            if profile.target_marital_statuses:
                allowed_statuses = self._normalize_preference_list(profile.target_marital_statuses)
                if allowed_statuses and not self._value_matches_exact_list(getattr(viewer_profile, 'marital_status', ''), allowed_statuses):
                    return False, 'custom_audience_marital_status_mismatch'
            if profile.target_educations:
                allowed_educations = self._normalize_preference_list(profile.target_educations)
                if allowed_educations and not self._value_matches_contains_list(getattr(viewer_profile, 'education', ''), allowed_educations):
                    return False, 'custom_audience_education_mismatch'
            if profile.target_occupations:
                allowed_occupations = self._normalize_preference_list(profile.target_occupations)
                if allowed_occupations and not self._value_matches_contains_list(getattr(viewer_profile, 'profession', ''), allowed_occupations):
                    return False, 'custom_audience_occupation_mismatch'

            return True, 'custom_audience'

        return False, f'unsupported_visibility_type:{visibility_type}'

    def _value_matches_exact_list(self, actual, allowed_values):
        actual = (actual or '').strip().lower()
        return bool(actual and actual in allowed_values)

    def _value_matches_contains_list(self, actual, allowed_values):
        actual = (actual or '').strip().lower()
        return bool(actual and any(allowed in actual for allowed in allowed_values))

    def _profile_satisfies_partner_preference(self, profile, pref):
        if not pref:
            return True, ['no_preferences']

        gender = self._normalize_gender_preference(pref.gender)
        if gender and profile.gender != gender:
            return False, [f"gender_mismatch:{profile.gender} vs {gender}"]

        if pref.min_age is not None and profile.age < pref.min_age:
            return False, [f"age_below_min:{profile.age} < {pref.min_age}"]
        if pref.max_age is not None and profile.age > pref.max_age:
            return False, [f"age_above_max:{profile.age} > {pref.max_age}"]

        if pref.caste:
            allowed_castes = self._normalize_preference_list(pref.caste)
            if allowed_castes and not self._value_matches_exact_list(profile.caste, allowed_castes):
                return False, [f"caste_mismatch:{profile.caste}"]

        if pref.sub_caste:
            allowed_subcastes = self._normalize_preference_list(pref.sub_caste)
            if allowed_subcastes and not self._value_matches_exact_list(profile.sub_caste, allowed_subcastes):
                return False, [f"sub_caste_mismatch:{profile.sub_caste}"]

        if pref.city and (not profile.city or profile.city.strip().lower() != pref.city.strip().lower()):
            return False, [f"city_mismatch:{profile.city} vs {pref.city}"]
        if pref.state and (not profile.state or profile.state.strip().lower() != pref.state.strip().lower()):
            return False, [f"state_mismatch:{profile.state} vs {pref.state}"]
        if pref.country and (not profile.country or profile.country.strip().lower() != pref.country.strip().lower()):
            return False, [f"country_mismatch:{profile.country} vs {pref.country}"]

        if pref.education:
            allowed_educations = self._normalize_preference_list(pref.education)
            if allowed_educations and not self._value_matches_contains_list(profile.education, allowed_educations):
                return False, [f"education_mismatch:{profile.education}"]
        if pref.occupation:
            allowed_occupations = self._normalize_preference_list(pref.occupation)
            if allowed_occupations and not self._value_matches_contains_list(profile.profession, allowed_occupations):
                return False, [f"occupation_mismatch:{profile.profession}"]
        if pref.marital_status and (not profile.marital_status or profile.marital_status.strip().lower() != pref.marital_status.strip().lower()):
            return False, [f"marital_status_mismatch:{profile.marital_status} vs {pref.marital_status}"]

        if pref.income_range and pref.income_range.strip().lower() not in (profile.income or '').strip().lower():
            return False, [f"income_range_mismatch:{profile.income}"]

        return True, ['matched_all']

    def _mutual_preference_match(self, my_profile, candidate, my_pref=None):
        candidate_pref = self._load_partner_preference(candidate, candidate.user)
        my_accepts, my_reasons = self._profile_satisfies_partner_preference(candidate, my_pref)
        candidate_accepts, candidate_reasons = self._profile_satisfies_partner_preference(my_profile, candidate_pref)

        result = {
            'my_pref_pass': my_accepts,
            'my_reasons': my_reasons,
            'candidate_pref_pass': candidate_accepts,
            'candidate_reasons': candidate_reasons,
            'candidate_pref': candidate_pref,
        }

        if not my_accepts or not candidate_accepts:
            return False, result

        score_self = self._calculate_preference_score(candidate, my_pref)
        score_candidate = self._calculate_preference_score(my_profile, candidate_pref)
        result['match_score'] = int((score_self + score_candidate) / 2)
        return True, result

    def _filter_candidates_by_preference(self, queryset, pref):
        if not pref:
            return queryset

        queryset = queryset.filter(age__gte=pref.min_age, age__lte=pref.max_age)

        gender = self._normalize_gender_preference(pref.gender)
        if gender:
            queryset = queryset.filter(gender=gender)

        if pref.caste:
            allowed_castes = self._normalize_preference_list(pref.caste)
            if allowed_castes:
                q_obj = Q()
                for caste in allowed_castes:
                    q_obj |= Q(caste__iexact=caste)
                queryset = queryset.filter(q_obj)

        if pref.sub_caste:
            allowed_subcastes = self._normalize_preference_list(pref.sub_caste)
            if allowed_subcastes:
                q_obj = Q()
                for subcaste in allowed_subcastes:
                    q_obj |= Q(sub_caste__iexact=subcaste)
                queryset = queryset.filter(q_obj)

        if pref.city:
            queryset = queryset.filter(city__iexact=pref.city.strip())
        if pref.state:
            queryset = queryset.filter(state__iexact=pref.state.strip())
        if pref.country:
            queryset = queryset.filter(country__iexact=pref.country.strip())

        if pref.education:
            educations = self._normalize_preference_list(pref.education)
            if educations:
                q_obj = Q()
                for education in educations:
                    q_obj |= Q(education__icontains=education)
                queryset = queryset.filter(q_obj)

        if pref.occupation:
            occupations = self._normalize_preference_list(pref.occupation)
            if occupations:
                q_obj = Q()
                for occupation in occupations:
                    q_obj |= Q(profession__icontains=occupation)
                queryset = queryset.filter(q_obj)

        if pref.marital_status:
            queryset = queryset.filter(marital_status__iexact=pref.marital_status.strip())
        if pref.income_range:
            queryset = queryset.filter(income__icontains=pref.income_range.strip())

        return queryset

    def _calculate_preference_score(self, profile, pref):
        if not pref:
            return 100

        score = 0
        total = 100

        if pref.min_age is not None and pref.max_age is not None:
            if pref.min_age <= profile.age <= pref.max_age:
                score += 20
        else:
            score += 20

        if pref.caste:
            allowed_castes = self._normalize_preference_list(pref.caste)
            if allowed_castes and profile.caste and profile.caste.strip().lower() in allowed_castes:
                score += 15
        else:
            score += 15

        if pref.sub_caste:
            allowed_subcastes = self._normalize_preference_list(pref.sub_caste)
            if allowed_subcastes and profile.sub_caste and profile.sub_caste.strip().lower() in allowed_subcastes:
                score += 15
        else:
            score += 15

        if pref.city or pref.state or pref.country:
            if pref.city and profile.city and profile.city.strip().lower() == pref.city.strip().lower():
                score += 15
            elif pref.state and profile.state and profile.state.strip().lower() == pref.state.strip().lower():
                score += 15
            elif pref.country and profile.country and profile.country.strip().lower() == pref.country.strip().lower():
                score += 15
        else:
            score += 15

        if pref.education:
            if pref.education.strip().lower() in (profile.education or '').strip().lower():
                score += 10
        else:
            score += 10

        if pref.occupation:
            if pref.occupation.strip().lower() in (profile.profession or '').strip().lower():
                score += 10
        else:
            score += 10

        if pref.marital_status:
            if profile.marital_status and profile.marital_status.strip().lower() == pref.marital_status.strip().lower():
                score += 15
        else:
            score += 15

        return min(int((score / total) * 100), 100)

    def destroy(self, request, *args, **kwargs):
        profile = self.get_object()
        is_owner = (profile.user == request.user)
        is_admin = False
        try:
            is_admin = request.user.is_superuser or request.user.member_profile.role in ('community_admin', 'super_admin')
        except Exception:
            pass
            
        if not (is_owner or is_admin):
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
        from django.utils import timezone
        profile.deleted_at = timezone.now()
        profile.status = 'Deleted'
        profile.save()
        
        # Log Audit
        MatrimonyAuditLog.objects.create(
            profile=profile,
            action="Soft Delete Profile",
            performed_by=request.user,
            details=f"Soft deleted matrimony profile"
        )
        return Response({"status": "success", "detail": "Profile soft deleted successfully."})

    @action(detail=False, methods=['post'], url_path='estimate-reach')
    def estimate_reach(self, request):
        data = request.data

        if self._open_testing_enabled():
            queryset = self._active_approved_profiles()
            if request.user.is_authenticated:
                queryset = queryset.exclude(user=request.user)
            reach = queryset.count()
            logger = logging.getLogger(__name__)
            logger.debug(
                "OPEN_TESTING matrimony estimate reach: user_id=%s eligible_users=%s",
                getattr(request.user, 'id', None),
                reach,
            )
            return Response({
                "eligible_users": reach,
                "eligible_communities": queryset.values_list('community_id', flat=True).distinct().count(),
                "eligible_matches": reach,
            })
        
        # Target gender
        gender = data.get('filter_gender')
        if not gender or gender == 'All' or gender == 'Everyone':
            # default target is opposite gender
            try:
                my_prof = MatrimonyProfile.objects.filter(user=request.user, deleted_at__isnull=True).first()
                if my_prof:
                    gender = 'Groom' if my_prof.gender == 'Bride' else 'Bride'
            except Exception:
                pass

        # Start with all active and approved profiles of target gender (excluding current user)
        from django.db.models import Q
        queryset = MatrimonyProfile.objects.filter(status='Active', is_verified=True, deleted_at__isnull=True)
        if request.user.is_authenticated:
            queryset = queryset.exclude(user=request.user)
            
        if gender and gender in ('Bride', 'Groom', 'Bride Profiles', 'Groom Profiles'):
            if 'Groom' in gender:
                queryset = queryset.filter(gender='Groom')
            else:
                queryset = queryset.filter(gender='Bride')
            
        # 1. Communities filter
        comm_ids = data.get('filter_communities', [])
        if comm_ids:
            queryset = queryset.filter(community_id__in=comm_ids)
            
        # 2. Caste filter
        castes = data.get('filter_castes', '')
        if castes:
            allowed_castes = [c.strip().lower() for c in castes.split(',') if c.strip()]
            if allowed_castes:
                q_obj = Q()
                for c in allowed_castes:
                    q_obj |= Q(caste__iexact=c)
                queryset = queryset.filter(q_obj)
                
        # 3. Sub-Caste filter
        sub_castes = data.get('filter_sub_castes', '')
        if sub_castes:
            allowed_subcastes = [sc.strip().lower() for sc in sub_castes.split(',') if sc.strip()]
            if allowed_subcastes:
                q_obj = Q()
                for sc in allowed_subcastes:
                    q_obj |= Q(sub_caste__iexact=sc)
                queryset = queryset.filter(q_obj)
                
        # 4. State filter
        states = data.get('filter_states', '')
        if states:
            allowed_states = [s.strip().lower() for s in states.split(',') if s.strip()]
            if allowed_states:
                q_obj = Q()
                for s in allowed_states:
                    q_obj |= Q(state__icontains=s)
                queryset = queryset.filter(q_obj)
                
        # 5. City filter
        cities = data.get('filter_cities', '')
        if cities:
            allowed_cities = [c.strip().lower() for c in cities.split(',') if c.strip()]
            if allowed_cities:
                q_obj = Q()
                for c in allowed_cities:
                    q_obj |= Q(city__icontains=c)
                queryset = queryset.filter(q_obj)
                
        # 6. Age filter
        min_age = int(data.get('filter_min_age', 18) or 18)
        max_age = int(data.get('filter_max_age', 60) or 60)
        queryset = queryset.filter(age__gte=min_age, age__lte=max_age)
        
        # 7. Marital status filter
        marital_statuses = data.get('filter_marital_statuses', '')
        if marital_statuses:
            allowed_ms = [ms.strip().lower() for ms in marital_statuses.split(',') if ms.strip()]
            if allowed_ms:
                q_obj = Q()
                for ms in allowed_ms:
                    q_obj |= Q(marital_status__iexact=ms)
                queryset = queryset.filter(q_obj)
                
        # 8. Education filter
        educations = data.get('filter_educations', '')
        if educations:
            allowed_edu = [e.strip().lower() for e in educations.split(',') if e.strip()]
            if allowed_edu:
                q_obj = Q()
                for e in allowed_edu:
                    q_obj |= Q(education__icontains=e)
                queryset = queryset.filter(q_obj)
                
        # 9. Occupation filter
        occupations = data.get('filter_occupations', '')
        if occupations:
            allowed_occ = [o.strip().lower() for o in occupations.split(',') if o.strip()]
            if allowed_occ:
                q_obj = Q()
                for o in allowed_occ:
                    q_obj |= Q(profession__icontains=o)
                queryset = queryset.filter(q_obj)
                
        reach = queryset.count()

        # Eligible communities covered by this filter
        eligible_communities = queryset.values_list('community_id', flat=True).distinct().count()

        # Eligible matches: if requester has a matrimony profile, compute how many of these
        # would be considered matches according to basic partner preference (lightweight)
        eligible_matches = 0
        try:
            if request.user.is_authenticated:
                my_profile = MatrimonyProfile.objects.filter(user=request.user, deleted_at__isnull=True).first()
            else:
                my_profile = None

            if my_profile and self._profile_is_active_and_approved(my_profile):
                pref = self._load_partner_preference(my_profile, request.user)
                candidates = queryset.exclude(id=my_profile.id)
                candidates = self._filter_candidates_by_preference(candidates, pref)

                for p in candidates:
                    visible, _ = self._profile_visibility_reason(p, request.user, my_profile)
                    if not visible:
                        continue
                    matches, _ = self._mutual_preference_match(my_profile, p, pref)
                    if matches:
                        eligible_matches += 1
        except Exception:
            eligible_matches = 0

        return Response({
            "eligible_users": reach,
            "eligible_communities": eligible_communities,
            "eligible_matches": eligible_matches,
        })

    @action(detail=False, methods=['get'], url_path='my-profiles')
    def my_profiles(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        profiles = MatrimonyProfile.objects.filter(user=request.user, deleted_at__isnull=True)
        serializer = self.get_serializer(profiles, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get', 'post', 'patch'], url_path='my-profile')
    def my_profile(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

        def to_bool(val, default=True):
            if val is None:
                return default
            if isinstance(val, bool):
                return val
            return str(val).lower() == 'true'

        def get_int_list(data, key):
            val = None
            if hasattr(data, 'getlist'):
                val = data.getlist(key)
            if not val:
                val = data.get(key)
            if not val:
                return []
            if isinstance(val, list):
                res = []
                for x in val:
                    try:
                        res.append(int(x))
                    except Exception:
                        pass
                return res
            if isinstance(val, str):
                import json
                try:
                    parsed = json.loads(val)
                    if isinstance(parsed, list):
                        return [int(x) for x in parsed if str(x).strip()]
                except Exception:
                    pass
                try:
                    return [int(x.strip()) for x in val.split(',') if x.strip()]
                except Exception:
                    pass
            return []

        def parse_string_list(data, *keys):
            val = None
            for key in keys:
                if hasattr(data, 'getlist'):
                    candidate = data.getlist(key)
                    if candidate:
                        val = candidate
                        break
                candidate = data.get(key)
                if candidate:
                    val = candidate
                    break
            if not val:
                return ''
            if isinstance(val, list):
                return ','.join(str(x).strip() for x in val if str(x).strip())
            if isinstance(val, str):
                import json
                try:
                    parsed = json.loads(val)
                    if isinstance(parsed, list):
                        return ','.join(str(x).strip() for x in parsed if str(x).strip())
                except Exception:
                    pass
                return ','.join(str(x).strip() for x in val.split(',') if x.strip())
            return str(val).strip()

        def normalize_visibility_type(value):
            if not value:
                return 'COMMUNITY_NETWORK'
            value = str(value).strip()
            mapping = {
                'Private': 'PRIVATE',
                'PRIVATE': 'PRIVATE',
                'Community Network': 'COMMUNITY_NETWORK',
                'My Community Only': 'COMMUNITY_NETWORK',
                'Parent Community': 'COMMUNITY_NETWORK',
                'Child Communities': 'COMMUNITY_NETWORK',
                'Entire Network': 'COMMUNITY_NETWORK',
                'Selected Communities': 'COMMUNITY_NETWORK',
                'Platform Wide': 'PLATFORM_WIDE',
                'Public': 'PLATFORM_WIDE',
                'PLATFORM_WIDE': 'PLATFORM_WIDE',
                'Custom Audience': 'CUSTOM_AUDIENCE',
                'CUSTOM_AUDIENCE': 'CUSTOM_AUDIENCE',
            }
            return mapping.get(value, 'COMMUNITY_NETWORK')

        if request.method == 'GET':
            profile_id = request.query_params.get('profile_id')
            if profile_id:
                profile = MatrimonyProfile.objects.filter(user=request.user, id=profile_id, deleted_at__isnull=True).first()
            else:
                profile = MatrimonyProfile.objects.filter(user=request.user, deleted_at__isnull=True).first()

            if not profile:
                return Response({"detail": "No matrimony profile found"}, status=status.HTTP_404_NOT_FOUND)

            serializer = self.get_serializer(profile)
            return Response(serializer.data)

        elif request.method == 'POST':
            data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
            relationship = data.get('relationship', 'Family Member')
            family_member_id = data.get('family_member') or data.get('member_id')

            try:
                user_member = request.user.member_profile
            except Exception:
                return Response({"detail": "Member profile is not configured for your account."}, status=status.HTTP_400_BAD_REQUEST)

            caste_val = user_member.community.caste if user_member.community and user_member.community.caste else ''
            sub_caste_val = user_member.community.sub_caste if user_member.community and user_member.community.sub_caste else ''
            city_val = user_member.community.village if user_member.community else ''
            state_val = user_member.community.state if user_member.community else ''

            community = user_member.community or Community.objects.filter(deleted_at__isnull=True).first()
            if not community:
                return Response({"detail": "Unable to resolve community for your account."}, status=status.HTTP_400_BAD_REQUEST)

            is_self = str(relationship).lower() == 'self' or not family_member_id or str(family_member_id).lower() == 'self'

            if is_self:
                if MatrimonyProfile.objects.filter(user=request.user, family_member__isnull=True, deleted_at__isnull=True).exists():
                    return Response({"detail": "A matrimony profile already exists for yourself."}, status=status.HTTP_400_BAD_REQUEST)
                f_member = None
                name = user_member.name
                dob = data.get('dob') or (user_member.birthdate.strftime('%Y-%m-%d') if user_member.birthdate else None)
                gender = data.get('gender')
                if not gender:
                    gender = 'Groom' if user_member.gender == 'Male' else 'Bride'
                education = data.get('education') or user_member.education or ''
                profession = data.get('profession') or user_member.profession or ''
                caste = data.get('caste') or caste_val
                sub_caste = data.get('sub_caste') or sub_caste_val
                city = data.get('city') or user_member.village or city_val
                state = data.get('state') or user_member.state or state_val
            else:
                try:
                    f_member = FamilyMember.objects.get(id=family_member_id)
                except FamilyMember.DoesNotExist:
                    return Response({"detail": "Family member not found"}, status=status.HTTP_404_NOT_FOUND)

                if user_member.role in ('community_admin', 'super_admin'):
                    has_permission = Family.objects.filter(id=f_member.family_id, community=user_member.community).exists()
                else:
                    has_permission = Family.objects.filter(id=f_member.family_id, member=user_member).exists()
                if not has_permission:
                    return Response({"detail": "You do not have permission to link this family member."}, status=status.HTTP_403_FORBIDDEN)

                if MatrimonyProfile.objects.filter(family_member=f_member, deleted_at__isnull=True).exists():
                    return Response({"detail": "A matrimony profile already exists for this family member."}, status=status.HTTP_400_BAD_REQUEST)

                name = f_member.name
                dob = data.get('dob') or (f_member.birthdate.strftime('%Y-%m-%d') if f_member.birthdate else None)
                gender = data.get('gender')
                if not gender:
                    if f_member.relation in ['Son', 'Father', 'Brother', 'Husband']:
                        gender = 'Groom'
                    else:
                        gender = 'Bride'
                education = data.get('education') or f_member.education or ''
                profession = data.get('profession') or f_member.occupation or ''
                caste = data.get('caste') or caste_val
                sub_caste = data.get('sub_caste') or sub_caste_val
                city = data.get('city') or city_val
                state = data.get('state') or state_val

            age = 25
            if dob:
                try:
                    from datetime import datetime
                    birth_date = datetime.strptime(dob, '%Y-%m-%d')
                    today = datetime.today()
                    age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
                except Exception:
                    pass

            photo_file = request.FILES.get('photo') or request.FILES.get('image')
            visibility_type = normalize_visibility_type(data.get('visibility_type') or data.get('visibility_scope'))
            hierarchy_scope = data.get('hierarchy_scope') or data.get('visibility_hierarchy') or 'My Community'
            target_communities = get_int_list(data, 'target_communities') or get_int_list(data, 'filter_communities')
            selected_comms = get_int_list(data, 'selected_communities')
            target_castes = parse_string_list(data, 'target_castes', 'filter_castes')
            target_subcastes = parse_string_list(data, 'target_subcastes', 'filter_sub_castes')
            target_states = parse_string_list(data, 'target_states', 'filter_states')
            target_cities = parse_string_list(data, 'target_cities', 'filter_cities')
            target_gender = data.get('target_gender') or data.get('filter_gender') or 'Everyone'
            target_age_min = int(data.get('target_age_min') or data.get('filter_min_age') or 18)
            target_age_max = int(data.get('target_age_max') or data.get('filter_max_age') or 60)
            target_marital_statuses = parse_string_list(data, 'target_marital_statuses', 'filter_marital_statuses')
            target_educations = parse_string_list(data, 'target_educations', 'filter_educations')
            target_occupations = parse_string_list(data, 'target_occupations', 'filter_occupations')

            profile = MatrimonyProfile.objects.create(
                user=request.user,
                family_member=f_member,
                community=community,
                name=name,
                gender=gender,
                dob=dob,
                age=age,
                education=education,
                profession=profession,
                caste=caste,
                sub_caste=sub_caste,
                city=city,
                state=state,
                country=data.get('country', 'India'),
                marital_status=data.get('marital_status', 'Never Married'),
                divorce_year=data.get('divorce_year') or None,
                has_children=to_bool(data.get('has_children'), False),
                children_count=data.get('children_count') or None,
                children_living_with=data.get('children_living_with', ''),
                year_of_loss=data.get('year_of_loss') or None,
                widowed_children_info=data.get('widowed_children_info', ''),
                height=data.get('height', ''),
                weight=data.get('weight', ''),
                complexion=data.get('complexion', ''),
                income=data.get('income', ''),
                religion=data.get('religion', 'Hindu'),
                mother_tongue=data.get('mother_tongue', ''),
                languages_known=data.get('languages_known', ''),
                current_address=data.get('current_address', ''),
                native_place=data.get('native_place', ''),
                diet=data.get('diet', 'Vegetarian'),
                smoking=data.get('smoking', 'No'),
                drinking=data.get('drinking', 'No'),
                about=data.get('about', ''),
                aadhaar=data.get('aadhaar', ''),
                pan=data.get('pan', ''),
                passport=data.get('passport', ''),
                driving_license=data.get('driving_license', ''),
                visibility_type=visibility_type,
                hierarchy_scope=hierarchy_scope,
                contact_permission=data.get('contact_permission', 'Everyone Who Can View'),
                allow_interests=to_bool(data.get('allow_interests'), True),
                allow_direct_chat=to_bool(data.get('allow_direct_chat'), True),
                allow_phone=to_bool(data.get('allow_phone'), True),
                allow_whatsapp=to_bool(data.get('allow_whatsapp'), True),
                allow_email=to_bool(data.get('allow_email'), True),
                target_castes=target_castes,
                target_subcastes=target_subcastes,
                target_states=target_states,
                target_cities=target_cities,
                target_gender=target_gender,
                target_age_min=target_age_min,
                target_age_max=target_age_max,
                target_marital_statuses=target_marital_statuses,
                target_educations=target_educations,
                target_occupations=target_occupations,
                contact_name=data.get('contact_name', name),
                contact_relation=data.get('contact_relation', 'Self'),
                contact_phone=data.get('contact_phone', ''),
                contact_whatsapp=data.get('contact_whatsapp', ''),
                contact_email=data.get('contact_email', ''),
                photo=photo_file,
                status='Active' if self._open_testing_enabled() else 'Draft',
                is_verified=self._open_testing_enabled(),
            )

            if selected_comms:
                profile.selected_communities.set(selected_comms)
            if target_communities:
                profile.target_communities.set(target_communities)

            if photo_file:
                MatrimonyPhoto.objects.create(
                    profile=profile,
                    image=photo_file,
                    category='Profile Photo',
                    is_private=False,
                    order=0
                )

            MatrimonyAuditLog.objects.create(
                profile=profile,
                action="Create Profile",
                performed_by=request.user,
                details=f"Created matrimony profile for: {name}"
            )

            if self._open_testing_enabled():
                MatrimonyProfile.objects.filter(pk=profile.pk).update(status='Active', is_verified=True)
                profile.refresh_from_db()
            else:
                profile.recalculate_status()
            serializer = self.get_serializer(profile)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        elif request.method in ('PATCH', 'PUT'):
            payload = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
            profile_id = payload.get('id') or request.query_params.get('profile_id')
            if profile_id:
                profile = MatrimonyProfile.objects.filter(user=request.user, id=profile_id, deleted_at__isnull=True).first()
            else:
                profile = MatrimonyProfile.objects.filter(user=request.user, deleted_at__isnull=True).first()

            if not profile:
                return Response({"detail": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)

            if 'visibility_scope' in payload and 'visibility_type' not in payload:
                payload['visibility_type'] = normalize_visibility_type(payload.get('visibility_scope'))
            if 'visibility_hierarchy' in payload and 'hierarchy_scope' not in payload:
                payload['hierarchy_scope'] = payload.get('visibility_hierarchy')

            # Accept legacy filter field names and map them to the current target_* model fields
            if 'filter_communities' in payload and 'target_communities' not in payload:
                payload['target_communities'] = payload.get('filter_communities')
            if 'filter_castes' in payload and 'target_castes' not in payload:
                payload['target_castes'] = payload.get('filter_castes')
            if 'filter_sub_castes' in payload and 'target_subcastes' not in payload:
                payload['target_subcastes'] = payload.get('filter_sub_castes')
            if 'filter_states' in payload and 'target_states' not in payload:
                payload['target_states'] = payload.get('filter_states')
            if 'filter_cities' in payload and 'target_cities' not in payload:
                payload['target_cities'] = payload.get('filter_cities')
            if 'filter_gender' in payload and 'target_gender' not in payload:
                payload['target_gender'] = payload.get('filter_gender')
            if 'filter_min_age' in payload and 'target_age_min' not in payload:
                payload['target_age_min'] = payload.get('filter_min_age')
            if 'filter_max_age' in payload and 'target_age_max' not in payload:
                payload['target_age_max'] = payload.get('filter_max_age')
            if 'filter_marital_statuses' in payload and 'target_marital_statuses' not in payload:
                payload['target_marital_statuses'] = payload.get('filter_marital_statuses')
            if 'filter_educations' in payload and 'target_educations' not in payload:
                payload['target_educations'] = payload.get('filter_educations')
            if 'filter_occupations' in payload and 'target_occupations' not in payload:
                payload['target_occupations'] = payload.get('filter_occupations')

            serializer = self.get_serializer(profile, data=payload, partial=True)
            if serializer.is_valid():
                profile = serializer.save()

                if 'selected_communities' in payload:
                    profile.selected_communities.set(get_int_list(payload, 'selected_communities'))

                if 'target_communities' in payload or 'filter_communities' in payload:
                    target_comms = get_int_list(payload, 'target_communities') or get_int_list(payload, 'filter_communities')
                    profile.target_communities.set(target_comms)

                if 'visibility_type' in payload and payload.get('visibility_type') == 'COMMUNITY_NETWORK' and 'selected_communities' in payload:
                    profile.selected_communities.set(get_int_list(payload, 'selected_communities'))

                if 'dob' in payload:
                    dob = payload.get('dob')
                    if dob:
                        try:
                            from datetime import datetime
                            birth_date = datetime.strptime(dob, '%Y-%m-%d')
                            today = datetime.today()
                            profile.age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
                            profile.save()
                        except Exception:
                            pass

                MatrimonyAuditLog.objects.create(
                    profile=profile,
                    action="Update Profile",
                    performed_by=request.user,
                    details=f"Updated profile fields: {', '.join(payload.keys())}"
                )
                profile.refresh_from_db()
                if self._open_testing_enabled():
                    MatrimonyProfile.objects.filter(pk=profile.pk).update(status='Active', is_verified=True)
                else:
                    profile.recalculate_status(save=True)
                profile.refresh_from_db()
                fresh_serializer = self.get_serializer(profile)
                return Response(fresh_serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='family-members')
    def family_members(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        try:
            user_member = request.user.member_profile
            if user_member.role in ('community_admin', 'super_admin'):
                families = Family.objects.filter(community=user_member.community)
            else:
                families = Family.objects.filter(member=user_member)
            members = FamilyMember.objects.filter(family__in=families)
            # Exclude members that already have an active profile
            existing_profile_member_ids = MatrimonyProfile.objects.filter(deleted_at__isnull=True).values_list('family_member_id', flat=True)
            available_members = members.exclude(id__in=existing_profile_member_ids)
            
            serializer = FamilyMemberSerializer(available_members, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get', 'post', 'patch'], url_path='preferences')
    def preferences(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        # Preference belongs to profile
        profile_id = request.query_params.get('profile_id')
        if profile_id:
            profile = MatrimonyProfile.objects.filter(user=request.user, id=profile_id, deleted_at__isnull=True).first()
        else:
            profile = MatrimonyProfile.objects.filter(user=request.user, deleted_at__isnull=True).first()
            
        if not profile:
            # Fallback to user-level preference mapping (legacy compat)
            if request.method == 'GET':
                pref, created = PartnerPreference.objects.get_or_create(user=request.user)
                return Response(PartnerPreferenceSerializer(pref).data)
            elif request.method in ('POST', 'PATCH'):
                pref, created = PartnerPreference.objects.get_or_create(user=request.user)
                serializer = PartnerPreferenceSerializer(pref, data=request.data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    return Response(serializer.data)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        if request.method == 'GET':
            pref, created = PartnerPreference.objects.get_or_create(profile=profile)
            serializer = PartnerPreferenceSerializer(pref)
            return Response(serializer.data)
            
        elif request.method in ('POST', 'PATCH'):
            pref, created = PartnerPreference.objects.get_or_create(profile=profile)
            serializer = PartnerPreferenceSerializer(pref, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                profile.recalculate_status()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get', 'post', 'patch'], url_path='visibility')
    def visibility(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        if request.method == 'GET':
            vis, created = ProfileVisibility.objects.get_or_create(user=request.user)
            serializer = ProfileVisibilitySerializer(vis)
            return Response(serializer.data)
            
        elif request.method in ('POST', 'PATCH'):
            vis, created = ProfileVisibility.objects.get_or_create(user=request.user)
            serializer = ProfileVisibilitySerializer(vis, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='upload-photo')
    def upload_photo(self, request, pk=None):
        profile = MatrimonyProfile.objects.filter(id=pk, deleted_at__isnull=True).first()
        if not profile:
            return Response({"error": "Matrimony profile not found"}, status=404)
        if profile.user != request.user and not request.user.is_superuser:
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
        image = request.FILES.get('image')
        category = request.data.get('category', 'Profile Photo')
        # If first photo, default it to Profile Photo category
        if profile.photos.count() == 0:
            category = 'Profile Photo'
            
        is_private = request.data.get('is_private', 'false').lower() == 'true'
        
        if not image:
            return Response({"detail": "No image file provided"}, status=status.HTTP_400_BAD_REQUEST)
            
        if category == 'Profile Photo':
            profile.photos.filter(category='Profile Photo').update(category='Lifestyle Photo')
            
        photo = MatrimonyPhoto.objects.create(
            profile=profile,
            image=image,
            category=category,
            is_private=is_private,
            order=profile.photos.count()
        )
        
        if category == 'Profile Photo':
            profile.photo = image
            profile.save()
        
        MatrimonyAuditLog.objects.create(
            profile=profile,
            action="Upload Photo",
            performed_by=request.user,
            details=f"Uploaded photo in category: {category}"
        )
        profile.recalculate_status()
        return Response(MatrimonyPhotoSerializer(photo).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='delete-photo')
    def delete_photo(self, request, pk=None):
        profile = MatrimonyProfile.objects.filter(id=pk, deleted_at__isnull=True).first()
        if not profile:
            return Response({"error": "Matrimony profile not found"}, status=404)
        
        try:
            is_admin = request.user.is_superuser or (
                request.user.member_profile.role in ('community_admin', 'super_admin') and 
                request.user.member_profile.community_id == profile.community_id
            )
        except Exception:
            is_admin = False

        if profile.user != request.user and not is_admin:
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
        photo_id = request.data.get('photo_id')
        if not photo_id:
            return Response({"detail": "photo_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            photo = MatrimonyPhoto.objects.get(id=photo_id, profile=profile)
            is_profile_photo = (photo.category == 'Profile Photo')
            photo.delete()
            
            if is_profile_photo:
                next_photo = profile.photos.first()
                if next_photo:
                    next_photo.category = 'Profile Photo'
                    next_photo.save()
                    profile.photo = next_photo.image
                else:
                    profile.photo = None
                profile.save()
            
            MatrimonyAuditLog.objects.create(
                profile=profile,
                action="Delete Photo",

                performed_by=request.user,
                details=f"Deleted photo ID: {photo_id}"
            )
            profile.recalculate_status()
            return Response({"status": "success"})
        except MatrimonyPhoto.DoesNotExist:
            return Response({"detail": "Photo not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], url_path='set-primary-photo')
    def set_primary_photo(self, request, pk=None):
        profile = MatrimonyProfile.objects.filter(id=pk, deleted_at__isnull=True).first()
        if not profile:
            return Response({"error": "Matrimony profile not found"}, status=404)
        
        try:
            is_admin = request.user.is_superuser or (
                request.user.member_profile.role in ('community_admin', 'super_admin') and 
                request.user.member_profile.community_id == profile.community_id
            )
        except Exception:
            is_admin = False

        if profile.user != request.user and not is_admin:
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
        photo_id = request.data.get('photo_id')
        if not photo_id:
            return Response({"detail": "photo_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            photo = MatrimonyPhoto.objects.get(id=photo_id, profile=profile)
            # Demote all current profile photos to Lifestyle Photo
            profile.photos.filter(category='Profile Photo').update(category='Lifestyle Photo')
            # Set this one to Profile Photo
            photo.category = 'Profile Photo'
            photo.save()
            
            # Update main profile photo field
            profile.photo = photo.image
            profile.save()
            
            # Recalculate status
            profile.recalculate_status()
            
            MatrimonyAuditLog.objects.create(
                profile=profile,
                action="Set Primary Photo",
                performed_by=request.user,
                details=f"Set photo ID: {photo_id} as primary"
            )
            return Response({"status": "success", "detail": "Primary photo updated successfully."})
        except MatrimonyPhoto.DoesNotExist:
            return Response({"detail": "Photo not found"}, status=status.HTTP_404_NOT_FOUND)
        except MatrimonyPhoto.DoesNotExist:
            return Response({"detail": "Photo not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], url_path='reorder-photos')
    def reorder_photos(self, request, pk=None):
        profile = self.get_object()
        if profile.user != request.user and not request.user.is_superuser:
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
        photo_ids = request.data.get('photo_ids', [])
        for index, photo_id in enumerate(photo_ids):
            profile.photos.filter(id=photo_id).update(order=index)
            
        MatrimonyAuditLog.objects.create(
            profile=profile,
            action="Reorder Photos",
            performed_by=request.user,
            details=f"Reordered photos to order: {photo_ids}"
        )
        return Response({"status": "success"})

    @action(detail=True, methods=['post'], url_path='update-photo')
    def update_photo(self, request, pk=None):
        profile = MatrimonyProfile.objects.filter(id=pk, deleted_at__isnull=True).first()
        if not profile:
            return Response({"error": "Matrimony profile not found"}, status=404)
        if profile.user != request.user and not request.user.is_superuser:
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
        photo_id = request.data.get('photo_id')
        if not photo_id:
            return Response({"detail": "photo_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            photo = MatrimonyPhoto.objects.get(id=photo_id, profile=profile)
            
            category = request.data.get('category')
            is_private = request.data.get('is_private')
            
            if category is not None:
                if category == 'Profile Photo':
                    profile.photos.filter(category='Profile Photo').update(category='Lifestyle Photo')
                    profile.photo = photo.image
                    profile.save()
                photo.category = category
                
            if is_private is not None:
                def to_bool(val, default=False):
                    if val is None:
                        return default
                    if isinstance(val, bool):
                        return val
                    return str(val).lower() == 'true'
                photo.is_private = to_bool(is_private, False)
                
            photo.save()
            
            MatrimonyAuditLog.objects.create(
                profile=profile,
                action="Update Photo",
                performed_by=request.user,
                details=f"Updated photo ID: {photo_id} (category: {category}, is_private: {is_private})"
            )
            return Response({"status": "success", "photo": MatrimonyPhotoSerializer(photo).data})
        except MatrimonyPhoto.DoesNotExist:
            return Response({"detail": "Photo not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], url_path='verify')
    def verify_profile(self, request, pk=None):
        profile = self.get_object()
        try:
            is_admin = request.user.is_superuser or request.user.member_profile.role in ('community_admin', 'super_admin')
        except Exception:
            is_admin = False
            
        if not is_admin:
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
        profile.is_verified = True
        profile.status = 'Approved'
        profile.save()
        
        MatrimonyAuditLog.objects.create(
            profile=profile,
            action="Verify Profile",
            performed_by=request.user,
            details="Verified profile credentials"
        )
        return Response({"status": "success", "detail": "Profile approved successfully."})

    @action(detail=True, methods=['post'], url_path='suspend')
    def suspend_profile(self, request, pk=None):
        profile = self.get_object()
        try:
            is_admin = request.user.is_superuser or request.user.member_profile.role in ('community_admin', 'super_admin')
        except Exception:
            is_admin = False
            
        if not is_admin:
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
        profile.status = 'Suspended'
        profile.save()
        
        MatrimonyAuditLog.objects.create(
            profile=profile,
            action="Suspend Profile",
            performed_by=request.user,
            details="Suspended profile"
        )
        return Response({"status": "success", "detail": "Profile suspended successfully."})

    @action(detail=True, methods=['get'], url_path='audit-logs')
    def audit_logs(self, request, pk=None):
        profile = MatrimonyProfile.objects.filter(id=pk, deleted_at__isnull=True).first()
        if not profile:
            return Response({"error": "Matrimony profile not found"}, status=404)
        try:
            is_admin = request.user.is_superuser or request.user.member_profile.role in ('community_admin', 'super_admin')
        except Exception:
            is_admin = False
            
        if not is_admin and profile.user != request.user:
            return Response({"detail": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
            
        logs = profile.audit_logs.all().order_by('-timestamp')
        return Response(MatrimonyAuditLogSerializer(logs, many=True).data)

    @action(detail=True, methods=['post'], url_path='show-interest')
    def show_interest(self, request, pk=None):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        sender_profile = MatrimonyProfile.objects.filter(user=request.user, deleted_at__isnull=True).first()
        if not sender_profile:
            return Response({"detail": "You must create a matrimony profile first"}, status=status.HTTP_400_BAD_REQUEST)
            
        if sender_profile.status not in ('Approved', 'Active', 'Featured'):
            return Response(
                {"detail": "Your Matrimony Profile is not approved yet. Please wait for Community Admin approval before interacting with other profiles."},
                status=status.HTTP_403_FORBIDDEN
            )

        target_profile = self.get_object()
        if target_profile.status not in ('Approved', 'Active', 'Featured'):
            return Response(
                {"detail": "The target Matrimony Profile is not approved yet. Please wait for Community Admin approval before interacting with other profiles."},
                status=status.HTTP_403_FORBIDDEN
            )

        if target_profile == sender_profile:
            return Response({"detail": "You cannot show interest in your own profile"}, status=status.HTTP_400_BAD_REQUEST)
            
        interest, created = InterestRequest.objects.get_or_create(
            sender=sender_profile,
            receiver=target_profile,
            defaults={'status': 'Pending'}
        )
        
        # Send Notification to target profile owner
        if target_profile.user:
            Notification.objects.create(
                recipient=target_profile.user,
                title="New Matrimony Interest",
                message=f"You have received a new matrimony interest from {sender_profile.name}.",
                notification_type="matrimony_interest"
            )

            if target_profile.user.email:
                from .emails import send_project_email
                try:
                    send_project_email(
                        recipient=target_profile.user.email,
                        template_name='matrimony_interest_received',
                        context={
                            'sender_name': sender_profile.name,
                            'sender_age': sender_profile.age,
                            'sender_city': sender_profile.city
                        },
                        trigger_event='Matrimony Interest Received'
                    )
                except Exception:
                    pass
        
        return Response(InterestRequestSerializer(interest).data)

    @action(detail=True, methods=['post'], url_path='accept-interest')
    def accept_interest(self, request, pk=None):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        try:
            interest = InterestRequest.objects.get(id=pk, receiver__user=request.user)
        except InterestRequest.DoesNotExist:
            return Response({"detail": "Interest request not found"}, status=status.HTTP_404_NOT_FOUND)
            
        if interest.receiver.status not in ('Approved', 'Active', 'Featured'):
            return Response(
                {"detail": "Your Matrimony Profile is not approved yet. Please wait for Community Admin approval before interacting with other profiles."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        if interest.sender.status not in ('Approved', 'Active', 'Featured'):
            return Response(
                {"detail": "The sender's profile is no longer approved."},
                status=status.HTTP_403_FORBIDDEN
            )

        interest.status = 'Accepted'
        interest.save()
        
        # Notify sender
        if interest.sender.user:
            Notification.objects.create(
                recipient=interest.sender.user,
                title="Interest Accepted 🎉",
                message=f"{interest.receiver.name} has accepted your matrimony interest request!",
                notification_type="matrimony_interest_accepted"
            )

            if interest.sender.user.email:
                from .emails import send_project_email
                try:
                    send_project_email(
                        recipient=interest.sender.user.email,
                        template_name='matrimony_interest_accepted',
                        context={'receiver_name': interest.receiver.name},
                        trigger_event='Matrimony Interest Accepted'
                    )
                except Exception:
                    pass
        
        return Response(InterestRequestSerializer(interest).data)

    @action(detail=True, methods=['post'], url_path='reject-interest')
    def reject_interest(self, request, pk=None):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        try:
            interest = InterestRequest.objects.get(id=pk, receiver__user=request.user)
        except InterestRequest.DoesNotExist:
            return Response({"detail": "Interest request not found"}, status=status.HTTP_404_NOT_FOUND)
            
        if interest.receiver.status not in ('Approved', 'Active', 'Featured'):
            return Response(
                {"detail": "Your Matrimony Profile is not approved yet. Please wait for Community Admin approval before interacting with other profiles."},
                status=status.HTTP_403_FORBIDDEN
            )

        interest.status = 'Rejected'
        interest.save()

        # Notify sender
        if interest.sender.user:
            if interest.sender.user.email:
                from .emails import send_project_email
                try:
                    send_project_email(
                        recipient=interest.sender.user.email,
                        template_name='matrimony_interest_rejected',
                        context={'receiver_name': interest.receiver.name},
                        trigger_event='Matrimony Interest Rejected'
                    )
                except Exception:
                    pass
        
        return Response(InterestRequestSerializer(interest).data)

    @action(detail=True, methods=['post'], url_path='withdraw-interest')
    def withdraw_interest(self, request, pk=None):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        try:
            interest = InterestRequest.objects.get(id=pk, sender__user=request.user)
        except InterestRequest.DoesNotExist:
            return Response({"detail": "Interest request not found"}, status=status.HTTP_404_NOT_FOUND)
            
        if interest.sender.status not in ('Approved', 'Active', 'Featured'):
            return Response(
                {"detail": "Your Matrimony Profile is not approved yet. Please wait for Community Admin approval before interacting with other profiles."},
                status=status.HTTP_403_FORBIDDEN
            )

        interest.delete()
        return Response({"status": "success", "detail": "Interest request withdrawn successfully."})

    @action(detail=True, methods=['post'], url_path='wishlist')
    def toggle_wishlist(self, request, pk=None):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        my_profile = MatrimonyProfile.objects.filter(user=request.user, deleted_at__isnull=True).first()
        if not my_profile or my_profile.status not in ('Approved', 'Active', 'Featured'):
            return Response(
                {"detail": "Your Matrimony Profile is not approved yet. Please wait for Community Admin approval before interacting with other profiles."},
                status=status.HTTP_403_FORBIDDEN
            )

        profile = self.get_object()
        if profile.status not in ('Approved', 'Active', 'Featured'):
            return Response(
                {"detail": "The target Matrimony Profile is not approved yet. Please wait for Community Admin approval before interacting with other profiles."},
                status=status.HTTP_403_FORBIDDEN
            )

        wish_item = Wishlist.objects.filter(user=request.user, profile=profile)
        if wish_item.exists():
            wish_item.delete()
            return Response({"status": "removed", "detail": "Profile removed from wishlist"})
        else:
            Wishlist.objects.create(user=request.user, profile=profile)
            return Response({"status": "added", "detail": "Profile added to wishlist"})

    @action(detail=False, methods=['get'], url_path='my-wishlist')
    def my_wishlist(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        my_profile = MatrimonyProfile.objects.filter(user=request.user, deleted_at__isnull=True).first()
        if not my_profile or my_profile.status not in ('Approved', 'Active', 'Featured'):
            return Response(
                {"detail": "Your Matrimony Profile is not approved yet. Please wait for Community Admin approval before interacting with other profiles."},
                status=status.HTTP_403_FORBIDDEN
            )

        wishlist_items = Wishlist.objects.filter(user=request.user)
        profiles = [item.profile for item in wishlist_items if item.profile.deleted_at is None and item.profile.status in ('Approved', 'Active', 'Featured')]
        serializer = self.get_serializer(profiles, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='interests-received')
    def interests_received(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        my_profile = MatrimonyProfile.objects.filter(user=request.user, deleted_at__isnull=True).first()
        if not my_profile or my_profile.status not in ('Approved', 'Active', 'Featured'):
            return Response(
                {"detail": "Your Matrimony Profile is not approved yet. Please wait for Community Admin approval before interacting with other profiles."},
                status=status.HTTP_403_FORBIDDEN
            )

        interests = InterestRequest.objects.filter(receiver__user=request.user)
        return Response(InterestRequestSerializer(interests, many=True).data)

    @action(detail=False, methods=['get'], url_path='interests-sent')
    def interests_sent(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        my_profile = MatrimonyProfile.objects.filter(user=request.user, deleted_at__isnull=True).first()
        if not my_profile or my_profile.status not in ('Approved', 'Active', 'Featured'):
            return Response(
                {"detail": "Your Matrimony Profile is not approved yet. Please wait for Community Admin approval before interacting with other profiles."},
                status=status.HTTP_403_FORBIDDEN
            )

        interests = InterestRequest.objects.filter(sender__user=request.user)
        return Response(InterestRequestSerializer(interests, many=True).data)

    @action(detail=True, methods=['post'], url_path='record-view')
    def record_view(self, request, pk=None):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        profile = self.get_object()
        if profile.user != request.user:
            ProfileView.objects.create(viewer=request.user, profile=profile)
        return Response({"status": "success"})

    @action(detail=False, methods=['get'], url_path='analytics')
    def analytics(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
        profile_id = request.query_params.get('profile_id')
        if profile_id:
            profile = MatrimonyProfile.objects.filter(user=request.user, id=profile_id, deleted_at__isnull=True).first()
        else:
            profile = MatrimonyProfile.objects.filter(user=request.user, deleted_at__isnull=True).first()
            
        if not profile:
            return Response({
                "views": 0,
                "interestsReceived": 0,
                "interestsSent": 0,
                "wishlist": 0,
                "matches": 0
            })
            
        views_count = ProfileView.objects.filter(profile=profile).count()
        interests_received_count = InterestRequest.objects.filter(receiver=profile).count()
        interests_sent_count = InterestRequest.objects.filter(sender=profile).count()
        wishlist_count = Wishlist.objects.filter(profile=profile).count()
        matches_count = InterestRequest.objects.filter(
            Q(sender=profile, status='Accepted') | Q(receiver=profile, status='Accepted')
        ).count()
        
        return Response({
            "views": views_count,
            "interestsReceived": interests_received_count,
            "interestsSent": interests_sent_count,
            "wishlist": wishlist_count,
            "matches": matches_count
        })

    @action(detail=False, methods=['get'], url_path='matches')
    def matches(self, request):
        logger = logging.getLogger(__name__)
        if not request.user.is_authenticated:
            logger.debug("Recommended matches skipped: unauthenticated request")
            return Response([])

        profile_id = request.query_params.get('profile_id')
        if profile_id:
            my_profile = MatrimonyProfile.objects.filter(user=request.user, id=profile_id, deleted_at__isnull=True).first()
        else:
            my_profile = MatrimonyProfile.objects.filter(user=request.user, deleted_at__isnull=True).first()

        if not my_profile or my_profile.status not in ('Approved', 'Active', 'Featured'):
            return Response(
                {"detail": "Your Matrimony Profile is awaiting approval. Once approved by your Community Admin, you will be able to browse approved profiles, receive matches, and interact with other members."},
                status=status.HTTP_403_FORBIDDEN
            )


        if self._open_testing_enabled():
            profiles = self._open_test_profiles().exclude(user=request.user).select_related(
                'user',
                'community',
            ).prefetch_related('photos').order_by('-id')
            queried_ids = list(profiles.values_list('id', flat=True))
            logger.warning(
                "OPEN_TEST matrimony recommendation query: current_user_id=%s current_profile_id=%s queried_profile_ids=%s",
                request.user.id,
                my_profile.id,
                queried_ids,
            )

            returned_profiles = list(profiles)
            for profile in returned_profiles:
                profile.match_score = my_profile.calculate_match_score(profile)

            returned_ids = [profile.id for profile in returned_profiles]
            self._log_open_testing_recommendation_debug(request.user, returned_ids)

            for profile in returned_profiles:
                logger.warning(
                    "OPEN_TEST matrimony profile included: candidate_id=%s candidate_user_id=%s candidate_username=%s current_user_id=%s reason=open_test_eligible",
                    profile.id,
                    profile.user_id,
                    getattr(profile.user, 'username', None),
                    request.user.id,
                )

            serializer = self.get_serializer(returned_profiles, many=True)
            return Response(serializer.data)

        if not self._profile_is_active_and_approved(my_profile):
            return Response(
                {"detail": "Your Matrimony Profile is not approved yet. Please wait for Community Admin approval before interacting with other profiles."},
                status=status.HTTP_403_FORBIDDEN
            )

        pref = self._load_partner_preference(my_profile, request.user)
        candidates = MatrimonyProfile.objects.filter(
            status__in=['Approved', 'Active', 'Featured'],
            is_verified=True,
            deleted_at__isnull=True,
        ).exclude(id=my_profile.id).select_related('user', 'community').prefetch_related(
            'selected_communities',
            'target_communities',
        ).order_by('-id')

        scored_profiles = []
        for p in candidates:
            if not self._profile_is_active_and_approved(p):
                logger.debug(
                    "Recommended match excluded: candidate_id=%s user_id=%s reason=candidate_not_active_approved status=%s is_verified=%s",
                    p.id,
                    request.user.id,
                    p.status,
                    p.is_verified,
                )
                continue

            if not pref or not self._normalize_gender_preference(pref.gender):
                expected_gender = 'Groom' if my_profile.gender == 'Bride' else 'Bride'
                if p.gender != expected_gender:
                    logger.debug(
                        "Recommended match excluded: candidate_id=%s user_id=%s reason=fallback_gender_mismatch candidate_gender=%s expected_gender=%s",
                        p.id,
                        request.user.id,
                        p.gender,
                        expected_gender,
                    )
                    continue

            visible, visibility_reason = self._profile_visibility_reason(p, request.user, my_profile)
            if not visible:
                logger.debug(
                    "Recommended match excluded: candidate_id=%s user_id=%s reason=%s",
                    p.id,
                    request.user.id,
                    visibility_reason,
                )
                continue

            matches, match_details = self._mutual_preference_match(my_profile, p, pref)

            if not matches:
                logger.debug(
                    "Recommended match excluded: candidate_id=%s user_id=%s my_pref_pass=%s my_reasons=%s candidate_pref_pass=%s candidate_reasons=%s",
                    p.id,
                    request.user.id,
                    match_details['my_pref_pass'],
                    match_details['my_reasons'],
                    match_details['candidate_pref_pass'],
                    match_details['candidate_reasons'],
                )
                continue

            p.match_score = match_details['match_score']

            logger.debug(
                "Recommended match included: candidate_id=%s user_id=%s match_score=%s my_reasons=%s candidate_reasons=%s",
                p.id,
                request.user.id,
                p.match_score,
                match_details['my_reasons'],
                match_details['candidate_reasons'],
            )
            scored_profiles.append(p)

        scored_profiles.sort(key=lambda x: getattr(x, 'match_score', 0), reverse=True)
        serializer = self.get_serializer(scored_profiles, many=True)
        return Response(serializer.data)

class CampaignViewSet(viewsets.ModelViewSet):
    queryset = Campaign.objects.all().order_by('-id')
    serializer_class = CampaignSerializer
    permission_classes = [permissions.AllowAny, HasCustomRolePermission]
    
    def get_queryset(self):
        queryset = Campaign.objects.all().order_by('-id')
        community_id = self.request.query_params.get('community_id') or self.request.query_params.get('communityId')
        if community_id:
            queryset = filter_by_community(queryset, community_id)
        return queryset

class DonationViewSet(viewsets.ModelViewSet):
    queryset = Donation.objects.all().order_by('-date')
    serializer_class = DonationSerializer
    permission_classes = [permissions.AllowAny, HasCustomRolePermission]
    
    def get_queryset(self):
        queryset = Donation.objects.all().order_by('-date')
        campaign_id = self.request.query_params.get('campaign_id')
        if campaign_id:
            queryset = queryset.filter(campaign_id=campaign_id)
        return queryset

    def perform_create(self, serializer):
        donation = serializer.save()
        campaign = donation.campaign
        campaign.raised += donation.amount
        campaign.save()
        
        recipient_email = None
        if self.request.user.is_authenticated and self.request.user.email:
            recipient_email = self.request.user.email
        
        if not recipient_email:
            member = Member.objects.filter(name=donation.donor).first()
            if member and member.email:
                recipient_email = member.email
                
        if not recipient_email:
            recipient_email = self.request.data.get('email', 'socialbuzz31@gmail.com')
            
        from .emails import send_project_email
        send_project_email(
            recipient=recipient_email,
            template_name='donation_success',
            context={
                'amount': donation.amount,
                'tx_id': f"TXN{donation.id:06d}",
                'receipt_no': f"REC{donation.id:06d}"
            },
            trigger_event='Donation Success'
        )

    def perform_destroy(self, instance):
        campaign = instance.campaign
        campaign.raised = max(0, campaign.raised - instance.amount)
        campaign.save()
        instance.delete()
class NewsViewSet(viewsets.ModelViewSet):
    queryset = News.objects.all().order_by('-date')
    serializer_class = NewsSerializer
    permission_classes = [permissions.AllowAny, HasCustomRolePermission]
    
    def get_queryset(self):
        queryset = News.objects.all().order_by('-date')
        community_id = self.request.query_params.get('community_id') or self.request.query_params.get('communityId')
        category = self.request.query_params.get('category')
        
        if community_id:
            queryset = filter_by_community(queryset, community_id)
        if category:
            queryset = queryset.filter(category=category)
            
        return queryset

class FamilyViewSet(viewsets.ModelViewSet):
    queryset = Family.objects.all().order_by('-id')
    serializer_class = FamilySerializer
    permission_classes = [permissions.AllowAny, HasCustomRolePermission]
    
    def get_queryset(self):
        queryset = Family.objects.all().order_by('-id')
        community_id = self.request.query_params.get('community_id') or self.request.query_params.get('communityId')
        member_id = self.request.query_params.get('member_id') or self.request.query_params.get('memberId')

        # If community_id explicitly provided, return all families for that community
        if community_id:
            return queryset.filter(community_id=community_id)

        # If member_id explicitly provided, filter by that member
        if member_id:
            return queryset.filter(member_id=member_id)

        # If authenticated with no params → return only this user's own families
        if self.request.user and self.request.user.is_authenticated:
            try:
                member = self.request.user.member_profile
                # Community admin → return all families in their community
                if member.role in ('community_admin', 'super_admin'):
                    return queryset.filter(community=member.community)
                # Regular member → return only their own families
                return queryset.filter(member=member)
            except Exception:
                pass

        return queryset.none()

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        # Auto-assign community and member from logged-in user
        if request.user and request.user.is_authenticated:
            try:
                member = request.user.member_profile
                if not data.get('community'):
                    data['community'] = member.community_id
                if not data.get('member'):
                    data['member'] = member.id
            except Exception:
                pass
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class FamilyMemberViewSet(viewsets.ModelViewSet):
    queryset = FamilyMember.objects.all()
    serializer_class = FamilyMemberSerializer
    permission_classes = [permissions.AllowAny, HasCustomRolePermission]

    def get_queryset(self):
        queryset = FamilyMember.objects.all()
        family_id = self.request.query_params.get('family_id') or self.request.query_params.get('familyId')
        if family_id:
            queryset = queryset.filter(family_id=family_id)
        return queryset

class EventRegistrationViewSet(viewsets.ModelViewSet):
    queryset = EventRegistration.objects.all()
    serializer_class = EventRegistrationSerializer
    permission_classes = [permissions.AllowAny, HasCustomRolePermission]

    def get_queryset(self):
        queryset = EventRegistration.objects.all()
        email = self.request.query_params.get('email')
        event_id = self.request.query_params.get('event_id') or self.request.query_params.get('eventId')
        if email:
            queryset = queryset.filter(email=email)
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        return queryset

    def perform_create(self, serializer):
        registration = serializer.save()
        
        # Update event attendees count
        event = registration.event
        if event:
            event.attendees = (event.attendees or 0) + registration.attendees
            event.save()
        
        # Trigger email confirmation
        if registration.email:
            from .emails import send_project_email
            try:
                send_project_email(
                    recipient=registration.email,
                    template_name='event_registration_confirmation',
                    context={
                        'member_name': registration.name,
                        'event_title': registration.event.title if registration.event else 'Event',
                        'event_date': registration.event.date.strftime('%Y-%m-%d') if registration.event and registration.event.date else 'N/A',
                        'event_venue': registration.event.venue if registration.event else 'N/A',
                        'attendees': registration.attendees
                    },
                    trigger_event='Event Registration Confirmation'
                )
            except Exception as e:
                print("Failed to send email confirmation:", e)

    def perform_update(self, serializer):
        old_registration = self.get_object()
        old_attendees = old_registration.attendees
        registration = serializer.save()
        event = registration.event
        if event:
            event.attendees = max(0, (event.attendees or 0) - old_attendees + registration.attendees)
            event.save()

    def perform_destroy(self, instance):
        event = instance.event
        attendees_to_remove = instance.attendees
        instance.delete()
        if event:
            event.attendees = max(0, (event.attendees or 0) - attendees_to_remove)
            event.save()
class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'success'})

    @action(detail=False, methods=['delete'], url_path='delete_all')
    def delete_all(self, request):
        Notification.objects.filter(recipient=request.user).delete()
        return Response({'status': 'success'})

class CommunityApprovalHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CommunityApprovalHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return CommunityApprovalHistory.objects.all().order_by('-approved_date')
            
        try:
            member = user.member_profile
            if member.role == 'super_admin':
                return CommunityApprovalHistory.objects.all().order_by('-approved_date')
            elif member.role == 'community_admin':
                community = member.community
                subsidiary_ids = list(community.subsidiaries.values_list('id', flat=True))
                allowed_ids = [community.id] + subsidiary_ids
                return CommunityApprovalHistory.objects.filter(community_id__in=allowed_ids).order_by('-approved_date')
        except Member.DoesNotExist:
            pass
            
        return CommunityApprovalHistory.objects.none()

class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.AllowAny, HasCustomRolePermission]

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.AllowAny, HasCustomRolePermission]

class AdvertisementViewSet(viewsets.ModelViewSet):
    queryset = Advertisement.objects.all().order_by('-created_at')
    serializer_class = AdvertisementSerializer
    permission_classes = [permissions.AllowAny, HasCustomRolePermission]

class GalleryViewSet(viewsets.ModelViewSet):
    serializer_class = GallerySerializer
    permission_classes = [permissions.AllowAny, HasCustomRolePermission]

    def get_queryset(self):
        queryset = Gallery.objects.all().order_by('-uploaded_at')
        community_id = self.request.query_params.get('communityId')
        if community_id:
            queryset = queryset.filter(community_id=community_id)
        return queryset

class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '')
        if not email:
            return Response({"detail": "Email field is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        email = email.strip().lower()
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({"detail": "No user found with this email address."}, status=status.HTTP_404_NOT_FOUND)

        otp_code = str(random.randint(100000, 999999))
        expiry_time = datetime.datetime.now() + datetime.timedelta(minutes=10)
        OTP_STORE[email] = {
            'otp': otp_code,
            'expiry_time': expiry_time,
            'attempt_count': 0,
            'purpose': 'forgot_password'
        }

        # IMPORTANT: all otp's must also show in terminal
        import sys
        sys.stderr.write(f"\n============================================================\n[FORGOT PASSWORD OTP] Email: {email} | OTP: {otp_code} | Expiry: {expiry_time}\n============================================================\n")
        sys.stderr.flush()

        from .emails import send_project_email
        try:
            send_project_email(
                recipient=email,
                template_name='forgot_password_otp',
                context={'otp_code': otp_code},
                trigger_event='Forgot Password OTP'
            )
        except Exception as e:
            print(f"Failed to send forgot password email: {e}")

        return Response({"detail": "OTP sent successfully to your email address."})

class VerifyForgotOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '')
        otp = request.data.get('otp')

        if not email or not otp:
            return Response({"detail": "Email and OTP fields are required."}, status=status.HTTP_400_BAD_REQUEST)

        email = email.strip().lower()
        otp_data = OTP_STORE.get(email)
        if not otp_data or otp_data.get('purpose') != 'forgot_password':
            import sys
            sys.stderr.write(f"\n[DEBUG] VerifyForgotOTPView lookup failed for email: '{email}'. Current OTP_STORE keys: {list(OTP_STORE.keys())}\n")
            sys.stderr.flush()
            return Response({"detail": "No OTP session found for this email."}, status=status.HTTP_400_BAD_REQUEST)

        # Increment attempt count
        otp_data['attempt_count'] = otp_data.get('attempt_count', 0) + 1

        if otp_data['attempt_count'] > 3:
            OTP_STORE.pop(email, None)
            return Response({"detail": "Too many attempts. Please request a new OTP."}, status=status.HTTP_400_BAD_REQUEST)

        # Check expiry
        if datetime.datetime.now() > otp_data['expiry_time']:
            OTP_STORE.pop(email, None)
            return Response({"detail": "OTP expired."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate OTP
        if otp_data['otp'] != otp:
            return Response({"detail": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

        # Mark as verified in the store
        otp_data['verified'] = True
        return Response({"detail": "OTP verified successfully."})

class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '')
        otp = request.data.get('otp')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not email or not otp or not new_password or not confirm_password:
            return Response({"detail": "Email, OTP, new password, and confirm password fields are required."}, status=status.HTTP_400_BAD_REQUEST)

        email = email.strip().lower()
        if new_password != confirm_password:
            return Response({"detail": "Passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)

        otp_data = OTP_STORE.get(email)
        if not otp_data or otp_data.get('purpose') != 'forgot_password':
            import sys
            sys.stderr.write(f"\n[DEBUG] ResetPasswordView lookup failed for email: '{email}'. Current OTP_STORE keys: {list(OTP_STORE.keys())}\n")
            sys.stderr.flush()
            return Response({"detail": "No OTP session found. Please request a new OTP."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if verified or verify now
        if not otp_data.get('verified', False):
            otp_data['attempt_count'] = otp_data.get('attempt_count', 0) + 1
            if otp_data['attempt_count'] > 3:
                OTP_STORE.pop(email, None)
                return Response({"detail": "Too many attempts. Please request a new OTP."}, status=status.HTTP_400_BAD_REQUEST)
            if datetime.datetime.now() > otp_data['expiry_time']:
                OTP_STORE.pop(email, None)
                return Response({"detail": "OTP expired."}, status=status.HTTP_400_BAD_REQUEST)
            if otp_data['otp'] != otp:
                return Response({"detail": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email__iexact=email)
            user.set_password(new_password)
            user.save()
            
            OTP_STORE.pop(email, None)

            from .emails import send_project_email
            try:
                send_project_email(
                    recipient=email,
                    template_name='password_changed_successfully',
                    context={},
                    trigger_event='Password Changed Successfully'
                )
            except Exception as e:
                print(f"Failed to send password changed email: {e}")

            return Response({"detail": "Password has been reset successfully. Please login."})
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

class RegisterSendOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '')
        if not email:
            return Response({"detail": "Email field is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        email = email.strip().lower()
        otp_code = str(random.randint(100000, 999999))
        expiry_time = datetime.datetime.now() + datetime.timedelta(minutes=10)
        OTP_STORE[email] = {
            'otp': otp_code,
            'expiry_time': expiry_time,
            'attempt_count': 0,
            'purpose': 'register'
        }

        # IMPORTANT: all otp's must also show in terminal
        import sys
        sys.stderr.write(f"\n============================================================\n[REGISTRATION OTP] Email: {email} | OTP: {otp_code} | Expiry: {expiry_time}\n============================================================\n")
        sys.stderr.flush()

        from .emails import send_project_email
        try:
            send_project_email(
                recipient=email,
                template_name='forgot_password_otp',
                context={'otp_code': otp_code},
                trigger_event='Registration OTP'
            )
        except Exception as e:
            print(f"Failed to send registration email: {e}")

        return Response({"detail": "OTP sent successfully to your email address."})

class RegisterVerifyOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '')
        otp = request.data.get('otp')

        if not email or not otp:
            return Response({"detail": "Email and OTP fields are required."}, status=status.HTTP_400_BAD_REQUEST)

        email = email.strip().lower()
        otp_data = OTP_STORE.get(email)
        if not otp_data or otp_data.get('purpose') != 'register':
            return Response({"detail": "No OTP session found for this email."}, status=status.HTTP_400_BAD_REQUEST)

        # Increment attempt count
        otp_data['attempt_count'] = otp_data.get('attempt_count', 0) + 1

        if otp_data['attempt_count'] > 3:
            OTP_STORE.pop(email, None)
            return Response({"detail": "Too many attempts. Please request a new OTP."}, status=status.HTTP_400_BAD_REQUEST)

        # Check expiry
        if datetime.datetime.now() > otp_data['expiry_time']:
            OTP_STORE.pop(email, None)
            return Response({"detail": "OTP expired."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate OTP
        if otp_data['otp'] != otp:
            return Response({"detail": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

        # OTP is valid! Activate/Verify the member profile
        try:
            member = Member.objects.get(email__iexact=email)
            member.email_verified = True
            member.save()

            if member.user:
                member.user.is_active = True
                member.user.save()

            OTP_STORE.pop(email, None)
            return Response({"detail": "OTP verified successfully."})
        except Member.DoesNotExist:
            return Response({"detail": "Member profile not found for this email."}, status=status.HTTP_404_NOT_FOUND)

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response({"detail": "old_password and new_password fields are required."}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(old_password):
            return Response({"detail": "Incorrect old password."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        from .emails import send_project_email
        send_project_email(
            recipient=user.email,
            template_name='password_changed_successfully',
            context={},
            trigger_event='Password Changed Successfully'
        )

        return Response({"detail": "Password changed successfully."})

from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from api.models import MessageRequest, Conversation, Message, Member, Notification, MessageReaction
from api.serializers import MessageRequestSerializer, ConversationSerializer, MessageSerializer

class MessageRequestViewSet(viewsets.ModelViewSet):
    serializer_class = MessageRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        member = Member.objects.filter(user=self.request.user).first()
        if not member:
            return MessageRequest.objects.none()
        
        queryset = MessageRequest.objects.filter(Q(sender=member) | Q(receiver=member))
        
        role = self.request.query_params.get('role')
        status_filter = self.request.query_params.get('status')
        
        if role == 'sender':
            queryset = queryset.filter(sender=member)
        elif role == 'receiver':
            queryset = queryset.filter(receiver=member)
            
        if status_filter:
            queryset = queryset.filter(status=status_filter)
            
        return queryset.order_by('-created_at')

    def create(self, request, *args, **kwargs):
        sender_member = Member.objects.filter(user=request.user).first()
        if not sender_member:
            return Response({"detail": "User has no associated member profile."}, status=status.HTTP_400_BAD_REQUEST)
        
        receiver_id = request.data.get('receiver') or request.data.get('receiver_id')
        if not receiver_id:
            return Response({"detail": "Receiver is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            receiver_member = Member.objects.get(id=receiver_id)
        except Member.DoesNotExist:
            return Response({"detail": "Receiver not found."}, status=status.HTTP_404_NOT_FOUND)
        
        if sender_member.id == receiver_member.id:
            return Response({"detail": "You cannot send a message request to yourself."}, status=status.HTTP_400_BAD_REQUEST)

        existing_request = MessageRequest.objects.filter(
            Q(sender=sender_member, receiver=receiver_member) |
            Q(sender=receiver_member, receiver=sender_member)
        ).first()

        if existing_request:
            if existing_request.status == 'pending':
                return Response({"detail": "A message request is already pending between you and this member."}, status=status.HTTP_400_BAD_REQUEST)
            elif existing_request.status == 'approved':
                return Response({"detail": "You are already connected with this member. Open chat to message them."}, status=status.HTTP_400_BAD_REQUEST)
            elif existing_request.status == 'rejected':
                if existing_request.sender == sender_member:
                    time_diff = timezone.now() - existing_request.updated_at
                    if time_diff < timedelta(days=7):
                        days_left = 7 - time_diff.days
                        return Response({
                            "detail": f"Your request was declined. You can request again in {days_left if days_left > 0 else 1} days."
                        }, status=status.HTTP_400_BAD_REQUEST)
                existing_request.delete()

        req = MessageRequest.objects.create(
            sender=sender_member,
            receiver=receiver_member,
            subject=request.data.get('subject', ''),
            introduction_message=request.data.get('introduction_message', ''),
            reason=request.data.get('reason', 'General Inquiry'),
            custom_reason=request.data.get('custom_reason', ''),
            status='pending'
        )

        if receiver_member.user:
            Notification.objects.create(
                recipient=receiver_member.user,
                title="New Connection Request",
                message=f"{sender_member.name} wants to connect with you.",
                notification_type="Connection"
            )

        serializer = MessageRequestSerializer(req, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        req = self.get_object()
        member = Member.objects.filter(user=request.user).first()
        if not member or req.receiver != member:
            return Response({"detail": "Not authorized to approve this request."}, status=status.HTTP_403_FORBIDDEN)
        
        if req.status != 'pending':
            return Response({"detail": f"Request is already {req.status}."}, status=status.HTTP_400_BAD_REQUEST)
        
        req.status = 'approved'
        req.save()

        conv = Conversation.objects.filter(
            (Q(participant_1=req.sender) & Q(participant_2=req.receiver)) |
            (Q(participant_1=req.receiver) & Q(participant_2=req.sender))
        ).first()

        if not conv:
            conv = Conversation.objects.create(
                participant_1=req.sender,
                participant_2=req.receiver
            )

        Message.objects.create(
            conversation=conv,
            sender=req.sender,
            content=req.introduction_message or "Let's connect!"
        )

        if req.sender.user:
            Notification.objects.create(
                recipient=req.sender.user,
                title="Connection Approved",
                message="Your message request has been approved. You can now start chatting.",
                notification_type="Connection"
            )

        return Response({"status": "approved", "detail": "Message request approved successfully."})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        req = self.get_object()
        member = Member.objects.filter(user=request.user).first()
        if not member or req.receiver != member:
            return Response({"detail": "Not authorized to reject this request."}, status=status.HTTP_403_FORBIDDEN)
        
        if req.status != 'pending':
            return Response({"detail": f"Request is already {req.status}."}, status=status.HTTP_400_BAD_REQUEST)
        
        req.status = 'rejected'
        req.save()

        if req.sender.user:
            Notification.objects.create(
                recipient=req.sender.user,
                title="Connection Declined",
                message="Your connection request was declined.",
                notification_type="Connection"
            )

        return Response({"status": "rejected", "detail": "Message request rejected successfully."})

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        member = Member.objects.filter(user=self.request.user).first()
        if not member:
            return Conversation.objects.none()
        
        return Conversation.objects.filter(Q(participant_1=member) | Q(participant_2=member)).order_by('-created_at')

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        conv = self.get_object()
        member = Member.objects.filter(user=request.user).first()
        if not member or (conv.participant_1 != member and conv.participant_2 != member):
            return Response({"detail": "Not authorized to view messages in this conversation."}, status=status.HTTP_403_FORBIDDEN)
        
        conv.messages.exclude(sender=member).update(is_seen=True)
        
        msgs = conv.messages.all().order_by('created_at')
        serializer = MessageSerializer(msgs, many=True, context={'request': request})
        return Response(serializer.data)

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        member = Member.objects.filter(user=self.request.user).first()
        if not member:
            return Message.objects.none()
        return Message.objects.filter(conversation__participant_1=member) | Message.objects.filter(conversation__participant_2=member)

    def create(self, request, *args, **kwargs):
        sender_member = Member.objects.filter(user=request.user).first()
        if not sender_member:
            return Response({"detail": "User has no associated member profile."}, status=status.HTTP_400_BAD_REQUEST)
        
        conversation_id = request.data.get('conversation') or request.data.get('conversation_id')
        if not conversation_id:
            return Response({"detail": "Conversation ID is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            conv = Conversation.objects.get(id=conversation_id)
        except Conversation.DoesNotExist:
            return Response({"detail": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
            
        if conv.participant_1 != sender_member and conv.participant_2 != sender_member:
            return Response({"detail": "Not a participant in this conversation."}, status=status.HTTP_403_FORBIDDEN)
            
        content = request.data.get('content', '')
        image = request.FILES.get('image')
        file_attachment = request.FILES.get('file')
        reply_to_id = request.data.get('reply_to_id')
        
        if not content and not image and not file_attachment:
            return Response({"detail": "Message content or attachment is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        reply_to = None
        if reply_to_id:
            try:
                reply_to = Message.objects.get(id=reply_to_id)
            except Message.DoesNotExist:
                pass
                
        msg = Message.objects.create(
            conversation=conv,
            sender=sender_member,
            content=content,
            image=image,
            file=file_attachment,
            reply_to=reply_to
        )
        
        serializer = MessageSerializer(msg, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def react(self, request, pk=None):
        msg = self.get_object()
        member = Member.objects.filter(user=request.user).first()
        if not member:
            return Response({"detail": "User has no associated member profile."}, status=status.HTTP_400_BAD_REQUEST)
        
        emoji = request.data.get('emoji')
        
        existing_rx = MessageReaction.objects.filter(message=msg, member=member).first()
        if existing_rx:
            if not emoji or existing_rx.emoji == emoji:
                existing_rx.delete()
                action_taken = "removed"
            else:
                existing_rx.emoji = emoji
                existing_rx.save()
                action_taken = "updated"
        else:
            if emoji:
                MessageReaction.objects.create(message=msg, member=member, emoji=emoji)
                action_taken = "added"
            else:
                action_taken = "no_action"
                
        serializer = self.get_serializer(msg)
        return Response({
            "status": "success",
            "action": action_taken,
            "message_id": msg.id,
            "reactions": serializer.data.get('reactions', [])
        })
    def destroy(self, request, *args, **kwargs):
        msg = self.get_object()
        sender_member = Member.objects.filter(user=request.user).first()
        if not sender_member or msg.sender != sender_member:
            return Response({"detail": "You can only delete your own messages."}, status=status.HTTP_403_FORBIDDEN)
        
        msg.delete()
        return Response({"detail": "Message deleted."}, status=status.HTTP_204_NO_CONTENT)


from .models import (
    BookingProperty, PropertyResource, ResourcePricing, ResourceLock,
    VenueBooking, BookingInspection, BookingRefund, BookingWaitingList,
    ResourceDependency
)
from .serializers import (
    BookingPropertySerializer, PropertyResourceSerializer, ResourcePricingSerializer,
    ResourceLockSerializer, VenueBookingSerializer, BookingInspectionSerializer,
    BookingRefundSerializer, BookingWaitingListSerializer, ResourceDependencySerializer
)

class BookingPropertyViewSet(viewsets.ModelViewSet):
    serializer_class = BookingPropertySerializer
    permission_classes = [permissions.IsAuthenticated]

    def _member(self):
        return Member.objects.filter(user=self.request.user).select_related('community').first()

    def _is_super_admin(self, member=None):
        return self.request.user.is_superuser or (member and member.role == 'super_admin')

    def get_queryset(self):
        user = self.request.user
        member = self._member()
        if not member:
            if user.is_superuser:
                return BookingProperty.objects.all()
            return BookingProperty.objects.none()

        if self._is_super_admin(member):
            return BookingProperty.objects.all()
        elif member.role == 'community_admin':
            return BookingProperty.objects.filter(community=member.community)
        
        community_ids = {member.community.id}
        curr = member.community
        while curr and curr.parent_id:
            community_ids.add(curr.parent_id)
            curr = curr.parent
            
        def get_descendants(c):
            ids = set()
            for child in c.subsidiaries.all():
                ids.add(child.id)
                ids.update(get_descendants(child))
            return ids
        community_ids.update(get_descendants(member.community))
        
        filter_comm = self.request.query_params.get('community')
        if filter_comm and str(filter_comm).isdigit() and int(filter_comm) in community_ids:
            return BookingProperty.objects.filter(community_id=int(filter_comm), status='Approved', notified=True)

        return BookingProperty.objects.filter(community_id__in=community_ids, status='Approved', notified=True)

    def perform_create(self, serializer):
        user = self.request.user
        member = self._member()
        status = 'Approved' if self._is_super_admin(member) else 'Pending Approval'
        is_approved = status == 'Approved'
        
        photos_data = self.request.data.get('photos')
        import json
        if isinstance(photos_data, str):
            try:
                photos = json.loads(photos_data)
            except:
                photos = [photos_data]
        elif isinstance(photos_data, list):
            photos = photos_data
        else:
            photos = list(serializer.validated_data.get('photos', []))

        if 'uploaded_photos' in self.request.FILES:
            from django.core.files.storage import default_storage
            for f in self.request.FILES.getlist('uploaded_photos'):
                path = default_storage.save(f'property_photos/{f.name}', f)
                photos.append(default_storage.url(path))

        if member and member.community:
            serializer.save(community=member.community, status=status, photos=photos, notified=is_approved)
        else:
            community_id = self.request.data.get('community')
            community = None
            if community_id:
                try:
                    community = Community.objects.get(id=community_id)
                except (Community.DoesNotExist, ValueError):
                    pass
            if not community:
                community = Community.objects.first()
            if not community:
                from rest_framework import serializers
                raise serializers.ValidationError({"community": "A community must exist before creating properties."})
            serializer.save(community=community, status=status, photos=photos, notified=is_approved)

    def perform_update(self, serializer):
        member = self._member()
        instance = self.get_object()
        
        photos_data = self.request.data.get('photos')
        import json
        if isinstance(photos_data, str):
            try:
                photos = json.loads(photos_data)
            except:
                photos = [photos_data]
        elif isinstance(photos_data, list):
            photos = photos_data
        else:
            photos = list(serializer.validated_data.get('photos', instance.photos))

        if 'uploaded_photos' in self.request.FILES:
            from django.core.files.storage import default_storage
            for f in self.request.FILES.getlist('uploaded_photos'):
                path = default_storage.save(f'property_photos/{f.name}', f)
                photos.append(default_storage.url(path))

        if self._is_super_admin(member):
            new_status = instance.status
            serializer.save(status=new_status, photos=photos, notified=(new_status == 'Approved'))
        elif member and member.role == 'community_admin' and instance.community_id == member.community_id:
            # Updating a property by community admin resets its status to Pending Approval for Super Admin review
            serializer.save(status='Pending Approval', rejection_reason='', photos=photos, notified=False)
        else:
            serializer.save(community=instance.community, status='Pending Approval', rejection_reason='', photos=photos, notified=False)

    def destroy(self, request, *args, **kwargs):
        member = self._member()
        instance = self.get_object()
        if not self._is_super_admin(member) and (not member or member.role != 'community_admin' or instance.community_id != member.community_id):
            return Response({'error': 'You can delete only properties from your own community.'}, status=403)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        member = self._member()
        prop = self.get_object()
        if not self._is_super_admin(member):
            return Response({'error': 'Only Super Admins can approve properties.'}, status=403)
        prop.status = 'Approved'
        prop.rejection_reason = ''
        prop.notified = True
        prop.save()
        return Response({'status': 'Approved successfully'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        member = self._member()
        prop = self.get_object()
        if not self._is_super_admin(member):
            return Response({'error': 'Only Super Admins can reject properties.'}, status=403)
        reason = str(request.data.get('rejection_reason', '')).strip()
        if not reason:
            return Response({'rejection_reason': 'Rejection reason is required.'}, status=400)
        prop.status = 'Rejected'
        prop.rejection_reason = reason
        prop.save()
        return Response({'status': 'Rejected successfully'})

    @action(detail=True, methods=['post'])
    def notify(self, request, pk=None):
        member = self._member()
        prop = self.get_object()
        if not member or member.role != 'community_admin' or prop.community_id != member.community_id:
            return Response({'error': 'Only the community admin of this property can notify members.'}, status=403)
        if prop.status != 'Approved':
            return Response({'error': 'Only approved properties can be notified.'}, status=400)
        prop.notified = True
        prop.save()
        
        # Send notifications to all community members
        from api.models import Member
        community_members = Member.objects.filter(community=prop.community, role='member').select_related('user')
        for m in community_members:
            if m.user:
                _notify_user(
                    user=m.user,
                    title=f"New Venue Available: {prop.name}",
                    message=f"A new venue '{prop.name}' is now available for booking in your community! Check it out.",
                    notification_type='booking'
                )
        return Response({'status': 'Notified successfully'})

    @action(detail=True, methods=['post'])
    def check_availability(self, request, pk=None):
        property_obj = self.get_object()
        resource_ids = request.data.get('resource_ids') or []
        if not resource_ids and request.data.get('entire_property'):
            resource_ids = list(property_obj.resources.filter(status='Active').values_list('id', flat=True))
        try:
            start_date, end_date, start_time, end_time, start_dt, end_dt = _parse_booking_request(request.data)
            resource_ids = [int(rid) for rid in resource_ids]
        except Exception as exc:
            return Response({'error': str(exc) or 'Invalid date or time format.'}, status=400)

        all_available, details = _availability_for_resources(property_obj, resource_ids, start_dt, end_dt)
        selected_resources = property_obj.resources.filter(id__in=resource_ids, status='Active')
        pricing = _calculate_booking_price(selected_resources, start_dt, end_dt, request.data.get('extra_charges', 0))
        suggestions = []
        if not all_available:
            other_resources = property_obj.resources.exclude(id__in=resource_ids).filter(status='Active')
            for res in other_resources:
                available, alt_details = _availability_for_resources(property_obj, [res.id], start_dt, end_dt)
                if available:
                    suggestions.append({
                        'id': res.id,
                        'name': res.name,
                        'resource_type': res.resource_type
                    })
                    
        return Response({
            'available': all_available,
            'status': 'available' if all_available else 'partial' if any(d['status'] == 'partial' for d in details) else 'unavailable',
            'details': details,
            'pricing': pricing,
            'suggestions': suggestions
        })

    @action(detail=True, methods=['post'])
    def calculate_price(self, request, pk=None):
        property_obj = self.get_object()
        resource_ids = request.data.get('resource_ids') or []
        if not resource_ids and request.data.get('entire_property'):
            resource_ids = list(property_obj.resources.filter(status='Active').values_list('id', flat=True))
        try:
            start_date, end_date, start_time, end_time, start_dt, end_dt = _parse_booking_request(request.data)
            resource_ids = [int(rid) for rid in resource_ids]
        except Exception as exc:
            return Response({'error': str(exc) or 'Invalid date or time format.'}, status=400)
        resources = property_obj.resources.filter(id__in=resource_ids, status='Active')
        return Response(_calculate_booking_price(resources, start_dt, end_dt, request.data.get('extra_charges', 0)))

class PropertyResourceViewSet(viewsets.ModelViewSet):
    serializer_class = PropertyResourceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        member = Member.objects.filter(user=user).first()
        if user.is_superuser or (member and member.role == 'super_admin'):
            return PropertyResource.objects.all()
        if member and member.role == 'community_admin':
            return PropertyResource.objects.filter(property__community=member.community)
        if member:
            return PropertyResource.objects.filter(property__community=member.community, property__status='Approved', status='Active')
        return PropertyResource.objects.none()

    def perform_create(self, serializer):
        member = Member.objects.filter(user=self.request.user).first()
        prop = serializer.validated_data.get('property')
        if not (self.request.user.is_superuser or (member and member.role == 'super_admin')):
            if not member or member.role != 'community_admin' or prop.community_id != member.community_id:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('You can add resources only to properties in your community.')
        serializer.save()

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        member = Member.objects.filter(user=request.user).first()

        # --- New format: { resources: [{property, name, ...}, ...] } ---
        resources_list = request.data.get('resources')
        if resources_list and isinstance(resources_list, list):
            if not resources_list:
                return Response({'error': 'Resources list is empty.'}, status=400)

            # Validate property from the first item (all items must share the same property)
            prop_id = resources_list[0].get('property')
            prop = BookingProperty.objects.filter(id=prop_id).first()
            if not prop:
                return Response({'error': f'Property with id={prop_id} not found'}, status=404)

            if not (request.user.is_superuser or (member and member.role == 'super_admin')):
                if not member or member.role != 'community_admin' or prop.community_id != member.community_id:
                    from rest_framework.exceptions import PermissionDenied
                    raise PermissionDenied('You can add resources only to properties in your community.')

            created = []
            errors = []
            for i, item in enumerate(resources_list):
                serializer = self.get_serializer(data=item)
                if serializer.is_valid():
                    self.perform_create(serializer)
                    created.append(serializer.data)
                else:
                    errors.append({'index': i, 'errors': serializer.errors})

            if errors and not created:
                return Response({'error': 'Validation failed for all resources', 'details': errors}, status=400)

            return Response(
                {'message': f'Successfully created {len(created)} resources', 'resources': created, 'errors': errors},
                status=201
            )

        # --- Legacy format: single property + prefix + range_start + range_end ---
        prop_id = request.data.get('property')
        prefix = request.data.get('prefix', 'Room')
        start_idx = int(request.data.get('range_start', 1))
        end_idx = int(request.data.get('range_end', 1))

        prop = BookingProperty.objects.filter(id=prop_id).first()
        if not prop:
            return Response({'error': 'Property not found'}, status=404)

        if not (request.user.is_superuser or (member and member.role == 'super_admin')):
            if not member or member.role != 'community_admin' or prop.community_id != member.community_id:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('You can add resources only to properties in your community.')

        base_data = request.data.copy()
        base_data.pop('prefix', None)
        base_data.pop('range_start', None)
        base_data.pop('range_end', None)

        created = []
        for i in range(start_idx, end_idx + 1):
            data = base_data.copy()
            data['name'] = f"{prefix} {i}"
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            created.append(serializer.data)

        return Response({'message': f'Successfully created {len(created)} resources', 'resources': created}, status=201)

    def perform_update(self, serializer):
        member = Member.objects.filter(user=self.request.user).first()
        instance = self.get_object()
        target_property = serializer.validated_data.get('property', instance.property)
        if not (self.request.user.is_superuser or (member and member.role == 'super_admin')):
            if not member or member.role != 'community_admin' or target_property.community_id != member.community_id:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('You can manage resources only in your community.')
        serializer.save()

class ResourcePricingViewSet(viewsets.ModelViewSet):
    serializer_class = ResourcePricingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        member = Member.objects.filter(user=user).first()
        if user.is_superuser or (member and member.role == 'super_admin'):
            return ResourcePricing.objects.all()
        if member and member.role == 'community_admin':
            return ResourcePricing.objects.filter(resource__property__community=member.community)
        if member:
            return ResourcePricing.objects.filter(resource__property__community=member.community, resource__property__status='Approved', resource__status='Active')
        return ResourcePricing.objects.none()

    def perform_create(self, serializer):
        member = Member.objects.filter(user=self.request.user).first()
        resource = serializer.validated_data.get('resource')
        if not (self.request.user.is_superuser or (member and member.role == 'super_admin')):
            if not member or member.role != 'community_admin' or resource.property.community_id != member.community_id:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('You can price resources only in your community.')
        serializer.save()

class ResourceDependencyViewSet(viewsets.ModelViewSet):
    serializer_class = ResourceDependencySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        member = Member.objects.filter(user=user).first()
        if user.is_superuser or (member and member.role == 'super_admin'):
            return ResourceDependency.objects.all()
        if member and member.role == 'community_admin':
            return ResourceDependency.objects.filter(resource__property__community=member.community)
        if member:
            return ResourceDependency.objects.filter(resource__property__community=member.community, resource__property__status='Approved', resource__status='Active')
        return ResourceDependency.objects.none()

    def perform_create(self, serializer):
        member = Member.objects.filter(user=self.request.user).first()
        resource = serializer.validated_data.get('resource')
        if not (self.request.user.is_superuser or (member and member.role == 'super_admin')):
            if not member or member.role != 'community_admin' or resource.property.community_id != member.community_id:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('You can manage dependencies only in your community.')
        serializer.save()


class VenueBookingViewSet(viewsets.ModelViewSet):
    serializer_class = VenueBookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _member(self):
        return Member.objects.filter(user=self.request.user).select_related('community').first()

    def _is_admin_for_booking(self, booking, member=None):
        member = member or self._member()
        return self.request.user.is_superuser or (
            member and member.role in ['super_admin', 'community_admin'] and booking.property.community_id == member.community_id
        )

    def get_queryset(self):
        user = self.request.user
        member = self._member()
        if not member:
            return VenueBooking.objects.none()

        if user.is_superuser or member.role == 'super_admin':
            return VenueBooking.objects.all()
        elif member.role == 'community_admin':
            return VenueBooking.objects.filter(property__community=member.community)
            
        return VenueBooking.objects.filter(member=member)

    def perform_create(self, serializer):
        user = self.request.user
        member = self._member()
        prop = serializer.validated_data.get('property')
        if prop and prop.status != 'Approved':
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'property': 'Only approved properties can be booked.'})
        resources = list(serializer.validated_data.get('resources') or [])
        if not resources:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'resources': 'Select at least one resource.'})
        if any(res.property_id != prop.id or res.status != 'Active' for res in resources):
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'resources': 'All selected resources must be active and belong to the selected property.'})

        start_date = serializer.validated_data.get('start_date')
        end_date = serializer.validated_data.get('end_date')
        start_time = serializer.validated_data.get('start_time')
        end_time = serializer.validated_data.get('end_time')
        start_dt, end_dt = _booking_window(start_date, end_date, start_time, end_time)
        if end_dt <= start_dt:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'end_time': 'End time must be after start time.'})

        duration_hours = Decimal(str((end_dt - start_dt).total_seconds() / 3600))
        duration_errors = []
        for res in resources:
            if duration_hours < Decimal(str(res.min_booking_duration_hours)):
                duration_errors.append(f'{res.name}: minimum {res.min_booking_duration_hours} hour(s)')
            if duration_hours > Decimal(str(res.max_booking_duration_hours)):
                duration_errors.append(f'{res.name}: maximum {res.max_booking_duration_hours} hour(s)')
        if duration_errors:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'duration': duration_errors})

        # Validate Dependencies
        selected_ids = {res.id for res in resources}
        for res in resources:
            for dep in res.dependencies.all():
                if dep.requires.id not in selected_ids:
                    from rest_framework.exceptions import ValidationError
                    raise ValidationError({'resources': f'{res.name} requires {dep.requires.name} to be booked together.'})

        all_available, details = _availability_for_resources(prop, [res.id for res in resources], start_dt, end_dt)
        if not all_available:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'availability': details})

        pricing = _calculate_booking_price(resources, start_dt, end_dt, serializer.validated_data.get('extra_charges', 0))
        
        payment_ref = serializer.validated_data.get('payment_reference')
        payment_screen = serializer.validated_data.get('payment_screenshot')
        payment_method_val = serializer.validated_data.get('payment_method')
        
        has_payment = bool(payment_ref or payment_screen)
        payment_status_value = 'Under Review' if has_payment else 'Pending'
        
        if prop.approval_required or payment_method_val == 'Cash':
            status_value = 'Pending Approval'
        else:
            status_value = 'Pending Approval' if has_payment else 'Pending Payment'

        if member:
            booking = serializer.save(
                member=member,
                status=status_value,
                payment_status=payment_status_value,
                base_amount=pricing['subtotal'],
                extra_charges=pricing['extra_charges'],
                tax_amount=pricing['tax'],
                deposit_amount=pricing['deposit'],
                total_amount=pricing['grand_total'],
                pricing_breakdown=pricing,
            )
        else:
            booking = serializer.save(
                status=status_value,
                payment_status=payment_status_value,
                base_amount=pricing['subtotal'],
                extra_charges=pricing['extra_charges'],
                tax_amount=pricing['tax'],
                deposit_amount=pricing['deposit'],
                total_amount=pricing['grand_total'],
                pricing_breakdown=pricing,
            )
        admins = User.objects.filter(member_profile__community=prop.community, member_profile__role='community_admin')
        for admin in admins:
            _notify_user(admin, 'Booking Created', f'{booking.booking_number} was created for {prop.name}.', 'booking_created')

    def perform_update(self, serializer):
        instance = self.get_object()
        prop = serializer.validated_data.get('property', instance.property)
        if prop and prop.status != 'Approved':
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'property': 'Only approved properties can be booked.'})
        
        resources = serializer.validated_data.get('resources')
        if resources is not None:
            resources = list(resources)
        else:
            resources = list(instance.resources.all())
            
        if not resources:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'resources': 'Select at least one resource.'})
            
        if any(res.property_id != prop.id or res.status != 'Active' for res in resources):
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'resources': 'All selected resources must be active and belong to the selected property.'})

        start_date = serializer.validated_data.get('start_date', instance.start_date)
        end_date = serializer.validated_data.get('end_date', instance.end_date)
        start_time = serializer.validated_data.get('start_time', instance.start_time)
        end_time = serializer.validated_data.get('end_time', instance.end_time)
        
        start_dt, end_dt = _booking_window(start_date, end_date, start_time, end_time)
        if end_dt <= start_dt:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'end_time': 'End time must be after start time.'})

        duration_hours = Decimal(str((end_dt - start_dt).total_seconds() / 3600))
        duration_errors = []
        for res in resources:
            if duration_hours < Decimal(str(res.min_booking_duration_hours)):
                duration_errors.append(f'{res.name}: minimum {res.min_booking_duration_hours} hour(s)')
            if duration_hours > Decimal(str(res.max_booking_duration_hours)):
                duration_errors.append(f'{res.name}: maximum {res.max_booking_duration_hours} hour(s)')
        if duration_errors:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'duration': duration_errors})

        # Validate Dependencies
        selected_ids = {res.id for res in resources}
        for res in resources:
            for dep in res.dependencies.all():
                if dep.requires.id not in selected_ids:
                    from rest_framework.exceptions import ValidationError
                    raise ValidationError({'resources': f'{res.name} requires {dep.requires.name} to be booked together.'})

        # Availability/Conflict checks (excluding current booking)
        all_available, details = _availability_for_resources(prop, [res.id for res in resources], start_dt, end_dt, exclude_booking_id=instance.id)
        if not all_available:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'availability': details})

        extra_charges = serializer.validated_data.get('extra_charges', instance.extra_charges)
        pricing = _calculate_booking_price(resources, start_dt, end_dt, extra_charges)
        
        serializer.save(
            base_amount=pricing['subtotal'],
            extra_charges=pricing['extra_charges'],
            tax_amount=pricing['tax'],
            deposit_amount=pricing['deposit'],
            total_amount=pricing['grand_total'],
            pricing_breakdown=pricing,
        )

    @action(detail=True, methods=['post'])
    def approve_booking(self, request, pk=None):
        booking = self.get_object()
        if not self._is_admin_for_booking(booking):
            return Response({'error': 'Only community admins can approve bookings.'}, status=403)
        if booking.status != 'Pending Approval':
            return Response({'error': 'Only pending approval bookings can be approved.'}, status=400)
        booking.status = 'Pending Payment'
        booking.save()
        _notify_user(booking.member.user if booking.member and booking.member.user else None, 'Booking Approved', f'{booking.booking_number} is approved. Please submit payment.', 'booking_approved')
        return Response(self.get_serializer(booking).data)

    @action(detail=True, methods=['post'])
    def reject_booking(self, request, pk=None):
        booking = self.get_object()
        if not self._is_admin_for_booking(booking):
            return Response({'error': 'Only community admins can reject bookings.'}, status=403)
        booking.status = 'Rejected'
        booking.save()
        _notify_user(booking.member.user if booking.member and booking.member.user else None, 'Booking Rejected', f'{booking.booking_number} was rejected.', 'booking_rejected')
        return Response(self.get_serializer(booking).data)

    @action(detail=True, methods=['post'])
    def submit_payment(self, request, pk=None):
        booking = self.get_object()
        member = self._member()
        if booking.member_id != getattr(member, 'id', None):
            return Response({'error': 'You can submit payment only for your booking.'}, status=403)
        if booking.status != 'Pending Payment':
            return Response({'error': 'Payment can be submitted only after booking approval.'}, status=400)
        payment_method = request.data.get('payment_method')
        if payment_method not in ['Cash', 'UPI', 'Bank Transfer']:
            return Response({'payment_method': 'Payment method must be Cash, UPI, or Bank Transfer.'}, status=400)
        payment_reference = str(request.data.get('payment_reference', '')).strip()
        if payment_method != 'Cash' and not payment_reference:
            return Response({'payment_reference': 'Transaction ID is required for UPI and Bank Transfer.'}, status=400)
        booking.payment_method = payment_method
        booking.payment_reference = payment_reference
        if 'payment_screenshot' in request.FILES:
            booking.payment_screenshot = request.FILES['payment_screenshot']
        booking.payment_status = 'Under Review'
        booking.save()
        admins = User.objects.filter(member_profile__community=booking.property.community, member_profile__role='community_admin')
        for admin in admins:
            _notify_user(admin, 'Payment Submitted', f'Payment for {booking.booking_number} is ready for verification.', 'payment_submitted')
        return Response(self.get_serializer(booking).data)

    @action(detail=True, methods=['post'])
    def verify_payment(self, request, pk=None):
        booking = self.get_object()
        if not self._is_admin_for_booking(booking):
            return Response({'error': 'Only community admins can verify payments.'}, status=403)
        booking.payment_status = 'Paid'
        booking.status = 'Confirmed'
        booking.payment_verified_by = request.user
        if not booking.receipt_number:
            booking.receipt_number = f"REC-{booking.booking_number.replace('BK-', '')}"
        booking.save()
        _notify_user(booking.member.user if booking.member and booking.member.user else None, 'Payment Verified', f'Payment for {booking.booking_number} is verified.', 'payment_verified')
        return Response(self.get_serializer(booking).data)

    @action(detail=True, methods=['post'])
    def reject_payment(self, request, pk=None):
        booking = self.get_object()
        if not self._is_admin_for_booking(booking):
            return Response({'error': 'Only community admins can reject payments.'}, status=403)
        booking.payment_status = 'Rejected'
        booking.status = 'Pending Payment'
        booking.save()
        _notify_user(booking.member.user if booking.member and booking.member.user else None, 'Payment Rejected', f'Payment for {booking.booking_number} was rejected. Please submit again.', 'payment_rejected')
        return Response(self.get_serializer(booking).data)

    @action(detail=True, methods=['post'])
    def check_in(self, request, pk=None):
        booking = self.get_object()
        from django.utils import timezone
        booking.checked_in_at = timezone.now()
        booking.status = 'Checked In'
        booking.save()
        return Response({'status': 'Checked in successfully.'})

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        booking = self.get_object()
        if not self._is_admin_for_booking(booking):
            return Response({'error': 'Only community admins can complete bookings.'}, status=403)
        booking.status = 'Completed'
        booking.save()
        return Response({'status': 'Event completed.'})

    @action(detail=True, methods=['post'])
    def request_cancellation(self, request, pk=None):
        booking = self.get_object()
        if booking.status in ['Cancelled', 'Completed']:
            return Response({'error': 'Booking cannot be cancelled.'}, status=400)
        
        event_start_dt = timezone.make_aware(datetime.datetime.combine(booking.start_date, booking.start_time))
        now = timezone.now()
        
        hours_before = (event_start_dt - now).total_seconds() / 3600.0
        prop = booking.property
        
        refund_amount = 0.0
        refund_pct = 0.0
        if prop.cancellation_allowed:
            tiers = prop.refund_policy_tiers or []
            matched = False
            for tier in sorted(tiers, key=lambda item: float(item.get('hours', 0)), reverse=True):
                if hours_before >= float(tier.get('hours', 0)):
                    refund_pct = float(tier.get('percentage', 0))
                    matched = True
                    break
            if not matched and hours_before >= prop.cancellation_hours:
                refund_pct = float(prop.refund_percentage)
            refund_amount = float(booking.total_amount) * (refund_pct / 100.0)
            
        booking.status = 'Refund Requested' if refund_amount > 0 else 'Cancelled'
        booking.save()
        
        if refund_amount > 0:
            BookingRefund.objects.create(
                booking=booking,
                amount=refund_amount,
                reason=request.data.get('reason', 'User requested cancellation'),
                refund_percentage=refund_pct,
                status='Requested'
            )
            admins = User.objects.filter(member_profile__community=booking.property.community, member_profile__role='community_admin')
            for admin in admins:
                _notify_user(admin, 'Refund Requested', f'Refund request created for {booking.booking_number}.', 'refund_requested')
        else:
            _notify_user(booking.member.user if booking.member and booking.member.user else None, 'Booking Cancelled', f'{booking.booking_number} was cancelled.', 'booking_cancelled')
            
        return Response({
            'status': 'Refund Requested' if refund_amount > 0 else 'Cancelled',
            'refund_amount': refund_amount,
            'refund_pct': refund_pct
        })

    @action(detail=True, methods=['get'])
    def invoice_pdf(self, request, pk=None):
        booking = self.get_object()
        lines = [
            'We Are Going - Booking Invoice',
            f'Booking Number: {booking.booking_number}',
            f'Invoice Number: {booking.invoice_number}',
            f'Receipt Number: {booking.receipt_number or "Pending"}',
            f'Property: {booking.property.name}',
            f'Member: {booking.member.name if booking.member else booking.guest_name}',
            f'Date: {booking.start_date} to {booking.end_date}',
            f'Time: {booking.start_time} - {booking.end_time}',
            'Resources: ' + ', '.join([res.name for res in booking.resources.all()]),
            f'Subtotal: INR {booking.base_amount}',
            f'Extra Charges: INR {booking.extra_charges}',
            f'Deposit: INR {booking.deposit_amount}',
            f'Tax: INR {booking.tax_amount}',
            f'Total Amount: INR {booking.total_amount}',
        ]
        text = '\\n'.join(lines)
        stream = 'BT /F1 12 Tf 50 780 Td ' + ' T* '.join(f'({line})' for line in lines) + ' ET'
        stream_bytes = stream.encode('latin-1', errors='replace')
        pdf = (
            b'%PDF-1.4\n'
            b'1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n'
            b'2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n'
            b'3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n'
            b'4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n'
            + f'5 0 obj << /Length {len(stream_bytes)} >> stream\n'.encode('ascii')
            + stream_bytes
            + b'\nendstream endobj\ntrailer << /Root 1 0 R >>\n%%EOF'
        )
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{booking.invoice_number or booking.booking_number}.pdf"'
        return response

class BookingInspectionViewSet(viewsets.ModelViewSet):
    serializer_class = BookingInspectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        member = Member.objects.filter(user=user).first()
        if user.is_superuser or (member and member.role == 'super_admin'):
            return BookingInspection.objects.all()
        if member and member.role == 'community_admin':
            return BookingInspection.objects.filter(booking__property__community=member.community)
        if member:
            return BookingInspection.objects.filter(booking__member=member)
        return BookingInspection.objects.none()

class BookingRefundViewSet(viewsets.ModelViewSet):
    serializer_class = BookingRefundSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        member = Member.objects.filter(user=user).first()
        if user.is_superuser or (member and member.role == 'super_admin'):
            return BookingRefund.objects.all()
        if member and member.role == 'community_admin':
            return BookingRefund.objects.filter(booking__property__community=member.community)
        if member:
            return BookingRefund.objects.filter(booking__member=member)
        return BookingRefund.objects.none()

class BookingWaitingListViewSet(viewsets.ModelViewSet):
    serializer_class = BookingWaitingListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        member = Member.objects.filter(user=user).first()
        if user.is_superuser or (member and member.role == 'super_admin'):
            return BookingWaitingList.objects.all()
        if member and member.role == 'community_admin':
            return BookingWaitingList.objects.filter(property__community=member.community)
        if member:
            return BookingWaitingList.objects.filter(member=member)
        return BookingWaitingList.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        member = Member.objects.filter(user=user).first()
        if member:
            serializer.save(member=member)
        else:
            serializer.save()

class ResourceLockViewSet(viewsets.ModelViewSet):
    serializer_class = ResourceLockSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        member = Member.objects.filter(user=user).first()
        if user.is_superuser or (member and member.role == 'super_admin'):
            return ResourceLock.objects.all()
        if member and member.role == 'community_admin':
            return ResourceLock.objects.filter(resource__property__community=member.community)
        if member:
            return ResourceLock.objects.filter(user=user, resource__property__community=member.community)
        return ResourceLock.objects.none()

    def create(self, request, *args, **kwargs):
        resource_id = request.data.get('resource')
        start_time_str = request.data.get('start_time')
        end_time_str = request.data.get('end_time')
        
        import datetime
        from django.utils import timezone
        
        try:
            start_time = timezone.make_aware(datetime.datetime.strptime(start_time_str, '%Y-%m-%dT%H:%M:%S'))
            end_time = timezone.make_aware(datetime.datetime.strptime(end_time_str, '%Y-%m-%dT%H:%M:%S'))
        except Exception:
            try:
                start_time = timezone.make_aware(datetime.datetime.strptime(start_time_str, '%Y-%m-%d %H:%M:%S'))
                end_time = timezone.make_aware(datetime.datetime.strptime(end_time_str, '%Y-%m-%d %H:%M:%S'))
            except Exception:
                try:
                    s_date = datetime.datetime.strptime(start_time_str[:10], '%Y-%m-%d')
                    e_date = datetime.datetime.strptime(end_time_str[:10], '%Y-%m-%d')
                    start_time = timezone.make_aware(datetime.datetime.combine(s_date, datetime.time(9, 0)))
                    end_time = timezone.make_aware(datetime.datetime.combine(e_date, datetime.time(17, 0)))
                except Exception:
                    return Response({'error': 'Invalid date format'}, status=400)
                
        conflicting_locks = ResourceLock.objects.filter(
            resource_id=resource_id,
            expires_at__gt=timezone.now(),
            start_time__lt=end_time,
            end_time__gt=start_time
        )
        if conflicting_locks.exists():
            return Response({'error': 'Resource is temporarily locked by another user.'}, status=400)
            
        expires_at = timezone.now() + datetime.timedelta(minutes=10)
        lock = ResourceLock.objects.create(
            resource_id=resource_id,
            user=request.user,
            start_time=start_time,
            end_time=end_time,
            expires_at=expires_at
        )
        serializer = self.get_serializer(lock)
        return Response(serializer.data, status=201)
