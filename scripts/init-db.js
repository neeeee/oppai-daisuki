#!/usr/bin/env node

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// Import models
import { Video } from "../models/Video.js";
import { Photo } from "../models/Photo.js";
import { Gallery } from "../models/Gallery.js";
import { Idol } from "../models/Idol.js";
import { Genre } from "../models/Genre.js";
import { News } from "../models/News.js";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ Please define the MONGODB_URI environment variable");
  process.exit(1);
}

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    });
    console.log("✅ Connected to MongoDB successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

async function createIndexes() {
  console.log("🔄 Creating database indexes...");

  try {
    // Video indexes
    await Video.collection.createIndex({ title: "text", channelName: "text" });
    await Video.collection.createIndex({ createdAt: -1 });
    await Video.collection.createIndex({ viewCount: -1 });
    console.log("✅ Video indexes created");

    // Photo indexes
    await Photo.collection.createIndex({
      title: "text",
      description: "text",
      tags: "text",
    });
    await Photo.collection.createIndex({ category: 1 });
    await Photo.collection.createIndex({ isPublic: 1 });
    await Photo.collection.createIndex({ createdAt: -1 });
    await Photo.collection.createIndex({ gallery: 1 });
    await Photo.collection.createIndex({ idol: 1 });
    console.log("✅ Photo indexes created");

    // Gallery indexes
    await Gallery.collection.createIndex({
      title: "text",
      description: "text",
      tags: "text",
    });
    await Gallery.collection.createIndex({ slug: 1 }, { unique: true });
    await Gallery.collection.createIndex({ isPublic: 1 });
    await Gallery.collection.createIndex({ createdAt: -1 });
    await Gallery.collection.createIndex({ idol: 1 });
    await Gallery.collection.createIndex({ genre: 1 });
    console.log("✅ Gallery indexes created");

    // Idol indexes
    await Idol.collection.createIndex({
      name: "text",
      stageName: "text",
      bio: "text",
    });
    await Idol.collection.createIndex({ slug: 1 }, { unique: true });
    await Idol.collection.createIndex({ status: 1 });
    await Idol.collection.createIndex({ isVerified: 1 });
    await Idol.collection.createIndex({ isPublic: 1 });
    await Idol.collection.createIndex({ createdAt: -1 });
    await Idol.collection.createIndex({ genres: 1 });
    console.log("✅ Idol indexes created");

    // Genre indexes
    await Genre.collection.createIndex({ name: "text", description: "text" });
    await Genre.collection.createIndex({ slug: 1 }, { unique: true });
    await Genre.collection.createIndex({ isPublic: 1 });
    await Genre.collection.createIndex({ sortOrder: 1 });
    await Genre.collection.createIndex({ parentGenre: 1 });
    console.log("✅ Genre indexes created");

    // News indexes
    await News.collection.createIndex({
      title: "text",
      excerpt: "text",
      content: "text",
    });
    await News.collection.createIndex({ slug: 1 }, { unique: true });
    await News.collection.createIndex({ status: 1 });
    await News.collection.createIndex({ category: 1 });
    await News.collection.createIndex({ publishedAt: -1 });
    await News.collection.createIndex({ isFeatured: 1 });
    await News.collection.createIndex({ isBreaking: 1 });
    await News.collection.createIndex({ relatedIdols: 1 });
    await News.collection.createIndex({ relatedGenres: 1 });
    console.log("✅ News indexes created");

    console.log("🎉 All database indexes created successfully");
  } catch (error) {
    console.error("❌ Error creating indexes:", error);
    throw error;
  }
}

async function seedGenres() {
  console.log("🔄 Seeding initial genres...");

  const existingGenres = await Genre.countDocuments();
  if (existingGenres > 0) {
    console.log("⚠️  Genres already exist, skipping seed");
    return;
  }

  const genres = [
    {
      name: "Gravure",
      description: "Traditional Japanese gravure photography",
      color: "#ff6b9d",
      sortOrder: 1,
      metadata: { featured: true },
    },
    {
      name: "Swimwear",
      description: "Swimsuit and bikini photography",
      color: "#4ecdc4",
      sortOrder: 2,
      metadata: { featured: true },
    },
    {
      name: "Lingerie",
      description: "Intimate and lingerie photography",
      color: "#ff9472",
      sortOrder: 3,
      isAdult: true,
    },
    {
      name: "Cosplay",
      description: "Costume play and character photography",
      color: "#9b59b6",
      sortOrder: 4,
      metadata: { trending: true },
    },
    {
      name: "Athletic",
      description: "Sports and fitness photography",
      color: "#3498db",
      sortOrder: 5,
    },
    {
      name: "Fashion",
      description: "Fashion and style photography",
      color: "#2ecc71",
      sortOrder: 6,
    },
    {
      name: "Outdoor",
      description: "Nature and outdoor photography",
      color: "#27ae60",
      sortOrder: 7,
    },
    {
      name: "Studio",
      description: "Professional studio photography",
      color: "#34495e",
      sortOrder: 8,
    },
    {
      name: "Vintage",
      description: "Retro and vintage style photography",
      color: "#d4af37",
      sortOrder: 9,
    },
    {
      name: "Artistic",
      description: "Artistic and creative photography",
      color: "#8e44ad",
      sortOrder: 10,
    },
  ];

  try {
    await Genre.insertMany(genres);
    console.log(`✅ Created ${genres.length} initial genres`);
  } catch (error) {
    console.error("❌ Error seeding genres:", error);
    throw error;
  }
}

async function seedIdols() {
  console.log("🔄 Seeding sample idols...");

  const existingIdols = await Idol.countDocuments();
  if (existingIdols > 0) {
    console.log("⚠️  Idols already exist, skipping seed");
    return;
  }

  // Get some genres for relationships
  const genres = await Genre.find().limit(5);
  const genreIds = genres.map((g) => g._id);

  const idols = [
    {
      name: "Sample Idol 1",
      stageName: "Idol One",
      bio: "A talented and beautiful gravure idol known for her charming personality.",
      height: 165,
      measurements: { bust: 85, waist: 60, hips: 88, cupSize: "C" },
      bloodType: "A",
      status: "active",
      genres: [genreIds[0], genreIds[1]],
      tags: ["popular", "newcomer"],
      isVerified: true,
      metadata: { featured: true },
    },
    {
      name: "Sample Idol 2",
      stageName: "Idol Two",
      bio: "An experienced model with years in the industry.",
      height: 168,
      measurements: { bust: 82, waist: 58, hips: 85, cupSize: "B" },
      bloodType: "B",
      status: "active",
      genres: [genreIds[1], genreIds[2]],
      tags: ["veteran", "professional"],
      isVerified: true,
    },
    {
      name: "Sample Idol 3",
      stageName: "Idol Three",
      bio: "A rising star in the gravure world.",
      height: 162,
      measurements: { bust: 88, waist: 62, hips: 90, cupSize: "D" },
      bloodType: "O",
      status: "active",
      genres: [genreIds[0], genreIds[3]],
      tags: ["rising-star", "cosplay"],
      isVerified: false,
      metadata: { trending: true },
    },
  ];

  try {
    const createdIdols = await Idol.insertMany(idols);
    console.log(`✅ Created ${createdIdols.length} sample idols`);

    // Update genre counters
    await Genre.updateMany(
      { _id: { $in: genreIds } },
      { $inc: { "contentCounts.idols": 1 } },
    );
    console.log("✅ Updated genre counters for idols");
  } catch (error) {
    console.error("❌ Error seeding idols:", error);
    throw error;
  }
}

async function seedNews() {
  console.log("🔄 Seeding sample news articles...");

  const existingNews = await News.countDocuments();
  if (existingNews > 0) {
    console.log("⚠️  News already exist, skipping seed");
    return;
  }

  // Get some idols and genres for relationships
  const idols = await Idol.find().limit(3);
  const genres = await Genre.find().limit(3);

  const articles = [
    {
      title: "Welcome to Oppai Daisuki",
      excerpt: "Introducing our new gravure photography platform.",
      content:
        "We are excited to launch Oppai Daisuki, a premium platform for gravure photography enthusiasts. Our mission is to showcase the beauty and artistry of Japanese gravure photography while supporting talented models and photographers.",
      author: { name: "Admin", email: "admin@oppai-daisuki.com" },
      category: "announcements",
      status: "published",
      publishedAt: new Date(),
      isPublic: true,
      isFeatured: true,
      tags: ["welcome", "launch", "announcement"],
      relatedGenres: [genres[0]._id],
    },
    {
      title: "New Model Spotlight",
      excerpt:
        "Featuring our latest verified models and their stunning portfolios.",
      content:
        "This month we are highlighting some of our newest verified models who have joined our platform. Each brings their unique style and charm to the world of gravure photography.",
      author: { name: "Editorial Team", email: "editorial@oppai-daisuki.com" },
      category: "general",
      status: "published",
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      isPublic: true,
      tags: ["models", "spotlight", "featured"],
      relatedIdols: [idols[0]._id, idols[1]._id],
      relatedGenres: [genres[0]._id, genres[1]._id],
    },
    {
      title: "Photography Tips and Techniques",
      excerpt:
        "Learn professional gravure photography techniques from industry experts.",
      content:
        "In this comprehensive guide, we share professional tips and techniques for gravure photography. From lighting setups to posing guidance, these insights will help photographers capture stunning images.",
      author: { name: "Photography Team", email: "photo@oppai-daisuki.com" },
      category: "industry",
      status: "published",
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Week ago
      isPublic: true,
      tags: ["photography", "tips", "techniques", "guide"],
      relatedGenres: [genres[2]._id],
    },
  ];

  try {
    const createdArticles = await News.insertMany(articles);
    console.log(`✅ Created ${createdArticles.length} sample news articles`);

    // Update genre counters
    await Genre.updateMany(
      { _id: { $in: genres.map((g) => g._id) } },
      { $inc: { "contentCounts.news": 1 } },
    );
    console.log("✅ Updated genre counters for news");
  } catch (error) {
    console.error("❌ Error seeding news:", error);
    throw error;
  }
}

async function getDatabaseStats() {
  console.log("📊 Database Statistics:");

  try {
    const [
      videoCount,
      photoCount,
      galleryCount,
      idolCount,
      genreCount,
      newsCount,
    ] = await Promise.all([
      Video.countDocuments(),
      Photo.countDocuments(),
      Gallery.countDocuments(),
      Idol.countDocuments(),
      Genre.countDocuments(),
      News.countDocuments(),
    ]);

    console.log(`   Videos: ${videoCount}`);
    console.log(`   Photos: ${photoCount}`);
    console.log(`   Galleries: ${galleryCount}`);
    console.log(`   Idols: ${idolCount}`);
    console.log(`   Genres: ${genreCount}`);
    console.log(`   News Articles: ${newsCount}`);
    console.log(
      `   Total Documents: ${videoCount + photoCount + galleryCount + idolCount + genreCount + newsCount}`,
    );

    // Database size info
    const db = mongoose.connection.db;
    const stats = await db.stats();
    console.log(
      `   Database Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
    );
    console.log(
      `   Index Size: ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`,
    );
    console.log(`   Collections: ${stats.collections}`);
  } catch (error) {
    console.error("❌ Error getting database stats:", error);
  }
}

async function main() {
  console.log("🚀 Initializing Database...\n");

  try {
    // Connect to database
    await connectDB();

    // Create indexes
    await createIndexes();
    console.log();

    // Seed initial data
    await seedGenres();
    console.log();

    await seedIdols();
    console.log();

    await seedNews();
    console.log();

    // Show database stats
    await getDatabaseStats();
    console.log();

    console.log("🎉 Database initialization completed successfully!");
    console.log();
    console.log("📝 Next steps:");
    console.log("   1. Start your development server: npm run dev");
    console.log("   2. Visit /admin to manage your content");
    console.log("   3. Check out the API endpoints:");
    console.log("      - GET /api/videos");
    console.log("      - GET /api/photos");
    console.log("      - GET /api/galleries");
    console.log("      - GET /api/idols");
    console.log("      - GET /api/genres");
    console.log("      - GET /api/news");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("👋 Database connection closed");
  }
}

// Handle process termination
process.on("SIGINT", async () => {
  console.log("\n⚠️  Process interrupted");
  await mongoose.connection.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n⚠️  Process terminated");
  await mongoose.connection.close();
  process.exit(0);
});

// Run the initialization
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Unexpected error:", error);
    process.exit(1);
  });
}

module.exports = {
  connectDB,
  createIndexes,
  seedGenres,
  seedIdols,
  seedNews,
  getDatabaseStats,
};
