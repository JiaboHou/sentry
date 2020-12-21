import React from 'react';
import {browserHistory} from 'react-router';
import styled from '@emotion/styled';
import {Location} from 'history';

import DropdownControl, {DropdownItem} from 'sentry/components/dropdownControl';
import {t} from 'sentry/locale';
import space from 'sentry/styles/space';
import {GlobalSelection, Organization} from 'sentry/types';
import {trackAnalyticsEvent} from 'sentry/utils/analytics';
import EventView from 'sentry/utils/discover/eventView';
import {generateAggregateFields} from 'sentry/utils/discover/fields';
import {decodeScalar} from 'sentry/utils/queryString';
import {stringifyQueryObject, tokenizeSearch} from 'sentry/utils/tokenizeSearch';
import withGlobalSelection from 'sentry/utils/withGlobalSelection';
import SearchBar from 'sentry/views/events/searchBar';

import {FilterViews} from '../landing';
import {getTransactionSearchQuery} from '../utils';

import ChangedTransactions from './changedTransactions';
import {TrendChangeType, TrendFunctionField, TrendView} from './types';
import {
  CONFIDENCE_LEVELS,
  DEFAULT_MAX_DURATION,
  getCurrentConfidenceLevel,
  getCurrentTrendFunction,
  getSelectedQueryKey,
  resetCursors,
  TRENDS_FUNCTIONS,
} from './utils';

type Props = {
  organization: Organization;
  location: Location;
  eventView: EventView;
  selection: GlobalSelection;
  setError: (msg: string | undefined) => void;
};

type State = {
  previousTrendFunction?: TrendFunctionField;
};

class TrendsContent extends React.Component<Props, State> {
  state: State = {};

  handleSearch = (searchQuery: string) => {
    const {location} = this.props;

    const cursors = resetCursors();

    browserHistory.push({
      pathname: location.pathname,
      query: {
        ...location.query,
        ...cursors,
        query: String(searchQuery).trim() || undefined,
      },
    });
  };

  handleTrendFunctionChange = (field: string) => {
    const {organization, location} = this.props;

    const offsets = {};

    Object.values(TrendChangeType).forEach(trendChangeType => {
      const queryKey = getSelectedQueryKey(trendChangeType);
      offsets[queryKey] = undefined;
    });

    trackAnalyticsEvent({
      eventKey: 'performance_views.trends.change_function',
      eventName: 'Performance Views: Change Function',
      organization_id: parseInt(organization.id, 10),
      function_name: field,
    });

    this.setState({
      previousTrendFunction: getCurrentTrendFunction(location).field,
    });

    const cursors = resetCursors();

    browserHistory.push({
      pathname: location.pathname,
      query: {
        ...location.query,
        ...offsets,
        ...cursors,
        trendFunction: field,
      },
    });
  };

  handleConfidenceChange = (label: string) => {
    const {organization, location} = this.props;

    trackAnalyticsEvent({
      eventKey: 'performance_views.trends.change_confidence',
      eventName: 'Performance Views: Change confidence',
      organization_id: parseInt(organization.id, 10),
      confidence_level: label,
    });

    const cursors = resetCursors();

    browserHistory.push({
      pathname: location.pathname,
      query: {
        ...location.query,
        ...cursors,
        confidenceLevel: label,
      },
    });
  };

  render() {
    const {organization, eventView, location, setError} = this.props;
    const {previousTrendFunction} = this.state;

    const trendView = eventView.clone() as TrendView;
    const fields = generateAggregateFields(
      organization,
      [
        {
          field: 'absolute_correlation()',
        },
        {
          field: 'trend_percentage()',
        },
        {
          field: 'trend_difference()',
        },
        {
          field: 'count_percentage()',
        },
        {
          field: 'tpm()',
        },
        {
          field: 'tps()',
        },
      ],
      ['epm()', 'eps()']
    );
    const currentTrendFunction = getCurrentTrendFunction(location);
    const currentConfidenceLevel = getCurrentConfidenceLevel(location);
    const query = getTransactionSearchQuery(location);

    return (
      <DefaultTrends location={location} eventView={eventView}>
        <StyledSearchContainer>
          <StyledSearchBar
            organization={organization}
            projectIds={trendView.project}
            query={query}
            fields={fields}
            onSearch={this.handleSearch}
          />
          <TrendsDropdown>
            <DropdownControl
              buttonProps={{prefix: t('Confidence')}}
              label={currentConfidenceLevel.label}
            >
              {CONFIDENCE_LEVELS.map(({label}) => (
                <DropdownItem
                  key={label}
                  onSelect={this.handleConfidenceChange}
                  eventKey={label}
                  data-test-id={label}
                  isActive={label === currentConfidenceLevel.label}
                >
                  {label}
                </DropdownItem>
              ))}
            </DropdownControl>
          </TrendsDropdown>
          <TrendsDropdown>
            <DropdownControl
              buttonProps={{prefix: t('Display')}}
              label={currentTrendFunction.label}
            >
              {TRENDS_FUNCTIONS.map(({label, field}) => (
                <DropdownItem
                  key={field}
                  onSelect={this.handleTrendFunctionChange}
                  eventKey={field}
                  data-test-id={field}
                  isActive={field === currentTrendFunction.field}
                >
                  {label}
                </DropdownItem>
              ))}
            </DropdownControl>
          </TrendsDropdown>
        </StyledSearchContainer>
        <TrendsLayoutContainer>
          <ChangedTransactions
            trendChangeType={TrendChangeType.IMPROVED}
            previousTrendFunction={previousTrendFunction}
            trendView={trendView}
            location={location}
            setError={setError}
          />
          <ChangedTransactions
            trendChangeType={TrendChangeType.REGRESSION}
            previousTrendFunction={previousTrendFunction}
            trendView={trendView}
            location={location}
            setError={setError}
          />
        </TrendsLayoutContainer>
      </DefaultTrends>
    );
  }
}

type DefaultTrendsProps = {
  children: React.ReactNode[];
  location: Location;
  eventView: EventView;
};

class DefaultTrends extends React.Component<DefaultTrendsProps> {
  hasPushedDefaults = false;

  render() {
    const {children, location, eventView} = this.props;

    const queryString = decodeScalar(location.query.query);
    const conditions = tokenizeSearch(queryString || '');

    if (queryString || this.hasPushedDefaults) {
      this.hasPushedDefaults = true;
      return <React.Fragment>{children}</React.Fragment>;
    } else {
      this.hasPushedDefaults = true;
      conditions.setTagValues('tpm()', ['>0.01']);
      conditions.setTagValues('transaction.duration', ['>0', `<${DEFAULT_MAX_DURATION}`]);
    }

    const query = stringifyQueryObject(conditions);
    eventView.query = query;

    browserHistory.push({
      pathname: location.pathname,
      query: {
        ...location.query,
        cursor: undefined,
        query: String(query).trim() || undefined,
        view: FilterViews.TRENDS,
      },
    });
    return null;
  }
}

const StyledSearchBar = styled(SearchBar)`
  flex-grow: 1;
  margin-bottom: ${space(2)};
`;

const TrendsDropdown = styled('div')`
  margin-left: ${space(1)};
  flex-grow: 0;
`;

const StyledSearchContainer = styled('div')`
  display: flex;
`;

const TrendsLayoutContainer = styled('div')`
  display: grid;
  grid-gap: ${space(2)};

  @media (min-width: ${p => p.theme.breakpoints[1]}) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: stretch;
  }
`;

export default withGlobalSelection(TrendsContent);
