import { View, Text, Pressable, Linking } from 'react-native'
import { Image } from 'expo-image'

type Props = {
  shopName: string
  city: string
  phone?: string
  email?: string
  description?: string | null
  profileImage?: string | null
  connectionCount?: number
  onEditPress?: () => void
  onProfileImagePress?: () => void
  onConnectionPress?: () => void
  isConnectionClickable?: boolean
  showEditButton?: boolean
  showContactButtons?: boolean
}

export default function ProfileHeader({
  shopName,
  city,
  phone,
  email,
  description,
  profileImage,
  connectionCount = 0,
  onEditPress,
  onProfileImagePress,
  onConnectionPress,
  isConnectionClickable = false,
  showEditButton = true,
  showContactButtons = true,
}: Props) {
  
  const handlePhonePress = () => {
    if (phone) {
      Linking.openURL(`tel:${phone}`)
    }
  }

  const handleEmailPress = () => {
    if (email) {
      Linking.openURL(`mailto:${email}`)
    }
  }

  return (
    <View
      style={{
        backgroundColor: '#0B0F1A',
      }}
    >
      {/* Header Section */}
      <View style={{ padding: 20, paddingBottom: 16 }}>
        {/* Profile Icon Circle - Now Pressable */}
        <Pressable onPress={onProfileImagePress} disabled={!showEditButton}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#6C8CFF',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              overflow: 'hidden',
            }}
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={{ width: 80, height: 80 }}
                contentFit="cover"
              />
            ) : (
              <Text
                style={{
                  color: '#FFF',
                  fontSize: 32,
                  fontWeight: '900',
                }}
              >
                {shopName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          
          {/* Camera Badge - Only show if edit is enabled */}
          {showEditButton && (
            <View
              style={{
                position: 'absolute',
                bottom: 12,
                right: 0,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: '#6C8CFF',
                borderWidth: 3,
                borderColor: '#0B0F1A',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 14 }}>📷</Text>
            </View>
          )}
        </Pressable>

        {/* Shop Name */}
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 24,
            fontWeight: '800',
            marginBottom: 4,
          }}
        >
          {shopName}
        </Text>

        {/* Location and Connection Count */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 }}>
          <Text style={{ color: '#6C8CFF', fontSize: 15 }}>📍 {city}</Text>
        </View>

        {/* Connection Count - Big and Prominent */}
        {connectionCount > 0 && (
          <Pressable
            onPress={isConnectionClickable ? onConnectionPress : undefined}
            disabled={!isConnectionClickable}
            style={({ pressed }) => [{
              backgroundColor: '#12182B',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderWidth: 1,
              borderColor: '#1F2937',
            }, pressed && isConnectionClickable && {
              transform: [{ scale: 0.98 }],
              backgroundColor: '#1F2937',
            }]}
          >
            <View>
              <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 2 }}>
                Connections
              </Text>
              <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '800' }}>
                {connectionCount}
              </Text>
            </View>
            {isConnectionClickable && (
              <Text style={{ color: '#6C8CFF', fontSize: 13 }}>
                View all →
              </Text>
            )}
          </Pressable>
        )}

        {/* Bio/Description */}
        <Text
          style={{
            color: '#E5E7EB',
            fontSize: 14,
            lineHeight: 20,
            marginBottom: 16,
          }}
        >
          {description || 'Add a description to tell customers about your shop'}
        </Text>

        {/* Contact Buttons */}
        {showContactButtons && phone && email && (
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {phone && (
            <Pressable
              onPress={handlePhonePress}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#1F2937',
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 8,
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 16 }}>📞</Text>
              <Text style={{ color: '#E5E7EB', fontSize: 13, fontWeight: '600' }}>
                Call
              </Text>
            </Pressable>
          )}

          {email && (
            <Pressable
              onPress={handleEmailPress}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#1F2937',
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 8,
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 16 }}>✉️</Text>
              <Text style={{ color: '#E5E7EB', fontSize: 13, fontWeight: '600' }}>
                Email
              </Text>
            </Pressable>
          )}
          </View>
        )}

        {/* Edit Profile Button - Only show if enabled */}
        {showEditButton && onEditPress && (
        <Pressable
          onPress={onEditPress}
          style={{
            backgroundColor: '#6C8CFF',
            paddingVertical: 10,
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
            Edit Profile
          </Text>
        </Pressable>
        )}
      </View>

      {/* Divider */}
      <View
        style={{
          height: 1,
          backgroundColor: '#1F2937',
          marginHorizontal: 20,
        }}
      />

      {/* Posts Section Label */}
      <View style={{ padding: 16, paddingBottom: 12 }}>
        <Text
          style={{
            color: '#9CA3AF',
            fontSize: 13,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {showEditButton ? 'Your Products' : 'Products'}
        </Text>
      </View>
    </View>
  )
}
