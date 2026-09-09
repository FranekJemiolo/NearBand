import TestRenderer, { act } from 'react-test-renderer';

export function renderTestHook<T>(hook: () => T) {
  let hookResult!: T;

  function TestComponent() {
    hookResult = hook();
    return null;
  }

  const renderer = TestRenderer.create(<TestComponent />);

  const resultContainer = {
    get current() {
      return hookResult;
    },
  };

  return {
    result: resultContainer,
    unmount: () => renderer.unmount(),
    act,
  };
}
