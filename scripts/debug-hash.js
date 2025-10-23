#!/usr/bin/env node

const bcrypt = require("bcryptjs");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function testHashAndVerify() {
  console.log("🔍 Bcrypt Hash Debug Tool\n");

  // Test password
  const testPassword = await new Promise((resolve) => {
    rl.question("Enter password to test: ", (answer) => {
      resolve(answer);
    });
  });

  console.log(`\n📝 Testing password: "${testPassword}"`);
  console.log(`Password length: ${testPassword.length}`);
  console.log(`Password bytes: [${Array.from(Buffer.from(testPassword, 'utf8')).join(', ')}]`);

  // Show any special characters
  const specialChars = [];
  for (let i = 0; i < testPassword.length; i++) {
    const char = testPassword[i];
    const code = testPassword.charCodeAt(i);
    if (code < 32 || code > 126) {
      specialChars.push(`pos ${i}: '${char}' (code: ${code})`);
    }
  }

  if (specialChars.length > 0) {
    console.log(`⚠️  Special/non-printable characters found:`);
    specialChars.forEach(char => console.log(`   ${char}`));
  } else {
    console.log(`✅ No special/non-printable characters found`);
  }

  // Test different cleaning methods
  const cleaned1 = testPassword.replace(/[\r\n]+/g, "");
  const cleaned2 = testPassword.trim();
  const cleaned3 = testPassword.replace(/[\r\n\s]+$/g, "");

  console.log(`\n🧹 Password cleaning tests:`);
  console.log(`Original:     "${testPassword}" (len: ${testPassword.length})`);
  console.log(`CR/LF clean:  "${cleaned1}" (len: ${cleaned1.length})`);
  console.log(`Trimmed:      "${cleaned2}" (len: ${cleaned2.length})`);
  console.log(`Tail clean:   "${cleaned3}" (len: ${cleaned3.length})`);

  // Generate hash with same settings as the script
  console.log(`\n🔐 Generating hash with saltRounds=12...`);
  const saltRounds = 12;
  const hash = await bcrypt.hash(testPassword, saltRounds);

  console.log(`Generated hash: ${hash}`);
  console.log(`Hash length: ${hash.length}`);

  // Test verification immediately
  console.log(`\n✅ Testing immediate verification:`);
  const immediateVerify = await bcrypt.compare(testPassword, hash);
  console.log(`Immediate verify result: ${immediateVerify}`);

  // Test verification with cleaned passwords
  console.log(`\n🧪 Testing verification with cleaned passwords:`);
  const verify1 = await bcrypt.compare(cleaned1, hash);
  const verify2 = await bcrypt.compare(cleaned2, hash);
  const verify3 = await bcrypt.compare(cleaned3, hash);

  console.log(`Original password verify: ${immediateVerify}`);
  console.log(`CR/LF cleaned verify:     ${verify1}`);
  console.log(`Trimmed verify:           ${verify2}`);
  console.log(`Tail cleaned verify:      ${verify3}`);

  // Test with environment variable if available
  if (process.env.ADMIN_PASSWORD_HASH) {
    console.log(`\n🌍 Testing against existing ADMIN_PASSWORD_HASH:`);
    console.log(`Env hash: ${process.env.ADMIN_PASSWORD_HASH}`);

    const envVerify = await bcrypt.compare(testPassword, process.env.ADMIN_PASSWORD_HASH);
    const envVerify1 = await bcrypt.compare(cleaned1, process.env.ADMIN_PASSWORD_HASH);
    const envVerify2 = await bcrypt.compare(cleaned2, process.env.ADMIN_PASSWORD_HASH);
    const envVerify3 = await bcrypt.compare(cleaned3, process.env.ADMIN_PASSWORD_HASH);

    console.log(`Env verify original:  ${envVerify}`);
    console.log(`Env verify CR/LF:     ${envVerify1}`);
    console.log(`Env verify trimmed:   ${envVerify2}`);
    console.log(`Env verify tail:      ${envVerify3}`);
  } else {
    console.log(`\n⚠️  ADMIN_PASSWORD_HASH environment variable not set`);
  }

  // Show bcrypt version info
  console.log(`\n📦 Bcrypt version info:`);
  console.log(`bcryptjs version: ${require('bcryptjs/package.json').version}`);

  rl.close();
}

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n\n👋 Debug cancelled by user");
  process.exit(0);
});

if (require.main === module) {
  testHashAndVerify().catch(console.error);
}
