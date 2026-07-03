/**
 * Professional Mode Vocabularies
 * Phase 2.1: Advanced Voice Recognition
 * 
 * Specialized vocabulary for different professional domains
 */

import { CustomVocabulary, VocabularyTerm } from '../services/advanced-recognition.service';
import { ProfessionalMode } from '../services/aiml-api.service';

// Medical Vocabulary
const MEDICAL_TERMS: VocabularyTerm[] = [
  // Common medical terms
  { term: 'hypertension', weight: 2.0, category: 'condition' },
  { term: 'diabetes', weight: 2.0, category: 'condition' },
  { term: 'cardiovascular', weight: 2.0, category: 'anatomy' },
  { term: 'pulmonary', weight: 2.0, category: 'anatomy' },
  { term: 'gastrointestinal', weight: 2.0, category: 'anatomy' },
  { term: 'neurological', weight: 2.0, category: 'anatomy' },
  
  // Medications
  { term: 'acetaminophen', weight: 2.5, category: 'medication' },
  { term: 'ibuprofen', weight: 2.5, category: 'medication' },
  { term: 'amoxicillin', weight: 2.5, category: 'medication' },
  { term: 'metformin', weight: 2.5, category: 'medication' },
  { term: 'lisinopril', weight: 2.5, category: 'medication' },
  
  // Procedures
  { term: 'endoscopy', weight: 2.0, category: 'procedure' },
  { term: 'colonoscopy', weight: 2.0, category: 'procedure' },
  { term: 'angioplasty', weight: 2.0, category: 'procedure' },
  { term: 'laparoscopy', weight: 2.0, category: 'procedure' },
  
  // Measurements
  { term: 'systolic', weight: 1.8, category: 'measurement' },
  { term: 'diastolic', weight: 1.8, category: 'measurement' },
  { term: 'hemoglobin', weight: 1.8, category: 'measurement' },
  { term: 'glucose', weight: 1.8, category: 'measurement' },
];

// Developer Vocabulary
const DEVELOPER_TERMS: VocabularyTerm[] = [
  // Programming languages
  { term: 'JavaScript', weight: 2.0, category: 'language' },
  { term: 'TypeScript', weight: 2.0, category: 'language' },
  { term: 'Python', weight: 2.0, category: 'language' },
  { term: 'React', weight: 2.0, category: 'framework' },
  { term: 'Node.js', weight: 2.0, category: 'runtime' },
  
  // Concepts
  { term: 'async', weight: 2.5, category: 'concept' },
  { term: 'await', weight: 2.5, category: 'concept' },
  { term: 'promise', weight: 2.0, category: 'concept' },
  { term: 'callback', weight: 2.0, category: 'concept' },
  { term: 'closure', weight: 2.0, category: 'concept' },
  { term: 'middleware', weight: 2.0, category: 'concept' },
  { term: 'API', weight: 2.0, category: 'concept' },
  { term: 'REST', weight: 2.0, category: 'concept' },
  { term: 'GraphQL', weight: 2.0, category: 'concept' },
  
  // Tools
  { term: 'Git', weight: 2.0, category: 'tool' },
  { term: 'Docker', weight: 2.0, category: 'tool' },
  { term: 'Kubernetes', weight: 2.0, category: 'tool' },
  { term: 'CI/CD', weight: 2.0, category: 'tool' },
  
  // Patterns
  { term: 'singleton', weight: 1.8, category: 'pattern' },
  { term: 'factory', weight: 1.8, category: 'pattern' },
  { term: 'observer', weight: 1.8, category: 'pattern' },
  { term: 'dependency injection', weight: 1.8, category: 'pattern' },
];

// Business Vocabulary
const BUSINESS_TERMS: VocabularyTerm[] = [
  // Finance
  { term: 'revenue', weight: 2.0, category: 'finance' },
  { term: 'EBITDA', weight: 2.5, category: 'finance' },
  { term: 'ROI', weight: 2.0, category: 'finance' },
  { term: 'KPI', weight: 2.0, category: 'metric' },
  { term: 'quarter', weight: 1.8, category: 'time' },
  { term: 'fiscal year', weight: 1.8, category: 'time' },
  
  // Strategy
  { term: 'synergy', weight: 2.0, category: 'strategy' },
  { term: 'stakeholder', weight: 2.0, category: 'people' },
  { term: 'deliverable', weight: 2.0, category: 'project' },
  { term: 'milestone', weight: 2.0, category: 'project' },
  { term: 'roadmap', weight: 2.0, category: 'planning' },
  
  // Marketing
  { term: 'conversion rate', weight: 2.0, category: 'marketing' },
  { term: 'customer acquisition', weight: 2.0, category: 'marketing' },
  { term: 'retention', weight: 2.0, category: 'marketing' },
  { term: 'churn', weight: 2.0, category: 'marketing' },
  
  // Operations
  { term: 'bandwidth', weight: 1.8, category: 'operations' },
  { term: 'scalability', weight: 1.8, category: 'operations' },
  { term: 'optimization', weight: 1.8, category: 'operations' },
];

// Legal Vocabulary
const LEGAL_TERMS: VocabularyTerm[] = [
  // General legal
  { term: 'plaintiff', weight: 2.5, category: 'party' },
  { term: 'defendant', weight: 2.5, category: 'party' },
  { term: 'litigation', weight: 2.0, category: 'process' },
  { term: 'deposition', weight: 2.0, category: 'process' },
  { term: 'subpoena', weight: 2.5, category: 'document' },
  
  // Contract law
  { term: 'indemnification', weight: 2.5, category: 'contract' },
  { term: 'liability', weight: 2.0, category: 'contract' },
  { term: 'breach', weight: 2.0, category: 'contract' },
  { term: 'consideration', weight: 2.0, category: 'contract' },
  
  // Court
  { term: 'jurisdiction', weight: 2.0, category: 'court' },
  { term: 'precedent', weight: 2.0, category: 'court' },
  { term: 'statute', weight: 2.0, category: 'law' },
  { term: 'ordinance', weight: 2.0, category: 'law' },
  
  // Latin terms
  { term: 'pro bono', weight: 2.5, category: 'latin' },
  { term: 'habeas corpus', weight: 2.5, category: 'latin' },
  { term: 'amicus curiae', weight: 2.5, category: 'latin' },
];

// Education Vocabulary
const EDUCATION_TERMS: VocabularyTerm[] = [
  // Pedagogy
  { term: 'pedagogy', weight: 2.0, category: 'teaching' },
  { term: 'curriculum', weight: 2.0, category: 'teaching' },
  { term: 'assessment', weight: 2.0, category: 'evaluation' },
  { term: 'rubric', weight: 2.0, category: 'evaluation' },
  
  // Learning
  { term: 'cognitive', weight: 2.0, category: 'learning' },
  { term: 'metacognition', weight: 2.0, category: 'learning' },
  { term: 'scaffolding', weight: 2.0, category: 'learning' },
  { term: 'differentiation', weight: 2.0, category: 'learning' },
  
  // Academic
  { term: 'thesis', weight: 2.0, category: 'academic' },
  { term: 'dissertation', weight: 2.0, category: 'academic' },
  { term: 'syllabus', weight: 2.0, category: 'academic' },
  { term: 'semester', weight: 1.8, category: 'time' },
  
  // Technology
  { term: 'e-learning', weight: 2.0, category: 'technology' },
  { term: 'LMS', weight: 2.0, category: 'technology' },
  { term: 'blended learning', weight: 2.0, category: 'technology' },
];

// Vocabulary Map
export const PROFESSIONAL_VOCABULARIES: Record<ProfessionalMode, CustomVocabulary> = {
  [ProfessionalMode.MEDICAL]: {
    terms: MEDICAL_TERMS,
    professionalMode: ProfessionalMode.MEDICAL,
    caseSensitive: false,
  },
  [ProfessionalMode.DEVELOPER]: {
    terms: DEVELOPER_TERMS,
    professionalMode: ProfessionalMode.DEVELOPER,
    caseSensitive: true, // Code is case-sensitive
  },
  [ProfessionalMode.BUSINESS]: {
    terms: BUSINESS_TERMS,
    professionalMode: ProfessionalMode.BUSINESS,
    caseSensitive: false,
  },
  [ProfessionalMode.LEGAL]: {
    terms: LEGAL_TERMS,
    professionalMode: ProfessionalMode.LEGAL,
    caseSensitive: false,
  },
  [ProfessionalMode.EDUCATION]: {
    terms: EDUCATION_TERMS,
    professionalMode: ProfessionalMode.EDUCATION,
    caseSensitive: false,
  },
  [ProfessionalMode.GENERAL]: {
    terms: [],
    professionalMode: ProfessionalMode.GENERAL,
    caseSensitive: false,
  },
};

/**
 * Get vocabulary for professional mode
 */
export function getVocabularyForMode(mode: ProfessionalMode): CustomVocabulary {
  return PROFESSIONAL_VOCABULARIES[mode];
}

/**
 * Merge multiple vocabularies
 */
export function mergeVocabularies(...vocabularies: CustomVocabulary[]): CustomVocabulary {
  const termMap = new Map<string, VocabularyTerm>();

  vocabularies.forEach(vocab => {
    vocab.terms.forEach(term => {
      const existing = termMap.get(term.term);
      if (existing) {
        // Keep higher weight
        if (term.weight > existing.weight) {
          termMap.set(term.term, term);
        }
      } else {
        termMap.set(term.term, term);
      }
    });
  });

  return {
    terms: Array.from(termMap.values()),
    caseSensitive: vocabularies.some(v => v.caseSensitive),
  };
}

/**
 * Create custom vocabulary from terms
 */
export function createCustomVocabulary(
  terms: string[],
  options: {
    weight?: number;
    category?: string;
    caseSensitive?: boolean;
  } = {}
): CustomVocabulary {
  const { weight = 2.0, category, caseSensitive = false } = options;

  return {
    terms: terms.map(term => ({
      term,
      weight,
      category,
    })),
    caseSensitive,
  };
}

/**
 * Get all available professional modes
 */
export function getAvailableProfessionalModes(): ProfessionalMode[] {
  return Object.values(ProfessionalMode);
}

/**
 * Get term count for mode
 */
export function getTermCountForMode(mode: ProfessionalMode): number {
  return PROFESSIONAL_VOCABULARIES[mode].terms.length;
}

/**
 * Search terms in vocabulary
 */
export function searchTerms(mode: ProfessionalMode, query: string): VocabularyTerm[] {
  const vocabulary = PROFESSIONAL_VOCABULARIES[mode];
  const lowerQuery = query.toLowerCase();

  return vocabulary.terms.filter(term =>
    term.term.toLowerCase().includes(lowerQuery) ||
    term.category?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get terms by category
 */
export function getTermsByCategory(mode: ProfessionalMode, category: string): VocabularyTerm[] {
  const vocabulary = PROFESSIONAL_VOCABULARIES[mode];
  return vocabulary.terms.filter(term => term.category === category);
}

/**
 * Get all categories for mode
 */
export function getCategoriesForMode(mode: ProfessionalMode): string[] {
  const vocabulary = PROFESSIONAL_VOCABULARIES[mode];
  const categories = new Set<string>();

  vocabulary.terms.forEach(term => {
    if (term.category) {
      categories.add(term.category);
    }
  });

  return Array.from(categories).sort();
}

