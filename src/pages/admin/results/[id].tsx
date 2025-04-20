import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { Container, Alert, Card, Row, Col, Table, Badge } from 'react-bootstrap';

interface Question {
    id: string;
    text: string;
    type: string;
    options?: string[];
    required: boolean;
}

interface Survey {
    id: string;
    title: string;
    description: string;
    questions: Question[];
    unit_id: string;
    start_time: string;
    duration: number;
}

interface Response {
    id: string;
    survey_id: string;
    user_id: string;
    answers: Record<string, any>;
    created_at: string;
    user?: {
        email: string;
    };
}

export default function SurveyResults() {
    const [survey, setSurvey] = useState<Survey | null>(null);
    const [responses, setResponses] = useState<Response[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [unitName, setUnitName] = useState('');
    const router = useRouter();
    const { id } = router.query;

    useEffect(() => {
        if (id) {
            checkAdmin();
            loadSurvey();
            loadResponses();
        }
    }, [id]);

    const checkAdmin = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || user.user_metadata?.role !== 'admin') {
                router.push('/');
                return;
            }
        } catch (err) {
            console.error('Yetki kontrolü hatası:', err);
            setError('Yetki kontrolü sırasında bir hata oluştu');
            setLoading(false);
        }
    };

    const loadSurvey = async () => {
        try {
            const { data, error } = await supabase
                .from('surveys')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setSurvey(data);

            // Birim adını yükle
            if (data.unit_id) {
                const { data: unitData, error: unitError } = await supabase
                    .from('units')
                    .select('name')
                    .eq('id', data.unit_id)
                    .single();

                if (!unitError && unitData) {
                    setUnitName(unitData.name);
                }
            }
        } catch (err) {
            console.error('Anket yüklenirken hata:', err);
            setError('Anket yüklenirken bir hata oluştu: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
        }
    };

    const loadResponses = async () => {
        try {
            const { data, error } = await supabase
                .from('survey_responses')
                .select('*, user:user_id(email)')
                .eq('survey_id', id);

            if (error) throw error;
            setResponses(data || []);
        } catch (err) {
            console.error('Anket cevapları yüklenirken hata:', err);
            // Hata mesajı zaten var, ekstra hata mesajı göstermeye gerek yok
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

    if (!survey) {
        return (
            <Container className="mt-4">
                <Alert variant="warning">Anket bulunamadı.</Alert>
            </Container>
        );
    }

    // Yanıtları soru bazında grupla
    const getAnswersByQuestion = () => {
        const questionAnswers: Record<string, any[]> = {};

        survey.questions.forEach(question => {
            questionAnswers[question.id] = [];

            responses.forEach(response => {
                if (response.answers && response.answers[question.id] !== undefined) {
                    questionAnswers[question.id].push({
                        userId: response.user_id,
                        userEmail: response.user?.email || 'Bilinmeyen Kullanıcı',
                        answer: response.answers[question.id],
                        createdAt: response.created_at
                    });
                }
            });
        });

        return questionAnswers;
    };

    const renderAnswerValue = (value: any) => {
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        return String(value);
    };

    const questionAnswers = getAnswersByQuestion();

    return (
        <Container className="mt-4">
            <h2>{survey.title} - Sonuçları</h2>
            <p className="text-muted">{survey.description}</p>

            <div className="mb-4">
                <Badge bg="secondary" className="me-2">Birim: {unitName}</Badge>
                <Badge bg="info" className="me-2">
                    Başlangıç: {new Date(survey.start_time).toLocaleString('tr-TR')}
                </Badge>
                <Badge bg="warning">Süre: {survey.duration} dk</Badge>
            </div>

            <Alert variant="info">
                Toplam Yanıt Sayısı: {responses.length}
            </Alert>

            {survey.questions.map((question) => (
                <Card key={question.id} className="mb-4">
                    <Card.Header>
                        <h5 className="mb-0">{question.text}</h5>
                        <small className="text-muted">
                            Tip: {question.type} | {question.required ? 'Zorunlu' : 'İsteğe Bağlı'}
                        </small>
                    </Card.Header>
                    <Card.Body>
                        {questionAnswers[question.id].length === 0 ? (
                            <Alert variant="warning">Bu soru için henüz yanıt yok.</Alert>
                        ) : (
                            <>
                                <Table striped bordered hover>
                                    <thead>
                                        <tr>
                                            <th>Kullanıcı</th>
                                            <th>Yanıt</th>
                                            <th>Tarih</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {questionAnswers[question.id].map((answer, index) => (
                                            <tr key={index}>
                                                <td>{answer.userEmail}</td>
                                                <td>{renderAnswerValue(answer.answer)}</td>
                                                <td>{new Date(answer.createdAt).toLocaleString('tr-TR')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>

                                {(question.type === 'radio' || question.type === 'checkbox' || question.type === 'select') && (
                                    <div className="mt-4">
                                        <h6>Yanıt Dağılımı</h6>
                                        {(() => {
                                            const counts: Record<string, number> = {};

                                            questionAnswers[question.id].forEach(answer => {
                                                const values = Array.isArray(answer.answer)
                                                    ? answer.answer
                                                    : [answer.answer];

                                                values.forEach((val: string) => {
                                                    counts[val] = (counts[val] || 0) + 1;
                                                });
                                            });

                                            return (
                                                <ul>
                                                    {Object.entries(counts).map(([option, count]) => (
                                                        <li key={option}>
                                                            {option}: {count} kişi ({Math.round(count / questionAnswers[question.id].length * 100)}%)
                                                        </li>
                                                    ))}
                                                </ul>
                                            );
                                        })()}
                                    </div>
                                )}
                            </>
                        )}
                    </Card.Body>
                </Card>
            ))}
        </Container>
    );
} 