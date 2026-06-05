# We Are Going Home - Fully Dynamic Website Setup

## ✅ COMPLETED: Backend System Fully Configured

### Database Models Created
Your Django backend now has the following fully dynamic database models:

#### 1. **Community Model**
- Super communities and subsidiary communities
- Hierarchical structure with parent-child relationships
- Multiple plans: Free, Basic, Pro, Enterprise
- Status tracking: Active, Pending, Suspended

#### 2. **Member Model**
- Full member profiles with complete details
- Role-based access: Member, Community Admin, Super Admin
- Status management: Verified, Pending, Rejected, Suspended
- Community association
- Avatar support

#### 3. **Event Model**
- Dynamic event creation and management
- Event types, dates, venues, attendance tracking
- Community-specific events
- Status: Upcoming, Completed, Cancelled

#### 4. **Business Model**
- Community business directory
- Business verification system
- Ratings and categories
- Owner and contact management

#### 5. **Job Postings Model**
- Job board management
- Job types, categories, salary ranges
- Applicant tracking
- Community-specific jobs

#### 6. **Matrimony Profiles Model**
- Matrimony profile creation
- Gender-based profiles (Bride/Groom)
- Profile matching
- Approval workflow

#### 7. **Donation & Campaign Models**
- Campaign creation and management
- Donation tracking
- Goal and progress tracking
- Multiple payment methods

#### 8. **News Model**
- Community news publishing
- Category organization
- Automatic date tracking
- Community association

#### 9. **Family & Family Members Model**
- Family tree structure
- Multiple family members per family
- Relationship tracking
- Age and occupation details

#### 10. **Committee Model**
- Committee member management
- Designation and tenure tracking
- Contact information
- Photo support

### API Endpoints Available

#### Authentication
```
POST /api/auth/login/          - User login with JWT
POST /api/auth/register/       - User registration
POST /api/auth/login/refresh/  - Refresh JWT token
GET  /api/auth/me/             - Get current user profile
```

#### Communities
```
GET    /api/communities/                   - List all communities
POST   /api/communities/                   - Create community (Admin)
GET    /api/communities/{id}/              - Get community details
PATCH  /api/communities/{id}/              - Update community
DELETE /api/communities/{id}/              - Delete community
GET    /api/communities/{id}/statistics/   - Get community stats
```

#### Members
```
GET    /api/members/                       - List all members
GET    /api/members/?community_id=X        - Filter by community
GET    /api/members/?role=community_admin  - Filter by role
GET    /api/members/?status=Verified       - Filter by status
POST   /api/members/                       - Create member
PATCH  /api/members/{id}/                  - Update member
```

#### Events
```
GET    /api/events/                        - List all events
GET    /api/events/?community_id=X         - Community events
GET    /api/events/?status=Upcoming        - Filter by status
GET    /api/events/upcoming/               - Next 5 upcoming events
POST   /api/events/                        - Create event (Admin)
PATCH  /api/events/{id}/                   - Update event
```

#### Businesses
```
GET    /api/businesses/                    - List all businesses
GET    /api/businesses/?community_id=X     - Community businesses
GET    /api/businesses/?verified=true      - Only verified
GET    /api/businesses/?category=Food      - Filter by category
POST   /api/businesses/                    - Add business
```

#### Jobs
```
GET    /api/jobs/                          - List all jobs
GET    /api/jobs/?community_id=X           - Community jobs
GET    /api/jobs/?type=Full-time           - Filter by type
GET    /api/jobs/?category=Tech            - Filter by category
POST   /api/jobs/                          - Post new job
```

#### Matrimony
```
GET    /api/matrimony/                     - List profiles
GET    /api/matrimony/?gender=Bride        - Filter by gender
POST   /api/matrimony/                     - Create profile
```

#### Campaigns & Donations
```
GET    /api/campaigns/                     - List campaigns
GET    /api/campaigns/?community_id=X      - Community campaigns
POST   /api/donations/                     - Make donation
GET    /api/donations/?campaign_id=X       - Campaign donations
```

#### News
```
GET    /api/news/                          - All news
GET    /api/news/?community_id=X           - Community news
GET    /api/news/?category=Events          - Filter by category
POST   /api/news/                          - Publish news
```

#### Committee
```
GET    /api/committee/                     - List committee members
GET    /api/committee/?community_id=X      - Community committee
POST   /api/committee/                     - Add committee member
```

#### Families
```
GET    /api/families/                      - List families
GET    /api/families/?community_id=X       - Community families
POST   /api/families/                      - Create family
```

### Default Admin Login
**Username:** admin  
**Password:** admin123  
**Email:** admin@samaj.in

### How to Start the Backend

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Activate virtual environment:**
   - **Windows (PowerShell):** `venv\Scripts\Activate.ps1`
   - **Windows (CMD):** `venv\Scripts\activate`
   - **Mac/Linux:** `source venv/bin/activate`

3. **Start Django server:**
   ```bash
   python manage.py runserver 8000
   ```

4. **Backend will run at:** `http://localhost:8000`

5. **Admin panel:** `http://localhost:8000/admin` (Login with admin credentials above)

### Database
- **Type:** SQLite (db.sqlite3)
- **Auto-created tables:** All 11 models with full relationships
- **Migrations:** Already created and applied

### Key Features Implemented

✅ **Full CRUD Operations** - Create, Read, Update, Delete for all resources  
✅ **Filtering & Search** - Filter by community, status, type, category, etc.  
✅ **Authentication** - JWT-based authentication with roles  
✅ **Image Handling** - Support for logos, covers, avatars, photos  
✅ **Relationships** - Proper model relationships with cascading deletes  
✅ **Permissions** - Role-based access control (Admin, Community Admin, Member)  
✅ **CORS Enabled** - Frontend can communicate with backend  
✅ **REST API** - Full RESTful API design  

### Next Steps

1. **Start Frontend (if not running):**
   ```bash
   npm run dev
   ```
   Frontend runs at: `http://localhost:8080`

2. **Frontend will now connect to:**
   - Backend API: `http://localhost:8000/api/`
   - Authentication: Login/Register endpoints

3. **Admin Dashboard:**
   - Go to `http://localhost:8000/admin`
   - Use credentials: admin / admin123
   - Manage all data dynamically

### Customization Tips

#### Add a new Community via API:
```bash
curl -X POST http://localhost:8000/api/communities/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Community",
    "type": "Super",
    "state": "Gujarat",
    "district": "Ahmedabad",
    "taluka": "City",
    "village": "Village",
    "plan": "Pro",
    "status": "Active"
  }'
```

#### Create an Event:
```bash
curl -X POST http://localhost:8000/api/events/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Community Event",
    "date": "2026-07-15",
    "time": "10:00 AM",
    "venue": "Community Hall",
    "status": "Upcoming",
    "community": 1
  }'
```

### Troubleshooting

**"No module named 'django'"**
- Ensure virtual environment is activated
- Run: `pip install -r requirements.txt`

**"Port 8000 already in use"**
- Use different port: `python manage.py runserver 8001`

**"Database locked"**
- Delete `db.sqlite3` and re-run migrations:
  ```bash
  rm db.sqlite3
  python manage.py migrate
  ```

---

**Your website is now fully dynamic! 🎉**

All static data is replaced with dynamic database models managed through:
- REST API endpoints
- Django Admin interface
- Frontend admin panels (to be built)

Everything is ready for Super Admin and Community Admin management!
