'use client';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'image' | 'card' | 'button' | 'avatar';
  lines?: number;
  width?: string;
  height?: string;
}

export function SkeletonLoader({ 
  className = '', 
  variant = 'text', 
  lines = 1,
  width = '100%',
  height = 'auto'
}: SkeletonLoaderProps) {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';
  
  const variants = {
    text: 'h-4 bg-gray-200',
    image: 'bg-gray-200 rounded-lg',
    card: 'bg-gray-200 rounded-lg p-4',
    button: 'h-10 bg-gray-200 rounded-md',
    avatar: 'w-10 h-10 bg-gray-200 rounded-full'
  };
  
  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i}
            className={`${baseClasses} ${variants.text}`}
            style={{ 
              width: i === lines - 1 ? '75%' : width,
              height: '16px'
            }}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div 
      className={`${baseClasses} ${variants[variant]} ${className}`}
      style={{ width, height }}
    />
  );
}

// Specific skeleton components for common use cases
export function PageSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <SkeletonLoader variant="text" width="60%" height="24px" />
      <SkeletonLoader variant="image" height="200px" />
      <SkeletonLoader variant="text" lines={3} />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <SkeletonLoader variant="text" width="80%" height="20px" />
      <SkeletonLoader variant="image" height="150px" />
      <SkeletonLoader variant="text" lines={2} />
      <SkeletonLoader variant="button" width="120px" />
    </div>
  );
}

export function NavigationSkeleton() {
  return (
    <div className="flex space-x-4 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonLoader key={i} variant="button" width="80px" />
      ))}
    </div>
  );
}