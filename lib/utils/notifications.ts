/**
 * Production-ready notification system
 * Replaces alert() calls with proper toast notifications
 */

export interface NotificationOptions {
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

class NotificationManager {
  private notifications: Map<string, HTMLElement> = new Map();
  private container: HTMLElement | null = null;

  private createContainer() {
    if (this.container) return this.container;
    
    this.container = document.createElement('div');
    this.container.id = 'notification-container';
    this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
    document.body.appendChild(this.container);
    
    return this.container;
  }

  private createNotification(message: string, options: NotificationOptions = {}) {
    const { type = 'info', duration = 5000 } = options;
    
    const notification = document.createElement('div');
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    notification.id = id;
    
    const baseClasses = 'max-w-sm p-4 rounded-lg shadow-lg border transform transition-all duration-300 ease-in-out';
    const typeClasses = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800'
    };
    
    notification.className = `${baseClasses} ${typeClasses[type]}`;
    
    const icon = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    }[type];
    
    notification.innerHTML = `
      <div class="flex items-start">
        <span class="text-lg mr-3">${icon}</span>
        <div class="flex-1">
          <p class="text-sm font-medium">${message}</p>
        </div>
        <button class="ml-3 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
          <span class="sr-only">Close</span>
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    `;
    
    return { notification, id, duration };
  }

  show(message: string, options: NotificationOptions = {}) {
    const container = this.createContainer();
    const { notification, id, duration } = this.createNotification(message, options);
    
    // Add to container
    container.appendChild(notification);
    this.notifications.set(id, notification);
    
    // Animate in
    requestAnimationFrame(() => {
      notification.style.transform = 'translateX(0)';
      notification.style.opacity = '1';
    });
    
    // Auto remove
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
    
    return id;
  }

  remove(id: string) {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.style.transform = 'translateX(100%)';
      notification.style.opacity = '0';
      
      setTimeout(() => {
        notification.remove();
        this.notifications.delete(id);
      }, 300);
    }
  }

  success(message: string, duration = 4000) {
    return this.show(message, { type: 'success', duration });
  }

  error(message: string, duration = 6000) {
    return this.show(message, { type: 'error', duration });
  }

  warning(message: string, duration = 5000) {
    return this.show(message, { type: 'warning', duration });
  }

  info(message: string, duration = 4000) {
    return this.show(message, { type: 'info', duration });
  }
}

// Global instance
export const notify = new NotificationManager();

// Convenience functions
export const showSuccess = (message: string) => notify.success(message);
export const showError = (message: string) => notify.error(message);
export const showWarning = (message: string) => notify.warning(message);
export const showInfo = (message: string) => notify.info(message);