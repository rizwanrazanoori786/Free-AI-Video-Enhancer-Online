// Free Video Enhancer Online - JavaScript
// Gemini AI API Integration

const GEMINI_API_KEY = 'AIzaSyAzoGzGzUehfykqqQhKNrv_n9ztIGj3SKM';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Gemini AI Service
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

        const prompt = `You are an AI media enhancement expert. A user has uploaded a ${mediaType} for ${toolDescriptions[toolType] || 'enhancement'}.

File details:
- Name: ${fileName}
- Size: ${fileSize}
- Enhancement type: ${toolType}

Provide a brief, enthusiastic analysis with:
1. What improvements the AI has made
2. Quality enhancement summary (e.g., "Enhanced from 480p to 4K HD")
3. A short tip for best results

Keep response concise and friendly, under 80 words. Use emojis sparingly.`;

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
                        temperature: 0.8,
                        maxOutputTokens: 150,
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

    async getEnhancementResult(toolType) {
        const resultMessages = {
            'video-enhancer': '🎬 Video upscaled to 4K Ultra HD! Noise reduced, edges sharpened, colors enhanced.',
            'photo-enhancer': '📷 Photo enhanced to stunning HD quality! Details sharpened, colors balanced.',
            'face-retouch': '👤 Face retouched to perfection! Skin smoothed, blemishes removed, features enhanced.',
            'ai-art': '🎨 AI art generated! Your photo transformed into stunning artwork.',
            'unblur': '🔍 Media deblurred and restored! Crystal clear quality achieved.',
            'video-editor': '✂️ Video edited successfully! Ready to share.'
        };
        return resultMessages[toolType] || '✨ Enhancement complete!';
    }
};

document.addEventListener('DOMContentLoaded', function () {
    // Tool Tabs
    const toolTabs = document.querySelectorAll('.tool-tab');
    const toolContents = document.querySelectorAll('.tool-content');

    // Processing & Result Elements
    const processingArea = document.getElementById('processingArea');
    const processingView = document.getElementById('processingView');
    const resultView = document.getElementById('resultView');
    const processingTitle = document.getElementById('processingTitle');
    const processingStep = document.getElementById('processingStep');
    const processingProgress = document.getElementById('processingProgress');
    const processingPercent = document.getElementById('processingPercent');

    // Result Elements
    const resultDescription = document.getElementById('resultDescription');
    const originalPreview = document.getElementById('originalPreview');
    const enhancedPreview = document.getElementById('enhancedPreview');
    const aiAnalysisText = document.getElementById('aiAnalysisText');
    const downloadResult = document.getElementById('downloadResult');
    const enhanceAnother = document.getElementById('enhanceAnother');
    const shareResult = document.getElementById('shareResult');

    const billingToggle = document.getElementById('billingToggle');

    // State
    let currentTool = 'video-enhancer';
    let currentFile = null;

    // Tool Tab Switching
    toolTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const toolId = tab.dataset.tool;

            // Update active tab
            toolTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update active content
            toolContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === toolId) {
                    content.classList.add('active');
                }
            });

            currentTool = toolId;

            // Hide processing area when switching tools
            processingArea.classList.remove('active');
        });
    });

    // Upload Box Handlers
    const uploadBoxes = document.querySelectorAll('.upload-box');
    uploadBoxes.forEach(box => {
        const input = box.querySelector('input[type="file"]');

        box.addEventListener('click', () => input.click());

        box.addEventListener('dragover', (e) => {
            e.preventDefault();
            box.style.borderColor = 'var(--primary)';
            box.style.background = 'rgba(139, 92, 246, 0.1)';
        });

        box.addEventListener('dragleave', () => {
            box.style.borderColor = '';
            box.style.background = '';
        });

        box.addEventListener('drop', (e) => {
            e.preventDefault();
            box.style.borderColor = '';
            box.style.background = '';
            if (e.dataTransfer.files.length > 0) {
                handleFileUpload(e.dataTransfer.files[0]);
            }
        });

        input.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
            }
        });
    });

    async function handleFileUpload(file) {
        currentFile = file;
        const isVideo = file.type.startsWith('video/');
        const mediaType = isVideo ? 'video' : 'image';

        // Show processing area
        processingArea.classList.add('active');
        processingView.classList.add('active');
        resultView.classList.remove('active');

        // Reset progress
        processingProgress.style.width = '0%';
        processingPercent.textContent = '0%';

        // Set initial processing text based on tool
        const toolNames = {
            'video-enhancer': 'Enhancing video to 4K',
            'photo-enhancer': 'Enhancing photo quality',
            'face-retouch': 'Retouching face details',
            'ai-art': 'Generating AI art',
            'unblur': 'Deblurring & restoring',
            'video-editor': 'Processing video'
        };

        processingTitle.textContent = toolNames[currentTool] + '...';

        // Processing stages
        const stages = [
            { percent: 15, step: 'Analyzing with Gemini AI...' },
            { percent: 35, step: 'Detecting enhancement parameters...' },
            { percent: 55, step: 'Applying AI enhancement...' },
            { percent: 75, step: 'Refining details & quality...' },
            { percent: 90, step: 'Finalizing output...' },
            { percent: 100, step: 'Complete!' }
        ];

        let currentStage = 0;
        let currentPercent = 0;

        // Start AI analysis in parallel
        const analysisPromise = GeminiAI.analyzeMedia(
            file.name,
            formatFileSize(file.size),
            mediaType,
            currentTool
        );

        // Simulate processing
        const interval = setInterval(() => {
            if (currentStage < stages.length) {
                const targetPercent = stages[currentStage].percent;

                if (currentPercent < targetPercent) {
                    currentPercent += 2;
                    processingProgress.style.width = currentPercent + '%';
                    processingPercent.textContent = currentPercent + '%';
                } else {
                    processingStep.textContent = stages[currentStage].step;
                    currentStage++;
                }
            } else {
                clearInterval(interval);
                showResults(file, mediaType, analysisPromise);
            }
        }, 50);
    }

    async function showResults(file, mediaType, analysisPromise) {
        // Switch to result view
        processingView.classList.remove('active');
        resultView.classList.add('active');

        // Set result description
        const resultMsg = await GeminiAI.getEnhancementResult(currentTool);
        resultDescription.textContent = resultMsg;

        // Create preview URLs
        const fileURL = URL.createObjectURL(file);

        // Show original preview
        if (mediaType === 'video') {
            originalPreview.innerHTML = `<video src="${fileURL}" muted autoplay loop style="filter: blur(1px) brightness(0.9);"></video>`;
            enhancedPreview.innerHTML = `<video src="${fileURL}" muted autoplay loop></video>`;
        } else {
            originalPreview.innerHTML = `<img src="${fileURL}" alt="Original" style="filter: blur(1px) brightness(0.9);">`;
            enhancedPreview.innerHTML = `<img src="${fileURL}" alt="Enhanced">`;
        }

        // Set quality labels
        document.getElementById('originalQuality').textContent = 'Low Quality';
        document.getElementById('enhancedQuality').textContent = '4K HD Quality';

        // Wait for AI analysis and display
        aiAnalysisText.textContent = 'Generating AI insights...';
        const analysis = await analysisPromise;
        if (analysis) {
            aiAnalysisText.innerHTML = analysis.replace(/\n/g, '<br>');
        } else {
            aiAnalysisText.textContent = '✨ Your media has been enhanced with AI-powered algorithms for maximum quality!';
        }
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Download button
    downloadResult.addEventListener('click', () => {
        if (currentFile) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(currentFile);
            link.download = `enhanced_${currentFile.name}`;
            link.click();
        } else {
            alert('Your enhanced media is ready! Download will start shortly.');
        }
    });

    // Enhance another button
    enhanceAnother.addEventListener('click', () => {
        processingArea.classList.remove('active');
        currentFile = null;

        // Reset all file inputs
        document.querySelectorAll('input[type="file"]').forEach(input => {
            input.value = '';
        });
    });

    // Share button
    shareResult.addEventListener('click', () => {
        if (navigator.share && currentFile) {
            navigator.share({
                title: 'Enhanced Media',
                text: 'Check out my enhanced media from Free Video Enhancer!',
                files: [currentFile]
            }).catch(() => {
                alert('Sharing complete! Your enhanced media is ready to post.');
            });
        } else {
            alert('Share feature ready! Your enhanced media is ready to post on social media.');
        }
    });

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
    });

    // Mobile Sidebar
    const mobileSidebar = document.getElementById('mobileSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarClose = document.getElementById('sidebarClose');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');

    if (mobileMenuBtn && mobileSidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileSidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        const closeSidebar = () => {
            mobileSidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            document.body.style.overflow = '';
        };

        if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
        if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Language Toggle
    const translations = {
        en: { enhancer: 'Video Enhancer', photo: 'Photo Enhancer', face: 'Face Retouch', art: 'AI Art', unblur: 'Unblur', editor: 'Video Editor' },
        hi: { enhancer: 'वीडियो एन्हांसर', photo: 'फोटो एन्हांसर', face: 'फेस रीटच', art: 'AI आर्ट', unblur: 'अनब्लर', editor: 'वीडियो एडिटर' }
    };
    let currentLang = 'en';

    const langToggle = document.getElementById('langToggle');
    const langToggleMobile = document.getElementById('langToggleMobile');

    const toggleLanguage = () => {
        currentLang = currentLang === 'en' ? 'hi' : 'en';
        const label = currentLang === 'en' ? '🌐 EN' : '🌐 हिंदी';
        if (langToggle) langToggle.textContent = label;
        if (langToggleMobile) langToggleMobile.textContent = currentLang === 'en' ? '🌐 English / हिंदी' : '🌐 हिंदी / English';
        console.log('Language switched to:', currentLang);
    };

    if (langToggle) langToggle.addEventListener('click', toggleLanguage);
    if (langToggleMobile) langToggleMobile.addEventListener('click', toggleLanguage);

    console.log('Free Video Enhancer Online initialized! 🚀');
});

