'use client';

import MediaBrowser from '@/components/page-manager/MediaBrowser';

interface MediaBrowserModalProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

export function MediaBrowserModal({ onSelect, onClose }: MediaBrowserModalProps) {
  return (
    <MediaBrowser
      isOpen={true}
      onClose={onClose}
      onSelect={onSelect}
      accept="image/*"
    />
  );
}
