 // Clamp calculation from original file
        function calcClamp({ min, max, minViewport, maxViewport }) {
            const minPx = parseFloat(min);
            const maxPx = parseFloat(max);
            const minVW = parseFloat(minViewport);
            const maxVW = parseFloat(maxViewport);
            if ([minPx, maxPx, minVW, maxVW].some(isNaN)) return "";
            const slope = (maxPx - minPx) / (maxVW - minVW) * 100;
            const base = minPx - (slope * minVW) / 100;
            return `clamp(${minPx}px, ${base.toFixed(2)}px + ${slope.toFixed(2)}vw, ${maxPx}px)`;
        }

        const minVal = document.getElementById('minVal');
        const maxVal = document.getElementById('maxVal');
        const minVw = document.getElementById('minVw');
        const maxVw = document.getElementById('maxVw');
        const outputBox = document.getElementById('outputBox');
        const cssSnippet = document.getElementById('cssSnippet');

        function update() {
            const val = calcClamp({
                min: minVal.value,
                max: maxVal.value,
                minViewport: minVw.value,
                maxViewport: maxVw.value
            });
            outputBox.textContent = val || "Invalid input";
            cssSnippet.textContent = val ? `Use in CSS — .your-class { font-size: ${val}; }` : "";
        }

        [minVal, maxVal, minVw, maxVw].forEach(el => el.addEventListener('input', update));

        outputBox.addEventListener('click', () => {
            const txt = outputBox.textContent;
            if (!txt || txt === "Invalid input") return;
            navigator.clipboard.writeText(txt);
            outputBox.classList.add('bg-green-800');
            setTimeout(() => outputBox.classList.remove('bg-green-800'), 500);
        });

        // Initialize
        update();