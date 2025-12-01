/*
 * Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

/* global document, Office, Word, setInterval, clearInterval */

import { LogicBuilder } from "./logicbuilder";

let autoRefreshInterval;
let currentTab = 'variables';
const logicBuilder = new LogicBuilder();

// Enhanced error handling and debugging
function logError(message, error) {
  console.error(`[Stanza Add-in] ${message}`, error);
  const consoleOutput = document.getElementById("console-output");
  if (consoleOutput) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "text-red-400";
    errorDiv.textContent = `ERROR: ${message}${error ? ' - ' + error.message : ''}`;
    consoleOutput.appendChild(errorDiv);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  }
}

function logInfo(message) {
  console.log(`[Stanza Add-in] ${message}`);
  const consoleOutput = document.getElementById("console-output");
  if (consoleOutput) {
    const infoDiv = document.createElement("div");
    infoDiv.className = "text-gray-300";
    infoDiv.textContent = message;
    consoleOutput.appendChild(infoDiv);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  }
}

// Check if Office.js is loaded
if (typeof Office === 'undefined') {
  logError("Office.js is not loaded. Make sure the add-in is properly sideloaded.");
  const sideloadMsg = document.getElementById("sideload-msg");
  if (sideloadMsg) {
    sideloadMsg.classList.remove("hidden");
    sideloadMsg.innerHTML = `
      <div>
        <h2 class="text-xl text-gray-600 mb-4">Please sideload your add-in.</h2>
        <p class="text-sm text-gray-500 mb-2">Office.js failed to load.</p>
        <p class="text-xs text-gray-400">Check the browser console (F12) for more details.</p>
      </div>
    `;
  }
} else {
  logInfo("Office.js loaded, initializing...");
  
  Office.onReady((info) => {
    logInfo(`Office.onReady called. Host: ${info.host}, Platform: ${info.platform}`);
    
    if (info.host === Office.HostType.Word) {
      logInfo("Word host detected, initializing add-in...");
      
      try {
        const sideloadMsg = document.getElementById("sideload-msg");
        if (sideloadMsg) {
          sideloadMsg.style.display = "none";
        }
        
        // Initialize Logic Builder
        try {
          logicBuilder.init("builder-canvas", "builder-vars");
          logInfo("Logic Builder initialized");
        } catch (error) {
          logError("Failed to initialize Logic Builder", error);
        }

        // Attach event listeners with error handling
        try {
          const actionBtn = document.getElementById("action-btn");
          const refreshBtn = document.getElementById("refresh-btn");
          const tabVariables = document.getElementById("tab-variables");
          const tabLogic = document.getElementById("tab-logic");
          const tabBuilder = document.getElementById("tab-builder");
          
          if (actionBtn) actionBtn.onclick = () => handlePrimaryAction();
          if (refreshBtn) refreshBtn.onclick = () => tryCatch(scanDocument);
          if (tabVariables) tabVariables.onclick = () => switchTab('variables');
          if (tabLogic) tabLogic.onclick = () => switchTab('logic');
          if (tabBuilder) tabBuilder.onclick = () => switchTab('builder');
          
          logInfo("Event listeners attached");
        } catch (error) {
          logError("Failed to attach event listeners", error);
        }
        
        // Initial scan
        tryCatch(scanDocument);

        // Start Auto-Refresh (Every 5 seconds)
        startAutoRefresh();
        
        logInfo("Add-in initialized successfully");
      } catch (error) {
        logError("Error during initialization", error);
      }
    } else {
      logError(`Unsupported host: ${info.host}. This add-in only works with Word.`);
      const sideloadMsg = document.getElementById("sideload-msg");
      if (sideloadMsg) {
        sideloadMsg.classList.remove("hidden");
        sideloadMsg.innerHTML = `
          <div>
            <h2 class="text-xl text-gray-600 mb-4">Unsupported Host</h2>
            <p class="text-sm text-gray-500">This add-in only works with Microsoft Word.</p>
            <p class="text-xs text-gray-400 mt-2">Current host: ${info.host}</p>
          </div>
        `;
      }
    }
  }).catch((error) => {
    logError("Office.onReady failed", error);
    const sideloadMsg = document.getElementById("sideload-msg");
    if (sideloadMsg) {
      sideloadMsg.classList.remove("hidden");
      sideloadMsg.innerHTML = `
        <div>
          <h2 class="text-xl text-red-600 mb-4">Initialization Failed</h2>
          <p class="text-sm text-gray-500 mb-2">${error.message || 'Unknown error'}</p>
          <p class="text-xs text-gray-400">Check the browser console (F12) for more details.</p>
        </div>
      `;
    }
  });
}

function startAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(() => {
        tryCatch(scanDocument);
    }, 5000);
}

/**
 * Tab Switching Logic
 */
function switchTab(tabName) {
    currentTab = tabName;
    const tabs = {
        variables: document.getElementById("tab-variables"),
        logic: document.getElementById("tab-logic"),
        builder: document.getElementById("tab-builder")
    };
    const sections = {
        variables: document.getElementById("section-variables"),
        logic: document.getElementById("section-logic"),
        builder: document.getElementById("section-builder")
    };

    // Reset all
    Object.values(tabs).forEach(t => {
        t.classList.remove("border-blue-600", "text-blue-600");
        t.classList.add("border-transparent", "text-gray-500");
        const badge = t.querySelector("span");
        if (badge) {
            badge.classList.remove("bg-blue-100", "text-blue-700");
            badge.classList.add("bg-gray-100", "text-gray-600");
        }
    });
    Object.values(sections).forEach(s => s.classList.add("hidden"));

    // Activate current
    const activeTab = tabs[tabName];
    activeTab.classList.remove("border-transparent", "text-gray-500");
    activeTab.classList.add("border-blue-600", "text-blue-600");
    const badge = activeTab.querySelector("span");
    if (badge) {
        badge.classList.remove("bg-gray-100", "text-gray-600");
        badge.classList.add("bg-blue-100", "text-blue-700");
    }
    sections[tabName].classList.remove("hidden");

    updatePrimaryButton();
}

function updatePrimaryButton() {
    const btnText = document.getElementById("action-btn-text");
    const iconConvert = document.getElementById("icon-convert");
    const iconInsert = document.getElementById("icon-insert");

    if (currentTab === 'builder') {
        btnText.innerText = "Insert Logic";
        iconConvert.classList.add("hidden");
        iconInsert.classList.remove("hidden");
    } else {
        btnText.innerText = "Convert Selection";
        iconConvert.classList.remove("hidden");
        iconInsert.classList.add("hidden");
    }
}

async function handlePrimaryAction() {
    if (currentTab === 'builder') {
        await tryCatch(insertLogic);
    } else {
        await tryCatch(convertSelection);
    }
}

/**
 * Scans the document for Jinja2 variables, logic, and validation errors.
 */
async function scanDocument() {
  await Word.run(async (context) => {
    // get body text
    const body = context.document.body;
    body.load("text");
    await context.sync();

    const text = body.text;
    
    // Parse variables, logic, and find errors
    const { variables, logicBlocks, errors, variableCounts } = parseJinja(text);

    // Update UI
    renderVariables(variables, variableCounts);
    renderLogic(logicBlocks);
    renderConsole(errors);

    // Update Logic Builder with found variables
    logicBuilder.updateVariables(variables);
  });
}

/**
 * Converts currently selected text into a Jinja2 variable.
 */
async function convertSelection() {
  await Word.run(async (context) => {
    const selection = context.document.getSelection();
    selection.load("text");
    await context.sync();

    const rawText = selection.text.trim();
    if (!rawText) return; // No text selected

    // Sanitize: "Customer Name" -> "customer_name"
    const cleanName = rawText
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

    const newVar = `{{ ${cleanName} }}`;
    
    // Insert/Replace
    selection.insertText(newVar, Word.InsertLocation.replace);
    await context.sync();
    
    // Refresh the list
    await scanDocument();
  });
}

/**
 * Inserts the generated logic from the builder into the document
 */
async function insertLogic() {
    const jinjaCode = logicBuilder.generateJinja();
    if (!jinjaCode) return;

    await Word.run(async (context) => {
        const selection = context.document.getSelection();
        selection.insertText(jinjaCode, Word.InsertLocation.replace);
        await context.sync();
    });
    
    await scanDocument();
}


/**
 * Renames a variable throughout the document
 */
async function renameVariable(oldName, newName) {
  if (!newName || oldName === newName) return;
  
  // Validate new name
  if (!newName.match(/^[a-zA-Z0-9_]+$/)) {
    throw new Error("Invalid variable name. Only letters, numbers, and underscores are allowed.");
  }

  if (autoRefreshInterval) clearInterval(autoRefreshInterval);

  await Word.run(async (context) => {
      try {
          const body = context.document.body;
          
          // Search for the exact pattern with spaces: {{ variableName }}
          const searchPattern = `{{ ${oldName} }}`;
          const searchResults = body.search(searchPattern, { matchCase: true });
          context.load(searchResults, 'text');
          await context.sync();
          
          // Replace all matches (process in reverse to avoid index shifting)
          for (let i = searchResults.items.length - 1; i >= 0; i--) {
              const range = searchResults.items[i];
              range.insertText(`{{ ${newName} }}`, Word.InsertLocation.replace);
          }
          
          await context.sync();
          
          // Also handle pattern without spaces: {{variableName}}
          const searchPatternNoSpaces = `{{${oldName}}}`;
          const searchResults2 = body.search(searchPatternNoSpaces, { matchCase: true });
          context.load(searchResults2, 'text');
          await context.sync();
          
          for (let i = searchResults2.items.length - 1; i >= 0; i--) {
              const range = searchResults2.items[i];
              range.insertText(`{{ ${newName} }}`, Word.InsertLocation.replace);
          }
          
          await context.sync();
      } catch (error) {
          logError("Error in renameVariable", error);
          throw error;
      }
  });

  startAutoRefresh();
  await scanDocument();
}

/**
 * Regex Logic
 */
function parseJinja(text) {
  const variables = new Set();
  const errors = [];
  const variableMap = new Map(); // Name -> count
  const logicBlocks = [];
  
  // Stacks for validation
  const ifStack = [];
  const forStack = [];

  // 1. Find Valid Variables: {{ variable_name }}
  const validPattern = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  let match;
  
  while ((match = validPattern.exec(text)) !== null) {
    const fullMatch = match[0];
    const varName = match[1];
    if (fullMatch.includes("  ")) {
      errors.push({
        type: "warning",
        message: `Extra whitespace in '${fullMatch}'`,
        index: match.index,
        length: fullMatch.length,
        snippet: fullMatch // Add snippet
      });
    }
    variables.add(varName);
    variableMap.set(varName, (variableMap.get(varName) || 0) + 1);
  }

  // 2. Find Control Logic: {% ... %}
  const logicPattern = /\{%\s*(.+?)\s*%\}/g;
  let lMatch;
  
  while ((lMatch = logicPattern.exec(text)) !== null) {
      const content = lMatch[1].trim();
      let type = "unknown";
      let summary = content;
      const fullMatch = lMatch[0];
      const index = lMatch.index;

      if (content.startsWith("if ")) {
          type = "if";
          summary = content.substring(3); 
          ifStack.push({ type: 'if', index: index, content: fullMatch });
      } else if (content.startsWith("elif ")) {
          type = "elif";
          summary = content.substring(5);
          if (ifStack.length === 0) {
              errors.push({ type: "error", message: `Unexpected '{% elif ... %}' without 'if'`, index: index, length: fullMatch.length, snippet: fullMatch });
          }
      } else if (content.startsWith("else")) {
          type = "else";
          summary = "(fallback)";
          if (ifStack.length === 0 && forStack.length === 0) {
              errors.push({ type: "error", message: `Unexpected '{% else %}'`, index: index, length: fullMatch.length, snippet: fullMatch });
          }
      } else if (content.startsWith("endif")) {
          type = "endif";
          summary = "";
          if (ifStack.length === 0) {
              errors.push({ type: "error", message: `Unexpected '{% endif %}' without 'if'`, index: index, length: fullMatch.length, snippet: fullMatch });
          } else {
              ifStack.pop();
          }
      } else if (content.startsWith("for ")) {
          type = "for";
          summary = content.substring(4);
          forStack.push({ type: 'for', index: index, content: fullMatch });
      } else if (content.startsWith("endfor")) {
          type = "endfor";
          summary = "";
          if (forStack.length === 0) {
              errors.push({ type: "error", message: `Unexpected '{% endfor %}' without 'for'`, index: index, length: fullMatch.length, snippet: fullMatch });
          } else {
              forStack.pop();
          }
      }

      logicBlocks.push({
          type,
          content,
          summary,
          fullMatch: lMatch[0]
      });
  }

  // Check for unclosed blocks at end of file
  if (ifStack.length > 0) {
      const unclosed = ifStack[ifStack.length - 1];
      errors.push({ type: "error", message: `Unclosed 'if' statement`, index: unclosed.index, length: unclosed.content.length, snippet: unclosed.content });
  }
  if (forStack.length > 0) {
      const unclosed = forStack[forStack.length - 1];
      errors.push({ type: "error", message: `Unclosed 'for' loop`, index: unclosed.index, length: unclosed.content.length, snippet: unclosed.content });
  }

  // 3. Validation / Error Scanning (Variables)
  const singleOpenRegex = /(?<!\{)\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  while ((match = singleOpenRegex.exec(text)) !== null) {
      errors.push({ type: "error", message: `Malformed opening brace: '{ ${match[1]} }}'`, index: match.index, length: match[0].length, snippet: match[0] });
  }

  const singleCloseRegex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}(?!\})/g;
  while ((match = singleCloseRegex.exec(text)) !== null) {
      errors.push({ type: "error", message: `Malformed closing brace: '{{ ${match[1]} }'`, index: match.index, length: match[0].length, snippet: match[0] });
  }

  const openBraces = [...text.matchAll(/\{\{/g)];
  openBraces.forEach(m => {
      const idx = m.index;
      const slice = text.slice(idx, idx + 50);
      if (!slice.includes("}}")) {
          if (!slice.match(/\{\{\s*[a-zA-Z0-9_]+\s*\}\}/)) {
               if (slice.includes("\n") || slice.length < 50) { 
                   errors.push({ type: "error", message: `Unclosed variable`, index: idx, length: 2, snippet: "{{" });
               }
          }
      }
  });

  const badPatterns = [
      { regex: /\{\{\s*\]/g, msg: "Syntax Error: '{{ ]'" },       
      { regex: /\{\[\s*\}\}/g, msg: "Syntax Error: '{[ }}'" },    
      { regex: /\{\[\s*\}/g, msg: "Syntax Error: '{[ }'" },       
      { regex: /\[\[/g, msg: "Double brackets '[[' detected (use '{{')" },
      { regex: /\]\]/g, msg: "Double brackets ']]' detected (use '}}')" },
      { regex: /\{\{\s*\}\}/g, msg: "Empty variable '{{ }}'" },
      { regex: /(?<!\{)\{\s*[a-zA-Z0-9_]+\s*\}(?!\})/g, msg: "Single braces used '{ var }' (use '{{ var }}')" }
  ];

  badPatterns.forEach(p => {
      let errMatch;
      while ((errMatch = p.regex.exec(text)) !== null) {
           errors.push({ type: "error", message: `${p.msg} found.`, index: errMatch.index, length: errMatch[0].length, snippet: errMatch[0] });
      }
  });

  return { 
    variables: Array.from(variables).sort(),
    variableCounts: variableMap,
    logicBlocks,
    errors 
  };
}

/**
 * UI Rendering
 */
function renderVariables(variables, variableCounts) {
  if (document.activeElement && document.activeElement.tagName === "INPUT") {
      return;
  }

  const list = document.getElementById("variable-list");
  const countSpan = document.getElementById("var-count");
  
  countSpan.innerText = variables.length;
  list.innerHTML = "";

  if (variables.length === 0) {
    list.innerHTML = `<div class="text-center py-8 text-gray-400 italic text-xs">No variables detected. Click Refresh to scan.</div>`;
    return;
  }

  variables.forEach((v, index) => {
    const count = variableCounts.get(v) || 0;
    const safeId = index; 
    
    const item = document.createElement("div");
    item.className = "group flex flex-col bg-white p-2 rounded border border-gray-200 hover:border-blue-400 transition-all shadow-sm mb-2";
    
    // Render View Mode
    item.innerHTML = `
      <div class="flex items-center justify-between w-full" id="view-${safeId}">
        <div class="flex items-center gap-2 overflow-hidden">
            <div class="flex items-center gap-1 text-gray-500 text-xs min-w-[24px]">
                <span class="bg-gray-100 px-1.5 py-0.5 rounded-full font-mono" title="Occurrences">${count}</span>
            </div>
            <span class="text-blue-600 bg-blue-50 p-0.5 rounded text-[10px] font-mono">{{</span>
            <span class="font-medium text-gray-700 truncate cursor-pointer hover:text-blue-700" title="Click to rename" onclick="toggleEdit('${safeId}')">${v}</span>
            <span class="text-blue-600 bg-blue-50 p-0.5 rounded text-[10px] font-mono">}}</span>
        </div>
        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
             <button class="text-gray-400 hover:text-blue-600 p-1" title="Rename" onclick="toggleEdit('${safeId}')">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
            </button>
            <button class="text-gray-400 hover:text-blue-600 p-1" title="Copy" onclick="navigator.clipboard.writeText('{{ ${v} }}')">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </button>
        </div>
      </div>
      
      <div class="hidden w-full mt-2 flex items-center gap-2" id="edit-${safeId}">
        <input type="text" id="input-${safeId}" value="${v}" data-original="${v}" class="flex-1 border border-blue-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
        <button class="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700" onclick="saveRename('${safeId}')">Save</button>
        <button class="text-gray-500 hover:text-gray-700 px-1" onclick="toggleEdit('${safeId}')">✕</button>
      </div>
    `;
    list.appendChild(item);
  });
}

function renderLogic(logicBlocks) {
    const list = document.getElementById("logic-list");
    const countSpan = document.getElementById("logic-count");

    const meaningfulBlocks = logicBlocks.filter(l => !l.type.startsWith('end') && !l.type.startsWith('elif') && !l.type.startsWith('else'));
    countSpan.innerText = meaningfulBlocks.length;
    list.innerHTML = "";

    if (logicBlocks.length === 0) {
        list.innerHTML = `<div class="text-center py-4 text-gray-400 italic text-xs">No control logic detected.</div>`;
        return;
    }

    logicBlocks.forEach(block => {
        const item = document.createElement("div");
        let icon = "";
        let colorClass = "bg-gray-50 border-gray-200";
        let textClass = "text-gray-600";

        if (block.type === 'if') {
            icon = `<svg class="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
            colorClass = "bg-purple-50 border-purple-100";
            textClass = "text-purple-800 font-medium";
        } else if (block.type === 'for') {
            icon = `<svg class="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>`;
            colorClass = "bg-green-50 border-green-100";
            textClass = "text-green-800 font-medium";
        } else if (block.type.startsWith('end')) {
             colorClass = "bg-gray-50 border-transparent opacity-60";
             textClass = "text-gray-400 font-mono text-[10px]";
        }

        item.className = `flex items-center gap-2 p-1.5 rounded border ${colorClass} text-xs`;
        item.innerHTML = `
            ${icon}
            <span class="font-mono ${block.type.startsWith('end') ? 'pl-4' : ''} ${textClass}">${block.content}</span>
        `;
        
        list.appendChild(item);
    });
}

function renderConsole(errors) {
  const consoleOutput = document.getElementById("console-output");
  const errorCountBadge = document.getElementById("error-count");
  consoleOutput.innerHTML = "";
  
  if (errors.length > 0) {
    errorCountBadge.innerText = errors.length;
    errorCountBadge.classList.remove("hidden");
    
    errors.forEach(err => {
      const line = document.createElement("div");
      const clickable = err.snippet !== undefined; // Only clickable if we captured a snippet
      const cursorClass = clickable ? "cursor-pointer hover:bg-gray-800" : "";
      
      if (err.type === 'error') {
          line.className = `text-red-400 flex gap-2 items-start py-0.5 ${cursorClass}`;
          line.innerHTML = `<span class="text-red-500 font-bold text-xs mt-0.5">✖</span> <span>${err.message}</span>`;
      } else {
          line.className = `text-yellow-400 flex gap-2 items-start py-0.5 ${cursorClass}`;
          line.innerHTML = `<span class="text-yellow-500 font-bold text-xs mt-0.5">⚠</span> <span>${err.message}</span>`;
      }
      
      if (clickable) {
          line.onclick = () => navigateToError(err.snippet);
          line.title = "Go to error location";
      }
      
      consoleOutput.appendChild(line);
    });
  } else {
    errorCountBadge.classList.add("hidden");
    consoleOutput.innerHTML = `<div class="text-green-500 flex gap-2 items-center"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> No errors found.</div>`;
  }
}

async function navigateToError(snippet) {
    await Word.run(async (context) => {
        const body = context.document.body;
        // Search for the snippet text
        // We use a specific logic: Find the first occurrence? 
        // Since we can't easily map index to range, we search for the snippet.
        // This might select the *first* error if there are duplicates, but it's a good start.
        const searchResults = body.search(snippet, { matchCase: true });
        context.load(searchResults, 'items');
        await context.sync();
        
        if (searchResults.items.length > 0) {
            // Select the first match found. 
            // Ideally we'd find the exact one based on context, but that's hard without unique IDs.
            searchResults.items[0].select();
            await context.sync();
        }
    });
}

// Helpers for Edit Mode
window.toggleEdit = (id) => {
    const view = document.getElementById(`view-${id}`);
    const edit = document.getElementById(`edit-${id}`);
    if (view && edit) {
        const isEditing = edit.classList.contains('hidden');
        if (isEditing) {
            view.classList.add('hidden');
            edit.classList.remove('hidden');
            document.getElementById(`input-${id}`).focus();
        } else {
            view.classList.remove('hidden');
            edit.classList.add('hidden');
        }
    }
};

window.saveRename = async (id) => {
    const input = document.getElementById(`input-${id}`);
    if (input) {
        const oldName = input.getAttribute("data-original");
        const newName = input.value.trim();
        
        if (!newName.match(/^[a-zA-Z0-9_]+$/)) {
            console.error("Invalid variable name");
            input.classList.add("border-red-500");
            return;
        }
        
        toggleEdit(id);
        await tryCatch(() => renameVariable(oldName, newName));
    }
};


/** Default helper for invoking an action and handling errors. */
async function tryCatch(callback) {
  try {
      await callback();
  } catch (error) {
      console.error(error);
    const consoleOutput = document.getElementById("console-output");
    const line = document.createElement("div");
    line.className = "text-red-400 break-words";
    line.innerText = `System Error: ${error.message}`;
    consoleOutput.appendChild(line);
  }
}

