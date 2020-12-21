import React from 'react';
import styled from '@emotion/styled';
import {Location} from 'history';
import pick from 'lodash/pick';

import Badge from 'sentry/components/badge';
import Breadcrumbs from 'sentry/components/breadcrumbs';
import Clipboard from 'sentry/components/clipboard';
import IdBadge from 'sentry/components/idBadge';
import * as Layout from 'sentry/components/layouts/thirds';
import ExternalLink from 'sentry/components/links/externalLink';
import ListLink from 'sentry/components/links/listLink';
import NavTabs from 'sentry/components/navTabs';
import Tooltip from 'sentry/components/tooltip';
import Version from 'sentry/components/version';
import {URL_PARAM} from 'sentry/constants/globalSelectionHeader';
import {IconCopy, IconOpen} from 'sentry/icons';
import {t} from 'sentry/locale';
import space from 'sentry/styles/space';
import {Organization, Release, ReleaseMeta, ReleaseProject} from 'sentry/types';
import {formatAbbreviatedNumber, formatVersion} from 'sentry/utils/formatters';

import ReleaseActions from './releaseActions';

type Props = {
  location: Location;
  organization: Organization;
  release: Release;
  project: Required<ReleaseProject>;
  releaseMeta: ReleaseMeta;
  refetchData: () => void;
};

const ReleaseHeader = ({
  location,
  organization,
  release,
  project,
  releaseMeta,
  refetchData,
}: Props) => {
  const {version, url} = release;
  const {commitCount, commitFilesChanged, releaseFileCount} = releaseMeta;

  const releasePath = `/organizations/${organization.slug}/releases/${encodeURIComponent(
    version
  )}/`;

  const tabs = [
    {title: t('Overview'), to: releasePath},
    {
      title: (
        <React.Fragment>
          {t('Commits')} <NavTabsBadge text={formatAbbreviatedNumber(commitCount)} />
        </React.Fragment>
      ),
      to: `${releasePath}commits/`,
    },
    {
      title: (
        <React.Fragment>
          {t('Files Changed')}
          <NavTabsBadge text={formatAbbreviatedNumber(commitFilesChanged)} />
        </React.Fragment>
      ),
      to: `${releasePath}files-changed/`,
    },
    {
      title: (
        <React.Fragment>
          {t('Artifacts')}
          <NavTabsBadge text={formatAbbreviatedNumber(releaseFileCount)} />
        </React.Fragment>
      ),
      to: `${releasePath}artifacts/`,
    },
  ];

  const getCurrentTabUrl = (path: string) => ({
    pathname: path,
    query: pick(location.query, Object.values(URL_PARAM)),
  });

  return (
    <Layout.Header>
      <Layout.HeaderContent>
        <Breadcrumbs
          crumbs={[
            {
              to: `/organizations/${organization.slug}/releases/`,
              label: t('Releases'),
              preserveGlobalSelection: true,
            },
            {label: formatVersion(version)},
          ]}
        />
        <Layout.Title>
          <IdBadge
            project={project}
            avatarSize={28}
            displayName={
              <ReleaseName>
                <Version version={version} anchor={false} />
                <IconWrapper>
                  <Clipboard value={version}>
                    <Tooltip title={version} containerDisplayMode="flex">
                      <IconCopy size="xs" />
                    </Tooltip>
                  </Clipboard>
                </IconWrapper>
                {!!url && (
                  <IconWrapper>
                    <Tooltip title={url}>
                      <ExternalLink href={url}>
                        <IconOpen size="xs" />
                      </ExternalLink>
                    </Tooltip>
                  </IconWrapper>
                )}
              </ReleaseName>
            }
          />
        </Layout.Title>
      </Layout.HeaderContent>

      <Layout.HeaderActions>
        <ReleaseActions
          orgSlug={organization.slug}
          projectSlug={project.slug}
          release={release}
          releaseMeta={releaseMeta}
          refetchData={refetchData}
        />
      </Layout.HeaderActions>

      <React.Fragment>
        <StyledNavTabs>
          {tabs.map(tab => (
            <ListLink
              key={tab.to}
              to={getCurrentTabUrl(tab.to)}
              isActive={() => tab.to === location.pathname}
            >
              {tab.title}
            </ListLink>
          ))}
        </StyledNavTabs>
      </React.Fragment>
    </Layout.Header>
  );
};

const ReleaseName = styled('div')`
  display: flex;
  align-items: center;
`;

const IconWrapper = styled('span')`
  transition: color 0.3s ease-in-out;
  margin-left: ${space(1)};

  &,
  a {
    color: ${p => p.theme.gray300};
    display: flex;
    &:hover {
      cursor: pointer;
      color: ${p => p.theme.textColor};
    }
  }
`;

const StyledNavTabs = styled(NavTabs)`
  margin-bottom: 0;
  /* Makes sure the tabs are pushed into another row */
  width: 100%;
`;

const NavTabsBadge = styled(Badge)`
  @media (max-width: ${p => p.theme.breakpoints[0]}) {
    display: none;
  }
`;

export default ReleaseHeader;
