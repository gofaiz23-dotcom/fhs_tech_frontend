import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing image URL' }, { status: 400 })
    }
    
    // Fetch the image from the backend
    const response = await fetch(imageUrl, {
      headers: {
        'Accept': 'image/*',
      },
    })
    
    if (!response.ok) {
      console.error(`Failed to fetch image: ${imageUrl} - Status: ${response.status}`)
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: response.status })
    }
    
    // Get the image data
    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    
    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Image proxy error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

