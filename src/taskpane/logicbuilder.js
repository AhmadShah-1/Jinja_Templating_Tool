/*
 * Logic Builder Module
 * Handles the UI and Logic generation for the Stanza Logic Builder tab.
 */

export class LogicBuilder {
    constructor() {
        this.variables = [];
        this.currentBlock = { type: null }; // { type: 'if', conditions: [], else: false }
        this.container = null;
        this.variableContainer = null;
    }

    init(containerId, variableContainerId) {
        this.container = document.getElementById(containerId);
        this.variableContainer = document.getElementById(variableContainerId);
        this.renderEmptyState();
    }

    updateVariables(vars) {
        this.variables = vars;
        this.renderVariableList();
    }

    renderVariableList() {
        if (!this.variableContainer) return;
        
        this.variableContainer.innerHTML = "";
        if (this.variables.length === 0) {
            this.variableContainer.innerHTML = `<div class="text-gray-400 italic text-xs p-2">No variables found</div>`;
            return;
        }

        this.variables.forEach(v => {
            const el = document.createElement("div");
            el.className = "bg-white border border-gray-200 rounded px-2 py-1 text-xs cursor-grab hover:border-blue-400 mb-1 shadow-sm select-none";
            el.innerText = v;
            el.draggable = true;
            el.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("text/plain", v);
                e.dataTransfer.effectAllowed = "copy";
            });
            this.variableContainer.appendChild(el);
        });
    }

    renderEmptyState() {
        this.container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-gray-500 space-y-4 mt-8">
                <p class="text-xs italic">Select a block type to start</p>
                <div class="flex flex-wrap gap-2 justify-center">
                    <button id="btn-start-if" class="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded text-xs hover:bg-blue-100 font-medium">If Statement</button>
                    <button id="btn-start-for" class="bg-green-50 text-green-600 border border-green-200 px-3 py-1.5 rounded text-xs hover:bg-green-100 font-medium">For Loop</button>
                    <button id="btn-start-filter" class="bg-purple-50 text-purple-600 border border-purple-200 px-3 py-1.5 rounded text-xs hover:bg-purple-100 font-medium">Filter</button>
                </div>
            </div>
        `;

        document.getElementById("btn-start-if").onclick = () => this.startIf();
        document.getElementById("btn-start-for").onclick = () => this.startFor();
        document.getElementById("btn-start-filter").onclick = () => this.startFilter();
    }

    startIf() {
        this.currentBlock = {
            type: 'if',
            conditions: [{ left: '', op: '==', right: '', content: '' }], // Initial IF
            elseContent: '',
            hasElse: false
        };
        this.renderIfBuilder();
    }

    startFor() {
        this.currentBlock = {
            type: 'for',
            iterator: 'item',
            iterable: '',
            content: ''
        };
        this.renderForBuilder();
    }

    startFilter() {
        this.currentBlock = {
            type: 'filter',
            variable: '',
            filter: 'upper',
            customFilter: ''
        };
        this.renderFilterBuilder();
    }

    renderIfBuilder() {
        this.container.innerHTML = "";
        const wrapper = document.createElement("div");
        wrapper.className = "space-y-2";

        // Header / Reset
        const header = document.createElement("div");
        header.className = "flex justify-between items-center mb-4";
        header.innerHTML = `<span class="font-bold text-xs text-gray-700">IF Statement</span>`;
        const resetBtn = document.createElement("button");
        resetBtn.innerText = "Reset";
        resetBtn.className = "text-xs text-red-500 hover:underline";
        resetBtn.onclick = () => this.renderEmptyState();
        header.appendChild(resetBtn);
        wrapper.appendChild(header);

        // Conditions (IF + ELIFs)
        this.currentBlock.conditions.forEach((cond, index) => {
            const row = document.createElement("div");
            row.className = "bg-gray-50 p-2 rounded border border-gray-200 space-y-2 relative group";
            
            const label = document.createElement("div");
            label.className = "text-[10px] font-mono font-bold text-blue-600 uppercase";
            label.innerText = index === 0 ? "IF" : "ELIF";
            
            // Remove ELIF button
            if (index > 0) {
                const removeBtn = document.createElement("button");
                removeBtn.innerHTML = "&times;";
                removeBtn.className = "absolute top-1 right-2 text-gray-400 hover:text-red-500 text-lg leading-3";
                removeBtn.onclick = () => {
                    this.currentBlock.conditions.splice(index, 1);
                    this.renderIfBuilder();
                };
                row.appendChild(removeBtn);
            }

            const inputsRow = document.createElement("div");
            inputsRow.className = "flex gap-1 items-center";

            // Left Input
            const leftIn = this.createDroppableInput(cond.left, (val) => cond.left = val);
            // Operator
            const opSelect = document.createElement("select");
            opSelect.className = "border border-gray-300 rounded text-xs py-1 px-0.5 bg-white";
            ["==", "!=", ">", ">=", "<", "<=", "in", "not in"].forEach(op => {
                const opt = document.createElement("option");
                opt.value = op;
                opt.innerText = op;
                if (op === cond.op) opt.selected = true;
                opSelect.appendChild(opt);
            });
            opSelect.onchange = (e) => cond.op = e.target.value;

            // Right Input
            const rightIn = this.createDroppableInput(cond.right, (val) => cond.right = val);

            inputsRow.appendChild(leftIn);
            inputsRow.appendChild(opSelect);
            inputsRow.appendChild(rightIn);

            // Action/Content Input
            const contentRow = document.createElement("div");
            contentRow.className = "mt-1 pt-1 border-t border-gray-200 border-dashed";
            const contentIn = document.createElement("input");
            contentIn.className = "w-full border border-gray-300 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none transition-colors bg-white";
            contentIn.placeholder = "Then output this text...";
            contentIn.value = cond.content || "";
            contentIn.oninput = (e) => cond.content = e.target.value;
            contentRow.appendChild(contentIn);

            row.appendChild(label);
            row.appendChild(inputsRow);
            row.appendChild(contentRow);
            wrapper.appendChild(row);
        });

        // ELSE
        if (this.currentBlock.hasElse) {
            const elseRow = document.createElement("div");
            elseRow.className = "bg-gray-50 p-2 rounded border border-gray-200 relative space-y-2";
            elseRow.innerHTML = `<span class="text-[10px] font-mono font-bold text-blue-600 uppercase">ELSE</span>`;
            
            const removeBtn = document.createElement("button");
            removeBtn.innerHTML = "&times;";
            removeBtn.className = "absolute top-1 right-2 text-gray-400 hover:text-red-500 text-lg leading-3";
            removeBtn.onclick = () => {
                this.currentBlock.hasElse = false;
                this.currentBlock.elseContent = '';
                this.renderIfBuilder();
            };
            
            const contentIn = document.createElement("input");
            contentIn.className = "w-full border border-gray-300 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none transition-colors bg-white";
            contentIn.placeholder = "Otherwise output this text...";
            contentIn.value = this.currentBlock.elseContent || "";
            contentIn.oninput = (e) => this.currentBlock.elseContent = e.target.value;

            elseRow.appendChild(removeBtn);
            elseRow.appendChild(contentIn);
            wrapper.appendChild(elseRow);
        }

        // Controls (+ / -)
        const controls = document.createElement("div");
        controls.className = "flex gap-2 mt-2";

        const addElifBtn = document.createElement("button");
        addElifBtn.className = "flex-1 bg-blue-50 text-blue-600 border border-blue-200 rounded py-1 text-lg font-bold hover:bg-blue-100";
        addElifBtn.innerText = "+";
        addElifBtn.title = "Add ELIF";
        addElifBtn.onclick = () => {
            this.currentBlock.conditions.push({ left: '', op: '==', right: '', content: '' });
            this.renderIfBuilder();
        };

        const addElseBtn = document.createElement("button");
        addElseBtn.className = "flex-1 bg-gray-100 text-gray-600 border border-gray-300 rounded py-1 text-lg font-bold hover:bg-gray-200 disabled:opacity-50";
        addElseBtn.innerText = "-";
        addElseBtn.title = "Add ELSE";
        addElseBtn.disabled = this.currentBlock.hasElse;
        addElseBtn.onclick = () => {
            this.currentBlock.hasElse = true;
            this.renderIfBuilder();
        };

        controls.appendChild(addElifBtn);
        controls.appendChild(addElseBtn);
        wrapper.appendChild(controls);

        this.container.appendChild(wrapper);
    }

    renderForBuilder() {
        this.container.innerHTML = "";
        const wrapper = document.createElement("div");
        wrapper.className = "space-y-2";

        // Header / Reset
        const header = document.createElement("div");
        header.className = "flex justify-between items-center mb-4";
        header.innerHTML = `<span class="font-bold text-xs text-gray-700">FOR Loop</span>`;
        const resetBtn = document.createElement("button");
        resetBtn.innerText = "Reset";
        resetBtn.className = "text-xs text-red-500 hover:underline";
        resetBtn.onclick = () => this.renderEmptyState();
        header.appendChild(resetBtn);
        wrapper.appendChild(header);

        const row = document.createElement("div");
        row.className = "bg-gray-50 p-2 rounded border border-gray-200 space-y-2";
        
        const label = document.createElement("div");
        label.className = "text-[10px] font-mono font-bold text-green-600 uppercase";
        label.innerText = "FOR";
        
        const inputsRow = document.createElement("div");
        inputsRow.className = "flex gap-1 items-center text-xs";

        // Iterator (e.g. 'item')
        const iterInput = document.createElement("input");
        iterInput.className = "w-1/3 border border-gray-300 rounded px-1 py-1";
        iterInput.placeholder = "item";
        iterInput.value = this.currentBlock.iterator;
        iterInput.oninput = (e) => this.currentBlock.iterator = e.target.value;

        const inLabel = document.createElement("span");
        inLabel.innerText = "in";
        inLabel.className = "font-bold text-gray-500";

        // Iterable (e.g. 'items') - Droppable
        const iterableInput = this.createDroppableInput(this.currentBlock.iterable, (val) => this.currentBlock.iterable = val);
        iterableInput.classList.remove("w-full");
        iterableInput.classList.add("flex-1");

        inputsRow.appendChild(iterInput);
        inputsRow.appendChild(inLabel);
        inputsRow.appendChild(iterableInput);

        // Content Input
        const contentRow = document.createElement("div");
        contentRow.className = "mt-1 pt-1 border-t border-gray-200 border-dashed";
        const contentIn = document.createElement("input");
        contentIn.className = "w-full border border-gray-300 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none transition-colors bg-white";
        contentIn.placeholder = "Repeat this text...";
        contentIn.value = this.currentBlock.content || "";
        contentIn.oninput = (e) => this.currentBlock.content = e.target.value;
        contentRow.appendChild(contentIn);

        row.appendChild(label);
        row.appendChild(inputsRow);
        row.appendChild(contentRow);
        wrapper.appendChild(row);
        
        this.container.appendChild(wrapper);
    }

    renderFilterBuilder() {
        this.container.innerHTML = "";
        const wrapper = document.createElement("div");
        wrapper.className = "space-y-2";

        // Header / Reset
        const header = document.createElement("div");
        header.className = "flex justify-between items-center mb-4";
        header.innerHTML = `<span class="font-bold text-xs text-gray-700">Filter Variable</span>`;
        const resetBtn = document.createElement("button");
        resetBtn.innerText = "Reset";
        resetBtn.className = "text-xs text-red-500 hover:underline";
        resetBtn.onclick = () => this.renderEmptyState();
        header.appendChild(resetBtn);
        wrapper.appendChild(header);

        const row = document.createElement("div");
        row.className = "bg-gray-50 p-2 rounded border border-gray-200 space-y-3";
        
        // Variable Input
        const varGroup = document.createElement("div");
        varGroup.className = "space-y-1";
        varGroup.innerHTML = `<label class="text-[10px] font-bold text-gray-500 uppercase block">Variable</label>`;
        const varInput = this.createDroppableInput(this.currentBlock.variable, (val) => this.currentBlock.variable = val);
        varGroup.appendChild(varInput);
        
        // Filter Selector
        const filterGroup = document.createElement("div");
        filterGroup.className = "space-y-1";
        filterGroup.innerHTML = `<label class="text-[10px] font-bold text-gray-500 uppercase block">Filter</label>`;
        
        const filterSelect = document.createElement("select");
        filterSelect.className = "w-full border border-gray-300 rounded px-1.5 py-1 text-xs bg-white focus:ring-1 focus:ring-purple-500 outline-none";
        
        const filters = [
            "upper", "lower", "title", "capitalize", "trim", 
            "length", "round", "abs", "first", "last", "safe", "custom"
        ];
        
        filters.forEach(f => {
            const opt = document.createElement("option");
            opt.value = f;
            opt.innerText = f;
            if (f === this.currentBlock.filter) opt.selected = true;
            filterSelect.appendChild(opt);
        });

        // Custom Filter Input
        const customInput = document.createElement("input");
        customInput.className = "w-full border border-gray-300 rounded px-1.5 py-1 text-xs bg-white focus:ring-1 focus:ring-purple-500 outline-none mt-1 hidden";
        customInput.placeholder = "Enter custom filter name";
        customInput.value = this.currentBlock.customFilter || "";
        if (this.currentBlock.filter === 'custom') customInput.classList.remove('hidden');

        customInput.oninput = (e) => this.currentBlock.customFilter = e.target.value;

        filterSelect.onchange = (e) => {
             this.currentBlock.filter = e.target.value;
             if (e.target.value === 'custom') {
                 customInput.classList.remove('hidden');
                 customInput.focus();
             } else {
                 customInput.classList.add('hidden');
             }
        };
        
        filterGroup.appendChild(filterSelect);
        filterGroup.appendChild(customInput);

        row.appendChild(varGroup);
        row.appendChild(filterGroup);
        wrapper.appendChild(row);
        
        this.container.appendChild(wrapper);
    }

    createDroppableInput(initialValue, onChange) {
        const input = document.createElement("input");
        input.type = "text";
        input.className = "w-full border border-gray-300 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none transition-colors";
        input.value = initialValue || "";
        input.placeholder = "Value / Drag Var";
        
        input.oninput = (e) => onChange(e.target.value);

        // Drag Events
        input.ondragover = (e) => {
            e.preventDefault();
            input.classList.add("border-blue-500", "bg-blue-50");
        };

        input.ondragleave = () => {
            input.classList.remove("border-blue-500", "bg-blue-50");
        };

        input.ondrop = (e) => {
            e.preventDefault();
            input.classList.remove("border-blue-500", "bg-blue-50");
            const varName = e.dataTransfer.getData("text/plain");
            if (varName) {
                // If input is empty, just set it. If has content, append?
                // For logic building, usually replacing or appending to cursor is best.
                // Simple MVP: Append
                const start = input.selectionStart;
                const end = input.selectionEnd;
                const text = input.value;
                const newVal = text.substring(0, start) + varName + text.substring(end);
                input.value = newVal;
                onChange(newVal);
                input.focus();
            }
        };

        return input;
    }

    generateJinja() {
        if (!this.currentBlock.type) return "";

        if (this.currentBlock.type === 'if') {
            let output = "";
            this.currentBlock.conditions.forEach((cond, index) => {
                const tag = index === 0 ? "if" : "elif";
                // Simple validation: if inputs are empty, use placeholders
                const left = cond.left || "var";
                const right = cond.right || "value";
                const content = cond.content ? ` ${cond.content}` : "";
                
                // Construct: {% if left op right %} content
                // No newlines as requested for inline flow
                output += `{% ${tag} ${left} ${cond.op} ${right} %}${content}`;
            });
            
            if (this.currentBlock.hasElse) {
                const elseContent = this.currentBlock.elseContent ? ` ${this.currentBlock.elseContent}` : "";
                output += `{% else %}${elseContent}`;
            }
            
            output += `{% endif %}`;
            return output;
        }

        if (this.currentBlock.type === 'for') {
            const iter = this.currentBlock.iterator || "item";
            const list = this.currentBlock.iterable || "items";
            const content = this.currentBlock.content ? ` ${this.currentBlock.content}` : "";
            // Inline For Loop
            return `{% for ${iter} in ${list} %}${content}{% endfor %}`;
        }

        if (this.currentBlock.type === 'filter') {
            const v = this.currentBlock.variable || "var";
            let f = this.currentBlock.filter || "upper";
            if (f === 'custom') {
                f = this.currentBlock.customFilter || "custom_filter";
            }
            return `{{ ${v} | ${f} }}`;
        }

        return "";
    }
}
