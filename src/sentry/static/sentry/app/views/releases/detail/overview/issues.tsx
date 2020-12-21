import React from 'react';
import styled from '@emotion/styled';
import {Location} from 'history';
import pick from 'lodash/pick';

import Feature from 'sentry/components/acl/feature';
import Button from 'sentry/components/button';
import ButtonBar from 'sentry/components/buttonBar';
import DiscoverButton from 'sentry/components/discoverButton';
import DropdownButton from 'sentry/components/dropdownButton';
import DropdownControl, {DropdownItem} from 'sentry/components/dropdownControl';
import GroupList from 'sentry/components/issues/groupList';
import {Panel} from 'sentry/components/panels';
import {DEFAULT_RELATIVE_PERIODS} from 'sentry/constants';
import {URL_PARAM} from 'sentry/constants/globalSelectionHeader';
import {t, tct} from 'sentry/locale';
import space from 'sentry/styles/space';
import {GlobalSelection} from 'sentry/types';
import {QueryResults, stringifyQueryObject} from 'sentry/utils/tokenizeSearch';

import EmptyState from '../emptyState';

import {getReleaseEventView} from './chart/utils';

enum IssuesType {
  NEW = 'new',
  UNHANDLED = 'unhandled',
  RESOLVED = 'resolved',
  ALL = 'all',
}

type IssuesQueryParams = {
  limit: number;
  sort: string;
  query: string;
};

type Props = {
  orgId: string;
  version: string;
  selection: GlobalSelection;
  location: Location;
};

type State = {
  issuesType: IssuesType;
};

class Issues extends React.Component<Props, State> {
  state: State = {
    issuesType: IssuesType.NEW,
  };

  getDiscoverUrl() {
    const {version, orgId, selection} = this.props;
    const discoverView = getReleaseEventView(selection, version);

    return discoverView.getResultsViewUrlTarget(orgId);
  }

  getIssuesUrl() {
    const {version, orgId} = this.props;
    const {issuesType} = this.state;
    const {queryParams} = this.getIssuesEndpoint();
    const query = new QueryResults([]);

    switch (issuesType) {
      case IssuesType.NEW:
        query.setTagValues('firstRelease', [version]);
        break;
      case IssuesType.UNHANDLED:
        query.setTagValues('release', [version]);
        query.setTagValues('error.handled', ['0']);
        break;
      case IssuesType.RESOLVED:
      case IssuesType.ALL:
      default:
        query.setTagValues('release', [version]);
    }

    return {
      pathname: `/organizations/${orgId}/issues/`,
      query: {
        ...queryParams,
        query: stringifyQueryObject(query),
      },
    };
  }

  getIssuesEndpoint(): {path: string; queryParams: IssuesQueryParams} {
    const {version, orgId, location} = this.props;
    const {issuesType} = this.state;
    const queryParams = {
      ...pick(location.query, [...Object.values(URL_PARAM), 'cursor']),
      limit: 50,
      sort: 'new',
    };

    switch (issuesType) {
      case IssuesType.ALL:
        return {
          path: `/organizations/${orgId}/issues/`,
          queryParams: {
            ...queryParams,
            query: stringifyQueryObject(new QueryResults([`release:${version}`])),
          },
        };
      case IssuesType.RESOLVED:
        return {
          path: `/organizations/${orgId}/releases/${version}/resolved/`,
          queryParams: {...queryParams, query: ''},
        };
      case IssuesType.UNHANDLED:
        return {
          path: `/organizations/${orgId}/issues/`,
          queryParams: {
            ...queryParams,
            query: stringifyQueryObject(
              new QueryResults([`release:${version}`, 'error.handled:0'])
            ),
          },
        };
      case IssuesType.NEW:
      default:
        return {
          path: `/organizations/${orgId}/issues/`,
          queryParams: {
            ...queryParams,
            query: stringifyQueryObject(new QueryResults([`first-release:${version}`])),
          },
        };
    }
  }

  handleIssuesTypeSelection = (issuesType: IssuesType) => {
    this.setState({issuesType});
  };

  renderEmptyMessage = () => {
    const {selection} = this.props;
    const {issuesType} = this.state;

    const selectedTimePeriod = DEFAULT_RELATIVE_PERIODS[selection.datetime.period];
    const displayedPeriod = selectedTimePeriod
      ? selectedTimePeriod.toLowerCase()
      : t('given timeframe');

    return (
      <EmptyState withIcon={false}>
        <React.Fragment>
          {issuesType === IssuesType.NEW &&
            tct('No new issues in this release for the [timePeriod].', {
              timePeriod: displayedPeriod,
            })}
          {issuesType === IssuesType.UNHANDLED &&
            tct('No unhandled issues in this release for the [timePeriod].', {
              timePeriod: displayedPeriod,
            })}
          {issuesType === IssuesType.RESOLVED && t('No resolved issues in this release.')}
          {issuesType === IssuesType.ALL &&
            tct('No issues in this release for the [timePeriod].', {
              timePeriod: displayedPeriod,
            })}
        </React.Fragment>
      </EmptyState>
    );
  };

  render() {
    const {issuesType} = this.state;
    const {orgId} = this.props;
    const {path, queryParams} = this.getIssuesEndpoint();
    const issuesTypes = [
      {value: IssuesType.NEW, label: t('New Issues')},
      {value: IssuesType.RESOLVED, label: t('Resolved Issues')},
      {value: IssuesType.UNHANDLED, label: t('Unhandled Issues')},
      {value: IssuesType.ALL, label: t('All Issues')},
    ];

    return (
      <React.Fragment>
        <ControlsWrapper>
          <DropdownControl
            button={({isOpen, getActorProps}) => (
              <StyledDropdownButton
                {...getActorProps()}
                isOpen={isOpen}
                prefix={t('Filter')}
                size="small"
              >
                {issuesTypes.find(i => i.value === issuesType)?.label}
              </StyledDropdownButton>
            )}
          >
            {issuesTypes.map(({value, label}) => (
              <StyledDropdownItem
                key={value}
                onSelect={this.handleIssuesTypeSelection}
                data-test-id={`filter-${value}`}
                eventKey={value}
                isActive={value === issuesType}
              >
                {label}
              </StyledDropdownItem>
            ))}
          </DropdownControl>

          <OpenInButtonBar gap={1}>
            <Feature features={['discover-basic']}>
              <DiscoverButton
                to={this.getDiscoverUrl()}
                size="small"
                data-test-id="discover-button"
              >
                {t('Open in Discover')}
              </DiscoverButton>
            </Feature>

            <Button to={this.getIssuesUrl()} size="small" data-test-id="issues-button">
              {t('Open in Issues')}
            </Button>
          </OpenInButtonBar>
        </ControlsWrapper>
        <TableWrapper data-test-id="release-wrapper">
          <GroupList
            orgId={orgId}
            endpointPath={path}
            queryParams={queryParams}
            query=""
            canSelectGroups={false}
            withChart={false}
            renderEmptyMessage={this.renderEmptyMessage}
          />
        </TableWrapper>
      </React.Fragment>
    );
  }
}

const ControlsWrapper = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${space(1)};
  @media (max-width: ${p => p.theme.breakpoints[0]}) {
    display: block;
  }
`;

const OpenInButtonBar = styled(ButtonBar)`
  @media (max-width: ${p => p.theme.breakpoints[0]}) {
    margin-top: ${space(1)};
  }
`;

const StyledDropdownButton = styled(DropdownButton)`
  min-width: 145px;
`;

const StyledDropdownItem = styled(DropdownItem)`
  white-space: nowrap;
`;

const TableWrapper = styled('div')`
  margin-bottom: ${space(4)};
  ${Panel} {
    /* smaller space between table and pagination */
    margin-bottom: -${space(1)};
  }
`;

export default Issues;
