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

/***/ "./src/constants.ts"
/*!**************************!*\
  !*** ./src/constants.ts ***!
  \**************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NAMESPACE_DELIMITER: () => (/* binding */ NAMESPACE_DELIMITER)
/* harmony export */ });
const NAMESPACE_DELIMITER = "::";


/***/ },

/***/ "./src/helpers.ts"
/*!************************!*\
  !*** ./src/helpers.ts ***!
  \************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   filter: () => (/* binding */ filter),
/* harmony export */   forEach: () => (/* binding */ forEach),
/* harmony export */   getParamNames: () => (/* binding */ getParamNames),
/* harmony export */   isArray: () => (/* binding */ isArray),
/* harmony export */   isFunction: () => (/* binding */ isFunction),
/* harmony export */   isObject: () => (/* binding */ isObject),
/* harmony export */   isString: () => (/* binding */ isString),
/* harmony export */   map: () => (/* binding */ map),
/* harmony export */   recreateStructure: () => (/* binding */ recreateStructure)
/* harmony export */ });
const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
const ARGUMENT_NAMES = /([^\s,]+)/g;
function isArray(obj) {
    return getObjectType(obj) === "[object Array]";
}
function isString(obj) {
    return getObjectType(obj) === "[object String]";
}
function isFunction(obj) {
    return getObjectType(obj) === "[object Function]";
}
function isObject(obj) {
    return getObjectType(obj) === "[object Object]";
}
function getObjectType(obj) {
    return Object.prototype.toString.call(obj);
}
function getParamNames(fn) {
    const fnStr = fn.toString().replace(STRIP_COMMENTS, "").split("=>")[0];
    const names = fnStr
        .slice(fnStr.indexOf("(") + 1, fnStr.indexOf(")"))
        .match(ARGUMENT_NAMES);
    if (names === null) {
        return [];
    }
    return names;
}
function map(obj, cb) {
    const res = Object.entries(obj).map(([k, v]) => cb(k, v));
    if (res[0]?.length === 2) {
        return Object.fromEntries(res);
    }
    return res;
}
function forEach(obj, cb) {
    Object.entries(obj || {}).forEach(([k, v]) => cb(k, v));
}
function filter(obj, cb) {
    return Object.fromEntries(Object.entries(obj || {}).filter(([k, v]) => cb(k, v) === true));
}
function recreateStructure(value) {
    let newValue = value;
    if (isArray(value)) {
        newValue = [];
        value.forEach((v) => newValue.push(recreateStructure(v)));
        return newValue;
    }
    if (isObject(value)) {
        newValue = {};
        for (let key in value) {
            newValue[key] = recreateStructure(value[key]);
        }
        return newValue;
    }
    return newValue;
}


/***/ },

/***/ "./src/index.ts"
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   STATE: () => (/* binding */ STATE),
/* harmony export */   createStore: () => (/* binding */ createStore),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   getValues: () => (/* binding */ getValues)
/* harmony export */ });
/* harmony import */ var _storage__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./storage */ "./src/storage.ts");
/* harmony import */ var _helpers__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./helpers */ "./src/helpers.ts");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./constants */ "./src/constants.ts");
/* harmony import */ var _validation__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./validation */ "./src/validation.ts");
/* harmony import */ var _listeners__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./listeners */ "./src/listeners.ts");





const STATE = {};
const STORAGE = {};
setStorageUtils(_storage__WEBPACK_IMPORTED_MODULE_0__["default"]);
async function addState(namespace, initialState, isPersistent) {
    const storageType = STORAGE.GET_TYPE(isPersistent);
    const defaultValues = Object.assign({}, initialState);
    const values = (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.map)(initialState, (k, v) => [namespace(k), v]);
    if (STORAGE.IS_AVAILABE(storageType)) {
        await STORAGE.UPDATE_STATE(values, storageType);
    }
    if (!_listeners__WEBPACK_IMPORTED_MODULE_4__.LISTENERS[namespace()]) {
        _listeners__WEBPACK_IMPORTED_MODULE_4__.LISTENERS[namespace()] = [];
    }
    for (const key in initialState) {
        const fullKey = namespace(key);
        _validation__WEBPACK_IMPORTED_MODULE_3__.isValid.Defining(fullKey);
        STATE[fullKey] = setupValue(key, namespace, values[fullKey], defaultValues[key], storageType);
    }
    return createStore(namespace());
}
function setupValue(key, namespace, value, defaultValue, storageType) {
    const fullKey = namespace(key);
    const isComputedValue = (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.isFunction)(value);
    const dependencies = isComputedValue
        ? (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.getParamNames)(value)
        : [];
    dependencies.forEach((dependency) => {
        const fullDependencyKey = namespace(dependency);
        if (!STATE[fullDependencyKey]) {
            STATE[fullDependencyKey] = {
                dependants: [],
                dependencies: [],
                namespace,
                storageType,
            };
        }
        STATE[fullDependencyKey].dependants?.push(fullKey);
    });
    return {
        key,
        fullKey,
        value: isComputedValue
            ? value.apply(null, getArguments(dependencies, namespace))
            : value,
        computeFn: isComputedValue && value,
        dependencies,
        dependants: [],
        listeners: [],
        defaultValue,
        storageType,
        namespace,
    };
}
function getNamespaceState(namespace) {
    return (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.filter)(STATE, (k, { key }) => k === namespace(key));
}
function getValues(namespace) {
    return (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.map)(getNamespaceState(namespace), (k, { key, value }) => [
        key,
        value,
    ]);
}
function getArguments(dependencies, namespace) {
    const values = getValues(namespace);
    return dependencies.map((name) => values[name]);
}
async function onStateChange(changes) {
    const realChanges = {};
    for (const key in changes) {
        const prevValue = STATE[key].value;
        const newValue = changes[key].newValue;
        if (prevValue !== newValue) {
            realChanges[key] = { newValue, prevValue };
            STATE[key].value = newValue;
        }
        else {
            realChanges[key] = { isSame: true };
        }
        updateDependencies(key, changes, realChanges);
    }
    await (0,_listeners__WEBPACK_IMPORTED_MODULE_4__.runStateChangeListeners)((0,_helpers__WEBPACK_IMPORTED_MODULE_1__.filter)(realChanges, (k, v) => !v.isSame));
}
function updateDependencies(key, changes, realChanges) {
    STATE[key].dependants?.forEach((name) => {
        const { dependencies, namespace } = STATE[name];
        if (!isEveryDependencyReady(dependencies, namespace, Object.keys(changes), Object.keys(realChanges)) ||
            realChanges[name]) {
            return;
        }
        const prevValue = STATE[name].value;
        const newValue = STATE[name].computeFn?.apply(null, getArguments(dependencies, namespace));
        if (prevValue !== newValue) {
            realChanges[name] = { newValue, prevValue };
            STATE[name].value = newValue;
            updateDependencies(name, changes, realChanges);
        }
    });
}
function isEveryDependencyReady(dependencies, namespace, changesKeys, realChangesKeys) {
    return dependencies.every((name) => {
        const fullKey = namespace(name);
        return ((changesKeys.includes(fullKey) && realChangesKeys.includes(fullKey)) ||
            !changesKeys.includes(fullKey));
    });
}
function getState(namespace, arg) {
    if ((0,_helpers__WEBPACK_IMPORTED_MODULE_1__.isString)(arg)) {
        return createStore(arg);
    }
    return (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.recreateStructure)(getValues(namespace));
}
async function setState(namespace, changes) {
    const storageChanges = {};
    (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.forEach)(changes, (k, v) => {
        const fullKey = namespace(k);
        const { storageType, computeFn } = STATE[fullKey];
        if (computeFn) {
            return;
        }
        if (!storageChanges[storageType]) {
            storageChanges[storageType] = {};
        }
        storageChanges[storageType][fullKey] = v;
    });
    for (let [storageType, changes] of Object.entries(storageChanges)) {
        await setValues(storageType, changes);
    }
    return createStore(namespace());
}
async function setValues(storageType, changes) {
    if (STORAGE.IS_AVAILABE(storageType)) {
        const isAutoUpdate = await STORAGE.SET_VALUES(storageType, changes);
        if (isAutoUpdate) {
            return;
        }
    }
    onStateChange((0,_helpers__WEBPACK_IMPORTED_MODULE_1__.map)(changes, (k, newValue) => [k, { newValue }]));
}
async function resetState(namespace, keys) {
    const namespaceState = getNamespaceState(namespace);
    await setState(namespace, (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.map)(keys
        ? (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.filter)(namespaceState, (k, { key }) => keys.includes(key))
        : namespaceState, (k, { key, defaultValue }) => [key, defaultValue]));
    return createStore(namespace());
}
function main(namespace) {
    if (!arguments[1] || (0,_helpers__WEBPACK_IMPORTED_MODULE_1__.isString)(arguments[1])) {
        return getState.apply(null, arguments);
    }
    if ((0,_helpers__WEBPACK_IMPORTED_MODULE_1__.isArray)(arguments[1])) {
        return _listeners__WEBPACK_IMPORTED_MODULE_4__.addStateListener.apply(null, arguments);
    }
    if ((0,_helpers__WEBPACK_IMPORTED_MODULE_1__.isObject)(arguments[1])) {
        return setState.apply(null, arguments);
    }
}
function setStorageUtils(storageUtils) {
    Object.assign(STORAGE, storageUtils);
}
function addNamespace(namespace, str) {
    return `${namespace}${((0,_helpers__WEBPACK_IMPORTED_MODULE_1__.isString)(str) && _constants__WEBPACK_IMPORTED_MODULE_2__.NAMESPACE_DELIMITER) || ""}${str || ""}`;
}
function createStore(_namespace) {
    const namespace = ((key) => addNamespace(_namespace, key));
    return Object.assign(main.bind(null, namespace), {
        add: (state) => addState(namespace, state, false),
        addPersistent: (state) => addState(namespace, state, true),
        get: (newNamespace) => getState(namespace, newNamespace),
        set: async (changes) => await setState(namespace, changes),
        reset: (keys) => resetState(namespace, keys),
        onChange: (keys, cb) => (0,_listeners__WEBPACK_IMPORTED_MODULE_4__.addStateListener)(namespace, keys, cb),
        removeListener: (keys, cb) => (0,_listeners__WEBPACK_IMPORTED_MODULE_4__.removeStateListener)(namespace, keys, cb),
        setStorageUtils,
        onStateChange,
    });
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (createStore(""));


/***/ },

/***/ "./src/listeners.ts"
/*!**************************!*\
  !*** ./src/listeners.ts ***!
  \**************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LISTENERS: () => (/* binding */ LISTENERS),
/* harmony export */   addStateListener: () => (/* binding */ addStateListener),
/* harmony export */   removeStateListener: () => (/* binding */ removeStateListener),
/* harmony export */   runStateChangeListeners: () => (/* binding */ runStateChangeListeners)
/* harmony export */ });
/* harmony import */ var ___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! . */ "./src/index.ts");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./constants */ "./src/constants.ts");
/* harmony import */ var _helpers__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./helpers */ "./src/helpers.ts");



const LISTENERS = {};
async function runStateChangeListeners(realChanges) {
    if (Object.keys(realChanges).length) {
        const { namespace } = ___WEBPACK_IMPORTED_MODULE_0__.STATE[Object.keys(realChanges)[0]];
        const stateValues = (0,___WEBPACK_IMPORTED_MODULE_0__.getValues)(namespace);
        for (let [changeKey, change] of Object.entries(realChanges)) {
            const { listeners, key } = ___WEBPACK_IMPORTED_MODULE_0__.STATE[changeKey];
            for (const cb of listeners) {
                await cb([key], stateValues, change);
            }
        }
        const readableKeys = (0,_helpers__WEBPACK_IMPORTED_MODULE_2__.map)(realChanges, (k) => k.slice(_constants__WEBPACK_IMPORTED_MODULE_1__.NAMESPACE_DELIMITER.length));
        for (const cb of LISTENERS[namespace()]) {
            await cb(readableKeys, stateValues, (0,_helpers__WEBPACK_IMPORTED_MODULE_2__.map)(realChanges, (k, v) => [
                k.slice(_constants__WEBPACK_IMPORTED_MODULE_1__.NAMESPACE_DELIMITER.length),
                v,
            ]));
        }
    }
}
function addStateListener(namespace, observables, cb) {
    if ((0,_helpers__WEBPACK_IMPORTED_MODULE_2__.isFunction)(observables)) {
        LISTENERS[namespace()].push(observables);
        return (0,___WEBPACK_IMPORTED_MODULE_0__.createStore)(namespace());
    }
    observables.forEach((key) => ___WEBPACK_IMPORTED_MODULE_0__.STATE[namespace(key)].listeners?.push(cb));
    return (0,___WEBPACK_IMPORTED_MODULE_0__.createStore)(namespace());
}
function removeStateListener(namespace, observables, removeCb) {
    if ((0,_helpers__WEBPACK_IMPORTED_MODULE_2__.isFunction)(observables)) {
        const removeIdx = LISTENERS[namespace()].findIndex((cb) => cb === observables);
        LISTENERS[namespace()].splice(removeIdx, 1);
        return (0,___WEBPACK_IMPORTED_MODULE_0__.createStore)(namespace());
    }
    observables.forEach((key) => {
        const listeners = ___WEBPACK_IMPORTED_MODULE_0__.STATE[namespace(key)].listeners;
        const removeIdx = listeners?.findIndex((cb) => cb === removeCb);
        listeners?.splice(removeIdx, 1);
    });
    return (0,___WEBPACK_IMPORTED_MODULE_0__.createStore)(namespace());
}


/***/ },

/***/ "./src/storage.ts"
/*!************************!*\
  !*** ./src/storage.ts ***!
  \************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
async function updateFromLocalStorage(state) {
    const stored = {};
    for (const key in state) {
        const value = localStorage.getItem(key);
        if (value !== null) {
            stored[key] = value;
        }
    }
    return Object.assign(state, stored);
}
function getStorageType(isPersistent) {
    return isPersistent ? "localStorage" : "";
}
function isStorageAvailable(storageType) {
    return !!storageType;
}
async function setStorageValue(storageType, changes) {
    for (let [k, v] of Object.entries(changes)) {
        localStorage.setItem(k, v);
    }
    return false;
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
    GET_TYPE: getStorageType,
    IS_AVAILABE: isStorageAvailable,
    UPDATE_STATE: updateFromLocalStorage,
    SET_VALUES: setStorageValue,
});


/***/ },

/***/ "./src/validation.ts"
/*!***************************!*\
  !*** ./src/validation.ts ***!
  \***************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isValid: () => (/* binding */ isValid)
/* harmony export */ });
/* harmony import */ var ___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! . */ "./src/index.ts");
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./constants */ "./src/constants.ts");


function splitFullKey(fullKey) {
    const segments = fullKey.split(_constants__WEBPACK_IMPORTED_MODULE_1__.NAMESPACE_DELIMITER);
    return [segments.slice(-1)[0], segments.join(_constants__WEBPACK_IMPORTED_MODULE_1__.NAMESPACE_DELIMITER)];
}
const isValid = {
    Setting: (fullKey) => {
        if (!___WEBPACK_IMPORTED_MODULE_0__.STATE[fullKey]) {
            const [key, namespace] = splitFullKey(fullKey);
            throw new Error(`Setting "${key}" key in "${namespace}" namespace. DOES NOT EXIST`);
        }
        return true;
    },
    Defining: (fullKey) => {
        if (___WEBPACK_IMPORTED_MODULE_0__.STATE[fullKey]) {
            const [key, namespace] = splitFullKey(fullKey);
            throw new Error(`Redefining "${key}" key in "${namespace}" namespace. ALREADY DEFINED`);
        }
        return true;
    },
};


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
/******/ 	let __webpack_exports__ = __webpack_require__("./src/index.ts");
/******/ 	__webpack_exports__ = __webpack_exports__["default"];
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});