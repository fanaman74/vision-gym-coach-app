import { supabase } from './supabase'
import { GymSession } from '@/types/metrics'

export async function saveSession(session: GymSession): Promise<void> {
  const { error } = await supabase.from('sessions').insert({
    console_type: session.consoleType,
    session_data: session,
  })
  if (error) {
    console.error('[saveSession]', error)
  }
}
