import { describe, it, expect } from 'vitest';

const processVoiceCommands = (
  text: string,
  enabled: boolean = true
): string => {
  if (!enabled) return text;

  let processedText = text;

  const commands: { [key: string]: string } = {
    comma: ',',
    period: '.',
    'question mark': '?',
    'exclamation point': '!',
    'exclamation mark': '!',
    colon: ':',
    semicolon: ';',
    'new line': '\n',
    'new paragraph': '\n\n',
  };

  for (const [command, symbol] of Object.entries(commands)) {
    const regex = new RegExp(`\\b${command}\\b`, 'gi');
    processedText = processedText.replace(regex, symbol);
  }

  return processedText;
};

describe('Voice Commands Processing', () => {
  describe('Punctuation Commands', () => {
    it('should replace "comma" with ","', () => {
      const result = processVoiceCommands('hello comma world');
      expect(result).toBe('hello , world');
    });

    it('should replace "period" with "."', () => {
      const result = processVoiceCommands('hello period');
      expect(result).toBe('hello .');
    });

    it('should replace "question mark" with "?"', () => {
      const result = processVoiceCommands('how are you question mark');
      expect(result).toBe('how are you ?');
    });

    it('should replace "exclamation point" with "!"', () => {
      const result = processVoiceCommands('wow exclamation point');
      expect(result).toBe('wow !');
    });

    it('should replace "exclamation mark" with "!"', () => {
      const result = processVoiceCommands('amazing exclamation mark');
      expect(result).toBe('amazing !');
    });

    it('should replace "colon" with ":"', () => {
      const result = processVoiceCommands('note colon');
      expect(result).toBe('note :');
    });

    it('should replace "semicolon" with ";"', () => {
      const result = processVoiceCommands('first semicolon second');
      expect(result).toBe('first ; second');
    });
  });

  describe('Line Break Commands', () => {
    it('should replace "new line" with line break', () => {
      const result = processVoiceCommands('first line new line second line');
      expect(result).toBe('first line \n second line');
    });

    it('should replace "new paragraph" with double line break', () => {
      const result = processVoiceCommands(
        'paragraph one new paragraph paragraph two'
      );
      expect(result).toBe('paragraph one \n\n paragraph two');
    });
  });

  describe('Case Insensitivity', () => {
    it('should handle uppercase commands', () => {
      const result = processVoiceCommands('hello COMMA world');
      expect(result).toBe('hello , world');
    });

    it('should handle mixed case commands', () => {
      const result = processVoiceCommands('hello Period');
      expect(result).toBe('hello .');
    });
  });

  describe('Multiple Commands', () => {
    it('should replace multiple commands in one string', () => {
      const result = processVoiceCommands(
        'hello comma how are you question mark'
      );
      expect(result).toBe('hello , how are you ?');
    });
  });

  describe('Disabled Commands', () => {
    it('should return original text when commands are disabled', () => {
      const result = processVoiceCommands('hello comma world', false);
      expect(result).toBe('hello comma world');
    });
  });
});
