import { redirect } from 'next/navigation';

export default function MobileEpaperIndexPage() {
  // Redirect to a default edition or show edition selector
  redirect('/epaper/archive');
}

export const metadata = {
  title: 'Mobile Epaper',
  description: 'Mobile optimized epaper viewer',
};