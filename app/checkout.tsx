import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  Alert,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import debounce from 'lodash.debounce'; 

const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/cart`;
const CONFIRM_URL = `${API_URL}/confirm`;
const CLEAR_URL = `${API_URL}/clear`;
const COUPON_URL = `${API_URL}/apply-coupon`;
const AVAILABLE_COUPONS_URL = `${API_URL}/available-coupons`;

const icons = {
  'Cash on Delivery': { uri: 'https://cdn-icons-png.flaticon.com/512/2920/2920289.png' },
  'Credit Card': { uri: 'https://cdn-icons-png.flaticon.com/512/633/633611.png' },
  'Debit Card': { uri: 'https://cdn-icons-png.flaticon.com/512/2331/2331970.png' },
  'UPI': { uri: 'https://cdn-icons-png.flaticon.com/512/7176/7176581.png' },
  'PayPal': { uri: 'https://cdn-icons-png.flaticon.com/512/174/174861.png' },
  'Net Banking': { uri: 'https://cdn-icons-png.flaticon.com/512/263/263115.png' },
};

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
  'Lakshadweep', 'Puducherry',
];

const Checkout = () => {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponDropdownOpen, setCouponDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shippingDetails, setShippingDetails] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pinCode: '',
    country: 'India',
    phoneNumber: '',
  });
  const [errors, setErrors] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState('');
  const paymentOptions = Object.keys(icons);
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCVC: '',
    upiId: '',
    paypalEmail: '',
  });

  useEffect(() => {
    AsyncStorage.getItem('userId').then((id) => {
      if (id) {
        setUserId(id);
        fetchCart(id);
        fetchAvailableCoupons(); 
      } else {
        Alert.alert('User not logged in', '', [
          { text: 'OK', onPress: () => router.push('/login') },
        ]);
      }
    });

    AsyncStorage.getItem('shippingDetails').then((addr) => {
      if (addr) setShippingDetails(JSON.parse(addr));
    });

    AsyncStorage.getItem('paymentMethod').then((pm) => {
      if (pm) setPaymentMethod(pm);
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('shippingDetails', JSON.stringify(shippingDetails));
  }, [shippingDetails]);

  useEffect(() => {
    AsyncStorage.setItem('paymentMethod', paymentMethod);
  }, [paymentMethod]);

  const fetchCart = async (id) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/${id}`, { timeout: 5000 });
      const items = res.data?.items || [];
      setCartItems(items);
      const totalPrice = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      setTotal(totalPrice);
    } catch (error) {
      console.error('Fetch cart error:', error.message);
      Alert.alert('Failed to fetch cart');
    }
    setLoading(false);
  };

const fetchAvailableCoupons = useCallback(
  debounce(async (query = '') => {
    if (!userId) {
      console.log('No userId provided');
      return;
    }
    setLoading(true);
    try {
      console.log('Fetching coupons for user:', userId, 'with query:', query);
      const res = await axios.get(`${AVAILABLE_COUPONS_URL}/${userId}?query=${query}`, { timeout: 5000 });
      console.log('API response:', res.data);
      setAvailableCoupons(res.data.coupons || []);
      setCouponDropdownOpen(true); 
      if (query && res.data.coupons.length === 0) {
        setCouponMessage('No coupons found');
      } else {
        setCouponMessage('');
      }
    } catch (error) {
      console.error('Fetch coupons error:', {
        message: error.message,
        response: error.response ? error.response.data : null,
      });
      setCouponMessage('Failed to fetch coupons');
      setAvailableCoupons([]);
    }
    setLoading(false);
  }, 300),
  [userId]
);

  const applyCoupon = async (code) => {
    setLoading(true);
    try {
      const res = await axios.post(`${COUPON_URL}/${userId}`, { couponCode: code }, { timeout: 5000 });
      const { discount } = res.data;
      setDiscount(discount);
      setCouponCode(code);
      setCouponMessage(`Coupon ${code} applied! ₹${discount} discount.`);
      setCouponDropdownOpen(false);
    } catch (error) {
      console.error('Apply coupon error:', {
        message: error.message,
        response: error.response ? error.response.data : null,
      });
      setCouponMessage(error.response?.data?.error || 'Invalid coupon code');
      setDiscount(0);
    }
    setLoading(false);
  };

const validateForm = () => {
  const newErrors = {};
  if (!shippingDetails.addressLine1) newErrors.addressLine1 = 'Address Line 1 is required';
  if (!shippingDetails.city) newErrors.city = 'City is required';
  if (!shippingDetails.state) newErrors.state = 'State is required';
  if (!shippingDetails.pinCode || !/^\d{6}$/.test(shippingDetails.pinCode))
    newErrors.pinCode = 'Pin Code must be 6 digits';
  if (!shippingDetails.phoneNumber || !/^\d{10}$/.test(shippingDetails.phoneNumber))
    newErrors.phoneNumber = 'Phone Number must be 10 digits';

  if (paymentMethod === 'Credit Card' || paymentMethod === 'Debit Card') {
    if (!paymentDetails.cardNumber || !/^\d{16}$/.test(paymentDetails.cardNumber))
      newErrors.cardNumber = 'Card Number must be 16 digits';
    if (!paymentDetails.cardExpiry || !/^\d{2}\/\d{2}$/.test(paymentDetails.cardExpiry))
      newErrors.cardExpiry = 'Expiry must be MM/YY';
    if (!paymentDetails.cardCVC || !/^\d{3}$/.test(paymentDetails.cardCVC))
      newErrors.cardCVC = 'CVC must be 3 digits';
  }
  if (paymentMethod === 'UPI' && !paymentDetails.upiId)
    newErrors.upiId = 'UPI ID is required';
  if (paymentMethod === 'PayPal' && !paymentDetails.paypalEmail)
    newErrors.paypalEmail = 'PayPal email is required';

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

  const renderPaymentDetailsForm = () => {
    switch (paymentMethod) {
      case 'Credit Card':
      case 'Debit Card':
        return (
          <>
            <TextInput
              style={[styles.input, errors.cardNumber && styles.inputError]}
              placeholder="Card Number (e.g., 1234 5678 9012 3456)"
              keyboardType="numeric"
              value={paymentDetails.cardNumber}
              onChangeText={(text) => setPaymentDetails({ ...paymentDetails, cardNumber: text.replace(/\s/g, '') })}
              maxLength={16}
            />
            {errors.cardNumber && <Text style={styles.errorText}>{errors.cardNumber}</Text>}
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <TextInput
                  style={[styles.input, errors.cardExpiry && styles.inputError]}
                  placeholder="MM/YY"
                  value={paymentDetails.cardExpiry}
                  onChangeText={(text) => setPaymentDetails({ ...paymentDetails, cardExpiry: text })}
                  maxLength={5}
                />
                {errors.cardExpiry && <Text style={styles.errorText}>{errors.cardExpiry}</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={[styles.input, errors.cardCVC && styles.inputError]}
                  placeholder="CVC"
                  keyboardType="numeric"
                  value={paymentDetails.cardCVC}
                  onChangeText={(text) => setPaymentDetails({ ...paymentDetails, cardCVC: text })}
                  secureTextEntry
                  maxLength={3}
                />
                {errors.cardCVC && <Text style={styles.errorText}>{errors.cardCVC}</Text>}
              </View>
            </View>
          </>
        );
      case 'UPI':
        return (
          <>
            <TextInput
              style={[styles.input, errors.upiId && styles.inputError]}
              placeholder="e.g., username@bank"
              value={paymentDetails.upiId}
              onChangeText={(text) => setPaymentDetails({ ...paymentDetails, upiId: text })}
            />
            {errors.upiId && <Text style={styles.errorText}>{errors.upiId}</Text>}
          </>
        );
      case 'PayPal':
        return (
          <>
            <TextInput
              style={[styles.input, errors.paypalEmail && styles.inputError]}
              placeholder="example@mail.com"
              keyboardType="email-address"
              value={paymentDetails.paypalEmail}
              onChangeText={(text) => setPaymentDetails({ ...paymentDetails, paypalEmail: text })}
            />
            {errors.paypalEmail && <Text style={styles.errorText}>{errors.paypalEmail}</Text>}
          </>
        );
      case 'Net Banking':
        return (
          <Text style={styles.netBankNote}>
            You’ll be redirected to your bank’s secure page after confirming.
          </Text>
        );
      default:
        return null;
    }
  };

  const filteredStates = indianStates.filter((state) =>
    state.toLowerCase().includes(stateSearch.toLowerCase())
  );

  const placeOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Cart Empty', 'Please add items to your cart before checking out.');
      return;
    }

    if (!validateForm()) {
      Alert.alert('Invalid Input', 'Please fill all required fields correctly.');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${CONFIRM_URL}/${userId}`, {
        items: cartItems,
        shippingDetails,
        paymentMethod,
        paymentDetails,
        couponCode: discount > 0 ? couponCode : null,
        discount,
      }, { timeout: 10000 });

      await axios.post(`${CLEAR_URL}/${userId}`, {}, { timeout: 5000 });
      await AsyncStorage.setItem(`cart_${userId}`, JSON.stringify([]));
      setCartItems([]);
      setDiscount(0);
      setCouponCode('');
      setCouponMessage('');
      setAvailableCoupons([]);

      Alert.alert('✅ Order Placed', 'Your order has been placed successfully! Check your email for the invoice.', [
        { text: 'OK', onPress: () => router.push('/') },
      ]);
    } catch (error) {
      console.error('Place order error:', {
        message: error.message,
        response: error.response ? error.response.data : null,
        status: error.response ? error.response.status : null,
      });
      Alert.alert('❌ Checkout Failed', 'Unable to process your order. Please try again.');
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      )}

      <Text style={styles.title}>🧾 Order Summary</Text>

      {cartItems.map((item, index) => (
        <View key={index} style={styles.item}>
          <View style={styles.row}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.qty}>x{item.quantity}</Text>
          </View>
          <Text style={styles.price}>₹{(item.price * item.quantity).toFixed(2)}</Text>
        </View>
      ))}

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎟️ Coupon Code</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.couponInput, couponMessage.includes('Invalid') && styles.inputError]}
            placeholder="Enter coupon code or select from below"
            value={couponCode}
            onFocus={() => fetchAvailableCoupons('')} 
            onChangeText={(text) => {
              setCouponCode(text.toUpperCase());
              fetchAvailableCoupons(text);
            }}
            onSubmitEditing={() => {
              if (couponCode) {
                applyCoupon(couponCode);
              }
            }}
          />
          <TouchableOpacity
            style={[styles.applyButton, { opacity: loading || !couponCode ? 0.6 : 1 }]}
            onPress={() => applyCoupon(couponCode)}
            disabled={loading || !couponCode}
          >
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>
        {couponMessage && (
          <Text style={[styles.couponMessage, couponMessage.includes('applied') ? styles.couponSuccess : styles.errorText]}>
            {couponMessage}
          </Text>
        )}
        {couponDropdownOpen && (
          <View style={styles.dropdown}>
            <Text style={styles.dropdownTitle}>Available Coupons</Text>
            <ScrollView style={{ maxHeight: 150 }}>
              {availableCoupons.length > 0 ? (
                availableCoupons.map((coupon) => (
                  <TouchableOpacity
                    key={coupon.code}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setCouponCode(coupon.code);
                      applyCoupon(coupon.code);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>
                      {coupon.code} - ₹{coupon.discount} off
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noResultsText}>No coupons found</Text>
              )}
            </ScrollView>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📦 Shipping Details</Text>
        <TextInput
          style={[styles.input, errors.addressLine1 && styles.inputError]}
          placeholder="Address Line 1 *"
          value={shippingDetails.addressLine1}
          onChangeText={(text) => setShippingDetails({ ...shippingDetails, addressLine1: text })}
        />
        {errors.addressLine1 && <Text style={styles.errorText}>{errors.addressLine1}</Text>}
        <TextInput
          style={styles.input}
          placeholder="Address Line 2"
          value={shippingDetails.addressLine2}
          onChangeText={(text) => setShippingDetails({ ...shippingDetails, addressLine2: text })}
        />
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <TextInput
              style={[styles.input, errors.city && styles.inputError]}
              placeholder="City *"
              value={shippingDetails.city}
              onChangeText={(text) => setShippingDetails({ ...shippingDetails, city: text })}
            />
            {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <TextInput
              style={[styles.input, errors.pinCode && styles.inputError]}
              placeholder="Pin Code *"
              keyboardType="numeric"
              value={shippingDetails.pinCode}
              onChangeText={(text) => setShippingDetails({ ...shippingDetails, pinCode: text })}
              maxLength={6}
            />
            {errors.pinCode && <Text style={styles.errorText}>{errors.pinCode}</Text>}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setStateDropdownOpen(!stateDropdownOpen)}
          style={[styles.input, styles.dropdownToggle]}
        >
          <Text style={shippingDetails.state ? styles.dropdownText : styles.dropdownPlaceholder}>
            {shippingDetails.state || 'Select State *'}
          </Text>
          <Ionicons name={stateDropdownOpen ? 'chevron-up' : 'chevron-down'} size={20} color="#1e293b" />
        </TouchableOpacity>
        {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
        {stateDropdownOpen && (
          <View style={styles.dropdown}>
            <TextInput
              style={[styles.input, styles.stateSearchInput]}
              placeholder="Search state..."
              value={stateSearch}
              onChangeText={setStateSearch}
            />
            <ScrollView style={{ maxHeight: 150 }}>
              {filteredStates.length > 0 ? (
                filteredStates.map((state) => (
                  <TouchableOpacity
                    key={state}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setShippingDetails({ ...shippingDetails, state });
                      setStateDropdownOpen(false);
                      setStateSearch('');
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{state}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noResultsText}>No states found</Text>
              )}
            </ScrollView>
          </View>
        )}
        <TextInput
          style={[styles.input, errors.phoneNumber && styles.inputError]}
          placeholder="Phone Number *"
          keyboardType="phone-pad"
          value={shippingDetails.phoneNumber}
          onChangeText={(text) => setShippingDetails({ ...shippingDetails, phoneNumber: text })}
          maxLength={10}
        />
        {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💳 Payment Method</Text>
        <TouchableOpacity
          onPress={() => setDropdownOpen(!dropdownOpen)}
          style={styles.dropdownToggle}
        >
          <View style={styles.row}>
            <Image source={icons[paymentMethod]} style={styles.icon} />
            <Text style={styles.dropdownText}>{paymentMethod}</Text>
          </View>
          <Ionicons name={dropdownOpen ? 'chevron-up' : 'chevron-down'} size={20} color="#1e293b" />
        </TouchableOpacity>
        {dropdownOpen && (
          <View style={styles.dropdown}>
            <ScrollView style={{ maxHeight: 200 }}>
            {paymentOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.dropdownItem}
                onPress={() => {
                  setPaymentMethod(option);
                  setDropdownOpen(false);
                }}
              >
                <View style={styles.row}>
                  <Image source={icons[option]} style={styles.icon} />
                  <Text style={styles.dropdownItemText}>{option}</Text>
                </View>
              </TouchableOpacity>
            ))}
            </ScrollView>
          </View>
        )}
        {renderPaymentDetailsForm()}
      </View>

      <View style={styles.totalContainer}>
        <View style={styles.row}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalText}>₹{total.toFixed(2)}</Text>
        </View>
        {discount > 0 && (
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Discount:</Text>
            <Text style={[styles.totalText, styles.discountText]}>-₹{discount.toFixed(2)}</Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={[styles.totalText, { fontWeight: '700' }]}>₹{(total - discount).toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => router.push('/cart')}
        style={[styles.checkoutBtn, { backgroundColor: '#6b7280', marginBottom: 12 }]}
      >
        <Ionicons name="arrow-back" size={22} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.checkoutText}>Back to Cart</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={placeOrder} style={[styles.checkoutBtn, { opacity: loading ? 0.6 : 1 }]} disabled={loading}>
        <Ionicons name="checkmark-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.checkoutText}>Confirm Order</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default Checkout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 18,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
    backgroundColor: '#f8f9ff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 0.5,
    marginBottom: 18,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
  },
  item: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    boxShadow: '0px 4px 12px 000',
    elevation: 6,
    borderWidth: 0.5,
    borderColor: '#e8ecef',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap', 
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  qty: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Roboto',
  },
  price: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 6,
    color: '#2563eb',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginVertical: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 18,
    color: '#1a1a1a',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#1a1a1a',
    fontSize: 15,
    backgroundColor: '#ffffff',
    minHeight: 48,
    marginBottom: 12,
    boxShadow: '0px 2px 8px 000',
    elevation: 4,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Roboto',
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Roboto',
  },
  couponInput: {
    flex: 1,
    marginRight: 8,
  },
  applyButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
  },
  couponMessage: {
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Roboto',
  },
  couponSuccess: {
    color: '#16a34a',
  },
  dropdownToggle: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0px 2px 8px 000',
    elevation: 4,
  },
  dropdown: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 8,
    boxShadow: '0px 4px 12px 000',
    elevation: 6,
    maxHeight: 200,
    width: '100%',
    overflow: 'hidden',
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    width: '100%',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#1a1a1a',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Roboto',
    flexShrink: 1,
    maxWidth: '80%',
  },
  dropdownText: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  dropdownPlaceholder: {
    fontSize: 15,
    color: '#6b7280',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Roboto',
  },
  stateSearchInput: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    padding: 12,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Roboto',
  },
  totalContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 24,
    boxShadow: '0px 4px 12px 000',
    elevation: 6,
  },
  totalLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  totalText: {
    fontSize: 16,
    color: '#2563eb',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Medium' : 'Roboto',
  },
  discountText: {
    color: '#16a34a',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  checkoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 4px 12px 000',
    marginBottom: 20,
  },
  checkoutText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Heavy' : 'Roboto',
    letterSpacing: 0.3,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  netBankNote: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir-Book' : 'Roboto',
  },
});
