import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // Get all unsent notifications
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("sent", false)

    if (error) {
      throw error
    }

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ message: "No notifications to send" }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

    // Send each notification
    let sentCount = 0
    for (const notification of notifications) {
      try {
        // Send to Expo Push Notification service
        const response = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(notification.push_payload),
        })

        const result = await response.json()
        console.log("Notification sent:", result)

        // Mark as sent
        await supabase
          .from("notifications")
          .update({ sent: true })
          .eq("id", notification.id)

        sentCount++
      } catch (err) {
        console.error("Failed to send notification:", err)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount,
        total: notifications.length 
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error("Error:", err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
