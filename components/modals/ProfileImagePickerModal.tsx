import { View, Text, Pressable, Modal, ActivityIndicator, Dimensions, Alert } from 'react-native'
import { useState } from 'react'
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

  const uploadImage = async (imageUri: string) => {
    setUploading(true)

    try {
      // Upload to Cloudinary
      const formData = new FormData()
      formData.append('file', {
        uri: imageUri,
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
      onSaved()
      onClose()
    } catch (err) {
      console.error('Upload error:', err)
      Alert.alert('Error', 'Failed to upload image. Please try again.')
      setUploading(false)
    }
  }

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    })

    if (!result.canceled) {
      await uploadImage(result.assets[0].uri)
    }
  }

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to take photos')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    })

    if (!result.canceled) {
      await uploadImage(result.assets[0].uri)
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.7)',
          justifyContent: 'flex-end',
        }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#12182B',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: 40,
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
                fontSize: 18,
                fontWeight: '700',
                textAlign: 'center',
              }}
            >
              Change Profile Picture
            </Text>
          </View>

          {uploading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator color="#6C8CFF" size="large" />
              <Text style={{ color: '#9CA3AF', marginTop: 16, fontSize: 14 }}>
                Uploading...
              </Text>
            </View>
          ) : (
            <View style={{ padding: 16 }}>
              {/* Camera Option */}
              <Pressable
                onPress={takePhoto}
                style={({ pressed }) => [
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 16,
                    paddingHorizontal: 16,
                    gap: 16,
                    backgroundColor: '#1F2937',
                    borderRadius: 12,
                    marginBottom: 12,
                  },
                  pressed && {
                    backgroundColor: '#374151',
                    transform: [{ scale: 0.98 }],
                  },
                ]}
              >
                <Text style={{ fontSize: 24 }}>📷</Text>
                <Text style={{ color: '#E5E7EB', fontSize: 16, flex: 1 }}>
                  Take Photo
                </Text>
              </Pressable>

              {/* Gallery Option */}
              <Pressable
                onPress={pickFromGallery}
                style={({ pressed }) => [
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 16,
                    paddingHorizontal: 16,
                    gap: 16,
                    backgroundColor: '#1F2937',
                    borderRadius: 12,
                  },
                  pressed && {
                    backgroundColor: '#374151',
                    transform: [{ scale: 0.98 }],
                  },
                ]}
              >
                <Text style={{ fontSize: 24 }}>🖼️</Text>
                <Text style={{ color: '#E5E7EB', fontSize: 16, flex: 1 }}>
                  Choose from Gallery
                </Text>
              </Pressable>

              {/* Divider */}
              <View
                style={{
                  height: 1,
                  backgroundColor: '#1F2937',
                  marginVertical: 16,
                }}
              />

              {/* Cancel */}
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  {
                    paddingVertical: 14,
                    alignItems: 'center',
                  },
                  pressed && {
                    opacity: 0.6,
                  },
                ]}
              >
                <Text style={{ color: '#9CA3AF', fontSize: 16 }}>
                  Cancel
                </Text>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  )
}
