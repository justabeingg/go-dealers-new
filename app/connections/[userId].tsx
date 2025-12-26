import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  TextInput,
  Modal,
  Keyboard,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { Image } from 'expo-image'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'

type ConnectionItem = {
  id: string
  shop_name: string
  city: string
  profile_image: string | null
  connectionRowId: string
}

export default function ConnectionsScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()

  const [connections, setConnections] = useState<ConnectionItem[]>([])
  const [filteredConnections, setFilteredConnections] = useState<ConnectionItem[]>([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [disconnectModalVisible, setDisconnectModalVisible] = useState(false)
  const [selectedConnection, setSelectedConnection] = useState<ConnectionItem | null>(null)

  /* ---------------- FETCH CONNECTIONS ---------------- */
  const fetchConnections = async () => {
    if (!userId) return

    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    setCurrentUserId(user.id)

    const { data, error } = await supabase
      .from('dealer_network')
      .select(`
        id,
        sender_id,
        receiver_id
      `)
      .eq('status', 'accepted')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)

    console.log('🔍 Fetch connections - userId:', userId)
    console.log('📊 Raw data:', data)
    console.log('❌ Error:', error)

    if (!error && data && data.length > 0) {
      // Get all unique user IDs (excluding current user)
      const otherUserIds = data.map(row => 
        row.sender_id === userId ? row.receiver_id : row.sender_id
      )

      // Fetch all profiles at once
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, shop_name, city, profile_image')
        .in('id', otherUserIds)

      console.log('👥 Profiles data:', profilesData)

      if (profilesData) {
        const mapped = data
          .map((row: any): ConnectionItem | null => {
            const otherUserId = row.sender_id === userId ? row.receiver_id : row.sender_id
            const profile = profilesData.find(p => p.id === otherUserId)

            if (!profile) return null

            return {
              id: profile.id,
              shop_name: profile.shop_name,
              city: profile.city,
              profile_image: profile.profile_image,
              connectionRowId: row.id,
            }
          })
          .filter((item): item is ConnectionItem => item !== null)

        console.log('✅ Final mapped connections:', mapped)
        setConnections(mapped)
        setFilteredConnections(mapped)
      }
    } else {
      console.log('⚠️ No connections found')
      setConnections([])
      setFilteredConnections([])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchConnections()
  }, [userId])

  /* ---------------- SEARCH ---------------- */
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)

      if (!query.trim()) {
        setFilteredConnections(connections)
        return
      }

      const q = query.toLowerCase()
      setFilteredConnections(
        connections.filter(
          c =>
            c.shop_name.toLowerCase().includes(q) ||
            c.city.toLowerCase().includes(q)
        )
      )
    },
    [connections]
  )

  /* ---------------- DISCONNECT ---------------- */
  const confirmDisconnect = (connection: ConnectionItem) => {
    setSelectedConnection(connection)
    setDisconnectModalVisible(true)
  }

  const handleDisconnect = async () => {
    if (!selectedConnection || !currentUserId) return

    try {
      // Delete the connection from dealer_network
      const { error: deleteError } = await supabase
        .from('dealer_network')
        .delete()
        .eq('id', selectedConnection.connectionRowId)

      if (deleteError) {
        console.error('Error deleting connection:', deleteError)
        return
      }

      // Connection counts are automatically updated by database trigger!
      // No need to manually decrement

      // Close modal and refresh the list
      setDisconnectModalVisible(false)
      setSelectedConnection(null)
      
      // Refresh connections list
      await fetchConnections()
      
    } catch (error) {
      console.error('Unexpected error during disconnect:', error)
    }
  }

  /* ---------------- LOADING ---------------- */
  if (loading) {
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

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0F1A' }}>
      {/* HEADER */}
      <View style={{ paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16 }}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
        </Pressable>

        <Text
          style={{
            color: '#FFF',
            fontSize: 22,
            fontWeight: '700',
            marginTop: 8,
            marginBottom: 4,
          }}
        >
          Connections
        </Text>
        
        {/* Connection Count */}
        <Text
          style={{
            color: '#9CA3AF',
            fontSize: 14,
          }}
        >
          {connections.length} connection{connections.length !== 1 ? 's' : ''}
        </Text>

        {/* SEARCH */}
        <View
          style={{
            marginTop: 12,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#12182B',
            borderRadius: 10,
            paddingHorizontal: 12,
          }}
        >
          <Ionicons name="search" size={16} color="#6B7280" />
          <TextInput
            placeholder="Search connections"
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
                setFilteredConnections(connections)
                Keyboard.dismiss()
              }}
            />
          )}
        </View>
      </View>

      {/* LIST */}
      <FlatList
        data={filteredConnections}
        keyExtractor={item => item.connectionRowId}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <Text
            style={{
              color: '#9CA3AF',
              textAlign: 'center',
              marginTop: 40,
            }}
          >
            No connections found
          </Text>
        }
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: '#12182B',
              margin: 16,
              padding: 16,
              borderRadius: 14,
              flexDirection: 'row',
            }}
          >
            <Pressable onPress={() => router.push(`/other-profile/${item.id}`)}>
              <Image
                source={
                  item.profile_image
                    ? { uri: item.profile_image }
                    : undefined
                }
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: '#1F2937',
                }}
              />
            </Pressable>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>
                {item.shop_name}
              </Text>
              <Text style={{ color: '#9CA3AF' }}>{item.city}</Text>

              <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
                <Pressable
                  disabled={true}
                  style={{
                    flex: 1,
                    backgroundColor: '#1F2937',
                    padding: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                    opacity: 0.5,
                  }}
                >
                  <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '600' }}>💬 Message</Text>
                </Pressable>

                <Pressable
                  onPress={() => confirmDisconnect(item)}
                  style={({ pressed }) => ({
                    flex: 1,
                    backgroundColor: pressed ? '#7F1D1D' : '#991B1B',
                    padding: 10,
                    borderRadius: 8,
                    alignItems: 'center',
                  })}
                >
                  <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600' }}>🔌 Disconnect</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />

      {/* MODAL */}
      <Modal visible={disconnectModalVisible} transparent>
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
              Disconnect from {selectedConnection?.shop_name}?
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
                onPress={handleDisconnect}
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
