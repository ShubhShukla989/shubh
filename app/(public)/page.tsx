import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';

async function getLatestEdition() {
  if (!supabaseAdmin) return null;

  try {
    const { data } = await supabaseAdmin
      .from('editions')
      .select('id, title, date, status')
      .eq('status', 'Published')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    return data;
  } catch (error) {
    console.error('Error fetching latest edition:', error);
    return null;
  }
}

export default async function HomePage() {
  const latestEdition = await getLatestEdition();
  
  // Redirect to latest edition viewer
  if (latestEdition) {
    redirect(`/epaper/view/${latestEdition.id}`);
  }
  
  // If no edition, redirect to epaper home
  redirect('/epaper');

  // This will never render because of the redirects above
  return null;
}
