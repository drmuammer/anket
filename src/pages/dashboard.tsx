import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useRouter } from 'next/router';
import { getCurrentUser, isAuthenticated } from '@/services/auth';

type UserRole = 'admin' | 'anketor' | 'katilimci';

interface User {
    id: string;
    email: string;
    role: UserRole;
}

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            if (!isAuthenticated()) {
                router.push('/');
                return;
            }

            const currentUser = getCurrentUser();
            if (currentUser) {
                // TODO: Get user role from Netlify Identity metadata
                setUser({
                    id: currentUser.id,
                    email: currentUser.email || '',
                    role: 'katilimci' // Default role
                });
            }
            setLoading(false);
        };

        checkAuth();
    }, [router]);

    if (loading) {
        return (
            <Container className="mt-5">
                <Row className="justify-content-center">
                    <Col md={6}>
                        <Card>
                            <Card.Body className="text-center">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Yükleniyor...</span>
                                </div>
                                <p className="mt-3">Yükleniyor...</p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <Row>
                <Col>
                    <h1>Dashboard</h1>
                    <p>Hoş geldiniz, {user?.email}</p>
                </Col>
            </Row>

            <Row className="mt-4">
                {user?.role === 'admin' && (
                    <Col md={4}>
                        <Card>
                            <Card.Body>
                                <Card.Title>Admin Paneli</Card.Title>
                                <Card.Text>
                                    Anket yönetimi ve kullanıcı rolleri için admin paneli.
                                </Card.Text>
                                <Button variant="primary">Admin Paneline Git</Button>
                            </Card.Body>
                        </Card>
                    </Col>
                )}

                {user?.role === 'anketor' && (
                    <Col md={4}>
                        <Card>
                            <Card.Body>
                                <Card.Title>Anketör Paneli</Card.Title>
                                <Card.Text>
                                    Anket oluşturma ve yönetme paneli.
                                </Card.Text>
                                <Button variant="primary">Anketör Paneline Git</Button>
                            </Card.Body>
                        </Card>
                    </Col>
                )}

                {user?.role === 'katilimci' && (
                    <Col md={4}>
                        <Card>
                            <Card.Body>
                                <Card.Title>Anketlerim</Card.Title>
                                <Card.Text>
                                    Size atanan anketleri görüntüleyin ve cevaplayın.
                                </Card.Text>
                                <Button variant="primary">Anketlerime Git</Button>
                            </Card.Body>
                        </Card>
                    </Col>
                )}
            </Row>
        </Container>
    );
} 