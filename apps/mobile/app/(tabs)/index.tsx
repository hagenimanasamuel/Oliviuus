import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('../../assets/images/oliviuus_logo_transparent.png')} // replace with Oliviuus logo
          style={styles.logo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome to Oliviuus!</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.messageContainer}>
        <ThemedText type="subtitle">
          Your ultimate Rwandan movie streaming platform.
        </ThemedText>
        <ThemedText>
          Enjoy the best local and international movies anytime, anywhere.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  messageContainer: {
    gap: 8,
    marginBottom: 16,
  },
  logo: {
    height: 150,
    width: 250,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
