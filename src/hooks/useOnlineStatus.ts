import { useState, useEffect } from "react";

export interface OnlineStatusState {
  isOnline: boolean;
  wasOffline: boolean;
}

export const useOnlineStatus = () => {
  const [state, setState] = useState<OnlineStatusState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
  });

  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({
        isOnline: true,
        wasOffline: !prev.isOnline ? true : prev.wasOffline,
      }));
    };

    const handleOffline = () => {
      setState(prev => ({
        ...prev,
        isOnline: false,
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const clearWasOffline = () => {
    setState(prev => ({ ...prev, wasOffline: false }));
  };

  return {
    ...state,
    clearWasOffline,
  };
};
