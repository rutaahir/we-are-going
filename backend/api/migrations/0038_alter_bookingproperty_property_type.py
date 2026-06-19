# Generated for property management approval workflow alignment

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0037_bookingproperty_alternate_phone_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='bookingproperty',
            name='property_type',
            field=models.CharField(
                choices=[
                    ('Marriage Hall', 'Marriage Hall'),
                    ('Community Hall', 'Community Hall'),
                    ('Guest House', 'Guest House'),
                    ('Dharamshala', 'Dharamshala'),
                    ('Rooms', 'Rooms'),
                    ('Parking', 'Parking'),
                    ('Kitchen', 'Kitchen'),
                    ('Conference Hall', 'Conference Hall'),
                    ('Garden', 'Garden'),
                    ('Community Center', 'Community Center'),
                    ('Clubhouse', 'Clubhouse'),
                    ('Other', 'Other'),
                ],
                default='Community Center',
                max_length=50,
            ),
        ),
    ]
