import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { saveProfile, getProfile, saveUserId, getUserId, clearStorage } from '../lib/storage'

type Profile = {
  id: string
  shop_name: string
  city: string
  phone: string
  email: string
  profile_image: string
  connection_count: number
  description?: string
} | null

type AuthContextType = {
  user: any
  profile: Profile
  loading: boolean
  refreshProfile: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  logout: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile>(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth on app start
  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      // Check if user is logged in
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (currentUser) {
        setUser(currentUser)
        
        // Try to load profile from cache first
        const cachedProfile = await getProfile()
        if (cachedProfile) {
          setProfile(cachedProfile)
          setLoading(false)
          
          // Fetch fresh profile in background and update cache
          fetchAndCacheProfile(currentUser.id)
        } else {
          // No cache, fetch from database
          await fetchAndCacheProfile(currentUser.id)
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
      setLoading(false)
    }
  }

  const fetchAndCacheProfile = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileData) {
        setProfile(profileData)
        await saveProfile(profileData)
        await saveUserId(userId)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  // Refresh profile (call this after editing profile)
  const refreshProfile = async () => {
    if (user) {
      await fetchAndCacheProfile(user.id)
    }
  }

  // Logout
  const logout = async () => {
    await supabase.auth.signOut()
    await clearStorage()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
