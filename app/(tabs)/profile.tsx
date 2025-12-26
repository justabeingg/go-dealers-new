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
import { useEffect, useState, useCallback } from 'react'
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
    const focusedIndex = posts.findIndex(
      p => p.id === focusedPostId
    )

    return (
      <View style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
        <StatusBar hidden={false} />

        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          initialScrollIndex={focusedIndex}
          getItemLayout={(_, index) => ({
            length: 380,
            offset: 380 * index,
            index,
          })}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 24,
            paddingBottom: 110,
          }}
          renderItem={({ item }) => (
            <ProfilePhoneCard
              model={item.product_name}
              description={item.description}
              price={item.price}
              hidePrice={item.hide_price}
              imageUrls={item.media_urls || []}
              shopName={profile.shop_name}
              city={profile.city}
              profileImage={profile.profile_image}
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
              <Image
                source={{ uri: profile.profile_image }}
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 35,
                  backgroundColor: '#1F2937',
                }}
              />
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
                model={item.product_name}
                description={item.description}
                price={item.price}
                hidePrice={item.hide_price}
                imageUrls={item.media_urls || []}
                shopName={profile.shop_name}
                city={profile.city}
                profileImage={profile.profile_image}
              />
            )}
          />
        ) : (
          <ProfilePostsGrid
            userId={profile.id}
            onPostPress={postId => setFocusedPostId(postId)}
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
