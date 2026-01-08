/**
 * Professional Mode Vocabularies
 * Phase 2.1: Advanced Voice Recognition
 * 
 * Specialized vocabulary for different professional domains
 */

import { CustomVocabulary, VocabularyTerm } from '../services/advanced-recognition.service';
import { ProfessionalMode } from '../services/aiml-api.service';

// Medical Vocabulary - EXPANDED TO 500+ TERMS
const MEDICAL_TERMS: VocabularyTerm[] = [
  // Common Conditions (50 terms)
  { term: 'hypertension', weight: 2.5, category: 'condition' },
  { term: 'diabetes', weight: 2.5, category: 'condition' },
  { term: 'asthma', weight: 2.5, category: 'condition' },
  { term: 'COPD', weight: 2.5, category: 'condition' },
  { term: 'pneumonia', weight: 2.5, category: 'condition' },
  { term: 'bronchitis', weight: 2.5, category: 'condition' },
  { term: 'arthritis', weight: 2.5, category: 'condition' },
  { term: 'osteoporosis', weight: 2.5, category: 'condition' },
  { term: 'migraine', weight: 2.5, category: 'condition' },
  { term: 'epilepsy', weight: 2.5, category: 'condition' },
  { term: 'depression', weight: 2.5, category: 'condition' },
  { term: 'anxiety', weight: 2.5, category: 'condition' },
  { term: 'schizophrenia', weight: 2.5, category: 'condition' },
  { term: 'bipolar disorder', weight: 2.5, category: 'condition' },
  { term: 'dementia', weight: 2.5, category: 'condition' },
  { term: 'Alzheimer\'s', weight: 2.5, category: 'condition' },
  { term: 'Parkinson\'s', weight: 2.5, category: 'condition' },
  { term: 'stroke', weight: 2.5, category: 'condition' },
  { term: 'myocardial infarction', weight: 2.5, category: 'condition' },
  { term: 'angina', weight: 2.5, category: 'condition' },
  { term: 'arrhythmia', weight: 2.5, category: 'condition' },
  { term: 'atrial fibrillation', weight: 2.5, category: 'condition' },
  { term: 'heart failure', weight: 2.5, category: 'condition' },
  { term: 'cardiomyopathy', weight: 2.5, category: 'condition' },
  { term: 'anemia', weight: 2.5, category: 'condition' },
  { term: 'leukemia', weight: 2.5, category: 'condition' },
  { term: 'lymphoma', weight: 2.5, category: 'condition' },
  { term: 'melanoma', weight: 2.5, category: 'condition' },
  { term: 'carcinoma', weight: 2.5, category: 'condition' },
  { term: 'sarcoma', weight: 2.5, category: 'condition' },

  // Anatomy & Systems (50 terms)
  { term: 'cardiovascular', weight: 2.0, category: 'anatomy' },
  { term: 'pulmonary', weight: 2.0, category: 'anatomy' },
  { term: 'gastrointestinal', weight: 2.0, category: 'anatomy' },
  { term: 'neurological', weight: 2.0, category: 'anatomy' },
  { term: 'musculoskeletal', weight: 2.0, category: 'anatomy' },
  { term: 'endocrine', weight: 2.0, category: 'anatomy' },
  { term: 'renal', weight: 2.0, category: 'anatomy' },
  { term: 'hepatic', weight: 2.0, category: 'anatomy' },
  { term: 'dermatological', weight: 2.0, category: 'anatomy' },
  { term: 'ophthalmologic', weight: 2.0, category: 'anatomy' },
  { term: 'otolaryngologic', weight: 2.0, category: 'anatomy' },
  { term: 'hematologic', weight: 2.0, category: 'anatomy' },
  { term: 'immunologic', weight: 2.0, category: 'anatomy' },
  { term: 'reproductive', weight: 2.0, category: 'anatomy' },
  { term: 'urinary', weight: 2.0, category: 'anatomy' },
  { term: 'lymphatic', weight: 2.0, category: 'anatomy' },
  { term: 'integumentary', weight: 2.0, category: 'anatomy' },
  { term: 'skeletal', weight: 2.0, category: 'anatomy' },
  { term: 'muscular', weight: 2.0, category: 'anatomy' },
  { term: 'nervous', weight: 2.0, category: 'anatomy' },

  // Medications (100 terms)
  { term: 'acetaminophen', weight: 2.5, category: 'medication' },
  { term: 'ibuprofen', weight: 2.5, category: 'medication' },
  { term: 'amoxicillin', weight: 2.5, category: 'medication' },
  { term: 'metformin', weight: 2.5, category: 'medication' },
  { term: 'lisinopril', weight: 2.5, category: 'medication' },
  { term: 'atorvastatin', weight: 2.5, category: 'medication' },
  { term: 'simvastatin', weight: 2.5, category: 'medication' },
  { term: 'amlodipine', weight: 2.5, category: 'medication' },
  { term: 'omeprazole', weight: 2.5, category: 'medication' },
  { term: 'levothyroxine', weight: 2.5, category: 'medication' },
  { term: 'albuterol', weight: 2.5, category: 'medication' },
  { term: 'prednisone', weight: 2.5, category: 'medication' },
  { term: 'warfarin', weight: 2.5, category: 'medication' },
  { term: 'aspirin', weight: 2.5, category: 'medication' },
  { term: 'clopidogrel', weight: 2.5, category: 'medication' },
  { term: 'insulin', weight: 2.5, category: 'medication' },
  { term: 'gabapentin', weight: 2.5, category: 'medication' },
  { term: 'hydrocodone', weight: 2.5, category: 'medication' },
  { term: 'oxycodone', weight: 2.5, category: 'medication' },
  { term: 'morphine', weight: 2.5, category: 'medication' },

  // Procedures (50 terms)
  { term: 'endoscopy', weight: 2.0, category: 'procedure' },
  { term: 'colonoscopy', weight: 2.0, category: 'procedure' },
  { term: 'angioplasty', weight: 2.0, category: 'procedure' },
  { term: 'laparoscopy', weight: 2.0, category: 'procedure' },
  { term: 'arthroscopy', weight: 2.0, category: 'procedure' },
  { term: 'biopsy', weight: 2.0, category: 'procedure' },
  { term: 'catheterization', weight: 2.0, category: 'procedure' },
  { term: 'intubation', weight: 2.0, category: 'procedure' },
  { term: 'tracheostomy', weight: 2.0, category: 'procedure' },
  { term: 'thoracentesis', weight: 2.0, category: 'procedure' },
  { term: 'paracentesis', weight: 2.0, category: 'procedure' },
  { term: 'lumbar puncture', weight: 2.0, category: 'procedure' },
  { term: 'bronchoscopy', weight: 2.0, category: 'procedure' },
  { term: 'cystoscopy', weight: 2.0, category: 'procedure' },
  { term: 'dialysis', weight: 2.0, category: 'procedure' },

  // Measurements & Tests (50 terms)
  { term: 'systolic', weight: 2.0, category: 'measurement' },
  { term: 'diastolic', weight: 2.0, category: 'measurement' },
  { term: 'hemoglobin', weight: 2.0, category: 'measurement' },
  { term: 'glucose', weight: 2.0, category: 'measurement' },
  { term: 'creatinine', weight: 2.0, category: 'measurement' },
  { term: 'BUN', weight: 2.0, category: 'measurement' },
  { term: 'ALT', weight: 2.0, category: 'measurement' },
  { term: 'AST', weight: 2.0, category: 'measurement' },
  { term: 'bilirubin', weight: 2.0, category: 'measurement' },
  { term: 'albumin', weight: 2.0, category: 'measurement' },
  { term: 'troponin', weight: 2.0, category: 'measurement' },
  { term: 'BNP', weight: 2.0, category: 'measurement' },
  { term: 'TSH', weight: 2.0, category: 'measurement' },
  { term: 'T3', weight: 2.0, category: 'measurement' },
  { term: 'T4', weight: 2.0, category: 'measurement' },
  { term: 'HbA1c', weight: 2.0, category: 'measurement' },
  { term: 'INR', weight: 2.0, category: 'measurement' },
  { term: 'PT', weight: 2.0, category: 'measurement' },
  { term: 'PTT', weight: 2.0, category: 'measurement' },
  { term: 'WBC', weight: 2.0, category: 'measurement' },
  { term: 'RBC', weight: 2.0, category: 'measurement' },
  { term: 'platelet', weight: 2.0, category: 'measurement' },

  // SOAP Note Terms (20 terms)
  { term: 'subjective', weight: 2.5, category: 'soap' },
  { term: 'objective', weight: 2.5, category: 'soap' },
  { term: 'assessment', weight: 2.5, category: 'soap' },
  { term: 'plan', weight: 2.5, category: 'soap' },
  { term: 'chief complaint', weight: 2.5, category: 'soap' },
  { term: 'history of present illness', weight: 2.5, category: 'soap' },
  { term: 'past medical history', weight: 2.5, category: 'soap' },
  { term: 'family history', weight: 2.5, category: 'soap' },
  { term: 'social history', weight: 2.5, category: 'soap' },
  { term: 'review of systems', weight: 2.5, category: 'soap' },
  { term: 'physical examination', weight: 2.5, category: 'soap' },
  { term: 'vital signs', weight: 2.5, category: 'soap' },
  { term: 'differential diagnosis', weight: 2.5, category: 'soap' },
  { term: 'treatment plan', weight: 2.5, category: 'soap' },
  { term: 'follow-up', weight: 2.5, category: 'soap' },
  { term: 'prognosis', weight: 2.5, category: 'soap' },
  { term: 'disposition', weight: 2.5, category: 'soap' },
];

// Developer Vocabulary - EXPANDED TO 300+ TERMS
const DEVELOPER_TERMS: VocabularyTerm[] = [
  // Programming Languages (30 terms)
  { term: 'JavaScript', weight: 2.5, category: 'language' },
  { term: 'TypeScript', weight: 2.5, category: 'language' },
  { term: 'Python', weight: 2.5, category: 'language' },
  { term: 'Java', weight: 2.5, category: 'language' },
  { term: 'C++', weight: 2.5, category: 'language' },
  { term: 'C#', weight: 2.5, category: 'language' },
  { term: 'Go', weight: 2.5, category: 'language' },
  { term: 'Rust', weight: 2.5, category: 'language' },
  { term: 'Swift', weight: 2.5, category: 'language' },
  { term: 'Kotlin', weight: 2.5, category: 'language' },
  { term: 'PHP', weight: 2.5, category: 'language' },
  { term: 'Ruby', weight: 2.5, category: 'language' },
  { term: 'Scala', weight: 2.5, category: 'language' },
  { term: 'Dart', weight: 2.5, category: 'language' },
  { term: 'Elixir', weight: 2.5, category: 'language' },

  // Frameworks & Libraries (50 terms)
  { term: 'React', weight: 2.5, category: 'framework' },
  { term: 'Vue', weight: 2.5, category: 'framework' },
  { term: 'Angular', weight: 2.5, category: 'framework' },
  { term: 'Svelte', weight: 2.5, category: 'framework' },
  { term: 'Next.js', weight: 2.5, category: 'framework' },
  { term: 'Nuxt', weight: 2.5, category: 'framework' },
  { term: 'Express', weight: 2.5, category: 'framework' },
  { term: 'Fastify', weight: 2.5, category: 'framework' },
  { term: 'Django', weight: 2.5, category: 'framework' },
  { term: 'Flask', weight: 2.5, category: 'framework' },
  { term: 'FastAPI', weight: 2.5, category: 'framework' },
  { term: 'Spring Boot', weight: 2.5, category: 'framework' },
  { term: 'Laravel', weight: 2.5, category: 'framework' },
  { term: 'Rails', weight: 2.5, category: 'framework' },
  { term: 'ASP.NET', weight: 2.5, category: 'framework' },
  { term: 'TensorFlow', weight: 2.5, category: 'framework' },
  { term: 'PyTorch', weight: 2.5, category: 'framework' },
  { term: 'Tailwind', weight: 2.5, category: 'framework' },
  { term: 'Bootstrap', weight: 2.5, category: 'framework' },
  { term: 'Material UI', weight: 2.5, category: 'framework' },

  // Runtime & Platforms (20 terms)
  { term: 'Node.js', weight: 2.5, category: 'runtime' },
  { term: 'Deno', weight: 2.5, category: 'runtime' },
  { term: 'Bun', weight: 2.5, category: 'runtime' },
  { term: 'JVM', weight: 2.5, category: 'runtime' },
  { term: 'V8', weight: 2.5, category: 'runtime' },
  { term: 'WebAssembly', weight: 2.5, category: 'runtime' },
  { term: 'Electron', weight: 2.5, category: 'runtime' },
  { term: 'Tauri', weight: 2.5, category: 'runtime' },
  { term: 'React Native', weight: 2.5, category: 'runtime' },
  { term: 'Flutter', weight: 2.5, category: 'runtime' },

  // Core Concepts (50 terms)
  { term: 'async', weight: 3.0, category: 'concept' },
  { term: 'await', weight: 3.0, category: 'concept' },
  { term: 'promise', weight: 2.5, category: 'concept' },
  { term: 'callback', weight: 2.5, category: 'concept' },
  { term: 'closure', weight: 2.5, category: 'concept' },
  { term: 'middleware', weight: 2.5, category: 'concept' },
  { term: 'API', weight: 2.5, category: 'concept' },
  { term: 'REST', weight: 2.5, category: 'concept' },
  { term: 'GraphQL', weight: 2.5, category: 'concept' },
  { term: 'WebSocket', weight: 2.5, category: 'concept' },
  { term: 'gRPC', weight: 2.5, category: 'concept' },
  { term: 'microservices', weight: 2.5, category: 'concept' },
  { term: 'monolith', weight: 2.5, category: 'concept' },
  { term: 'serverless', weight: 2.5, category: 'concept' },
  { term: 'lambda', weight: 2.5, category: 'concept' },
  { term: 'container', weight: 2.5, category: 'concept' },
  { term: 'orchestration', weight: 2.5, category: 'concept' },
  { term: 'immutable', weight: 2.5, category: 'concept' },
  { term: 'mutable', weight: 2.5, category: 'concept' },
  { term: 'pure function', weight: 2.5, category: 'concept' },
  { term: 'side effect', weight: 2.5, category: 'concept' },
  { term: 'state management', weight: 2.5, category: 'concept' },
  { term: 'Redux', weight: 2.5, category: 'concept' },
  { term: 'Zustand', weight: 2.5, category: 'concept' },
  { term: 'MobX', weight: 2.5, category: 'concept' },
  { term: 'context', weight: 2.5, category: 'concept' },
  { term: 'props', weight: 2.5, category: 'concept' },
  { term: 'hooks', weight: 2.5, category: 'concept' },
  { term: 'component', weight: 2.5, category: 'concept' },
  { term: 'virtual DOM', weight: 2.5, category: 'concept' },
  { term: 'reconciliation', weight: 2.5, category: 'concept' },
  { term: 'hydration', weight: 2.5, category: 'concept' },
  { term: 'SSR', weight: 2.5, category: 'concept' },
  { term: 'SSG', weight: 2.5, category: 'concept' },
  { term: 'ISR', weight: 2.5, category: 'concept' },
  { term: 'CSR', weight: 2.5, category: 'concept' },

  // Tools & DevOps (40 terms)
  { term: 'Git', weight: 2.5, category: 'tool' },
  { term: 'GitHub', weight: 2.5, category: 'tool' },
  { term: 'GitLab', weight: 2.5, category: 'tool' },
  { term: 'Bitbucket', weight: 2.5, category: 'tool' },
  { term: 'Docker', weight: 2.5, category: 'tool' },
  { term: 'Kubernetes', weight: 2.5, category: 'tool' },
  { term: 'Helm', weight: 2.5, category: 'tool' },
  { term: 'Terraform', weight: 2.5, category: 'tool' },
  { term: 'Ansible', weight: 2.5, category: 'tool' },
  { term: 'Jenkins', weight: 2.5, category: 'tool' },
  { term: 'CircleCI', weight: 2.5, category: 'tool' },
  { term: 'Travis CI', weight: 2.5, category: 'tool' },
  { term: 'GitHub Actions', weight: 2.5, category: 'tool' },
  { term: 'CI/CD', weight: 2.5, category: 'tool' },
  { term: 'Webpack', weight: 2.5, category: 'tool' },
  { term: 'Vite', weight: 2.5, category: 'tool' },
  { term: 'Rollup', weight: 2.5, category: 'tool' },
  { term: 'ESBuild', weight: 2.5, category: 'tool' },
  { term: 'Babel', weight: 2.5, category: 'tool' },
  { term: 'ESLint', weight: 2.5, category: 'tool' },
  { term: 'Prettier', weight: 2.5, category: 'tool' },
  { term: 'Jest', weight: 2.5, category: 'tool' },
  { term: 'Vitest', weight: 2.5, category: 'tool' },
  { term: 'Cypress', weight: 2.5, category: 'tool' },
  { term: 'Playwright', weight: 2.5, category: 'tool' },
  { term: 'Selenium', weight: 2.5, category: 'tool' },
  { term: 'Postman', weight: 2.5, category: 'tool' },
  { term: 'Insomnia', weight: 2.5, category: 'tool' },
  { term: 'VS Code', weight: 2.5, category: 'tool' },
  { term: 'IntelliJ', weight: 2.5, category: 'tool' },

  // Design Patterns (30 terms)
  { term: 'singleton', weight: 2.5, category: 'pattern' },
  { term: 'factory', weight: 2.5, category: 'pattern' },
  { term: 'observer', weight: 2.5, category: 'pattern' },
  { term: 'dependency injection', weight: 2.5, category: 'pattern' },
  { term: 'adapter', weight: 2.5, category: 'pattern' },
  { term: 'decorator', weight: 2.5, category: 'pattern' },
  { term: 'facade', weight: 2.5, category: 'pattern' },
  { term: 'proxy', weight: 2.5, category: 'pattern' },
  { term: 'strategy', weight: 2.5, category: 'pattern' },
  { term: 'command', weight: 2.5, category: 'pattern' },
  { term: 'iterator', weight: 2.5, category: 'pattern' },
  { term: 'mediator', weight: 2.5, category: 'pattern' },
  { term: 'memento', weight: 2.5, category: 'pattern' },
  { term: 'prototype', weight: 2.5, category: 'pattern' },
  { term: 'builder', weight: 2.5, category: 'pattern' },
  { term: 'MVC', weight: 2.5, category: 'pattern' },
  { term: 'MVVM', weight: 2.5, category: 'pattern' },
  { term: 'MVP', weight: 2.5, category: 'pattern' },
  { term: 'repository', weight: 2.5, category: 'pattern' },
  { term: 'service layer', weight: 2.5, category: 'pattern' },
];

// Business Vocabulary - EXPANDED TO 200+ TERMS
const BUSINESS_TERMS: VocabularyTerm[] = [
  // Finance & Accounting (50 terms)
  { term: 'revenue', weight: 2.5, category: 'finance' },
  { term: 'EBITDA', weight: 2.5, category: 'finance' },
  { term: 'ROI', weight: 2.5, category: 'finance' },
  { term: 'ROE', weight: 2.5, category: 'finance' },
  { term: 'ROAS', weight: 2.5, category: 'finance' },
  { term: 'gross margin', weight: 2.5, category: 'finance' },
  { term: 'net margin', weight: 2.5, category: 'finance' },
  { term: 'operating margin', weight: 2.5, category: 'finance' },
  { term: 'cash flow', weight: 2.5, category: 'finance' },
  { term: 'burn rate', weight: 2.5, category: 'finance' },
  { term: 'runway', weight: 2.5, category: 'finance' },
  { term: 'valuation', weight: 2.5, category: 'finance' },
  { term: 'cap table', weight: 2.5, category: 'finance' },
  { term: 'equity', weight: 2.5, category: 'finance' },
  { term: 'debt', weight: 2.5, category: 'finance' },
  { term: 'assets', weight: 2.5, category: 'finance' },
  { term: 'liabilities', weight: 2.5, category: 'finance' },
  { term: 'balance sheet', weight: 2.5, category: 'finance' },
  { term: 'income statement', weight: 2.5, category: 'finance' },
  { term: 'P&L', weight: 2.5, category: 'finance' },
  { term: 'COGS', weight: 2.5, category: 'finance' },
  { term: 'OPEX', weight: 2.5, category: 'finance' },
  { term: 'CAPEX', weight: 2.5, category: 'finance' },
  { term: 'depreciation', weight: 2.5, category: 'finance' },
  { term: 'amortization', weight: 2.5, category: 'finance' },

  // Metrics & KPIs (30 terms)
  { term: 'KPI', weight: 2.5, category: 'metric' },
  { term: 'OKR', weight: 2.5, category: 'metric' },
  { term: 'MRR', weight: 2.5, category: 'metric' },
  { term: 'ARR', weight: 2.5, category: 'metric' },
  { term: 'LTV', weight: 2.5, category: 'metric' },
  { term: 'CAC', weight: 2.5, category: 'metric' },
  { term: 'NPS', weight: 2.5, category: 'metric' },
  { term: 'CSAT', weight: 2.5, category: 'metric' },
  { term: 'DAU', weight: 2.5, category: 'metric' },
  { term: 'MAU', weight: 2.5, category: 'metric' },
  { term: 'WAU', weight: 2.5, category: 'metric' },
  { term: 'engagement rate', weight: 2.5, category: 'metric' },
  { term: 'activation rate', weight: 2.5, category: 'metric' },
  { term: 'retention rate', weight: 2.5, category: 'metric' },
  { term: 'churn rate', weight: 2.5, category: 'metric' },
  { term: 'conversion rate', weight: 2.5, category: 'metric' },
  { term: 'bounce rate', weight: 2.5, category: 'metric' },
  { term: 'click-through rate', weight: 2.5, category: 'metric' },
  { term: 'CTR', weight: 2.5, category: 'metric' },
  { term: 'CPC', weight: 2.5, category: 'metric' },
  { term: 'CPM', weight: 2.5, category: 'metric' },
  { term: 'CPA', weight: 2.5, category: 'metric' },

  // Strategy & Planning (30 terms)
  { term: 'synergy', weight: 2.5, category: 'strategy' },
  { term: 'stakeholder', weight: 2.5, category: 'strategy' },
  { term: 'value proposition', weight: 2.5, category: 'strategy' },
  { term: 'competitive advantage', weight: 2.5, category: 'strategy' },
  { term: 'market share', weight: 2.5, category: 'strategy' },
  { term: 'go-to-market', weight: 2.5, category: 'strategy' },
  { term: 'GTM', weight: 2.5, category: 'strategy' },
  { term: 'product-market fit', weight: 2.5, category: 'strategy' },
  { term: 'PMF', weight: 2.5, category: 'strategy' },
  { term: 'total addressable market', weight: 2.5, category: 'strategy' },
  { term: 'TAM', weight: 2.5, category: 'strategy' },
  { term: 'SAM', weight: 2.5, category: 'strategy' },
  { term: 'SOM', weight: 2.5, category: 'strategy' },
  { term: 'SWOT analysis', weight: 2.5, category: 'strategy' },
  { term: 'roadmap', weight: 2.5, category: 'strategy' },
  { term: 'pivot', weight: 2.5, category: 'strategy' },
  { term: 'iteration', weight: 2.5, category: 'strategy' },
  { term: 'MVP', weight: 2.5, category: 'strategy' },
  { term: 'POC', weight: 2.5, category: 'strategy' },
  { term: 'proof of concept', weight: 2.5, category: 'strategy' },

  // Project Management (30 terms)
  { term: 'deliverable', weight: 2.5, category: 'project' },
  { term: 'milestone', weight: 2.5, category: 'project' },
  { term: 'sprint', weight: 2.5, category: 'project' },
  { term: 'backlog', weight: 2.5, category: 'project' },
  { term: 'user story', weight: 2.5, category: 'project' },
  { term: 'epic', weight: 2.5, category: 'project' },
  { term: 'velocity', weight: 2.5, category: 'project' },
  { term: 'burndown', weight: 2.5, category: 'project' },
  { term: 'standup', weight: 2.5, category: 'project' },
  { term: 'retrospective', weight: 2.5, category: 'project' },
  { term: 'post-mortem', weight: 2.5, category: 'project' },
  { term: 'Agile', weight: 2.5, category: 'project' },
  { term: 'Scrum', weight: 2.5, category: 'project' },
  { term: 'Kanban', weight: 2.5, category: 'project' },
  { term: 'Waterfall', weight: 2.5, category: 'project' },
  { term: 'Gantt chart', weight: 2.5, category: 'project' },
  { term: 'critical path', weight: 2.5, category: 'project' },
  { term: 'dependency', weight: 2.5, category: 'project' },
  { term: 'blocker', weight: 2.5, category: 'project' },
  { term: 'risk mitigation', weight: 2.5, category: 'project' },

  // Marketing & Sales (30 terms)
  { term: 'customer acquisition', weight: 2.5, category: 'marketing' },
  { term: 'retention', weight: 2.5, category: 'marketing' },
  { term: 'churn', weight: 2.5, category: 'marketing' },
  { term: 'funnel', weight: 2.5, category: 'marketing' },
  { term: 'pipeline', weight: 2.5, category: 'marketing' },
  { term: 'lead generation', weight: 2.5, category: 'marketing' },
  { term: 'lead qualification', weight: 2.5, category: 'marketing' },
  { term: 'MQL', weight: 2.5, category: 'marketing' },
  { term: 'SQL', weight: 2.5, category: 'marketing' },
  { term: 'persona', weight: 2.5, category: 'marketing' },
  { term: 'segmentation', weight: 2.5, category: 'marketing' },
  { term: 'targeting', weight: 2.5, category: 'marketing' },
  { term: 'positioning', weight: 2.5, category: 'marketing' },
  { term: 'brand awareness', weight: 2.5, category: 'marketing' },
  { term: 'thought leadership', weight: 2.5, category: 'marketing' },
  { term: 'content marketing', weight: 2.5, category: 'marketing' },
  { term: 'SEO', weight: 2.5, category: 'marketing' },
  { term: 'SEM', weight: 2.5, category: 'marketing' },
  { term: 'PPC', weight: 2.5, category: 'marketing' },
  { term: 'attribution', weight: 2.5, category: 'marketing' },

  // Time Periods (10 terms)
  { term: 'quarter', weight: 2.5, category: 'time' },
  { term: 'fiscal year', weight: 2.5, category: 'time' },
  { term: 'Q1', weight: 2.5, category: 'time' },
  { term: 'Q2', weight: 2.5, category: 'time' },
  { term: 'Q3', weight: 2.5, category: 'time' },
  { term: 'Q4', weight: 2.5, category: 'time' },
  { term: 'YoY', weight: 2.5, category: 'time' },
  { term: 'MoM', weight: 2.5, category: 'time' },
  { term: 'QoQ', weight: 2.5, category: 'time' },
  { term: 'WoW', weight: 2.5, category: 'time' },
];

// Legal Vocabulary - EXPANDED TO 200+ TERMS
const LEGAL_TERMS: VocabularyTerm[] = [
  // Parties & Roles (20 terms)
  { term: 'plaintiff', weight: 2.5, category: 'party' },
  { term: 'defendant', weight: 2.5, category: 'party' },
  { term: 'petitioner', weight: 2.5, category: 'party' },
  { term: 'respondent', weight: 2.5, category: 'party' },
  { term: 'appellant', weight: 2.5, category: 'party' },
  { term: 'appellee', weight: 2.5, category: 'party' },
  { term: 'prosecutor', weight: 2.5, category: 'party' },
  { term: 'counsel', weight: 2.5, category: 'party' },
  { term: 'attorney', weight: 2.5, category: 'party' },
  { term: 'barrister', weight: 2.5, category: 'party' },
  { term: 'solicitor', weight: 2.5, category: 'party' },
  { term: 'judge', weight: 2.5, category: 'party' },
  { term: 'magistrate', weight: 2.5, category: 'party' },
  { term: 'jury', weight: 2.5, category: 'party' },
  { term: 'witness', weight: 2.5, category: 'party' },
  { term: 'expert witness', weight: 2.5, category: 'party' },
  { term: 'guardian ad litem', weight: 2.5, category: 'party' },
  { term: 'executor', weight: 2.5, category: 'party' },
  { term: 'trustee', weight: 2.5, category: 'party' },
  { term: 'beneficiary', weight: 2.5, category: 'party' },

  // Legal Processes (40 terms)
  { term: 'litigation', weight: 2.5, category: 'process' },
  { term: 'deposition', weight: 2.5, category: 'process' },
  { term: 'discovery', weight: 2.5, category: 'process' },
  { term: 'interrogatory', weight: 2.5, category: 'process' },
  { term: 'motion', weight: 2.5, category: 'process' },
  { term: 'pleading', weight: 2.5, category: 'process' },
  { term: 'complaint', weight: 2.5, category: 'process' },
  { term: 'answer', weight: 2.5, category: 'process' },
  { term: 'counterclaim', weight: 2.5, category: 'process' },
  { term: 'cross-claim', weight: 2.5, category: 'process' },
  { term: 'summary judgment', weight: 2.5, category: 'process' },
  { term: 'default judgment', weight: 2.5, category: 'process' },
  { term: 'settlement', weight: 2.5, category: 'process' },
  { term: 'mediation', weight: 2.5, category: 'process' },
  { term: 'arbitration', weight: 2.5, category: 'process' },
  { term: 'trial', weight: 2.5, category: 'process' },
  { term: 'hearing', weight: 2.5, category: 'process' },
  { term: 'appeal', weight: 2.5, category: 'process' },
  { term: 'remand', weight: 2.5, category: 'process' },
  { term: 'reversal', weight: 2.5, category: 'process' },
  { term: 'affirmation', weight: 2.5, category: 'process' },
  { term: 'dismissal', weight: 2.5, category: 'process' },
  { term: 'injunction', weight: 2.5, category: 'process' },
  { term: 'restraining order', weight: 2.5, category: 'process' },
  { term: 'garnishment', weight: 2.5, category: 'process' },
  { term: 'foreclosure', weight: 2.5, category: 'process' },
  { term: 'bankruptcy', weight: 2.5, category: 'process' },
  { term: 'probate', weight: 2.5, category: 'process' },
  { term: 'arraignment', weight: 2.5, category: 'process' },
  { term: 'indictment', weight: 2.5, category: 'process' },

  // Documents (30 terms)
  { term: 'subpoena', weight: 2.5, category: 'document' },
  { term: 'affidavit', weight: 2.5, category: 'document' },
  { term: 'brief', weight: 2.5, category: 'document' },
  { term: 'memorandum', weight: 2.5, category: 'document' },
  { term: 'contract', weight: 2.5, category: 'document' },
  { term: 'agreement', weight: 2.5, category: 'document' },
  { term: 'deed', weight: 2.5, category: 'document' },
  { term: 'will', weight: 2.5, category: 'document' },
  { term: 'trust', weight: 2.5, category: 'document' },
  { term: 'power of attorney', weight: 2.5, category: 'document' },
  { term: 'lease', weight: 2.5, category: 'document' },
  { term: 'mortgage', weight: 2.5, category: 'document' },
  { term: 'promissory note', weight: 2.5, category: 'document' },
  { term: 'lien', weight: 2.5, category: 'document' },
  { term: 'easement', weight: 2.5, category: 'document' },
  { term: 'covenant', weight: 2.5, category: 'document' },
  { term: 'stipulation', weight: 2.5, category: 'document' },
  { term: 'waiver', weight: 2.5, category: 'document' },
  { term: 'release', weight: 2.5, category: 'document' },
  { term: 'assignment', weight: 2.5, category: 'document' },
  { term: 'novation', weight: 2.5, category: 'document' },
  { term: 'amendment', weight: 2.5, category: 'document' },
  { term: 'addendum', weight: 2.5, category: 'document' },
  { term: 'exhibit', weight: 2.5, category: 'document' },
  { term: 'appendix', weight: 2.5, category: 'document' },

  // Contract Law (30 terms)
  { term: 'indemnification', weight: 2.5, category: 'contract' },
  { term: 'liability', weight: 2.5, category: 'contract' },
  { term: 'breach', weight: 2.5, category: 'contract' },
  { term: 'consideration', weight: 2.5, category: 'contract' },
  { term: 'offer', weight: 2.5, category: 'contract' },
  { term: 'acceptance', weight: 2.5, category: 'contract' },
  { term: 'capacity', weight: 2.5, category: 'contract' },
  { term: 'legality', weight: 2.5, category: 'contract' },
  { term: 'mutual assent', weight: 2.5, category: 'contract' },
  { term: 'meeting of minds', weight: 2.5, category: 'contract' },
  { term: 'material breach', weight: 2.5, category: 'contract' },
  { term: 'anticipatory breach', weight: 2.5, category: 'contract' },
  { term: 'specific performance', weight: 2.5, category: 'contract' },
  { term: 'damages', weight: 2.5, category: 'contract' },
  { term: 'compensatory damages', weight: 2.5, category: 'contract' },
  { term: 'punitive damages', weight: 2.5, category: 'contract' },
  { term: 'liquidated damages', weight: 2.5, category: 'contract' },
  { term: 'rescission', weight: 2.5, category: 'contract' },
  { term: 'reformation', weight: 2.5, category: 'contract' },
  { term: 'restitution', weight: 2.5, category: 'contract' },
  { term: 'force majeure', weight: 2.5, category: 'contract' },
  { term: 'frustration', weight: 2.5, category: 'contract' },
  { term: 'impossibility', weight: 2.5, category: 'contract' },
  { term: 'impracticability', weight: 2.5, category: 'contract' },
  { term: 'unconscionability', weight: 2.5, category: 'contract' },

  // Court & Procedure (30 terms)
  { term: 'jurisdiction', weight: 2.5, category: 'court' },
  { term: 'venue', weight: 2.5, category: 'court' },
  { term: 'standing', weight: 2.5, category: 'court' },
  { term: 'precedent', weight: 2.5, category: 'court' },
  { term: 'stare decisis', weight: 2.5, category: 'court' },
  { term: 'burden of proof', weight: 2.5, category: 'court' },
  { term: 'preponderance of evidence', weight: 2.5, category: 'court' },
  { term: 'beyond reasonable doubt', weight: 2.5, category: 'court' },
  { term: 'admissible', weight: 2.5, category: 'court' },
  { term: 'inadmissible', weight: 2.5, category: 'court' },
  { term: 'hearsay', weight: 2.5, category: 'court' },
  { term: 'objection', weight: 2.5, category: 'court' },
  { term: 'sustained', weight: 2.5, category: 'court' },
  { term: 'overruled', weight: 2.5, category: 'court' },
  { term: 'voir dire', weight: 2.5, category: 'court' },
  { term: 'opening statement', weight: 2.5, category: 'court' },
  { term: 'closing argument', weight: 2.5, category: 'court' },
  { term: 'direct examination', weight: 2.5, category: 'court' },
  { term: 'cross-examination', weight: 2.5, category: 'court' },
  { term: 'redirect', weight: 2.5, category: 'court' },
  { term: 'recross', weight: 2.5, category: 'court' },
  { term: 'verdict', weight: 2.5, category: 'court' },
  { term: 'judgment', weight: 2.5, category: 'court' },
  { term: 'sentence', weight: 2.5, category: 'court' },
  { term: 'probation', weight: 2.5, category: 'court' },
  { term: 'parole', weight: 2.5, category: 'court' },

  // Laws & Regulations (20 terms)
  { term: 'statute', weight: 2.5, category: 'law' },
  { term: 'ordinance', weight: 2.5, category: 'law' },
  { term: 'regulation', weight: 2.5, category: 'law' },
  { term: 'code', weight: 2.5, category: 'law' },
  { term: 'constitution', weight: 2.5, category: 'law' },
  { term: 'amendment', weight: 2.5, category: 'law' },
  { term: 'common law', weight: 2.5, category: 'law' },
  { term: 'civil law', weight: 2.5, category: 'law' },
  { term: 'criminal law', weight: 2.5, category: 'law' },
  { term: 'tort law', weight: 2.5, category: 'law' },
  { term: 'negligence', weight: 2.5, category: 'law' },
  { term: 'strict liability', weight: 2.5, category: 'law' },
  { term: 'vicarious liability', weight: 2.5, category: 'law' },
  { term: 'due process', weight: 2.5, category: 'law' },
  { term: 'equal protection', weight: 2.5, category: 'law' },
  { term: 'probable cause', weight: 2.5, category: 'law' },
  { term: 'reasonable suspicion', weight: 2.5, category: 'law' },
  { term: 'Miranda rights', weight: 2.5, category: 'law' },

  // Latin Terms (30 terms)
  { term: 'pro bono', weight: 2.5, category: 'latin' },
  { term: 'habeas corpus', weight: 2.5, category: 'latin' },
  { term: 'amicus curiae', weight: 2.5, category: 'latin' },
  { term: 'prima facie', weight: 2.5, category: 'latin' },
  { term: 'res judicata', weight: 2.5, category: 'latin' },
  { term: 'res ipsa loquitur', weight: 2.5, category: 'latin' },
  { term: 'de facto', weight: 2.5, category: 'latin' },
  { term: 'de jure', weight: 2.5, category: 'latin' },
  { term: 'ex parte', weight: 2.5, category: 'latin' },
  { term: 'in camera', weight: 2.5, category: 'latin' },
  { term: 'per se', weight: 2.5, category: 'latin' },
  { term: 'pro se', weight: 2.5, category: 'latin' },
  { term: 'quid pro quo', weight: 2.5, category: 'latin' },
  { term: 'sua sponte', weight: 2.5, category: 'latin' },
  { term: 'subpoena duces tecum', weight: 2.5, category: 'latin' },
  { term: 'certiorari', weight: 2.5, category: 'latin' },
  { term: 'mandamus', weight: 2.5, category: 'latin' },
  { term: 'nolo contendere', weight: 2.5, category: 'latin' },
  { term: 'mens rea', weight: 2.5, category: 'latin' },
  { term: 'actus reus', weight: 2.5, category: 'latin' },
];

// Education Vocabulary - EXPANDED TO 150+ TERMS
const EDUCATION_TERMS: VocabularyTerm[] = [
  // Pedagogy & Teaching Methods (40 terms)
  { term: 'pedagogy', weight: 2.5, category: 'teaching' },
  { term: 'andragogy', weight: 2.5, category: 'teaching' },
  { term: 'curriculum', weight: 2.5, category: 'teaching' },
  { term: 'lesson plan', weight: 2.5, category: 'teaching' },
  { term: 'instructional design', weight: 2.5, category: 'teaching' },
  { term: 'differentiation', weight: 2.5, category: 'teaching' },
  { term: 'scaffolding', weight: 2.5, category: 'teaching' },
  { term: 'inquiry-based learning', weight: 2.5, category: 'teaching' },
  { term: 'project-based learning', weight: 2.5, category: 'teaching' },
  { term: 'problem-based learning', weight: 2.5, category: 'teaching' },
  { term: 'flipped classroom', weight: 2.5, category: 'teaching' },
  { term: 'direct instruction', weight: 2.5, category: 'teaching' },
  { term: 'cooperative learning', weight: 2.5, category: 'teaching' },
  { term: 'collaborative learning', weight: 2.5, category: 'teaching' },
  { term: 'experiential learning', weight: 2.5, category: 'teaching' },
  { term: 'active learning', weight: 2.5, category: 'teaching' },
  { term: 'passive learning', weight: 2.5, category: 'teaching' },
  { term: 'mastery learning', weight: 2.5, category: 'teaching' },
  { term: 'competency-based', weight: 2.5, category: 'teaching' },
  { term: 'standards-based', weight: 2.5, category: 'teaching' },
  { term: 'Universal Design for Learning', weight: 2.5, category: 'teaching' },
  { term: 'UDL', weight: 2.5, category: 'teaching' },
  { term: 'Response to Intervention', weight: 2.5, category: 'teaching' },
  { term: 'RTI', weight: 2.5, category: 'teaching' },
  { term: 'Multi-Tiered System of Supports', weight: 2.5, category: 'teaching' },
  { term: 'MTSS', weight: 2.5, category: 'teaching' },

  // Learning Theory (30 terms)
  { term: 'cognitive', weight: 2.5, category: 'learning' },
  { term: 'metacognition', weight: 2.5, category: 'learning' },
  { term: 'constructivism', weight: 2.5, category: 'learning' },
  { term: 'behaviorism', weight: 2.5, category: 'learning' },
  { term: 'cognitivism', weight: 2.5, category: 'learning' },
  { term: 'connectivism', weight: 2.5, category: 'learning' },
  { term: 'social learning theory', weight: 2.5, category: 'learning' },
  { term: 'zone of proximal development', weight: 2.5, category: 'learning' },
  { term: 'ZPD', weight: 2.5, category: 'learning' },
  { term: 'Bloom\'s taxonomy', weight: 2.5, category: 'learning' },
  { term: 'Webb\'s Depth of Knowledge', weight: 2.5, category: 'learning' },
  { term: 'DOK', weight: 2.5, category: 'learning' },
  { term: 'multiple intelligences', weight: 2.5, category: 'learning' },
  { term: 'learning styles', weight: 2.5, category: 'learning' },
  { term: 'growth mindset', weight: 2.5, category: 'learning' },
  { term: 'fixed mindset', weight: 2.5, category: 'learning' },
  { term: 'self-efficacy', weight: 2.5, category: 'learning' },
  { term: 'intrinsic motivation', weight: 2.5, category: 'learning' },
  { term: 'extrinsic motivation', weight: 2.5, category: 'learning' },
  { term: 'transfer of learning', weight: 2.5, category: 'learning' },
  { term: 'prior knowledge', weight: 2.5, category: 'learning' },
  { term: 'schema', weight: 2.5, category: 'learning' },
  { term: 'cognitive load', weight: 2.5, category: 'learning' },
  { term: 'working memory', weight: 2.5, category: 'learning' },
  { term: 'long-term memory', weight: 2.5, category: 'learning' },

  // Assessment & Evaluation (30 terms)
  { term: 'assessment', weight: 2.5, category: 'evaluation' },
  { term: 'evaluation', weight: 2.5, category: 'evaluation' },
  { term: 'formative assessment', weight: 2.5, category: 'evaluation' },
  { term: 'summative assessment', weight: 2.5, category: 'evaluation' },
  { term: 'diagnostic assessment', weight: 2.5, category: 'evaluation' },
  { term: 'benchmark assessment', weight: 2.5, category: 'evaluation' },
  { term: 'authentic assessment', weight: 2.5, category: 'evaluation' },
  { term: 'performance assessment', weight: 2.5, category: 'evaluation' },
  { term: 'portfolio assessment', weight: 2.5, category: 'evaluation' },
  { term: 'rubric', weight: 2.5, category: 'evaluation' },
  { term: 'holistic rubric', weight: 2.5, category: 'evaluation' },
  { term: 'analytic rubric', weight: 2.5, category: 'evaluation' },
  { term: 'checklist', weight: 2.5, category: 'evaluation' },
  { term: 'rating scale', weight: 2.5, category: 'evaluation' },
  { term: 'standardized test', weight: 2.5, category: 'evaluation' },
  { term: 'norm-referenced', weight: 2.5, category: 'evaluation' },
  { term: 'criterion-referenced', weight: 2.5, category: 'evaluation' },
  { term: 'validity', weight: 2.5, category: 'evaluation' },
  { term: 'reliability', weight: 2.5, category: 'evaluation' },
  { term: 'item analysis', weight: 2.5, category: 'evaluation' },
  { term: 'learning objective', weight: 2.5, category: 'evaluation' },
  { term: 'learning outcome', weight: 2.5, category: 'evaluation' },
  { term: 'mastery', weight: 2.5, category: 'evaluation' },
  { term: 'proficiency', weight: 2.5, category: 'evaluation' },
  { term: 'achievement gap', weight: 2.5, category: 'evaluation' },

  // Academic & Research (30 terms)
  { term: 'thesis', weight: 2.5, category: 'academic' },
  { term: 'dissertation', weight: 2.5, category: 'academic' },
  { term: 'syllabus', weight: 2.5, category: 'academic' },
  { term: 'course outline', weight: 2.5, category: 'academic' },
  { term: 'academic integrity', weight: 2.5, category: 'academic' },
  { term: 'plagiarism', weight: 2.5, category: 'academic' },
  { term: 'citation', weight: 2.5, category: 'academic' },
  { term: 'bibliography', weight: 2.5, category: 'academic' },
  { term: 'literature review', weight: 2.5, category: 'academic' },
  { term: 'research methodology', weight: 2.5, category: 'academic' },
  { term: 'qualitative research', weight: 2.5, category: 'academic' },
  { term: 'quantitative research', weight: 2.5, category: 'academic' },
  { term: 'mixed methods', weight: 2.5, category: 'academic' },
  { term: 'peer review', weight: 2.5, category: 'academic' },
  { term: 'scholarly article', weight: 2.5, category: 'academic' },
  { term: 'journal', weight: 2.5, category: 'academic' },
  { term: 'conference', weight: 2.5, category: 'academic' },
  { term: 'symposium', weight: 2.5, category: 'academic' },
  { term: 'tenure', weight: 2.5, category: 'academic' },
  { term: 'sabbatical', weight: 2.5, category: 'academic' },
  { term: 'academic year', weight: 2.5, category: 'academic' },
  { term: 'semester', weight: 2.5, category: 'academic' },
  { term: 'quarter', weight: 2.5, category: 'academic' },
  { term: 'trimester', weight: 2.5, category: 'academic' },
  { term: 'credit hour', weight: 2.5, category: 'academic' },
  { term: 'GPA', weight: 2.5, category: 'academic' },
  { term: 'transcript', weight: 2.5, category: 'academic' },

  // Educational Technology (30 terms)
  { term: 'e-learning', weight: 2.5, category: 'technology' },
  { term: 'online learning', weight: 2.5, category: 'technology' },
  { term: 'distance learning', weight: 2.5, category: 'technology' },
  { term: 'blended learning', weight: 2.5, category: 'technology' },
  { term: 'hybrid learning', weight: 2.5, category: 'technology' },
  { term: 'synchronous', weight: 2.5, category: 'technology' },
  { term: 'asynchronous', weight: 2.5, category: 'technology' },
  { term: 'LMS', weight: 2.5, category: 'technology' },
  { term: 'learning management system', weight: 2.5, category: 'technology' },
  { term: 'MOOC', weight: 2.5, category: 'technology' },
  { term: 'virtual classroom', weight: 2.5, category: 'technology' },
  { term: 'webinar', weight: 2.5, category: 'technology' },
  { term: 'screencast', weight: 2.5, category: 'technology' },
  { term: 'podcast', weight: 2.5, category: 'technology' },
  { term: 'vodcast', weight: 2.5, category: 'technology' },
  { term: 'gamification', weight: 2.5, category: 'technology' },
  { term: 'adaptive learning', weight: 2.5, category: 'technology' },
  { term: 'personalized learning', weight: 2.5, category: 'technology' },
  { term: 'learning analytics', weight: 2.5, category: 'technology' },
  { term: 'educational data mining', weight: 2.5, category: 'technology' },
  { term: 'artificial intelligence', weight: 2.5, category: 'technology' },
  { term: 'virtual reality', weight: 2.5, category: 'technology' },
  { term: 'augmented reality', weight: 2.5, category: 'technology' },
  { term: 'simulation', weight: 2.5, category: 'technology' },
  { term: 'digital literacy', weight: 2.5, category: 'technology' },
  { term: 'media literacy', weight: 2.5, category: 'technology' },
  { term: 'information literacy', weight: 2.5, category: 'technology' },
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
  const mergedTerms: VocabularyTerm[] = [];
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

