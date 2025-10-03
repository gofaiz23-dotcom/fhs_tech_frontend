# Authentication System Documentation

This document provides a comprehensive guide to the authentication system implementation based on the provided API documentation.

## 📁 File Structure

```
app/lib/auth/
├── index.ts              # Main export file for the auth module
├── types.ts              # TypeScript type definitions
├── api.ts                # API service for authentication endpoints
├── context.tsx           # React context for global auth state management
├── ProtectedRoute.tsx    # Route protection components and utilities
└── README.md            # This documentation file
```

## 🔧 Core Components

### 1. **AuthService** (`api.ts`)

The main service class that handles all authentication API calls:

```typescript
import { AuthService } from './lib/auth';

// Login user
const response = await AuthService.login({
  email: 'user@example.com',
  password: 'password123'
});

// Register new user (requires admin token except for first user)
await AuthService.register({
  email: 'newuser@example.com',
  password: 'securepassword',
  role: 'USER'
}, adminToken);

// Get user profile
const profile = await AuthService.getProfile(accessToken);

// Logout
await AuthService.logout(accessToken);

// Refresh token
await AuthService.refreshToken();
```

**Key Features:**
- Automatic token storage in localStorage
- HttpOnly refresh token handling
- Network type detection for login tracking
- Comprehensive error handling with custom `AuthApiError`
- Token validation utilities

### 2. **Authentication Context** (`context.tsx`)

React context that provides global authentication state management:

```typescript
import { useAuth, AuthProvider } from './lib/auth';

function MyApp() {
  return (
    <AuthProvider>
      <YourApp />
    </AuthProvider>
  );
}

function LoginComponent() {
  const { login, state, logout, clearError } = useAuth();
  
  // Access authentication state
  console.log(state.isAuthenticated); // boolean
  console.log(state.user);           // UserProfile | null
  console.log(state.isLoading);      // boolean
  console.log(state.error);          // string | null
}
```

**Available Hooks:**
- `useAuth()` - Full authentication context
- `useUser()` - Current user data only
- `useIsAuthenticated()` - Authentication status only

### 3. **Protected Routes** (`ProtectedRoute.tsx`)

Components and utilities for protecting routes based on authentication and permissions:

```typescript
import { ProtectedRoute, AdminRoute, withAuth, useCanAccess } from './lib/auth';

// Component wrapper
function AdminPanel() {
  return (
    <AdminRoute>
      <AdminContent />
    </AdminRoute>
  );
}

// HOC pattern
const ProtectedDashboard = withAuth(Dashboard, { 
  requiredRole: 'USER',
  requiredPermissions: [
    { type: 'brands', names: ['Nike', 'Adidas'] }
  ]
});

// Hook for conditional rendering
function NavItem() {
  const canAccessAdmin = useCanAccess('ADMIN');
  
  return (
    <>
      {canAccessAdmin && <AdminNavItem />}
    </>
  );
}
```

## 🔐 Authentication Flow

### 1. **Initial App Load**

```typescript
// AuthProvider automatically:
1. Checks for stored access token
2. Validates token expiration
3. Refreshes token if needed
4. Loads user profile
5. Sets authentication state
```

### 2. **Login Process**

```typescript
const { login } = useAuth();

try {
  await login(email, password);
  // User is now authenticated
  // Auto-redirect handled by login page
} catch (error) {
  // Handle login error
  console.error(error.message);
}
```

### 3. **Automatic Token Refresh**

```typescript
// The system automatically:
1. Monitors token expiration (2-minute buffer)
2. Refreshes tokens before they expire
3. Updates stored tokens seamlessly
4. Handles refresh failures gracefully
```

### 4. **Logout Process**

```typescript
const { logout } = useAuth();

await logout();
// - Calls logout API endpoint
// - Clears stored tokens
// - Resets authentication state
// - Redirects to login
```

## 🎯 Usage Examples

### Basic Login Page Integration

```typescript
"use client";
import React from 'react';
import { useAuth } from './lib/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { login, state } = useAuth();
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  // Redirect if already authenticated
  React.useEffect(() => {
    if (state.isAuthenticated) {
      router.push('/dashboard');
    }
  }, [state.isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (error) {
      // Error handled by context
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {state.error && <div className="error">{state.error}</div>}
      
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={state.isLoading}
      />
      
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={state.isLoading}
      />
      
      <button type="submit" disabled={state.isLoading}>
        {state.isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### Protected Dashboard

```typescript
import { ProtectedRoute } from './lib/auth';

function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

// Or with specific requirements
function AdminDashboard() {
  return (
    <ProtectedRoute 
      requiredRole="ADMIN"
      redirectTo="/unauthorized"
    >
      <AdminContent />
    </ProtectedRoute>
  );
}
```

### Making Authenticated API Calls

```typescript
import { AuthService } from './lib/auth';

async function fetchUserData() {
  try {
    const response = await AuthService.authenticatedRequest(
      '/api/user/data',
      { method: 'GET' }
    );
    return response;
  } catch (error) {
    if (error.statusCode === 401) {
      // Token expired, user will be redirected to login
    }
    throw error;
  }
}
```

### Permission-Based Access Control

```typescript
import { useAuth } from './lib/auth';

function FeatureComponent() {
  const { hasPermission, isAdmin } = useAuth();

  const canAccessBrand = hasPermission('brands', 'Nike');
  const canAccessAmazon = hasPermission('marketplaces', 'Amazon');
  const isUserAdmin = isAdmin();

  return (
    <div>
      {canAccessBrand && <BrandContent />}
      {canAccessAmazon && <MarketplaceContent />}
      {isUserAdmin && <AdminControls />}
    </div>
  );
}
```

## 🛡️ Security Features

### 1. **Token Management**
- Access tokens stored in localStorage (15-minute lifetime)
- Refresh tokens in HttpOnly cookies (7-day lifetime)
- Automatic token refresh with 2-minute buffer
- Secure token validation and parsing

### 2. **Error Handling**
- Custom `AuthApiError` class with detailed error information
- Automatic cleanup on authentication failures
- Network error detection and handling
- Graceful degradation for offline scenarios

### 3. **Route Protection**
- Role-based access control (ADMIN/USER)
- Permission-based access control (brands/marketplaces/shipping)
- Automatic redirects for unauthorized access
- Loading states during authentication checks

### 4. **API Integration**
- CORS support with credentials
- Automatic authorization headers
- Network type detection for login tracking
- Consistent error response handling

## 🔄 State Management

The authentication state is managed using React's `useReducer` hook with the following structure:

```typescript
interface AuthState {
  user: UserProfile | null;        // Current user data
  accessToken: string | null;      // Current access token
  isAuthenticated: boolean;        // Authentication status
  isLoading: boolean;              // Loading state
  error: string | null;            // Error message
}
```

**State Transitions:**
- `AUTH_START` - Begin authentication process
- `AUTH_SUCCESS` - Authentication successful
- `AUTH_ERROR` - Authentication failed
- `AUTH_LOGOUT` - User logged out
- `CLEAR_ERROR` - Clear error state
- `UPDATE_TOKEN` - Update access token

## 📝 TypeScript Support

The system provides comprehensive TypeScript support with:

- Strict type definitions for all API requests/responses
- Interface definitions for user data and permissions
- Type-safe authentication context
- Generic types for API responses
- Enum types for user roles and network types

## 🚀 Getting Started

1. **Wrap your app with AuthProvider:**
```typescript
// app/layout.tsx
import { AuthProvider } from './lib/auth';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

2. **Use authentication in your components:**
```typescript
import { useAuth } from './lib/auth';

function MyComponent() {
  const { state, login, logout } = useAuth();
  // Your component logic
}
```

3. **Protect your routes:**
```typescript
import { ProtectedRoute } from './lib/auth';

function ProtectedPage() {
  return (
    <ProtectedRoute>
      <YourPageContent />
    </ProtectedRoute>
  );
}
```

## 🐛 Error Handling

The system provides comprehensive error handling:

```typescript
try {
  await AuthService.login({ email, password });
} catch (error) {
  if (error instanceof AuthApiError) {
    switch (error.statusCode) {
      case 401:
        console.log('Invalid credentials');
        break;
      case 403:
        console.log('Access denied');
        break;
      case 500:
        console.log('Server error');
        break;
      default:
        console.log('Unknown error:', error.message);
    }
  }
}
```

## 🔧 Configuration

The authentication system can be configured by modifying the constants in `api.ts`:

```typescript
// API Configuration
const API_BASE_URL = 'http://192.168.0.23:5000/api';

// Token Settings
const TOKEN_REFRESH_BUFFER = 120; // 2 minutes in seconds
```

This authentication system provides a robust, secure, and user-friendly foundation for managing user authentication in your Next.js application with full TypeScript support and comprehensive error handling.
