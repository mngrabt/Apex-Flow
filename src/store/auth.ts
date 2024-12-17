import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User, Role } from '../types';
import { persist } from 'zustand/middleware';

// Name and role mappings
const USER_MAPPINGS: Record<string, { fullName: string; role: string }> = {
  '00000000-0000-0000-0000-000000000001': {
    fullName: 'Абдурауф Гани',
    role: 'Продакшен Менеджер'
  },
  '00000000-0000-0000-0000-000000000003': {
    fullName: 'Фозил Бабаджанов',
    role: 'Член Фин. Группы'
  },
  '00000000-0000-0000-0000-000000000004': {
    fullName: 'Азиз Раимжанов',
    role: 'Директор'
  },
  '00000000-0000-0000-0000-000000000007': {
    fullName: 'Умар Мамаджанов',
    role: 'Руководитель Отдела Маркетинга'
  },
  '00000000-0000-0000-0000-000000000005': {
    fullName: 'Умарали Умаров',
    role: 'Руководитель Отдела Снабжения'
  },
  '00000000-0000-0000-0000-000000000006': {
    fullName: 'Динара Ергашева',
    role: 'Член Отдела Снабжения'
  },
  '00000000-0000-0000-0000-000000000009': {
    fullName: 'Шерзод Худояров',
    role: 'Финансовый Директор'
  },
  '00000000-0000-0000-0000-000000000008': {
    fullName: 'Акмаль Халимов',
    role: 'Креативный Директор'
  }
};

// Helper function to get first name
export const getFirstName = (fullName: string) => fullName.split(' ')[0];

interface AuthState {
  user: User | null;
  users: User[];
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      users: [],

      login: async (username: string, password: string) => {
        try {
          // First, check if user exists in Supabase
          const { data: users, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password);

          if (fetchError) throw fetchError;
          if (!users || users.length === 0) throw new Error('Invalid credentials');

          const dbUser = users[0];
          const userMapping = USER_MAPPINGS[dbUser.id];

          // Map Supabase user to our User type with overridden name and role
          const user: User = {
            id: dbUser.id,
            name: userMapping?.fullName || dbUser.name,
            role: dbUser.role as Role,
            username: dbUser.username,
            displayRole: userMapping?.role || 'Подрядчик',
            signatureUrl: dbUser.signature_url || undefined
          };

          // Also fetch all users for the switchUser functionality
          const { data: allUsers } = await supabase
            .from('users')
            .select('*');

          set({ 
            user,
            users: allUsers?.map(u => ({
              id: u.id,
              name: USER_MAPPINGS[u.id]?.fullName || u.name,
              role: u.role as Role,
              username: u.username,
              displayRole: USER_MAPPINGS[u.id]?.role || 'Подрядчик',
              signatureUrl: u.signature_url || undefined
            })) || []
          });
        } catch (error) {
          console.error('Login error:', error);
          throw new Error('Invalid credentials');
        }
      },

      logout: async () => {
        try {
          set({ user: null, users: [] });
        } catch (error) {
          console.error('Logout error:', error);
          throw error;
        }
      },

      switchUser: () => {
        const { user, users } = useAuthStore.getState();
        const currentIndex = user ? users.findIndex(u => u.id === user.id) : -1;
        const nextIndex = (currentIndex + 1) % users.length;
        set({ user: users[nextIndex] });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, users: state.users })
    }
  )
);