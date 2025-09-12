// Defaults
        const defaults = { x: 4, y: 4, blur: 8, color: "#000000" };

        // Elements
        const xRange = document.getElementById('xRange');
        const yRange = document.getElementById('yRange');
        const blurRange = document.getElementById('blurRange');
        const xNumber = document.getElementById('xNumber');
        const yNumber = document.getElementById('yNumber');
        const blurNumber = document.getElementById('blurNumber');
        const colorInput = document.getElementById('colorInput');
        const colorText = document.getElementById('colorText');
        const colorSwatch = document.getElementById('colorSwatch');
        const outputBox = document.getElementById('outputBox');
        const preview = document.getElementById('preview');
        const copyBtn = document.getElementById('copyBtn');

        // Set ranges and initial values
        xRange.min = -100; xRange.max = 100; xRange.value = defaults.x;
        yRange.min = -100; yRange.max = 100; yRange.value = defaults.y;
        blurRange.min = 0; blurRange.max = 200; blurRange.value = defaults.blur;

        xNumber.value = defaults.x;
        yNumber.value = defaults.y;
        blurNumber.value = defaults.blur;

        colorInput.value = defaults.color;
        colorText.value = defaults.color;
        colorSwatch.style.background = defaults.color;

        // Utility: normalize hex (ensure starts with # and 6-digit)
        function normalizeHex(v) {
            if (!v) return '';
            v = v.trim();
            if (!v.startsWith('#')) v = '#' + v;
            if (/^#[0-9a-fA-F]{3}$/.test(v)) {
                v = v.replace(/^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/, '#$1$1$2$2$3$3');
            }
            if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase();
            return ''; // invalid
        }

        // Sync helpers
        function updateFromRange(range, number) { number.value = range.value; updateAll(); }
        function updateFromNumber(number, range) {
            let v = Number(number.value);
            if (isNaN(v)) v = 0;
            if (range.min !== undefined && v < Number(range.min)) v = Number(range.min);
            if (range.max !== undefined && v > Number(range.max)) v = Number(range.max);
            number.value = v;
            range.value = v;
            updateAll();
        }

        // Color sync
        function updateColorFromPicker() {
            const val = normalizeHex(colorInput.value) || colorInput.value;
            colorText.value = val;
            colorSwatch.style.background = val;
            updateAll();
        }
        function updateColorFromText() {
            const val = normalizeHex(colorText.value);
            if (val) {
                colorInput.value = val;
                colorSwatch.style.background = val;
                colorText.value = val;
                updateAll();
            } else {
                colorSwatch.style.background = 'transparent';
            }
        }

        // Reset buttons
        document.getElementById('xReset').addEventListener('click', () => { xRange.value = defaults.x; updateFromRange(xRange, xNumber); });
        document.getElementById('yReset').addEventListener('click', () => { yRange.value = defaults.y; updateFromRange(yRange, yNumber); });
        document.getElementById('blurReset').addEventListener('click', () => { blurRange.value = defaults.blur; updateFromRange(blurRange, blurNumber); });
        document.getElementById('colorReset').addEventListener('click', () => {
            colorInput.value = defaults.color; colorText.value = defaults.color; colorSwatch.style.background = defaults.color; updateAll();
        });

        // Event wiring
        xRange.addEventListener('input', () => updateFromRange(xRange, xNumber));
        yRange.addEventListener('input', () => updateFromRange(yRange, yNumber));
        blurRange.addEventListener('input', () => updateFromRange(blurRange, blurNumber));

        xNumber.addEventListener('change', () => updateFromNumber(xNumber, xRange));
        yNumber.addEventListener('change', () => updateFromNumber(yNumber, yRange));
        blurNumber.addEventListener('change', () => updateFromNumber(blurNumber, blurRange));

        colorInput.addEventListener('input', updateColorFromPicker);
        colorText.addEventListener('change', updateColorFromText);
        colorText.addEventListener('keyup', (e) => { if (e.key === 'Enter') updateColorFromText(); });

        // Update output & preview
        function updateAll() {
            const x = Number(xRange.value) || 0;
            const y = Number(yRange.value) || 0;
            const blur = Number(blurRange.value) || 0;
            const color = normalizeHex(colorText.value) || colorInput.value || '#000000';

            const css = `box-shadow: ${x}px ${y}px ${blur}px ${color};`;
            outputBox.textContent = css;

            preview.style.boxShadow = `${x}px ${y}px ${blur}px ${color}`;
            colorSwatch.style.background = color;
        }

        // Click/copy handlers
        async function copyText(t) {
            try {
                await navigator.clipboard.writeText(t);
                copyBtn.textContent = 'Copied';
                copyBtn.classList.add('bg-green-700');
                setTimeout(() => { copyBtn.textContent = 'Copy'; copyBtn.classList.remove('bg-green-700'); }, 900);
            } catch (err) {
                // fallback: select and execCommand
                try {
                    const selection = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(outputBox);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    document.execCommand('copy');
                    selection.removeAllRanges();
                    copyBtn.textContent = 'Copied';
                    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 900);
                } catch (e) {
                    // ignore
                }
            }
        }

        outputBox.addEventListener('click', () => {
            const t = outputBox.textContent;
            if (t) copyText(t);
        });
        copyBtn.addEventListener('click', () => {
            const t = outputBox.textContent;
            if (t) copyText(t);
        });

        // Initialize
        updateAll();