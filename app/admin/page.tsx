import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminDashboard from './AdminDashboard'

const BEEHIIV_API_KEY = process.env.BEEHIIV_API_KEY
const PUBLICATION_ID = 'd3d7b029-0880-4b74-9d5c-13211181850d'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL

async function getStats() {
  const supabase = await createClient()

  const [
    { count: totalUsers },
    { count: totalBrackets },
    { count: submittedBrackets },
    { data: recentSignups },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('brackets').select('*', { count: 'exact', head: true }),
    supabase.from('brackets').select('*', { count: 'exact', head: true }).not('submitted_at', 'is', null),
    supabase.from('profiles').select('username, created_at').order('created_at', { ascending: false }).limit(10),
  ])

  // Beehiiv — get subscriber count from Her Madness
  let beehiivCount = 0
  try {
    const res = await fetch(
      `https://api.beehiiv.com/v2/publications/${PUBLICATION_ID}/subscriptions?limit=1&status=active`,
      {
        headers: { 'Authorization': `Bearer ${BEEHIIV_API_KEY}` },
        next: { revalidate: 300 }, // cache 5 min
      }
    )
    if (res.ok) {
      const data = await res.json()
      beehiivCount = data.total_results ?? 0
    }
  } catch {
    // Beehiiv unavailable — show 0
  }

  return {
    totalUsers: totalUsers ?? 0,
    totalBrackets: totalBrackets ?? 0,
    submittedBrackets: submittedBrackets ?? 0,
    beehiivCount,
    recentSignups: recentSignups ?? [],
  }
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect('/')
  }

  const stats = await getStats()

  return <AdminDashboard stats={stats} />
}
