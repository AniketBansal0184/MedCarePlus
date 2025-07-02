import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => /^[0-9]{10}$/.test(phone);

  const signup = async () => {
    if (!name || !email || !password || !phone) return setError('Please fill all fields');
    if (!validateEmail(email)) return setError('Enter a valid email');
    if (!validatePhone(phone)) return setError('Enter a valid 10-digit phone number');
    setError('');

    try {
      await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/register`, { name, email, phone, password });
      setEmailSent(true);
      setError('');
      Alert.alert('Success', 'Verification email sent. Please check your inbox.', [
        { text: 'OK', onPress: () => router.push('/login') },
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Signup failed';
      setError(msg);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <LinearGradient colors={['#e0f2fe', '#f8fafc']} style={styles.bgGradient}>
        <SafeAreaView style={styles.innerContainer}>
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
            <Text style={styles.title}>Join MediCare+</Text>
            <Text style={styles.subtitle}>Create an account to start shopping for medical essentials</Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 200 }}
            style={styles.form}
          >
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {emailSent ? (
              <Text style={styles.success}>✅ Verification email sent. Please check your inbox.</Text>
            ) : null}

            <TextInput
              placeholder="Full Name"
              placeholderTextColor="#64748b"
              onChangeText={setName}
              value={name}
              style={styles.input}
            />
            <TextInput
              placeholder="Email"
              placeholderTextColor="#64748b"
              onChangeText={setEmail}
              value={email}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            <TextInput
              placeholder="Phone Number"
              placeholderTextColor="#64748b"
              keyboardType="phone-pad"
              maxLength={10}
              onChangeText={setPhone}
              value={phone}
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

            <TouchableOpacity style={styles.button} onPress={signup}>
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                style={styles.gradientButton}
              >
                <Text style={styles.buttonText}>Sign Up</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.link}>Already have an account? Log in</Text>
            </TouchableOpacity>
          </MotiView>
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
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    zIndex: 10,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  logo: {
    width: 130,
    height: 130,
    alignSelf: 'center',
    borderRadius: 26,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
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
    marginBottom: 36,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 0,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 14,
  },
  eyeIcon: {
    padding: 12,
  },
  button: {
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  gradientButton: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
  success: {
    color: '#166534',
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

