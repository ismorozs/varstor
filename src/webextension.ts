const browser = require("webextension-polyfill/dist/browser-polyfill.min");

import main from ".";
import webextensionStorageUtils, {
  isBackgroundScript,
  isSessionStorageSupport,
} from "./webextension-storage";

const { joinStateChanges, setStorageUtils } = main;

if (isBackgroundScript()) {
  browser.storage.local.onChanged.addListener(joinStateChanges);
  isSessionStorageSupport() &&
    browser.storage.session.onChanged.addListener(joinStateChanges);
}

setStorageUtils(webextensionStorageUtils);

export default main;
