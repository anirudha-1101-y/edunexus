import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import { RoleProvider } from '../context/RoleContext';
import { ToastProvider } from '../context/ToastContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <RoleProvider>
        <ToastProvider>
          <Component {...pageProps} />
        </ToastProvider>
      </RoleProvider>
    </AuthProvider>
  );
}
