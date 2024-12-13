export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string // Changed from UUID to string
          username: string
          password: string
          name: string
          role: 'A' | 'B' | 'C' | 'D'
          signature_url: string | null
          created_at: string
        }
        Insert: {
          id?: string // Changed from UUID to string
          username: string
          password: string
          name: string
          role: 'A' | 'B' | 'C' | 'D'
          signature_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string // Changed from UUID to string
          username?: string
          password?: string
          name?: string
          role?: 'A' | 'B' | 'C' | 'D'
          signature_url?: string | null
          created_at?: string
        }
      }
      // Rest of the types remain the same...
    }
  }
}