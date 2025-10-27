# API Documentation - Oppai Daisuki

This document provides comprehensive information about the REST API endpoints for the Oppai Daisuki platform.

## Base URL

```
http://localhost:3000/api  (Development)
https://yourdomain.com/api  (Production)
```

## Authentication

Most endpoints require authentication. Admin endpoints require admin role authentication.

### Headers

```
Content-Type: application/json
Authorization: Bearer <token>  (for protected endpoints)
```

---

## Videos API

### GET /api/videos

Retrieve paginated list of videos.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 12) - Items per page
- `search` (string) - Search in title and channel name
- `sortBy` (string, default: "createdAt") - Sort field
- `sortOrder` (string, default: "desc") - Sort direction (asc/desc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Video Title",
      "channelName": "Channel Name",
      "channelAvatar": "avatar_url",
      "duration": "10:30",
      "viewCount": 1234,
      "thumbnailUrl": "thumbnail_url",
      "videoSourceUrl": "video_url",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 120,
    "itemsPerPage": 12,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### POST /api/videos (Admin)

Create a new video.

**Request Body:**
```json
{
  "title": "Video Title",
  "channelName": "Channel Name",
  "channelAvatar": "avatar_url",
  "duration": "10:30",
  "viewCount": 0,
  "thumbnailUrl": "thumbnail_url",
  "videoSourceUrl": "video_url"
}
```

### PUT /api/videos/[id] (Admin)

Update an existing video.

### DELETE /api/videos/[id] (Admin)

Delete a video.

---

## Photos API

### GET /api/photos

Retrieve paginated list of photos.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 12) - Items per page
- `category` (string) - Filter by category
- `gallery` (ObjectId) - Filter by gallery ID
- `idol` (ObjectId) - Filter by idol ID
- `tags` (string) - Comma-separated tags
- `search` (string) - Text search
- `sortBy` (string, default: "createdAt") - Sort field
- `sortOrder` (string, default: "desc") - Sort direction

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Photo Title",
      "description": "Photo description",
      "imageUrl": "image_url",
      "thumbnailUrl": "thumbnail_url",
      "altText": "Alt text",
      "tags": ["tag1", "tag2"],
      "category": "swimwear",
      "photographer": "Photographer Name",
      "location": "Tokyo, Japan",
      "dateTaken": "2024-01-01T00:00:00.000Z",
      "resolution": {
        "width": 1920,
        "height": 1080
      },
      "fileSize": 1024000,
      "isPublic": true,
      "viewCount": 100,
      "likeCount": 25,
      "gallery": {
        "_id": "507f1f77bcf86cd799439012",
        "title": "Gallery Title",
        "slug": "gallery-title"
      },
      "idol": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Idol Name",
        "stageName": "Stage Name",
        "slug": "idol-name",
        "profileImage": "profile_url"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 15,
    "totalItems": 180,
    "itemsPerPage": 12,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### POST /api/photos (Admin)

Create a new photo.

**Request Body:**
```json
{
  "title": "Photo Title",
  "description": "Photo description",
  "imageUrl": "image_url",
  "thumbnailUrl": "thumbnail_url",
  "altText": "Alt text",
  "tags": ["tag1", "tag2"],
  "category": "swimwear",
  "photographer": "Photographer Name",
  "location": "Tokyo, Japan",
  "dateTaken": "2024-01-01T00:00:00.000Z",
  "resolution": {
    "width": 1920,
    "height": 1080
  },
  "fileSize": 1024000,
  "gallery": "507f1f77bcf86cd799439012",
  "idol": "507f1f77bcf86cd799439013"
}
```

### DELETE /api/photos

Delete multiple photos.

**Query Parameters:**
- `ids` (string) - Comma-separated photo IDs

---

## Galleries API

### GET /api/galleries

Retrieve paginated list of galleries.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 12) - Items per page
- `category` (string) - Filter by category
- `idol` (ObjectId) - Filter by idol ID
- `genre` (ObjectId) - Filter by genre ID
- `tags` (string) - Comma-separated tags
- `search` (string) - Text search
- `sortBy` (string, default: "createdAt") - Sort field
- `sortOrder` (string, default: "desc") - Sort direction

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Gallery Title",
      "description": "Gallery description",
      "slug": "gallery-title",
      "coverPhoto": "cover_photo_url",
      "isPublic": true,
      "photoCount": 25,
      "tags": ["beach", "summer"],
      "category": "outdoor",
      "photographer": "Photographer Name",
      "location": "Okinawa, Japan",
      "dateTaken": "2024-01-01T00:00:00.000Z",
      "viewCount": 500,
      "likeCount": 75,
      "idol": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Idol Name",
        "stageName": "Stage Name",
        "slug": "idol-name",
        "profileImage": "profile_url"
      },
      "genre": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Genre Name",
        "slug": "genre-name",
        "color": "#ff6b9d"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 8,
    "totalItems": 95,
    "itemsPerPage": 12,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### POST /api/galleries (Admin)

Create a new gallery.

**Request Body:**
```json
{
  "title": "Gallery Title",
  "description": "Gallery description",
  "coverPhoto": "cover_photo_url",
  "tags": ["beach", "summer"],
  "category": "outdoor",
  "photographer": "Photographer Name",
  "location": "Okinawa, Japan",
  "dateTaken": "2024-01-01T00:00:00.000Z",
  "idol": "507f1f77bcf86cd799439013",
  "genre": "507f1f77bcf86cd799439014"
}
```

---

## Idols API

### GET /api/idols

Retrieve paginated list of idols.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 12) - Items per page
- `status` (string) - Filter by status (active/retired/hiatus)
- `genre` (ObjectId) - Filter by genre ID
- `tags` (string) - Comma-separated tags
- `search` (string) - Text search
- `sortBy` (string, default: "createdAt") - Sort field
- `sortOrder` (string, default: "desc") - Sort direction
- `featured` (boolean) - Filter featured idols
- `verified` (boolean) - Filter verified idols

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Idol Full Name",
      "stageName": "Stage Name",
      "slug": "idol-stage-name",
      "bio": "Brief biography of the idol",
      "profileImage": "profile_image_url",
      "coverImage": "cover_image_url",
      "birthDate": "1995-01-01T00:00:00.000Z",
      "birthPlace": "Tokyo, Japan",
      "height": 165,
      "measurements": {
        "bust": 85,
        "waist": 60,
        "hips": 88,
        "cupSize": "C"
      },
      "bloodType": "A",
      "zodiacSign": "Capricorn",
      "hobbies": ["photography", "traveling"],
      "specialSkills": ["dancing", "singing"],
      "careerStart": "2020-01-01T00:00:00.000Z",
      "status": "active",
      "agency": "Talent Agency Name",
      "socialMedia": {
        "twitter": "@idol_twitter",
        "instagram": "@idol_instagram",
        "website": "https://idol-website.com"
      },
      "genres": [
        {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Gravure",
          "slug": "gravure",
          "color": "#ff6b9d"
        }
      ],
      "tags": ["popular", "verified"],
      "isVerified": true,
      "isPublic": true,
      "viewCount": 10000,
      "favoriteCount": 1500,
      "photoCount": 250,
      "videoCount": 50,
      "galleryCount": 15,
      "age": 29,
      "metadata": {
        "featured": true,
        "featuredUntil": "2024-12-31T23:59:59.999Z"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 60,
    "itemsPerPage": 12,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### POST /api/idols (Admin)

Create a new idol.

**Request Body:**
```json
{
  "name": "Idol Full Name",
  "stageName": "Stage Name",
  "bio": "Brief biography of the idol",
  "profileImage": "profile_image_url",
  "birthDate": "1995-01-01T00:00:00.000Z",
  "birthPlace": "Tokyo, Japan",
  "height": 165,
  "measurements": {
    "bust": 85,
    "waist": 60,
    "hips": 88,
    "cupSize": "C"
  },
  "bloodType": "A",
  "hobbies": ["photography", "traveling"],
  "specialSkills": ["dancing", "singing"],
  "careerStart": "2020-01-01T00:00:00.000Z",
  "status": "active",
  "agency": "Talent Agency Name",
  "genres": ["507f1f77bcf86cd799439014"],
  "tags": ["newcomer"],
  "isVerified": false
}
```

### PUT /api/idols?id={id} (Admin)

Update an existing idol.

### DELETE /api/idols?ids={ids} (Admin)

Delete multiple idols.

---

## Genres API

### GET /api/genres

Retrieve paginated list of genres.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page
- `parentGenre` (string) - Filter by parent genre ("null" for root genres)
- `featured` (boolean) - Filter featured genres
- `trending` (boolean) - Filter trending genres
- `search` (string) - Text search
- `sortBy` (string, default: "sortOrder") - Sort field
- `sortOrder` (string, default: "asc") - Sort direction
- `includeStats` (boolean) - Include additional statistics

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Gravure",
      "slug": "gravure",
      "description": "Traditional Japanese gravure photography",
      "color": "#ff6b9d",
      "icon": "camera-icon",
      "coverImage": "cover_image_url",
      "parentGenre": null,
      "subGenres": [
        {
          "_id": "507f1f77bcf86cd799439015",
          "name": "Beach Gravure",
          "slug": "beach-gravure",
          "color": "#4ecdc4"
        }
      ],
      "tags": ["photography", "art"],
      "isPublic": true,
      "isAdult": false,
      "sortOrder": 1,
      "contentCounts": {
        "photos": 1500,
        "videos": 200,
        "galleries": 150,
        "idols": 50,
        "news": 25
      },
      "metadata": {
        "featured": true,
        "trending": false,
        "popularityScore": 95
      },
      "viewCount": 50000,
      "followCount": 1200,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalItems": 25,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "stats": {
    "totalGenres": 25,
    "featuredCount": 5,
    "trendingCount": 3
  }
}
```

### POST /api/genres (Admin)

Create a new genre.

**Request Body:**
```json
{
  "name": "New Genre",
  "description": "Genre description",
  "color": "#ff6b9d",
  "icon": "icon-name",
  "parentGenre": "507f1f77bcf86cd799439011",
  "tags": ["photography"],
  "isAdult": false,
  "sortOrder": 10
}
```

### PUT /api/genres?id={id} (Admin)

Update an existing genre.

### DELETE /api/genres?ids={ids} (Admin)

Delete multiple genres.

---

## News API

### GET /api/news

Retrieve paginated list of news articles.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Items per page
- `category` (string) - Filter by category
- `status` (string) - Filter by status (published/draft/archived)
- `featured` (boolean) - Filter featured articles
- `breaking` (boolean) - Filter breaking news
- `author` (string) - Filter by author name
- `idol` (ObjectId) - Filter by related idol
- `genre` (ObjectId) - Filter by related genre
- `tags` (string) - Comma-separated tags
- `search` (string) - Text search
- `sortBy` (string, default: "publishedAt") - Sort field
- `sortOrder` (string, default: "desc") - Sort direction
- `includeUnpublished` (boolean) - Include unpublished articles (Admin only)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "News Article Title",
      "slug": "news-article-title",
      "excerpt": "Brief excerpt of the article content",
      "content": "Full article content in HTML format",
      "author": {
        "name": "Author Name",
        "email": "author@example.com",
        "avatar": "avatar_url"
      },
      "featuredImage": "featured_image_url",
      "images": [
        {
          "url": "image_url",
          "caption": "Image caption",
          "altText": "Alt text"
        }
      ],
      "category": "announcements",
      "tags": ["news", "update"],
      "relatedIdols": [
        {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Idol Name",
          "stageName": "Stage Name",
          "slug": "idol-name",
          "profileImage": "profile_url"
        }
      ],
      "relatedGenres": [
        {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Genre Name",
          "slug": "genre-name",
          "color": "#ff6b9d"
        }
      ],
      "status": "published",
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "isPublic": true,
      "isFeatured": true,
      "isBreaking": false,
      "priority": 5,
      "seoMeta": {
        "metaTitle": "SEO optimized title",
        "metaDescription": "SEO description",
        "keywords": ["keyword1", "keyword2"]
      },
      "engagement": {
        "viewCount": 1500,
        "likeCount": 100,
        "shareCount": 25,
        "commentCount": 15
      },
      "readingTime": 3,
      "language": "en",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 12,
    "totalItems": 120,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### POST /api/news (Admin)

Create a new news article.

**Request Body:**
```json
{
  "title": "News Article Title",
  "excerpt": "Brief excerpt of the article",
  "content": "Full article content",
  "author": {
    "name": "Author Name",
    "email": "author@example.com"
  },
  "featuredImage": "featured_image_url",
  "category": "announcements",
  "tags": ["news", "update"],
  "relatedIdols": ["507f1f77bcf86cd799439013"],
  "relatedGenres": ["507f1f77bcf86cd799439014"],
  "status": "published",
  "isPublic": true,
  "isFeatured": false,
  "priority": 5,
  "seoMeta": {
    "metaTitle": "SEO optimized title",
    "metaDescription": "SEO description",
    "keywords": ["keyword1", "keyword2"]
  }
}
```

### PUT /api/news?id={id} (Admin)

Update an existing news article.

### DELETE /api/news?ids={ids} (Admin)

Delete multiple news articles.

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": {}  // Additional error details when available
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `422 Unprocessable Entity` - Validation errors
- `500 Internal Server Error` - Server error

---

## Database Collections

### Collection Names
- `videos` - Video content
- `photos` - Individual photos
- `galleries` - Photo gallery collections
- `idols` - Model/idol profiles
- `genres` - Content categories
- `news` - News articles
- `users` - User accounts (NextAuth)
- `sessions` - User sessions (NextAuth)
- `accounts` - OAuth accounts (NextAuth)

### Indexes

Each collection has optimized indexes for:
- Text search capabilities
- Sorting and filtering
- Foreign key relationships
- Performance optimization

---

## Rate Limiting

- API routes: 100 requests per minute per IP
- Admin routes: 20 requests per minute per IP
- Authentication routes: 5 login attempts per 15 minutes per IP

---

## Development Tools

### Database Scripts

```bash
# Initialize database with indexes and seed data
npm run init-db

# Get database statistics
npm run db:stats

# Setup admin credentials
npm run setup-admin
```

### Testing Endpoints

Use tools like Postman, curl, or your preferred API client to test endpoints:

```bash
# Get videos
curl -X GET "http://localhost:3002/api/videos?page=1&limit=5"

# Get idols with search
curl -X GET "http://localhost:3002/api/idols?search=idol&verified=true"

# Get genres
curl -X GET "http://localhost:3002/api/genres?featured=true"
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- File uploads use UploadThing service
- Images are served via CDN for optimal performance
- All text fields support Unicode characters
- Slug fields are automatically generated from titles/names
- Content counters are automatically maintained
- Soft delete is used for important resources