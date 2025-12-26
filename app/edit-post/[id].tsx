import { View, Text, TextInput, Pressable, ScrollView, Switch, ActivityIndicator } from 'react-native'
import { useState, useEffect } from 'react'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../../lib/supabase'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
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

export default function EditPostScreen() {
  const { id } = useLocalSearchParams()
  const postId = Array.isArray(id) ? id[0] : id

  const [loading, setLoading] = useState(true)
  const [modelName, setModelName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [hidePrice, setHidePrice] = useState(false)
  
  // Existing images from database (Cloudinary URLs)
  const [existingImages, setExistingImages] = useState<string[]>([])
  // New images picked by user
  const [newImages, setNewImages] = useState<ImagePicker.ImagePickerAsset[]>([])
  
  const [uploading, setUploading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Total images = existing + new
  const totalImages = existingImages.length + newImages.length

  useEffect(() => {
    fetchPostData()
  }, [])

  const fetchPostData = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single()

    if (error || !data) {
      console.error('Error fetching post:', error)
      router.back()
      return
    }

    // Pre-fill all fields
    setModelName(data.product_name || '')
    setDescription(data.description || '')
    setPrice(data.price ? data.price.toString() : '')
    setHidePrice(data.hide_price || false)
    setExistingImages(data.media_urls || [])
    setLoading(false)
  }

  const pickImages = async () => {
    if (totalImages >= 4) {
      setToastMessage('Maximum 4 images allowed')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 4 - totalImages,
    })

    if (!result.canceled) {
      const availableSlots = 4 - totalImages
      const newPicks = result.assets.slice(0, availableSlots)
      setNewImages([...newImages, ...newPicks])
    }
  }

  const takePhoto = async () => {
    if (totalImages >= 4) {
      setToastMessage('Maximum 4 images allowed')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
      return
    }

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
    })

    if (!result.canceled) {
      setNewImages([...newImages, result.assets[0]])
    }
  }

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index))
  }

  const removeNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index))
  }

  const updatePost = async () => {
    if (totalImages === 0) {
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

    try {
      // Upload new images to Cloudinary
      const uploadedNewImages: string[] = []
      
      for (const image of newImages) {
        const formData = new FormData()
        formData.append('file', {
          uri: image.uri,
          type: 'image/jpeg',
          name: 'photo.jpg',
        } as any)
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        )

        const data = await response.json()
        if (data.secure_url) {
          uploadedNewImages.push(data.secure_url)
        }
      }

      // Combine existing images + newly uploaded images
      const finalImageUrls = [...existingImages, ...uploadedNewImages]

      // Update post in database
      const { error } = await supabase
        .from('posts')
        .update({
          product_name: modelName,
          description: description || null,
          price: hidePrice ? null : price ? Number(price) : null,
          hide_price: hidePrice,
          media_urls: finalImageUrls,
        })
        .eq('id', postId)

      if (error) {
        console.error('Error updating post:', error)
        setToastMessage('Failed to update post')
        setShowToast(true)
        setTimeout(() => setShowToast(false), 2000)
        setUploading(false)
        return
      }

      // Success!
      setToastMessage('Post updated successfully!')
      setShowToast(true)
      
      // Navigate back to profile after short delay
      setTimeout(() => {
        router.back()
      }, 1000)
      
    } catch (error) {
      console.error('Error:', error)
      setToastMessage('Something went wrong')
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B0F1A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6C8CFF" />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
      {/* Header */}
      <View
        style={{
          paddingTop: 50,
          paddingBottom: 16,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: '#1F2937',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={20}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </Pressable>
        <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '700' }}>
          Edit Post
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingVertical: 20,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Name */}
        <Text style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 8 }}>
          Product Name *
        </Text>
        <TextInput
          value={modelName}
          onChangeText={setModelName}
          placeholder="e.g. iPhone 15 Pro"
          placeholderTextColor="#6B7280"
          style={{
            backgroundColor: '#12182B',
            color: '#FFF',
            padding: 14,
            borderRadius: 12,
            fontSize: 15,
            marginBottom: 20,
          }}
        />

        {/* Description */}
        <Text style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 8 }}>
          Description
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Add details about the product..."
          placeholderTextColor="#6B7280"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={{
            backgroundColor: '#12182B',
            color: '#FFF',
            padding: 14,
            borderRadius: 12,
            fontSize: 15,
            marginBottom: 20,
            minHeight: 100,
          }}
        />

        {/* Price */}
        <Text style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 8 }}>
          Price
        </Text>
        <TextInput
          value={price}
          onChangeText={setPrice}
          placeholder="Enter price"
          placeholderTextColor="#6B7280"
          keyboardType="numeric"
          editable={!hidePrice}
          style={{
            backgroundColor: hidePrice ? '#1F2937' : '#12182B',
            color: hidePrice ? '#6B7280' : '#FFF',
            padding: 14,
            borderRadius: 12,
            fontSize: 15,
            marginBottom: 12,
          }}
        />

        {/* Hide Price Toggle */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#12182B',
            padding: 14,
            borderRadius: 12,
            marginBottom: 20,
          }}
        >
          <Text style={{ color: '#E5E7EB', fontSize: 15 }}>
            Hide price (DM for price)
          </Text>
          <Switch
            value={hidePrice}
            onValueChange={setHidePrice}
            trackColor={{ false: '#374151', true: '#6C8CFF' }}
            thumbColor="#FFF"
          />
        </View>

        {/* Images Section */}
        <Text style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 12 }}>
          Photos ({totalImages}/4) *
        </Text>

        {/* Image Grid */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 20,
          }}
        >
          {/* Existing Images */}
          {existingImages.map((url, index) => (
            <View
              key={`existing-${index}`}
              style={{
                width: '48%',
                aspectRatio: 1,
                borderRadius: 12,
                overflow: 'hidden',
                backgroundColor: '#12182B',
                position: 'relative',
              }}
            >
              <Image
                source={{ uri: url }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
              <Pressable
                onPress={() => removeExistingImage(index)}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  borderRadius: 20,
                  width: 32,
                  height: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={20} color="#FFF" />
              </Pressable>
            </View>
          ))}

          {/* New Images */}
          {newImages.map((image, index) => (
            <View
              key={`new-${index}`}
              style={{
                width: '48%',
                aspectRatio: 1,
                borderRadius: 12,
                overflow: 'hidden',
                backgroundColor: '#12182B',
                position: 'relative',
              }}
            >
              <Image
                source={{ uri: image.uri }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
              <Pressable
                onPress={() => removeNewImage(index)}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  borderRadius: 20,
                  width: 32,
                  height: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={20} color="#FFF" />
              </Pressable>
              {/* New badge */}
              <View
                style={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  backgroundColor: '#10B981',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '600' }}>
                  NEW
                </Text>
              </View>
            </View>
          ))}

          {/* Add Photo Buttons */}
          {totalImages < 4 && (
            <>
              <Pressable
                onPress={pickImages}
                style={{
                  width: '48%',
                  aspectRatio: 1,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: '#374151',
                  borderStyle: 'dashed',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#12182B',
                }}
              >
                <Ionicons name="images-outline" size={32} color="#6B7280" />
                <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 8 }}>
                  Add from gallery
                </Text>
              </Pressable>

              {totalImages < 3 && (
                <Pressable
                  onPress={takePhoto}
                  style={{
                    width: '48%',
                    aspectRatio: 1,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: '#374151',
                    borderStyle: 'dashed',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#12182B',
                  }}
                >
                  <Ionicons name="camera-outline" size={32} color="#6B7280" />
                  <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 8 }}>
                    Take photo
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </View>

        {/* Update Button */}
        <Pressable
          onPress={updatePost}
          disabled={uploading}
          style={{
            backgroundColor: uploading ? '#4B5563' : '#6C8CFF',
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            marginTop: 20,
          }}
        >
          {uploading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>
              Update Post
            </Text>
          )}
        </Pressable>
      </ScrollView>

      <Toast message={toastMessage} visible={showToast} />
    </View>
  )
}
