import { STATE } from ".";
import { NAMESPACE_DELIMITER } from "./constants";

function splitFullKey(fullKey: string) {
  const segments = fullKey.split(NAMESPACE_DELIMITER);
  return [segments.slice(-1)[0], segments.join(NAMESPACE_DELIMITER)];
}

export const isValid = {
  Setting: (fullKey: string) => {
    if (!STATE[fullKey]) {
      const [key, namespace] = splitFullKey(fullKey);
      throw new Error(
        `Setting "${key}" key in "${namespace}" namespace. DOES NOT EXIST`,
      );
    }

    return true;
  },

  Defining: (fullKey: string) => {
    if (STATE[fullKey]) {
      const [key, namespace] = splitFullKey(fullKey);
      throw new Error(
        `Redefining "${key}" key in "${namespace}" namespace. ALREADY DEFINED`,
      );
    }

    return true;
  },
};
