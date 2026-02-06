// EaseMate AI Video Enhancer - JavaScript
// Gemini AI API Integration

const GEMINI_API_KEY = 'AIzaSyAzoGzGzUehfykqqQhKNrv_n9ztIGj3SKM';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Gemini AI Service
const GeminiAI = {
    async analyzeVideo(videoName, fileSize, duration) {
        const prompt = `You are an AI video enhancement expert. A user has uploaded a video with the following details:
- File name: ${videoName}
- File size: ${fileSize}
- Approximate duration: ${duration || 'Unknown'}

Provide a brief, helpful analysis with:
1. Recommended enhancement settings (resolution, denoising level, color correction)
2. Expected improvement quality
3. Any tips for best results

Keep the response concise and friendly, under 100 words.`;

        try {
            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 200,
                    }
                })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Gemini AI Error:', error);
            return null;
        }
    },

    async getEnhancementTips(mode) {
        const prompt = `Give 2-3 quick tips for "${mode}" video enhancement mode. Be concise, under 50 words total.`;

        try {
            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 100,
                    }
                })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Gemini AI Error:', error);
            return null;
        }
    },

    async generateCompletionMessage(settings) {
        const prompt = `Generate a short, enthusiastic success message (under 30 words) for a user who just enhanced their video to ${settings.resolution} with ${settings.mode} mode at ${settings.framerate}.`;

        try {
            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.9,
                        maxOutputTokens: 60,
                    }
                })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Gemini AI Error:', error);
            return 'Your video has been successfully enhanced!';
        }
    }
};

document.addEventListener('DOMContentLoaded', function () {
    // Elements
    const uploadArea = document.getElementById('uploadArea');
    const videoInput = document.getElementById('videoInput');
    const processingState = document.getElementById('processingState');
    const progressState = document.getElementById('progressState');
    const completeState = document.getElementById('completeState');
    const videoPreview = document.getElementById('videoPreview');
    const fileInfo = document.getElementById('fileInfo');
    const enhanceBtn = document.getElementById('enhanceBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const newVideoBtn = document.getElementById('newVideoBtn');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const billingToggle = document.getElementById('billingToggle');

    // State
    let currentFile = null;

    // File Upload Handling
    uploadArea.addEventListener('click', () => videoInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('video/')) {
            handleFile(files[0]);
        }
    });

    videoInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    async function handleFile(file) {
        currentFile = file;

        // Update file info
        const fileName = fileInfo.querySelector('.file-name');
        const fileSize = fileInfo.querySelector('.file-size');
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);

        // Create video preview
        const videoURL = URL.createObjectURL(file);
        videoPreview.innerHTML = `<video src="${videoURL}" controls muted></video>`;

        // Show processing state
        uploadArea.style.display = 'none';
        processingState.classList.add('active');

        // Add AI Analysis section if not exists
        let aiAnalysisDiv = document.getElementById('aiAnalysis');
        if (!aiAnalysisDiv) {
            aiAnalysisDiv = document.createElement('div');
            aiAnalysisDiv.id = 'aiAnalysis';
            aiAnalysisDiv.className = 'ai-analysis';
            aiAnalysisDiv.innerHTML = `
                <div class="ai-analysis-header">
                    <span class="ai-badge">🤖 Gemini AI Analysis</span>
                </div>
                <div class="ai-analysis-content">
                    <div class="ai-loading">Analyzing your video with AI...</div>
                </div>
            `;
            const enhancementOptions = document.querySelector('.enhancement-options');
            enhancementOptions.parentNode.insertBefore(aiAnalysisDiv, enhancementOptions);
        } else {
            aiAnalysisDiv.querySelector('.ai-analysis-content').innerHTML = '<div class="ai-loading">Analyzing your video with AI...</div>';
        }

        // Get AI analysis
        const analysis = await GeminiAI.analyzeVideo(file.name, formatFileSize(file.size));
        if (analysis) {
            aiAnalysisDiv.querySelector('.ai-analysis-content').innerHTML = `<p>${analysis.replace(/\n/g, '<br>')}</p>`;
        } else {
            aiAnalysisDiv.querySelector('.ai-analysis-content').innerHTML = '<p>AI analysis unavailable. You can still enhance your video with default settings!</p>';
        }
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Cancel button
    cancelBtn.addEventListener('click', resetTool);

    function resetTool() {
        currentFile = null;
        videoInput.value = '';
        videoPreview.innerHTML = '';
        uploadArea.style.display = 'block';
        processingState.classList.remove('active');
        progressState.classList.remove('active');
        completeState.classList.remove('active');
    }

    // Enhancement Process
    enhanceBtn.addEventListener('click', startEnhancement);

    function startEnhancement() {
        processingState.classList.remove('active');
        progressState.classList.add('active');

        const progressPercent = document.getElementById('progressPercent');
        const progressFill = document.getElementById('progressFill');
        const progressTitle = document.getElementById('progressTitle');
        const progressSubtitle = document.getElementById('progressSubtitle');
        const progressTime = document.getElementById('progressTime');
        const progressFrames = document.getElementById('progressFrames');
        const progressRing = document.querySelector('.progress-ring');

        const stages = [
            { percent: 15, title: 'Analyzing Video...', subtitle: 'Detecting optimal enhancement parameters' },
            { percent: 35, title: 'Preprocessing Frames...', subtitle: 'Preparing video for AI enhancement' },
            { percent: 55, title: 'AI Enhancement...', subtitle: 'Applying neural network upscaling' },
            { percent: 75, title: 'Refining Details...', subtitle: 'Enhancing textures and edges' },
            { percent: 90, title: 'Finalizing...', subtitle: 'Encoding enhanced video' },
            { percent: 100, title: 'Complete!', subtitle: 'Your video is ready' }
        ];

        let currentStage = 0;
        let currentPercent = 0;
        const totalFrames = 1000;

        const interval = setInterval(() => {
            if (currentStage < stages.length) {
                const targetPercent = stages[currentStage].percent;

                if (currentPercent < targetPercent) {
                    currentPercent += 1;
                    progressPercent.textContent = currentPercent + '%';
                    progressFill.style.width = currentPercent + '%';
                    progressRing.style.setProperty('--progress', currentPercent + '%');

                    const currentFrame = Math.floor((currentPercent / 100) * totalFrames);
                    progressFrames.textContent = `Frame ${currentFrame}/${totalFrames}`;

                    const remainingTime = Math.ceil((100 - currentPercent) / 10);
                    progressTime.textContent = `Estimated time: ${remainingTime > 1 ? remainingTime + ' min' : '< 1 min'}`;
                } else {
                    progressTitle.textContent = stages[currentStage].title;
                    progressSubtitle.textContent = stages[currentStage].subtitle;
                    currentStage++;
                }
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    progressState.classList.remove('active');
                    completeState.classList.add('active');
                }, 500);
            }
        }, 50);
    }

    // Download button
    downloadBtn.addEventListener('click', () => {
        // Simulated download - in real app would download the enhanced file
        alert('Download started! Your enhanced 4K video will be saved shortly.');
    });

    // New video button
    newVideoBtn.addEventListener('click', resetTool);

    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            faqItems.forEach(faq => faq.classList.remove('active'));
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // Pricing Toggle
    if (billingToggle) {
        billingToggle.addEventListener('change', (e) => {
            const labels = document.querySelectorAll('.toggle-label');
            labels.forEach(label => label.classList.toggle('active'));

            // Update prices (would be dynamic in real app)
            const amounts = document.querySelectorAll('.plan-price .amount');
            if (e.target.checked) {
                // Yearly prices
                amounts[1].textContent = '11';
                amounts[2].textContent = '47';
            } else {
                // Monthly prices
                amounts[1].textContent = '19';
                amounts[2].textContent = '79';
            }
        });
    }

    // Mobile menu
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            const navLinks = document.querySelector('.nav-links');
            const navActions = document.querySelector('.nav-actions');
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
            navActions.style.display = navActions.style.display === 'flex' ? 'none' : 'flex';
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId !== '#') {
                e.preventDefault();
                const target = document.querySelector(targetId);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe feature cards, step cards, pricing cards, testimonials
    const animateElements = document.querySelectorAll('.feature-card, .step-card, .pricing-card, .testimonial-card');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Add hover effects to buttons
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .btn-outline');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'translateY(-2px)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translateY(0)';
        });
    });

    // Navbar scroll effect
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.style.background = 'rgba(15, 15, 26, 0.95)';
            navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.3)';
        } else {
            navbar.style.background = 'rgba(15, 15, 26, 0.8)';
            navbar.style.boxShadow = 'none';
        }

        lastScroll = currentScroll;
    });

    console.log('EaseMate AI Video Enhancer initialized successfully!');
});
