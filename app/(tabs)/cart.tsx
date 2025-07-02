import { View, Text, FlatList, Image, TouchableOpacity, Alert, StyleSheet, Platform, StatusBar, Modal, Pressable, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { MotiView, MotiText } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = ['All', 'Tablet', 'Syrup', 'Supplement', 'Device', 'Safety', 'Personal Care', 'First Aid', 'Drops', 'Test Kit'];
const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/cart`;
const SAVE_URL = `${API_URL}/save`;
const CLEAR_URL = `${API_URL}/clear`; 

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [userId, setUserId] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchCart = async (id) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/${id}`);
      const items = res.data?.items || [];
      console.log('Fetched cart items:', items);
      setCartItems(items);
      await AsyncStorage.setItem(`cart_${id}`, JSON.stringify(items));
    } catch (error) {
      console.error('Fetch cart error:', error.response ? error.response.data : error.message);
      Alert.alert('❌ Failed to fetch cart from server');
      const cached = await AsyncStorage.getItem(`cart_${id}`);
      setCartItems(cached ? JSON.parse(cached) : []);
    }
    setLoading(false);
  };

  useEffect(() => {
    AsyncStorage.getItem('userId').then(id => {
      if (id) {
        setUserId(id);
        fetchCart(id);
      } else {
        Alert.alert('User not logged in!', '', [
          { text: 'OK', onPress: () => router.push('/login') },
        ]);
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

  const syncCart = async (items) => {
    if (!userId || items.length === 0) return; 
    setLoading(true);
    try {
      await AsyncStorage.setItem(`cart_${userId}`, JSON.stringify(items));
      await axios.post(`${SAVE_URL}/${userId}`, { items });
    } catch (error) {
      console.error('Cart sync error:', {
        message: error.message,
        response: error.response ? error.response.data : null,
        status: error.response ? error.response.status : null,
      });
      Alert.alert('Error', 'Failed to sync cart with server. Changes saved locally.');
    }
    setLoading(false);
  };

  const increaseQty = (index) => {
    const updated = [...cartItems];
    updated[index].quantity += 1;
    setCartItems(updated);
    syncCart(updated);
  };

  const decreaseQty = (index) => {
    const updated = [...cartItems];
    if (updated[index].quantity > 1) {
    updated[index].quantity -= 1;
    setCartItems(updated);
    syncCart(updated);
  } else {
    updated.splice(index, 1);
    if (updated.length === 0) {
      clearCart();
    } else {
      setCartItems(updated);
      syncCart(updated);
    }
  }
  };

  const clearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Clear local state
              setCartItems([]);
              // Clear AsyncStorage
              await AsyncStorage.setItem(`cart_${userId}`, JSON.stringify([]));
              // Attempt to clear backend cart using a dedicated clear endpoint
              let attempts = 3;
              let success = false;
              let lastError = null;

              while (attempts > 0 && !success) {
                try {
                  await axios.post(`${CLEAR_URL}/${userId}`); // Use dedicated clear endpoint
                  success = true;
                } catch (error) {
                  lastError = error;
                  attempts--;
                  if (attempts > 0) {
                    console.log(`Retrying clear cart... Attempts left: ${attempts}`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                  }
                }
              }

              if (success) {
                Alert.alert('Success', 'Cart cleared successfully');
              } else {
                console.error('Clear cart failed after retries:', {
                  message: lastError.message,
                  response: lastError.response ? lastError.response.data : null,
                  status: lastError.response ? lastError.response.status : null,
                });
                Alert.alert('Warning', 'Cart cleared locally. Server sync may be delayed.');
              }
            } catch (error) {
              console.error('Clear cart error:', {
                message: error.message,
                response: error.response ? error.response.data : null,
                status: error.response ? error.response.status : null,
              });
              Alert.alert('Warning', 'Cart cleared locally. Server sync may be delayed.');
              setCartItems([]);
              await AsyncStorage.setItem(`cart_${userId}`, JSON.stringify([]));
            }
            setLoading(false);
          },
        },
      ]
    );
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Cart Empty', 'Please add items to your cart before checking out.');
      return;
    }
    router.push('/checkout');
  };

  const filteredItems = selectedCategory === 'All'
    ? cartItems
    : cartItems.filter(item => item.category && item.category.toLowerCase() === selectedCategory.toLowerCase());

  const total = filteredItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <MotiText
          style={styles.header}
          from={{ opacity: 0, translateX: -20 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 140 }}
        >
          🛒 My Cart
        </MotiText>
        <View style={styles.headerActions}>
          <Pressable
            style={({ pressed }) => [styles.filterButton, pressed && styles.filterButtonPressed]}
            onPress={() => setFilterVisible(true)}
          >
            <Ionicons name="filter" size={18} color="#2563eb" />
            <Text style={styles.filterText}>{selectedCategory}</Text>
          </Pressable>
          {cartItems.length > 0 && (
            <Pressable
              style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}
              onPress={clearCart}
            >
              <Ionicons name="trash-outline" size={18} color="#dc2626" />
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          )}
        </View>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={filterVisible}
        onRequestClose={() => setFilterVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFilterVisible(false)}>
          <MotiView
            from={{ opacity: 0, translateY: 80 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 120 }}
            style={styles.modalContainer}
          >
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
              style={styles.modalContent}
            >
              <Text style={styles.modalTitle}>Filter by Category</Text>
              {CATEGORIES.map((cat, i) => (
                <Pressable
                  key={i}
                  onPress={() => {
                    setSelectedCategory(cat);
                    setFilterVisible(false);
                  }}
                  style={({ pressed }) => [
                    styles.modalOption,
                    selectedCategory === cat && styles.modalOptionActive,
                    pressed && styles.modalOptionPressed,
                  ]}
                >
                  <MotiText
                    style={[
                      styles.modalOptionText,
                      selectedCategory === cat && styles.modalOptionTextActive,
                    ]}
                    from={{ scale: 0.98 }}
                    animate={{ scale: selectedCategory === cat ? 1.03 : 0.98 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 150 }}
                  >
                    {cat}
                  </MotiText>
                </Pressable>
              ))}
              <Pressable
                style={({ pressed }) => [
                  styles.modalCloseButton,
                  pressed && styles.modalCloseButtonPressed,
                ]}
                onPress={() => setFilterVisible(false)}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </Pressable>
            </LinearGradient>
          </MotiView>
        </Pressable>
      </Modal>

      {loading && (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 300 }}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color="#2563eb" />
        </MotiView>
      )}

      <FlatList
        data={filteredItems}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const cartIndex = cartItems.findIndex(x => x.name === item.name);
          return (
            <MotiView
              from={{ opacity: 0, scale: 0.96, translateY: 20 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              transition={{ type: 'spring', delay: index * 80, damping: 20, stiffness: 140 }}
              style={styles.card}
            >
              <Image source={{ uri: item.image || item.img }} style={styles.img} />
              <View style={styles.itemDetails}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.category}>{item.category}</Text>
                <View style={styles.qtyRow}>
                  <Pressable
                    onPress={() => decreaseQty(cartIndex)}
                    style={({ pressed }) => [styles.qtyBtn, pressed && styles.qtyBtnPressed]}
                  >
                    <Text style={styles.qtyBtnText}>−</Text>
                  </Pressable>
                  <MotiText
                    style={styles.qtyText}
                    from={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                  >
                    {item.quantity}
                  </MotiText>
                  <Pressable
                    onPress={() => increaseQty(cartIndex)}
                    style={({ pressed }) => [styles.qtyBtn, pressed && styles.qtyBtnPressed]}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>
              <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.badge}>
                <MotiText
                  style={styles.price}
                  from={{ opacity: 0.8 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: 'timing', duration: 300 }}
                >
                  ₹{item.price * item.quantity}
                </MotiText>
              </LinearGradient>
            </MotiView>
          );
        }}
        ListEmptyComponent={
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
          >
            <Text style={styles.emptyText}>🧺 Cart is empty</Text>
          </MotiView>
        }
      />

      <LinearGradient colors={['#1e3a8a', '#2563eb']} style={styles.footer}>
        <MotiText
          style={styles.total}
          from={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 500 }}
        >
          Total: ₹{total.toFixed(2)}
        </MotiText>
        <Pressable style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]} onPress={handleCheckout}>
          <LinearGradient colors={['#60a5fa', '#3b82f6']} style={styles.btnGradient}>
            <Text style={styles.btnText}>Proceed to Checkout</Text>
          </LinearGradient>
        </Pressable>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: Platform.OS === 'ios' ? 40 : StatusBar.currentHeight + 10,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(229, 231, 235, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  filterButtonPressed: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    transform: [{ scale: 0.95 }],
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
    marginLeft: 6,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  clearButtonPressed: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    transform: [{ scale: 0.95 }],
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
    marginLeft: 6,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
  },
  modalOption: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  modalOptionActive: {
    backgroundColor: '#2563eb',
  },
  modalOptionPressed: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    transform: [{ scale: 0.98 }],
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  modalOptionTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  modalCloseButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: 'rgba(229, 231, 235, 0.9)',
  },
  modalCloseButtonPressed: {
    backgroundColor: 'rgba(209, 213, 219, 0.9)',
    transform: [{ scale: 0.95 }],
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 14,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 0.3,
    borderColor: 'rgba(229, 231, 235, 0.3)',
  },
  img: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(229, 231, 235, 0.3)',
    backgroundColor: '#f8fafc',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    fontWeight: '500',
    color: '#16a34a',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Roboto',
    marginBottom: 6,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    backgroundColor: 'rgba(229, 231, 235, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qtyBtnPressed: {
    backgroundColor: 'rgba(209, 213, 219, 0.9)',
    transform: [{ scale: 0.95 }],
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
  },
  qtyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    width: 36,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  price: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 80,
    color: '#64748b',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Roboto',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  total: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'right',
    color: '#ffffff',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
  },
  btn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  btnPressed: {
    transform: [{ scale: 0.98 }],
  },
  btnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
  },
});