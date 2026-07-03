# VoiceFlow PRO Icon Requirements

## Required Files

### 1. icon.png (REQUIRED for Marketplace)
- **Size**: 256x256 pixels (minimum 128x128)
- **Format**: PNG with transparency
- **Design**: 
  - Microphone icon with code/AI elements
  - Blue gradient (#007AFF to #0051D5)
  - Clean, modern, professional
  - Recognizable at small sizes (16x16)

### 2. icon.svg (REQUIRED for Activity Bar)
- **Format**: SVG
- **Size**: Scalable (design for 24x24 base)
- **Colors**: Monochrome or theme-aware
- **Design**: Simplified version of icon.png

## Design Guidelines

### Color Palette
- **Primary**: #007AFF (VSCode blue)
- **Secondary**: #0051D5 (Darker blue)
- **Accent**: #4CAF50 (Success green)
- **Background**: Transparent

### Icon Concept
```
Main Element: Microphone (🎤)
Secondary Elements:
- Code brackets { }
- AI sparkle ✨
- Sound waves 〰️
```

### Design Tools
- **Figma**: https://www.figma.com
- **Canva**: https://www.canva.com
- **Adobe Illustrator**: Professional design
- **Inkscape**: Free SVG editor

## Quick Creation Steps

### Option 1: Use AI Image Generator
1. Go to DALL-E, Midjourney, or Stable Diffusion
2. Prompt: "Modern minimalist icon for voice coding assistant, microphone with code brackets, blue gradient, 256x256, transparent background, professional"
3. Download and save as `icon.png`

### Option 2: Use Figma Template
1. Create 256x256 frame
2. Add microphone icon from Iconify
3. Add code brackets { }
4. Apply blue gradient
5. Export as PNG (2x for retina)

### Option 3: Hire Designer
- **Fiverr**: $5-50 for icon design
- **99designs**: Professional contest
- **Upwork**: Freelance designer

## Temporary Placeholder

Until professional icon is created, use this SVG code:

```svg
<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#007AFF;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0051D5;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background circle -->
  <circle cx="128" cy="128" r="120" fill="url(#grad)"/>
  
  <!-- Microphone -->
  <rect x="108" y="80" width="40" height="60" rx="20" fill="white"/>
  <rect x="118" y="140" width="20" height="30" fill="white"/>
  <rect x="98" y="165" width="60" height="8" rx="4" fill="white"/>
  
  <!-- Code brackets -->
  <text x="60" y="140" font-size="60" fill="white" font-family="monospace">{</text>
  <text x="170" y="140" font-size="60" fill="white" font-family="monospace">}</text>
</svg>
```

Save this as both `icon.png` (convert from SVG) and `icon.svg`.

## Validation

Before publishing, verify:
- [ ] icon.png exists and is 256x256
- [ ] icon.svg exists and is valid SVG
- [ ] Icons look good at 16x16, 32x32, 64x64, 128x128, 256x256
- [ ] Transparent background
- [ ] Professional appearance
- [ ] Recognizable as voice/coding tool

## Resources

- [VSCode Icon Guidelines](https://code.visualstudio.com/api/references/extension-manifest#extension-icon)
- [Iconify](https://iconify.design/) - Free icon library
- [Heroicons](https://heroicons.com/) - Beautiful icons
- [Lucide Icons](https://lucide.dev/) - Modern icon set

