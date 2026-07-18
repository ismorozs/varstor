import {
  getKeys, isString, toCamelCase
} from './helpers';

export const NAMESPACE_DELIMITER = ":";

export function addNamespace(namespace, str) {
  return `${namespace}${isString(str) && NAMESPACE_DELIMITER || ""}${str || ""}`;
}

export function getNamespace(str) {
  return (
    str.split(NAMESPACE_DELIMITER).slice(0, -1).join(NAMESPACE_DELIMITER)
  );
}

export function  getKey (str) {
  return str.split(NAMESPACE_DELIMITER).slice(-1)[0];
}

export function getByNamespace(str, obj) {
  const namespace = getNamespace(str) + NAMESPACE_DELIMITER;

  return Object.fromEntries(
    Object.entries(obj)
      .filter(([k, v]) => k.startsWith(namespace))
      .map(([k, v]) => [k.slice(namespace.length), v]),
  );
}

export function namespacify (namespace, obj) {
  return Object.fromEntries(
    Object.entries(obj)
      .map(([k,v]) => [addNamespace(namespace, k), v]
  ));
}
