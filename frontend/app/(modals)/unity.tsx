import React, { useRef, useEffect, useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import UnityView, { UnityViewType } from '@azesmway/react-native-unity';
import { useRouter } from 'expo-router';
import { NativeSyntheticEvent } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

// interface IMessage {
//   gameObject: string;
//   methodName: string;
//   message: string;
// }

const UnityScreen = () => {
  const { destination } = useLocalSearchParams();
  const unityRef = useRef<React.ElementRef<typeof UnityViewType>>(null);
  const router = useRouter();
  const [isUnityVisible, setIsUnityVisible] = useState(true);

  // Cleanup Unity when component unmounts
  useEffect(() => {
    return () => {
      terminateUnity();
    };
  }, []);

  const terminateUnity = () => {
    if (unityRef.current) {
      try {
        const unityInstance = unityRef.current as any;
        
        // Try to pause Unity first
        if (unityInstance && typeof unityInstance.pause === 'function') {
          unityInstance.pause();
        }
        
        // Try to unload Unity
        if (unityInstance && typeof unityInstance.unload === 'function') {
          unityInstance.unload();
        }
        
        // Try to destroy Unity
        if (unityInstance && typeof unityInstance.destroy === 'function') {
          unityInstance.destroy();
        }
        
        console.log('Unity terminated successfully');
      } catch (error) {
        console.log('Unity termination error:', error);
      }
    }
    setIsUnityVisible(false);
  };

  const handleBack = () => {
    console.log('Terminating Unity and navigating back...');
    
    // Terminate Unity first
    terminateUnity();
    
    // Wait longer for Unity to fully terminate
    setTimeout(() => {
      router.back();
    }, 500);
  };

  useEffect(() => {
    if (destination && unityRef.current) {
      // Send the destination to Unity
      unityRef.current.postMessage(
        'NavigationController', // GameObject name in Unity
        'SetDestination',       // Method name in Unity script
        destination             // The destination string
      );
    }
  }, [destination]);

  return (
    <View style={{ flex: 1 }}>
      {/* Custom back button */}
      <TouchableOpacity 
        style={{ 
          position: 'absolute', 
          top: 50, 
          left: 20, 
          zIndex: 1000,
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: 10,
          borderRadius: 20
        }}
        onPress={handleBack}
      >
        <Text style={{ color: 'white', fontSize: 16 }}>← Back</Text>
      </TouchableOpacity>
      
      {isUnityVisible && (
        <UnityView
          ref={unityRef}
          style={{ flex: 1 }}
          onUnityMessage={(result: NativeSyntheticEvent<{ message: string }>) => {
            console.log('Message from Unity:', result.nativeEvent.message);
          }}
        />
      )}
    </View>
  );
};

export default UnityScreen; 