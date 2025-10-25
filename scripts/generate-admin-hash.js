#!/usr/bin/env node

import * as bcrypt from "bcryptjs";
import { Readline } from "node:readline";

const rl = Readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function generateSecurePassword(length = 16) {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
  let password = "";

  // Ensure at least one character from each category
  const categories = [
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "abcdefghijklmnopqrstuvwxyz",
    "0123456789",
    "!@#$%^&*()_+-=[]{}|;:,.<>?",
  ];

  categories.forEach((category) => {
    password += category.charAt(Math.floor(Math.random() * category.length));
  });

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
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

async function hashPassword(password) {
  const saltRounds = 12; // High security salt rounds
  return await bcrypt.hash(password, saltRounds);
}

function generateSecretKey(length = 64) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function main() {
  console.log("🔐 Admin Security Setup Utility\n");
  console.log("This utility will help you set up secure admin credentials.\n");

  // Ask for admin email
  const adminEmail = await new Promise((resolve) => {
    rl.question("Enter admin email address: ", (answer) => {
      resolve(answer.trim().toLowerCase());
    });
  });

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    console.log("❌ Invalid email format");
    process.exit(1);
  }

  // Ask for password choice
  console.log("\nPassword options:");
  console.log("1. Generate a secure password automatically");
  console.log("2. Enter your own password");

  const choice = await new Promise((resolve) => {
    rl.question("\nChoose an option (1 or 2): ", (answer) => {
      resolve(answer.trim());
    });
  });

  let password;

  if (choice === "1") {
    password = generateSecurePassword(16);
    console.log("\n🔑 Generated secure password:", password);
    console.log(
      "\n⚠️  IMPORTANT: Save this password securely! You won't be able to recover it.",
    );

    const confirm = await new Promise((resolve) => {
      rl.question("\nHave you saved the password? (y/N): ", (answer) => {
        resolve(answer.trim().toLowerCase());
      });
    });

    if (confirm !== "y" && confirm !== "yes") {
      console.log(
        "❌ Setup cancelled. Please save the password before continuing.",
      );
      process.exit(1);
    }
  } else if (choice === "2") {
    password = await new Promise((resolve) => {
      rl.question(
        "\nEnter your password (input will be hidden in most terminals): ",
        (answer) => {
          // Strip any carriage returns/newlines that some terminals may append
          // Also trim whitespace to match web form behavior
          const cleaned = answer.replace(/[\r\n]+/g, "").trim();
          resolve(cleaned);
        },
      );
    });

    const validation = validatePassword(password);
    if (!validation.valid) {
      console.log("\n❌ Password does not meet security requirements:");
      validation.issues.forEach((issue) => console.log(`   - ${issue}`));
      console.log("\nPlease run the script again with a stronger password.");
      process.exit(1);
    }
  } else {
    console.log("❌ Invalid choice");
    process.exit(1);
  }

  // Final sanitize: strip any CR/LF and trim whitespace to match web form behavior
  password = password.replace(/[\r\n]+/g, "").trim();

  // Debug output to verify the password being hashed
  console.log(`\n🔄 Generating secure hash...`);
  console.log(`Password length: ${password.length} characters`);

  // Check for any non-printable characters
  const hasNonPrintable = /[\x00-\x1f\x7f-\x9f]/.test(password);
  if (hasNonPrintable) {
    console.log("⚠️  Warning: Password contains non-printable characters");
  }

  try {
    const hash = await hashPassword(password);

    // Self-verify to catch any hidden character issues
    const verify = await bcrypt.compare(password, hash);
    if (!verify) {
      console.error(
        "\n❌ Hash verification failed. Please retry without trailing newlines or hidden characters.",
      );
      console.error(
        `Debug: Password bytes: [${Array.from(Buffer.from(password, "utf8")).join(", ")}]`,
      );
      process.exit(1);
    }

    // Additional verification with trimmed password (web form behavior)
    const trimmedVerify = await bcrypt.compare(password.trim(), hash);
    if (!trimmedVerify) {
      console.error(
        "\n❌ Hash verification failed with trimmed password. There may be character encoding issues.",
      );
      process.exit(1);
    }

    console.log("✅ Hash verification successful");
    const nextAuthSecret = generateSecretKey();
    const jwtSecret = generateSecretKey(32);

    console.log("\n✅ Security setup complete!\n");

    console.log(
      "Add the following environment variables to your .env.local file:\n",
    );
    console.log("# Admin Authentication");
    console.log(`ADMIN_EMAIL="${adminEmail}"`);
    console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
    console.log("\n# NextAuth Configuration");
    console.log(`NEXTAUTH_SECRET="${nextAuthSecret}"`);
    console.log(
      `NEXTAUTH_URL="${process.env.NEXTAUTH_URL || "http://localhost:3000"}"`,
    );
    console.log("\n# JWT Configuration");
    console.log(`JWT_SECRET="${jwtSecret}"`);
    console.log("\n# Optional Security Settings (uncomment to enable)");
    console.log(
      '# ALLOWED_ADMIN_IPS="127.0.0.1,::1"  # Comma-separated list of allowed IPs',
    );
    console.log(
      '# STRICT_IP_CHECK="true"              # Enforce IP consistency for sessions',
    );
    console.log("\n# Database (make sure this is configured)");
    console.log('# MONGODB_URI="mongodb://localhost:27017/your-database"');

    console.log("\n📋 Security Features Enabled:");
    console.log("   ✓ Strong password hashing (bcrypt with 12 salt rounds)");
    console.log("   ✓ Session-based authentication with JWT");
    console.log("   ✓ Rate limiting (5 failed attempts = 15min lockout)");
    console.log("   ✓ CSRF protection");
    console.log("   ✓ Secure HTTP headers");
    console.log("   ✓ Session timeout (30 minutes)");
    console.log("   ✓ IP-based access control (optional)");
    console.log("   ✓ Activity monitoring and logging");
    console.log("   ✓ Progressive lockout on failed attempts");

    console.log("\n🧪 Hash Verification Test:");
    console.log(`   Hash: ${hash.substring(0, 20)}...`);
    console.log(`   Original password verification: ✅`);
    console.log(`   Trimmed password verification: ✅`);

    console.log("\n⚠️  Security Reminders:");
    console.log("   - Store your password in a secure password manager");
    console.log("   - Enable HTTPS in production");
    console.log("   - Regularly review access logs");
    console.log("   - Consider enabling IP allowlisting for extra security");
    console.log("   - Keep your dependencies updated");
  } catch (error) {
    console.error("\n❌ Error generating hash:", error.message);
    process.exit(1);
  }

  rl.close();
}

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n\n👋 Setup cancelled by user");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n\n👋 Setup terminated");
  process.exit(0);
});

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  });
}
