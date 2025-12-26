import * as Crypto from 'expo-crypto'

const CLOUDINARY_CLOUD_NAME = 'desyyz9m5'
const CLOUDINARY_API_KEY = '47819317274635'
const CLOUDINARY_API_SECRET = 'HX6c-f9JJpNEYjr71x3qlL5s_9c'

/**
 * Delete images from Cloudinary
 * @param imageUrls - Array of Cloudinary image URLs
 * @returns Promise<void>
 */
export const deleteCloudinaryImages = async (imageUrls: string[]): Promise<void> => {
  if (!imageUrls || imageUrls.length === 0) return

  const deletePromises = imageUrls.map(async (url) => {
    try {
      // Extract public_id from Cloudinary URL
      // Example: https://res.cloudinary.com/desyyz9m5/image/upload/v1234567890/abcd1234.jpg
      const matches = url.match(/\/v\d+\/(.+)\.\w+$/)
      if (!matches) {
        console.log('Invalid Cloudinary URL:', url)
        return
      }

      const publicId = matches[1]
      
      // Generate timestamp
      const timestamp = Math.floor(Date.now() / 1000).toString()
      
      // Create signature string
      const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`
      
      // Simple SHA-1 hash implementation for React Native
      const signature = await sha1(stringToSign)
      
      // Delete from Cloudinary using fetch
      const formData = new FormData()
      formData.append('public_id', publicId)
      formData.append('api_key', CLOUDINARY_API_KEY)
      formData.append('timestamp', timestamp)
      formData.append('signature', signature)
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
        {
          method: 'POST',
          body: formData,
        }
      )
      
      const result = await response.json()
      console.log('Cloudinary delete result:', result)
    } catch (error) {
      console.error('Failed to delete image from Cloudinary:', error)
    }
  })

  await Promise.all(deletePromises)
}

/**
 * Simple SHA-1 hash using expo-crypto
 */
async function sha1(message: string): Promise<string> {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA1,
    message
  )
  return hash
}
