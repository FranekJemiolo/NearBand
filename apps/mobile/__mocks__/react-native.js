const React = require('react');

const mockComponent = name => {
  const Component = props => React.createElement(name, props, props.children);
  Component.displayName = name;
  return Component;
};

const permissionsStore = {};
let appStateCurrent = 'active';
const appStateListeners = new Set();
const eventEmitterListeners = {};

const Platform = {
  OS: 'ios',
  select: obj => {
    if (obj[Platform.OS] !== undefined) return obj[Platform.OS];
    return obj.default;
  },
};

const PermissionsAndroid = {
  PERMISSIONS: {
    ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
    ACCESS_COARSE_LOCATION: 'android.permission.ACCESS_COARSE_LOCATION',
    ACCESS_BACKGROUND_LOCATION: 'android.permission.ACCESS_BACKGROUND_LOCATION',
    RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
    POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS',
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    NEVER_ASK_AGAIN: 'never_ask_again',
  },
  check: jest.fn(async permission => {
    return permissionsStore[permission] === 'granted';
  }),
  request: jest.fn(async (permission, _rationale) => {
    const result = permissionsStore[permission] || 'granted';
    permissionsStore[permission] = result;
    return result;
  }),
  requestMultiple: jest.fn(async permissions => {
    const results = {};
    for (const p of permissions) {
      results[p] = permissionsStore[p] || 'granted';
    }
    return results;
  }),
  __setPermission: (permission, status) => {
    permissionsStore[permission] = status;
  },
  __resetPermissions: () => {
    for (const key of Object.keys(permissionsStore)) {
      delete permissionsStore[key];
    }
  },
};

const Vibration = {
  vibrate: jest.fn(),
  cancel: jest.fn(),
};

const AppState = {
  currentState: 'active',
  addEventListener: jest.fn((event, handler) => {
    appStateListeners.add(handler);
    return {
      remove: () => appStateListeners.delete(handler),
    };
  }),
  __simulateStateChange: newState => {
    AppState.currentState = newState;
    for (const listener of appStateListeners) {
      listener(newState);
    }
  },
};

const DeviceEventEmitter = {
  addListener: jest.fn((event, handler) => {
    if (!eventEmitterListeners[event]) {
      eventEmitterListeners[event] = new Set();
    }
    eventEmitterListeners[event].add(handler);
    return {
      remove: () => eventEmitterListeners[event]?.delete(handler),
    };
  }),
  emit: jest.fn((event, data) => {
    const handlers = eventEmitterListeners[event];
    if (handlers) {
      for (const h of handlers) {
        h(data);
      }
    }
  }),
  __reset: () => {
    for (const key of Object.keys(eventEmitterListeners)) {
      delete eventEmitterListeners[key];
    }
  },
};

module.exports = {
  View: mockComponent('View'),
  Text: mockComponent('Text'),
  TouchableOpacity: mockComponent('TouchableOpacity'),
  FlatList: ({ data, renderItem, keyExtractor }) => {
    return React.createElement(
      'FlatList',
      null,
      (data || []).map((item, index) =>
        React.createElement(
          'View',
          { key: keyExtractor ? keyExtractor(item, index) : index },
          renderItem({ item, index }),
        ),
      ),
    );
  },
  Modal: mockComponent('Modal'),
  TextInput: mockComponent('TextInput'),
  SafeAreaView: mockComponent('SafeAreaView'),
  StatusBar: mockComponent('StatusBar'),
  StyleSheet: {
    create: styles => styles,
  },
  Platform,
  PermissionsAndroid,
  Vibration,
  AppState,
  DeviceEventEmitter,
  NativeModules: {},
};
