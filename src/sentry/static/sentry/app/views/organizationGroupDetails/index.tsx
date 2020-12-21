import React from 'react';
import * as ReactRouter from 'react-router';

import {GlobalSelection, Organization} from 'sentry/types';
import {analytics, metric} from 'sentry/utils/analytics';
import withGlobalSelection from 'sentry/utils/withGlobalSelection';
import withOrganization, {isLightweightOrganization} from 'sentry/utils/withOrganization';

import GroupDetails from './groupDetails';

type Props = {
  selection: GlobalSelection;
  isGlobalSelectionReady: boolean;
  organization: Organization;
  children: React.ReactNode;
} & ReactRouter.RouteComponentProps<{orgId: string; groupId: string}, {}>;

class OrganizationGroupDetails extends React.Component<Props> {
  constructor(props: Props) {
    super(props);

    // Setup in the constructor as render() may be expensive
    this.startMetricCollection();
  }

  componentDidMount() {
    analytics('issue_page.viewed', {
      group_id: parseInt(this.props.params.groupId, 10),
      org_id: parseInt(this.props.organization.id, 10),
    });
  }

  /**
   * See "page-issue-list-start" for explanation on hot/cold-starts
   */
  startMetricCollection() {
    const startType = isLightweightOrganization(this.props.organization)
      ? 'cold-start'
      : 'warm-start';
    metric.mark({name: 'page-issue-details-start', data: {start_type: startType}});
  }

  render() {
    const {selection, ...props} = this.props;

    return (
      <GroupDetails
        key={`${this.props.params.groupId}-envs:${selection.environments.join(',')}`}
        environments={selection.environments}
        {...props}
      />
    );
  }
}

export default withOrganization(withGlobalSelection(OrganizationGroupDetails));
