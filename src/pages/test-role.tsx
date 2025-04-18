import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { Container, Button, Alert } from 'react-bootstrap';

export default function TestRole() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        checkRole();
    }, []);

    const checkRole = async () => {
        try {
            setLoading(true);
            setError(null);

            // Mevcut kullanıcının bilgilerini al
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            if (!user) {
                router.push('/login');
                return;
            }

            // Kullanıcının rolünü kontrol et
            setRole(user.user_metadata?.role || 'user');
        } catch (err) {
            console.error('Rol kontrolü hatası:', err);
            setError('Rol kontrolü sırasında bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleGetAdminRole = async () => {
        try {
            setLoading(true);
            setError(null);

            // Mevcut kullanıcının bilgilerini al
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            if (!user) {
                router.push('/login');
                return;
            }

            // Kullanıcıya admin rolü ata
            const { error: updateError } = await supabase.auth.updateUser({
                data: { role: 'admin' }
            });

            if (updateError) throw updateError;

            // Rolü güncelle
            setRole('admin');
        } catch (err) {
            console.error('Admin rolü atama hatası:', err);
            setError('Admin rolü atanırken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Container className="mt-4">
                <Alert variant="info">Yükleniyor...</Alert>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <h2>Rol Test Sayfası</h2>
            <p>Mevcut Rolünüz: <strong>{role}</strong></p>

            {role !== 'admin' && (
                <Button
                    variant="primary"
                    onClick={handleGetAdminRole}
                    disabled={loading}
                >
                    Admin Rolü Al
                </Button>
            )}

            {role === 'admin' && (
                <Alert variant="success">
                    Tebrikler! Admin rolüne sahipsiniz. Şimdi kullanıcı yönetimi sayfasına gidebilirsiniz.
                </Alert>
            )}
        </Container>
    );
} 