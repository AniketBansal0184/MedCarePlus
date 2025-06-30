
import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import api from '../utils/api';
import { RootStackParamList } from '../../ECom/App';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

export default function Signup({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signup = async () => {
    try {
      await api.post('/auth/signup', { name, email, password });
      Alert.alert('Success', 'Account created');
      navigation.navigate('Login');
    } catch {
      Alert.alert('Signup Failed', 'Try again later');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput placeholder="Name" style={styles.input} onChangeText={setName} />
      <TextInput placeholder="Email" style={styles.input} onChangeText={setEmail} />
      <TextInput placeholder="Password" secureTextEntry style={styles.input} onChangeText={setPassword} />
      <Button title="Sign Up" onPress={signup} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 100 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 12 },
});
