import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../ECom/App';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function Home({ navigation, route }: Props) {
  const { userId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to MedApp</Text>
      <Button title="Book Appointment" onPress={() => navigation.navigate('Appointment', { userId })} />
      <Button title="View Profile" onPress={() => navigation.navigate('Profile')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 100 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
});
