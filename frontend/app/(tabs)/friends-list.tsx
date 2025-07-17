import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, Image, TouchableOpacity } from 'react-native';
import { auth } from '../../firebase';

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=User&background=random';

async function fetchUserInfo(uid: string, token: string) {
  const res = await fetch(`https://aroundnus.onrender.com/api/profile/get-profile-data-by-uid?uid=${uid}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) return { uid, displayName: uid, profilePicture: null };
  const data = await res.json();
  return { uid, displayName: data.displayName || uid, profilePicture: data.profilePicture || null };
}

export default function FriendsListScreen() {
  const [friends, setFriends] = useState<{ uid: string, displayName: string, profilePicture: string | null }[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      const token = await user.getIdToken();
      // Get the user's friends array
      const res = await fetch('https://aroundnus.onrender.com/api/profile/get-profile-data', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch profile');
      const friendUids: string[] = data.friends || [];
      const friendInfos = await Promise.all(friendUids.map(uid => fetchUserInfo(uid, token)));
      setFriends(friendInfos);
    } catch (e) {
      Alert.alert('Error', (e as Error).message || 'Failed to fetch friends');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async (friendUid: string) => {
    Alert.alert('Remove Friend', 'Are you sure you want to remove this friend?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            const user = auth.currentUser;
            if (!user) throw new Error('Not logged in');
            const token = await user.getIdToken();
            const res = await fetch('https://aroundnus.onrender.com/api/friend-requests/remove-friend', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ friendUid }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to remove friend');
            fetchFriends();
            Alert.alert('Success', 'Friend removed');
          } catch (e) {
            Alert.alert('Error', (e as Error).message || 'Failed to remove friend');
          }
        }
      }
    ]);
  };

  useEffect(() => { fetchFriends(); }, []);

  const renderUserItem = (item: { uid: string, displayName: string, profilePicture: string | null }) => (
    <View style={styles.userItem}>
      <Image
        source={{ uri: item.profilePicture || DEFAULT_AVATAR }}
        style={styles.avatar}
      />
      <Text style={styles.userText}>{item.displayName} ({item.uid})</Text>
      <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveFriend(item.uid)}>
        <Text style={styles.removeBtnText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Friends</Text>
      {loading ? <ActivityIndicator /> : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => renderUserItem(item)}
          ListEmptyComponent={<Text style={styles.emptyText}>No friends yet</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  userItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#eee' },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12, backgroundColor: '#eee' },
  userText: { flex: 1 },
  emptyText: { color: '#888', fontStyle: 'italic', textAlign: 'center', marginTop: 8 },
  removeBtn: { backgroundColor: '#F44336', padding: 8, borderRadius: 4, marginLeft: 8 },
  removeBtnText: { color: '#fff', fontWeight: 'bold' },
}); 