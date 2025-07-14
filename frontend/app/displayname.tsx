import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function DisplayNameScreen() {
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = typeof params.email === 'string' ? params.email : '';
  const password = typeof params.password === 'string' ? params.password : '';

  const handleContinue = async () => {
    if (!displayName.trim()) {
      setError('Please enter a display name.');
      return;
    }
    if (!email || !password) {
      setError('Missing email or password.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      // Create the account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (user) {
        const token = await user.getIdToken();
        // Call backend to create user doc with display name
        await fetch('https://aroundnus.onrender.com/api/auth/init-user-doc', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            displayName,
          }),
        });
      }
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      Alert.alert('Error', err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.centeredContent}>
            <Text style={styles.title}>Set Display Name</Text>
            <Text style={styles.description}>Choose a display name for your account. This will be visible to other users.</Text>
            <TextInput
              style={styles.input}
              placeholder="Display Name"
              placeholderTextColor="#666666"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              autoFocus
              maxLength={32}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.continueButtonText}>Continue</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
    marginTop: -40,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 24,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
    lineHeight: 22,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 5,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    height: 48,
    width: '100%',
    marginBottom: 16,
  },
  continueButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  },
}); 