import React, { useState, useRef } from "react";
import { useRouter } from 'expo-router';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";
import { auth } from "../firebase";
import Ionicons from '@expo/vector-icons/Ionicons';

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const passwordAnim = useRef(new Animated.Value(0)).current;

  const handleEmailArrowPress = () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      Alert.alert("Error", "Please enter a valid email");
      return;
    }
    setShowPasswordInput(true);
    Animated.timing(passwordAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const handleEmailSubmit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password.trim()) {
      Alert.alert("Error", "Please enter a valid email and password");
      return;
    }
    setIsLoading(true);
    try {
      const methods = await fetchSignInMethodsForEmail(auth, cleanEmail);
      if (methods.length === 0) {
        // New user, go to displayname page with email and password
        setIsLoading(false);
        router.replace({ pathname: '/displayname', params: { email: cleanEmail, password } });
        return;
      } else if (methods.includes("password")) {
        // Existing user, sign in
        await signInWithEmailAndPassword(auth, cleanEmail, password);
        setEmail("");
        setPassword("");
      } else {
        Alert.alert("Error", "This email is registered with a different sign-in method (e.g., Google or Apple). Please use that method to sign in.");
      }
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        Alert.alert("Error", "Incorrect password. Please try again.");
      } else if (error.code === 'auth/user-not-found') {
        Alert.alert("Error", "No user found with this email.");
      } else {
        Alert.alert("Error", error.message || "An error occurred");
      }
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
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.description}>Enter your email and password to sign in to ARoundNUS.</Text>
            {/* Email input with arrow button */}
            <View style={styles.emailRow}>
              <TextInput
                style={[styles.emailInput, { flex: 1, marginBottom: 0 }]}
                placeholder="email@domain.com"
                placeholderTextColor="#666666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="done"
                onSubmitEditing={handleEmailArrowPress}
              />
              {!showPasswordInput && (
                <TouchableOpacity
                  style={styles.arrowButton}
                  onPress={handleEmailArrowPress}
                  disabled={isLoading || !email.trim()}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-forward" size={28} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
            {/* Password input and continue button only show after arrow is pressed, with animation */}
            {showPasswordInput && (
              <Animated.View
                style={{
                  opacity: passwordAnim,
                  transform: [
                    {
                      translateY: passwordAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0],
                      }),
                    },
                  ],
                  width: '100%',
                  alignItems: 'center',
                }}
              >
                <View style={{ width: '100%' }}>
                  <TextInput
                    style={styles.emailInput}
                    placeholder="Password"
                    placeholderTextColor="#666666"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="password"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.continueButton, { marginTop: 16 }]}
                  onPress={handleEmailSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.continueButtonText}>Go</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    fontWeight: "600",
    color: "#000000",
    marginTop: 60,
    marginBottom: 24,
    textAlign: "center",
  },
  formSection: {
    width: '100%',
    alignItems: 'stretch',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 20,
    lineHeight: 22,
    textAlign: "center",
  },
  emailInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 5,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
    height: 48,
    width: '100%',
  },
  continueButton: {
    backgroundColor: "#000000",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
    width: 70,
    alignSelf: 'center',
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  orText: {
    textAlign: "center",
    color: "#666666",
    fontSize: 16,
    marginBottom: 24,
  },
  socialButton: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  socialButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  socialIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  socialButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "500",
  },
  footer: {
    paddingBottom: 40,
  },
  toggleButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  toggleButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    height: 48,
  },
  arrowButton: {
    marginLeft: 8,
    backgroundColor: '#000',
    borderRadius: 8,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
}); 