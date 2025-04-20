import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { Container, Form, Button, Alert, Table } from 'react-bootstrap';

interface User {
    id: string;
    email: string;
    role: string;
}

interface Unit {
    id: string;
    name: string;
    description: string;
}

interface UnitPermission {
    id: string;
    user_id: string;
    unit_id: string;
    created_at: string;
}

export default function UnitPermissions() {
    const [users, setUsers] = useState<User[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [permissions, setPermissions] = useState<UnitPermission[]>([]);
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [selectedUnit, setSelectedUnit] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        checkAdmin();
    }, []);

    const checkAdmin = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || user.user_metadata?.role !== 'admin') {
                router.push('/');
                return;
            }
            loadData();
        } catch (err) {
            console.error('Yetki kontrolü hatası:', err);
            setError('Yetki kontrolü sırasında bir hata oluştu');
            setLoading(false);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch users
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, email, role');

            if (userError) throw userError;
            setUsers(userData || []);

            // Fetch units
            const { data: unitData, error: unitError } = await supabase
                .from('units')
                .select('id, name, description');

            if (unitError) throw unitError;
            setUnits(unitData || []);

            // Fetch permissions
            const { data: permissionData, error: permissionError } = await supabase
                .from('unit_permissions')
                .select('*');

            if (permissionError) throw permissionError;
            setPermissions(permissionData || []);
        } catch (err) {
            console.error('Veri yüklenirken hata:', err);
            setError('Veri yüklenirken bir hata oluştu: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
        } finally {
            setLoading(false);
        }
    };

    const handleAddPermission = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedUser || !selectedUnit) {
            setError('Lütfen kullanıcı ve birim seçin');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            // Check if permission already exists
            const existingPermission = permissions.find(
                p => p.user_id === selectedUser && p.unit_id === selectedUnit
            );

            if (existingPermission) {
                setError('Bu kullanıcı için bu birim izni zaten tanımlanmış');
                return;
            }

            // Add permission
            const { data, error } = await supabase
                .from('unit_permissions')
                .insert([{ user_id: selectedUser, unit_id: selectedUnit }]);

            if (error) throw error;

            setSuccess('Birim izni başarıyla eklendi');
            loadData();
            setSelectedUser('');
            setSelectedUnit('');
        } catch (err) {
            console.error('İzin eklenirken hata:', err);
            setError('İzin eklenirken bir hata oluştu: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
        } finally {
            setLoading(false);
        }
    };

    const handleRemovePermission = async (permissionId: string) => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            const { error } = await supabase
                .from('unit_permissions')
                .delete()
                .eq('id', permissionId);

            if (error) throw error;

            setSuccess('Birim izni başarıyla kaldırıldı');
            loadData();
        } catch (err) {
            console.error('İzin kaldırılırken hata:', err);
            setError('İzin kaldırılırken bir hata oluştu: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
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

    return (
        <Container className="mt-4">
            <h2 className="mb-4">Birim İzinleri Yönetimi</h2>

            {success && (
                <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
                    {success}
                </Alert>
            )}

            <h4 className="mb-3">Yeni İzin Ekle</h4>
            <Form onSubmit={handleAddPermission} className="mb-4">
                <Form.Group className="mb-3">
                    <Form.Label>Kullanıcı</Form.Label>
                    <Form.Select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        required
                    >
                        <option value="">Kullanıcı Seçin</option>
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.email} ({user.role})
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Birim</Form.Label>
                    <Form.Select
                        value={selectedUnit}
                        onChange={(e) => setSelectedUnit(e.target.value)}
                        required
                    >
                        <option value="">Birim Seçin</option>
                        {units.map((unit) => (
                            <option key={unit.id} value={unit.id}>
                                {unit.name} - {unit.description}
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>

                <Button type="submit" variant="primary" disabled={loading}>
                    İzin Ekle
                </Button>
            </Form>

            <h4 className="mb-3">Mevcut İzinler</h4>
            {permissions.length === 0 ? (
                <Alert variant="info">
                    Henüz tanımlanmış birim izni bulunmamaktadır.
                </Alert>
            ) : (
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Kullanıcı</th>
                            <th>Birim</th>
                            <th>Oluşturulma Tarihi</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {permissions.map((permission) => {
                            const user = users.find(u => u.id === permission.user_id);
                            const unit = units.find(u => u.id === permission.unit_id);

                            return (
                                <tr key={permission.id}>
                                    <td>{user ? user.email : 'Bilinmeyen Kullanıcı'}</td>
                                    <td>{unit ? `${unit.name} - ${unit.description}` : 'Bilinmeyen Birim'}</td>
                                    <td>{new Date(permission.created_at).toLocaleString('tr-TR')}</td>
                                    <td>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleRemovePermission(permission.id)}
                                            disabled={loading}
                                        >
                                            İzni Kaldır
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            )}
        </Container>
    );
} 