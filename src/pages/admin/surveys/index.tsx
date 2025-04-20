import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { Container, Alert, Table, Button, Form, Modal } from 'react-bootstrap';
import { FaEdit, FaTrash, FaSearch, FaPlus } from 'react-icons/fa';

interface Survey {
    id: string;
    title: string;
    description: string;
    unit_id: string;
    start_time: string;
    duration: number;
    created_at: string;
    created_by: string;
    unit?: {
        name: string;
        description: string;
    };
}

export default function SurveyManagement() {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [filteredSurveys, setFilteredSurveys] = useState<Survey[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [surveyToDelete, setSurveyToDelete] = useState<Survey | null>(null);
    const router = useRouter();

    useEffect(() => {
        checkAdmin();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredSurveys(surveys);
        } else {
            const lowercaseSearch = searchTerm.toLowerCase();
            setFilteredSurveys(surveys.filter(survey =>
                survey.title.toLowerCase().includes(lowercaseSearch) ||
                survey.description.toLowerCase().includes(lowercaseSearch) ||
                survey.unit?.name.toLowerCase().includes(lowercaseSearch)
            ));
        }
    }, [searchTerm, surveys]);

    const checkAdmin = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || user.user_metadata?.role !== 'admin') {
                router.push('/');
                return;
            }
            loadSurveys();
        } catch (err) {
            console.error('Yetki kontrolü hatası:', err);
            setError('Yetki kontrolü sırasında bir hata oluştu');
            setLoading(false);
        }
    };

    const loadSurveys = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('surveys')
                .select('*, unit:unit_id(name, description)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSurveys(data || []);
            setFilteredSurveys(data || []);
        } catch (err) {
            console.error('Anketler yüklenirken hata:', err);
            setError('Anketler yüklenirken bir hata oluştu: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSurvey = () => {
        router.push('/admin/surveys/create');
    };

    const handleEditSurvey = (id: string) => {
        router.push(`/admin/surveys/edit/${id}`);
    };

    const handleViewResults = (id: string) => {
        router.push(`/admin/results/${id}`);
    };

    const openDeleteModal = (survey: Survey) => {
        setSurveyToDelete(survey);
        setShowDeleteModal(true);
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setSurveyToDelete(null);
    };

    const handleDeleteSurvey = async () => {
        if (!surveyToDelete) return;

        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            // First delete all responses to this survey
            const { error: responsesError } = await supabase
                .from('survey_responses')
                .delete()
                .eq('survey_id', surveyToDelete.id);

            if (responsesError) throw responsesError;

            // Then delete the survey itself
            const { error: surveyError } = await supabase
                .from('surveys')
                .delete()
                .eq('id', surveyToDelete.id);

            if (surveyError) throw surveyError;

            setSuccess(`"${surveyToDelete.title}" anketi başarıyla silindi.`);
            closeDeleteModal();
            loadSurveys();
        } catch (err) {
            console.error('Anket silinirken hata:', err);
            setError('Anket silinirken bir hata oluştu: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
        } finally {
            setLoading(false);
        }
    };

    if (loading && surveys.length === 0) {
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
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Anket Yönetimi</h2>
                <Button variant="primary" onClick={handleCreateSurvey}>
                    <FaPlus className="me-2" /> Yeni Anket Oluştur
                </Button>
            </div>

            {success && (
                <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
                    {success}
                </Alert>
            )}

            <Form className="mb-4">
                <Form.Group controlId="searchSurveys">
                    <Form.Label>Anket Ara</Form.Label>
                    <div className="d-flex">
                        <div className="input-group">
                            <span className="input-group-text">
                                <FaSearch />
                            </span>
                            <Form.Control
                                type="text"
                                placeholder="Anket adı, açıklama veya birim adı ile ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </Form.Group>
            </Form>

            {filteredSurveys.length === 0 ? (
                <Alert variant="info">
                    {searchTerm ? 'Arama kriterlerine uygun anket bulunamadı.' : 'Henüz oluşturulmuş anket bulunmamaktadır.'}
                </Alert>
            ) : (
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>Anket Adı</th>
                            <th>Açıklama</th>
                            <th>Birim</th>
                            <th>Başlangıç Zamanı</th>
                            <th>Süre (dk)</th>
                            <th>Oluşturulma Tarihi</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSurveys.map((survey) => (
                            <tr key={survey.id}>
                                <td>{survey.title}</td>
                                <td>{survey.description}</td>
                                <td>{survey.unit?.name}</td>
                                <td>{new Date(survey.start_time).toLocaleString('tr-TR')}</td>
                                <td>{survey.duration}</td>
                                <td>{new Date(survey.created_at).toLocaleString('tr-TR')}</td>
                                <td>
                                    <div className="d-flex gap-2">
                                        <Button
                                            variant="warning"
                                            size="sm"
                                            onClick={() => handleEditSurvey(survey.id)}
                                            disabled={loading}
                                        >
                                            <FaEdit /> Düzenle
                                        </Button>
                                        <Button
                                            variant="info"
                                            size="sm"
                                            onClick={() => handleViewResults(survey.id)}
                                            disabled={loading}
                                        >
                                            Sonuçlar
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => openDeleteModal(survey)}
                                            disabled={loading}
                                        >
                                            <FaTrash /> Sil
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

            {/* Delete Confirmation Modal */}
            <Modal show={showDeleteModal} onHide={closeDeleteModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Anket Silme Onayı</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        <strong>"{surveyToDelete?.title}"</strong> anketini silmek istediğinize emin misiniz?
                    </p>
                    <p className="text-danger">
                        <strong>Dikkat:</strong> Bu işlem geri alınamaz ve ankete ait tüm yanıtlar da silinecektir!
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeDeleteModal}>
                        İptal
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleDeleteSurvey}
                        disabled={loading}
                    >
                        {loading ? 'Siliniyor...' : 'Evet, Sil'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
} 