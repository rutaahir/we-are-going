from django.db import models
from django.contrib.auth.models import User

class CommunityManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)

class Community(models.Model):
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
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    
    objects = CommunityManager()
    all_objects = models.Manager()
    # type is now computed dynamically: 'Root' if no parent, else 'Branch'
    # Kept for backward compatibility - will be auto-set on save
    type = models.CharField(max_length=50, default='Root', blank=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subsidiaries')
    state = models.CharField(max_length=100, blank=True, default='')
    district = models.CharField(max_length=100, blank=True, default='')
    taluka = models.CharField(max_length=100, blank=True, default='')
    village = models.CharField(max_length=100, blank=True, default='')
    plan = models.CharField(max_length=50, choices=PLANS, default='Free')
    status = models.CharField(max_length=100, choices=STATUSES, default='Pending Super Admin Approval')
    logo = models.ImageField(upload_to='community_logos/', null=True, blank=True)
    logo_url = models.URLField(max_length=500, null=True, blank=True)
    cover = models.ImageField(upload_to='community_covers/', null=True, blank=True)
    cover_url = models.URLField(max_length=500, null=True, blank=True)
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

    @property
    def level(self):
        """Recursively compute depth level (root = 1)."""
        depth = 1
        node = self
        while node.parent_id:
            depth += 1
            node = node.parent
        return depth

    @property
    def path(self):
        """Return ancestor names from root to self as a list."""
        ancestors = []
        node = self
        while node:
            ancestors.append(node.name)
            node = node.parent
        return list(reversed(ancestors))

    @property
    def ancestors_list(self):
        """Return list of ancestor community dicts (id, name) from root to immediate parent."""
        result = []
        node = self.parent
        while node:
            result.append({'id': node.id, 'name': node.name, 'type': node.type})
            node = node.parent
        return list(reversed(result))

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.parent:
            self.type = 'Subsidiary'
        else:
            self.type = 'Super'
        super().save(*args, **kwargs)

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
    email_verified = models.BooleanField(default=True)
    joined_date = models.DateField(auto_now_add=True)
    aadhaar = models.CharField(max_length=12, blank=True)
    aadhaar_status = models.CharField(max_length=50, default='Pending')
    role = models.CharField(max_length=50, choices=ROLES, default='member')
    custom_role = models.ForeignKey('Role', on_delete=models.SET_NULL, null=True, blank=True, related_name='members')
    permissions = models.JSONField(default=list, blank=True, null=True)
    
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
    role = models.ForeignKey('Role', on_delete=models.SET_NULL, null=True, blank=True, related_name='committee_members')
    
    def __str__(self):
        return f"{self.name} - {self.designation} ({self.community.name})"

class Event(models.Model):
    STATUSES = (
        ('Draft', 'Draft'),
        ('Pending Approval', 'Pending Approval'),
        ('Published', 'Published'),
        ('Registration Open', 'Registration Open'),
        ('Ongoing', 'Ongoing'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    )
    
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=100)
    category = models.CharField(max_length=100, default='Cultural')
    date = models.DateField()
    time = models.CharField(max_length=50)
    start_time = models.CharField(max_length=50, blank=True, default='')
    end_time = models.CharField(max_length=50, blank=True, default='')
    venue = models.CharField(max_length=255)
    venue_details = models.TextField(blank=True, default='')
    attendees = models.IntegerField(default=0)
    max_attendees = models.IntegerField(default=500)
    status = models.CharField(max_length=50, choices=STATUSES, default='Published')
    color = models.CharField(max_length=50, default='blue')
    img = models.ImageField(upload_to='events/', null=True, blank=True)
    img_url = models.URLField(max_length=500, null=True, blank=True)
    desc = models.TextField()
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='events')
    visibility_scope = models.CharField(max_length=50, default='COMMUNITY_ONLY')
    
    organizer = models.CharField(max_length=255, blank=True, default='')
    speakers = models.JSONField(default=list, blank=True)
    schedule = models.JSONField(default=list, blank=True)
    gallery = models.JSONField(default=list, blank=True)
    
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
    visibility_scope = models.CharField(max_length=50, default='COMMUNITY_ONLY')
    
    def __str__(self):
        return f"{self.role} at {self.company}"

class JobApplication(models.Model):
    STATUS_CHOICES = (
        ('Applied', 'Applied'),
        ('Under Review', 'Under Review'),
        ('Shortlisted', 'Shortlisted'),
        ('Interview Scheduled', 'Interview Scheduled'),
        ('Selected', 'Selected'),
        ('Rejected', 'Rejected'),
    )

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='job_applications')
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='job_applications')
    
    # Personal Details
    full_name = models.CharField(max_length=255)
    email = models.EmailField(max_length=255)
    mobile = models.CharField(max_length=20)
    alt_mobile = models.CharField(max_length=20, null=True, blank=True)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default='India')

    # Professional Details
    occupation = models.CharField(max_length=255)
    company = models.CharField(max_length=255, null=True, blank=True)
    experience = models.CharField(max_length=100) # Total Experience
    relevant_experience = models.CharField(max_length=100, null=True, blank=True)
    current_salary = models.CharField(max_length=100, null=True, blank=True)
    expected_salary = models.CharField(max_length=100, null=True, blank=True)
    notice_period = models.CharField(max_length=100, null=True, blank=True)
    qualification = models.CharField(max_length=255)
    skills = models.TextField()

    # Documents & Links
    resume = models.FileField(upload_to='resumes/')
    cover_letter = models.TextField(null=True, blank=True)
    portfolio = models.URLField(max_length=500, null=True, blank=True)
    linkedin = models.URLField(max_length=500, null=True, blank=True)
    github = models.URLField(max_length=500, null=True, blank=True)

    # Additional Questions
    why_interested = models.TextField(null=True, blank=True)
    willing_to_relocate = models.BooleanField(default=False)
    available_joining_date = models.CharField(max_length=100, null=True, blank=True)

    # Workflow & Meta
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Applied')
    applied_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} - {self.job.role}"

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
    visibility_scope = models.CharField(max_length=50, default='COMMUNITY_ONLY')
    
    # Redesigned directory fields
    cover = models.ImageField(upload_to='businesses/covers/', null=True, blank=True)
    cover_url = models.URLField(max_length=500, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    state = models.CharField(max_length=100, null=True, blank=True)
    whatsapp = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(max_length=255, null=True, blank=True)
    website = models.URLField(max_length=500, null=True, blank=True)
    hours = models.JSONField(default=dict, null=True, blank=True)
    socials = models.JSONField(default=dict, null=True, blank=True)
    gallery = models.JSONField(default=list, null=True, blank=True)
    status = models.CharField(max_length=20, default='PENDING') # PENDING, VERIFIED, REJECTED, SUSPENDED
    featured = models.BooleanField(default=False)
    
    # Analytics
    views = models.IntegerField(default=0)
    opens = models.IntegerField(default=0)
    whatsapp_clicks = models.IntegerField(default=0)
    call_clicks = models.IntegerField(default=0)
    website_visits = models.IntegerField(default=0)

    def save(self, *args, **kwargs):
        # Sync status and verified
        if self.verified and self.status == 'PENDING':
            self.status = 'VERIFIED'
        elif not self.verified and self.status == 'VERIFIED':
            self.verified = True
        elif self.status == 'VERIFIED':
            self.verified = True
        else:
            self.verified = False
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class MatrimonyProfile(models.Model):
    GENDERS = (
        ('Bride', 'Bride'),
        ('Groom', 'Groom'),
    )
    STATUSES = (
        ('Draft', 'Draft'),
        ('Ready For Review', 'Ready For Review'),
        ('Pending Approval', 'Pending Approval'),
        ('Active', 'Active'),
        ('Approved', 'Approved'),
        ('Featured', 'Featured'),
        ('Rejected', 'Rejected'),
        ('Hidden', 'Hidden'),
        ('Suspended', 'Suspended'),
        ('Deleted', 'Deleted'),
    )
    
    # Core linkage
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_matrimony_profiles', null=True, blank=True)
    family_member = models.OneToOneField('FamilyMember', on_delete=models.CASCADE, related_name='matrimony_profile', null=True, blank=True)
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='matrimony_profiles')
    
    # Basic Info
    name = models.CharField(max_length=255)
    gender = models.CharField(max_length=10, choices=GENDERS)
    dob = models.DateField(null=True, blank=True)
    age = models.IntegerField(default=25)
    marital_status = models.CharField(max_length=50, default='Never Married') # Never Married, Divorced, Widowed
    
    # Divorced Info
    divorce_year = models.IntegerField(null=True, blank=True)
    has_children = models.BooleanField(default=False)
    children_count = models.IntegerField(null=True, blank=True)
    children_living_with = models.CharField(max_length=100, blank=True, default='')
    
    # Widowed Info
    year_of_loss = models.IntegerField(null=True, blank=True)
    widowed_children_info = models.TextField(blank=True, default='')
    
    # Personal Info
    height = models.CharField(max_length=20, blank=True, default='')
    weight = models.CharField(max_length=20, blank=True, default='')
    complexion = models.CharField(max_length=100, blank=True, default='')
    education = models.CharField(max_length=255, blank=True, default='')
    profession = models.CharField(max_length=255, blank=True, default='') # occupation
    income = models.CharField(max_length=100, blank=True, default='')
    religion = models.CharField(max_length=100, default='Hindu')
    caste = models.CharField(max_length=100, blank=True, default='')
    sub_caste = models.CharField(max_length=100, blank=True, default='')
    mother_tongue = models.CharField(max_length=100, blank=True, default='')
    languages_known = models.CharField(max_length=255, blank=True, default='')
    
    # Location
    country = models.CharField(max_length=100, default='India')
    state = models.CharField(max_length=100, blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    current_address = models.TextField(blank=True, default='')
    native_place = models.CharField(max_length=255, blank=True, default='')
    
    # Lifestyle
    diet = models.CharField(max_length=50, default='Vegetarian') # Vegetarian, Jain, Vegan, Non-Veg
    smoking = models.CharField(max_length=50, default='No') # Yes, No, Occasionally
    drinking = models.CharField(max_length=50, default='No') # Yes, No, Occasionally
    
    # About
    about = models.TextField(blank=True, default='')
    
    # Verification Details
    aadhaar = models.CharField(max_length=50, blank=True, default='')
    pan = models.CharField(max_length=50, blank=True, default='')
    passport = models.CharField(max_length=50, blank=True, default='')
    driving_license = models.CharField(max_length=50, blank=True, default='')
    is_verified = models.BooleanField(default=False)
    review_notes = models.TextField(blank=True, default='')

    
    # Visibility Settings
    # My Community Only, Parent Community, Child Communities, Entire Hierarchy, Selected Communities, Public
    VISIBILITY_TYPES = (
        ('PRIVATE', 'Private'),
        ('COMMUNITY_NETWORK', 'Community Network'),
        ('CUSTOM_AUDIENCE', 'Custom Audience'),
        ('PLATFORM_WIDE', 'Platform Wide'),
    )

    visibility_type = models.CharField(max_length=50, choices=VISIBILITY_TYPES, default='COMMUNITY_NETWORK', db_index=True)
    # hierarchy_scope: My Community, Parent Community, Child Communities, Entire Network, Selected Communities
    hierarchy_scope = models.CharField(max_length=100, default='My Community', db_index=True)
    selected_communities = models.ManyToManyField(Community, related_name='visible_matrimony_profiles', blank=True)
    
    # Audience Filters (Custom Audience / targeting)
    target_communities = models.ManyToManyField(Community, related_name='targeted_matrimony_profiles', blank=True)
    target_castes = models.TextField(blank=True, default='') # comma-separated list
    target_subcastes = models.TextField(blank=True, default='')
    target_states = models.TextField(blank=True, default='')
    target_cities = models.TextField(blank=True, default='')
    target_gender = models.CharField(max_length=50, default='Everyone', db_index=True)
    target_age_min = models.IntegerField(default=18, db_index=True)
    target_age_max = models.IntegerField(default=60, db_index=True)
    target_marital_statuses = models.TextField(blank=True, default='') # comma-separated list
    target_educations = models.TextField(blank=True, default='') # comma-separated list
    target_occupations = models.TextField(blank=True, default='') # comma-separated list

    # Cached audience counts to speed up previews
    audience_count_cache = models.IntegerField(default=0)
    
    # Who Can Contact Me
    # Everyone Who Can View, Verified Members Only, Premium Members Only, Same Community Only, Selected Communities Only, Selected Castes Only, Nobody
    contact_permission = models.CharField(max_length=100, default='Everyone Who Can View')
    allow_interests = models.BooleanField(default=True)
    allow_direct_chat = models.BooleanField(default=True)
    allow_phone = models.BooleanField(default=True)
    allow_whatsapp = models.BooleanField(default=True)
    allow_email = models.BooleanField(default=True)
    
    # Legacy fields compat
    photo = models.ImageField(upload_to='matrimony/', null=True, blank=True)
    photo_url = models.URLField(max_length=500, null=True, blank=True)
    match = models.IntegerField(default=0)
    family_details = models.TextField(blank=True, default='')
    contact_preferences = models.TextField(blank=True, default='')
    status = models.CharField(max_length=50, choices=STATUSES, default='Draft')

    # Contact person details (collected during profile creation wizard)
    contact_name = models.CharField(max_length=255, blank=True, default='')
    contact_relation = models.CharField(max_length=100, blank=True, default='')
    contact_phone = models.CharField(max_length=50, blank=True, default='')
    contact_whatsapp = models.CharField(max_length=50, blank=True, default='')
    contact_email = models.EmailField(blank=True, default='')
    
    # Soft delete / Audit
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['visibility_type']),
            models.Index(fields=['gender']),
            models.Index(fields=['age']),
            models.Index(fields=['state']),
        ]

    @property
    def completion_percentage(self):
        return self.calculate_completion_percentage()

    def calculate_completion_percentage(self):
        """Calculate how complete this matrimony profile is (0-100%).
        
        Scoring weights (each True = 1 point, total = 20 points max):
        - Core identity: name, gender, dob                   (3 pts)
        - Education & career: education, profession, income   (3 pts)
        - Physical: height, weight, complexion                (3 pts)
        - Lifestyle: diet, marital_status                     (2 pts)
        - Mother tongue / religion                            (2 pts)
        - Location: city, state, native_place                 (3 pts)
        - About (min 50 chars)                                (1 pt)
        - Profile photo                                       (1 pt)
        - Partner preferences                                 (1 pt)
        - Contact info                                        (1 pt)
        """
        scored = [
            # Core identity
            ('name',            bool(self.name and self.name.strip())),
            ('gender',          bool(self.gender)),
            ('dob',             bool(self.dob)),
            # Education & career
            ('education',       bool(self.education and self.education.strip())),
            ('profession',      bool(self.profession and self.profession.strip())),
            ('income',          bool(self.income and self.income.strip())),
            # Physical
            ('height',          bool(self.height and self.height.strip())),
            ('weight',          bool(self.weight and self.weight.strip())),
            ('complexion',      bool(self.complexion and self.complexion.strip())),
            # Lifestyle (these have defaults so they are always non-empty; check for non-default or any value)
            ('diet',            bool(self.diet and self.diet.strip())),
            ('marital_status',  bool(self.marital_status and self.marital_status.strip())),
            # Heritage / language
            ('mother_tongue',   bool(self.mother_tongue and self.mother_tongue.strip())),
            ('religion',        bool(self.religion and self.religion.strip())),
            # Location
            ('city',            bool(self.city and self.city.strip())),
            ('state',           bool(self.state and self.state.strip())),
            ('native_place',    bool(self.native_place and self.native_place.strip())),
            # About (at least 50 chars)
            ('about',           bool(self.about and len(self.about.strip()) >= 50)),
            # Photos
            ('photo',           bool(self.photos.exists() or self.photo)),
            # Partner preferences
            ('preferences',     self._has_preferences()),
            # Contact info (name OR phone is enough)
            ('contact_info',    bool(
                (self.contact_name and self.contact_name.strip()) or
                (self.contact_phone and self.contact_phone.strip()) or
                self.name  # fallback: profile name counts as contact
            )),
        ]
        filled = sum(1 for _, v in scored if v)
        pct = int((filled / len(scored)) * 100)
        
        # Debug logging
        import logging
        logger = logging.getLogger(__name__)
        incomplete = [k for k, v in scored if not v]
        logger.info(
            f"[MatrimonyProfile #{self.pk}] Completion: {filled}/{len(scored)} = {pct}%"
            + (f" | Incomplete: {incomplete}" if incomplete else " | All complete!")
        )
        return pct

    def calculate_match_score(self, other):
        """Calculate dynamic match score between this profile and another profile (0-100%)."""
        if not other or self.id == other.id:
            return 100

        score = 0

        # 1. Age Match (20%)
        # Check partner preference or fallback to +/- 5 years
        pref = getattr(self, 'partner_preference', None)
        min_age, max_age = 18, 60
        if pref:
            min_age = getattr(pref, 'min_age', 18) or 18
            max_age = getattr(pref, 'max_age', 60) or 60
        else:
            min_age = max(18, self.age - 5)
            max_age = min(100, self.age + 5)

        if min_age <= other.age <= max_age:
            score += 20
        elif abs(other.age - self.age) <= 8:
            score += 10

        # 2. Community & Caste Match (20%)
        if self.community_id == other.community_id:
            score += 10
        elif self.community and other.community:
            # Check ancestors/descendants
            self_ancestors = {c['id'] for c in self.community.ancestors_list} if hasattr(self.community, 'ancestors_list') else set()
            other_ancestors = {c['id'] for c in other.community.ancestors_list} if hasattr(other.community, 'ancestors_list') else set()
            if self.community_id in other_ancestors or other.community_id in self_ancestors:
                score += 7
            else:
                score += 3

        self_caste = (self.caste or '').strip().lower()
        other_caste = (other.caste or '').strip().lower()
        if self_caste and self_caste == other_caste:
            score += 10
        elif self_caste and other_caste and (self_caste in other_caste or other_caste in self_caste):
            score += 7
        else:
            score += 2

        # 3. Location Match (15%)
        self_city = (self.city or '').strip().lower()
        other_city = (other.city or '').strip().lower()
        self_state = (self.state or '').strip().lower()
        other_state = (other.state or '').strip().lower()
        
        if self.country.strip().lower() == other.country.strip().lower():
            if self_city and self_city == other_city:
                score += 15
            elif self_state and self_state == other_state:
                score += 10
            else:
                score += 5
        else:
            score += 0

        # 4. Education Match (15%)
        self_edu = (self.education or '').strip().lower()
        other_edu = (other.education or '').strip().lower()
        if self_edu and other_edu:
            if self_edu == other_edu:
                score += 15
            elif any(w in self_edu and w in other_edu for w in ['engg', 'btech', 'mtech', 'mba', 'ca', 'phd', 'graduate', 'doctor', 'be', 'bcom', 'ma', 'ba', 'bsc', 'msc']):
                score += 10
            else:
                score += 5
        else:
            score += 5

        # 5. Occupation Match (10%)
        self_prof = (self.profession or '').strip().lower()
        other_prof = (other.profession or '').strip().lower()
        if self_prof and other_prof:
            if self_prof == other_prof:
                score += 10
            elif any(w in self_prof and w in other_prof for w in ['soft', 'eng', 'tech', 'manage', 'doc', 'medic', 'teach', 'service', 'business', 'own', 'finance', 'consult']):
                score += 8
            else:
                score += 5
        else:
            score += 5

        # 6. Marital Status Match (10%)
        self_ms = (self.marital_status or '').strip().lower()
        other_ms = (other.marital_status or '').strip().lower()
        # check partner preference if available
        pref_ms = []
        if pref and pref.marital_status:
            pref_ms = [m.strip().lower() for m in pref.marital_status.split(',') if m.strip()]
        
        if pref_ms:
            if other_ms in pref_ms:
                score += 10
            else:
                score += 2
        else:
            if self_ms == other_ms:
                score += 10
            else:
                score += 5

        # 7. Lifestyle Preferences (10%)
        # diet (4%), smoking (3%), drinking (3%)
        self_diet = (self.diet or '').strip().lower()
        other_diet = (other.diet or '').strip().lower()
        if self_diet == other_diet:
            score += 4
        else:
            score += 1

        self_smoke = (self.smoking or '').strip().lower()
        other_smoke = (other.smoking or '').strip().lower()
        if self_smoke == other_smoke:
            score += 3
        else:
            score += 1

        self_drink = (self.drinking or '').strip().lower()
        other_drink = (other.drinking or '').strip().lower()
        if self_drink == other_drink:
            score += 3
        else:
            score += 1

        return min(max(score, 30), 100)

    def _has_preferences(self):
        try:
            pref = self.partner_preference
            if pref and any([
                pref.gender, pref.caste, pref.sub_caste,
                pref.education, pref.occupation, pref.city, pref.state,
                pref.min_age != 18 or pref.max_age != 60,  # non-default age range
            ]):
                return True
        except Exception:
            pass
        return False

    def recalculate_status(self, save=True):
        """Auto-calculate status based on current profile completeness.
        Transitions:
          Draft            → requires: core fields + primary photo + completion >= 50%
          Ready For Review → completion >= 50%, core fields + photo present, not verified
          Active           → same as Ready For Review but is_verified=True
          Suspended/Hidden → admin-set; never auto-changed
        """
        import logging
        logger = logging.getLogger(__name__)
        
        # Never override admin-set statuses
        if self.status in ('Suspended', 'Hidden', 'Deleted', 'Featured', 'Rejected', 'Approved', 'Active'):
            return self.status


        completion = self.calculate_completion_percentage()
        has_primary_photo = self.photos.filter(category='Profile Photo').exists() or bool(self.photo)

        # Minimum mandatory fields required to leave Draft
        has_core = all([
            self.name and self.name.strip(),
            self.gender,
            self.dob,
            self.education and self.education.strip(),
            self.profession and self.profession.strip(),
            self.city and self.city.strip(),
            self.state and self.state.strip(),
        ])

        # Threshold: 50% completion + core fields + primary photo to leave Draft
        if not has_core or not has_primary_photo or completion < 50:
            new_status = 'Draft'
        elif self.is_verified:
            new_status = 'Approved'
        else:
            new_status = 'Pending Approval'

        logger.info(
            f"[MatrimonyProfile #{self.pk}] recalculate_status: "
            f"completion={completion}%, has_core={has_core}, has_photo={has_primary_photo}, "
            f"is_verified={self.is_verified} → {self.status} → {new_status}"
        )

        if self.status != new_status:
            self.status = new_status
            if save:
                MatrimonyProfile.objects.filter(pk=self.pk).update(status=new_status)
                self.status = new_status  # update in-memory state
        return new_status

    def save(self, *args, **kwargs):
        update_fields = kwargs.get('update_fields')
        super().save(*args, **kwargs)
        # Recalculate status after every save EXCEPT when we're only updating the status field itself
        # (to avoid infinite recursion)
        if not update_fields or 'status' not in update_fields:
            try:
                self.recalculate_status(save=True)
            except Exception:
                pass

    def is_visible_to_user(self, viewer_user):
        # Owner always has access
        if viewer_user and viewer_user.is_authenticated and self.user_id == viewer_user.id:
            return True

        # Admins also always have access
        if viewer_user and viewer_user.is_authenticated:
            if viewer_user.is_superuser:
                return True
            try:
                member = viewer_user.member_profile
                if member.role in ('community_admin', 'super_admin'):
                    return True
            except Exception:
                pass

        # Strict Approval check: viewer must have an approved profile to see other profiles
        if viewer_user and viewer_user.is_authenticated:
            viewer_profile = MatrimonyProfile.objects.filter(user=viewer_user, deleted_at__isnull=True).first()
            if not viewer_profile or viewer_profile.status not in ('Approved', 'Active', 'Featured'):
                return False

        # Strict Approval check: only approved/active profiles are visible to other users
        if self.status not in ('Approved', 'Active', 'Featured'):
            return False


        # Resolve visibility type (new field) with backward compatibility
        vtype = getattr(self, 'visibility_type', None)
        if not vtype:
            # map legacy strings
            legacy = getattr(self, 'visibility_scope', '')
            if legacy in ('Private',):
                vtype = 'PRIVATE'
            elif legacy in ('Platform Wide', 'Public'):
                vtype = 'PLATFORM_WIDE'
            elif legacy in ('Community Network', 'My Community Only'):
                vtype = 'COMMUNITY_NETWORK'
            elif legacy in ('Custom Audience',):
                vtype = 'CUSTOM_AUDIENCE'
            else:
                vtype = 'COMMUNITY_NETWORK'

        # PRIVATE: only owner, admins, or approved interest relationships
        if vtype == 'PRIVATE':
            if not viewer_user or not viewer_user.is_authenticated:
                return False
            try:
                viewer_profile = viewer_user.created_matrimony_profiles.filter(deleted_at__isnull=True).first()
                if not viewer_profile:
                    return False
                from api.models import InterestRequest
                from django.db.models import Q
                exists = InterestRequest.objects.filter(
                    Q(sender=self, receiver=viewer_profile) | Q(sender=viewer_profile, receiver=self, status='Accepted')
                ).exclude(status='Rejected').exists()
                if not exists:
                    return False
            except Exception:
                return False
            return True

        # Get viewer's community and member info
        viewer_community = None
        viewer_member = None
        if viewer_user and viewer_user.is_authenticated:
            try:
                viewer_member = viewer_user.member_profile
                viewer_community = viewer_member.community
            except Exception:
                pass

        # COMMUNITY_NETWORK: enforce hierarchy rules
        if vtype == 'COMMUNITY_NETWORK':
            if not viewer_community:
                return False
            hierarchy_sel = getattr(self, 'hierarchy_scope', getattr(self, 'visibility_hierarchy', 'My Community'))
            viewer_community_id = viewer_community.id
            p_comm_id = self.community_id

            can_see = False
            if hierarchy_sel in ('My Community', 'My Community Only'):
                can_see = (p_comm_id == viewer_community_id)
            elif hierarchy_sel == 'Parent Community':
                p_parent_id = self.community.parent_id if self.community else None
                can_see = (viewer_community_id == p_comm_id or viewer_community_id == p_parent_id)
            elif hierarchy_sel == 'Child Communities':
                # viewer is in child of profile community
                can_see = (viewer_community_id == p_comm_id) or (viewer_community.parent_id == p_comm_id if viewer_community.parent_id else False)
            elif hierarchy_sel in ('Entire Hierarchy Chain', 'Entire Network'):
                # Build allowed set: ancestors + descendants + self
                hierarchy_ids = {p_comm_id}
                curr = self.community
                while curr and curr.parent_id:
                    hierarchy_ids.add(curr.parent_id)
                    curr = curr.parent
                # descendants
                def get_desc_ids(comm):
                    ids = []
                    for child in comm.subsidiaries.all():
                        ids.append(child.id)
                        ids.extend(get_desc_ids(child))
                    return ids
                hierarchy_ids.update(get_desc_ids(self.community))
                can_see = (viewer_community_id in hierarchy_ids)
            elif hierarchy_sel in ('Selected Communities',):
                can_see = self.selected_communities.filter(id=viewer_community_id).exists()
            else:
                can_see = (p_comm_id == viewer_community_id)

            if not can_see:
                return False

        if vtype == 'PLATFORM_WIDE':
            return True

        if vtype == 'CUSTOM_AUDIENCE':
            if self.target_communities.exists():
                if not viewer_community or not self.target_communities.filter(id=viewer_community.id).exists():
                    return False

            if self.selected_communities.exists():
                if not viewer_community or not self.selected_communities.filter(id=viewer_community.id).exists():
                    return False

            if self.target_castes:
                allowed_castes = [c.strip().lower() for c in self.target_castes.split(',') if c.strip()]
                v_caste = getattr(viewer_member, 'caste', '').strip().lower() if viewer_member else ''
                if allowed_castes and v_caste not in allowed_castes:
                    return False

            if self.target_subcastes:
                allowed_subcastes = [c.strip().lower() for c in self.target_subcastes.split(',') if c.strip()]
                v_subcaste = getattr(viewer_member, 'sub_caste', '').strip().lower() if viewer_member else ''
                if allowed_subcastes and v_subcaste not in allowed_subcastes:
                    return False

            if self.target_states:
                allowed_states = [s.strip().lower() for s in self.target_states.split(',') if s.strip()]
                v_state = (getattr(viewer_member, 'state', '') or (viewer_community.state if viewer_community else '')).strip().lower()
                if allowed_states and v_state not in allowed_states:
                    return False

            if self.target_cities:
                allowed_cities = [c.strip().lower() for c in self.target_cities.split(',') if c.strip()]
                v_city = (getattr(viewer_member, 'city', '') or (viewer_community.village if viewer_community else '')).strip().lower()
                if allowed_cities and v_city not in allowed_cities:
                    return False

            if self.target_gender and self.target_gender not in ('Everyone', 'All'):
                v_gender = getattr(viewer_member, 'gender', '') if viewer_member else ''
                if self.target_gender in ('Male Only', 'Groom Profiles', 'Groom') and v_gender not in ('Male', 'Groom'):
                    return False
                if self.target_gender in ('Female Only', 'Bride Profiles', 'Bride') and v_gender not in ('Female', 'Bride'):
                    return False

            v_age = getattr(viewer_member, 'age', None)
            if not v_age and viewer_user:
                v_prof = viewer_user.created_matrimony_profiles.first()
                if v_prof:
                    v_age = v_prof.age
            if not v_age:
                v_age = 25
            if not (self.target_age_min <= v_age <= self.target_age_max):
                return False

            if self.target_marital_statuses:
                allowed_statuses = [ms.strip().lower() for ms in self.target_marital_statuses.split(',') if ms.strip()]
                v_ms = ''
                if viewer_member:
                    v_ms = getattr(viewer_member, 'marital_status', '').strip().lower()
                if not v_ms and viewer_user:
                    v_prof = viewer_user.created_matrimony_profiles.first()
                    if v_prof:
                        v_ms = getattr(v_prof, 'marital_status', '').strip().lower()
                if allowed_statuses and v_ms not in allowed_statuses:
                    return False

            if self.target_educations:
                allowed_educations = [e.strip().lower() for e in self.target_educations.split(',') if e.strip()]
                v_edu = ''
                if viewer_member:
                    v_edu = getattr(viewer_member, 'education', '').strip().lower()
                if not v_edu and viewer_user:
                    v_prof = viewer_user.created_matrimony_profiles.first()
                    if v_prof:
                        v_edu = getattr(v_prof, 'education', '').strip().lower()
                if allowed_educations and not any(ae in v_edu for ae in allowed_educations):
                    return False

            if self.target_occupations:
                allowed_occupations = [o.strip().lower() for o in self.target_occupations.split(',') if o.strip()]
                v_occ = ''
                if viewer_member:
                    v_occ = getattr(viewer_member, 'profession', '').strip().lower()
                if not v_occ and viewer_user:
                    v_prof = viewer_user.created_matrimony_profiles.first()
                    if v_prof:
                        v_occ = getattr(v_prof, 'profession', '').strip().lower()
                if allowed_occupations and not any(ao in v_occ for ao in allowed_occupations):
                    return False

            return True

        return True

    def __str__(self):
        return f"{self.name} ({self.gender})"

class MatrimonyPhoto(models.Model):
    CATEGORIES = (
        ('Profile Photo', 'Profile Photo'),
        ('Family Photo', 'Family Photo'),
        ('Lifestyle Photo', 'Lifestyle Photo'),
    )
    profile = models.ForeignKey(MatrimonyProfile, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to='matrimony_photos/', null=True, blank=True)
    image_url = models.URLField(max_length=500, null=True, blank=True)
    category = models.CharField(max_length=50, choices=CATEGORIES, default='Profile Photo')
    is_private = models.BooleanField(default=False) # Visible Only After Interest Accepted
    order = models.IntegerField(default=0)

    def __str__(self):
        return f"Photo for {self.profile.name} ({self.category})"

class PartnerPreference(models.Model):
    profile = models.OneToOneField(MatrimonyProfile, on_delete=models.CASCADE, related_name='partner_preference', null=True, blank=True)
    # Legacy compat
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='partner_preferences', null=True, blank=True)
    gender = models.CharField(max_length=50, blank=True, default='')
    min_age = models.IntegerField(default=18)
    max_age = models.IntegerField(default=60)
    caste = models.CharField(max_length=100, blank=True, default='')
    sub_caste = models.CharField(max_length=100, blank=True, default='')
    education = models.CharField(max_length=100, blank=True, default='')
    occupation = models.CharField(max_length=100, blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    state = models.CharField(max_length=100, blank=True, default='')
    country = models.CharField(max_length=100, blank=True, default='')
    min_height = models.CharField(max_length=20, blank=True, default='')
    max_height = models.CharField(max_length=20, blank=True, default='')
    marital_status = models.CharField(max_length=50, blank=True, default='')
    income_range = models.CharField(max_length=100, blank=True, default='')

    def __str__(self):
        if self.profile:
            return f"Partner Preferences for {self.profile.name}"
        return f"Partner Preferences for user {self.user.username if self.user else 'Unknown'}"

class ProfileVisibility(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile_visibility')
    visibility_type = models.CharField(max_length=100, default='Public Within Community')
    min_age = models.IntegerField(null=True, blank=True)
    max_age = models.IntegerField(null=True, blank=True)
    allowed_gender = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return f"Profile Visibility for {self.user.username}"

class InterestRequest(models.Model):
    STATUSES = (
        ('Pending', 'Pending'),
        ('Accepted', 'Accepted'),
        ('Rejected', 'Rejected'),
    )
    sender = models.ForeignKey(MatrimonyProfile, on_delete=models.CASCADE, related_name='sent_interests')
    receiver = models.ForeignKey(MatrimonyProfile, on_delete=models.CASCADE, related_name='received_interests')
    status = models.CharField(max_length=50, choices=STATUSES, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Interest from {self.sender.name} to {self.receiver.name} ({self.status})"

class Wishlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='matrimony_wishlist')
    profile = models.ForeignKey(MatrimonyProfile, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'profile')

    def __str__(self):
        return f"{self.user.username} - Wishlist {self.profile.name}"

class ProfileView(models.Model):
    viewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='profile_views_sent')
    profile = models.ForeignKey(MatrimonyProfile, on_delete=models.CASCADE, related_name='profile_views_received')
    viewed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.viewer.username} viewed {self.profile.name} at {self.viewed_at}"

class MatrimonyAuditLog(models.Model):
    profile = models.ForeignKey(MatrimonyProfile, on_delete=models.CASCADE, related_name='audit_logs', null=True, blank=True)
    action = models.CharField(max_length=255)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.TextField(blank=True)

    def __str__(self):
        return f"{self.action} on {self.profile.name if self.profile else 'N/A'} at {self.timestamp}"


class Campaign(models.Model):
    title = models.CharField(max_length=255)
    goal = models.IntegerField()
    raised = models.IntegerField(default=0)
    img = models.ImageField(upload_to='campaigns/', null=True, blank=True)
    img_url = models.URLField(max_length=500, null=True, blank=True)
    desc = models.TextField()
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='campaigns')
    status = models.CharField(max_length=50, default='Active') # Draft, Pending Approval, Active, Completed, Closed, Expired
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    updates = models.TextField(blank=True, default='')
    
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
    is_anonymous = models.BooleanField(default=False)
    email = models.EmailField(blank=True, null=True)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    receipt_no = models.CharField(max_length=100, blank=True, null=True)
    
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
    visibility_scope = models.CharField(max_length=50, default='COMMUNITY_ONLY')
    
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
    family_members_attending = models.TextField(blank=True, default='')
    special_notes = models.TextField(blank=True, default='')
    status = models.CharField(max_length=50, default='Registered') # Registered, Present, Absent
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

class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=100)
    monthly_price = models.IntegerField()
    yearly_price = models.IntegerField()
    member_limit = models.IntegerField()
    storage = models.CharField(max_length=50, default="1 GB")
    description = models.TextField(blank=True, null=True)
    modules = models.JSONField(default=dict)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Role(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    permissions = models.JSONField(default=dict)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class Notification(models.Model):
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    notification_type = models.CharField(max_length=50, default='info') # e.g. "community_registration", "approval", "rejection"

    def __str__(self):
        return f"{self.recipient.username} - {self.title}"

class Advertisement(models.Model):
    STATUSES = (
        ('Active', 'Active'),
        ('Paused', 'Paused'),
        ('Expired', 'Expired'),
    )
    SLOTS = (
        ('Hero Banner', 'Hero Banner'),
        ('Sidebar Top', 'Sidebar Top'),
        ('Sidebar Bottom', 'Sidebar Bottom'),
        ('Footer', 'Footer'),
        ('Content Inline', 'Content Inline'),
    )
    slot = models.CharField(max_length=50, choices=SLOTS)
    advertiser = models.CharField(max_length=255)
    image_url = models.URLField(max_length=500, null=True, blank=True)
    image = models.ImageField(upload_to='ads/', null=True, blank=True)
    destination_url = models.URLField(max_length=500, null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=50, choices=STATUSES, default='Active')
    priority = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.advertiser} ({self.slot})"

class Gallery(models.Model):
    title = models.CharField(max_length=255, blank=True)
    image = models.ImageField(upload_to='gallery/', null=True, blank=True)
    image_url = models.URLField(max_length=500, null=True, blank=True)
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='gallery_photos')
    visibility_scope = models.CharField(max_length=50, default='COMMUNITY_ONLY')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Gallery Photo {self.id} for {self.community.name}"

class EmailTemplate(models.Model):
    STATUS_CHOICES = (
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
    )
    name = models.CharField(max_length=100, unique=True)
    subject = models.CharField(max_length=255)
    html_content = models.TextField()
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class EmailLog(models.Model):
    recipient = models.EmailField()
    subject = models.CharField(max_length=255)
    trigger_event = models.CharField(max_length=100)
    status = models.CharField(max_length=50) # e.g. "Sent Successfully", "Failed"
    sent_at = models.DateTimeField(auto_now_add=True)
    error_message = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.recipient} - {self.subject} - {self.status}"

class CommunityActivityLog(models.Model):
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='activity_logs')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    changed_fields = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Activity for {self.community.name} at {self.created_at}"

class MessageRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    sender = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='sent_message_requests')
    receiver = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='received_message_requests')
    subject = models.CharField(max_length=255, blank=True, null=True)
    introduction_message = models.TextField()
    reason = models.CharField(max_length=100)
    custom_reason = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Req: {self.sender.name} -> {self.receiver.name} ({self.status})"

class Conversation(models.Model):
    participant_1 = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='conversations_as_p1')
    participant_2 = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='conversations_as_p2')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Chat: {self.participant_1.name} & {self.participant_2.name}"

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    image = models.ImageField(upload_to='chat_images/', blank=True, null=True)
    file = models.FileField(upload_to='chat_files/', blank=True, null=True)
    is_seen = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_by_sender = models.BooleanField(default=False)
    reply_to = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='replies')

    def __str__(self):
        return f"Msg from {self.sender.name} at {self.created_at}"

class MessageReaction(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions')
    member = models.ForeignKey(Member, on_delete=models.CASCADE)
    emoji = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('message', 'member')

    def __str__(self):
        return f"{self.member.name} reacted {self.emoji} to message {self.message.id}"

