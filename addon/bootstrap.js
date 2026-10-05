/* SPDX-License-Identifier: MIT */
var bridgeContext;
var bridgeAdapter;
var generation = 0;

async function startup({id, rootURI, resourceURI}, reason) {
  const currentGeneration = ++generation;
  await Zotero.initializationPromise;
  if (currentGeneration !== generation) return;
  if (bridgeAdapter) bridgeAdapter.stop();
  rootURI = rootURI || resourceURI.spec;
  const timers = ChromeUtils.importESModule("resource://gre/modules/Timer.sys.mjs");
  bridgeContext = {Zotero, setTimeout: timers.setTimeout, clearTimeout: timers.clearTimeout};
  Services.scriptloader.loadSubScript(rootURI + "lib/core.js", bridgeContext);
  Services.scriptloader.loadSubScript(rootURI + "lib/adapter.js", bridgeContext);
  bridgeAdapter = bridgeContext.ZoteroAnkiBridgeAdapter.createAdapter(
    Zotero, bridgeContext.ZoteroAnkiBridgeCore, {pluginID: id}
  );
  bridgeAdapter.start();
}
function shutdown(data, reason) {
  generation++;
  if (bridgeAdapter) bridgeAdapter.stop();
  bridgeAdapter = null;
  bridgeContext = null;
}
function install(data, reason) {}
function uninstall(data, reason) {}
