import React from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';

import {addErrorMessage} from 'sentry/actionCreators/indicator';
import {update} from 'sentry/actionCreators/projects';
import {Client} from 'sentry/api';
import {IconStar} from 'sentry/icons';
import {t} from 'sentry/locale';
import SentryTypes from 'sentry/sentryTypes';
import {Organization, Project} from 'sentry/types';
import {defined} from 'sentry/utils';
import withApi from 'sentry/utils/withApi';

type Props = {
  api: Client;
  organization: Organization;
  project: Project;
  /* used to override when under local state */
  isBookmarked?: boolean;
  className?: string;
  onToggle?: (isBookmarked: boolean) => void;
};

const BookmarkStar = ({
  api,
  isBookmarked: isBookmarkedProp,
  className,
  organization,
  project,
  onToggle,
}: Props) => {
  const isBookmarked = defined(isBookmarkedProp)
    ? isBookmarkedProp
    : project.isBookmarked;

  const toggleProjectBookmark = (event: React.MouseEvent) => {
    update(api, {
      orgId: organization.slug,
      projectId: project.slug,
      data: {isBookmarked: !isBookmarked},
    }).catch(() => {
      addErrorMessage(t('Unable to toggle bookmark for %s', project.slug));
    });

    //needed to dismiss tooltip
    (document.activeElement as HTMLElement).blur();

    //prevent dropdowns from closing
    event.stopPropagation();

    if (onToggle) {
      onToggle(!isBookmarked);
    }
  };

  return (
    <Star
      isSolid
      isBookmarked={isBookmarked}
      onClick={toggleProjectBookmark}
      className={className}
    />
  );
};

BookmarkStar.propTypes = {
  api: PropTypes.any.isRequired,
  /* used to override when under local state */
  isBookmarked: PropTypes.bool,
  className: PropTypes.string,
  organization: SentryTypes.Organization.isRequired,
  project: SentryTypes.Project.isRequired,
  onToggle: PropTypes.func,
};

const Star = styled(IconStar, {shouldForwardProp: p => p !== 'isBookmarked'})<{
  isBookmarked: boolean;
}>`
  color: ${p => (p.isBookmarked ? p.theme.yellow300 : p.theme.gray200)};

  &:hover {
    color: ${p => (p.isBookmarked ? p.theme.yellow200 : p.theme.gray300)};
  }
`;

export default withApi(BookmarkStar);
