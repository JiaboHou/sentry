import React from 'react';
import {ClassNames} from '@emotion/core';
import styled from '@emotion/styled';

import {openCreateOwnershipRule} from 'sentry/actionCreators/modal';
import GuideAnchor from 'sentry/components/assistant/guideAnchor';
import Button from 'sentry/components/button';
import Hovercard from 'sentry/components/hovercard';
import {IconQuestion} from 'sentry/icons';
import {t} from 'sentry/locale';
import space from 'sentry/styles/space';
import {Organization, Project} from 'sentry/types';

import SidebarSection from '../sidebarSection';

type Props = {
  project: Project;
  organization: Organization;
  issueId: string;
};

const OwnershipRules = ({project, organization, issueId}: Props) => {
  const handleOpenCreateOwnershipRule = () => {
    openCreateOwnershipRule({project, organization, issueId});
  };

  return (
    <SidebarSection
      title={
        <React.Fragment>
          {t('Ownership Rules')}
          <ClassNames>
            {({css}) => (
              <Hovercard
                body={
                  <HelpfulBody>
                    <p>
                      {t(
                        'Ownership rules allow you to associate file paths and URLs to specific teams or users, so alerts can be routed to the right people.'
                      )}
                    </p>
                    <Button
                      href="https://docs.sentry.io/workflow/issue-owners/"
                      priority="primary"
                    >
                      {t('Learn more')}
                    </Button>
                  </HelpfulBody>
                }
                containerClassName={css`
                  display: flex;
                  align-items: center;
                `}
              >
                <StyledIconQuestion size="xs" />
              </Hovercard>
            )}
          </ClassNames>
        </React.Fragment>
      }
    >
      <GuideAnchor target="owners" position="bottom" offset={space(3)}>
        <Button onClick={handleOpenCreateOwnershipRule} size="small">
          {t('Create Ownership Rule')}
        </Button>
      </GuideAnchor>
    </SidebarSection>
  );
};

export {OwnershipRules};

const StyledIconQuestion = styled(IconQuestion)`
  margin-left: ${space(0.5)};
`;

const HelpfulBody = styled('div')`
  padding: ${space(1)};
  text-align: center;
`;
