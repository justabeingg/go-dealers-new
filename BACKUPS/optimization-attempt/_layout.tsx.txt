import { Stack } from 'expo-router'
import { AuthProvider } from '../contexts/AuthContext'

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="connections/[userId]" />
        <Stack.Screen name="other-profile/[userId]" />
        <Stack.Screen name="edit-post/[id]" />
      </Stack>
    </AuthProvider>
  )
}
