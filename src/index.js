import storageUtils from './storage';

import {
  isArray, isFunction, isObject, isString,
  getParamNames,
  getKeys,
} from './helpers';

import {
  addNamespace,
  getNamespace,
  getKey,
  namespacify,
  getByNamespace,
} from "./namespace";

import {
  isKeyPresent
} from './error';

const STATE = {};
export const ACCESSORS = {};
const COMPUTED_DEPENDENCIES = {};
const COMPUTED_ARGUMENTS = {};

const STORAGE = {
  GET_TYPE: null,
  IS_AVAILABE: null,
  UPDATE_STATE: null,
  SET_VALUE: null
};

setStorageUtils(storageUtils);

async function addState (namespace, initialState, isPersistent) {
  const storageType = STORAGE.GET_TYPE(isPersistent);
  const defaultValues = Object.assign({}, initialState);
  const namespacedValues = namespacify(namespace(), initialState);

  if (STORAGE.IS_AVAILABE(storageType)) {
    await STORAGE.UPDATE_STATE(namespacedValues, storageType);
  }

  const accessors = {};
  for (const key in initialState) {
    accessors[namespace(key)] = setupValue(
      namespace(key),
      namespacedValues[namespace(key)],
      defaultValues[key],
      storageType,
    );
  }

  Object.assign(ACCESSORS, accessors);
  return createStore(namespace());
}

function setupValue (key, value, defaultValue, storageType) {
  const isComputedValue = isFunction(value);

  if (isComputedValue) {
    setupDependencies(key, value);
  }

  STATE[key] = {
    value: isComputedValue ? value.apply(null, getArguments(key)) : value,
    computeFn: value,
    listeners: [],
    defaultValue,
  };

  return createAccessor(key, value, storageType);
}

function setupDependencies(computedValueName, computeFn) {
  const namespace = getNamespace(computedValueName);
  const paramNames = getParamNames(computeFn).map((name) => addNamespace(namespace, name));
  COMPUTED_ARGUMENTS[computedValueName] = paramNames;

  paramNames.forEach((param) => {
    if (COMPUTED_DEPENDENCIES[param]) {
      COMPUTED_DEPENDENCIES[param].push(computedValueName);
    } else {
      COMPUTED_DEPENDENCIES[param] = [computedValueName];
    }
  });
}

function getArguments(computedName) {
  const values = getNamespaceValues(computedName);
  
  return COMPUTED_ARGUMENTS[computedName]
    .map((name) => values[getKey(name)])
    .concat(values);
}

function createAccessor(key, value, storageType) {
  const accessor = () => STATE[key].value;

  Object.assign(accessor, {
    valueOf: () => STATE[key].value,
    toString: () => STATE[key].value,
    set: (value) => setValue(key, value, storageType),
    onChange: (cb) => STATE[key].listeners.push(cb),
    removeListener: (removeCb) =>
      (STATE[key].listeners = STATE[key].listeners.filter(
        (cb) => cb !== removeCb,
      )),
    reset: () => setValue(key, STATE[key].defaultValue, storageType),
  });

  return new Proxy(accessor, {
    get: (target, prop) => {
      if (Object.keys(accessor).includes(prop)) {
        return target[prop];
      }

      return STATE[key].value[prop];
    },
  });
}

function setValue (key, value, storageType) {
  if (STORAGE.IS_AVAILABE(storageType)) {
    const isAutoUpdate = STORAGE.SET_VALUE(storageType, key, value);
    if (isAutoUpdate) {
      return;
    }
  }

  onStateChange({ [key]: { newValue: value } });
}

function onStateChange (changes) {
  const realChanges = {};

  for (const key in changes) {
    const prevValue = STATE[key].value;
    const newValue = changes[key].newValue;

    if (prevValue !== newValue) {
      STATE[key].value = newValue;
      realChanges[key] = { newValue, prevValue };

      updateDependencies(key, realChanges);
    }
  }

  for (const key in realChanges) {
    STATE[key].listeners.forEach((cb) => cb(STATE[key].value, getNamespaceValues(key), realChanges[key]));
  }
}

function updateDependencies (key, realChanges) {
  const computedDependencies = COMPUTED_DEPENDENCIES[key];
  if (computedDependencies) {
    computedDependencies.forEach((name) => {
      const prevValue = STATE[name].value;
      const newValue = STATE[name].computeFn.apply(null, getArguments(name));
      if (prevValue !== newValue) {
        STATE[name].value = newValue;
        realChanges[name] = { newValue, prevValue };
        updateDependencies(name, realChanges);
      }
    });
  }
}

function getState(namespace, arg) {
  if (isString(arg)) {
    return createStore(arg);
  }

  if (isFunction(arg)) {
    return getNamespaceAccessors(namespace(""), arg);
  }

  return getNamespaceValues(namespace(""));
}

function getNamespaceValues(namespace) {
  return getKeys(getByNamespace(namespace, STATE), "value");
}

function getNamespaceAccessors (namespace, cb) {
  const accessors = getByNamespace(namespace, ACCESSORS);
  return cb.call(null, accessors, createStore(namespace()));
}

function setState (namespace, changes) {
  const noKeys = !Object.keys(changes).length;

  if (noKeys) {
    resetAllState();
  } else {
    for (const [k,v] of Object.entries(changes)) {
      isKeyPresent(namespace(k)) && ACCESSORS[namespace(k)].set(v);
    };
  }

  return createStore(namespace());
}

function resetAllState (namespace) {
  Object.entries(ACCESSORS)
    .filter(([k]) => k.startsWith(namespace()))
    .forEach((k, { reset }) => reset());

  return createStore(namespace());
}

function addStateLitener (namespace, observables, cb) {
  observables.forEach((key) => ACCESSORS[namespace(key)].onChange(cb));

  return createStore(namespace());
}

function removeStateListener(namespace, observables, cb) {
  observables.forEach((key) =>
    ACCESSORS[namespace(key)].removeListener(cb),
  );

  return createStore(namespace());
}

function main () {
  const arg1 = arguments[1];

  if (!arg1 || isFunction(arg1) || isString(arg1)) {
    return getState.apply(null, arguments);
  }

  if (Array.isArray(arg1)) {
    return addStateLitener.apply(null, arguments);
  }

  if (isObject(arg1)) {
    return setState.apply(null, arguments);
  }
}

function setStorageUtils(storageUtils) {
  Object.assign(STORAGE, storageUtils);
}

function createStore (_namespace) {
  const namespace = (key) => addNamespace(_namespace, key);

  return Object.assign(main.bind(null, namespace), {
    add: (state) => addState(namespace, state, false),
    addPersistent: (state) => addState(namespace, state, true),
    get: (arg) => getState(namespace, arg),
    set: (changes) => setState(namespace, changes),
    resetAll: () => resetAllState(namespace),
    onChange: (keys, cb) => addStateLitener(namespace, keys, cb),
    removeListener: (keys, cb) => removeStateListener(namespace, keys, cb),
    setStorageUtils,
    onStateChange,
  });
}

export default createStore("");
