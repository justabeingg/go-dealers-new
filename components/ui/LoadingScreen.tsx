import { View, StyleSheet } from 'react-native'
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { COLORS } from '../../constants/theme'

export default function LoadingScreen() {
  return (
    <LinearGradient
      colors={[COLORS.background, COLORS.surface, COLORS.surfaceLight]}
      style={styles.container}
    >
      <View style={styles.loadingContainer}>
        <AnimatedCircles />
        <Animated.Text style={styles.text}>Loading...</Animated.Text>
      </View>
    </LinearGradient>
  )
}

function AnimatedCircles() {
  return (
    <View style={styles.circlesContainer}>
      <Circle delay={0} />
      <Circle delay={200} />
      <Circle delay={400} />
    </View>
  )
}

function Circle({ delay }: { delay: number }) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withRepeat(
            withSequence(
              withTiming(1, { duration: 600, easing: Easing.ease }),
              withTiming(1.3, { duration: 600, easing: Easing.ease }),
              withTiming(1, { duration: 600, easing: Easing.ease })
            ),
            -1
          ),
        },
      ],
      opacity: withRepeat(
        withSequence(
          withTiming(0.3, { duration: 600 }),
          withTiming(1, { duration: 600 }),
          withTiming(0.3, { duration: 600 })
        ),
        -1
      ),
    }
  })

  return (
    <Animated.View style={[styles.circle, animatedStyle]}>
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.circleGradient}
      />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  circlesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  circle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  circleGradient: {
    flex: 1,
  },
  text: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
})
