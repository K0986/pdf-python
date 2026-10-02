/**
 * PDF Forge - Font Management Layer
 * Multilingual Unicode typography support for Indic, RTL Arabic/Hebrew, CJK, Cyrillic, and Latin scripts.
 */

export interface FontDefinition {
  id: string;
  name: string;
  family: string;
  script: string;
  category: 'Latin' | 'Arabic / RTL' | 'Indic' | 'CJK' | 'Monospace' | 'Serif';
  isRtl?: boolean;
  sampleText: string;
}

export const SUPPORTED_FONTS: FontDefinition[] = [
  {
    id: 'inter',
    name: 'Inter',
    family: "'Inter', sans-serif",
    script: 'Latin / Cyrillic / Greek',
    category: 'Latin',
    sampleText: 'The quick brown fox jumps'
  },
  {
    id: 'noto-sans',
    name: 'Noto Sans (Standard)',
    family: "'Noto Sans', sans-serif",
    script: 'Universal Global',
    category: 'Latin',
    sampleText: 'Universal Typography 123'
  },
  {
    id: 'noto-serif',
    name: 'Noto Serif',
    family: "'Noto Serif', serif",
    script: 'Editorial / Formal',
    category: 'Serif',
    sampleText: 'Editorial Elegance & Style'
  },
  {
    id: 'fira-code',
    name: 'Fira Code',
    family: "'Fira Code', monospace",
    script: 'Code / Technical',
    category: 'Monospace',
    sampleText: 'const pdf = new Document();'
  },
  {
    id: 'noto-arabic',
    name: 'Noto Sans Arabic',
    family: "'Noto Sans Arabic', 'Noto Naskh Arabic', sans-serif",
    script: 'Arabic, Urdu, Persian, Pashto',
    category: 'Arabic / RTL',
    isRtl: true,
    sampleText: 'مرحبا بكم في محرر الملفات'
  },
  {
    id: 'noto-hebrew',
    name: 'Noto Sans Hebrew',
    family: "'Noto Sans Hebrew', sans-serif",
    script: 'Hebrew, Yiddish',
    category: 'Arabic / RTL',
    isRtl: true,
    sampleText: 'שלום עולם ועורך מסמכים'
  },
  {
    id: 'noto-devanagari',
    name: 'Noto Sans Devanagari',
    family: "'Noto Sans Devanagari', sans-serif",
    script: 'Hindi, Marathi, Sanskrit, Nepali',
    category: 'Indic',
    sampleText: 'नमस्ते! पीडीएफ संपादक में आपका स्वागत है'
  },
  {
    id: 'noto-bengali',
    name: 'Noto Sans Bengali',
    family: "'Noto Sans Bengali', sans-serif",
    script: 'Bengali, Assamese',
    category: 'Indic',
    sampleText: 'স্বাগতম বাংলা ডকুমেন্ট এডিটর'
  },
  {
    id: 'noto-gujarati',
    name: 'Noto Sans Gujarati',
    family: "'Noto Sans Gujarati', sans-serif",
    script: 'Gujarati',
    category: 'Indic',
    sampleText: 'પીડીએફ એડિટરમાં આપનું સ્વાગત છે'
  },
  {
    id: 'noto-tamil',
    name: 'Noto Sans Tamil',
    family: "'Noto Sans Tamil', sans-serif",
    script: 'Tamil',
    category: 'Indic',
    sampleText: 'வணக்கம்! ஆவண திருத்தி'
  },
  {
    id: 'noto-telugu',
    name: 'Noto Sans Telugu',
    family: "'Noto Sans Telugu', sans-serif",
    script: 'Telugu',
    category: 'Indic',
    sampleText: 'స్వాగతం పీడీఎఫ్ ఎడిటర్'
  },
  {
    id: 'noto-kannada',
    name: 'Noto Sans Kannada',
    family: "'Noto Sans Kannada', sans-serif",
    script: 'Kannada',
    category: 'Indic',
    sampleText: 'ಸ್ವಾಗತ ಡಾಕ್ಯುಮೆಂಟ್ ಸಂಪಾದಕ'
  },
  {
    id: 'noto-malayalam',
    name: 'Noto Sans Malayalam',
    family: "'Noto Sans Malayalam', sans-serif",
    script: 'Malayalam',
    category: 'Indic',
    sampleText: 'സ്വാഗതം പിഡിഎഫ് എഡിറ്റർ'
  },
  {
    id: 'noto-sc',
    name: 'Noto Sans SC (Simplified Chinese)',
    family: "'Noto Sans SC', sans-serif",
    script: 'Simplified Chinese',
    category: 'CJK',
    sampleText: '欢迎使用专业本地PDF编辑器'
  },
  {
    id: 'noto-jp',
    name: 'Noto Sans JP (Japanese)',
    family: "'Noto Sans JP', sans-serif",
    script: 'Japanese (Kanji, Hiragana, Katakana)',
    category: 'CJK',
    sampleText: '高品質PDF編集ツールへようこそ'
  },
  {
    id: 'noto-kr',
    name: 'Noto Sans KR (Korean)',
    family: "'Noto Sans KR', sans-serif",
    script: 'Korean (Hangul)',
    category: 'CJK',
    sampleText: '로컬 PDF 편집기에 오신 것을 환영합니다'
  }
];

/**
 * Detects whether the input string contains RTL scripts (Arabic, Hebrew, Syriac, Thaana)
 */
export function isRTLText(text: string): boolean {
  const rtlRegex = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  return rtlRegex.test(text);
}

/**
 * Detects appropriate font family based on Unicode character codes
 */
export function detectRecommendedFont(text: string): FontDefinition {
  if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text)) {
    return SUPPORTED_FONTS.find(f => f.id === 'noto-arabic')!;
  }
  if (/[\u0590-\u05FF]/.test(text)) {
    return SUPPORTED_FONTS.find(f => f.id === 'noto-hebrew')!;
  }
  if (/[\u0900-\u097F]/.test(text)) {
    return SUPPORTED_FONTS.find(f => f.id === 'noto-devanagari')!;
  }
  if (/[\u0980-\u09FF]/.test(text)) {
    return SUPPORTED_FONTS.find(f => f.id === 'noto-bengali')!;
  }
  if (/[\u0A80-\u0AFF]/.test(text)) {
    return SUPPORTED_FONTS.find(f => f.id === 'noto-gujarati')!;
  }
  if (/[\u0B80-\u0BFF]/.test(text)) {
    return SUPPORTED_FONTS.find(f => f.id === 'noto-tamil')!;
  }
  if (/[\u0C00-\u0C7F]/.test(text)) {
    return SUPPORTED_FONTS.find(f => f.id === 'noto-telugu')!;
  }
  if (/[\u0C80-\u0CFF]/.test(text)) {
    return SUPPORTED_FONTS.find(f => f.id === 'noto-kannada')!;
  }
  if (/[\u0D00-\u0D7F]/.test(text)) {
    return SUPPORTED_FONTS.find(f => f.id === 'noto-malayalam')!;
  }
  if (/[\u4E00-\u9FFF]/.test(text)) {
    return SUPPORTED_FONTS.find(f => f.id === 'noto-sc')!;
  }
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) {
    return SUPPORTED_FONTS.find(f => f.id === 'noto-jp')!;
  }
  if (/[\uAC00-\uD7AF]/.test(text)) {
    return SUPPORTED_FONTS.find(f => f.id === 'noto-kr')!;
  }
  return SUPPORTED_FONTS[0];
}
