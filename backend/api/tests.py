from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import Community, MatrimonyProfile, Member, PartnerPreference


@override_settings(MATCHING_MODE='OPEN_TEST')
class MatrimonyOpenTestingModeTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.community = Community.objects.create(name='Main Community', status='Approved')
        self.user = User.objects.create_user(username='requester', password='pass')
        Member.objects.create(
            user=self.user,
            name='Requester Member',
            age=27,
            gender='Female',
            email='requester@example.com',
            phone='9999999999',
            village='Rajkot',
            profession='Manager',
            education='MBA',
            community=self.community,
            status='Active',
        )
        self.client.force_authenticate(self.user)

        self.my_profile = self._profile(
            user=self.user,
            name='Requester',
            gender='Bride',
            age=27,
            caste='Patel',
            sub_caste='Leuva',
            state='Gujarat',
            city='Rajkot',
            education='MBA',
            profession='Manager',
        )
        PartnerPreference.objects.create(
            profile=self.my_profile,
            gender='Groom',
            min_age=25,
            max_age=32,
            caste='Patel',
            sub_caste='Leuva',
            state='Gujarat',
            education='MBA',
            marital_status='Never Married',
        )

    def _profile(self, **overrides):
        data = {
            'name': 'Candidate',
            'gender': 'Groom',
            'age': 29,
            'marital_status': 'Never Married',
            'education': 'MBA Finance',
            'profession': 'Manager',
            'income': '10 LPA',
            'caste': 'Patel',
            'sub_caste': 'Leuva',
            'state': 'Gujarat',
            'city': 'Rajkot',
            'country': 'India',
            'community': self.community,
            'visibility_type': 'PLATFORM_WIDE',
            'is_verified': True,
        }
        data.update(overrides)
        profile = MatrimonyProfile.objects.create(**data)
        MatrimonyProfile.objects.filter(pk=profile.pk).update(status='Active', is_verified=True)
        profile.refresh_from_db()
        return profile

    def _set_preference(self, profile, **overrides):
        data = {
            'gender': 'Bride',
            'min_age': 24,
            'max_age': 30,
            'caste': 'Patel',
            'state': 'Gujarat',
            'education': 'MBA',
            'marital_status': 'Never Married',
        }
        data.update(overrides)
        return PartnerPreference.objects.create(profile=profile, **data)

    def _matches(self):
        response = self.client.get('/api/matrimony-profiles/matches/')
        self.assertEqual(response.status_code, 200)
        return response.json()

    def test_open_testing_returns_all_other_eligible_profiles(self):
        private_profile = self._profile(name='Private Match', visibility_type='PRIVATE')
        self._set_preference(private_profile, caste='Shah')

        custom_audience_profile = self._profile(
            name='Custom Audience Match',
            visibility_type='CUSTOM_AUDIENCE',
            target_castes='Shah',
            gender='Bride',
        )
        self._set_preference(custom_audience_profile, gender='Groom', caste='Shah')

        result_ids = {item['id'] for item in self._matches()}

        self.assertIn(private_profile.id, result_ids)
        self.assertIn(custom_audience_profile.id, result_ids)
        self.assertNotIn(self.my_profile.id, result_ids)

    def test_open_testing_only_excludes_deleted_suspended_and_same_user_profiles(self):
        approved = self._profile(name='Approved Match')
        unapproved = self._profile(name='Unapproved Match')
        hidden = self._profile(name='Hidden Match')
        suspended = self._profile(name='Suspended Match')
        deleted = self._profile(name='Deleted Match')
        same_user_other_profile = self._profile(user=self.user, name='Same User Family Profile')

        MatrimonyProfile.objects.filter(pk=unapproved.pk).update(is_verified=False)
        MatrimonyProfile.objects.filter(pk=hidden.pk).update(status='Hidden')
        MatrimonyProfile.objects.filter(pk=suspended.pk).update(status='Suspended')
        MatrimonyProfile.objects.filter(pk=deleted.pk).update(deleted_at='2026-06-11T00:00:00Z')

        result_ids = {item['id'] for item in self._matches()}

        self.assertIn(approved.id, result_ids)
        self.assertIn(unapproved.id, result_ids)
        self.assertIn(hidden.id, result_ids)
        self.assertNotIn(suspended.id, result_ids)
        self.assertNotIn(deleted.id, result_ids)
        self.assertNotIn(same_user_other_profile.id, result_ids)

    def test_profile_creation_auto_activates_and_approves_in_open_testing(self):
        new_user = User.objects.create_user(username='new-member', password='pass')
        Member.objects.create(
            user=new_user,
            name='New Member',
            age=30,
            gender='Male',
            email='new@example.com',
            phone='8888888888',
            village='Rajkot',
            profession='Engineer',
            education='BE',
            community=self.community,
            status='Active',
        )
        self.client.force_authenticate(new_user)

        response = self.client.post('/api/matrimony-profiles/my-profile/', {
            'relationship': 'Self',
            'gender': 'Groom',
            'education': 'BE',
            'profession': 'Engineer',
            'marital_status': 'Never Married',
        })

        self.assertEqual(response.status_code, 201)
        created = MatrimonyProfile.objects.get(user=new_user)
        self.assertEqual(created.status, 'Active')
        self.assertTrue(created.is_verified)


class MessageTests(TestCase):
    def setUp(self):
        from django.contrib.auth.models import User
        from .models import Community, Member, Conversation, Message
        self.client = APIClient()
        self.community = Community.objects.create(name='Main Community', status='Approved')
        
        # Create user 1 and member 1
        self.user1 = User.objects.create_user(username='user1', password='pass1')
        self.member1 = Member.objects.create(
            user=self.user1,
            name='Member One',
            age=25,
            gender='Male',
            email='m1@example.com',
            phone='9999999991',
            village='Rajkot',
            profession='Developer',
            education='BTech',
            community=self.community,
            status='Active'
        )
        
        # Create user 2 and member 2
        self.user2 = User.objects.create_user(username='user2', password='pass2')
        self.member2 = Member.objects.create(
            user=self.user2,
            name='Member Two',
            age=24,
            gender='Female',
            email='m2@example.com',
            phone='9999999992',
            village='Rajkot',
            profession='Designer',
            education='BFA',
            community=self.community,
            status='Active'
        )

        # Create a conversation
        self.conversation = Conversation.objects.create(
            participant_1=self.member1,
            participant_2=self.member2
        )
        
        # Create a base message
        self.message = Message.objects.create(
            conversation=self.conversation,
            sender=self.member1,
            content='Hello there!'
        )

    def test_create_reply_message(self):
        self.client.force_authenticate(self.user2)
        response = self.client.post('/api/messages/', {
            'conversation': self.conversation.id,
            'content': 'General Kenobi!',
            'reply_to_id': self.message.id
        })
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data['reply_to'], self.message.id)
        self.assertIsNotNone(data['reply_to_details'])
        self.assertEqual(data['reply_to_details']['content'], 'Hello there!')
        self.assertEqual(data['reply_to_details']['sender_name'], 'Member One')

    def test_message_reactions(self):
        self.client.force_authenticate(self.user2)
        
        # React with 👍
        response = self.client.post(f'/api/messages/{self.message.id}/react/', {
            'emoji': '👍'
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data['reactions']), 1)
        self.assertEqual(data['reactions'][0]['emoji'], '👍')
        self.assertEqual(data['reactions'][0]['member_name'], 'Member Two')
        
        # Toggle reaction to ❤️
        response = self.client.post(f'/api/messages/{self.message.id}/react/', {
            'emoji': '❤️'
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data['reactions']), 1)
        self.assertEqual(data['reactions'][0]['emoji'], '❤️')
        
        # Toggle same reaction to remove it
        response = self.client.post(f'/api/messages/{self.message.id}/react/', {
            'emoji': '❤️'
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data['reactions']), 0)
