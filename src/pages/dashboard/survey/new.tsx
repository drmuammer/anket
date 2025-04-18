import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useRouter } from 'next/router';
import { supabase, TABLES, isAdmin } from '@/lib/supabase';

export default function NewSurvey() {
    const [baslik, setBaslik] = useState('');
    const [aciklama, setAciklama] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isUserAdmin, setIsUserAdmin] = useState<boolean | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Sayfa yüklendiğinde oturum ve yetki kontrolü
        const checkSessionAndRole = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error || !session) {
                router.push('/auth/login');
                return;
            }

            // Kullanıcının admin olup olmadığını kontrol et
            const adminCheck = await isAdmin(session.user.id);
            setIsUserAdmin(adminCheck);

            if (!adminCheck) {
                setError('Bu sayfaya erişim yetkiniz bulunmamaktadır.');
                router.push('/dashboard');
            }
        };

        checkSessionAndRole();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Oturum durumunu tekrar kontrol et
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) throw sessionError;
            if (!session?.user) throw new Error('Oturum bulunamadı. Lütfen tekrar giriş yapın.');

            // Admin yetkisini tekrar kontrol et
            const adminCheck = await isAdmin(session.user.id);
            if (!adminCheck) {
                throw new Error('Bu işlem için yetkiniz bulunmamaktadır.');
            }

            console.log('Kullanıcı ID:', session.user.id);
            console.log('Anket verileri:', { baslik, aciklama, user_id: session.user.id });

            // Anketi oluştur
            const { data, error: insertError } = await supabase
                .from(TABLES.SURVEYS)
                .insert([
                    {
                        baslik,
                        aciklama,
                        user_id: session.user.id,
                    },
                ])
                .select()
                .single();

            if (insertError) {
                console.error('Anket oluşturma hatası:', insertError);
                throw new Error(`Anket oluşturma hatası: ${insertError.message}`);
            }

            if (!data) {
                throw new Error('Anket oluşturuldu ancak veri dönmedi.');
            }

            console.log('Oluşturulan anket:', data);

            // Başarılı oluşturma sonrası anket detay sayfasına yönlendir
            router.push(`/dashboard/survey/${data.id}`);
        } catch (err) {
            console.error('Hata detayı:', err);
            setError(err instanceof Error ? err.message : 'Anket oluşturulurken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    if (isUserAdmin === null) {
        return (
            <Container className="mt-5">
                <Alert variant="info">Yükleniyor...</Alert>
            </Container>
        );
    }

    if (!isUserAdmin) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">
                    Bu sayfaya erişim yetkiniz bulunmamaktadır.
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="mt-5">
            <Card>
                <Card.Body>
                    <Card.Title>Yeni Anket Oluştur</Card.Title>
                    {error && (
                        <Alert variant="danger" className="mt-3">
                            {error}
                        </Alert>
                    )}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Anket Başlığı</Form.Label>
                            <Form.Control
                                type="text"
                                value={baslik}
                                onChange={(e) => setBaslik(e.target.value)}
                                required
                                disabled={loading}
                                placeholder="Anket başlığını girin"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Açıklama</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={aciklama}
                                onChange={(e) => setAciklama(e.target.value)}
                                required
                                disabled={loading}
                                placeholder="Anket açıklamasını girin"
                            />
                        </Form.Group>
                        <Button
                            variant="primary"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Oluşturuluyor...' : 'Anketi Oluştur'}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
} 