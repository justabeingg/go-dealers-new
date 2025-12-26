import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const CLOUDINARY_CLOUD_NAME = "desyyz9m5"
const CLOUDINARY_API_KEY = "47819317274635"
const CLOUDINARY_API_SECRET = "HX6c-f9JJpNEYjr71x3qlL5s_9c"

async function sha1(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest("SHA-1", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function deleteCloudinaryImages(imageUrls: string[]) {
  for (const url of imageUrls) {
    try {
      const matches = url.match(/\/v\d+\/(.+)\.\w+$/)
      if (!matches) continue
      
      const publicId = matches[1]
      const timestamp = Math.floor(Date.now() / 1000).toString()
      const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`
      const signature = await sha1(stringToSign)
      
      const formData = new FormData()
      formData.append("public_id", publicId)
      formData.append("api_key", CLOUDINARY_API_KEY)
      formData.append("timestamp", timestamp)
      formData.append("signature", signature)
      
      await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
        {
          method: "POST",
          body: formData,
        }
      )
    } catch (err) {
      console.error("Failed to delete image:", err)
    }
  }
}

serve(async (req) => {
  try {
    // 1. Read auth header
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401 }
      )
    }

    // 2. Read body
    const { userId } = await req.json()
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400 }
      )
    }

    // 3. Create admin Supabase client (SERVICE ROLE)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // 4. Get all posts by this user to delete images
    const { data: posts } = await supabase
      .from("posts")
      .select("media_urls")
      .eq("user_id", userId)
    
    // 5. Delete all images from Cloudinary
    if (posts && posts.length > 0) {
      for (const post of posts) {
        if (post.media_urls && post.media_urls.length > 0) {
          await deleteCloudinaryImages(post.media_urls)
        }
      }
    }

    // 6. Delete from profiles table (will cascade delete posts)
    await supabase.from("profiles").delete().eq("id", userId)

    // 7. Delete auth user
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500 }
      )
    }

    // 8. Success
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Unexpected error" }),
      { status: 500 }
    )
  }
})
