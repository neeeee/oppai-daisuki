import mongoose from "mongoose";

const IdolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    stageName: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String, // UploadThing URL
    },
    coverImage: {
      type: String, // UploadThing URL
    },
    birthDate: {
      type: Date,
    },
    birthPlace: {
      type: String,
      trim: true,
    },
    height: {
      type: Number, // in cm
    },
    measurements: {
      bust: {
        type: Number,
      },
      waist: {
        type: Number,
      },
      hips: {
        type: Number,
      },
      cupSize: {
        type: String,
        trim: true,
      },
    },
    bloodType: {
      type: String,
      trim: true,
    },
    zodiacSign: {
      type: String,
      trim: true,
    },
    hobbies: [{
      type: String,
      trim: true,
    }],
    specialSkills: [{
      type: String,
      trim: true,
    }],
    careerStart: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'retired', 'hiatus'],
      default: 'active',
    },
    agency: {
      type: String,
      trim: true,
    },
    socialMedia: {
      twitter: {
        type: String,
        trim: true,
      },
      instagram: {
        type: String,
        trim: true,
      },
      tiktok: {
        type: String,
        trim: true,
      },
      youtube: {
        type: String,
        trim: true,
      },
      website: {
        type: String,
        trim: true,
      },
    },
    genres: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Genre',
    }],
    tags: [{
      type: String,
      trim: true,
    }],
    isVerified: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    favoriteCount: {
      type: Number,
      default: 0,
    },
    photoCount: {
      type: Number,
      default: 0,
    },
    videoCount: {
      type: Number,
      default: 0,
    },
    galleryCount: {
      type: Number,
      default: 0,
    },
    metadata: {
      lastPhotoUpload: {
        type: Date,
      },
      lastVideoUpload: {
        type: Date,
      },
      featured: {
        type: Boolean,
        default: false,
      },
      featuredUntil: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
IdolSchema.index({ name: 'text', stageName: 'text', bio: 'text', tags: 'text' });
IdolSchema.index({ slug: 1 });
IdolSchema.index({ status: 1 });
IdolSchema.index({ isVerified: 1 });
IdolSchema.index({ isPublic: 1 });
IdolSchema.index({ createdAt: -1 });
IdolSchema.index({ viewCount: -1 });
IdolSchema.index({ favoriteCount: -1 });
IdolSchema.index({ photoCount: -1 });
IdolSchema.index({ videoCount: -1 });
IdolSchema.index({ genres: 1 });
IdolSchema.index({ 'metadata.featured': 1 });

// Virtual for age calculation
IdolSchema.virtual('age').get(function() {
  if (!this.birthDate) return null;
  const today = new Date();
  const birthDate = new Date(this.birthDate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Pre-save middleware to generate slug from name
IdolSchema.pre('save', function(next) {
  if (this.isModified('name') || this.isNew) {
    const nameToSlugify = this.stageName || this.name;
    this.slug = nameToSlugify
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

// Ensure virtuals are included in JSON output
IdolSchema.set('toJSON', { virtuals: true });
IdolSchema.set('toObject', { virtuals: true });

export default mongoose.models.Idol || mongoose.model("Idol", IdolSchema);
