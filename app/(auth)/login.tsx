import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const handleLogin = async () => {
  if (!email || !password) return setError('Please fill all fields');
  if (!validateEmail(email)) return setError('Enter a valid email');
  setError('');

  try {
    const res = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/login`, { email, password });

    const { user, token } = res.data;

    await AsyncStorage.setItem('userId', user._id);
    await AsyncStorage.setItem('token', token);

    const userWithRole = { ...user, role: user.role || (email === 'aniket021978@gmail.com' ? 'admin' : 'user') };
    await AsyncStorage.setItem('userData', JSON.stringify(userWithRole));

    console.log('✅ Saved userId:', user._id);

    Alert.alert('Welcome 👋', 'Login Successful!', [
      { text: 'OK', onPress: () => router.replace('/(tabs)/profile') },
    ]);
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Login failed';

    if (msg.includes('removed by admin')) {
      setError('❌ You have been removed by the admin. You cannot login with this email.');
    } else if (msg.includes('deleted your account')) {
      setError('⚠️ You deleted your account. Please sign up again to continue.');
    } else {
      setError(msg);
    }
  }
};

const handleForgotPassword = async () => {
  try {
    const res = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/check-email`, { email });
    router.push('/forgotpassword');
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Something went wrong';
    setError(msg);
  }
};

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <LinearGradient colors={['#e0f2fe', '#f8fafc']} style={styles.bgGradient}>
        <SafeAreaView style={styles.innerContainer}>
          <ScrollView
                  contentContainerStyle={styles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
          <Image
            source={{ uri: 'https://cdn.pixabay.com/photo/2020/04/11/13/27/doctor-5028579_1280.jpg' }}
            style={styles.bgImage}
            resizeMode="cover"
          />
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/profile')}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={26} color="#0f172a" />
          </TouchableOpacity>

          <MotiView
            from={{ opacity: 0, translateY: 50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 100 }}
          >
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png' }}
              style={styles.logo}
            />
            <Text style={styles.title}>Welcome to MediCare+</Text>
            <Text style={styles.subtitle}>Log in to access your trusted medical shop</Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 200 }}
            style={styles.form}
          >
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TextInput
              placeholder="Email"
              placeholderTextColor="#64748b"
              onChangeText={setEmail}
              value={email}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            <View style={styles.passwordWrapper}>
              <TextInput
                placeholder="Password"
                placeholderTextColor="#64748b"
                secureTextEntry={!showPwd}
                onChangeText={setPassword}
                value={password}
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
              />
              <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eyeIcon}>
                <Ionicons name={showPwd ? 'eye-off' : 'eye'} size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.forgot}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                style={styles.gradientButton}
              >
                <Text style={styles.buttonText}>Log In</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={styles.link}>Don’t have an account? Create one</Text>
            </TouchableOpacity>
          </MotiView>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgGradient: {
    flex: 1,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
  },
  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 30,
    right: 2,
    zIndex: 10,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 20,
    boxShadow: '0px 2px 8px 000',
    elevation: 4,
  },
  logo: {
    width: 130,
    height: 130,
    alignSelf: 'center',
    borderRadius: 26,
    marginBottom: 28,
    boxShadow: '0px 4px 16px 000',
    elevation: 8,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    textAlign: 'center',
    color: '#0f172a',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#64748b',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Roboto',
    lineHeight: 24,
    marginBottom: 15,
  },
  form: {
    width: '100%',
    marginTop: 20,
  },
  input: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 16,
    fontSize: 16,
    color: '#0f172a',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
    boxShadow: '0px 3px 10px 000',
    elevation: 5,
    borderWidth: 0,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    marginBottom: 16,
    boxShadow: '0px 0px 10px 000',
  },
  eyeIcon: {
    padding: 12,
  },
  forgot: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginRight: 8,
  },
  forgotText: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
    letterSpacing: 0.3,
  },
  gradientButton: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    marginBottom: 20,
    boxShadow: '0px 4px 12px 000',
    elevation: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 17,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
    letterSpacing: 0.3,
  },
  error: {
    color: '#dc2626',
    marginBottom: 16,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Roboto',
    letterSpacing: 0.2,
  },
  link: {
    color: '#2563eb',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
    letterSpacing: 0.3,
  },
});
