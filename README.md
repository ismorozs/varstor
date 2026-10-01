# Varstor
State manager for web applications and webextensions, employing reactivity, wrapping, and uniting the usage of different storages' values and common variables into a simple universal interface.

## How to install and prepare
Install the library through
```sh
npm install varstor
```
then import with
```js
import varstor from 'varstor'
```

or, if you are developing a webextension (except content script) 

```js
import Varstor from 'varstor/webextension'
```
in your script file.

## Contents
1. [Usage](#overview)  
[1.1 Creation ```.add()```/```.addPersistent()```](#creation)  
[1.2 Dynamic reevaluation (```ReactiveFunction```)](#reactivefunction)  
[1.3 Accessing ```.get()```](#accessing)  
[1.4 Mutating ```.set()```/```.reset()```](#mutating)  
[1.5 Listening ```.onChange()```/```.removeListener()```](#listening)  
[1.6 Namespacing ```.get(Namespace)```](#namespacing)  
[1.7 Method chaining](#chaining)  
2. [Shortcuts](#shortcuts)  
3. [Example](#example)  

## Usage <a name="overview"></a>
The library object features the following methods:
```js
.add ()
.addPersistent ()
.get ()
.set ()
.reset ()
.onChange ()
.removeListener ()
```

## Creation ```.add()```/```.addPersistent()``` <a name="creation"></a>
Values are added to the store with add or addPersistent methods. They perform the same functionality, except addPersistent saves state to the storage and lets you reuse it between browser sessions.

```js
async Varstor.add(
  KeysValues {
    key1: value1,
    key2: value2,
    key3: ReactiveFunction(...valueNames[]) => computedValue
    ...
  }
) => Varstor
```
Where:  
```KeysValues {}``` - a standard object with keys and values, where ```key``` is a name of piece of state, and ```value``` is a default value or ```ReactiveFunction```  
```ReactiveFunction``` - re-evalutes and updates its value automatically each time arguments in ```valueNames``` list change. ```valueNames``` are any state values defined before the ```ReactiveFunction```. ```computedValue```s are not saved in storage.   

**Important: ```add``` and ```addPersistent``` are asynchronous operations; you must `await` or use ```Promise.then``` to ensure all the data is ready to work with!**  
  
## Dynamic reevaluation (```ReactiveFunction```) <a name="reactivefunction"></a>
Values can change automatically with the help of ```ReactiveFunction```s when one or more of the other values in the namespace change.  

```js
ReactiveFunction (...valueNames[]) => computedValue
```
Put the names of dependencies in the  ```valueNames``` arguments list of the ```ReactiveFunction```, and describe the calculation in the body of the function.  
```js
Varstor.add({
  a: 1
  b: 2,
  c: (a, b) => a + b // 3
})
```
  

## Accessing ```.get()``` <a name="accessing"></a>
Values are accessed with:  
```js
Varstor.get() => NamespaceValues {}
```
Where:  
```NamespaceValues {}``` - an object representing all the values in the current namespace at the current moment  

  
  
## Mutating ```.set()```/```.reset()``` <a name="mutating"></a>
Values are mutated with:
```js
async Varstor.set(
  KeysValues {
    key: value
    ...
  }
) => Varstor
```
**Important: values are updated asynchronously; don't assume the script will recognize the change immediately on the next line. Instead, ```await``` or make use of ```onChange``` listeners!**  

To reset values back to defaults:
```js
async Varstor.reset(Keys []) => Varstor
```
Where:  
```Keys[]``` (optional) - array of keys to return to default values. If omitted all values will be returned to defaults.  


## Listening ```.onChange()```/```.removeListener()``` <a name="listening"></a>

To listen and react to state changes:
```js
Varstor.onChange(
  Keys[],
  ChangeCallback(ChangedKeys [], allValues {}, PreviousValues {}) => void
) => Varstor
```
Where:  
```Keys[]``` (optional) - array of keys of the state in the current namespace that you want to listen to. If omitted, ```ChangeCallback``` will run on any value change in the namespace.  
```ChangeCallback``` - function to run when a change happens

To remove the listener:
```js
Varstor.removeListener(
  Keys[],
  ChangeCallback(ChangedKeys [], allValues {}, PreviousValues {}) => void
) => Varstor
```
the same parameter usage. 
  
## Namespacing ```.get(Namespace)``` <a name="namespacing"></a>
To avoid name collisions, put keys with the same name in different namespaces. You can create a new or get an existing namespace with
```js
Varstor.get(Namespace string) => Varstor
```
which will return a new instance of ```Varstor``` with the specified ```Namespace```.  
  

## Method chaining <a name="chaining"></a>
Methods ```.add```, ```.addPersistent```, ```.set()```, ```.reset()```, ```onChange```, and ```removeListener``` all return a new instance of ```Varstor``` with the same namespace, so method chaining is possible.  


## Shortcuts <a name="shortcuts"></a>
The library/namespace object itself can be called with different types of arguments, which will mirror almost all of its API.
```js
Varstor() -> Varstor.get()
Varstor(String namespace) -> Varstor.get(namespace)
Varstor({ key: value }) -> Varstor.set({ key: value })
Varstor([], () => {}) -> Varstor.onChange([], () => {})
```

## Example <a name="example"></a>
```js
function onChange(changes, values, data) {
  console.log("onChange", changes, values, data);
}

Varstor.add({
  a: 10,
  b: 20,
  c: (a, b) => a + b,
});

await Varstor.addPersistent({
  d: 40,
});

console.log(Varstor.get()); // {a: 10, b: 20, c: 30, d: 40}

Varstor.onChange(["a", "b", "c", "d"], onChange);
Varstor.onChange(onChange);

await Varstor.set({ a: 20, b: 88, d: 60 });
console.log(Varstor.get()); // {a: 20, b: 88, c: 108, d: 60}

await Varstor.reset(["b"]);
console.log(Varstor.get()); // {a: 20, b: 20, c: 40, d: 60}

await Varstor.reset();
console.log(Varstor.get()); // {a: 10, b: 20, c: 30, d: 40}

Varstor.removeListener(["a", "b", "c", "d"], onChange);
Varstor.removeListener(onChange);

const newNamespace = Varstor("new namespace");

newNamespace.add({
  yyy: 1,
  zzz: 2,
});

newNamespace({ zzz: 3 });

console.log(Varstor("new namespace").get()); // {yyy: 1, zzz: 3}
```