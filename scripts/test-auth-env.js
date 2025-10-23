#!/usr/bin/env node

const bcrypt = require("bcryptjs");
const { MongoClient } = require("mongodb");

// Load environment the same way as auth.ts
const originalEnv = process.env;

// Test different ways of loading environment
console.log("🌍 Testing Environment Variable Loading\n");

// Method 1: Direct process.env (how auth.ts loads it)
console.log("1. Direct process.env access:");
console.log(`ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || 'NOT SET'}`);
console.log(`ADMIN_PASSWORD_HASH: ${process.env.ADMIN_PASSWORD_HASH ? 'SET (' + process.env.ADMIN_PASSWORD_HASH.substring(0, 20) + '...)' : 'NOT SET'}`);
console.log(`NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET'}`);
console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? 'SET' : 'NOT SET'}`);

// Method 2: With dotenv.config (how scripts load it)
console.log("\n2. With dotenv.config:");
require('dotenv').config({ path: '.env.local' });
console.log(`ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || 'NOT SET'}`);
console.log(`ADMIN_PASSWORD_HASH: ${process.env.ADMIN_PASSWORD_HASH ? 'SET (' + process.env.ADMIN_PASSWORD_HASH.substring(0, 20) + '...)' : 'NOT SET'}`);

// Method 3: Simulate auth.ts environment exactly
console.log("\n3. Simulating auth.ts environment:");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD_HASH = (process.env.ADMIN_PASSWORD_HASH || "").trim();

console.log(`ADMIN_EMAIL constant: "${ADMIN_EMAIL}"`);
console.log(`ADMIN_PASSWORD_HASH constant: ${ADMIN_PASSWORD_HASH ? 'SET (' + ADMIN_PASSWORD_HASH.substring(0, 20) + '...)' : 'NOT SET'}`);
console.log(`ADMIN_PASSWORD_HASH length: ${ADMIN_PASSWORD_HASH.length}`);

// Test the exact bcrypt comparison as done in auth.ts
async function testAuthComparison() {
  console.log("\n4. Testing exact auth.ts bcrypt comparison:");

  // Simulate the exact credentials from the log
  const credentials = {
    email: "minotaurosu@pm.me",
    password: "QVuNgv!7vG7?9S?R"
  };

  // Exact email validation as in auth.ts
  const emailInput = String(credentials.email || "").trim().toLowerCase();
  const adminEmail = ADMIN_EMAIL.trim().toLowerCase();
  const isEmailValid = emailInput === adminEmail;

  console.log(`Email validation: ${isEmailValid ? '✅' : '❌'}`);
  console.log(`  Input: "${emailInput}"`);
  console.log(`  Expected: "${adminEmail}"`);

  // Exact password validation as in auth.ts
  const passwordInput = String(credentials.password || "");
  let isPasswordValid = false;

  console.log(`Password input length: ${passwordInput.length}`);
  console.log(`Hash available: ${Boolean(ADMIN_PASSWORD_HASH)}`);
  console.log(`Hash length: ${ADMIN_PASSWORD_HASH.length}`);

  if (ADMIN_PASSWORD_HASH) {
    try {
      console.log("Attempting bcrypt.compare...");
      isPasswordValid = await bcrypt.compare(passwordInput, ADMIN_PASSWORD_HASH);
      console.log(`bcrypt.compare result: ${isPasswordValid ? '✅' : '❌'}`);

      if (!isPasswordValid) {
        console.log("Testing alternative formats...");

        // Test trimmed
        const trimmed = passwordInput.trim();
        const trimmedResult = await bcrypt.compare(trimmed, ADMIN_PASSWORD_HASH);
        console.log(`Trimmed result: ${trimmedResult ? '✅' : '❌'}`);

        // Test CR/LF cleaned
        const cleaned = passwordInput.replace(/[\r\n]+/g, "");
        const cleanedResult = await bcrypt.compare(cleaned, ADMIN_PASSWORD_HASH);
        console.log(`Cleaned result: ${cleanedResult ? '✅' : '❌'}`);

        isPasswordValid = trimmedResult || cleanedResult;
      }

    } catch (error) {
      console.log(`bcrypt error: ${error.message}`);
      isPasswordValid = false;
    }
  }

  console.log(`\nFinal validation results:`);
  console.log(`Email valid: ${isEmailValid ? '✅' : '❌'}`);
  console.log(`Password valid: ${isPasswordValid ? '✅' : '❌'}`);
  console.log(`Should authenticate: ${isEmailValid && isPasswordValid ? '✅' : '❌'}`);

  // Test hash format
  console.log(`\n5. Hash format validation:`);
  const hashRegex = /^\$2[aby]?\$\d+\$.{53}$/;
  const isValidHashFormat = hashRegex.test(ADMIN_PASSWORD_HASH);
  console.log(`Hash format valid: ${isValidHashFormat ? '✅' : '❌'}`);

  if (!isValidHashFormat) {
    console.log(`Hash: "${ADMIN_PASSWORD_HASH}"`);
    console.log(`Expected format: $2b$12$...`);
  }
}

// Test MongoDB connection (might affect auth)
async function testMongoConnection() {
  console.log("\n6. Testing MongoDB connection:");

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log("❌ MONGODB_URI not set");
    return;
  }

  try {
    const client = new MongoClient(mongoUri);
    await client.connect();
    console.log("✅ MongoDB connection successful");
    await client.close();
  } catch (error) {
    console.log(`❌ MongoDB connection failed: ${error.message}`);
  }
}

async function runAllTests() {
  await testAuthComparison();
  await testMongoConnection();

  console.log("\n🎯 Diagnosis:");
  if (!ADMIN_EMAIL) {
    console.log("❌ ADMIN_EMAIL not loaded");
  } else if (!ADMIN_PASSWORD_HASH) {
    console.log("❌ ADMIN_PASSWORD_HASH not loaded");
  } else {
    console.log("✅ Environment variables are loaded correctly");
    console.log("💡 Issue might be in NextAuth middleware or session handling");
  }
}

if (require.main === module) {
  runAllTests().catch(console.error);
}
