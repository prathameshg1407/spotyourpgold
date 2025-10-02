# Location-Based Search Implementation

## Overview

I've implemented a comprehensive location-based search system with nearby listings functionality, similar to Airbnb's search experience. The system allows users to search for properties by location and filter by category.

## Key Features Implemented

### 1. Enhanced Search Dropdown (`EnhancedSearchDropdown.tsx`)

- **Location Detection**: Automatically detects when user types a location and geocodes it
- **Nearby Search**: Shows "Show nearby properties" option when user location is available
- **Smart Suggestions**: Provides both property and location suggestions
- **Real-time Search**: Debounced search with instant results
- **Keyboard Navigation**: Full keyboard support for accessibility

### 2. Location Search Hook (`useLocationSearch.ts`)

- **Geocoding**: Converts location names to coordinates using Nominatim API
- **User Location**: Gets user's current location with permission handling
- **Search Functions**:
  - `searchNearby()` - Search properties near a location
  - `searchInLocation()` - Search properties in a specific city/area
  - `searchWithQuery()` - Search with text query and optional location

### 3. Category Filter Component (`LocationCategoryFilter.tsx`)

- **Dynamic Categories**: Shows available property types with counts
- **Multi-select**: Users can select multiple categories
- **Real-time Counts**: Shows number of properties in each category
- **Clear All**: Easy way to clear all selected categories
- **Responsive Design**: Works on both desktop and mobile

### 4. Enhanced All Listings Page

- **Location-based Search**: Supports searching by coordinates
- **Category Filtering**: Filter results by property type
- **Nearby Search**: Special mode for nearby properties
- **Category Counts**: Shows how many properties are in each category
- **Pagination**: Proper pagination for all search modes

### 5. Updated Search API (`/api/listing/search`)

- **Category Filtering**: Added support for filtering by property categories
- **Category Counts**: Returns count of properties in each category
- **Location-based Search**: Enhanced geo-search with radius support
- **Performance Optimized**: Efficient aggregation pipelines

## How It Works

### Search Flow:

1. **User types in search bar** → Enhanced search dropdown shows suggestions
2. **Location detected** → Shows "Search in [Location]" option
3. **User selects location** → Redirects to all-listings with location params
4. **Category filter appears** → Shows available categories with counts
5. **User selects categories** → Results update dynamically
6. **Pagination works** → Maintains filters across pages

### Location Detection:

- Uses Nominatim API for geocoding
- Detects location keywords in search query
- Provides reverse geocoding for user location
- Handles location permission gracefully

### Category Filtering:

- Fetches category counts from API
- Updates results when categories change
- Maintains state across page navigation
- Shows counts for each category

## API Endpoints

### Search API (`/api/listing/search`)

```
GET /api/listing/search?lat=23.0225&lng=72.5714&radius=10&countByCategory=true&categories=pgs,hostels
```

**Parameters:**

- `lat`, `lng`: Location coordinates
- `radius`: Search radius in km (default: 10)
- `categories`: Comma-separated list of property types
- `countByCategory`: Return category counts
- `q`: Text search query
- `page`, `per_page`: Pagination

**Response:**

```json
{
  "success": true,
  "data": [...],
  "total": 150,
  "categoryCounts": {
    "pgs": 45,
    "hostels": 30,
    "rooms": 25,
    "flats": 35,
    "commercial": 15
  }
}
```

## Usage Examples

### 1. Search for PGs in Indore

```
User types: "Indore"
→ Shows "Search in Indore, Madhya Pradesh, India"
→ User clicks → Redirects to /routes/all-listings?lat=22.7196&lng=75.8577
→ Shows category filter with counts
→ User selects "PGs" → Results filtered to show only PGs
```

### 2. Find nearby properties

```
User clicks "Show nearby properties"
→ Redirects to /routes/all-listings?nearby=true&lat=23.0225&lng=72.5714
→ Shows all nearby properties sorted by distance
→ User can filter by category
```

### 3. Search with text and location

```
User types: "furnished PGs in Mumbai"
→ Detects "Mumbai" as location
→ Shows "Search in Mumbai, Maharashtra, India"
→ User clicks → Redirects with both query and location
→ Results show furnished PGs in Mumbai
```

## Benefits

1. **Airbnb-like Experience**: Familiar search pattern for users
2. **Location-aware**: Always shows relevant nearby options
3. **Category Filtering**: Easy way to narrow down results
4. **Real-time Counts**: Users know how many properties are available
5. **Mobile-friendly**: Works great on all devices
6. **Performance Optimized**: Fast search with proper indexing
7. **Accessible**: Full keyboard navigation support

## Technical Implementation

### Frontend:

- React hooks for state management
- Debounced search for performance
- Geocoding integration
- Responsive design
- Error handling

### Backend:

- MongoDB aggregation pipelines
- Geo-spatial queries
- Category counting
- Efficient pagination
- Caching strategies

### APIs:

- Nominatim for geocoding
- Custom search API
- Category count API
- Location-based filtering

## Testing

To test the implementation:

1. **Start the dev server**: `npm run dev`
2. **Open browser**: Go to `http://localhost:3000`
3. **Test search bar**: Type a city name like "Indore"
4. **Test nearby search**: Click "Show nearby properties"
5. **Test category filtering**: Select different property types
6. **Test pagination**: Navigate through pages
7. **Test mobile**: Check responsive design

## Future Enhancements

1. **Map Integration**: Show properties on a map
2. **Advanced Filters**: Price range, amenities, etc.
3. **Saved Searches**: Save frequently used searches
4. **Recommendations**: Suggest similar properties
5. **Analytics**: Track search patterns
6. **Caching**: Improve performance with Redis
7. **Search History**: Remember recent searches
