# Admin Security Documentation

This document outlines the comprehensive security measures implemented for the `/admin` route and administrative access to the Oppai Daisuki application.

## 🔐 Security Overview

The admin authentication system implements multiple layers of security to protect against unauthorized access, brute force attacks, session hijacking, and other common security threats.

## 🛡️ Security Features

### Authentication & Authorization
- **Strong Password Hashing**: Uses bcrypt with 12 salt rounds
- **Role-Based Access Control**: Only users with `admin` role can access admin routes
- **Session-Based JWT Authentication**: Secure token-based authentication with NextAuth.js
- **Credential Validation**: Server-side validation of admin credentials

### Rate Limiting & Brute Force Protection
- **Progressive Lockout**: Failed login attempts trigger exponential backoff
- **IP-Based Rate Limiting**: 5 failed attempts = 15-minute lockout (expandable)
- **Request Rate Limiting**: 20 requests/minute for admin routes, 100 requests/minute for API
- **Client-Side Lockout Tracking**: Persistent lockout state in localStorage

### Session Security
- **Short Session Lifetime**: 30-minute session timeout with auto-renewal
- **Secure Cookies**: HTTP-only, secure, SameSite cookies
- **Session Invalidation**: Automatic logout on inactivity or security violations
- **IP Consistency Checking**: Optional strict IP validation for sessions

### Network Security
- **IP Allowlisting**: Optional restriction to specific IP addresses
- **CSRF Protection**: Built-in CSRF token validation
- **Security Headers**: Comprehensive security headers (HSTS, CSP, X-Frame-Options, etc.)
- **SSL/TLS Enforcement**: HTTPS required in production

### Monitoring & Logging
- **Access Logging**: All admin login attempts and access are logged
- **Security Event Tracking**: Failed attempts, lockouts, and violations are tracked
- **Real-Time Monitoring**: Active session monitoring with timestamps
- **Audit Trail**: Complete audit log of administrative actions

## 📋 Setup Instructions

### 1. Initial Setup

Run the admin setup script to generate secure credentials:

```bash
npm run setup-admin
```

This script will:
- Generate a secure password (or accept your own)
- Create a bcrypt hash of the password
- Generate secure secrets for NextAuth and JWT
- Provide environment variables to copy

### 2. Environment Configuration

Copy the generated environment variables to your `.env.local` file:

```env
# Admin Authentication
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD_HASH="$2a$12$..."

# NextAuth Configuration
NEXTAUTH_SECRET="your-64-character-secret"
NEXTAUTH_URL="http://localhost:3000"  # Change for production

# JWT Configuration
JWT_SECRET="your-32-character-secret"

# Database
MONGODB_URI="mongodb://localhost:27017/oppai-daisuki"

# Optional Security Settings
ALLOWED_ADMIN_IPS="127.0.0.1,::1"  # Comma-separated IPs
STRICT_IP_CHECK="true"              # Enforce IP consistency
```

### 3. Production Configuration

For production environments:

```env
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
ALLOWED_ADMIN_IPS="your.office.ip,your.home.ip"
STRICT_IP_CHECK=true
```

## 🔒 Security Mechanisms

### Password Security
- **Minimum Requirements**: 12+ characters, uppercase, lowercase, numbers, special chars
- **Strength Validation**: Real-time password strength indicator
- **Secure Storage**: Passwords never stored in plaintext
- **Hash Verification**: Server-side bcrypt comparison

### Session Management
```typescript
// Session configuration
session: {
  strategy: "jwt",
  maxAge: 30 * 60,      // 30 minutes
  updateAge: 5 * 60,    // Update every 5 minutes
}
```

### Rate Limiting Algorithm
```typescript
// Progressive lockout calculation
const lockoutDuration = Math.min(
  15 * 60 * 1000 * Math.pow(2, attempts - 5), 
  60 * 60 * 1000  // Max 1 hour
);
```

### Security Headers
```typescript
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; ...",
  // ... additional headers
}
```

## 🚨 Security Alerts & Monitoring

### Login Attempt Monitoring
- Failed login attempts are logged with IP addresses
- Progressive warnings shown to users
- Account lockout notifications
- Suspicious activity detection

### Session Monitoring
- Real-time session timer display
- Last activity timestamp tracking
- Automatic extension prompts
- Security violation alerts

### Access Logging
All admin access is logged with:
- Timestamp
- IP address
- User email
- Action performed
- Success/failure status

## 🔧 Administrative Features

### Secure Admin Panel
- Session status indicator
- Real-time session timer
- Security information display
- One-click session extension
- Secure logout functionality

### Security Dashboard Elements
- Current session information
- IP address display
- Session start time
- Last activity timestamp
- Security status indicators

## ⚠️ Security Best Practices

### For Administrators
1. **Use Strong Passwords**: Generated passwords are recommended
2. **Enable IP Allowlisting**: Restrict access to known IP addresses
3. **Regular Password Updates**: Change admin password periodically
4. **Secure Network**: Only access admin panel from secure networks
5. **Logout Properly**: Always use the logout button when finished

### For Deployment
1. **HTTPS Only**: Never run admin panel over HTTP in production
2. **Firewall Configuration**: Restrict admin route access at network level
3. **Regular Updates**: Keep dependencies updated
4. **Database Security**: Secure MongoDB with authentication
5. **Backup Security**: Encrypt backups containing admin data

### For Development
1. **Environment Separation**: Use different secrets for dev/prod
2. **Local HTTPS**: Use HTTPS even in development
3. **Debug Mode**: Disable auth debugging in production
4. **Log Security**: Don't log sensitive information

## 🛠️ Troubleshooting

### Common Issues

**Unable to Login**
- Check if account is locked (wait for lockout period)
- Verify admin email and password
- Check IP allowlist if enabled
- Verify environment variables

**Session Expiry**
- Sessions expire after 30 minutes of inactivity
- Use "Extend Session" button to refresh
- Re-login if session has expired

**Rate Limiting**
- Wait for rate limit window to reset (1-15 minutes)
- Check for multiple failed attempts
- Verify IP address isn't changing

### Security Logs

Check application logs for:
```
[SECURITY] Admin login attempt from IP: x.x.x.x
[SECURITY] Failed login attempt for email from IP: x.x.x.x
[SECURITY] Rate limit exceeded for IP: x.x.x.x
[SECURITY] Session expired for admin: email
```

## 🔄 Maintenance

### Regular Tasks
- [ ] Review access logs weekly
- [ ] Update admin password monthly
- [ ] Check for dependency updates
- [ ] Verify security configuration
- [ ] Test backup/restore procedures

### Security Audits
- [ ] Review failed login attempts
- [ ] Validate IP allowlist
- [ ] Check session timeout settings
- [ ] Verify HTTPS configuration
- [ ] Test emergency access procedures

## 📞 Emergency Procedures

### Lost Admin Access
1. Check server logs for lockout reason
2. Wait for automatic lockout expiry
3. Verify environment variables
4. Access database directly to reset (if needed)
5. Generate new admin credentials

### Security Breach Response
1. Immediately revoke current admin session
2. Change admin password and secrets
3. Review access logs for suspicious activity
4. Update IP allowlist if compromised
5. Check for unauthorized data access

## 🔍 Security Validation

### Testing Checklist
- [ ] Failed login attempts trigger lockout
- [ ] Session expires after timeout
- [ ] IP restrictions work correctly
- [ ] CSRF protection active
- [ ] Security headers present
- [ ] HTTPS redirect working
- [ ] Logout clears session properly
- [ ] Rate limiting prevents brute force

### Penetration Testing
Regular security testing should include:
- Brute force attack simulation
- Session hijacking attempts
- CSRF attack testing
- SQL injection testing (if applicable)
- XSS vulnerability scanning

## 📚 References

- [NextAuth.js Security](https://next-auth.js.org/security)
- [OWASP Authentication Guidelines](https://owasp.org/www-project-authentication-guide/)
- [bcrypt Security](https://github.com/kelektiv/node.bcrypt.js#security-issues-and-concerns)
- [JWT Security Best Practices](https://tools.ietf.org/html/rfc8725)

---

**⚠️ IMPORTANT**: This admin panel provides full access to your application. Treat admin credentials with extreme care and follow all security guidelines.