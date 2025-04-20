import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';

export default function NavigationBar() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuth();

        // Subscribe to auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    setIsLoggedIn(true);
                    if (session?.user?.user_metadata?.role === 'admin') {
                        setIsAdmin(true);
                    } else {
                        setIsAdmin(false);
                    }
                } else if (event === 'SIGNED_OUT') {
                    setIsLoggedIn(false);
                    setIsAdmin(false);
                }
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const checkAuth = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setIsLoggedIn(true);
                if (user.user_metadata?.role === 'admin') {
                    setIsAdmin(true);
                }
            } else {
                setIsLoggedIn(false);
                setIsAdmin(false);
            }
        } catch (error) {
            console.error('Auth check error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            router.push('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
            <Container>
                <Link href="/" passHref legacyBehavior>
                    <Navbar.Brand>Deprem Tatbikatı</Navbar.Brand>
                </Link>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Link href="/" passHref legacyBehavior>
                            <Nav.Link>Ana Sayfa</Nav.Link>
                        </Link>

                        {isAdmin && (
                            <NavDropdown title="Yönetim" id="admin-dropdown">
                                <Link href="/admin/surveys" passHref legacyBehavior>
                                    <NavDropdown.Item>Anket Yönetimi</NavDropdown.Item>
                                </Link>
                                <Link href="/admin/surveys/create" passHref legacyBehavior>
                                    <NavDropdown.Item>Anket Oluştur</NavDropdown.Item>
                                </Link>
                                <Link href="/admin/results" passHref legacyBehavior>
                                    <NavDropdown.Item>Anket Sonuçları</NavDropdown.Item>
                                </Link>
                                <Link href="/admin/users" passHref legacyBehavior>
                                    <NavDropdown.Item>Kullanıcı Yönetimi</NavDropdown.Item>
                                </Link>
                                <Link href="/admin/unit-permissions" passHref legacyBehavior>
                                    <NavDropdown.Item>Birim İzinleri</NavDropdown.Item>
                                </Link>
                            </NavDropdown>
                        )}
                    </Nav>
                    <Nav>
                        {!loading && (
                            <>
                                {isLoggedIn ? (
                                    <Nav.Link onClick={handleLogout}>Çıkış Yap</Nav.Link>
                                ) : (
                                    <>
                                        <Link href="/login" passHref legacyBehavior>
                                            <Nav.Link>Giriş</Nav.Link>
                                        </Link>
                                        <Link href="/register" passHref legacyBehavior>
                                            <Nav.Link>Kayıt Ol</Nav.Link>
                                        </Link>
                                    </>
                                )}
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
} 