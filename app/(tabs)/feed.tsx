import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import PhoneCard from '../../components/feed/PhoneCard'
import LoadingScreen from '../../components/ui/LoadingScreen'
import { SCREEN } from '../../constants/layout'





// import { View, FlatList, RefreshControl } from 'react-native'
// import { useEffect, useState, useCallback } from 'react'
// import { router } from 'expo-router'
// import { supabase } from '../../lib/supabase'
// import PhoneCard from '../../components/feed/PhoneCard'
// import LoadingScreen from '../../components/ui/LoadingScreen'
// import { SCREEN } from '../../constants/layout'

// export default function FeedScreen() {
//   const [posts, setPosts] = useState<any[]>([])
//   const [loading, setLoading] = useState(true)
//   const [refreshing, setRefreshing] = useState(false)

//   const fetchPosts = async () => {
//     const { data } = await supabase
//       .from('posts')
//       .select(`
//         id,
//         user_id,
//         product_name,
//         description,
//         price,
//         hide_price,
//         media_urls,
//         profiles (
//           shop_name,
//           city,
//           profile_image,
//           phone
//         )
//       `)
//       .order('created_at', { ascending: false })

//     setPosts(data || [])
//     setLoading(false)
//     setRefreshing(false)
//   }

//   useEffect(() => {
//     fetchPosts()
//   }, [])

//   const onRefresh = useCallback(() => {
//     setRefreshing(true)
//     fetchPosts()
//   }, [])

//   if (loading) return <LoadingScreen />

//   return (
//     <View style={{ flex: 1, backgroundColor: '#000' }}>
//       <FlatList
//         data={posts}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <PhoneCard
//             model={item.product_name}
//             description={item.description}
//             price={item.price}
//             hidePrice={item.hide_price}
//             imageUrls={item.media_urls}
//             shopName={item.profiles?.shop_name}
//             city={item.profiles?.city}
//             profileImage={item.profiles?.profile_image}
//             phone={item.profiles?.phone}
//             userId={item.user_id}
//             onProfilePress={(userId) => {
//               router.push(`/other-profile/${userId}`)
//             }}
//           />
//         )}
//         pagingEnabled
//         snapToInterval={SCREEN.HEIGHT}
//         snapToAlignment="start"
//         decelerationRate="fast"
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//           />
//         }
//         getItemLayout={(_, index) => ({
//           length: SCREEN.HEIGHT,
//           offset: SCREEN.HEIGHT * index,
//           index,
//         })}
//       />
//     </View>
//   )
// }










/////////

// ============================================
// OLD WORKING CODE - KEEP THIS SAFE!
// If new version breaks, uncomment this
// ============================================
// import { View, FlatList, RefreshControl } from 'react-native'
// import { useEffect, useState, useCallback } from 'react'
// import { router } from 'expo-router'
// import { supabase } from '../../lib/supabase'
// import PhoneCard from '../../components/feed/PhoneCard'
// import LoadingScreen from '../../components/ui/LoadingScreen'
// import { SCREEN } from '../../constants/layout'

// export default function FeedScreen() {
//   const [posts, setPosts] = useState<any[]>([])
//   const [loading, setLoading] = useState(true)
//   const [refreshing, setRefreshing] = useState(false)
//   const [myUserId, setMyUserId] = useState<string | null>(null)

//   const fetchPosts = async () => {
//     const { data } = await supabase
//       .from('posts')
//       .select(`
//         id,
//         user_id,
//         product_name,
//         description,
//         price,
//         hide_price,
//         media_urls,
//         profiles (
//           shop_name,
//           city,
//           profile_image,
//           phone
//         )
//       `)
//       .order('created_at', { ascending: false })

//     setPosts(data || [])
//     setLoading(false)
//     setRefreshing(false)
//   }

//   useEffect(() => {
//     const init = async () => {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser()

//       setMyUserId(user?.id ?? null)
//       fetchPosts()
//     }

//     init()
//   }, [])

//   const onRefresh = useCallback(() => {
//     setRefreshing(true)
//     fetchPosts()
//   }, [])

//   if (loading) return <LoadingScreen />

//   return (
//     <View style={{ flex: 1, backgroundColor: '#000' }}>
//       <FlatList
//         data={posts}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <PhoneCard
//             model={item.product_name}
//             description={item.description}
//             price={item.price}
//             hidePrice={item.hide_price}
//             imageUrls={item.media_urls}
//             shopName={item.profiles?.shop_name}
//             city={item.profiles?.city}
//             profileImage={item.profiles?.profile_image}
//             phone={item.profiles?.phone}
//             userId={item.user_id}
//             onProfilePress={(userId) => {
//               if (!myUserId) return

//               if (userId === myUserId) {
//                 router.replace('/(tabs)/profile')
//               } else {
//                 router.push(`/other-profile/${userId}`)
//               }
//             }}
//           />
//         )}
//         pagingEnabled
//         snapToInterval={SCREEN.HEIGHT}
//         snapToAlignment="start"
//         decelerationRate="fast"
//         showsVerticalScrollIndicator={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//           />
//         }
//         getItemLayout={(_, index) => ({
//           length: SCREEN.HEIGHT,
//           offset: SCREEN.HEIGHT * index,
//           index,
//         })}
//       />
//     </View>
//   )
// }
// ============================================
// END OLD CODE
// ============================================


// ============================================
// NEW VERSION WITH FEED/CONNECTIONS TABS
// ============================================
import { View, FlatList, RefreshControl, Pressable, Text } from 'react-native'
import { useEffect, useState, useCallback, useRef } from 'react'

type FeedMode = 'all' | 'connections'

export default function FeedScreen() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [feedMode, setFeedMode] = useState<FeedMode>('all')
  const [connectedUserIds, setConnectedUserIds] = useState<string[]>([])
  
  const flatListRef = useRef<FlatList>(null)

  // Listen for feed tab tap (refresh + scroll to top)
  useEffect(() => {
    const interval = setInterval(() => {
      if ((globalThis as any).__REFRESH_FEED__) {
        ;(globalThis as any).__REFRESH_FEED__ = false
        refreshAndScrollToTop()
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  // Fetch connected user IDs
  const fetchConnections = async (userId: string) => {
    const { data } = await supabase
      .from('dealer_network')
      .select('sender_id, receiver_id')
      .eq('status', 'accepted')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)

    if (data) {
      const ids = data.map(row => 
        row.sender_id === userId ? row.receiver_id : row.sender_id
      )
      setConnectedUserIds(ids)
    }
  }

  // Fetch all posts
  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select(`
        id,
        user_id,
        product_name,
        description,
        price,
        hide_price,
        media_urls,
        profiles (
          shop_name,
          city,
          profile_image,
          phone
        )
      `)
      .order('created_at', { ascending: false })

    setPosts(data || [])
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setMyUserId(user.id)
        await fetchConnections(user.id)
      }
      
      await fetchPosts()
    }

    init()
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchPosts()
  }, [])

  // Refresh and scroll to top (when feed icon tapped)
  const refreshAndScrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true })
    setRefreshing(true)
    fetchPosts()
  }, [])

  // Filter posts based on mode
  const displayedPosts = feedMode === 'all' 
    ? posts 
    : posts.filter(post => connectedUserIds.includes(post.user_id))

  if (loading) return <LoadingScreen />

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* HEADER WITH TABS */}
      <View
        style={{
          position: 'absolute',
          top: 50,
          left: 0,
          right: 0,
          zIndex: 10,
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 12,
          paddingHorizontal: 20,
        }}
      >
        <Pressable
          onPress={() => {
            setFeedMode('all')
            flatListRef.current?.scrollToOffset({ offset: 0, animated: false })
          }}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 20,
            borderRadius: 20,
            backgroundColor: feedMode === 'all' ? '#6C8CFF' : 'rgba(255,255,255,0.1)',
          }}
        >
          <Text
            style={{
              color: '#FFF',
              fontWeight: feedMode === 'all' ? '700' : '500',
              fontSize: 14,
            }}
          >
            Feed
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setFeedMode('connections')
            flatListRef.current?.scrollToOffset({ offset: 0, animated: false })
          }}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 20,
            borderRadius: 20,
            backgroundColor: feedMode === 'connections' ? '#6C8CFF' : 'rgba(255,255,255,0.1)',
          }}
        >
          <Text
            style={{
              color: '#FFF',
              fontWeight: feedMode === 'connections' ? '700' : '500',
              fontSize: 14,
            }}
          >
            Connections
          </Text>
        </Pressable>
      </View>

      {/* FEED LIST */}
      <FlatList
          ref={flatListRef}
          data={displayedPosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PhoneCard
              model={item.product_name}
              description={item.description}
              price={item.price}
              hidePrice={item.hide_price}
              imageUrls={item.media_urls}
              shopName={item.profiles?.shop_name}
              city={item.profiles?.city}
              profileImage={item.profiles?.profile_image}
              phone={item.profiles?.phone}
              userId={item.user_id}
              onProfilePress={(userId) => {
                if (!myUserId) return

                if (userId === myUserId) {
                  router.replace('/(tabs)/profile')
                } else {
                  router.push(`/other-profile/${userId}`)
                }
              }}
            />
          )}
          pagingEnabled
          snapToInterval={SCREEN.HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          getItemLayout={(_, index) => ({
            length: SCREEN.HEIGHT,
            offset: SCREEN.HEIGHT * index,
            index,
          })}
          ListEmptyComponent={
            <View style={{ height: SCREEN.HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#9CA3AF', fontSize: 16 }}>
                {feedMode === 'connections' 
                  ? 'No posts from your connections yet'
                  : 'No posts available'}
              </Text>
            </View>
          }
        />
      </View>
  )
}
