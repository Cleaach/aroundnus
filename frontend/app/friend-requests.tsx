import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { auth } from '../firebase';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';

const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=User&background=random';

// Helper to fetch user info by UID
async function fetchUserInfo(uid: string, token: string) {
  const res = await fetch(`https://aroundnus.onrender.com/api/profile/get-profile-data-by-uid?uid=${uid}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) return { uid, displayName: uid, profilePicture: null };
  const data = await res.json();
  return { uid, displayName: data.displayName || uid, profilePicture: data.profilePicture || null };
}

export default function FriendRequestsScreen() {
  const [received, setReceived] = useState<{ uid: string, displayName: string, profilePicture: string | null }[]>([]);
  const [sent, setSent] = useState<{ uid: string, displayName: string, profilePicture: string | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchResults, setSearchResults] = useState<{ uid: string, displayName: string, profilePicture: string | null }[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingUid, setSendingUid] = useState<string | null>(null);
  const router = useRouter();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      const token = await user.getIdToken();
      const [receivedRes, sentRes] = await Promise.all([
        fetch('https://aroundnus.onrender.com/api/friend-requests/received', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('https://aroundnus.onrender.com/api/friend-requests/sent', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);
      const receivedData = await receivedRes.json();
      const sentData = await sentRes.json();
      // Fetch display names and profile pictures for each UID
      const receivedUids: string[] = receivedData.received || [];
      const sentUids: string[] = sentData.sent || [];
      const [receivedInfos, sentInfos] = await Promise.all([
        Promise.all(receivedUids.map(uid => fetchUserInfo(uid, token))),
        Promise.all(sentUids.map(uid => fetchUserInfo(uid, token))),
      ]);
      setReceived(receivedInfos);
      setSent(sentInfos);
    } catch (e) {
      Alert.alert('Error', (e as Error).message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleSearch = async () => {
    if (!searchName.trim()) return;
    setSearching(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      const token = await user.getIdToken();
      const res = await fetch(`https://aroundnus.onrender.com/api/friend-requests/search?displayName=${encodeURIComponent(searchName.trim())}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to search');
      // For each result, fetch profile picture if not present
      const usersWithPics = await Promise.all(
        (data.users || []).map(async (user: any) => {
          if (user.profilePicture) return user;
          // fallback: fetch full info
          return await fetchUserInfo(user.uid, token);
        })
      );
      setSearchResults(usersWithPics);
    } catch (e) {
      Alert.alert('Error', (e as Error).message || 'Failed to search');
    } finally {
      setSearching(false);
    }
  };

  const handleSend = async (targetUid: string) => {
    setSendingUid(targetUid);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      const token = await user.getIdToken();
      const res = await fetch('https://aroundnus.onrender.com/api/friend-requests/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send request');
      fetchRequests();
      Alert.alert('Success', 'Friend request sent!');
    } catch (e) {
      Alert.alert('Error', (e as Error).message || 'Failed to send request');
    } finally {
      setSendingUid(null);
    }
  };

  const handleApprove = async (requesterUid: string) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      const token = await user.getIdToken();
      const res = await fetch('https://aroundnus.onrender.com/api/friend-requests/approve', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requesterUid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to approve request');
      fetchRequests();
      Alert.alert('Success', 'Friend request approved!');
    } catch (e) {
      Alert.alert('Error', (e as Error).message || 'Failed to approve request');
    }
  };

  const handleReject = async (requesterUid: string) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      const token = await user.getIdToken();
      const res = await fetch('https://aroundnus.onrender.com/api/friend-requests/reject', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requesterUid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject request');
      fetchRequests();
      Alert.alert('Success', 'Friend request rejected!');
    } catch (e) {
      Alert.alert('Error', (e as Error).message || 'Failed to reject request');
    }
  };

  const renderUserItem = (item: { uid: string, displayName: string, profilePicture: string | null }, rightContent?: React.ReactNode) => (
    <View style={styles.userItem}>
      <Image
        source={{ uri: item.profilePicture || DEFAULT_AVATAR }}
        style={styles.avatar}
      />
      <Text style={styles.userText}>{item.displayName}</Text>
      {rightContent}
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: '', headerBackTitle: 'Back' }} />
      <Text style={styles.title}>Friend Requests</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Search Friends by Display Name</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Enter display name"
            value={searchName}
            onChangeText={setSearchName}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <Button title="Search" onPress={handleSearch} disabled={searching || !searchName.trim()} />
        </View>
        {searching ? <ActivityIndicator style={{ marginTop: 8 }} /> : (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.uid}
            renderItem={({ item }) => renderUserItem(item, (
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={() => handleSend(item.uid)}
                disabled={sendingUid === item.uid}
              >
                <Text style={styles.btnText}>{sendingUid === item.uid ? 'Sending...' : 'Send'}</Text>
              </TouchableOpacity>
            ))}
            ListEmptyComponent={searchName && !searching ? <Text style={styles.emptyText}>No users found</Text> : null}
            style={{ marginTop: 8, maxHeight: 180 }}
          />
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Received Requests</Text>
        {loading ? <ActivityIndicator /> : (
          <FlatList
            data={received}
            keyExtractor={(item) => item.uid}
            renderItem={({ item }) => renderUserItem(item, (
              <View style={styles.requestActions}>
                <TouchableOpacity onPress={() => handleApprove(item.uid)} style={styles.approveBtn}>
                  <Text style={styles.btnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleReject(item.uid)} style={styles.rejectBtn}>
                  <Text style={styles.btnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            ))}
            ListEmptyComponent={<Text style={styles.emptyText}>No received requests</Text>}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sent Requests</Text>
        {loading ? <ActivityIndicator /> : (
          <FlatList
            data={sent}
            keyExtractor={(item) => item.uid}
            renderItem={({ item }) => renderUserItem(item)}
            ListEmptyComponent={<Text style={styles.emptyText}>No sent requests</Text>}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginBottom: 8 },
  userItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#eee' },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12, backgroundColor: '#eee' },
  userText: { flex: 1 },
  sendBtn: { backgroundColor: '#2196F3', padding: 8, borderRadius: 4, marginLeft: 8 },
  requestActions: { flexDirection: 'row' },
  approveBtn: { backgroundColor: '#4CAF50', padding: 8, borderRadius: 4, marginRight: 8 },
  rejectBtn: { backgroundColor: '#F44336', padding: 8, borderRadius: 4 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  emptyText: { color: '#888', fontStyle: 'italic', textAlign: 'center', marginTop: 8 },
}); 