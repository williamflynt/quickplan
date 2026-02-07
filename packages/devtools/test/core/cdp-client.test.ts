import { describe, expect, it } from 'vitest';
import { CDPClient } from '../../src/core/cdp-client.js';

describe('CDPClient', () => {
  it('can be instantiated', () => {
    const client = new CDPClient();
    expect(client).toBeDefined();
  });

  it('requireClient throws when not connected', async () => {
    const client = new CDPClient();
    // getPageContent internally calls requireClient
    await expect(client.getPageContent()).rejects.toThrow('Not connected');
  });

  it('connect fails with clear error when no browser available', async () => {
    const client = new CDPClient();
    await expect(
      client.connect({ port: 19999 }),
    ).rejects.toThrow('Failed to connect');
  }, 15_000);

  it('disconnect is safe to call when not connected', async () => {
    const client = new CDPClient();
    await expect(client.disconnect()).resolves.toBeUndefined();
  });
});
