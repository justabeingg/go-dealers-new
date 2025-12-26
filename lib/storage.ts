import AsyncStorage from '@react-native-async-storage/async-storage'

// Storage Keys
const KEYS = {
  USER_PROFILE: '@user_profile',
  AUTH_TOKEN: '@auth_token',
  USER_ID: '@user_id',
}

// Save user profile to local storage
export const saveProfile = async (profile: any) => {
  try {
    await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile))
  } catch (error) {
    console.error('Error saving profile:', error)
  }
}

// Get user profile from local storage
export const getProfile = async () => {
  try {
    const profile = await AsyncStorage.getItem(KEYS.USER_PROFILE)
    return profile ? JSON.parse(profile) : null
  } catch (error) {
    console.error('Error getting profile:', error)
    return null
  }
}

// Save user ID
export const saveUserId = async (userId: string) => {
  try {
    await AsyncStorage.setItem(KEYS.USER_ID, userId)
  } catch (error) {
    console.error('Error saving user ID:', error)
  }
}

// Get user ID
export const getUserId = async () => {
  try {
    return await AsyncStorage.getItem(KEYS.USER_ID)
  } catch (error) {
    console.error('Error getting user ID:', error)
    return null
  }
}

// Clear all cached data (on logout)
export const clearStorage = async () => {
  try {
    await AsyncStorage.multiRemove([
      KEYS.USER_PROFILE,
      KEYS.AUTH_TOKEN,
      KEYS.USER_ID,
    ])
  } catch (error) {
    console.error('Error clearing storage:', error)
  }
}
