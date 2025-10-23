# Maintenance Scripts

This directory contains utility scripts for database maintenance and data fixes.

## Prerequisites

All scripts require:
- Node.js installed
- `.env.local` file with `MONGODB_URI` configured
- Dependencies installed (`npm install`)

## Available Scripts

### 1. Fix Video Slugs

**File:** `fix-video-slugs.js`

Finds and fixes videos with missing or invalid slugs. This can happen if the pre-save hooks didn't run during video creation.

**Usage:**
```bash
node scripts/fix-video-slugs.js
```

**What it does:**
- Finds videos with missing, null, or empty slugs
- Generates proper slugs from video titles
- Handles duplicate slugs by adding timestamps
- Reports summary of fixed videos

**When to use:**
- After importing videos from external sources
- If you notice videos appearing with "undefined" slugs
- As part of database maintenance

---

### 2. Remove Duplicate Videos

**File:** `remove-duplicate-videos.js`

Identifies and removes duplicate video entries in the database.

**Usage:**
```bash
node scripts/remove-duplicate-videos.js
```

**What it does:**
- Finds duplicates by title
- Finds duplicates by slug
- Identifies videos with missing slugs
- Automatically removes duplicates using smart logic:
  - For title duplicates: keeps newest (latest createdAt)
  - For slug duplicates: keeps oldest (earliest createdAt)
  - Deletes videos with missing slugs
- Reports detailed summary

**When to use:**
- If you notice the same video appearing multiple times
- After bulk imports that may have created duplicates
- Before deploying to production
- As part of regular database cleanup

**Strategy:**
- **Missing slugs:** Deleted immediately (likely incomplete records)
- **Duplicate titles with missing slugs:** Keeps the one with a valid slug
- **Duplicate slugs:** Keeps the original (oldest) and removes duplicates
- **Safe:** Won't delete videos with valid unique slugs even if titles match

---

## Common Issues and Solutions

### Issue: Same video appears 3 times on videos page

**Cause:** Duplicate video records in database, likely from failed slug generation

**Solution:**
```bash
# 1. Remove duplicates
node scripts/remove-duplicate-videos.js

# 2. Fix any remaining slug issues
node scripts/fix-video-slugs.js
```

### Issue: Video has "undefined" slug

**Cause:** Pre-save hooks didn't run during creation (fixed in latest code)

**Solution:**
```bash
node scripts/fix-video-slugs.js
```

### Issue: Can't create video with same title

**Cause:** Duplicate slug constraint violation

**Solution:**
1. Check for existing videos with similar titles
2. Either delete the duplicate or modify the title slightly
3. Run the fix script if needed:
   ```bash
   node scripts/remove-duplicate-videos.js
   ```

---

## Prevention

The following fixes have been implemented in the codebase to prevent these issues:

1. **Model cache clearing** - Video and Idol models now clear Mongoose cache to ensure schema is fresh
2. **Pre-validate hooks** - Slugs are generated before validation runs
3. **Pre-save hooks** - Backup slug generation if pre-validate didn't run
4. **Unique slug index** - Database prevents duplicate slugs

These scripts are for maintenance and fixing historical data issues.

---

## Adding New Scripts

When adding new maintenance scripts:

1. Use `require('dotenv').config({ path: '.env.local' });` at the top
2. Include clear console output with emojis for readability
3. Show before/after statistics
4. Handle errors gracefully with try/catch
5. Always disconnect from MongoDB when done
6. Document the script in this README

**Template:**
```javascript
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function myMaintenanceTask() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Your maintenance logic here
    
    await mongoose.disconnect();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

myMaintenanceTask();
```

---

## Safety Notes

⚠️ **Important:**
- Always backup your database before running cleanup scripts
- Test scripts on development/staging before production
- Review the script output before confirming any destructive actions
- Some scripts may modify or delete data permanently

✅ **Best Practices:**
- Run scripts during low-traffic periods
- Monitor application after running maintenance scripts
- Keep scripts in version control
- Document any custom scripts you create