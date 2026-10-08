import { describe, expect, it, vi } from 'vitest';

import { loadConfig } from './load-config.ts';

describe('loadConfig', () => {
  it('defaults the log level to info and the port to 3000', () => {
    vi.stubEnv('LOG_LEVEL', undefined);
    vi.stubEnv('PORT', undefined);

    expect(loadConfig()).toEqual({ logLevel: 'info', port: 3000 });
  });

  it('reads the log level and port from the environment', () => {
    vi.stubEnv('LOG_LEVEL', 'debug');
    vi.stubEnv('PORT', '8080');

    expect(loadConfig()).toEqual({ logLevel: 'debug', port: 8080 });
  });

  it('rejects an unknown log level', () => {
    vi.stubEnv('LOG_LEVEL', 'verbose');

    expect(() => loadConfig()).toThrow();
  });

  it.each(['abc', '-1', '65536', '3000.5'])(
    'rejects an invalid port (%j)',
    (port) => {
      vi.stubEnv('PORT', port);

      expect(() => loadConfig()).toThrow();
    },
  );
});
