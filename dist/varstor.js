(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["Varstor"] = factory();
	else
		root["Varstor"] = factory();
})(this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/error.js"
/*!**********************!*\
  !*** ./src/error.js ***!
  \**********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isKeyPresent: () => (/* binding */ isKeyPresent)
/* harmony export */ });
/* harmony import */ var ___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! . */ "./src/index.js");
/* harmony import */ var _namespace__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./namespace */ "./src/namespace.js");



const isKeyPresent = (fullKey) => {
  if (!___WEBPACK_IMPORTED_MODULE_0__.ACCESSORS[fullKey]) {
    const [key, namespace] = fullKey.split(_namespace__WEBPACK_IMPORTED_MODULE_1__.NAMESPACE_DELIMITER);
    throw new Error (`Trying to access "${key}" key in "${namespace}" namespace, but it doesn't exist`);
  }

  return true;
}


/***/ },

/***/ "./src/helpers.js"
/*!************************!*\
  !*** ./src/helpers.js ***!
  \************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getKeys: () => (/* binding */ getKeys),
/* harmony export */   getParamNames: () => (/* binding */ getParamNames),
/* harmony export */   isArray: () => (/* binding */ isArray),
/* harmony export */   isFunction: () => (/* binding */ isFunction),
/* harmony export */   isObject: () => (/* binding */ isObject),
/* harmony export */   isString: () => (/* binding */ isString),
/* harmony export */   toCamelCase: () => (/* binding */ toCamelCase)
/* harmony export */ });
const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
const ARGUMENT_NAMES = /([^\s,]+)/g;

function isFunction(x) {
  return typeof x === "function";
}

function isObject(x) {
  return typeof x === "object";
}

function isString(x) {
  return typeof x === "string";
}

function isArray(x) {
  return Array.isArray(x);
}

function getParamNames(fn) {
  const fnStr = fn.toString().replace(STRIP_COMMENTS, "");
  const names = fnStr
    .slice(fnStr.indexOf("(") + 1, fnStr.indexOf(")"))
    .match(ARGUMENT_NAMES);

  if (names === null) {
    return [];
  }

  return names;
}

function getKeys(obj, key) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v[key]]));
}

function toCamelCase(str, delimiter) {
  const strArr = str.split(delimiter);
  return `${strArr[0]}${strArr.slice(1).reduce((a, c) => `${a}${c.charAt(0).toUpperCase()}${c.slice(1)}`, "")}`;
}


/***/ },

/***/ "./src/index.js"
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ACCESSORS: () => (/* binding */ ACCESSORS),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _storage__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./storage */ "./src/storage.js");
/* harmony import */ var _helpers__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./helpers */ "./src/helpers.js");
/* harmony import */ var _namespace__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./namespace */ "./src/namespace.js");
/* harmony import */ var _error__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./error */ "./src/error.js");








const STATE = {};
const ACCESSORS = {};
const COMPUTED_DEPENDENCIES = {};
const COMPUTED_ARGUMENTS = {};

const STORAGE = {
  GET_TYPE: null,
  IS_AVAILABE: null,
  UPDATE_STATE: null,
  SET_VALUE: null
};

setStorageUtils(_storage__WEBPACK_IMPORTED_MODULE_0__["default"]);

async function addState (namespace, initialState, isPersistent) {
  const storageType = STORAGE.GET_TYPE(isPersistent);
  const defaultValues = Object.assign({}, initialState);
  const namespacedValues = (0,_namespace__WEBPACK_IMPORTED_MODULE_2__.namespacify)(namespace(), initialState);

  if (STORAGE.IS_AVAILABE(storageType)) {
    await STORAGE.UPDATE_STATE(namespacedValues, storageType);
  }

  const accessors = {};
  for (const key in initialState) {
    accessors[namespace(key)] = setupValue(
      namespace(key),
      namespacedValues[namespace(key)],
      defaultValues[key],
      storageType,
    );
  }

  Object.assign(ACCESSORS, accessors);
  return createStore(namespace());
}

function setupValue (key, value, defaultValue, storageType) {
  const isComputedValue = (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.isFunction)(value);

  if (isComputedValue) {
    setupDependencies(key, value);
  }

  STATE[key] = {
    value: isComputedValue ? value.apply(null, getArguments(key)) : value,
    computeFn: value,
    listeners: [],
    defaultValue,
  };

  return createAccessor(key, value, storageType);
}

function setupDependencies(computedValueName, computeFn) {
  const namespace = (0,_namespace__WEBPACK_IMPORTED_MODULE_2__.getNamespace)(computedValueName);
  const paramNames = (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.getParamNames)(computeFn).map((name) => (0,_namespace__WEBPACK_IMPORTED_MODULE_2__.addNamespace)(namespace, name));
  COMPUTED_ARGUMENTS[computedValueName] = paramNames;

  paramNames.forEach((param) => {
    if (COMPUTED_DEPENDENCIES[param]) {
      COMPUTED_DEPENDENCIES[param].push(computedValueName);
    } else {
      COMPUTED_DEPENDENCIES[param] = [computedValueName];
    }
  });
}

function getArguments(computedName) {
  const values = getNamespaceValues(computedName);
  
  return COMPUTED_ARGUMENTS[computedName]
    .map((name) => values[(0,_namespace__WEBPACK_IMPORTED_MODULE_2__.getKey)(name)])
    .concat(values);
}

function createAccessor(key, value, storageType) {
  const accessor = () => STATE[key].value;

  Object.assign(accessor, {
    valueOf: () => STATE[key].value,
    toString: () => STATE[key].value,
    set: (value) => setValue(key, value, storageType),
    onChange: (cb) => STATE[key].listeners.push(cb),
    removeListener: (removeCb) =>
      (STATE[key].listeners = STATE[key].listeners.filter(
        (cb) => cb !== removeCb,
      )),
    reset: () => setValue(key, STATE[key].defaultValue, storageType),
  });

  return new Proxy(accessor, {
    get: (target, prop) => {
      if (Object.keys(accessor).includes(prop)) {
        return target[prop];
      }

      return STATE[key].value[prop];
    },
  });
}

function setValue (key, value, storageType) {
  if (STORAGE.IS_AVAILABE(storageType)) {
    const isAutoUpdate = STORAGE.SET_VALUE(storageType, key, value);
    if (isAutoUpdate) {
      return;
    }
  }

  onStateChange({ [key]: { newValue: value } });
}

function onStateChange (changes) {
  const realChanges = {};

  for (const key in changes) {
    const prevValue = STATE[key].value;
    const newValue = changes[key].newValue;

    if (prevValue !== newValue) {
      STATE[key].value = newValue;
      realChanges[key] = { newValue, prevValue };

      updateDependencies(key, realChanges);
    }
  }

  for (const key in realChanges) {
    STATE[key].listeners.forEach((cb) => cb(STATE[key].value, getNamespaceValues(key), realChanges[key]));
  }
}

function updateDependencies (key, realChanges) {
  const computedDependencies = COMPUTED_DEPENDENCIES[key];
  if (computedDependencies) {
    computedDependencies.forEach((name) => {
      const prevValue = STATE[name].value;
      const newValue = STATE[name].computeFn.apply(null, getArguments(name));
      if (prevValue !== newValue) {
        STATE[name].value = newValue;
        realChanges[name] = { newValue, prevValue };
        updateDependencies(name, realChanges);
      }
    });
  }
}

function getState(namespace, arg) {
  if ((0,_helpers__WEBPACK_IMPORTED_MODULE_1__.isString)(arg)) {
    return createStore(arg);
  }

  if ((0,_helpers__WEBPACK_IMPORTED_MODULE_1__.isFunction)(arg)) {
    return getNamespaceAccessors(namespace(""), arg);
  }

  return getNamespaceValues(namespace(""));
}

function getNamespaceValues(namespace) {
  return (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.getKeys)((0,_namespace__WEBPACK_IMPORTED_MODULE_2__.getByNamespace)(namespace, STATE), "value");
}

function getNamespaceAccessors (namespace, cb) {
  const accessors = (0,_namespace__WEBPACK_IMPORTED_MODULE_2__.getByNamespace)(namespace, ACCESSORS);
  return cb.call(null, accessors, createStore(namespace()));
}

function setState (namespace, changes) {
  const noKeys = !Object.keys(changes).length;

  if (noKeys) {
    resetAllState();
  } else {
    for (const [k,v] of Object.entries(changes)) {
      (0,_error__WEBPACK_IMPORTED_MODULE_3__.isKeyPresent)(namespace(k)) && ACCESSORS[namespace(k)].set(v);
    };
  }

  return createStore(namespace());
}

function resetAllState (namespace) {
  Object.entries(ACCESSORS)
    .filter(([k]) => k.startsWith(namespace()))
    .forEach((k, { reset }) => reset());

  return createStore(namespace());
}

function addStateLitener (namespace, observables, cb) {
  observables.forEach((key) => ACCESSORS[namespace(key)].onChange(cb));

  return createStore(namespace());
}

function removeStateListener(namespace, observables, cb) {
  observables.forEach((key) =>
    ACCESSORS[namespace(key)].removeListener(cb),
  );

  return createStore(namespace());
}

function main () {
  const arg1 = arguments[1];

  if (!arg1 || (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.isFunction)(arg1) || (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.isString)(arg1)) {
    return getState.apply(null, arguments);
  }

  if (Array.isArray(arg1)) {
    return addStateLitener.apply(null, arguments);
  }

  if ((0,_helpers__WEBPACK_IMPORTED_MODULE_1__.isObject)(arg1)) {
    return setState.apply(null, arguments);
  }
}

function setStorageUtils(storageUtils) {
  Object.assign(STORAGE, storageUtils);
}

function createStore (_namespace) {
  const namespace = (key) => (0,_namespace__WEBPACK_IMPORTED_MODULE_2__.addNamespace)(_namespace, key);

  return Object.assign(main.bind(null, namespace), {
    add: (state) => addState(namespace, state, false),
    addPersistent: (state) => addState(namespace, state, true),
    get: (arg) => getState(namespace, arg),
    set: (changes) => setState(namespace, changes),
    resetAll: () => resetAllState(namespace),
    onChange: (keys, cb) => addStateLitener(namespace, keys, cb),
    removeListener: (keys, cb) => removeStateListener(namespace, keys, cb),
    setStorageUtils,
    onStateChange,
  });
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (createStore(""));


/***/ },

/***/ "./src/namespace.js"
/*!**************************!*\
  !*** ./src/namespace.js ***!
  \**************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NAMESPACE_DELIMITER: () => (/* binding */ NAMESPACE_DELIMITER),
/* harmony export */   addNamespace: () => (/* binding */ addNamespace),
/* harmony export */   getByNamespace: () => (/* binding */ getByNamespace),
/* harmony export */   getKey: () => (/* binding */ getKey),
/* harmony export */   getNamespace: () => (/* binding */ getNamespace),
/* harmony export */   namespacify: () => (/* binding */ namespacify)
/* harmony export */ });
/* harmony import */ var _helpers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./helpers */ "./src/helpers.js");


const NAMESPACE_DELIMITER = ":";

function addNamespace(namespace, str) {
  return `${namespace}${(0,_helpers__WEBPACK_IMPORTED_MODULE_0__.isString)(str) && NAMESPACE_DELIMITER || ""}${str || ""}`;
}

function getNamespace(str) {
  return (
    str.split(NAMESPACE_DELIMITER).slice(0, -1).join(NAMESPACE_DELIMITER)
  );
}

function  getKey (str) {
  return str.split(NAMESPACE_DELIMITER).slice(-1)[0];
}

function getByNamespace(str, obj) {
  const namespace = getNamespace(str) + NAMESPACE_DELIMITER;

  return Object.fromEntries(
    Object.entries(obj)
      .filter(([k, v]) => k.startsWith(namespace))
      .map(([k, v]) => [k.slice(namespace.length), v]),
  );
}

function namespacify (namespace, obj) {
  return Object.fromEntries(
    Object.entries(obj)
      .map(([k,v]) => [addNamespace(namespace, k), v]
  ));
}


/***/ },

/***/ "./src/storage.js"
/*!************************!*\
  !*** ./src/storage.js ***!
  \************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
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

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  GET_TYPE: getStorageType,
  IS_AVAILABE: isStorageAvailable,
  UPDATE_STATE: updateFromLocalStorage,
  SET_VALUE: setStorageValue,
});


/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	const __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		const cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		const module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			const e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter/value functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			if(Array.isArray(definition)) {
/******/ 				var i = 0;
/******/ 				while(i < definition.length) {
/******/ 					var key = definition[i++];
/******/ 					var binding = definition[i++];
/******/ 					if(!__webpack_require__.o(exports, key)) {
/******/ 						if(binding === 0) {
/******/ 							Object.defineProperty(exports, key, { enumerable: true, value: definition[i++] });
/******/ 						} else {
/******/ 							Object.defineProperty(exports, key, { enumerable: true, get: binding });
/******/ 						}
/******/ 					} else if(binding === 0) { i++; }
/******/ 				}
/******/ 			} else {
/******/ 				for(var key in definition) {
/******/ 					if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 						Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	let __webpack_exports__ = __webpack_require__("./src/index.js");
/******/ 	__webpack_exports__ = __webpack_exports__["default"];
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});