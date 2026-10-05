const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
const ARGUMENT_NAMES = /([^\s,]+)/g;

export function isArray(obj: unknown) {
  return getObjectType(obj) === "[object Array]";
}

export function isString(obj: unknown) {
  return getObjectType(obj) === "[object String]";
}

export function isFunction(obj: unknown) {
  return getObjectType(obj) === "[object Function]";
}

export function isAsyncFunction(obj: unknown) {
  return getObjectType(obj) === "[object AsyncFunction]";
}

export function isObject(obj: unknown) {
  return getObjectType(obj) === "[object Object]";
}

function getObjectType(obj: unknown) {
  return Object.prototype.toString.call(obj);
}

export function getParamNames(fn: () => {}) {
  const fnStr = fn.toString().replace(STRIP_COMMENTS, "").split("=>")[0];

  const names = fnStr
    .slice(fnStr.indexOf("(") + 1, fnStr.indexOf(")"))
    .match(ARGUMENT_NAMES);

  if (names === null) {
    return [];
  }

  return names;
}

export function map<T>(
  obj: Record<string, T>,
  cb: (key: string, value: T) => any,
) {
  const res = Object.entries(obj).map(([k, v]) => cb(k, v));
  if (res[0]?.length === 2) {
    return Object.fromEntries(res);
  }

  return res;
}

export function forEach<T>(
  obj: Record<string, T>,
  cb: (k: string, v: T) => void,
) {
  Object.entries(obj || {}).forEach(([k, v]) => cb(k, v));
}

export function filter<T>(
  obj: Record<string, T>,
  cb: (k: string, v: T) => boolean,
) {
  return Object.fromEntries(
    Object.entries(obj || {}).filter(([k, v]) => cb(k, v) === true),
  );
}

export function recreateStructure(value: unknown) {
  let newValue = value;

  if (isArray(value)) {
    newValue = [];
    (value as unknown[]).forEach((v) =>
      (newValue as unknown[]).push(recreateStructure(v)),
    );
    return newValue;
  }

  if (isObject(value)) {
    newValue = {};
    for (let key in value as Record<string, unknown>) {
      (newValue as Record<string, unknown>)[key] = recreateStructure(
        (value as Record<string, unknown>)[key],
      );
    }
    return newValue;
  }

  return newValue;
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
