'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // --- Application State ---
    let translations = {};
    let currentLang = 'en';
    let isDarkTheme = true;
    let deferredPrompt; // For PWA installation

    // --- DOM Element References ---
    const dom = {
        // Header & Controls
        appTitle: document.getElementById('app-title'),
        installPwaButton: document.getElementById('install-pwa'),
        themeToggleButton: document.getElementById('theme-toggle-btn'),
        langSelectorButton: document.getElementById('lang-selector-btn'),
        langDropdown: document.getElementById('lang-dropdown'),
        browserSupportInfo: document.getElementById('browser-support'),
        // Section Titles
        objectSubtypeTitle: document.getElementById('object-subtype-title'),
        requiredFieldsTitle: document.getElementById('required-fields-title'),
        optionalFieldsTitle: document.getElementById('optional-fields-title'),
        // Inputs & Containers
        objectSubtypeInput: document.getElementById('object-subtype'),
        propertiesContainer: document.getElementById('properties-container'),
        propertyHintText: document.getElementById('property-hint-text'),
        addPropertyButton: document.getElementById('add-property'),
        enabledCheckbox: document.getElementById('enabled-checkbox'),
        enabledSelect: document.getElementById('enabled'),
        valueInput: document.getElementById('value'),
        densityInput: document.getElementById('density'),
        nameInput: document.getElementById('name'),
        soundEnterInput: document.getElementById('sound-enter'),
        soundLoopInput: document.getElementById('sound-loop'),
        textVisitTextarea: document.getElementById('text-visit'),
        statesItemsContainer: document.getElementById('states-items'),
        addStateButton: document.getElementById('add-state'),
        // Bottom Controls
        saveFileButton: document.getElementById('save-file'),
        toggleJsonButton: document.getElementById('toggle-json'),
        jsonPreview: document.getElementById('json-preview'),
        // Templates
        stateItemTemplate: document.getElementById('state-item-template'),
        spellItemTemplate: document.getElementById('spell-item-template'),
        // Tooltips (using querySelectorAll for dynamic updates)
        tooltips: () => document.querySelectorAll('.tooltip'),
        // Dynamic remove buttons (using containers for delegation)
        statesContainer: document.getElementById('states-container'), // Parent for state removal delegation
        // Inputs that trigger updates (example, refine as needed)
        inputsForJsonUpdate: () => document.querySelectorAll('input[type="text"], input[type="number"], input[type="checkbox"], select, textarea')
    };

    // --- Initialization ---
    const init = () => {
        loadThemePreference();
        setupEventListeners();
        loadLanguage(currentLang); // Load default language and update UI
        generateManifest();
        setupPWA();
        addInitialState(); // Add the first state block
        updatePropertyRemoveButtons(); // Initialize property remove buttons visibility
        updateJsonPreview(); // Initial JSON preview
        updateSaveButtonState(); // Initial save button state
        updateAllLineBreakIndicators(); // Initial check for textareas
        updatePropertyWarnings(); // Initial check for property warnings
    };

    // --- Localization ---
    const loadLanguage = async (lang) => {
        try {
            const response = await fetch(`./lang/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load language file: ${response.status}`);
            }
            translations = await response.json();
            currentLang = lang;
            document.documentElement.lang = lang; // Set HTML lang attribute
            updateUILanguage();
        } catch (error) {
            console.error('Error loading language file:', error);
            // Fallback to English if the selected language fails
            if (lang !== 'en') {
                console.warn('Falling back to English.');
                loadLanguage('en');
            } else {
                // If English itself fails, display an error
                dom.appTitle.textContent = 'Error loading language data';
                // Provide minimal default texts
                translations = {
                    appTitle: 'Creature Bank Editor (Error)',
                    saveFile: 'Save File',
                    showJsonCode: 'Show JSON',
                    hideJsonCode: 'Hide JSON',
                    darkTheme: 'Dark Theme',
                    lightTheme: 'Light Theme',
                    currentLanguage: 'English',
                    browserSupport: 'Browser support information unavailable.',
                    objectParameters: 'Object Parameters',
                    requiredFields: 'Required Fields',
                    optionalFields: 'Optional Fields',
                    addProperty: 'Add Property',
                    addState: 'Add State',
                    addSpell: '+',
                    installPwa: 'Install App',
                    propertyHintFormat: 'Format: name.def [8 groups of numbers separated by spaces]',
                    propertyHintExample: 'Example: CBname.def 100011111 01000000 000000100 000000100 16 13 1 0',
                    propertyWarningMismatch: 'The 5th number must match object type (16) and the 6th number must match object subtype',
                    helpTexts: {} // Add minimal fallbacks if needed
                };
                updateUILanguage(); // Apply fallback texts
            }
        }
    };

    const updateUILanguage = () => {
        if (!translations) return; // Don't run if translations aren't loaded

        const setText = (element, text) => {
            if (element && text) element.textContent = text;
        };

        const setHtml = (element, html) => {
            if (element && html) element.innerHTML = html;
        };

        const setPlaceholder = (element, text) => {
            if (element && text) element.placeholder = text;
        };

        const setTitle = (element, text) => {
             if (element && text) element.title = text;
        }

        // --- Update Static Text ---
        setText(dom.appTitle, translations.appTitle);
        setText(dom.installPwaButton, translations.installPwa);
        setText(dom.themeToggleButton, isDarkTheme ? translations.darkTheme : translations.lightTheme);
        setText(dom.langSelectorButton, translations.currentLanguage);
        setText(dom.browserSupportInfo, translations.browserSupport);
        setText(dom.objectSubtypeTitle, translations.objectParameters);
        setText(dom.requiredFieldsTitle, translations.requiredFields);
        setText(dom.optionalFieldsTitle, translations.optionalFields);
        setText(dom.addPropertyButton, translations.addProperty);
        setText(dom.addStateButton, translations.addState);
        setText(dom.saveFileButton, translations.saveFile);
        setHtml(dom.propertyHintText, `${translations.propertyHintFormat || ''}<br>${translations.propertyHintExample || ''}`);
        document.getElementById('property-hint-text').textContent = translations.propertyHint;

        const isJsonPreviewVisible = dom.jsonPreview.classList.contains('show');
        setText(dom.toggleJsonButton, isJsonPreviewVisible ? translations.hideJsonCode : translations.showJsonCode);

        // --- Update Tooltips ---
        // Tooltips loaded via specific IDs
        const updateTooltipContent = (id, translationKey) => {
            const element = document.getElementById(id);
            if (element && translations.helpTexts?.[translationKey]) {
                element.textContent = translations.helpTexts[translationKey];
            }
        };

        updateTooltipContent('help-objectType', 'objectType');
        updateTooltipContent('help-objectSubtype', 'objectSubtype');
        updateTooltipContent('help-properties', 'properties');
        updateTooltipContent('help-enabled', 'enabled');
        updateTooltipContent('help-value', 'value');
        updateTooltipContent('help-density', 'density');
        updateTooltipContent('help-name', 'name');
        updateTooltipContent('help-sound', 'sound');
        updateTooltipContent('help-soundEnter', 'soundEnter');
        updateTooltipContent('help-soundLoop', 'soundLoop');
        updateTooltipContent('help-text', 'text');
        updateTooltipContent('help-textVisit', 'textVisit');
        updateTooltipContent('help-states', 'states');

        // Update tooltips within templates (these are accessed when cloning)
        // The data-translate-id attribute will be used when cloning templates
        // We also update any *existing* dynamic tooltips
        document.querySelectorAll('[data-translate-id]').forEach(el => {
            const key = el.getAttribute('data-translate-id');
            if (translations.helpTexts?.[key]) {
                el.textContent = translations.helpTexts[key];
            }
        });

        // --- Update Dynamic Elements (like add spell buttons inside states) ---
        document.querySelectorAll('.add-spell').forEach(button => {
             setText(button, translations.addSpell || '+');
        });

         // Update property warning titles
        document.querySelectorAll('.property-warning').forEach(icon => {
            setTitle(icon, translations.propertyWarningMismatch);
        });

        // Update placeholders
        setPlaceholder(dom.soundEnterInput, translations.soundPlaceholder || 'filename.wav');
        setPlaceholder(dom.soundLoopInput, translations.soundPlaceholder || 'filename.wav');
        setPlaceholder(dom.textVisitTextarea, translations.textVisitPlaceholder || 'Welcome message...');
        // Placeholders inside dynamic elements are set during cloning

        // Update spellFlags dropdown options
        document.querySelectorAll('.flags-checkbox-container').forEach(container => {
            // Clear existing checkboxes
            container.innerHTML = '';
            
            // Add checkboxes from translations
            if (translations.spellFlags) {
                Object.keys(translations.spellFlags).forEach(key => {
                    const checkboxItem = document.createElement('div');
                    checkboxItem.className = 'flag-checkbox-item';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.value = key;
                    checkbox.className = 'spell-flag-checkbox';
                    checkbox.id = `flag-${key}-${Date.now()}-${Math.floor(Math.random() * 1000)}`; // Unique ID
                    
                    const label = document.createElement('label');
                    label.setAttribute('for', checkbox.id);
                    label.textContent = translations.spellFlags[key];
                    
                    checkboxItem.appendChild(checkbox);
                    checkboxItem.appendChild(label);
                    container.appendChild(checkboxItem);
                    
                    // Add event listener for each checkbox
                    checkbox.addEventListener('change', function() {
                        updateFlagsValue(this.closest('.array-item'));
                    });
                });
            }
        });

        // Update primary skills labels
        setText(document.getElementById('primary-attack-label'), translations.primarySkills?.attack || 'Attack');
        setText(document.getElementById('primary-defense-label'), translations.primarySkills?.defense || 'Defense');
        setText(document.getElementById('primary-power-label'), translations.primarySkills?.power || 'Power');
        setText(document.getElementById('primary-knowledge-label'), translations.primarySkills?.knowledge || 'Knowledge');

        // Update the translations for artifact type labels
        setText(document.getElementById('artifact-valuable-label'), translations.artifactTypes?.valuable || 'Valuable');
        setText(document.getElementById('artifact-minor-label'), translations.artifactTypes?.minor || 'Minor');
        setText(document.getElementById('artifact-major-label'), translations.artifactTypes?.major || 'Major');
        setText(document.getElementById('artifact-relic-label'), translations.artifactTypes?.relic || 'Relic');

        // Update resource fields translations
        setText(document.getElementById('resource-wood-label'), translations.resourceTypes?.wood || 'Wood');
        setText(document.getElementById('resource-ore-label'), translations.resourceTypes?.ore || 'Ore');
        setText(document.getElementById('resource-mercury-label'), translations.resourceTypes?.mercury || 'Mercury');
        setText(document.getElementById('resource-sulfur-label'), translations.resourceTypes?.sulfur || 'Sulfur');
        setText(document.getElementById('resource-crystal-label'), translations.resourceTypes?.crystal || 'Crystal');
        setText(document.getElementById('resource-gems-label'), translations.resourceTypes?.gems || 'Gems');
        setText(document.getElementById('resource-gold-label'), translations.resourceTypes?.gold || 'Gold');
        setText(document.getElementById('resource-mithril-label'), translations.resourceTypes?.mithril || 'Mithril');

        // Re-evaluate save button state as language might affect validation perception
        updateSaveButtonState();
    };

    // --- Theming ---
    const applyTheme = (theme) => {
        isDarkTheme = theme === 'dark';
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        // Update theme-color meta tags
        document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]').content = isDarkTheme ? '#1f2937' : '#f3f4f6';
        document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: light)"]').content = isDarkTheme ? '#1f2937' : '#f3f4f6';
        // Update button text (requires translations to be loaded)
        if (translations && translations.darkTheme && translations.lightTheme) {
            dom.themeToggleButton.textContent = isDarkTheme ? translations.darkTheme : translations.lightTheme;
        }
    };

    const toggleTheme = () => {
        applyTheme(isDarkTheme ? 'light' : 'dark');
    };

    const loadThemePreference = () => {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        // Use saved theme, or OS preference, or default to dark
        applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
        // ApplyTheme already sets isDarkTheme correctly
    };

    // --- UI Interaction & Event Listeners ---
    const setupEventListeners = () => {
        // Header Controls
        dom.themeToggleButton.addEventListener('click', toggleTheme);
        dom.langSelectorButton.addEventListener('click', () => {
            dom.langDropdown.classList.toggle('show');
        });
        dom.installPwaButton.addEventListener('click', handleInstallPrompt);

        // Language Selection
        dom.langDropdown.addEventListener('click', (event) => {
            if (event.target.tagName === 'BUTTON' && event.target.dataset.lang) {
                loadLanguage(event.target.dataset.lang);
                dom.langDropdown.classList.remove('show');
            }
        });

        // Close dropdown when clicking outside
        window.addEventListener('click', (event) => {
            if (!dom.langSelectorButton.contains(event.target) && !dom.langDropdown.contains(event.target)) {
                dom.langDropdown.classList.remove('show');
            }
        });

        // Core Functionality Buttons
        dom.addPropertyButton.addEventListener('click', addProperty);
        dom.addStateButton.addEventListener('click', addState);
        dom.saveFileButton.addEventListener('click', saveFile);
        dom.toggleJsonButton.addEventListener('click', toggleJsonPreview);

        // Input changes triggering JSON update and validation
        // Using event delegation on a common ancestor (e.g., main container)
        const editorContainer = document.querySelector('.editor-container');
        if (editorContainer) {
            editorContainer.addEventListener('input', handleInputChange);
            editorContainer.addEventListener('change', handleInputChange); // For select & checkbox
            editorContainer.addEventListener('blur', handleInputBlur, true); // For validation on blur
        } else {
            console.error("Editor container not found for event delegation.");
        }


        // Dynamic element removal using event delegation
        dom.propertiesContainer.addEventListener('click', handleRemoveClick);
        dom.statesItemsContainer.addEventListener('click', handleRemoveClick);
        // Delegation for spell removal needs to be attached to statesItemsContainer as well
        dom.statesItemsContainer.addEventListener('click', handleSpellRemoveClick);
        // Delegation for adding spells within states
        dom.statesItemsContainer.addEventListener('click', handleAddSpellClick);


        // Optional Field Toggling (using delegation on a container)
        if (editorContainer) {
            editorContainer.addEventListener('change', handleOptionalFieldToggle);
        }

        // Textarea resize handling
        dom.textVisitTextarea.addEventListener('mouseup', () => updateLineBreakIndicators(dom.textVisitTextarea));
        dom.textVisitTextarea.addEventListener('input', () => updateLineBreakIndicators(dom.textVisitTextarea));

        // Make sure we update property warnings when subtype changes
        dom.objectSubtypeInput.addEventListener('input', () => {
            updatePropertyWarnings();
        });

        // Add validation for morale and luck inputs
        dom.statesItemsContainer.addEventListener('input', (event) => {
            const target = event.target;
            if (target.classList.contains('state-morale-input') || 
                target.classList.contains('state-luck-input')) {
                
                // Ensure value is within -3 to 3 range
                if (target.value !== '') {
                    const value = parseInt(target.value);
                    if (!isNaN(value)) {
                        if (value < -3) target.value = -3;
                        if (value > 3) target.value = 3;
                    }
                }
            }
        });

        // Add validation for spellPoints and experience inputs
        dom.statesItemsContainer.addEventListener('input', (event) => {
            const target = event.target;

            if (target.classList.contains('state-spellPoints-input')) {
                // Ensure value is within 0 to 999 range
                if (target.value !== '') {
                    const value = parseInt(target.value);
                    if (!isNaN(value)) {
                        if (value < 0) target.value = 0;
                        if (value > 999) target.value = 999;
                    }
                }
            }

            if (target.classList.contains('state-experience-input')) {
                // Ensure value is within 0 to 2,147,483,647 range
                if (target.value !== '') {
                    const value = parseInt(target.value);
                    if (!isNaN(value)) {
                        if (value < 0) target.value = 0;
                        if (value > 2147483647) target.value = 2147483647;
                    }
                }
            }
        });

        // Handle spell type radio button changes
        dom.statesItemsContainer.addEventListener('change', (event) => {
            const target = event.target;
            if (target.classList.contains('spell-type-radio')) {
                const spellItem = target.closest('.array-item');
                if (!spellItem) return;

                const selectedType = target.value;
                const idContainer = spellItem.querySelector('.spell-id-container');
                const bitsContainer = spellItem.querySelector('.spell-bits-container');
                const bitsSubContainers = spellItem.querySelectorAll('.spell-bits-flags-container, .spell-bits-levels-container, .spell-bits-schools-container');

                // Enable/disable containers based on selection
                if (selectedType === 'id') {
                    idContainer.classList.remove('disabled');
                    bitsContainer.classList.add('disabled');
                    bitsSubContainers.forEach(container => container.classList.add('disabled'));
                } else { // bits selected
                    idContainer.classList.add('disabled');
                    bitsContainer.classList.remove('disabled');
                    bitsSubContainers.forEach(container => container.classList.remove('disabled'));
                }
                
                updateJsonPreview();
            }
        });

        // Add delegation for flag checkbox changes
        dom.statesItemsContainer.addEventListener('change', (event) => {
            const target = event.target;
            if (target.classList.contains('spell-flag-checkbox')) {
                const spellItem = target.closest('.array-item');
                if (spellItem) {
                    updateFlagsValue(spellItem);
                }
            }
        });

        // Add event listener for level checkboxes
        dom.statesItemsContainer.addEventListener('change', (event) => {
            if (event.target.classList.contains('spell-level-checkbox')) {
                const spellItem = event.target.closest('.array-item');
                if (spellItem) {
                    updateLevelsValue(spellItem);
                }
            }
        });

        // Add event listener for school checkboxes
        dom.statesItemsContainer.addEventListener('change', (event) => {
            if (event.target.classList.contains('spell-school-checkbox')) {
                const spellItem = event.target.closest('.array-item');
                if (spellItem) {
                    updateSchoolsValue(spellItem);
                }
            }
        });

        // Add validation for primary skills inputs
        dom.statesItemsContainer.addEventListener('input', (event) => {
            const target = event.target;
            if (target.classList.contains('state-skills-primary-attack') || 
                target.classList.contains('state-skills-primary-defense') || 
                target.classList.contains('state-skills-primary-power') || 
                target.classList.contains('state-skills-primary-knowledge')) {
                
                // Ensure value is within 0 to 127 range
                if (target.value !== '') {
                    const value = parseInt(target.value);
                    if (!isNaN(value)) {
                        if (value < 0) target.value = 0;
                        if (value > 127) target.value = 127;
                    }
                }
            }
        });

        // Add validation for artifact type counts inputs
        dom.statesItemsContainer.addEventListener('input', (event) => {
            const target = event.target;
            if (target.classList.contains('state-artifactTypeCounts-valuable') || 
                target.classList.contains('state-artifactTypeCounts-minor') || 
                target.classList.contains('state-artifactTypeCounts-major') || 
                target.classList.contains('state-artifactTypeCounts-relic')) {
                
                // Ensure value is within 0 to 127 range
                if (target.value !== '') {
                    const value = parseInt(target.value);
                    if (!isNaN(value)) {
                        if (value < 0) target.value = 0;
                        if (value > 127) target.value = 127;
                    }
                }
            }
        });

        // Add validation for resource inputs
        dom.statesItemsContainer.addEventListener('input', (event) => {
            const target = event.target;
            if (target.classList.contains('state-resources-wood') || 
                target.classList.contains('state-resources-ore') || 
                target.classList.contains('state-resources-mercury') || 
                target.classList.contains('state-resources-sulfur') || 
                target.classList.contains('state-resources-crystal') || 
                target.classList.contains('state-resources-gems') || 
                target.classList.contains('state-resources-gold') || 
                target.classList.contains('state-resources-mithril')) {
                
                // Ensure value is within 0 to 2,147,483,647 range
                if (target.value !== '') {
                    const value = parseInt(target.value);
                    if (!isNaN(value)) {
                        if (value < 0) target.value = 0;
                        if (value > 2147483647) target.value = 2147483647;
                    }
                }
            }
        });

        // Add validation for upgrade and chance inputs (percentage values)
        dom.statesItemsContainer.addEventListener('input', (event) => {
            const target = event.target;
            if (target.classList.contains('state-upgrade-input') || 
                target.classList.contains('state-chance-input')) {
                
                // Ensure value is within 0 to 100 range (percentage)
                if (target.value !== '') {
                    const value = parseInt(target.value);
                    if (!isNaN(value)) {
                        if (value < 0) target.value = 0;
                        if (value > 100) target.value = 100;
                    }
                }
            }
        });

        // Add validation for creature reward inputs
        dom.statesItemsContainer.addEventListener('input', (event) => {
            const target = event.target;
            
            // Handle creatureRewardType validation and dependency
            if (target.classList.contains('state-creatureRewardType-input')) {
                // Ensure value is within -1 to 999 range
                if (target.value !== '') {
                    const value = parseInt(target.value);
                    if (!isNaN(value)) {
                        if (value < -1) target.value = -1;
                        if (value > 999) target.value = 999;
                        
                        // Find the related count input and container
                        const stateItem = target.closest('.state-item');
                        const countContainer = stateItem.querySelector('.creature-reward-count');
                        const countInput = stateItem.querySelector('.state-creatureRewardCount-input');
                        
                        if (countContainer && countInput) {
                            if (value === -1) {
                                // When type is -1, count must be 0 and disabled
                                countInput.value = '0';
                                countInput.disabled = true;
                                countContainer.classList.add('disabled');
                            } else {
                                // Enable count input for any other type value
                                countInput.disabled = false;
                                countContainer.classList.remove('disabled');
                            }
                        }
                    }
                }
            }
            
            // Handle creatureRewardCount validation
            if (target.classList.contains('state-creatureRewardCount-input')) {
                // Ensure value is within 0 to 127 range
                if (target.value !== '') {
                    const value = parseInt(target.value);
                    if (!isNaN(value)) {
                        if (value < 0) target.value = 0;
                        if (value > 127) target.value = 127;
                        
                        // Check if type is -1, enforce count = 0
                        const stateItem = target.closest('.state-item');
                        const typeInput = stateItem.querySelector('.state-creatureRewardType-input');
                        if (typeInput && typeInput.value === '-1') {
                            target.value = '0';
                        }
                    }
                }
            }
        });

        // Add validation and dependencies for guardian fields
        dom.statesItemsContainer.addEventListener('input', (event) => {
            const target = event.target;
            
            // Handle guardian type validation and dependency logic
            if (target.classList.contains('state-guardians-type-1') || 
                target.classList.contains('state-guardians-type-2') || 
                target.classList.contains('state-guardians-type-3') || 
                target.classList.contains('state-guardians-type-4') || 
                target.classList.contains('state-guardians-type-5') || 
                target.classList.contains('state-guardians-type-6') || 
                target.classList.contains('state-guardians-type-7')) {
                
                // Extract slot number from class name
                const slotMatch = target.className.match(/state-guardians-type-(\d+)/);
                if (!slotMatch) return;
                
                const slotNum = slotMatch[1];
                const stateItem = target.closest('.state-item');
                const countInput = stateItem.querySelector(`.state-guardians-count-${slotNum}`);
                
                if (!countInput) return;
                
                // Ensure value is within -1 to 999 range
                if (target.value !== '') {
                    const value = parseInt(target.value);
                    if (!isNaN(value)) {
                        if (value < -1) target.value = -1;
                        if (value > 999) target.value = 999;
                        
                        // If type is -1, count must be 0
                        if (value === -1) {
                            countInput.value = '0';
                            countInput.disabled = true;
                        } else {
                            countInput.disabled = false;
                        }
                    }
                }
            }
            
            // Handle guardian count validation
            if (target.classList.contains('state-guardians-count-1') || 
                target.classList.contains('state-guardians-count-2') || 
                target.classList.contains('state-guardians-count-3') || 
                target.classList.contains('state-guardians-count-4') || 
                target.classList.contains('state-guardians-count-5') || 
                target.classList.contains('state-guardians-count-6') || 
                target.classList.contains('state-guardians-count-7')) {
                
                // Extract slot number from class name
                const slotMatch = target.className.match(/state-guardians-count-(\d+)/);
                if (!slotMatch) return;
                
                const slotNum = slotMatch[1];
                const stateItem = target.closest('.state-item');
                const typeInput = stateItem.querySelector(`.state-guardians-type-${slotNum}`);
                
                if (!typeInput) return;
                
                // Ensure value is within 0 to 2,147,483,647 range
                if (target.value !== '') {
                    const value = parseInt(target.value);
                    if (!isNaN(value)) {
                        if (value < 0) target.value = 0;
                        if (value > 2147483647) target.value = 2147483647;
                        
                        // If type is -1, force count to be 0
                        if (typeInput.value === '-1') {
                            target.value = '0';
                        }
                    }
                }
            }
        });

    };

    // Event Handlers
    const handleInputChange = (event) => {
        const target = event.target;
        // Update JSON for relevant input types
        if (['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) {
            // If object type or subtype changes, update all property warnings
            if (target === dom.objectSubtypeInput) {
                updatePropertyWarnings(); // Revalidate all properties when subtype changes
            }
            
            // Specific handling for property inputs
            if (target.classList.contains('property-input')) {
                validatePropertyInput(target); // Validate format immediately
                updatePropertyWarnings();
            }
            // Update main JSON preview and save button state
            updateJsonPreview();
            updateSaveButtonState();
        }
    };

     const handleInputBlur = (event) => {
         const target = event.target;
         // Validate .wav files on blur
         if (target === dom.soundEnterInput || target === dom.soundLoopInput) {
             validateWavFile(target);
         }
         // Validate property full content on blur
         if (target.classList.contains('property-input')) {
             validatePropertyInput(target, true); // Force full validation
             updatePropertyWarnings(); // Ensure warning state is correct
             updateSaveButtonState(); // Save button depends on valid properties
         }
     };

    const handleRemoveClick = (event) => {
        const removeButton = event.target.closest('button[data-remove-target]');
        if (!removeButton) return;

        const targetSelector = removeButton.dataset.removeTarget;
        const itemToRemove = removeButton.closest(`.${targetSelector}`);

        if (itemToRemove) {
            const container = itemToRemove.parentElement;
            // Prevent removing the last item in some cases (e.g., properties)
            if (container === dom.propertiesContainer && container.children.length <= 1) {
                // Optionally clear the input instead of removing
                const input = itemToRemove.querySelector('input');
                if (input) input.value = '';
                console.warn("Cannot remove the last property item. Cleared instead.");
                updateJsonPreview();
                updateSaveButtonState();
                updatePropertyWarnings();
                return;
            }

            itemToRemove.remove();

            // Renumber if necessary (only for states)
            if (container === dom.statesItemsContainer) {
                renumberStates();
                // Enable add button if below max
                dom.addStateButton.disabled = container.children.length >= 4;
            }

            updatePropertyRemoveButtons(); // Update remove buttons visibility after removal
            updateJsonPreview();
            updateSaveButtonState();
            updatePropertyWarnings(); // Update warnings if a property was removed
        }
    };

    const handleSpellRemoveClick = (event) => {
        const removeButton = event.target.closest('.remove-spell[data-remove-target="array-item"]');
        if (!removeButton) return;

        const spellItem = removeButton.closest('.array-item');
        const spellsContainer = spellItem?.parentElement;
        const addSpellButton = spellsContainer?.parentElement?.querySelector('.add-spell');


        if (spellItem) {
            spellItem.remove();
            // Re-enable the corresponding add spell button if it exists
            if (addSpellButton) {
                const currentSpells = spellsContainer.querySelectorAll('.array-item').length;
                 addSpellButton.disabled = currentSpells >= 4;
            }
            updateJsonPreview();
             // No need to update save state unless spell validity was critical
        }
    };

    const handleAddSpellClick = (event) => {
         const addSpellButton = event.target.closest('.add-spell');
         if (!addSpellButton) return;

         const stateItem = addSpellButton.closest('.state-item');
         if (stateItem) {
             addSpellToState(stateItem);
         }
     };

    const handleOptionalFieldToggle = (event) => {
        const checkbox = event.target;
        if (checkbox.type !== 'checkbox' || !checkbox.dataset.controls) return;

        const controlledIds = checkbox.dataset.controls.split(' ');
        const isChecked = checkbox.checked;

        controlledIds.forEach(id => {
            // Find the container relative to the checkbox OR by ID globally
            const container = checkbox.closest('.field-group, .state-item')?.querySelector(`.${id}`) || document.getElementById(id);

            if (container) {
                if (isChecked) {
                    container.classList.remove('disabled');
                    // Special handling for enabling 'enabled' field
                    if (checkbox.id === 'enabled-checkbox') {
                        // Set defaults only if inputs are currently empty
                        if (!dom.valueInput.value) dom.valueInput.value = '2000';
                        if (!dom.densityInput.value) dom.densityInput.value = '100';
                    }
                } else {
                    container.classList.add('disabled');
                     // Special handling for disabling 'enabled' field
                    if (checkbox.id === 'enabled-checkbox') {
                        dom.valueInput.value = '';
                        dom.densityInput.value = '';
                    }
                }
            } else {
                console.warn(`Container with ID/Class '${id}' not found for checkbox control.`);
            }
        });

        updateJsonPreview();
        updateSaveButtonState(); // State of 'enabled' affects requirements
    };

    const toggleJsonPreview = () => {
        const isVisible = dom.jsonPreview.classList.toggle('show');
        dom.toggleJsonButton.textContent = isVisible ? translations.hideJsonCode : translations.showJsonCode;
        if (isVisible) {
            updateJsonPreview(); // Ensure preview is up-to-date when shown
        }
    };

    // --- Dynamic Field Management (Properties, States, Spells) ---

    // Properties
    const addProperty = () => {
        const propertyItem = document.createElement('div');
        propertyItem.className = 'property-item';

        const inputId = `property-${dom.propertiesContainer.children.length}`;

        // Warning icon placeholder (will be added by updatePropertyWarnings if needed)
        propertyItem.innerHTML = `
            <input type="text" class="property-input" id="${inputId}">
            <button class="remove-property" data-remove-target="property-item">-</button>
        `;

        dom.propertiesContainer.appendChild(propertyItem);
        // Event listeners are handled by delegation, no need to add here explicitly
        updatePropertyRemoveButtons(); // Update remove buttons visibility
        updateJsonPreview();
    };

    // States
    const addInitialState = () => {
        // Only add if no states exist
        if (dom.statesItemsContainer.children.length === 0) {
            addState();
        } else {
            // Initialize dependencies for existing states
            dom.statesItemsContainer.querySelectorAll('.state-item').forEach(stateItem => {
                initCreatureRewardDependencies(stateItem);
                initGuardianFieldDependencies(stateItem); // Add this line
            });
        }
    }

    const addState = () => {
        const statesCount = dom.statesItemsContainer.children.length;
        if (statesCount >= 4) return; // Max 4 states

        const template = dom.stateItemTemplate.content.cloneNode(true);
        const newStateItem = template.querySelector('.state-item');

        // Update state number display
        newStateItem.querySelector('.state-number').textContent = statesCount + 1;

        // Set initial state (disabled checkboxes, empty inputs) - handled by template and CSS
        // Set translated text for tooltips and buttons within the template
        newStateItem.querySelectorAll('[data-translate-id]').forEach(el => {
             const key = el.getAttribute('data-translate-id');
             if (key === 'addSpell' && translations.addSpell) {
                 el.textContent = translations.addSpell;
             } else if (translations.helpTexts?.[key]) {
                 el.textContent = translations.helpTexts[key];
             }
         });

        // Add the first default (empty) spell structure
        addSpellToState(newStateItem, false); // Add spell but don't update JSON yet

        dom.statesItemsContainer.appendChild(newStateItem);

        // Disable add button if max reached
        dom.addStateButton.disabled = dom.statesItemsContainer.children.length >= 4;

        // Initialize dependencies after adding to DOM
        initCreatureRewardDependencies(newStateItem);
        initGuardianFieldDependencies(newStateItem); // Add this line

        updateJsonPreview(); // Update JSON after adding
    };

    const renumberStates = () => {
        const stateItems = dom.statesItemsContainer.querySelectorAll('.state-item');
        stateItems.forEach((item, index) => {
            item.querySelector('.state-number').textContent = index + 1;
            // IDs don't strictly need renumbering if using relative selectors/delegation
        });
        // Update JSON preview after renumbering if state order matters in JSON
        updateJsonPreview();
    };

    // Spells
    const addSpellToState = (stateItemElement, triggerJsonUpdate = true) => {
        const spellsContainer = stateItemElement.querySelector('.state-spells-items');
        if (!spellsContainer) return;

        const spellsCount = spellsContainer.querySelectorAll('.array-item').length;
        if (spellsCount >= 4) return; // Max 4 spells per state

        const template = dom.spellItemTemplate.content.cloneNode(true);
        const newSpellItem = template.querySelector('.array-item');

        // Generate a unique ID for this spell instance
        const spellUniqueId = `spell-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Update radio button names to be unique per spell
        const radioButtons = newSpellItem.querySelectorAll('.spell-type-radio');
        radioButtons.forEach(radio => {
            radio.name = `spell-type-${spellUniqueId}`;
        });

        // Set translated text for tooltips within the template
        newSpellItem.querySelectorAll('[data-translate-id]').forEach(el => {
            const key = el.getAttribute('data-translate-id');
            if (translations.helpTexts?.[key]) {
                el.textContent = translations.helpTexts[key];
            }
        });

        // Make sure radio buttons are initialized correctly (ID selected by default)
        const idRadio = newSpellItem.querySelector('.spell-type-radio[value="id"]');
        if (idRadio) {
            idRadio.checked = true;
            // Make sure the correct container is enabled
            const idContainer = newSpellItem.querySelector('.spell-id-container');
            const bitsContainer = newSpellItem.querySelector('.spell-bits-container');
            const bitsSubContainers = newSpellItem.querySelectorAll('.spell-bits-flags-container, .spell-bits-levels-container, .spell-bits-schools-container');
            
            if (idContainer) idContainer.classList.remove('disabled');
            if (bitsContainer) bitsContainer.classList.add('disabled');
            if (bitsSubContainers.length > 0) {
                bitsSubContainers.forEach(container => container.classList.add('disabled'));
            }
        }

        spellsContainer.appendChild(newSpellItem);

        // Disable the corresponding 'Add Spell' button if max is reached
        const addSpellButton = stateItemElement.querySelector('.add-spell');
        if (addSpellButton) {
            addSpellButton.disabled = spellsContainer.querySelectorAll('.array-item').length >= 4;
        }

        // After adding the new spell item to the DOM, populate flags checkboxes
        if (translations && translations.spellFlags) {
            const flagsContainer = newSpellItem.querySelector('.flags-checkbox-container');
            if (flagsContainer) {
                // Clear container
                flagsContainer.innerHTML = '';
                
                // Add checkboxes from translations
                Object.keys(translations.spellFlags).forEach(key => {
                    const checkboxItem = document.createElement('div');
                    checkboxItem.className = 'flag-checkbox-item';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.value = key;
                    checkbox.className = 'spell-flag-checkbox';
                    checkbox.id = `flag-${key}-${Date.now()}-${Math.floor(Math.random() * 1000)}`; // Unique ID
                    
                    const label = document.createElement('label');
                    label.setAttribute('for', checkbox.id);
                    label.textContent = translations.spellFlags[key];
                    
                    checkboxItem.appendChild(checkbox);
                    checkboxItem.appendChild(label);
                    flagsContainer.appendChild(checkboxItem);
                    
                    // Add event listener for each checkbox
                    checkbox.addEventListener('change', function() {
                        updateFlagsValue(this.closest('.array-item'));
                    });
                });
            }
        }

        if (triggerJsonUpdate) {
            updateJsonPreview();
        }
    };

    // Function to hide/show remove buttons for properties based on count
    const updatePropertyRemoveButtons = () => {
        const propertyItems = dom.propertiesContainer.querySelectorAll('.property-item');
        const showRemoveButtons = propertyItems.length > 1;
        
        propertyItems.forEach(item => {
            const removeButton = item.querySelector('.remove-property');
            if (removeButton) {
                removeButton.style.display = showRemoveButtons ? 'block' : 'none';
            }
        });
    };

    // --- Validation ---
    const validateRequiredFields = () => {
        const subtype = dom.objectSubtypeInput.value.trim();
        if (subtype === '' || isNaN(parseInt(subtype))) return false;

        // Check properties: At least one non-empty and valid property
        const propertyInputs = dom.propertiesContainer.querySelectorAll('.property-input');
        const hasValidProperty = Array.from(propertyInputs).some(input => {
            const value = input.value.trim();
            return value !== '' && validateProperty(value);
        });
        if (!hasValidProperty) return false;

        // Check value and density ONLY if 'enabled' is checked
        if (dom.enabledCheckbox.checked) {
            const value = dom.valueInput.value.trim();
            const density = dom.densityInput.value.trim();
            if (value === '' || isNaN(parseInt(value)) || density === '' || isNaN(parseInt(density))) {
                return false;
            }
        }

        return true; // All required conditions met
    };

    const updateSaveButtonState = () => {
        dom.saveFileButton.disabled = !validateRequiredFields();
    };

    const validateProperty = (propertyValue) => {
        // Format: name.def [8 groups of numbers separated by spaces]
        // Allows any characters for name, requires .def extension, followed by exactly 8 space-separated numbers.
        const regex = /^.+\.def(\s+-?\d+){8}$/; // Allow negative numbers too
        return regex.test(propertyValue);
    };

     const validatePropertyTypeSubtype = (propertyValue) => {
         if (!validateProperty(propertyValue)) return false;

         const parts = propertyValue.split(/\s+/);
         // parts[0] is "name.def", indices 1-8 are the numbers
         // The 5th number is at index 5, 6th number is at index 6
         if (parts.length < 7) return false; // Should not happen if validateProperty passed

         const typeValue = parts[5];
         const subtypeValue = parts[6];

         const objectType = "16"; // Fixed value
         const objectSubtype = dom.objectSubtypeInput.value;

         // Return both validation results to show more specific warnings
         return {
             typeMatches: typeValue === objectType,
             subtypeMatches: subtypeValue === objectSubtype,
             isValid: typeValue === objectType && subtypeValue === objectSubtype
         };
     };

     const validatePropertyInput = (inputElement, checkContent = false) => {
         const value = inputElement.value.trim();
         let isValid = true;

         if (value !== '') {
             isValid = validateProperty(value);
             if (isValid && checkContent) { // Only check type/subtype match on blur/full validation
                 // No separate validation needed here as updatePropertyWarnings handles it
             }
         }

         if (isValid) {
             inputElement.classList.remove('invalid-input');
         } else if (value !== '') { // Only mark non-empty invalid inputs
             inputElement.classList.add('invalid-input');
         }
         // Don't automatically add warning icon here, let updatePropertyWarnings handle it
     };


     const updatePropertyWarnings = () => {
         dom.propertiesContainer.querySelectorAll('.property-item').forEach(item => {
             const input = item.querySelector('.property-input');
             let warningIcon = item.querySelector('.property-warning');

             if (input && input.value.trim() !== '') {
                 const isValidFormat = validateProperty(input.value.trim());
                 
                 if (isValidFormat) {
                     // Check both type and subtype for specific warnings
                     const validationResult = validatePropertyTypeSubtype(input.value.trim());
                     
                     if (!validationResult.isValid) {
                         // Valid format, but type/subtype mismatch - SHOW warning
                         if (!warningIcon) {
                             warningIcon = document.createElement('span');
                             warningIcon.className = 'property-warning';
                             warningIcon.innerHTML = '⚠️';
                             
                             // Create a more specific warning message
                             let warningMsg = translations.propertyWarning || 'Type/Subtype mismatch';
                             
                             // Add which specific value is mismatched if detailed validation is available
                             if (typeof validationResult !== 'boolean') {
                                 if (!validationResult.typeMatches && !validationResult.subtypeMatches) {
                                     warningMsg = 'Both type (5th value) and subtype (6th value) mismatch';
                                 } else if (!validationResult.typeMatches) {
                                     warningMsg = 'Type (5th value) should be 16';
                                 } else if (!validationResult.subtypeMatches) {
                                     warningMsg = `Subtype (6th value) should match "${dom.objectSubtypeInput.value}"`;
                                 }
                             }
                             
                             warningIcon.title = warningMsg;
                             item.insertBefore(warningIcon, input); // Insert before input
                         } else {
                             // Update existing warning message for clarity
                             let warningMsg = translations.propertyWarning || 'Type/Subtype mismatch';
                             
                             if (typeof validationResult !== 'boolean') {
                                 if (!validationResult.typeMatches && !validationResult.subtypeMatches) {
                                     warningMsg = 'Both type (5th value) and subtype (6th value) mismatch';
                                 } else if (!validationResult.typeMatches) {
                                     warningMsg = 'Type (5th value) should be 16';
                                 } else if (!validationResult.subtypeMatches) {
                                     warningMsg = `Subtype (6th value) should match "${dom.objectSubtypeInput.value}"`;
                                 }
                             }
                             
                             warningIcon.title = warningMsg;
                         }
                         
                         warningIcon.style.display = 'inline-flex'; // Show it
                     } else if (warningIcon) {
                         // Content matches - HIDE warning
                         warningIcon.style.display = 'none';
                     }
                 } else if (warningIcon) {
                     // Format is invalid - HIDE warning (we handle format errors separately)
                     warningIcon.style.display = 'none';
                 }
             } else if (warningIcon) {
                 // Input is empty - HIDE warning
                 warningIcon.style.display = 'none';
             }
         });
     };

    const validateWavFile = (inputElement) => {
        const value = inputElement.value.trim();
        if (value && !value.toLowerCase().endsWith('.wav')) {
            // Append .wav if missing, but allow empty input
            inputElement.value = value + '.wav';
            updateJsonPreview(); // Update JSON if value changed
        }
    };

    // --- JSON Handling ---
    const buildJsonObject = () => {
        const innerJsonObj = {};

        // --- Required: Properties ---
        const properties = [];
        dom.propertiesContainer.querySelectorAll('.property-input').forEach(input => {
            const value = input.value.trim();
            if (value && validateProperty(value)) { // Only add valid properties
                properties.push(value);
            }
        });
        innerJsonObj.properties = properties;

        // --- Optional: Object Generation (enabled, value, density) ---
        if (dom.enabledCheckbox.checked) {
            innerJsonObj.enabled = dom.enabledSelect.value === 'true';
            // Use defaults if empty or NaN, otherwise parse the value
            const parsedValue = parseInt(dom.valueInput.value);
            const parsedDensity = parseInt(dom.densityInput.value);
            innerJsonObj.value = isNaN(parsedValue) || parsedValue <= 0 ? 2000 : parsedValue;
            innerJsonObj.density = isNaN(parsedDensity) || parsedDensity <= 0 ? 100 : parsedDensity;
        }

        // --- Optional: Top Level Fields ---
        if (document.getElementById('name-checkbox').checked && dom.nameInput.value.trim()) {
            innerJsonObj.name = dom.nameInput.value.trim();
        }

        if (document.getElementById('sound-checkbox').checked) {
            const enter = dom.soundEnterInput.value.trim();
            const loop = dom.soundLoopInput.value.trim();
            if (enter || loop) {
                innerJsonObj.sound = {};
                if (enter) innerJsonObj.sound.enter = enter;
                if (loop) innerJsonObj.sound.loop = loop;
            }
        }

        if (document.getElementById('text-checkbox').checked && dom.textVisitTextarea.value.trim()) {
            innerJsonObj.text = { visit: dom.textVisitTextarea.value }; // Keep newlines
        }

        // --- Optional: States ---
        if (document.getElementById('states-checkbox').checked) {
            const stateItems = dom.statesItemsContainer.querySelectorAll('.state-item');
            if (stateItems.length > 0) {
                innerJsonObj.states = [];

                stateItems.forEach(stateElement => {
                    const stateObj = {};
                    const getCheckbox = (cls) => stateElement.querySelector(`.${cls}`);
                    const getContainer = (cls) => stateElement.querySelector(`.${cls}`);
                    const getInputValue = (cls) => getContainer(cls)?.querySelector('input, select, textarea')?.value.trim();
                    const getParsedInt = (cls, defaultValue = undefined) => {
                        const val = getInputValue(cls);
                        const parsed = parseInt(val);
                        return (val !== '' && !isNaN(parsed)) ? parsed : defaultValue;
                    };
                     const getParsedCommaIntArray = (cls, defaultValue = undefined) => {
                        const val = getInputValue(cls);
                         if (!val) return defaultValue;
                         try {
                             return val.split(',').map(v => {
                                const parsed = parseInt(v.trim());
                                return isNaN(parsed) ? (cls.includes('-type') ? -1 : 0) : parsed; // Default 0, or -1 for type arrays
                            });
                         } catch (e) {
                            return defaultValue;
                         }
                     };

                    // Process each field within the state
                    if (getCheckbox('state-morale-checkbox').checked) {
                        const morale = getParsedInt('state-morale-container');
                        if (morale !== undefined) {
                            // Ensure morale is within -3 to 3 range
                            stateObj.morale = Math.max(-3, Math.min(3, morale));
                        }
                    }
                    
                    if (getCheckbox('state-luck-checkbox').checked) {
                        const luck = getParsedInt('state-luck-container');
                        if (luck !== undefined) {
                            // Ensure luck is within -3 to 3 range
                            stateObj.luck = Math.max(-3, Math.min(3, luck));
                        }
                    }

                    if (getCheckbox('state-spellPoints-checkbox').checked) {
                        const sp = getParsedInt('state-spellPoints-container');
                         if (sp !== undefined && sp >= 0) stateObj.spellPoints = sp;
                    }
                     if (getCheckbox('state-experience-checkbox').checked) {
                        const exp = getParsedInt('state-experience-container');
                         if (exp !== undefined && exp >= 0) stateObj.experience = exp;
                    }
                    if (getCheckbox('state-artifactTypeCounts-checkbox').checked) {
                        // Get values from individual artifact type fields
                        const valuableInput = stateElement.querySelector('.state-artifactTypeCounts-valuable');
                        const minorInput = stateElement.querySelector('.state-artifactTypeCounts-minor');
                        const majorInput = stateElement.querySelector('.state-artifactTypeCounts-major');
                        const relicInput = stateElement.querySelector('.state-artifactTypeCounts-relic');
                        
                        const valuable = valuableInput && valuableInput.value !== '' ? parseInt(valuableInput.value) : 0;
                        const minor = minorInput && minorInput.value !== '' ? parseInt(minorInput.value) : 0;
                        const major = majorInput && majorInput.value !== '' ? parseInt(majorInput.value) : 0;
                        const relic = relicInput && relicInput.value !== '' ? parseInt(relicInput.value) : 0;
                        
                        // Create artifact type counts array
                        stateObj.artifactTypeCounts = [
                            isNaN(valuable) ? 0 : valuable,
                            isNaN(minor) ? 0 : minor,
                            isNaN(major) ? 0 : major,
                            isNaN(relic) ? 0 : relic
                        ];
                    }
                    if (getCheckbox('state-resources-checkbox').checked) {
                        // Get values from individual resource fields
                        const woodInput = stateElement.querySelector('.state-resources-wood');
                        const oreInput = stateElement.querySelector('.state-resources-ore');
                        const mercuryInput = stateElement.querySelector('.state-resources-mercury');
                        const sulfurInput = stateElement.querySelector('.state-resources-sulfur');
                        const crystalInput = stateElement.querySelector('.state-resources-crystal');
                        const gemsInput = stateElement.querySelector('.state-resources-gems');
                        const goldInput = stateElement.querySelector('.state-resources-gold');
                        const mithrilInput = stateElement.querySelector('.state-resources-mithril');
                        
                        const wood = woodInput && woodInput.value !== '' ? parseInt(woodInput.value) : 0;
                        const ore = oreInput && oreInput.value !== '' ? parseInt(oreInput.value) : 0;
                        const mercury = mercuryInput && mercuryInput.value !== '' ? parseInt(mercuryInput.value) : 0;
                        const sulfur = sulfurInput && sulfurInput.value !== '' ? parseInt(sulfurInput.value) : 0;
                        const crystal = crystalInput && crystalInput.value !== '' ? parseInt(crystalInput.value) : 0;
                        const gems = gemsInput && gemsInput.value !== '' ? parseInt(gemsInput.value) : 0;
                        const gold = goldInput && goldInput.value !== '' ? parseInt(goldInput.value) : 0;
                        const mithril = mithrilInput && mithrilInput.value !== '' ? parseInt(mithrilInput.value) : 0;
                        
                        // Create resources array
                        stateObj.resources = [
                            isNaN(wood) ? 0 : wood,
                            isNaN(mercury) ? 0 : mercury,
                            isNaN(ore) ? 0 : ore,
                            isNaN(sulfur) ? 0 : sulfur,
                            isNaN(crystal) ? 0 : crystal,
                            isNaN(gems) ? 0 : gems,
                            isNaN(gold) ? 0 : gold,
                            isNaN(mithril) ? 0 : mithril
                        ];
                    }
                    if (getCheckbox('state-upgrade-checkbox').checked) {
                         const upg = getParsedInt('state-upgrade-container');
                         if (upg !== undefined && upg >= 0) stateObj.upgrade = Math.min(100, upg);
                    }
                    if (getCheckbox('state-chance-checkbox').checked) {
                         const chance = getParsedInt('state-chance-container');
                         if (chance !== undefined && chance >= 0) stateObj.chance = Math.min(100, chance);
                    }

                    // Skills
                    if (getCheckbox('state-skills-checkbox').checked) {
                        // Get values from individual skill fields
                        const attackInput = stateElement.querySelector('.state-skills-primary-attack');
                        const defenseInput = stateElement.querySelector('.state-skills-primary-defense');
                        const powerInput = stateElement.querySelector('.state-skills-primary-power');
                        const knowledgeInput = stateElement.querySelector('.state-skills-primary-knowledge');
                        
                        const attack = attackInput && attackInput.value !== '' ? parseInt(attackInput.value) : 0;
                        const defense = defenseInput && defenseInput.value !== '' ? parseInt(defenseInput.value) : 0;
                        const power = powerInput && powerInput.value !== '' ? parseInt(powerInput.value) : 0;
                        const knowledge = knowledgeInput && knowledgeInput.value !== '' ? parseInt(knowledgeInput.value) : 0;
                        
                        // Create primary skills array only if at least one value is non-zero
                        if (attack > 0 || defense > 0 || power > 0 || knowledge > 0) {
                            stateObj.skills = { 
                                primary: [
                                    isNaN(attack) ? 0 : attack,
                                    isNaN(defense) ? 0 : defense,
                                    isNaN(power) ? 0 : power,
                                    isNaN(knowledge) ? 0 : knowledge
                                ] 
                            };
                        }
                    }

                    // Guardians
                    if (getCheckbox('state-guardians-checkbox').checked) {
                        // Create arrays for guardian counts and types
                        const guardianCounts = [];
                        const guardianTypes = [];
                        
                        // Collect values from individual guardian fields
                        for (let i = 1; i <= 7; i++) {
                            const countInput = stateElement.querySelector(`.state-guardians-count-${i}`);
                            const typeInput = stateElement.querySelector(`.state-guardians-type-${i}`);
                            
                            if (countInput && typeInput) {
                                const count = parseInt(countInput.value) || 0;
                                const type = parseInt(typeInput.value) || -1;
                                
                                guardianCounts.push(count);
                                guardianTypes.push(type);
                            }
                        }
                        
                        // Add to state object if arrays have values
                        if (guardianCounts.length > 0 || guardianTypes.length > 0) {
                            stateObj.guardians = {};
                            if (guardianCounts.length > 0) stateObj.guardians.count = guardianCounts;
                            if (guardianTypes.length > 0) stateObj.guardians.type = guardianTypes;
                        }
                    }

                    // Spells (nested array)
                    if (getCheckbox('state-spells-checkbox').checked) {
                        const spellItems = stateElement.querySelectorAll('.state-spells-items .array-item');
                        if (spellItems.length > 0) {
                            stateObj.spells = [];
                            spellItems.forEach(spellElement => {
                                const spellObj = {};
                                
                                // Check which radio is selected - FIX: Add null check
                                const idRadioElement = spellElement.querySelector('.spell-type-radio[value="id"]');
                                const idRadioSelected = idRadioElement ? idRadioElement.checked : false;
                                
                                if (idRadioSelected) {
                                    // Process ID - FIX: Define idInput before use
                                    const idInput = spellElement.querySelector('.spell-id-input');
                                    if (idInput && idInput.value.trim() !== '') {
                                        const id = parseInt(idInput.value.trim());
                                        if (!isNaN(id) && id >= 0 && id <= 70) spellObj.id = id;
                                    }
                                } else {
                                    // Process Bits
                                    const bits = {};
                                    const flagsValueInput = spellElement.querySelector('.spell-bits-flags-value');
                                    const levelsInput = spellElement.querySelector('.spell-bits-levels-value');
                                    const schoolsInput = spellElement.querySelector('.spell-bits-schools-value');
                                    
                                    if (flagsValueInput && flagsValueInput.value.trim() !== '') {
                                        const flags = parseInt(flagsValueInput.value.trim());
                                        if (!isNaN(flags) && flags >= 0) bits.flags = flags;
                                    }
                                    
                                    if (levelsInput && levelsInput.value.trim() !== '') {
                                        const levels = parseInt(levelsInput.value.trim());
                                        if (!isNaN(levels) && levels >= 0) bits.levels = levels;
                                    }
                                    
                                    if (schoolsInput && schoolsInput.value.trim() !== '') {
                                        const schools = parseInt(schoolsInput.value.trim());
                                        if (!isNaN(schools) && schools >= 0) bits.schools = schools;
                                    }
                                    
                                    if (Object.keys(bits).length > 0) spellObj.bits = bits;
                                }

                                // Only add spell object if it has content (id or bits)
                                if (Object.keys(spellObj).length > 0) {
                                    stateObj.spells.push(spellObj);
                                }
                            });
                            // Remove spells array if it ended up empty
                            if (stateObj.spells.length === 0) {
                                delete stateObj.spells;
                            }
                        }
                    }

                    // Handle creature reward type and count dependency
                    if (getCheckbox('state-creatureReward-checkbox').checked) {
                        const type = getParsedInt('state-creatureRewardType-container');
                        if (type !== undefined) {
                            stateObj.creatureRewardType = type; // Can be -1
                            
                            // Only add count if type is not -1
                            if (type !== -1) {
                                const count = getParsedInt('state-creatureRewardCount-container');
                                if (count !== undefined && count >= 0) {
                                    stateObj.creatureRewardCount = Math.min(127, count);
                                } else {
                                    stateObj.creatureRewardCount = 0; // Default to 0
                                }
                            } else {
                                stateObj.creatureRewardCount = 0; // Force 0 when type is -1
                            }
                        }
                    }

                    // Only add the state object if it contains any properties
                    if (Object.keys(stateObj).length > 0) {
                        innerJsonObj.states.push(stateObj);
                    }
                });

                // Remove states array if it ended up empty
                if (innerJsonObj.states.length === 0) {
                    delete innerJsonObj.states;
                }
            }
        }


        // --- Wrap in Final Structure ---
        const subtype = dom.objectSubtypeInput.value || "13"; // Default subtype if empty
        return {
            "RMG": {
                "objectGeneration": {
                    "16": { // Fixed type
                        [subtype]: innerJsonObj
                    }
                }
            }
        };
    };

    const updateJsonPreview = () => {
        try {
            const jsonObj = buildJsonObject();
            // Use null for replacer, 2 for space indentation
            const jsonString = JSON.stringify(jsonObj, null, 2);
            dom.jsonPreview.textContent = jsonString;
            dom.jsonPreview.classList.remove('invalid-json'); // Remove error state if successful
        } catch (error) {
            console.error("Error generating JSON:", error);
            dom.jsonPreview.textContent = `Error generating JSON:\n${error.message}`;
            dom.jsonPreview.classList.add('invalid-json'); // Add error state (optional styling)
        }
    };

    // --- File Saving ---
    const saveFile = () => {
        if (!validateRequiredFields()) {
            console.warn("Validation failed. Cannot save.");
            // Optionally show a user message
            return;
        }

        try {
            const jsonObj = buildJsonObject();
            const jsonString = JSON.stringify(jsonObj, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });

            const subtypeValue = dom.objectSubtypeInput.value || 'default';
            const filename = `creature_bank_type16_subtype${subtypeValue}.json`;

            // Use File System Access API if available (preferred)
             if ('showSaveFilePicker' in window) {
                 showSaveFilePicker({
                     suggestedName: filename,
                     types: [{
                         description: 'JSON Files',
                         accept: { 'application/json': ['.json'] },
                     }],
                 }).then(async (fileHandle) => {
                     const writable = await fileHandle.createWritable();
                     await writable.write(blob);
                     await writable.close();
                     console.log('File saved successfully using File System Access API.');
                 }).catch(err => {
                     // Handle errors, including user cancellation (AbortError)
                     if (err.name !== 'AbortError') {
                         console.error('Error saving file with File System Access API:', err);
                         // Fallback to legacy method if specific errors occur?
                         saveFileLegacy(blob, filename);
                     } else {
                         console.log('File save cancelled by user.');
                     }
                 });
             } else {
                 // Fallback to legacy <a> tag download method
                 saveFileLegacy(blob, filename);
             }

        } catch (error) {
            console.error("Error preparing file for saving:", error);
            // Optionally show a user message
        }
    };

    // Legacy file saving method
    const saveFileLegacy = (blob, filename) => {
         console.warn("Using legacy file save method.");
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = filename;
         document.body.appendChild(a);
         a.click();
         document.body.removeChild(a);
         URL.revokeObjectURL(url); // Clean up
         console.log('File download initiated using legacy method.');
    };


    // --- PWA Functionality ---
    const generateManifest = () => {
        // Generate manifest dynamically to easily update theme colors
        const manifestData = {
            name: "Heroes 3: ERA Objects Editor",
            short_name: "Creature Bank Editor",
            description: "JSON editor for Heroes 3: ERA creature banks",
            start_url: ".", // Relative to HTML file location
            display: "standalone",
            background_color: "#1f2937", // Default dark bg
            theme_color: isDarkTheme ? "#1f2937" : "#f3f4f6", // Match current theme
            icons: [
                { src: "./icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
                { src: "./icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
                { src: "./icon-64.png", sizes: "64x64", type: "image/png", purpose: "any" } // Optional smaller icon
            ]
        };

        const manifestString = JSON.stringify(manifestData);
        const manifestBlob = new Blob([manifestString], { type: 'application/json' });
        const manifestURL = URL.createObjectURL(manifestBlob);
        document.getElementById('manifestPlaceholder').href = manifestURL;
        // Note: Revoking this URL might cause issues if the browser needs it later. Monitor behavior.
        // URL.revokeObjectURL(manifestURL); // Potentially problematic
    };

    const setupPWA = () => {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault(); // Prevent the default mini-infobar
            deferredPrompt = e;
            dom.installPwaButton.style.display = 'block'; // Show our custom button
            console.log('`beforeinstallprompt` event was fired.');
        });

        // Optional: Track installation outcome
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            dom.installPwaButton.style.display = 'none'; // Hide button after install
            deferredPrompt = null;
        });

        // Basic Service Worker Registration (if you create a sw.js file)
        /*
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then((reg) => console.log('Service worker registered.', reg))
                .catch((err) => console.error('Service worker registration failed:', err));
        }
        */
       console.log('PWA setup complete. No service worker registered in this version.');
    };

    const handleInstallPrompt = async () => {
        if (!deferredPrompt) {
            console.log('Install prompt not available.');
            return;
        }
        dom.installPwaButton.disabled = true; // Prevent double clicks

        try {
            deferredPrompt.prompt(); // Show the browser's install dialog
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            if (outcome === 'accepted') {
                dom.installPwaButton.style.display = 'none'; // Hide button
            }
            deferredPrompt = null; // Prompt can only be used once
        } catch (error) {
            console.error('Error showing install prompt:', error);
        } finally {
             dom.installPwaButton.disabled = false; // Re-enable button if prompt failed or was dismissed
        }
    };

    // --- Text Area Utils ---
    const updateLineBreakIndicators = (textarea) => {
        if (!textarea) return;
        const container = textarea.closest('.textarea-container');
        if (!container) return;

        // Clear existing indicators
        container.querySelectorAll('.line-break-indicator').forEach(el => el.remove());

        const text = textarea.value;
        const lines = text.split('\n');

        if (lines.length <= 1) return; // No line breaks

        const computedStyle = window.getComputedStyle(textarea);
        const lineHeight = parseFloat(computedStyle.lineHeight);
        const paddingTop = parseFloat(computedStyle.paddingTop);
        const paddingLeft = parseFloat(computedStyle.paddingLeft); // Needed for accurate positioning
        const charWidth = getAverageCharWidth(textarea); // Estimate character width

        let currentTop = paddingTop;

        for (let i = 0; i < lines.length - 1; i++) {
            const indicator = document.createElement('span');
            indicator.className = 'line-break-indicator';
            indicator.textContent = '↵'; // Line break symbol

            // Calculate approximate horizontal position based on line length
            // This is an estimation and might not be perfect with variable-width fonts
            const lineLength = lines[i].length;
            const leftPos = paddingLeft + (lineLength * charWidth) + 5; // Add some buffer

            indicator.style.position = 'absolute'; // Ensure position is absolute
            indicator.style.left = `${leftPos}px`;
            indicator.style.top = `${currentTop + (lineHeight / 2) - 8}px`; // Vertically center approx

            container.appendChild(indicator);
            currentTop += lineHeight; // Move down for the next line
        }
    };

    const getAverageCharWidth = (element) => {
        // Helper to estimate character width for indicator positioning
        const context = document.createElement("canvas").getContext("2d");
        context.font = window.getComputedStyle(element).font;
        // Measure a standard character like 'm' or average over several chars
        return context.measureText("m").width;
    };

     const updateAllLineBreakIndicators = () => {
        document.querySelectorAll('.resizable-textarea').forEach(updateLineBreakIndicators);
     };

    // Function to update flags value based on selected checkboxes
    const updateFlagsValue = (spellItem) => {
        if (!spellItem) return;
        
        const checkboxes = spellItem.querySelectorAll('.spell-flag-checkbox:checked');
        const flagsValueInput = spellItem.querySelector('.spell-bits-flags-value');
        const flagsSelectedValues = spellItem.querySelector('.flags-selected-values');
        
        // Calculate the sum of selected values
        let sum = 0;
        const selectedValues = [];
        
        checkboxes.forEach(checkbox => {
            const value = parseInt(checkbox.value);
            if (!isNaN(value)) {
                sum += value;
                selectedValues.push(value);
            }
        });
        
        // Update the hidden input value
        if (flagsValueInput) {
            flagsValueInput.value = sum;
        }
        
        // Update the display of selected values
        if (flagsSelectedValues) {
            if (selectedValues.length > 1) {
                flagsSelectedValues.textContent = selectedValues.join(', ') + ` (Sum: ${sum})`;
            } else if (selectedValues.length === 1) {
                flagsSelectedValues.textContent = sum;
            } else {
                flagsSelectedValues.textContent = '0';
            }
        }
        
        // Update JSON preview
        updateJsonPreview();
    };

    const updateLevelsValue = (spellItem) => {
        const checkboxes = spellItem.querySelectorAll('.spell-level-checkbox:checked');
        const levelsValueInput = spellItem.querySelector('.spell-bits-levels-value');
        let sum = 0;

        checkboxes.forEach(checkbox => {
            const value = parseInt(checkbox.value);
            if (!isNaN(value)) {
                sum += value;
            }
        });

        if (levelsValueInput) {
            levelsValueInput.value = sum;
        }

        updateJsonPreview();
    };

    const updateSchoolsValue = (spellItem) => {
        const checkboxes = spellItem.querySelectorAll('.spell-school-checkbox:checked');
        const schoolsValueInput = spellItem.querySelector('.spell-bits-schools-value');
        let sum = 0;

        checkboxes.forEach(checkbox => {
            const value = parseInt(checkbox.value);
            if (!isNaN(value)) {
                sum += value;
            }
        });

        if (schoolsValueInput) {
            schoolsValueInput.value = sum;
        }

        updateJsonPreview();
    };

    // Add a function to initialize the creature reward dependencies when states are added
    const initCreatureRewardDependencies = (stateItem) => {
        const typeInput = stateItem.querySelector('.state-creatureRewardType-input');
        const countInput = stateItem.querySelector('.state-creatureRewardCount-input');
        const countContainer = stateItem.querySelector('.creature-reward-count');
        
        if (typeInput && countInput && countContainer) {
            // Set initial state based on type value
            if (typeInput.value === '-1') {
                countInput.value = '0';
                countInput.disabled = true;
                countContainer.classList.add('disabled');
            }
            
            // Add event listener to typeInput
            typeInput.addEventListener('change', () => {
                if (typeInput.value === '-1') {
                    countInput.value = '0';
                    countInput.disabled = true;
                    countContainer.classList.add('disabled');
                } else {
                    countInput.disabled = false;
                    countContainer.classList.remove('disabled');
                }
            });
        }
    };

    // Add a function to initialize the guardian field dependencies
    const initGuardianFieldDependencies = (stateItem) => {
        for (let i = 1; i <= 7; i++) {
            const typeInput = stateItem.querySelector(`.state-guardians-type-${i}`);
            const countInput = stateItem.querySelector(`.state-guardians-count-${i}`);
            
            if (typeInput && countInput) {
                // Set initial state based on type value
                if (typeInput.value === '-1') {
                    countInput.value = '0';
                    countInput.disabled = true;
                }
            }
        }
    };

    // --- Start the Application ---
    init();
});