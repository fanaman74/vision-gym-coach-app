import { supabase } from './supabase'
import { GymSession } from '@/types/metrics'

export interface StoredSession {
  id: string
  created_at: string
  console_type: string
  session_data: GymSession
}

export async function getSessions(): Promise<StoredSession[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    throw new Error(`Failed to fetch sessions: ${error.message}`)
  }

  return data ?? []
}
