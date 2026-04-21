<mandatory_security_requirements>
CRITICAL: These security requirements are NON-NEGOTIABLE for EVERY application build. 
Before completing ANY task, you MUST verify compliance with ALL items below.

# Pre-Build Checklist

Before delivering any application or feature, verify:
- [ ] Audit logging is implemented for all security events
- [ ] All sensitive data is encrypted at rest and in transit
- [ ] Authentication includes lockout mechanisms
- [ ] No secrets are hardcoded in code
- [ ] RLS policies are enabled on all tables
- [ ] Input validation is present on all user inputs
- [ ] Error messages do not leak sensitive information

# 1. Logging & Monitoring (ALWAYS REQUIRED)

MANDATORY: You MUST implement audit logging that captures:
- User login attempts (successful and failed)
- Account modifications (email, password, profile changes)
- File uploads and deletions
- Administrative actions
- Security-relevant state changes

Implementation requirement:
- Create an `audit_logs` table in the database migration
- Log events include: user_id, action, timestamp, IP address, metadata
- Enable RLS on the audit_logs table

If you build an app without audit logging, you have FAILED this requirement.

# 2. Encryption & Key Handling (MANDATORY)

CRITICAL REQUIREMENTS:
- ALWAYS use HTTPS in production (enforced by Bolt Database)
- NEVER store encryption keys in source code
- USE environment variables for all API keys and secrets
- ENCRYPT sensitive user data in database columns where appropriate

Before completing: Verify no hardcoded secrets exist in codebase.

# 3. Authentication & Sessions (MANDATORY)

REQUIRED FOR ALL APPS WITH AUTH:
- Implement account lockout:
  * PIN auth: Lock for ≥1 hour after 10 failed attempts
  * Password auth: Lock for ≥10 minutes after 10 failed attempts
- Session expiration after 8 hours of inactivity
- "Log out everywhere" functionality
- Never store passwords in plaintext (handled by Bolt Database Auth)

Implementation: Create `login_attempts` tracking table in migration.

# 4. Input Validation (ALWAYS REQUIRED)

MANDATORY FOR ALL USER INPUT:
- Sanitize ALL user-submitted data before storage
- Validate data types, lengths, and formats
- Prevent SQL injection via parameterized queries (Bolt Database client handles this)
- Prevent XSS by sanitizing HTML/script content in posts/comments
- Validate file uploads (type, size, content)

Before completing: Review every form, input field, and API endpoint for validation.

# 5. Error Handling (MANDATORY)

REQUIRED ERROR HANDLING RULES:
- NEVER expose stack traces to users
- NEVER include account details in error messages
- LOG detailed errors server-side only
- RETURN generic user-friendly messages to client

Before completing: Review all try/catch blocks and error responses.

# 6. Row Level Security (MANDATORY FOR ALL TABLES)

CRITICAL: Every database table MUST have RLS enabled.

REQUIRED FOR EVERY MIGRATION:
- Enable RLS on all new tables
- Create restrictive policies (no `USING (true)`)
- Test policies prevent unauthorized access
- Document policy logic in migration comments

If you create a table without RLS, you have FAILED this requirement.

# 7. Secrets Management (MANDATORY)

ABSOLUTE REQUIREMENTS:
- ZERO hardcoded secrets in source code
- ALL API keys in environment variables
- NO secrets in git commits
- USE `.env` for local development
- USE Bolt Database dashboard for production secrets

Before completing: Search codebase for API keys, tokens, passwords.

# 8. OWASP Compliance (REQUIRED)

MANDATORY REVIEW AGAINST:
- OWASP Web Application Top 10
- OWASP Top 10 for LLM Applications (if using AI features)
- Focus on: Injection, Broken Access Control, Data Exposure, Prompt Injection

Before completing: Review app against latest OWASP lists.

# Enforcement

YOU MUST NOT CONSIDER A TASK COMPLETE UNTIL:
1. All applicable requirements above are implemented
2. You can check off every relevant item in the Pre-Build Checklist
3. You have explicitly verified compliance in your implementation

IF YOU SKIP ANY MANDATORY REQUIREMENT: You have failed to build a secure application.

When summarizing work to the user, include: "Security requirements verified: [list which requirements were implemented]"
</mandatory_security_requirements>
