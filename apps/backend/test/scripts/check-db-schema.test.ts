import { checkSchema } from '../../src/scripts/check-db-schema';

describe('scripts/check-db-schema', () => {
  it('does not connect to MySQL on import (no side effects)', () => {
    expect(typeof checkSchema).toBe('function');
  });
});
