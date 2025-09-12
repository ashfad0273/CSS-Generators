/* Minimal keyframe-only generator (property picker + smart inputs)
   Now supports dynamic number of steps (evenly distributed percentages)
   and ensures default values for newly added custom properties.
*/

/* Property list (trimmed, expand as needed) */
const CSS_PROPERTIES = [
    "transform", "opacity", "background-color", "color", "filter:blur", "filter:invert",
    "filter:grayscale", "filter:brightness", "filter:contrast", "left", "right", "top", "bottom",
    "translate", "scale", "rotate", "border-color", "box-shadow", "width", "height"
];

const PROPERTY_INPUT_TYPES = {
    "opacity": "range01",
    "filter:invert": "range01",
    "filter:grayscale": "range01",
    "filter:sepia": "range01",
    "filter:brightness": "range01",
    "filter:contrast": "range01",
    "filter:blur": "range100",
    "filter:hue-rotate": "range100",
    "color": "color",
    "background-color": "color",
    "border-color": "color"
};

function getPropertyInputType(prop) {
    const p = (prop || "").toLowerCase();
    if (PROPERTY_INPUT_TYPES[p]) return PROPERTY_INPUT_TYPES[p];
    if (p.startsWith("filter:")) {
        if (p.includes("blur") || p.includes("hue-rotate")) return "range100";
        return "range01";
    }
    if (p.includes("color")) return "color";
    return "text";
}

function defaultValueForProperty(prop) {
    const type = getPropertyInputType(prop);
    if (type === "range01") return "1";
    if (type === "range100") return "100";
    if (type === "color") return "#ffffff";
    // special-case some well-known props
    const p = (prop || "").toLowerCase();
    if (p === "transform") return "translateX(0px)";
    if (p === "opacity") return "1";
    return "0";
}

function formatPercentNumber(n) {
    // if integer -> no decimals, else two decimals trimmed
    if (Math.abs(Math.round(n) - n) < 1e-8) return String(Math.round(n));
    return String(Number(n.toFixed(2)));
}

/* Keyframes module */
const keyframesModule = {
    calcOutput: (values) => {
        if (!values.animName || !values.duration) return "";
        const safeName = values.animName.replace(/[^\w-]/g, "_");
        const count = Number(values.stepsCount) || 3;
        const steps = Array.from({length: count}, (_,i) => i);
        let css = `@keyframes ${safeName} {\n`;
        steps.forEach(i => {
            const percent = formatPercentNumber((i * 100) / (count - 1));
            css += `  ${percent}% {\n`;
            if (values[`transform${i}`]) css += `    transform: ${values[`transform${i}`]};\n`;
            if (values[`opacity${i}`]) css += `    opacity: ${values[`opacity${i}`]};\n`;
            if (Array.isArray(values[`customProps${i}`])) {
                values[`customProps${i}`].forEach(({prop,val}) => {
                    if (prop && val !== undefined && val !== "") css += `    ${prop}: ${val};\n`;
                });
            }
            css += `  }\n`;
        });
        css += `}\n\n.${safeName}-animation {\n  animation: ${safeName} ${values.duration}s ease-in-out infinite;\n}`;
        return css;
    },

    renderPreview: (values) => {
        if (!values.animName || !values.duration) return "";
        const safeName = values.animName.replace(/[^\w-]/g, "_");
        const count = Number(values.stepsCount) || 3;
        let css = `@keyframes ${safeName} {\n`;
        for (let i=0;i<count;i++) {
            const percent = formatPercentNumber((i * 100) / (count - 1));
            css += `  ${percent}% {\n`;
            if (values[`transform${i}`]) css += `    transform: ${values[`transform${i}`]};\n`;
            if (values[`opacity${i}`]) css += `    opacity: ${values[`opacity${i}`]};\n`;
            if (Array.isArray(values[`customProps${i}`])) {
                values[`customProps${i}`].forEach(({prop,val}) => {
                    if (prop && val !== undefined && val !== "") css += `    ${prop}: ${val};\n`;
                });
            }
            css += `  }\n`;
        }
        css += `}\n.${safeName}-animation { animation: ${safeName} ${values.duration}s ease-in-out infinite; }`;
        // inject style
        let st = document.getElementById("keyframes-style");
        if (!st) { st = document.createElement("style"); st.id = "keyframes-style"; document.head.appendChild(st); }
        st.textContent = css;
        return `
            <div class="flex flex-col items-center mt-6">
                <div class="mb-2 text-xs text-gray-400">Live Preview</div>
                <div class="w-36 h-16 bg-blue-500 rounded shadow-lg border border-gray-600 flex items-center justify-center ${safeName}-animation" id="keyframesPreviewBox">
                    <span class="font-bold text-white">Animate</span>
                </div>
            </div>
        `;
    },

    renderForm: (formArea, values, updateOutput, openPropertyModal) => {
        function renderSmartInput(prop, val, stepIndex, idx) {
            const inputType = getPropertyInputType(prop);
            if (inputType === "range01") {
                const v = val !== undefined && val !== "" ? val : "1";
                return `
                    <div class="flex items-center gap-2 w-full">
                        <input type="range" min="0" max="1" step="0.01" value="${v}" class="smart-range01 w-24" data-step="${stepIndex}" data-idx="${idx}" data-prop="${prop}" />
                        <input type="number" min="0" max="1" step="0.01" value="${v}" class="smart-range01-num w-16 p-1 rounded bg-gray-700 text-white border border-gray-600" data-step="${stepIndex}" data-idx="${idx}" data-prop="${prop}" />
                    </div>
                `;
            } else if (inputType === "range100") {
                const v = val !== undefined && val !== "" ? val : "100";
                return `
                    <div class="flex items-center gap-2 w-full">
                        <input type="range" min="0" max="100" step="1" value="${v}" class="smart-range100 w-24" data-step="${stepIndex}" data-idx="${idx}" data-prop="${prop}" />
                        <input type="number" min="0" max="100" step="1" value="${v}" class="smart-range100-num w-16 p-1 rounded bg-gray-700 text-white border border-gray-600" data-step="${stepIndex}" data-idx="${idx}" data-prop="${prop}" />
                    </div>
                `;
            } else if (inputType === "color") {
                const v = val !== undefined && val !== "" ? val : "#ffffff";
                let colorVal = "#ffffff";
                if (/^#([0-9a-f]{3,8})$/i.test(v)) colorVal = v;
                return `
                    <div class="flex items-center gap-2 w-full">
                        <input type="color" value="${colorVal}" class="smart-color w-8 h-8 p-0 border-0 bg-transparent" data-step="${stepIndex}" data-idx="${idx}" data-prop="${prop}" />
                        <input type="text" value="${v}" class="smart-color-text flex-1 p-2 rounded bg-gray-700 text-white border border-gray-600" data-step="${stepIndex}" data-idx="${idx}" data-prop="${prop}" placeholder="#fff or rgb(...)" />
                    </div>
                `;
            } else {
                return `
                    <input type="text" value="${val !== undefined ? val : ""}" class="smart-text w-full p-2 rounded bg-gray-700 text-white border border-gray-600" data-step="${stepIndex}" data-idx="${idx}" data-prop="${prop}" placeholder="Value" />
                `;
            }
        }

        function renderCustomProps(stepIndex) {
            const props = values[`customProps${stepIndex}`] || [];
            return `
                <div class="space-y-2" id="customPropsFields${stepIndex}">
                    ${props.map((item, idx) => `
                        <div class="flex flex-col md:flex-row md:items-center gap-2 bg-gray-800 rounded p-2">
                            <div class="flex items-center gap-2 w-full md:w-1/3">
                                <span class="text-xs text-gray-400 truncate">${item.prop}</span>
                                <button type="button" class="remove-prop-btn text-red-400 hover:text-red-600" title="Remove" data-step="${stepIndex}" data-idx="${idx}">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                    </svg>
                                </button>
                            </div>
                            <div class="flex-1">${renderSmartInput(item.prop, item.val, stepIndex, idx)}</div>
                        </div>
                    `).join("")}
                </div>
            `;
        }

        const count = Number(values.stepsCount) || 3;
        const stepIndices = Array.from({length: count}, (_,i) => i);
        let stepsHTML = stepIndices.map(i => {
            const percentLabel = formatPercentNumber((i * 100) / (count - 1)) + "%";
            return `
            <div class="mb-6 p-4 rounded-lg bg-gray-700">
                <div class="flex items-center justify-between mb-2">
                    <span class="font-semibold text-base">${percentLabel} Keyframe</span>
                    <button type="button" class="add-prop-btn flex items-center gap-1 px-2 py-1 bg-gray-800 rounded text-xs text-green-400 hover:bg-gray-600 transition" data-step="${i}">
                        <span class="text-lg leading-none">➕</span> Add Property
                    </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm mb-1">Transform</label>
                        <input type="text" name="transform${i}" class="live-input w-full p-2 rounded bg-gray-800 text-white border border-gray-600" placeholder="e.g. translateX(0px)" value="${values[`transform${i}`] ?? (i === 0 || i === count-1 ? "translateX(0px)" : "translateX(100px)")}" />
                    </div>
                    <div>
                        <label class="block text-sm mb-1">Opacity</label>
                        <input type="number" name="opacity${i}" class="live-input w-full p-2 rounded bg-gray-800 text-white border border-gray-600" placeholder="e.g. 1" step="any" value="${values[`opacity${i}`] ?? (i === Math.floor(count/2) ? "0.5" : "1")}" />
                    </div>
                </div>
                <div class="mt-4">
                    <div class="text-xs text-gray-400 mb-1">Custom Properties</div>
                    ${renderCustomProps(i)}
                </div>
            </div>
        `;
        }).join("");

        const mainFieldsHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label class="block text-sm mb-1">Animation Duration (seconds)</label>
                    <input type="number" name="duration" class="live-input w-full p-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="e.g. 2" step="any" value="${values.duration ?? "2"}" />
                </div>
                <div>
                    <label class="block text-sm mb-1">Animation Name</label>
                    <input type="text" name="animName" class="live-input w-full p-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="e.g. myAnim" value="${values.animName ?? "myAnim"}" />
                </div>
                <div>
                    <label class="block text-sm mb-1">Number of Steps</label>
                    <input type="number" name="stepsCount" min="2" max="12" class="w-full p-2 rounded bg-gray-700 text-white border border-gray-600" value="${values.stepsCount ?? "3"}" />
                </div>
            </div>
        `;

        formArea.innerHTML = `
            ${mainFieldsHTML}
            ${stepsHTML}
            <div id="outputBox" class="mt-4 p-4 bg-gray-700 text-sm rounded text-green-400 font-mono cursor-pointer" title="Click to copy"></div>
            <div id="previewArea"></div>
        `;

        // listeners
        formArea.querySelectorAll(".live-input").forEach(input => input.addEventListener("input", () => updateOutput()));
        formArea.querySelectorAll("[name='stepsCount']").forEach(input => {
            input.addEventListener("input", () => {
                let v = Number(input.value) || 3;
                if (v < 2) v = 2;
                if (v > 12) v = 12;
                // preserve existing values as much as possible
                const oldCount = Number(values.stepsCount) || 3;
                const newCount = Math.floor(v);
                if (newCount !== oldCount) {
                    // if newCount > oldCount, create new keys with defaults
                    for (let i=0;i<newCount;i++) {
                        if (values[`transform${i}`] === undefined) {
                            values[`transform${i}`] = (i === 0 || i === newCount-1) ? "translateX(0px)" : "translateX(100px)";
                        }
                        if (values[`opacity${i}`] === undefined) {
                            values[`opacity${i}`] = (i === Math.floor(newCount/2)) ? "0.5" : "1";
                        }
                        if (!Array.isArray(values[`customProps${i}`])) values[`customProps${i}`] = [];
                    }
                    // if newCount < oldCount, remove extras
                    if (newCount < oldCount) {
                        for (let i=newCount;i<oldCount;i++) {
                            delete values[`transform${i}`];
                            delete values[`opacity${i}`];
                            delete values[`customProps${i}`];
                        }
                    }
                    values.stepsCount = String(newCount);
                    // rerender to reflect new step count
                    updateOutput(true);
                } else {
                    values.stepsCount = String(newCount);
                    updateOutput();
                }
            });
        });
        formArea.querySelectorAll(".add-prop-btn").forEach(btn => {
            btn.addEventListener("click", () => openPropertyModal(Number(btn.getAttribute("data-step"))));
        });
        formArea.querySelectorAll(".remove-prop-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const step = Number(btn.getAttribute("data-step"));
                const idx = Number(btn.getAttribute("data-idx"));
                if (values[`customProps${step}`]) {
                    values[`customProps${step}`].splice(idx,1);
                    updateOutput(true);
                }
            });
        });

        // smart inputs: attach after DOM created
        // range01
        formArea.querySelectorAll(".smart-range01").forEach(input => {
            input.addEventListener("input", (e) => {
                const step = Number(input.getAttribute("data-step"));
                const idx = Number(input.getAttribute("data-idx"));
                const v = input.value;
                if (values[`customProps${step}`] && values[`customProps${step}`][idx]) {
                    values[`customProps${step}`][idx].val = v;
                    const num = formArea.querySelector(`.smart-range01-num[data-step="${step}"][data-idx="${idx}"]`);
                    if (num) num.value = v;
                    updateOutput();
                }
            });
        });
        formArea.querySelectorAll(".smart-range01-num").forEach(input => {
            input.addEventListener("input", (e) => {
                const step = Number(input.getAttribute("data-step"));
                const idx = Number(input.getAttribute("data-idx"));
                let v = input.value;
                if (v < 0) v = 0;
                if (v > 1) v = 1;
                if (values[`customProps${step}`] && values[`customProps${step}`][idx]) {
                    values[`customProps${step}`][idx].val = v;
                    const slider = formArea.querySelector(`.smart-range01[data-step="${step}"][data-idx="${idx}"]`);
                    if (slider) slider.value = v;
                    updateOutput();
                }
            });
        });
        // range100
        formArea.querySelectorAll(".smart-range100").forEach(input => {
            input.addEventListener("input", (e) => {
                const step = Number(input.getAttribute("data-step"));
                const idx = Number(input.getAttribute("data-idx"));
                const v = input.value;
                if (values[`customProps${step}`] && values[`customProps${step}`][idx]) {
                    values[`customProps${step}`][idx].val = v;
                    const num = formArea.querySelector(`.smart-range100-num[data-step="${step}"][data-idx="${idx}"]`);
                    if (num) num.value = v;
                    updateOutput();
                }
            });
        });
        formArea.querySelectorAll(".smart-range100-num").forEach(input => {
            input.addEventListener("input", (e) => {
                const step = Number(input.getAttribute("data-step"));
                const idx = Number(input.getAttribute("data-idx"));
                let v = input.value;
                if (v < 0) v = 0;
                if (v > 100) v = 100;
                if (values[`customProps${step}`] && values[`customProps${step}`][idx]) {
                    values[`customProps${step}`][idx].val = v;
                    const slider = formArea.querySelector(`.smart-range100[data-step="${step}"][data-idx="${idx}"]`);
                    if (slider) slider.value = v;
                    updateOutput();
                }
            });
        });
        // color
        formArea.querySelectorAll(".smart-color").forEach(input => {
            input.addEventListener("input", (e) => {
                const step = Number(input.getAttribute("data-step"));
                const idx = Number(input.getAttribute("data-idx"));
                const v = input.value;
                if (values[`customProps${step}`] && values[`customProps${step}`][idx]) {
                    values[`customProps${step}`][idx].val = v;
                    const txt = formArea.querySelector(`.smart-color-text[data-step="${step}"][data-idx="${idx}"]`);
                    if (txt) txt.value = v;
                    updateOutput();
                }
            });
        });
        formArea.querySelectorAll(".smart-color-text").forEach(input => {
            input.addEventListener("input", (e) => {
                const step = Number(input.getAttribute("data-step"));
                const idx = Number(input.getAttribute("data-idx"));
                const v = input.value;
                if (values[`customProps${step}`] && values[`customProps${step}`][idx]) {
                    values[`customProps${step}`][idx].val = v;
                    const color = formArea.querySelector(`.smart-color[data-step="${step}"][data-idx="${idx}"]`);
                    if (color && /^#([0-9a-f]{3,8})$/i.test(v)) color.value = v;
                    updateOutput();
                }
            });
        });
        // text
        formArea.querySelectorAll(".smart-text").forEach(input => {
            input.addEventListener("input", (e) => {
                const step = Number(input.getAttribute("data-step"));
                const idx = Number(input.getAttribute("data-idx"));
                const v = input.value;
                if (values[`customProps${step}`] && values[`customProps${step}`][idx]) {
                    values[`customProps${step}`][idx].val = v;
                    updateOutput();
                }
            });
        });

        // click-to-copy
        const outputDiv = formArea.querySelector("#outputBox");
        outputDiv.addEventListener("click", () => {
            const text = outputDiv.textContent;
            if (text) {
                navigator.clipboard.writeText(text);
                outputDiv.classList.add("bg-green-800");
                setTimeout(() => outputDiv.classList.remove("bg-green-800"), 400);
            }
        });
    }
};

/* Property modal logic */
const propertyModal = document.getElementById("propertyModal");
const closePropertyModalBtn = document.getElementById("closePropertyModal");
const propertySearch = document.getElementById("propertySearch");
const propertyList = document.getElementById("propertyList");
let propertyModalStep = null;
let propertyModalCallback = null;

function showPropertyModal(step, onSelect) {
    propertyModalStep = step;
    propertyModalCallback = onSelect;
    propertyModal.classList.remove("hidden");
    propertySearch.value = "";
    renderPropertyList("");
    setTimeout(() => propertySearch.focus(), 50);
}
function hidePropertyModal() {
    propertyModal.classList.add("hidden");
    propertyModalStep = null;
    propertyModalCallback = null;
}
function renderPropertyList(filter) {
    const filtered = CSS_PROPERTIES.filter(p => p.toLowerCase().includes(filter.toLowerCase()));
    propertyList.innerHTML = filtered.length
        ? filtered.map(prop => `<button type="button" class="property-item w-full text-left px-2 py-1 rounded hover:bg-gray-700 transition" data-prop="${prop}">${prop}</button>`).join("")
        : `<div class="text-gray-400 text-sm px-2 py-2">No properties found.</div>`;
    propertyList.querySelectorAll(".property-item").forEach(btn => {
        btn.addEventListener("click", () => {
            if (propertyModalCallback) propertyModalCallback(btn.getAttribute("data-prop"), propertyModalStep);
            hidePropertyModal();
        });
    });
}
closePropertyModalBtn.addEventListener("click", hidePropertyModal);
propertyModal.addEventListener("click", (e) => { if (e.target === propertyModal) hidePropertyModal(); });
propertySearch.addEventListener("input", (e) => renderPropertyList(propertySearch.value));

/* Form state */
let keyframesFormState = {
    stepsCount: "3",
    duration: "2",
    animName: "myAnim",
    transform0: "translateX(0px)",
    opacity0: "1",
    customProps0: [],
    transform1: "translateX(100px)",
    opacity1: "0.5",
    customProps1: [],
    transform2: "translateX(0px)",
    opacity2: "1",
    customProps2: []
};

/* render / update */
const formArea = document.getElementById("formArea");

function renderForm() {
    keyframesModule.renderForm(formArea, keyframesFormState, updateKeyframesOutput, (stepIndex) => {
        showPropertyModal(stepIndex, (prop, stepNum) => {
            let arr = keyframesFormState[`customProps${stepNum}`] || [];
            if (!arr.some(i => i.prop === prop)) {
                arr.push({prop, val: defaultValueForProperty(prop)});
                keyframesFormState[`customProps${stepNum}`] = arr;
                updateKeyframesOutput(true);
            }
        });
    });
    updateKeyframesOutput();
}

function updateKeyframesOutput(rerenderForm = false) {
    const form = formArea;
    if (!rerenderForm) {
        ["duration","animName"].forEach(name => {
            const el = form.querySelector(`[name="${name}"]`);
            if (el) keyframesFormState[name] = el.value;
        });
        const scEl = form.querySelector(`[name="stepsCount"]`);
        if (scEl) {
            const newCount = Math.max(2, Math.min(12, Math.floor(Number(scEl.value) || 3)));
            // synchronize state if changed without full rerender path
            if (String(newCount) !== keyframesFormState.stepsCount) {
                const oldCount = Number(keyframesFormState.stepsCount) || 3;
                // add missing
                for (let i=0;i<newCount;i++) {
                    if (keyframesFormState[`transform${i}`] === undefined) keyframesFormState[`transform${i}`] = (i === 0 || i === newCount-1) ? "translateX(0px)" : "translateX(100px)";
                    if (keyframesFormState[`opacity${i}`] === undefined) keyframesFormState[`opacity${i}`] = (i === Math.floor(newCount/2)) ? "0.5" : "1";
                    if (!Array.isArray(keyframesFormState[`customProps${i}`])) keyframesFormState[`customProps${i}`] = [];
                }
                // remove extras
                if (newCount < oldCount) {
                    for (let i=newCount;i<oldCount;i++) {
                        delete keyframesFormState[`transform${i}`];
                        delete keyframesFormState[`opacity${i}`];
                        delete keyframesFormState[`customProps${i}`];
                    }
                }
                keyframesFormState.stepsCount = String(newCount);
            } else {
                keyframesFormState.stepsCount = String(newCount);
            }
        }
        const count = Number(keyframesFormState.stepsCount) || 3;
        for (let i=0;i<count;i++) {
            const tEl = form.querySelector(`[name="transform${i}"]`);
            if (tEl) keyframesFormState[`transform${i}`] = tEl.value;
            const oEl = form.querySelector(`[name="opacity${i}"]`);
            if (oEl) keyframesFormState[`opacity${i}`] = oEl.value;
            // custom prop values are managed by smart inputs
        }
    }

    const output = keyframesModule.calcOutput(keyframesFormState);
    const outputDiv = document.getElementById("outputBox");
    if (outputDiv) outputDiv.textContent = output || "";

    const previewArea = document.getElementById("previewArea");
    if (previewArea) previewArea.innerHTML = keyframesModule.renderPreview(keyframesFormState) || "";

    // rerender the form when requested (to refresh custom fields)
    if (rerenderForm) {
        keyframesModule.renderForm(formArea, keyframesFormState, updateKeyframesOutput, (stepIndex) => {
            showPropertyModal(stepIndex, (prop, stepNum) => {
                let arr = keyframesFormState[`customProps${stepNum}`] || [];
                if (!arr.some(i => i.prop === prop)) {
                    arr.push({prop, val: defaultValueForProperty(prop)});
                    keyframesFormState[`customProps${stepNum}`] = arr;
                    updateKeyframesOutput(true);
                }
            });
        });
    }
}

/* init */
renderForm();