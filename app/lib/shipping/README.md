# Shipping Companies Module

Complete CRUD operations for shipping company management with support for single company, multiple companies, and bulk file upload (CSV/Excel).

## Features

- ✅ **Complete CRUD Operations**: Create, Read, Update, Delete shipping companies
- ✅ **Admin-Only Operations**: Create, edit, and delete restricted to admin users
- ✅ **Bulk Upload**: Support for CSV, XLS, and XLSX file uploads
- ✅ **File Validation**: Size limits, type checking, and error handling
- ✅ **Progress Tracking**: Real-time upload progress with percentage
- ✅ **Template Download**: CSV template generation for bulk uploads
- ✅ **Search & Filter**: Real-time search through shipping companies
- ✅ **Error Handling**: Comprehensive error messages and validation
- ✅ **TypeScript Support**: Full type safety and IntelliSense

## API Endpoints

### Base URL
```
https://fhs-tech-backend.onrender.com/api
```

### Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/shipping` | Get all shipping companies | Yes |
| GET | `/shipping/:id` | Get specific shipping company | Yes |
| POST | `/shipping` | Create shipping company(s) | Admin |
| PUT | `/shipping/:id` | Update shipping company | Admin |
| DELETE | `/shipping/:id` | Delete shipping company | Admin |

## Usage Examples

### Basic Operations

```typescript
import { ShippingService } from '@/lib/shipping';

// Get all shipping companies
const companies = await ShippingService.getShippingCompanies(accessToken);

// Create a single company
const newCompany = await ShippingService.createShippingCompany({
  name: 'FedEx',
  description: 'International courier delivery services'
}, accessToken);

// Update a company
const updated = await ShippingService.updateShippingCompany(1, {
  name: 'FedEx Updated',
  description: 'Updated description'
}, accessToken);

// Delete a company
await ShippingService.deleteShippingCompany(1, accessToken);
```

### Bulk Operations

```typescript
// Create multiple companies
const multipleCompanies = await ShippingService.createMultipleShippingCompanies({
  shippingCompanies: [
    { name: 'FedEx', description: 'International courier' },
    { name: 'DHL', description: 'German logistics' },
    { name: 'UPS', description: 'American shipping' }
  ]
}, accessToken);

// Upload from file
const result = await ShippingService.uploadShippingCompaniesFile(
  file,
  accessToken,
  (progress) => console.log(`Upload: ${progress.percentage}%`)
);
```

### File Upload

```typescript
// Download CSV template
ShippingService.downloadCSVTemplate();

// Validate file before upload
const file = event.target.files[0];
const isValid = ShippingService.validateFile(file);

// Format file size
const size = ShippingService.formatFileSize(1024000); // "1000 KB"
```

## File Upload Specifications

### Supported File Types
- **CSV**: `.csv` (text/csv)
- **Excel**: `.xlsx`, `.xls` (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

### File Size Limit
- **Maximum**: 10MB per file

### Required Columns
| Column | Required | Description |
|--------|----------|-------------|
| name | Yes | Shipping company name (unique) |
| description | No | Company description |

### CSV Template Format
```csv
name,description
FedEx,International courier delivery services
DHL,German logistics company
UPS,American multinational shipping company
```

## Type Definitions

### Core Types

```typescript
interface ShippingCompany {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateShippingCompanyRequest {
  name: string;
  description: string;
}

interface BulkUploadResponse {
  message: string;
  summary: {
    total: number;
    created: number;
    duplicates: number;
    errors: number;
  };
  results: {
    created: ShippingCompany[];
    duplicates: Array<{ name: string; error: string }>;
    errors: Array<{ row: number; error: string }>;
  };
}
```

## Error Handling

### Common Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Invalid request format | Missing required fields |
| 400 | File validation failed | File format or content errors |
| 401 | Access token required | Missing authorization |
| 403 | Admin access required | User is not admin |
| 404 | Shipping company not found | Company ID doesn't exist |
| 500 | Server error | Internal server error |

### Error Handling Example

```typescript
try {
  const companies = await ShippingService.getShippingCompanies(accessToken);
  setShippingCompanies(companies.shippingCompanies);
} catch (error) {
  if (error instanceof Error) {
    setError(error.message);
  } else {
    setError('Failed to load shipping companies');
  }
}
```

## Popular Shipping Companies

The module includes a list of popular shipping companies for reference:

```typescript
import { POPULAR_SHIPPING_COMPANIES } from '@/lib/shipping';

// Use popular companies as suggestions
const suggestions = POPULAR_SHIPPING_COMPANIES.map(company => ({
  name: company.name,
  description: company.description
}));
```

## Admin Permissions

### Admin-Only Operations
- Create new shipping companies
- Update existing shipping companies
- Delete shipping companies
- Bulk upload from files
- Access to all shipping companies

### Regular User Operations
- View shipping companies (filtered by permissions)
- Search and filter companies
- View company details

## Integration with Auth System

The shipping module integrates with the existing auth system:

```typescript
import { useAuth } from '@/lib/auth/context';

function ShippingPage() {
  const { state: { accessToken }, isAdmin } = useAuth();
  
  // Check if user is admin before allowing operations
  const canEdit = isAdmin();
  
  // Use access token for API calls
  const companies = await ShippingService.getShippingCompanies(accessToken);
}
```

## File Upload Progress

```typescript
const handleFileUpload = async (file: File) => {
  try {
    const result = await ShippingService.uploadShippingCompaniesFile(
      file,
      accessToken,
      (progress) => {
        console.log(`Upload progress: ${progress.percentage}%`);
        setUploadProgress(progress);
      }
    );
    
    console.log('Upload complete:', result.summary);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

## Best Practices

1. **Always check admin permissions** before allowing create/edit/delete operations
2. **Validate files** before upload to provide better user experience
3. **Handle errors gracefully** with user-friendly messages
4. **Use progress indicators** for long-running operations
5. **Provide templates** for bulk uploads to ensure correct format
6. **Implement search and filtering** for better user experience

## Testing

The module includes comprehensive error handling and validation:

- File type validation
- File size limits
- Required field validation
- Network error handling
- Progress tracking
- Duplicate detection

## Dependencies

- React (for UI components)
- Lucide React (for icons)
- Zustand (for state management)
- TypeScript (for type safety)

## File Structure

```
app/lib/shipping/
├── api.ts          # API service functions
├── types.ts         # TypeScript type definitions
├── index.ts         # Module exports
└── README.md        # This documentation
```
