import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import Member, BookingProperty, PropertyResource, VenueBooking
from api.serializers import VenueBookingSerializer

User = get_user_model()

# Let's get a user and their member profile
user = User.objects.filter(member_profile__isnull=False).first()
if not user:
    user = User.objects.first()

member = getattr(user, 'member_profile', None)
print(f"Using User: {user.username}, Member: {member.name if member else 'None'}")

# Let's get a property and resource
prop = BookingProperty.objects.first()
if not prop:
    print("No BookingProperty found!")
    exit(1)

res = PropertyResource.objects.filter(property=prop).first()
if not res:
    print(f"No PropertyResource found for property {prop.name}!")
    exit(1)

print(f"Using Property: {prop.name} (ID: {prop.id}, Status: {prop.status})")
print(f"Using Resource: {res.name} (ID: {res.id}, Status: {res.status})")

# Let's construct a payload similar to the front-end submission
payload = {
    "property": prop.id,
    "resources": [res.id],
    "event_name": "Wedding Reception",
    "event_type": "Wedding",
    "purpose": "Wedding Reception",
    "expected_guests": 100,
    "start_date": "2025-05-20",
    "end_date": "2025-05-21",
    "start_time": "09:00:00",
    "end_time": "17:00:00",
}

print("Validating payload...")
serializer = VenueBookingSerializer(data=payload)
if serializer.is_valid():
    print("Serializer is VALID! Trying perform_create logic...")
    try:
        # Simulate perform_create
        validated_data = serializer.validated_data
        resources_list = list(validated_data.get('resources') or [])
        print(f"Validated resources: {resources_list}")
        
        # Let's run the exact logic from perform_create
        start_date = validated_data.get('start_date')
        end_date = validated_data.get('end_date')
        start_time = validated_data.get('start_time')
        end_time = validated_data.get('end_time')
        
        from api.views import _booking_window, _availability_for_resources, _calculate_booking_price
        start_dt, end_dt = _booking_window(start_date, end_date, start_time, end_time)
        print(f"Booking Window: {start_dt} to {end_dt}")
        
        all_available, details = _availability_for_resources(prop, [r.id for r in resources_list], start_dt, end_dt)
        print(f"Availability check: available={all_available}, details={details}")
        
        pricing = _calculate_booking_price(resources_list, start_dt, end_dt, validated_data.get('extra_charges', 0))
        print(f"Pricing breakdown: {pricing}")
        
        status_value = 'Pending Approval' if prop.approval_required else 'Pending Payment'
        print(f"Calculated status: {status_value}")
        
        # Save it
        booking = serializer.save(
            member=member,
            status=status_value,
            payment_status='Pending',
            base_amount=pricing['subtotal'],
            extra_charges=pricing['extra_charges'],
            tax_amount=pricing['tax'],
            deposit_amount=pricing['deposit'],
            total_amount=pricing['grand_total'],
            pricing_breakdown=pricing,
        )
        print(f"Booking saved successfully! Booking ID: {booking.booking_number}")
    except Exception as e:
        import traceback
        print("Exception during perform_create:")
        traceback.print_exc()
else:
    print(f"Serializer errors: {serializer.errors}")
