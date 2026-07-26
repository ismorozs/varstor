import { ACCESSORS } from "."
import { splitFullKey } from "./namespace";


export const isValid = {
  Setting: (fullKey) => {
    if (!ACCESSORS[fullKey]) {
      const [key, namespace] = splitFullKey(fullKey);
      throw new Error(
        `Setting "${key}" key in "${namespace}" namespace. DOES NOT EXIST`,
      );
    }

    return true;
  },

  Defining: (fullKey) => {
    if (ACCESSORS[fullKey]) {
      const [key, namespace] = splitFullKey(fullKey);
      throw new Error(
        `Redefining "${key}" key in "${namespace}" namespace. ALREADY DEFINED`,
      );
    }

    return true;
  }

};
