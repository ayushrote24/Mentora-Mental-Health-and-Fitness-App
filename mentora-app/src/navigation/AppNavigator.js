import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandMark } from '../components/BrandMark';

import LoginScreen        from '../screens/LoginScreen';
import OnboardScreen      from '../screens/OnboardScreen';
import DashboardScreen    from '../screens/DashboardScreen';
import ChatBotScreen      from '../screens/ChatBotScreen';
import MemoirScreen       from '../screens/MemoirScreen';
import ArticlesScreen     from '../screens/ArticlesScreen';
import RemindersScreen    from '../screens/RemindersScreen';
import DoctorsScreen      from '../screens/DoctorsScreen';
import StepsScreen        from '../screens/StepsScreen';
import FemaleHealthScreen from '../screens/FemaleHealthScreen';
import ProfileScreen      from '../screens/ProfileScreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

function LogoTabIcon({ focused }) {
  return (
    <View style={{ opacity: focused ? 1 : 0.75 }}>
      <BrandMark size={30} />
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(250,247,242,0.97)',
          borderTopColor: 'rgba(0,0,0,0.06)',
          paddingBottom: 8, paddingTop: 4, height: 72,
          elevation: 12, shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.08, shadowRadius: 12,
        },
        tabBarActiveTintColor: '#7C9E87',
        tabBarInactiveTintColor: '#8A8A8A',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
      }}>
      <Tab.Screen name="Home" component={DashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <LogoTabIcon focused={focused} />, tabBarLabel: 'Home' }} />
      <Tab.Screen name="Chat" component={ChatBotScreen}
        options={{
          tabBarIcon: ({ focused }) => <Text style={{ fontSize: 22, color: focused ? '#7A5FA8' : '#8A8A8A' }}>💬</Text>,
          tabBarLabel: 'ChatBot', tabBarActiveTintColor: '#7A5FA8',
        }} />
      <Tab.Screen name="Memoir" component={MemoirScreen}
        options={{
          tabBarIcon: ({ focused }) => <Text style={{ fontSize: 22, color: focused ? '#A07850' : '#8A8A8A' }}>📔</Text>,
          tabBarLabel: 'Memoir', tabBarActiveTintColor: '#A07850',
        }} />
      <Tab.Screen name="Profile" component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <Text style={{ fontSize: 22, color: focused ? '#5A7FA8' : '#8A8A8A' }}>👤</Text>,
          tabBarLabel: 'Profile', tabBarActiveTintColor: '#5A7FA8',
        }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: true }}>
        <Stack.Screen name="Login"        component={LoginScreen} />
        <Stack.Screen name="Onboard"      component={OnboardScreen} />
        <Stack.Screen name="Main"         component={MainTabs} />
        <Stack.Screen name="ChatBot"      component={ChatBotScreen} />
        <Stack.Screen name="Articles"     component={ArticlesScreen} />
        <Stack.Screen name="Reminders"    component={RemindersScreen} />
        <Stack.Screen name="Doctors"      component={DoctorsScreen} />
        <Stack.Screen name="Steps"        component={StepsScreen} />
        <Stack.Screen name="FemaleHealth" component={FemaleHealthScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
