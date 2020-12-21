import React from 'react';

import EmptyStateWarning from 'sentry/components/emptyStateWarning';
import {Panel, PanelBody} from 'sentry/components/panels';

type Props = Pick<React.ComponentProps<typeof EmptyStateWarning>, 'withIcon'> & {
  children: React.ReactNode;
};

const EmptyState = ({withIcon, children}: Props) => (
  <Panel>
    <PanelBody>
      <EmptyStateWarning small withIcon={withIcon}>
        {children}
      </EmptyStateWarning>
    </PanelBody>
  </Panel>
);

export default EmptyState;
