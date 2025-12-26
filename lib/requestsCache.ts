// Requests Tab Caching Utilities
import AsyncStorage from '@react-native-async-storage/async-storage'

const KEYS = {
  CONNECTION_REQUESTS: '@requests_connections',
  DEVICE_REQUESTS: '@requests_devices',
}

// Connection Requests Cache
export const saveConnectionRequests = async (requests: any[]) => {
  try {
    await AsyncStorage.setItem(KEYS.CONNECTION_REQUESTS, JSON.stringify(requests))
  } catch (error) {
    console.error('Error saving connection requests:', error)
  }
}

export const getConnectionRequests = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.CONNECTION_REQUESTS)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Error getting connection requests:', error)
    return null
  }
}

// Device Requests Cache
export const saveDeviceRequests = async (requests: any[]) => {
  try {
    await AsyncStorage.setItem(KEYS.DEVICE_REQUESTS, JSON.stringify(requests))
  } catch (error) {
    console.error('Error saving device requests:', error)
  }
}

export const getDeviceRequests = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.DEVICE_REQUESTS)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Error getting device requests:', error)
    return null
  }
}

// Clear all caches
export const clearRequestsCache = async () => {
  try {
    await AsyncStorage.multiRemove([KEYS.CONNECTION_REQUESTS, KEYS.DEVICE_REQUESTS])
  } catch (error) {
    console.error('Error clearing requests cache:', error)
  }
}
