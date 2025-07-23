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
  ScrollView,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { auth } from "../../firebase";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image as RNImage } from 'react-native';

const DEFAULT_AVATAR = require('../../assets/images/profile.jpg');

async function fetchUserInfo(uid: string, token: string) {
  const res = await fetch(`https://aroundnus.onrender.com/api/profile/get-profile-data-by-uid?uid=${uid}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) return { uid, displayName: uid, profilePicture: null };
  const data = await res.json();
  return { uid, displayName: data.displayName || uid, profilePicture: data.profilePicture || null };
}

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [profileImage, setProfileImage] = useState<string | undefined>(undefined);
  const [displayName, setDisplayName] = useState<string | undefined>(undefined);
  const [refreshFlag, setRefreshFlag] = useState(false); // trigger profile refresh
  const [refreshing, setRefreshing] = useState(false); // for pull-to-refresh
  const [editingDisplayName, setEditingDisplayName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState<string>("");
  const [savingDisplayName, setSavingDisplayName] = useState(false);
  const [friends, setFriends] = useState<{ uid: string, displayName: string, profilePicture: string | null }[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  // Move fetchProfile outside useEffect so it can be called from refresh
  const fetchProfile = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log("No user logged in");
        return;
      }
      const token = await currentUser.getIdToken();
      const response = await fetch(
        'https://aroundnus.onrender.com/api/profile/get-profile-data',
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
        setDisplayName(data.displayName);
      }
    } catch (err) {
      console.log("Failed to fetch profile:", err);
    }
  };

  useEffect(() => {
    if (user) fetchProfile();
  }, [user, refreshFlag]);

  // Fetch friends
  const fetchFriends = async () => {
    setFriendsLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Not logged in');
      const token = await currentUser.getIdToken();
      const response = await fetch('https://aroundnus.onrender.com/api/profile/get-profile-data', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch profile');
      const friendUids: string[] = data.friends || [];
      const friendInfos = await Promise.all(friendUids.map(uid => fetchUserInfo(uid, token)));
      setFriends(friendInfos);
    } catch (e) {
      // Optionally show error
    } finally {
      setFriendsLoading(false);
    }
  };

  useEffect(() => { if (user) fetchFriends(); }, [user, refreshFlag]);

  const filteredFriends = friendSearch.trim()
    ? friends.filter(f => f.displayName.toLowerCase().includes(friendSearch.trim().toLowerCase()))
    : friends;

  const handleFriendPress = (friend: { uid: string; displayName: string; }) => {
    Alert.alert(
      friend.displayName,
      'View shared locations?',
      [
        {
          text: 'View',
          onPress: () => router.push({ pathname: '/(modals)/view-shared-locations', params: { friendUid: friend.uid, friendName: friend.displayName } })
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const renderUserItem = (item: { uid: string, displayName: string, profilePicture: string | null }) => (
    <TouchableOpacity style={styles.userItem} onPress={() => handleFriendPress(item)}>
      <View style={styles.userItem}>
        <Image
          source={item.profilePicture ? { uri: item.profilePicture } : DEFAULT_AVATAR}
          style={styles.avatar}
        />
        <Text style={styles.userText}>{item.displayName}</Text>
      </View>
    </TouchableOpacity>
  );

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
      const response = await fetch('https://aroundnus.onrender.com/api/profile/update-profile-picture', {
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

  const handleSaveDisplayName = async () => {
    if (!newDisplayName.trim()) {
      Alert.alert("Error", "Display name cannot be empty.");
      return;
    }
    setSavingDisplayName(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("Error", "No user logged in");
        setSavingDisplayName(false);
        return;
      }
      const token = await currentUser.getIdToken();
      const response = await fetch('https://aroundnus.onrender.com/api/profile/update-displayname', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ displayName: newDisplayName.trim() }),
      });
      if (response.status === 409) {
        Alert.alert("Error", "Display name already taken. Please choose another.");
        setSavingDisplayName(false);
        return;
      }
      if (!response.ok) {
        const error = await response.json();
        Alert.alert("Error", error.error || "Failed to update display name");
      } else {
        setDisplayName(newDisplayName.trim());
        setEditingDisplayName(false);
        setNewDisplayName("");
        Alert.alert("Success", "Display name updated!");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to update display name");
    } finally {
      setSavingDisplayName(false);
    }
  };

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  if (user) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
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
            <Text style={styles.welcomeText}>Hi, {displayName || user.email}!</Text>
            {editingDisplayName ? (
              <View style={{ width: '100%', alignItems: 'center', marginBottom: 16 }}>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#E0E0E0',
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 5,
                    fontSize: 16,
                    backgroundColor: '#FAFAFA',
                    height: 48,
                    width: '100%',
                    marginBottom: 8,
                  }}
                  placeholder="Set display name"
                  value={newDisplayName}
                  onChangeText={setNewDisplayName}
                  autoCapitalize="words"
                  editable={!savingDisplayName}
                />
                <TouchableOpacity
                  style={{ backgroundColor: '#000', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24, alignItems: 'center', width: 120 }}
                  onPress={handleSaveDisplayName}
                  disabled={savingDisplayName}
                >
                  {savingDisplayName ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ marginTop: 8 }}
                  onPress={() => { setEditingDisplayName(false); setNewDisplayName(""); }}
                  disabled={savingDisplayName}
                >
                  <Text style={{ color: '#666' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.iconRow}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => { setEditingDisplayName(true); setNewDisplayName(displayName || ""); }}
                >
                  <Ionicons name="create-outline" size={28} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={handleSignOut}
                >
                  <Ionicons name="log-out-outline" size={28} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.friendsSection}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 32, marginBottom: 8 }}>
                <Text style={styles.friendsHeader}>Friends</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/friend-requests')}>
                  <Text style={styles.addBtnText}>  +  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.friendSearchInput}
                placeholder="Search friends"
                value={friendSearch}
                onChangeText={setFriendSearch}
              />
              {friendsLoading ? <ActivityIndicator /> : (
                <FlatList
                  data={filteredFriends}
                  keyExtractor={(item) => item.uid}
                  renderItem={({ item }) => renderUserItem(item)}
                  ListEmptyComponent={
                    <View style={{ alignItems: 'center', paddingHorizontal: 20 }}>
                      <RNImage
                        source={require('../../assets/images/friends.png')}
                        style={{ width: 220, height: 220, marginTop: 6, marginBottom: 6, resizeMode: 'contain' }}
                      />
                      <Text style={{ ...styles.emptyText, fontWeight: 'bold', fontSize: 18, textAlign: 'center', marginBottom: 4 }}>
                        No friends found.
                      </Text>
                      <Text style={{ ...styles.emptyText, textAlign: 'center' }}>
                        To send or view requests, tap the + button!
                      </Text>
                    </View>
                  }
                  style={{ marginTop: 8 }}
                  scrollEnabled={false}
                />
              )}
            </View>
          </View>
        </ScrollView>
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
    marginBottom: 3,
    textAlign: "center",
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 2,
  },
  iconButton: {
    marginRight: 16,
    padding: 4,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  friendsSection: { width: '100%', marginTop: 6 },
  friendsHeader: { fontSize: 20, fontWeight: 'bold', flex: 1 },
  addBtn: { backgroundColor: '#003D7C', padding: 8, borderRadius: 20, marginLeft: 8 },
  addBtnText: { color: '#fff', fontWeight: 'bold' },
  friendSearchInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 90, padding: 12, marginBottom: 8, marginTop: 8 },
  userItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#eee' },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12, backgroundColor: '#eee' },
  userText: { flex: 1 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 8 },
});