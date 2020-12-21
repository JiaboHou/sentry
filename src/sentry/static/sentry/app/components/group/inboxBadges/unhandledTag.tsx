import React from 'react';
import styled from '@emotion/styled';

import Feature from 'sentry/components/acl/feature';
import Tooltip from 'sentry/components/tooltip';
import {IconFire} from 'sentry/icons';
import {t} from 'sentry/locale';
import {Organization} from 'sentry/types';

// TODO(matej): remove "unhandled-issue-flag" feature flag once testing is over (otherwise this won't ever be rendered in a shared event)
const UnhandledTag = ({organization}: {organization: Organization}) => (
  <Feature organization={organization} features={['unhandled-issue-flag']}>
    <Tooltip title={t('An unhandled error was detected in this Issue.')}>
      <UnhandledTagWrapper>
        <StyledIconFire size="xs" color="red300" />
        {t('Unhandled')}
      </UnhandledTagWrapper>
    </Tooltip>
  </Feature>
);

export default UnhandledTag;

const UnhandledTagWrapper = styled('div')`
  display: flex;
  align-items: center;
  white-space: nowrap;
  color: ${p => p.theme.red300};
`;

const StyledIconFire = styled(IconFire)`
  margin-right: 3px;
`;
