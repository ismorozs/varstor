import { ACCESSORS } from "."
import { splitFullKey } from "./namespace";

export const isKeyPresent = (fullKey, obj) => {
  if (!ACCESSORS[fullKey]) {
    const [key, namespace] = splitFullKey(fullKey);
    throw new Error (`Trying to access "${key}" key in "${namespace}" namespace, but it doesn't exist`);
  }

  return true;
}
