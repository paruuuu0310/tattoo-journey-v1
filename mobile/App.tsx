import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

const App = (): React.JSX.Element => {
  return (
    <AuthProvider>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <AppNavigator />
    </AuthProvider>
  );
};

export default App;
