import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";

export function useStorageState(key: string) {
  const [state, setState] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await SecureStore.getItemAsync(key);
        if (token) 
          setState(token);
        else 
          setState(null);
      } catch (e) {
        console.error("Error reading storage:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [key]);

  const setValue = async (value: string | null) => {
    try {
      if (value === null) {
        await SecureStore.deleteItemAsync(key);
        setState(null);
      } else {
        await SecureStore.setItemAsync(key, value);
        setState(value);
      }
    } catch (error) {
      console.error("Error saving to SecureStore:", error);
    }
  };

  return [state, setValue, isLoading] as const;
}
