import {
  type IVarstor,
  type IState,
  type IStateUpdatePieces,
  type IStatePendingChanges,
  type IStorageFunctions,
  type INamespace,
  type IStateDefault,
  type IComputeFunction,
  type IValue,
  type IStateChanges,
  type IStateActions,
  type IStateListener,
} from "./types.d";

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
  uid,
  isAsyncFunction,
} from "./helpers";

import { addStateActions } from "./actions";

import { NAMESPACE_DELIMITER } from "./constants";

import {
  runStateChangeListeners,
  addStateListener,
  removeStateListener,
  LISTENERS,
} from "./listeners";

export const STATE = {} as IState;
const STATE_CHANGED_PIECES = {} as IStateUpdatePieces;
const STATE_PENDING_CHANGES = {} as IStatePendingChanges;
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

  for (const key in initialState) {
    const fullKey = namespace(key);
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

export async function joinStateChanges(changesPiece: IStateChanges) {
  for (const [
    updateId,
    { storageTypes, readyStorageTypes, changes },
  ] of Object.entries(STATE_CHANGED_PIECES)) {
    if (changesPiece[updateId]) {
      const storageType = changesPiece[updateId].newValue;
      readyStorageTypes[storageType] = true;
      delete changesPiece[updateId];
      Object.assign(changes, changesPiece);
      if (STORAGE.IS_AVAILABE(storageType)) {
        STORAGE.REMOVE_KEY(storageType, updateId);
      }

      for (const key in storageTypes) {
        if (!readyStorageTypes[key]) {
          return;
        }
      }

      delete STATE_CHANGED_PIECES[updateId];

      await onStateChange(changes);
    }
  }
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

  return recreateStructure(getValues(namespace)) as Record<string, any>;
}

export async function setState(
  namespace: INamespace,
  changes: Record<string, unknown>,
): Promise<IVarstor> {
  const storageChanges: Record<string, any> = {};
  const updateId = uid();
  const storageTypes = {} as Record<string, boolean>;

  forEach(changes, (k, v) => {
    const fullKey = namespace(k);
    const { storageType, computeFn, isAction } = STATE[fullKey];

    if (computeFn || isAction) {
      return;
    }

    if (!storageChanges[storageType!]) {
      storageChanges[storageType!] = {};
    }

    storageTypes[storageType!] = true;

    storageChanges[storageType!][fullKey] = v;
  });

  STATE_CHANGED_PIECES[updateId] = {
    storageTypes,
    readyStorageTypes: {},
    changes: {},
  };

  for (let [storageType, changes] of Object.entries(storageChanges)) {
    await setValues(storageType, { ...changes, [updateId]: storageType });
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

  joinStateChanges(
    map(changes, (k, newValue) => [k, { newValue }]) as Record<string, any>,
  );
}

export async function resetState(namespace: INamespace, keys?: string[]) {
  return setState(namespace, getDefaultValues(namespace, keys));
}

function getDefaultValues(namespace: INamespace, keys?: string[]) {
  const namespaceState = getNamespaceState(namespace);

  return map(
    keys
      ? filter(namespaceState, (k, { key }) => keys.includes(key!))
      : namespaceState,
    (k, { key, defaultValue }) => [key, defaultValue],
  ) as Record<string, any>;
}

export function createPendingChanges(namespace: INamespace) {
  const flush = () => {
    const changes = STATE_PENDING_CHANGES[namespace()];
    STATE_PENDING_CHANGES[namespace()] = {};
    return changes;
  };

  return {
    add: (changes: Record<string, any>) =>
      Object.assign(STATE_PENDING_CHANGES[namespace()], changes),
    reset: (keys: string[]) =>
      Object.assign(
        STATE_PENDING_CHANGES[namespace()],
        getDefaultValues(namespace, keys),
      ),
    get: () => STATE_PENDING_CHANGES[namespace()],
    flush,
    commit: () => setState(namespace, flush()),
  };
}

function main(namespace?: INamespace): any {
  if (!arguments[1] || isString(arguments[1])) {
    return getState.apply(null, arguments as unknown as [INamespace, string]);
  }

  if (
    isArray(arguments[1]) ||
    isFunction(arguments[1]) ||
    isAsyncFunction(arguments[1])
  ) {
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

export function createStore(_namespace: string): IVarstor {
  const namespace = ((key: string) =>
    addNamespace(_namespace, key)) as INamespace;

  if (!STATE_PENDING_CHANGES[namespace()]) {
    STATE_PENDING_CHANGES[namespace()] = {};
  }

  if (!LISTENERS[namespace()]) {
    LISTENERS[namespace()] = [];
  }

  return Object.assign(main.bind(null, namespace), {
    add: (state: IStateDefault) => addState(namespace, state, false),
    addPersistent: (state: IStateDefault) => addState(namespace, state, true),
    get: (newNamespace?: string) => getState(namespace, newNamespace!),
    set: (changes: Record<string, unknown>) => setState(namespace, changes),
    reset: (keys: string[]) => resetState(namespace, keys),
    changes: createPendingChanges(namespace),
    onChange: (keys: string[] | IStateListener, cb?: IStateListener) =>
      addStateListener(namespace, keys, cb!),
    removeListener: (keys: string[] | IStateListener, cb?: IStateListener) =>
      removeStateListener(namespace, keys, cb!),
    actions: (actions: IStateActions) => addStateActions(namespace, actions),
    setStorageUtils,
    joinStateChanges,
    namespace,
  });
}

export default createStore("");
