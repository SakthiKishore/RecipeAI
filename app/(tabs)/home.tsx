import { StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase'; // Adjust the import path as needed
import { Text, View } from '@/components/Themed';
import EditScreenInfo from '@/components/EditScreenInfo'; // <-- Add this line

export default function TabHomeScreen() {
  const [username, setUsername] = useState<string>(''); // State to hold the username

  useEffect(() => {
    // Fetch the user information from Supabase
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Assuming the username is stored in user_metadata
        const userMetadata = session.user.user_metadata;
        setUsername(userMetadata.username || session.user.email || 'User');
      }
    };

    fetchUser();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
      Alert.alert('Sign Out Failed', error.message);
    } else {
      console.log('Successfully signed out');
      Alert.alert('Sign Out', 'You have been successfully signed out.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hello, {username}</Text>
      
      {/* Your existing content */}
      <Text style={styles.title}>Home</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <EditScreenInfo path="app/(tabs)/home.tsx" />

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between', // Ensures the sign-out button is at the bottom
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  signOutButton: {
    backgroundColor: '#FF3B30', // Red color for the sign-out button
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginBottom: 20, // Space from the bottom
  },
  signOutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
