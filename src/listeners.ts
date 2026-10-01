import { STATE, getValues, createStore } from ".";
import { NAMESPACE_DELIMITER } from "./constants";
import { map, isFunction } from "./helpers";

export const LISTENERS = {} as IStateListeners;

export async function runStateChangeListeners(realChanges: IStateChanges) {
  if (Object.keys(realChanges).length) {
    const { namespace } =
      STATE[Object.keys(realChanges)[0] as keyof typeof STATE];
    const stateValues = getValues(namespace);

    for (let [changeKey, change] of Object.entries(realChanges)) {
      const { listeners, key } = STATE[changeKey];
      for (const cb of listeners!) {
        await cb([key], stateValues, change);
      }
    }

    const readableKeys = map(realChanges, (k) =>
      k.slice(NAMESPACE_DELIMITER.length),
    ) as string[];

    for (const cb of LISTENERS[namespace()]) {
      await cb(
        readableKeys,
        stateValues,
        map(realChanges, (k, v) => [
          k.slice(NAMESPACE_DELIMITER.length),
          v,
        ]) as IStateChanges,
      );
    }
  }
}

export function addStateListener(
  namespace: INamespace,
  observables: string[] | IStateListener,
  cb: () => {},
) {
  if (isFunction(observables)) {
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
  if (isFunction(observables)) {
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
