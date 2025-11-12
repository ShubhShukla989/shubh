import React from 'react';
import { Eye, Edit, Trash2, Upload, Plus, Minus } from 'lucide-react';

interface ActionButtonProps {
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
  disabled?: boolean;
  className?: string;
}

// View Icon - Dark Gray (#374151)
export const ViewIcon: React.FC<ActionButtonProps> = ({ onClick, title = 'View', disabled, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    <Eye className="w-5 h-5" />
  </button>
);

// Edit Icon - Teal/Green (#14B8A6)
export const EditIcon: React.FC<ActionButtonProps> = ({ onClick, title = 'Edit', disabled, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    <Edit className="w-5 h-5" />
  </button>
);

// Delete Icon - Pink/Red (#F43F5E)
export const DeleteIcon: React.FC<ActionButtonProps> = ({ onClick, title = 'Delete', disabled, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    <Trash2 className="w-5 h-5" />
  </button>
);

// Upload Icon - Blue (#6366F1)
export const UploadIcon: React.FC<ActionButtonProps> = ({ onClick, title = 'Upload', disabled, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    <Upload className="w-5 h-5" />
  </button>
);

// Add/Plus Icon - Black
export const AddIcon: React.FC<ActionButtonProps> = ({ onClick, title = 'Add', disabled, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 bg-black text-white rounded hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    <Plus className="w-5 h-5" />
  </button>
);

// Remove/Minus Icon - Yellow (#FBBF24)
export const RemoveIcon: React.FC<ActionButtonProps> = ({ onClick, title = 'Remove', disabled, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 bg-yellow-400 text-white rounded hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    <Minus className="w-5 h-5" />
  </button>
);

// Action Group Container
interface ActionGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const ActionGroup: React.FC<ActionGroupProps> = ({ children, className = '' }) => (
  <div className={`flex items-center gap-2 ${className}`}>
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
