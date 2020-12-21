import React from 'react';
import styled from '@emotion/styled';
import groupBy from 'lodash/groupBy';
import moment from 'moment';

import {Client} from 'sentry/api';
import ActivityItem from 'sentry/components/activity/item';
import Note from 'sentry/components/activity/note';
import NoteInputWithStorage from 'sentry/components/activity/note/inputWithStorage';
import {CreateError} from 'sentry/components/activity/note/types';
import ErrorBoundary from 'sentry/components/errorBoundary';
import LoadingError from 'sentry/components/loadingError';
import TimeSince from 'sentry/components/timeSince';
import {t} from 'sentry/locale';
import space from 'sentry/styles/space';
import {User} from 'sentry/types';
import {NoteType} from 'sentry/types/alerts';

import {ActivityType, Incident, IncidentActivityType} from '../../types';

import ActivityPlaceholder from './activityPlaceholder';
import DateDivider from './dateDivider';
import StatusItem from './statusItem';

type NoteProps = React.ComponentProps<typeof Note>;

type Props = {
  api: Client;
  alertId: string;
  incident?: Incident;
  loading: boolean;
  error: boolean;
  me: User;
  activities: null | ActivityType[];
  noteInputId: string;
  noteInputProps?: object;

  createError: boolean;
  createBusy: boolean;
  createErrorJSON: null | CreateError;
  onCreateNote: (note: NoteType) => void;
  onUpdateNote: (note: NoteType, activity: ActivityType) => void;
  onDeleteNote: (activity: ActivityType) => void;
};

/**
 * Activity component on Incident Details view
 * Allows user to leave a comment on an alertId as well as
 * fetch and render existing activity items.
 */
class Activity extends React.Component<Props> {
  handleUpdateNote = (note: NoteType, {activity}: NoteProps) => {
    const {onUpdateNote} = this.props;
    onUpdateNote(note, activity as ActivityType);
  };

  handleDeleteNote = ({activity}: NoteProps) => {
    const {onDeleteNote} = this.props;
    onDeleteNote(activity as ActivityType);
  };

  render() {
    const {
      loading,
      error,
      me,
      alertId,
      incident,
      activities,
      noteInputId,
      createBusy,
      createError,
      createErrorJSON,
      onCreateNote,
    } = this.props;

    const noteProps = {
      minHeight: 80,
      projectSlugs: (incident && incident.projects) || [],
      ...this.props.noteInputProps,
    };
    const activitiesByDate = groupBy(activities, ({dateCreated}) =>
      moment(dateCreated).format('ll')
    );
    const today = moment().format('ll');

    return (
      <div>
        <ActivityItem author={{type: 'user', user: me}}>
          {() => (
            <NoteInputWithStorage
              key={noteInputId}
              storageKey="incidentIdinput"
              itemKey={alertId}
              onCreate={onCreateNote}
              busy={createBusy}
              error={createError}
              errorJSON={createErrorJSON}
              placeholder={t(
                'Leave a comment, paste a tweet, or link any other relevant information about this alert...'
              )}
              {...noteProps}
            />
          )}
        </ActivityItem>

        {error && <LoadingError message={t('There was a problem loading activities')} />}

        {loading && (
          <React.Fragment>
            <ActivityPlaceholder />
            <ActivityPlaceholder />
            <ActivityPlaceholder />
          </React.Fragment>
        )}

        {!loading &&
          !error &&
          Object.entries(activitiesByDate).map(([date, activitiesForDate]) => {
            const title =
              date === today ? (
                t('Today')
              ) : (
                <React.Fragment>
                  {date} <StyledTimeSince date={date} />
                </React.Fragment>
              );
            return (
              <React.Fragment key={date}>
                <DateDivider>{title}</DateDivider>
                {activitiesForDate &&
                  activitiesForDate.map(activity => {
                    const authorName = activity.user?.name ?? 'Sentry';

                    if (activity.type === IncidentActivityType.COMMENT) {
                      return (
                        <ErrorBoundary mini key={`note-${activity.id}`}>
                          <Note
                            showTime
                            user={activity.user as User}
                            modelId={activity.id}
                            text={activity.comment || ''}
                            dateCreated={activity.dateCreated}
                            activity={activity}
                            authorName={authorName}
                            onDelete={this.handleDeleteNote}
                            onUpdate={this.handleUpdateNote}
                            {...noteProps}
                          />
                        </ErrorBoundary>
                      );
                    } else {
                      return (
                        <ErrorBoundary mini key={`note-${activity.id}`}>
                          <StatusItem
                            showTime
                            incident={incident}
                            authorName={authorName}
                            activity={activity}
                          />
                        </ErrorBoundary>
                      );
                    }
                  })}
              </React.Fragment>
            );
          })}
      </div>
    );
  }
}

export default Activity;

const StyledTimeSince = styled(TimeSince)`
  color: ${p => p.theme.gray300};
  font-size: ${p => p.theme.fontSizeSmall};
  margin-left: ${space(0.5)};
`;
