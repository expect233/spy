import { test, expect, Page } from '@playwright/test';

// Helper function to create a player session
async function createPlayer(page: Page, name: string) {
  await page.goto('/');
  await page.fill('[data-testid="player-name-input"]', name);
}

// Helper function to create a room
async function createRoom(page: Page, hostName: string) {
  await createPlayer(page, hostName);
  await page.click('[data-testid="create-room-btn"]');
  await page.waitForSelector('[data-testid="room-code"]');
  const roomCode = await page.textContent('[data-testid="room-code"]');
  return roomCode?.trim() || '';
}

// Helper function to join a room
async function joinRoom(page: Page, playerName: string, roomCode: string) {
  await createPlayer(page, playerName);
  await page.fill('[data-testid="room-code-input"]', roomCode);
  await page.click('[data-testid="join-room-btn"]');
  await page.waitForSelector('[data-testid="player-list"]');
}

test.describe('Game Flow E2E', () => {
  test('Complete game flow: create → join → start → speak → vote → result', async ({ 
    browser 
  }) => {
    // Create multiple browser contexts for different players
    const hostContext = await browser.newContext();
    const player1Context = await browser.newContext();
    const player2Context = await browser.newContext();

    const hostPage = await hostContext.newPage();
    const player1Page = await player1Context.newPage();
    const player2Page = await player2Context.newPage();

    try {
      // Step 1: Host creates room
      const roomCode = await createRoom(hostPage, 'Host');
      expect(roomCode).toBeTruthy();
      expect(roomCode).toMatch(/^[A-Z0-9]{6}$/);

      // Verify host sees room interface
      await expect(hostPage.locator('[data-testid="host-panel"]')).toBeVisible();
      await expect(hostPage.locator('[data-testid="player-profile"]')).toContainText('Host');

      // Step 2: Players join room
      await joinRoom(player1Page, 'Player1', roomCode);
      await joinRoom(player2Page, 'Player2', roomCode);

      // Verify all players see each other
      for (const page of [hostPage, player1Page, player2Page]) {
        await expect(page.locator('[data-testid="player-list"]')).toContainText('Host');
        await expect(page.locator('[data-testid="player-list"]')).toContainText('Player1');
        await expect(page.locator('[data-testid="player-list"]')).toContainText('Player2');
      }

      // Step 3: Host configures and starts game
      await hostPage.click('[data-testid="game-config-btn"]');
      await hostPage.waitForSelector('[data-testid="config-dialog"]');
      
      // Set undercover count to 1
      await hostPage.fill('[data-testid="undercover-count"]', '1');
      await hostPage.click('[data-testid="save-config-btn"]');
      
      // Start game
      await hostPage.click('[data-testid="start-game-btn"]');

      // Step 4: Verify game started and roles assigned
      for (const page of [hostPage, player1Page, player2Page]) {
        await expect(page.locator('[data-testid="game-state"]')).toContainText('speaking');
        await expect(page.locator('[data-testid="private-card"]')).toBeVisible();
      }

      // Step 5: All players speak
      const speakTexts = {
        host: 'I think this is a fruit that grows on trees.',
        player1: 'It is red and sweet, often used in pies.',
        player2: 'This round orange fruit is very juicy.',
      };

      // Host speaks
      await hostPage.fill('[data-testid="speak-input"]', speakTexts.host);
      await hostPage.click('[data-testid="speak-submit-btn"]');
      await expect(hostPage.locator('[data-testid="speak-status"]')).toContainText('已發言');

      // Player1 speaks
      await player1Page.fill('[data-testid="speak-input"]', speakTexts.player1);
      await player1Page.click('[data-testid="speak-submit-btn"]');
      await expect(player1Page.locator('[data-testid="speak-status"]')).toContainText('已發言');

      // Player2 speaks
      await player2Page.fill('[data-testid="speak-input"]', speakTexts.player2);
      await player2Page.click('[data-testid="speak-submit-btn"]');
      await expect(player2Page.locator('[data-testid="speak-status"]')).toContainText('已發言');

      // Step 6: Verify transition to voting phase
      for (const page of [hostPage, player1Page, player2Page]) {
        await expect(page.locator('[data-testid="game-state"]')).toContainText('voting');
        await expect(page.locator('[data-testid="vote-panel"]')).toBeVisible();
      }

      // Step 7: All players vote
      // Host votes for Player2 (suspicious orange description)
      await hostPage.click('[data-testid="vote-option-player2"]');
      await hostPage.click('[data-testid="vote-submit-btn"]');

      // Player1 votes for Player2
      await player1Page.click('[data-testid="vote-option-player2"]');
      await player1Page.click('[data-testid="vote-submit-btn"]');

      // Player2 votes for Host
      await player2Page.click('[data-testid="vote-option-host"]');
      await player2Page.click('[data-testid="vote-submit-btn"]');

      // Step 8: Verify voting results and elimination
      for (const page of [hostPage, player1Page, player2Page]) {
        await expect(page.locator('[data-testid="game-state"]')).toContainText('reveal');
        await expect(page.locator('[data-testid="vote-result"]')).toBeVisible();
      }

      // Player2 should be eliminated (2 votes vs 1)
      await expect(hostPage.locator('[data-testid="eliminated-player"]')).toContainText('Player2');

      // Step 9: Check game end or next round
      // If Player2 was the undercover, game should end with civilian victory
      // If not, should proceed to next round
      const gameState = await hostPage.textContent('[data-testid="game-state"]');
      
      if (gameState?.includes('ended')) {
        // Game ended - verify winner
        await expect(hostPage.locator('[data-testid="game-result"]')).toBeVisible();
        const winner = await hostPage.textContent('[data-testid="winner"]');
        expect(winner).toMatch(/(civilian|undercover)/);
      } else {
        // Next round - verify speaking phase
        await expect(hostPage.locator('[data-testid="game-state"]')).toContainText('speaking');
      }

      // Step 10: Test chat functionality
      await hostPage.click('[data-testid="chat-toggle"]');
      await expect(hostPage.locator('[data-testid="chat-panel"]')).toBeVisible();

      // Send a chat message
      await hostPage.fill('[data-testid="chat-input"]', 'Good game everyone!');
      await hostPage.click('[data-testid="chat-send-btn"]');

      // Verify message appears
      await expect(hostPage.locator('[data-testid="chat-messages"]')).toContainText('Good game everyone!');

      // Verify other players see the message
      for (const page of [player1Page, player2Page]) {
        await page.click('[data-testid="chat-toggle"]');
        await expect(page.locator('[data-testid="chat-messages"]')).toContainText('Good game everyone!');
      }

    } finally {
      // Cleanup
      await hostContext.close();
      await player1Context.close();
      await player2Context.close();
    }
  });

  test('Host controls: kick player and transfer host', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();

    const hostPage = await hostContext.newPage();
    const playerPage = await playerContext.newPage();

    try {
      // Create room and join
      const roomCode = await createRoom(hostPage, 'Host');
      await joinRoom(playerPage, 'Player1', roomCode);

      // Test kick player
      await hostPage.click('[data-testid="player-menu-player1"]');
      await hostPage.click('[data-testid="kick-player-btn"]');
      await hostPage.click('[data-testid="confirm-kick-btn"]');

      // Verify player was kicked
      await expect(hostPage.locator('[data-testid="player-list"]')).not.toContainText('Player1');
      
      // Player should be redirected or see error
      await expect(playerPage.locator('[data-testid="error-message"]')).toBeVisible();

      // Player rejoins
      await joinRoom(playerPage, 'Player1', roomCode);

      // Test transfer host
      await hostPage.click('[data-testid="transfer-host-btn"]');
      await hostPage.click('[data-testid="select-player1-as-host"]');
      await hostPage.click('[data-testid="confirm-transfer-btn"]');

      // Verify host transfer
      await expect(playerPage.locator('[data-testid="host-panel"]')).toBeVisible();
      await expect(hostPage.locator('[data-testid="host-panel"]')).not.toBeVisible();

    } finally {
      await hostContext.close();
      await playerContext.close();
    }
  });

  test('Tiebreak scenario', async ({ browser }) => {
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ]);

    const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));
    const [hostPage, player1Page, player2Page, player3Page] = pages;

    try {
      // Create room with 4 players
      const roomCode = await createRoom(hostPage, 'Host');
      await joinRoom(player1Page, 'Player1', roomCode);
      await joinRoom(player2Page, 'Player2', roomCode);
      await joinRoom(player3Page, 'Player3', roomCode);

      // Start game
      await hostPage.click('[data-testid="start-game-btn"]');

      // All players speak
      for (const [page, text] of [
        [hostPage, 'This is my description'],
        [player1Page, 'Here is what I think'],
        [player2Page, 'My opinion about this'],
        [player3Page, 'What I believe it is'],
      ]) {
        await page.fill('[data-testid="speak-input"]', text);
        await page.click('[data-testid="speak-submit-btn"]');
      }

      // Create a tie vote: 2 votes for Player1, 2 votes for Player2
      await hostPage.click('[data-testid="vote-option-player1"]');
      await hostPage.click('[data-testid="vote-submit-btn"]');

      await player1Page.click('[data-testid="vote-option-player2"]');
      await player1Page.click('[data-testid="vote-submit-btn"]');

      await player2Page.click('[data-testid="vote-option-player1"]');
      await player2Page.click('[data-testid="vote-submit-btn"]');

      await player3Page.click('[data-testid="vote-option-player2"]');
      await player3Page.click('[data-testid="vote-submit-btn"]');

      // Verify tie detected
      await expect(hostPage.locator('[data-testid="tie-result"]')).toBeVisible();
      await expect(hostPage.locator('[data-testid="tiebreak-panel"]')).toBeVisible();

      // Host makes tiebreak decision
      await hostPage.click('[data-testid="tiebreak-option-player1"]');
      await hostPage.click('[data-testid="confirm-tiebreak-btn"]');

      // Verify tiebreak result
      await expect(hostPage.locator('[data-testid="eliminated-player"]')).toContainText('Player1');

    } finally {
      await Promise.all(contexts.map(ctx => ctx.close()));
    }
  });

  test('Avatar selection and display', async ({ page }) => {
    await createPlayer(page, 'TestPlayer');

    // Open profile settings
    await page.click('[data-testid="profile-settings-btn"]');
    await expect(page.locator('[data-testid="profile-dialog"]')).toBeVisible();

    // Test avatar style selection
    await page.click('[data-testid="avatar-style-select"]');
    await page.click('[data-testid="avatar-style-avataaars"]');

    // Verify avatar updated
    await expect(page.locator('[data-testid="current-avatar"]')).toHaveAttribute(
      'src', 
      /avataaars/
    );

    // Test avatar upload (mock file)
    const fileInput = page.locator('[data-testid="avatar-upload-input"]');
    await fileInput.setInputFiles({
      name: 'test-avatar.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-image-data'),
    });

    // Verify upload initiated
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
  });

  test('Rate limiting and validation', async ({ page }) => {
    const roomCode = await createRoom(page, 'Host');

    // Test chat rate limiting
    await page.click('[data-testid="chat-toggle"]');
    
    // Send first message
    await page.fill('[data-testid="chat-input"]', 'First message');
    await page.click('[data-testid="chat-send-btn"]');

    // Try to send second message immediately
    await page.fill('[data-testid="chat-input"]', 'Second message');
    await page.click('[data-testid="chat-send-btn"]');

    // Should see rate limit error
    await expect(page.locator('[data-testid="rate-limit-error"]')).toBeVisible();

    // Test speak text validation
    await page.click('[data-testid="start-game-btn"]');
    
    // Try to submit empty speak
    await page.click('[data-testid="speak-submit-btn"]');
    await expect(page.locator('[data-testid="speak-error"]')).toContainText('不能為空');

    // Try to submit text that's too long
    const longText = 'a'.repeat(121);
    await page.fill('[data-testid="speak-input"]', longText);
    await page.click('[data-testid="speak-submit-btn"]');
    await expect(page.locator('[data-testid="speak-error"]')).toContainText('超過 120 字');

    // Try to submit text with bad words
    await page.fill('[data-testid="speak-input"]', '這個遊戲很幹');
    await page.click('[data-testid="speak-submit-btn"]');
    await expect(page.locator('[data-testid="speak-error"]')).toContainText('不當詞語');
  });
});
