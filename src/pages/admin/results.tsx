import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { Container, Alert, Card, Table, Button, ListGroup } from 'react-bootstrap';

interface Survey {
    id: string;
    title: string;
    description: string;
    unit_id: string;
}

interface Unit {
    id: string;
    name: string;
    description: string;
}

export default function AdminResults() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        checkAdmin();
    }, []);

    const checkAdmin = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.user_metadata?.role !== 'admin') {
            router.push('/');
            return;
        }
        loadUnits();
    };

    const loadUnits = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('units')
                .select('id, name, description');

            if (error) throw error;
            setUnits(data || []);
        } catch (err) {
            console.error('Birimler yüklenirken hata:', err);
            setError('Birimler yüklenirken bir hata oluştu: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
        } finally {
            setLoading(false);
        }
    };

    const loadSurveys = async (unitId: string) => {
        try {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('surveys')
                .select('id, title, description, unit_id')
                .eq('unit_id', unitId)
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

    const handleUnitClick = (unitId: string) => {
        setSelectedUnit(unitId);
        loadSurveys(unitId);
    };

    const handleViewResults = (surveyId: string) => {
        router.push(`/admin/results/${surveyId}`);
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
            <h2>Anket Sonuçları</h2>
            <div className="d-flex">
                <ListGroup className="me-4">
                    {units.map((unit) => (
                        <ListGroup.Item
                            key={unit.id}
                            action
                            active={unit.id === selectedUnit}
                            onClick={() => handleUnitClick(unit.id)}
                        >
                            {unit.name} - {unit.description}
                        </ListGroup.Item>
                    ))}
                </ListGroup>
                <div className="flex-grow-1">
                    {selectedUnit && surveys.length === 0 ? (
                        <Alert variant="info">
                            Bu birimde henüz anket oluşturulmamış.
                        </Alert>
                    ) : (
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>Başlık</th>
                                    <th>Açıklama</th>
                                    <th>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {surveys.map((survey) => (
                                    <tr key={survey.id}>
                                        <td>{survey.title}</td>
                                        <td>{survey.description}</td>
                                        <td>
                                            <Button
                                                variant="info"
                                                size="sm"
                                                onClick={() => handleViewResults(survey.id)}
                                            >
                                                Sonuçları Görüntüle
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </div>
            </div>
        </Container>
    );
}