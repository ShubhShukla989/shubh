import React from 'react';
import { Eye, Edit, Trash2, Upload, Plus, Minus } from 'lucide-react';

interface ActionButtonProps {
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
  disabled?: boolean;
  className?: string;
}

// View Icon - Darker Blue
export const ViewIcon: React.FC<ActionButtonProps> = ({ onClick, title = 'View', disabled, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[32px] min-h-[32px] flex items-center justify-center ${className}`}
  >
    <Eye className="w-4 h-4 lg:w-5 lg:h-5" />
  </button>
);

// Edit Icon - Darker Teal/Green
export const EditIcon: React.FC<ActionButtonProps> = ({ onClick, title = 'Edit', disabled, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[32px] min-h-[32px] flex items-center justify-center ${className}`}
  >
    <Edit className="w-4 h-4 lg:w-5 lg:h-5" />
  </button>
);

// Delete Icon - Darker Pink/Red
export const DeleteIcon: React.FC<ActionButtonProps> = ({ onClick, title = 'Delete', disabled, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[32px] min-h-[32px] flex items-center justify-center ${className}`}
  >
    <Trash2 className="w-4 h-4 lg:w-5 lg:h-5" />
  </button>
);

// Upload Icon - Darker Blue
export const UploadIcon: React.FC<ActionButtonProps> = ({ onClick, title = 'Upload', disabled, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[32px] min-h-[32px] flex items-center justify-center ${className}`}
  >
    <Upload className="w-4 h-4 lg:w-5 lg:h-5" />
  </button>
);

// Add/Plus Icon - Light White/Gray
export const AddIcon: React.FC<ActionButtonProps> = ({ onClick, title = 'Add', disabled, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[32px] min-h-[32px] flex items-center justify-center ${className}`}
  >
    <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
  </button>
);

// Remove/Minus Icon - Darker Yellow
export const RemoveIcon: React.FC<ActionButtonProps> = ({ onClick, title = 'Remove', disabled, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[32px] min-h-[32px] flex items-center justify-center ${className}`}
  >
    <Minus className="w-4 h-4 lg:w-5 lg:h-5" />
  </button>
);

// Action Group Container
interface ActionGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const ActionGroup: React.FC<ActionGroupProps> = ({ children, className = '' }) => (
  <div className={`flex items-center gap-1 lg:gap-2 ${className}`}>
    {children}
  </div>
);

// Upload Button with Text (Large version)
interface UploadButtonProps extends ActionButtonProps {
  text?: string;
}

export const UploadButton: React.FC<UploadButtonProps> = ({ 
  onClick, 
  title = 'Upload Pages', 
  text = 'Upload Pages',
  disabled, 
  className = '' 
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`px-6 py-3 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 font-medium text-lg ${className}`}
  >
    <Upload className="w-6 h-6" />
    {text}
  </button>
);

// Export all as default object for easy importing
const ActionIcons = {
  View: ViewIcon,
  Edit: EditIcon,
  Delete: DeleteIcon,
  Upload: UploadIcon,
  Add: AddIcon,
  Remove: RemoveIcon,
  Group: ActionGroup,
  UploadButton: UploadButton,
};

export default ActionIcons;
