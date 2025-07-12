import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Image, Linking, Platform, TextInput, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { MotiView, MotiImage, MotiText, AnimatePresence } from 'moti';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedScrollHandler, useSharedValue, interpolate, useAnimatedStyle } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [faqOpen, setFaqOpen] = useState(-1);
  const [userId, setUserId] = useState(null);
  const scrollY = useSharedValue(0);

  useEffect(() => {
  const checkAdmin = async () => {
    const data = await AsyncStorage.getItem('userData');
    const parsed = data ? JSON.parse(data) : null;
    if (parsed?.role === 'admin') {
      router.replace('/(tabs)/profile'); 
    }
  };
  checkAdmin();
}, []);

  useEffect(() => {
    AsyncStorage.getItem('userId').then(setUserId);
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const addToCart = async (item) => {
    if (!userId) return alert('User not logged in');
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/cart/${userId}`);
      const existingCart = res.data?.items || [];
      const index = existingCart.findIndex((i) => i.name === item.name);
      if (index >= 0) {
        existingCart[index].quantity += 1;
      } else {
        existingCart.push({ ...item, quantity: 1, image: item.img });
      }
      await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/cart/save/${userId}`, { items: existingCart });
      alert('✅ Added to cart');
      router.push('/cart');
    } catch (err) {
      alert('❌ Failed to add to cart');
    }
    setLoading(false);
  };

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scrollY.value, [0, height * 0.2], [0, -height * 0.1], 'clamp') }],
    opacity: interpolate(scrollY.value, [0, height * 0.15], [1, 0.6], 'clamp'),
  }));

  return (
    <View style={styles.container}>
      <MotiImage
        source={{ uri: 'https://images.pexels.com/photos/3683056/pexels-photo-3683056.jpeg' }}
        style={styles.background}
        from={{ opacity: 0, scale: 1.3 }}
        animate={{ opacity: 0.4, scale: 1, translateY: scrollY.value * 0.3 }}
        transition={{ type: 'timing', duration: 1000, loop: Platform.OS !== 'web' }}
      />
      <View style={styles.overlay} />

      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: width * 0.05 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <Animated.View style={[styles.hero, headerStyle]}>
          <MotiView
            from={{ opacity: 0, translateY: width * 0.2, scale: 0.85 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15, mass: 0.7, duration: Platform.OS === 'web' ? 600 : 800 }}
          >
            <Text style={styles.heading}>
              Welcome to <Text style={{ color: '#34D399' }}>MediCare+</Text>
            </Text>
            <MotiText
              from={{ opacity: 0, translateY: width * 0.05 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', delay: 200, stiffness: 90, damping: 14 }}
              style={styles.subheading}
            >
              India’s #1 Digital Pharmacy & Medical Marketplace
            </MotiText>
            <TouchableOpacity onPress={() => router.push('/shop')}>
              <MotiView
                from={{ scale: 1, rotateZ: '0deg' }}
                whileHover={{ scale: Platform.OS === 'web' ? 1.05 : 1, rotateZ: Platform.OS === 'web' ? '2deg' : '0deg' }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 180, damping: 12 }}
              >
                <LinearGradient colors={['#3B82F6', '#22C55E']} style={styles.btnPrimary}>
                  <Text style={styles.btnText}>Shop Medicines</Text>
                </LinearGradient>
              </MotiView>
            </TouchableOpacity>
          </MotiView>
        </Animated.View>

        <MotiView
          style={styles.sectionRow}
          from={{ opacity: 0, translateY: width * 0.1 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 400, stiffness: 90, damping: 15 }}
        >
          {['Express Delivery', '100% Genuine', '24/7 Support', 'Expert Verified'].map((title, index) => (
            <FeatureCard
              key={index}
              icon={`https://cdn-icons-png.flaticon.com/512/3534/353406${[9, 5, 2, 1][index]}.png`}
              title={title}
              index={index}
            />
          ))}
        </MotiView>

        <SectionHeading title="Shop by Category" />
        <View style={styles.catGrid}>
          {categories.map((category, index) => (
            <CategoryCard
              key={index}
              icon={category.icon}
              label={category.label}
              index={index}
            />
          ))}
        </View>

        <SectionHeading title="Popular Products" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: width * 0.03 }}>
          {[
            { img: 'https://images.pexels.com/photos/3683098/pexels-photo-3683098.jpeg?auto=compress&cs=tinysrgb&w=600', name: 'Paracetamol 500mg', price: '₹35', offPrice: '₹60' },
            { img: 'https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb&w=600', name: 'N95 Mask', price: '₹79', offPrice: '₹120' },
            { img: 'https://images.pexels.com/photos/3683108/pexels-photo-3683108.jpeg?auto=compress&cs=tinysrgb&w=600', name: 'Vitamin D3', price: '₹249', offPrice: '₹299' },
            { img: 'https://images.pexels.com/photos/3683056/pexels-photo-3683056.jpeg?auto=compress&cs=tinysrgb&w=600', name: 'BP Machine', price: '₹1299', offPrice: '₹1800' },
          ].map((product, index) => (
            <ShopProduct
              key={index}
              img={product.img}
              name={product.name}
              price={product.price}
              offPrice={product.offPrice}
              addToCart={addToCart}
              index={index}
            />
          ))}
        </ScrollView>

        <SectionHeading title="Exclusive for You" />
        <View style={styles.offerBanner}>
          <MotiImage
            source={{ uri: 'https://images.pexels.com/photos/139398/pexels-photo-139398.jpeg?auto=compress&cs=tinysrgb&w=600' }}
            style={styles.offerImg}
            from={{ opacity: 0, scale: 0.8, rotateZ: '-8deg' }}
            animate={{ opacity: 1, scale: 1, rotateZ: '0deg' }}
            transition={{ type: 'spring', stiffness: 120, damping: 14, duration: Platform.OS === 'web' ? 600 : 800 }}
          />
          <View style={{ flex: 1, paddingLeft: width * 0.03 }}>
            <MotiText
              from={{ opacity: 0, translateX: width * 0.05 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'spring', delay: 300, stiffness: 90, damping: 14 }}
              style={styles.offerSmall}
            >
              Use code <Text style={{ fontWeight: 'bold' }}>MEDI20</Text> at checkout
            </MotiText>
            <TouchableOpacity onPress={() => router.push('/shop')}>
              <MotiView
                from={{ scale: 1, rotateZ: '0deg' }}
                whileHover={{ scale: Platform.OS === 'web' ? 1.05 : 1, rotateZ: Platform.OS === 'web' ? '2deg' : '0deg' }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 180, damping: 12 }}
              >
                <LinearGradient colors={['#3B82F6', '#22C55E']} style={styles.btnMini}>
                  <Text style={styles.btnText}>Shop Medicines</Text>
                </LinearGradient>
              </MotiView>
            </TouchableOpacity>
          </View>
        </View>

        <SectionHeading title="Health Tips & Blogs" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: width * 0.03 }}>
          {[
            { img: 'https://images.unsplash.com/photo-1618498317473-b32c6e7b1fbf?auto=format&fit=crop&w=600&q=80', title: 'How to Boost Your Immunity' },
            { img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600&q=80', title: 'Benefits of Regular Exercise' },
            { img: 'https://images.unsplash.com/photo-1490818387583-1b2a9dc335f6?auto=format&fit=crop&w=600&q=80', title: '5 Diet Mistakes to Avoid' },
          ].map((blog, index) => (
            <BlogCard
              key={index}
              img={blog.img}
              title={blog.title}
              index={index}
            />
          ))}
        </ScrollView>

        <SectionHeading title="Frequently Asked Questions" />
        <View style={{ paddingHorizontal: width * 0.035, marginBottom: width * 0.03 }}>
          {faqs.map((faq, i) => (
            <FaqItem
              key={i}
              idx={i}
              open={faqOpen === i}
              setOpen={setFaqOpen}
              q={faq.q}
              a={faq.a}
            />
          ))}
        </View>

        <SectionHeading title="Get the App" />
        <View style={styles.dlSection}>
          <MotiText
            from={{ opacity: 0, translateY: width * 0.05 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', duration: 800, delay: 200, stiffness: 90, damping: 14 }}
            style={styles.dlDesc}
          >
            Experience the fastest medical delivery, exclusive deals, and 1-click digital prescription upload with our app!
          </MotiText>
          <View style={styles.dlRow}>
            {[
              { platform: 'Google Play', url: 'https://play.google.com', icon: 'android' },
              { platform: 'App Store', url: 'https://apple.com/app-store', icon: 'apple' },
            ].map((item, index) => (
              <TouchableOpacity key={index} onPress={() => Linking.openURL(item.url)}>
                <MotiView
                  from={{ scale: 1, rotateZ: '0deg' }}
                  whileHover={{ scale: Platform.OS === 'web' ? 1.1 : 1, rotateZ: Platform.OS === 'web' ? `${index % 2 === 0 ? 5 : -5}deg` : '0deg' }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 160, damping: 12 }}
                >
                  <LinearGradient colors={['#3B82F6', '#22C55E']} style={styles.dlBtn}>
                    <FontAwesome name={item.icon} size={width * 0.06} color="#fff" />
                    <Text style={styles.dlBtnText}>{item.platform}</Text>
                  </LinearGradient>
                </MotiView>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <SectionHeading title="Loved by Customers" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: width * 0.025, marginBottom: width * 0.025 }}>
          {[
            { user: 'Anjali R.', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', msg: 'Excellent service! Medicines delivered on time and prices were affordable.' },
            { user: 'Ravi K.', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', msg: 'Very professional and smooth experience. Will order again!' },
            { user: 'Sarah P.', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80', msg: 'Easy interface, good product selection. Saved my family during covid.' },
          ].map((testimonial, index) => (
            <Testimonial
              key={index}
              user={testimonial.user}
              img={testimonial.img}
              msg={testimonial.msg}
              index={index}
            />
          ))}
        </ScrollView>

        <Footer />
      </Animated.ScrollView>
    </View>
  );
}

function FeatureCard({ icon, title, index }) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.8, rotateX: '-10deg', translateY: width * 0.05 }}
      animate={{ opacity: 1, scale: 1, rotateX: '0deg', translateY: 0 }}
      transition={{ type: 'spring', duration: 600, delay: index * 100, stiffness: 100, damping: 14 }}
      style={styles.featureCard}
    >
      <Image source={{ uri: icon }} style={styles.featureIcon} cache="force-cache" />
      <Text style={styles.featureText}>{title}</Text>
    </MotiView>
  );
}

function CategoryCard({ icon, label, index }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: width * 0.1, rotateY: '-10deg' }}
      animate={{ opacity: 1, translateY: 0, rotateY: '0deg' }}
      transition={{ type: 'spring', duration: 600, delay: index * 150, stiffness: 90, damping: 14 }}
      style={styles.catCard}
    >
      <Image source={{ uri: icon }} style={styles.catIcon} cache="force-cache" />
      <Text style={styles.catLabel}>{label}</Text>
    </MotiView>
  );
}

function ShopProduct({ img, name, price, offPrice, addToCart, index }) {
  const item = {
    name,
    price: parseFloat(price.replace('₹', '')),
    offPrice: parseFloat(offPrice.replace('₹', '')),
    img,
    category: 'Others',
  };

  return (
    <MotiView
      from={{ opacity: 0, translateX: width * 0.1, scale: 0.9 }}
      animate={{ opacity: 1, translateX: 0, scale: 1 }}
      transition={{ type: 'spring', duration: 600, delay: index * 100, stiffness: 100, damping: 14 }}
      style={styles.productCard}
    >
      <Image source={{ uri: img }} style={styles.prodImg} cache="force-cache" />
      <Text style={styles.prodName}>{name}</Text>
      <Text style={styles.prodPrice}>
        <Text style={{ color: '#22C55E' }}>{price}</Text>{' '}
        <Text style={styles.prodOff}>{offPrice}</Text>
      </Text>
      <TouchableOpacity onPress={() => addToCart(item)}>
        <MotiView
          from={{ scale: 1 }}
          whileHover={{ scale: Platform.OS === 'web' ? 1.05 : 1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 180, damping: 12 }}
        >
          <LinearGradient colors={['#3B82F6', '#22C55E']} style={styles.btnMini}>
            <Text style={styles.btnMiniText}>Add to Cart</Text>
          </LinearGradient>
        </MotiView>
      </TouchableOpacity>
    </MotiView>
  );
}

function SectionHeading({ title }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: width * 0.05 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', duration: 500, stiffness: 90, damping: 14 }}
    >
      <Text style={styles.secHeading}>{title}</Text>
    </MotiView>
  );
}

function BlogCard({ img, title, index }) {
  return (
    <MotiView
      from={{ opacity: 0, translateX: width * 0.1, scale: 0.9 }}
      animate={{ opacity: 1, translateX: 0, scale: 1 }}
      transition={{ type: 'spring', duration: 600, delay: index * 100, stiffness: 100, damping: 14 }}
      style={styles.blogCard}
    >
      <Image source={{ uri: img }} style={styles.blogImg} cache="force-cache" />
      <Text style={styles.blogTitle}>{title}</Text>
    </MotiView>
  );
}

function FaqItem({ idx, open, setOpen, q, a }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: width * 0.05 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', duration: 500, delay: idx * 100, stiffness: 90, damping: 14 }}
      style={styles.faqCard}
    >
      <TouchableOpacity
        onPress={() => setOpen(open ? -1 : idx)}
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Text style={styles.faqQ}>{q}</Text>
        <MotiView
          from={{ rotate: '0deg' }}
          animate={{ rotate: open ? '180deg' : '0deg' }}
          transition={{ type: 'spring', duration: 300, stiffness: 120, damping: 14 }}
        >
          <Ionicons name={open ? 'chevron-up-circle' : 'chevron-down-circle'} size={width * 0.06} color="#3B82F6" />
        </MotiView>
      </TouchableOpacity>
      <AnimatePresence>
        {open && (
          <MotiView
            from={{ opacity: 0, translateY: -width * 0.025 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -width * 0.025 }}
            transition={{ type: 'spring', duration: 350, stiffness: 90, damping: 14 }}
          >
            <Text style={styles.faqA}>{a}</Text>
          </MotiView>
        )}
      </AnimatePresence>
    </MotiView>
  );
}

function Testimonial({ user, msg, img, index }) {
  return (
    <MotiView
      from={{ opacity: 0, translateX: width * 0.1, scale: 0.9 }}
      animate={{ opacity: 1, translateX: 0, scale: 1 }}
      transition={{ type: 'spring', duration: 600, delay: index * 100, stiffness: 100, damping: 14 }}
      style={styles.testimonialCard2}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image source={{ uri: img }} style={{ width: width * 0.1, height: width * 0.1, borderRadius: width * 0.05, marginRight: width * 0.025 }} cache="force-cache" />
        <Text style={styles.testimonialUser2}>{user}</Text>
      </View>
      <Text style={styles.testimonialMsg2}>"{msg}"</Text>
    </MotiView>
  );
}

function Footer() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNewsletterSignup = async () => {
    const storedUserId = await AsyncStorage.getItem('userId');

  if (!storedUserId) {
    Alert.alert('Login Required', 'Please log in before subscribing.');
    return;
  }
  if(!email) {
    Alert.alert('Email Required', 'Please enter your email to subscribe.');
    return;
  }
  const adminEmail = `${process.env.EXPO_PUBLIC_ADMIN_EMAIL}` || '';
  console.log('Admin Email from env:', adminEmail);

  if (email.toLowerCase() === adminEmail.toLowerCase()) {
    Alert.alert('Subscription Denied', 'Admin email cannot be used for subscription.');
    return;
  }
  setLoading(true);

  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/cart/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json',Authorization: `Bearer ${storedUserId}` },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();
    if (result.success) {
      Alert.alert('Subscribed!', 'Check your inbox for confirmation.');
      setEmail('');
    } else {
      if (result.error?.toLowerCase().includes('already subscribed')) {
        Alert.alert('Already Subscribed', 'This email is already on our list.');
      } else {
        Alert.alert('Error', result.error || 'Something went wrong');
      }
    }
  } catch (err) {
    Alert.alert('Network Error', 'Failed to subscribe. Try again later.');
  } finally {
    setLoading(false);
  }
};

  return (
    <MotiView
      from={{ opacity: 0, translateY: width * 0.05 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', duration: 600, stiffness: 90, damping: 14 }}
    >
      <LinearGradient colors={['#1E3A8A', '#2B6CB0']} style={styles.footerMega}>
        <View style={styles.footerRowTop}>
          <View style={{ flex: 1 }}>
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', duration: 500, delay: 100, stiffness: 90, damping: 14 }}
            >
              <Text style={styles.logoFooter}>MediCare+</Text>
              <Text style={styles.footerSlogan}>Your Trusted Health Partner</Text>
              <Text style={styles.footerTagline}>Empowering Health, One Click at a Time</Text>
            </MotiView>
          </View>
          <View style={styles.socialIcons}>
            {['facebook', 'instagram', 'twitter'].map((platform, index) => (
              <MotiView
                key={platform}
                from={{ scale: 1 }}
                whileHover={{ scale: Platform.OS === 'web' ? 1.1 : 1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', duration: 200, stiffness: 160, damping: 12 }}
                style={{ marginHorizontal: width * 0.025 }}
              >
                <TouchableOpacity onPress={() => Linking.openURL(`https://${platform}.com`)}>
                  <FontAwesome name={platform} color="#F8FAFC" size={width * 0.07} />
                </TouchableOpacity>
              </MotiView>
            ))}
          </View>
        </View>

        <MotiView
          from={{ opacity: 0, translateY: width * 0.025 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', duration: 500, delay: 200, stiffness: 90, damping: 14 }}
        >
          <View style={styles.newsletterSection}>
            <Text style={styles.newsletterHeading}>Stay Updated with MediCare+</Text>
            <Text style={styles.newsletterText}>Subscribe for exclusive offers and health tips!</Text>
            <View style={styles.newsletterInputContainer}>
              <TextInput
                style={styles.newsletterInput}
                placeholder="Enter your email"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={handleNewsletterSignup} disabled={loading}>
  <MotiView
    from={{ scale: 1 }}
    whileHover={{ scale: Platform.OS === 'web' ? 1.05 : 1 }}
    whileTap={{ scale: 0.95 }}
    transition={{ type: 'spring', duration: 200, stiffness: 160, damping: 12 }}
  >
    <LinearGradient colors={['#22C55E', '#34D399']} style={styles.newsletterButton}>
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={styles.newsletterButtonText}>Subscribe</Text>
      )}
    </LinearGradient>
  </MotiView>
</TouchableOpacity>

            </View>
          </View>
        </MotiView>

        <View style={styles.footerLinksRow}>
          <FooterLinkCol
            heading="Company"
            links={[{ text: 'About', url: '#' }, { text: 'Careers', url: '#' }, { text: 'Blog', url: '#' }, { text: 'Partners', url: '#' }]}
            delay={300}
          />
          <FooterLinkCol
            heading="Support"
            links={[{ text: 'Contact', url: '#' }, { text: 'FAQ', url: '#' }, { text: 'Returns', url: '#' }, { text: 'Live Chat', url: '#' }]}
            delay={400}
          />
          <FooterLinkCol
            heading="Legal"
            links={[{ text: 'Privacy', url: '#' }, { text: 'Terms', url: '#' }, { text: 'Sitemap', url: '#' }, { text: 'Compliance', url: '#' }]}
            delay={500}
          />
        </View>

        <MotiView
          from={{ opacity: 0, translateY: width * 0.025 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', duration: 500, delay: 600, stiffness: 90, damping: 14 }}
        >
          <Text style={styles.copyRight}>© 2025 MediCare+. All rights reserved.</Text>
          <Text style={styles.footerCredit}>Images by Flaticon, Pexels, Unsplash | Powered by MediCare+</Text>
        </MotiView>
      </LinearGradient>
    </MotiView>
  );
}

function FooterLinkCol({ heading, links, delay }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: width * 0.025 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', duration: 500, delay, stiffness: 90, damping: 14 }}
      style={styles.footerCol}
    >
      <Text style={styles.footerHead}>{heading}</Text>
      {links.map((l, i) => (
        <MotiView
          key={i}
          from={{ opacity: 0, translateX: -width * 0.025 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'spring', duration: 400, delay: delay + i * 50, stiffness: 90, damping: 14 }}
        >
          <TouchableOpacity onPress={() => Linking.openURL(l.url)}>
            <Text style={styles.footerLink}>{l.text}</Text>
          </TouchableOpacity>
        </MotiView>
      ))}
    </MotiView>
  );
}

const categories = [
  { label: 'Tablets', icon: 'https://cdn-icons-png.flaticon.com/512/4338/4338116.png' },
  { label: 'Syrup', icon: 'https://cdn-icons-png.flaticon.com/512/4338/4338110.png' },
  { label: 'Supplement', icon: 'https://cdn-icons-png.flaticon.com/512/4338/4338132.png' },
  { label: 'Device', icon: 'https://cdn-icons-png.flaticon.com/512/4338/4338126.png' },
  { label: 'Safety', icon: 'https://cdn-icons-png.flaticon.com/512/4338/4338140.png' },
  { label: 'Personal Care', icon: 'https://cdn-icons-png.flaticon.com/512/4338/4338118.png' },
  { label: 'First Aid', icon: 'https://cdn-icons-png.flaticon.com/512/4338/4338120.png' },
  { label: 'Drops', icon: 'https://cdn-icons-png.flaticon.com/512/4338/4338114.png' },
  { label: 'Test Kit', icon: 'https://cdn-icons-png.flaticon.com/512/4338/4338128.png' },
];

const faqs = [
  {
    q: 'How do I order medicine online?',
    a: 'Just use the search bar and add products to your cart. Upload prescription where needed, and checkout!',
  },
  {
    q: 'How fast is the delivery?',
    a: 'Express delivery as quick as 2 hours for metro cities. Rest within 1-2 days PAN India.',
  },
  {
    q: 'Is my prescription safe?',
    a: 'Absolutely. Your documents are securely encrypted and handled by verified pharmacists only.',
  },
];

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative', backgroundColor: '#F8FAFC' },
  background: {
    position: 'absolute',
    width,
    height: height * 0.4,
    top: 0,
    zIndex: -1,
  },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.7)' },
  hero: {
    paddingTop: height * 0.12,
    alignItems: 'center',
    paddingHorizontal: width * 0.06,
    marginBottom: width * 0.04,
  },
  heading: {
    fontSize: width * 0.09,
    fontWeight: '900',
    color: '#1E3A8A',
    textAlign: 'center',
    marginBottom: width * 0.02,
    fontFamily: Platform.select({ ios: 'Inter-Black', android: 'Inter-Black', default: 'sans-serif' }),
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subheading: {
    fontSize: width * 0.045,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: width * 0.07,
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: 'sans-serif' }),
  },
  btnPrimary: {
    paddingVertical: width * 0.035,
    paddingHorizontal: width * 0.12,
    borderRadius: width * 0.08,
    marginBottom: width * 0.03,
    elevation: Platform.OS === 'web' ? 2 : 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  btnText: {
    color: '#fff',
    fontSize: width * 0.045,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold', default: 'sans-serif' }),
  },
  btnOutlineSmall: {
    borderColor: '#3B82F6',
    borderWidth: 1.5,
    borderRadius: width * 0.06,
    paddingHorizontal: width * 0.045,
    paddingVertical: width * 0.02,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  btnOutlineText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: width * 0.035,
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold', default: 'sans-serif' }),
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: width * 0.03,
    marginTop: width * 0.02,
    marginBottom: width * 0.05,
  },
  secHeading: {
    fontSize: width * 0.06,
    fontWeight: '800',
    color: '#1E3A8A',
    marginTop: width * 0.1,
    marginBottom: width * 0.04,
    marginLeft: width * 0.04,
    fontFamily: Platform.select({ ios: 'Inter-Black', android: 'Inter-Black', default: 'sans-serif' }),
    letterSpacing: 0.3,
  },
  featureCard: {
    alignItems: 'center',
    width: width * 0.22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: width * 0.04,
    padding: width * 0.03,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    elevation: Platform.OS === 'web' ? 2 : 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  featureIcon: { width: width * 0.12, height: width * 0.12, marginBottom: width * 0.02 },
  featureText: {
    color: '#1E3A8A',
    fontSize: width * 0.035,
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold', default: 'sans-serif' }),
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: width * 0.03,
    justifyContent: 'space-between',
    marginBottom: width * 0.03,
  },
  catCard: {
    alignItems: 'center',
    width: width * 0.3,
    marginVertical: width * 0.02,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: width * 0.04,
    paddingVertical: width * 0.035,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    elevation: Platform.OS === 'web' ? 2 : 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  catIcon: { width: width * 0.12, height: width * 0.12, marginBottom: width * 0.02 },
  catLabel: {
    color: '#1E3A8A',
    fontWeight: '700',
    fontSize: width * 0.035,
    fontFamily: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold', default: 'sans-serif' }),
    textAlign: 'center',
  },
  productCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: width * 0.04,
    padding: width * 0.035,
    marginRight: width * 0.04,
    width: width * 0.55,
    marginBottom: width * 0.02,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    elevation: Platform.OS === 'web' ? 2 : 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  prodImg: { width: '100%', height: width * 0.25, borderRadius: width * 0.03, marginBottom: width * 0.02 },
  prodName: {
    fontWeight: '700',
    fontSize: width * 0.0375,
    marginBottom: width * 0.01,
    color: '#1E3A8A',
    fontFamily: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold', default: 'sans-serif' }),
  },
  prodPrice: {
    fontWeight: '700',
    color: '#22C55E',
    marginBottom: width * 0.015,
    fontSize: width * 0.0375,
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold', default: 'sans-serif' }),
  },
  prodOff: {
    textDecorationLine: 'line-through',
    color: '#64748B',
    fontSize: width * 0.0325,
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: 'sans-serif' }),
  },
  btnMini: {
    borderRadius: width * 0.06,
    paddingHorizontal: width * 0.05,
    paddingVertical: width * 0.02,
    alignItems: 'center',
  },
  btnMiniText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.035,
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold', default: 'sans-serif' }),
  },
  offerBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: width * 0.04,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: width * 0.04,
    padding: width * 0.035,
    marginBottom: width * 0.03,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    elevation: Platform.OS === 'web' ? 2 : 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  offerImg: { width: width * 0.2, height: width * 0.2, borderRadius: width * 0.04, marginRight: width * 0.03 },
  offerHeading: {
    fontWeight: '800',
    fontSize: width * 0.04,
    color: '#1E3A8A',
    marginBottom: width * 0.01,
    fontFamily: Platform.select({ ios: 'Inter-Black', android: 'Inter-Black', default: 'sans-serif' }),
  },
  offerSmall: {
    color: '#1E293B',
    fontSize: width * 0.035,
    marginBottom: width * 0.02,
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: 'sans-serif' }),
  },
  blogCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: width * 0.04,
    alignItems: 'center',
    width: width * 0.6,
    padding: width * 0.035,
    marginRight: width * 0.04,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    elevation: Platform.OS === 'web' ? 2 : 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  blogImg: { width: '100%', height: width * 0.2, borderRadius: width * 0.03, marginBottom: width * 0.02 },
  blogTitle: {
    fontWeight: '700',
    fontSize: width * 0.0375,
    color: '#1E3A8A',
    fontFamily: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold', default: 'sans-serif' }),
  },
  faqCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: width * 0.04,
    marginBottom: width * 0.025,
    paddingHorizontal: width * 0.04,
    paddingVertical: width * 0.035,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    elevation: Platform.OS === 'web' ? 2 : 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  faqQ: {
    fontWeight: '700',
    fontSize: width * 0.04,
    color: '#1E3A8A',
    flex: 1,
    fontFamily: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold', default: 'sans-serif' }),
  },
  faqA: {
    marginTop: width * 0.02,
    color: '#1E293B',
    fontSize: width * 0.035,
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: 'sans-serif' }),
  },
  dlSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: width * 0.04,
    borderRadius: width * 0.04,
    padding: width * 0.05,
    marginBottom: width * 0.05,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    elevation: Platform.OS === 'web' ? 2 : 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  dlDesc: {
    color: '#1E3A8A',
    marginBottom: width * 0.035,
    fontWeight: '500',
    fontSize: width * 0.0375,
    letterSpacing: 0.2,
    fontFamily: Platform.select({ ios: 'Inter-Medium', android: 'Inter-Medium', default: 'sans-serif' }),
  },
  dlRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dlBtn: {
    flexDirection: 'row',
    paddingVertical: width * 0.025,
    paddingHorizontal: width * 0.05,
    borderRadius: width * 0.06,
    alignItems: 'center',
    marginRight: width * 0.035,
  },
  dlBtnText: {
    color: '#F8FAFC',
    marginLeft: width * 0.03,
    fontWeight: '700',
    fontSize: width * 0.04,
    fontFamily: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold', default: 'sans-serif' }),
  },
  testimonialCard2: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: width * 0.04,
    borderRadius: width * 0.04,
    marginRight: width * 0.04,
    marginBottom: width * 0.01,
    minWidth: width * 0.58,
    maxWidth: width * 0.66,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    elevation: Platform.OS === 'web' ? 2 : 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  testimonialUser2: {
    fontWeight: '700',
    fontSize: width * 0.04,
    color: '#065F46',
    fontFamily: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold', default: 'sans-serif' }),
  },
  testimonialMsg2: {
    fontSize: width * 0.035,
    fontStyle: 'italic',
    color: '#1E293B',
    marginTop: width * 0.02,
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: 'sans-serif' }),
  },
  footerMega: {
    paddingTop: width * 0.08,
    paddingBottom: width * 0.1,
    paddingHorizontal: width * 0.05,
    borderTopLeftRadius: width * 0.06,
    borderTopRightRadius: width * 0.06,
    elevation: Platform.OS === 'web' ? 2 : 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  footerRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: width * 0.06,
  },
  logoFooter: {
    fontWeight: '900',
    fontSize: width * 0.075,
    color: '#F8FAFC',
    marginBottom: width * 0.015,
    fontFamily: Platform.select({ ios: 'Inter-Black', android: 'Inter-Black', default: 'sans-serif' }),
  },
  footerSlogan: {
    color: '#DBEAFE',
    fontSize: width * 0.04,
    marginBottom: width * 0.02,
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: 'sans-serif' }),
  },
  footerTagline: {
    color: '#BFDBFE',
    fontSize: width * 0.035,
    fontStyle: 'italic',
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: 'sans-serif' }),
  },
  socialIcons: { flexDirection: 'row', alignItems: 'center', gap: width * 0.03 },
  newsletterSection: {
    marginBottom: width * 0.06,
    padding: width * 0.04,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: width * 0.04,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  newsletterHeading: {
    fontSize: width * 0.045,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: width * 0.015,
    fontFamily: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold', default: 'sans-serif' }),
  },
  newsletterText: {
    fontSize: width * 0.035,
    color: '#DBEAFE',
    marginBottom: width * 0.03,
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: 'sans-serif' }),
  },
  newsletterInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: width * 0.03,
    paddingHorizontal: width * 0.03,
    paddingVertical: width * 0.02,
  },
  newsletterInput: {
    flex: 1,
    fontSize: width * 0.035,
    color: '#1E3A8A',
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: 'sans-serif' }),
  },
  newsletterButton: {
    borderRadius: width * 0.025,
    paddingHorizontal: width * 0.04,
    paddingVertical: width * 0.02,
  },
  newsletterButtonText: {
    color: '#FFFFFF',
    fontSize: width * 0.035,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold', default: 'sans-serif' }),
  },
  footerLinksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: Platform.OS === 'web' ? 'flex-start' : 'space-between',
    marginBottom: width * 0.06,
  },
  footerCol: { marginRight: width * 0.09, marginBottom: width * 0.03, minWidth: width * 0.25 },
  footerHead: {
    fontWeight: '700',
    color: '#DBEAFE',
    marginBottom: width * 0.02,
    fontSize: width * 0.0425,
    fontFamily: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold', default: 'sans-serif' }),
  },
  footerLink: {
    color: '#BFDBFE',
    marginBottom: width * 0.015,
    fontSize: width * 0.0375,
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: 'sans-serif' }),
  },
  copyRight: {
    textAlign: 'center',
    color: '#DBEAFE',
    fontSize: width * 0.0325,
    marginTop: width * 0.03,
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: 'sans-serif' }),
  },
  footerCredit: {
    textAlign: 'center',
    color: '#BFDBFE',
    fontSize: width * 0.03,
    marginTop: width * 0.02,
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: 'sans-serif' }),
  },
});