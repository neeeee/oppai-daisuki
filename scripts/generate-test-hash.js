#!/usr/bin/env node

const bcrypt = require("bcryptjs");

async function generateTestHash() {
  console.log("🔐 Test Credentials Hash Generator\n");

  // Hardcoded test credentials from the login form
  const testEmail = "admin@test.com";
  const testPassword = "testPassword123!";

  console.log("📋 Test Credentials:");
  console.log(`Email: ${testEmail}`);
  console.log(`Password: ${testPassword}`);
  console.log(`Password length: ${testPassword.length}`);

  try {
    console.log("\n🔄 Generating hash...");
    const hash = await bcrypt.hash(testPassword, 12);

    // Verify the hash immediately
    const verify = await bcrypt.compare(testPassword, hash);

    if (!verify) {
      console.error("❌ Hash verification failed!");
      process.exit(1);
    }

    console.log("✅ Hash generated and verified successfully!\n");

    console.log("📝 Environment Variables for .env.local:");
    console.log("==========================================");
    console.log(`ADMIN_EMAIL="${testEmail}"`);
    console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
    console.log("");

    // Generate other required secrets
    function generateSecretKey(length = 64) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let result = "";
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }

    const nextAuthSecret = generateSecretKey();
    const jwtSecret = generateSecretKey(32);

    console.log("# NextAuth Configuration");
    console.log(`NEXTAUTH_SECRET="${nextAuthSecret}"`);
    console.log(`NEXTAUTH_URL="http://localhost:3000"`);
    console.log("");
    console.log("# JWT Configuration");
    console.log(`JWT_SECRET="${jwtSecret}"`);
    console.log("");
    console.log("# Database");
    console.log('MONGODB_URI="mongodb://localhost:27017/oppai-daisuki"');

    console.log("\n✨ Copy the above environment variables to your .env.local file");
    console.log("🚀 You can now log in with the test credentials!");

  } catch (error) {
    console.error("❌ Error generating hash:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  generateTestHash().catch(console.error);
}
