import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { auth } from '../../firebase';

interface Friend {
  uid: string;
  displayName: string;
  profilePicture: string | null;
}

async function fetchUserInfo(uid: string, token: string): Promise<Friend> {
  const res = await fetch(`https://aroundnus.onrender.com/api/profile/get-profile-data-by-uid?uid=${uid}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) return { uid, displayName: uid, profilePicture: null };
  const data = await res.json();
  return { uid, displayName: data.displayName || uid, profilePicture: data.profilePicture || null };
}

export default function ShareLocationModal() {
  const { locationName } = useLocalSearchParams<{ locationName: string }>();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error('Not logged in');
        const token = await currentUser.getIdToken();
        const response = await fetch('https://aroundnus.onrender.com/api/profile/get-profile-data', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch profile');
        const friendUids: string[] = data.friends || [];
        const friendInfos = await Promise.all(friendUids.map(uid => fetchUserInfo(uid, token)));
        setFriends(friendInfos);
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to fetch friends.');
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, []);

  const handleShare = async (friend: Friend) => {
    setSharing(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Not logged in');
      const token = await currentUser.getIdToken();

      const response = await fetch('https://aroundnus.onrender.com/api/shared-locations/share', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friendUid: friend.uid, locationName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to share location');
      }

      Alert.alert('Success', `Shared ${locationName} with ${friend.displayName}.`);
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', (error as Error).message);
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `Share ${locationName}` }} />
      <FlatList
        data={friends}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.friendItem} onPress={() => handleShare(item)} disabled={sharing}>
            <Text style={styles.friendName}>{item.displayName}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>You have no friends to share with.</Text>}
      />
      {sharing && <ActivityIndicator size="large" style={styles.sharingIndicator} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  friendName: {
    fontSize: 18,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  sharingIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});
