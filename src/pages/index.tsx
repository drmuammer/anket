import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import { useRouter } from 'next/router';
import { login, signup, initAuth } from '@/services/auth';

export default function Home() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        initAuth();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password);
            }
            router.push('/dashboard');
        } catch (error) {
            console.error('Authentication error:', error);
            setError('Kimlik doğrulama hatası. Lütfen tekrar deneyin.');
        }
    };

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={6}>
                    <Card>
                        <Card.Body>
                            <Card.Title className="text-center mb-4">
                                {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
                            </Card.Title>
                            {error && (
                                <Alert variant="danger" className="mb-3">
                                    {error}
                                </Alert>
                            )}
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>E-posta</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Şifre</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                                <Button variant="primary" type="submit" className="w-100 mb-3">
                                    {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
                                </Button>
                                <Button
                                    variant="link"
                                    className="w-100"
                                    onClick={() => setIsLogin(!isLogin)}
                                >
                                    {isLogin
                                        ? 'Hesabınız yok mu? Kayıt olun'
                                        : 'Zaten hesabınız var mı? Giriş yapın'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
} 