'use client';

interface DeviceVisibilitySelectorProps {
  value?: 'both' | 'mobile-only' | 'desktop-only';
  onChange: (value: 'both' | 'mobile-only' | 'desktop-only') => void;
}

export function DeviceVisibilitySelector({ 
  value = 'both', 
  onChange 
}: DeviceVisibilitySelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Device Visibility
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as 'both' | 'mobile-only' | 'desktop-only')}
        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="both">📱💻 Both Mobile & Desktop</option>
        <option value="mobile-only">📱 Mobile Only</option>
        <option value="desktop-only">💻 Desktop Only</option>
      </select>
      <p className="text-xs text-gray-500 mt-1">
        Control which devices this widget appears on
      </p>
    </div>
  );
}