# ReviewFlow Backend API

The backend API for ReviewFlow, a creative review and approval platform built with Laravel 12.

## Overview

ReviewFlow streamlines the creative review process by replacing scattered Discord threads and Google Drive links with a centralized platform for uploading assets, receiving visual feedback, and tracking approvals.

For full product requirements, see the [PRD documentation](../prd-creative-review-platform.md).

## Tech Stack

- **Framework:** Laravel 12
- **PHP Version:** 8.2+
- **Database:** MySQL 8.4 (via Docker/Sail)
- **Authentication:** Laravel Sanctum (token-based API auth)
- **Testing:** PHPUnit 11

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Composer (for initial setup)

### Installation

1. **Clone the repository and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Install PHP dependencies:**
   ```bash
   composer install
   ```

3. **Set up environment:**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Start Docker containers:**
   ```bash
   ./vendor/bin/sail up -d
   ```

5. **Run database migrations:**
   ```bash
   ./vendor/bin/sail artisan migrate
   ```

6. **Seed the database (optional):**
   ```bash
   ./vendor/bin/sail artisan db:seed
   ```

### Running the Application

```bash
# Start all services
./vendor/bin/sail up -d

# View logs
./vendor/bin/sail logs -f

# Stop all services
./vendor/bin/sail down
```

The API will be available at `http://localhost`.

## Running Tests

Tests run in an isolated MySQL `testing` database that Sail creates automatically.

```bash
# Run all tests
./vendor/bin/sail test

# Run specific test suite
./vendor/bin/sail test --testsuite=Feature

# Run with coverage
./vendor/bin/sail test --coverage
```

### Test Structure

```
tests/
├── Feature/
│   └── Api/
│       ├── AuthControllerTest.php
│       ├── ProjectControllerTest.php
│       ├── AssetControllerTest.php
│       ├── CommentControllerTest.php
│       ├── CreativeRequestControllerTest.php
│       ├── DashboardControllerTest.php
│       └── AdminControllerTest.php
├── Unit/
├── Traits/
│   └── ApiTestHelpers.php
└── TestCase.php
```

## API Documentation

### Authentication

All API endpoints (except login) require a Bearer token in the Authorization header:

```
Authorization: Bearer {token}
```

### Endpoints Overview

#### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user |

#### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/{id}` | Get project details |
| PATCH | `/api/projects/{id}` | Update project |
| DELETE | `/api/projects/{id}` | Delete project |
| POST | `/api/projects/{id}/members` | Add member |
| DELETE | `/api/projects/{id}/members/{userId}` | Remove member |

#### Creative Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/{id}/requests` | List project requests |
| POST | `/api/projects/{id}/requests` | Create request |
| GET | `/api/requests/{id}` | Get request details |
| PATCH | `/api/requests/{id}` | Update request |
| DELETE | `/api/requests/{id}` | Delete request |
| POST | `/api/requests/{id}/start` | Mark as in progress |
| POST | `/api/requests/{id}/complete` | Mark as completed |

#### Assets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/{id}/assets` | List project assets |
| POST | `/api/projects/{id}/assets` | Upload asset |
| GET | `/api/assets/{id}` | Get asset details |
| PATCH | `/api/assets/{id}` | Update asset |
| DELETE | `/api/assets/{id}` | Delete asset |
| POST | `/api/assets/{id}/versions` | Upload new version |
| GET | `/api/assets/{id}/versions` | List versions |
| POST | `/api/assets/{id}/approve` | Approve asset |
| POST | `/api/assets/{id}/request-revision` | Request revision |

#### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assets/{id}/comments` | List comments |
| POST | `/api/assets/{id}/comments` | Add comment |
| PATCH | `/api/comments/{id}` | Update comment |
| DELETE | `/api/comments/{id}` | Delete comment |
| POST | `/api/comments/{id}/resolve` | Resolve comment |

#### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get dashboard stats |
| GET | `/api/dashboard/pending-approvals` | List pending approvals |
| GET | `/api/dashboard/my-requests` | List user's requests |

#### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/users` | Create user |
| PATCH | `/api/admin/users/{id}` | Update user |
| GET | `/api/admin/settings` | Get system settings |
| PATCH | `/api/admin/settings` | Update settings |

## User Roles

| Role | Description |
|------|-------------|
| `admin` | Full system access, user management |
| `pm` | Project Manager - creates projects, approves assets |
| `creative` | Uploads and manages own assets |
| `reviewer` | View and comment only (future) |

## Project Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   └── Api/           # API controllers
│   ├── Middleware/        # Custom middleware
│   └── Requests/          # Form requests
├── Models/                # Eloquent models
├── Policies/              # Authorization policies
└── Services/              # Business logic

database/
├── migrations/            # Database migrations
├── factories/             # Model factories
└── seeders/               # Database seeders

routes/
└── api.php               # API route definitions
```

## Environment Variables

Key configuration options in `.env`:

```env
# Application
APP_NAME=ReviewFlow
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost

# Database (Sail defaults)
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=sail
DB_PASSWORD=password

# Sail Configuration
WWWGROUP=1000
WWWUSER=1000
APP_PORT=80
FORWARD_DB_PORT=3306
```

## Background Jobs & Horizon

ReviewFlow uses Laravel Horizon for managing background job processing with Redis queues.

### Prerequisites

- **Redis** - Required for queue processing
- **FFmpeg** - Required for video thumbnail generation
- **ImageMagick** (with Ghostscript) - Required for PDF thumbnail generation

### Configuration

Ensure these environment variables are set in `.env`:

```env
QUEUE_CONNECTION=redis
CACHE_STORE=redis

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

### Running Horizon

```bash
# Start Horizon (development)
./vendor/bin/sail artisan horizon

# Or in production with Supervisor
php artisan horizon
```

### Horizon Dashboard

Access the Horizon dashboard at `/horizon` (admin users only).

### Queue Configuration

| Queue | Purpose | Workers | Timeout |
|-------|---------|---------|---------|
| `default` | General jobs | 3-10 | 60s |
| `thumbnails` | Video/PDF thumbnail generation | 2-3 | 120s |

### Thumbnail Generation

Thumbnails are automatically generated in the background when video or PDF assets are uploaded:

- **Videos**: FFmpeg extracts a frame at 1 second, crops to 480x270 (handles both 16:9 and 9:16)
- **PDFs**: ImageMagick renders the first page, crops from top to show document header

#### Installing Dependencies

**Ubuntu/Debian:**
```bash
sudo apt-get install ffmpeg imagemagick ghostscript
```

**macOS:**
```bash
brew install ffmpeg imagemagick ghostscript
```

**Docker (Sail):** Add to your Dockerfile or use a custom Sail image with these packages.

## Code Quality

```bash
# Run code formatter
./vendor/bin/sail pint

# Run static analysis
./vendor/bin/sail php ./vendor/bin/phpstan analyse
```

## License

This project is proprietary software for internal use.
