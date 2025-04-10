import netlifyIdentity from 'netlify-identity-widget';

export const initAuth = () => {
    if (typeof window !== 'undefined') {
        netlifyIdentity.init({
            APIUrl: process.env.NEXT_PUBLIC_NETLIFY_IDENTITY_URL,
        });
    }
};

export const login = async (email: string, password: string) => {
    try {
        const user = await netlifyIdentity.login('login', {
            email,
            password,
        });
        return user;
    } catch (error) {
        throw error;
    }
};

export const register = async (email: string, password: string) => {
    try {
        const user = await netlifyIdentity.signup({
            email,
            password,
        });
        return user;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
};

export const logout = async () => {
    try {
        await netlifyIdentity.logout();
    } catch (error) {
        throw error;
    }
};

export const getCurrentUser = () => {
    return netlifyIdentity.currentUser();
};

export const isAuthenticated = () => {
    return !!netlifyIdentity.currentUser();
}; 