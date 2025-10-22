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
