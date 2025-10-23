# Library (lib) Folder Organization

This document explains the structure and usage of the organized `lib` folder.

## 📁 Folder Structure

```
lib/
├── config/              # Configuration files
│   ├── api.config.ts    # API base URL, endpoints, constants
│   └── index.ts         # Config module exports
│
├── types/               # Shared TypeScript types
│   ├── common.types.ts  # Common interfaces (Brand, Pagination, etc.)
│   └── index.ts         # Types module exports
│
├── utils/               # Utility functions
│   ├── api.utils.ts     # API utilities, error handling, formatters
│   ├── passwordValidation.ts
│   └── index.ts         # Utils module exports
│
├── auth/                # Authentication module
│   ├── api.ts           # Auth API service
│   ├── context.tsx      # Auth context provider
│   ├── httpClient.ts    # HTTP client with auth
│   ├── types.ts         # Auth-specific types
│   ├── ProtectedRoute.tsx
│   └── index.ts
│
├── admin/               # Admin API module
├── brands/              # Brands API module
├── marketplaces/        # Marketplaces API module
├── shipping/            # Shipping API module
├── products/            # Products API module
├── inventory/           # Inventory API module
├── status/              # Status/Jobs API module
├── settings/            # Settings API module
├── access-control/      # Access control utilities
├── stores/              # Zustand state stores
│
├── activity-logger.ts   # Activity logging utility
├── log-retention.ts     # Log retention utility
├── utils.ts             # General utilities (cn)
└── index.ts             # Main library exports
```

## 🚀 Key Features

### 1. Centralized Configuration (`config/api.config.ts`)

All API-related configuration is centralized in one place:

```typescript
import { API_CONFIG, API_ENDPOINTS } from '@/app/lib/config';

// Base URL (uses environment variable if available)
const url = API_CONFIG.BASE_URL;

// Predefined endpoints
const loginEndpoint = API_ENDPOINTS.AUTH.LOGIN;
const userEndpoint = API_ENDPOINTS.ADMIN.USER_BY_ID(123);
```

**Benefits:**
- Single source of truth for API configuration
- Easy to change base URL for different environments
- Type-safe endpoint paths
- Consistent error codes and HTTP status codes

### 2. Shared Types (`types/common.types.ts`)

Common interfaces are defined once and reused across modules:

```typescript
import { Brand, Pagination, JobStatus } from '@/app/lib/types';

// No need to redefine these interfaces in every file
```

**Available Types:**
- `Brand` - Brand entity
- `Pagination` - Pagination metadata
- `JobStatus` - Background job status
- `SystemStats` - System statistics
- `ApiResponse<T>` - Generic API response
- `PaginatedResponse<T>` - Paginated response
- `BulkOperationResult<T>` - Bulk operation results
- And more...

### 3. Reusable Utilities (`utils/api.utils.ts`)

Common utility functions for API operations:

```typescript
import { 
  ApiError, 
  formatDate, 
  getRelativeTime,
  buildQueryString,
  retry 
} from '@/app/lib/utils';

// Custom API error with structured info
throw new ApiError('Not found', 404, 'NOT_FOUND');

// Format dates
const formatted = formatDate('2024-01-01');
const relative = getRelativeTime('2024-01-01');

// Build query strings
const query = buildQueryString({ page: 1, limit: 10 });

// Retry failed requests
await retry(() => fetchData(), { attempts: 3 });
```

**Available Utilities:**
- `ApiError` - Custom error class
- `formatDate/DateTime` - Date formatting
- `getRelativeTime` - Relative time strings
- `buildQueryString` - URL query builder
- `formatFileSize` - File size formatter
- `debounce/throttle` - Function rate limiting
- `retry` - Retry with exponential backoff
- `isValidEmail` - Email validation
- And more...

### 4. Centralized Imports (`index.ts`)

Import everything from a single entry point:

```typescript
// Before (scattered imports)
import { useAuth } from './lib/auth';
import { API_CONFIG } from './lib/config/api.config';
import { Brand } from './lib/types/common.types';

// After (organized imports)
import { useAuth, API_CONFIG, Brand } from '@/app/lib';
```

## 📖 Usage Examples

### Example 1: Using Centralized Config

```typescript
import { API_CONFIG, API_ENDPOINTS } from '@/app/lib';

// Get base URL
const baseUrl = API_CONFIG.BASE_URL;

// Use predefined endpoints
const response = await fetch(`${baseUrl}${API_ENDPOINTS.PRODUCTS.LIST}`);
```

### Example 2: Using Shared Types

```typescript
import { Brand, Pagination, ProductsService } from '@/app/lib';

function ProductsList() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  // Types are consistent across the app
}
```

### Example 3: Using API Utilities

```typescript
import { ApiError, formatDate, getRelativeTime } from '@/app/lib';

try {
  const data = await fetchSomething();
} catch (error) {
  const apiError = parseApiError(error);
  
  if (apiError.isAuthError()) {
    // Handle auth error
  } else if (apiError.isNetworkError()) {
    // Handle network error
  }
  
  console.error(apiError.getUserMessage());
}

// Format dates
const formattedDate = formatDate(product.createdAt);
const relativeTime = getRelativeTime(product.createdAt);
```

### Example 4: Using HttpClient

```typescript
import { HttpClient } from '@/app/lib';

// HttpClient automatically uses centralized config
const data = await HttpClient.get('/products', {}, accessToken);
```

## 🔧 Migration Guide

If you have existing code using hardcoded URLs or duplicate types:

### Before:
```typescript
// Hardcoded URL
const response = await fetch('http://localhost:5000/api/products');

// Duplicate interface
interface Brand {
  id: number;
  name: string;
}
```

### After:
```typescript
import { API_CONFIG, Brand, HttpClient } from '@/app/lib';

// Use centralized config
const response = await HttpClient.get('/products');

// Use shared type
// No need to redefine Brand interface
```

## 📝 Environment Variables

Create a `.env.local` file to override the default API URL:

```env
NEXT_PUBLIC_API_URL=http://your-api-url.com/api
```

The config will automatically use this environment variable if available.

## 🎯 Best Practices

1. **Always use centralized config** - Don't hardcode API URLs
2. **Use shared types** - Avoid duplicating interfaces
3. **Import from index files** - Use `@/app/lib` instead of deep imports
4. **Use ApiError** - For consistent error handling
5. **Use utility functions** - Don't reinvent common functionality

## 📚 Additional Resources

- **API Config**: See `config/api.config.ts` for all available endpoints and constants
- **Common Types**: See `types/common.types.ts` for all shared interfaces
- **Utilities**: See `utils/api.utils.ts` for all helper functions
- **HTTP Client**: See `auth/httpClient.ts` for request handling

## 🔄 Rate Limiting

The backend has rate limiting enabled. If you encounter "Too many requests" errors in development:

1. Check your request frequency
2. Implement debouncing for user-triggered requests
3. Use the built-in `debounce` utility:

```typescript
import { debounce } from '@/app/lib';

const debouncedSearch = debounce((query: string) => {
  searchProducts(query);
}, 500);
```

## 🐛 Troubleshooting

### "No access token available" error
- Make sure `useAuth` is called within `AuthProvider`
- Wait for auth initialization before making API calls
- Check that the component is using the correct auth state

### "Network error" or CORS issues
- Verify API_BASE_URL is correct
- Check backend CORS configuration
- Ensure backend server is running

### Type errors after migration
- Run `npm run build` to check for type issues
- Ensure all imports are updated to use shared types
- Check that the types are exported correctly

---

**Last Updated:** October 21, 2025
**Version:** 1.0.0

