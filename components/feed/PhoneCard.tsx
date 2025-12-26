import {
  View,
  Text,
  Pressable,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Dimensions,
} from 'react-native'
import { Image } from 'expo-image'
import { useState, useRef, memo } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import ImageView from 'react-native-image-viewing'

/* ---------- layout constants (local & predictable) ---------- */
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

const NAV_HEIGHT = 76
const TOP_GAP = 90
const SIDE_GAP = 12

const CARD_HEIGHT = SCREEN_HEIGHT - TOP_GAP - NAV_HEIGHT - 20
/* ----------------------------------------------------------- */

type Props = {
  model: string
  description?: string | null
  price?: number | null
  hidePrice?: boolean
  imageUrls?: string[]
  shopName?: string
  city?: string
  profileImage?: string | null
  userId?: string
  phone?: string
  onProfilePress?: (userId: string) => void
}

const PhoneCard = ({
  model,
  description,
  price,
  hidePrice,
  imageUrls = [],
  shopName = 'Shop',
  city = 'City',
  profileImage,
  userId,
  phone,
  onProfilePress,
}: Props) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [viewerVisible, setViewerVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const scrollRef = useRef<ScrollView>(null)

  const avatarUrl =
    profileImage ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(shopName)}`

  const viewerImages = imageUrls.map((uri) => ({ uri }))

  const handleScroll = (e: any) => {
    const index = Math.round(
      e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - SIDE_GAP * 2)
    )
    setCurrentImageIndex(index)
  }

  const handleWhatsApp = () => {
    if (!phone) return
    const clean = phone.replace(/\D/g, '')
    const message = `Hi, I'm interested in the ${model}`
    Linking.openURL(
      `https://wa.me/91${clean}?text=${encodeURIComponent(message)}`
    )
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        {/* IMAGE CAROUSEL */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {imageUrls.map((uri, index) => (
            <Pressable key={index} onPress={() => setViewerVisible(true)}>
              <Image
                source={{ uri }}
                style={styles.image}
                contentFit="cover"
              />
            </Pressable>
          ))}
        </ScrollView>

        {/* TOP GRADIENT */}
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'transparent']}
          style={styles.topGradient}
          pointerEvents="none"
        />

        {/* BOTTOM GRADIENT (READABILITY LAYER) */}
        <LinearGradient
          colors={[
            'transparent',
            'rgba(0,0,0,0.45)',
            'rgba(0,0,0,0.8)',
            'rgba(0,0,0,0.95)',
          ]}
          locations={[0, 0.35, 0.7, 1]}
          style={styles.bottomGradient}
          pointerEvents="none"
        />

        {/* TOP INFO */}
        <View style={styles.topOverlay}>
          <TouchableOpacity
            onPress={() => userId && onProfilePress?.(userId)}
            style={styles.shopRow}
          >
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            <View>
              <Text style={styles.shopName}>{shopName}</Text>
              <Text style={styles.city}>📍 {city}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* MEDIA DOTS (NEW) */}
        {imageUrls.length > 1 && (
          <View style={styles.dotsContainer} pointerEvents="none">
            {imageUrls.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  currentImageIndex === i && styles.dotActive,
                ]}
              />
            ))}
          </View>
        )}

        {/* BOTTOM INFO */}
        <View style={styles.bottomOverlay}>
          <Text style={styles.model}>{model}</Text>

          <Text style={styles.price}>
            {hidePrice
              ? 'DM for price'
              : price
              ? `₹${price.toLocaleString('en-IN')}`
              : ''}
          </Text>

          {description && (
            <>
              <Text
                style={styles.description}
                numberOfLines={expanded ? undefined : 2}
              >
                {description}
              </Text>

              {description.length > 60 && (
                <Pressable onPress={() => setExpanded(v => !v)}>
                  <Text style={styles.moreText}>
                    {expanded ? 'Less' : 'More'}
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </View>

        {/* WHATSAPP */}
        <TouchableOpacity
          onPress={handleWhatsApp}
          style={styles.whatsapp}
        >
          <Ionicons name="logo-whatsapp" size={24} color="#fff" />
        </TouchableOpacity>

        {/* IMAGE VIEWER */}
        <ImageView
          images={viewerImages}
          imageIndex={currentImageIndex}
          visible={viewerVisible}
          onRequestClose={() => setViewerVisible(false)}
          swipeToCloseEnabled
          doubleTapToZoomEnabled
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    height: SCREEN_HEIGHT,
    alignItems: 'center',
  },
  card: {
    width: SCREEN_WIDTH - SIDE_GAP * 2,
    height: CARD_HEIGHT,
    marginTop: TOP_GAP,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  image: {
    width: SCREEN_WIDTH - SIDE_GAP * 2,
    height: CARD_HEIGHT,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    height: '22%',
    left: 0,
    right: 0,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    height: '40%',
    left: 0,
    right: 0,
  },
  topOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  shopName: {
    color: '#fff',
    fontWeight: '800',
  },
  city: {
    color: '#ddd',
    fontSize: 12,
  },

  /* DOTS */
  dotsContainer: {
    position: 'absolute',
    bottom: NAV_HEIGHT + 96,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#fff',
  },

  bottomOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: NAV_HEIGHT + 16,
  },
  model: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  price: {
    color: '#fbbf24',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  description: {
    color: '#E5E7EB',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  moreText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  whatsapp: {
    position: 'absolute',
    right: 16,
    bottom: NAV_HEIGHT + 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default memo(PhoneCard)
