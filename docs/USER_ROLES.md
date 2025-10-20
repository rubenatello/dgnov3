# User Role Management for DGNO

## Overview

DGNO uses Firebase Custom Claims for role-based access control. This ensures secure, scalable permissions that work with your Firestore and Storage security rules.

## Available Roles

| Role | Permissions |
|------|-------------|
| `reader` | Read published articles, create comments |
| `writer` | Create/edit own articles, upload media, publish articles |
| `editor` | All writer permissions + edit any article, moderate comments |
| `admin` | All editor permissions + user management, site settings |
| `superuser` | All permissions (development/emergency access) |

## Setting Up User Roles

### Prerequisites

1. **Service Account Key** (for production):
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `service-account-key.json` (do NOT commit to git)
   - Set environment variable: `GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json`

2. **Install Firebase Admin SDK**:
   ```bash
   npm install firebase-admin
   ```

### Grant Roles to Users

```bash
# Make a user a writer
node scripts/setup-user-roles.js writer@dgno.us writer

# Make a user an editor  
node scripts/setup-user-roles.js rubencazpress@proton.me editor

# Make a user an admin
node scripts/setup-user-roles.js admin@dgno.us admin

# Check current roles
node scripts/setup-user-roles.js user@example.com
```

### For Local Development (Emulator)

When using the Firebase emulator, custom claims don't work the same way. Your security rules have a fallback mechanism that checks the `users` collection:

```javascript
// Your rules check both:
// 1. request.auth.token.roles.writer (custom claims - production)
// 2. get(/databases/.../users/{uid}).data.rolesMap.writer (fallback - emulator)
```

## How It Works

### 1. Custom Claims (Production)
```javascript
// Set via Admin SDK
await admin.auth().setCustomUserClaims(uid, {
  roles: { writer: true, editor: true }
});

// Available in security rules as:
// request.auth.token.roles.writer == true
```

### 2. Firestore Fallback (Emulator + Backup)
```javascript
// Also stored in users/{uid} document
{
  rolesMap: { writer: true, editor: true },
  isStaff: true,
  isActive: true
}

// Available in security rules as:
// get(/databases/.../users/{uid}).data.rolesMap.writer == true
```

## Security Rules Integration

Your current rules already handle this correctly:

```javascript
function hasRole(role) {
  return request.auth != null && (
    // Primary: Custom claims (production)
    (request.auth.token.roles != null && request.auth.token.roles[role] == true)
    // Fallback: Firestore document (emulator + backup)
    || (
      exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.rolesMap[role] == true
    )
  );
}
```

## Production Deployment Steps

1. **Deploy rules** (already safe):
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```

2. **Set up your first admin user**:
   ```bash
   # Replace with your email
   node scripts/setup-user-roles.js your-email@dgno.us admin
   ```

3. **Deploy frontend**:
   ```bash
   cd app && npm run build && cd .. && firebase deploy --only hosting
   ```

4. **Grant roles to team members** as needed using the script above.

## Troubleshooting

### "Property roles is undefined"
- **In emulator**: Expected - use the Firestore fallback
- **In production**: User needs custom claims set via the setup script

### "Permission denied" for uploads
- User needs `writer` role or higher
- Check that `mediaService.ts` sets `uploadedBy` metadata (✅ already implemented)

### Custom claims not working
- Ensure service account key is set up correctly
- User may need to sign out and back in for new claims to take effect
- Check both custom claims AND Firestore user document

## Best Practices

1. **Always use the setup script** for role management
2. **Never hardcode roles** in client code
3. **Use custom claims in production** for performance
4. **Keep Firestore fallback** for emulator and backup
5. **Audit role assignments** regularly
6. **Use least privilege principle** - start with `writer`, promote to `editor`/`admin` as needed

## Example User Flow

1. User signs up → gets `reader` role by default
2. Admin promotes user → `node scripts/setup-user-roles.js user@example.com writer`
3. User can now upload images and create articles
4. Later promotion → `node scripts/setup-user-roles.js user@example.com editor`
5. User can now edit any article and moderate comments