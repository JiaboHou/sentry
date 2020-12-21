import React from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';

import space from 'sentry/styles/space';
import theme from 'sentry/utils/theme';

const priorityColors = {
  new: theme.red300,
  strong: theme.blue300,
  highlight: theme.green300,
} as const;

type Props = React.HTMLProps<HTMLSpanElement> & {
  text?: string | number | null;
  priority?: keyof typeof priorityColors;
  className?: string;
};

const Badge = styled(({priority: _priority, text, ...props}: Props) => (
  <span {...props}>{text}</span>
))<Props>`
  display: inline-block;
  height: 20px;
  min-width: 20px;
  line-height: 20px;
  border-radius: 20px;
  padding: 0 5px;
  margin-left: ${space(0.5)};
  font-size: 75%;
  font-weight: 600;
  text-align: center;
  color: #fff;
  background: ${p => (p.priority ? priorityColors[p.priority] : theme.gray200)};
  transition: background 100ms linear;

  position: relative;
  top: -1px;
`;

Badge.propTypes = {
  text: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  priority: PropTypes.oneOf(['strong', 'new', 'highlight']),
} as any;

export default Badge;
