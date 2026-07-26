const browser = require("webextension-polyfill/dist/browser-polyfill.min");

export default {
  GET_TYPE: getStorageType,
  IS_AVAILABE: isStorageAvailable,
  UPDATE_STATE: updateStateFromStorage,
  SET_VALUE: setStorageValue,
};

function getStorageType(isPersistent) {
  return (isBackgroundScript() && isPersistent && "local") || "session";
}

function isStorageAvailable(storageType) {
  return (
    storageType === "local" ||
    (storageType === "session" && isSessionStorageSupport())
  );
}

async function updateStateFromStorage(state, type) {
  return Object.assign(state, await browser.storage[type].get());
}

function setStorageValue(type, key, value) {
  browser.storage[type].set({ [key]: value });
  return true;
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
