export interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'surveyor' | 'participant';
    createdAt: Date;
    updatedAt: Date;
}

export interface Survey {
    id: string;
    title: string;
    description: string;
    questions: Question[];
    startDate: Date;
    endDate: Date;
    status: 'draft' | 'active' | 'completed';
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Question {
    id: string;
    type: 'text' | 'multiple-choice' | 'single-choice' | 'rating' | 'date';
    question: string;
    options?: string[];
    required: boolean;
    order: number;
}

export interface SurveyResponse {
    id: string;
    surveyId: string;
    userId: string;
    answers: Answer[];
    completedAt: Date;
    createdAt: Date;
}

export interface Answer {
    questionId: string;
    answer: string | string[] | number | Date;
}

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'survey' | 'system' | 'alert';
    read: boolean;
    createdAt: Date;
}

export interface SurveyTemplate {
    id: string;
    name: string;
    description: string;
    questions: Question[];
    createdAt: Date;
    updatedAt: Date;
} 