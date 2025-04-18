import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Modal } from 'react-bootstrap';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

interface Survey {
    id: string;
    baslik: string;
    aciklama: string;
    created_at: string;
}

interface Question {
    id: string;
    anket_id: string;
    soru: string;
    tip: 'text' | 'radio' | 'checkbox';
    secenekler?: string[];
    sira: number;
}

export default function SurveyDetail() {
    const router = useRouter();
    const { id } = router.query;
    const [survey, setSurvey] = useState<Survey | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        if (id) {
            fetchSurvey();
            fetchQuestions();
        }
    }, [id]);

    const fetchSurvey = async () => {
        try {
            const { data, error } = await supabase
                .from('anketler')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setSurvey(data);
        } catch (err) {
            setError('Anket bilgileri yüklenirken bir hata oluştu.');
            console.error('Error fetching survey:', err);
        }
    };

    const fetchQuestions = async () => {
        try {
            const { data, error } = await supabase
                .from('sorular')
                .select('*')
                .eq('anket_id', id)
                .order('sira', { ascending: true });

            if (error) throw error;
            setQuestions(data || []);
        } catch (err) {
            setError('Sorular yüklenirken bir hata oluştu.');
            console.error('Error fetching questions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSurvey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!survey) return;

        try {
            const { error } = await supabase
                .from('anketler')
                .update({
                    baslik: survey.baslik,
                    aciklama: survey.aciklama,
                })
                .eq('id', id);

            if (error) throw error;
            setEditing(false);
        } catch (err) {
            setError('Anket güncellenirken bir hata oluştu.');
            console.error('Error updating survey:', err);
        }
    };

    const handleDeleteSurvey = async () => {
        try {
            const { error } = await supabase
                .from('anketler')
                .delete()
                .eq('id', id);

            if (error) throw error;
            router.push('/dashboard');
        } catch (err) {
            setError('Anket silinirken bir hata oluştu.');
            console.error('Error deleting survey:', err);
        }
    };

    if (loading) {
        return (
            <Container className="mt-5">
                <Alert variant="info">Yükleniyor...</Alert>
            </Container>
        );
    }

    if (!survey) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">Anket bulunamadı.</Alert>
            </Container>
        );
    }

    return (
        <Container className="mt-5">
            {error && (
                <Alert variant="danger" className="mb-3">
                    {error}
                </Alert>
            )}

            <Card className="mb-4">
                <Card.Body>
                    {editing ? (
                        <Form onSubmit={handleUpdateSurvey}>
                            <Form.Group className="mb-3">
                                <Form.Label>Anket Başlığı</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={survey.baslik}
                                    onChange={(e) =>
                                        setSurvey({ ...survey, baslik: e.target.value })
                                    }
                                    required
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Açıklama</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={survey.aciklama}
                                    onChange={(e) =>
                                        setSurvey({ ...survey, aciklama: e.target.value })
                                    }
                                    required
                                />
                            </Form.Group>
                            <Button variant="primary" type="submit" className="me-2">
                                Kaydet
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => setEditing(false)}
                            >
                                İptal
                            </Button>
                        </Form>
                    ) : (
                        <>
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <h2>{survey.baslik}</h2>
                                    <p className="text-muted">{survey.aciklama}</p>
                                </div>
                                <div>
                                    <Button
                                        variant="primary"
                                        className="me-2"
                                        onClick={() => setEditing(true)}
                                    >
                                        Düzenle
                                    </Button>
                                    <Button
                                        variant="danger"
                                        onClick={() => setShowDeleteModal(true)}
                                    >
                                        Sil
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </Card.Body>
            </Card>

            <Card>
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h3>Sorular</h3>
                        <Button variant="success">Yeni Soru Ekle</Button>
                    </div>
                    {questions.length === 0 ? (
                        <Alert variant="info">
                            Bu ankete henüz soru eklenmemiş.
                        </Alert>
                    ) : (
                        <div className="list-group">
                            {questions.map((question) => (
                                <div
                                    key={question.id}
                                    className="list-group-item list-group-item-action"
                                >
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h5 className="mb-1">{question.soru}</h5>
                                            <small className="text-muted">
                                                Tip: {question.tip}
                                            </small>
                                        </div>
                                        <div>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                className="me-2"
                                            >
                                                Düzenle
                                            </Button>
                                            <Button variant="danger" size="sm">
                                                Sil
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card.Body>
            </Card>

            <Modal
                show={showDeleteModal}
                onHide={() => setShowDeleteModal(false)}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Anketi Sil</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Bu anketi silmek istediğinizden emin misiniz? Bu işlem geri
                    alınamaz.
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowDeleteModal(false)}
                    >
                        İptal
                    </Button>
                    <Button variant="danger" onClick={handleDeleteSurvey}>
                        Sil
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
} 