import React from 'react';

import {
  IconClickup,
  IconClubhouse,
  IconGeneric,
  IconLinear,
  IconRookout,
  IconTeamwork,
  IconZepel,
} from 'sentry/icons';
import {SentryAppComponent} from 'sentry/types';

type Props = {
  slug: SentryAppComponent['sentryApp']['slug'];
};

const SentryAppIcon = ({slug}: Props) => {
  switch (slug) {
    case 'clickup':
      return <IconClickup size="md" />;
    case 'clubhouse':
      return <IconClubhouse size="md" />;
    case 'rookout':
      return <IconRookout size="md" />;
    case 'teamwork':
      return <IconTeamwork size="md" />;
    case 'linear':
      return <IconLinear size="md" />;
    case 'zepel':
      return <IconZepel size="md" />;
    default:
      return <IconGeneric size="md" />;
  }
};

export {SentryAppIcon};
