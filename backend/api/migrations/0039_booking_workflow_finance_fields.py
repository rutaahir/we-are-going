from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0038_alter_bookingproperty_property_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='bookingproperty',
            name='refund_policy_tiers',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='venuebooking',
            name='extra_charges',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=10),
        ),
        migrations.AddField(
            model_name='venuebooking',
            name='invoice_number',
            field=models.CharField(blank=True, max_length=50, unique=True),
        ),
        migrations.AddField(
            model_name='venuebooking',
            name='payment_method',
            field=models.CharField(blank=True, choices=[('Cash', 'Cash'), ('UPI', 'UPI'), ('Bank Transfer', 'Bank Transfer')], default='', max_length=50),
        ),
        migrations.AddField(
            model_name='venuebooking',
            name='pricing_breakdown',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='venuebooking',
            name='receipt_number',
            field=models.CharField(blank=True, max_length=50, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='bookingrefund',
            name='refund_percentage',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=5),
        ),
        migrations.AlterField(
            model_name='bookingrefund',
            name='status',
            field=models.CharField(choices=[('Requested', 'Requested'), ('Approved', 'Approved'), ('Rejected', 'Rejected'), ('Processed', 'Processed')], default='Requested', max_length=50),
        ),
        migrations.AlterField(
            model_name='venuebooking',
            name='payment_status',
            field=models.CharField(choices=[('Pending', 'Pending'), ('Under Review', 'Under Review'), ('Paid', 'Paid'), ('Rejected', 'Rejected'), ('Refunded', 'Refunded')], default='Pending', max_length=50),
        ),
        migrations.AlterField(
            model_name='venuebooking',
            name='status',
            field=models.CharField(choices=[('Draft', 'Draft'), ('Pending Approval', 'Pending Approval'), ('Pending Payment', 'Pending Payment'), ('Confirmed', 'Confirmed'), ('Checked In', 'Checked In'), ('Completed', 'Completed'), ('Cancelled', 'Cancelled'), ('Refund Requested', 'Refund Requested'), ('Refunded', 'Refunded'), ('Rejected', 'Rejected')], default='Pending Approval', max_length=50),
        ),
    ]
