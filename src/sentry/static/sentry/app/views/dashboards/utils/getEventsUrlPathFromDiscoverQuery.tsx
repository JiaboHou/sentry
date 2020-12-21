import pickBy from 'lodash/pickBy';
import * as qs from 'query-string';

import {GlobalSelection, Organization} from 'sentry/types';
import {getUtcDateString} from 'sentry/utils/dates';
import {Query} from 'sentry/views/discover/types';

import {getDiscoverConditionsToSearchString} from './getDiscoverConditionsToSearchString';

type Props = {
  organization: Organization;
  selection: GlobalSelection;
  query: Query;
};

export function getEventsUrlPathFromDiscoverQuery({
  organization,
  selection,
  query,
}: Props) {
  const {projects, datetime, environments: _environments, ...restSelection} = selection;

  return `/organizations/${organization.slug}/events/?${qs.stringify(
    pickBy({
      ...restSelection,
      project: projects,
      start: datetime.start && getUtcDateString(datetime.start),
      end: datetime.end && getUtcDateString(datetime.end),
      statsPeriod: datetime.period,
      query: getDiscoverConditionsToSearchString(query.conditions),
    })
  )}`;
}
