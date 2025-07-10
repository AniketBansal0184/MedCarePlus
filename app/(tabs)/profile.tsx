import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [reviewModal, setReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light'); // Theme state

  // Theme configurations
  const themes = {
    light: {
      background: '#f8fafc',
      text: '#0f172a',
      secondaryText: '#64748b',
      card: '#ffffff',
      gradient: ['#e0f2fe', '#f8fafc'],
      button: '#2563eb',
      buttonText: '#fff',
      deleteButton: '#dc2626',
      logoutButton: '#ef4444',
      modalBackground: 'rgba(255,255,255,0.85)',
      modalBorder: 'rgba(0,0,0,0.05)',
    },
    dark: {
      background: '#1e293b',
      text: '#f8fafc',
      secondaryText: '#94a3b8',
      card: '#334155',
      gradient: ['#334155', '#1e293b'],
      button: '#60a5fa',
      buttonText: '#fff',
      deleteButton: '#b91c1c',
      logoutButton: '#dc2626',
      modalBackground: 'rgba(30,41,59,0.9)',
      modalBorder: 'rgba(255,255,255,0.1)',
    },
  };

  // Load theme from AsyncStorage
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        setTheme(savedTheme as 'light' | 'dark');
      }
    };
    loadTheme();
    refreshUser();
  }, []);

  // Save theme to AsyncStorage
  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  const currentTheme = themes[theme];

  const isAdmin = user?.role === 'admin';

  const refreshUser = async () => {
    const data = await AsyncStorage.getItem('userData');
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.role === 'admin') {
        router.replace('/adminpanel');
      } else {
        setUser(parsed);
      }
    }
  };

  const logout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('userData');
          await AsyncStorage.removeItem('userId');
          router.replace('/login');
        },
      },
    ]);
  };

  const deleteProfile = () => {
    setReviewModal(true);
  };

  const handleFinalDelete = async () => {
    if (!feedback.trim() || rating === 0) {
      Alert.alert('Required', 'Please provide a reason and rating before deleting.');
      return;
    }

    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/cart/delete-feedback`, {
          userId,
          rating,
          feedback,
        });
        await axios.delete(`${process.env.EXPO_PUBLIC_API_URL}/api/cart/user/delete/${userId}`);
        await AsyncStorage.multiRemove([
          'userData',
          'userId',
          `cart_${userId}`,
          'shippingDetails',
          'paymentMethod',
        ]);
        Alert.alert('Deleted', 'Your profile has been deleted.');
        router.replace('/login');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <LinearGradient colors={currentTheme.gradient} style={styles.bgGradient}>
          <Image
            source={{ uri: 'https://cdn.pixabay.com/photo/2020/04/11/13/27/doctor-5028579_1280.jpg' }}
            style={styles.bgImage}
            resizeMode="cover"
          />
          <SafeAreaView style={styles.innerContainer}>
            <Image
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png' }}
              style={styles.logo}
            />
            <Text style={[styles.heading, { color: currentTheme.text }]}>Welcome to MediCare+</Text>
            <Text style={[styles.subtitle, { color: currentTheme.secondaryText }]}>
              Your trusted medical shop. Log in or sign up to continue.
            </Text>

            <TouchableOpacity style={styles.login} onPress={() => router.push('/login')}>
              <LinearGradient colors={[currentTheme.button, currentTheme.button]} style={styles.gradientButton}>
                <Text style={[styles.loginText, { color: currentTheme.buttonText }]}>Log In</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.signup, { borderColor: currentTheme.button }]} onPress={() => router.push('/signup')}>
              <Text style={[styles.signupText, { color: currentTheme.button }]}>Create an Account</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <LinearGradient colors={currentTheme.gradient} style={styles.bgGradient}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image
            source={{ uri: user.avatar || 'https://randomuser.me/api/portraits/women/44.jpg' }}
            style={styles.avatar}
          />
          <Text style={[styles.name, { color: currentTheme.text }]}>{user.name}</Text>
          <Text style={[styles.email, { color: currentTheme.secondaryText }]}>{user.email}</Text>
          {/* Theme Toggle Button */}
          <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
            <Ionicons
              name={theme === 'light' ? 'moon' : 'sunny'}
              size={24}
              color={currentTheme.button}
            />
          </TouchableOpacity>
        </View>
        
          <View style={[styles.section, { backgroundColor: currentTheme.card }]}>
            <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Your Details</Text>
            <ProfileItem label="Full Name" value={user.name} icon="person-outline" theme={currentTheme} />
            <ProfileItem label="Email" value={user.email} icon="mail-outline" theme={currentTheme} />
            <ProfileItem label="Phone" value={user.phone || 'N/A'} icon="call-outline" theme={currentTheme} />
          </View>

          <View style={[styles.section, { backgroundColor: currentTheme.card }]}>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setIsSettingsVisible(!isSettingsVisible)}
            >
              <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Settings</Text>
              <Ionicons
                name={isSettingsVisible ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={currentTheme.button}
                style={styles.toggleIcon}
              />
            </TouchableOpacity>

            {isSettingsVisible && (
              <View style={styles.settingsContent}>
                <TouchableOpacity style={[styles.button, { backgroundColor: currentTheme.card }]} onPress={() => router.push('/editprofile')}>
                  <Ionicons name="create-outline" size={24} color={currentTheme.button} style={styles.icon} />
                  <Text style={[styles.buttonText, { color: currentTheme.button }]}>Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, { backgroundColor: currentTheme.card }]} onPress={() => router.push('/orderhistory')}>
                  <Ionicons name="document-text-outline" size={24} color={currentTheme.button} style={styles.icon} />
                  <Text style={[styles.buttonText, { color: currentTheme.button }]}>Order History</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, { backgroundColor: currentTheme.deleteButton }]} onPress={deleteProfile}>
                  <Ionicons name="trash-outline" size={24} color={currentTheme.buttonText} style={styles.icon} />
                  <Text style={[styles.deleteText, { بواسطة: currentTheme.buttonText }]}>Delete Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, { backgroundColor: currentTheme.logoutButton }]} onPress={logout}>
                  <Ionicons name="log-out-outline" size={24} color={currentTheme.buttonText} style={styles.icon} />
                  <Text style={[styles.logoutText, { color: currentTheme.buttonText }]}>Logout</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          {reviewModal && (
            <View style={styles.modalOverlay}>
              <BlurView intensity={80} tint={theme} style={styles.blurContainer}>
                <View style={[styles.modalCard, { backgroundColor: currentTheme.modalBackground, borderColor: currentTheme.modalBorder }]}>
                  <TouchableOpacity
                    onPress={() => setReviewModal(false)}
                    style={styles.closeIcon}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close-circle" size={32} color={currentTheme.text} />
                  </TouchableOpacity>
                  <Text style={[styles.modalTitle, { color: currentTheme.text }]}>Leaving so soon?</Text>
                  <Text style={[styles.modalSubtitle, { color: currentTheme.secondaryText }]}>
                    Tell us why you're deleting your profile so we can improve.
                  </Text>
                  <TextInput
                    placeholder="Your reason..."
                    placeholderTextColor={currentTheme.secondaryText}
                    value={feedback}
                    onChangeText={setFeedback}
                    multiline
                    numberOfLines={5}
                    style={[styles.modalInput, { borderColor: currentTheme.modalBorder, backgroundColor: currentTheme.card, color: currentTheme.text }]}
                  />
                  <Text style={[styles.modalSubtitle, { color: currentTheme.secondaryText }]}>Rate your experience</Text>
                  <View style={styles.starContainer}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <TouchableOpacity key={i} onPress={() => setRating(i)} activeOpacity={0.8}>
                        <Ionicons
                          name={i <= rating ? 'star' : 'star-outline'}
                          size={34}
                          color={i <= rating ? '#fbbf24' : currentTheme.secondaryText}
                          style={{ marginHorizontal: 5 }}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity onPress={handleFinalDelete} activeOpacity={0.9} style={[styles.submitButton, { backgroundColor: currentTheme.deleteButton }]}>
                    <Text style={[styles.submitButtonText, { color: currentTheme.buttonText }]}>Submit & Delete</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

function ProfileItem({ label, value, icon, theme }: { label: string; value: string; icon?: string; theme: any }) {
  return (
    <View style={styles.item}>
      {icon && <Ionicons name={icon} size={20} color={theme.secondaryText} style={styles.itemIcon} />}
      <View style={styles.itemContent}>
        <Text style={[styles.label, { color: theme.secondaryText }]}>{label}</Text>
        <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
      </View>
    </View>
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
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 24,
    marginBottom: 28,
    boxShadow: '0px 4px 16px 000',
    elevation: 8,
  },
  heading: {
    fontSize: 34,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 48,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Roboto',
    lineHeight: 24,
  },
  gradientButton: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  login: {
    width: width * 0.85,
    marginTop: 16,
    boxShadow: '0px 4px 12px 000',
    elevation: 6,
  },
  signup: {
    width: width * 0.85,
    marginTop: 16,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    boxShadow: '0px 4px 12px 000',
    elevation: 6,
  },
  loginText: {
    fontWeight: '600',
    fontSize: 17,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
    letterSpacing: 0.3,
  },
  signupText: {
    fontWeight: '600',
    fontSize: 17,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
    letterSpacing: 0.3,
  },
  icon: {
    marginRight: 12,
  },
  toggleIcon: {
    marginLeft: 8,
  },
  header: {
    alignItems: 'center',
    padding: 32,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    position: 'relative', // For positioning theme toggle
  },
  themeToggle: {
    position: 'absolute',
    top: 32,
    right: 24,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#ffffff',
    boxShadow: '0px 4px 16px 000',
    elevation: 8,
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
    letterSpacing: 0.4,
  },
  email: {
    fontSize: 16,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Roboto',
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    boxShadow: '0px 4px 12px 000',
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
    letterSpacing: 0.3,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingsContent: {
    marginTop: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  itemIcon: {
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Roboto',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 12,
    boxShadow: '0px 2px 8px 000',
    elevation: 4,
  },
  buttonText: {
    flex: 1,
    fontWeight: '600',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
    letterSpacing: 0.3,
  },
  deleteBtn: {
    backgroundColor: '#dc2626',
  },
  deleteText: {
    flex: 1,
    fontWeight: '600',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
    letterSpacing: 0.3,
  },
  logoutBtn: {
    backgroundColor: '#ef4444',
  },
  logoutText: {
    flex: 1,
    fontWeight: '600',
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 10,
  },
  closeIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 2,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
  },
  modalSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 14,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 15,
    marginBottom: 20,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
});