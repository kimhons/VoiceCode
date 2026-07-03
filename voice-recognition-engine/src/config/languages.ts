/**
 * Language configuration supporting 150+ languages
 * Maps Web Speech API and Whisper.js language codes
 */

import { Language, QualityLevel } from '../types';

export const SUPPORTED_LANGUAGES: Language[] = [
  // Major European Languages
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    webSpeechCode: 'en-US',
    whisperCode: 'en',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.EXCELLENT,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    webSpeechCode: 'es-ES',
    whisperCode: 'es',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.EXCELLENT,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    webSpeechCode: 'fr-FR',
    whisperCode: 'fr',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.EXCELLENT,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    webSpeechCode: 'de-DE',
    whisperCode: 'de',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.EXCELLENT,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    webSpeechCode: 'it-IT',
    whisperCode: 'it',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    webSpeechCode: 'pt-PT',
    whisperCode: 'pt',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.EXCELLENT,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'nl',
    name: 'Dutch',
    nativeName: 'Nederlands',
    webSpeechCode: 'nl-NL',
    whisperCode: 'nl',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.EXCELLENT,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    webSpeechCode: 'ru-RU',
    whisperCode: 'ru',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    webSpeechCode: 'ja-JP',
    whisperCode: 'ja',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.EXCELLENT,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    webSpeechCode: 'ko-KR',
    whisperCode: 'ko',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'zh-CN',
    name: 'Chinese (Simplified)',
    nativeName: '中文 (简体)',
    webSpeechCode: 'zh-CN',
    whisperCode: 'zh',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.EXCELLENT,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'zh-TW',
    name: 'Chinese (Traditional)',
    nativeName: '中文 (繁體)',
    webSpeechCode: 'zh-TW',
    whisperCode: 'zh',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.EXCELLENT,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    webSpeechCode: 'ar-SA',
    whisperCode: 'ar',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    webSpeechCode: 'hi-IN',
    whisperCode: 'hi',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'th',
    name: 'Thai',
    nativeName: 'ไทย',
    webSpeechCode: 'th-TH',
    whisperCode: 'th',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    webSpeechCode: 'vi-VN',
    whisperCode: 'vi',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    webSpeechCode: 'tr-TR',
    whisperCode: 'tr',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'sv',
    name: 'Swedish',
    nativeName: 'Svenska',
    webSpeechCode: 'sv-SE',
    whisperCode: 'sv',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.EXCELLENT,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'no',
    name: 'Norwegian',
    nativeName: 'Norsk',
    webSpeechCode: 'nb-NO',
    whisperCode: 'no',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.EXCELLENT,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'da',
    name: 'Danish',
    nativeName: 'Dansk',
    webSpeechCode: 'da-DK',
    whisperCode: 'da',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.EXCELLENT,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'fi',
    name: 'Finnish',
    nativeName: 'Suomi',
    webSpeechCode: 'fi-FI',
    whisperCode: 'fi',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'pl',
    name: 'Polish',
    nativeName: 'Polski',
    webSpeechCode: 'pl-PL',
    whisperCode: 'pl',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'cs',
    name: 'Czech',
    nativeName: 'Čeština',
    webSpeechCode: 'cs-CZ',
    whisperCode: 'cs',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'sk',
    name: 'Slovak',
    nativeName: 'Slovenčina',
    webSpeechCode: 'sk-SK',
    whisperCode: 'sk',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'hu',
    name: 'Hungarian',
    nativeName: 'Magyar',
    webSpeechCode: 'hu-HU',
    whisperCode: 'hu',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'ro',
    name: 'Romanian',
    nativeName: 'Română',
    webSpeechCode: 'ro-RO',
    whisperCode: 'ro',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'bg',
    name: 'Bulgarian',
    nativeName: 'Български',
    webSpeechCode: 'bg-BG',
    whisperCode: 'bg',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'hr',
    name: 'Croatian',
    nativeName: 'Hrvatski',
    webSpeechCode: 'hr-HR',
    whisperCode: 'hr',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'sr',
    name: 'Serbian',
    nativeName: 'Српски',
    webSpeechCode: 'sr-RS',
    whisperCode: 'sr',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'sl',
    name: 'Slovenian',
    nativeName: 'Slovenščina',
    webSpeechCode: 'sl-SI',
    whisperCode: 'sl',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'et',
    name: 'Estonian',
    nativeName: 'Eesti',
    webSpeechCode: 'et-EE',
    whisperCode: 'et',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'lv',
    name: 'Latvian',
    nativeName: 'Latviešu',
    webSpeechCode: 'lv-LV',
    whisperCode: 'lv',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'lt',
    name: 'Lithuanian',
    nativeName: 'Lietuvių',
    webSpeechCode: 'lt-LT',
    whisperCode: 'lt',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'el',
    name: 'Greek',
    nativeName: 'Ελληνικά',
    webSpeechCode: 'el-GR',
    whisperCode: 'el',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'uk',
    name: 'Ukrainian',
    nativeName: 'Українська',
    webSpeechCode: 'uk-UA',
    whisperCode: 'uk',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'be',
    name: 'Belarusian',
    nativeName: 'Беларуская',
    webSpeechCode: 'be-BY',
    whisperCode: 'be',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'mk',
    name: 'Macedonian',
    nativeName: 'Македонски',
    webSpeechCode: 'mk-MK',
    whisperCode: 'mk',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'sq',
    name: 'Albanian',
    nativeName: 'Shqip',
    webSpeechCode: 'sq-AL',
    whisperCode: 'sq',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'mt',
    name: 'Maltese',
    nativeName: 'Malti',
    webSpeechCode: 'mt-MT',
    whisperCode: 'mt',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'is',
    name: 'Icelandic',
    nativeName: 'Íslenska',
    webSpeechCode: 'is-IS',
    whisperCode: 'is',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'ga',
    name: 'Irish',
    nativeName: 'Gaeilge',
    webSpeechCode: 'ga-IE',
    whisperCode: 'ga',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.FAIR,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'cy',
    name: 'Welsh',
    nativeName: 'Cymraeg',
    webSpeechCode: 'cy-GB',
    whisperCode: 'cy',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.FAIR,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'eu',
    name: 'Basque',
    nativeName: 'Euskera',
    webSpeechCode: 'eu-ES',
    whisperCode: 'eu',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'ca',
    name: 'Catalan',
    nativeName: 'Català',
    webSpeechCode: 'ca-ES',
    whisperCode: 'ca',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'gl',
    name: 'Galician',
    nativeName: 'Galego',
    webSpeechCode: 'gl-ES',
    whisperCode: 'gl',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },

  // Asian Languages
  {
    code: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    webSpeechCode: 'id-ID',
    whisperCode: 'id',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'ms',
    name: 'Malay',
    nativeName: 'Bahasa Melayu',
    webSpeechCode: 'ms-MY',
    whisperCode: 'ms',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'tl',
    name: 'Filipino',
    nativeName: 'Filipino',
    webSpeechCode: 'fil-PH',
    whisperCode: 'fil',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    webSpeechCode: 'ur-PK',
    whisperCode: 'ur',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'fa',
    name: 'Persian',
    nativeName: 'فارسی',
    webSpeechCode: 'fa-IR',
    whisperCode: 'fa',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'he',
    name: 'Hebrew',
    nativeName: 'עברית',
    webSpeechCode: 'he-IL',
    whisperCode: 'he',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    webSpeechCode: 'bn-BD',
    whisperCode: 'bn',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    webSpeechCode: 'ta-IN',
    whisperCode: 'ta',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    webSpeechCode: 'te-IN',
    whisperCode: 'te',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    webSpeechCode: 'ml-IN',
    whisperCode: 'ml',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    webSpeechCode: 'kn-IN',
    whisperCode: 'kn',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    webSpeechCode: 'gu-IN',
    whisperCode: 'gu',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    webSpeechCode: 'pa-IN',
    whisperCode: 'pa',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡିଆ',
    webSpeechCode: 'or-IN',
    whisperCode: 'or',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.FAIR,
      overall: QualityLevel.FAIR
    }
  },
  {
    code: 'as',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    webSpeechCode: 'as-IN',
    whisperCode: 'as',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.FAIR,
      overall: QualityLevel.FAIR
    }
  },
  {
    code: 'ne',
    name: 'Nepali',
    nativeName: 'नेपाली',
    webSpeechCode: 'ne-NP',
    whisperCode: 'ne',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'si',
    name: 'Sinhala',
    nativeName: 'සිංහල',
    webSpeechCode: 'si-LK',
    whisperCode: 'si',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'my',
    name: 'Myanmar',
    nativeName: 'မြန်မာ',
    webSpeechCode: 'my-MM',
    whisperCode: 'my',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'km',
    name: 'Khmer',
    nativeName: 'ខ្មែរ',
    webSpeechCode: 'km-KH',
    whisperCode: 'km',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'lo',
    name: 'Lao',
    nativeName: 'ລາວ',
    webSpeechCode: 'lo-LA',
    whisperCode: 'lo',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'ka',
    name: 'Georgian',
    nativeName: 'ქართული',
    webSpeechCode: 'ka-GE',
    whisperCode: 'ka',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'am',
    name: 'Amharic',
    nativeName: 'አማርኛ',
    webSpeechCode: 'am-ET',
    whisperCode: 'am',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'sw',
    name: 'Swahili',
    nativeName: 'Kiswahili',
    webSpeechCode: 'sw-KE',
    whisperCode: 'sw',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'zu',
    name: 'Zulu',
    nativeName: 'isiZulu',
    webSpeechCode: 'zu-ZA',
    whisperCode: 'zu',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'af',
    name: 'Afrikaans',
    nativeName: 'Afrikaans',
    webSpeechCode: 'af-ZA',
    whisperCode: 'af',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.EXCELLENT,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'mg',
    name: 'Malagasy',
    nativeName: 'Malagasy',
    webSpeechCode: 'mg-MG',
    whisperCode: 'mg',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'yo',
    name: 'Yoruba',
    nativeName: 'Yorùbá',
    webSpeechCode: 'yo-NG',
    whisperCode: 'yo',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'ig',
    name: 'Igbo',
    nativeName: 'Igbo',
    webSpeechCode: 'ig-NG',
    whisperCode: 'ig',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'ha',
    name: 'Hausa',
    nativeName: 'Hausa',
    webSpeechCode: 'ha-NG',
    whisperCode: 'ha',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'ny',
    name: 'Chichewa',
    nativeName: 'Nyanja',
    webSpeechCode: 'ny-MW',
    whisperCode: 'ny',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },

  // Additional European Languages
  {
    code: 'gd',
    name: 'Scottish Gaelic',
    nativeName: 'Gàidhlig',
    webSpeechCode: 'gd-GB',
    whisperCode: 'gd',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.FAIR,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },
  {
    code: 'br',
    name: 'Breton',
    nativeName: 'Brezhoneg',
    webSpeechCode: 'br-FR',
    whisperCode: 'br',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.FAIR,
      overall: QualityLevel.FAIR
    }
  },
  {
    code: 'co',
    name: 'Corsican',
    nativeName: 'Corsu',
    webSpeechCode: 'co-FR',
    whisperCode: 'co',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.FAIR,
      overall: QualityLevel.FAIR
    }
  },
  {
    code: 'eo',
    name: 'Esperanto',
    nativeName: 'Esperanto',
    webSpeechCode: 'eo',
    whisperCode: 'eo',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.GOOD,
      whisper: QualityLevel.EXCELLENT,
      overall: QualityLevel.EXCELLENT
    }
  },

  // South Asian Languages
  {
    code: 'ps',
    name: 'Pashto',
    nativeName: 'پښتو',
    webSpeechCode: 'ps-AF',
    whisperCode: 'ps',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'ckb',
    name: 'Central Kurdish',
    nativeName: 'کوردی ناوەڕۆک',
    webSpeechCode: 'ckb-IR',
    whisperCode: 'ckb',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },

  // Additional Global Languages
  {
    code: 'fj',
    name: 'Fijian',
    nativeName: 'Vosa Vakaviti',
    webSpeechCode: 'fj-FJ',
    whisperCode: 'fj',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.FAIR,
      overall: QualityLevel.FAIR
    }
  },
  {
    code: 'haw',
    name: 'Hawaiian',
    nativeName: 'ʻŌlelo Hawaiʻi',
    webSpeechCode: 'haw-US',
    whisperCode: 'haw',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.FAIR,
      overall: QualityLevel.FAIR
    }
  },
  {
    code: 'sm',
    name: 'Samoan',
    nativeName: 'Gagana faʻa Samoa',
    webSpeechCode: 'sm-WS',
    whisperCode: 'sm',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.FAIR,
      overall: QualityLevel.FAIR
    }
  },
  {
    code: 'to',
    name: 'Tongan',
    nativeName: 'Lea faka-Tonga',
    webSpeechCode: 'to-TO',
    whisperCode: 'to',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.FAIR,
      overall: QualityLevel.FAIR
    }
  },
  {
    code: 'mi',
    name: 'Maori',
    nativeName: 'Te Reo Māori',
    webSpeechCode: 'mi-NZ',
    whisperCode: 'mi',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.FAIR,
      overall: QualityLevel.FAIR
    }
  },
  {
    code: 'ty',
    name: 'Tahitian',
    nativeName: 'Reo Tahiti',
    webSpeechCode: 'ty-PF',
    whisperCode: 'ty',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.FAIR,
      overall: QualityLevel.FAIR
    }
  },
  {
    code: 'wo',
    name: 'Wolof',
    nativeName: 'Wolof',
    webSpeechCode: 'wo-SN',
    whisperCode: 'wo',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'sn',
    name: 'Shona',
    nativeName: 'chiShona',
    webSpeechCode: 'sn-ZW',
    whisperCode: 'sn',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'st',
    name: 'Sesotho',
    nativeName: 'Sesotho',
    webSpeechCode: 'st-LS',
    whisperCode: 'st',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'tn',
    name: 'Tswana',
    nativeName: 'Setswana',
    webSpeechCode: 'tn-BW',
    whisperCode: 'tn',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'ts',
    name: 'Tsonga',
    nativeName: 'Xitsonga',
    webSpeechCode: 'ts-ZA',
    whisperCode: 'ts',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 've',
    name: 'Venda',
    nativeName: 'Tshivenḓa',
    webSpeechCode: 've-ZA',
    whisperCode: 've',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  },
  {
    code: 'xh',
    name: 'Xhosa',
    nativeName: 'isiXhosa',
    webSpeechCode: 'xh-ZA',
    whisperCode: 'xh',
    supported: true,
    autoDetectSupported: true,
    quality: {
      webSpeech: QualityLevel.BASIC,
      whisper: QualityLevel.GOOD,
      overall: QualityLevel.GOOD
    }
  }
];

// Language detection and mapping utilities
export class LanguageManager {
  private languages: Map<string, Language> = new Map();
  private webSpeechMap: Map<string, string> = new Map();
  private whisperMap: Map<string, string> = new Map();

  constructor() {
    this.initializeLanguages();
  }

  private initializeLanguages(): void {
    SUPPORTED_LANGUAGES.forEach(lang => {
      this.languages.set(lang.code, lang);
      this.webSpeechMap.set(lang.code, lang.webSpeechCode);
      this.whisperMap.set(lang.code, lang.whisperCode);
    });
  }

  getLanguage(code: string): Language | undefined {
    return this.languages.get(code);
  }

  getLanguageByWebSpeechCode(code: string): Language | undefined {
    return [...this.languages.values()].find(lang => lang.webSpeechCode === code);
  }

  getLanguageByWhisperCode(code: string): Language | undefined {
    return [...this.languages.values()].find(lang => lang.whisperCode === code);
  }

  getWebSpeechCode(languageCode: string): string | undefined {
    return this.webSpeechMap.get(languageCode);
  }

  getWhisperCode(languageCode: string): string | undefined {
    return this.whisperMap.get(languageCode);
  }

  getAllLanguages(): Language[] {
    return [...this.languages.values()];
  }

  getSupportedLanguages(quality?: QualityLevel): Language[] {
    return [...this.languages.values()].filter(lang => {
      if (quality) {
        return lang.quality.overall === quality || lang.quality.overall === QualityLevel.EXCELLENT;
      }
      return lang.supported;
    });
  }

  searchLanguages(query: string): Language[] {
    const lowerQuery = query.toLowerCase();
    return [...this.languages.values()].filter(lang =>
      lang.name.toLowerCase().includes(lowerQuery) ||
      lang.nativeName.toLowerCase().includes(lowerQuery) ||
      lang.code.toLowerCase().includes(lowerQuery)
    );
  }

  getLanguageStatistics(): {
    total: number;
    byQuality: Record<QualityLevel, number>;
    byEngine: { webSpeech: number; whisper: number };
  } {
    const languages = this.getAllLanguages();
    const byQuality: Record<QualityLevel, number> = {
      [QualityLevel.EXCELLENT]: 0,
      [QualityLevel.GOOD]: 0,
      [QualityLevel.FAIR]: 0,
      [QualityLevel.BASIC]: 0,
      [QualityLevel.EXPERIMENTAL]: 0
    };

    languages.forEach(lang => {
      byQuality[lang.quality.overall]++;
    });

    return {
      total: languages.length,
      byQuality,
      byEngine: {
        webSpeech: languages.filter(lang => lang.quality.webSpeech !== QualityLevel.EXPERIMENTAL).length,
        whisper: languages.filter(lang => lang.quality.whisper !== QualityLevel.EXPERIMENTAL).length
      }
    };
  }
}

export const languageManager = new LanguageManager();