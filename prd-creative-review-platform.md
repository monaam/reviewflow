# Product Requirements Document (PRD)

## Creative Review & Approval Platform

**Internal Codename:** ReviewFlow  
**Version:** 1.0  
**Author:** Trybe  
**Date:** January 2026

---

## 1. Executive Summary

### 1.1 Problem Statement

Our agency's current creative review process relies on Google Drive links shared through Discord. This workflow creates several pain points:

- **No centralized tracking** — difficult to know which assets are pending, approved, or need revisions
- **Scattered feedback** — comments live in Discord threads, often lost or overlooked
- **No visual context** — reviewers describe issues verbally instead of pointing directly at problem areas
- **Version confusion** — unclear which version is the latest or what changed between iterations
- **No accountability** — no clear audit trail of who approved what and when

### 1.2 Solution

Build a lightweight internal web application that allows creative team members to upload assets, receive visual feedback with annotations, and track approvals through a simple workflow.

### 1.3 Success Metrics

| Metric | Current State | Target |
|--------|---------------|--------|
| Average approval turnaround time | ~48 hours | < 24 hours |
| Revision rounds per asset | 3-4 | 1-2 |
| Time spent searching for feedback | ~30 min/day | < 5 min/day |
| Missed feedback incidents | ~5/week | 0 |

---

## 2. User Roles & Permissions

### 2.1 Role Definitions

#### Administrator
The system owner responsible for overall platform management.

**Permissions:**
- All permissions of other roles
- Create, edit, deactivate user accounts
- Assign roles to users
- Create and archive projects
- Configure system settings (notification preferences, storage limits)
- View platform-wide analytics and reports
- Delete any asset or comment

**Typical users:** Agency owner, Operations lead

---

#### Project Manager (PM)
Responsible for overseeing projects and providing final approvals.

**Permissions:**
- Create and manage projects they own
- Invite team members to projects
- View all assets within their projects
- Add comments and annotations on any asset
- **Approve or request revisions** on assets
- Set deadlines for assets
- Receive notifications for new uploads and revision completions
- Export approval history/reports for their projects
- Archive completed projects

**Typical users:** Account managers, Creative directors, Project leads

---

#### Creative
Designers and editors who produce and upload creative assets.

**Permissions:**
- View projects they are assigned to
- Upload new assets to assigned projects
- Upload new versions of their own assets
- Add comments on any asset (for discussion with PMs or other creatives)
- Mark revision requests as addressed
- View feedback and annotations on their assets
- Receive notifications when feedback is provided

**Typical users:** Graphic designers, Video editors, Motion designers, Illustrators

---

#### Reviewer (Optional — for client access in future)
External stakeholders who can view and comment but not upload.

**Permissions:**
- View specific projects/assets they are invited to
- Add comments and annotations
- Approve or request revisions (if granted by PM)
- Cannot upload or delete assets

**Typical users:** Clients, External stakeholders (future consideration)

---

### 2.2 Permission Matrix

| Action | Admin | PM | Creative | Reviewer |
|--------|-------|-----|----------|----------|
| Create users | ✓ | ✗ | ✗ | ✗ |
| Create projects | ✓ | ✓ | ✗ | ✗ |
| Archive projects | ✓ | ✓ (own) | ✗ | ✗ |
| Delete projects | ✓ | ✗ | ✗ | ✗ |
| Invite to project | ✓ | ✓ (own) | ✗ | ✗ |
| Upload assets | ✓ | ✓ | ✓ | ✗ |
| Upload new version | ✓ | ✓ | ✓ (own) | ✗ |
| Delete assets | ✓ | ✓ (own project) | ✓ (own) | ✗ |
| Add comments | ✓ | ✓ | ✓ | ✓ |
| Delete comments | ✓ | ✓ (own project) | ✓ (own) | ✓ (own) |
| Approve assets | ✓ | ✓ | ✗ | ✓* |
| Request revisions | ✓ | ✓ | ✗ | ✓* |
| View all projects | ✓ | ✗ | ✗ | ✗ |
| View analytics | ✓ | ✓ (own) | ✗ | ✗ |

*If explicitly granted by PM

---

## 3. Core Features

### 3.1 Project Management

#### 3.1.1 Project Creation
- **Fields:** Name, description, client name (optional), deadline (optional), cover image (optional)
- **Auto-generated:** Unique project ID, creation date, created by
- **Status:** Active, On Hold, Completed, Archived

#### 3.1.2 Project Dashboard
- List of all assets with status indicators (pending, in review, approved, revision requested)
- Progress bar showing approval completion percentage
- Recent activity feed
- Quick filters: by status, by assignee, by date

#### 3.1.3 Team Assignment
- Add/remove team members from projects
- Set notification preferences per project member

---

### 3.2 Asset Management

#### 3.2.1 Supported Asset Types

| Type | Formats | Max Size |
|------|---------|----------|
| Images | JPG, PNG, GIF, WEBP, SVG | 50 MB |
| Videos | MP4, MOV, WEBM | 500 MB |
| Documents | PDF | 50 MB |
| Design Files | (View as rendered preview or PDF export) | 100 MB |

#### 3.2.2 Asset Upload Flow
1. Creative selects project
2. Drags/drops or selects files
3. Adds title and optional description
4. Optionally tags PM for immediate notification
5. Asset enters "Pending Review" status

#### 3.2.3 Version Control
- Each new upload to an existing asset creates a new version
- Version history panel shows all versions with timestamps
- Side-by-side comparison view (v1 vs v2, etc.)
- Comments are version-specific (don't carry over)
- Previous versions remain accessible but clearly marked

#### 3.2.4 Asset Statuses

```
┌─────────────────┐
│  Pending Review │ ← Initial upload
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   In Review     │ ← PM opens and views
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌──────────────────┐
│Approved│ │Revision Requested│
└───────┘ └────────┬─────────┘
                   │
                   ▼
          ┌───────────────────┐
          │  Revision Uploaded │ → Returns to "Pending Review"
          └───────────────────┘
```

---

### 3.3 Review & Annotation System

#### 3.3.1 Annotation Tools

**Rectangle Annotation (All Asset Types):**
- Click and drag to draw a rectangle highlight on the asset
- Rectangle visually highlights the area of concern
- Each rectangle is linked to exactly one comment

**For Videos:**
- Pause at any frame
- Draw rectangle annotation on paused frame
- Timestamp automatically captured and linked to comment
- Click comment to jump to timestamp and display rectangle

#### 3.3.2 Comment Features
- Plain text only (no rich text formatting)
- Single-level comments (no nested replies)
- Mark as resolved/unresolved
- Edit/delete own comments

#### 3.3.3 Annotation Data Model

```
Comment:
  - id: UUID
  - asset_id: FK
  - asset_version: Integer
  - user_id: FK
  - content: Text (plain text)
  - rectangle: JSON { x: float, y: float, width: float, height: float } (nullable)
  - video_timestamp: Float (nullable, seconds)
  - is_resolved: Boolean
  - created_at: Timestamp
  - updated_at: Timestamp
```

#### 3.3.4 Review Interface Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Back to Project    Asset Name v2         [Approve] [Request] │
├────────────────────────────────────┬─────────────────────────────┤
│                                    │  Comments (5)               │
│                                    │  ┌─────────────────────────┐│
│                                    │  │ 1. John: Fix the logo   ││
│      [ASSET PREVIEW AREA]          │  │    alignment here       ││
│                                    │  │    ☑ Resolved           ││
│      - Click & drag to annotate    │  ├─────────────────────────┤│
│      - Video controls below        │  │ 2. Sarah: Colors look   ││
│                                    │  │    washed out           ││
│                                    │  │    ☐ Unresolved         ││
│                                    │  └─────────────────────────┘│
├────────────────────────────────────┤  ┌─────────────────────────┐│
│  [◄] [▶] advancement slider        │  │ Add comment...          ││
│  00:34 / 02:15                     │  └─────────────────────────┘│
└────────────────────────────────────┴─────────────────────────────┘
│  Version: [v1] [v2•] [v3]  |  Compare Versions                   │
└──────────────────────────────────────────────────────────────────┘
```

---

### 3.4 Approval Workflow

#### 3.4.1 Approval Actions

**Approve:**
- PM clicks "Approve" button
- Optional: Add approval comment
- Asset status changes to "Approved"
- Creative receives notification
- Approval logged with timestamp and approver

**Request Revision:**
- PM clicks "Request Revision" button
- Must add at least one comment explaining needed changes
- Asset status changes to "Revision Requested"
- Creative receives notification with revision details
- Creative uploads new version → status returns to "Pending Review"

#### 3.4.2 Approval History
- Complete audit trail of all status changes
- Who changed status, when, with what comments
- Exportable as PDF for client reporting

---

### 3.5 Creative Requests

Creative Requests allow PMs to formally request work from the creative team before any assets are uploaded.

#### 3.5.1 Request Creation (PM Only)

**Required Fields:**
- Title (e.g., "Homepage Banner for Summer Campaign")
- Description (detailed brief of what's needed)
- Assigned Creative (select from team members)
- Deadline (date and time)
- Project (which project this belongs to)

**Optional Fields:**
- Priority (Low, Normal, High, Urgent)
- Reference attachments (inspiration images, brand guidelines, etc.)
- Dimensions/specs (e.g., "1920x1080px", "16:9 video")

#### 3.5.2 Request Statuses

```
┌─────────────┐
│   Pending   │ ← PM creates request
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ In Progress │ ← Creative acknowledges/starts work
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Asset Submitted │ ← Creative uploads asset linked to request
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────────────┐
│Completed│ │Revision Requested│ → Returns to "In Progress"
└────────┘ └──────────────────┘
```

#### 3.5.3 Request → Asset Linking

- When a Creative uploads an asset, they can link it to an open request
- Once linked, the request status automatically updates to "Asset Submitted"
- The asset inherits the project from the request
- Multiple assets can be linked to one request (e.g., multiple sizes)

#### 3.5.4 Request Dashboard View

**For PMs:**
- All requests they created
- Filter by status, assignee, deadline
- Overdue requests highlighted in red
- Quick create button

**For Creatives:**
- Requests assigned to them
- Filter by status, deadline
- "My Queue" sorted by deadline (soonest first)

#### 3.5.5 Request Data Model

```
creative_requests:
  - id: UUID
  - project_id: FK
  - title: String
  - description: Text
  - created_by: FK (PM user)
  - assigned_to: FK (Creative user)
  - deadline: Timestamp
  - priority: ENUM (low, normal, high, urgent)
  - status: ENUM (pending, in_progress, asset_submitted, completed, cancelled)
  - specs: JSON (optional dimensions, format requirements)
  - created_at: Timestamp
  - updated_at: Timestamp

request_attachments:
  - id: UUID
  - request_id: FK
  - file_url: String
  - file_name: String
  - uploaded_by: FK
  - created_at: Timestamp

-- Link table for assets submitted against requests
request_assets:
  - request_id: FK
  - asset_id: FK
  - created_at: Timestamp
```

---

### 3.6 Notifications (Discord Integration) (Discord Integration)

#### 3.5.1 Discord Setup
- Admin configures a Discord webhook URL in system settings
- All notifications are sent to a single designated Discord channel
- Notifications include deep links back to the relevant asset/request

#### 3.5.2 Notification Triggers

| Event | Message Format |
|-------|----------------|
| New creative request | `📋 **New Request:** {request_title} — Assigned to: {creative_name} — Due: {deadline} — [View Request](url)` |
| New asset uploaded | `🎨 **New Upload:** {asset_name} in {project_name} by {creative_name} — [Review Now](url)` |
| Asset approved | `✅ **Approved:** {asset_name} approved by {pm_name} — [View](url)` |
| Revision requested | `🔄 **Revision Needed:** {asset_name} — {comment_count} comments — [View Feedback](url)` |
| New comment on asset | `💬 **Comment:** {commenter_name} on {asset_name}: "{comment_preview}..." — [View](url)` |
| New version uploaded | `📤 **New Version:** {asset_name} v{version} uploaded by {creative_name} — [Review](url)` |
| Request deadline approaching | `⏰ **Due Soon:** {request_title} due in 24 hours — Assigned: {creative_name} — [View](url)` |
| Request overdue | `🚨 **Overdue:** {request_title} was due {time_ago} — Assigned: {creative_name} — [View](url)` |

#### 3.5.3 Discord Message Format

```
┌─────────────────────────────────────────────────────┐
│ 🎨 New Upload                                       │
│                                                     │
│ **Homepage Banner v1**                              │
│ Project: Nike Summer Campaign                       │
│ Uploaded by: John Designer                          │
│                                                     │
│ [View and Review →]                                 │
│                                                     │
│ Today at 2:34 PM                                    │
└─────────────────────────────────────────────────────┘
```

---

### 3.7 Dashboard & Analytics

#### 3.6.1 Personal Dashboard (All Users)
- My pending tasks (assets awaiting my action)
- Recent activity on my projects
- Quick upload button
- Notification center

#### 3.6.2 PM Dashboard
- Projects overview with status breakdown
- Assets pending my approval
- Team workload view
- Overdue items alert

#### 3.6.3 Admin Analytics
- Total assets processed (by period)
- Average approval time
- Revision rate (how often assets need revisions)
- User activity metrics
- Storage usage

---

## 4. Technical Specifications

### 4.1 Recommended Stack

**Backend:**
- Laravel 11 (given your expertise)
- PostgreSQL (with JSON support for annotation data)
- Redis (for caching and queues)
- Laravel Sanctum (API authentication)

**Frontend:**
- React or Vue 3 (SPA)
- Fabric.js or Konva.js (canvas annotations)
- Video.js (video player with API access)
- TailwindCSS (styling)

**Storage:**
- S3-compatible storage (AWS S3, DigitalOcean Spaces, Cloudflare R2, or MinIO for self-hosted)

**Infrastructure:**
- Laravel Forge (you're familiar with it)
- Single VPS to start (can scale later)

### 4.2 Database Schema (Simplified)

```sql
-- Users & Auth
users
  - id, name, email, password, role, avatar
  - email_verified_at, created_at, updated_at

-- Projects
projects
  - id, name, description, client_name, deadline
  - status (active/on_hold/completed/archived)
  - created_by, created_at, updated_at

project_members
  - project_id, user_id, role_in_project
  - added_at

-- Creative Requests
creative_requests
  - id, project_id, title, description
  - created_by (PM), assigned_to (Creative)
  - deadline, priority (low/normal/high/urgent)
  - status (pending/in_progress/asset_submitted/completed/cancelled)
  - specs (JSON), created_at, updated_at

request_attachments
  - id, request_id, file_url, file_name
  - uploaded_by, created_at

request_assets
  - request_id, asset_id, created_at

-- Assets
assets
  - id, project_id, uploaded_by
  - title, description, type (image/video/pdf)
  - status (pending/in_review/approved/revision_requested)
  - current_version, deadline
  - created_at, updated_at

asset_versions
  - id, asset_id, version_number
  - file_url, file_size, file_meta (JSON: dimensions, duration, etc.)
  - uploaded_by, created_at

-- Comments & Annotations
comments
  - id, asset_id, asset_version, user_id
  - content (plain text)
  - rectangle (JSON: { x, y, width, height }, nullable)
  - video_timestamp (nullable, seconds)
  - is_resolved, resolved_by, resolved_at
  - created_at, updated_at

-- Approvals
approval_logs
  - id, asset_id, asset_version, user_id
  - action (approved/revision_requested/reopened)
  - comment, created_at

-- System Settings
settings
  - key, value
  - (stores discord_webhook_url, etc.)
```

### 4.3 API Endpoints (Core)

```
Authentication:
  POST   /auth/login
  POST   /auth/logout
  GET    /auth/me

Projects:
  GET    /projects
  POST   /projects
  GET    /projects/{id}
  PATCH  /projects/{id}
  DELETE /projects/{id}
  POST   /projects/{id}/members
  DELETE /projects/{id}/members/{userId}

Creative Requests:
  GET    /projects/{id}/requests
  POST   /projects/{id}/requests
  GET    /requests/{id}
  PATCH  /requests/{id}
  DELETE /requests/{id}
  POST   /requests/{id}/start          (Creative marks as in progress)
  POST   /requests/{id}/complete       (PM marks as completed)

Assets:
  GET    /projects/{id}/assets
  POST   /projects/{id}/assets
  GET    /assets/{id}
  PATCH  /assets/{id}
  DELETE /assets/{id}
  POST   /assets/{id}/versions
  GET    /assets/{id}/versions
  POST   /assets/{id}/link-request     (Link asset to request)

Comments:
  GET    /assets/{id}/comments
  POST   /assets/{id}/comments
  PATCH  /comments/{id}
  DELETE /comments/{id}
  POST   /comments/{id}/resolve

Approvals:
  POST   /assets/{id}/approve
  POST   /assets/{id}/request-revision

Admin:
  GET    /admin/settings
  PATCH  /admin/settings               (Discord webhook URL, etc.)
  GET    /admin/users
  POST   /admin/users
  PATCH  /admin/users/{id}
```

---

## 5. User Interface Specifications

### 5.1 Key Screens

1. **Login**
2. **Dashboard** (role-specific)
3. **Projects List**
4. **Project Detail** (asset grid/list with filters)
5. **Creative Requests List** (with queue view for creatives)
6. **Request Detail** (brief, specs, linked assets)
7. **Asset Review Screen** (main annotation interface)
8. **Version Compare Screen**
9. **Admin: User Management**
10. **Admin: Settings** (Discord webhook configuration)

### 5.2 Design Principles
- Clean, minimal interface — focus on the content
- Dark mode support (designers often prefer it)
- Responsive but desktop-first (primary use case)
- Keyboard shortcuts for power users (J/K to navigate, A to approve, etc.)

---

## 6. Implementation Phases

### Phase 1: MVP (6-8 weeks)

**Goal:** Complete replacement for Discord + GDrive workflow

- User authentication with roles (Admin, PM, Creative)
- Project CRUD
- **Creative Requests** (create, assign, track status, reference attachments)
- Request → Asset linking workflow
- Asset upload (images, videos, PDFs) with status workflow
- Video playback with timestamp-linked comments
- PDF support with page navigation
- Rectangle annotation with plain text comments
- Version history and comparison
- Simple approval/revision request flow
- Discord webhook notifications
- Dashboard with request queue for creatives

**Deliverable:** Fully functional internal tool for requesting, uploading, and reviewing all asset types

---

### Phase 2: Polish & UX (2-3 weeks)

**Goal:** Improve efficiency and usability

- Keyboard shortcuts
- Bulk actions (approve multiple, etc.)
- Dashboard analytics
- Dark mode
- Performance optimization
- Overdue request alerts

**Deliverable:** Production-ready internal tool

---

### Phase 3: Future Considerations

- External reviewer (client) access with limited permissions
- Mobile-responsive improvements
- AI-assisted feedback (auto-detect common issues)
- Public API / webhook integrations for external tools

---

## 7. Security Considerations

- All file uploads scanned for malware
- Signed URLs for asset access (time-limited)
- Role-based access control enforced at API level
- Audit log for sensitive actions
- HTTPS only
- Regular backups of database and file storage

---

## 8. Open Questions

1. **Storage provider:** S3, DigitalOcean Spaces, or Cloudflare R2?
2. **File size limits:** What's the maximum video file size your team typically uploads?
3. **User onboarding:** Should Admin create all users, or allow self-registration with admin approval?
4. **Request templates:** Should PMs be able to save request templates for common work types?
5. **Archive policy:** Auto-archive completed projects after X days, or manual only?

---

## 9. Appendix

### 9.1 Competitive Reference

| Feature | Ziflow | Frame.io | Filestage | ReviewFlow (Ours) |
|---------|--------|----------|-----------|-------------------|
| Image annotation | ✓ | ✓ | ✓ | ✓ (rectangle only) |
| Video annotation | ✓ | ✓ | ✓ | ✓ |
| Version compare | ✓ | ✓ | ✓ | ✓ |
| Approval workflow | ✓ | ✓ | ✓ | ✓ |
| Creative requests | ✗ | ✗ | ✗ | ✓ |
| Discord notifications | ✗ | ✗ | ✗ | ✓ |
| Client access | ✓ | ✓ | ✓ | Phase 4 |
| Self-hosted | ✗ | ✗ | ✗ | ✓ |
| Cost | $$$$ | $$$ | $$ | Internal |

### 9.2 Glossary

- **Asset:** Any creative file uploaded for review
- **Version:** A specific iteration of an asset
- **Annotation:** Rectangle highlight drawn on an asset to indicate an area of feedback
- **Comment:** Plain text feedback, optionally attached to an annotation
- **Approval:** Final sign-off that an asset is ready for delivery
- **Creative Request:** A formal work request from a PM to a Creative with deadline and specs

---

*Document version: 1.0*  
*Last updated: January 2026*
