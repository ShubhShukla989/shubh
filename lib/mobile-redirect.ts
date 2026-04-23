import { headers } from 'next/headers';

export function isMobileDevice(): boolean {
  const headersList = headers();
  const userAgent = headersList.get('user-agent') || '';
  
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(userAgent);
}

export function getMobileEpaperUrl(editionId: string, page?: number): string {
  const baseUrl = `/epaper/mobile/${editionId}`;
  return page ? `${baseUrl}?page=${page}` : baseUrl;
}

export function getDesktopEpaperUrl(editionId: string, page?: number): string {
  const baseUrl = `/epaper/view/${editionId}`;
  return page ? `${baseUrl}?page=${page}` : baseUrl;
}