import React, { useRef, useEffect, useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import UnityView from '@azesmway/react-native-unity';
import { useRouter } from 'expo-router';
import { NativeSyntheticEvent } from 'react-native';

// interface IMessage {
//   gameObject: string;
//   methodName: string;
//   message: string;
// }

const UnityScreen = () => {
  const unityRef = useRef<React.ElementRef<typeof UnityView>>(null);
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

  // Example of sending a message to Unity after a delay
  // useEffect(() => {
  //   setTimeout(() => {
  //     if (unityRef?.current) {
  //       const message: IMessage = {
  //         gameObject: 'gameObject',
  //         methodName: 'methodName',
  //         message: 'Hello from React Native!',
  //       };
  //       unityRef.current.postMessage(
  //         message.gameObject,
  //         message.methodName,
  //         message.message
  //       );
  //     }
  //   }, 3000);
  // }, []);

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