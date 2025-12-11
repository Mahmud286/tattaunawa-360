export type ExpertCategory = 
  | 'Programming & Tech' 
  | 'Health & Medicine' 
  | 'Architecture & Engineering' 
  | 'Education & Teaching' 
  | 'Business & Legal Advisory' 
  | 'Design, Arts & Creativity';

export interface Review {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Consultant {
  id: string;
  name: string;
  title: string;
  category: ExpertCategory;
  bio: string;
  avatarUrl: string;
  hourlyRate: number;
  currency: string;
  languages: string[];
  experienceYears: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  availability: string[];
  reviews: Review[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  suggestedExperts?: string[]; // IDs of experts suggested by AI
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'consultant';
}

export type ViewState = 'HOME' | 'BROWSE' | 'PROFILE' | 'DASHBOARD' | 'LOGIN' | 'HELP' | 'TERMS' | 'PRIVACY' | 'CONTACT';