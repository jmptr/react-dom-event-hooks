import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { render, fireEvent, screen } from '@testing-library/react';
import { Server } from 'miragejs';
// polyfill required for the test utils
import MutationObserver from '@sheerun/mutationobserver-shim';
window.MutationObserver = MutationObserver;

// mock http server, set up with an echo endpoint
const server = new Server({
  routes() {
    this.urlPrefix = 'https://www.example.com';
    this.namespace = '/api';
    this.get('/echo/:input', (_schema: any, request: any) => {
      const { input } = request.params;
      return input;
    });
  },
});
server.logging = false;

// axios client used to exercise the server's echo endpoint
const getEcho = (input: string) =>
  axios
    .get<string>(
      `https://www.example.com/api/echo/${encodeURIComponent(input)}`
    )
    .then(response => response.data);

// react hook used to exercise the axios client within the react lifecycle
const useGetEcho = (input?: string) => {
  const [currentValue, setCurrentValue] = useState<string>(null);
  useEffect(() => {
    let isCanceled = false;
    if (input) {
      getEcho(input).then(response => {
        if (isCanceled) {
          return;
        }
        setCurrentValue(response);
      });
    }
    return function() {
      isCanceled = true;
    };
  }, [input]);
  return currentValue;
};

const Example = () => {
  const [currentValue, setCurrentValue] = useState('');
  const currentResponse = useGetEcho(currentValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleClick = useCallback(() => {
    setCurrentValue(inputRef.current.value);
  }, []);
  return (
    <form noValidate>
      <input
        type="text"
        ref={inputRef}
        aria-label="echo-input"
        defaultValue={currentValue}
      />
      <input type="button" aria-label="form-submit" onClick={handleClick} />
      <span data-testid="response-id">{currentResponse || '(none)'}</span>
    </form>
  );
};

test('Example Form', async () => {
  const wrapper = render(<Example />);
  expect(wrapper.container).toMatchInlineSnapshot(`
    <div>
      <form
        novalidate=""
      >
        <input
          aria-label="echo-input"
          type="text"
          value=""
        />
        <input
          aria-label="form-submit"
          type="button"
        />
        <span
          data-testid="response-id"
        >
          (none)
        </span>
      </form>
    </div>
  `);
  fireEvent.change(screen.getByLabelText(/echo-input/), {
    target: { value: 'new value' },
  });
  fireEvent.click(screen.getByLabelText(/form-submit/));
  await screen.findByText('new value');
  expect(wrapper.container).toMatchInlineSnapshot(`
    <div>
      <form
        novalidate=""
      >
        <input
          aria-label="echo-input"
          type="text"
          value="new value"
        />
        <input
          aria-label="form-submit"
          type="button"
        />
        <span
          data-testid="response-id"
        >
          new value
        </span>
      </form>
    </div>
  `);
});
