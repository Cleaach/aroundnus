import React, { useRef, useEffect } from 'react';
import { View } from 'react-native';
import UnityView from '@azesmway/react-native-unity';
import { Stack } from 'expo-router';
import { NativeSyntheticEvent } from 'react-native';

// interface IMessage {
//   gameObject: string;
//   methodName: string;
//   message: string;
// }

const UnityScreen = () => {
  const unityRef = useRef<UnityView>(null);

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
      <UnityView
        ref={unityRef}
        style={{ flex: 1 }}
        onUnityMessage={(result: NativeSyntheticEvent<{ message: string }>) => {
          console.log('Message from Unity:', result.nativeEvent.message);
        }}
      />
    </View>
  );
};

export default UnityScreen; 