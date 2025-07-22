import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Image } from 'react-native';
import { getAuth } from 'firebase/auth';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';



interface SharedLocation {
    locationId: string;
    sharedBy: string;
    note?: string;
    status: string;
    sharedAt: string;
    locationData: {
        name: string;
    };
    sharedByUser: {
        uid: string;
        displayName: string;
        photoURL?: string;
    };
}

export default function SharedLocationsScreen() {
    const [sharedLocations, setSharedLocations] = useState<SharedLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const auth = getAuth();

    const fetchSharedLocations = async () => {
        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch('https://aroundnus.onrender.com/api/shared-locations', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch shared locations');
            }

            const data = await response.json();
            setSharedLocations(data.sharedLocations || []);
        } catch (error) {
            console.error('Error fetching shared locations:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSharedLocations();
    }, [auth.currentUser]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchSharedLocations();
    }, []);

    const renderItem = ({ item }: { item: SharedLocation }) => (
        <View style={styles.itemContainer}>
            <Image source={{ uri: item.sharedByUser.photoURL || 'https://via.placeholder.com/40' }} style={styles.avatar} />
            <View style={styles.textContainer}>
                <Text style={styles.locationName}>{item.locationData.name}</Text>
                <Text style={styles.sharedBy}>Shared by: {item.sharedByUser.displayName}</Text>
                {item.note ? <Text style={styles.note}>Note: {item.note}</Text> : null}
            </View>
        </View>
    );

    if (loading) {
        return (
            <ThemedView style={styles.container}>
                <ActivityIndicator size="large" />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title" style={styles.title}>Shared Locations</ThemedText>
            <FlatList
                data={sharedLocations}
                renderItem={renderItem}
                keyExtractor={(item) => `${item.locationId}-${item.sharedBy}`}
                ListEmptyComponent={<Text style={styles.emptyText}>No locations have been shared with you.</Text>}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        marginBottom: 16,
    },
    itemContainer: {
        flexDirection: 'row',
        padding: 16,
        marginBottom: 8,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    locationName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    sharedBy: {
        fontSize: 14,
        color: '#666',
    },
    note: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#666',
    },
});
