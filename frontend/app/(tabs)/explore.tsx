import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { useEffect, useState } from "react";
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
  Image,
} from "react-native";
import { auth } from "../../firebase";

export default function ExploreScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return unsubscribe;
  }, []);

  const handleEmailSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter a valid email and password");
      return;
    }
    setIsLoading(true);
    try {
      if (isCreatingAccount) {
        await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert("Success", "Account created!");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setEmail("");
      setPassword("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "An error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    Alert.alert("Google Sign In", "Google Sign In not implemented yet");
  };

  const handleAppleSignIn = () => {
    Alert.alert("Apple Sign In", "Apple Sign In not implemented yet");
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      Alert.alert("Success", "Signed out successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.message || "An error occurred");
      console.error(error);
    }
  };

  if (user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.signedInContent}>
          <Text style={styles.welcomeText}>Welcome, {user.email}</Text>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Sign In</Text>

          <View style={styles.formSection}>
            <Text style={styles.subtitle}>
              {isCreatingAccount ? "Create an account" : "Welcome back"}
            </Text>
            <Text style={styles.description}>
              Enter your email to{" "}
              {isCreatingAccount ? "sign up for" : "sign in to"} this app
            </Text>

            <TextInput
              style={styles.emailInput}
              placeholder="email@domain.com"
              placeholderTextColor="#666666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
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
              <View style={styles.socialButtonContent}>
                <Text style={styles.socialButtonText}>
                  <Text style={styles.socialIcon}>G</Text> Continue with Google
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleAppleSignIn}
              disabled={isLoading}
            >
              <View style={styles.socialButtonContent}>
                <Text style={styles.socialButtonText}>
                  <Text style={styles.socialIcon}>🍎</Text> Continue with Apple
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setIsCreatingAccount(!isCreatingAccount)}
            >
              <Text style={styles.toggleButtonText}>
                {isCreatingAccount
                  ? "Already have an account? Sign In"
                  : "Don't have an account? Create one"}
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
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 32,
    fontWeight: "600",
    color: "#000000",
    marginTop: 60,
    marginBottom: 40,
    textAlign: "center",
  },
  formSection: {
    flex: 1,
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
    marginBottom: 32,
    lineHeight: 22,
    textAlign: "center",
  },
  emailInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#FAFAFA",
  },
  continueButton: {
    backgroundColor: "#000000",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
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
  signedInContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  welcomeText: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: "center",
  },
  signOutButton: {
    height: 50,
    backgroundColor: "#000000",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
