/* SPDX-License-Identifier: MIT */
var ZoteroAnkiBridgeAdapter = (() => {
  const PREFIX = "extensions.zotero.ZoteroAnkiBridge.";
  const XHTML = "http://www.w3.org/1999/xhtml";
  function createAdapter(Zotero, Core, {pluginID, timeoutMs = 90000, pollMs = 150}) {
    let active = false;
    let generation = 0;
    const containers = new Set();
    const bridges = new Map();
    function pref(key, fallback = "") {
      const value = Zotero.Prefs.get(key, true);
      return typeof value === "string" && value.trim() ? value.trim() : fallback;
    }
    function getConfig() {
      const legacy = name => pref("extensions.zotero.zodh." + name);
      return {
        deckName: pref(PREFIX + "deckName", legacy("deckname") || "文献单词"),
        modelName: pref(PREFIX + "modelName", legacy("typename") || "问答题"),
        frontField: pref(PREFIX + "frontField", legacy("expression") || "正面"),
        backField: pref(PREFIX + "backField", legacy("definitions") || legacy("definition") || "背面"),
        tags: pref(PREFIX + "tags", "Zotero").split(/[\s,]+/u).filter(Boolean),
        service: pref("extensions.zotero.ZoteroPDFTranslate.translateSource")
      };
    }
    async function rpc(action, params = {}) {
      if (!active) throw new Error("划词 Anki 插件已停用，未继续添加卡片。");
      const endpoint = pref(PREFIX + "endpoint", "http://127.0.0.1:8765");
      if (!/^http:\/\/(127\.0\.0\.1|localhost|\[::1\]):\d{1,5}\/?$/i.test(endpoint)) {
        throw new Error("AnkiConnect 地址必须是本机 HTTP 地址，如 http://127.0.0.1:8765。");
      }
      const payload = {action, version: 6, params};
      const apiKey = pref(PREFIX + "apiKey");
      if (apiKey) payload.key = apiKey;
      let response;
      try {
        const xhr = await Zotero.HTTP.request("POST", endpoint, {
          body: JSON.stringify(payload), headers: {"Content-Type": "application/json"},
          responseType: "text", timeout: 10000
        });
        response = JSON.parse(xhr.response);
      } catch (_) {
        throw new Error("无法连接 AnkiConnect 或响应格式错误。请打开 Anki，确认 AnkiConnect 已启用，并检查本机地址和端口。");
      }
      if (!response || typeof response !== "object"
          || !Object.prototype.hasOwnProperty.call(response, "result")
          || !Object.prototype.hasOwnProperty.call(response, "error")) {
        throw new Error("AnkiConnect 响应格式错误，未确认添加成功。");
      }
      if (response.error !== null) {
        const error = apiKey ? String(response.error).split(apiKey).join("[已隐藏]") : String(response.error);
        throw new Error("AnkiConnect：" + error);
      }
      return response.result;
    }
    function getTask(selection, service) {
      const queue = Zotero.PDFTranslate?.data?.translate?.queue;
      if (!Array.isArray(queue)) return null;
      for (let index = queue.length - 1; index >= 0; index--) {
        const task = queue[index];
        if (task.type === "text" && Core.matchesTask(task, selection, service)) return task;
      }
      return null;
    }
    function getBridge() {
      const config = getConfig();
      const key = JSON.stringify(config);
      if (!bridges.has(key)) {
        const currentGeneration = generation;
        const ensureActive = () => {
          if (!active || generation !== currentGeneration) throw new Error("划词 Anki 插件已停用，未继续添加卡片。");
        };
        bridges.set(key, Core.createBridge({config,
          rpc: (action, params) => {ensureActive(); return rpc(action, params);},
          getTask, timeoutMs, pollMs,
          translate: async selection => {
            ensureActive();
            if (!Zotero.PDFTranslate?.api?.translate || !config.service) {
              throw new Error("请启用 Translate for Zotero，并选择 DeepSeek 翻译服务。");
            }
            return Zotero.PDFTranslate.api.translate(selection.text, {
              pluginID, itemID: selection.itemID, service: config.service
            });
          }
        }));
      }
      return bridges.get(key);
    }
    function onSelection(event) {
      if (!active) return;
      const text = Core.normalizeSelection(event.params?.annotation?.text);
      if (!text) return;
      // Keep a snapshot: subsequent selections must not change the clicked card.
      const selection = {text, itemID: event.reader.itemID};
      const selectionGeneration = generation;
      const isCurrent = () => active && generation === selectionGeneration;
      for (const node of containers) {
        try {if (!node.isConnected) containers.delete(node);}
        catch (_) {containers.delete(node);}
      }
      const root = event.doc.createElementNS(XHTML, "div");
      root.className = "zotero-anki-bridge";
      root.style.marginTop = "6px";
      const button = event.doc.createElementNS(XHTML, "button");
      button.type = "button";
      button.textContent = "＋ 加入 Anki";
      button.title = "将所选单词和翻译加入 Anki";
      button.style.width = "100%";
      button.style.cursor = "pointer";
      const status = event.doc.createElementNS(XHTML, "div");
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      status.style.fontSize = "12px";
      status.style.whiteSpace = "normal";
      status.style.overflowWrap = "anywhere";
      status.style.marginTop = "4px";
      root.appendChild(button);
      root.appendChild(status);
      button.addEventListener("click", async ev => {
        ev.preventDefault();
        ev.stopPropagation();
        if (button.disabled || !isCurrent()) return;
        button.disabled = true;
        button.textContent = "正在加入…";
        status.textContent = "";
        try {
          const result = await getBridge().addSelection(selection);
          if (!isCurrent()) return;
          if (result.status === "added") {
            button.textContent = "✓ 已加入 Anki";
          } else if (result.status === "duplicate") {
            button.textContent = "已存在，未新增";
            status.textContent = "Anki 拒绝重复添加；请在牌组中检查这个单词。";
          } else {
            button.disabled = false;
            button.textContent = "＋ 加入 Anki";
            status.textContent = "同一单词正在添加，请稍候。";
          }
        } catch (error) {
          if (!isCurrent()) return;
          button.disabled = false;
          button.textContent = "重试加入 Anki";
          status.textContent = error.message || String(error);
        }
      });
      containers.add(root);
      event.append(root);
    }
    function start() {
      if (active) return;
      generation++;
      active = true;
      Zotero.Reader.registerEventListener("renderTextSelectionPopup", onSelection, pluginID);
    }
    function stop() {
      active = false;
      generation++;
      Zotero.Reader.unregisterEventListener("renderTextSelectionPopup", onSelection);
      for (const node of containers) {
        try {node.remove();} catch (_) { /* A closed reader can expose a dead DOM wrapper. */ }
      }
      containers.clear();
      bridges.clear();
    }
    return {start, stop, onSelection, getConfig};
  }
  return {createAdapter};
})();
if (typeof module !== "undefined") module.exports = ZoteroAnkiBridgeAdapter;
