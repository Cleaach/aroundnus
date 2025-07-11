import { signOut, User, onAuthStateChanged } from "firebase/auth";
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
  const [refreshFlag, setRefreshFlag] = useState(false); // trigger profile refresh

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.log("No user logged in");
          return;
        }
        const token = await currentUser.getIdToken();
        const response = await fetch(
          'https://aroundnus.onrender.com/api/profilePicture/data',
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (!response.ok) {
          const error = await response.json();
          console.log("Failed to fetch profile:", error);
        } else {
          const data = await response.json();
          setProfileImage(data.profilePicture);
        }
      } catch (err) {
        console.log("Failed to fetch profile:", err);
      }
    };
    if (user) fetchProfile();
  }, [user, refreshFlag]);

  // Helper to upload image to backend
  const uploadProfilePicture = async (uri: string, type?: string, fileName?: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("Error", "No user logged in");
        return;
      }
      const token = await currentUser.getIdToken();
      const formData = new FormData();
      formData.append('profilePicture', {
        uri,
        type: type || 'image/jpeg',
        name: fileName || 'profile.jpg',
      } as any);
      const response = await fetch('https://aroundnus.onrender.com/api/profilePicture/update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        Alert.alert("Error", error.error || "Failed to upload profile picture");
      } else {
        const data = await response.json();
        setRefreshFlag(f => !f); // trigger profile refresh
        Alert.alert("Success", "Profile picture updated!");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to upload profile picture");
      console.log(err);
    }
  };

  const openLibrary = () => {
    launchImageLibrary(
      {
        mediaType: "photo",
        includeBase64: false,
      },
      (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert("Error", response.errorMessage || "Failed to pick image");
          return;
        }
        const asset = response.assets && response.assets[0];
        if (asset && asset.uri) {
          uploadProfilePicture(asset.uri, asset.type, asset.fileName);
        }
      }
    );
  };

  const openCamera = async () => {
    const options = {
      mediaType: "photo" as const,
      saveToPhotos: true,
    };
    try {
      const result = await launchCamera(options);
      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert("Error", result.errorMessage || "Failed to take photo");
        return;
      }
      const asset = result.assets && result.assets[0];
      if (asset && asset.uri) {
        uploadProfilePicture(asset.uri, asset.type, asset.fileName);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take photo");
      console.log(error);
    }
  };

  const showMessage = () => {
    Alert.alert("Upload image", "Choose an option", [
      {
        text: "Camera",
        onPress: openCamera,
      },
      {
        text: "Gallery",
        onPress: openLibrary,
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
            <Image
              source={
                profileImage
                  ? { uri: profileImage }
                  : require("../../assets/images/profile.jpg")
              }
              style={styles.profileImage}
            />
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