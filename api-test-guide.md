## Nexlynk API Tester — Quick Guide

A browser-based UI for testing all Nexlynk API endpoints without Postman or curl.



## Setup

1. Make sure the server is running locally:
   ```bash
   cd ~/mern/Nexlynk/server
   npm run dev
   ```

2. Open `nexlynk-api-tester.html` in your browser (just double-click it or use VS Code Live Server).

3. Confirm the **BASE URL** in the top-right shows `http://localhost:5000/api`. Change it if your server runs on a different port.

4. If you get a **"Failed to fetch"** error, make sure your `.env` includes your Live Server origin in `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:5500,http://localhost:5500
   ```
   Then restart the server.



## How to Use

### 1. Pick an endpoint
Click any endpoint in the left sidebar. Endpoints are grouped by role:
- **Auth** — signup, login, token refresh, logout, forgot password
- **Student** — profile, CV upload
- **Opportunities** — list, apply
- **Company** — register, update, create opportunities, view applicants
- **Admin** — dashboard, approve companies, manage applications
- **Files** — get signed URLs for CVs and logos
- **Health** — server health check

### 2. Fill in the fields
- **Path params** — fields like `:id` appear as input boxes. Paste the UUID there.
- **Query params** — filters like `location`, `status`, `page`, `limit` appear as inputs. Leave blank to skip.
- **Request body** — pre-filled with a working example for every endpoint. Edit as needed.

### 3. Send the request
Click **▶ SEND** or press `Ctrl + Enter`.

The response appears on the right with:
- Status code (green = 2xx, amber = 4xx, red = 5xx)
- Response time in ms
- Full JSON response with syntax highlighting
- **Copy** button to copy the response



## Auth Flow (do this first)

The tester auto-saves your token when you log in. Here's the order:

### Login as Student
1. Click **Auth → Login**
2. Set body to:
   ```json
   { "email": "student@test.com", "password": "Test1234!" }
   ```
3. Hit **▶ SEND** — token saves automatically (you'll see it update in the top-right badge)
4. All student endpoints now work

### Login as Company
1. Click **Auth → Login**
2. Set body to:
   ```json
   { "email": "hr@acme.com", "password": "Test1234!" }
   ```
3. Hit **▶ SEND** — token switches to company token
4. All company endpoints now work

### Login as Admin
1. Click **Auth → Login**
2. Set body to:
   ```json
   { "email": "admin@platform.dev", "password": "Admin1234!" }
   ```
3. Hit **▶ SEND** — token switches to admin token
4. All admin endpoints now work

> **Note:** Only one token is stored at a time. Switch roles by logging in again as the target user.



## Common Flows

### Full student flow
1. **Auth → Signup** (create a new student account)
2. **Auth → Login** (token auto-saves)
3. **Student → Get Profile** (paste your user ID from the login response)
4. **Student → Update Profile** (fill in university, skills, etc.)
5. **Opportunities → List Opportunities** (browse what's available)
6. **Opportunities → Apply** (paste an opportunity ID)

### Full company flow
1. **Company → Register Company** (creates account, status = pending)
2. Log in as admin → **Admin → Approve Company** (paste company ID)
3. Log in as company → **Company → Create Opportunity**
4. **Company → List Applicants** (see who applied)

### Admin flow
1. **Auth → Login** as admin
2. **Admin → Dashboard** (see platform stats)
3. **Admin → List Companies** (filter by `status=pending`)
4. **Admin → Approve Company** (paste company ID)
5. **Admin → List Applications** (filter by `status=pending`)
6. **Admin → Update App Status** (set to `shortlisted`, `placed`, or `rejected`)



## Finding IDs

IDs come back in every response. After signup or login, copy the `id` from the response:

```json
{
  "user": {
    "id": "72c65e8e-2bf1-437f-aeb3-f0ad4ce17363",  ← this is your user/student ID
    "role": "student",
    "email": "test@test.com"
  }
}
```

After creating a company or opportunity, copy the `id` from the `data` object:

```json
{
  "data": {
    "id": "0346dd97-59d7-4de3-a1f7-e5bf1cc752b0",  ← company or opportunity ID
    ...
  }
}
```



## File Uploads

The UI does not support file uploads (multipart/form-data). Use curl for CV and logo uploads:

```bash
# Upload CV
curl -s -X POST http://localhost:5000/api/students/<student_id>/cv \
  -H "Authorization: Bearer <your_token>" \
  -F "cv=@/path/to/file.pdf" | jq

# Upload Logo
curl -s -X POST http://localhost:5000/api/companies/<company_id>/logo \
  -H "Authorization: Bearer <your_token>" \
  -F "logo=@/path/to/logo.png" | jq
```



## Status Code Reference

| Code | Meaning |
|------|---------|
| `200` | OK — request succeeded |
| `201` | Created — resource created successfully |
| `400` | Bad Request — invalid data (check error message) |
| `401` | Unauthorized — no token or token expired, log in again |
| `403` | Forbidden — wrong role for this endpoint |
| `404` | Not Found — ID doesn't exist in the database |
| `409` | Conflict — duplicate (email already registered, already applied) |
| `422` | Unprocessable — validation failed (check `details` in response) |
| `500` | Server Error — check server terminal for the stack trace |



## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Student | `student@test.com` | `Test1234!` |
| Company | `hr@acme.com` | `Test1234!` |
| Admin | `admin@platform.dev` | `Admin1234!` |

> If any of these return 401, the user may need to be recreated. 