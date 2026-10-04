const browser = require("webextension-polyfill/dist/browser-polyfill.min");

export default {
  GET_TYPE: getStorageType,
  IS_AVAILABE: isStorageAvailable,
  UPDATE_STATE: updateStateFromStorage,
  SET_VALUES: setStorageValue,
  REMOVE_KEY: removeStorageKey,
};

function getStorageType(isPersistent: boolean) {
  return (isBackgroundScript() && isPersistent && "local") || "session";
}

function isStorageAvailable(storageType: string) {
  return (
    storageType === "local" ||
    (storageType === "session" && isSessionStorageSupport())
  );
}

async function updateStateFromStorage(state: IStateDefault, type: string) {
  return Object.assign(state, await browser.storage[type].get());
}

async function setStorageValue(type: string, changes: Record<string, any>) {
  await browser.storage[type].set(changes);
  return true;
}

async function removeStorageKey(type: string, key: string) {
  if (type) {
    await browser.storage[type].remove(key);
  }
}

export function isSessionStorageSupport() {
  return !!browser.storage.session;
}

export function isBackgroundScript() {
  return (
    window.location.protocol === "chrome-extension:" ||
    window.location.protocol === "moz-extension:"
  );
}
