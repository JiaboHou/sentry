import React from 'react';
import {Observer} from 'mobx-react';

import FormState from 'sentry/components/forms/state';
import ControlState from 'sentry/views/settings/components/forms/field/controlState';
import FormModel from 'sentry/views/settings/components/forms/model';

type Props = {
  model: FormModel;
  name: string;
};

/**
 * ControlState (i.e. loading/error icons) for connected form components
 */
class FormFieldControlState extends React.Component<Props> {
  render() {
    const {model, name} = this.props;

    return (
      <Observer>
        {() => {
          const isSaving = model.getFieldState(name, FormState.SAVING);
          const isSaved = model.getFieldState(name, FormState.READY);
          const error = model.getError(name);

          return <ControlState isSaving={isSaving} isSaved={isSaved} error={error} />;
        }}
      </Observer>
    );
  }
}

export default FormFieldControlState;
