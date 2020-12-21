/**
 * Events by Release
 */
import {t} from 'sentry/locale';
import {OPERATOR} from 'sentry/views/discover/data';

const eventsByRelease = {
  name: t('Events by Release'),
  fields: ['release'],
  constraints: ['recentReleases'],
  conditions: [['event.type', OPERATOR.NOT_EQUAL, 'transaction']],
  aggregations: [['count()', null, 'Events']],
  limit: 5000,

  orderby: '-time',
  groupby: ['time', 'release'],
  rollup: 86400,
};

export default eventsByRelease;
