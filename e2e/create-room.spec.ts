import { test, expect, Page } from '@playwright/test';

test.describe('Fix: cannot create room', () => {
  test('should successfully create room and navigate to room page', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Fill in player name
    const playerName = 'TestHost';
    await page.fill('[data-testid="player-name-input"]', playerName);
    
    // Click create room button
    await page.click('[data-testid="create-room-btn"]');
    
    // Wait for navigation to room page
    await page.waitForURL(/\/room\/[A-Z0-9]{6}/, { timeout: 10000 });
    
    // Extract room code from URL
    const url = page.url();
    const roomCode = url.match(/\/room\/([A-Z0-9]{6})/)?.[1];
    expect(roomCode).toBeTruthy();
    expect(roomCode).toMatch(/^[A-Z0-9]{6}$/);
    
    // Verify room page loads correctly
    await expect(page.locator('[data-testid="room-code"]')).toContainText(roomCode!);
    await expect(page.locator('[data-testid="player-profile"]')).toContainText(playerName);
    await expect(page.locator('[data-testid="host-panel"]')).toBeVisible();
  });

  test('should show error when creating room without name', async ({ page }) => {
    await page.goto('/');
    
    // Try to create room without entering name
    await page.click('[data-testid="create-room-btn"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText('請輸入玩家名稱');
  });

  test('should show retry UI when room creation fails', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/rooms', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });

    await page.goto('/');
    await page.fill('[data-testid="player-name-input"]', 'TestPlayer');
    await page.click('[data-testid="create-room-btn"]');

    // Should show error with retry option
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-btn"]')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/rooms', route => {
      route.abort('failed');
    });

    await page.goto('/');
    await page.fill('[data-testid="player-name-input"]', 'TestPlayer');
    await page.click('[data-testid="create-room-btn"]');

    // Should show network error
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Network error');
  });

  test('should log errors to console', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Mock API failure
    await page.route('**/api/rooms', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid request' })
      });
    });

    await page.goto('/');
    await page.fill('[data-testid="player-name-input"]', 'TestPlayer');
    await page.click('[data-testid="create-room-btn"]');

    // Wait for error to be logged
    await page.waitForTimeout(1000);

    // Verify error was logged
    expect(consoleErrors.some(error => 
      error.includes('創建房間錯誤') || error.includes('Invalid request')
    )).toBeTruthy();
  });
});

test.describe('Room functionality after creation', () => {
  test('should allow second player to join created room', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();
    
    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    try {
      // Host creates room
      await hostPage.goto('/');
      await hostPage.fill('[data-testid="player-name-input"]', 'Host');
      await hostPage.click('[data-testid="create-room-btn"]');
      
      await hostPage.waitForURL(/\/room\/[A-Z0-9]{6}/);
      const roomCode = hostPage.url().match(/\/room\/([A-Z0-9]{6})/)?.[1];
      
      // Player joins room
      await playerPage.goto('/');
      await playerPage.fill('[data-testid="player-name-input"]', 'Player1');
      await playerPage.fill('[data-testid="room-code-input"]', roomCode!);
      await playerPage.click('[data-testid="join-room-btn"]');
      
      await playerPage.waitForURL(/\/room\/[A-Z0-9]{6}/);
      
      // Verify both players see each other
      await expect(hostPage.locator('[data-testid="player-list"]')).toContainText('Player1');
      await expect(playerPage.locator('[data-testid="player-list"]')).toContainText('Host');
      
    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });
});
