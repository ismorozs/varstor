import { ACCESSORS } from "."
import { NAMESPACE_DELIMITER } from "./namespace";

export const isKeyPresent = (fullKey) => {
  if (!ACCESSORS[fullKey]) {
    const [key, namespace] = fullKey.split(NAMESPACE_DELIMITER);
    throw new Error (`Trying to access "${key}" key in "${namespace}" namespace, but it doesn't exist`);
  }

  return true;
}
