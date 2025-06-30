import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import api from '../utils/api';
import { RootStackParamList } from '../../ECom/App';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function Login({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = async () => {
    try {
      const res = await api.post('/auth/login', { email, password });
      navigation.navigate('Home', {
        token: res.data.token,
        userId: res.data.userId,
      });
    } catch {
      Alert.alert('Login Failed', 'Invalid credentials');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput placeholder="Email" style={styles.input} onChangeText={setEmail} />
      <TextInput placeholder="Password" style={styles.input} secureTextEntry onChangeText={setPassword} />
      <Button title="Login" onPress={login} />
      <Text onPress={() => navigation.navigate('Signup')} style={styles.link}>Don't have an account? Sign up</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 100 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 12 },
  link: { marginTop: 10, color: 'blue' },
});
