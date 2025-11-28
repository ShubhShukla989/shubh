'use client';

import { useParams } from 'next/navigation';

interface EpaperSocialSharingWidgetProps {
  config: {
    title?: string;
    format?: 'format-1' | 'format-2' | 'format-3';
    size?: number;
    cssClasses?: string;
    style?: string;
  };
}

export function EpaperSocialSharingWidget({ config }: EpaperSocialSharingWidgetProps) {
  const params = useParams();
  const editionId = (params?.editionId || params?.id) as string;
  
  // Get current page URL
  const shareUrl = typeof window !== 'undefined' 
    ? window.location.href 
    : '';

  const format = config.format || 'format-1';
  const size = config.size || 20;

  const handleShare = async (platform: string) => {
    const text = 'Check out this article from Do Boje Dopahar';
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(text);

    let url = '';

    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodedText}&body=${encodedUrl}`;
        break;
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  // Format 1: Icon buttons with background
  if (format === 'format-1') {
    return (
      <div className={config.cssClasses || ''} style={parseInlineStyle(config.style)}>
        {config.title && (
          <h3 className="text-lg font-semibold mb-3">{config.title}</h3>
        )}
        
        <div className="flex gap-2">
          <button
            onClick={() => handleShare('facebook')}
            className="flex items-center justify-center p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            title="Share on Facebook"
            style={{ width: `${size * 2}px`, height: `${size * 2}px` }}
          >
            <svg 
              className="text-white" 
              fill="currentColor" 
              viewBox="0 0 24 24"
              style={{ width: `${size}px`, height: `${size}px` }}
            >
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </button>

          <button
            onClick={() => handleShare('twitter')}
            className="flex items-center justify-center p-3 bg-sky-500 hover:bg-sky-600 rounded-lg transition-colors"
            title="Share on Twitter"
            style={{ width: `${size * 2}px`, height: `${size * 2}px` }}
          >
            <svg 
              className="text-white" 
              fill="currentColor" 
              viewBox="0 0 24 24"
              style={{ width: `${size}px`, height: `${size}px` }}
            >
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
          </button>

          <button
            onClick={() => handleShare('whatsapp')}
            className="flex items-center justify-center p-3 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
            title="Share on WhatsApp"
            style={{ width: `${size * 2}px`, height: `${size * 2}px` }}
          >
            <svg 
              className="text-white" 
              fill="currentColor" 
              viewBox="0 0 24 24"
              style={{ width: `${size}px`, height: `${size}px` }}
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </button>

          <button
            onClick={() => handleShare('email')}
            className="flex items-center justify-center p-3 bg-pink-500 hover:bg-pink-600 rounded-lg transition-colors"
            title="Share via Email"
            style={{ width: `${size * 2}px`, height: `${size * 2}px` }}
          >
            <svg 
              className="text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ width: `${size}px`, height: `${size}px` }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Format 2: Circular buttons
  if (format === 'format-2') {
    return (
      <div className={config.cssClasses || ''} style={parseInlineStyle(config.style)}>
        {config.title && (
          <h3 className="text-lg font-semibold mb-3">{config.title}</h3>
        )}
        
        <div className="flex gap-2">
          <button
            onClick={() => handleShare('facebook')}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
            title="Share on Facebook"
            style={{ width: `${size * 2}px`, height: `${size * 2}px` }}
          >
            <svg 
              className="text-white" 
              fill="currentColor" 
              viewBox="0 0 24 24"
              style={{ width: `${size}px`, height: `${size}px` }}
            >
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </button>

          <button
            onClick={() => handleShare('twitter')}
            className="flex items-center justify-center bg-sky-500 hover:bg-sky-600 rounded-full transition-colors"
            title="Share on Twitter"
            style={{ width: `${size * 2}px`, height: `${size * 2}px` }}
          >
            <svg 
              className="text-white" 
              fill="currentColor" 
              viewBox="0 0 24 24"
              style={{ width: `${size}px`, height: `${size}px` }}
            >
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
          </button>

          <button
            onClick={() => handleShare('whatsapp')}
            className="flex items-center justify-center bg-green-500 hover:bg-green-600 rounded-full transition-colors"
            title="Share on WhatsApp"
            style={{ width: `${size * 2}px`, height: `${size * 2}px` }}
          >
            <svg 
              className="text-white" 
              fill="currentColor" 
              viewBox="0 0 24 24"
              style={{ width: `${size}px`, height: `${size}px` }}
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </button>

          <button
            onClick={() => handleShare('email')}
            className="flex items-center justify-center bg-pink-500 hover:bg-pink-600 rounded-full transition-colors"
            title="Share via Email"
            style={{ width: `${size * 2}px`, height: `${size * 2}px` }}
          >
            <svg 
              className="text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ width: `${size}px`, height: `${size}px` }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Format 3: Text + Icon buttons
  return (
    <div className={config.cssClasses || ''} style={parseInlineStyle(config.style)}>
      {config.title && (
        <h3 className="text-lg font-semibold mb-3">{config.title}</h3>
      )}
      
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleShare('facebook')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          title="Share on Facebook"
        >
          <svg 
            className="text-white" 
            fill="currentColor" 
            viewBox="0 0 24 24"
            style={{ width: `${size}px`, height: `${size}px` }}
          >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span>Facebook</span>
        </button>

        <button
          onClick={() => handleShare('twitter')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors"
          title="Share on Twitter"
        >
          <svg 
            className="text-white" 
            fill="currentColor" 
            viewBox="0 0 24 24"
            style={{ width: `${size}px`, height: `${size}px` }}
          >
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>
          <span>Twitter</span>
        </button>

        <button
          onClick={() => handleShare('whatsapp')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          title="Share on WhatsApp"
        >
          <svg 
            className="text-white" 
            fill="currentColor" 
            viewBox="0 0 24 24"
            style={{ width: `${size}px`, height: `${size}px` }}
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          <span>WhatsApp</span>
        </button>

        <button
          onClick={() => handleShare('email')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors"
          title="Share via Email"
        >
          <svg 
            className="text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ width: `${size}px`, height: `${size}px` }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span>Email</span>
        </button>
      </div>
    </div>
  );
}

function parseInlineStyle(styleString?: string): React.CSSProperties {
  if (!styleString) return {};
  
  try {
    const styles: any = {};
    styleString.split(';').forEach(rule => {
      const [property, value] = rule.split(':').map(s => s.trim());
      if (property && value) {
        const camelProperty = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        styles[camelProperty] = value;
      }
    });
    return styles;
  } catch {
    return {};
  }
}
