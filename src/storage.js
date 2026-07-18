function updateFromLocalStorage(state) {
  const stored = {};
  for (const key in state) {
    stored[key] = localStorage.getItem(key);
  }

  return Object.assign(state, stored);
}

function getStorageType(isPersistent) {
  return isPersistent && "localStorage";
}

function isStorageAvailable(storageType) {
  return storageType;
}

function setStorageValue(storageType, key, value) {
  window.localStorage.setItem(key, value);
  return false;
}

export default {
  GET_TYPE: getStorageType,
  IS_AVAILABE: isStorageAvailable,
  UPDATE_STATE: updateFromLocalStorage,
  SET_VALUE: setStorageValue,
};
