// Remplace `virtual:pwa-register/react` (module virtuel de vite-plugin-pwa) dans Vitest.
export function useRegisterSW() {
  return {
    needRefresh: [false, () => {}] as const,
    offlineReady: [false, () => {}] as const,
    updateServiceWorker: async () => {},
  }
}
