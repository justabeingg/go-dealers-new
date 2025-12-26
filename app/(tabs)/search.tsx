import { View, Text, TextInput, FlatList, ActivityIndicator, Keyboard } from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { router, useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'
import PhoneCard from '../../components/feed/PhoneCard'
import { Ionicons } from '@expo/vector-icons'

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const [allPosts, setAllPosts] = useState<any[]>([])
  const [filteredPosts, setFilteredPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null)

  useEffect(() => {
    fetchAllPosts()
  }, [])

  // Reset search when tab is clicked again
  useEffect(() => {
    const interval = setInterval(() => {
      if ((globalThis as any).__RESET_SEARCH__) {
        ;(globalThis as any).__RESET_SEARCH__ = false
        setSearchQuery('')
        setFilteredPosts([])
        setExpandedPostId(null)
        Keyboard.dismiss()
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  const fetchAllPosts = async () => {
    setLoading(true)

    const { data, error } = await supabase
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
          profile_image
        )
      `
      )
      .order('created_at', { ascending: false })

    if (!error && data) {
      setAllPosts(data)
    }

    setLoading(false)
  }

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)

    if (query.trim() === '') {
      setFilteredPosts([])
      setSearching(false)
      return
    }

    setSearching(true)

    // Split search query into words
    const searchWords = query.toLowerCase().trim().split(/\s+/)

    // Score each post based on matches
    const scoredPosts = allPosts.map(post => {
      const productName = (post.product_name || '').toLowerCase()
      const description = (post.description || '').toLowerCase()
      const shopName = (post.profiles?.shop_name || '').toLowerCase()
      const city = (post.profiles?.city || '').toLowerCase()
      const allText = `${productName} ${description} ${shopName} ${city}`

      // Check if ALL search words are present
      const hasAllWords = searchWords.every(word => allText.includes(word))

      if (!hasAllWords) {
        return { ...post, searchScore: 0 }
      }

      let score = 0

      searchWords.forEach(word => {
        // Product name matches (highest weight)
        if (productName.includes(word)) {
          score += 10
        }

        // Description matches (high weight)
        if (description.includes(word)) {
          score += 5
        }

        // Shop name matches (medium weight)
        if (shopName.includes(word)) {
          score += 3
        }

        // City matches (low weight)
        if (city.includes(word)) {
          score += 2
        }

        // Exact word matches get bonus
        const words = allText.split(/\s+/)
        if (words.includes(word)) {
          score += 3
        }
      })

      return { ...post, searchScore: score }
    })

    // Filter posts with score > 0 and sort by score
    const results = scoredPosts
      .filter(post => post.searchScore > 0)
      .sort((a, b) => b.searchScore - a.searchScore)

    setFilteredPosts(results)
    setSearching(false)
  }, [allPosts])

  const handleCardPress = useCallback((postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null)
    } else {
      setExpandedPostId(postId)
    }
  }, [expandedPostId])

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

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
      {/* Header */}
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
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 24,
            fontWeight: '700',
            marginBottom: 12,
          }}
        >
          Search Products
        </Text>

        {/* Search Input */}
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
            placeholder="Search by model, specs, color, storage..."
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
                Keyboard.dismiss()
              }}
            />
          )}
        </View>

        {/* Search Stats */}
        {searchQuery.trim() !== '' && (
          <Text
            style={{
              color: '#9CA3AF',
              fontSize: 13,
              marginTop: 8,
            }}
          >
            {searching
              ? 'Searching...'
              : `${filteredPosts.length} result${filteredPosts.length !== 1 ? 's' : ''} found`}
          </Text>
        )}
      </View>

      {/* Results */}
      {searchQuery.trim() === '' ? (
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
            Search for products by model, storage, color, condition, or any other detail
          </Text>
        </View>
      ) : filteredPosts.length === 0 ? (
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
              lineHeight: 22,
            }}
          >
            No products found for "{searchQuery}"
          </Text>
          <Text
            style={{
              color: '#6B7280',
              fontSize: 14,
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            Try different keywords or check spelling
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PhoneCard
              model={item.product_name}
              description={item.description}
              price={item.price}
              hidePrice={item.hide_price}
              imageUrls={item.media_urls || []}
              shopName={item.profiles?.shop_name}
              city={item.profiles?.city}
              profileImage={item.profiles?.profile_image}
              userId={item.user_id}
              isExpanded={expandedPostId === item.id}
              onPress={() => handleCardPress(item.id)}
              onProfilePress={(userId) => {
                router.push(`/other-profile/${userId}`)
              }}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 100,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  )
}
