#!/usr/bin/env node

import * as bcrypt from "bcryptjs";
import * as readline from "node:readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

function generateSecurePassword(length = 16) {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";

  // Ensure at least one character from each category
  const categories = [
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "abcdefghijklmnopqrstuvwxyz",
    "0123456789",
    "!@#$%^&*",
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
  const saltRounds = 12;
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

  // Get admin email
  const adminEmail = (await question("Enter admin email address: "))
    .trim()
    .toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    console.log("❌ Invalid email format");
    process.exit(1);
  }

  // Password choice
  console.log("\nPassword options:");
  console.log("1. Generate a secure password automatically");
  console.log("2. Enter your own password");

  const choice = (await question("\nChoose an option (1 or 2): ")).trim();

  let password;

  if (choice === "1") {
    password = generateSecurePassword(16);
    console.log("\n🔑 Generated secure password:", password);
    console.log(
      "\n⚠️  IMPORTANT: Save this password securely! You won't be able to recover it.",
    );

    const confirm = (
      await question("\nHave you saved the password? (y/N): ")
    )
      .trim()
      .toLowerCase();

    if (confirm !== "y" && confirm !== "yes") {
      console.log(
        "❌ Setup cancelled. Please save the password before continuing.",
      );
      process.exit(1);
    }
  } else if (choice === "2") {
    password = await question(
      "\nEnter your password (min 12 chars, with uppercase, lowercase, numbers, special chars): ",
    );

    // Clean the password - remove any control characters but keep the actual password
    password = password.trim();

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

  console.log("\n🔄 Generating secure hash...");
  console.log(`Password length: ${password.length} characters`);

  try {
    // Generate hash
    const hash = await hashPassword(password);

    // Verify hash works correctly
    const isValid = await bcrypt.compare(password, hash);
    if (!isValid) {
      console.error("\n❌ Hash verification failed!");
      process.exit(1);
    }

    console.log("✅ Hash verification successful");

    // Generate secrets
    const nextAuthSecret = generateSecretKey();
    const jwtSecret = generateSecretKey(32);

    console.log("\n✅ Security setup complete!\n");
    console.log(
      "Add the following to your .env.local file (copy exactly as shown):\n",
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

    console.log("\n📋 Login Credentials:");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${password}`);

    console.log("\n⚠️  Important Notes:");
    console.log("   - Copy the password exactly as shown above");
    console.log("   - Do not add extra spaces or newlines");
    console.log("   - Store credentials in a secure password manager");
    console.log("   - Restart your development server after updating .env.local");

    console.log("\n🧪 Test your credentials:");
    console.log("   1. Restart your Next.js server");
    console.log("   2. Navigate to /admin/login");
    console.log(`   3. Enter email: ${adminEmail}`);
    console.log(`   4. Enter password: ${password}`);
  } catch (error) {
    console.error(
      "\n❌ Error generating hash:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }

  rl.close();
}

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n\n👋 Setup cancelled by user");
  rl.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n\n👋 Setup terminated");
  rl.close();
  process.exit(0);
});

// Run the main function
main().catch((error) => {
  console.error(
    "❌ Unexpected error:",
    error instanceof Error ? error.message : error,
  );
  rl.close();
  process.exit(1);
});