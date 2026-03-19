#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Nexlynk Full API Test Script
# Usage: chmod +x test_nexlynk.sh && ./test_nexlynk.sh
# ─────────────────────────────────────────────────────────────

BASE="http://localhost:5000/api"
PASS='\033[0;32m✓\033[0m'
FAIL='\033[0;31m✗\033[0m'
INFO='\033[0;34m→\033[0m'
BOLD='\033[1m'
RESET='\033[0m'

# Track results
PASSED=0
FAILED=0
ERRORS=()

check() {
  local label="$1"
  local status="$2"
  local expected="$3"
  local body="$4"

  if [ "$status" -eq "$expected" ]; then
    echo -e "  ${PASS} ${label} (${status})"
    PASSED=$((PASSED + 1))
  else
    echo -e "  ${FAIL} ${label} — expected ${expected}, got ${status}"
    echo -e "     Body: $(echo $body | head -c 200)"
    FAILED=$((FAILED + 1))
    ERRORS+=("$label")
  fi
}

extract() {
  # extract JSON field value: extract "field" "$json"
  echo "$2" | grep -o "\"$1\":\"[^\"]*\"" | head -1 | cut -d'"' -f4
}

extract_num() {
  echo "$2" | grep -o "\"$1\":[0-9]*" | head -1 | cut -d':' -f2
}

echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}   Nexlynk API Test Suite${RESET}"
echo -e "${BOLD}═══════════════════════════════════════════════════════${RESET}"

# ─────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[1] ADMIN SETUP${RESET}"
# ─────────────────────────────────────────────────────────────

echo -e "  ${INFO} Logging in as admin..."
ADMIN_RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@platform.dev","password":"Admin1234!"}')
ADMIN_STATUS=$(echo "$ADMIN_RES" | tail -1)
ADMIN_BODY=$(echo "$ADMIN_RES" | head -1)
check "Admin login" "$ADMIN_STATUS" 200 "$ADMIN_BODY"
ADMIN_TOKEN=$(extract "accessToken" "$ADMIN_BODY")
echo -e "  ${INFO} Admin token: ${ADMIN_TOKEN:0:40}..."

# ─────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[2] STUDENT REGISTRATION & PROFILE${RESET}"
# ─────────────────────────────────────────────────────────────

echo -e "  ${INFO} Registering student..."
STU_REG=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "role":"student",
    "name":"Test Student",
    "email":"teststudent@nexlynk.io",
    "password":"Test1234!"
  }')
STU_REG_STATUS=$(echo "$STU_REG" | tail -1)
STU_REG_BODY=$(echo "$STU_REG" | head -1)
# 201 = new, 409 = already exists (both fine for testing)
if [ "$STU_REG_STATUS" -eq 201 ] || [ "$STU_REG_STATUS" -eq 409 ]; then
  echo -e "  ${PASS} Student registered (${STU_REG_STATUS})"
  PASSED=$((PASSED + 1))
else
  echo -e "  ${FAIL} Student registration failed (${STU_REG_STATUS})"
  FAILED=$((FAILED + 1))
fi

echo -e "  ${INFO} Logging in as student..."
STU_LOGIN=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"teststudent@nexlynk.io","password":"Test1234!"}')
STU_STATUS=$(echo "$STU_LOGIN" | tail -1)
STU_BODY=$(echo "$STU_LOGIN" | head -1)
check "Student login" "$STU_STATUS" 200 "$STU_BODY"
STU_TOKEN=$(extract "accessToken" "$STU_BODY")
STU_ID=$(extract "id" "$STU_BODY")
echo -e "  ${INFO} Student ID: $STU_ID"

echo -e "  ${INFO} Fetching student profile..."
STU_PROF=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $STU_TOKEN" \
  "$BASE/students/$STU_ID/profile")
check "GET student profile" "$(echo "$STU_PROF" | tail -1)" 200 "$(echo "$STU_PROF" | head -1)"

echo -e "  ${INFO} Updating student profile (10 fields)..."
STU_UPD=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE/students/$STU_ID/profile" \
  -H "Authorization: Bearer $STU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test Student Updated",
    "phone":"+254 700 000 001",
    "city":"Nairobi",
    "university":"University of Nairobi",
    "course":"Bachelor of Computer Science",
    "year_of_study":3,
    "expected_graduation":"2026-06-30",
    "discipline":"Computer Science",
    "availability":"Available from July 2026",
    "about":"A passionate developer seeking internship opportunities in software engineering."
  }')
check "PATCH student profile (10 fields)" "$(echo "$STU_UPD" | tail -1)" 200 "$(echo "$STU_UPD" | head -1)"

# ─────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[3] COMPANY REGISTRATION${RESET}"
# ─────────────────────────────────────────────────────────────

echo -e "  ${INFO} Registering company A..."
CO_A_REG=$(curl -s -w "\n%{http_code}" -X POST "$BASE/companies" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"companya@nexlynk.io",
    "password":"Test1234!",
    "name":"Company Alpha Ltd",
    "industry":"Technology",
    "company_size":"11-50",
    "website":"https://alpha.example.com",
    "description":"A tech startup building the future of Africa.",
    "contact_name":"Jane Alpha",
    "contact_email":"hr@alpha.example.com",
    "contact_phone":"+254 700 100 001"
  }')
CO_A_STATUS=$(echo "$CO_A_REG" | tail -1)
if [ "$CO_A_STATUS" -eq 201 ] || [ "$CO_A_STATUS" -eq 409 ]; then
  echo -e "  ${PASS} Company A registered (${CO_A_STATUS})"
  PASSED=$((PASSED + 1))
else
  echo -e "  ${FAIL} Company A registration failed (${CO_A_STATUS})"
  echo -e "     $(echo "$CO_A_REG" | head -1 | head -c 300)"
  FAILED=$((FAILED + 1))
fi

echo -e "  ${INFO} Registering company B..."
CO_B_REG=$(curl -s -w "\n%{http_code}" -X POST "$BASE/companies" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"companyb@nexlynk.io",
    "password":"Test1234!",
    "name":"Company Beta Inc",
    "industry":"Finance & Banking",
    "company_size":"51-200",
    "website":"https://beta.example.com",
    "description":"Financial technology company serving East Africa.",
    "contact_name":"John Beta",
    "contact_email":"hr@beta.example.com",
    "contact_phone":"+254 700 100 002"
  }')
CO_B_STATUS=$(echo "$CO_B_REG" | tail -1)
if [ "$CO_B_STATUS" -eq 201 ] || [ "$CO_B_STATUS" -eq 409 ]; then
  echo -e "  ${PASS} Company B registered (${CO_B_STATUS})"
  PASSED=$((PASSED + 1))
else
  echo -e "  ${FAIL} Company B registration failed (${CO_B_STATUS})"
  FAILED=$((FAILED + 1))
fi

# ─────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[4] ADMIN — COMPANY APPROVALS${RESET}"
# ─────────────────────────────────────────────────────────────

echo -e "  ${INFO} Fetching pending companies..."
PENDING=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$BASE/admin/companies?status=pending&limit=10")
check "GET pending companies" "$(echo "$PENDING" | tail -1)" 200 "$(echo "$PENDING" | head -1)"

PENDING_BODY=$(echo "$PENDING" | head -1)

# Extract company IDs from pending list
CO_A_ID=$(echo "$PENDING_BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
CO_B_ID=$(echo "$PENDING_BODY" | grep -o '"id":"[^"]*"' | sed -n '2p' | cut -d'"' -f4)

# Login as each company to get their IDs properly
echo -e "  ${INFO} Logging in as Company A to get ID..."
CO_A_LOGIN=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"companya@nexlynk.io","password":"Test1234!"}')
CO_A_BODY=$(echo "$CO_A_LOGIN" | head -1)
CO_A_TOKEN=$(extract "accessToken" "$CO_A_BODY")
CO_A_ID=$(extract "id" "$CO_A_BODY")

echo -e "  ${INFO} Logging in as Company B to get ID..."
CO_B_LOGIN=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"companyb@nexlynk.io","password":"Test1234!"}')
CO_B_BODY=$(echo "$CO_B_LOGIN" | head -1)
CO_B_TOKEN=$(extract "accessToken" "$CO_B_BODY")
CO_B_ID=$(extract "id" "$CO_B_BODY")

echo -e "  ${INFO} Company A ID: $CO_A_ID"
echo -e "  ${INFO} Company B ID: $CO_B_ID"

echo -e "  ${INFO} Approving Company A..."
APPROVE_A=$(curl -s -w "\n%{http_code}" -X POST "$BASE/admin/companies/$CO_A_ID/approve" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json")
check "POST approve Company A" "$(echo "$APPROVE_A" | tail -1)" 200 "$(echo "$APPROVE_A" | head -1)"

echo -e "  ${INFO} Approving Company B..."
APPROVE_B=$(curl -s -w "\n%{http_code}" -X POST "$BASE/admin/companies/$CO_B_ID/approve" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json")
check "POST approve Company B" "$(echo "$APPROVE_B" | tail -1)" 200 "$(echo "$APPROVE_B" | head -1)"

echo -e "  ${INFO} Testing reject (will re-approve after)..."
# Register a throwaway company to test reject
CO_C_REG=$(curl -s -w "\n%{http_code}" -X POST "$BASE/companies" \
  -H "Content-Type: application/json" \
  -d '{"email":"companyc@nexlynk.io","password":"Test1234!","name":"Company Gamma"}')
CO_C_BODY=$(echo "$CO_C_REG" | head -1)
CO_C_LOGIN=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"companyc@nexlynk.io","password":"Test1234!"}')
CO_C_ID=$(extract "id" "$(echo "$CO_C_LOGIN" | head -1)")
REJECT_C=$(curl -s -w "\n%{http_code}" -X POST "$BASE/admin/companies/$CO_C_ID/reject" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json")
check "POST reject company" "$(echo "$REJECT_C" | tail -1)" 200 "$(echo "$REJECT_C" | head -1)"

# Verify rejected status
CO_C_PROF=$(curl -s "$BASE/companies/$CO_C_ID" -H "Authorization: Bearer $ADMIN_TOKEN")
CO_C_STATUS=$(echo "$CO_C_PROF" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ "$CO_C_STATUS" = "rejected" ]; then
  echo -e "  ${PASS} Company status confirmed as 'rejected'"
  PASSED=$((PASSED + 1))
else
  echo -e "  ${FAIL} Company status expected 'rejected', got '$CO_C_STATUS'"
  FAILED=$((FAILED + 1))
fi

# ─────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[5] COMPANY A — GET PROFILE & UPDATE${RESET}"
# ─────────────────────────────────────────────────────────────

echo -e "  ${INFO} Fetching Company A profile..."
CO_A_PROF=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $CO_A_TOKEN" \
  "$BASE/companies/$CO_A_ID")
check "GET company profile" "$(echo "$CO_A_PROF" | tail -1)" 200 "$(echo "$CO_A_PROF" | head -1)"

echo -e "  ${INFO} Updating Company A profile (8 fields)..."
CO_A_UPD=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE/companies/$CO_A_ID" \
  -H "Authorization: Bearer $CO_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Company Alpha Ltd Updated",
    "industry":"Technology",
    "company_size":"51-200",
    "website":"https://alpha-updated.example.com",
    "description":"A leading tech company building Africa'\''s digital future with innovation.",
    "contact_name":"Jane Alpha Updated",
    "contact_email":"jane@alpha.example.com",
    "contact_phone":"+254 700 100 999"
  }')
check "PATCH company profile (8 fields)" "$(echo "$CO_A_UPD" | tail -1)" 200 "$(echo "$CO_A_UPD" | head -1)"

# ─────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[6] COMPANY A — POST OPPORTUNITIES${RESET}"
# ─────────────────────────────────────────────────────────────

echo -e "  ${INFO} Posting opportunity 1 (internship)..."
OPP1=$(curl -s -w "\n%{http_code}" -X POST "$BASE/companies/$CO_A_ID/opportunities" \
  -H "Authorization: Bearer $CO_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Backend Developer Intern",
    "description":"Join our engineering team to build scalable APIs using Node.js and PostgreSQL. You will work on real production systems.",
    "type":"internship",
    "location":"Nairobi, Kenya",
    "positions":3,
    "duration":"3 months",
    "stipend":"KES 25,000/mo",
    "disciplines":["Computer Science","Software Engineering","Information Technology"],
    "skills_required":["Node.js","PostgreSQL","REST APIs","Git"],
    "application_deadline":"2026-06-30",
    "status":"published"
  }')
check "POST opportunity 1 (internship)" "$(echo "$OPP1" | tail -1)" 201 "$(echo "$OPP1" | head -1)"
OPP1_ID=$(extract "id" "$(echo "$OPP1" | head -1)")
echo -e "  ${INFO} Opportunity 1 ID: $OPP1_ID"

echo -e "  ${INFO} Posting opportunity 2 (part-time)..."
OPP2=$(curl -s -w "\n%{http_code}" -X POST "$BASE/companies/$CO_A_ID/opportunities" \
  -H "Authorization: Bearer $CO_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Frontend Developer Part-time",
    "description":"Build beautiful UI components in React. Work 20 hours per week on our customer-facing product.",
    "type":"part-time",
    "location":"Remote",
    "positions":2,
    "duration":"6 months",
    "stipend":"KES 15,000/mo",
    "disciplines":["Computer Science","Design & UX","Information Technology"],
    "skills_required":["React","TypeScript","Tailwind CSS","Figma"],
    "application_deadline":"2026-07-15",
    "status":"published"
  }')
check "POST opportunity 2 (part-time)" "$(echo "$OPP2" | tail -1)" 201 "$(echo "$OPP2" | head -1)"
OPP2_ID=$(extract "id" "$(echo "$OPP2" | head -1)")

echo -e "  ${INFO} Posting opportunity 3 (draft — should not appear publicly)..."
OPP3=$(curl -s -w "\n%{http_code}" -X POST "$BASE/companies/$CO_A_ID/opportunities" \
  -H "Authorization: Bearer $CO_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Data Analyst Contract",
    "description":"Analyse business data and produce reports for leadership.",
    "type":"contract",
    "location":"Nairobi, Kenya",
    "positions":1,
    "disciplines":["Data Science","Business Administration"],
    "skills_required":["Python","SQL","Excel","Power BI"],
    "status":"draft"
  }')
check "POST opportunity 3 (draft)" "$(echo "$OPP3" | tail -1)" 201 "$(echo "$OPP3" | head -1)"

echo -e "  ${INFO} Posting opportunity 4 from Company B..."
OPP4=$(curl -s -w "\n%{http_code}" -X POST "$BASE/companies/$CO_B_ID/opportunities" \
  -H "Authorization: Bearer $CO_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Finance Graduate Trainee",
    "description":"Full-time graduate trainee programme for finance graduates. Rotational programme across all departments.",
    "type":"full-time",
    "location":"Nairobi, Kenya",
    "positions":5,
    "duration":"12 months",
    "stipend":"KES 45,000/mo",
    "disciplines":["Finance & Accounting","Business Administration"],
    "skills_required":["Excel","Financial Modelling","Accounting","Communication"],
    "application_deadline":"2026-05-31",
    "status":"published"
  }')
check "POST opportunity 4 (Company B, full-time)" "$(echo "$OPP4" | tail -1)" 201 "$(echo "$OPP4" | head -1)"
OPP4_ID=$(extract "id" "$(echo "$OPP4" | head -1)")

# ─────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[7] BROWSE OPPORTUNITIES (public list)${RESET}"
# ─────────────────────────────────────────────────────────────

echo -e "  ${INFO} Listing published opportunities..."
OPP_LIST=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $STU_TOKEN" \
  "$BASE/opportunities?limit=10")
check "GET /opportunities (published only)" "$(echo "$OPP_LIST" | tail -1)" 200 "$(echo "$OPP_LIST" | head -1)"

echo -e "  ${INFO} Filtering by type=internship..."
OPP_FILTER=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $STU_TOKEN" \
  "$BASE/opportunities?type=internship")
check "GET /opportunities?type=internship" "$(echo "$OPP_FILTER" | tail -1)" 200 "$(echo "$OPP_FILTER" | head -1)"

echo -e "  ${INFO} Searching by keyword..."
OPP_SEARCH=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $STU_TOKEN" \
  "$BASE/opportunities?keyword=developer")
check "GET /opportunities?keyword=developer" "$(echo "$OPP_SEARCH" | tail -1)" 200 "$(echo "$OPP_SEARCH" | head -1)"

# ─────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[8] STUDENT — APPLY TO OPPORTUNITIES${RESET}"
# ─────────────────────────────────────────────────────────────

echo -e "  ${INFO} Applying to opportunity 1..."
APPLY1=$(curl -s -w "\n%{http_code}" -X POST "$BASE/opportunities/$OPP1_ID/apply" \
  -H "Authorization: Bearer $STU_TOKEN" \
  -H "Content-Type: application/json")
check "POST apply to opportunity 1" "$(echo "$APPLY1" | tail -1)" 201 "$(echo "$APPLY1" | head -1)"
APP1_ID=$(extract "id" "$(echo "$APPLY1" | head -1)")

echo -e "  ${INFO} Applying to opportunity 2..."
APPLY2=$(curl -s -w "\n%{http_code}" -X POST "$BASE/opportunities/$OPP2_ID/apply" \
  -H "Authorization: Bearer $STU_TOKEN" \
  -H "Content-Type: application/json")
check "POST apply to opportunity 2" "$(echo "$APPLY2" | tail -1)" 201 "$(echo "$APPLY2" | head -1)"
APP2_ID=$(extract "id" "$(echo "$APPLY2" | head -1)")

echo -e "  ${INFO} Applying to opportunity 4 (Company B)..."
APPLY4=$(curl -s -w "\n%{http_code}" -X POST "$BASE/opportunities/$OPP4_ID/apply" \
  -H "Authorization: Bearer $STU_TOKEN" \
  -H "Content-Type: application/json")
check "POST apply to opportunity 4" "$(echo "$APPLY4" | tail -1)" 201 "$(echo "$APPLY4" | head -1)"
APP4_ID=$(extract "id" "$(echo "$APPLY4" | head -1)")

echo -e "  ${INFO} Duplicate application (should be 409)..."
DUP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/opportunities/$OPP1_ID/apply" \
  -H "Authorization: Bearer $STU_TOKEN" \
  -H "Content-Type: application/json")
check "POST duplicate application → 409" "$(echo "$DUP" | tail -1)" 409 "$(echo "$DUP" | head -1)"

echo -e "  ${INFO} Fetching student applications..."
STU_APPS=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $STU_TOKEN" \
  "$BASE/students/$STU_ID/applications")
check "GET student applications" "$(echo "$STU_APPS" | tail -1)" 200 "$(echo "$STU_APPS" | head -1)"

# ─────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[9] COMPANY — MANAGE APPLICANTS${RESET}"
# ─────────────────────────────────────────────────────────────

echo -e "  ${INFO} Company A listing applicants..."
CO_APPS=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $CO_A_TOKEN" \
  "$BASE/companies/$CO_A_ID/applicants?limit=10")
check "GET company applicants" "$(echo "$CO_APPS" | tail -1)" 200 "$(echo "$CO_APPS" | head -1)"

echo -e "  ${INFO} Shortlisting application 1..."
SHORT=$(curl -s -w "\n%{http_code}" \
  -X PATCH "$BASE/companies/$CO_A_ID/applications/$APP1_ID/status" \
  -H "Authorization: Bearer $CO_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"shortlisted"}')
check "PATCH shortlist application" "$(echo "$SHORT" | tail -1)" 200 "$(echo "$SHORT" | head -1)"

echo -e "  ${INFO} Rejecting application 2..."
REJECT=$(curl -s -w "\n%{http_code}" \
  -X PATCH "$BASE/companies/$CO_A_ID/applications/$APP2_ID/status" \
  -H "Authorization: Bearer $CO_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"rejected"}')
check "PATCH reject application" "$(echo "$REJECT" | tail -1)" 200 "$(echo "$REJECT" | head -1)"

echo -e "  ${INFO} Marking application 1 as placed..."
PLACE=$(curl -s -w "\n%{http_code}" \
  -X PATCH "$BASE/companies/$CO_A_ID/applications/$APP1_ID/status" \
  -H "Authorization: Bearer $CO_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"placed"}')
check "PATCH place application" "$(echo "$PLACE" | tail -1)" 200 "$(echo "$PLACE" | head -1)"

echo -e "  ${INFO} Company A listing opportunities..."
CO_OPPS=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $CO_A_TOKEN" \
  "$BASE/companies/$CO_A_ID/opportunities")
check "GET company opportunities" "$(echo "$CO_OPPS" | tail -1)" 200 "$(echo "$CO_OPPS" | head -1)"
APP_COUNT=$(echo "$CO_OPPS" | head -1 | grep -o '"application_count":[0-9]*' | head -1 | cut -d':' -f2)
echo -e "  ${INFO} Application count on opp 1: $APP_COUNT"

# ─────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[10] ADMIN — APPLICATIONS MANAGEMENT${RESET}"
# ─────────────────────────────────────────────────────────────

echo -e "  ${INFO} Admin listing all applications..."
ADMIN_APPS=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$BASE/admin/applications?limit=25")
check "GET /admin/applications" "$(echo "$ADMIN_APPS" | tail -1)" 200 "$(echo "$ADMIN_APPS" | head -1)"

echo -e "  ${INFO} Admin filtering by status=shortlisted..."
ADMIN_SHORT=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$BASE/admin/applications?status=shortlisted")
check "GET /admin/applications?status=shortlisted" "$(echo "$ADMIN_SHORT" | tail -1)" 200 "$(echo "$ADMIN_SHORT" | head -1)"

echo -e "  ${INFO} Admin updating application 4 status to shortlisted..."
ADMIN_UPD=$(curl -s -w "\n%{http_code}" \
  -X PUT "$BASE/admin/applications/$APP4_ID/status" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"shortlisted"}')
check "PUT /admin/applications/:id/status" "$(echo "$ADMIN_UPD" | tail -1)" 200 "$(echo "$ADMIN_UPD" | head -1)"

# ─────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[11] ADMIN DASHBOARD${RESET}"
# ─────────────────────────────────────────────────────────────

echo -e "  ${INFO} Fetching admin dashboard..."
DASH=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$BASE/admin/dashboard")
check "GET /admin/dashboard" "$(echo "$DASH" | tail -1)" 200 "$(echo "$DASH" | head -1)"

DASH_BODY=$(echo "$DASH" | head -1)
STUDENTS=$(echo "$DASH_BODY" | grep -o '"students":[0-9]*' | cut -d':' -f2)
COMPANIES=$(echo "$DASH_BODY" | grep -o '"companies":[0-9]*' | cut -d':' -f2)
APPLICATIONS=$(echo "$DASH_BODY" | grep -o '"applications":[0-9]*' | cut -d':' -f2)
PLACEMENTS=$(echo "$DASH_BODY" | grep -o '"placements":[0-9]*' | cut -d':' -f2)

echo -e "  ${INFO} Dashboard numbers:"
echo -e "     Students:     $STUDENTS"
echo -e "     Companies:    $COMPANIES"
echo -e "     Applications: $APPLICATIONS"
echo -e "     Placements:   $PLACEMENTS"

# Check all expected fields exist
for field in students companies opportunities applications placements pending_applications shortlisted_applications placed_applications rejected_applications; do
  if echo "$DASH_BODY" | grep -q "\"$field\""; then
    echo -e "  ${PASS} Dashboard field '$field' present"
    PASSED=$((PASSED + 1))
  else
    echo -e "  ${FAIL} Dashboard field '$field' MISSING"
    FAILED=$((FAILED + 1))
  fi
done

# ─────────────────────────────────────────────────────────────
echo -e "\n${BOLD}[12] AUTH — TOKEN REFRESH & LOGOUT${RESET}"
# ─────────────────────────────────────────────────────────────

echo -e "  ${INFO} Logging in fresh to get refresh token..."
FRESH=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"teststudent@nexlynk.io","password":"Test1234!"}')
FRESH_BODY=$(echo "$FRESH" | head -1)
REFRESH_TOKEN=$(extract "refreshToken" "$FRESH_BODY")

echo -e "  ${INFO} Testing token refresh..."
REFRESH=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")
check "POST /auth/refresh" "$(echo "$REFRESH" | tail -1)" 200 "$(echo "$REFRESH" | head -1)"

echo -e "  ${INFO} Testing logout..."
LOGOUT=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/logout" \
  -H "Authorization: Bearer $STU_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")
check "POST /auth/logout" "$(echo "$LOGOUT" | tail -1)" 200 "$(echo "$LOGOUT" | head -1)"

# ─────────────────────────────────────────────────────────────
echo -e "\n${BOLD}═══════════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}   TEST RESULTS${RESET}"
echo -e "${BOLD}═══════════════════════════════════════════════════════${RESET}"
TOTAL=$((PASSED + FAILED))
echo -e "  Total:  $TOTAL"
echo -e "  ${PASS} Passed: $PASSED"
if [ $FAILED -gt 0 ]; then
  echo -e "  ${FAIL} Failed: $FAILED"
  echo -e "\n  Failed tests:"
  for err in "${ERRORS[@]}"; do
    echo -e "    - $err"
  done
else
  echo -e "  🎉 All tests passed!"
fi
echo ""