import { View } from 'react-native'
import { useEffect, useState, useRef } from 'react'
import { Redirect } from 'expo-router'
import { supabase } from '../lib/supabase'
import * as Notifications from 'expo-notifications'
import { registerForPushNotificationsAsync } from '../lib/notifications'

import AuthScreen from '../screens/AuthScreen'
import WaitingApprovalScreen from '../screens/WaitingApprovalScreen'
import AdminPanelScreen from '../screens/AdminPanelScreen'
import LoadingScreen from '../components/ui/LoadingScreen'

export default function Index() {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  
  const notificationListener = useRef<any>()
  const responseListener = useRef<any>()

  // Register for push notifications when user logs in
  useEffect(() => {
    if (session && profile && profile.approved) {
      registerForPushNotificationsAsync()
      
      // Listen for notifications received while app is open
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('🔔 Notification received:', notification)
      })

      // Listen for notification taps
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('👆 Notification tapped:', response)
      })

      return () => {
        if (notificationListener.current) {
          notificationListener.current.remove()
        }
        if (responseListener.current) {
          responseListener.current.remove()
        }
      }
    }
  }, [session, profile])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setProfile(null)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session) return

    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        setProfile(data)
      })
  }, [session])

  if (loading) {
    return <LoadingScreen />
  }

  if (!session) {
    return <AuthScreen onAuthSuccess={() => {}} />
  }

  if (!profile) {
    return <LoadingScreen />
  }

  // 🔑 ADMIN ROUTE
  if (profile.role === 'admin') {
    return <AdminPanelScreen />
  }

  // 👤 DEALER NOT APPROVED
  if (profile.approved === false) {
    return <WaitingApprovalScreen />
  }

  // ✅ APPROVED DEALER → ENTER TABS
  return <Redirect href="/(tabs)/feed" />
}
