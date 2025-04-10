declare module 'netlify-identity-widget' {
    interface User {
        id: string;
        email: string;
        user_metadata: {
            full_name: string;
        };
        app_metadata: {
            provider: string;
        };
    }

    interface InitOptions {
        APIUrl?: string;
    }

    interface LoginOptions {
        email: string;
        password: string;
    }

    interface SignupOptions {
        email: string;
        password: string;
    }

    const netlifyIdentity: {
        init: (options?: InitOptions) => void;
        open: () => void;
        close: () => void;
        logout: () => Promise<void>;
        currentUser: () => User | null;
        login: (provider: string, options: LoginOptions) => Promise<User>;
        signup: (options: SignupOptions) => Promise<User>;
        on: (event: string, callback: (user: User | null) => void) => void;
        off: (event: string, callback: (user: User | null) => void) => void;
    };

    export default netlifyIdentity;
} 