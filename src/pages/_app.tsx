import { AppProps } from 'next/app';
import { useEffect } from 'react';
import { auth } from '@/services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/router';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user && router.pathname !== '/') {
                router.push('/');
            }
        });

        return () => unsubscribe();
    }, [router]);

    return <Component {...pageProps} />;
} 