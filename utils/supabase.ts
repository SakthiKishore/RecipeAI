import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ukqzulyvmatmnsupxfvj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrcXp1bHl2bWF0bW5zdXB4ZnZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYwNjIyNTcsImV4cCI6MjA0MTYzODI1N30.BrqmRR9eTpIL_wuOtlpVxjf6MNkRR56P8xCqkN9PsHc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Automatically refresh the session when the app state changes
import { AppState } from 'react-native'

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})