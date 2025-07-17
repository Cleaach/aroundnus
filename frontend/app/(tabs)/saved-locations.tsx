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
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'expo-router';

interface SavedLocation {
  id?: string;
  name: string;
}

const allowedLocations = [
  "Operating theatre",
  "ICU",
  "Pharmacy",
  "Brönnimanns"
];

export default function SavedLocationsScreen() {
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [filtered, setFiltered] = useState<SavedLocation[]>([]);
  const [search, setSearch] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const router = useRouter();

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
    if (!allowedLocations.includes(newLocation)) {
      setError('Please select a valid location from the list.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      const token = await user.getIdToken();
      const locationToAdd = { id: uuidv4(), name: newLocation };
      const res = await fetch('https://aroundnus.onrender.com/api/savedLocations/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location: locationToAdd }),
      });
      if (!res.ok) throw new Error('Failed to add location');
      setNewLocation('');
      setSuggestions([]);
      fetchLocations();
    } catch (e) {
      setError((e as Error).message || 'Error adding location');
    } finally {
      setLoading(false);
    }
  };

  // Suggestion logic for add input
  const handleAddInputChange = (text: string) => {
    setNewLocation(text);
    if (!text) {
      setSuggestions([]);
      return;
    }
    const matches = allowedLocations.filter((loc) =>
      loc.toLowerCase().includes(text.toLowerCase())
    );
    setSuggestions(matches);
  };

  const handleDelete = async (location: SavedLocation) => {
    if (!location.id) {
      setError('Location does not have an id.');
      return;
    }
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
            // Only send the id for deletion
            const res = await fetch('https://aroundnus.onrender.com/api/savedLocations/delete', {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ location: { id: location.id } }),
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
          onChangeText={handleAddInputChange}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd} disabled={loading || !allowedLocations.includes(newLocation)}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      {newLocation.length > 0 && suggestions.length > 0 && (
        <View style={[styles.suggestionContainer, { marginHorizontal: 16, marginBottom: 8 }]}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => {
                  setNewLocation(item);
                  setSuggestions([]);
                }}
              >
                <Text>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && !refreshing ? <ActivityIndicator style={{ margin: 20 }} /> : null}
      <FlatList
        data={filtered}
        keyExtractor={(item, idx) => item.id || item.name + idx}
        renderItem={({ item }) => (
          <View style={styles.locationRow}>
            <Text style={styles.locationName}>{item.name}</Text>
            <View style={styles.locationActions}>
              <TouchableOpacity
                style={styles.unityButton}
                onPress={() => router.navigate({ pathname: '/(modals)/unity', params: { destination: item.name } })}
              >
                <FontAwesome name="location-arrow" size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
                <FontAwesome name="trash" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No saved locations.</Text> : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
  },
  addRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  addInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
  },
  addButton: {
    marginLeft: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  locationName: {
    fontSize: 16,
  },
  locationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  unityButton: {
    marginRight: 8,
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#e6f0ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
  },
  suggestionContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    maxHeight: 150,
    overflow: 'hidden',
  },
  suggestionItem: {
    padding: 12,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
}); 