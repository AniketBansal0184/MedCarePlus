import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Platform,Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useState, useEffect, useCallback } from 'react';
import { MotiView, MotiText } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const PRODUCTS = [
  { id: '1', name: 'Paracetamol 500mg', price: 35, img: 'https://cdn-icons-png.flaticon.com/512/3974/3974019.png', category: 'Tablet' },
  { id: '2', name: 'Vitamin C Tablets', price: 120, img: 'https://cdn-icons-png.flaticon.com/512/947/947029.png', category: 'Supplement' },
  { id: '3', name: 'Cough Syrup', price: 80, img: 'https://cdn-icons-png.flaticon.com/512/2917/2917992.png', category: 'Syrup' },
  { id: '4', name: 'Digital BP Monitor', price: 1299, img: 'https://cdn-icons-png.flaticon.com/512/4645/4645228.png', category: 'Device' },
  { id: '5', name: 'N95 Protective Mask', price: 79, img: 'https://cdn-icons-png.flaticon.com/512/7290/7290060.png', category: 'Safety' },
  { id: '6', name: 'Thermometer', price: 225, img: 'https://cdn-icons-png.flaticon.com/512/9350/9350778.png', category: 'Device' },
  { id: '7', name: 'Hand Sanitizer', price: 45, img: 'https://cdn-icons-png.flaticon.com/512/3018/3018442.png', category: 'Personal Care' },
  { id: '8', name: 'Bandages Pack', price: 60, img: 'https://cdn-icons-png.flaticon.com/512/4215/4215631.png', category: 'First Aid' },
  { id: '9', name: 'Glucose Monitor', price: 1550, img: 'https://cdn-icons-png.flaticon.com/512/4645/4645330.png', category: 'Device' },
  { id: '10', name: 'Nebulizer', price: 1990, img: 'https://cdn-icons-png.flaticon.com/512/4612/4612973.png', category: 'Device' },
  { id: '11', name: 'Antiseptic Cream', price: 120, img: 'https://cdn-icons-png.flaticon.com/512/10123/10123574.png', category: 'First Aid' },
  { id: '12', name: 'Allergy Eye Drops', price: 110, img: 'https://cdn-icons-png.flaticon.com/512/9057/9057347.png', category: 'Drops' },
  { id: '13', name: 'Vitamin D3 Capsules', price: 249, img: 'https://cdn-icons-png.flaticon.com/512/3394/3394934.png', category: 'Supplement' },
  { id: '14', name: 'Insulin Pen', price: 420, img: 'https://cdn-icons-png.flaticon.com/512/712/712934.png', category: 'Device' },
  { id: '15', name: 'Pregnancy Test Kit', price: 78, img: 'https://cdn-icons-png.flaticon.com/512/8191/8191864.png', category: 'Test Kit' },
  { id: '16', name: 'Covid Antigen Kit', price: 299, img: 'https://cdn-icons-png.flaticon.com/512/8183/8183229.png', category: 'Test Kit' },
  { id: '17', name: 'Multivitamin Gummies', price: 210, img: 'https://cdn-icons-png.flaticon.com/512/2189/2189521.png', category: 'Supplement' },
  { id: '18', name: 'Stethoscope', price: 799, img: 'https://cdn-icons-png.flaticon.com/512/167/167052.png', category: 'Device' },
];

export default function Shop() {
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState(PRODUCTS);
  const [localCart, setLocalCart] = useState([]);
  const [addedItemId, setAddedItemId] = useState(null);
  const router = useRouter();

  const fetchCart = async (id) => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/cart/${id}`);
      const items = res.data?.items || [];
      setLocalCart(items);
      await AsyncStorage.setItem(`cart_${id}`, JSON.stringify(items));
    } catch (error) {
      console.error('Fetch cart error:', error.response ? error.response.data : error.message);
      Alert.alert('❌ Failed to fetch cart from server');
      const cached = await AsyncStorage.getItem(`cart_${id}`);
      setLocalCart(cached ? JSON.parse(cached) : []);
    }
    setLoading(false);
  };

  useEffect(() => {
    AsyncStorage.getItem('userId').then(id => {
      setUserId(id);
      if (id) {
        fetchCart(id);
      }
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchCart(userId);
      }
    }, [userId])
  );

  useEffect(() => {
    if (search.trim() === '') setFiltered(PRODUCTS);
    else
      setFiltered(
        PRODUCTS.filter(
          p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.category.toLowerCase().includes(search.toLowerCase())
        )
      );
  }, [search]);

  const syncCart = async (cart) => {
    if (!userId) return;
    try {
      await AsyncStorage.setItem(`cart_${userId}`, JSON.stringify(cart));
      await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/cart/save/${userId}`, { items: cart });
    } catch (error) {
      console.error('Cart sync error:', error.response ? error.response.data : error.message);
      Alert.alert('Error', 'Failed to sync cart with server. Changes saved locally.');
    }
  };

  const addToCart = async (item) => {
    if (!userId) {
      Alert.alert('User not logged in!', '', [
          { text: 'OK', onPress: () => router.push('/login') },
        ]);
      return;
    }

    const newCart = [...localCart];
    const index = newCart.findIndex(i => i.name === item.name);
    if (index >= 0) {
      newCart[index].quantity += 1;
    } else {
      newCart.push({ ...item, quantity: 1, image: item.img });
    }
    setLocalCart(newCart);
    setAddedItemId(item.id);
    setTimeout(() => setAddedItemId(null), 1000);
    await syncCart(newCart);
  };

  return (
    <View style={styles.container}>
      <MotiText
        style={styles.title}
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 18, stiffness: 140 }}
      >
        🛍️ Explore Products
      </MotiText>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={20} color="#2563eb" style={{ marginRight: 8, marginLeft: 4 }} />
        <TextInput
          placeholder="Search medicine, device, vitamin..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#64748b"
          style={styles.searchInput}
        />
      </View>

      {loading && <ActivityIndicator size="large" color="#2563eb" style={{ marginVertical: 20 }} />}

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={{ paddingBottom: 120 }}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 4 }}
        ListEmptyComponent={
          <MotiText
            style={styles.emptyText}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
          >
            No Products Found
          </MotiText>
        }
        renderItem={({ item, index }) => (
          <MotiView
            from={{ opacity: 0, scale: 0.97, translateY: 18 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: 'spring', delay: index * 60, damping: 20, stiffness: 210 }}
            style={styles.card}
          >
            <Image source={{ uri: item.img }} style={styles.img} />
            <Text style={styles.name}>{item.name}</Text>
            <View style={styles.priceWrap}>
              <Text style={styles.price}>₹{item.price}</Text>
              <Text style={styles.cat}>{item.category}</Text>
            </View>
            <TouchableOpacity
              onPress={() => addToCart(item)}
              style={[{ position: 'relative' }, styles.btn]}
            >
              <LinearGradient
                colors={['#60a5fa', '#2563eb']}
                style={styles.btnGradient}
              >
                <Text style={styles.btnText}>
                  {addedItemId === item.id ? 'Added!' : 'Add to Cart'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </MotiView>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
    textShadowColor: 'rgba(37, 99, 235, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(229, 231, 235, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    width: '48%',
    borderWidth: 0.3,
    borderColor: 'rgba(229, 231, 235, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  img: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 0.5,
    borderColor: 'rgba(229, 231, 235, 0.3)',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
    lineHeight: 18,
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16a34a',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
  },
  cat: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563eb',
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  btn: {
    width: '100%',
  },
  btnGradient: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#64748b',
    marginTop: 20,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
});