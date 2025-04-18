import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { Container, Alert, Form, Button, Card, Row, Col, Table } from 'react-bootstrap';

interface Question {
    id: string;
    text: string;
    type: 'text' | 'radio' | 'checkbox' | 'select';
    options?: string[];
    required: boolean;
}

interface Survey {
    id: string;
    title: string;
    description: string;
    unit_id: string;
    questions: Question[];
}

interface SurveyResponse {
    id: string;
    survey_id: string;
    user_id: string;
    answers: Record<string, any>;
    created_at: string;
}

export default function SurveyDetail() {
    const [survey, setSurvey] = useState<Survey | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
    const [submitting, setSubmitting] = useState(false);
    const [responses, setResponses] = useState<SurveyResponse[]>([]);
    const router = useRouter();
    const { id } = router.query;

    useEffect(() => {
        if (id) {
            loadSurvey();
            loadResponses();
        }
    }, [id]);

    const loadSurvey = async () => {
        try {
            setLoading(true);
            setError(null);

            // Kullanıcının birime erişim yetkisini kontrol et
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Anketi al
            const { data, error } = await supabase
                .from('surveys')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            // Kullanıcının birime erişim yetkisini kontrol et
            const { data: permission } = await supabase
                .from('unit_permissions')
                .select('*')
                .eq('user_id', user.id)
                .eq('unit_id', data.unit_id)
                .single();

            if (!permission && user.user_metadata?.role !== 'admin') {
                throw new Error('Bu anketi görüntüleme yetkiniz yok');
            }

            setSurvey(data);
        } catch (err) {
            console.error('Anket yüklenirken hata:', err);
            setError('Anket yüklenirken bir hata oluştu: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
        } finally {
            setLoading(false);
        }
    };

    const loadResponses = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('survey_responses')
                .select('*')
                .eq('survey_id', id);

            if (error) throw error;
            setResponses(data || []);
        } catch (err) {
            console.error('Cevaplar yüklenirken hata:', err);
        }
    };

    const getQuestionStatistics = (question: Question) => {
        if (!responses.length) return null;

        const answerCounts: Record<string, number> = {};
        let totalAnswers = 0;

        responses.forEach(response => {
            const answer = response.answers[question.id];
            if (answer) {
                if (Array.isArray(answer)) { // Çoklu seçim için
                    answer.forEach(option => {
                        answerCounts[option] = (answerCounts[option] || 0) + 1;
                    });
                    totalAnswers += answer.length;
                } else { // Tekli seçim için
                    answerCounts[answer] = (answerCounts[answer] || 0) + 1;
                    totalAnswers++;
                }
            }
        });

        if (question.type === 'text') {
            return {
                type: 'text',
                answers: responses
                    .map(r => r.answers[question.id])
                    .filter(Boolean)
            };
        }

        return {
            type: question.type,
            answerCounts,
            totalAnswers
        };
    };

    const handleAnswerChange = (questionId: string, value: string | string[]) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);

            // Kullanıcının birime erişim yetkisini kontrol et
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Cevapları kaydet
            const { error } = await supabase
                .from('survey_responses')
                .insert({
                    survey_id: id,
                    user_id: user.id,
                    answers
                });

            if (error) throw error;

            alert('Anket başarıyla gönderildi!');
            router.push('/dashboard');
        } catch (err) {
            console.error('Anket gönderilirken hata:', err);
            setError('Anket gönderilirken bir hata oluştu: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
        } finally {
            setSubmitting(false);
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

    if (!survey) {
        return (
            <Container className="mt-4">
                <Alert variant="warning">Anket bulunamadı</Alert>
            </Container>
        );
    }

    return (
        <Container className="mt-4">
            <Card className="mb-4">
                <Card.Body>
                    <Card.Title>{survey.title}</Card.Title>
                    <Card.Text>{survey.description}</Card.Text>
                </Card.Body>
            </Card>

            {responses.length > 0 && (
                <Card className="mb-4">
                    <Card.Body>
                        <h5>Anket Sonuçları</h5>
                        <p>Toplam Yanıt Sayısı: {responses.length}</p>

                        {survey.questions.map((question, index) => {
                            const stats = getQuestionStatistics(question);
                            if (!stats) return null;

                            return (
                                <div key={question.id} className="mb-4">
                                    <h6>Soru {index + 1}: {question.text}</h6>

                                    {stats.type === 'text' ? (
                                        <Table striped bordered hover>
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Yanıt</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.answers.map((answer, i) => (
                                                    <tr key={i}>
                                                        <td>{i + 1}</td>
                                                        <td>{answer}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    ) : (
                                        <Table striped bordered hover>
                                            <thead>
                                                <tr>
                                                    <th>Seçenek</th>
                                                    <th>Sayı</th>
                                                    <th>Yüzde</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.answerCounts && Object.entries(stats.answerCounts).map(([option, count]) => (
                                                    <tr key={option}>
                                                        <td>{option}</td>
                                                        <td>{count}</td>
                                                        <td>
                                                            {stats.totalAnswers && ((count / stats.totalAnswers) * 100).toFixed(1)}%
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    )}
                                </div>
                            );
                        })}
                    </Card.Body>
                </Card>
            )}

            <Form onSubmit={handleSubmit} className="mt-4">
                {survey.questions.map((question) => (
                    <Card key={question.id} className="mb-3">
                        <Card.Body>
                            <Form.Group>
                                <Form.Label>
                                    {question.text}
                                    {question.required && <span className="text-danger">*</span>}
                                </Form.Label>

                                {question.type === 'text' && (
                                    <Form.Control
                                        type="text"
                                        required={question.required}
                                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                    />
                                )}

                                {question.type === 'radio' && question.options && (
                                    <div>
                                        {question.options.map((option) => (
                                            <Form.Check
                                                key={option}
                                                type="radio"
                                                name={`question_${question.id}`}
                                                label={option}
                                                required={question.required}
                                                onChange={() => handleAnswerChange(question.id, option)}
                                            />
                                        ))}
                                    </div>
                                )}

                                {question.type === 'checkbox' && question.options && (
                                    <div>
                                        {question.options.map((option) => (
                                            <Form.Check
                                                key={option}
                                                type="checkbox"
                                                label={option}
                                                onChange={(e) => {
                                                    const currentAnswers = (answers[question.id] as string[]) || [];
                                                    if (e.target.checked) {
                                                        handleAnswerChange(question.id, [...currentAnswers, option]);
                                                    } else {
                                                        handleAnswerChange(
                                                            question.id,
                                                            currentAnswers.filter(a => a !== option)
                                                        );
                                                    }
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}

                                {question.type === 'select' && question.options && (
                                    <Form.Select
                                        required={question.required}
                                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                    >
                                        <option value="">Seçiniz</option>
                                        {question.options.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </Form.Select>
                                )}
                            </Form.Group>
                        </Card.Body>
                    </Card>
                ))}

                <Button
                    type="submit"
                    variant="primary"
                    disabled={submitting}
                    className="mt-3"
                >
                    {submitting ? 'Gönderiliyor...' : 'Gönder'}
                </Button>
            </Form>
        </Container>
    );
} 