import { registerRootComponent } from 'expo';
import { createElement } from 'react';

import App from './App';
import { AuthProvider } from './src/providers/AuthProvider';

const Root = () => createElement(AuthProvider, null, createElement(App));

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(Root);
