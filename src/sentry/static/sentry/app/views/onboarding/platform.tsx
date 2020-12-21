import React from 'react';
import {ClassNames} from '@emotion/core';

import {addErrorMessage} from 'sentry/actionCreators/indicator';
import {createProject} from 'sentry/actionCreators/projects';
import ProjectActions from 'sentry/actions/projectActions';
import {Client} from 'sentry/api';
import Button from 'sentry/components/button';
import PlatformPicker from 'sentry/components/platformPicker';
import {PlatformKey} from 'sentry/data/platformCategories';
import {t, tct} from 'sentry/locale';
import space from 'sentry/styles/space';
import {Team} from 'sentry/types';
import withApi from 'sentry/utils/withApi';
import withTeams from 'sentry/utils/withTeams';

import {StepProps} from './types';

type Props = StepProps & {
  api: Client;
  teams: Team[];
};

type State = {
  /**
   * This will be flipped to true immediately before creating the first
   * project. We use state here to avoid the intermittent prop value where
   * the project is created but the store hasn't propagated its value to the
   * component yet, leaving a brief period where the button will flash
   * between labels / disabled states.
   */
  firstProjectCreated: boolean;
  /**
   * `progressing` indicates that we are moving to the next step. Again, this
   * is kept as state to avoid intermittent states causing flickering of the
   * button.
   */
  progressing: boolean;
};

class OnboardingPlatform extends React.Component<Props, State> {
  state: State = {
    firstProjectCreated: false,
    progressing: false,
  };

  componentDidUpdate(prevProps: Props) {
    if (prevProps.active && !this.props.active) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({progressing: false});
    }
  }

  get hasFirstProject() {
    return this.props.project || this.state.firstProjectCreated;
  }

  get contineButtonLabel() {
    if (this.state.progressing) {
      return t('Creating Project...');
    }
    if (!this.hasFirstProject) {
      return t('Create Project');
    }
    if (!this.props.active) {
      return t('Project Created');
    }
    return t('Setup Your Project');
  }

  async createFirstProject(platform: PlatformKey) {
    const {api, orgId, teams} = this.props;

    if (this.hasFirstProject) {
      return;
    }

    if (teams.length < 1) {
      return;
    }

    this.setState({firstProjectCreated: true});

    try {
      const data = await createProject(api, orgId, teams[0].slug, orgId, platform, {
        defaultRules: false,
      });
      ProjectActions.createSuccess(data);
    } catch (error) {
      addErrorMessage(t('Failed to create project'));
      throw error;
    }
  }

  handleSetPlatform = (platform: PlatformKey | null) => {
    const {onUpdate, onReturnToStep} = this.props;

    if (platform) {
      onUpdate({platform});
    } else {
      // Platform de-selected
      onReturnToStep({platform});
    }
  };

  handleContinue = async () => {
    this.setState({progressing: true});
    const {platform} = this.props;

    if (platform === null) {
      return;
    }

    // Create their first project if they don't already have one. This is a
    // no-op if they already have a project.
    await this.createFirstProject(platform);
    this.props.onComplete({});
  };

  render() {
    const {active, project, platform, scrollTargetId} = this.props;

    const selectedPlatform = platform || (project && project.platform);

    const continueDisabled =
      !selectedPlatform || this.state.progressing || (this.hasFirstProject && !active);

    return (
      <React.Fragment>
        <p>
          {tct(
            `Sentry integrates with many different languages and platforms
             through the official [strong:Sentry SDKs]. Select your platform
             from the list below to see a tailored installation process for
             Sentry.`,
            {strong: <strong />}
          )}
        </p>
        <p>
          {tct(
            `Not seeing your platform in the list below? Select the
             [strong:other platform], and use a community client!`,
            {strong: <strong />}
          )}
        </p>
        <ClassNames>
          {({css}) => (
            <PlatformPicker
              noAutoFilter
              listClassName={css`
                max-height: 420px;
                overflow-y: scroll;
                /* Needed to fix overflow cropping of the de-select button */
                margin-top: -${space(2)};
                padding-top: ${space(2)};
              `}
              listProps={{id: scrollTargetId}}
              platform={selectedPlatform}
              setPlatform={this.handleSetPlatform}
            />
          )}
        </ClassNames>
        <Button
          data-test-id="platform-select-next"
          priority="primary"
          disabled={continueDisabled}
          onClick={this.handleContinue}
        >
          {this.contineButtonLabel}
        </Button>
      </React.Fragment>
    );
  }
}

export default withApi(withTeams(OnboardingPlatform));
