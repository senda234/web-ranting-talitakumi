import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useLoadingStore = defineStore('loading', () => {
  // Default true agar langsung tampil saat pertama kali masuk web
  const isLoading = ref(true);
  let activeRequests = 0;
  let timer: any = null;

  function show() {
    activeRequests++;
    isLoading.value = true;
  }

  function hide(delayMs = 250) {
    activeRequests = Math.max(0, activeRequests - 1);
    if (activeRequests === 0) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (activeRequests === 0) {
          isLoading.value = false;
        }
      }, delayMs);
    }
  }

  function forceHide() {
    activeRequests = 0;
    if (timer) clearTimeout(timer);
    isLoading.value = false;
  }

  return {
    isLoading,
    show,
    hide,
    forceHide,
  };
});

