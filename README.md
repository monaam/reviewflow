# ReviewFlow

A creative review and approval platform for streamlining the asset review workflow.

## Problem

Traditional creative review processes rely on Google Drive links shared through Discord, causing:

- No centralized tracking of asset statuses
- Scattered feedback across Discord threads
- No visual context for annotations
- Version confusion between iterations
- No audit trail for approvals

## Solution

ReviewFlow provides a unified platform for creative teams to:

- Upload and manage creative assets (images, videos, PDFs)
- Add visual annotations with rectangle highlights
- Track approval workflows with full audit history
- Manage creative requests from brief to delivery
- Receive notifications via Discord integration

## Documentation

- **[Product Requirements Document](./prd-creative-review-platform.md)** - Full PRD with features, user roles, and specifications
- **[Backend API Documentation](./backend/README.md)** - API setup, endpoints, and development guide
- **[Frontend Documentation](./frontend/README.md)** - React frontend setup and development

## Architecture

```
reviewflow/
├── backend/           # Laravel 12 API
│   ├── app/           # Application code
│   ├── database/      # Migrations & seeders
│   ├── routes/        # API routes
│   └── tests/         # PHPUnit tests
├── frontend/          # React + TypeScript SPA
│   └── src/           # React components
└── prd-creative-review-platform.md
```

## Tech Stack

### Backend
- Laravel 12 (PHP 8.2+)
- MySQL 8.4
- Laravel Sanctum (API auth)
- Laravel Sail (Docker)

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS

## Quick Start

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
./vendor/bin/sail up -d
./vendor/bin/sail artisan migrate
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Running Tests

```bash
# Backend tests (via Docker)
cd backend
./vendor/bin/sail test

# Frontend tests
cd frontend
npm test
```

## User Roles

| Role | Capabilities |
|------|-------------|
| **Admin** | Full access, user management, system settings |
| **Project Manager** | Create projects, approve/reject assets, manage team |
| **Creative** | Upload assets, respond to feedback, manage own work |
| **Reviewer** | View and comment (future feature) |

## Key Features

### Asset Management
- Multi-format support (JPG, PNG, GIF, MP4, MOV, PDF)
- Version control with comparison view
- Status tracking (Pending, In Review, Approved, Revision Requested)

### Review System
- Rectangle annotations on any asset type
- Timestamp-linked comments for videos
- Comment resolution tracking
- Plain text feedback

### Creative Requests
- Formal work briefs from PMs to creatives
- Deadline and priority management
- Request-to-asset linking
- Status workflow tracking

### Approval Workflow
- One-click approve/revision actions
- Mandatory feedback on revision requests
- Complete audit trail
- Export-ready approval history

## Success Metrics

| Metric | Target |
|--------|--------|
| Approval turnaround | < 24 hours |
| Revision rounds per asset | 1-2 |
| Time searching for feedback | < 5 min/day |
| Missed feedback incidents | 0 |

## License

Proprietary - Internal use only.

---

*Internal Codename: ReviewFlow | Version 1.0 | January 2026*
