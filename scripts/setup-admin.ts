#!/usr/bin/env node
import bcrypt from "bcryptjs";

const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
  console.error("❌ Invalid or missing ADMIN_EMAIL");
  process.exit(1);
}
if (!adminPassword || adminPassword.length < 12) {
  console.error("❌ ADMIN_PASSWORD must be at least 12 characters");
  process.exit(1);
}

const saltRounds = 12;
const hash = await bcrypt.hash(adminPassword, saltRounds);
const hashBase64 = Buffer.from(hash).toString("base64");

console.log(`ADMIN_EMAIL=${adminEmail}`);
console.log(`ADMIN_PASSWORD_HASH_BASE64=${hashBase64}`);