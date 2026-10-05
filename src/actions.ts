import { type INamespace, type IStateActions } from "./types";

import { STATE, createStore } from ".";

export function addStateActions(namespace: INamespace, actions: IStateActions) {
  for (const [actionName, actionFn] of Object.entries(actions)) {
    STATE[namespace(actionName)] = {
      key: actionName,
      namespace,
      value: actionFn.bind(null, createStore(namespace())),
      isAction: true,
      listeners: [],
    };
  }

  return createStore(namespace());
}
