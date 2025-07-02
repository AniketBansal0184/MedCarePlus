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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const { width } = Dimensions.get('window');

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);

  const refreshUser = async () => {
    const data = await AsyncStorage.getItem('userData');
    if (data) setUser(JSON.parse(data));
  };

  useEffect(() => {
    refreshUser();
  }, []);

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
    Alert.alert(
      'Delete Profile',
      'Are you sure you want to delete your profile? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = await AsyncStorage.getItem('userId');
              if (userId) {
                await axios.delete(`${process.env.EXPO_PUBLIC_API_URL}/api/cart/user/delete/${userId}`, { timeout: 5000 });
                await AsyncStorage.multiRemove([
                  'userData',
                  'userId',
                  `cart_${userId}`,
                  'shippingDetails',
                  'paymentMethod',
                ]);
                Alert.alert('Profile Deleted', 'Your profile has been successfully deleted.', [
                  { text: 'OK', onPress: () => router.replace('/login') },
                ]);
              } else {
                throw new Error('User ID not found');
              }
            } catch (error) {
              console.error('Delete profile error:', {
                message: error.message,
                response: error.response ? error.response.data : null,
              });
              Alert.alert('Error', 'Failed to delete profile. Please try again.');
            }
          },
        },
      ],
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#e0f2fe', '#f8fafc']} style={styles.bgGradient}>
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
            <Text style={styles.heading}>Welcome to MediCare+</Text>
            <Text style={styles.subtitle}>Your trusted medical shop. Log in or sign up to continue.</Text>

            <TouchableOpacity style={styles.login} onPress={() => router.push('/login')}>
              <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.gradientButton}>
                <Text style={styles.loginText}>Log In</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signup} onPress={() => router.push('/signup')}>
              <Text style={styles.signupText}>Create an Account</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#e0f2fe', '#f8fafc']} style={styles.bgGradient}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Image
              source={{ uri: user.avatar || 'https://randomuser.me/api/portraits/women/44.jpg' }}
              style={styles.avatar}
            />
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Details</Text>
            <ProfileItem label="Full Name" value={user.name} icon="person-outline" />
            <ProfileItem label="Email" value={user.email} icon="mail-outline" />
            <ProfileItem label="Phone" value={user.phone || 'N/A'} icon="call-outline" />
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setIsSettingsVisible(!isSettingsVisible)}
            >
              <Text style={styles.sectionTitle}>Settings</Text>
              <Ionicons
                name={isSettingsVisible ? 'chevron-up' : 'chevron-down'}
                size={24}
                color="#2563eb"
                style={styles.toggleIcon}
              />
            </TouchableOpacity>

            {isSettingsVisible && (
              <View style={styles.settingsContent}>
                <TouchableOpacity style={styles.button} onPress={() => router.push('/editprofile')}>
                  <Ionicons name="create-outline" size={24} color="#2563eb" style={styles.icon} />
                  <Text style={styles.buttonText}>Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => router.push('/orderhistory')}>
                  <Ionicons name="document-text-outline" size={24} color="#2563eb" style={styles.icon} />
                  <Text style={styles.buttonText}>Order History</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.deleteBtn]} onPress={deleteProfile}>
                  <Ionicons name="trash-outline" size={24} color="#fff" style={styles.icon} />
                  <Text style={styles.deleteText}>Delete Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.logoutBtn]} onPress={logout}>
                  <Ionicons name="log-out-outline" size={24} color="#fff" style={styles.icon} />
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

function ProfileItem({ label, value, icon }: { label: string; value: string; icon?: string }) {
  return (
    <View style={styles.item}>
      {icon && <Ionicons name={icon} size={20} color="#64748b" style={styles.itemIcon} />}
      <View style={styles.itemContent}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  heading: {
    color: '#0f172a',
    fontSize: 34,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  subtitle: {
    color: '#64748b',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  signup: {
    width: width * 0.85,
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  loginText: {
    fontWeight: '600',
    fontSize: 17,
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
    letterSpacing: 0.3,
  },
  signupText: {
    fontWeight: '600',
    fontSize: 17,
    color: '#2563eb',
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
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
    letterSpacing: 0.4,
  },
  email: {
    color: '#64748b',
    fontSize: 16,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Roboto',
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
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
    color: '#64748b',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Roboto',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    flex: 1,
    fontWeight: '600',
    fontSize: 16,
    color: '#2563eb',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
    letterSpacing: 0.3,
  },
  deleteBtn: {
    backgroundColor: '#dc2626', // Deep red for delete action
  },
  deleteText: {
    flex: 1,
    fontWeight: '600',
    fontSize: 16,
    color: '#fff',
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
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
    letterSpacing: 0.3,
  },
});