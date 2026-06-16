from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from api.models import Event, EventRegistration
from api.emails import send_project_email

class Command(BaseCommand):
    help = 'Send event reminder emails to registered members 24 hours before the event'

    def handle(self, *args, **options):
        self.stdout.write("Running send_event_reminders command...")
        
        # Target tomorrow's date
        tomorrow = timezone.localdate() + timedelta(days=1)
        
        # Find all events happening tomorrow
        events = Event.objects.filter(date=tomorrow)
        self.stdout.write(f"Found {events.count()} events scheduled for tomorrow ({tomorrow})")
        
        sent_count = 0
        for event in events:
            registrations = EventRegistration.objects.filter(event=event)
            self.stdout.write(f"Event '{event.title}' has {registrations.count()} registrations.")
            
            for reg in registrations:
                success = send_project_email(
                    recipient=reg.email,
                    template_name='event_reminder',
                    context={
                        'member_name': reg.name,
                        'event_title': event.title,
                        'event_date': event.date.strftime('%Y-%m-%d'),
                        'event_venue': event.venue
                    },
                    trigger_event='Event Reminder'
                )
                if success:
                    sent_count += 1

        self.stdout.write(self.style.SUCCESS(f"Finished. Sent {sent_count} event reminders."))
