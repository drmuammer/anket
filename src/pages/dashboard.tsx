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
    hasAccess?: boolean; // Add property to track if user has access
}

interface UnitPermission {
    id: string;
    user_id: string;
    unit_id: string;
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

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            // Fetch all units
            const { data: unitsData, error: unitsError } = await supabase
                .from('units')
                .select('*')
                .order('name', { ascending: true });

            if (unitsError) throw unitsError;

            // If user is admin, they have access to all units
            if (user?.user_metadata?.role === 'admin') {
                setUnits(unitsData.map(unit => ({ ...unit, hasAccess: true })));
            } else if (user) {
                // Fetch user's unit permissions
                const { data: permissionsData, error: permissionsError } = await supabase
                    .from('unit_permissions')
                    .select('unit_id')
                    .eq('user_id', user.id);

                if (permissionsError) throw permissionsError;

                // Create a set of unit IDs the user has access to
                const accessibleUnitIds = new Set(permissionsData?.map(p => p.unit_id) || []);

                // Mark units with access flag
                const unitsWithAccess = unitsData.map(unit => ({
                    ...unit,
                    hasAccess: accessibleUnitIds.has(unit.id)
                }));

                setUnits(unitsWithAccess);
            } else {
                // No logged in user, no access to any unit
                setUnits(unitsData.map(unit => ({ ...unit, hasAccess: false })));
            }
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

    const handleUnitClick = (unitId: string, hasAccess: boolean) => {
        if (hasAccess) {
            router.push(`/surveys?unit=${unitId}`);
        } else {
            alert('Bu birime erişim izniniz bulunmamaktadır.');
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
                                    variant={unit.hasAccess ? "success" : "primary"}
                                    className="mt-auto"
                                    onClick={() => handleUnitClick(unit.id, unit.hasAccess || false)}
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
                                    variant={unit.hasAccess ? "success" : "primary"}
                                    className="mt-auto"
                                    onClick={() => handleUnitClick(unit.id, unit.hasAccess || false)}
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
                                    variant={unit.hasAccess ? "success" : "primary"}
                                    className="mt-auto"
                                    onClick={() => handleUnitClick(unit.id, unit.hasAccess || false)}
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