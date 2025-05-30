import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  const handleEmailSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    
    // Simulate loading for now
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert('Success', 'Login simulated!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    }, 1000);
  };

  const handleGoogleSignIn = async () => {
    Alert.alert('Google Sign In', 'Google Sign In not implemented yet');
  };

  const handleAppleSignIn = () => {
    Alert.alert('Apple Sign In', 'Apple Sign In not implemented yet');
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Sign In</Text>
          
          <View style={styles.formSection}>
            <Text style={styles.subtitle}>
              {isCreatingAccount ? 'Create an account' : 'Welcome back'}
            </Text>
            <Text style={styles.description}>
              Enter your email to {isCreatingAccount ? 'sign up for' : 'sign in to'} this app
            </Text>
            
            <TextInput
              style={styles.emailInput}
              placeholder="email@domain.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            
            <TouchableOpacity 
              style={styles.continueButton} 
              onPress={handleEmailSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.continueButtonText}>Continue</Text>
              )}
            </TouchableOpacity>
            
            <Text style={styles.orText}>or</Text>
            
            <TouchableOpacity 
              style={styles.socialButton} 
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Text style={styles.socialButtonText}>🔍 Continue with Google</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.socialButton} 
              onPress={handleAppleSignIn}
              disabled={isLoading}
            >
              <Text style={styles.socialButtonText}>🍎 Continue with Apple</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By clicking continue, you agree to our{' '}
              <Text style={styles.linkText}>Terms of Service</Text>
              {'\n'}and <Text style={styles.linkText}>Privacy Policy</Text>
            </Text>
            
            <TouchableOpacity 
              style={styles.toggleButton}
              onPress={() => setIsCreatingAccount(!isCreatingAccount)}
            >
              <Text style={styles.toggleButtonText}>
                {isCreatingAccount 
                  ? 'Already have an account? Sign In' 
                  : "Don't have an account? Create one"
                }
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#000000',
    marginTop: 60,
    marginBottom: 40,
  },
  formSection: {
    flex: 1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 32,
    lineHeight: 22,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  continueButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  orText: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 16,
    marginBottom: 24,
  },
  socialButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  socialButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    paddingBottom: 40,
  },
  footerText: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  linkText: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  toggleButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
});