import React from 'react';
import styled from '@emotion/styled';
import {Location, LocationDescriptor} from 'history';

import {Client} from 'sentry/api';
import Clipboard from 'sentry/components/clipboard';
import Hovercard from 'sentry/components/hovercard';
import LoadingError from 'sentry/components/loadingError';
import LoadingIndicator from 'sentry/components/loadingIndicator';
import Version from 'sentry/components/version';
import {IconCopy} from 'sentry/icons';
import {t} from 'sentry/locale';
import space from 'sentry/styles/space';
import withApi from 'sentry/utils/withApi';

import DiscoverQuery, {TableData} from './discoverQuery';
import EventView from './eventView';

type ChildrenProps = {to: LocationDescriptor};

type Props = {
  api: Client;

  orgId: string;
  traceId: string;

  location: Location;

  children: (props: ChildrenProps) => React.ReactNode;

  // hover card props
  containerClassName: string;
};

class TraceHoverCard extends React.Component<Props> {
  renderHeader() {
    const {traceId} = this.props;

    return (
      <HeaderWrapper>
        <span>{t('Trace')}</span>
        <TraceWrapper>
          <StyledTrace version={traceId} truncate anchor={false} />
          <Clipboard value={traceId}>
            <ClipboardIconWrapper>
              <IconCopy size="xs" />
            </ClipboardIconWrapper>
          </Clipboard>
        </TraceWrapper>
      </HeaderWrapper>
    );
  }

  renderBody({
    tableData,
    isLoading,
    error,
  }: {
    tableData: TableData | null;
    isLoading: boolean;
    error: null | string;
  }) {
    if (isLoading) {
      return (
        <LoadingWrapper>
          <LoadingIndicator mini />
        </LoadingWrapper>
      );
    }

    if (error) {
      return <LoadingError />;
    }

    if (!tableData) {
      return null;
    }

    let numOfTransactions = 0;
    let numOfErrors = 0;
    // aggregate transaction and error (default, csp, error) counts
    for (const row of tableData.data) {
      if (row['event.type'] === 'transaction') {
        numOfTransactions = (row.count as number) ?? 0;
      } else {
        numOfErrors += (row.count as number) ?? 0;
      }
    }

    return (
      <CardBodyWrapper>
        <EventCountWrapper>
          <h6>{t('Transactions')}</h6>
          <div className="count-since">{numOfTransactions.toLocaleString()}</div>
        </EventCountWrapper>
        <EventCountWrapper>
          <h6>{t('Errors')}</h6>
          <div className="count-since">{numOfErrors.toLocaleString()}</div>
        </EventCountWrapper>
      </CardBodyWrapper>
    );
  }

  render() {
    const {traceId, location, api, orgId} = this.props;

    // used to fetch number of transactions to display in hovercard
    const numTransactionsEventView = EventView.fromNewQueryWithLocation(
      {
        id: undefined,
        name: `Transactions with Trace ID ${traceId}`,
        fields: ['event.type', 'count()'],
        query: `trace:${traceId}`,
        projects: [],
        version: 2,
      },
      location
    );

    // used to create link to discover page with relevant query
    const traceEventView = EventView.fromNewQueryWithLocation(
      {
        id: undefined,
        name: `Events with Trace ID ${traceId}`,
        fields: ['transaction', 'project', 'trace.span', 'event.type', 'timestamp'],
        orderby: '-timestamp',
        query: `trace:${traceId}`,
        projects: [],
        version: 2,
      },
      location
    );

    const to = traceEventView.getResultsViewUrlTarget(orgId);

    return (
      <DiscoverQuery
        api={api}
        location={location}
        eventView={numTransactionsEventView}
        orgSlug={orgId}
      >
        {({isLoading, error, tableData}) => {
          return (
            <Hovercard
              {...this.props}
              header={this.renderHeader()}
              body={this.renderBody({isLoading, error, tableData})}
            >
              {this.props.children({to})}
            </Hovercard>
          );
        }}
      </DiscoverQuery>
    );
  }
}

const HeaderWrapper = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const TraceWrapper = styled('div')`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: flex-end;
`;

const StyledTrace = styled(Version)`
  margin-right: ${space(0.5)};
  max-width: 190px;
`;

const ClipboardIconWrapper = styled('span')`
  &:hover {
    cursor: pointer;
  }
`;

const LoadingWrapper = styled('div')`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CardBodyWrapper = styled('div')`
  display: flex;
`;

const EventCountWrapper = styled('div')`
  flex: 1;
`;

export default withApi(TraceHoverCard);
