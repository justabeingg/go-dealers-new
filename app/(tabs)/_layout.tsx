

import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { Pressable, StyleSheet, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

function PillTabButton({ icon, focused, onPress, color }: any) {
  return (
    <Pressable onPress={onPress} style={styles.item}>
      {focused ? (
        <View style={[styles.activeCircle, { backgroundColor: color }]}>
          <Ionicons name={icon} size={24} color="#000" />
        </View>
      ) : (
        <Ionicons name={icon} size={24} color="#9CA3AF" />
      )}
    </Pressable>
  )
}

export default function TabLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,
        }}
      >
      <Tabs.Screen
        name="feed"
        options={{
          tabBarButton: (props) => (
            <PillTabButton {...props} icon="home" color="#4ADE80" />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          tabBarButton: (props) => (
            <PillTabButton {...props} icon="map" color="#60A5FA" />
          ),
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          tabBarButton: (props) => (
            <PillTabButton {...props} icon="add" color="#F59E0B" />
          ),
        }}
      />

      <Tabs.Screen
        name="requests"
        options={{
          tabBarButton: (props) => (
            <PillTabButton {...props} icon="notifications" color="#EC4899" />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarButton: (props) => (
            <PillTabButton {...props} icon="person" color="#A78BFA" />
          ),
        }}
        listeners={{
          tabPress: () => {
            ;(globalThis as any).__GO_BACK_TO_PROFILE_GRID__ = true
          },
        }}
      />
      </Tabs>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 50,
    left: 80,
    right: 80,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1F2937',
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    paddingBottom: 0,
    paddingTop: 0,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  activeCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
})
