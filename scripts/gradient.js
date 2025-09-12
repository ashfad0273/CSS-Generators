// Gradient types
        const typeEl = document.getElementById('type');
        const dirEl = document.getElementById('direction');
        const outputBox = document.getElementById('outputBox');
        const preview = document.getElementById('preview');
        const generateBtn = document.getElementById('generateBtn');
        const copyBtn = document.getElementById('copyBtn');
        const status = document.getElementById('status');
        const colorsContainer = document.getElementById('colorsContainer');
        const addColorBtn = document.getElementById('addColorBtn');
        const rotationSlider = document.getElementById('rotationSlider');
        const rotationNum = document.getElementById('rotationNum');
        const rotationSliderBox = document.getElementById('rotationSliderBox');

        // Initial colors data
        let colors = [
            { color: "#ff0000", percent: 0 },
            { color: "#0000ff", percent: 100 }
        ];

        // Show/hide rotation slider based on gradient type
        function updateRotationSliderVisibility() {
            if (typeEl.value === 'linear' || typeEl.value === 'conic') {
                rotationSliderBox.style.display = '';
            } else {
                rotationSliderBox.style.display = 'none';
            }
        }

        // Sync direction input and rotation slider
        function syncDirectionWithSlider() {
            let val = dirEl.value.trim();
            if (/^\d+deg$/.test(val)) {
                let deg = parseInt(val);
                rotationSlider.value = deg;
                rotationNum.value = deg;
            }
        }
        function syncSliderWithDirection() {
            let deg = parseInt(rotationSlider.value);
            dirEl.value = deg + 'deg';
            rotationNum.value = deg;
            updatePreviewAndOutput();
        }
        function syncNumWithDirection() {
            let deg = parseInt(rotationNum.value);
            if (isNaN(deg)) deg = 0;
            deg = Math.max(0, Math.min(360, deg));
            rotationSlider.value = deg;
            dirEl.value = deg + 'deg';
            updatePreviewAndOutput();
        }

        // Render color stops UI
        function renderColors() {
            colorsContainer.innerHTML = "";
            colors.forEach((stop, idx) => {
                const colorId = `color${idx}`;
                const percentId = `percent${idx}`;
                const removeBtn = colors.length > 2
                    ? `<button class="ml-2 px-2 py-1 text-xs bg-red-600 rounded hover:bg-red-500 removeBtn" data-idx="${idx}">✕</button>`
                    : "";

                colorsContainer.innerHTML += `
                    <div class="flex items-center gap-2 bg-gray-700 p-2 rounded">
                        <input type="color" id="${colorId}" value="${stop.color}" class="w-10 h-10 p-0 border-0 bg-transparent" />
                        <input type="range" min="0" max="100" value="${stop.percent}" id="${percentId}" class="slider w-24" />
                        <input type="number" min="0" max="100" value="${stop.percent}" class="w-16 p-1 rounded bg-gray-800 text-white border border-gray-600 text-xs percentNum" id="num${idx}" />
                        <span class="text-xs ml-1">%</span>
                        ${removeBtn}
                    </div>
                `;
            });

            // Wire color inputs
            colors.forEach((_, idx) => {
                document.getElementById(`color${idx}`).addEventListener('input', (e) => {
                    colors[idx].color = e.target.value;
                    updatePreviewAndOutput();
                });
                document.getElementById(`percent${idx}`).addEventListener('input', (e) => {
                    handleSliderChange(idx, parseInt(e.target.value));
                });
                document.getElementById(`num${idx}`).addEventListener('input', (e) => {
                    handleSliderChange(idx, parseInt(e.target.value));
                });
            });

            // Wire remove buttons
            document.querySelectorAll('.removeBtn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = parseInt(e.target.dataset.idx);
                    colors.splice(idx, 1);
                    normalizePercents();
                    renderColors();
                    updatePreviewAndOutput();
                });
            });
        }

        // Add new color
        addColorBtn.addEventListener('click', () => {
            colors.push({ color: "#ffffff", percent: 100 });
            normalizePercents();
            renderColors();
            updatePreviewAndOutput();
        });

        // Normalize percentages so all sliders sum to 100
        function normalizePercents() {
            if (colors.length === 1) {
                colors[0].percent = 100;
                return;
            }
            colors.sort((a, b) => a.percent - b.percent);
            colors[0].percent = 0;
            colors[colors.length - 1].percent = 100;
            if (colors.length > 2) {
                const step = 100 / (colors.length - 1);
                for (let i = 1; i < colors.length - 1; i++) {
                    colors[i].percent = Math.round(i * step);
                }
            }
        }

        // Handle slider change and adjust others so sum = 100
        function handleSliderChange(idx, newPercent) {
            newPercent = Math.max(0, Math.min(100, newPercent));
            colors[idx].percent = newPercent;
            colors.sort((a, b) => a.percent - b.percent);
            colors[0].percent = 0;
            colors[colors.length - 1].percent = 100;
            for (let i = 1; i < colors.length - 1; i++) {
                const prev = colors[i - 1].percent;
                const next = colors[i + 1].percent;
                colors[i].percent = Math.max(prev + 1, Math.min(colors[i].percent, next - 1));
            }
            renderColors();
            updatePreviewAndOutput();
        }

        // Build gradient string
        function buildGradientString() {
            const type = typeEl.value;
            let direction = dirEl.value.trim() || '90deg';
            const stops = colors.map(stop => `${stop.color} ${stop.percent}%`);
            if (stops.length < 2) return '';
            if (type === 'radial') {
                return `radial-gradient(${stops.join(', ')})`;
            } else if (type === 'conic') {
                return `conic-gradient(from ${direction}, ${stops.join(', ')})`;
            } else {
                return `linear-gradient(${direction}, ${stops.join(', ')})`;
            }
        }

        function updatePreviewAndOutput() {
            const cssGradient = buildGradientString();
            if (!cssGradient) {
                outputBox.textContent = 'Please provide at least two color stops.';
                preview.style.backgroundImage = '';
                return;
            }
            const fullCss = `background-image: ${cssGradient};`;
            outputBox.textContent = fullCss;
            preview.style.backgroundImage = cssGradient;
        }

        // Wire inputs for live preview
        [typeEl, dirEl].forEach(el => {
            el.addEventListener('input', () => {
                updatePreviewAndOutput();
                status.textContent = '';
            });
        });

        // Rotation slider events
        rotationSlider.addEventListener('input', syncSliderWithDirection);
        rotationNum.addEventListener('input', syncNumWithDirection);
        dirEl.addEventListener('input', () => {
            syncDirectionWithSlider();
            updatePreviewAndOutput();
        });

        typeEl.addEventListener('input', () => {
            updateRotationSliderVisibility();
            updatePreviewAndOutput();
        });

        generateBtn.addEventListener('click', () => {
            updatePreviewAndOutput();
            status.textContent = 'Generated';
            setTimeout(()=> status.textContent = '', 1000);
        });

        copyBtn.addEventListener('click', () => {
            const txt = outputBox.textContent;
            if (!txt) return;
            navigator.clipboard.writeText(txt).then(() => {
                status.textContent = 'Copied';
                setTimeout(()=> status.textContent = '', 1200);
            });
        });

        // Initialize
        normalizePercents();
        renderColors();
        updateRotationSliderVisibility();
        syncDirectionWithSlider();
        updatePreviewAndOutput();