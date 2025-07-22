import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { auth } from '../../firebase';

export default function ViewSharedLocationsModal() {
  const { friendUid, friendName } = useLocalSearchParams<{ friendUid: string; friendName: string }>();
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSharedLocations = async () => {
    if (!friendUid) return;

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No user logged in');
      }
      const token = await currentUser.getIdToken();

      const response = await fetch(`https://aroundnus.onrender.com/api/shared-locations/${friendUid}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch shared locations');
      }

      setLocations(data.sharedLocations || []);
    } catch (error) {
      console.error(error);
      // Optionally show an alert to the user
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSharedLocations();
  }, [friendUid]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSharedLocations();
  };

  if (loading) {
    return <ActivityIndicator size="large" style={styles.centered} />;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `Shared by ${friendName}` }} />
      <FlatList
        data={locations}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={({ item }) => (
          <View style={styles.locationItem}>
            <Text style={styles.locationText}>{item}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No locations shared by {friendName}.</Text>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  locationText: {
    fontSize: 18,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});
