import { FlatList, Pressable, View, Dimensions } from 'react-native'
import { Image } from 'expo-image'
import { supabase } from '../../lib/supabase'
import { useState } from 'react'
import { useFocusEffect } from 'expo-router'

type Props = {
  userId: string
  onPostPress: (postId: string) => void
  onPostDelete?: (postId: string) => void
}

const NUM_COLUMNS = 3
const GAP = 10
const SCREEN_WIDTH = Dimensions.get('window').width
const ITEM_WIDTH =
  (SCREEN_WIDTH - GAP * (NUM_COLUMNS + 1)) / NUM_COLUMNS

export default function ProfilePostsGrid({
  userId,
  onPostPress,
  onPostDelete,
}: Props) {
  const [posts, setPosts] = useState<any[]>([])

  const fetchMyPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('id, media_urls, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    setPosts(data || [])
  }

  useFocusEffect(() => {
    fetchMyPosts()
  })

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      numColumns={NUM_COLUMNS}
      contentContainerStyle={{
        paddingHorizontal: GAP,
        paddingBottom: 80,
      }}
      renderItem={({ item, index}) => {
        const imageUrl =
          item.media_urls?.[0] ||
          'https://upload.wikimedia.org/wikipedia/commons/3/3a/Cat03.jpg'

        return (
          <Pressable
            onPress={() => onPostPress(item.id)}
            style={{
              width: ITEM_WIDTH,
              marginRight:
                (index + 1) % NUM_COLUMNS === 0 ? 0 : GAP,
              marginBottom: GAP,
              backgroundColor: '#12182B',
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            <View style={{ aspectRatio: 1, backgroundColor: '#000' }}>
              <Image
                source={{ uri: imageUrl }}
                contentFit="cover"
                style={{ width: '100%', height: '100%' }}
              />
            </View>
          </Pressable>
        )
      }}
    />
  )
}
