import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { initAuth } from '@/services/auth';
import NavigationBar from '@/components/Navbar';

export default function App({ Component, pageProps }: AppProps) {
    useEffect(() => {
        initAuth();
    }, []);

    return (
        <>
            <NavigationBar />
            <Component {...pageProps} />
        </>
    );
} 