#!/usr/bin/env node

const bcrypt = require("bcryptjs");
const readline = require("readline");
const fs = require("fs");
const path = require("path");

require('dotenv').config({ path: '.env.local' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function fixAdminAuth() {
  console.log("🔧 Admin Authentication Fix Tool\n");
  console.log("This tool will help you resolve the admin login issues.\n");

  // Check current environment
  console.log("📋 Current Environment Status:");
  console.log(`ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || 'NOT SET'}`);
  console.log(`ADMIN_PASSWORD_HASH: ${process.env.ADMIN_PASSWORD_HASH ? 'SET' : 'NOT SET'}`);
  console.log(`NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET'}`);
  console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? 'SET' : 'NOT SET'}`);

  // Test current credentials if they exist
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH) {
    console.log("\n🧪 Testing current admin credentials...");

    const testEmail = await new Promise((resolve) => {
      rl.question(`Enter the password for ${process.env.ADMIN_EMAIL}: `, (answer) => {
        resolve(answer.trim());
      });
    });

    try {
      const isValid = await bcrypt.compare(testEmail, process.env.ADMIN_PASSWORD_HASH);
      if (isValid) {
        console.log("✅ Current credentials are working! The issue might be elsewhere.");
        console.log("\nPossible solutions:");
        console.log("1. Clear browser cache and cookies");
        console.log("2. Check if the Next.js dev server is running");
        console.log("3. Verify NEXTAUTH_SECRET is set correctly");

        const choice = await new Promise((resolve) => {
          rl.question("\nDo you want to continue with credential reset anyway? (y/N): ", (answer) => {
            resolve(answer.trim().toLowerCase());
          });
        });

        if (choice !== 'y' && choice !== 'yes') {
          console.log("👋 Exiting without changes.");
          rl.close();
          return;
        }
      } else {
        console.log("❌ Current password doesn't match the stored hash.");
        console.log("This confirms the authentication issue.\n");
      }
    } catch (error) {
      console.log(`⚠️  Error testing credentials: ${error.message}\n`);
    }
  }

  // Offer solutions
  console.log("🔧 Available Fix Options:");
  console.log("1. Generate new credentials (recommended)");
  console.log("2. Use test credentials (admin@test.com / testPassword123!)");
  console.log("3. Fix existing credentials with a new password");

  const solution = await new Promise((resolve) => {
    rl.question("\nChoose an option (1-3): ", (answer) => {
      resolve(answer.trim());
    });
  });

  let adminEmail = "";
  let password = "";

  if (solution === "1") {
    // Generate new credentials
    adminEmail = await new Promise((resolve) => {
      rl.question("Enter admin email: ", (answer) => {
        resolve(answer.trim().toLowerCase());
      });
    });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      console.log("❌ Invalid email format");
      process.exit(1);
    }

    password = await new Promise((resolve) => {
      rl.question("Enter admin password (12+ chars, mixed case, numbers, symbols): ", (answer) => {
        resolve(answer.trim());
      });
    });

    // Validate password
    const validation = validatePassword(password);
    if (!validation.valid) {
      console.log("\n❌ Password does not meet security requirements:");
      validation.issues.forEach((issue) => console.log(`   - ${issue}`));
      console.log("\nPlease run the script again with a stronger password.");
      process.exit(1);
    }

  } else if (solution === "2") {
    // Use test credentials
    adminEmail = "admin@test.com";
    password = "testPassword123!";
    console.log("Using test credentials for development...");

  } else if (solution === "3") {
    // Fix existing with new password
    adminEmail = process.env.ADMIN_EMAIL || "";
    if (!adminEmail) {
      adminEmail = await new Promise((resolve) => {
        rl.question("Enter admin email: ", (answer) => {
          resolve(answer.trim().toLowerCase());
        });
      });
    }

    password = await new Promise((resolve) => {
      rl.question(`Enter new password for ${adminEmail}: `, (answer) => {
        resolve(answer.trim());
      });
    });

    const validation = validatePassword(password);
    if (!validation.valid) {
      console.log("\n❌ Password does not meet security requirements:");
      validation.issues.forEach((issue) => console.log(`   - ${issue}`));
      process.exit(1);
    }

  } else {
    console.log("❌ Invalid option");
    process.exit(1);
  }

  // Generate hash
  console.log("\n🔐 Generating secure hash...");
  try {
    const hash = await bcrypt.hash(password, 12);

    // Verify immediately
    const verify = await bcrypt.compare(password, hash);
    if (!verify) {
      console.error("❌ Hash verification failed!");
      process.exit(1);
    }

    // Generate other secrets if needed
    const nextAuthSecret = process.env.NEXTAUTH_SECRET || generateSecretKey(64);
    const jwtSecret = process.env.JWT_SECRET || generateSecretKey(32);
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/oppai-daisuki";

    console.log("✅ Hash generated and verified successfully!\n");

    // Generate .env.local content
    const envContent = `# Admin Authentication
ADMIN_EMAIL="${adminEmail}"
ADMIN_PASSWORD_HASH="${hash}"

# NextAuth Configuration
NEXTAUTH_SECRET="${nextAuthSecret}"
NEXTAUTH_URL="http://localhost:3000"

# JWT Configuration
JWT_SECRET="${jwtSecret}"

# Database
MONGODB_URI="${mongoUri}"

# Optional Security Settings (uncomment to enable)
# ALLOWED_ADMIN_IPS="127.0.0.1,::1"
# STRICT_IP_CHECK="true"
`;

    // Write to .env.local
    const envPath = path.join(process.cwd(), '.env.local');
    console.log("💾 Writing to .env.local...");
    fs.writeFileSync(envPath, envContent);

    console.log("🎉 Admin authentication has been fixed!\n");
    console.log("📋 New Credentials:");
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${password}`);
    console.log("\n⚠️  Important:");
    console.log("- Save these credentials securely");
    console.log("- Restart your Next.js development server");
    console.log("- Clear browser cache/cookies if needed");
    console.log("- You can now login at /admin/login");

    if (solution === "2") {
      console.log("\n🧪 Development Note:");
      console.log("You're using test credentials. In production, use strong credentials generated with option 1.");
    }

  } catch (error) {
    console.error("❌ Error generating hash:", error.message);
    process.exit(1);
  }

  rl.close();
}

function validatePassword(password) {
  const minLength = 12;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

  const issues = [];

  if (password.length < minLength) {
    issues.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    issues.push("Password must contain at least one uppercase letter");
  }
  if (!hasLowerCase) {
    issues.push("Password must contain at least one lowercase letter");
  }
  if (!hasNumbers) {
    issues.push("Password must contain at least one number");
  }
  if (!hasSpecialChar) {
    issues.push("Password must contain at least one special character");
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

function generateSecretKey(length = 64) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n\n👋 Fix cancelled by user");
  process.exit(0);
});

if (require.main === module) {
  fixAdminAuth().catch((error) => {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  });
}
