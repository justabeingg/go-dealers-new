import {
  View,
  Text,
  StatusBar,
  FlatList,
  BackHandler,
  ActivityIndicator,
  TextInput,
  Keyboard,
  Pressable,
} from 'react-native'
import { useEffect, useState, useCallback, useRef } from 'react'
import { Image } from 'expo-image'
import { useFocusEffect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import { supabase } from '../../lib/supabase'
import ProfilePostsGrid from '../../components/profile/ProfilePostsGrid'
import ProfilePhoneCard from '../../components/profile/ProfilePhoneCard'
import EditProfileModal from '../../components/modals/EditProfileModal'
import ProfileImagePickerModal from '../../components/modals/ProfileImagePickerModal'

export default function ProfileScreen() {
  const router = useRouter()
  const scrollViewRef = useRef<FlatList>(null)

  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [focusedPostId, setFocusedPostId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [editModalVisible, setEditModalVisible] = useState(false)
  const [imagePickerVisible, setImagePickerVisible] = useState(false)

  // search
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredPosts, setFilteredPosts] = useState<any[]>([])

  /* ---------------- FETCH DATA ---------------- */
  const fetchProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setProfile(profileData)
    setPosts(postsData || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchProfile()
    }, [])
  )

  /* ---------------- BACK HANDLING ---------------- */
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (focusedPostId) {
          setFocusedPostId(null)
          return true
        }
        return false
      }

      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      )
      return () => sub.remove()
    }, [focusedPostId])
  )

  /* -------- PROFILE TAB RE-TAP → GRID -------- */
  useEffect(() => {
    const interval = setInterval(() => {
      if ((globalThis as any).__GO_BACK_TO_PROFILE_GRID__) {
        ;(globalThis as any).__GO_BACK_TO_PROFILE_GRID__ = false
        setFocusedPostId(null)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  /* ---------------- DELETE POST ---------------- */
  const handleDeletePost = async (postId: string) => {
    try {
      // Find the post to get image URLs
      const postToDelete = posts.find(p => p.id === postId)
      
      // Delete from database (this will also delete from feed)
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) {
        console.error('Error deleting post:', error)
        return
      }

      // Delete images from Cloudinary if they exist
      if (postToDelete?.media_urls && postToDelete.media_urls.length > 0) {
        // Call edge function to delete Cloudinary images
        await fetch(
          `https://afbmpqgyghuccdimacpn.supabase.co/functions/v1/delete-cloudinary-images`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmYm1wcWd5Z2h1Y2NkaW1hY3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMDQ2ODEsImV4cCI6MjA4MTc4MDY4MX0.VBYJOqALBTWSpjSVCmpCRE5o5zbj6e91uWk_wx41yf0`,
            },
            body: JSON.stringify({ imageUrls: postToDelete.media_urls }),
          }
        )
      }

      // Update local state
      setPosts(posts.filter(p => p.id !== postId))
      setFilteredPosts(filteredPosts.filter(p => p.id !== postId))
      
      // If we're viewing this post, go back to grid
      if (focusedPostId === postId) {
        setFocusedPostId(null)
      }
    } catch (error) {
      console.error('Error in handleDeletePost:', error)
    }
  }

  /* ---------------- SEARCH ---------------- */
  const handleSearch = (query: string) => {
    setSearchQuery(query)

    if (!query.trim()) {
      setFilteredPosts([])
      return
    }

    const q = query.toLowerCase()
    setFilteredPosts(
      posts.filter(
        p =>
          p.product_name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      )
    )
  }

  /* ---------------- LOADING ---------------- */
  if (loading || !profile) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0B0F1A',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#6C8CFF" />
      </View>
    )
  }

  /* =================================================
     SCROLL VIEW (POST FOCUSED)
     ================================================= */
  if (focusedPostId) {
    const focusedIndex = posts.findIndex(p => p.id === focusedPostId)
    
    return (
      <View style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
        <StatusBar hidden={false} />

        <FlatList
          ref={scrollViewRef}
          data={posts}
          keyExtractor={item => item.id}
          initialScrollIndex={focusedIndex >= 0 ? focusedIndex : 0}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 24,
            paddingBottom: 110,
          }}
          // Smart height estimation for smooth scrolling
          getItemLayout={(data, index) => {
            // Base height: 260px (image) + 60px (header) + 80px (content) = 400px
            // Plus extra for description (estimate ~50px per 100 chars)
            const item = data?.[index]
            const descLength = item?.description?.length || 0
            const extraHeight = Math.ceil(descLength / 100) * 50
            const estimatedHeight = 400 + extraHeight
            
            return {
              length: estimatedHeight,
              offset: estimatedHeight * index,
              index,
            }
          }}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={10}
          onScrollToIndexFailed={info => {
            // If scroll fails, wait and try again
            const wait = new Promise(resolve => setTimeout(resolve, 150))
            wait.then(() => {
              scrollViewRef.current?.scrollToIndex({
                index: info.index,
                animated: false,
              })
            })
          }}
          renderItem={({ item }) => (
            <ProfilePhoneCard
              postId={item.id}
              model={item.product_name}
              description={item.description}
              price={item.price}
              hidePrice={item.hide_price}
              imageUrls={item.media_urls || []}
              shopName={profile.shop_name}
              city={profile.city}
              profileImage={profile.profile_image}
              onDelete={handleDeletePost}
            />
          )}
        />
      </View>
    )
  }

  /* =================================================
     GRID VIEW (DEFAULT)
     ================================================= */
  return (
    <>
      <View style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
        <StatusBar hidden={false} />

        {/* HEADER */}
        <View style={{ paddingTop: 50, paddingHorizontal: 20 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable onPress={() => setImagePickerVisible(true)}>
                <Image
                  source={{ uri: profile.profile_image }}
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 35,
                    backgroundColor: '#1F2937',
                  }}
                />
              </Pressable>
              <View style={{ marginLeft: 12 }}>
                <Text
                  style={{
                    color: '#FFF',
                    fontSize: 20,
                    fontWeight: '700',
                  }}
                >
                  {profile.shop_name}
                </Text>
                <Text style={{ color: '#6C8CFF' }}>
                  📍 {profile.city}
                </Text>
              </View>
            </View>

            {/* CONNECTION COUNT */}
            <Pressable
              onPress={() =>
                router.push(`/connections/${profile.id}`)
              }
              style={{ alignItems: 'center' }}
            >
              <Text
                style={{
                  color: '#FFF',
                  fontSize: 18,
                  fontWeight: '700',
                }}
              >
                {profile.connection_count ?? 0}
              </Text>
              <Text
                style={{
                  color: '#9CA3AF',
                  fontSize: 12,
                }}
              >
                Connections
              </Text>
            </Pressable>
          </View>

          {/* SEARCH */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#12182B',
              borderRadius: 10,
              paddingHorizontal: 12,
            }}
          >
            <Ionicons name="search" size={16} color="#6B7280" />
            <TextInput
              placeholder="Search your inventory…"
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={handleSearch}
              style={{ flex: 1, color: '#FFF', padding: 10 }}
            />
            {searchQuery.length > 0 && (
              <Ionicons
                name="close-circle"
                size={16}
                color="#6B7280"
                onPress={() => {
                  setSearchQuery('')
                  setFilteredPosts([])
                  Keyboard.dismiss()
                }}
              />
            )}
          </View>
        </View>

        {searchQuery.trim() ? (
          <FlatList
            data={filteredPosts}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 110 }}
            renderItem={({ item }) => (
              <ProfilePhoneCard
                postId={item.id}
                model={item.product_name}
                description={item.description}
                price={item.price}
                hidePrice={item.hide_price}
                imageUrls={item.media_urls || []}
                shopName={profile.shop_name}
                city={profile.city}
                profileImage={profile.profile_image}
                onDelete={handleDeletePost}
              />
            )}
          />
        ) : (
          <ProfilePostsGrid
            userId={profile.id}
            onPostPress={postId => setFocusedPostId(postId)}
            onPostDelete={handleDeletePost}
          />
        )}
      </View>

      {/* MODALS */}
      <EditProfileModal
        visible={editModalVisible}
        shopName={profile.shop_name}
        city={profile.city}
        phone={profile.phone}
        email={profile.email}
        description={profile.description}
        onClose={() => setEditModalVisible(false)}
        onSaved={fetchProfile}
      />

      <ProfileImagePickerModal
        visible={imagePickerVisible}
        currentImage={profile.profile_image}
        onClose={() => setImagePickerVisible(false)}
        onSaved={fetchProfile}
      />
    </>
  )
}
