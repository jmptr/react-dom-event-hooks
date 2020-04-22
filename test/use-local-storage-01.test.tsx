import React, { useEffect, useState } from 'react';
import { render, fireEvent } from '@testing-library/react';
// polyfill required for the test utils that use async operations
import MutationObserver from '@sheerun/mutationobserver-shim';
window.MutationObserver = MutationObserver;

const useLocalStorage = (key: string) => {
  const [currentValue, setCurrentValue] = useState<string | null>(
    localStorage.getItem(key)
  );
  useEffect(() => {
    localStorage.setItem(key, currentValue);
  }, [key, currentValue]);
  return [currentValue, setCurrentValue] as const;
};

const Example = () => {
  const [currentValue, setCurrentValue] = useLocalStorage('foo');

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

test('Example renders the current value in storage for the `foo` prop', async () => {
  const { findByTestId } = render(<Example />);
  const { textContent } = await findByTestId('storage-value');
  expect(textContent).toBe('1');
});

test(`Example doesn't update when changing localStorage prop directly`, async () => {
  const { findByTestId } = render(<Example />);

  // manually set the localStorage value and emit the associated event
  localStorage.setItem('foo', '100');
  fireEvent(
    window,
    new StorageEvent('storage', {
      key: 'foo',
      newValue: '100',
      oldValue: '1',
    })
  );

  const { textContent } = await findByTestId('storage-value');
  expect(textContent).toBe('1');
  expect(localStorage.getItem('foo')).toBe('100');
});
