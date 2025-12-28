// Toast notification system to replace alert() calls
export interface ToastOptions {
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

class ToastManager {
  private toasts: Array<{
    id: string;
    message: string;
    type: ToastOptions['type'];
    duration: number;
  }> = [];
  
  private listeners: Array<(toasts: typeof this.toasts) => void> = [];

  show(message: string, options: ToastOptions = {}) {
    const toast = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      type: options.type || 'info',
      duration: options.duration || 3000,
    };

    this.toasts.push(toast);
    this.notifyListeners();

    // Auto remove after duration
    setTimeout(() => {
      this.remove(toast.id);
    }, toast.duration);

    return toast.id;
  }

  remove(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notifyListeners();
  }

  subscribe(listener: (toasts: typeof this.toasts) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }
}

export const toast = new ToastManager();

// Convenience methods
export const showSuccess = (message: string, options?: ToastOptions) => 
  toast.show(message, { ...options, type: 'success' });

export const showError = (message: string, options?: ToastOptions) => 
  toast.show(message, { ...options, type: 'error' });

export const showWarning = (message: string, options?: ToastOptions) => 
  toast.show(message, { ...options, type: 'warning' });

export const showInfo = (message: string, options?: ToastOptions) => 
  toast.show(message, { ...options, type: 'info' });