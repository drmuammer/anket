import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export const initAuth = () => {
    // Auth state listener
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
            console.log('User signed in:', session?.user.email);
        } else if (event === 'SIGNED_OUT') {
            console.log('User signed out');
        }
    });
};

export const login = async (email: string, password: string) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data.user;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

export const register = async (email: string, password: string) => {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role: 'katilimci', // Default role
                },
            },
        });
        if (error) throw error;
        return data.user;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
};

export const logout = async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    } catch (error) {
        console.error('Logout error:', error);
        throw error;
    }
};

export const getCurrentUser = async (): Promise<User | null> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    } catch (error) {
        console.error('Get current user error:', error);
        return null;
    }
};

export const isAuthenticated = async (): Promise<boolean> => {
    const user = await getCurrentUser();
    return !!user;
}; 