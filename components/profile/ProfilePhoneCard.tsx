import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
} from 'react-native'
import { Image } from 'expo-image'
import { memo, useState } from 'react'
import ImageView from 'react-native-image-viewing'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

type Props = {
  postId?: string
  model: string
  description?: string | null
  price?: number | null
  hidePrice?: boolean
  imageUrls?: string[]

  shopName: string
  city?: string
  profileImage?: string | null

  onDelete?: (postId: string) => void
  showWhatsApp?: boolean
  onWhatsAppPress?: () => void
  onProfilePress?: () => void
}

function ProfilePhoneCard({
  postId,
  model,
  description,
  price,
  hidePrice,
  imageUrls = [],
  shopName,
  city,
  profileImage,
  onDelete,
  showWhatsApp = false,
  onWhatsAppPress,
  onProfilePress,
}: Props) {
  const [viewerVisible, setViewerVisible] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)

  const imagesForViewer = imageUrls.map(uri => ({ uri }))

  const handleDelete = () => {
    setDeleteModalVisible(false)
    setMenuVisible(false)
    if (postId && onDelete) {
      onDelete(postId)
    }
  }

  return (
    <View style={styles.card}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          style={styles.shopRow}
          onPress={onProfilePress}
          disabled={!onProfilePress}
        >
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
        </Pressable>

        {/* THREE DOTS OR WHATSAPP BUTTON */}
        {showWhatsApp ? (
          // WhatsApp Button (Search only)
          <Pressable
            onPress={onWhatsAppPress}
            style={styles.whatsappBtn}
          >
            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
          </Pressable>
        ) : (
          // Three Dots Menu (Profile only)
          <View>
            <Pressable 
              hitSlop={20} 
              style={styles.menuBtn}
              onPress={() => setMenuVisible(!menuVisible)}
            >
              <Ionicons
                name="ellipsis-vertical"
                size={20}
                color="#E5E7EB"
              />
            </Pressable>

            {/* DROPDOWN MENU */}
            {menuVisible && (
              <View style={styles.dropdown}>
                {/* Edit Option */}
                <Pressable 
                  style={styles.menuOption}
                  onPress={() => {
                    setMenuVisible(false)
                    if (postId) {
                      router.push(`/edit-post/${postId}`)
                    }
                  }}
                >
                  <Ionicons name="create-outline" size={18} color="#9CA3AF" />
                  <Text style={styles.menuText}>Edit</Text>
                </Pressable>

                {/* Delete Option */}
                <Pressable 
                  style={[styles.menuOption, styles.deleteOption]}
                  onPress={() => {
                    setMenuVisible(false)
                    setDeleteModalVisible(true)
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={[styles.menuText, styles.deleteText]}>Delete</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
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

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setDeleteModalVisible(false)}
        >
          <Pressable 
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Delete Post?</Text>
            <Text style={styles.modalMessage}>
              This post will be permanently deleted. This action cannot be undone.
            </Text>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleDelete}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0B0F1A',
    borderRadius: 16,
    marginHorizontal: 12,
    marginVertical: 10,
    overflow: 'visible', // Changed to visible for dropdown
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

  whatsappBtn: {
    padding: 6,
  },

  /* ---------- dropdown menu ---------- */
  dropdown: {
    position: 'absolute',
    top: 35,
    right: 0,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },

  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },

  deleteOption: {
    borderBottomWidth: 0,
  },

  menuText: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '500',
  },

  deleteText: {
    color: '#EF4444',
  },

  /* ---------- image ---------- */
  imageContainer: {
    width: '100%',
    height: 260,
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

  /* ---------- delete modal ---------- */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },

  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },

  modalMessage: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },

  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },

  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  cancelButton: {
    backgroundColor: '#374151',
  },

  deleteButton: {
    backgroundColor: '#EF4444',
  },

  cancelButtonText: {
    color: '#E5E7EB',
    fontSize: 15,
    fontWeight: '600',
  },

  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
})

export default memo(ProfilePhoneCard)
