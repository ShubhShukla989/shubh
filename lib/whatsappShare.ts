/**
 * WhatsApp share helper
 * - Desktop: opens web.whatsapp.com
 * - Mobile: shows a minimal picker — WhatsApp or WhatsApp Business
 *   If only one is installed, OS handles it naturally (no picker needed from our side,
 *   but we can't detect installs from browser, so we show the picker only on mobile)
 */

function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

function showMobilePicker(text: string): void {
  const existing = document.getElementById('__wa_picker__');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = '__wa_picker__';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:99999;
    background:rgba(0,0,0,0.5);
    display:flex;align-items:flex-end;justify-content:center;
  `;

  overlay.innerHTML = `
    <div style="
      background:#fff;
      border-radius:16px 16px 0 0;
      padding:20px 16px 32px;
      width:100%;
      max-width:480px;
    ">
      <p style="margin:0 0 16px;font-size:15px;font-weight:600;text-align:center;color:#111;">
        Share via WhatsApp
      </p>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button id="__wa_normal__" style="
          width:100%;padding:14px;border:none;border-radius:12px;
          background:#25d366;color:#fff;font-size:15px;font-weight:600;
          cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;
        ">
          <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.89 3.488"/></svg>
          WhatsApp
        </button>

        <button id="__wa_cancel__" style="
          width:100%;padding:12px;border:none;border-radius:12px;
          background:#f3f4f6;color:#555;font-size:14px;cursor:pointer;
        ">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  const encoded = encodeURIComponent(text);

  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  document.getElementById('__wa_normal__')!.addEventListener('click', () => {
    window.location.href = `whatsapp://send?text=${encoded}`;
    close();
  });

  document.getElementById('__wa_cancel__')!.addEventListener('click', close);
}

export function shareOnWhatsApp(text: string): void {
  if (!isMobile()) {
    // Desktop: open WhatsApp Web
    window.open(
      `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener,noreferrer'
    );
    return;
  }

  // Mobile: show picker for WhatsApp / WhatsApp Business
  showMobilePicker(text);
}
