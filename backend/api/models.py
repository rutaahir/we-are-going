from django.db import models
from django.contrib.auth.models import User

class Community(models.Model):
    TYPES = (
        ('Subsidiary', 'Subsidiary'),
        ('Super', 'Super'),
        ('Subsidiary Community', 'Subsidiary Community'),
        ('Super Community', 'Super Community'),
    )
    PLANS = (
        ('Free', 'Free'),
        ('Basic', 'Basic'),
        ('Pro', 'Pro'),
        ('Enterprise', 'Enterprise'),
    )
    STATUSES = (
        ('Pending Super Admin Approval', 'Pending Super Admin Approval'),
        ('Pending Parent Community Approval', 'Pending Parent Community Approval'),
        ('Approved', 'Approved'),
        ('Rejected By Super Admin', 'Rejected By Super Admin'),
        ('Rejected By Parent Community Admin', 'Rejected By Parent Community Admin'),
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
        ('Suspended', 'Suspended'),
        ('Pending', 'Pending'),
    )
    
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50, choices=TYPES, default='Super')
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subsidiaries')
    state = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    taluka = models.CharField(max_length=100)
    village = models.CharField(max_length=100)
    plan = models.CharField(max_length=50, choices=PLANS, default='Free')
    status = models.CharField(max_length=100, choices=STATUSES, default='Pending Super Admin Approval')
    logo = models.ImageField(upload_to='community_logos/', null=True, blank=True)
    logo_url = models.URLField(max_length=500, null=True, blank=True) # Fallback to unsplash URLs
    cover = models.ImageField(upload_to='community_covers/', null=True, blank=True)
    cover_url = models.URLField(max_length=500, null=True, blank=True) # Fallback to unsplash URLs
    gradient = models.CharField(max_length=100, default='from-blue-600 to-indigo-700')
    desc = models.TextField(blank=True)
    
    # Registration fields
    caste = models.CharField(max_length=100, null=True, blank=True)
    sub_caste = models.CharField(max_length=100, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=50, null=True, blank=True)
    est_year = models.IntegerField(null=True, blank=True)
    registration_no = models.CharField(max_length=100, null=True, blank=True)
    office_address = models.TextField(null=True, blank=True)
    website = models.URLField(max_length=500, null=True, blank=True)
    vision_mission = models.TextField(null=True, blank=True)
    social_fb = models.CharField(max_length=255, null=True, blank=True)
    social_tw = models.CharField(max_length=255, null=True, blank=True)
    social_yt = models.CharField(max_length=255, null=True, blank=True)
    doc_name = models.CharField(max_length=255, null=True, blank=True)
    
    def __str__(self):
        return self.name

class Member(models.Model):
    GENDERS = (
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    )
    STATUSES = (
        ('Verified', 'Verified'),
        ('Pending', 'Pending'),
        ('Rejected', 'Rejected'),
        ('Suspended', 'Suspended'),
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
    )
    ROLES = (
        ('member', 'Member'),
        ('community_admin', 'Community Admin'),
        ('super_admin', 'Super Admin'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='member_profile')
    name = models.CharField(max_length=255)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    avatar_url = models.URLField(max_length=500, null=True, blank=True)
    age = models.IntegerField(null=True, blank=True)
    birthdate = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDERS)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    village = models.CharField(max_length=100)
    taluka = models.CharField(max_length=100, default='Rajula')
    district = models.CharField(max_length=100, default='Amreli')
    state = models.CharField(max_length=100, default='Gujarat')
    profession = models.CharField(max_length=100)
    education = models.CharField(max_length=100)
    school = models.CharField(max_length=255, blank=True, null=True)
    college = models.CharField(max_length=255, blank=True, null=True)
    degree = models.CharField(max_length=255, blank=True, null=True)
    field_of_study = models.CharField(max_length=255, blank=True, null=True)
    passing_year = models.CharField(max_length=50, blank=True, null=True)
    profession_type = models.CharField(max_length=100, blank=True, null=True)
    job_title = models.CharField(max_length=255, blank=True, null=True)
    company = models.CharField(max_length=255, blank=True, null=True)
    industry = models.CharField(max_length=255, blank=True, null=True)
    salary = models.CharField(max_length=100, blank=True, null=True)
    business_name = models.CharField(max_length=255, blank=True, null=True)
    business_category = models.CharField(max_length=255, blank=True, null=True)
    gst_no = models.CharField(max_length=100, blank=True, null=True)
    business_years = models.CharField(max_length=50, blank=True, null=True)
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='members')
    status = models.CharField(max_length=50, choices=STATUSES, default='Pending')
    joined_date = models.DateField(auto_now_add=True)
    aadhaar = models.CharField(max_length=12, blank=True)
    aadhaar_status = models.CharField(max_length=50, default='Pending')
    role = models.CharField(max_length=50, choices=ROLES, default='member')
    
    def __str__(self):
        return self.name

class Committee(models.Model):
    name = models.CharField(max_length=255)
    designation = models.CharField(max_length=100)
    since = models.DateField()
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    photo = models.ImageField(upload_to='committee_photos/', null=True, blank=True)
    photo_url = models.URLField(max_length=500, null=True, blank=True)
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='committee_members')
    
    def __str__(self):
        return f"{self.name} - {self.designation} ({self.community.name})"

class Event(models.Model):
    STATUSES = (
        ('Upcoming', 'Upcoming'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    )
    
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=100)
    date = models.DateField()
    time = models.CharField(max_length=50)
    venue = models.CharField(max_length=255)
    attendees = models.IntegerField(default=0)
    max_attendees = models.IntegerField(default=500)
    status = models.CharField(max_length=50, choices=STATUSES, default='Upcoming')
    color = models.CharField(max_length=50, default='blue')
    img = models.ImageField(upload_to='events/', null=True, blank=True)
    img_url = models.URLField(max_length=500, null=True, blank=True)
    desc = models.TextField()
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='events')
    
    def __str__(self):
        return self.title

class Job(models.Model):
    TYPES = (
        ('Full-time', 'Full-time'),
        ('Part-time', 'Part-time'),
        ('Remote', 'Remote'),
        ('Contract', 'Contract'),
        ('Internship', 'Internship'),
    )
    role = models.CharField(max_length=255)
    company = models.CharField(max_length=255)
    location = models.CharField(max_length=100)
    salary = models.CharField(max_length=100)
    type = models.CharField(max_length=50, choices=TYPES, default='Full-time')
    category = models.CharField(max_length=100)
    posted_date = models.DateField(auto_now_add=True)
    logo_letter = models.CharField(max_length=2, default='J')
    applicants = models.IntegerField(default=0)
    desc = models.TextField()
    community = models.ForeignKey(Community, on_delete=models.SET_NULL, null=True, blank=True, related_name='jobs')
    
    def __str__(self):
        return f"{self.role} at {self.company}"

class Business(models.Model):
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    owner = models.CharField(max_length=255)
    location = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    rating = models.FloatField(default=0.0)
    img = models.ImageField(upload_to='businesses/', null=True, blank=True)
    img_url = models.URLField(max_length=500, null=True, blank=True)
    verified = models.BooleanField(default=False)
    desc = models.TextField()
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='businesses')
    
    def __str__(self):
        return self.name

class MatrimonyProfile(models.Model):
    GENDERS = (
        ('Bride', 'Bride'),
        ('Groom', 'Groom'),
    )
    STATUSES = (
        ('Approved', 'Approved'),
        ('Pending', 'Pending'),
        ('Featured', 'Featured'),
    )
    name = models.CharField(max_length=255)
    gender = models.CharField(max_length=10, choices=GENDERS)
    age = models.IntegerField()
    education = models.CharField(max_length=100)
    profession = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    photo = models.ImageField(upload_to='matrimony/', null=True, blank=True)
    photo_url = models.URLField(max_length=500, null=True, blank=True)
    match = models.IntegerField(default=0)
    status = models.CharField(max_length=50, choices=STATUSES, default='Pending')
    height = models.CharField(max_length=20)
    income = models.CharField(max_length=100)
    about = models.TextField()
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='matrimony_profiles')
    
    def __str__(self):
        return f"{self.name} ({self.gender})"

class Campaign(models.Model):
    title = models.CharField(max_length=255)
    goal = models.IntegerField()
    raised = models.IntegerField(default=0)
    img = models.ImageField(upload_to='campaigns/', null=True, blank=True)
    img_url = models.URLField(max_length=500, null=True, blank=True)
    desc = models.TextField()
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='campaigns')
    
    def __str__(self):
        return self.title

class Donation(models.Model):
    donor = models.CharField(max_length=255)
    amount = models.IntegerField()
    date = models.DateField(auto_now_add=True)
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='donations')
    note = models.TextField(blank=True)
    method = models.CharField(max_length=50) # UPI, Bank Transfer, Cash
    status = models.CharField(max_length=50, default='Success')
    
    def __str__(self):
        return f"{self.donor} - ₹{self.amount} for {self.campaign.title}"

class News(models.Model):
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    date = models.DateField(auto_now_add=True)
    img = models.ImageField(upload_to='news/', null=True, blank=True)
    img_url = models.URLField(max_length=500, null=True, blank=True)
    excerpt = models.TextField()
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='news')
    
    def __str__(self):
        return self.title

class Family(models.Model):
    head = models.CharField(max_length=255)
    village = models.CharField(max_length=100, blank=True, default='')
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='families')
    member = models.ForeignKey('Member', on_delete=models.CASCADE, related_name='family_groups', null=True, blank=True)
    
    def __str__(self):
        return f"Family of {self.head} ({self.village})"

class FamilyMember(models.Model):
    family = models.ForeignKey(Family, on_delete=models.CASCADE, related_name='members')
    name = models.CharField(max_length=255)
    relation = models.CharField(max_length=100, default='Other')
    birthdate = models.DateField(null=True, blank=True)
    age = models.IntegerField(null=True, blank=True)
    occupation = models.CharField(max_length=100, blank=True, default='')
    
    # Extended fields
    education = models.CharField(max_length=100, blank=True, null=True)
    school = models.CharField(max_length=255, blank=True, null=True)
    college = models.CharField(max_length=255, blank=True, null=True)
    degree = models.CharField(max_length=255, blank=True, null=True)
    field_of_study = models.CharField(max_length=255, blank=True, null=True)
    passing_year = models.CharField(max_length=50, blank=True, null=True)
    profession_type = models.CharField(max_length=100, blank=True, null=True)
    job_title = models.CharField(max_length=255, blank=True, null=True)
    company = models.CharField(max_length=255, blank=True, null=True)
    industry = models.CharField(max_length=255, blank=True, null=True)
    salary = models.CharField(max_length=100, blank=True, null=True)
    business_name = models.CharField(max_length=255, blank=True, null=True)
    business_category = models.CharField(max_length=255, blank=True, null=True)
    gst_no = models.CharField(max_length=100, blank=True, null=True)
    business_years = models.CharField(max_length=50, blank=True, null=True)
    
    def __str__(self):
        return f"{self.name} - {self.relation} of {self.family.head}"

class EventRegistration(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    attendees = models.IntegerField(default=1)
    registration_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} registered for {self.event.title}"

class CommunityApprovalHistory(models.Model):
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='approval_history')
    approval_level = models.CharField(max_length=100) # e.g. "Super Admin", "Parent Community Admin", "Submission"
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    approved_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=100)
    remarks = models.TextField(blank=True, default='')

    def __str__(self):
        return f"{self.community.name} - {self.status} ({self.approval_level})"

class Notification(models.Model):
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    notification_type = models.CharField(max_length=50, default='info') # e.g. "community_registration", "approval", "rejection"

    def __str__(self):
        return f"{self.recipient.username} - {self.title}"
