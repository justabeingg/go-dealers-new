import {
    View,
    Text,
    TextInput,
    Pressable,
    StyleSheet,
    ScrollView,
    Alert,
  } from 'react-native'
  import { useEffect, useState } from 'react'
  import { supabase } from '../lib/supabase'
  
  export default function AdminPanelScreen() {
    const [loading, setLoading] = useState(true)
    const [requests, setRequests] = useState<any[]>([])
    const [search, setSearch] = useState('')
  
    useEffect(() => {
      fetchPendingRequests()
    }, [])
  
    const fetchPendingRequests = async () => {
      setLoading(true)
  
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('approved', false)
        .eq('role', 'dealer')
        .order('created_at', { ascending: true })
  
      setRequests(data || [])
      setLoading(false)
    }
  
    // ✅ APPROVE
    const approveDealer = async (id: string) => {
      await supabase
        .from('profiles')
        .update({ approved: true })
        .eq('id', id)
  
      setRequests((prev) => prev.filter((u) => u.id !== id))
    }
  
    // ❌ REJECT (DEV MODE – secure later with Edge Function)
    const rejectDealer = async (id: string) => {
        try {
          const session = await supabase.auth.getSession()
          const accessToken = session.data.session?.access_token
      
          if (!accessToken) return
      
          const res = await fetch(
            "https://afbmpqgyghuccdimacpn.supabase.co/functions/v1/reject-dealer",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ userId: id }),
            }
          )
      
          const data = await res.json()
      
          if (data.success) {
            // ✅ REMOVE FROM UI
            setRequests((prev) => prev.filter((u) => u.id !== id))
          } else {
            console.log("Reject failed:", data)
          }
        } catch (err) {
          console.log("Reject error:", err)
        }
      }
      

      

      //logout
  
    const logout = async () => {
      await supabase.auth.signOut()
    }
  
    // 🔍 SEARCH FILTER
    const filteredRequests = requests.filter((item) => {
      const q = search.toLowerCase()
  
      return (
        item.owner_name?.toLowerCase().includes(q) ||
        item.shop_name?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.phone?.includes(q)
      )
    })
  
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Admin Panel</Text>
          <Text style={styles.subtitle}>Pending dealer requests</Text>
        </View>
  
        {/* Search */}
        <TextInput
          placeholder="Search by name, shop, phone, or email"
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
  
        {/* Content */}
        <View style={{ flex: 1 }}>
          {loading && (
            <Text style={styles.infoText}>Loading requests…</Text>
          )}
  
          {!loading && filteredRequests.length === 0 && (
            <Text style={styles.infoText}>
              No pending dealer requests
            </Text>
          )}
  
          {!loading && filteredRequests.length > 0 && (
            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredRequests.map((item) => (
                <View key={item.id} style={styles.card}>
                  <Text style={styles.owner}>{item.owner_name}</Text>
                  <Text style={styles.text}>{item.shop_name}</Text>
                  <Text style={styles.text}>{item.city}</Text>
  
                  <View style={styles.divider} />
  
                  <Text style={styles.text}>📞 {item.phone}</Text>
                  <Text style={styles.text}>✉️ {item.email}</Text>
  
                  <View style={styles.actions}>
                    <Pressable
                      onPress={() => approveDealer(item.id)}
                      style={({ pressed }) => [
                        styles.approveBtn,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.approveText}>Approve</Text>
                    </Pressable>
  
                    <Pressable
                      onPress={() => rejectDealer(item.id)}
                      style={({ pressed }) => [
                        styles.rejectBtn,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.rejectText}>Reject</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
  
        {/* Logout */}
        <Pressable
          onPress={logout}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>
    )
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#0B0F1A',
      padding: 24,
    },
  
    header: {
      marginTop: 40,
      marginBottom: 16,
    },
  
    title: {
      color: '#FFFFFF',
      fontSize: 26,
      fontWeight: '700',
    },
  
    subtitle: {
      color: '#9CA3AF',
      fontSize: 14,
    },
  
    searchInput: {
      backgroundColor: '#12182B',
      borderRadius: 12,
      padding: 14,
      color: '#FFFFFF',
      marginBottom: 16,
    },
  
    infoText: {
      color: '#9CA3AF',
      textAlign: 'center',
      marginTop: 40,
    },
  
    card: {
      backgroundColor: '#12182B',
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
    },
  
    owner: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 2,
    },
  
    text: {
      color: '#9CA3AF',
      fontSize: 14,
    },
  
    divider: {
      height: 1,
      backgroundColor: '#1F2937',
      marginVertical: 10,
    },
  
    actions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 12,
    },
  
    approveBtn: {
      flex: 1,
      backgroundColor: '#22E1A6',
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
  
    approveText: {
      color: '#0B0F1A',
      fontWeight: '700',
    },
  
    rejectBtn: {
      flex: 1,
      backgroundColor: '#7F1D1D',
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
  
    rejectText: {
      color: '#FCA5A5',
      fontWeight: '700',
    },
  
    logoutButton: {
      backgroundColor: '#1F2937',
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
    },
  
    logoutText: {
      color: '#E5E7EB',
      fontSize: 16,
      fontWeight: '600',
    },
  
    pressed: {
      transform: [{ scale: 0.96 }],
      opacity: 0.85,
    },
  })
  