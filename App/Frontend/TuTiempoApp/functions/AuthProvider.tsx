import { useContext, createContext, type PropsWithChildren } from "react";
import { router } from "expo-router";

import {
  iniciarSesion_API,
  verificarToken_API,
} from "@/hooks/useAPIManager";
import { useStorageState } from "@/hooks/useStorageState";

const AuthContext = createContext<{
  iniciarSesion: (data: { usuario: string; contrasena: string }) => void;
  verificarTokenUsuario: (token: string) => void;

  session?: string | null;
  isLoading: boolean;
}>({
  iniciarSesion: async () => null,
  verificarTokenUsuario: async () => null,

  session: null,
  isLoading: false,
});

// This hook can be used to access the user info.
export function useSession() {
  const value = useContext(AuthContext);
  if (process.env.NODE_ENV !== "production") {
    if (!value) {
      throw new Error("useSession must be wrapped in a <SessionProvider />");
    }
  }

  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession, isLoading] =
    useStorageState("session");

  const CryptoJS = require("crypto-js");

  return (
    <AuthContext.Provider
      value={{
        // =============== MÉTODOS DE USUARIOS ===============

        iniciarSesion: async (input: { usuario: string; contrasena: string }) => {
          input.contrasena = CryptoJS.SHA256(input.contrasena).toString();

          const respuesta = await iniciarSesion_API(
            input.usuario,
            input.contrasena
          );

          if (respuesta && respuesta.status == 200) {
            await setSession(respuesta.data);
            router.replace('/admin/testing')
          }
        },

        verificarTokenUsuario: async (token: string) => {
          const respuesta = await verificarToken_API(token);
          if (respuesta && respuesta.status == 200) {
            await setSession(respuesta.data);
            router.replace('/admin/testing')
          } else {
            await setSession(null);
            router.replace('/admin/login')
          }
        },

        session,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
