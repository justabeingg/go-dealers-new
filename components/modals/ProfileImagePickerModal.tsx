import { View, Text, Pressable, Modal, ActivityIndicator, Dimensions } from 'react-native'
import { useState } from 'react'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../../lib/supabase'
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../../lib/cloudinary'

type Props = {
  visible: boolean
  currentImage?: string | null
  onClose: () => void
  onSaved: () => void
}

const { width } = Dimensions.get('window')

export default function ProfileImagePickerModal({
  visible,
  currentImage,
  onClose,
  onSaved,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    })

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri)
    }
  }

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    
    if (status !== 'granted') {
      alert('Camera permission required')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    })

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri)
    }
  }

  const uploadImage = async () => {
    if (!selectedImage) return

    setUploading(true)

    try {
      // Upload to Cloudinary
      const formData = new FormData()
      formData.append('file', {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any)
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
        { method: 'POST', body: formData }
      )

      const upload = await res.json()
      
      if (!upload.secure_url) {
        throw new Error('Upload failed')
      }

      // Save to database
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({ profile_image: upload.secure_url })
        .eq('id', user.id)

      if (error) throw error

      setUploading(false)
      setSelectedImage(null)
      onSaved()
      onClose()
    } catch (err) {
      console.error('Upload error:', err)
      alert('Failed to upload image. Please try again.')
      setUploading(false)
    }
  }

  const removeImage = async () => {
    setUploading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({ profile_image: null })
        .eq('id', user.id)

      if (error) throw error

      setUploading(false)
      onSaved()
      onClose()
    } catch (err) {
      console.error('Remove error:', err)
      alert('Failed to remove image. Please try again.')
      setUploading(false)
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.9)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            backgroundColor: '#12182B',
            borderRadius: 20,
            width: width - 40,
            maxWidth: 400,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <View
            style={{
              padding: 20,
              borderBottomWidth: 1,
              borderBottomColor: '#1F2937',
            }}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 20,
                fontWeight: '700',
                textAlign: 'center',
              }}
            >
              Profile Photo
            </Text>
          </View>

          {/* Preview */}
          {(selectedImage || currentImage) && (
            <View
              style={{
                alignItems: 'center',
                paddingVertical: 30,
                backgroundColor: '#0B0F1A',
              }}
            >
              <View
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: 75,
                  overflow: 'hidden',
                  backgroundColor: '#6C8CFF',
                }}
              >
                <Image
                  source={{ uri: selectedImage || currentImage || '' }}
                  style={{ width: 150, height: 150 }}
                  contentFit="cover"
                />
              </View>
            </View>
          )}

          {/* Options */}
          <View style={{ padding: 16 }}>
            {!selectedImage ? (
              <>
                {/* Camera Option */}
                <Pressable
                  onPress={takePhoto}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 16,
                    gap: 12,
                  }}
                >
                  <Text style={{ fontSize: 24 }}>📷</Text>
                  <Text style={{ color: '#E5E7EB', fontSize: 16 }}>
                    Take Photo
                  </Text>
                </Pressable>

                {/* Gallery Option */}
                <Pressable
                  onPress={pickFromGallery}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 16,
                    gap: 12,
                  }}
                >
                  <Text style={{ fontSize: 24 }}>🖼️</Text>
                  <Text style={{ color: '#E5E7EB', fontSize: 16 }}>
                    Choose from Gallery
                  </Text>
                </Pressable>

                {/* Remove Option (only if has current image) */}
                {currentImage && (
                  <Pressable
                    onPress={removeImage}
                    disabled={uploading}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 16,
                      gap: 12,
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>🗑️</Text>
                    <Text style={{ color: '#EF4444', fontSize: 16 }}>
                      Remove Current Photo
                    </Text>
                  </Pressable>
                )}

                {/* Divider */}
                <View
                  style={{
                    height: 1,
                    backgroundColor: '#1F2937',
                    marginVertical: 8,
                  }}
                />

                {/* Cancel */}
                <Pressable
                  onPress={onClose}
                  style={{
                    paddingVertical: 16,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#9CA3AF', fontSize: 16 }}>
                    Cancel
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                {/* Save Button */}
                <Pressable
                  onPress={uploadImage}
                  disabled={uploading}
                  style={({ pressed }) => [{
                    backgroundColor: '#6C8CFF',
                    paddingVertical: 14,
                    borderRadius: 10,
                    alignItems: 'center',
                    marginBottom: 12,
                  }, pressed && !uploading && {
                    backgroundColor: '#5A7BEF',
                    transform: [{ scale: 0.98 }],
                  }, uploading && {
                    opacity: 0.6,
                  }]}
                >
                  {uploading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>
                      ✓ Save Photo
                    </Text>
                  )}
                </Pressable>

                {/* Cancel */}
                <Pressable
                  onPress={() => setSelectedImage(null)}
                  disabled={uploading}
                  style={({ pressed }) => [{
                    backgroundColor: '#374151',
                    paddingVertical: 14,
                    borderRadius: 10,
                    alignItems: 'center',
                  }, pressed && !uploading && {
                    backgroundColor: '#4B5563',
                    transform: [{ scale: 0.98 }],
                  }, uploading && {
                    opacity: 0.6,
                  }]}
                >
                  <Text style={{ color: '#E5E7EB', fontSize: 16, fontWeight: '600' }}>
                    ✕ Cancel
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  )
}
