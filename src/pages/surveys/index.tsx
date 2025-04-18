import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { Container, Table, Alert, Button } from 'react-bootstrap';

interface Survey {
    id: string;
    title: string;
    description: string;
    created_at: string;
}

export default function UnitSurveys() {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [unitName, setUnitName] = useState<string>('');
    const router = useRouter();
    const { unit } = router.query;

    useEffect(() => {
        if (unit) {
            loadSurveys();
            loadUnitName();
        }
    }, [unit]);

    const loadUnitName = async () => {
        try {
            const { data, error } = await supabase
                .from('units')
                .select('name')
                .eq('id', unit)
                .single();

            if (error) throw error;
            setUnitName(data.name);
        } catch (err) {
            console.error('Birim adı yüklenirken hata:', err);
        }
    };

    const loadSurveys = async () => {
        try {
            setLoading(true);
            setError(null);

            // Kullanıcının birime erişim yetkisini kontrol et
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: permission } = await supabase
                .from('unit_permissions')
                .select('*')
                .eq('user_id', user.id)
                .eq('unit_id', unit)
                .single();

            if (!permission && user.user_metadata?.role !== 'admin') {
                throw new Error('Bu birime erişim yetkiniz yok');
            }

            // Birime ait anketleri al
            const { data, error } = await supabase
                .from('surveys')
                .select('*')
                .eq('unit_id', unit)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSurveys(data || []);
        } catch (err) {
            console.error('Anketler yüklenirken hata:', err);
            setError('Anketler yüklenirken bir hata oluştu: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
        } finally {
            setLoading(false);
        }
    };

    const handleViewSurvey = (surveyId: string) => {
        router.push(`/surveys/${surveyId}`);
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
            <h2>{unitName} Anketleri</h2>

            {surveys.length === 0 ? (
                <Alert variant="info">
                    Bu birim için henüz anket oluşturulmamış.
                </Alert>
            ) : (
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Başlık</th>
                            <th>Açıklama</th>
                            <th>Oluşturulma Tarihi</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {surveys.map((survey) => (
                            <tr key={survey.id}>
                                <td>{survey.title}</td>
                                <td>{survey.description}</td>
                                <td>{new Date(survey.created_at).toLocaleString('tr-TR')}</td>
                                <td>
                                    <Button
                                        variant="info"
                                        size="sm"
                                        onClick={() => handleViewSurvey(survey.id)}
                                    >
                                        Görüntüle
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Container>
    );
} 