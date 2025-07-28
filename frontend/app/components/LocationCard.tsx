import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth } from '../../firebase';
import { v4 as uuidv4 } from 'uuid';

interface LocationCardProps {
  destination: string;
  onClose: () => void;
}

const LocationCard: React.FC<LocationCardProps> = ({ destination, onClose }) => {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const router = useRouter();

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleNavigate = () => {
    router.navigate({
      pathname: '/(modals)/unity',
      params: { destination },
    });
  };

  const handleShare = () => {
    router.navigate({
      pathname: '/(modals)/share-location',
      params: { locationName: destination },
    });
  };

  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to save locations.');
        return;
      }
      const token = await user.getIdToken();
      const locationToAdd = { id: uuidv4(), name: destination };

      const response = await fetch('https://aroundnus.onrender.com/api/savedLocations/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location: locationToAdd }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save location');
      }

      Alert.alert('Success', `${destination} has been saved.`);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', (error as Error).message);
    }
  };

  return (
    <Animated.View style={[styles.cardContainer, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.headerContainer}>
        <Text style={styles.cardTitle}>{destination}</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={handleShare}>
            <View style={styles.iconWrapper}>
              <FontAwesome name="share-square-o" size={22} color="#555" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClose}>
            <View style={styles.iconWrapper}>
              <FontAwesome name="close" size={22} color="#555" style={{ transform: [{ translateY: -1 }] }} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.navigateButton} onPress={handleNavigate}>
          <FontAwesome name="location-arrow" size={20} color="#fff" />
          <Text style={styles.navigateButtonText}>Navigate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <FontAwesome name="bookmark" size={20} color="#0052A8" />
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0052A8',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    gap: 8,
  },
  navigateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F0FA',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    gap: 8,
  },
  saveButtonText: {
    color: '#0052A8',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default LocationCard;
