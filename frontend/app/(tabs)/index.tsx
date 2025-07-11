import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
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
import { useRouter } from 'expo-router';

type LocationType = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
} | null;

const dummyDestinations = [
  "UTown",
  "COM1",
  "COM2",
  "YIH",
  "Central Library",
  "PGP",
  "NUH",
  "Science Canteen",
  "Business School",
];

export default function HomeScreen() {
  const [location, setLocation] = useState<LocationType>(null);
  const [region, setRegion] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(
    null
  );
  const router = useRouter();

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      let { coords } = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    })();
  }, []);

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
  };

  const handleSearch = () => {
    console.log('Searching for:', searchQuery);
  };

  const handleNavigate = () => {
    console.log('Navigate button pressed, attempting to navigate to Unity modal');
    router.navigate('/(modals)/unity');
  };

  const isWeb = Platform.OS === "web";

  return (
    <View style={styles.container}>
      {!isWeb && location ? (
        <MapView
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          initialRegion={location}
          showsUserLocation
        >
          {location && (
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title="You are here"
            />
          )}
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

        {selectedDestination && (
          <TouchableOpacity style={styles.navigateButton} onPress={handleNavigate}>
            <Text style={styles.navigateButtonText}>Navigate</Text>
          </TouchableOpacity>
        )}
      </View>
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
    borderRadius: 12,
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
  navigateButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 5,
  },
  navigateButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
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
