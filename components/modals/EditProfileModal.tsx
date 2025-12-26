import { View, Text, TextInput, Pressable, Modal, ScrollView, ActivityIndicator } from 'react-native'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

type Props = {
  visible: boolean
  shopName: string
  city: string
  phone?: string
  email?: string
  description?: string | null
  onClose: () => void
  onSaved: () => void
}

export default function EditProfileModal({
  visible,
  shopName: initialShopName,
  city: initialCity,
  phone: initialPhone,
  email: initialEmail,
  description: initialDescription,
  onClose,
  onSaved,
}: Props) {
  const [shopName, setShopName] = useState(initialShopName || '')
  const [city, setCity] = useState(initialCity || '')
  const [phone, setPhone] = useState(initialPhone || '')
  const [email, setEmail] = useState(initialEmail || '')
  const [description, setDescription] = useState(initialDescription || '')
  const [saving, setSaving] = useState(false)

  // Update state when props change
  useEffect(() => {
    if (visible) {
      setShopName(initialShopName || '')
      setCity(initialCity || '')
      setPhone(initialPhone || '')
      setEmail(initialEmail || '')
      setDescription(initialDescription || '')
    }
  }, [visible, initialShopName, initialCity, initialPhone, initialEmail, initialDescription])

  const saveProfile = async () => {
    if (!shopName.trim()) {
      alert('Shop name is required')
      return
    }

    setSaving(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        shop_name: shopName.trim(),
        city: city.trim() || null,
        phone: phone.trim() || null,
        description: description.trim() || null,
      })
      .eq('id', user.id)

    setSaving(false)

    if (error) {
      alert('Failed to save. Please try again.')
      return
    }

    onSaved()
    onClose()
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
          backgroundColor: 'rgba(0,0,0,0.8)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: '#0B0F1A',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '90%',
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 20,
              borderBottomWidth: 1,
              borderBottomColor: '#1F2937',
            }}
          >
            <Pressable onPress={onClose}>
              <Text style={{ color: '#9CA3AF', fontSize: 16 }}>Cancel</Text>
            </Pressable>

            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 18,
                fontWeight: '700',
              }}
            >
              Edit Profile
            </Text>

            <Pressable onPress={saveProfile} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#6C8CFF" size="small" />
              ) : (
                <Text
                  style={{
                    color: '#6C8CFF',
                    fontWeight: '700',
                    fontSize: 16,
                  }}
                >
                  Save
                </Text>
              )}
            </Pressable>
          </View>

          {/* Form */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20 }}
          >
            {/* Shop Name */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: '#9CA3AF',
                  fontSize: 13,
                  fontWeight: '600',
                  marginBottom: 8,
                }}
              >
                Shop Name *
              </Text>
              <TextInput
                value={shopName}
                onChangeText={setShopName}
                placeholder="Enter shop name"
                placeholderTextColor="#6B7280"
                style={{
                  backgroundColor: '#12182B',
                  color: '#FFFFFF',
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 16,
                }}
              />
            </View>

            {/* City/Location */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: '#9CA3AF',
                  fontSize: 13,
                  fontWeight: '600',
                  marginBottom: 8,
                }}
              >
                City / Location
              </Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="e.g., Mumbai, Maharashtra"
                placeholderTextColor="#6B7280"
                style={{
                  backgroundColor: '#12182B',
                  color: '#FFFFFF',
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 16,
                }}
              />
            </View>

            {/* Phone */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: '#9CA3AF',
                  fontSize: 13,
                  fontWeight: '600',
                  marginBottom: 8,
                }}
              >
                Phone Number
              </Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g., +91 98765 43210"
                placeholderTextColor="#6B7280"
                keyboardType="phone-pad"
                style={{
                  backgroundColor: '#12182B',
                  color: '#FFFFFF',
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 16,
                }}
              />
            </View>

            {/* Email (Read-only, just display) */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: '#9CA3AF',
                  fontSize: 13,
                  fontWeight: '600',
                  marginBottom: 8,
                }}
              >
                Email (Login Email)
              </Text>
              <View
                style={{
                  backgroundColor: '#12182B',
                  borderRadius: 12,
                  padding: 14,
                  opacity: 0.6,
                }}
              >
                <Text style={{ color: '#9CA3AF', fontSize: 16 }}>
                  {email || 'No email'}
                </Text>
              </View>
              <Text
                style={{
                  color: '#6B7280',
                  fontSize: 12,
                  marginTop: 4,
                }}
              >
                Email cannot be changed
              </Text>
            </View>

            {/* Bio/Description */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: '#9CA3AF',
                  fontSize: 13,
                  fontWeight: '600',
                  marginBottom: 8,
                }}
              >
                Bio / About Your Shop
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholder="Tell customers about your shop, what you sell, your specialties..."
                placeholderTextColor="#6B7280"
                style={{
                  backgroundColor: '#12182B',
                  color: '#FFFFFF',
                  borderRadius: 12,
                  padding: 14,
                  minHeight: 100,
                  fontSize: 16,
                }}
              />
              <Text
                style={{
                  color: '#6B7280',
                  fontSize: 12,
                  marginTop: 4,
                }}
              >
                {description.length}/500 characters
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
