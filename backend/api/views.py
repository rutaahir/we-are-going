from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db.models import Q
import datetime

from .models import (
    Community, Member, Committee, Event, Job,
    Business, MatrimonyProfile, Campaign, Donation,
    News, Family, FamilyMember, EventRegistration,
    CommunityApprovalHistory, Notification
)
from .serializers import (
    CommunitySerializer, MemberSerializer, UserSerializer,
    CommitteeSerializer, EventSerializer, JobSerializer,
    BusinessSerializer, MatrimonyProfileSerializer, CampaignSerializer,
    DonationSerializer, NewsSerializer, FamilySerializer, FamilyMemberSerializer,
    EventRegistrationSerializer, CommunityApprovalHistorySerializer, NotificationSerializer
)

# ========================
# Authentication Views
# ========================

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
        user_serializer = UserSerializer(self.user, context={'request': self.context.get('request')})
        
        # Add member profile info
        try:
            member = Member.objects.get(user=self.user)
            data['member'] = {
                'id': member.id,
                'name': member.name,
                'role': member.role,
                'community_id': member.community.id if member.community else None,
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
            
            Member.objects.create(
                user=user,
                name=name,
                email=user.email or f"{user.username}@example.com",
                phone=request.data.get('phone', '+91 9999999999'),
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
                aadhaar=aadhaar,
                aadhaar_status='Pending'
            )
            
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
    permission_classes = [permissions.AllowAny]
    
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

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        
        # Extract admin fields
        admin_name = data.pop('admin_name', None)
        admin_email = data.pop('admin_email', None)
        admin_phone = data.pop('admin_phone', None)
        admin_password = data.pop('admin_password', None)
        
        # Support flat dict keys
        if not admin_name and 'admin_name' in request.data:
            admin_name = request.data.get('admin_name')
            admin_email = request.data.get('admin_email')
            admin_phone = request.data.get('admin_phone')
            admin_password = request.data.get('admin_password')

        # Clean type input
        type_val = data.get('type')
        if type_val == "Super Community":
            data['type'] = "Super"
        elif type_val == "Subsidiary Community":
            data['type'] = "Subsidiary"
            
        data['status'] = 'Pending Super Admin Approval'

        # Ensure optional fields are stored as None/NULL if empty or not provided
        optional_fields = [
            'caste', 'sub_caste', 'email', 'phone', 'est_year', 
            'registration_no', 'office_address', 'website', 
            'vision_mission', 'social_fb', 'social_tw', 'social_yt', 'doc_name',
            'logo_url', 'cover_url'
        ]
        for field in optional_fields:
            if field in data:
                val = data.get(field)
                if val == "" or val is None:
                    data[field] = None
            else:
                data[field] = None
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        community = serializer.save()
        
        if admin_email and admin_password:
            user, created = User.objects.get_or_create(
                username=admin_email,
                defaults={
                    'email': admin_email,
                    'is_active': False
                }
            )
            # Always update or set password to ensure it matches the registration form
            user.set_password(admin_password)
            user.is_active = False
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
                    'profession': 'Community Administrator',
                    'education': 'N/A',
                    'gender': 'Other'
                }
            )
            if not member_created:
                member.community = community
                member.role = 'community_admin'
                member.status = 'Pending'
                if admin_name:
                    member.name = admin_name
                if admin_phone:
                    member.phone = admin_phone
                member.save()

        CommunityApprovalHistory.objects.create(
            community=community,
            approval_level="Submission",
            status="Pending Super Admin Approval",
            remarks="Community registration submitted."
        )

        superadmins = User.objects.filter(is_superuser=True)
        for sa in superadmins:
            Notification.objects.create(
                recipient=sa,
                title="New Community Registration",
                message=f"A new community '{community.name}' has been submitted for approval.",
                notification_type="community_registration"
            )

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
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
        
        if community.type in ['Super', 'Super Community']:
            if not is_super_admin:
                return Response({'detail': 'Only Super Admins can approve Super Communities.'}, status=status.HTTP_403_FORBIDDEN)
            
            community.status = 'Approved'
            community.save()
            
            community_admins = Member.objects.filter(community=community, role='community_admin')
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
                        message=f"Congratulations! Your community '{community.name}' has been approved by the Super Admin.",
                        notification_type="approval"
                    )
            
            CommunityApprovalHistory.objects.create(
                community=community,
                approval_level="Super Admin",
                approved_by=user,
                status="Approved",
                remarks=remarks
            )
            
            return Response({'status': 'approved', 'detail': 'Super Community approved successfully.'})
            
        elif community.type in ['Subsidiary', 'Subsidiary Community']:
            if community.status == 'Pending Super Admin Approval':
                if not is_super_admin:
                    return Response({'detail': 'Only Super Admins can perform the initial approval for Subsidiary Communities.'}, status=status.HTTP_403_FORBIDDEN)
                
                community.status = 'Pending Parent Community Approval'
                community.save()
                
                CommunityApprovalHistory.objects.create(
                    community=community,
                    approval_level="Super Admin",
                    approved_by=user,
                    status="Pending Parent Community Approval",
                    remarks=remarks
                )
                
                community_admins = Member.objects.filter(community=community, role='community_admin')
                for admin_member in community_admins:
                    if admin_member.user:
                        Notification.objects.create(
                            recipient=admin_member.user,
                            title="Super Admin Approved",
                            message=f"Your subsidiary community '{community.name}' has been approved by the Super Admin. It is now forwarded to your Parent Community '{community.parent.name if community.parent else 'N/A'}' for final approval.",
                            notification_type="approval"
                        )
                
                if community.parent:
                    parent_admins = Member.objects.filter(community=community.parent, role='community_admin')
                    for pa in parent_admins:
                        if pa.user:
                            Notification.objects.create(
                                recipient=pa.user,
                                title="Subsidiary Approval Required",
                                message=f"A new subsidiary community '{community.name}' is pending your approval.",
                                notification_type="community_registration"
                            )
                            
                return Response({'status': 'pending_parent_approval', 'detail': 'Subsidiary Community approved by Super Admin. Pending Parent Community approval.'})
                
            elif community.status == 'Pending Parent Community Approval':
                if not community.parent:
                    return Response({'detail': 'This subsidiary has no parent community assigned.'}, status=status.HTTP_400_BAD_REQUEST)
                
                is_parent_admin = False
                if member and member.role == 'community_admin' and member.community == community.parent:
                    is_parent_admin = True
                if is_super_admin:
                    is_parent_admin = True
                    
                if not is_parent_admin:
                    return Response({'detail': 'Only Parent Community Admin or Super Admin can approve this request.'}, status=status.HTTP_403_FORBIDDEN)
                
                community.status = 'Active'
                community.save()
                
                community_admins = Member.objects.filter(community=community, role='community_admin')
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
                            message=f"Congratulations! Your subsidiary community '{community.name}' has been activated by the Parent Community Admin.",
                            notification_type="approval"
                        )
                
                CommunityApprovalHistory.objects.create(
                    community=community,
                    approval_level="Parent Community Admin",
                    approved_by=user,
                    status="Active",
                    remarks=remarks
                )
                
                return Response({'status': 'active', 'detail': 'Subsidiary Community approved and activated.'})
            else:
                return Response({'detail': f'Community is not in an approvable status (Current status: {community.status}).'}, status=status.HTTP_400_BAD_REQUEST)
                
        return Response({'detail': 'Unknown community type.'}, status=status.HTTP_400_BAD_REQUEST)

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
            
        if community.type in ['Super', 'Super Community']:
            if not is_super_admin:
                return Response({'detail': 'Only Super Admins can reject Super Communities.'}, status=status.HTTP_403_FORBIDDEN)
            
            community.status = 'Rejected By Super Admin'
            community.save()
            
            CommunityApprovalHistory.objects.create(
                community=community,
                approval_level="Super Admin",
                approved_by=user,
                status="Rejected By Super Admin",
                remarks=remarks
            )
            
            community_admins = Member.objects.filter(community=community, role='community_admin')
            for admin_member in community_admins:
                admin_member.status = 'Inactive'
                admin_member.save()
                if admin_member.user:
                    admin_member.user.is_active = False
                    admin_member.user.save()
                    Notification.objects.create(
                        recipient=admin_member.user,
                        title="Community Registration Rejected",
                        message=f"Your community registration for '{community.name}' was rejected by the Super Admin. Reason: {remarks}",
                        notification_type="rejection"
                    )
            
            return Response({'status': 'rejected', 'detail': 'Super Community rejected.'})
            
        elif community.type in ['Subsidiary', 'Subsidiary Community']:
            if community.status == 'Pending Super Admin Approval':
                if not is_super_admin:
                    return Response({'detail': 'Only Super Admins can reject Subsidiary Communities at this stage.'}, status=status.HTTP_403_FORBIDDEN)
                
                community.status = 'Rejected By Super Admin'
                community.save()
                
                CommunityApprovalHistory.objects.create(
                    community=community,
                    approval_level="Super Admin",
                    approved_by=user,
                    status="Rejected By Super Admin",
                    remarks=remarks
                )
                
                community_admins = Member.objects.filter(community=community, role='community_admin')
                for admin_member in community_admins:
                    admin_member.status = 'Inactive'
                    admin_member.save()
                    if admin_member.user:
                        admin_member.user.is_active = False
                        admin_member.user.save()
                        Notification.objects.create(
                            recipient=admin_member.user,
                            title="Community Registration Rejected",
                            message=f"Your community registration for '{community.name}' was rejected by the Super Admin. Reason: {remarks}",
                            notification_type="rejection"
                        )
                
                return Response({'status': 'rejected', 'detail': 'Subsidiary Community rejected by Super Admin.'})
                
            elif community.status == 'Pending Parent Community Approval':
                if not community.parent:
                    return Response({'detail': 'This subsidiary has no parent community assigned.'}, status=status.HTTP_400_BAD_REQUEST)
                
                is_parent_admin = False
                if member and member.role == 'community_admin' and member.community == community.parent:
                    is_parent_admin = True
                if is_super_admin:
                    is_parent_admin = True
                    
                if not is_parent_admin:
                    return Response({'detail': 'Only Parent Community Admin or Super Admin can reject this request.'}, status=status.HTTP_403_FORBIDDEN)
                
                community.status = 'Rejected By Parent Community Admin'
                community.save()
                
                CommunityApprovalHistory.objects.create(
                    community=community,
                    approval_level="Parent Community Admin",
                    approved_by=user,
                    status="Rejected By Parent Community Admin",
                    remarks=remarks
                )
                
                community_admins = Member.objects.filter(community=community, role='community_admin')
                for admin_member in community_admins:
                    admin_member.status = 'Inactive'
                    admin_member.save()
                    if admin_member.user:
                        admin_member.user.is_active = False
                        admin_member.user.save()
                        Notification.objects.create(
                            recipient=admin_member.user,
                            title="Community Registration Rejected",
                            message=f"Your community registration for '{community.name}' was rejected by the Parent Community Admin. Reason: {remarks}",
                            notification_type="rejection"
                        )
                        
                return Response({'status': 'rejected', 'detail': 'Subsidiary Community rejected by Parent Community Admin.'})
            else:
                return Response({'detail': f'Community cannot be rejected at this stage (Current status: {community.status}).'}, status=status.HTTP_400_BAD_REQUEST)
                
        return Response({'detail': 'Unknown community type.'})

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
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Member.objects.all().order_by('-joined_date')
        community_id = self.request.query_params.get('community_id') or self.request.query_params.get('communityId')
        role = self.request.query_params.get('role')
        status = self.request.query_params.get('status')
        
        if community_id:
            queryset = queryset.filter(community_id=community_id)
        if role:
            queryset = queryset.filter(role=role)
        if status:
            queryset = queryset.filter(status=status)
            
        return queryset
    
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
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Committee.objects.all().order_by('since')
        community_id = self.request.query_params.get('community_id') or self.request.query_params.get('communityId')
        if community_id:
            queryset = queryset.filter(community_id=community_id)
        return queryset

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('-date')
    serializer_class = EventSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Event.objects.all().order_by('-date')
        community_id = self.request.query_params.get('community_id') or self.request.query_params.get('communityId')
        status = self.request.query_params.get('status')
        
        if community_id:
            queryset = queryset.filter(community_id=community_id)
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
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Job.objects.all().order_by('-posted_date')
        community_id = self.request.query_params.get('community_id') or self.request.query_params.get('communityId')
        job_type = self.request.query_params.get('type')
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        
        if community_id:
            queryset = queryset.filter(community_id=community_id)
        if job_type:
            queryset = queryset.filter(type=job_type)
        if category:
            queryset = queryset.filter(category=category)
        if search:
            queryset = queryset.filter(Q(role__icontains=search) | Q(company__icontains=search))
            
        return queryset

class BusinessViewSet(viewsets.ModelViewSet):
    queryset = Business.objects.all().order_by('-rating')
    serializer_class = BusinessSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Business.objects.all().order_by('-rating')
        community_id = self.request.query_params.get('community_id') or self.request.query_params.get('communityId')
        category = self.request.query_params.get('category')
        verified = self.request.query_params.get('verified')
        search = self.request.query_params.get('search')
        
        if community_id:
            queryset = queryset.filter(community_id=community_id)
        if category:
            queryset = queryset.filter(category=category)
        if verified:
            queryset = queryset.filter(verified=verified.lower() == 'true')
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(category__icontains=search))
            
        return queryset

class MatrimonyProfileViewSet(viewsets.ModelViewSet):
    queryset = MatrimonyProfile.objects.all().order_by('-id')
    serializer_class = MatrimonyProfileSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = MatrimonyProfile.objects.filter(status__in=['Approved', 'Featured']).order_by('-id')
        community_id = self.request.query_params.get('community_id') or self.request.query_params.get('communityId')
        gender = self.request.query_params.get('gender')
        
        if community_id:
            queryset = queryset.filter(community_id=community_id)
        if gender:
            queryset = queryset.filter(gender=gender)
            
        return queryset

class CampaignViewSet(viewsets.ModelViewSet):
    queryset = Campaign.objects.all().order_by('-id')
    serializer_class = CampaignSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Campaign.objects.all().order_by('-id')
        community_id = self.request.query_params.get('community_id') or self.request.query_params.get('communityId')
        if community_id:
            queryset = queryset.filter(community_id=community_id)
        return queryset

class DonationViewSet(viewsets.ModelViewSet):
    queryset = Donation.objects.all().order_by('-date')
    serializer_class = DonationSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Donation.objects.all().order_by('-date')
        campaign_id = self.request.query_params.get('campaign_id')
        if campaign_id:
            queryset = queryset.filter(campaign_id=campaign_id)
        return queryset

class NewsViewSet(viewsets.ModelViewSet):
    queryset = News.objects.all().order_by('-date')
    serializer_class = NewsSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = News.objects.all().order_by('-date')
        community_id = self.request.query_params.get('community_id') or self.request.query_params.get('communityId')
        category = self.request.query_params.get('category')
        
        if community_id:
            queryset = queryset.filter(community_id=community_id)
        if category:
            queryset = queryset.filter(category=category)
            
        return queryset

class FamilyViewSet(viewsets.ModelViewSet):
    queryset = Family.objects.all().order_by('-id')
    serializer_class = FamilySerializer
    permission_classes = [permissions.AllowAny]
    
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
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = FamilyMember.objects.all()
        family_id = self.request.query_params.get('family_id') or self.request.query_params.get('familyId')
        if family_id:
            queryset = queryset.filter(family_id=family_id)
        return queryset

class EventRegistrationViewSet(viewsets.ModelViewSet):
    queryset = EventRegistration.objects.all()
    serializer_class = EventRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = EventRegistration.objects.all()
        email = self.request.query_params.get('email')
        event_id = self.request.query_params.get('event_id') or self.request.query_params.get('eventId')
        if email:
            queryset = queryset.filter(email=email)
        if event_id:
            queryset = queryset.filter(event_id=event_id)
        return queryset

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
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
