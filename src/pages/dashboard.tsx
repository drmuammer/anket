import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { FaBuilding, FaHospital, FaMapMarkerAlt } from 'react-icons/fa';

interface Unit {
    id: string;
    name: string;
    description: string;
    icon: string;
}

export default function Dashboard() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        loadUnits();
    }, []);

    const loadUnits = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('units')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setUnits(data);
        } catch (err) {
            console.error('Birimler yüklenirken hata:', err);
            setError('Birimler yüklenirken bir hata oluştu: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'hospital':
                return <FaHospital size={24} />;
            case 'map':
                return <FaMapMarkerAlt size={24} />;
            default:
                return <FaBuilding size={24} />;
        }
    };

    const handleUnitClick = (unitId: string) => {
        router.push(`/surveys?unit=${unitId}`);
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

    // Birimleri kategorilere ayır
    const aileHekimleri = units.filter(unit => unit.name === 'Aile Hekimi Birimi');
    const ilceBirimleri = units.filter(unit => unit.name === 'İlçe Koordinasyon Birimi');
    const alanBirimleri = units.filter(unit => unit.name === 'Alan Birimi');

    return (
        <Container className="mt-4">
            <h2 className="mb-4">Birimler</h2>

            {/* Aile Hekimi Birimleri */}
            <h4 className="mb-3">Aile Hekimi Birimleri</h4>
            <Row className="mb-4">
                {aileHekimleri.map((unit) => (
                    <Col key={unit.id} xs={12} sm={6} md={4} lg={3} className="mb-3">
                        <Card className="h-100">
                            <Card.Body className="d-flex flex-column align-items-center">
                                <div className="mb-2">{getIcon(unit.icon)}</div>
                                <Card.Title className="text-center">{unit.name}</Card.Title>
                                <Card.Text className="text-center">{unit.description}</Card.Text>
                                <Button
                                    variant="primary"
                                    className="mt-auto"
                                    onClick={() => handleUnitClick(unit.id)}
                                >
                                    Anketleri Görüntüle
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* İlçe Koordinasyon Birimleri */}
            <h4 className="mb-3">İlçe Koordinasyon Birimleri</h4>
            <Row className="mb-4">
                {ilceBirimleri.map((unit) => (
                    <Col key={unit.id} xs={12} sm={6} md={4} lg={3} className="mb-3">
                        <Card className="h-100">
                            <Card.Body className="d-flex flex-column align-items-center">
                                <div className="mb-2">{getIcon(unit.icon)}</div>
                                <Card.Title className="text-center">{unit.name}</Card.Title>
                                <Card.Text className="text-center">{unit.description}</Card.Text>
                                <Button
                                    variant="primary"
                                    className="mt-auto"
                                    onClick={() => handleUnitClick(unit.id)}
                                >
                                    Anketleri Görüntüle
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Alan Koordinasyon Birimleri */}
            <h4 className="mb-3">Alan Koordinasyon Birimleri</h4>
            <Row className="mb-4">
                {alanBirimleri.map((unit) => (
                    <Col key={unit.id} xs={12} sm={6} md={4} lg={3} className="mb-3">
                        <Card className="h-100">
                            <Card.Body className="d-flex flex-column align-items-center">
                                <div className="mb-2">{getIcon(unit.icon)}</div>
                                <Card.Title className="text-center">{unit.name}</Card.Title>
                                <Card.Text className="text-center">{unit.description}</Card.Text>
                                <Button
                                    variant="primary"
                                    className="mt-auto"
                                    onClick={() => handleUnitClick(unit.id)}
                                >
                                    Anketleri Görüntüle
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Container>
    );
} 