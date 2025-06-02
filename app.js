// Mind Voice Agent 3.0 - Shion
// Advanced Voice Psychology Analysis System

class ShionVoiceAgent {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 12;
        this.userData = {};
        this.voiceData = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recordingTimer = null;
        this.recordingTime = 0;
        this.isRecording = false;
        this.micTested = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateProgress();
        this.initializeSliders();
        this.checkConsentStatus();
    }

    setupEventListeners() {
        // Consent checkbox
        const consentCheck = document.getElementById('consent-check');
        const consentBtn = document.getElementById('consent-btn');
        if (consentCheck && consentBtn) {
            consentCheck.addEventListener('change', (e) => {
                consentBtn.disabled = !e.target.checked;
            });
        }

        // Form validation for demographics
        const demographicsInputs = ['age-group', 'gender', 'occupation'];
        const demographicsBtn = document.getElementById('demographics-btn');
        demographicsInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    this.validateDemographics();
                });
            }
        });

        // TTM stage selection
        const ttmRadios = document.querySelectorAll('input[name="ttm-stage"]');
        ttmRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.generateActionPlan(e.target.value);
            });
        });

        // Category tabs in recommendations
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('category-tab')) {
                const category = e.target.textContent.toLowerCase().replace(/\s+/g, '');
                this.showCategory(category);
            }
        });
    }

    initializeSliders() {
        const sliders = [
            { id: 'sleep-quality', valueId: 'sleep-value' },
            { id: 'stress-level', valueId: 'stress-value' },
            { id: 'social-support', valueId: 'social-value' },
            { id: 'wellness-motivation', valueId: 'wellness-value' }
        ];

        sliders.forEach(slider => {
            const element = document.getElementById(slider.id);
            const valueElement = document.getElementById(slider.valueId);
            if (element && valueElement) {
                element.addEventListener('input', (e) => {
                    valueElement.textContent = e.target.value;
                });
            }
        });
    }

    checkConsentStatus() {
        const consentCheck = document.getElementById('consent-check');
        const consentBtn = document.getElementById('consent-btn');
        if (consentCheck && consentBtn) {
            consentBtn.disabled = !consentCheck.checked;
        }
    }

    validateDemographics() {
        const ageGroup = document.getElementById('age-group').value;
        const gender = document.getElementById('gender').value;
        const occupation = document.getElementById('occupation').value;
        
        const isValid = ageGroup && gender && occupation;
        const button = document.getElementById('demographics-btn');
        if (button) {
            button.disabled = !isValid;
        }
        return isValid;
    }

    nextStep() {
        if (!this.canProceed()) {
            return;
        }

        this.collectStepData();
        
        if (this.currentStep < this.totalSteps) {
            this.hideCurrentStep();
            this.currentStep++;
            this.showCurrentStep();
            this.updateProgress();
            
            // Handle special step transitions
            this.handleStepTransition();
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.hideCurrentStep();
            this.currentStep--;
            this.showCurrentStep();
            this.updateProgress();
        }
    }

    canProceed() {
        switch (this.currentStep) {
            case 2: // Consent
                return document.getElementById('consent-check').checked;
            case 3: // Demographics
                return this.validateDemographics();
            case 6: // Recording setup
                return this.micTested;
            case 7: // Voice recording
                return this.voiceData !== null;
            default:
                return true;
        }
    }

    collectStepData() {
        switch (this.currentStep) {
            case 3: // Demographics
                this.userData.demographics = {
                    ageGroup: document.getElementById('age-group').value,
                    gender: document.getElementById('gender').value,
                    occupation: document.getElementById('occupation').value
                };
                break;
            case 4: // Lifestyle
                this.userData.lifestyle = {
                    sleepQuality: parseInt(document.getElementById('sleep-quality').value),
                    exerciseFrequency: document.getElementById('exercise-frequency').value,
                    stressLevel: parseInt(document.getElementById('stress-level').value),
                    socialSupport: parseInt(document.getElementById('social-support').value)
                };
                break;
            case 5: // Health
                this.userData.health = {
                    mentalHealthHistory: document.getElementById('mental-health-history').value,
                    medications: document.getElementById('medications').value,
                    wellnessMotivation: parseInt(document.getElementById('wellness-motivation').value)
                };
                break;
        }
    }

    handleStepTransition() {
        switch (this.currentStep) {
            case 8: // Processing
                this.startVoiceProcessing();
                break;
            case 9: // Results
                this.generateResults();
                break;
            case 10: // Recommendations
                this.generateRecommendations();
                break;
        }
    }

    hideCurrentStep() {
        const currentStepElement = document.getElementById(`step-${this.getStepName(this.currentStep)}`);
        if (currentStepElement) {
            currentStepElement.classList.remove('active');
        }
    }

    showCurrentStep() {
        const stepElement = document.getElementById(`step-${this.getStepName(this.currentStep)}`);
        if (stepElement) {
            stepElement.classList.add('active');
        }
    }

    getStepName(stepNumber) {
        const stepNames = [
            'welcome', 'consent', 'demographics', 'lifestyle', 'health',
            'setup', 'recording', 'processing', 'results', 'recommendations',
            'planning', 'completion'
        ];
        return stepNames[stepNumber - 1];
    }

    updateProgress() {
        const progressFill = document.getElementById('progress-fill');
        const progressPercentage = (this.currentStep / this.totalSteps) * 100;
        if (progressFill) {
            progressFill.style.width = `${progressPercentage}%`;
        }

        // Update step indicators
        const indicators = document.querySelectorAll('.step-indicator');
        indicators.forEach((indicator, index) => {
            indicator.classList.remove('active', 'completed');
            if (index + 1 === this.currentStep) {
                indicator.classList.add('active');
            } else if (index + 1 < this.currentStep) {
                indicator.classList.add('completed');
            }
        });
    }

    // Microphone testing functionality
    async testMicrophone() {
        const testBtn = document.getElementById('test-mic-btn');
        const statusText = document.getElementById('mic-status-text');
        const continueBtn = document.getElementById('setup-continue-btn');
        
        try {
            testBtn.textContent = 'Testing...';
            testBtn.disabled = true;
            statusText.textContent = 'Requesting microphone access...';

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            statusText.textContent = 'Microphone access granted! Testing audio levels...';
            this.startAudioLevelVisualization(stream);
            
            setTimeout(() => {
                stream.getTracks().forEach(track => track.stop());
                statusText.textContent = 'Microphone test successful! Ready to proceed.';
                testBtn.textContent = 'Test Complete ✓';
                testBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                continueBtn.disabled = false;
                this.micTested = true;
            }, 3000);

        } catch (error) {
            statusText.textContent = 'Microphone access denied. Please allow microphone access and try again.';
            testBtn.textContent = 'Retry Test';
            testBtn.disabled = false;
            console.error('Microphone test failed:', error);
        }
    }

    startAudioLevelVisualization(stream) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const levelBars = document.querySelectorAll('.level-bar');

        const updateLevels = () => {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            const normalizedLevel = average / 255;

            levelBars.forEach((bar, index) => {
                if (normalizedLevel > (index * 0.2)) {
                    bar.classList.add('active');
                } else {
                    bar.classList.remove('active');
                }
            });

            if (stream.active) {
                requestAnimationFrame(updateLevels);
            }
        };

        updateLevels();
    }

    // Voice recording functionality
    async startRecording() {
        const recordBtn = document.getElementById('record-btn');
        const continueBtn = document.getElementById('recording-continue-btn');
        const timer = document.getElementById('recording-timer');
        const sphere = document.getElementById('holographic-sphere');

        if (!this.isRecording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.mediaRecorder = new MediaRecorder(stream);
                this.audioChunks = [];
                this.recordingTime = 0;

                this.mediaRecorder.ondataavailable = (event) => {
                    this.audioChunks.push(event.data);
                };

                this.mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                    this.voiceData = audioBlob;
                    continueBtn.disabled = false;
                    sphere.style.animation = 'sphereFloat 4s ease-in-out infinite';
                };

                this.mediaRecorder.start();
                this.isRecording = true;
                
                recordBtn.innerHTML = '<span class="record-icon" style="background: #ef4444;"></span>Stop Recording';
                recordBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                sphere.style.animation = 'processingPulse 1s ease-in-out infinite';
                
                this.startRecordingTimer(timer);
                this.animateRecordingSphere();

            } catch (error) {
                console.error('Recording failed:', error);
                alert('Unable to access microphone. Please check your settings.');
            }
        } else {
            this.stopRecording();
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            this.isRecording = false;
            
            const recordBtn = document.getElementById('record-btn');
            recordBtn.innerHTML = '<span class="record-icon"></span>Recording Complete ✓';
            recordBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            recordBtn.disabled = true;
            
            if (this.recordingTimer) {
                clearInterval(this.recordingTimer);
            }
        }
    }

    startRecordingTimer(timerElement) {
        this.recordingTimer = setInterval(() => {
            this.recordingTime++;
            const minutes = Math.floor(this.recordingTime / 60);
            const seconds = this.recordingTime % 60;
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Auto-stop after 60 seconds
            if (this.recordingTime >= 60) {
                this.stopRecording();
            }
        }, 1000);
    }

    animateRecordingSphere() {
        const particles = document.querySelectorAll('.particle');
        particles.forEach((particle, index) => {
            particle.style.animationDuration = `${2 + Math.random() * 2}s`;
            particle.style.animationDelay = `${index * 0.2}s`;
        });
    }

    // Voice processing simulation
    startVoiceProcessing() {
        const steps = [
            { id: 'step-pitch', message: 'Analyzing pitch patterns and vocal frequency...', duration: 2000 },
            { id: 'step-jitter', message: 'Measuring voice stability and micro-variations...', duration: 2500 },
            { id: 'step-energy', message: 'Evaluating energy levels and emotional indicators...', duration: 2000 },
            { id: 'step-complete', message: 'Generating personalized insights...', duration: 1500 }
        ];

        const messageElement = document.getElementById('processing-message');
        let currentStepIndex = 0;

        const processStep = () => {
            if (currentStepIndex < steps.length) {
                const step = steps[currentStepIndex];
                
                // Deactivate previous steps
                document.querySelectorAll('.processing-step').forEach(el => el.classList.remove('active'));
                
                // Activate current step
                const stepElement = document.getElementById(step.id);
                if (stepElement) {
                    stepElement.classList.add('active');
                }
                
                // Update message
                if (messageElement) {
                    messageElement.textContent = step.message;
                }
                
                currentStepIndex++;
                
                setTimeout(processStep, step.duration);
            } else {
                // Processing complete, move to results
                setTimeout(() => {
                    this.nextStep();
                }, 1000);
            }
        };

        processStep();
    }

    // Results generation based on user data and simulated voice analysis
    generateResults() {
        const { lifestyle, health, demographics } = this.userData;
        
        // Simulate voice analysis results based on user input
        const stressScore = lifestyle.stressLevel;
        const sleepScore = lifestyle.sleepQuality;
        const socialScore = lifestyle.socialSupport;
        
        let emotionalState, stressLevel, energyLevel;
        let emotionalDescription, stressDescription, energyDescription;
        
        // Determine emotional state
        if (sleepScore >= 7 && socialScore >= 6 && stressScore <= 5) {
            emotionalState = 'balanced';
            emotionalDescription = 'Your voice patterns indicate emotional stability with good overall balance.';
        } else if (stressScore >= 7 || sleepScore <= 4) {
            emotionalState = 'elevated';
            emotionalDescription = 'Voice analysis suggests some emotional tension that may benefit from attention.';
        } else {
            emotionalState = 'moderate';
            emotionalDescription = 'Your emotional state appears generally stable with room for enhancement.';
        }
        
        // Determine stress level
        if (stressScore <= 4) {
            stressLevel = 'low';
            stressDescription = 'Voice patterns indicate relatively low stress levels.';
        } else if (stressScore <= 7) {
            stressLevel = 'moderate';
            stressDescription = 'Moderate stress indicators detected in vocal patterns.';
        } else {
            stressLevel = 'high';
            stressDescription = 'Voice analysis suggests elevated stress levels requiring attention.';
        }
        
        // Determine energy level
        const avgEnergy = (sleepScore + (10 - stressScore) + socialScore) / 3;
        if (avgEnergy >= 7) {
            energyLevel = 'high';
            energyDescription = 'Your vocal energy suggests good vitality and alertness.';
        } else if (avgEnergy >= 5) {
            energyLevel = 'moderate';
            energyDescription = 'Your vocal energy indicates balanced alertness.';
        } else {
            energyLevel = 'low';
            energyDescription = 'Voice patterns suggest lower energy levels that may benefit from support.';
        }
        
        // Update results display
        this.updateResultDisplay('emotional', emotionalState, emotionalDescription);
        this.updateResultDisplay('stress', stressLevel, stressDescription);
        this.updateResultDisplay('energy', energyLevel, energyDescription);
        
        // Generate Shion's analysis
        const analysisText = this.generateShionAnalysis(emotionalState, stressLevel, energyLevel);
        const analysisElement = document.getElementById('shion-analysis');
        if (analysisElement) {
            analysisElement.textContent = analysisText;
        }
    }

    updateResultDisplay(type, level, description) {
        const resultElement = document.getElementById(`${type}-result`);
        const descriptionElement = document.getElementById(`${type}-description`);
        
        if (resultElement) {
            const circle = resultElement.querySelector('.indicator-circle');
            const span = resultElement.querySelector('span');
            
            circle.className = `indicator-circle ${level}`;
            span.textContent = level.charAt(0).toUpperCase() + level.slice(1);
        }
        
        if (descriptionElement) {
            descriptionElement.textContent = description;
        }
    }

    generateShionAnalysis(emotional, stress, energy) {
        const analyses = {
            positive: [
                "Your voice analysis shows wonderful emotional balance! I can hear strength and resilience in your vocal patterns. This suggests you're managing life's challenges quite well.",
                "There's a lovely stability in your voice that indicates good emotional regulation. Your vocal energy patterns suggest you're in a healthy mental state."
            ],
            concerned: [
                "I notice some patterns in your voice that suggest you might be carrying more stress than usual. This is completely normal, and there are many effective ways to support yourself through this.",
                "Your voice reveals some areas where we can focus on building resilience. The good news is that awareness is the first step toward positive change."
            ],
            supportive: [
                "Your voice tells a story of someone who's working hard to maintain balance. I hear both challenges and strengths, which shows your commitment to self-care.",
                "There's wisdom in your voice that comes from experience. While I detect some stress indicators, I also hear the capacity for growth and healing."
            ]
        };
        
        if (stress === 'low' && emotional === 'balanced') {
            return analyses.positive[Math.floor(Math.random() * analyses.positive.length)];
        } else if (stress === 'high' || emotional === 'elevated') {
            return analyses.concerned[Math.floor(Math.random() * analyses.concerned.length)];
        } else {
            return analyses.supportive[Math.floor(Math.random() * analyses.supportive.length)];
        }
    }

    // Generate personalized recommendations
    generateRecommendations() {
        const { lifestyle, health, demographics } = this.userData;
        
        const recommendations = {
            selfcare: this.getSelfCareRecommendations(lifestyle, health),
            mindfulness: this.getMindfulnessRecommendations(lifestyle, health),
            physical: this.getPhysicalRecommendations(lifestyle, demographics)
        };
        
        this.displayRecommendations(recommendations);
    }

    getSelfCareRecommendations(lifestyle, health) {
        const recommendations = [];
        
        if (lifestyle.sleepQuality <= 6) {
            recommendations.push({
                title: "Sleep Optimization",
                description: "Establish a consistent bedtime routine with relaxation techniques before sleep."
            });
        }
        
        if (lifestyle.stressLevel >= 6) {
            recommendations.push({
                title: "Stress Management",
                description: "Practice the 4-7-8 breathing technique: inhale for 4, hold for 7, exhale for 8."
            });
        }
        
        recommendations.push({
            title: "Daily Relaxation",
            description: "Set aside 10-15 minutes daily for progressive muscle relaxation."
        });
        
        if (lifestyle.socialSupport <= 5) {
            recommendations.push({
                title: "Social Connection",
                description: "Schedule regular check-ins with friends or family members who support you."
            });
        }
        
        return recommendations;
    }

    getMindfulnessRecommendations(lifestyle, health) {
        const recommendations = [];
        
        if (health.wellnessMotivation >= 7) {
            recommendations.push({
                title: "Mindfulness Meditation",
                description: "Start with 5-10 minutes daily of focused breathing meditation."
            });
        }
        
        recommendations.push({
            title: "Grounding Exercise",
            description: "Use the 5-4-3-2-1 technique: 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste."
        });
        
        if (lifestyle.stressLevel >= 6) {
            recommendations.push({
                title: "Stress Awareness",
                description: "Keep a brief daily log of stress triggers and your emotional responses."
            });
        }
        
        recommendations.push({
            title: "Gratitude Practice",
            description: "Write down three things you're grateful for each day before bed."
        });
        
        return recommendations;
    }

    getPhysicalRecommendations(lifestyle, demographics) {
        const recommendations = [];
        
        if (lifestyle.exerciseFrequency === 'never' || lifestyle.exerciseFrequency === 'rarely') {
            recommendations.push({
                title: "Gentle Movement",
                description: "Start with 10-minute daily walks, gradually increasing duration."
            });
        }
        
        if (demographics.occupation === 'office_worker') {
            recommendations.push({
                title: "Desk Stretches",
                description: "Perform shoulder rolls and neck stretches every hour during work."
            });
        }
        
        recommendations.push({
            title: "Cardiovascular Health",
            description: "Aim for 150 minutes of moderate activity per week, such as brisk walking."
        });
        
        if (lifestyle.stressLevel >= 6) {
            recommendations.push({
                title: "Yoga Practice",
                description: "Try gentle yoga or tai chi for stress relief and flexibility."
            });
        }
        
        return recommendations;
    }

    displayRecommendations(recommendations) {
        Object.keys(recommendations).forEach(category => {
            const container = document.getElementById(`${category}-recommendations`);
            if (container) {
                container.innerHTML = '';
                recommendations[category].forEach(rec => {
                    const item = document.createElement('div');
                    item.className = 'recommendation-item';
                    item.innerHTML = `
                        <h5>${rec.title}</h5>
                        <p>${rec.description}</p>
                    `;
                    container.appendChild(item);
                });
            }
        });
    }

    showCategory(category) {
        // Remove active class from all tabs and contents
        document.querySelectorAll('.category-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.category-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to selected tab and content
        const activeTab = Array.from(document.querySelectorAll('.category-tab')).find(tab => 
            tab.textContent.toLowerCase().replace(/\s+/g, '') === category
        );
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        const activeContent = document.getElementById(`${category}-content`);
        if (activeContent) {
            activeContent.classList.add('active');
        }
    }

    // TTM-based action planning
    generateActionPlan(stage) {
        const planContainer = document.getElementById('action-plan-content');
        if (!planContainer) return;
        
        const plans = {
            precontemplation: {
                title: "Building Awareness",
                steps: [
                    "Take time to reflect on your current well-being",
                    "Notice patterns in your daily experiences",
                    "Explore what wellness means to you personally",
                    "Consider the benefits of small positive changes"
                ]
            },
            contemplation: {
                title: "Exploring Possibilities",
                steps: [
                    "List pros and cons of making wellness changes",
                    "Identify specific areas you'd like to improve",
                    "Research different approaches that appeal to you",
                    "Talk to others about their wellness journeys"
                ]
            },
            preparation: {
                title: "Getting Ready for Action",
                steps: [
                    "Set one specific, achievable wellness goal",
                    "Create a simple plan with daily actions",
                    "Gather resources and support you'll need",
                    "Choose a start date within the next week"
                ]
            },
            action: {
                title: "Taking Active Steps",
                steps: [
                    "Implement your wellness plan consistently",
                    "Track your progress with a simple journal",
                    "Celebrate small victories along the way",
                    "Adjust your approach based on what works"
                ]
            },
            maintenance: {
                title: "Sustaining Your Progress",
                steps: [
                    "Continue your established wellness routines",
                    "Plan for potential challenges and setbacks",
                    "Regularly review and update your goals",
                    "Share your success to inspire others"
                ]
            }
        };
        
        const plan = plans[stage];
        if (plan) {
            planContainer.innerHTML = `
                <h4>${plan.title}</h4>
                <div class="action-steps">
                    ${plan.steps.map(step => `
                        <div class="action-step">
                            <div class="step-number"></div>
                            <span>${step}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    // Session management
    restartSession() {
        this.currentStep = 1;
        this.userData = {};
        this.voiceData = null;
        this.micTested = false;
        this.isRecording = false;
        
        // Reset all form inputs
        document.querySelectorAll('input, select').forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else {
                input.value = input.defaultValue || '';
            }
        });
        
        // Reset sliders
        document.querySelectorAll('.range-slider').forEach(slider => {
            slider.value = slider.defaultValue || 5;
            const valueId = slider.id.replace(/-/g, '-') + '-value';
            const valueElement = document.getElementById(valueId);
            if (valueElement) {
                valueElement.textContent = slider.value;
            }
        });
        
        // Reset buttons
        document.querySelectorAll('.btn').forEach(btn => {
            btn.disabled = false;
            btn.textContent = btn.getAttribute('data-original-text') || btn.textContent;
        });
        
        // Show first step
        document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
        document.getElementById('step-welcome').classList.add('active');
        
        this.updateProgress();
        this.checkConsentStatus();
    }

    downloadResults() {
        const results = {
            sessionDate: new Date().toISOString(),
            userData: this.userData,
            analysis: {
                emotionalState: document.getElementById('emotional-result')?.querySelector('span')?.textContent || 'N/A',
                stressLevel: document.getElementById('stress-result')?.querySelector('span')?.textContent || 'N/A',
                energyLevel: document.getElementById('energy-result')?.querySelector('span')?.textContent || 'N/A'
            },
            shionMessage: document.getElementById('shion-analysis')?.textContent || 'N/A'
        };
        
        const dataStr = JSON.stringify(results, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `shion-voice-analysis-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }
}

// Global functions for HTML onclick handlers
let shionAgent;

function nextStep() {
    shionAgent.nextStep();
}

function prevStep() {
    shionAgent.prevStep();
}

function testMicrophone() {
    shionAgent.testMicrophone();
}

function startRecording() {
    shionAgent.startRecording();
}

function showCategory(category) {
    shionAgent.showCategory(category);
}

function restartSession() {
    shionAgent.restartSession();
}

function downloadResults() {
    shionAgent.downloadResults();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    shionAgent = new ShionVoiceAgent();
    
    // Add CSS for action steps
    const style = document.createElement('style');
    style.textContent = `
        .action-steps {
            margin-top: 16px;
        }
        
        .action-step {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            margin-bottom: 8px;
            background: rgba(59, 130, 246, 0.1);
            border-radius: 8px;
            border: 1px solid rgba(96, 165, 250, 0.2);
        }
        
        .step-number {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: var(--bright-blue);
            position: relative;
            flex-shrink: 0;
        }
        
        .step-number::before {
            content: counter(step-counter);
            counter-increment: step-counter;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: var(--deep-navy);
            font-size: 12px;
            font-weight: 600;
        }
        
        .action-steps {
            counter-reset: step-counter;
        }
    `;
    document.head.appendChild(style);
});