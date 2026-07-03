/**
 * AIML API Service (kebab-case export)
 * Re-exports from aiFeaturesService.ts for compatibility
 * Note: This is a compatibility layer - the actual AIML API logic is in aiFeaturesService
 */

export * from './aiFeaturesService';

// Professional Mode Types
export enum ProfessionalMode {
  MEDICAL = 'medical',
  LEGAL = 'legal',
  TECHNICAL = 'technical',
  BUSINESS = 'business',
  ACADEMIC = 'academic',
  DEVELOPER = 'developer',
  EDUCATION = 'education',
  GENERAL = 'general',
}

// AIML API Service Instance
export const aimlApiService = {
  // Placeholder for AIML API service methods
  // Actual implementation in aiFeaturesService
};

