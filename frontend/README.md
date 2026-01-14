# ReviewFlow Frontend

The React frontend for ReviewFlow, a creative review and approval platform.

## Overview

This is the web interface for ReviewFlow, providing a modern single-page application for creative teams to manage assets, provide feedback with visual annotations, and track approval workflows.

For full product requirements, see the [PRD documentation](../prd-creative-review-platform.md).

## Tech Stack

- **Framework:** React 18
- **Language:** TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS
- **HTTP Client:** Axios (planned)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`.

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Project Structure

```
src/
├── assets/          # Static assets (images, fonts)
├── components/      # Reusable UI components
├── contexts/        # React context providers
├── hooks/           # Custom React hooks
├── pages/           # Page components
├── services/        # API service layer
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── App.tsx          # Root component
└── main.tsx         # Application entry point
```

## Key Features to Implement

Based on the [PRD](../prd-creative-review-platform.md), the frontend includes:

### Authentication
- Login/logout with Sanctum tokens
- Role-based access control
- Protected routes

### Dashboard
- Role-specific views (Admin, PM, Creative)
- Pending tasks overview
- Recent activity feed
- Quick upload button

### Project Management
- Project list with filters
- Project detail with asset grid
- Team member management
- Status indicators

### Asset Review
- Asset preview (images, videos, PDFs)
- Rectangle annotation tool
- Video playback with timestamp markers
- Version history and comparison
- Comment panel with resolution tracking

### Creative Requests
- Request queue for creatives
- Request detail with brief and specs
- Request-to-asset linking
- Status workflow

### Admin Panel
- User management
- System settings (Discord webhook)
- Platform analytics

## Design Principles

From the PRD:

- Clean, minimal interface focused on content
- Dark mode support
- Desktop-first, responsive design
- Keyboard shortcuts for power users

## Connecting to Backend

Configure the API base URL in your environment:

```env
VITE_API_URL=http://localhost
```

The backend API documentation is available in the [backend README](../backend/README.md).

## ESLint Configuration

The project uses ESLint with TypeScript support. For stricter type checking:

```js
// eslint.config.js
export default defineConfig([
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      tseslint.configs.recommendedTypeChecked,
      // or for stricter rules:
      // tseslint.configs.strictTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

## Building for Production

```bash
# Create optimized production build
npm run build

# Preview the build locally
npm run preview
```

The build output will be in the `dist/` directory.

## License

Proprietary - Internal use only.
