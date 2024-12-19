import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

console.log('Initializing Supabase with URL:', supabaseUrl);

// Add retry logic for failed requests
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Create Supabase client with different configs for dev and prod
const createSupabaseClient = () => {
  const config = {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: 'supabase.auth.token'
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'procurement-management-system',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    }
  };

  // Only enable realtime features in production
  if (process.env.NODE_ENV === 'production') {
    config.realtime = {
      params: {
        eventsPerSecond: 10
      }
    };
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, config);
};

export const supabase = createSupabaseClient();

// Test immediate connection
const testConnection = async () => {
  try {
    const response = await fetch(supabaseUrl, {
      method: 'HEAD',
      headers: {
        'apikey': supabaseAnonKey
      }
    });
    console.log('Supabase server response:', response.status, response.statusText);
    return response.ok;
  } catch (error) {
    console.error('Failed to reach Supabase server:', error);
    return false;
  }
};

// Wrap Supabase query with retry logic and detailed error logging
export const withRetry = async <T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> => {
  try {
    // Test connection before operation
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('Unable to reach Supabase server');
      throw new Error('Server unreachable');
    }

    return await operation();
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying operation, ${retries} attempts remaining...`);
      await sleep(RETRY_DELAY);
      return withRetry(operation, retries - 1);
    }

    // Enhanced error logging
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error('Network Error Details:', {
        supabaseUrl,
        timestamp: new Date().toISOString(),
        browserInfo: navigator.userAgent,
        error
      });
    }

    throw error;
  }
};

// Check connection status with timeout
export const checkConnection = async (timeout = 5000) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const start = Date.now();
    const { data, error } = await supabase.from('users')
      .select('count')
      .single()
      .abortSignal(controller.signal);
    
    clearTimeout(timeoutId);
    const end = Date.now();
    
    if (error) {
      // In development, 401 errors are expected before login
      if (error.code === '401' && process.env.NODE_ENV === 'development') {
        return {
          status: 'connected',
          latency: end - start,
          error: null
        };
      }

      console.error('Supabase connection error:', {
        error,
        url: supabaseUrl,
        timestamp: new Date().toISOString()
      });
      return {
        status: 'error',
        latency: null,
        error: error.message
      };
    }

    return {
      status: 'connected',
      latency: end - start,
      error: null
    };
  } catch (error) {
    console.error('Supabase connection failed:', {
      error,
      url: supabaseUrl,
      timestamp: new Date().toISOString()
    });
    return {
      status: 'failed',
      latency: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Initialize connection check
if (process.env.NODE_ENV === 'production') {
  checkConnection()
    .then(status => {
      if (status.status === 'connected') {
        console.log(`Supabase connected successfully. Latency: ${status.latency}ms`);
      } else {
        console.error('Supabase connection failed:', status.error);
      }
    });
}

// Error handling
supabase.handleError = (error: any) => {
  console.error('Supabase error:', error);
  // Check if it's a network error
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    console.error('Network error detected. Please check your internet connection and Supabase service status.');
  }
  throw error;
};