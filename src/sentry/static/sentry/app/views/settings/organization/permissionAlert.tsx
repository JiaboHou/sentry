import React from 'react';
import PropTypes from 'prop-types';

import Access from 'sentry/components/acl/access';
import Alert from 'sentry/components/alert';
import {IconWarning} from 'sentry/icons';
import {t} from 'sentry/locale';

type Props = React.ComponentPropsWithoutRef<typeof Alert> &
  Pick<React.ComponentProps<typeof Access>, 'access'>;

const PermissionAlert = ({access = ['org:write'], ...props}: Props) => (
  <Access access={access}>
    {({hasAccess}) =>
      !hasAccess && (
        <Alert type="warning" icon={<IconWarning size="sm" />} {...props}>
          {t(
            'These settings can only be edited by users with the organization owner or manager role.'
          )}
        </Alert>
      )
    }
  </Access>
);

PermissionAlert.propTypes = {
  access: PropTypes.arrayOf(PropTypes.string),
};

export default PermissionAlert;
