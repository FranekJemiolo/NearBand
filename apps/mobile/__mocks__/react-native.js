const React = require('react');

const mockComponent = name => {
  const Component = props => React.createElement(name, props, props.children);
  Component.displayName = name;
  return Component;
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
  Platform: {
    OS: 'ios',
    select: obj => obj.ios || obj.default,
  },
};
