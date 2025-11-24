import { redirect } from 'next/navigation';

interface PageProps {
  params: {
    alias: string;
  };
}

// Redirect old /page/[alias] to new /epaper/page/[alias]
export default function OldPageRedirect({ params }: PageProps) {
  redirect(`/epaper/page/${params.alias}`);
}
