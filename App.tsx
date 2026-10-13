import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Login from './Screens/Login';
import Home from './Screens/Home';
import Register from './Screens/Register';
import RecuperaSenha from './Screens/RecuperaSenha';
import ProfileScreen from './Screens/ProfileScreen';
import TermsScreen from './Screens/TermsScreen';
import ForumScreen from './Screens/ForumScreen';
import ForumTopicScreen from './Screens/ForumTopicScreen';
import CreateForumTopicScreen from './Screens/CreateForumTopicScreen';
import EditForumTopicScreen from './Screens/EditForumTopicScreen';
import UserProfileScreen from './Screens/UserProfileScreen';
import EditFangameScreen from './Screens/EditFangameScreen';
import FangameDetailScreen from './Screens/FangameDetailScreen';

import { useTheme } from './hooks/useTheme';

export type RootStackParamList = {
  Terms: { origem?: string } | undefined;
  Login: undefined;
  Home: undefined;
  Register: undefined;
  RecuperaSenha: undefined;
  Profile: undefined;
  Forum: undefined;
  ForumTopic: { topicId: string };
  CreateForumTopic: undefined;
  EditForumTopic: { topicId: string };
  UserProfile: { userId: string };
  EditFangame: { fangameId: string };
  FangameDetail: { fangameId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const { colors, loading } = useTheme();

  if (loading) return null;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar
          barStyle={colors.text === '#ffffff' ? 'light-content' : 'dark-content'}
          backgroundColor={colors.backgroundSecondary}
        />
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Terms" screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="Terms" component={TermsScreen} />
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Register" component={Register} />
            <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
            <Stack.Screen name="RecuperaSenha" component={RecuperaSenha} />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{
                headerTitle: 'Configurações da Conta',
                headerStyle: { backgroundColor: colors.backgroundSecondary },
                headerTintColor: colors.text,
                headerShown: true,
              }}
            />
            <Stack.Screen name="Forum" component={ForumScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ForumTopic" component={ForumTopicScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CreateForumTopic" component={CreateForumTopicScreen} options={{ headerShown: false }} />
            <Stack.Screen name="EditForumTopic" component={EditForumTopicScreen} options={{ headerShown: false }} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ headerShown: false }} />
            <Stack.Screen name="EditFangame" component={EditFangameScreen} options={{ headerShown: false }} />
            <Stack.Screen name="FangameDetail" component={FangameDetailScreen} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
}