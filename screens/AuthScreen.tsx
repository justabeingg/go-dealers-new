import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  StyleSheet, 
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Animated as RNAnimated
} from 'react-native'
import { useState, useEffect, useRef } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated'
import { supabase } from '../lib/supabase'
import { Ionicons } from '@expo/vector-icons'

const { height } = Dimensions.get('window')

type Props = {
  onAuthSuccess: () => void
}

export default function AuthScreen({ onAuthSuccess }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  const [ownerName, setOwnerName] = useState('')
  const [shopName, setShopName] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Animated value for shake effect
  const shakeAnimation = useRef(new RNAnimated.Value(0)).current

  // Reset message when mode changes
  useEffect(() => {
    setMessage('')
    setPassword('')
    setConfirmPassword('')
  }, [mode])

  // Shake animation for error
  const shake = () => {
    RNAnimated.sequence([
      RNAnimated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      RNAnimated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      RNAnimated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      RNAnimated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start()
  }

  const showError = (msg: string) => {
    setMessage(msg)
    shake()
  }

  const passwordsMatch = password === confirmPassword && password.length > 0
  const canSubmitSignup = 
    ownerName.trim() && 
    shopName.trim() && 
    city.trim() && 
    phone.length === 10 && 
    email.trim() && 
    password.length >= 6 && 
    passwordsMatch

  const login = async () => {
    setMessage('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      showError('Invalid email or password')
      return
    }

    onAuthSuccess()
  }

  const forgotPassword = async () => {
    if (!email.trim()) {
      showError('Please enter your email first')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)

    if (error) showError(error.message)
    else setMessage('✓ Password reset link sent to your email')
  }

  const signup = async () => {
    setMessage('')

    if (!ownerName.trim()) return showError('Owner name is required')
    if (!shopName.trim()) return showError('Shop name is required')
    if (!city.trim()) return showError('City is required')
    if (!/\S+@\S+\.\S+/.test(email)) return showError('Enter a valid email address')
    if (phone.length !== 10) return showError('Phone number must be 10 digits')
    if (password.length < 6) return showError('Password must be at least 6 characters')
    if (!passwordsMatch) return showError('Passwords do not match')

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error || !data.user) {
      setLoading(false)
      if (error?.message.toLowerCase().includes('already')) {
        showError('This email is already registered. Please login.')
      } else {
        showError(error?.message || 'Signup failed')
      }
      return
    }

    await supabase.from('profiles').upsert({
      id: data.user.id,
      email: email,
      owner_name: ownerName,
      shop_name: shopName,
      city,
      phone,
      approved: false,
      role: 'dealer',
    })

    setLoading(false)
  }

  return (
    <LinearGradient colors={['#0F172A', '#1E293B', '#334155']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo with gradient */}
          <Animated.View entering={FadeInUp.duration(600)} style={styles.logoContainer}>
            <LinearGradient
              colors={['#8B5CF6', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Text style={styles.logoIcon}>GD</Text>
            </LinearGradient>
            <Text style={styles.logo}>GO DEALERS</Text>
            <Text style={styles.tagline}>
              {mode === 'login' ? 'Sign in to continue' : 'Join the network'}
            </Text>
          </Animated.View>

          {/* Form Card */}
          <RNAnimated.View style={[styles.card, { transform: [{ translateX: shakeAnimation }] }]}>
            <Animated.View entering={FadeInDown.duration(600).delay(150)}>
              {mode === 'signup' && (
                <>
                  <Input 
                    icon="person-outline"
                    placeholder="Owner Name" 
                    value={ownerName} 
                    onChangeText={setOwnerName} 
                  />
                  <Input 
                    icon="storefront-outline"
                    placeholder="Shop Name" 
                    value={shopName} 
                    onChangeText={setShopName} 
                  />
                  <Input 
                    icon="location-outline"
                    placeholder="City" 
                    value={city} 
                    onChangeText={setCity} 
                  />
                  <Input
                    icon="call-outline"
                    placeholder="Phone (10 digits)"
                    keyboardType="numeric"
                    value={phone}
                    onChangeText={(t: string) => setPhone(t.replace(/[^0-9]/g, '').slice(0, 10))}
                    maxLength={10}
                  />
                </>
              )}

              <Input 
                icon="mail-outline"
                placeholder="Email" 
                autoCapitalize="none" 
                keyboardType="email-address"
                value={email} 
                onChangeText={setEmail} 
              />
              
              <Input
                icon="lock-closed-outline"
                placeholder={mode === 'signup' ? 'Create Password (min 6 chars)' : 'Password'}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowPassword(!showPassword)}
              />

              {mode === 'signup' && (
                <>
                  <Input
                    icon="lock-closed-outline"
                    placeholder="Confirm Password"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    rightIcon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    statusIcon={
                      confirmPassword.length > 0
                        ? passwordsMatch
                          ? 'checkmark-circle'
                          : 'close-circle'
                        : undefined
                    }
                    statusColor={passwordsMatch ? '#10B981' : '#EF4444'}
                  />
                  
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <Animated.Text entering={FadeIn} style={styles.errorHint}>
                      Passwords don't match
                    </Animated.Text>
                  )}
                </>
              )}

              {/* Submit Button */}
              <Pressable
                onPress={mode === 'login' ? login : signup}
                disabled={loading || (mode === 'signup' && !canSubmitSignup)}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  (loading || (mode === 'signup' && !canSubmitSignup)) && styles.primaryBtnDisabled,
                  pressed && !loading && styles.primaryBtnPressed,
                ]}
              >
                <LinearGradient
                  colors={
                    loading || (mode === 'signup' && !canSubmitSignup)
                      ? ['#4B5563', '#6B7280']
                      : ['#8B5CF6', '#EC4899']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientBtn}
                >
                  {loading ? (
                    <RNAnimated.View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <LoadingDots />
                    </RNAnimated.View>
                  ) : (
                    <Text style={styles.primaryBtnText}>
                      {mode === 'login' ? 'Login' : 'Submit Request'}
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>

              {mode === 'login' && (
                <Pressable onPress={forgotPassword} disabled={loading}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </Pressable>
              )}

              <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
                <Text style={styles.switchText}>
                  {mode === 'login'
                    ? 'New dealer? Request access →'
                    : 'Already approved? Login →'}
                </Text>
              </Pressable>

              {!!message && (
                <Animated.View entering={FadeIn.duration(300)} style={[
                  styles.messageBox,
                  message.includes('✓') && styles.successBox
                ]}>
                  <Text style={[
                    styles.message,
                    message.includes('✓') && styles.successMessage
                  ]}>
                    {message}
                  </Text>
                </Animated.View>
              )}
            </Animated.View>
          </RNAnimated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}

// Animated Loading Dots
function LoadingDots() {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[0, 1, 2].map((i) => (
        <Dot key={i} delay={i * 200} />
      ))}
    </View>
  )
}

function Dot({ delay }: { delay: number }) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withRepeat(
        withSequence(
          withSpring(0.3, { duration: 400 }),
          withSpring(1, { duration: 400 })
        ),
        -1
      ),
    }
  })

  return (
    <Animated.View
      style={[
        {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: '#FFF',
        },
        animatedStyle,
      ]}
    />
  )
}

function Input({ icon, rightIcon, onRightIconPress, statusIcon, statusColor, ...props }: any) {
  return (
    <View style={styles.inputContainer}>
      <Ionicons name={icon} size={20} color="#8B5CF6" style={styles.inputIcon} />
      <TextInput
        {...props}
        placeholderTextColor="#64748B"
        style={styles.input}
      />
      {rightIcon && (
        <Pressable onPress={onRightIconPress} style={styles.rightIcon}>
          <Ionicons name={rightIcon} size={20} color="#64748B" />
        </Pressable>
      )}
      {statusIcon && (
        <Ionicons name={statusIcon} size={20} color={statusColor} style={styles.statusIcon} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
  },
  logo: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    paddingVertical: 16,
  },
  rightIcon: {
    padding: 4,
  },
  statusIcon: {
    marginLeft: 8,
  },
  errorHint: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 16,
  },
  primaryBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
  primaryBtnPressed: {
    transform: [{ scale: 0.98 }],
  },
  gradientBtn: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 17,
  },
  forgotText: {
    color: '#8B5CF6',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  switchText: {
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 15,
  },
  messageBox: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  successBox: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  message: {
    color: '#EF4444',
    textAlign: 'center',
    fontSize: 14,
  },
  successMessage: {
    color: '#10B981',
  },
})
