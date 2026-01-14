import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, StatusBar, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export default function MainLayout({ children }) {
  const { t, i18n } = useTranslation();

  // Theme: dark/light
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Optional: detect system theme automatically
  useEffect(() => {
    // You can use Appearance API here if needed
  }, []);

  // Footer text
  const currentYear = new Date().getFullYear();

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme === 'dark' ? '#121212' : '#f2f2f2' },
      ]}
    >
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
      />

      {/* Header */}
      <View style={styles.header}>
        {/* Logo */}
        <Image
          source={require('@/assets/images/oliviuus-logo.png')}
          style={styles.logo}
        />

        {/* Right controls */}
        <View style={styles.headerControls}>
          {/* Language selector */}
          <View style={styles.langSelector}>
            {['en', 'rw', 'fr', 'sw'].map((lang) => (
              <TouchableOpacity
                key={lang}
                onPress={() => i18n.changeLanguage(lang)}
                style={styles.langButton}
              >
                <Text style={[styles.langText, { color: theme === 'dark' ? '#fff' : '#000' }]}>
                  {lang.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Theme toggle */}
          <TouchableOpacity onPress={toggleTheme} style={styles.themeButton}>
            <Ionicons
              name={theme === 'dark' ? 'sunny' : 'moon'}
              size={24}
              color={theme === 'dark' ? '#fff' : '#000'}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main content */}
      <View style={styles.content}>{children}</View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme === 'dark' ? '#ccc' : '#555' }]}>
          © {currentYear} Oliviuus. All rights reserved.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  logo: {
    width: 150,
    height: 40,
    resizeMode: 'contain',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  langSelector: {
    flexDirection: 'row',
    marginRight: 12,
  },
  langButton: {
    marginHorizontal: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  langText: {
    fontSize: 14,
    fontWeight: '600',
  },
  themeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  footerText: {
    fontSize: 12,
  },
});
