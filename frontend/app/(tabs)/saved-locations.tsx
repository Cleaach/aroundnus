import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { auth } from '../../firebase';
import { FontAwesome } from '@expo/vector-icons';

// Define the type for a saved location
interface SavedLocation {
  id?: string;
  name: string;
}

export default function SavedLocationsScreen() {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [filtered, setFiltered] = useState<SavedLocation[]>([]);
  const [search, setSearch] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      const token = await user.getIdToken();
      const res = await fetch('https://aroundnus.onrender.com/api/savedLocations/get', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch locations');
      const data = await res.json();
      setLocations(data);
      setFiltered(data);
    } catch (e) {
      setError((e as Error).message || 'Error fetching locations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLocations();
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text) setFiltered(locations);
    else setFiltered(locations.filter(l => l.name.toLowerCase().includes(text.toLowerCase())));
  };

  const handleAdd = async () => {
    if (!newLocation.trim()) return;
    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      const token = await user.getIdToken();
      const res = await fetch('https://aroundnus.onrender.com/api/savedLocations/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location: { name: newLocation } }),
      });
      if (!res.ok) throw new Error('Failed to add location');
      setNewLocation('');
      fetchLocations();
    } catch (e) {
      setError((e as Error).message || 'Error adding location');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (location: SavedLocation) => {
    Alert.alert('Delete', `Delete ${location.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          setLoading(true);
          setError('');
          try {
            const user = auth.currentUser;
            if (!user) throw new Error('Not logged in');
            const token = await user.getIdToken();
            const res = await fetch('https://aroundnus.onrender.com/api/savedLocations/delete', {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ location }),
            });
            if (!res.ok) throw new Error('Failed to delete location');
            fetchLocations();
          } catch (e) {
            setError((e as Error).message || 'Error deleting location');
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Locations</Text>
      </View>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search saved locations..."
          value={search}
          onChangeText={handleSearch}
        />
      </View>
      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder="Add new location..."
          value={newLocation}
          onChangeText={setNewLocation}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd} disabled={loading}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && !refreshing ? <ActivityIndicator style={{ margin: 20 }} /> : null}
      <FlatList
        data={filtered}
        keyExtractor={(item, idx) => item.id || item.name + idx}
        renderItem={({ item }) => (
          <View style={styles.locationRow}>
            <Text style={styles.locationName}>{item.name}</Text>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
              <FontAwesome name="trash" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No saved locations.</Text> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { alignItems: 'center', marginTop: 20, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold' },
  searchRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8 },
  searchInput: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 8, padding: 10 },
  addRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8 },
  addInput: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 8, padding: 10 },
  addButton: { marginLeft: 8, backgroundColor: '#007AFF', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, justifyContent: 'center' },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  error: { color: 'red', textAlign: 'center', marginBottom: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  locationName: { fontSize: 16 },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  deleteButtonText: { color: '#fff', fontWeight: 'bold' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
}); 