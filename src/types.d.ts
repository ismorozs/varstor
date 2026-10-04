type INamespace = (key?: string) => string;

type IComputeFunction = (...args: any[]) => any;

type IValue = {
  key?: string;
  fullKey?: string;
  value?: any;
  computeFn?: boolean | IComputeFunction;
  isAction?: boolean;
  dependencies?: string[];
  dependants?: string[];
  storageType?: string;
  listeners?: any[];
  defaultValue?: any;
  namespace: INamespace;
};

type IState = Record<string, IValue>;

type IStateDefault = Record<string, any>;

type IStateChange = { newValue?: any; prevValue?: any; isSame?: boolean };

type IStateChanges = Record<string, IStateChange>;

type IStorageFunctions = {
  GET_TYPE: (type: boolean) => boolean | string;
  IS_AVAILABE: (type: string) => boolean;
  UPDATE_STATE: (state: IStateDefault, type: string) => IStateDefault;
  SET_VALUES: (type: string, changes: Record<string, any>) => Promise<boolean>;
  REMOVE_KEY: (type: string, key: string) => void;
};

type IStateListener = (
  changes: string[],
  store: Record<string, any>,
) => any;

type IStateListeners = Record<string, IStateListener[]>;

type IStateAction = (mutator: IStateMutator, args: any[]) => void;

type IStateActions = Record<string, IStateAction>;

type IStateUpdatePieces = Record<string, {
  storageTypes: Record<string, boolean>;
  readyStorageTypes: Record<string, boolean>;
  changes: IStateChanges;
}>;

type IStatePendingChanges = Record<string, Record<string, any>>;