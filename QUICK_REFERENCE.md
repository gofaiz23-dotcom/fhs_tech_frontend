# 🚀 Quick Reference Guide

## Import Patterns

```typescript
// ✅ Good - Import from centralized index
import { API_CONFIG, Brand, useAuth, formatDate } from '@/app/lib';

// ❌ Avoid - Deep imports
import { API_CONFIG } from '@/app/lib/config/api.config';
import { Brand } from '@/app/lib/types/common.types';
```

## Common Imports

```typescript
// Config & Constants
import { API_CONFIG, API_ENDPOINTS, HTTP_STATUS } from '@/app/lib';

// Types
import { Brand, Pagination, JobStatus } from '@/app/lib';

// Utilities
import { ApiError, formatDate, debounce } from '@/app/lib';

// Auth
import { useAuth, HttpClient } from '@/app/lib';

// Services
import { ProductsService, BrandsService, InventoryService } from '@/app/lib';
```

## API Requests

```typescript
import { HttpClient } from '@/app/lib';

// GET
const data = await HttpClient.get('/products', {}, accessToken);

// POST
const result = await HttpClient.post('/products', productData, {}, accessToken);

// PUT
const updated = await HttpClient.put('/products/123', updates, {}, accessToken);

// DELETE
await HttpClient.delete('/products/123', {}, accessToken);
```

## Error Handling

```typescript
import { ApiError, parseApiError } from '@/app/lib';

try {
  await fetchData();
} catch (error) {
  const apiError = parseApiError(error);
  
  if (apiError.isAuthError()) {
    // Handle auth errors
    router.push('/login');
  } else if (apiError.isNetworkError()) {
    // Handle network errors
    toast.error('Connection failed');
  } else {
    // Handle other errors
    toast.error(apiError.getUserMessage());
  }
}
```

## Date Formatting

```typescript
import { formatDate, formatDateTime, getRelativeTime } from '@/app/lib';

formatDate('2024-01-01'); // "Jan 1, 2024"
formatDateTime('2024-01-01T12:00:00'); // "Jan 1, 2024, 12:00 PM"
getRelativeTime('2024-01-01'); // "2 hours ago"
```

## Debouncing

```typescript
import { debounce } from '@/app/lib';

const debouncedSearch = debounce((query: string) => {
  searchProducts(query);
}, 500);
```

## Using Auth

```typescript
import { useAuth } from '@/app/lib';

function MyComponent() {
  const { state, login, logout } = useAuth();
  
  if (!state.isAuthenticated) {
    return <LoginPage />;
  }
  
  // Use state.accessToken for API calls
  // Use state.user for user info
}
```

## Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://192.168.0.22:5000/api
```

Access in code:
```typescript
import { API_CONFIG } from '@/app/lib';
const url = API_CONFIG.BASE_URL; // Uses env var if available
```

## Common Patterns

### Fetch with Error Handling
```typescript
import { HttpClient, ApiError, parseApiError } from '@/app/lib';

const [data, setData] = useState(null);
const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState(false);

async function fetchData() {
  try {
    setLoading(true);
    setError(null);
    const result = await HttpClient.get('/endpoint', {}, accessToken);
    setData(result);
  } catch (err) {
    const apiError = parseApiError(err);
    setError(apiError.getUserMessage());
  } finally {
    setLoading(false);
  }
}
```

### Debounced Search
```typescript
import { debounce } from '@/app/lib';
import { useCallback } from 'react';

const debouncedSearch = useCallback(
  debounce((query: string) => {
    performSearch(query);
  }, 500),
  []
);
```

### Type-Safe Filters
```typescript
import { FilterOptions } from '@/app/lib';

interface ProductFilters extends FilterOptions {
  category?: string;
  brandId?: number;
}

const filters: ProductFilters = {
  page: 1,
  limit: 10,
  search: 'chair',
  sortBy: 'price',
  sortOrder: 'asc',
};
```

## File Structure Reference

```
lib/
├── config/         # API_CONFIG, API_ENDPOINTS
├── types/          # Brand, Pagination, JobStatus
├── utils/          # ApiError, formatDate, debounce
├── auth/           # useAuth, HttpClient
├── products/       # ProductsService
├── brands/         # BrandsService
├── inventory/      # InventoryService
└── index.ts        # Import everything from here
```

## Troubleshooting

### "Module not found"
```typescript
// ✅ Use absolute import
import { useAuth } from '@/app/lib';

// ❌ Don't use relative
import { useAuth } from '../../lib/auth';
```

### "Type error"
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### "No access token"
```typescript
// Wait for auth before making requests
const { state } = useAuth();

useEffect(() => {
  if (!state.isLoading && state.accessToken) {
    fetchData();
  }
}, [state.isLoading, state.accessToken]);
```

---

**Keep this file handy for quick reference!**

