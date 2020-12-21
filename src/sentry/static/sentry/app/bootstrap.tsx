import 'bootstrap/js/alert';
import 'bootstrap/js/tab';
import 'bootstrap/js/dropdown';
import 'focus-visible';
import 'sentry/utils/statics-setup';

import React from 'react';
import ReactDOM from 'react-dom';
import * as Router from 'react-router';
import {ExtraErrorData} from '@sentry/integrations';
import * as Sentry from '@sentry/react';
import SentryRRWeb from '@sentry/rrweb';
import {Integrations} from '@sentry/tracing';
import createReactClass from 'create-react-class';
import jQuery from 'jquery';
import moment from 'moment';
import PropTypes from 'prop-types';
import Reflux from 'reflux';

import {DISABLE_RR_WEB, NODE_ENV, SPA_DSN} from 'sentry/constants';
import Main from 'sentry/main';
import plugins from 'sentry/plugins';
import routes from 'sentry/routes';
import ConfigStore from 'sentry/stores/configStore';
import ajaxCsrfSetup from 'sentry/utils/ajaxCsrfSetup';
import {metric} from 'sentry/utils/analytics';
import {init as initApiSentryClient} from 'sentry/utils/apiSentryClient';
import {setupColorScheme} from 'sentry/utils/matchMedia';
import PipelineView from 'sentry/views/integrationPipeline/pipelineView';

if (NODE_ENV === 'development') {
  import(
    /*/* webpackChunkName: "SilenceReactUnsafeWarnings" */ /* webpackMode: "eager" */ 'sentry/utils/silence-react-unsafe-warnings'
  );
}

// App setup
if (window.__initialData) {
  ConfigStore.loadInitialData(window.__initialData);

  if (window.__initialData.dsn_requests) {
    initApiSentryClient(window.__initialData.dsn_requests);
  }
}

// SDK INIT  --------------------------------------------------------
const config = ConfigStore.getConfig();

const tracesSampleRate = config ? config.apmSampling : 0;

function getSentryIntegrations(hasReplays: boolean = false) {
  const integrations = [
    new ExtraErrorData({
      // 6 is arbitrary, seems like a nice number
      depth: 6,
    }),
    new Integrations.BrowserTracing({
      routingInstrumentation: Sentry.reactRouterV3Instrumentation(
        Router.browserHistory as any,
        Router.createRoutes(routes()),
        Router.match
      ),
      idleTimeout: 5000,
    }),
  ];
  if (hasReplays) {
    // eslint-disable-next-line no-console
    console.log('[sentry] Instrumenting session with rrweb');

    // TODO(ts): The type returned by SentryRRWeb seems to be somewhat
    // incompatible. It's a newer plugin, so this can be expected, but we
    // should fix.
    integrations.push(
      new SentryRRWeb({
        checkoutEveryNms: 60 * 1000, // 60 seconds
      }) as any
    );
  }
  return integrations;
}

const hasReplays =
  window.__SENTRY__USER && window.__SENTRY__USER.isStaff && !DISABLE_RR_WEB;

Sentry.init({
  ...window.__SENTRY__OPTIONS,
  /**
   * For SPA mode, we need a way to overwrite the default DSN from backend
   * as well as `whitelistUrls`
   */
  dsn: SPA_DSN || window.__SENTRY__OPTIONS.dsn,
  whitelistUrls: SPA_DSN
    ? ['localhost', 'dev.getsentry.net', 'sentry.dev', 'webpack-internal://']
    : window.__SENTRY__OPTIONS.whitelistUrls,
  integrations: getSentryIntegrations(hasReplays),
  tracesSampleRate,
  autoSessionTracking: true,
});

if (window.__SENTRY__USER) {
  Sentry.setUser(window.__SENTRY__USER);
}
if (window.__SENTRY__VERSION) {
  Sentry.setTag('sentry_version', window.__SENTRY__VERSION);
}
Sentry.setTag('rrweb.active', hasReplays ? 'yes' : 'no');

// Used for operational metrics to determine that the application js
// bundle was loaded by browser.
metric.mark({name: 'sentry-app-init'});

// setup jquery for CSRF tokens
jQuery.ajaxSetup({
  //jQuery won't allow using the ajaxCsrfSetup function directly
  beforeSend: ajaxCsrfSetup,
  // Completely disable evaluation of script responses using jQuery ajax
  // Typically the `text script` converter will eval the text [1]. Instead we
  // just immediately return.
  // [1]: https://github.com/jquery/jquery/blob/8969732518470a7f8e654d5bc5be0b0076cb0b87/src/ajax/script.js#L39-L42
  converters: {
    'text script': (value: any) => value,
  },
});

const ROOT_ELEMENT = 'blk_router';

const render = (Component: React.ComponentType) => {
  const rootEl = document.getElementById(ROOT_ELEMENT);

  try {
    ReactDOM.render(<Component />, rootEl);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      new Error(
        'An unencoded "%" has appeared, it is super effective! (See https://github.com/ReactTraining/history/issues/505)'
      )
    );
    if (err.message === 'URI malformed') {
      window.location.assign(window.location.pathname);
    }
  }
};

const RenderPipelineView = (pipelineName: string, props: Object) => {
  const rootEl = document.getElementById(ROOT_ELEMENT);
  ReactDOM.render(<PipelineView pipelineName={pipelineName} {...props} />, rootEl);
};

// setup darkmode + favicon
setupColorScheme();

// The password strength component is very heavyweight as it includes the
// zxcvbn, a relatively byte-heavy password strength estimation library. Load
// it on demand.
async function loadPasswordStrength(callback: Function) {
  try {
    const module = await import(
      /*/* webpackChunkName: "passwordStrength" */ 'sentry/components/passwordStrength'
    );
    callback(module);
  } catch (err) {
    // Ignore if client can't load this, it enhances UX a bit, but is optional
  }
}

const globals = {
  // This is the primary entrypoint for rendering the sentry app.
  SentryRenderApp: () => render(Main),

  // This is used to render pipeline views (such as the integration popup)
  RenderPipelineView,

  // The following globals are used in sentry-plugins webpack externals
  // configuration.
  PropTypes,
  React,
  Reflux,
  Router,
  Sentry,
  moment,
  ReactDOM: {
    findDOMNode: ReactDOM.findDOMNode,
    render: ReactDOM.render,
  },

  // jQuery is still exported to the window as some bootsrap functionality
  // and legacy plugins like youtrack make use of it.
  $: jQuery,
  jQuery,

  // django templates make use of these globals
  createReactClass,
  SentryApp: {},
};

// The SentryApp global contains exported app modules for use in javascript
// modules that are not compiled with the sentry bundle.
globals.SentryApp = {
  // The following components are used in sentry-plugins.
  Form: require('sentry/components/forms/form').default,
  FormState: require('sentry/components/forms/index').FormState,
  LoadingIndicator: require('sentry/components/loadingIndicator').default,
  plugins: {
    add: plugins.add,
    addContext: plugins.addContext,
    BasePlugin: plugins.BasePlugin,
    DefaultIssuePlugin: plugins.DefaultIssuePlugin,
  },

  // The following components are used in legacy django HTML views
  passwordStrength: {load: loadPasswordStrength},
  U2fSign: require('sentry/components/u2f/u2fsign').default,
  ConfigStore: require('sentry/stores/configStore').default,
  SystemAlerts: require('sentry/views/app/systemAlerts').default,
  Indicators: require('sentry/components/indicators').default,
  SetupWizard: require('sentry/components/setupWizard').default,
};

// Make globals available on the window object
Object.keys(globals).forEach(name => (window[name] = globals[name]));

export default globals;
