import type { AppProps } from 'next/app';
import { ApiKeyProvider } from '../contexts/ApiKeyContext';
import { ProviderProvider } from '../contexts/ProviderContext';
import { Toaster } from '@/components/ui/toaster';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ProviderProvider>
      <ApiKeyProvider>
        <Component {...pageProps} />
        <Toaster />
      </ApiKeyProvider>
    </ProviderProvider>
  );
}

export default MyApp; 