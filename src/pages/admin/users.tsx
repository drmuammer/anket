import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { Container, Table, Button, Alert, Form, InputGroup } from 'react-bootstrap';
import { FaSearch, FaUserPlus, FaUserEdit, FaTrash } from 'react-icons/fa';

interface User {
    id: string;
    email: string;
    role: string;
    created_at: string;
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError(null);

            // Mevcut kullanıcının bilgilerini al
            const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            if (!currentUser) throw new Error('Kullanıcı oturumu bulunamadı');

            // Kullanıcının admin olup olmadığını kontrol et
            if (currentUser.user_metadata?.role !== 'admin') {
                throw new Error('Bu sayfaya erişim yetkiniz yok');
            }

            // Örnek kullanıcı listesi (gerçek uygulamada bu veriler veritabanından gelecek)
            const sampleUsers: User[] = [
                {
                    id: currentUser.id,
                    email: currentUser.email || 'Kullanıcı',
                    role: currentUser.user_metadata?.role || 'user',
                    created_at: new Date().toISOString()
                }
            ];

            setUsers(sampleUsers);
        } catch (err) {
            console.error('Kullanıcılar yüklenirken hata:', err);
            setError('Kullanıcılar yüklenirken bir hata oluştu: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            setLoading(true);
            setError(null);

            // Kullanıcının rolünü güncelle
            const { error: updateError } = await supabase.auth.updateUser({
                data: { role: newRole }
            });

            if (updateError) throw updateError;

            // Kullanıcı listesini yenile
            await loadUsers();
        } catch (err) {
            console.error('Rol değiştirme hatası:', err);
            setError('Rol değiştirirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            setLoading(true);
            setError(null);

            // Kullanıcıyı çıkış yaptır
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) throw signOutError;

            // Kullanıcı listesini yenile
            await loadUsers();
        } catch (err) {
            console.error('Kullanıcı silme hatası:', err);
            setError('Kullanıcı silinirken bir hata oluştu');
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

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Container className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Kullanıcı Yönetimi</h2>
                <Button variant="primary" onClick={() => router.push('/admin/users/new')}>
                    <FaUserPlus className="me-2" />
                    Yeni Kullanıcı
                </Button>
            </div>

            <Form className="mb-4">
                <InputGroup>
                    <InputGroup.Text>
                        <FaSearch />
                    </InputGroup.Text>
                    <Form.Control
                        type="text"
                        placeholder="E-posta ile ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </InputGroup>
            </Form>

            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>E-posta</th>
                        <th>Rol</th>
                        <th>Kayıt Tarihi</th>
                        <th>İşlemler</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredUsers.map(user => (
                        <tr key={user.id}>
                            <td>{user.email}</td>
                            <td>
                                <Form.Select
                                    value={user.role}
                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                    disabled={loading}
                                >
                                    <option value="user">Kullanıcı</option>
                                    <option value="admin">Admin</option>
                                </Form.Select>
                            </td>
                            <td>{user.created_at}</td>
                            <td>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleDeleteUser(user.id)}
                                    disabled={loading}
                                >
                                    <FaTrash /> Sil
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Container>
    );
} 