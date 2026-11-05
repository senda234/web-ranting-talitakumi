import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number | null;
  actionLabel?: string;
  action?: () => void;
  createdAt: number;
}

export const useNotificationStore = defineStore('notifications', () => {
  const toasts = ref<ToastMessage[]>([]);

  function getDefaultDuration(type: ToastType, hasAction: boolean): number | null {
    if (hasAction) return 8000;
    // Bertahan 1 detik (1000ms) sesuai permintaan
    return 1000;
  }

  function addToast(toast: Omit<ToastMessage, 'id' | 'createdAt'>) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const duration =
      toast.duration !== undefined
        ? toast.duration
        : getDefaultDuration(toast.type, Boolean(toast.actionLabel));

    const newToast: ToastMessage = {
      ...toast,
      id,
      duration,
      createdAt: Date.now(),
    };

    // Rekomendasi spesifikasi: terbaru di atas, maksimal 3 terlihat
    toasts.value.unshift(newToast);
    if (toasts.value.length > 3) {
      toasts.value.pop();
    }

    return id;
  }

  function removeToast(id: string) {
    const idx = toasts.value.findIndex((t) => t.id === id);
    if (idx !== -1) {
      toasts.value.splice(idx, 1);
    }
  }

  function success(title: string, description?: string, actionLabel?: string, action?: () => void) {
    return addToast({ type: 'success', title, description, actionLabel, action });
  }

  function error(title: string, description?: string, actionLabel?: string, action?: () => void) {
    return addToast({ type: 'error', title, description, actionLabel, action });
  }

  function warning(title: string, description?: string, actionLabel?: string, action?: () => void) {
    return addToast({ type: 'warning', title, description, actionLabel, action });
  }

  function info(title: string, description?: string, actionLabel?: string, action?: () => void) {
    return addToast({ type: 'info', title, description, actionLabel, action });
  }

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
});

