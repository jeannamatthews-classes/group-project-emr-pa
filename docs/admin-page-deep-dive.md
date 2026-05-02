# EMR-PA Admin Page Notes

## What This Document Covers

This document explains how the admin area works in the version of the app that is actually being used now.

The active app lives in:

- `apps/frontend`
- `apps/backend`

There is also an older root-level `src/` frontend in the repository, but the real workspace scripts point to `apps/frontend`, so this document focuses on that version.

The goal here is simple:

- explain the frontend side in plain English
- explain the backend side in plain English
- show how the frontend and backend connect to each other
- explain every action the admin can take
- explain what requests are sent, why they are sent, and what the server does with them

## Quick Picture

The admin area is not one single screen. It is a small system made of:

- login
- route protection
- a shared admin layout
- a user management page
- a system logs page
- a settings page
- backend admin routes
- database writes and audit logs

The frontend decides what to show and when to send requests.

The backend decides whether the request is allowed, changes the database if needed, and sends the result back.

## Frontend Notes

### 1. Frontend Files That Matter

These are the main frontend files for the admin area:

- `apps/frontend/src/main.tsx`
- `apps/frontend/src/components/RequireRole.tsx`
- `apps/frontend/src/pages/Portal.tsx`
- `apps/frontend/src/pages/admin/AdminUsersPage.tsx`
- `apps/frontend/src/pages/admin/SystemLogsPage.tsx`
- `apps/frontend/src/pages/admin/SettingsPage.tsx`
- `apps/frontend/src/components/admin/AdminShell.tsx`
- `apps/frontend/src/components/admin/AdminSidebar.tsx`
- `apps/frontend/src/components/admin/UserManagementPanel.tsx`
- `apps/frontend/src/components/admin/SystemLogsPanel.tsx`
- `apps/frontend/src/components/account/AccountSettingsPanel.tsx`
- `apps/frontend/src/components/UserNameBadge.tsx`
- `apps/frontend/src/components/LogoutButton.tsx`
- `apps/frontend/src/services/authApi.ts`

### 2. Admin Routes in the Frontend

The admin area has three frontend routes:

- `/admin/users`
- `/admin/logs`
- `/admin/settings`

These routes are registered in `apps/frontend/src/main.tsx`.

Each one is wrapped in `RequireRole` with:

```tsx
allowed={["admin"]}
```

That means the route should only open for a logged-in user whose role is `admin`.

### 3. How an Admin Gets to the Admin Area

The frontend path into the admin area works like this:

1. The user signs in on the login page.
2. The login request returns the user and a token.
3. The frontend stores the token in `localStorage` under `auth_token`.
4. If the role is `admin`, the frontend sends the user to `/portal`.
5. From the portal page, the admin can click `Go to Admin Page`.
6. That button goes to `/admin/users`.

So the current app does not send admins directly to the admin users page after login. It sends them to the portal first.

### 4. How the Frontend Checks That the User Is Really an Admin

The main guard is `RequireRole`.

When an admin route loads, `RequireRole` does this:

1. Reads the token from `localStorage`.
2. If there is no token, sends the user to `/login`.
3. If there is a token, calls `getMe(token)`.
4. Looks at `me.user.role`.
5. If the role is allowed, the page is rendered.
6. If the role is not allowed, the frontend logs the user out and redirects away.

This matters because the frontend does not simply trust that being on an `/admin/...` URL means the person should be there. It checks the logged-in user first.

### 5. How the Frontend Talks to the Backend

All of the request helpers live in `apps/frontend/src/services/authApi.ts`.

This file does a few important jobs:

- figures out the backend base URL
- sends `fetch` requests
- adds the auth token
- parses JSON responses
- throws readable errors when something fails

### Base URL setup

The frontend starts from:

- `VITE_API_BASE_URL`

If that environment variable is not set, it falls back to:

- `http://localhost:5001/api/auth`

From that auth base URL, the frontend builds:

- auth URLs like `/api/auth/login`
- admin URLs like `/api/admin/users`

So the frontend does not hardcode two separate servers. It derives the admin URLs from the auth URL.

### Auth header

For protected requests, the frontend sends:

```http
Authorization: Bearer <token>
```

The token comes from:

```ts
getStoredToken()
```

### Error handling

The frontend uses a shared `parseResponse()` helper.

That helper:

- reads the JSON body
- checks if the response is OK
- if not OK, tries to use the backend `error` message
- throws a normal JavaScript `Error`

This is why many backend error messages show up nicely in frontend alerts.

### 6. How the Admin Pages Are Stitched Together

The admin pages share one wrapper: `AdminShell`.

`AdminShell` gives all admin pages the same structure:

- left sidebar
- top bar
- page title
- page subtitle
- main content area
- current user badge
- logout button
- shortcut button back to the faculty page

The sidebar itself is handled by `AdminSidebar`.

It shows links to:

- User Management
- System Logs
- Settings

The top bar also shows `UserNameBadge`, which calls `getMe(token)` and decides what name to display.

The display name order is:

1. first name + last name
2. username
3. email
4. `Unknown user`

This shared layout is what makes the admin area feel like one connected space instead of three unrelated pages.

### 7. Frontend Connectivity for the User Management Page

The User Management page is the most interactive admin page.

It uses:

- `AdminUsersPage.tsx` as a thin page wrapper
- `UserManagementPanel.tsx` for the actual logic

### What happens when the page first loads

When the page opens, the panel runs `loadUsers()`.

That function:

1. turns on the loading state
2. clears any old error
3. gets the token
4. calls `adminListUsers(token)`
5. calls `getMe(token)`
6. stores the full user list
7. stores the current admin's own user id

The current admin id is used so the frontend can disable actions on the admin's own row.

### Request used to load users

The frontend sends:

```http
GET /api/admin/users
Authorization: Bearer <token>
```

There is no request body for this call.

Why this request is needed:

- to build the table of users
- to show counts by role
- to allow role changes, password resets, and delete actions on those rows

### Frontend filtering

The filter box does not send a request.

It filters the already-loaded list in memory by:

- display name
- email
- role

So filtering is frontend-only right now.

### Role change flow from the frontend side

Each user row has a role dropdown.

If the admin changes a user's role, the frontend sends:

```http
PATCH /api/admin/users/:id/role
Authorization: Bearer <token>
Content-Type: application/json
```

Request body:

```json
{
  "role": "faculty"
}
```

What the frontend does before the request:

- saves the old user list
- clears old errors
- marks the row as updating
- changes the row in the UI right away

That means the UI is optimistic. It shows the new role before the backend confirms it.

What the frontend does after the request:

- if the request succeeds, it replaces the row with the server's returned user object
- if the request fails, it restores the old user list

Why it works this way:

- it makes the page feel faster
- but it still has a rollback if the server rejects the change

### Reset password flow from the frontend side

Each user row also has a `Reset Pw` button.

When the admin clicks it:

- a dialog opens
- the chosen user becomes the `resetTarget`
- the password field is cleared

When the admin submits the reset, the frontend sends:

```http
POST /api/admin/users/:id/reset-password
Authorization: Bearer <token>
Content-Type: application/json
```

Request body:

```json
{
  "newPassword": "new-password-here"
}
```

The frontend only enables the submit button if the new password has at least 8 characters.

What the frontend does after success:

- closes the dialog
- clears the password field
- shows a success snackbar

What the frontend does after failure:

- shows an error alert

### Delete user flow from the frontend side

Each user row also has a `Delete` button.

When delete is clicked, the frontend sends:

```http
DELETE /api/admin/users/:id
Authorization: Bearer <token>
```

There is no request body.

Important detail:

- the row is removed from the UI immediately
- there is no confirmation dialog

So this is also an optimistic action.

If the backend says the delete is allowed:

- the row stays gone

If the backend rejects it:

- the old list is restored

### Why the frontend disables some actions

The frontend disables the current admin's own row for:

- role changes
- password reset
- delete

It also disables a row while a role update is in progress.

This helps avoid invalid actions and messy overlapping requests.

### 8. Frontend Connectivity for the System Logs Page

The System Logs page is much simpler.

It uses:

- `SystemLogsPage.tsx` as the wrapper
- `SystemLogsPanel.tsx` for the logic

When the page loads, the frontend sends:

```http
GET /api/admin/logs
Authorization: Bearer <token>
```

There is no body.

Why this request is needed:

- to show recent admin-related audit events

What the frontend does with the response:

- stores the logs in state
- renders them into a table

The table currently shows:

- event type
- message
- target user id
- created date

The frontend does not currently show:

- actor user id
- metadata
- actor names
- pagination
- search

### 9. Frontend Connectivity for the Settings Page

This page is important because the live version is slightly different from what the folder names might suggest.

The route is:

- `/admin/settings`

But the page does not render `components/admin/SettingsPanel.tsx`.

Instead, it renders:

- `components/account/AccountSettingsPanel.tsx`

So the live admin settings page uses the shared account settings panel.

### Profile update from the frontend side

When the settings page opens, the frontend calls:

```http
GET /api/auth/me
Authorization: Bearer <token>
```

That request loads:

- username
- email
- first name
- last name

If the admin edits first name and last name and clicks save, the frontend sends:

```http
PATCH /api/auth/me
Authorization: Bearer <token>
Content-Type: application/json
```

Request body:

```json
{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

Why it sends this request:

- to update the admin's own profile information

What the frontend validates first:

- first name cannot be blank
- last name cannot be blank

### Password change from the frontend side

The same settings page also lets the admin change their own password.

The frontend sends:

```http
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json
```

Request body:

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

The frontend checks these rules first:

- all password fields are filled in
- new password is at least 8 characters
- confirmation matches
- new password is different from current password

Why this is important:

- the current settings page uses the shared auth route
- it does not use the admin-only password route

That means the current visible admin settings page is using normal account endpoints, not admin-specific ones.

### 10. Important Frontend Notes and Quirks

These details matter if someone is trying to understand why the admin area behaves the way it does.

### Multiple `getMe()` calls can happen

When an admin page loads, several parts of the frontend may all ask for the current user:

- `RequireRole`
- `AdminShell`
- `UserNameBadge`
- the page panel itself

So the frontend is not using one central cached user object here. It makes repeated small requests.

### The System Logs page only shows recent logs

The backend returns a `total`, but the frontend does not use it.

So the logs page only shows the latest set returned by the backend.

### The Settings route uses a shared panel

This is probably the most important frontend detail to remember.

Even though the URL is an admin URL:

- `/admin/settings`

the page is using:

- shared profile update logic
- shared password change logic

not the unused `admin/SettingsPanel.tsx` component.

## Backend Notes

### 1. Backend Files That Matter

These are the main backend files behind the admin area:

- `apps/backend/src/index.ts`
- `apps/backend/src/routes/admin.ts`
- `apps/backend/src/routes/auth.ts`
- `apps/backend/src/middleware/auth.ts`
- `apps/backend/src/middleware/admin.ts`
- `apps/backend/src/services/adminUserService.ts`
- `apps/backend/src/services/auditLogService.ts`
- `apps/backend/src/types/admin.ts`
- `apps/backend/prisma/schema.prisma`

### 2. How the Backend Protects the Admin Area

The backend does not trust the frontend on its own.

Even if someone manually sends a request to an admin endpoint, the backend still checks whether the user is allowed.

That protection happens in two steps.

### Step 1: `authMiddleware`

This middleware:

- reads the `Authorization` header
- checks that it starts with `Bearer `
- verifies the JWT token
- puts the `userId` on the request object

If this fails, the backend returns a `401`.

### Step 2: `adminMiddleware`

This middleware:

- reads `req.userId`
- loads that user from the database
- checks whether `user.role === 'admin'`

If the user is missing or not an admin, the backend returns a `403`.

Why this matters:

- the backend uses the database as the real source of truth
- it does not just trust a URL
- it does not just trust that the frontend already checked the role

### 3. Admin Action: View All Users

This action powers the User Management table.

### Request

```http
GET /api/admin/users
Authorization: Bearer <token>
```

### Why this request exists

The admin page needs a full list of users so the admin can:

- see every account
- see roles
- see join dates
- change roles
- reset passwords
- delete accounts

### Route handler

The route lives in:

- `apps/backend/src/routes/admin.ts`

It calls:

- `listAllUsers()`

### Service logic

`listAllUsers()` lives in:

- `apps/backend/src/services/adminUserService.ts`

It asks Prisma for:

- `id`
- `username`
- `firstName`
- `lastName`
- `email`
- `role`
- `createdAt`

It also asks for a full user count.

Users are ordered by:

- `createdAt desc`

That means newest users come first.

### Response

The backend returns:

```json
{
  "users": [
    {
      "id": "user-id",
      "username": "jsmith",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com",
      "role": "faculty",
      "createdAt": "2026-04-19T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

### Why this design makes sense

This endpoint is simple.

It gives the frontend everything it needs for the admin table in one request.

Right now there is no server-side pagination, search, or filtering.

### 4. Admin Action: Change a User's Role

This action is used when the admin picks a different role from the dropdown.

### Request

```http
PATCH /api/admin/users/:id/role
Authorization: Bearer <token>
Content-Type: application/json
```

Request body:

```json
{
  "role": "student"
}
```

### Why this request exists

New users enter the system as `unassigned`.

An admin needs a way to place them into the correct role:

- `admin`
- `faculty`
- `student`
- `unassigned`

### Route handler

The route lives in `routes/admin.ts`.

It:

- reads `req.body.role`
- checks that the role is valid
- rejects bad role values
- calls `updateUserRoleById()`

If the role is not one of the allowed values, the backend returns:

- `400 Invalid role value`

### Service logic

`updateUserRoleById(userId, role, actorUserId)` does the real work.

It checks:

1. the admin is not trying to change their own role
2. the target user exists
3. the target user is not already on that role
4. the change will not remove the last admin from the system

If the target user already has the requested role, the service returns a success-style response with:

- `Role is already set`

This is a soft no-op. It is not treated as a hard error.

### Database update

If the change is allowed, Prisma updates:

- `User.role`

### Audit log

After the role changes, the backend creates an audit record with:

- `eventType: USER_ROLE_CHANGED`
- the admin's id as `actorUserId`
- the changed user's id as `targetUserId`
- metadata containing username, email, old role, and new role

### Response

The backend returns:

```json
{
  "message": "User role updated successfully",
  "user": {
    "id": "user-id",
    "username": "jsmith",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "role": "student",
    "createdAt": "2026-04-19T00:00:00.000Z"
  }
}
```

### Why these safety checks matter

Without these checks, an admin could:

- remove their own admin powers by accident
- remove the last remaining admin from the whole system

The backend stops both of those cases.

### 5. Admin Action: Reset Another User's Password

This action is used from the `Reset Pw` button in the user table.

### Request

```http
POST /api/admin/users/:id/reset-password
Authorization: Bearer <token>
Content-Type: application/json
```

Request body:

```json
{
  "newPassword": "brand-new-password"
}
```

### Why this request exists

An admin may need to help a user who:

- forgot their password
- cannot log in
- needs account access restored

### Route handler

The route reads `newPassword` from the request body.

It rejects the request if:

- the password is missing
- the password is not a string
- the password is shorter than 8 characters

### Service logic

`resetUserPassword(userId, newPassword, actorUserId)` then checks:

1. the admin is not trying to use this route on themselves
2. the password is long enough
3. the target user exists

### Password hashing

If the request is allowed, the backend hashes the new password with `bcryptjs`.

It does not store the raw password.

It updates:

- `User.password`

### Audit log

The backend then writes:

- `eventType: USER_PASSWORD_RESET`
- `actorUserId`: the admin
- `targetUserId`: the affected user

Metadata stores the target user's username and email.

### Response

The backend returns:

```json
{
  "message": "Password reset successfully"
}
```

### Why this is separated from self-password change

This route is specifically for an admin changing someone else's password.

That is why the backend blocks:

- resetting your own password through this route

Your own password should be changed through the settings flow instead.

### 6. Admin Action: Delete a User

This action is used from the `Delete` button in the user table.

### Request

```http
DELETE /api/admin/users/:id
Authorization: Bearer <token>
```

There is no body.

### Why this request exists

An admin may need to remove:

- bad accounts
- duplicate accounts
- accounts that should no longer exist

### Service logic

`deleteUserById(userId, actorUserId)` checks:

1. the admin is not trying to delete their own account
2. the target user exists
3. deleting this user will not remove the last admin from the system

### Database change

If the delete is allowed, Prisma deletes the user record.

### Audit log

The backend writes:

- `eventType: USER_DELETED`
- `actorUserId`: the admin

It also stores deleted-user details in `metadata`, including:

- deleted user id
- username
- email

### Important logging detail

For delete events, the service does not currently set `targetUserId`.

That matters because the frontend System Logs page shows:

- `targetUserId`

not the metadata.

So a delete log may appear with a blank target user column even though the metadata still contains information about the deleted account.

### Response

The backend returns:

```json
{
  "message": "User deleted successfully",
  "deletedUserId": "user-id"
}
```

### Why these checks matter

Deleting the wrong account is a big deal.

The backend at least protects the two most dangerous cases:

- deleting yourself
- deleting the last admin

### 7. Admin Action: View System Logs

This action powers the System Logs page.

### Request

```http
GET /api/admin/logs
Authorization: Bearer <token>
```

### Why this request exists

The admin needs visibility into important system events related to account administration.

### Route handler

The route calls:

- `getRecentAuditLogs()`

### Service logic

`getRecentAuditLogs(limit = 50)`:

- loads audit logs from the database
- sorts them by newest first
- limits the result to 50 rows
- also returns a total count

### Response shape

The response looks like:

```json
{
  "logs": [
    {
      "id": "log-id",
      "eventType": "USER_ROLE_CHANGED",
      "message": "User jane@example.com role changed from unassigned to student",
      "actorUserId": "admin-id",
      "targetUserId": "user-id",
      "metadata": {
        "email": "jane@example.com",
        "fromRole": "unassigned",
        "toRole": "student"
      },
      "createdAt": "2026-04-22T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

### Event types currently used

The backend supports these admin-related event types:

- `USER_REGISTERED`
- `USER_DELETED`
- `USER_ROLE_CHANGED`
- `USER_PASSWORD_RESET`
- `ADMIN_PASSWORD_CHANGED`

### Why this endpoint is useful

This gives admins a history of important account actions without needing direct database access.

### 8. Admin Action: Update Their Own Profile

This action appears inside `/admin/settings`, but the backend route is not an admin route.

It uses the shared authenticated profile endpoint.

### Request

```http
PATCH /api/auth/me
Authorization: Bearer <token>
Content-Type: application/json
```

Request body:

```json
{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

### Why this request exists

An admin still has a normal user account.

They may want to update:

- first name
- last name

### Route handler

This logic lives in:

- `apps/backend/src/routes/auth.ts`

### Validation

The backend trims and checks:

- first name must not be blank
- last name must not be blank

### Database update

If valid, Prisma updates:

- `User.firstName`
- `User.lastName`

### Response

The backend returns:

```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "user-id",
    "username": "jsmith",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "role": "admin",
    "createdAt": "2026-04-19T00:00:00.000Z"
  }
}
```

### Important note

This route is shared by all authenticated users.

It is not admin-only.

It is only part of the admin page because the admin settings screen uses the shared account panel.

### 9. Admin Action: Change Their Own Password in the Current Settings Page

This is the password action the admin can use in the live frontend today.

### Request

```http
POST /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json
```

Request body:

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

### Why this request exists

An admin may want to change their own password for normal account security reasons.

### Route handler

This route also lives in:

- `apps/backend/src/routes/auth.ts`

### Validation

The backend checks:

1. current password is present
2. new password is present
3. new password is at least 8 characters
4. new password is different from the current password
5. the current password actually matches the stored password hash

### Database update

If valid, the backend:

- hashes the new password
- updates `User.password`

### Response

The backend returns:

```json
{
  "message": "Password changed successfully"
}
```

### Important note about logging

This shared `/api/auth/change-password` route does not create an audit log.

That means:

- if an admin changes their password through the current visible settings page
- the System Logs page will not show an `ADMIN_PASSWORD_CHANGED` entry for that action

### 10. Existing Admin Password Route That Is Present but Not Currently Used

There is also an admin-specific password route:

```http
POST /api/admin/change-password
Authorization: Bearer <token>
Content-Type: application/json
```

This route is handled by:

- `changeAdminOwnPassword()`

It checks:

- current password exists
- new password exists
- new password is at least 8 characters
- new password is different from current password
- current password matches
- the user is really an admin

If successful, it:

- updates the stored password hash
- creates an audit log with `ADMIN_PASSWORD_CHANGED`

Why this matters:

- the backend route exists
- the frontend admin page is not currently using it

So there is a small mismatch between what the backend supports and what the live frontend actually calls.

### 11. Audit Logging: What the Backend Records

Audit logging is handled by:

- `apps/backend/src/services/auditLogService.ts`

The helper `createAuditLog()` writes records into the `AuditLog` table.

Each log can store:

- event type
- message
- actor user id
- target user id
- metadata
- created date

The backend currently writes audit logs for:

- user registration
- user deletion
- user role changes
- admin reset of another user's password
- admin self-password change through the admin-specific route

This is the backbone of the System Logs page.

### 12. Database Records Behind the Admin Area

The admin area mainly depends on two database models.

### `User`

The admin area reads or writes these fields:

- `id`
- `username`
- `firstName`
- `lastName`
- `email`
- `password`
- `role`
- `createdAt`

These are the role values currently used:

- `admin`
- `faculty`
- `student`
- `unassigned`

### `AuditLog`

The logs page depends on:

- `id`
- `eventType`
- `message`
- `actorUserId`
- `targetUserId`
- `metadata`
- `createdAt`

### 13. Final Notes

If someone wants to understand the admin area quickly, the easiest way to think about it is this:

- the frontend decides when to send admin requests
- the backend decides whether those requests are allowed
- the database stores the final truth
- the audit log keeps a history of important admin actions

The most important implementation details to remember are:

- the real app is in `apps/frontend` and `apps/backend`
- admin pages are protected in both frontend and backend
- user management is powered by `/api/admin/users` routes
- the settings page uses shared account routes, not the unused admin password panel
- the logs page reads recent audit logs, but only shows part of the stored information
