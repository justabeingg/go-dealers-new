import { View, Text, Pressable, StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { supabase } from '../lib/supabase'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, GRADIENTS, SHADOWS } from '../constants/theme'

export default function WaitingApprovalScreen() {
  const logout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.container}>
      <Animated.View entering={FadeInUp.duration(600)} style={styles.iconContainer}>
        <PulsingIcon />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(600).delay(150)} style={styles.content}>
        <Text style={styles.title}>Awaiting Approval</Text>
        <Text style={styles.message}>
          Your account is under review.{'\n'}
          We'll notify you via email once approved!
        </Text>

        <View style={styles.infoBox}>
          <Ionicons name="time-outline" size={20} color={COLORS.secondary} />
          <Text style={styles.infoText}>
            Usually takes 24-48 hours
          </Text>
        </View>

        <Pressable
          onPress={logout}
          style={({ pressed }) => [
            styles.logoutBtn,
            pressed && styles.logoutBtnPressed,
          ]}
        >
          <LinearGradient
            colors={['#374151', '#4B5563']}
            style={styles.logoutGradient}
          >
            <Ionicons name="log-out-outline" size={20} color="#FFF" />
            <Text style={styles.logoutText}>Logout</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </LinearGradient>
  )
}

function PulsingIcon() {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withRepeat(
            withSequence(
              withTiming(1, { duration: 1000 }),
              withTiming(1.1, { duration: 1000 })
            ),
            -1,
            true
          ),
        },
      ],
    }
  })

  return (
    <Animated.View style={[styles.iconCircle, animatedStyle]}>
      <LinearGradient
        colors={GRADIENTS.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconGradient}
      >
        <Ionicons name="hourglass-outline" size={48} color="#FFF" />
      </LinearGradient>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  iconGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    maxWidth: 360,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 32,
  },
  infoText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  logoutBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  logoutBtnPressed: {
    transform: [{ scale: 0.98 }],
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  logoutText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
})
