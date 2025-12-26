import {
    View,
    Text,
    StyleSheet,
    Pressable,
  } from 'react-native'
  import { Image } from 'expo-image'
  import { memo, useState } from 'react'
  import ImageView from 'react-native-image-viewing'
  import { Ionicons } from '@expo/vector-icons'
  
  type Props = {
    model: string
    description?: string | null
    price?: number | null
    hidePrice?: boolean
    imageUrls?: string[]
  
    shopName: string
    city?: string
    profileImage?: string | null
  
    onEdit?: () => void
    onDelete?: () => void
    onSold?: () => void
  }
  
  function ProfilePhoneCard({
    model,
    description,
    price,
    hidePrice,
    imageUrls = [],
    shopName,
    city,
    profileImage,
  }: Props) {
    const [viewerVisible, setViewerVisible] = useState(false)
  
    const imagesForViewer = imageUrls.map(uri => ({ uri }))
  
    return (
      <View style={styles.card}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.shopRow}>
            <Image
              source={{
                uri:
                  profileImage ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    shopName
                  )}`,
              }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.shopName}>{shopName}</Text>
              {city && <Text style={styles.city}>📍 {city}</Text>}
            </View>
          </View>
  
          {/* THREE DOTS */}
          <Pressable hitSlop={20} style={styles.menuBtn}>
            <Ionicons
              name="ellipsis-vertical"
              size={20}
              color="#E5E7EB"
            />
          </Pressable>
        </View>
  
        {/* IMAGE — BIG & CLEAN */}
        <Pressable
          onPress={() => setViewerVisible(true)}
          style={styles.imageContainer}
        >
          {imageUrls[0] ? (
            <Image
              source={{ uri: imageUrls[0] }}
              style={styles.image}
              contentFit="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder} />
          )}
        </Pressable>
  
        {/* CONTENT — AUTO HEIGHT */}
        <View style={styles.content}>
          <Text style={styles.model}>{model}</Text>
  
          <Text style={styles.price}>
            {hidePrice
              ? 'DM for price'
              : price
              ? `₹${price.toLocaleString('en-IN')}`
              : ''}
          </Text>
  
          {description && (
            <Text style={styles.description}>
              {description}
            </Text>
          )}
        </View>
  
        {/* FULL IMAGE VIEWER */}
        <ImageView
          images={imagesForViewer}
          imageIndex={0}
          visible={viewerVisible}
          onRequestClose={() => setViewerVisible(false)}
          swipeToCloseEnabled
          doubleTapToZoomEnabled
        />
      </View>
    )
  }
  
  const styles = StyleSheet.create({
    card: {
      backgroundColor: '#0B0F1A',
      borderRadius: 16,
      marginHorizontal: 12,
      marginVertical: 10,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#1F2937',
    },
  
    /* ---------- header ---------- */
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
    },
  
    shopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
  
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#1F2937',
    },
  
    shopName: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 14,
    },
  
    city: {
      color: '#9CA3AF',
      fontSize: 12,
    },
  
    menuBtn: {
      padding: 6,
    },
  
    /* ---------- image ---------- */
    imageContainer: {
      width: '100%',
      height: 260, // 👈 BIG IMAGE, SIMPLE RULE
      backgroundColor: '#000',
    },
  
    image: {
      width: '100%',
      height: '100%',
    },
  
    imagePlaceholder: {
      flex: 1,
      backgroundColor: '#111827',
    },
  
    /* ---------- content ---------- */
    content: {
      padding: 12,
    },
  
    model: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 4,
    },
  
    price: {
      color: '#6C8CFF',
      fontSize: 15,
      fontWeight: '600',
      marginBottom: 6,
    },
  
    description: {
      color: '#9CA3AF',
      fontSize: 13,
      lineHeight: 18,
    },
  })
  
  export default memo(ProfilePhoneCard)
  