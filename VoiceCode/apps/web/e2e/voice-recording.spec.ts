import { test, expect } from '@playwright/test';

/**
 * E2E Test: Voice Recording & Transcription
 * Phase 1.2: E2E Testing Implementation
 */

test.describe('Voice Recording & Transcription', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should initialize voice recording interface', async ({ page }) => {
    // Verify recording button exists
    const recordButton = page.getByTestId('start-recording');
    await expect(recordButton).toBeVisible();
    
    // Verify language selector exists
    const languageSelector = page.getByTestId('language-selector');
    await expect(languageSelector).toBeVisible();
  });

  test('should start and stop recording', async ({ page }) => {
    // Grant microphone permissions
    await page.context().grantPermissions(['microphone']);
    
    // Start recording
    await page.getByTestId('start-recording').click();
    
    // Verify recording indicator
    const recordingIndicator = page.getByTestId('recording-indicator');
    await expect(recordingIndicator).toBeVisible();
    
    // Wait 2 seconds
    await page.waitForTimeout(2000);
    
    // Stop recording
    await page.getByTestId('stop-recording').click();
    
    // Verify recording stopped
    await expect(recordingIndicator).not.toBeVisible();
  });

  test('should display transcription after recording', async ({ page }) => {
    // Grant permissions
    await page.context().grantPermissions(['microphone']);
    
    // Start recording
    await page.getByTestId('start-recording').click();
    await page.waitForTimeout(3000);
    
    // Stop recording
    await page.getByTestId('stop-recording').click();
    
    // Wait for transcription
    const transcription = page.getByTestId('transcription');
    await expect(transcription).toBeVisible({ timeout: 10000 });
    
    // Verify transcription has content
    const text = await transcription.textContent();
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(0);
  });

  test('should handle recording errors gracefully', async ({ page }) => {
    // Deny microphone permissions
    await page.context().grantPermissions([]);
    
    // Try to start recording
    await page.getByTestId('start-recording').click();
    
    // Verify error message
    const errorMessage = page.getByTestId('error-message');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    await expect(errorMessage).toContainText('microphone');
  });
});

test.describe('Multi-Language Support', () => {
  const languages = [
    { code: 'en-US', name: 'English' },
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
  ];

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  languages.forEach(({ code, name }) => {
    test(`should support ${name} (${code})`, async ({ page }) => {
      // Select language
      await page.getByTestId('language-selector').click();
      await page.getByTestId(`lang-${code}`).click();
      
      // Verify language selected
      const selectedLang = page.getByTestId('selected-language');
      await expect(selectedLang).toContainText(name);
      
      // Grant permissions and record
      await page.context().grantPermissions(['microphone']);
      await page.getByTestId('start-recording').click();
      await page.waitForTimeout(2000);
      await page.getByTestId('stop-recording').click();
      
      // Verify transcription appears
      const transcription = page.getByTestId('transcription');
      await expect(transcription).toBeVisible({ timeout: 10000 });
    });
  });
});

test.describe('Audio Visualization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.context().grantPermissions(['microphone']);
  });

  test('should display audio waveform during recording', async ({ page }) => {
    // Start recording
    await page.getByTestId('start-recording').click();
    
    // Verify waveform canvas exists
    const waveform = page.getByTestId('audio-waveform');
    await expect(waveform).toBeVisible();
    
    // Verify canvas is animating (check if canvas has content)
    await page.waitForTimeout(1000);
    const canvas = await waveform.locator('canvas').first();
    await expect(canvas).toBeVisible();
    
    // Stop recording
    await page.getByTestId('stop-recording').click();
  });

  test('should show volume levels', async ({ page }) => {
    // Start recording
    await page.getByTestId('start-recording').click();
    
    // Verify volume indicator
    const volumeIndicator = page.getByTestId('volume-indicator');
    await expect(volumeIndicator).toBeVisible();
    
    // Stop recording
    await page.getByTestId('stop-recording').click();
  });
});

test.describe('Performance', () => {
  test('should load within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });

  test('should maintain 60 FPS during recording', async ({ page }) => {
    await page.goto('/');
    await page.context().grantPermissions(['microphone']);
    
    // Start performance monitoring
    await page.evaluate(() => {
      (window as any).frameCount = 0;
      (window as any).startTime = performance.now();
      
      function countFrames() {
        (window as any).frameCount++;
        requestAnimationFrame(countFrames);
      }
      countFrames();
    });
    
    // Start recording
    await page.getByTestId('start-recording').click();
    await page.waitForTimeout(2000);
    
    // Check FPS
    const fps = await page.evaluate(() => {
      const elapsed = (performance.now() - (window as any).startTime) / 1000;
      return (window as any).frameCount / elapsed;
    });
    
    expect(fps).toBeGreaterThan(55); // Allow some margin
    
    // Stop recording
    await page.getByTestId('stop-recording').click();
  });
});

