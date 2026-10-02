import { STATE, getState, setState, resetState } from ".";

export function addStateActions(namespace: INamespace, actions: IStateActions) {
  const stateAcessor = {
    get: getState.bind(null, namespace),
    set: setState.bind(null, namespace),
    reset: resetState.bind(null, namespace),
  };

  for (let [actionName, actionFn] of Object.entries(actions)) {
    STATE[namespace(actionName)] = {
      key: actionName,
      namespace,
      value: actionFn.bind(null, stateAcessor),
      isAction: true,
      listeners: [],
    };
  }
}
