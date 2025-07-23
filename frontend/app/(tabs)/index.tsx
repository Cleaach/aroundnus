import * as Location from "expo-location";
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import LocationCard from '../components/LocationCard';
import { auth } from '../../firebase';

type LocationType = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
} | null;

const dummyDestinations = [
  "Bridge to Mall 1",
  "Erafone",
  "Church",
  "Supermarket",
  "Paris Baguette"
];

const POIS = [
  { name: "Paris Baguette", latitude: -6.1876921, longitude: 106.7328959 },
  { name: "Supermarket", latitude: -6.1871301, longitude: 106.7327142 },
  { name: "Erafone", latitude: -6.1872961, longitude: 106.7329331 },
  { name: "Church", latitude: -6.1875447, longitude: 106.7324325 },
  { name: "Bridge to Mall 1", latitude: -6.1873254, longitude: 106.7334012 }
];

const mapStyle = [
  {
    featureType: "poi",
    elementType: "all",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "transit",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }]
  }
];

export default function HomeScreen() {
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<LocationType>(null);
  const [region, setRegion] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [savedLocations, setSavedLocations] = useState<string[]>([]); // store saved location names
  const [loadingSave, setLoadingSave] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();

  // Fetch saved locations on mount
  useEffect(() => {
    const fetchSavedLocations = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const res = await fetch('https://aroundnus.onrender.com/api/savedLocations/get', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setSavedLocations(data.map((loc: { name: string }) => loc.name));
      } catch (e) {
        // Optionally handle error
      }
    };
    fetchSavedLocations();
  }, []);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      let { coords } = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.0012,
        longitudeDelta: 0.0012,
      });
    })();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const destinationParam = params.destination;
      if (destinationParam && typeof destinationParam === 'string') {
        const poi = POIS.find((p) => p.name === destinationParam);
        if (poi) {
          setSearchQuery(poi.name);
          setSelectedDestination(poi.name);
          if (mapRef.current) {
            mapRef.current.animateToRegion(
              {
                latitude: poi.latitude,
                longitude: poi.longitude,
                latitudeDelta: 0.0012,
                longitudeDelta: 0.0012,
              },
              1000
            );
          }
          // Clear the parameter after use
          router.setParams({ destination: undefined });
        }
      }
    }, [params.destination, mapRef, POIS, router, setSearchQuery, setSelectedDestination])
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setSelectedDestination(null);

    if (text.length === 0) {
      setSuggestions([]);
      return;
    }

    const matches = dummyDestinations.filter((d) =>
      d.toLowerCase().includes(text.toLowerCase())
    );
    setSuggestions(matches);
  };

  const handleSuggestionPress = (suggestion: string) => {
    setSearchQuery(suggestion);
    setSuggestions([]);
    setSelectedDestination(suggestion);
    Keyboard.dismiss();

    const poi = POIS.find((p) => p.name === suggestion);
    if (poi && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: poi.latitude,
          longitude: poi.longitude,
          latitudeDelta: 0.0012,
          longitudeDelta: 0.0012,
        },
        1000
      );
    }
  };

  const handleSearch = () => {
    console.log('Searching for:', searchQuery);
  };

  const handleCloseCard = () => {
    setSelectedDestination(null);
  };

  const handleSaveToggle = async (poiName: string) => {
    setLoadingSave(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');
      const token = await user.getIdToken();
      if (savedLocations.includes(poiName)) {
        // Unsave
        const res = await fetch('https://aroundnus.onrender.com/api/savedLocations/delete', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ location: { name: poiName } }),
        });
        if (res.ok) setSavedLocations((prev) => prev.filter((n) => n !== poiName));
      } else {
        // Save
        const res = await fetch('https://aroundnus.onrender.com/api/savedLocations/add', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ location: { name: poiName } }),
        });
        if (res.ok) setSavedLocations((prev) => [...prev, poiName]);
      }
    } catch (e) {
      // Optionally handle error
    } finally {
      setLoadingSave(false);
    }
  };

  // Pass saved state to LocationCard
  const isSelectedSaved = !!(selectedDestination && savedLocations.includes(selectedDestination));

  const isWeb = Platform.OS === "web";

  return (
    <View style={styles.container}>
      {!isWeb && location ? (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          initialRegion={location}
          customMapStyle={mapStyle}
          showsUserLocation
        >
          {POIS.map((poi, idx) => (
            <Marker
              key={idx}
              coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
              title={poi.name}
              onPress={() => {
                setSearchQuery(poi.name);
                setSelectedDestination(poi.name);
                setSuggestions([]);
                Keyboard.dismiss();
                if (mapRef.current) {
                  mapRef.current.animateToRegion(
                    {
                      latitude: poi.latitude,
                      longitude: poi.longitude,
                      latitudeDelta: 0.0012,
                      longitudeDelta: 0.0012,
                    },
                    1000
                  );
                }
              }}
            />
          ))}

        </MapView>
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.webPlaceholder]}>
          <Text style={styles.webText}>Connecting to Google Maps...</Text>
        </View>
      )}

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="🔍  Your Location"
          placeholderTextColor="#666666"
          editable={false}
        />

        <TextInput
          style={styles.input}
          placeholder="🔍  Destination"
          placeholderTextColor="#666666"
          value={searchQuery}
          onChangeText={handleSearchChange}
        />

        {searchQuery.length > 0 && !selectedDestination && (
          <View style={styles.suggestionContainer}>
            {suggestions.length === 0 ? (
              <Text style={styles.noSuggestions}>No destinations found</Text>
            ) : (
              <FlatList
                data={suggestions}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => handleSuggestionPress(item)}
                  >
                    <Text>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}

      </View>

      {selectedDestination && (
        <LocationCard
          destination={selectedDestination}
          onClose={handleCloseCard}
          isSaved={isSelectedSaved}
          onSaveToggle={() => handleSaveToggle(selectedDestination)}
          loadingSave={loadingSave}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: {
    position: "absolute",
    top: 50,
    left: 10,
    right: 10,
    gap: 10,
    zIndex: 10,
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 90,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  suggestionContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    maxHeight: 150,
    overflow: "hidden",
  },
  suggestionItem: {
    padding: 12,
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
  },
  noSuggestions: {
    padding: 12,
    textAlign: "center",
    color: "#999",
  },

  webPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
  },
  webText: {
    fontSize: 16,
    color: "#333",
  },
});
