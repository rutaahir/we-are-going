import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Community, BookingProperty, PropertyResource, ResourcePricing, VenueBooking

def seed():
    print("Clearing existing booking properties, resources, pricing and bookings...")
    VenueBooking.objects.all().delete()
    ResourcePricing.objects.all().delete()
    PropertyResource.objects.all().delete()
    BookingProperty.objects.all().delete()

    communities = Community.objects.all()
    if not communities.exists():
        print("No communities found! Please run seed_data first.")
        return

    # Unsplash URLs for properties
    images = {
        "sunrise": [
            "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",
            "https://images.unsplash.com/photo-1519225495810-7517c29a282b?w=800&q=80"
        ],
        "shree": [
            "https://images.unsplash.com/photo-1541976844346-f18aeac57b06?w=800&q=80",
            "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80"
        ],
        "grand": [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
            "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80"
        ],
        "green": [
            "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800&q=80",
            "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80"
        ],
        "royal": [
            "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800&q=80",
            "https://images.unsplash.com/photo-1505232458627-a727264d7675?w=800&q=80"
        ],
        "city": [
            "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
            "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80"
        ]
    }

    properties_data = [
        {
            "name": "Sunrise Marriage Hall",
            "property_type": "Marriage Hall",
            "description": "Luxurious wedding venue with a grand stage, exquisite lighting, and state-of-the-art facilities for high-profile weddings.",
            "address": "Ring Road, Near Diamond Market",
            "city": "Surat",
            "state": "Gujarat",
            "pincode": "395006",
            "contact_person_name": "Ramesh Patel",
            "contact_phone": "+91 9876543210",
            "photos": images["sunrise"],
            "amenities": ["Parking", "Kitchen", "AC", "WiFi", "Valet Parking", "Stage Lighting"],
            "rating": 4.8,
            "guests": 500,
            "base_price": 15000.00,
            "resources": [
                {"name": "Main AC Banquet Hall", "type": "Main Hall", "capacity": 500, "price": 15000.00},
                {"name": "Dining Area", "type": "Kitchen", "capacity": 200, "price": 4000.00},
                {"name": "Bridal Suite", "type": "Room", "capacity": 10, "price": 2000.00}
            ]
        },
        {
            "name": "Shree Community Center",
            "property_type": "Community Center",
            "description": "A spacious community hall suitable for family events, cultural programs, and religious gatherings.",
            "address": "Adajan Pal Road",
            "city": "Surat",
            "state": "Gujarat",
            "pincode": "395009",
            "contact_person_name": "Suresh Solanki",
            "contact_phone": "+91 9988776655",
            "photos": images["shree"],
            "amenities": ["Parking", "Kitchen", "Power Backup", "Audio System"],
            "rating": 4.6,
            "guests": 300,
            "base_price": 9500.00,
            "resources": [
                {"name": "Assembly Hall", "type": "Main Hall", "capacity": 300, "price": 9500.00},
                {"name": "Catering Area", "type": "Kitchen", "capacity": 150, "price": 2500.00}
            ]
        },
        {
            "name": "The Grand Palace",
            "property_type": "Marriage Hall",
            "description": "Exquisite palace-themed banquet complex designed for royal weddings and celebrations.",
            "address": "Dumas Road",
            "city": "Surat",
            "state": "Gujarat",
            "pincode": "395007",
            "contact_person_name": "Vikram Desai",
            "contact_phone": "+91 9090909090",
            "photos": images["grand"],
            "amenities": ["Large Parking", "Professional Kitchen", "Central AC", "WiFi", "DJ Booth", "Royal Decor"],
            "rating": 4.7,
            "guests": 300,
            "base_price": 25000.00,
            "resources": [
                {"name": "Palace Lawn", "type": "Garden", "capacity": 600, "price": 25000.00},
                {"name": "Grand Ballroom", "type": "Main Hall", "capacity": 300, "price": 20000.00},
                {"name": "Gourmet Kitchen", "type": "Kitchen", "capacity": 250, "price": 5000.00},
                {"name": "VIP Lounge", "type": "Room", "capacity": 20, "price": 3000.00}
            ]
        },
        {
            "name": "Green Garden Resort",
            "property_type": "Other",
            "description": "Lush green open lawns and swimming pool resort perfect for reception parties and open-air ceremonies.",
            "address": "VIP Road, Vesu",
            "city": "Surat",
            "state": "Gujarat",
            "pincode": "395007",
            "contact_person_name": "Hardik Mehta",
            "contact_phone": "+91 9727297272",
            "photos": images["green"],
            "amenities": ["Swimming Pool", "Lush Lawn", "Catering Space", "Changing Rooms"],
            "rating": 4.5,
            "guests": 200,
            "base_price": 7500.00,
            "resources": [
                {"name": "Main Lawn", "type": "Garden", "capacity": 200, "price": 7500.00},
                {"name": "Poolside Deck", "type": "Garden", "capacity": 100, "price": 4000.00}
            ]
        },
        {
            "name": "Royal Banquet Hall",
            "property_type": "Marriage Hall",
            "description": "Elegant indoor banquet hall offering premium seating, lighting and catering services.",
            "address": "Varachha Road",
            "city": "Surat",
            "state": "Gujarat",
            "pincode": "395006",
            "contact_person_name": "Amit Shah",
            "contact_phone": "+91 9123456789",
            "photos": images["royal"],
            "amenities": ["AC", "Stage Decor", "Sound System", "Parking"],
            "rating": 4.4,
            "guests": 400,
            "base_price": 12000.00,
            "resources": [
                {"name": "Royal Hall A", "type": "Main Hall", "capacity": 400, "price": 12000.00},
                {"name": "Royal Hall B", "type": "Main Hall", "capacity": 200, "price": 8000.00},
                {"name": "Kitchen Facility", "type": "Kitchen", "capacity": 150, "price": 3000.00}
            ]
        },
        {
            "name": "City View Hall",
            "property_type": "Clubhouse",
            "description": "Stunning rooftop venue overlooking the city skyline, ideal for intimate parties and conferences.",
            "address": "Ghod Dod Road",
            "city": "Surat",
            "state": "Gujarat",
            "pincode": "395001",
            "contact_person_name": "Sneha Vyas",
            "contact_phone": "+91 9898989898",
            "photos": images["city"],
            "amenities": ["Rooftop View", "Elevator", "AC", "WiFi"],
            "rating": 4.3,
            "guests": 150,
            "base_price": 6000.00,
            "resources": [
                {"name": "Rooftop Hall", "type": "Main Hall", "capacity": 150, "price": 6000.00}
            ]
        }
    ]

    for comm in communities:
        print(f"Seeding properties for community: {comm.name}")
        for pdata in properties_data:
            prop = BookingProperty.objects.create(
                community=comm,
                name=pdata["name"],
                property_type=pdata["property_type"],
                description=pdata["description"],
                address=pdata["address"],
                city=pdata["city"],
                state=pdata["state"],
                pincode=pdata["pincode"],
                contact_person_name=pdata["contact_person_name"],
                contact_phone=pdata["contact_phone"],
                photos=pdata["photos"],
                amenities=pdata["amenities"],
                status="Active",
                ownership="Community Owned"
            )
            # Store temporary rating on description using a special tag so we can read it on frontend
            # or just write it on property description
            prop.description = f"RATING:{pdata['rating']}||CAPACITY:{pdata['guests']}||{pdata['description']}"
            prop.save()

            for rdata in pdata["resources"]:
                res = PropertyResource.objects.create(
                    property=prop,
                    name=rdata["name"],
                    resource_type=rdata["type"],
                    capacity=rdata["capacity"],
                    booking_type="Full Day",
                    status="Active"
                )
                
                # Create Resource Pricing configs
                for m_type in ['VIP', 'Verified Member', 'Non Member', 'Committee']:
                    discount_factor = 0.8 if m_type == 'VIP' else (0.9 if m_type == 'Verified Member' else (0.5 if m_type == 'Committee' else 1.0))
                    price_val = float(rdata["price"]) * discount_factor
                    ResourcePricing.objects.create(
                        resource=res,
                        member_type=m_type,
                        seasonality="Standard",
                        price=price_val
                    )
    print("Successfully seeded all venues, resources, and pricing configs!")

if __name__ == "__main__":
    seed()
