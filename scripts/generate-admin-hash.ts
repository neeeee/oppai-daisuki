#!/usr/bin/env node

import * as bcrypt from "bcryptjs";
import { createInterface } from "node:readline/promises";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function generateSecurePassword(length = 16): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";

  const categories = [
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "abcdefghijklmnopqrstuvwxyz",
    "0123456789",
    "!@#$%^&*",
  ];

  categories.forEach((category) => {
    password += category.charAt(Math.floor(Math.random() * category.length));
  });

  for (let i = password.length; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }

  return password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
}

function generateSecretKey(length = 64): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function main() {
  console.log("🔐 Admin Security Setup\n");

  const adminEmail = (await rl.question("Enter admin email: "))
    .trim()
    .toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    console.log("❌ Invalid email format");
    process.exit(1);
  }

  console.log("\nPassword options:");
  console.log("1. Generate secure password");
  console.log("2. Enter your own password");

  const choice = (await rl.question("\nChoose (1 or 2): ")).trim();

  let password: string;

  if (choice === "1") {
    password = generateSecurePassword(16);
    console.log("\n🔑 Generated password:", password);
    console.log("\n⚠️  SAVE THIS PASSWORD!\n");

    const confirm = (await rl.question("Have you saved it? (y/N): "))
      .trim()
      .toLowerCase();

    if (confirm !== "y" && confirm !== "yes") {
      console.log("❌ Setup cancelled");
      process.exit(1);
    }
  } else if (choice === "2") {
    password = (await rl.question("\nEnter password (min 12 chars): ")).trim();

    if (password.length < 12) {
      console.log("❌ Password must be at least 12 characters");
      process.exit(1);
    }
  } else {
    console.log("❌ Invalid choice");
    process.exit(1);
  }

  console.log("\n🔄 Generating hash...");

  const saltRounds = 12;
  const hash = await bcrypt.hash(password, saltRounds);

  // Base64 encode the hash to avoid $ character issues
  const hashBase64 = Buffer.from(hash).toString("base64");

  // Verify
  const isValid = await bcrypt.compare(password, hash);
  console.log(`Verification: ${isValid ? "✅ PASS" : "❌ FAIL"}`);

  if (!isValid) {
    console.error("\n❌ Hash verification failed!");
    process.exit(1);
  }

  const nextAuthSecret = generateSecretKey();
  const jwtSecret = generateSecretKey(32);

  console.log("\n✅ Setup complete!\n");
  console.log("Copy this to your .env.local file:\n");
  console.log("# Admin Authentication");
  console.log(`ADMIN_EMAIL=${adminEmail}`);
  console.log(`ADMIN_PASSWORD_HASH_BASE64=${hashBase64}`);
  console.log("\n# NextAuth Configuration");
  console.log(`NEXTAUTH_SECRET=${nextAuthSecret}`);
  console.log(`NEXTAUTH_URL=http://localhost:3000`);
  console.log("\n# JWT Configuration");
  console.log(`JWT_SECRET=${jwtSecret}`);

  console.log("\n📋 Login Credentials:");
  console.log(`Email: ${adminEmail}`);
  console.log(`Password: ${password}`);

  console.log("\n⚠️  Important:");
  console.log("1. Restart your dev server after updating .env.local");
  console.log("2. Use ADMIN_PASSWORD_HASH_BASE64 (not ADMIN_PASSWORD_HASH)");

  rl.close();
}

process.on("SIGINT", () => {
  console.log("\n\n👋 Cancelled");
  process.exit(0);
});

main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});