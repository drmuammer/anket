import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { initAuth } from '@/services/auth';

export default function App({ Component, pageProps }: AppProps) {
    useEffect(() => {
        initAuth();
    }, []);

    return <Component {...pageProps} />;
} 