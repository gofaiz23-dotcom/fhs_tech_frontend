# Toast Notifications Usage Guide

This project uses shadcn/ui toast notifications for user feedback.

## Installation

The toast system is already installed and configured in the app. The `<Toaster />` component is added to the root layout.

## Usage

### Basic Usage

```tsx
import { useToast } from "@/app/lib/hooks/use-toast"

function MyComponent() {
  const { toast } = useToast()

  return (
    <button
      onClick={() => {
        toast({
          title: "Success!",
          description: "Your action completed successfully.",
        })
      }}
    >
      Show Toast
    </button>
  )
}
```

### Toast Variants

#### Default Toast
```tsx
toast({
  title: "Info",
  description: "This is a default toast notification.",
})
```

#### Success Toast
```tsx
toast({
  variant: "success",
  title: "Success!",
  description: "Your operation completed successfully.",
})
```

#### Error/Destructive Toast
```tsx
toast({
  variant: "destructive",
  title: "Error",
  description: "Something went wrong. Please try again.",
})
```

### Advanced Usage

#### With Duration
```tsx
toast({
  title: "Scheduled: Catch up",
  description: "Friday, February 10, 2023 at 5:57 PM",
  duration: 3000, // 3 seconds
})
```

#### With Action Button
```tsx
toast({
  title: "Uh oh! Something went wrong.",
  description: "There was a problem with your request.",
  action: (
    <ToastAction altText="Try again" onClick={() => retry()}>
      Try again
    </ToastAction>
  ),
})
```

#### Dismissing Toasts
```tsx
const { toast, dismiss } = useToast()

// Show a toast and get its ID
const { id } = toast({
  title: "Loading...",
  description: "Please wait while we process your request.",
})

// Later, dismiss it
dismiss(id)

// Or dismiss all toasts
dismiss()
```

## Common Use Cases

### API Success Response
```tsx
try {
  await someApiCall()
  toast({
    variant: "success",
    title: "Success",
    description: "Data saved successfully.",
  })
} catch (error) {
  toast({
    variant: "destructive",
    title: "Error",
    description: error.message || "Failed to save data.",
  })
}
```

### Form Validation
```tsx
const handleSubmit = () => {
  if (!formData.email) {
    toast({
      variant: "destructive",
      title: "Validation Error",
      description: "Email is required.",
    })
    return
  }
  // Continue with submission
}
```

### Background Job Status
```tsx
// Start job
const { id: toastId } = toast({
  title: "Processing...",
  description: "Your file is being uploaded.",
})

// Update on completion
dismiss(toastId)
toast({
  variant: "success",
  title: "Complete",
  description: "File uploaded successfully.",
})
```

## Configuration

- **Max toasts**: 5 (defined in `TOAST_LIMIT`)
- **Auto-dismiss delay**: 5 seconds (defined in `TOAST_REMOVE_DELAY`)
- **Position**: Bottom-right on desktop, top-full on mobile

## Styling

Toasts automatically adapt to your app's theme (light/dark mode) through Tailwind CSS classes.

To customize styles, edit:
- `app/components/ui/toast.tsx` for toast component styles
- `toastVariants` for variant-specific styles

## Best Practices

1. **Use appropriate variants**: Use `success` for confirmations, `destructive` for errors, `default` for info
2. **Keep messages concise**: Titles should be short, descriptions can be longer but readable
3. **Don't overuse**: Only show toasts for important user feedback
4. **Provide context**: Include what happened and what the user should do (if needed)
5. **Use actions sparingly**: Only when there's a clear action the user might want to take

