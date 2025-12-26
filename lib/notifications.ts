import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { supabase } from './supabase'

// Configure how notifications are displayed
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

/**
 * Register for push notifications and save token to database
 */
export async function registerForPushNotificationsAsync() {
  let token

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C8CFF',
    })
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!')
      return
    }

    try {
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })
      ).data
      console.log('📱 Push Token:', token)
    } catch (error) {
      console.error('Error getting push token:', error)
    }
  } else {
    console.log('Must use physical device for Push Notifications')
  }

  // Save token to Supabase
  if (token) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const deviceId = Constants.deviceId || 'unknown'
      
      await supabase
        .from('push_tokens')
        .upsert({
          user_id: user.id,
          push_token: token,
          device_id: deviceId,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,device_id'
        })
      
      console.log('✅ Push token saved to database')
    }
  }

  return token
}

/**
 * Send a push notification to a specific user
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: any
) {
  try {
    // Get user's push tokens
    const { data: tokens } = await supabase
      .from('push_tokens')
      .select('push_token')
      .eq('user_id', userId)

    if (!tokens || tokens.length === 0) {
      console.log('No push tokens found for user:', userId)
      return
    }

    // Send notification to all user's devices
    const messages = tokens.map(({ push_token }) => ({
      to: push_token,
      sound: 'default',
      title: title,
      body: body,
      data: data || {},
    }))

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })

    const result = await response.json()
    console.log('📤 Notification sent:', result)
    return result
  } catch (error) {
    console.error('Error sending push notification:', error)
  }
}
