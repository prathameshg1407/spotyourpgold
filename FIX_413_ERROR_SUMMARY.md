# Fix for 413 Payload Too Large Error in PG Listing Form

## Problem

The owner dashboard PG listing form was throwing a 413 error (Payload Too Large) when submitting forms with multiple images and videos. This happened because:

1. Images and videos were being converted to base64 and sent in a single request
2. Base64 encoding increases file size by ~33%
3. Multiple large files exceeded the default Next.js request size limit
4. No compression was applied to reduce file sizes

## Solution Implemented

### 1. Updated Next.js Configuration (`next.config.js`)

- Added API body parser configuration with 50MB limit
- This allows the server to handle larger payloads

### 2. Created Image Compression Utility (`lib/imageCompression.ts`)

- **Image compression**: Reduces image dimensions to max 1920x1080 and compresses to ~1MB
- **Video validation**: Basic validation for video files (up to 25MB after processing)
- **File size validation**: Helper functions to check file sizes
- **Quality control**: Maintains good image quality while reducing file size

### 3. Enhanced Image Upload Hook (`useImageUpload.ts`)

- **Async processing**: Now handles compression asynchronously
- **Size validation**: Validates files before and after compression
- **Better error handling**: Provides specific error messages for different failure scenarios
- **Progressive compression**: If initial compression isn't enough, reduces quality further

### 4. Enhanced Video Upload Hook (`useVideoUpload.ts`)

- **Size limits**: Increased initial limit to 100MB, compressed to 20MB
- **Validation**: Better file type and size validation
- **Error handling**: Improved error messages and handling

### 5. Improved Form Submission (`AddNewPG.tsx`)

- **Payload size validation**: Checks total payload size before sending
- **Size estimation**: Calculates and logs payload size for debugging
- **Better error handling**: Specific error messages for 413 errors
- **Timeout configuration**: Increased timeout to 2 minutes for large uploads
- **Size limits**: 45MB total payload limit with buffer

### 6. Enhanced API Route (`app/api/owner/listPg/route.ts`)

- **JSON parsing error handling**: Better error handling for malformed requests
- **Payload size validation**: Server-side validation of request size
- **Improved error responses**: Specific error messages for different error types
- **Status code handling**: Proper HTTP status codes (413 for too large, 400 for bad request)

### 7. Updated UI Components (`Step5Images.tsx`)

- **User feedback**: Updated text to inform users about compression
- **Clear limits**: Shows actual file size limits and compression info

## Key Features

### Image Compression

- **Max dimensions**: 1920x1080 pixels
- **Target size**: ~1MB per image after compression
- **Quality**: 0.8 (80% quality) with fallback to lower quality if needed
- **Format**: Converts to JPEG for better compression

### Video Handling

- **Initial limit**: 100MB per video
- **Compressed limit**: 20MB per video
- **Format validation**: Only video files allowed

### Payload Management

- **Total limit**: 45MB for entire form submission
- **Individual limits**: 2MB per image, 25MB per video
- **Validation**: Both client and server-side validation

### Error Handling

- **Specific messages**: Clear error messages for different scenarios
- **User guidance**: Tells users exactly what to do to fix issues
- **Debugging**: Console logs for development debugging

## Benefits

1. **Eliminates 413 errors**: Proper size limits and compression prevent payload too large errors
2. **Better user experience**: Clear feedback and error messages
3. **Faster uploads**: Compressed files upload faster
4. **Reduced server load**: Smaller payloads reduce server processing time
5. **Maintains quality**: Images still look good after compression
6. **Robust error handling**: Graceful handling of various error scenarios

## Usage

The form now automatically:

1. Compresses images when uploaded
2. Validates file sizes before submission
3. Shows clear error messages if limits are exceeded
4. Provides feedback about compression process
5. Handles large payloads efficiently

Users can now upload up to 12 images (up to 10MB each, compressed to ~1MB) and 3 videos (up to 100MB each, compressed to ~20MB) without encountering 413 errors.
