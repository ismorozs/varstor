import { STATE, getValues, createStore } from ".";
import { NAMESPACE_DELIMITER } from "./constants";
import { map, isFunction, isAsyncFunction } from "./helpers";

export const LISTENERS = {} as IStateListeners;

export async function runStateChangeListeners(realChanges: IStateChanges) {
  if (Object.keys(realChanges).length) {
    const { namespace } =
      STATE[Object.keys(realChanges)[0] as keyof typeof STATE];
    const stateValues = getValues(namespace);

    for (let [changeKey, change] of Object.entries(realChanges)) {
      const { listeners, key } = STATE[changeKey];
      for (const cb of listeners!) {
        const fn = cb.bind(null, [key], stateValues, change);
        if (isAsyncFunction(cb)) {
          await fn();
        } else {
          fn();
        }
      }
    }

    const namespaceLength = `${namespace()}${NAMESPACE_DELIMITER}`.length;
    const readableKeys = map(realChanges, (k) =>
      k.slice(namespaceLength),
    ) as string[];

    for (const cb of LISTENERS[namespace()]) {
      const fn = cb.bind(
        null,
        readableKeys,
        stateValues,
        map(realChanges, (k, v) => [
          k.slice(namespaceLength),
          v,
        ]) as IStateChanges,
      );
      if (isAsyncFunction(cb)) {
        await fn();
      } else {
        fn();
      }
    }
  }
}

export function addStateListener(
  namespace: INamespace,
  observables: string[] | IStateListener,
  cb: () => {},
) {
  if (isFunction(observables) || isAsyncFunction(observables)) {
    LISTENERS[namespace()].push(observables as IStateListener);
    return createStore(namespace());
  }

  (observables as string[]).forEach((key) =>
    STATE[namespace(key)].listeners?.push(cb),
  );

  return createStore(namespace());
}

export function removeStateListener(
  namespace: INamespace,
  observables: string[] | IStateListener,
  removeCb: () => {},
) {
  if (isFunction(observables) || isAsyncFunction(observables)) {
    const removeIdx = LISTENERS[namespace()].findIndex(
      (cb) => cb === observables,
    );
    LISTENERS[namespace()].splice(removeIdx, 1);
    return createStore(namespace());
  }

  (observables as string[]).forEach((key) => {
    const listeners = STATE[namespace(key)].listeners;
    const removeIdx = listeners?.findIndex((cb) => cb === removeCb) as number;
    listeners?.splice(removeIdx, 1);
  });

  return createStore(namespace());
}
