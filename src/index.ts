import storageUtils from "./storage";

import {
  isFunction,
  isArray,
  isObject,
  isString,
  getParamNames,
  map,
  filter,
  recreateStructure,
  forEach,
} from "./helpers";

import { addStateActions } from "./actions";

import { NAMESPACE_DELIMITER } from "./constants";

import { isValid } from "./validation";
import {
  runStateChangeListeners,
  addStateListener,
  removeStateListener,
  LISTENERS,
} from "./listeners";

export const STATE = {} as IState;
const STORAGE = {} as IStorageFunctions;

setStorageUtils(storageUtils);

async function addState(
  namespace: INamespace,
  initialState: IStateDefault,
  isPersistent: boolean,
) {
  const storageType = STORAGE.GET_TYPE(isPersistent);
  const defaultValues = Object.assign({}, initialState);
  const values = map(initialState, (k, v) => [namespace(k), v]) as Record<
    string,
    unknown
  >;

  if (STORAGE.IS_AVAILABE(storageType as string)) {
    await STORAGE.UPDATE_STATE(values, storageType as string);
  }

  if (!LISTENERS[namespace()]) {
    LISTENERS[namespace()] = [];
  }

  for (const key in initialState) {
    const fullKey = namespace(key);
    isValid.Defining(fullKey);
    STATE[fullKey] = setupValue(
      key,
      namespace,
      values[fullKey],
      defaultValues[key],
      storageType as string,
    );
  }

  return createStore(namespace());
}

export function setupValue(
  key: string,
  namespace: INamespace,
  value: unknown,
  defaultValue: unknown,
  storageType: string,
): IValue {
  const fullKey = namespace(key);
  const isComputedValue = isFunction(value);
  const dependencies = isComputedValue
    ? getParamNames(value as IComputeFunction)
    : [];

  dependencies.forEach((dependency) => {
    const fullDependencyKey = namespace(dependency);
    if (!STATE[fullDependencyKey]) {
      STATE[fullDependencyKey] = {
        dependants: [],
        dependencies: [],
        namespace,
        storageType,
      } as IValue;
    }
    STATE[fullDependencyKey as keyof typeof STATE].dependants?.push(fullKey);
  });

  return {
    key,
    fullKey,
    value: isComputedValue
      ? (value as IComputeFunction).apply(
          null,
          getArguments(dependencies, namespace),
        )
      : value,
    computeFn: isComputedValue && (value as IComputeFunction),
    dependencies,
    dependants: [],
    listeners: [],
    defaultValue,
    storageType,
    namespace,
  };
}

function getNamespaceState(namespace: INamespace) {
  return filter(STATE, (k, { key }) => k === namespace(key));
}

export function getValues(namespace: INamespace) {
  return map(getNamespaceState(namespace), (k, { key, value }) => [
    key,
    value,
  ]) as Record<string, unknown>;
}

function getArguments(dependencies: string[], namespace: INamespace) {
  const values = getValues(namespace);
  return dependencies.map((name) => values[name as keyof typeof values]);
}

async function onStateChange(changes: IStateChanges) {
  const realChanges = {} as IStateChanges;

  for (const key in changes) {
    const prevValue = STATE[key].value;
    const newValue = changes[key].newValue;

    if (prevValue !== newValue) {
      realChanges[key] = { newValue, prevValue };
      STATE[key].value = newValue;
    } else {
      realChanges[key] = { isSame: true };
    }

    updateDependencies(key, changes, realChanges);
  }

  await runStateChangeListeners(filter(realChanges, (k, v) => !v.isSame));
}

function updateDependencies(
  key: string,
  changes: IStateChanges,
  realChanges: IStateChanges,
) {
  STATE[key].dependants?.forEach((name) => {
    const { dependencies, namespace } = STATE[name];

    if (
      !isEveryDependencyReady(
        dependencies!,
        namespace,
        Object.keys(changes),
        Object.keys(realChanges),
      ) ||
      realChanges[name]
    ) {
      return;
    }

    const prevValue = STATE[name].value;
    const newValue = (STATE[name].computeFn as IComputeFunction)?.apply(
      null,
      getArguments(dependencies!, namespace),
    );

    if (prevValue !== newValue) {
      realChanges[name] = { newValue, prevValue };
      STATE[name].value = newValue;
      updateDependencies(name, changes, realChanges);
    }
  });
}

function isEveryDependencyReady(
  dependencies: string[],
  namespace: INamespace,
  changesKeys: string[],
  realChangesKeys: string[],
) {
  return dependencies.every((name) => {
    const fullKey = namespace(name);
    return (
      (changesKeys.includes(fullKey) && realChangesKeys.includes(fullKey)) ||
      !changesKeys.includes(fullKey)
    );
  });
}

export function getState(namespace: INamespace, arg: string) {
  if (isString(arg)) {
    return createStore(arg);
  }

  return recreateStructure(getValues(namespace));
}

export async function setState(
  namespace: INamespace,
  changes: Record<string, unknown>,
): Promise<unknown> {
  const storageChanges: Record<string, any> = {};

  forEach(changes, (k, v) => {
    const fullKey = namespace(k);
    const { storageType, computeFn, isAction } = STATE[fullKey];

    if (computeFn || isAction) {
      return;
    }

    if (!storageChanges[storageType!]) {
      storageChanges[storageType!] = {};
    }

    storageChanges[storageType!][fullKey] = v;
  });

  for (let [storageType, changes] of Object.entries(storageChanges)) {
    await setValues(storageType, changes);
  }

  return createStore(namespace());
}

async function setValues(
  storageType: string,
  changes: Record<string, unknown>,
) {
  if (STORAGE.IS_AVAILABE(storageType)) {
    const isAutoUpdate = await STORAGE.SET_VALUES(storageType, changes);
    if (isAutoUpdate) {
      return;
    }
  }

  onStateChange(
    map(changes, (k, newValue) => [k, { newValue }]) as Record<string, any>,
  );
}

export async function resetState(namespace: INamespace, keys?: string[]) {
  const namespaceState = getNamespaceState(namespace);

  await setState(
    namespace,
    map(
      keys
        ? filter(namespaceState, (k, { key }) => keys.includes(key!))
        : namespaceState,
      (k, { key, defaultValue }) => [key, defaultValue],
    ) as Record<string, any>,
  );

  return createStore(namespace());
}

function main(namespace: INamespace): any {
  if (!arguments[1] || isString(arguments[1])) {
    return getState.apply(null, arguments as unknown as [INamespace, string]);
  }

  if (isArray(arguments[1])) {
    return addStateListener.apply(
      null,
      arguments as unknown as [INamespace, string[], () => {}],
    );
  }

  if (isObject(arguments[1])) {
    return setState.apply(
      null,
      arguments as unknown as [INamespace, Record<string, unknown>],
    );
  }
}

function setStorageUtils(storageUtils: IStorageFunctions) {
  Object.assign(STORAGE, storageUtils);
}

function addNamespace(namespace: string, str: string) {
  return `${namespace}${(isString(str) && NAMESPACE_DELIMITER) || ""}${str || ""}`;
}

export function createStore(_namespace: string) {
  const namespace = ((key: string) =>
    addNamespace(_namespace, key)) as INamespace;

  return Object.assign(main.bind(null, namespace), {
    add: (state: IStateDefault) => addState(namespace, state, false),
    addPersistent: (state: IStateDefault) => addState(namespace, state, true),
    get: (newNamespace: string) => getState(namespace, newNamespace),
    set: async (changes: Record<string, unknown>) =>
      await setState(namespace, changes),
    reset: (keys: string[]) => resetState(namespace, keys),
    onChange: (keys: string[], cb: () => {}) =>
      addStateListener(namespace, keys, cb),
    removeListener: (keys: string[], cb: () => {}) =>
      removeStateListener(namespace, keys, cb),
    actions: (actions: IStateActions) => addStateActions(namespace, actions),
    setStorageUtils,
    onStateChange,
  });
}

export default createStore("");
