import { createClient } from '@/lib/supabase/server'
import ResultsBracket from './ResultsBracket'

export const revalidate = 60

export default async function ResultsPage() {
  const supabase = await createClient()

  const { data: row } = await supabase
    .from('tournament_results')
    .select('picks, updated_at')
    .eq('id', 1)
    .single()

  return (
    <ResultsBracket
      results={(row?.picks ?? {}) as Record<string, number>}
      updatedAt={row?.updated_at ?? null}
    />
  )
}
