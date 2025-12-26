import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Pressable,
  Linking,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { router } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import ProfilePhoneCard from '../../components/profile/ProfilePhoneCard'

export default function SearchScreen() {
  const [activeTab, setActiveTab] = useState<'products' | 'profiles'>('products')
  const [searchQuery, setSearchQuery] = useState('')
  
  const [allPosts, setAllPosts] = useState<any[]>([])
  const [allProfiles, setAllProfiles] = useState<any[]>([])
  
  const [filteredPosts, setFilteredPosts] = useState<any[]>([])
  const [filteredProfiles, setFilteredProfiles] = useState<any[]>([])
  
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    fetchAllData()
  }, [])

  // Reset search when tab is clicked again
  useEffect(() => {
    const interval = setInterval(() => {
      if ((globalThis as any).__RESET_SEARCH__) {
        ;(globalThis as any).__RESET_SEARCH__ = false
        setSearchQuery('')
        setFilteredPosts([])
        setFilteredProfiles([])
        setActiveTab('products')
        Keyboard.dismiss()
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  const fetchAllData = async () => {
    setLoading(true)

    // Fetch all posts
    const { data: postsData } = await supabase
      .from('posts')
      .select(
        `
        id,
        user_id,
        product_name,
        description,
        price,
        hide_price,
        media_urls,
        created_at,
        profiles (
          shop_name,
          city,
          profile_image,
          phone
        )
      `
      )
      .order('created_at', { ascending: false })

    // Fetch all profiles
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, shop_name, city, profile_image, phone, connection_count')
      .eq('approved', true)
      .order('shop_name', { ascending: true })

    setAllPosts(postsData || [])
    setAllProfiles(profilesData || [])
    setLoading(false)
  }

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)

      if (query.trim() === '') {
        setFilteredPosts([])
        setFilteredProfiles([])
        setSearching(false)
        return
      }

      setSearching(true)

      const searchWords = query.toLowerCase().trim().split(/\s+/)

      // Search Posts
      const scoredPosts = allPosts.map(post => {
        const productName = (post.product_name || '').toLowerCase()
        const description = (post.description || '').toLowerCase()
        const shopName = (post.profiles?.shop_name || '').toLowerCase()
        const city = (post.profiles?.city || '').toLowerCase()
        const allText = `${productName} ${description} ${shopName} ${city}`

        const hasAllWords = searchWords.every(word => allText.includes(word))
        if (!hasAllWords) return { ...post, searchScore: 0 }

        let score = 0
        searchWords.forEach(word => {
          if (productName.includes(word)) score += 10
          if (description.includes(word)) score += 5
          if (shopName.includes(word)) score += 3
          if (city.includes(word)) score += 2
        })

        return { ...post, searchScore: score }
      })

      const resultPosts = scoredPosts
        .filter(post => post.searchScore > 0)
        .sort((a, b) => b.searchScore - a.searchScore)

      // Search Profiles
      const scoredProfiles = allProfiles.map(profile => {
        const shopName = (profile.shop_name || '').toLowerCase()
        const city = (profile.city || '').toLowerCase()
        const allText = `${shopName} ${city}`

        const hasAllWords = searchWords.every(word => allText.includes(word))
        if (!hasAllWords) return { ...profile, searchScore: 0 }

        let score = 0
        searchWords.forEach(word => {
          if (shopName.includes(word)) score += 10
          if (city.includes(word)) score += 2
        })

        return { ...profile, searchScore: score }
      })

      const resultProfiles = scoredProfiles
        .filter(profile => profile.searchScore > 0)
        .sort((a, b) => b.searchScore - a.searchScore)

      setFilteredPosts(resultPosts)
      setFilteredProfiles(resultProfiles)
      setSearching(false)
    },
    [allPosts, allProfiles]
  )

  const openWhatsApp = (phone: string, productName: string) => {
    const message = `Hi, I'm interested in ${productName}`
    const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`
    Linking.openURL(url).catch(() => {
      alert('WhatsApp is not installed')
    })
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0B0F1A',
        }}
      >
        <ActivityIndicator color="#6C8CFF" size="large" />
      </View>
    )
  }

  const hasResults = searchQuery.trim() !== ''
  const productsCount = filteredPosts.length
  const profilesCount = filteredProfiles.length

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
      {/* Search Input */}
      <View
        style={{
          paddingTop: 50,
          paddingBottom: 16,
          paddingHorizontal: 16,
          backgroundColor: '#0B0F1A',
          borderBottomWidth: 1,
          borderBottomColor: '#1F2937',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#12182B',
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 4,
          }}
        >
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            placeholder="Search products or shops..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={handleSearch}
            style={{
              flex: 1,
              color: '#FFFFFF',
              fontSize: 16,
              paddingVertical: 12,
              paddingHorizontal: 10,
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Ionicons
              name="close-circle"
              size={20}
              color="#6B7280"
              onPress={() => {
                setSearchQuery('')
                setFilteredPosts([])
                setFilteredProfiles([])
                Keyboard.dismiss()
              }}
            />
          )}
        </View>
      </View>

      {/* Tabs */}
      {hasResults && (
        <View
          style={{
            flexDirection: 'row',
            borderBottomWidth: 1,
            borderBottomColor: '#1F2937',
            backgroundColor: '#0B0F1A',
          }}
        >
          <Pressable
            onPress={() => setActiveTab('products')}
            style={{
              flex: 1,
              paddingVertical: 14,
              alignItems: 'center',
              borderBottomWidth: 2,
              borderBottomColor: activeTab === 'products' ? '#6C8CFF' : 'transparent',
            }}
          >
            <Text
              style={{
                color: activeTab === 'products' ? '#6C8CFF' : '#9CA3AF',
                fontSize: 15,
                fontWeight: '600',
              }}
            >
              Products ({productsCount})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('profiles')}
            style={{
              flex: 1,
              paddingVertical: 14,
              alignItems: 'center',
              borderBottomWidth: 2,
              borderBottomColor: activeTab === 'profiles' ? '#6C8CFF' : 'transparent',
            }}
          >
            <Text
              style={{
                color: activeTab === 'profiles' ? '#6C8CFF' : '#9CA3AF',
                fontSize: 15,
                fontWeight: '600',
              }}
            >
              Shops ({profilesCount})
            </Text>
          </Pressable>
        </View>
      )}

      {/* Results */}
      {!hasResults ? (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 40,
          }}
        >
          <Ionicons name="search" size={64} color="#374151" />
          <Text
            style={{
              color: '#9CA3AF',
              fontSize: 16,
              textAlign: 'center',
              marginTop: 16,
              lineHeight: 22,
            }}
          >
            Search for products or shops
          </Text>
        </View>
      ) : activeTab === 'products' ? (
        productsCount === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 40,
            }}
          >
            <Ionicons name="sad-outline" size={64} color="#374151" />
            <Text
              style={{
                color: '#9CA3AF',
                fontSize: 16,
                textAlign: 'center',
                marginTop: 16,
              }}
            >
              No products found
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredPosts}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 10, paddingBottom: 100 }}
            renderItem={({ item }) => (
              <View style={{ marginBottom: 10 }}>
                <ProfilePhoneCard
                  model={item.product_name}
                  description={item.description}
                  price={item.price}
                  hidePrice={item.hide_price}
                  imageUrls={item.media_urls || []}
                  shopName={item.profiles?.shop_name}
                  city={item.profiles?.city}
                  profileImage={item.profiles?.profile_image}
                  showWhatsApp={true}
                  onWhatsAppPress={() =>
                    openWhatsApp(item.profiles?.phone, item.product_name)
                  }
                  onProfilePress={() => router.push(`/other-profile/${item.user_id}`)}
                />
              </View>
            )}
          />
        )
      ) : (
        // Profiles Tab
        profilesCount === 0 ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 40,
            }}
          >
            <Ionicons name="sad-outline" size={64} color="#374151" />
            <Text
              style={{
                color: '#9CA3AF',
                fontSize: 16,
                textAlign: 'center',
                marginTop: 16,
              }}
            >
              No shops found
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredProfiles}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push(`/other-profile/${item.id}`)}
                style={{
                  backgroundColor: '#12182B',
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#1F2937',
                }}
              >
                <Image
                  source={{ uri: item.profile_image }}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: '#1F2937',
                  }}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '600' }}>
                    {item.shop_name}
                  </Text>
                  <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 2 }}>
                    📍 {item.city}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: '#6C8CFF', fontSize: 14, fontWeight: '600' }}>
                    {item.connection_count || 0}
                  </Text>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>Connections</Text>
                </View>
              </Pressable>
            )}
          />
        )
      )}
    </View>
  )
}
