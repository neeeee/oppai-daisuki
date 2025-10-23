#!/usr/bin/env node

const bcrypt = require("bcryptjs");
require('dotenv').config({ path: '.env.local' });

async function testEnvironment() {
  console.log("🌍 Environment Test Script\n");

  // Check environment variables
  console.log("📋 Environment Variables:");
  console.log(`ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || 'NOT SET'}`);
  console.log(`ADMIN_PASSWORD_HASH: ${process.env.ADMIN_PASSWORD_HASH ? 'SET (' + process.env.ADMIN_PASSWORD_HASH.substring(0, 20) + '...)' : 'NOT SET'}`);
  console.log(`NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET'}`);
  console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? 'SET' : 'NOT SET'}`);

  // Test hardcoded credentials from login form
  const testEmail = "admin@test.com";
  const testPassword = "testPassword123!";

  console.log("\n🧪 Testing hardcoded credentials from login form:");
  console.log(`Test email: ${testEmail}`);
  console.log(`Test password: ${testPassword}`);

  if (process.env.ADMIN_EMAIL) {
    const emailMatch = process.env.ADMIN_EMAIL.toLowerCase() === testEmail.toLowerCase();
    console.log(`Email match: ${emailMatch ? '✅' : '❌'} (env: ${process.env.ADMIN_EMAIL})`);
  }

  if (process.env.ADMIN_PASSWORD_HASH) {
    try {
      const passwordMatch = await bcrypt.compare(testPassword, process.env.ADMIN_PASSWORD_HASH);
      console.log(`Password match: ${passwordMatch ? '✅' : '❌'}`);

      // Test with trimmed password
      const trimmedMatch = await bcrypt.compare(testPassword.trim(), process.env.ADMIN_PASSWORD_HASH);
      console.log(`Trimmed password match: ${trimmedMatch ? '✅' : '❌'}`);

      // Test generating hash for the test password
      console.log("\n🔐 Generating hash for test password...");
      const newHash = await bcrypt.hash(testPassword, 12);
      console.log(`New hash: ${newHash}`);

      const newVerify = await bcrypt.compare(testPassword, newHash);
      console.log(`New hash verification: ${newVerify ? '✅' : '❌'}`);

    } catch (error) {
      console.log(`Password verification error: ${error.message}`);
    }
  }

  console.log("\n💡 Recommendations:");
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD_HASH) {
    console.log("- Run 'npm run setup-admin' to generate environment variables");
  } else if (process.env.ADMIN_EMAIL.toLowerCase() !== testEmail.toLowerCase()) {
    console.log("- Update login form email or regenerate with correct email");
  } else {
    console.log("- Environment seems configured, check password hash generation");
  }
}

testEnvironment().catch(console.error);
