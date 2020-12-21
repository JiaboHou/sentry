import React from 'react';

import {fetchOrganizationDetails} from 'sentry/actionCreators/organizations';
import SentryTypes from 'sentry/sentryTypes';
import {Organization} from 'sentry/types';
import withLatestContext from 'sentry/utils/withLatestContext';
import AccountSettingsNavigation from 'sentry/views/settings/account/accountSettingsNavigation';
import SettingsLayout from 'sentry/views/settings/components/settingsLayout';

type Props = React.ComponentProps<typeof SettingsLayout> & {
  organization: Organization;
};

class AccountSettingsLayout extends React.Component<Props> {
  static childContextTypes = {
    organization: SentryTypes.Organization,
  };

  getChildContext() {
    return {
      organization: this.props.organization,
    };
  }

  componentDidUpdate(prevProps: Props) {
    const {organization} = this.props;
    if (prevProps.organization === organization) {
      return;
    }

    // if there is no org in context, SidebarDropdown uses an org from `withLatestContext`
    // (which queries the org index endpoint instead of org details)
    // and does not have `access` info
    if (organization && typeof organization.access === 'undefined') {
      fetchOrganizationDetails(organization.slug, {
        setActive: true,
        loadProjects: true,
      });
    }
  }

  render() {
    return (
      <SettingsLayout
        {...this.props}
        renderNavigation={() => <AccountSettingsNavigation />}
      >
        {this.props.children}
      </SettingsLayout>
    );
  }
}

export default withLatestContext(AccountSettingsLayout);
