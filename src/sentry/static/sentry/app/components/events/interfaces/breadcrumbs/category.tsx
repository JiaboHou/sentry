import React from 'react';
import styled from '@emotion/styled';

import Highlight from 'sentry/components/highlight';
import TextOverflow from 'sentry/components/textOverflow';
import Tooltip from 'sentry/components/tooltip';
import {t} from 'sentry/locale';
import {defined} from 'sentry/utils';

type Props = {
  searchTerm: string;
  category?: string | null;
};

const Category = React.memo(({category, searchTerm}: Props) => {
  const title = !defined(category) ? t('generic') : category;
  return (
    <Wrapper title={title}>
      <Tooltip title={title} containerDisplayMode="inline-flex">
        <TextOverflow>
          <Highlight text={searchTerm}>{title}</Highlight>
        </TextOverflow>
      </Tooltip>
    </Wrapper>
  );
});

export default Category;

const Wrapper = styled('div')`
  color: ${p => p.theme.textColor};
  font-size: ${p => p.theme.fontSizeSmall};
  font-weight: 700;
`;
