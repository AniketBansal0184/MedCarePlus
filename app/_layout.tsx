import { Slot } from 'expo-router';
import * as tslib from 'tslib';

console.log('tslib:', tslib);

export default function RootLayout() {
  return <Slot />;
}

