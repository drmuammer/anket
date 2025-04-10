import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import netlifyIdentity from 'netlify-identity-widget';

export default function App({ Component, pageProps }: AppProps) {
    useEffect(() => {
        netlifyIdentity.init({
            APIUrl: process.env.NEXT_PUBLIC_NETLIFY_IDENTITY_URL,
        });
    }, []);

    return <Component {...pageProps} />;
} 