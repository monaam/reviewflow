# Role-Based Asset Actions System

## Overview

The Role-Based Asset Actions System provides a scalable, maintainable way to manage user permissions and action visibility in the asset review page. Instead of scattered inline permission checks, all action definitions live in a single configuration file, making it easy to add, modify, or remove actions.

## Architecture

```
frontend/src/
├── types/
│   └── actions.ts          # Type definitions
├── config/
│   └── assetActions.ts     # Action configuration (single source of truth)
├── hooks/
│   └── useAssetActions.ts  # Hook for computing available actions
└── pages/
    └── AssetReview.tsx     # Consumes the hook
```

## Core Concepts

### 1. Action Definition

Each action is defined with:
- **id**: Unique identifier (e.g., `'approve'`, `'upload-version'`)
- **label**: Display text (can be dynamic based on context)
- **icon**: Lucide icon component
- **roles**: Which roles can see this action (`UserRole[]` or `'all'`)
- **primaryForRoles**: Roles for which this action appears in the toolbar
- **conditions**: Functions that determine if action is visible
- **enabledConditions**: Functions that determine if action is clickable
- **variant**: Button styling (`'primary'`, `'secondary'`, `'success'`, `'warning'`, `'danger'`)
- **showInDropdown**: Whether to show in the overflow menu

### 2. Action Context

Actions receive context to make decisions:

```typescript
interface ActionContext {
  user: User | null;      // Current logged-in user
  asset: Asset;           // Asset being viewed
  comment?: Comment;      // Optional comment (for comment-specific actions)
}
```

### 3. Computed Actions

The hook processes definitions into render-ready objects:

```typescript
interface ComputedAction {
  id: string;
  label: string;           // Resolved label (if it was a function)
  icon: LucideIcon;
  isPrimary: boolean;      // Show in toolbar?
  isDisabled: boolean;     // Clickable?
  variant: ActionVariant;
  showInDropdown: boolean;
  tooltip?: string;        // Shown when disabled
}
```

## File Reference

### `frontend/src/types/actions.ts`

Contains all TypeScript interfaces and types:

```typescript
// Context passed to condition functions
export interface ActionContext { ... }

// Condition function signature
export type ActionCondition = (ctx: ActionContext) => boolean;

// Full action definition
export interface ActionDefinition { ... }

// Computed action ready for rendering
export interface ComputedAction { ... }

// Handler map type
export type ActionHandlers = Record<string, () => void>;
```

### `frontend/src/config/assetActions.ts`

Single source of truth for all actions. Contains:

#### Reusable Conditions

```typescript
const conditions = {
  isOwner: (ctx) => ctx.user?.id === ctx.asset.uploaded_by,
  notLocked: (ctx) => !ctx.asset.is_locked,
  isLocked: (ctx) => ctx.asset.is_locked,
  notApproved: (ctx) => ctx.asset.status !== 'approved',
  hasMultipleVersions: (ctx) => (ctx.asset.versions?.length ?? 0) > 1,
  isAdminOrPm: (ctx) => ctx.user?.role === 'admin' || ctx.user?.role === 'pm',
  canManageAsset: (ctx) => { /* admin, pm, or creative owner */ },
};
```

#### Action Definitions

| Action | ID | Roles | Primary For | Conditions |
|--------|-----|-------|-------------|------------|
| Approve | `approve` | admin, pm | admin, pm | notApproved |
| Request Revision | `request-revision` | admin, pm | admin, pm | notApproved |
| Upload Version | `upload-version` | admin, pm, creative | creative | canManageAsset, notLocked* |
| Compare Versions | `compare-versions` | all | reviewer | hasMultipleVersions |
| View Timeline | `view-timeline` | all | creative, reviewer | - |
| Lock/Unlock | `lock` | admin, pm | - | - |
| Download | `download` | all | - | - |
| Download All | `download-all` | all | - | hasMultipleVersions |
| Edit | `edit` | admin, pm, creative | - | canManageAsset |
| Delete | `delete` | admin, pm, creative | - | canManageAsset |

*Uses `enabledConditions` - action is visible but disabled when locked

### `frontend/src/hooks/useAssetActions.ts`

Hook that computes available actions based on current user and asset.

**Note:** The hook safely handles `null` assets by returning empty arrays, making it safe to call before data is loaded.

```typescript
const {
  primaryActions,    // Actions for toolbar (empty if asset is null)
  dropdownActions,   // Actions for overflow menu (empty if asset is null)
  canPerform,        // (actionId: string) => boolean
  getCommentActions  // (comment: Comment) => { canDelete, canResolve }
} = useAssetActions({ asset, user });  // asset can be null
```

## Usage Guide

### Basic Usage in a Component

```tsx
import { useAssetActions } from '../hooks/useAssetActions';
import { ActionHandlers } from '../types/actions';

function MyComponent({ asset }) {
  const { user } = useAuthStore();
  const { primaryActions, dropdownActions } = useAssetActions({ asset, user });

  // Define handlers for each action
  const actionHandlers: ActionHandlers = {
    'approve': () => handleApprove(),
    'request-revision': () => handleRevision(),
    'upload-version': () => setShowUploadModal(true),
    // ... etc
  };

  return (
    <div>
      {/* Render primary actions */}
      {primaryActions.map((action) => (
        <button
          key={action.id}
          onClick={actionHandlers[action.id]}
          disabled={action.isDisabled}
          title={action.tooltip}
          className={`btn-${action.variant}`}
        >
          <action.icon className="w-4 h-4" />
          {action.label}
        </button>
      ))}

      {/* Render dropdown actions */}
      <DropdownMenu>
        {dropdownActions.map((action) => (
          <DropdownItem
            key={action.id}
            onClick={actionHandlers[action.id]}
            disabled={action.isDisabled}
          >
            <action.icon /> {action.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </div>
  );
}
```

### Checking Permissions Programmatically

```tsx
const { canPerform } = useAssetActions({ asset, user });

if (canPerform('upload-version')) {
  // User can upload a new version
}
```

### Comment Actions

```tsx
const { getCommentActions } = useAssetActions({ asset, user });

function CommentItem({ comment }) {
  const { canDelete, canResolve } = getCommentActions(comment);

  return (
    <div>
      {canDelete && <button onClick={() => deleteComment(comment.id)}>Delete</button>}
      {canResolve && <button onClick={() => resolveComment(comment.id)}>Resolve</button>}
    </div>
  );
}
```

## Adding a New Action

### Step 1: Add to Configuration

Edit `frontend/src/config/assetActions.ts`:

```typescript
// Add any new conditions if needed
const conditions = {
  // ... existing conditions
  myNewCondition: (ctx: ActionContext): boolean => {
    return /* your logic */;
  },
};

// Add the action definition
export const assetActions: ActionDefinition[] = [
  // ... existing actions
  {
    id: 'my-new-action',
    label: 'My Action',
    icon: MyIcon,  // Import from lucide-react
    roles: ['admin', 'pm'],  // or 'all'
    primaryForRoles: ['admin'],  // Optional: show in toolbar for these roles
    conditions: [conditions.myNewCondition],  // Optional: visibility conditions
    enabledConditions: [conditions.notLocked],  // Optional: enabled conditions
    variant: 'secondary',
    showInDropdown: true,  // or false for toolbar-only
    disabledTooltip: 'Cannot perform this action because...',  // Optional
  },
];
```

### Step 2: Add Handler

Edit the component using the hook (e.g., `AssetReview.tsx`):

```typescript
const actionHandlers: ActionHandlers = {
  // ... existing handlers
  'my-new-action': () => handleMyNewAction(),
};
```

### Step 3: Done!

The action will automatically appear in the correct location based on role and conditions.

## Action Visibility Logic

```
User opens asset review page
         │
         ▼
┌─────────────────────────────────────┐
│  For each action definition:        │
│                                     │
│  1. Check if user role is allowed   │
│     (roles: ['admin'] or 'all')     │
│           │                         │
│           ▼                         │
│  2. Check visibility conditions     │
│     (conditions: [...])             │
│           │                         │
│           ▼                         │
│  3. Compute if primary for role     │
│     (primaryForRoles: [...])        │
│           │                         │
│           ▼                         │
│  4. Check enabled conditions        │
│     (enabledConditions: [...])      │
│           │                         │
│           ▼                         │
│  5. Return ComputedAction           │
└─────────────────────────────────────┘
         │
         ▼
   Hook returns:
   - primaryActions (toolbar)
   - dropdownActions (menu)
```

## Role-Action Matrix

| Action | Admin | PM | Creative | Reviewer |
|--------|:-----:|:--:|:--------:|:--------:|
| Approve | Primary | Primary | - | - |
| Request Revision | Primary | Primary | - | - |
| Upload Version | Dropdown | Dropdown | Primary* | - |
| Compare Versions | Dropdown | Dropdown | Dropdown | Primary |
| View Timeline | Dropdown | Dropdown | Primary | Primary |
| Lock/Unlock | Dropdown | Dropdown | - | - |
| Download | Dropdown | Dropdown | Dropdown | Dropdown |
| Download All | Dropdown | Dropdown | Dropdown | Dropdown |
| Edit | Dropdown | Dropdown | Dropdown* | - |
| Delete | Dropdown | Dropdown | Dropdown* | - |

*Creative users can only perform these actions on assets they uploaded

## Testing Checklist

### Admin Role
- [ ] Approve button visible in toolbar (when not approved)
- [ ] Revision button visible in toolbar (when not approved)
- [ ] Upload Version visible
- [ ] Lock/Unlock in dropdown
- [ ] Edit in dropdown
- [ ] Delete in dropdown
- [ ] Download in dropdown
- [ ] Compare Versions in dropdown (when multiple versions)

### PM Role
- [ ] Same as Admin

### Creative Role (Own Asset)
- [ ] Upload Version in toolbar (primary)
- [ ] Upload Version disabled when locked (with tooltip)
- [ ] Timeline button in toolbar (primary)
- [ ] Edit in dropdown
- [ ] Delete in dropdown
- [ ] Download in dropdown
- [ ] No Approve/Revision buttons

### Creative Role (Others' Asset)
- [ ] No Upload Version
- [ ] No Edit
- [ ] No Delete
- [ ] Timeline button visible
- [ ] Download visible

### Reviewer Role
- [ ] Compare Versions in toolbar (primary)
- [ ] Timeline in toolbar (primary)
- [ ] Download in dropdown
- [ ] No Approve/Revision
- [ ] No Upload/Edit/Delete/Lock

## Migration Notes

### Before (Inline Checks)

```tsx
// Multiple scattered checks
const canApprove = user?.role === 'admin' || user?.role === 'pm';
const canLock = user?.role === 'admin' || user?.role === 'pm';
const canUploadVersion = (user?.role === 'admin' || user?.role === 'pm' ||
  (user?.role === 'creative' && asset?.uploaded_by === user.id)) && !asset?.is_locked;

// Repeated in JSX
{canApprove && <button>Approve</button>}
{canLock && <button>Lock</button>}
```

### After (Centralized)

```tsx
// Single hook call
const { primaryActions, dropdownActions } = useAssetActions({ asset, user });

// Dynamic rendering
{primaryActions.map(action => <ActionButton key={action.id} action={action} />)}
```

## Benefits

1. **Single Source of Truth**: All action permissions defined in one file
2. **Type Safety**: Full TypeScript support with intellisense
3. **Easy Maintenance**: Add/modify actions by editing config, not JSX
4. **Testable**: Condition functions can be unit tested independently
5. **Consistent**: Same permission logic applied everywhere
6. **Scalable**: Easy to add new actions or roles
7. **Self-Documenting**: Configuration serves as documentation

## Related Files

- `frontend/src/types/actions.ts` - Type definitions
- `frontend/src/config/assetActions.ts` - Action configuration
- `frontend/src/hooks/useAssetActions.ts` - Hook implementation
- `frontend/src/pages/AssetReview.tsx` - Primary consumer
- `frontend/src/components/layout/Sidebar.tsx` - Similar pattern for navigation
