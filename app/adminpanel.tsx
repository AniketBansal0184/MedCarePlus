// AdminPanel.js

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const FILTERS = [
  { label: 'All Users', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: '❌ Deleted by Admin', value: 'deletedByAdmin' },
  { label: '🗑️ Deleted by User', value: 'deletedByUser' },
];

const AnimatedButton = ({ icon, color, onPress }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPressIn={() => (scale.value = withSpring(0.9))}
      onPressOut={() => (scale.value = withSpring(1))}
      onPress={onPress}
    >
      <Animated.View style={[animatedStyle, styles.deleteIconWrapper]}>
        <Ionicons name={icon} size={22} color={color} />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterModal, setFilterModal] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const router = useRouter();

  const fetchUsers = async (reset = false) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const res = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/api/admin/users?page=${reset ? 1 : page}`,
        { headers: { Authorization: token } }
      );

      const newUsers = res.data.users || [];
      const updated = reset ? newUsers : [...users, ...newUsers];
      setUsers(updated);
      setHasMore(res.data.hasMore);
    } catch {
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUser = async () => {
    const data = await AsyncStorage.getItem('userData');
    if (data) {
      const parsed = JSON.parse(data);
      setUserRole(parsed.role);
      if (parsed.role !== 'admin') {
        Alert.alert('Access Denied', 'Only admins can access this panel');
        router.replace('/(tabs)/profile');
      }
    }
  };

  const deleteUser = async (id) => {
    Alert.alert('Delete User', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            await axios.delete(`${process.env.EXPO_PUBLIC_API_URL}/api/admin/user/${id}`, {
              headers: { Authorization: token },
            });
            const updated = users.map((u) =>
              u._id === id ? { ...u, isDeleted: true, deletedByAdmin: true } : u
            );
            setUsers(updated);
          } catch {
            Alert.alert('Error', 'Failed to delete user');
          }
        },
      },
    ]);
  };

  const restoreUser = async (id) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.patch(`${process.env.EXPO_PUBLIC_API_URL}/api/admin/restore-user/${id}`, {}, {
        headers: { Authorization: token },
      });
      const updated = users.map((u) =>
        u._id === id ? { ...u, isDeleted: false, deletedByAdmin: false } : u
      );
      setUsers(updated);
    } catch {
      Alert.alert('Error', 'Restore failed');
    }
  };

  useEffect(() => {
    getCurrentUser();
    fetchUsers(true);
  }, [filterType]);

  useEffect(() => {
    const clean = search.trim().toLowerCase();
    let result = users.filter((u) => u.role !== 'admin');

    if (filterType === 'active') {
      result = result.filter((u) => !u.isDeleted);
    } else if (filterType === 'deletedByAdmin') {
      result = result.filter((u) => u.isDeleted && u.deletedByAdmin);
    } else if (filterType === 'deletedByUser') {
      result = result.filter((u) => u.isDeleted && !u.deletedByAdmin);
    }

    if (clean) {
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(clean) ||
          u.email.toLowerCase().includes(clean)
      );
    }

    setFiltered(result);
  }, [search, users, filterType]);

  const totalUsers = users.filter((u) => u.role !== 'admin').length;
  const activeUsers = users.filter((u) => !u.isDeleted && u.role !== 'admin').length;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.gradient}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <View style={styles.icons}>
            <TouchableOpacity onPress={() => { setPage(1); fetchUsers(true); }}>
              <Ionicons name="refresh" size={22} color="#94a3b8" />
            </TouchableOpacity>
            <TouchableOpacity onPress={async () => {
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('userData');
              router.replace('/login');
            }} style={{ marginLeft: 20 }}>
              <Ionicons name="log-out-outline" size={22} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>

        <TextInput
          placeholder="Search users..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchBar}
          placeholderTextColor="#cbd5e1"
        />

        <View style={styles.overviewRow}>
          <Text style={styles.userCount}>{`Total Users: ${totalUsers}`}</Text>
          <Text style={styles.userCount}>{`Active Users: ${activeUsers}`}</Text>
          <TouchableOpacity
            onPress={() => setFilterModal(true)}
            style={[styles.filterBtn, { backgroundColor: '#38bdf8', paddingHorizontal: 10 }]}
          >
            <Ionicons name="filter" size={18} color="white" />
          </TouchableOpacity>
        </View>

        <Modal
          visible={filterModal}
          animationType="fade"
          transparent
          onRequestClose={() => setFilterModal(false)}
        >
          <BlurView intensity={40} tint="dark" style={{ flex: 1, justifyContent: 'center' }}>
            <View style={{
              backgroundColor: '#1e293b',
              margin: 30,
              borderRadius: 18,
              padding: 20,
              borderColor: '#334155',
              borderWidth: 1,
            }}>
              {FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.value}
                  onPress={() => {
                    setFilterType(filter.value);
                    setFilterModal(false);
                  }}
                  style={[
                    styles.filterBtn,
                    {
                      marginBottom: 12,
                      backgroundColor: filterType === filter.value ? '#38bdf8' : '#334155',
                    },
                  ]}
                >
                  <Text style={styles.filterText}>{filter.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </BlurView>
        </Modal>

        {loading ? (
          <ActivityIndicator size="large" color="#38bdf8" style={{ marginTop: 30 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.scroll}>
            {filtered.map((user) => {
              const isExpanded = expandedUserId === user._id;
              return (
                <TouchableOpacity
                  key={user._id}
                  onPress={() => setExpandedUserId(isExpanded ? null : user._id)}
                  activeOpacity={0.95}
                >
                  <View style={styles.userCard}>
                    <View style={styles.userCardTop}>
                      <View style={styles.userLeft}>
                        <Image
                          source={{ uri: user.photo || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }}
                          style={styles.avatar}
                        />
                        <View>
                          <Text style={styles.name}>{user.name}</Text>
                          <Text style={styles.email}>{user.email}</Text>
                        </View>
                      </View>
                      {!user.isDeleted ? (
                        <AnimatedButton icon="trash-outline" color="#ef4444" onPress={() => deleteUser(user._id)} />
                      ) : user.deletedByAdmin ? (
                        <AnimatedButton icon="refresh" color="#22c55e" onPress={() => restoreUser(user._id)} />
                      ) : null}
                    </View>

                    {isExpanded && (
                      <View style={{ marginTop: 12 }}>
                        <Text style={styles.expandedLabel}>Joined: {new Date(user.createdAt).toLocaleDateString()}</Text>
                        {user.isDeleted && (
                          <Text style={styles.expandedLabel}>Deleted on: {new Date(user.deletedAt).toLocaleString()}</Text>
                        )}
                        {user.isDeleted && !user.deletedByAdmin && (
                          <>
                            {user.feedback && <Text style={styles.feedbackText}>Feedback: {user.feedback}</Text>}
                            {user.rating && (
                              <View style={styles.ratingRow}>
                                {[...Array(5)].map((_, i) => (
                                  <Ionicons
                                    key={i}
                                    name={i < user.rating ? 'star' : 'star-outline'}
                                    size={18}
                                    color={i < user.rating ? '#facc15' : '#64748b'}
                                  />
                                ))}
                              </View>
                            )}
                          </>
                        )}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
            {hasMore && (
              <TouchableOpacity
                onPress={() => {
                  const nextPage = page + 1;
                  setPage(nextPage);
                  fetchUsers();
                }}
                style={styles.loadMoreBtn}
              >
                <Text style={styles.loadMoreText}>Load More</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  gradient: { flex: 1, paddingHorizontal: 16, paddingTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  headerTitle: { fontSize: 28, color: '#ffffff', fontWeight: 'bold', letterSpacing: 0.5 },
  overviewRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14, paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#1e293b', borderRadius: 16, borderWidth: 1, borderColor: '#334155',
  },
  userCount: { color: '#f1f5f9', fontSize: 15, fontWeight: '600' },
  icons: { flexDirection: 'row', alignItems: 'center' },
  searchBar: {
    backgroundColor: '#1e293b', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 12,
    fontSize: 15, marginBottom: 14, color: 'white', borderColor: '#334155', borderWidth: 1,
  },
  filterBtn: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  filterText: { color: 'white', fontSize: 15, fontWeight: '600' },
  scroll: { paddingBottom: 50 },
  userCard: {
    backgroundColor: '#1e293b', padding: 16, borderRadius: 20, marginBottom: 16,
    borderColor: '#334155', borderWidth: 1,
  },
  userCardTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  userLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 16, backgroundColor: '#334155' },
  name: { color: '#f8fafc', fontWeight: '700', fontSize: 16, marginBottom: 2 },
  email: { color: '#94a3b8', fontSize: 13 },
  deleteIconWrapper: { padding: 8, borderRadius: 12 },
  loadMoreBtn: {
    backgroundColor: '#38bdf8', padding: 16, borderRadius: 16, alignItems: 'center',
    marginTop: 24, marginBottom: 60,
  },
  loadMoreText: { color: 'white', fontWeight: '700', fontSize: 16 },
  expandedLabel: { color: '#cbd5e1', fontSize: 13, marginBottom: 6 },
  feedbackText: { color: '#e2e8f0', fontSize: 14, fontStyle: 'italic', marginBottom: 6 },
  ratingRow: { flexDirection: 'row', marginBottom: 6 },
});
