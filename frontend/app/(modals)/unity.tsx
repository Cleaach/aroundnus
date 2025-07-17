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
  const [unityKey, setUnityKey] = useState(0);



  const terminateUnity = () => {
    (unityRef.current as any)?.postMessage(
      'NavigationController',
      'ArrivedAtDestination'
    );
    setIsUnityVisible(false);
    console.log("THIS SHIT DONE");
    setUnityKey(prev => prev + 1); // Force remount next time
  };

  const handleBack = () => {
    console.log('Terminating Unity and navigating back...');
    
    // Terminate Unity first
    terminateUnity();
    
    // Wait longer for Unity to fully terminate
    setTimeout(() => {
      router.back();
    }, 3000);
  };

  useEffect(() => {
    if (destination && unityRef.current) {
      (unityRef.current as any)?.postMessage(
        'NavigationController',
        'StartNavigationToPOI',
        destination
      );
      console.log("MARI KITA KE " + destination)
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
          key={unityKey}
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