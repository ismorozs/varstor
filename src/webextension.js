const browser = require("webextension-polyfill/dist/browser-polyfill.min");

import main from '.';

const { onStateChange, setStorageUtils } = main;

if (isBackgroundScript()) {
  browser.storage.local.onChanged.addListener(onStateChange);
  isSessionStorageSupport() &&
    browser.storage.session.onChanged.addListener(onStateChange);
}

setStorageUtils({
  GET_TYPE: getStorageType,
  IS_AVAILABE: isStorageAvailable,
  UPDATE_STATE: updateStateFromStorage,
  SET_VALUE: setStorageValue,
});

function getStorageType (isPersistent) {
  return isBackgroundScript() && isPersistent && "local" || "session";
}

function isStorageAvailable (storageType) {
  return storageType === "local" ||
    (storageType === "session" && isSessionStorageSupport());
}

async function updateStateFromStorage (state, type) {
  return Object.assign(state, await browser.storage[type].get());
}

function setStorageValue (type, key, value) {
  browser.storage[type].set({ [key]: value });
  return true;
}

function isSessionStorageSupport () {
  return !!browser.storage.session;
}

function isBackgroundScript() {
  return (
    window.location.protocol === "chrome-extension:" ||
    window.location.protocol === "moz-extension:"
  );
}

export default main;
