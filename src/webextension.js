const browser = require("webextension-polyfill/dist/browser-polyfill.min");

import main from '.';
import webextensionStorageUtils, { isBackgroundScript, isSessionStorageSupport } from './webextension-storage';

const { onStateChange, setStorageUtils } = main;

if (isBackgroundScript()) {
  browser.storage.local.onChanged.addListener(onStateChange);
  isSessionStorageSupport() &&
    browser.storage.session.onChanged.addListener(onStateChange);
}

setStorageUtils(webextensionStorageUtils);

export default main;
