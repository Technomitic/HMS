# 🔒 Medix Security Checklist

## Authentication & Authorization
- [x] JWT with short-lived access tokens (15 min)
- [x] Refresh token rotation on every use
- [x] Refresh tokens stored in DB (revocable)
- [x] bcrypt password hashing (12 rounds)
- [x] Password policy enforcement (length, complexity, common password check)
- [x] Brute force protection (IP + email based)
- [x] Account lockout after 5 failed attempts (15 min)
- [x] Role-Based Access Control (RBAC) with 6 roles
- [x] Token blacklisting on logout
- [x] Session management with max 5 concurrent sessions
- [ ] MFA/2FA (post-MVP: TOTP via Auth0)
- [ ] OAuth2/SSO integration (post-MVP)

## Data Protection
- [x] AES-256-GCM encryption for PHI at application level
- [x] PBKDF2 key derivation (100,000 iterations)
- [x] Database encryption at rest (AWS RDS)
- [x] TLS 1.3 in transit (enforced via HSTS)
- [x] S3 server-side encryption (AWS KMS)
- [x] Sensitive data masking in logs
- [x] PII never logged in plaintext
- [ ] Column-level encryption for SSN, DOB (post-MVP)
- [ ] Client-side encryption for file uploads (post-MVP)

## Input Validation & Sanitization
- [x] Global ValidationPipe (whitelist: true, forbidNonWhitelisted: true)
- [x] Zod schemas on frontend
- [x] class-validator decorators on all DTOs
- [x] HTML/XSS sanitization service
- [x] SQL injection prevention (Prisma parameterized queries)
- [x] Request payload size limits (10MB)
- [x] UUID format validation on all ID parameters
- [x] Email header injection prevention
- [x] Phone number format sanitization

## API Security
- [x] Rate limiting (tiered: auth/read/write/public)
- [x] CORS with strict origin whitelist
- [x] Helmet.js security headers
- [x] Content-Security-Policy headers
- [x] X-Frame-Options: DENY
- [x] X-Content-Type-Options: nosniff
- [x] Referrer-Policy: strict-origin-when-cross-origin
- [x] Permissions-Policy (disable camera, mic, etc.)
- [x] Request correlation IDs for tracing
- [x] Swagger disabled in production
- [x] Error messages sanitized in production
- [ ] API key authentication for service-to-service (post-MVP)
- [ ] Request signing for webhook endpoints (post-MVP)

## HIPAA Compliance
- [x] PHI access logging (every view, create, update, delete)
- [x] HIPAA audit trail (immutable, append-only)
- [x] Minimum necessary access principle (HipaaAccessGuard)
- [x] Doctors can only access their own patients
- [x] Patients can only access their own data
- [x] Emergency "break-the-glass" access with logging
- [x] Compliance report generation
- [x] Data retention policies
- [ ] BAA signed with all vendors (Auth0, Twilio, AWS, SendGrid)
- [ ] Annual risk assessment
- [ ] Workforce training documentation
- [ ] Breach notification procedures
- [ ] Data backup and recovery plan tested

## Infrastructure Security
- [x] VPC with public/private subnets
- [x] Database in private subnet only
- [x] Security groups restrict DB access to app nodes
- [x] Redis in private subnet with transit encryption
- [x] Non-root container execution
- [x] Docker image vulnerability scanning (Trivy)
- [x] Kubernetes pod security policies
- [x] Health checks and liveness probes
- [x] Graceful shutdown handling
- [x] Secrets in HashiCorp Vault / K8s secrets (not in code)
- [ ] WAF rules (Cloudflare/AWS WAF) (post-MVP)
- [ ] DDoS protection (post-MVP)
- [ ] VPN for admin access (post-MVP)

## CI/CD Security
- [x] Dependency audit in CI pipeline
- [x] SAST scanning (Semgrep)
- [x] Container scanning (Trivy)
- [x] Secret scanning (Gitleaks)
- [x] DAST scanning (OWASP ZAP)
- [x] Branch protection rules
- [ ] Signed commits enforcement (post-MVP)
- [ ] Supply chain security (SBOM generation) (post-MVP)

## Monitoring & Incident Response
- [x] Structured logging with correlation IDs
- [x] Error tracking (Sentry-ready)
- [x] Real-time alerts for critical events
- [x] Pod restart monitoring
- [x] Database connection pool monitoring
- [ ] SIEM integration (post-MVP)
- [ ] Incident response runbook (post-MVP)
- [ ] Automated security incident alerts (post-MVP)