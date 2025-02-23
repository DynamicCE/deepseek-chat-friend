import type { AppProps } from 'next/app';
import { ApiKeyProvider } from '../contexts/ApiKeyContext';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ApiKeyProvider>
      <Component {...pageProps} />
    </ApiKeyProvider>
  );
}

export default MyApp; 