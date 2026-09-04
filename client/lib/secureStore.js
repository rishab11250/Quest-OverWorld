import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'quest_overworld_jwt_token';
const USER_KEY = 'quest_overworld_user_data';

export const setToken = async (token) => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch (error) {
    console.error('Error setting token in secure store:', error);
  }
};

export const getToken = async () => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token from secure store:', error);
    return null;
  }
};

const removeToken = async () => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error removing token from secure store:', error);
  }
};

export const setUserData = async (user) => {
  try {
    const jsonValue = JSON.stringify(user);
    if (Platform.OS === 'web') {
      localStorage.setItem(USER_KEY, jsonValue);
    } else {
      await SecureStore.setItemAsync(USER_KEY, jsonValue);
    }
  } catch (error) {
    console.error('Error setting user data in secure store:', error);
  }
};

export const getUserData = async () => {
  try {
    let jsonValue;
    if (Platform.OS === 'web') {
      jsonValue = localStorage.getItem(USER_KEY);
    } else {
      jsonValue = await SecureStore.getItemAsync(USER_KEY);
    }
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error getting user data from secure store:', error);
    return null;
  }
};

export const clearAuth = async () => {
  await removeToken();
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(USER_KEY);
    } else {
      await SecureStore.deleteItemAsync(USER_KEY);
    }
  } catch (error) {
    console.error('Error clearing auth store:', error);
  }
};

const SETTINGS_PREFIX = 'quest_setting_';

export const setSetting = async (key, value) => {
  try {
    const fullKey = `${SETTINGS_PREFIX}${key}`;
    const stringVal = JSON.stringify(value);
    if (Platform.OS === 'web') {
      localStorage.setItem(fullKey, stringVal);
    } else {
      await SecureStore.setItemAsync(fullKey, stringVal);
    }
  } catch (error) {
    console.error(`Error saving setting ${key}:`, error);
  }
};

export const getSetting = async (key, defaultValue) => {
  try {
    const fullKey = `${SETTINGS_PREFIX}${key}`;
    let val;
    if (Platform.OS === 'web') {
      val = localStorage.getItem(fullKey);
    } else {
      val = await SecureStore.getItemAsync(fullKey);
    }
    return val != null ? JSON.parse(val) : defaultValue;
  } catch (error) {
    console.error(`Error reading setting ${key}:`, error);
    return defaultValue;
  }
};
