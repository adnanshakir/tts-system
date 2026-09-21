export type Language = 'en' | 'hi';

export interface TTSVoice {
  id: string;
  name: string;
  language: Language;
  gender: 'female' | 'male';
  accent?: string;
}

export interface TTSRequest {
  text: string;
  language: Language;
  voice: string;
}

export interface TTSState {
  status: 'idle' | 'loading' | 'success' | 'error';
  audioUrl: string | null;
  error: string | null;
  generatedText?: string;
  generatedVoice?: string;
}

export const SUPPORTED_LANGUAGES = [
  { id: 'en', name: 'English' },
  { id: 'hi', name: 'Hindi (हिंदी)' },
] as const;

export const KOKORO_VOICES: TTSVoice[] = [
  // American English
  { id: 'af_bella', name: 'Bella (American)', language: 'en', gender: 'female', accent: 'US' },
  { id: 'af_sarah', name: 'Sarah (American)', language: 'en', gender: 'female', accent: 'US' },
  { id: 'af_nicole', name: 'Nicole (American)', language: 'en', gender: 'female', accent: 'US' },
  { id: 'am_adam', name: 'Adam (American)', language: 'en', gender: 'male', accent: 'US' },
  { id: 'am_michael', name: 'Michael (American)', language: 'en', gender: 'male', accent: 'US' },
  
  // British English
  { id: 'bf_emma', name: 'Emma (British)', language: 'en', gender: 'female', accent: 'UK' },
  { id: 'bf_isabella', name: 'Isabella (British)', language: 'en', gender: 'female', accent: 'UK' },
  { id: 'bm_george', name: 'George (British)', language: 'en', gender: 'male', accent: 'UK' },
  { id: 'bm_fable', name: 'Fable (British)', language: 'en', gender: 'male', accent: 'UK' },

  // Hindi
  { id: 'hf_alpha', name: 'Alpha (Hindi Female)', language: 'hi', gender: 'female', accent: 'IN' },
  { id: 'hf_beta', name: 'Beta (Hindi Female)', language: 'hi', gender: 'female', accent: 'IN' },
  { id: 'hm_omega', name: 'Omega (Hindi Male)', language: 'hi', gender: 'male', accent: 'IN' },
  { id: 'hm_psi', name: 'Psi (Hindi Male)', language: 'hi', gender: 'male', accent: 'IN' },
];
