# Security Testing Guide for LearnPlus

## Overview
This guide covers security testing procedures for the LearnPlus platform, including automated scanning, manual testing, and remediation steps.

## 1. OWASP ZAP Security Scanning

### Installation
```bash
# Using Docker (recommended)
docker pull zaproxy/zap-stable

# Or download from https://www.zaproxy.org/download/
```

### Automated Scan
```bash
# Start your application
npm run dev

# Run ZAP scan
docker run -t zaproxy/zap-stable zap-baseline.py \
  -t http://host.docker.internal:3000 \
  -r zap-report.html \
  -J zap-report.json
```

### Manual Testing Checklist

#### Authentication & Authorization
- [ ] Test access code validation with SQL injection attempts
- [ ] Verify session management (timeout, secure cookies)
- [ ] Test admin endpoints without API key
- [ ] Attempt authentication bypass
- [ ] Test rate limiting effectiveness

#### Input Validation
- [ ] Test all form inputs with XSS payloads: `<script>alert('XSS')</script>`
- [ ] Test math validation with malicious expressions
- [ ] Test API endpoints with malformed JSON
- [ ] Test file uploads (if any) with malicious files
- [ ] Test parameter tampering

#### Security Headers
- [ ] Verify CSP header blocks inline scripts
- [ ] Verify HSTS header forces HTTPS
- [ ] Verify X-Frame-Options prevents clickjacking
- [ ] Verify X-Content-Type-Options prevents MIME sniffing
- [ ] Test with securityheaders.com

#### API Security
- [ ] Test API endpoints without authentication
- [ ] Test CORS configuration
- [ ] Verify rate limiting on all endpoints
- [ ] Test API with invalid/expired tokens
- [ ] Test for information disclosure in error messages

## 2. Common Vulnerabilities Testing

### SQL Injection (N/A - Using Firestore)
✅ Not applicable - Using Firestore NoSQL database

### XSS (Cross-Site Scripting)
Test with payloads:
```javascript
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
<svg onload=alert('XSS')>
```

### CSRF (Cross-Site Request Forgery)
✅ Protected by Next.js built-in CSRF protection

### NoSQL Injection
Test Firestore queries with:
```javascript
{"$ne": null}
{"$gt": ""}
```

### Command Injection
Test any system commands with:
```bash
; ls -la
| cat /etc/passwd
&& whoami
```

### Path Traversal
Test file paths with:
```
../../../etc/passwd
..\\..\\..\\windows\\system32\\config\\sam
```

## 3. Security Test Results

### Expected Vulnerabilities (Acceptable)
None - All security measures should be in place

### Security Measures Implemented
- ✅ Rate limiting on all API endpoints
- ✅ Admin API key authentication
- ✅ Firestore security rules
- ✅ Input validation and sanitization
- ✅ Security headers (CSP, HSTS, etc.)
- ✅ XSS protection
- ✅ Clickjacking protection
- ✅ HTTPS enforcement (HSTS)
- ✅ Error message sanitization

## 4. Security Best Practices Checklist

### Code Security
- [x] No hardcoded secrets in code
- [x] Environment variables for sensitive data
- [x] Input validation on all user inputs
- [x] Output encoding to prevent XSS
- [x] Parameterized queries (using Firestore SDK)
- [x] Error messages don't leak sensitive info

### Authentication & Session Management
- [x] Anonymous authentication for users
- [x] Admin API key authentication
- [x] Session timeout implemented
- [x] Secure session storage
- [x] Rate limiting on auth endpoints

### Data Protection
- [x] HTTPS enforced via HSTS
- [x] Sensitive data not logged
- [x] Firestore security rules configured
- [x] No PII in client-side code
- [x] Proper access controls

### Infrastructure Security
- [ ] Firewall configured (deployment phase)
- [ ] DDoS protection (deployment phase)
- [x] Security headers configured
- [x] Regular dependency updates
- [ ] Automated security scanning (CI/CD)

## 5. Penetration Testing Scenarios

### Scenario 1: Unauthorized Access
**Test:** Attempt to access admin endpoints without API key
**Expected:** 401 Unauthorized response
```bash
curl http://localhost:3000/api/admin/generate-codes
# Should return 401
```

### Scenario 2: Rate Limit Bypass
**Test:** Send rapid requests to bypass rate limiting
**Expected:** 429 Too Many Requests after limit exceeded
```bash
for i in {1..25}; do
  curl http://localhost:3000/api/validate-step \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"problemId":"diff-basics-1","stepNumber":1,"userAnswer":"2x"}'
done
# Should start returning 429 after ~20 requests
```

### Scenario 3: XSS Attack
**Test:** Submit XSS payload in user input
**Expected:** Payload sanitized or escaped
```bash
curl http://localhost:3000/api/log-event \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"eventType":"<script>alert(1)</script>","eventData":{}}'
# Should handle safely without executing script
```

### Scenario 4: SQL Injection (Firestore)
**Test:** NoSQL injection attempt
**Expected:** Query safely handled
```bash
curl http://localhost:3000/api/auth/verify-access-code \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"accessCode":{"$ne":null}}'
# Should reject invalid input
```

## 6. Security Audit Checklist

### Pre-Deployment
- [x] All dependencies up to date
- [x] No known vulnerabilities in dependencies
- [x] Security headers configured
- [x] Rate limiting implemented
- [x] Input validation comprehensive
- [x] Error handling doesn't leak info
- [x] Logging configured properly
- [x] Secrets not in code/git

### Post-Deployment
- [ ] SSL certificate valid
- [ ] HTTPS redirect configured
- [ ] Firewall rules configured
- [ ] Monitoring alerts set up
- [ ] Backup procedures in place
- [ ] Incident response plan documented
- [ ] Security contact configured
- [ ] Regular security scans scheduled

## 7. Remediation Priorities

### Critical (Fix Immediately)
- SQL Injection
- Authentication bypass
- XSS allowing code execution
- Exposed API keys/secrets

### High (Fix Within 24 Hours)
- CSRF vulnerabilities
- Insufficient access controls
- Information disclosure
- Insecure session management

### Medium (Fix Within 1 Week)
- Missing security headers
- Weak rate limiting
- Verbose error messages
- Insecure dependencies

### Low (Fix When Possible)
- Security header improvements
- Additional monitoring
- Security documentation
- Code refactoring

## 8. Security Testing Schedule

### Continuous
- Automated dependency scanning
- Unit tests including security tests
- Integration tests with auth scenarios

### Pre-Release
- Full OWASP ZAP scan
- Manual penetration testing
- Security code review
- Dependency audit

### Regular (Monthly)
- Automated security scans
- Review security logs
- Update dependencies
- Review and update security rules

### Annual
- Third-party security audit
- Penetration testing by professionals
- Security policy review
- Incident response drill

## 9. Tools & Resources

### Scanning Tools
- **OWASP ZAP**: Web application security scanner
- **npm audit**: Dependency vulnerability scanner
- **Snyk**: Continuous dependency scanning
- **securityheaders.com**: Security headers checker

### Testing Resources
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **OWASP Testing Guide**: https://owasp.org/www-project-web-security-testing-guide/
- **CWE**: https://cwe.mitre.org/
- **CVE**: https://cve.mitre.org/

### Documentation
- Security policy in `SECURITY.md`
- Incident response plan (to be created)
- Security headers documentation in Phase 7
- Rate limiting documentation in Phase 5

## 10. Security Contacts

### Reporting Security Issues
- Email: security@yourdomain.com (configure in deployment)
- GitHub Security Advisories: Enable for repository
- Response time: Within 24 hours

### Security Team
- Development Lead: Review code changes
- DevOps: Infrastructure security
- Admin: Access control management

---

## Quick Test Commands

### Test Security Headers
```bash
curl -I https://yourdomain.com/ | grep -E "Content-Security-Policy|Strict-Transport-Security|X-Frame-Options"
```

### Test Rate Limiting
```bash
for i in {1..25}; do curl http://localhost:3000/api/health; done
```

### Test Admin Authentication
```bash
# Without key (should fail)
curl http://localhost:3000/api/admin/monitoring

# With key (should succeed)
curl -H "x-admin-key: YOUR_KEY" http://localhost:3000/api/admin/monitoring
```

### Run Dependency Audit
```bash
npm audit
npm audit fix
```

---

**Security Testing Status:** ✅ Ready for Testing  
**Last Updated:** Phase 8 Implementation  
**Next Review:** Before Production Deployment
