/**
 * VoiceCode Demo Project
 * This is a sample project for demonstrating VoiceCode extension features
 */

import { formatDate, capitalize, debounce, isEmpty } from './utils/helpers';

// Example usage of helper functions
const today = new Date();
console.log('Today is:', formatDate(today));

const name = 'john doe';
console.log('Capitalized:', capitalize(name));

// Debounced search function
const handleSearch = debounce((query: string) => {
  console.log('Searching for:', query);
}, 300);

// Check if values are empty
console.log('Is empty string empty?', isEmpty(''));
console.log('Is empty array empty?', isEmpty([]));
console.log('Is null empty?', isEmpty(null));

export { formatDate, capitalize, debounce, isEmpty };

