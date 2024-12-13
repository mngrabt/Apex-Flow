import { supabase } from '../lib/supabase';

const predefinedUsers = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    username: 'abdurauf',
    password: 'apex2024',
    name: 'Абдурауф Гани',
    role: 'A',
    signature_url: 'https://mnhpdlwlwycdcexcelaf.supabase.co/storage/v1/object/public/signatures/abdurauf.png',
    telegram_chat_id: 2041833916
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    username: 'fozil',
    password: 'apex2024',
    name: 'Фозил Бабаджанов',
    role: 'C',
    signature_url: 'https://mnhpdlwlwycdcexcelaf.supabase.co/storage/v1/object/public/signatures/fozil.png',
    telegram_chat_id: null
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    username: 'aziz',
    password: 'apex2024',
    name: 'Азиз Раимжанов',
    role: 'C',
    signature_url: 'https://mnhpdlwlwycdcexcelaf.supabase.co/storage/v1/object/public/signatures/aziz.png',
    telegram_chat_id: null
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    username: 'umarali',
    password: 'apex2024',
    name: 'Умарали Умаров',
    role: 'D',
    signature_url: 'https://mnhpdlwlwycdcexcelaf.supabase.co/storage/v1/object/public/signatures/umar.png',
    telegram_chat_id: null
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    username: 'dinara',
    password: 'apex2024',
    name: 'Динара Ергашева',
    role: 'B',
    signature_url: null,
    telegram_chat_id: null
  },
  {
    id: '00000000-0000-0000-0000-000000000007',
    username: 'umar',
    password: 'apex2024',
    name: 'Умар Мамаджанов',
    role: 'B',
    signature_url: null,
    telegram_chat_id: null
  },
  {
    id: '00000000-0000-0000-0000-000000000008',
    username: 'akmal',
    password: 'apex2024',
    name: 'Акмаль Халимов',
    role: 'B',
    signature_url: null,
    telegram_chat_id: null
  },
  {
    id: '00000000-0000-0000-0000-000000000009',
    username: 'sherzod',
    password: 'apex2024',
    name: 'Шерзод Худояров',
    role: 'B',
    signature_url: null,
    telegram_chat_id: null
  }
];

export async function initializeUsers() {
  try {
    // Check if users already exist
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id');

    if (checkError) {
      console.error('Error checking existing users:', checkError);
      return;
    }

    // Only initialize if no users exist
    if (!existingUsers || existingUsers.length === 0) {
      const { error: insertError } = await supabase
        .from('users')
        .insert(predefinedUsers);

      if (insertError) {
        console.error('Error inserting users:', insertError);
        return;
      }

      console.log('Users initialized successfully');
    } else {
      console.log('Users already exist, skipping initialization');
    }
  } catch (error) {
    console.error('Error in user initialization:', error);
  }
}