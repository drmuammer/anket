import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { Container, Alert, Card, Table, Button } from 'react-bootstrap';

interface Survey {
    id: string;
    title: string;
    description: string;
    unit_id: string;
    start_time: string;
    duration: number;
    created_at: string;
}

interface Unit {
    id: string;
    name: string;
    description: string;
}

export default function Surveys() {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [unit, setUnit] = useState<Unit | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasAccess, setHasAccess] = useState(false);
    const router = useRouter();
    const { unit: unitId } = router.query;

    useEffect(() => {
        if (unitId) {
            checkPermission();
        }
    }, [unitId]);

    const checkPermission = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError) throw userError;

            if (!user) {
                router.push('/login');
                return;
            }

            // Check if user is admin (admins have access to all units)
            if (user.user_metadata?.role === 'admin') {
                setHasAccess(true);
                await loadData();
                return;
            }

            // Check user's permissions for the unit
            const { data: permissions, error: permissionError } = await supabase
                .from('unit_permissions')
                .select('*')
                .eq('user_id', user.id)
                .eq('unit_id', unitId)
                .single();

            if (permissionError && permissionError.code !== 'PGRST116') {
                // PGRST116 is "no rows returned" error - expected if user has no permission
                throw permissionError;
            }

            if (permissions) {
                setHasAccess(true);
                await loadData();
            } else {
                setHasAccess(false);
                setLoading(false);
            }
        } catch (err) {
            console.error('İzin kontrolü hatası:', err);
            setError('İzin kontrolü sırasında bir hata oluştu');
            setLoading(false);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);

            // Load unit details
            const { data: unitData, error: unitError } = await supabase
                .from('units')
                .select('*')
                .eq('id', unitId)
                .single();

            if (unitError) throw unitError;
            setUnit(unitData);

            // Load surveys for this unit
            const { data: surveyData, error: surveyError } = await supabase
                .from('surveys')
                .select('*')
                .eq('unit_id', unitId)
                .order('created_at', { ascending: false });

            if (surveyError) throw surveyError;
            setSurveys(surveyData || []);
        } catch (err) {
            console.error('Veri yüklenirken hata:', err);
            setError('Veri yüklenirken bir hata oluştu: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
        } finally {
            setLoading(false);
        }
    };

    const handleTakeSurvey = (surveyId: string) => {
        router.push(`/survey/${surveyId}`);
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

    if (!hasAccess) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">
                    Bu birime erişim izniniz bulunmamaktadır.
                    Lütfen yöneticinizle iletişime geçiniz.
                </Alert>
                <Button
                    variant="secondary"
                    onClick={() => router.push('/')}
                    className="mt-3"
                >
                    Ana Sayfaya Dön
                </Button>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    {unit?.name} - Anketler
                    <small className="d-block text-muted fs-6">{unit?.description}</small>
                </h2>
                <Button
                    variant="secondary"
                    onClick={() => router.push('/')}
                >
                    Geri
                </Button>
            </div>

            {surveys.length === 0 ? (
                <Alert variant="info">
                    Bu birimde henüz anket oluşturulmamış.
                </Alert>
            ) : (
                <div>
                    {surveys.map((survey) => (
                        <Card key={survey.id} className="mb-3">
                            <Card.Body>
                                <Card.Title>{survey.title}</Card.Title>
                                <Card.Text>{survey.description}</Card.Text>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <small className="text-muted">
                                            Başlangıç: {new Date(survey.start_time).toLocaleString('tr-TR')}
                                        </small>
                                        <br />
                                        <small className="text-muted">
                                            Süre: {survey.duration} dakika
                                        </small>
                                    </div>
                                    <Button
                                        variant="success"
                                        onClick={() => handleTakeSurvey(survey.id)}
                                    >
                                        Ankete Katıl
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    ))}
                </div>
            )}
        </Container>
    );
} 