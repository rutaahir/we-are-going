from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CustomTokenObtainPairView, RegisterView, MeView,
    CommunityViewSet, MemberViewSet, CommitteeViewSet, EventViewSet,
    JobViewSet, BusinessViewSet, MatrimonyProfileViewSet, CampaignViewSet,
    DonationViewSet, NewsViewSet, FamilyViewSet, FamilyMemberViewSet,
    EventRegistrationViewSet, NotificationViewSet, CommunityApprovalHistoryViewSet
)
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'communities', CommunityViewSet, basename='community')
router.register(r'members', MemberViewSet, basename='member')
router.register(r'committee', CommitteeViewSet, basename='committee')
router.register(r'events', EventViewSet, basename='event')
router.register(r'jobs', JobViewSet, basename='job')
router.register(r'businesses', BusinessViewSet, basename='business')
router.register(r'matrimony', MatrimonyProfileViewSet, basename='matrimony')
router.register(r'campaigns', CampaignViewSet, basename='campaign')
router.register(r'donations', DonationViewSet, basename='donation')
router.register(r'news', NewsViewSet, basename='news')
router.register(r'families', FamilyViewSet, basename='family')
router.register(r'family-members', FamilyMemberViewSet, basename='family-member')
router.register(r'event-registrations', EventRegistrationViewSet, basename='event-registration')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'approval-history', CommunityApprovalHistoryViewSet, basename='approval-history')

urlpatterns = [
    # Router endpoints
    path('', include(router.urls)),
    
    # Auth endpoints
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/me/', MeView.as_view(), name='auth_me'),
]
