// Mock for React Native to avoid ES6 import issues in Jest
const ReactNative = {
  // Platform
  Platform: {
    OS: 'ios',
    select: (obj) => obj.ios || obj.default,
  },

  // Dimensions
  Dimensions: {
    get: () => ({
      width: 375,
      height: 667,
    }),
  },

  // Alert
  Alert: {
    alert: jest.fn(),
  },

  // AsyncStorage (basic mock)
  AsyncStorage: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },

  // Basic components
  View: 'View',
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  TouchableHighlight: 'TouchableHighlight',
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
  Image: 'Image',
  Button: 'Button',
  Switch: 'Switch',
  Picker: 'Picker',
  Modal: 'Modal',
  ActivityIndicator: 'ActivityIndicator',
  RefreshControl: 'RefreshControl',
  StatusBar: 'StatusBar',
  SafeAreaView: 'SafeAreaView',
  KeyboardAvoidingView: 'KeyboardAvoidingView',

  // StyleSheet
  StyleSheet: {
    create: (styles) => styles,
    flatten: (styles) => styles,
  },

  // Animated
  Animated: {
    View: 'Animated.View',
    Text: 'Animated.Text',
    Value: jest.fn(() => ({
      setValue: jest.fn(),
      addListener: jest.fn(),
      removeAllListeners: jest.fn(),
    })),
    timing: jest.fn(() => ({
      start: jest.fn(),
    })),
    spring: jest.fn(() => ({
      start: jest.fn(),
    })),
    decay: jest.fn(() => ({
      start: jest.fn(),
    })),
  },

  // PanResponder
  PanResponder: {
    create: jest.fn(() => ({
      panHandlers: {},
    })),
  },

  // Linking
  Linking: {
    openURL: jest.fn(() => Promise.resolve()),
    canOpenURL: jest.fn(() => Promise.resolve(true)),
    getInitialURL: jest.fn(() => Promise.resolve(null)),
  },

  // DeviceEventEmitter
  DeviceEventEmitter: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
  },

  // NativeEventEmitter
  NativeEventEmitter: jest.fn(() => ({
    addListener: jest.fn(),
    removeListener: jest.fn(),
  })),

  // BackHandler
  BackHandler: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    exitApp: jest.fn(),
  },

  // Keyboard
  Keyboard: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dismiss: jest.fn(),
  },

  // PermissionsAndroid
  PermissionsAndroid: {
    request: jest.fn(() => Promise.resolve('granted')),
    check: jest.fn(() => Promise.resolve(true)),
    PERMISSIONS: {},
    RESULTS: {
      GRANTED: 'granted',
      DENIED: 'denied',
    },
  },

  // NetInfo
  NetInfo: {
    isConnected: {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      fetch: jest.fn(() => Promise.resolve(true)),
    },
  },
};

module.exports = ReactNative;
