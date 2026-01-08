import { test, expect } from '@playwright/test';

/**
 * E2E Test: Text Processing Pipeline
 * Phase 1.2: E2E Testing Implementation
 */

test.describe('Text Processing Pipeline', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should process text with different tones', async ({ page }) => {
    const tones = ['professional', 'casual', 'friendly', 'formal'];
    
    for (const tone of tones) {
      // Enter text
      await page.getByTestId('text-input').fill('This is a test sentence');
      
      // Select tone
      await page.getByTestId('tone-selector').click();
      await page.getByTestId(`tone-${tone}`).click();
      
      // Process text
      await page.getByTestId('process-text').click();
      
      // Wait for result
      const processedText = page.getByTestId('processed-text');
      await expect(processedText).toBeVisible({ timeout: 5000 });
      
      // Verify text was processed
      const result = await processedText.textContent();
      expect(result).toBeTruthy();
      expect(result!.length).toBeGreaterThan(0);
    }
  });

  test('should process text with different contexts', async ({ page }) => {
    const contexts = ['email', 'chat', 'document', 'social'];
    
    for (const context of contexts) {
      // Enter text
      await page.getByTestId('text-input').fill('Hello, how are you doing today?');
      
      // Select context
      await page.getByTestId('context-selector').click();
      await page.getByTestId(`context-${context}`).click();
      
      // Process text
      await page.getByTestId('process-text').click();
      
      // Wait for result
      const processedText = page.getByTestId('processed-text');
      await expect(processedText).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show processing progress', async ({ page }) => {
    // Enter text
    await page.getByTestId('text-input').fill('This is a longer test sentence that will take some time to process');
    
    // Process text
    await page.getByTestId('process-text').click();
    
    // Verify progress indicator appears
    const progressIndicator = page.getByTestId('processing-indicator');
    await expect(progressIndicator).toBeVisible();
    
    // Wait for completion
    await expect(progressIndicator).not.toBeVisible({ timeout: 10000 });
    
    // Verify result
    const processedText = page.getByTestId('processed-text');
    await expect(processedText).toBeVisible();
  });

  test('should handle empty input', async ({ page }) => {
    // Try to process empty text
    await page.getByTestId('process-text').click();
    
    // Verify validation message
    const validationMessage = page.getByTestId('validation-message');
    await expect(validationMessage).toBeVisible();
    await expect(validationMessage).toContainText('required');
  });

  test('should cache processed results', async ({ page }) => {
    const testText = 'This is a test for caching';
    
    // First processing
    await page.getByTestId('text-input').fill(testText);
    await page.getByTestId('process-text').click();
    
    const startTime1 = Date.now();
    await page.getByTestId('processed-text').waitFor({ timeout: 10000 });
    const duration1 = Date.now() - startTime1;
    
    // Clear and re-enter same text
    await page.getByTestId('text-input').clear();
    await page.getByTestId('text-input').fill(testText);
    await page.getByTestId('process-text').click();
    
    const startTime2 = Date.now();
    await page.getByTestId('processed-text').waitFor({ timeout: 10000 });
    const duration2 = Date.now() - startTime2;
    
    // Second processing should be much faster (cached)
    expect(duration2).toBeLessThan(duration1 * 0.5);
  });
});

test.describe('Complete Workflow', () => {
  test('should complete full voice-to-processed-text workflow', async ({ page }) => {
    await page.goto('/');
    await page.context().grantPermissions(['microphone']);
    
    // Step 1: Record voice
    await page.getByTestId('start-recording').click();
    await page.waitForTimeout(3000);
    await page.getByTestId('stop-recording').click();
    
    // Step 2: Wait for transcription
    const transcription = page.getByTestId('transcription');
    await expect(transcription).toBeVisible({ timeout: 10000 });
    
    // Step 3: Select processing options
    await page.getByTestId('tone-selector').click();
    await page.getByTestId('tone-professional').click();
    
    await page.getByTestId('context-selector').click();
    await page.getByTestId('context-email').click();
    
    // Step 4: Process text
    await page.getByTestId('process-text').click();
    
    // Step 5: Verify processed result
    const processedText = page.getByTestId('processed-text');
    await expect(processedText).toBeVisible({ timeout: 10000 });
    
    // Step 6: Export
    await page.getByTestId('export-button').click();
    
    // Verify export options
    const exportDialog = page.getByTestId('export-dialog');
    await expect(exportDialog).toBeVisible();
  });

  test('should handle errors in workflow gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Try to process without recording
    await page.getByTestId('process-text').click();
    
    // Verify error handling
    const errorMessage = page.getByTestId('error-message');
    await expect(errorMessage).toBeVisible();
  });
});

test.describe('Export Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Setup: Add some processed text
    await page.getByTestId('text-input').fill('Test export text');
    await page.getByTestId('process-text').click();
    await page.getByTestId('processed-text').waitFor({ timeout: 10000 });
  });

  test('should export as text file', async ({ page }) => {
    await page.getByTestId('export-button').click();
    
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('export-txt').click();
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.txt');
  });

  test('should export as PDF', async ({ page }) => {
    await page.getByTestId('export-button').click();
    
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('export-pdf').click();
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('should copy to clipboard', async ({ page }) => {
    await page.getByTestId('copy-button').click();
    
    // Verify success message
    const successMessage = page.getByTestId('copy-success');
    await expect(successMessage).toBeVisible();
    
    // Verify clipboard content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBeTruthy();
  });
});

