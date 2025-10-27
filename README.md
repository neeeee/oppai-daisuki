# Oppai Daisuki

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

A gravure video streaming collection with secure admin authentication.

## 🔐 Admin Security Setup

This application includes a highly secure admin authentication system. **Set up admin access before running in production.**

### Quick Setup

1. **Generate Admin Credentials**:
   ```bash
   npm run setup-admin
   ```

2. **Copy Environment Variables**: Add the generated variables to `.env.local`

3. **Start the Application**:
   ```bash
   npm run dev
   ```

4. **Access Admin Panel**: Visit `/admin/login` with your credentials

### Security Features
- ✅ **Strong Password Hashing** (bcrypt, 12 salt rounds)
- ✅ **Rate Limiting** (5 failed attempts = 15min lockout)
- ✅ **Session Security** (30-minute timeout, secure cookies)
- ✅ **CSRF Protection** & **Security Headers**
- ✅ **IP Allowlisting** (optional)
- ✅ **Real-time Monitoring** & **Audit Logging**
- ✅ **Progressive Lockout** & **Brute Force Protection**

📋 **See [ADMIN_SECURITY.md](./ADMIN_SECURITY.md) for complete security documentation.**

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Production environment and secrets

Before deploying, configure and secure these environment variables and settings:

- NEXTAUTH_URL
  - Set to your canonical HTTPS domain (for example, https://yourdomain.com). This must exactly match the production origin used by the app.
- NEXTAUTH_SECRET
  - A cryptographically strong, 64+ character secret. Rotate periodically and on suspicion of compromise. Never log or expose.
- MONGODB_URI
  - Use a dedicated database user with least privileges, SRV connection string, and TLS. Restrict inbound network access to your app only (VPC/VNet/allowlist).
- ADMIN_EMAIL / ADMIN_PASSWORD_HASH
  - Generate with the provided admin setup scripts. Do not use test credentials in production. Store only the bcrypt hash, never the plaintext password.
- ALLOWED_ADMIN_IPS (optional) and STRICT_IP_CHECK (optional)
  - If you enable IP allowlisting, ensure your hosting platform provides trusted client IP headers (x-forwarded-for/x-real-ip). If this assumption is not guaranteed, avoid IP allowlisting and rely on authentication plus rate limiting.
- RATE_LIMIT_ENABLED
  - Leave enabled. In multi-instance/serverless environments, use a shared store (e.g., Upstash Redis) for effective rate limiting across instances.
- Uploads
  - Configure your UploadThing credentials (UPLOADTHING_APP_ID and UPLOADTHING_SECRET). The upload routes are protected server-side; keep credentials secret.
- Cookies and sessions
  - NextAuth sets HttpOnly and SameSite cookies; ensure secure cookies in production by serving strictly over HTTPS.
- Content Security Policy (CSP)
  - The middleware sets a strict CSP in production without 'unsafe-inline'/'unsafe-eval'. If you must use inline scripts, adopt nonces or hashed CSP.
- Logging
  - Avoid logging secrets or sensitive PII. Use INFO level in production and sanitize logs. Store logs securely with restricted access.
- Secrets management
  - Do not commit .env files with secrets. Prefer your platform’s environment configuration or a secrets manager. Rotate keys regularly and after personnel changes.

## Recommended .env keys (production)

```
# App
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-64+char-random-secret

# Database
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.example.mongodb.net/oppai-daisuki?retryWrites=true&w=majority

# Admin credentials (hash only)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD_HASH=$2a$12$...

# Optional network hardening
ALLOWED_ADMIN_IPS=203.0.113.10,203.0.113.11
STRICT_IP_CHECK=true

# Rate limiting
RATE_LIMIT_ENABLED=true

# Uploads (if applicable)
UPLOADTHING_APP_ID=...
UPLOADTHING_SECRET=...
```

## Deployment hardening checklist

- [ ] HTTPS enforced end-to-end; HSTS enabled (already set by middleware)
- [ ] NEXTAUTH_URL and NEXTAUTH_SECRET configured and validated
- [ ] MONGODB_URI uses TLS, least-privileged user, and restricted network access
- [ ] Admin routes and all mutating API routes require admin session (server-side)
- [ ] Upload endpoints restricted to admin
- [ ] Production CSP active (no 'unsafe-inline'/'unsafe-eval')
- [ ] In-memory rate limiting replaced or backed by shared store for multi-instance setups
- [ ] Logs sanitized (no secrets/PII) and access-controlled
- [ ] Secrets stored outside VCS and rotated regularly
- [ ] robots.txt disallows /admin and /api crawling

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## 🛡️ Admin Routes

- `/admin/login` - Secure admin login page
- `/admin` - Admin dashboard (protected)

## 📁 Project Structure

```
oppai-daisuki/
├── app/
│   ├── admin/           # Admin panel with authentication
│   ├── api/             # API routes
│   ├── components/      # Reusable components
│   ├── lib/             # Utilities and configurations
│   └── ...
├── middleware.ts        # Security middleware
├── scripts/             # Utility scripts
└── ADMIN_SECURITY.md    # Security documentation
```

## 🔧 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run setup-admin` - Generate admin credentials

## 🌐 Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/oppai-daisuki

# Admin Authentication (generate with npm run setup-admin)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD_HASH=generated-hash

# NextAuth Configuration
NEXTAUTH_SECRET=generated-secret
NEXTAUTH_URL=http://localhost:3000

# Optional Security
ALLOWED_ADMIN_IPS=127.0.0.1,::1
STRICT_IP_CHECK=true
```

## 🚀 Production Deployment

1. **Security First**: Run `npm run setup-admin`
2. **Environment**: Configure production environment variables
3. **HTTPS**: Ensure HTTPS is enabled
4. **Database**: Secure MongoDB connection
5. **Monitoring**: Set up log monitoring

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

⚠️ **Security Notice**: This application contains admin functionality. Always secure your admin credentials and follow the security guidelines in [ADMIN_SECURITY.md](./ADMIN_SECURITY.md).
