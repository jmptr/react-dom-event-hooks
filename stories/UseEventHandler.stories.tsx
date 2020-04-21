import React, { useCallback, useState } from 'react';
import { useEventHandler } from '../src/use-event-handler';

const Example = () => {
  console.log('ex render');
  const [lastClick, setLastClick] = useState<MouseEvent>(undefined);

  const handler = useCallback((e: MouseEvent) => {
    setLastClick(e);
  }, []);

  useEventHandler('click', handler);
  if (!lastClick) {
    return <>none</>;
  }
  return <>{lastClick.x}</>;
};

export default {
  title: 'useEventHandler Hook',
};

// By passing optional props to this story, you can control the props of the component when
// you consume the story in a test.
export const Default = () => <Example />;
