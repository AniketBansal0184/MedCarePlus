import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, MotiText } from 'moti';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';

const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/auth`;
const OTP_VALIDITY_DURATION = 5 * 60 * 1000; 

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpTimer, setOtpTimer] = useState(OTP_VALIDITY_DURATION);
  const [isOtpExpired, setIsOtpExpired] = useState(false);

  // OTP Timer Logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOtpSent && !isOtpVerified && otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1000) {
            setIsOtpExpired(true);
            setIsOtpSent(false);
            setOtp('');
            clearInterval(timer);
            Alert.alert('OTP Expired', 'The OTP has expired. Please request a new one.');
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOtpSent, isOtpVerified, otpTimer]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSendOTP = async () => {
    if (!email) return setError('Please enter your email');
    if (!validateEmail(email)) return setError('Enter a valid email');
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/forgotpassword`, { email }, { timeout: 10000 });
      setIsOtpSent(true);
      setOtpTimer(OTP_VALIDITY_DURATION);
      setIsOtpExpired(false);
      setOtp(''); // Clear any previous OTP
      Alert.alert('Success', 'An OTP has been sent to your email.');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.msg || `Failed to send OTP: ${err.message}`;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return setError('Please enter a valid 6-digit OTP');
    }
    if (isOtpExpired) {
      return setError('OTP has expired. Please request a new one.');
    }
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/verify-otp`, { email, otp });
      setIsOtpVerified(true);
      Alert.alert('Success', 'OTP verified successfully!');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.msg || 'Invalid OTP';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!email) return setError('Please enter your email');
    if (!validateEmail(email)) return setError('Enter a valid email');
    setError('');
    setLoading(true);

    try {
      // Send new OTP request, which should invalidate the previous OTP server-side
      const response = await axios.post(`${API_URL}/forgotpassword`, { email }, { timeout: 10000 });
      setOtp(''); // Clear previous OTP
      setOtpTimer(OTP_VALIDITY_DURATION); // Reset timer
      setIsOtpExpired(false); // Reset expiration status
      Alert.alert('Success', 'A new OTP has been sent to your email. Previous OTP is now invalid.');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.msg || 'Failed to resend OTP';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      return setError('Please fill all password fields');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    setError('');
    setLoading(true);

    try {
      // Verify new password is different from the old one (assumes server checks this)
      const response = await axios.post(`${API_URL}/reset-password`, { email, password, otp });
      Alert.alert('Success', 'Password reset successfully!', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.msg || 'Failed to reset password';
      setError(msg);
    } finally {
      setLoading(false);
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={26} color="#0f172a" />
          </TouchableOpacity>

          <MotiView
            from={{ opacity: 0, translateY: 50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 100 }}
            style={styles.header}
          >
            <MotiText style={styles.title}>
              {isOtpVerified ? 'Reset Password' : isOtpSent ? 'Verify OTP' : 'Forgot Password'}
            </MotiText>
            <Text style={styles.subtitle}>
              {isOtpVerified
                ? `Set a new password for ${email}`
                : isOtpSent
                ? `Enter the 6-digit OTP sent to ${email}`
                : 'Enter your email to receive a 6-digit OTP to reset your password'}
            </Text>
            {isOtpSent && !isOtpVerified && (
              <Text style={styles.timer}>
                OTP expires in: {formatTime(otpTimer)}
              </Text>
            )}
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 200 }}
            style={styles.form}
          >
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {!isOtpSent ? (
              <TextInput
                placeholder="Email"
                placeholderTextColor="#64748b"
                onChangeText={setEmail}
                value={email}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                editable={!loading}
              />
            ) : !isOtpVerified ? (
              <TextInput
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#64748b"
                onChangeText={setOtp}
                value={otp}
                keyboardType="numeric"
                maxLength={6}
                style={styles.input}
                editable={!loading}
              />
            ) : (
              <>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    placeholder="New Password"
                    placeholderTextColor="#64748b"
                    secureTextEntry={!showPwd}
                    onChangeText={setPassword}
                    value={password}
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    editable={!loading}
                  />
                  <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eyeIcon}>
                    <Ionicons name={showPwd ? 'eye-off' : 'eye'} size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>
                <TextInput
                  placeholder="Confirm Password"
                  placeholderTextColor="#64748b"
                  secureTextEntry={!showPwd}
                  onChangeText={setConfirmPassword}
                  value={confirmPassword}
                  style={styles.input}
                  editable={!loading}
                />
              </>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={isOtpVerified ? handleResetPassword : isOtpSent ? handleVerifyOTP : handleSendOTP}
              disabled={loading}
            >
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                style={styles.gradientButton}
              >
                <Text style={styles.buttonText}>
                  {loading
                    ? isOtpVerified
                      ? 'Resetting...'
                      : isOtpSent
                      ? 'Verifying...'
                      : 'Sending OTP...'
                    : isOtpVerified
                    ? 'Reset Password'
                    : isOtpSent
                    ? 'Verify OTP'
                    : 'Send OTP'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {isOtpSent && !isOtpVerified && (
              <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
                <Text style={[styles.link, loading && styles.linkDisabled]}>
                  {loading ? 'Resending OTP...' : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.link}>Back to Login</Text>
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
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    zIndex: 10,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 20,
    boxShadow: '0px 2px 8px 000',
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
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
  },
  timer: {
    fontSize: 14,
    color: '#dc2626',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  form: {
    width: '100%',
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
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    marginBottom: 16,
    boxShadow: '0px 3px 10px 000',
    elevation: 5,
  },
  eyeIcon: {
    padding: 12,
  },
  button: {
    width: '100%',
    marginBottom: 20,
    boxShadow: '0px 4px 12px 000',
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
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
  link: {
    color: '#2563eb',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
    letterSpacing: 0.3,
    marginVertical: 10,
  },
  linkDisabled: {
    opacity: 0.7,
  },
});
