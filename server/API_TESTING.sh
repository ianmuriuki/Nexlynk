# API Testing Reference — cURL / Postman
# Base URL: http://localhost:5000/api

# ── Variables 
BASE=http://localhost:5000/api
ACCESS_TOKEN="<paste token here>"
STUDENT_ID="<student uuid>"
COMPANY_ID="<company uuid>"
OPP_ID="<opportunity uuid>"
APP_ID="<application uuid>"

# HEALTH
curl -s $BASE/../health | jq

# AUTH

# Signup (student)
curl -s -X POST $BASE/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"role":"student","email":"student@test.com","password":"Test1234!","name":"Jane Doe"}' | jq #jq is used to pretty-print the JSON response in the terminal.

# Signup (company)
curl -s -X POST $BASE/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"role":"company","email":"company@test.com","password":"Test1234!","name":"Acme Ltd"}' | jq

# Login
curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com","password":"Test1234!"}' | jq

# Refresh token
curl -s -X POST $BASE/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refresh_token>"}' | jq

# Forgot password
curl -s -X POST $BASE/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com"}' | jq

# Logout
curl -s -X POST $BASE/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refresh_token>"}' | jq

# STUDENT

# Get profile
curl -s $BASE/students/$STUDENT_ID/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# Update profile
curl -s -X PATCH $BASE/students/$STUDENT_ID/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+254712345678",
    "city": "Nairobi",
    "university": "University of Nairobi",
    "course": "Computer Science",
    "year_of_study": 3,
    "discipline": "Software Engineering",
    "skills": ["JavaScript","Node.js","React"],
    "about": "Passionate developer"
  }' | jq

# Upload CV (PDF)
curl -s -X POST $BASE/students/$STUDENT_ID/cv \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "cv=@/path/to/your/cv.pdf" | jq

# List opportunities (with filters)
curl -s "$BASE/opportunities?discipline=Software%20Engineering&location=Nairobi&type=internship&keyword=backend&page=1&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# Apply to opportunity (idempotent)
curl -s -X POST $BASE/opportunities/$OPP_ID/apply \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# COMPANY

# Register company (public)
curl -s -X POST $BASE/companies \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hr@acme.com",
    "password": "Test1234!",
    "name": "Acme Corp",
    "industry": "Technology",
    "company_size": "50-200",
    "description": "We build great things",
    "contact_name": "HR Manager",
    "contact_email": "hr@acme.com",
    "contact_phone": "+254700000000"
  }' | jq

# Update company
curl -s -X PATCH $BASE/companies/$COMPANY_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description":"Updated company description","website":"https://acme.com"}' | jq

# Upload logo
curl -s -X POST $BASE/companies/$COMPANY_ID/logo \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "logo=@/path/to/logo.png" | jq

# Create opportunity
curl -s -X POST $BASE/companies/$COMPANY_ID/opportunities \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Backend Developer Intern",
    "description": "Work on our REST API infrastructure using Node.js and PostgreSQL.",
    "disciplines": ["Software Engineering","Computer Science"],
    "skills_required": ["Node.js","PostgreSQL","REST APIs"],
    "location": "Nairobi",
    "type": "internship",
    "positions": 2,
    "duration": "3 months",
    "stipend": "KES 20,000/month",
    "application_deadline": "2026-04-30",
    "status": "published"
  }' | jq

# List applicants
curl -s "$BASE/companies/$COMPANY_ID/applicants?page=1&limit=20" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# ADMIN
# (Requires admin JWT)

# Dashboard
curl -s $BASE/admin/dashboard \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# List companies (with optional status filter)
curl -s "$BASE/admin/companies?status=pending" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# Approve company
curl -s -X POST $BASE/admin/companies/$COMPANY_ID/approve \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# List applications
curl -s "$BASE/admin/applications?status=pending&page=1&limit=20" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# Update application status
curl -s -X PUT $BASE/admin/applications/$APP_ID/status \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"shortlisted","note":"Strong technical background"}' | jq

# FILES (Signed URLs)

# Get CV signed URL
curl -s "$BASE/files/cv/cvs%2F$STUDENT_ID%2Fsome-uuid.pdf" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq

# Get logo signed URL  
curl -s "$BASE/files/logo/logos%2F$COMPANY_ID%2Fsome-uuid.png" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq