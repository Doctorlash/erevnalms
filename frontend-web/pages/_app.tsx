import type { AppProps } from "next/app";

// @ts-ignore: allow side-effect import of CSS without type declarations
import "../styles/globals.css";

import { AuthProvider } from "../contexts/AuthContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}
