import React from 'react';
import {Location} from 'history';
import isEqual from 'lodash/isEqual';
import pick from 'lodash/pick';

import AsyncComponent from 'sentry/components/asyncComponent';
import AreaChart from 'sentry/components/charts/areaChart';
import ErrorPanel from 'sentry/components/charts/errorPanel';
import LoadingPanel from 'sentry/components/charts/loadingPanel';
import QuestionTooltip from 'sentry/components/questionTooltip';
import {IconWarning} from 'sentry/icons';
import {t} from 'sentry/locale';
import {OrganizationSummary} from 'sentry/types';
import {axisLabelFormatter} from 'sentry/utils/discover/charts';
import EventView from 'sentry/utils/discover/eventView';
import {getDuration} from 'sentry/utils/formatters';
import theme from 'sentry/utils/theme';

import {HeaderTitleLegend} from '../styles';

const QUERY_KEYS = [
  'environment',
  'project',
  'query',
  'start',
  'end',
  'statsPeriod',
] as const;

type ViewProps = Pick<EventView, typeof QUERY_KEYS[number]>;

type ApiResult = {
  [bucket: string]: number;
};

type Props = AsyncComponent['props'] &
  ViewProps & {
    organization: OrganizationSummary;
    location: Location;
  };

type State = AsyncComponent['state'] & {
  chartData: {data: ApiResult[]} | null;
};

/**
 * Fetch and render a bar chart that shows event volume
 * for each duration bucket. We always render 15 buckets of
 * equal widths based on the endpoints min + max durations.
 *
 * This graph visualizes how many transactions were recorded
 * at each duration bucket, showing the modality of the transaction.
 */
class DurationPercentileChart extends AsyncComponent<Props, State> {
  getEndpoints(): ReturnType<AsyncComponent['getEndpoints']> {
    const {
      organization,
      query,
      start,
      end,
      statsPeriod,
      environment,
      project,
      location,
    } = this.props;
    const eventView = EventView.fromSavedQuery({
      id: '',
      name: '',
      version: 2,
      fields: [
        'percentile(transaction.duration, 0.10)',
        'percentile(transaction.duration, 0.25)',
        'percentile(transaction.duration, 0.50)',
        'percentile(transaction.duration, 0.75)',
        'percentile(transaction.duration, 0.90)',
        'percentile(transaction.duration, 0.95)',
        'percentile(transaction.duration, 0.99)',
        'percentile(transaction.duration, 0.995)',
        'percentile(transaction.duration, 0.999)',
        'p100()',
      ],
      orderby: '',
      projects: project,
      range: statsPeriod,
      query,
      environment,
      start,
      end,
    });
    const apiPayload = eventView.getEventsAPIPayload(location);
    apiPayload.referrer = 'api.performance.durationpercentilechart';

    return [
      ['chartData', `/organizations/${organization.slug}/eventsv2/`, {query: apiPayload}],
    ];
  }

  componentDidUpdate(prevProps: Props) {
    if (this.shouldRefetchData(prevProps)) {
      this.fetchData();
    }
  }

  shouldRefetchData(prevProps: Props) {
    if (this.state.loading) {
      return false;
    }
    return !isEqual(pick(prevProps, QUERY_KEYS), pick(this.props, QUERY_KEYS));
  }

  renderLoading() {
    return <LoadingPanel data-test-id="histogram-loading" />;
  }

  renderError() {
    // Don't call super as we don't really need issues for this.
    return (
      <ErrorPanel>
        <IconWarning color="gray300" size="lg" />
      </ErrorPanel>
    );
  }

  renderBody() {
    const {chartData} = this.state;
    if (chartData === null) {
      return null;
    }
    const xAxis = {
      type: 'category' as const,
      truncate: true,
      axisLabel: {
        showMinLabel: true,
        showMaxLabel: true,
      },
      axisTick: {
        interval: 0,
        alignWithLabel: true,
      },
    };
    const yAxis = {
      type: 'value' as const,
      axisLabel: {
        color: theme.chartLabel,
        // Use p50() to force time formatting.
        formatter: (value: number) => axisLabelFormatter(value, 'p50()'),
      },
    };
    const tooltip = {
      valueFormatter(value) {
        return getDuration(value / 1000, 2);
      },
    };
    const colors = theme.charts.getColorPalette(1);

    return (
      <AreaChart
        grid={{left: '10px', right: '10px', top: '40px', bottom: '0px'}}
        xAxis={xAxis}
        yAxis={yAxis}
        series={transformData(chartData.data)}
        tooltip={tooltip}
        colors={[...colors]}
      />
    );
  }

  render() {
    return (
      <React.Fragment>
        <HeaderTitleLegend>
          {t('Duration Percentiles')}
          <QuestionTooltip
            position="top"
            size="sm"
            title={t(
              `Compare the duration at each percentile. Compare with Latency Histogram to see transaction volume at duration intervals.`
            )}
          />
        </HeaderTitleLegend>
        {this.renderComponent()}
      </React.Fragment>
    );
  }
}

const VALUE_EXTRACT_PATTERN = /(\d+)$/;
/**
 * Convert a discover response into a barchart compatible series
 */
function transformData(data: ApiResult[]) {
  const extractedData = Object.keys(data[0])
    .map((key: string) => {
      const nameMatch = VALUE_EXTRACT_PATTERN.exec(key);
      if (!nameMatch) {
        return [-1, -1];
      }
      let nameValue = Number(nameMatch[1]);
      if (nameValue > 100) {
        nameValue /= 10;
      }
      return [nameValue, data[0][key]];
    })
    .filter(i => i[0] > 0);

  extractedData.sort((a, b) => {
    if (a[0] > b[0]) {
      return 1;
    }
    if (a[0] < b[0]) {
      return -1;
    }
    return 0;
  });

  return [
    {
      seriesName: t('Duration'),
      data: extractedData.map(i => ({value: i[1], name: `${i[0].toLocaleString()}%`})),
    },
  ];
}

export default DurationPercentileChart;
