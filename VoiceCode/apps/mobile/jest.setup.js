// VoiceFlow Pro Mobile - Jest Setup

// Import testing library setup
import '@testing-library/jest-native/extend-expect';

// @stripe/stripe-react-native calls new NativeEventEmitter() at import time, which
// throws in the jest (non-native) env. Mock it so any screen/service reaching the
// payment layer can load under test.
jest.mock('@stripe/stripe-react-native', () => ({
  __esModule: true,
  StripeProvider: ({ children }) => children,
  useStripe: () => ({
    initPaymentSheet: jest.fn(async () => ({})),
    presentPaymentSheet: jest.fn(async () => ({})),
    confirmPayment: jest.fn(async () => ({})),
  }),
  CardField: () => null,
  initStripe: jest.fn(async () => undefined),
  presentPaymentSheet: jest.fn(async () => ({})),
  initPaymentSheet: jest.fn(async () => ({})),
  confirmPayment: jest.fn(async () => ({})),
}));

// @expo/vector-icons pulls native font loading (loadedNativeFonts) that isn't available
// under jest; render every icon set as a lightweight element so screens using icons mount.
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Icon = (props) => React.createElement(Text, { ...props, testID: props.testID }, null);
  return new Proxy(
    { __esModule: true },
    { get: (target, prop) => (prop in target ? target[prop] : Icon) },
  );
});

// RN Linking is unimplemented under jest (openURL returns undefined, so `.catch` throws).
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(() => Promise.resolve()),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
}));

// The real ThemeProvider renders null until an async loadThemePreference() resolves,
// so synchronous queries in screen tests find nothing. Render children immediately
// with the real light theme values (keeps screens' theme.* usage faithful).
jest.mock('./src/contexts/ThemeContext', () => {
  const React = require('react');
  const { theme } = require('./src/theme');
  const value = {
    theme: theme.light,
    colorScheme: 'light',
    themeMode: 'auto',
    setThemeMode: jest.fn(),
    isDark: false,
  };
  const ThemeContext = React.createContext(value);
  return {
    __esModule: true,
    ThemeContext,
    ThemeProvider: ({ children }) =>
      React.createElement(ThemeContext.Provider, { value }, children),
    useTheme: () => value,
  };
});

// expo-constants pulls native modules at import; provide a static config for tests.
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      version: '1.0.0',
      ios: { buildNumber: '1' },
      android: { versionCode: 1 },
    },
    manifest: {},
  },
}));

// Silence "Native animated module is not available" from Animated-based components (RN 0.76 path)
jest.mock('react-native/src/private/animated/NativeAnimatedHelper', () => ({
  __esModule: true,
  default: {
    API: {
      flushQueue: jest.fn(),
      setWaitingForIdentifier: jest.fn(),
      unsetWaitingForIdentifier: jest.fn(),
    },
    addWhitelistedStyleProp: jest.fn(),
    addWhitelistedTransformProp: jest.fn(),
    generateNewNodeTag: jest.fn(() => 1),
    generateNewAnimationId: jest.fn(() => 1),
    shouldUseNativeDriver: jest.fn(() => false),
    assertNativeAnimatedModule: jest.fn(),
  },
}));

// Mock AsyncStorage
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock Expo modules
jest.mock('expo-av', () => {
  const createRecordingInstance = () => ({
    prepareToRecordAsync: jest.fn(() => Promise.resolve()),
    startAsync: jest.fn(() => Promise.resolve()),
    pauseAsync: jest.fn(() => Promise.resolve()),
    stopAndUnloadAsync: jest.fn(() => Promise.resolve()),
    getURI: jest.fn(() => 'file://mock-recording.m4a'),
    getStatusAsync: jest.fn(() =>
      Promise.resolve({
        canRecord: true,
        isRecording: true,
        isDoneRecording: false,
        durationMillis: 1000,
        metering: -30,
      })
    ),
    setOnRecordingStatusUpdate: jest.fn(),
    setProgressUpdateInterval: jest.fn(),
  });

  const createSoundInstance = () => ({
    playAsync: jest.fn(() => Promise.resolve()),
    pauseAsync: jest.fn(() => Promise.resolve()),
    stopAsync: jest.fn(() => Promise.resolve()),
    unloadAsync: jest.fn(() => Promise.resolve()),
    setPositionAsync: jest.fn(() => Promise.resolve()),
    setRateAsync: jest.fn(() => Promise.resolve()),
    setVolumeAsync: jest.fn(() => Promise.resolve()),
    setIsLoopingAsync: jest.fn(() => Promise.resolve()),
    getStatusAsync: jest.fn(() =>
      Promise.resolve({ isLoaded: true, isPlaying: false, positionMillis: 0, durationMillis: 1000 })
    ),
    setOnPlaybackStatusUpdate: jest.fn(),
    replayAsync: jest.fn(() => Promise.resolve()),
  });

  const Recording = jest.fn(() => createRecordingInstance());
  Recording.createAsync = jest.fn(() =>
    Promise.resolve({ recording: createRecordingInstance(), status: { canRecord: true, isRecording: true } })
  );

  const Sound = jest.fn(() => createSoundInstance());
  Sound.createAsync = jest.fn(() =>
    Promise.resolve({ sound: createSoundInstance(), status: { isLoaded: true } })
  );

  return {
    Audio: {
      setAudioModeAsync: jest.fn(() => Promise.resolve()),
      setIsEnabledAsync: jest.fn(() => Promise.resolve()),
      requestPermissionsAsync: jest.fn(() =>
        Promise.resolve({ granted: true, status: 'granted', canAskAgain: true, expires: 'never' })
      ),
      getPermissionsAsync: jest.fn(() =>
        Promise.resolve({ granted: true, status: 'granted', canAskAgain: true, expires: 'never' })
      ),
      Recording,
      Sound,
      RecordingOptionsPresets: {
        HIGH_QUALITY: {},
        LOW_QUALITY: {},
      },
      AndroidOutputFormat: { DEFAULT: 0, THREE_GPP: 1, MPEG_4: 2, AMR_NB: 3, AAC_ADTS: 6 },
      AndroidAudioEncoder: { DEFAULT: 0, AMR_NB: 1, AAC: 3, HE_AAC: 4 },
      IOSOutputFormat: { MPEG4AAC: 'aac ', LINEARPCM: 'lpcm' },
      IOSAudioQuality: { MIN: 0, LOW: 32, MEDIUM: 64, HIGH: 96, MAX: 127 },
    },
    InterruptionModeIOS: {
      MixWithOthers: 0,
      DoNotMix: 1,
      DuckOthers: 2,
    },
    InterruptionModeAndroid: {
      DoNotMix: 1,
      DuckOthers: 2,
    },
  };
});

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file://mock-directory/',
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  EncodingType: {
    Base64: 'base64',
  },
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve()),
  getStringAsync: jest.fn(() => Promise.resolve('')),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

// Mock Supabase
jest.mock('@supabase/supabase-js', () => {
  const createQueryBuilder = () => {
    const builder = {};
    const chainMethods = [
      'select', 'insert', 'update', 'upsert', 'delete',
      'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
      'is', 'in', 'contains', 'or', 'and', 'not', 'filter',
      'order', 'limit', 'range', 'match',
    ];
    chainMethods.forEach((m) => {
      builder[m] = jest.fn(() => builder);
    });
    builder.single = jest.fn(() => Promise.resolve({ data: null, error: null }));
    builder.maybeSingle = jest.fn(() => Promise.resolve({ data: null, error: null }));
    builder.then = jest.fn((resolve) => Promise.resolve({ data: [], error: null }).then(resolve));
    return builder;
  };

  const createStorageBucket = () => ({
    upload: jest.fn(() => Promise.resolve({ data: { path: 'mock/path' }, error: null })),
    download: jest.fn(() => Promise.resolve({ data: new Blob(), error: null })),
    remove: jest.fn(() => Promise.resolve({ data: [], error: null })),
    list: jest.fn(() => Promise.resolve({ data: [], error: null })),
    getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://mock.supabase.co/file' } })),
    createSignedUrl: jest.fn(() => Promise.resolve({ data: { signedUrl: 'https://mock/signed' }, error: null })),
  });

  const createChannel = () => {
    const channel = {
      on: jest.fn(() => channel),
      subscribe: jest.fn(() => channel),
      unsubscribe: jest.fn(() => Promise.resolve('ok')),
      send: jest.fn(() => Promise.resolve('ok')),
    };
    return channel;
  };

  return {
    createClient: jest.fn(() => ({
      from: jest.fn(() => createQueryBuilder()),
      rpc: jest.fn(() => Promise.resolve({ data: null, error: null })),
      auth: {
        getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
        getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
        signInWithPassword: jest.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
        signUp: jest.fn(() => Promise.resolve({ data: { user: null, session: null }, error: null })),
        signOut: jest.fn(() => Promise.resolve({ error: null })),
        resetPasswordForEmail: jest.fn(() => Promise.resolve({ data: {}, error: null })),
        updateUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
        setSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
        refreshSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
        onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      },
      storage: {
        from: jest.fn(() => createStorageBucket()),
      },
      channel: jest.fn(() => createChannel()),
      removeChannel: jest.fn(() => Promise.resolve('ok')),
      removeAllChannels: jest.fn(() => Promise.resolve([])),
    })),
  };
});

// Mock react-native-safe-area-context (children don't render in jest without measured insets)
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaConsumer: ({ children }) => children(inset),
    SafeAreaView: ({ children }) => children,
    SafeAreaInsetsContext: {
      Provider: ({ children }) => children,
      Consumer: ({ children }) => children(inset),
    },
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => frame,
    initialWindowMetrics: { insets: inset, frame },
  };
});

// Mock React Navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    NavigationContainer: ({ children }) => children,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
      dispatch: jest.fn(),
      reset: jest.fn(),
      setParams: jest.fn(),
      addListener: jest.fn(() => jest.fn()),
      removeListener: jest.fn(),
      isFocused: jest.fn(() => true),
      canGoBack: jest.fn(() => true),
      getParent: jest.fn(),
      getState: jest.fn(),
    }),
    useRoute: () => ({
      key: 'test-route',
      name: 'TestScreen',
      params: {},
    }),
    useFocusEffect: jest.fn(),
    useIsFocused: () => true,
  };
});

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

