import React, { useEffect, useRef, useState } from 'react';
import { render, fireEvent } from '@testing-library/react';
// polyfill required for the test utils that use async operations
import MutationObserver from '@sheerun/mutationobserver-shim';
window.MutationObserver = MutationObserver;

interface EventHandler<T extends Event = Event> {
  (e: T): void;
}

interface DOMEventHook {
  <K extends keyof HTMLElementEventMap>(
    key: K,
    handler: EventHandler<HTMLElementEventMap[K]>,
    elem?: HTMLElement
  ): void;
  <K extends keyof WindowEventMap>(
    key: K,
    handler: EventHandler<WindowEventMap[K]>,
    elem?: Window
  ): void;
}
const useDOMEvent: DOMEventHook = (
  eventName: string,
  handler: EventHandler,
  element: Window | HTMLElement = window
) => {
  const handlerRef = useRef<EventHandler>();

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!element || !element.addEventListener) {
      return () => {};
    }

    const eventListener: EventHandler = event => handlerRef.current(event);
    element.addEventListener(eventName, eventListener);
    return () => {
      element.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
};

const useLocalStorage = (key: string) => {
  const [currentValue, setCurrentValue] = useState<string | null>(() =>
    localStorage.getItem(key)
  );

  const handler = (e: StorageEvent) => {
    if (
      e.storageArea === localStorage &&
      e.key === key &&
      e.newValue !== currentValue
    ) {
      setCurrentValue(e.newValue);
    }
  };

  useDOMEvent('storage', handler);

  useEffect(() => {
    localStorage.setItem(key, currentValue);
  }, [key, currentValue]);

  return [currentValue, setCurrentValue] as const;
};

const useHover = (elem: HTMLElement) => {
  const [isHovering, setIsHovering] = useState<boolean>(false);

  const onMouseOver = () => {
    setIsHovering(true);
  };
  const onMouseLeave = () => {
    setIsHovering(false);
  };
  useDOMEvent('mouseenter', onMouseOver, elem);
  useDOMEvent('mouseleave', onMouseLeave, elem);
  return isHovering;
};

const Example = () => {
  const [currentValue, setCurrentValue] = useLocalStorage('foo');
  const spanRef = useRef<HTMLElement>(null);

  const isHovering = useHover(spanRef.current);

  useEffect(() => {
    let nextValue = parseInt(currentValue, 10);
    if (isNaN(nextValue)) {
      nextValue = 1;
    } else {
      nextValue++;
    }
    setCurrentValue(nextValue.toString());
    // only run this effect once no matter what (or else the component will
    // continuously re-render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <span ref={spanRef} data-testid="storage-value">
        {currentValue}
      </span>
      <span ref={spanRef} data-testid="hover-value">
        {JSON.stringify(isHovering)}
      </span>
    </>
  );
};

afterEach(() => {
  localStorage.clear();
});

test(`Example renders the current value in storage for the \`foo\` prop`, async () => {
  const { findByTestId } = render(<Example />);
  const { textContent } = await findByTestId('storage-value');
  expect(textContent).toBe('1');
});

test(`Example renders the updated value in storage for the \`foo\` prop`, async () => {
  const { findByTestId, rerender } = render(<Example />);

  // manually set the localStorage value and emit the associated event
  localStorage.setItem('foo', '100');
  fireEvent(
    window,
    new StorageEvent('storage', {
      key: 'foo',
      newValue: '100',
      oldValue: '1',
      storageArea: localStorage,
    })
  );
  rerender(<Example />);

  const { textContent } = await findByTestId('storage-value');
  expect(textContent).toBe('100');
  expect(localStorage.getItem('foo')).toBe('100');
});

test(`Example renders false for the hover value`, async () => {
  const { findByTestId } = render(<Example />);

  const { textContent } = await findByTestId('hover-value');
  expect(textContent).toBe('false');
});

test(`Example renders true for the hover value`, async () => {
  const { findByTestId } = render(<Example />);

  const elem = await findByTestId('hover-value');
  expect(elem.textContent).toBe('false');

  fireEvent(elem, new MouseEvent('mouseenter', {}));
  expect(elem.textContent).toBe('true');

  fireEvent(elem, new MouseEvent('mouseleave', {}));
  expect(elem.textContent).toBe('false');
});
