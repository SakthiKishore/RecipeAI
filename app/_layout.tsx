import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { Session } from '@supabase/supabase-js';
import Auth from '../components/Auth';
import { TouchableOpacity, Text } from 'react-native';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return <Auth />;
  }

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Camera",
          headerRight: () => (
            <TouchableOpacity onPress={() => supabase.auth.signOut()} style={{ marginRight: 15 }}>
              <Text>Logout</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="preview"
        options={{
          title: "Preview",
        }}
      />
      <Stack.Screen
        name="recipe"
        options={{
          title: "Your Recipe",
        }}
      />
    </Stack>
  );
}
