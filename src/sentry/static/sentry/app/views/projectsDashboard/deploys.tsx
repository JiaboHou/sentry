import React from 'react';
import styled from '@emotion/styled';

import Button from 'sentry/components/button';
import TextOverflow from 'sentry/components/textOverflow';
import TimeSince from 'sentry/components/timeSince';
import Version from 'sentry/components/version';
import {IconReleases} from 'sentry/icons';
import {t} from 'sentry/locale';
import SentryTypes from 'sentry/sentryTypes';
import space from 'sentry/styles/space';
import {Deploy as DeployType, Project} from 'sentry/types';
import getDynamicText from 'sentry/utils/getDynamicText';

const DEPLOY_COUNT = 2;

type Props = {
  project: Project;
};

const Deploys = ({project}: Props) => {
  const flattenedDeploys = Object.entries(project.latestDeploys || {}).map(
    ([environment, value]): Pick<
      DeployType,
      'version' | 'dateFinished' | 'environment'
    > => ({environment, ...value})
  );

  const deploys = (flattenedDeploys || [])
    .sort(
      (a, b) => new Date(b.dateFinished).getTime() - new Date(a.dateFinished).getTime()
    )
    .slice(0, DEPLOY_COUNT);

  if (!deploys.length) {
    return <NoDeploys />;
  }

  return (
    <DeployRows>
      {deploys.map(deploy => (
        <Deploy
          key={`${deploy.environment}-${deploy.version}`}
          deploy={deploy}
          project={project}
        />
      ))}
    </DeployRows>
  );
};

Deploys.propTypes = {
  project: SentryTypes.Project.isRequired,
};

export default Deploys;

type DeployProps = Props & {
  deploy: Pick<DeployType, 'version' | 'dateFinished' | 'environment'>;
};

const Deploy = ({deploy, project}: DeployProps) => (
  <React.Fragment>
    <IconReleases size="sm" />
    <TextOverflow>
      <Environment>{deploy.environment}</Environment>
      <Version
        version={deploy.version}
        projectId={project.id}
        tooltipRawVersion
        truncate
      />
    </TextOverflow>

    <DeployTime>
      {getDynamicText({
        fixed: '3 hours ago',
        value: <TimeSince date={deploy.dateFinished} />,
      })}
    </DeployTime>
  </React.Fragment>
);

Deploy.propTypes = {
  deploy: SentryTypes.Deploy.isRequired,
  project: SentryTypes.Project.isRequired,
};

const NoDeploys = () => (
  <GetStarted>
    <Button size="small" href="https://docs.sentry.io/learn/releases/" external>
      {t('Track deploys')}
    </Button>
  </GetStarted>
);
const DeployContainer = styled('div')`
  padding: ${space(2)};
  height: 115px;
`;

const DeployRows = styled(DeployContainer)`
  display: grid;
  grid-template-columns: 30px 1fr 1fr;
  grid-template-rows: auto;
  grid-column-gap: ${space(1)};
  grid-row-gap: ${space(1)};
  font-size: ${p => p.theme.fontSizeMedium};
  line-height: 1.2;
`;

const Environment = styled('div')`
  color: ${p => p.theme.textColor};
  margin: 0;
`;

const DeployTime = styled('div')`
  color: ${p => p.theme.gray300};
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
`;

const GetStarted = styled(DeployContainer)`
  display: flex;
  align-items: center;
  justify-content: center;
`;
