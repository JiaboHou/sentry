import {analytics} from 'sentry/utils/analytics';
import {trackQuery} from 'sentry/views/discover/analytics';

jest.mock('sentry/utils/analytics');

describe('Analytics', function () {
  beforeEach(function () {
    const query = {
      fields: ['col1'],
      projects: [1],
      conditions: [
        ['customer', '=', 'test@test.com'],
        ['some_count', '=', 5],
      ],
    };

    trackQuery(TestStubs.Organization(), query);
  });

  it('scrubs only conditions with strings', function () {
    const conditions = [
      ['customer', '=', '[REDACTED]'],
      ['some_count', '=', 5],
    ];

    expect(analytics).toHaveBeenCalledWith(
      'discover.query',
      expect.objectContaining({
        conditions,
      })
    );
  });
});
