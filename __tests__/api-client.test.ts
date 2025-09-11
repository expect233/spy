import { apiClient } from '@/lib/api-client';
import { GameError } from '@/types/game';
import { describe, it, expect, vi, afterEach } from 'vitest';

// Access private request method via bracket notation
const request = (apiClient as any).request.bind(apiClient);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ApiClient error handling', () => {
  it('throws GameError with message and status for HTTP errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
    ));

    const err: any = await request('/test').catch((e: any) => e);
    expect(err).toBeInstanceOf(GameError);
    expect(err).toMatchObject({
      message: 'Not found',
      code: 'API_ERROR',
      statusCode: 404,
    });
  });

  it('throws GameError on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('failed')));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const err: any = await request('/test').catch((e: any) => e);
    expect(err).toBeInstanceOf(GameError);
    expect(err).toMatchObject({
      message: 'Network error occurred',
      code: 'NETWORK_ERROR',
      statusCode: 500,
    });
  });
});
