/**
 * Production-ready confirmation dialog system
 * Replaces confirm() calls with proper modal dialogs
 */

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

class ConfirmDialogManager {
  private activeDialog: HTMLElement | null = null;

  private createDialog(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      // Remove existing dialog
      if (this.activeDialog) {
        this.activeDialog.remove();
      }

      const {
        title = 'Confirm Action',
        message,
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        type = 'warning'
      } = options;

      // Create overlay
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
      
      // Create dialog
      const dialog = document.createElement('div');
      dialog.className = 'bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all duration-200 scale-95 opacity-0';
      
      const typeColors = {
        danger: 'text-red-600',
        warning: 'text-yellow-600',
        info: 'text-blue-600'
      };

      const typeIcons = {
        danger: '⚠️',
        warning: '⚠️',
        info: 'ℹ️'
      };

      const confirmColors = {
        danger: 'bg-red-600 hover:bg-red-700',
        warning: 'bg-yellow-600 hover:bg-yellow-700',
        info: 'bg-blue-600 hover:bg-blue-700'
      };

      dialog.innerHTML = `
        <div class="p-6">
          <div class="flex items-center mb-4">
            <span class="text-2xl mr-3">${typeIcons[type]}</span>
            <h3 class="text-lg font-semibold ${typeColors[type]}">${title}</h3>
          </div>
          <p class="text-gray-700 mb-6">${message}</p>
          <div class="flex justify-end space-x-3">
            <button id="cancel-btn" class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors">
              ${cancelText}
            </button>
            <button id="confirm-btn" class="px-4 py-2 ${confirmColors[type]} text-white rounded transition-colors">
              ${confirmText}
            </button>
          </div>
        </div>
      `;

      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      this.activeDialog = overlay;

      // Animate in
      requestAnimationFrame(() => {
        dialog.style.transform = 'scale(1)';
        dialog.style.opacity = '1';
      });

      // Event handlers
      const cleanup = (result: boolean) => {
        dialog.style.transform = 'scale(0.95)';
        dialog.style.opacity = '0';
        
        setTimeout(() => {
          overlay.remove();
          this.activeDialog = null;
          resolve(result);
        }, 200);
      };

      // Button handlers
      dialog.querySelector('#confirm-btn')?.addEventListener('click', () => cleanup(true));
      dialog.querySelector('#cancel-btn')?.addEventListener('click', () => cleanup(false));
      
      // Overlay click to cancel
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) cleanup(false);
      });

      // Escape key to cancel
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          document.removeEventListener('keydown', handleEscape);
          cleanup(false);
        }
      };
      document.addEventListener('keydown', handleEscape);
    });
  }

  async confirm(message: string, title?: string): Promise<boolean> {
    return this.createDialog({ message, title });
  }

  async confirmDelete(itemName: string = 'this item'): Promise<boolean> {
    return this.createDialog({
      title: 'Delete Confirmation',
      message: `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
  }

  async confirmAction(action: string, description?: string): Promise<boolean> {
    return this.createDialog({
      title: `Confirm ${action}`,
      message: description || `Are you sure you want to ${action.toLowerCase()}?`,
      confirmText: action,
      cancelText: 'Cancel',
      type: 'warning'
    });
  }
}

// Global instance
export const confirmDialog = new ConfirmDialogManager();

// Convenience functions
export const confirm = (message: string, title?: string) => confirmDialog.confirm(message, title);
export const confirmDelete = (itemName?: string) => confirmDialog.confirmDelete(itemName);
export const confirmAction = (action: string, description?: string) => confirmDialog.confirmAction(action, description);