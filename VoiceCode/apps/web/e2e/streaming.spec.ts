/**
 * E2E Tests for Real-time Streaming
 * Phase 1.5: Testing Suite
 * 
 * Tests the complete user flow with real browser interactions
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Real-time Streaming E2E', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/');
    
    // Grant microphone permissions
    await page.context().grantPermissions(['microphone']);
  });

  test.describe('Connection Flow', () => {
    test('should display streaming toggle', async () => {
      const streamingToggle = page.locator('[data-testid="streaming-toggle"]');
      await expect(streamingToggle).toBeVisible();
    });

    test('should show connection status', async () => {
      const connectionStatus = page.locator('[data-testid="connection-status"]');
      await expect(connectionStatus).toBeVisible();
    });

    test('should enable streaming by default', async () => {
      const streamingToggle = page.locator('[data-testid="streaming-toggle"]');
      await expect(streamingToggle).toBeChecked();
    });

    test('should toggle streaming mode', async () => {
      const streamingToggle = page.locator('[data-testid="streaming-toggle"]');
      
      // Initially enabled
      await expect(streamingToggle).toBeChecked();
      
      // Toggle off
      await streamingToggle.click();
      await expect(streamingToggle).not.toBeChecked();
      
      // Toggle back on
      await streamingToggle.click();
      await expect(streamingToggle).toBeChecked();
    });
  });

  test.describe('Recording Flow', () => {
    test('should start recording in streaming mode', async () => {
      // Ensure streaming is enabled
      const streamingToggle = page.locator('[data-testid="streaming-toggle"]');
      await expect(streamingToggle).toBeChecked();

      // Click record button
      const recordButton = page.locator('[data-testid="record-button"]');
      await recordButton.click();

      // Should show recording indicator
      const recordingIndicator = page.locator('[data-testid="recording-indicator"]');
      await expect(recordingIndicator).toBeVisible();
      await expect(recordingIndicator).toHaveText(/Streaming|Recording/);
    });

    test('should display interim transcript', async () => {
      // Start recording
      const recordButton = page.locator('[data-testid="record-button"]');
      await recordButton.click();

      // Wait for interim transcript area
      const interimTranscript = page.locator('[data-testid="interim-transcript"]');
      await expect(interimTranscript).toBeVisible();
    });

    test('should display final transcript', async () => {
      // Start recording
      const recordButton = page.locator('[data-testid="record-button"]');
      await recordButton.click();

      // Wait a bit for recording
      await page.waitForTimeout(2000);

      // Stop recording
      await recordButton.click();

      // Should show transcript
      const transcript = page.locator('[data-testid="transcript"]');
      await expect(transcript).toBeVisible();
    });

    test('should stop recording', async () => {
      // Start recording
      const recordButton = page.locator('[data-testid="record-button"]');
      await recordButton.click();

      // Wait for recording to start
      await page.waitForTimeout(500);

      // Stop recording
      await recordButton.click();

      // Recording indicator should disappear
      const recordingIndicator = page.locator('[data-testid="recording-indicator"]');
      await expect(recordingIndicator).not.toBeVisible();
    });
  });

  test.describe('Transcript Display', () => {
    test('should show interim transcript with visual distinction', async () => {
      // Start recording
      const recordButton = page.locator('[data-testid="record-button"]');
      await recordButton.click();

      // Check interim transcript styling
      const interimTranscript = page.locator('[data-testid="interim-transcript"]');
      await expect(interimTranscript).toHaveCSS('opacity', /0\.5|0\.6/);
      await expect(interimTranscript).toHaveCSS('font-style', 'italic');
    });

    test('should clear interim transcript when final arrives', async () => {
      // Start recording
      const recordButton = page.locator('[data-testid="record-button"]');
      await recordButton.click();

      // Wait for interim transcript
      const interimTranscript = page.locator('[data-testid="interim-transcript"]');
      await expect(interimTranscript).toBeVisible();

      // Wait for final transcript (interim should clear)
      await page.waitForTimeout(2000);
      
      // Stop recording
      await recordButton.click();

      // Interim should be empty
      await expect(interimTranscript).toBeEmpty();
    });

    test('should append multiple final transcripts', async () => {
      // Start recording
      const recordButton = page.locator('[data-testid="record-button"]');
      await recordButton.click();

      // Wait for multiple transcript segments
      await page.waitForTimeout(5000);

      // Stop recording
      await recordButton.click();

      // Check transcript has content
      const transcript = page.locator('[data-testid="transcript"]');
      const text = await transcript.textContent();
      expect(text).toBeTruthy();
      expect(text!.length).toBeGreaterThan(0);
    });
  });

  test.describe('Error Handling', () => {
    test('should show error message on connection failure', async () => {
      // Mock network failure
      await page.route('wss://api.aimlapi.com/**', route => route.abort());

      // Try to start recording
      const recordButton = page.locator('[data-testid="record-button"]');
      await recordButton.click();

      // Should show error
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/error|failed/i);
    });

    test('should handle microphone permission denial', async () => {
      // Deny microphone permission
      await page.context().clearPermissions();

      // Try to start recording
      const recordButton = page.locator('[data-testid="record-button"]');
      await recordButton.click();

      // Should show permission error
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/permission|microphone/i);
    });

    test('should recover from temporary disconnection', async () => {
      // Start recording
      const recordButton = page.locator('[data-testid="record-button"]');
      await recordButton.click();

      // Wait for connection
      await page.waitForTimeout(1000);

      // Simulate disconnection
      await page.evaluate(() => {
        // Close WebSocket connection
        const ws = (window as any).__websocket__;
        if (ws) ws.close();
      });

      // Wait for reconnection
      await page.waitForTimeout(3000);

      // Should show connected status
      const connectionStatus = page.locator('[data-testid="connection-status"]');
      await expect(connectionStatus).toContainText(/connected/i);
    });
  });

  test.describe('Mode Switching', () => {
    test('should switch from streaming to traditional mode', async () => {
      // Start in streaming mode
      const streamingToggle = page.locator('[data-testid="streaming-toggle"]');
      await expect(streamingToggle).toBeChecked();

      // Switch to traditional mode
      await streamingToggle.click();
      await expect(streamingToggle).not.toBeChecked();

      // Start recording
      const recordButton = page.locator('[data-testid="record-button"]');
      await recordButton.click();

      // Should show "Recording" not "Streaming"
      const recordingIndicator = page.locator('[data-testid="recording-indicator"]');
      await expect(recordingIndicator).toContainText(/Recording/);
      await expect(recordingIndicator).not.toContainText(/Streaming/);
    });

    test('should not allow mode switch during recording', async () => {
      // Start recording
      const recordButton = page.locator('[data-testid="record-button"]');
      await recordButton.click();

      // Toggle should be disabled
      const streamingToggle = page.locator('[data-testid="streaming-toggle"]');
      await expect(streamingToggle).toBeDisabled();
    });

    test('should allow mode switch after stopping', async () => {
      // Start recording
      const recordButton = page.locator('[data-testid="record-button"]');
      await recordButton.click();

      // Wait and stop
      await page.waitForTimeout(1000);
      await recordButton.click();

      // Toggle should be enabled
      const streamingToggle = page.locator('[data-testid="streaming-toggle"]');
      await expect(streamingToggle).toBeEnabled();
    });
  });

  test.describe('Performance', () => {
    test('should start recording within 500ms', async () => {
      const recordButton = page.locator('[data-testid="record-button"]');
      
      const startTime = Date.now();
      await recordButton.click();
      
      const recordingIndicator = page.locator('[data-testid="recording-indicator"]');
      await expect(recordingIndicator).toBeVisible();
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500);
    });

    test('should display interim results within 1 second', async () => {
      const recordButton = page.locator('[data-testid="record-button"]');
      await recordButton.click();

      // Should show interim transcript within 1 second
      const interimTranscript = page.locator('[data-testid="interim-transcript"]');
      await expect(interimTranscript).toBeVisible({ timeout: 1000 });
    });

    test('should handle long recording sessions', async () => {
      const recordButton = page.locator('[data-testid="record-button"]');
      await recordButton.click();

      // Record for 30 seconds
      await page.waitForTimeout(30000);

      // Should still be recording
      const recordingIndicator = page.locator('[data-testid="recording-indicator"]');
      await expect(recordingIndicator).toBeVisible();

      // Stop recording
      await recordButton.click();

      // Should have transcript
      const transcript = page.locator('[data-testid="transcript"]');
      await expect(transcript).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async () => {
      const recordButton = page.locator('[data-testid="record-button"]');
      await expect(recordButton).toHaveAttribute('aria-label');

      const streamingToggle = page.locator('[data-testid="streaming-toggle"]');
      await expect(streamingToggle).toHaveAttribute('aria-label');
    });

    test('should be keyboard navigable', async () => {
      // Tab to record button
      await page.keyboard.press('Tab');
      
      // Should focus record button
      const recordButton = page.locator('[data-testid="record-button"]');
      await expect(recordButton).toBeFocused();

      // Press Enter to start recording
      await page.keyboard.press('Enter');

      // Should start recording
      const recordingIndicator = page.locator('[data-testid="recording-indicator"]');
      await expect(recordingIndicator).toBeVisible();
    });

    test('should announce status changes to screen readers', async () => {
      const liveRegion = page.locator('[aria-live="polite"]');
      await expect(liveRegion).toBeVisible();

      // Start recording
      const recordButton = page.locator('[data-testid="record-button"]');
      await recordButton.click();

      // Live region should update
      await expect(liveRegion).toContainText(/recording|streaming/i);
    });
  });
});

