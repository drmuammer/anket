import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { Container, Form, Button, Alert, Card, Row, Col } from 'react-bootstrap';
import { FaPlus, FaTrash } from 'react-icons/fa';

interface Unit {
    id: string;
    name: string;
    description: string;
}

interface Question {
    id: string;
    text: string;
    type: 'text' | 'radio' | 'checkbox' | 'select';
    options?: string[];
    required: boolean;
}

export default function CreateSurvey() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [unitId, setUnitId] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        checkAdmin();
        loadUnits();
    }, []);

    const checkAdmin = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.user_metadata?.role !== 'admin') {
            router.push('/');
            return;
        }
    };

    const loadUnits = async () => {
        try {
            const { data, error } = await supabase
                .from('units')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setUnits(data);
        } catch (err) {
            console.error('Birimler yüklenirken hata:', err);
            setError('Birimler yüklenirken bir hata oluştu');
        }
    };

    const addQuestion = () => {
        const newQuestion: Question = {
            id: Math.random().toString(36).substr(2, 9),
            text: '',
            type: 'text',
            required: false
        };
        setQuestions([...questions, newQuestion]);
    };

    const removeQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const updateQuestion = (id: string, field: keyof Question, value: any) => {
        setQuestions(questions.map(q => {
            if (q.id === id) {
                if (field === 'type' && value !== 'text') {
                    return { ...q, [field]: value, options: q.options || [''] };
                }
                return { ...q, [field]: value };
            }
            return q;
        }));
    };

    const addOption = (questionId: string) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                return { ...q, options: [...(q.options || []), ''] };
            }
            return q;
        }));
    };

    const updateOption = (questionId: string, optionIndex: number, value: string) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId && q.options) {
                const newOptions = [...q.options];
                newOptions[optionIndex] = value;
                return { ...q, options: newOptions };
            }
            return q;
        }));
    };

    const removeOption = (questionId: string, optionIndex: number) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId && q.options) {
                const newOptions = q.options.filter((_, index) => index !== optionIndex);
                return { ...q, options: newOptions };
            }
            return q;
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Kullanıcı oturumu bulunamadı');

            // Basic validation
            if (!title.trim()) throw new Error('Anket başlığı gerekli');
            if (!unitId) throw new Error('Birim seçimi gerekli');
            if (questions.length === 0) throw new Error('En az bir soru eklemelisiniz');

            // Create survey with minimal data first
            const { data, error: insertError } = await supabase
                .from('surveys')
                .insert({
                    title: title.trim(),
                    description: description.trim(),
                    unit_id: unitId,
                    questions: questions,
                    created_by: user.id
                })
                .select()
                .single();

            if (insertError) {
                console.error('Insert error:', insertError);
                throw new Error('Anket oluşturulamadı: ' + insertError.message);
            }

            if (!data) {
                throw new Error('Anket oluşturuldu ancak veri döndürülemedi');
            }

            router.push('/surveys');
        } catch (err) {
            console.error('Anket oluşturma hatası:', err);
            setError(err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="mt-4">
            <h2 className="mb-4">Yeni Anket Oluştur</h2>

            {error && (
                <Alert variant="danger" className="mb-4">
                    {error}
                </Alert>
            )}

            <Form onSubmit={handleSubmit}>
                <Card className="mb-4">
                    <Card.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Anket Başlığı</Form.Label>
                            <Form.Control
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Açıklama</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Birim</Form.Label>
                            <Form.Select
                                value={unitId}
                                onChange={(e) => setUnitId(e.target.value)}
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
                    </Card.Body>
                </Card>

                <h3 className="mb-3">Sorular</h3>

                {questions.map((question, index) => (
                    <Card key={question.id} className="mb-3">
                        <Card.Body>
                            <Row className="align-items-end">
                                <Col md={8}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Soru {index + 1}</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={question.text}
                                            onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Soru Tipi</Form.Label>
                                        <Form.Select
                                            value={question.type}
                                            onChange={(e) => updateQuestion(question.id, 'type', e.target.value)}
                                        >
                                            <option value="text">Metin</option>
                                            <option value="radio">Tek Seçim</option>
                                            <option value="checkbox">Çoklu Seçim</option>
                                            <option value="select">Açılır Liste</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={1}>
                                    <Button
                                        variant="danger"
                                        onClick={() => removeQuestion(question.id)}
                                        className="mb-3"
                                    >
                                        <FaTrash />
                                    </Button>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="checkbox"
                                    label="Zorunlu soru"
                                    checked={question.required}
                                    onChange={(e) => updateQuestion(question.id, 'required', e.target.checked)}
                                />
                            </Form.Group>

                            {question.type !== 'text' && (
                                <div className="mt-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <Form.Label>Seçenekler</Form.Label>
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => addOption(question.id)}
                                        >
                                            <FaPlus /> Seçenek Ekle
                                        </Button>
                                    </div>
                                    {question.options?.map((option, optionIndex) => (
                                        <Row key={optionIndex} className="mb-2">
                                            <Col md={11}>
                                                <Form.Control
                                                    type="text"
                                                    value={option}
                                                    onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                                                    placeholder={`Seçenek ${optionIndex + 1}`}
                                                    required
                                                />
                                            </Col>
                                            <Col md={1}>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => removeOption(question.id, optionIndex)}
                                                    disabled={question.options?.length === 2}
                                                >
                                                    <FaTrash />
                                                </Button>
                                            </Col>
                                        </Row>
                                    ))}
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                ))}

                <div className="mb-4">
                    <Button variant="outline-primary" onClick={addQuestion}>
                        <FaPlus /> Soru Ekle
                    </Button>
                </div>

                <div className="d-flex justify-content-between">
                    <Button variant="secondary" onClick={() => router.back()}>
                        İptal
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? 'Oluşturuluyor...' : 'Anketi Oluştur'}
                    </Button>
                </div>
            </Form>
        </Container>
    );
} 