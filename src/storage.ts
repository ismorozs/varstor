async function updateFromLocalStorage(state: IStateDefault) {
  const stored = {} as IStateDefault;
  for (const key in state) {
    const value = localStorage.getItem(key);
    if (value !== null) {
      stored[key] = value;
    }
  }

  return Object.assign(state, stored);
}

function getStorageType(isPersistent: boolean) {
  return isPersistent ? "localStorage" : "";
}

function isStorageAvailable(storageType: string) {
  return !!storageType;
}

async function setStorageValue(
  storageType: string,
  changes: Record<string, string>,
) {
  for (let [k, v] of Object.entries(changes)) {
    localStorage.setItem(k, v);
  }

  return false;
}

export default {
  GET_TYPE: getStorageType,
  IS_AVAILABE: isStorageAvailable,
  UPDATE_STATE: updateFromLocalStorage,
  SET_VALUES: setStorageValue,
};
