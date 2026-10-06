/**
 * @format
 */
import {Buffer} from 'buffer';
import 'react-native-get-random-values';

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Minimal no-op DOM listener functions for dependencies in the React Native runtime.
window.addEventListener = () => {};
window.removeEventListener = () => {};
window.Buffer = Buffer;

AppRegistry.registerComponent(appName, () => App);
