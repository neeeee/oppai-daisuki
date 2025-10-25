#!/usr/bin/env node

import * as bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function verifyHash() {
  console.log("🔍 Direct Hash Verification Test\n");

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminEmail || !adminHash) {
    console.log("❌ ADMIN_EMAIL or ADMIN_PASSWORD_HASH not set in environment");
    process.exit(1);
  }

  console.log(`Admin Email: ${adminEmail}`);
  console.log(`Hash: ${adminHash.substring(0, 20)}...`);
  console.log(`Hash Length: ${adminHash.length}`);

  // Test the exact password from the logs
  const testPassword = "X7WD@w2ga!ebnmM4";

  console.log(`\nTesting password: "${testPassword}"`);
  console.log(`Password length: ${testPassword.length}`);
  console.log(
    `Password bytes: [${Array.from(Buffer.from(testPassword, "utf8")).join(", ")}]`,
  );

  try {
    // Test direct comparison
    console.log("\n🧪 Testing direct bcrypt comparison...");
    const result1 = await bcrypt.compare(testPassword, adminHash);
    console.log(`Direct comparison: ${result1 ? "✅" : "❌"}`);

    // Test with trimmed password
    console.log("\n🧪 Testing with trimmed password...");
    const trimmedPassword = testPassword.trim();
    const result2 = await bcrypt.compare(trimmedPassword, adminHash);
    console.log(`Trimmed comparison: ${result2 ? "✅" : "❌"}`);

    // Test generating new hash for the same password
    console.log("\n🧪 Testing hash generation for same password...");
    const newHash = await bcrypt.hash(testPassword, 12);
    console.log(`New hash: ${newHash}`);

    const newVerify = await bcrypt.compare(testPassword, newHash);
    console.log(`New hash verification: ${newVerify ? "✅" : "❌"}`);

    // Test if existing hash is valid format
    console.log("\n🧪 Testing hash format...");
    const hashRegex = /^\$2[aby]?\$\d+\$.{53}$/;
    const isValidFormat = hashRegex.test(adminHash);
    console.log(`Hash format valid: ${isValidFormat ? "✅" : "❌"}`);

    // Extract salt rounds from hash
    const saltRounds = adminHash.split("$")[2];
    console.log(`Salt rounds in hash: ${saltRounds}`);

    // Manual verification with extracted salt
    console.log("\n🧪 Manual verification test...");
    try {
      const salt = adminHash.substring(0, 29); // $2b$12$ + 22 chars
      console.log(`Extracted salt: ${salt}`);

      const manualHash = await bcrypt.hash(testPassword, salt);
      const manualMatch = manualHash === adminHash;
      console.log(`Manual hash match: ${manualMatch ? "✅" : "❌"}`);

      if (!manualMatch) {
        console.log(`Expected: ${adminHash}`);
        console.log(`Got:      ${manualHash}`);
      }
    } catch (error) {
      console.log(`Manual verification error: ${error.message}`);
    }

    // Final determination
    console.log("\n📊 Summary:");
    if (result1 || result2) {
      console.log("✅ Hash verification PASSED - credentials should work");
    } else {
      console.log(
        "❌ Hash verification FAILED - there's a problem with the stored hash",
      );
      console.log("\n💡 Possible solutions:");
      console.log("1. Regenerate the hash with the correct password");
      console.log("2. Check if the password was changed after hash generation");
      console.log("3. Verify no encoding issues in .env.local file");
    }
  } catch (error) {
    console.error(`❌ Error during verification: ${error.message}`);
  }
}

verifyHash().catch(console.error);
