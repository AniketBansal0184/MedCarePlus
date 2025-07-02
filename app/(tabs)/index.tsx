import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Image, Linking, Platform, TextInput } from 'react-native';
import { Video } from 'expo-av';
import { router } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [faqOpen, setFaqOpen] = useState(-1);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('userId').then(setUserId);
  }, []);

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

  return (
    <View style={styles.container}>
      <Video
        source={{ uri: 'https://cdn.pixabay.com/video/2024/05/02/211231-943600483_large.mp4' }}
        isMuted
        rate={1.0}
        resizeMode="cover"
        shouldPlay
        isLooping
        style={styles.video}
      />
      <View style={styles.overlay} />

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={styles.hero}>
          <MotiView
            from={{ opacity: 0, translateY: 30, scale: 0.95 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{ type: 'spring', duration: 800, damping: 20 }}
          >
            <Text style={styles.heading}>
              Welcome to <Text style={{ color: '#34D399' }}>MediCare+</Text>
            </Text>
            <Text style={styles.subheading}>
              India’s #1 Digital Pharmacy & Medical Marketplace
            </Text>
            <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push('/shop')}>
              <Text style={styles.btnText}>Shop Medicines</Text>
            </TouchableOpacity>
          </MotiView>
        </View>

        <MotiView
          style={styles.sectionRow}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 400, duration: 600 }}
        >
          <FeatureCard icon="https://cdn-icons-png.flaticon.com/512/3534/3534069.png" title="Express Delivery" />
          <FeatureCard icon="https://cdn-icons-png.flaticon.com/512/2961/2961335.png" title="100% Genuine" />
          <FeatureCard icon="https://cdn-icons-png.flaticon.com/512/2907/2907762.png" title="24/7 Support" />
          <FeatureCard icon="https://cdn-icons-png.flaticon.com/512/3063/3063171.png" title="Expert Verified" />
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 12 }}>
          <ShopProduct
            img="https://images.pexels.com/photos/3683098/pexels-photo-3683098.jpeg?auto=compress&cs=tinysrgb&w=600"
            name="Paracetamol 500mg"
            price="₹35"
            offPrice="₹60"
            addToCart={addToCart}
          />
          <ShopProduct
            img="https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb&w=600"
            name="N95 Mask"
            price="₹79"
            offPrice="₹120"
            addToCart={addToCart}
          />
          <ShopProduct
            img="https://images.pexels.com/photos/3683108/pexels-photo-3683108.jpeg?auto=compress&cs=tinysrgb&w=600"
            name="Vitamin D3"
            price="₹249"
            offPrice="₹299"
            addToCart={addToCart}
          />
          <ShopProduct
            img="https://images.pexels.com/photos/3683056/pexels-photo-3683056.jpeg?auto=compress&cs=tinysrgb&w=600"
            name="BP Machine"
            price="₹1299"
            offPrice="₹1800"
            addToCart={addToCart}
          />
        </ScrollView>

        <SectionHeading title="Exclusive for You" />
        <View style={styles.offerBanner}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/139398/pexels-photo-139398.jpeg?auto=compress&cs=tinysrgb&w=600' }}
            style={styles.offerImg}
          />
          <View style={{ flex: 1, paddingLeft: 12 }}>
            <Text style={styles.offerHeading}>50% OFF on First Order</Text>
            <Text style={styles.offerSmall}>
              Use code <Text style={{ fontWeight: 'bold' }}>MEDI50</Text> at checkout
            </Text>
            <TouchableOpacity style={styles.btnOutlineSmall} onPress={() => router.push('/shop')}>
              <Text style={styles.btnOutlineText}>Shop Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        <SectionHeading title="Health Tips & Blogs" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 12 }}>
          <BlogCard
            img="https://images.unsplash.com/photo-1618498317473-b32c6e7b1fbf?auto=format&fit=crop&w=600&q=80"
            title="How to Boost Your Immunity"
          />
          <BlogCard
            img="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600&q=80"
            title="Benefits of Regular Exercise"
          />
          <BlogCard
            img="https://images.unsplash.com/photo-1490818387583-1b2a9dc335f6?auto=format&fit=crop&w=600&q=80"
            title="5 Diet Mistakes to Avoid"
          />
        </ScrollView>

        <SectionHeading title="Frequently Asked Questions" />
        <View style={{ paddingHorizontal: 14, marginBottom: 12 }}>
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
          <Text style={styles.dlDesc}>
            Experience the fastest medical delivery, exclusive deals, and 1-click digital prescription upload with our app!
          </Text>
          <View style={styles.dlRow}>
            <TouchableOpacity onPress={() => Linking.openURL('https://play.google.com')} style={styles.dlBtn}>
              <FontAwesome name="android" size={24} color="#fff" />
              <Text style={styles.dlBtnText}>Google Play</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Linking.openURL('https://apple.com/app-store')} style={styles.dlBtn}>
              <FontAwesome name="apple" size={24} color="#fff" />
              <Text style={styles.dlBtnText}>App Store</Text>
            </TouchableOpacity>
          </View>
        </View>

        <SectionHeading title="Loved by Customers" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 10, marginBottom: 10 }}>
          <Testimonial
            user="Anjali R."
            img="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
            msg="Excellent service! Medicines delivered on time and prices were affordable."
          />
          <Testimonial
            user="Ravi K."
            img="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
            msg="Very professional and smooth experience. Will order again!"
          />
          <Testimonial
            user="Sarah P."
            img="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80"
            msg="Easy interface, good product selection. Saved my family during covid."
          />
        </ScrollView>

        <Footer />
      </ScrollView>
    </View>
  );
}

function FeatureCard({ icon, title }) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', duration: 500 }}
    >
      <View style={styles.featureCard}>
        <Image source={{ uri: icon }} style={styles.featureIcon} cache="force-cache" />
        <Text style={styles.featureText}>{title}</Text>
      </View>
    </MotiView>
  );
}

function CategoryCard({ icon, label, index }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', duration: 500, delay: index * 100 }}
    >
      <View style={styles.catCard}>
        <Image source={{ uri: icon }} style={styles.catIcon} cache="force-cache" />
        <Text style={styles.catLabel}>{label}</Text>
      </View>
    </MotiView>
  );
}

function ShopProduct({ img, name, price, offPrice, addToCart }) {
  const item = {
    name,
    price: parseFloat(price.replace('₹', '')),
    offPrice: parseFloat(offPrice.replace('₹', '')),
    img,
    category: 'Others',
  };

  return (
    <MotiView
      from={{ opacity: 0, translateX: 20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'spring', duration: 600 }}
    >
      <View style={styles.productCard}>
        <Image source={{ uri: img }} style={styles.prodImg} cache="force-cache" />
        <Text style={styles.prodName}>{name}</Text>
        <Text style={styles.prodPrice}>
          <Text style={{ color: '#22C55E' }}>{price}</Text>{' '}
          <Text style={styles.prodOff}>{offPrice}</Text>
        </Text>
        <TouchableOpacity style={styles.btnMini} onPress={() => addToCart(item)}>
          <Text style={styles.btnMiniText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </MotiView>
  );
}

function SectionHeading({ title }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', duration: 500 }}
    >
      <Text style={styles.secHeading}>{title}</Text>
    </MotiView>
  );
}

function BlogCard({ img, title }) {
  return (
    <MotiView
      from={{ opacity: 0, translateX: 20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'spring', duration: 600 }}
    >
      <View style={styles.blogCard}>
        <Image source={{ uri: img }} style={styles.blogImg} cache="force-cache" />
        <Text style={styles.blogTitle}>{title}</Text>
      </View>
    </MotiView>
  );
}

function FaqItem({ idx, open, setOpen, q, a }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', duration: 500, delay: idx * 100 }}
    >
      <View style={styles.faqCard}>
        <TouchableOpacity
          onPress={() => setOpen(open ? -1 : idx)}
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Text style={styles.faqQ}>{q}</Text>
          <Ionicons name={open ? 'chevron-up-circle' : 'chevron-down-circle'} size={24} color="#3B82F6" />
        </TouchableOpacity>
        <AnimatePresence>
          {open && (
            <MotiView
              from={{ opacity: 0, translateY: -10 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: -10 }}
              transition={{ type: 'spring', duration: 350 }}
            >
              <Text style={styles.faqA}>{a}</Text>
            </MotiView>
          )}
        </AnimatePresence>
      </View>
    </MotiView>
  );
}

function Testimonial({ user, msg, img }) {
  return (
    <MotiView
      from={{ opacity: 0, translateX: 20 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'spring', duration: 600 }}
    >
      <View style={styles.testimonialCard2}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image source={{ uri: img }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }} cache="force-cache" />
          <Text style={styles.testimonialUser2}>{user}</Text>
        </View>
        <Text style={styles.testimonialMsg2}>"{msg}"</Text>
      </View>
    </MotiView>
  );
}

function Footer() {
  const [email, setEmail] = useState('');

  const handleNewsletterSignup = () => {
    if (!email) return alert('Please enter an email address');
    alert('Thank you for subscribing to MediCare+ updates!');
    setEmail('');
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', duration: 600 }}
    >
      <View style={[styles.footerMega, { backgroundColor: '#1E3A8A' }]}>
        <View style={styles.footerRowTop}>
          <View style={{ flex: 1 }}>
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', duration: 500, delay: 100 }}
            >
              <Text style={styles.logoFooter}>MediCare+</Text>
              <Text style={styles.footerSlogan}>Your Trusted Health Partner</Text>
              <Text style={styles.footerTagline}>Empowering Health, One Click at a Time</Text>
            </MotiView>
          </View>
          <View>
            <View style={styles.socialIcons}>
              <MotiView
                from={{ scale: 1 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', duration: 200 }}
              >
                <TouchableOpacity onPress={() => Linking.openURL('https://facebook.com')}>
                  <FontAwesome name="facebook" color="#F8FAFC" size={28} />
                </TouchableOpacity>
              </MotiView>
              <MotiView
                from={{ scale: 1 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', duration: 200 }}
              >
                <TouchableOpacity onPress={() => Linking.openURL('https://instagram.com')}>
                  <FontAwesome name="instagram" color="#F8FAFC" size={28} style={{ marginHorizontal: 14 }} />
                </TouchableOpacity>
              </MotiView>
              <MotiView
                from={{ scale: 1 }}
                animate={{ scale: 1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', duration: 200 }}
              >
                <TouchableOpacity onPress={() => Linking.openURL('https://twitter.com')}>
                  <FontAwesome name="twitter" color="#F8FAFC" size={28} />
                </TouchableOpacity>
              </MotiView>
            </View>
          </View>
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', duration: 500, delay: 200 }}
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
              <TouchableOpacity style={styles.newsletterButton} onPress={handleNewsletterSignup}>
                <Text style={styles.newsletterButtonText}>Subscribe</Text>
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
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', duration: 500, delay: 600 }}
        >
          <Text style={styles.copyRight}>© 2025 MediCare+. All rights reserved.</Text>
          <Text style={styles.footerCredit}>Images by Flaticon, Pexels, Unsplash | Powered by MediCare+</Text>
        </MotiView>
      </View>
    </MotiView>
  );
}

function FooterLinkCol({ heading, links, delay }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', duration: 500, delay }}
    >
      <View style={styles.footerCol}>
        <Text style={styles.footerHead}>{heading}</Text>
        {links.map((l, i) => (
          <MotiView
            key={i}
            from={{ opacity: 0, translateX: -10 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'spring', duration: 400, delay: delay + i * 50 }}
          >
            <TouchableOpacity onPress={() => Linking.openURL(l.url)}>
              <Text style={styles.footerLink}>{l.text}</Text>
            </TouchableOpacity>
          </MotiView>
        ))}
      </View>
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
  {
    q: 'Do you offer consultation?',
    a: 'Yes! You can consult verified doctors within the app, book appointments, and even chat or video call them.',
  },
];

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative', backgroundColor: '#F8FAFC' },
  video: { position: 'absolute', width, height: height + 100, top: 0 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.7)' },
  hero: {
    paddingTop: 90,
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  heading: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1E3A8A',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: Platform.select({ ios: 'Inter-Black', android: 'Inter-Black', default: 'sans-serif' }),
    letterSpacing: 0.5,
  },
  subheading: {
    fontSize: 18,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 28,
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: 'sans-serif' }),
  },
  btnPrimary: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 32,
    marginBottom: 12,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  btnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold', default: 'sans-serif' }),
  },
  btnOutlineSmall: {
    borderColor: '#3B82F6',
    borderWidth: 1.5,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  btnOutlineText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold', default: 'sans-serif' }),
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  secHeading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E3A8A',
    marginTop: 40,
    marginBottom: 16,
    marginLeft: 16,
    fontFamily: Platform.select({ ios: 'Inter-Black', android: 'Inter-Black', default: 'sans-serif' }),
    letterSpacing: 0.3,
  },
  featureCard: {
    alignItems: 'center',
    width: 90,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureIcon: { width: 48, height: 48, marginBottom: 8 },
  featureText: {
    color: '#1E3A8A',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold', default: 'sans-serif' }),
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 12,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  catCard: {
    alignItems: 'center',
    width: width / 3.4,
    marginVertical: 8,
    backgroundColor: '#E0F2FE',
    borderRadius: 16,
    paddingVertical: 14,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  catIcon: { width: 48, height: 48, marginBottom: 8 },
  catLabel: {
    color: '#1E3A8A',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold', default: 'sans-serif' }),
    textAlign: 'center',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginRight: 16,
    width: width * 0.55,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  prodImg: { width: '100%', height: 100, borderRadius: 12, marginBottom: 8 },
  prodName: {
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
    color: '#1E3A8A',
    fontFamily: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold', default: 'sans-serif' }),
  },
  prodPrice: {
    fontWeight: '700',
    color: '#22C55E',
    marginBottom: 6,
    fontSize: 15,
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold', default: 'sans-serif' }),
  },
  prodOff: {
    textDecorationLine: 'line-through',
    color: '#64748B',
    fontSize: 13,
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: 'sans-serif' }),
  },
  btnMini: {
    backgroundColor: '#3B82F6',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignItems: 'center',
  },
  btnMiniText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold', default: 'sans-serif' }),
  },
  offerBanner: {
    backgroundColor: '#E0F2FE',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  offerImg: { width: 80, height: 80, borderRadius: 16, marginRight: 12 },
  offerHeading: {
    fontWeight: '800',
    fontSize: 16,
    color: '#1E3A8A',
    marginBottom: 4,
    fontFamily: Platform.select({ ios: 'Inter-Black', android: 'Inter-Black', default: 'sans-serif' }),
  },
  offerSmall: {
    color: '#1E293B',
    fontSize: 14,
    marginBottom: 8,
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: 'sans-serif' }),
  },
  blogCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    alignItems: 'center',
    width: width * 0.6,
    padding: 14,
    marginRight: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  blogImg: { width: '100%', height: 80, borderRadius: 12, marginBottom: 8 },
  blogTitle: {
    fontWeight: '700',
    fontSize: 15,
    color: '#1E3A8A',
    fontFamily: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold', default: 'sans-serif' }),
  },
  faqCard: {
    backgroundColor: '#E0F2FE',
    borderRadius: 16,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  faqQ: {
    fontWeight: '700',
    fontSize: 16,
    color: '#1E3A8A',
    flex: 1,
    fontFamily: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold', default: 'sans-serif' }),
  },
  faqA: {
    marginTop: 8,
    color: '#1E293B',
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: 'sans-serif' }),
  },
  dlSection: {
    backgroundColor: '#DBEAFE',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  dlDesc: {
    color: '#1E3A8A',
    marginBottom: 14,
    fontWeight: '500',
    fontSize: 15,
    letterSpacing: 0.2,
    fontFamily: Platform.select({ ios: 'Inter-Medium', android: 'Inter-Medium', default: 'sans-serif' }),
  },
  dlRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dlBtn: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignItems: 'center',
    marginRight: 14,
  },
  dlBtnText: {
    color: '#F8FAFC',
    marginLeft: 12,
    fontWeight: '700',
    fontSize: 16,
    fontFamily: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold', default: 'sans-serif' }),
  },
  testimonialCard2: {
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderRadius: 16,
    marginRight: 16,
    marginBottom: 4,
    minWidth: width * 0.58,
    maxWidth: width * 0.66,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  testimonialUser2: {
    fontWeight: '700',
    fontSize: 16,
    color: '#065F46',
    fontFamily: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold', default: 'sans-serif' }),
  },
  testimonialMsg2: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#1E293B',
    marginTop: 8,
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: 'sans-serif' }),
  },
  footerMega: {
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  footerRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoFooter: {
    fontWeight: '900',
    fontSize: 30,
    color: '#F8FAFC',
    marginBottom: 6,
    fontFamily: Platform.select({ ios: 'Inter-Black', android: 'Inter-Black', default: 'sans-serif' }),
  },
  footerSlogan: {
    color: '#DBEAFE',
    fontSize: 16,
    marginBottom: 8,
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: 'sans-serif' }),
  },
  footerTagline: {
    color: '#BFDBFE',
    fontSize: 14,
    fontStyle: 'italic',
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: 'sans-serif' }),
  },
  socialIcons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  newsletterSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  newsletterHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
    fontFamily: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold', default: 'sans-serif' }),
  },
  newsletterText: {
    fontSize: 14,
    color: '#DBEAFE',
    marginBottom: 12,
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: 'sans-serif' }),
  },
  newsletterInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  newsletterInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E3A8A',
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: 'sans-serif' }),
  },
  newsletterButton: {
    backgroundColor: '#22C55E',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  newsletterButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold', default: 'sans-serif' }),
  },
  footerLinksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: Platform.OS === 'web' ? 'flex-start' : 'space-between',
    marginBottom: 24,
  },
  footerCol: { marginRight: 36, marginBottom: 12, minWidth: 100 },
  footerHead: {
    fontWeight: '700',
    color: '#DBEAFE',
    marginBottom: 8,
    fontSize: 17,
    fontFamily: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold', default: 'sans-serif' }),
  },
  footerLink: {
    color: '#BFDBFE',
    marginBottom: 6,
    fontSize: 15,
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: 'sans-serif' }),
  },
  copyRight: {
    textAlign: 'center',
    color: '#DBEAFE',
    fontSize: 13,
    marginTop: 12,
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: 'sans-serif' }),
  },
  footerCredit: {
    textAlign: 'center',
    color: '#BFDBFE',
    fontSize: 12,
    marginTop: 8,
    fontFamily: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: 'sans-serif' }),
  },
});