#!/bin/bash
# Phase 2: Backend Endpoint Testing Script
# Run this after fixing DNS or setting up local MongoDB

set -e

BASE_URL="http://localhost:5000/api"
GREEN='\033[0.32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "============================================================"
echo "Chronicle Backend - Phase 2 Endpoint Testing"
echo "============================================================"

# Test counter
PASSED=0
FAILED=0

# Helper function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local headers=$5
    local expected_status=$6

    echo -n "Testing: $name... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint" $headers)
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            $headers \
            -d "$data")
    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            $headers \
            -d "$data")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL$endpoint" $headers)
    fi

    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $status_code)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $status_code)"
        echo "Response: $body"
        ((FAILED++))
    fi
}

echo ""
echo "Phase 1: Health Check"
echo "------------------------------------------------------------"

test_endpoint "Health Check" "GET" "/health" "" "" "200"

echo ""
echo "Phase 2: Authentication"
echo "------------------------------------------------------------"

# Register a test student
STUDENT_DATA='{
    "roll_no": "TEST001",
    "name": "Test Student",
    "email": "test@student.com",
    "password": "test123",
    "course": "Computer Science",
    "semester": 3,
    "batch": "2024-2028"
}'

test_endpoint "Student Registration" "POST" "/auth/student/register" "$STUDENT_DATA" "" "201"

# Login as student
LOGIN_DATA='{"roll_no": "TEST001", "password": "test123"}'
STUDENT_TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/student/login" \
    -H "Content-Type: application/json" \
    -d "$LOGIN_DATA")
STUDENT_TOKEN=$(echo $STUDENT_TOKEN_RESPONSE | jq -r '.access_token')

test_endpoint "Student Login" "POST" "/auth/student/login" "$LOGIN_DATA" "" "200"

# Login as admin
ADMIN_LOGIN='{"login_id": "admin001", "password": "admin123"}'
ADMIN_TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/staff/login" \
    -H "Content-Type: application/json" \
    -d "$ADMIN_LOGIN")
ADMIN_TOKEN=$(echo $ADMIN_TOKEN_RESPONSE | jq -r '.access_token')

test_endpoint "Admin Login" "POST" "/auth/staff/login" "$ADMIN_LOGIN" "" "200"

# Get current user
test_endpoint "Get Current User" "GET" "/auth/me" "" "-H 'Authorization: Bearer $STUDENT_TOKEN'" "200"

echo ""
echo "Phase 3: Student Profile Management"
echo "------------------------------------------------------------"

test_endpoint "Get Student Profile" "GET" "/students/profile" "" "-H 'Authorization: Bearer $STUDENT_TOKEN'" "200"

UPDATE_PROFILE='{"name": "Updated Student Name", "mob_no": "1234567890"}'
test_endpoint "Update Student Profile" "PUT" "/students/profile" "$UPDATE_PROFILE" "-H 'Authorization: Bearer $STUDENT_TOKEN'" "200"

echo ""
echo "Phase 4: Student Management (Admin)"
echo "------------------------------------------------------------"

test_endpoint "List Students" "GET" "/students?page=1&limit=10" "" "-H 'Authorization: Bearer $ADMIN_TOKEN'" "200"

test_endpoint "Search Students" "GET" "/students?search=Test" "" "-H 'Authorization: Bearer $ADMIN_TOKEN'" "200"

test_endpoint "Filter Students" "GET" "/students?course=Computer%20Science&semester=3" "" "-H 'Authorization: Bearer $ADMIN_TOKEN'" "200"

CREATE_STUDENT='{
    "roll_no": "TEST002",
    "name": "Another Student",
    "email": "test2@student.com",
    "password": "test123",
    "course": "Information Technology",
    "semester": 2
}'
test_endpoint "Create Student (Admin)" "POST" "/students" "$CREATE_STUDENT" "-H 'Authorization: Bearer $ADMIN_TOKEN'" "201"

echo ""
echo "Phase 5: User Profile Management"
echo "------------------------------------------------------------"

test_endpoint "Get User Profile" "GET" "/users/profile" "" "-H 'Authorization: Bearer $ADMIN_TOKEN'" "200"

UPDATE_USER='{"name": "Updated Admin Name"}'
test_endpoint "Update User Profile" "PUT" "/users/profile" "$UPDATE_USER" "-H 'Authorization: Bearer $ADMIN_TOKEN'" "200"

CHANGE_PASSWORD='{"current_password": "admin123", "new_password": "newpass123"}'
test_endpoint "Change Password" "PUT" "/users/profile/password" "$CHANGE_PASSWORD" "-H 'Authorization: Bearer $ADMIN_TOKEN'" "200"

# Change it back
CHANGE_PASSWORD_BACK='{"current_password": "newpass123", "new_password": "admin123"}'
curl -s -X PUT "$BASE_URL/users/profile/password" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "$CHANGE_PASSWORD_BACK" > /dev/null

echo ""
echo "Phase 6: User Management (Admin)"
echo "------------------------------------------------------------"

test_endpoint "List Users" "GET" "/users?page=1&limit=10" "" "-H 'Authorization: Bearer $ADMIN_TOKEN'" "200"

test_endpoint "Search Users" "GET" "/users?search=admin" "" "-H 'Authorization: Bearer $ADMIN_TOKEN'" "200"

test_endpoint "Filter Users" "GET" "/users?user_type=admin" "" "-H 'Authorization: Bearer $ADMIN_TOKEN'" "200"

CREATE_USER='{
    "login_id": "staff001",
    "name": "Test Staff",
    "email": "staff@test.com",
    "password": "staff123",
    "user_type": "staff"
}'
NEW_USER_RESPONSE=$(curl -s -X POST "$BASE_URL/users" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d "$CREATE_USER")
NEW_USER_ID=$(echo $NEW_USER_RESPONSE | jq -r '.user._id')

test_endpoint "Create User (Admin)" "POST" "/users" "$CREATE_USER" "-H 'Authorization: Bearer $ADMIN_TOKEN'" "201"

if [ "$NEW_USER_ID" != "null" ]; then
    test_endpoint "Get Specific User" "GET" "/users/$NEW_USER_ID" "" "-H 'Authorization: Bearer $ADMIN_TOKEN'" "200"

    UPDATE_SPECIFIC_USER='{"name": "Updated Staff Name"}'
    test_endpoint "Update Specific User" "PUT" "/users/$NEW_USER_ID" "$UPDATE_SPECIFIC_USER" "-H 'Authorization: Bearer $ADMIN_TOKEN'" "200"

    test_endpoint "Delete User" "DELETE" "/users/$NEW_USER_ID" "" "-H 'Authorization: Bearer $ADMIN_TOKEN'" "200"
fi

echo ""
echo "============================================================"
echo "Test Summary"
echo "============================================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED${NC}"
else
    echo -e "${GREEN}Failed: $FAILED${NC}"
fi
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed! ✗${NC}"
    exit 1
fi
