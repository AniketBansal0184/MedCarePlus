import {
  View,
  Text,
  StyleSheet,
  FlatList,
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

export default function OrderHistory() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/cart/orders/${userId}`, { timeout: 5000 });
          setOrders(response.data.orders);
          setFilteredOrders(response.data.orders);
        } else {
          Alert.alert('Error', 'User ID not found.');
          router.push('/login');
        }
      } catch (error) {
        console.error('Fetch orders error:', {
          message: error.message,
          response: error.response ? error.response.data : null,
        });
        Alert.alert('Error', 'Failed to fetch order history.');
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    let updatedOrders = [...orders];
    updatedOrders.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    setFilteredOrders(updatedOrders);
  }, [sortOrder, orders]);

  const renderOrder = ({ item }: { item: any }) => (
    <View style={styles.orderItem}>
      <Text style={styles.orderText}>Date: {new Date(item.createdAt).toLocaleDateString()}</Text>
      <Text style={styles.orderText}>Total: ₹{item.total.toFixed(2)}</Text>
      <Text style={styles.orderText}>Items: {item.items.map((i: any) => i.name).join(', ')}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#e0f2fe', '#f8fafc']} style={styles.bgGradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order History</Text>
        </View>
        <View style={styles.filters}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Sort by Date:</Text>
            <View style={styles.filterButtons}>
              <TouchableOpacity
                style={[styles.filterButton, sortOrder === 'desc' && styles.activeFilter]}
                onPress={() => setSortOrder('desc')}
              >
                <Text style={styles.filterButtonText}>Newest</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, sortOrder === 'asc' && styles.activeFilter]}
                onPress={() => setSortOrder('asc')}
              >
                <Text style={styles.filterButtonText}>Oldest</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <FlatList
          data={filteredOrders}
          renderItem={renderOrder}
          keyExtractor={(item, index) => `${item.createdAt}-${index}`}
          contentContainerStyle={styles.orderList}
          ListEmptyComponent={<Text style={styles.emptyText}>No orders found.</Text>}
        />
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
  filters: {
    padding: 16,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    boxShadow: '0px 4px 12px 000',
    elevation: 6,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    marginBottom: 8,
  },
  activeFilter: {
    backgroundColor: '#2563eb',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  orderList: {
    padding: 16,
  },
  orderItem: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    boxShadow: '0px 2px 8px 000',
    elevation: 4,
  },
  orderText: {
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Roboto',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 20,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Roboto',
  },
});
