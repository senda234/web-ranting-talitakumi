import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useNetworkStore = defineStore('network', () => {
  const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const showReconnectedBanner = ref(false);

  if (typeof window !== 'undefined') {
    window.addEventListener('offline', () => {
      isOnline.value = false;
      showReconnectedBanner.value = false;
    });

    window.addEventListener('online', () => {
      isOnline.value = true;
      showReconnectedBanner.value = true;
      setTimeout(() => {
        showReconnectedBanner.value = false;
      }, 3500);
    });
  }

  return {
    isOnline,
    showReconnectedBanner,
  };
});

