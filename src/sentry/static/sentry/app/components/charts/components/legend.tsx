import 'echarts/lib/component/legend';
import 'echarts/lib/component/legendScroll';

import {EChartOption} from 'echarts';

import BaseChart from 'sentry/components/charts/baseChart';
import {Theme} from 'sentry/utils/theme';

import {truncationFormatter} from '../utils';

type ChartProps = React.ComponentProps<typeof BaseChart>;

export default function Legend(
  props: ChartProps['legend'] & {theme?: Theme} = {}
): EChartOption.Legend {
  const {truncate, theme, ...rest} = props ?? {};
  const formatter = (value: string) => truncationFormatter(value, truncate ?? 0);

  return {
    show: true,
    type: 'scroll',
    padding: 0,
    formatter,
    textStyle: {
      color: theme?.textColor,
    },
    ...rest,
  };
}
