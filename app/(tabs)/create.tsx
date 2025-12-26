import { View, Text, TextInput, Pressable, ScrollView, Switch, ActivityIndicator } from 'react-native'
import { useState } from 'react'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../../lib/supabase'
import { router } from 'expo-router'
import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET,
} from '../../lib/cloudinary'

// Toast notification component
const Toast = ({ message, visible }: { message: string; visible: boolean }) => {
  if (!visible) return null
  
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        backgroundColor: '#10B981',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        zIndex: 1000,
      }}
    >
      <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '600' }}>
        ✓ {message}
      </Text>
    </View>
  )
}

export default function CreateScreen() {
  const [modelName, setModelName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [hidePrice, setHidePrice] = useState(false)
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([])
  const [uploading, setUploading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const pickImages = async () => {
    if (images.length >= 4) {
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 4 - images.length,
    })

    if (!result.canceled) {
      const newImages = result.assets.slice(0, 4 - images.length)
      setImages([...images, ...newImages])
    }
  }

  const takePhoto = async () => {
    if (images.length >= 4) {
      return
    }

    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    
    if (status !== 'granted') {
      setToastMessage('Camera permission required')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      // Removed allowsEditing - no crop screen
    })

    if (!result.canceled) {
      setImages([...images, result.assets[0]])
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const createPost = async () => {
    if (images.length === 0) {
      setToastMessage('Please add at least one image')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
      return
    }
    if (!modelName.trim()) {
      setToastMessage('Product name is required')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
      return
    }

    setUploading(true)

    // Get current user profile data
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setUploading(false)
      return
    }

    // Get user profile for shop name and city
    const { data: profileData } = await supabase
      .from('profiles')
      .select('shop_name, city')
      .eq('id', user.id)
      .single()

    // Create optimistic post (temporary post with local image URLs)
    const optimisticPost = {
      id: `temp-${Date.now()}`, // Temporary ID
      user_id: user.id,
      product_name: modelName,
      description: description || null,
      price: hidePrice ? null : price ? Number(price) : null,
      hide_price: hidePrice,
      media_urls: images.map(img => img.uri), // Use local URIs temporarily
      created_at: new Date().toISOString(),
      isUploading: true, // Flag to show loading state
      profiles: {
        shop_name: profileData?.shop_name || 'Your Shop',
        city: profileData?.city || 'Your City',
      },
    }

    // Store optimistic post in global state for feed to pick up
    ;(globalThis as any).__NEW_POST__ = optimisticPost

    // Navigate to feed immediately
    router.push('/(tabs)/feed')

    // Show uploading toast
    setToastMessage('Uploading your post...')
    setShowToast(true)

    // Continue upload in background
    try {
      // 1. Upload all images to Cloudinary
      const uploadPromises = images.map(async (image) => {
        const formData = new FormData()
        formData.append('file', {
          uri: image.uri,
          type: 'image/jpeg',
          name: 'upload.jpg',
        } as any)
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
          { method: 'POST', body: formData }
        )

        const upload = await res.json()
        if (!upload.secure_url) throw new Error('Upload failed')
        return upload.secure_url
      })

      const uploadedUrls = await Promise.all(uploadPromises)

      // 2. Save to Supabase with real URLs
      const { data: newPost, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          product_name: modelName,
          description: description || null,
          price: hidePrice ? null : price ? Number(price) : null,
          hide_price: hidePrice,
          media_urls: uploadedUrls,
        })
        .select(`
          id,
          user_id,
          product_name,
          description,
          price,
          hide_price,
          media_urls,
          created_at,
          profiles (
            shop_name,
            city
          )
        `)
        .single()

      if (error) throw error

      // Update global state with real post
      ;(globalThis as any).__NEW_POST__ = newPost
      ;(globalThis as any).__POST_UPLOADED__ = true

      // Show success toast
      setToastMessage('Post created successfully!')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)

      // Clear form
      setModelName('')
      setDescription('')
      setPrice('')
      setHidePrice(false)
      setImages([])
    } catch (err: any) {
      console.error('Upload error:', err)
      setToastMessage('Upload failed. Please try again.')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
      
      // Clear optimistic post on error
      ;(globalThis as any).__NEW_POST__ = null
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <ScrollView 
        style={{ flex: 1, backgroundColor: '#0B0F1A' }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        {/* Header */}
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 24,
            fontWeight: '700',
            marginBottom: 20,
            marginTop: 10,
          }}
        >
          Create Post
        </Text>

        {/* Image Picker Section */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#9CA3AF', marginBottom: 8, fontSize: 14 }}>
            Images ({images.length}/4) {images.length === 0 && '*'}
          </Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12 }}
          >
            {images.map((image, index) => (
              <View key={index} style={{ position: 'relative' }}>
                <Image
                  source={{ uri: image.uri }}
                  style={{ 
                    width: 120, 
                    height: 120, 
                    borderRadius: 12,
                    backgroundColor: '#12182B'
                  }}
                  contentFit="cover"
                />
                <Pressable
                  onPress={() => removeImage(index)}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>×</Text>
                </Pressable>
              </View>
            ))}

            {/* Camera Button */}
            {images.length < 4 && (
              <Pressable
                onPress={takePhoto}
                style={{
                  width: 120,
                  height: 120,
                  backgroundColor: '#12182B',
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: '#6C8CFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#6C8CFF', fontSize: 32 }}>📷</Text>
                <Text style={{ color: '#6C8CFF', fontSize: 12, marginTop: 4 }}>
                  Camera
                </Text>
              </Pressable>
            )}

            {/* Gallery Button */}
            {images.length < 4 && (
              <Pressable
                onPress={pickImages}
                style={{
                  width: 120,
                  height: 120,
                  backgroundColor: '#12182B',
                  borderRadius: 12,
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: '#374151',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#6B7280', fontSize: 32 }}>🖼️</Text>
                <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 4 }}>
                  Gallery
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </View>

        {/* Product Name */}
        <TextInput
          placeholder="Product name *"
          placeholderTextColor="#6B7280"
          value={modelName}
          onChangeText={setModelName}
          style={{
            backgroundColor: '#12182B',
            color: '#FFF',
            padding: 14,
            borderRadius: 12,
            marginBottom: 12,
            fontSize: 16,
          }}
        />

        {/* Description */}
        <TextInput
          placeholder="Description (optional)"
          placeholderTextColor="#6B7280"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={{
            backgroundColor: '#12182B',
            color: '#FFF',
            padding: 14,
            borderRadius: 12,
            marginBottom: 12,
            minHeight: 100,
            fontSize: 16,
          }}
        />

        {/* Price Input */}
        {!hidePrice && (
          <TextInput
            placeholder="Price (₹)"
            placeholderTextColor="#6B7280"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            style={{
              backgroundColor: '#12182B',
              color: '#FFF',
              padding: 14,
              borderRadius: 12,
              marginBottom: 12,
              fontSize: 16,
            }}
          />
        )}

        {/* Hide Price Toggle */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#12182B',
            padding: 14,
            borderRadius: 12,
            marginBottom: 24,
          }}
        >
          <Switch 
            value={hidePrice} 
            onValueChange={setHidePrice}
            trackColor={{ false: '#374151', true: '#6C8CFF' }}
            thumbColor="#FFF"
          />
          <Text style={{ color: '#E5E7EB', marginLeft: 12, fontSize: 15 }}>
            Hide price (Show "DM for price")
          </Text>
        </View>

        {/* Post Button */}
        <Pressable
          onPress={createPost}
          disabled={uploading || images.length === 0 || !modelName.trim()}
          style={{
            backgroundColor: uploading || images.length === 0 || !modelName.trim() ? '#4B5563' : '#6C8CFF',
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: 'center',
          }}
        >
          {uploading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator color="#FFF" size="small" />
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>
                Uploading...
              </Text>
            </View>
          ) : (
            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>
              Create Post
            </Text>
          )}
        </Pressable>
      </ScrollView>

      {/* Toast Notification */}
      <Toast 
        message={toastMessage} 
        visible={showToast} 
      />
    </>
  )
}
