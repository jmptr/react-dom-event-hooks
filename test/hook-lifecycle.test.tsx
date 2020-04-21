interface EventHandler<T extends Event = Event> {
  (event: T): void;
}

interface RadEventListener {
  <K extends keyof HTMLElementEventMap>(
    key: K,
    handler: EventHandler<HTMLElementEventMap[K]>,
    elem?: HTMLElement
  ): () => void;
  <K extends keyof WindowEventMap>(
    key: K,
    handler: EventHandler<WindowEventMap[K]>,
    elem?: Window
  ): () => void;
}

const radEventListener: RadEventListener = <K extends keyof WindowEventMap>(
  eventName: K,
  handler: EventHandler<WindowEventMap[K]>,
  elem: Window | HTMLElement = window
) => {
  const eventListener = (event: WindowEventMap[K]) => handler(event);
  elem.addEventListener(eventName, eventListener);
  return function() {
    elem.removeEventListener(eventName, eventListener);
  };
};

test('addEventListener', () => {
  const spy = jest.fn();
  radEventListener('storage', e => {
    spy(e.key, e.newValue);
  });
});

test('addEventListener', () => {
  const spy = jest.fn();
  const div = document.createElement('div');
  // @ts-ignore
  // note that this will create an error in the typescript compiler
  // because div doesn't have a `storage` event
  radEventListener(
    'storage',
    e => {
      spy(e);
    },
    div
  );
});
