import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { Container, Alert, Card, Row, Col, Table } from 'react-bootstrap';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    ChartData // ✅ bunu ekliyoruz
} from 'chart.js';

import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface Survey {
    id: string;
    title: string;
    description: string;
    questions: Array<{
        id: string;
        text: string;
        type: string;
        options?: string[];
        required: boolean;
    }>;
}

interface SurveyResponse {
    id: string;
    survey_id: string;
    answers: Record<string, any>;
    created_at: string;
}

export default function SurveyResults() {
    const [survey, setSurvey] = useState<Survey | null>(null);
    const [responses, setResponses] = useState<SurveyResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { id } = router.query;

    useEffect(() => {
        if (id) {
            loadSurveyAndResponses();
        }
    }, [id]);

    const loadSurveyAndResponses = async () => {
        try {
            setLoading(true);
            setError(null);

            // Kullanıcının admin olup olmadığını kontrol et
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Oturum bulunamadı');

            const { data: userData } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();

            if (!userData || userData.role !== 'admin') {
                throw new Error('Bu sayfaya erişim yetkiniz yok');
            }

            // Anketi yükle
            const { data: surveyData, error: surveyError } = await supabase
                .from('surveys')
                .select('*')
                .eq('id', id)
                .single();

            if (surveyError) throw surveyError;
            setSurvey(surveyData);

            // Cevapları yükle
            const { data: responseData, error: responseError } = await supabase
                .from('survey_responses')
                .select('*')
                .eq('survey_id', id);

            if (responseError) throw responseError;
            setResponses(responseData);

        } catch (err) {
            console.error('Veriler yüklenirken hata:', err);
            setError('Veriler yüklenirken bir hata oluştu: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
        } finally {
            setLoading(false);
        }
    };

    const getQuestionStatistics = (question: Survey['questions'][0]) => {
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

        const labels = Object.keys(answerCounts);
        const data = Object.values(answerCounts);

        const chartData = {
            labels,
            datasets: [{
                data,
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40'
                ]
            }]
        };

        return {
            type: question.type,
            chartData,
            totalAnswers,
            answerCounts
        };
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
            <h2 className="mb-4">{survey.title} - Sonuçlar</h2>
            <p className="text-muted mb-4">{survey.description}</p>

            <Card className="mb-4">
                <Card.Body>
                    <h5>Genel İstatistikler</h5>
                    <p>Toplam Yanıt Sayısı: {responses.length}</p>
                </Card.Body>
            </Card>

            {survey.questions.map((question, index) => {
                const stats = getQuestionStatistics(question);
                if (!stats) return null;

                return (
                    <Card key={question.id} className="mb-4">
                        <Card.Body>
                            <h5>Soru {index + 1}: {question.text}</h5>

                            {stats.type === 'text' ? (
                                <Table striped bordered hover>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Yanıt</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.isArray(stats.answers) && stats.answers.map((answer, i) => (
                                            <tr key={i}>
                                                <td>{i + 1}</td>
                                                <td>{answer}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <Row>
                                    <Col md={6}>
                                        {stats.chartData && (
                                            <Pie data={stats.chartData as ChartData<'pie', number[], string>} />
                                        )}

                                    </Col>
                                    <Col md={6}>
                                        <Table striped bordered hover>
                                            <thead>
                                                <tr>
                                                    <th>Seçenek</th>
                                                    <th>Sayı</th>
                                                    <th>Yüzde</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.chartData.labels.map((label, i) => (
                                                    <tr key={label}>
                                                        <td>{label}</td>
                                                        <td>{stats.chartData.datasets[0].data[i]}</td>
                                                        <td>
                                                            {((stats.chartData.datasets[0].data[i] / stats.totalAnswers) * 100).toFixed(1)}%
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </Col>
                                </Row>
                            )}
                        </Card.Body>
                    </Card>
                );
            })}
        </Container>
    );
} 