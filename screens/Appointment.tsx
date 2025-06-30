import React, { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import api from '../utils/api';
import { RootStackParamList } from '../../ECom/App';

type Props = NativeStackScreenProps<RootStackParamList, 'Appointment'>;

export default function Appointment({ route }: Props) {
  const [doctor, setDoctor] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const { userId } = route.params;

  const book = async () => {
    try {
      const res = await api.post('/appointments', { userId, doctor, date, time });
      Alert.alert('Success', 'Appointment booked!');
    } catch {
      Alert.alert('Error', 'Failed to book appointment');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput placeholder="Doctor Name" style={styles.input} onChangeText={setDoctor} />
      <TextInput placeholder="Date (YYYY-MM-DD)" style={styles.input} onChangeText={setDate} />
      <TextInput placeholder="Time (HH:MM)" style={styles.input} onChangeText={setTime} />
      <Button title="Book" onPress={book} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 100 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 12 },
});
