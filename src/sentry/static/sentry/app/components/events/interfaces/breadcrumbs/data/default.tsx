import React from 'react';

import AnnotatedText from 'sentry/components/events/meta/annotatedText';
import {getMeta} from 'sentry/components/events/meta/metaProxy';
import Highlight from 'sentry/components/highlight';
import Link from 'sentry/components/links/link';
import {Event, Project} from 'sentry/types';
import {eventDetailsRoute, generateEventSlug} from 'sentry/utils/discover/urls';
import withProjects from 'sentry/utils/withProjects';

import {BreadcrumbTypeDefault, BreadcrumbTypeNavigation} from '../types';

import Summary from './summary';

type Props = {
  searchTerm: string;
  breadcrumb: BreadcrumbTypeDefault | BreadcrumbTypeNavigation;
  event: Event;
  orgId: string | null;
};

const Default = ({breadcrumb, event, orgId, searchTerm}: Props) => (
  <Summary kvData={breadcrumb.data} searchTerm={searchTerm}>
    {breadcrumb?.message && (
      <AnnotatedText
        value={
          <FormatMessage
            searchTerm={searchTerm}
            event={event}
            orgId={orgId}
            breadcrumb={breadcrumb}
            message={breadcrumb.message}
          />
        }
        meta={getMeta(breadcrumb, 'message')}
      />
    )}
  </Summary>
);

function isEventId(maybeEventId: string): boolean {
  // maybeEventId is an event id if it's a hex string of 32 characters long
  return /^[a-fA-F0-9]{32}$/.test(maybeEventId);
}

const FormatMessage = withProjects(function FormatMessageInner({
  searchTerm,
  event,
  message,
  breadcrumb,
  projects,
  loadingProjects,
  orgId,
}: {
  searchTerm: string;
  event: Event;
  projects: Project[];
  loadingProjects: boolean;
  breadcrumb: BreadcrumbTypeDefault | BreadcrumbTypeNavigation;
  message: string;
  orgId: string | null;
}) {
  const content = <Highlight text={searchTerm}>{message}</Highlight>;
  if (
    !loadingProjects &&
    typeof orgId === 'string' &&
    breadcrumb.category === 'sentry.transaction' &&
    isEventId(message)
  ) {
    const maybeProject = projects.find(project => {
      return project.id === event.projectID;
    });

    if (!maybeProject) {
      return content;
    }

    const projectSlug = maybeProject.slug;
    const eventSlug = generateEventSlug({project: projectSlug, id: message});

    return <Link to={eventDetailsRoute({orgSlug: orgId, eventSlug})}>{content}</Link>;
  }

  return content;
});

export default Default;
