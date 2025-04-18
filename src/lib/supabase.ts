import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL ve Anon Key tanımlanmamış!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
});

// Veritabanı tablo tipleri
export type Survey = {
    id: string;
    baslik: string;
    aciklama: string;
    created_at: string;
    user_id: string;
};

export type Question = {
    id: string;
    anket_id: string;
    soru: string;
    tip: 'text' | 'radio' | 'checkbox';
    secenekler?: string[];
    sira: number;
};

export type UserRole = {
    user_id: string;
    role: 'admin' | 'user';
};

// Veritabanı tablo isimleri
export const TABLES = {
    SURVEYS: 'anketler',
    QUESTIONS: 'sorular',
    USER_ROLES: 'user_roles',
} as const;

// Kullanıcı rollerini kontrol etme fonksiyonu
export const isAdmin = async (userId: string): Promise<boolean> => {
    try {
        console.log('Kontrol edilen kullanıcı ID:', userId);

        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
            console.error('Kullanıcı bilgisi alınamadı:', error);
            return false;
        }

        console.log('Kullanıcı rolü:', user?.user_metadata.role);
        return user?.user_metadata.role === 'admin';
    } catch (error) {
        console.error('Rol kontrolü hatası:', error);
        return false;
    }
};

// Kullanıcı rolünü güncelleme fonksiyonu
export const updateUserRole = async (userId: string, role: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('user_roles')
            .upsert({
                user_id: userId,
                role: role
            });

        if (error) {
            console.error('Rol güncelleme hatası:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Rol güncelleme hatası:', error);
        return false;
    }
};

// Test fonksiyonu
export const checkUserRole = async () => {
    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) {
            console.error('Kullanıcı bilgisi alınamadı:', userError);
            return;
        }

        if (!user) {
            console.log('Oturum açık kullanıcı bulunamadı');
            return;
        }

        console.log('Kullanıcı ID:', user.id);

        const { data: role, error: roleError } = await supabase
            .from(TABLES.USER_ROLES)
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (roleError) {
            console.error('Rol bilgisi alınamadı:', roleError);
            return;
        }

        console.log('Kullanıcı Rolü:', role?.role || 'Rol atanmamış');
    } catch (error) {
        console.error('Test fonksiyonu hatası:', error);
    }
};

// RLS politikaları için yardımcı fonksiyonlar
export const enableRLS = async () => {
    try {
        // Anketler tablosu için RLS politikaları
        await supabase.rpc('enable_rls', { table_name: TABLES.SURVEYS });

        // Sorular tablosu için RLS politikaları
        await supabase.rpc('enable_rls', { table_name: TABLES.QUESTIONS });
    } catch (error) {
        console.error('RLS politikaları etkinleştirilirken hata:', error);
    }
}; 