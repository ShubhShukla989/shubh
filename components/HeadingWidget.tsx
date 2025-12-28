import React from 'react';

interface HeadingWidgetProps {
  title?: string;
  subtitle?: string;
  className?: string;
  config?: any;
}

const HeadingWidget: React.FC<HeadingWidgetProps> = ({ 
  title, 
  subtitle,
  className = "",
  config = {}
}) => {
  // Simple version for testing
  const displayTitle = config.title || title || 'Test Heading';
  const displaySubtitle = config.subtitle || subtitle || 'Breaking News';
  
  return (
    <div className={`mb-6 ${config.cssClasses || className}`}>
      {/* Debug info */}
      <div style={{ fontSize: '10px', color: 'gray', marginBottom: '5px' }}>
        HeadingWidget Working - Config: {JSON.stringify(config)}
      </div>
      
      {/* Main heading - bold */}
      <h2 style={{ 
        fontSize: '1.5rem', 
        fontWeight: 'bold', 
        color: '#111827', 
        marginBottom: '0.5rem',
        lineHeight: '1.2'
      }}>
        {displayTitle}
      </h2>
      
      {/* Subtitle with underline and line */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        width: '100%'
      }}>
        <span style={{
          fontWeight: 'bold',
          color: '#dc2626',
          textDecoration: 'underline',
          textDecorationColor: '#dc2626',
          textDecorationThickness: '2px',
          textUnderlineOffset: '3px',
          whiteSpace: 'nowrap',
          marginRight: '8px'
        }}>
          {displaySubtitle}
        </span>
        <div style={{
          flex: '1',
          height: '1px',
          backgroundColor: '#000000',
          minWidth: '20px'
        }}></div>
      </div>
    </div>
  );
};

export default HeadingWidget;