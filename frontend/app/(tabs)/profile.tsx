import {
  signOut,
  User,
  onAuthStateChanged,
} from "firebase/auth";
import { useState, useEffect } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  Image,
} from "react-native";
import { auth } from "../../firebase";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [profileImage, setProfileImage] = useState<string | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  const openLibrary = () => {
    launchImageLibrary({
      mediaType: "photo",
      includeBase64: true,
    }, (response) => {
      console.log(response);
    });
  };

  const openCamera = async () => {


    const options = {
      mediaType: "photo" as const,
      saveToPhotos: true,
    };

    try {
      const result = await launchCamera(options);
      if (result.assets && result.assets[0]?.uri) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const showMessage = () => {
    Alert.alert("Uplaod image", "Choose an option", [
      {
        text: "Camera",
        onPress: openCamera
      },
      {
        text: "Gallery",
        onPress: openLibrary
      },
    ]);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);

      Alert.alert("Success", "Signed out successfully!");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "An error occurred during sign out"
      );
      console.error(error);
    }
  };


  const handleProfileImagePress = () => {
    showMessage();
  };

  if (user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.signedInContent}>
          <TouchableOpacity onPress={handleProfileImagePress}>
            <Image source={profileImage ? { uri: profileImage } : require("../../assets/images/profile.jpg")} style={styles.profileImage} />
          </TouchableOpacity>
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  signedInContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 50,
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
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
});
