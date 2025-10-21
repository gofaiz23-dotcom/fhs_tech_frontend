"use client"

/**
 * Toast Demo Component
 * 
 * A simple demo component to test toast notifications.
 * You can import this into any page to test the toast functionality.
 */

import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { useToast } from "@/app/lib/hooks/use-toast"

export default function ToastDemo() {
  const { toast } = useToast()

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Toast Notifications Demo</CardTitle>
        <CardDescription>
          Click the buttons below to see different toast variants
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Success Toast */}
        <div className="flex items-center gap-4">
          <Button
            variant="default"
            className="bg-green-500 hover:bg-green-600"
            onClick={() => {
              toast({
                variant: "success",
                title: "Success!",
                description: "Your operation completed successfully.",
              })
            }}
          >
            Show Success Toast
          </Button>
          <span className="text-sm text-muted-foreground">
            Green background, success message
          </span>
        </div>

        {/* Error Toast */}
        <div className="flex items-center gap-4">
          <Button
            variant="destructive"
            onClick={() => {
              toast({
                variant: "destructive",
                title: "Error!",
                description: "Something went wrong. Please try again.",
              })
            }}
          >
            Show Error Toast
          </Button>
          <span className="text-sm text-muted-foreground">
            Red background, error message
          </span>
        </div>

        {/* Default/Info Toast */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => {
              toast({
                title: "Information",
                description: "This is a default informational toast.",
              })
            }}
          >
            Show Info Toast
          </Button>
          <span className="text-sm text-muted-foreground">
            Default background, info message
          </span>
        </div>

        {/* Custom Duration */}
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            onClick={() => {
              toast({
                title: "Quick Message",
                description: "This toast will disappear in 2 seconds.",
                duration: 2000,
              })
            }}
          >
            Show Quick Toast (2s)
          </Button>
          <span className="text-sm text-muted-foreground">
            Disappears after 2 seconds
          </span>
        </div>

        {/* Long Duration */}
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            onClick={() => {
              toast({
                title: "Long Message",
                description: "This toast will stay for 10 seconds.",
                duration: 10000,
              })
            }}
          >
            Show Long Toast (10s)
          </Button>
          <span className="text-sm text-muted-foreground">
            Stays for 10 seconds
          </span>
        </div>

        {/* Simulated API Call */}
        <div className="flex items-center gap-4">
          <Button
            onClick={async () => {
              // Show loading toast
              const loadingToast = toast({
                title: "Loading...",
                description: "Processing your request...",
              })

              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 2000))

              // Dismiss loading toast
              loadingToast.dismiss()

              // Show success
              toast({
                variant: "success",
                title: "Complete!",
                description: "Your request was processed successfully.",
              })
            }}
          >
            Simulate API Call
          </Button>
          <span className="text-sm text-muted-foreground">
            Shows loading, then success
          </span>
        </div>

        {/* Multiple Toasts */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => {
              toast({
                variant: "success",
                title: "First Toast",
                description: "This is the first toast.",
              })
              
              setTimeout(() => {
                toast({
                  title: "Second Toast",
                  description: "This is the second toast.",
                })
              }, 500)
              
              setTimeout(() => {
                toast({
                  variant: "destructive",
                  title: "Third Toast",
                  description: "This is the third toast.",
                })
              }, 1000)
            }}
          >
            Show Multiple Toasts
          </Button>
          <span className="text-sm text-muted-foreground">
            Shows 3 toasts in sequence
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

