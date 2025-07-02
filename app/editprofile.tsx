import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
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

export default function EditProfile() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('userData').then((data) => {
      if (data) {
        const userData = JSON.parse(data);
        setUser(userData);
        setName(userData.name || '');
        setEmail(userData.email || '');
        setPhone(userData.phone || '');
        setAvatar(userData.avatar || '');
      }
    });
  }, []);

  const saveProfile = async () => {
    if (!name || !email) {
      Alert.alert('Error', 'Name and email are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Error', 'Invalid email format.');
      return;
    }
    if (phone && !/^\d{10}$/.test(phone)) {
      Alert.alert('Error', 'Phone number must be 10 digits.');
      return;
    }

    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found');
      }

      const updatedUser = { name, email, phone, avatar: avatar || user?.avatar || 'https://randomuser.me/api/portraits/women/44.jpg' };
      // Update backend
      await axios.put(`${process.env.EXPO_PUBLIC_API_URL}/api/cart/user/update/${userId}`, updatedUser, { timeout: 5000 });
      // Update AsyncStorage
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      // Notify Profile.tsx to refresh
      Alert.alert('Success', 'Profile updated successfully.', [
        { text: 'OK', onPress: () => router.push('/profile') },
      ]);
    } catch (error) {
      console.error('Update profile error:', {
        message: error.message,
        response: error.response ? error.response.data : null,
      });
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#e0f2fe', '#f8fafc']} style={styles.bgGradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>
        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
          />
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
          />
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            maxLength={10}
          />
          <Text style={styles.label}>Avatar URL (Optional)</Text>
          <TextInput
            style={styles.input}
            value={avatar}
            onChangeText={setAvatar}
            placeholder="Enter avatar URL"
          />
          <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
            <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.gradientButton}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginLeft: 16,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
  },
  form: {
    padding: 24,
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Roboto',
  },
  saveButton: {
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
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
  saveButtonText: {
    fontWeight: '600',
    fontSize: 17,
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
    letterSpacing: 0.3,
  },
});