import React, { useEffect, useState } from 'react';
import { render, fireEvent } from '@testing-library/react';
// polyfill required for the test utils that use async operations
import MutationObserver from '@sheerun/mutationobserver-shim';
window.MutationObserver = MutationObserver;

const useLocalStorage = (key: string) => {
  const [currentValue, setCurrentValue] = useState<string | null>(() =>
    localStorage.getItem(key)
  );

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.storageArea === localStorage && e.key === key) {
        setCurrentValue(e.newValue);
      }
    };
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('storage', handler);
    };
  });

  useEffect(() => {
    localStorage.setItem(key, currentValue);
  }, [key, currentValue]);

  return [currentValue, setCurrentValue] as const;
};

const Example = ({ propName }: { propName: string }) => {
  const [currentValue, setCurrentValue] = useLocalStorage(propName);

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

  return <span data-testid="storage-value">{currentValue}</span>;
};

afterEach(() => {
  localStorage.clear();
});

test(`Example renders the current value in storage for the \`foo\` prop`, async () => {
  const { findByTestId } = render(<Example propName="foo" />);
  const { textContent } = await findByTestId('storage-value');
  expect(textContent).toBe('1');
});

test(`Example renders the updated value in storage for the \`foo\` prop`, async () => {
  const { findByTestId } = render(<Example propName="foo" />);

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

  const { textContent } = await findByTestId('storage-value');
  expect(textContent).toBe('100');
  expect(localStorage.getItem('foo')).toBe('100');
});
