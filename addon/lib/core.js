/* SPDX-License-Identifier: MIT */
var ZoteroAnkiBridgeCore = (() => {
  function normalizeSelection(text) {
    return String(text || "").replace(/[\u0000-\u001f\u007f-\u009f]/gu, " ")
      .normalize("NFKC").replace(/\s+/gu, " ").trim();
  }
  function escapeHTML(text) {
    return String(text).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }
  function buildNote(selection, translation, config) {
    return {
      deckName: config.deckName,
      modelName: config.modelName,
      fields: {
        [config.frontField]: escapeHTML(selection.text),
        [config.backField]: escapeHTML(translation.trim()).replace(/\r?\n/g, "<br>")
      },
      options: {
        allowDuplicate: false,
        duplicateScope: "deck",
        duplicateScopeOptions: {
          deckName: config.deckName, checkChildren: false, checkAllModels: false
        }
      },
      tags: config.tags || ["Zotero"]
    };
  }
  function matchesTask(task, selection, service) {
    return !!task && normalizeSelection(task.raw) === selection.text
      && task.itemId === selection.itemID && task.service === service;
  }
  function bounded(promise, timeoutMs) {
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("翻译等待超时，请稍后重新划词再试。")), timeoutMs);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }
  function createBridge({config, rpc, getTask = () => null, translate, pollMs = 150, timeoutMs = 90000}) {
    const pending = new Set();
    async function validateTarget() {
      if (!config.deckName || !config.modelName || !config.frontField || !config.backField
          || config.frontField === config.backField) {
        throw new Error("Anki 配置无效：请检查牌组、笔记类型及两个不同的字段名称。");
      }
      const decks = await rpc("deckNames");
      if (!Array.isArray(decks) || !decks.includes(config.deckName)) {
        throw new Error(`Anki 中找不到牌组“${config.deckName}”，请打开正确的用户配置或检查插件设置。`);
      }
      const fields = await rpc("modelFieldNames", {modelName: config.modelName});
      if (!Array.isArray(fields) || ![config.frontField, config.backField].every(x => fields.includes(x))) {
        throw new Error(`Anki 笔记类型“${config.modelName}”缺少字段“${config.frontField}”或“${config.backField}”。`);
      }
      if (fields[0] !== config.frontField) {
        throw new Error("保存单词的字段必须是 Anki 笔记类型的第一个字段，以正确检查重复单词。");
      }
    }
    async function resolveTranslation(selection) {
      let task = getTask(selection, config.service);
      if (!matchesTask(task, selection, config.service)) task = null;
      if (task && task.status === "processing") {
        const deadline = Date.now() + timeoutMs;
        while (task.status === "processing") {
          if (Date.now() >= deadline) throw new Error("翻译等待超时，请稍后重新划词再试。");
          await new Promise(resolve => setTimeout(resolve, pollMs));
        }
        if (task.status !== "success") throw new Error("当前翻译失败，请重新翻译或点击重试。");
      }
      if (!task || task.status !== "success") {
        task = await bounded(Promise.resolve().then(() => translate(selection)), timeoutMs);
      }
      if (!task || task.status !== "success" || typeof task.result !== "string" || !task.result.trim()) {
        throw new Error("翻译失败或结果为空，请检查 Translate for Zotero 的翻译服务后重试。");
      }
      if ((task.raw !== undefined && normalizeSelection(task.raw) !== selection.text)
          || (task.itemId !== undefined && task.itemId !== selection.itemID)
          || (task.service !== undefined && task.service !== config.service)) {
        throw new Error("翻译结果与当前划词或服务不匹配，请重新划词再试。");
      }
      return task.result;
    }
    async function addSelection(input) {
      const selection = {text: normalizeSelection(input?.text), itemID: input?.itemID};
      if (!selection.text || !Number.isInteger(selection.itemID) || selection.itemID <= 0) {
        throw new Error("请先在 Zotero 阅读器中选择单词或短语。");
      }
      const key = JSON.stringify([config.deckName, config.modelName, selection.itemID, selection.text.toLowerCase()]);
      if (pending.has(key)) return {status: "busy"};
      pending.add(key);
      try {
        await validateTarget();
        const translation = await resolveTranslation(selection);
        const note = buildNote(selection, translation, config);
        const eligibility = await rpc("canAddNotes", {notes: [note]});
        if (!Array.isArray(eligibility) || eligibility.length !== 1 || typeof eligibility[0] !== "boolean") {
          throw new Error("AnkiConnect 返回了无效的重复检查结果，尚未添加卡片。");
        }
        if (!eligibility[0]) return {status: "duplicate"};
        const noteID = await rpc("addNote", {note});
        if (!Number.isSafeInteger(noteID) || noteID <= 0) {
          throw new Error("AnkiConnect 未返回有效的笔记编号，请先在 Anki 中检查是否已添加。");
        }
        return {status: "added", noteID};
      } finally {
        pending.delete(key);
      }
    }
    return {addSelection};
  }
  return {normalizeSelection, escapeHTML, buildNote, matchesTask, createBridge};
})();
if (typeof module !== "undefined") module.exports = ZoteroAnkiBridgeCore;
