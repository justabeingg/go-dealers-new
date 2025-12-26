import {
  View,
  StatusBar,
  FlatList,
  ActivityIndicator,
  BackHandler,
  Pressable,
  Text,
  Modal,
} from 'react-native'
import { useEffect, useState, useCallback } from 'react'
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'

import ProfilePostsGrid from '../../components/profile/ProfilePostsGrid'
import ProfilePhoneCard from '../../components/profile/ProfilePhoneCard'

type ConnectionStatus = 'loading' | 'none' | 'pending' | 'connected' | 'sent'

export default function OtherProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const router = useRouter()

  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [focusedPostId, setFocusedPostId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('loading')
  const [disconnectModalVisible, setDisconnectModalVisible] = useState(false)

  /* ---------------- FETCH PROFILE ---------------- */
  const fetchProfile = async () => {
    if (!userId) return

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    setProfile(profileData)
    setPosts(postsData || [])
    setLoading(false)
  }

  /* ---------------- CONNECTION STATUS ---------------- */
  const checkConnectionStatus = async () => {
    setConnectionStatus('loading')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !userId) {
      setConnectionStatus('none')
      return
    }

    const { data } = await supabase
      .from('dealer_network')
      .select('status, sender_id, receiver_id')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`
      )
      .maybeSingle()

    if (!data) {
      setConnectionStatus('none')
    } else if (data.status === 'accepted') {
      setConnectionStatus('connected')
    } else if (data.status === 'pending') {
      // Check if current user sent the request
      if (data.sender_id === user.id) {
        setConnectionStatus('sent')
      } else {
        setConnectionStatus('pending')
      }
    }
  }

  const sendConnectionRequest = async () => {
    console.log('🔵 Connect button pressed!')
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !userId) {
      console.log('❌ No user or userId')
      return
    }

    console.log('📤 Sending connection request from', user.id, 'to', userId)

    const { error } = await supabase.from('dealer_network').insert({
      sender_id: user.id,
      receiver_id: userId,
      status: 'pending',
    })

    if (!error) {
      console.log('✅ Request sent successfully!')
      setConnectionStatus('sent')
    } else {
      console.log('❌ Error sending request:', error)
    }
  }

  const cancelConnectionRequest = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !userId) return

    // Delete the pending request
    await supabase
      .from('dealer_network')
      .delete()
      .eq('sender_id', user.id)
      .eq('receiver_id', userId)
      .eq('status', 'pending')

    setConnectionStatus('none')
  }

  const confirmDisconnect = () => {
    setDisconnectModalVisible(true)
  }

  const removeConnection = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !userId) return

    // Delete the connection
    await supabase
      .from('dealer_network')
      .delete()
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`
      )

    // Connection counts are automatically updated by database trigger!
    // No need to manually decrement

    setConnectionStatus('none')
    setDisconnectModalVisible(false)
    fetchProfile() // Refresh to get updated connection count
  }

  useEffect(() => {
    fetchProfile()
    checkConnectionStatus()
  }, [userId])

  /* ---------------- BACK → GRID ---------------- */
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
     POST SCROLL VIEW
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
     PROFILE VIEW
     ================================================= */
  return (
    <View style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
      <StatusBar hidden={false} />

      {/* CUSTOM HEADER (without edit button) */}
      <View style={{ backgroundColor: '#0B0F1A' }}>
        {/* Back Button */}
        <View style={{ paddingTop: 50, paddingHorizontal: 20, paddingBottom: 12 }}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color="#FFF" />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
          {/* Profile Picture */}
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
            {profile.profile_image ? (
              <Image
                source={{ uri: profile.profile_image }}
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
                {profile.shop_name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>

          {/* Shop Name */}
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 24,
              fontWeight: '800',
              marginBottom: 4,
            }}
          >
            {profile.shop_name}
          </Text>

          {/* Location */}
          <Text style={{ color: '#6C8CFF', fontSize: 15, marginBottom: 12 }}>
            📍 {profile.city}
          </Text>

          {/* Connection Count */}
          {profile.connection_count > 0 && (
            <Pressable
              onPress={() => router.push(`/connections/${profile.id}`)}
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
              }, pressed && {
                transform: [{ scale: 0.98 }],
                backgroundColor: '#1F2937',
              }]}
            >
              <View>
                <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 2 }}>
                  Connections
                </Text>
                <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '800' }}>
                  {profile.connection_count}
                </Text>
              </View>
              <Text style={{ color: '#6C8CFF', fontSize: 13 }}>
                View all →
              </Text>
            </Pressable>
          )}

          {/* Bio */}
          {profile.description && (
            <Text
              style={{
                color: '#E5E7EB',
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 16,
              }}
            >
              {profile.description}
            </Text>
          )}

          {/* CONNECTION BUTTON */}
          {connectionStatus === 'loading' ? (
            <View
              style={{
                backgroundColor: '#374151',
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <ActivityIndicator color="#FFF" size="small" />
            </View>
          ) : connectionStatus === 'connected' ? (
            <Pressable
              onPress={confirmDisconnect}
              style={({ pressed }) => ({
                backgroundColor: '#1F2937',
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                opacity: pressed ? 0.8 : 1,
                borderWidth: 1,
                borderColor: '#10B981',
              })}
            >
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text
                style={{
                  color: '#10B981',
                  fontSize: 15,
                  fontWeight: '700',
                }}
              >
                Connected
              </Text>
            </Pressable>
          ) : connectionStatus === 'sent' ? (
            <Pressable
              onPress={cancelConnectionRequest}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#1F2937' : '#374151',
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
              })}
            >
              <Text
                style={{
                  color: '#9CA3AF',
                  fontSize: 15,
                  fontWeight: '700',
                }}
              >
                Cancel Request
              </Text>
            </Pressable>
          ) : connectionStatus === 'pending' ? (
            <View
              style={{
                backgroundColor: '#F59E0B',
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: '#FFF',
                  fontSize: 15,
                  fontWeight: '700',
                }}
              >
                Pending Request (Check Requests Tab)
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={sendConnectionRequest}
              style={({ pressed }) => ({
                backgroundColor: '#6C8CFF',
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Ionicons name="person-add" size={20} color="#FFF" />
              <Text
                style={{
                  color: '#FFF',
                  fontSize: 15,
                  fontWeight: '700',
                }}
              >
                Connect
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
            Products
          </Text>
        </View>
      </View>

      <ProfilePostsGrid
        userId={profile.id}
        onPostPress={postId => setFocusedPostId(postId)}
      />

      {/* DISCONNECT CONFIRMATION MODAL */}
      <Modal visible={disconnectModalVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: '#12182B',
              padding: 24,
              borderRadius: 16,
              width: '80%',
            }}
          >
            <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
              Disconnect from {profile.shop_name}?
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 14, marginBottom: 16 }}>
              This will remove the connection for both of you.
            </Text>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => setDisconnectModalVisible(false)}
                style={{
                  flex: 1,
                  padding: 10,
                  backgroundColor: '#374151',
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFF' }}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={removeConnection}
                style={{
                  flex: 1,
                  padding: 10,
                  backgroundColor: '#EF4444',
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFF' }}>Disconnect</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

