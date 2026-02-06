// Free Video Enhancer Online - JavaScript
// Backend API Integration & Premium UI Logic

const GEMINI_API_KEY = 'AIzaSyAzoGzGzUehfykqqQhKNrv_n9ztIGj3SKM';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Gemini AI Service (Frontend Analysis Only - for "Premium Feel")
const GeminiAI = {
    async analyzeMedia(fileName, fileSize, mediaType, toolType) {
        const toolDescriptions = {
            'video-enhancer': 'video enhancement and upscaling',
            'photo-enhancer': 'photo enhancement and quality improvement',
            'face-retouch': 'face retouching and skin enhancement',
            'ai-art': 'AI art generation and style transfer',
            'unblur': 'deblurring and restoration',
            'video-editor': 'video editing and trimming'
        };

        const prompt = `You are an AI media expert. User uploaded ${fileName} (${fileSize}) for ${toolDescriptions[toolType]}.
        Analyze potential improvements.
        Output concise HTML (no markdown):
        <p><strong>Analysis:</strong> [Observation]</p>
        <p><strong>Enhancement:</strong> [Specific technical gain, e.g. "Upscaling to 1080p, Noise Reduction"]</p>
        <p class="tip">💡 <strong>Tip:</strong> [Short usage tip]</p>
        Keep it professional, encouraging, under 80 words.`;

        try {
            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 200 }
                })
            });
            if (!response.ok) throw new Error('Gemini API Error');
            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.warn('Analysis skipped:', error);
            return '<p>Ready to enhance your media with advanced algorithms.</p>';
        }
    },

    async getEnhancementResult(toolType) {
        const msgs = {
            'video-enhancer': '🎬 Video Processing Complete! Upscaled & Sharpened.',
            'photo-enhancer': '📷 Photo Enhancement Successful! Detail recovered.',
            'face-retouch': '👤 Retouching applied. Skin tones smoothed.',
            'unblur': '🔍 De-blurring algorithms applied successfully.',
            'default': '✨ Enhancement Complete!'
        };
        return msgs[toolType] || msgs['default'];
    }
};

document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Video Enhancer Pro Initialized');

    // Index Page Tool Tabs Logic
    const toolTabs = document.querySelectorAll('.tool-tab');
    if (toolTabs.length > 0) {
        toolTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Deactivate all
                document.querySelectorAll('.tool-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tool-content').forEach(c => c.classList.remove('active'));

                // Activate clicked
                tab.classList.add('active');
                const toolId = tab.getAttribute('data-tool');
                const content = document.getElementById(toolId);
                if (content) content.classList.add('active');

                // Update State
                if (window.state) window.state.tool = toolId; // Use global state if updated

                // Mobile: Scroll to content
                if (window.innerWidth < 768 && content) {
                    content.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    // UI State Management
    const state = {
        tool: 'video-enhancer',
        file: null,
        jobId: null,
        isProcessing: false
    };

    // Elements
    const elements = {
        dropZones: document.querySelectorAll('.upload-box'),
        fileInputs: document.querySelectorAll('input[type="file"]'),
        processingArea: document.getElementById('processingArea'),
        processingProgress: document.getElementById('processingProgress'),
        processingPercent: document.getElementById('processingPercent'),
        processingStep: document.getElementById('processingStep'),
        resultView: document.getElementById('resultView'),
        originalPreview: document.getElementById('originalPreview'),
        enhancedPreview: document.getElementById('enhancedPreview'),
        aiAnalysisText: document.getElementById('aiAnalysisText'),
        downloadBtn: document.getElementById('downloadResult'),
        startBtn: document.getElementById('enhanceBtn')
    };

    // Detect Tool from URL
    const path = window.location.pathname;
    if (path.includes('photo')) state.tool = 'photo-enhancer';
    else if (path.includes('face')) state.tool = 'face-retouch';
    else if (path.includes('art')) state.tool = 'ai-art';
    else if (path.includes('unblur')) state.tool = 'unblur';
    else if (path.includes('editor')) state.tool = 'video-editor';

    // File Handling
    elements.dropZones.forEach(zone => {
        const input = zone.querySelector('input');

        zone.addEventListener('click', () => input.click());
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('drag-active');
        });
        zone.addEventListener('dragleave', () => zone.classList.remove('drag-active'));
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('drag-active');
            if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
        });
        input.addEventListener('change', (e) => {
            if (e.target.files.length) handleFile(e.target.files[0]);
        });
    });

    function handleFile(file) {
        state.file = file;

        // Show file selected UI
        const zone = document.querySelector('.upload-box');
        if (zone) {
            zone.innerHTML = `
                <div class="file-selected">
                    <span class="file-icon">${file.type.startsWith('video') ? '🎬' : '📷'}</span>
                    <div class="file-info">
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${formatSize(file.size)}</span>
                    </div>
                    <button class="change-file-btn">Change</button>
                </div>
            `;
            zone.querySelector('.change-file-btn').onclick = (e) => {
                e.stopPropagation();
                window.location.reload();
            };
        }

        // Enable Start Button if present
        if (elements.startBtn) {
            elements.startBtn.disabled = false;
            elements.startBtn.classList.add('pulse-animation');
            elements.startBtn.onclick = startProcessing;
        } else {
            // Auto-start for Index page demo flow
            startProcessing();
        }
    }

    async function startProcessing() {
        if (state.isProcessing || !state.file) return;
        state.isProcessing = true;

        // UI Transition
        if (elements.startBtn) elements.startBtn.classList.add('loading');
        elements.processingArea.classList.add('active');
        document.getElementById('processingView').classList.add('active');
        elements.resultView.classList.remove('active');

        updateProgress(5, 'Initializing Upload...');

        // 1. Gemini Analysis (Parallel)
        const mediaType = state.file.type.startsWith('video') ? 'video' : 'image';
        const analysisPromise = GeminiAI.analyzeMedia(
            state.file.name,
            formatSize(state.file.size),
            mediaType,
            state.tool
        );

        // 2. Real Backend Upload
        try {
            const formData = new FormData();
            formData.append('file', state.file);
            formData.append('toolType', state.tool);

            // Collect User Options (if any)
            const resSelect = document.getElementById('resolution');
            if (resSelect) formData.append('resolution', resSelect.value);

            updateProgress(20, 'Uploading Media...');

            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            if (!res.ok) throw new Error('Upload Failed');

            const data = await res.json();
            state.jobId = data.jobId;

            // 3. Poll Status
            pollJob(data.jobId, mediaType, analysisPromise);

        } catch (error) {
            console.error(error);
            showError(error.message);
        }
    }

    function pollJob(jobId, mediaType, analysisPromise) {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/status/${jobId}`);
                if (!res.ok) return; // Retrying...

                const job = await res.json();

                if (job.status === 'processing') {
                    // Smooth progress mapping
                    const p = Math.max(20, job.progress); // Don't go below upload %
                    let step = 'Processing...';
                    if (p < 40) step = 'Analyzing Frames...';
                    else if (p < 70) step = 'Applying Filters...';
                    else if (p < 90) step = 'Rendering Output...';

                    updateProgress(p, step);
                }
                else if (job.status === 'completed') {
                    clearInterval(interval);
                    updateProgress(100, 'Finalizing...');
                    setTimeout(() => showSuccess(job.outputFile, mediaType, analysisPromise), 800);
                }
                else if (job.status === 'failed') {
                    clearInterval(interval);
                    showError(job.error || 'Processing Failed');
                }
            } catch (e) { console.error('Polling error', e); }
        }, 1500);
    }

    async function showSuccess(filename, mediaType, analysisPromise) {
        state.isProcessing = false;
        document.getElementById('processingView').classList.remove('active');
        elements.resultView.classList.add('active');

        // Previews
        const originalUrl = URL.createObjectURL(state.file);
        const downloadUrl = `/api/download/${filename}`;

        if (elements.originalPreview) {
            if (mediaType === 'video') {
                elements.originalPreview.innerHTML = `<video src="${originalUrl}" muted autoplay loop></video>`;
                elements.enhancedPreview.innerHTML = `
                    <div class="video-overlay">
                        <div class="play-icon">▶</div>
                        <p>Preview (Processed)</p>
                    </div>
                    <div class="success-badge">✨ ENHANCED</div>
                `;
                // Add click to play processed if supported or separate player
            } else {
                elements.originalPreview.innerHTML = `<img src="${originalUrl}">`;
                elements.enhancedPreview.innerHTML = `<img src="${downloadUrl}">`;
            }
        }

        // Analysis Text
        if (elements.aiAnalysisText) {
            elements.aiAnalysisText.innerHTML = '<span class="loading-dots">Generating Insights</span>';
            const analysis = await analysisPromise;
            elements.aiAnalysisText.innerHTML = analysis;
        }

        // Download Action
        if (elements.downloadBtn) {
            elements.downloadBtn.onclick = () => {
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `Enhanced_${state.file.name}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };
        }
    }

    function updateProgress(percent, text) {
        if (elements.processingProgress) elements.processingProgress.style.width = `${percent}%`;
        if (elements.processingPercent) elements.processingPercent.textContent = `${Math.round(percent)}%`;
        if (elements.processingStep) elements.processingStep.textContent = text;
    }

    function showError(msg) {
        state.isProcessing = false;
        alert(`Error: ${msg}`);
        window.location.reload();
    }

    function formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const s = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + s[i];
    }

    // Initialize Mobile Menu & Other UI (Preserved from original)
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            const sidebar = document.getElementById('mobileSidebar');
            if (sidebar) sidebar.classList.add('active');
        });
    }
    const closeSidebar = document.getElementById('sidebarClose');
    if (closeSidebar) {
        closeSidebar.addEventListener('click', () => {
            document.getElementById('mobileSidebar').classList.remove('active');
        });
    }
});
