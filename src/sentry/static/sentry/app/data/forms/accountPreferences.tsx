import languages from 'sentry/data/languages';
import timezones from 'sentry/data/timezones';
import {t} from 'sentry/locale';
import {JsonFormObject} from 'sentry/views/settings/components/forms/type';

// Export route to make these forms searchable by label/help
export const route = '/settings/account/details/';

// Called before sending API request, these fields need to be sent as an
// `options` object
const transformOptions = (data: object) => ({options: data});

const formGroups: JsonFormObject[] = [
  {
    // Form "section"/"panel"
    title: 'Preferences',
    fields: [
      {
        name: 'theme',
        type: 'choice',
        label: t('Theme'),
        visible: ({user}) => user.isStaff,
        help: t(
          "Select your theme preference. It can be synced to your system's theme, always Light mode, or always Dark mode."
        ),
        choices: [
          ['light', t('Light')],
          ['dark', t('Dark')],
          ['system', t('Default to system')],
        ],
        getData: transformOptions,
      },
      {
        name: 'stacktraceOrder',
        type: 'choice',
        required: false,
        choices: [
          ['-1', t('Default (let Sentry decide)')],
          ['1', t('Most recent call last')],
          ['2', t('Most recent call first')],
        ],
        label: t('Stack Trace Order'),
        help: t('Choose the default ordering of frames in stack traces'),
        getData: transformOptions,
      },
      {
        name: 'language',
        type: 'choice',
        label: t('Language'),
        choices: languages,
        getData: transformOptions,
      },
      {
        name: 'timezone',
        type: 'choice',
        label: t('Timezone'),
        choices: timezones,
        getData: transformOptions,
      },
      {
        name: 'clock24Hours',
        type: 'boolean',
        label: t('Use a 24-hour clock'),
        getData: transformOptions,
      },
    ],
  },
];

export default formGroups;
