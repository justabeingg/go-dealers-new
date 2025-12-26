import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const CLOUDINARY_CLOUD_NAME = "desyyz9m5"
const CLOUDINARY_API_KEY = "38445937585773"
const CLOUDINARY_API_SECRET = "mL0Hoo5vNZTKFvHX9mc4gf6spD0"

serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401 }
      )
    }

    const { imageUrls } = await req.json()
    if (!imageUrls || !Array.isArray(imageUrls)) {
      return new Response(
        JSON.stringify({ error: "imageUrls array is required" }),
        { status: 400 }
      )
    }

    // Extract public IDs from Cloudinary URLs
    const deletePromises = imageUrls.map(async (url: string) => {
      try {
        // Extract public_id from URL
        // Example: https://res.cloudinary.com/desyyz9m5/image/upload/v1234567890/abcd1234.jpg
        const matches = url.match(/\/v\d+\/(.+)\.\w+$/)
        if (!matches) return { url, success: false, error: "Invalid URL format" }
        
        const publicId = matches[1]
        
        // Generate timestamp and signature
        const timestamp = Math.floor(Date.now() / 1000).toString()
        const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`
        
        // Create SHA256 signature
        const encoder = new TextEncoder()
        const data = encoder.encode(stringToSign)
        const hashBuffer = await crypto.subtle.digest("SHA-256", data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        
        // Delete from Cloudinary
        const formData = new FormData()
        formData.append("public_id", publicId)
        formData.append("api_key", CLOUDINARY_API_KEY)
        formData.append("timestamp", timestamp)
        formData.append("signature", signature)
        
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
          {
            method: "POST",
            body: formData,
          }
        )
        
        const result = await response.json()
        return { url, success: result.result === "ok", publicId, result }
      } catch (error) {
        return { url, success: false, error: error.message }
      }
    })

    const results = await Promise.all(deletePromises)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        deleted: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error("Error:", err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    )
  }
})
