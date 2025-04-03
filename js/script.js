'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // --- Application State ---
    let translations = {};
    let currentLang = 'en';
    let isDarkTheme = true;
    let deferredPrompt; // For PWA installation
    let activeStateTab = 0; // Track which state tab is active
    let activeSpellTabs = {}; // Track active spell tab for each state
    let currentGridMode = 'attackers'; // For grid selection mode
    const defendersList = [];
    const attackersList = [];
    const MAX_GRID_SELECTIONS = 7;
    const borderCells = [
        "00", "17", "34", "51", "68", "85", "102", "119", "136", "153", "170", 
        "16", "33", "50", "67", "84", "101", "118", "135", "152", "169", "186"
    ];
    
    // Define default cell positions for different isBank values
    const DEFAULT_BANK_TRUE_ATTACKERS = ['57', '61', '90', '93', '96', '125', '129'];
    const DEFAULT_BANK_TRUE_DEFENDERS = ['15', '185', '172', '02', '100', '87', '08'];
    const DEFAULT_BANK_FALSE_ATTACKERS = ['01', '35', '69', '86', '103', '137', '171'];
    const DEFAULT_BANK_FALSE_DEFENDERS = ['15', '49', '83', '100', '117', '151', '185'];
    
    // Track if we're using default values
    let usingDefaultAttackers = true;
    let usingDefaultDefenders = true;

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
        inputsForJsonUpdate: () => document.querySelectorAll('input[type="text"], input[type="number"], input[type="checkbox"], select, textarea'),
        // States Tab Elements
        statesTabsHeaders: document.getElementById('states-tabs-headers'),
        removeStateButton: document.getElementById('remove-state-btn'),
        // Troop Placement Elements
        troopPlacementCheckbox: document.getElementById('troopPlacement-checkbox'),
        troopPlacementContainer: document.getElementById('troopPlacement-container'),
        isBankSelect: document.getElementById('isBank'),
        attackersInput: document.getElementById('attackers'),
        defendersInput: document.getElementById('defenders'),
        customizeGridBtn: document.getElementById('customize-grid-btn'),
        // Grid Popup Elements
        gridPopup: document.getElementById('grid-popup'),
        gridPopupTitle: document.getElementById('grid-popup-title'),
        closeGridPopup: document.getElementById('close-grid-popup'),
        applyGrid: document.getElementById('apply-grid'),
        cancelGrid: document.getElementById('cancel-grid'),
        defendersButton: document.getElementById('defenders-button'),
        attackersButton: document.getElementById('attackers-button'),
        currentMode: document.getElementById('current-mode'),
        defendersCells: document.getElementById('defenders-cells'),
        defendersCount: document.getElementById('defenders-count'),
        attackersCells: document.getElementById('attackers-cells'),
        attackersCount: document.getElementById('attackers-count'),
        hexGrid: document.getElementById('hex-grid'),
        disabledCellsToggle: document.getElementById('disabled-cells-toggle'),
        blockedPreview: document.querySelector('.blocked-preview'),
        disabledCellsLabel: document.getElementById('disabled-cells-label')
    };

    // --- Initialization ---
    const init = () => {
        loadThemePreference();
        setupEventListeners();
        loadLanguage(currentLang); // Load default language and update UI
        setupPWA();
        addInitialState(); // Add the first state block
        updatePropertyRemoveButtons(); // Initialize property remove buttons visibility
        updateJsonPreview(); // Initial JSON preview
        updateSaveButtonState(); // Initial save button state
        updateAllLineBreakIndicators(); // Initial check for textareas
        updatePropertyWarnings(); // Initial check for property warnings
        initializeSpellTabs(); // Initialize spell tabs for any existing states
        initializeButtonStates(); // Initialize button states based on checkboxes
        initGridPopup(); // Initialize grid popup functionality
        initializeDefaultTroopPlacements(); // Initialize default troop placements
        updateCustomDefWarnings(); // Initialize customDef warnings
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
        updateTooltipContent('help-troopPlacement', 'troopPlacement');
        updateTooltipContent('help-isBank', 'isBank');
        updateTooltipContent('help-attackers', 'attackers');
        updateTooltipContent('help-defenders', 'defenders');

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
        setText(document.getElementById('artifact-treasure-label'), translations.artifactTypes?.treasure || 'treasure');
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
        
        // Update "Add Spell" and "Remove Spell" buttons
        document.querySelectorAll('.add-spell-btn').forEach(button => {
            setText(button, translations.addSpell || 'Add Spell');
        });
        
        document.querySelectorAll('.remove-spell-btn').forEach(button => {
            setText(button, translations.removeSpell || 'Remove Spell');
        });

        // Update grid popup translations
        updateGridTranslations();
    };

    // --- Theming ---
    const applyTheme = (theme) => {
        isDarkTheme = theme === 'dark';
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        // Update theme-color meta tags
        document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]').content = isDarkTheme ? '#1f2937' : '#f3f4f6';
        document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: light)"]').content = isDarkTheme ? '#1f2937' : '#f3f4f6';
        // Update manifest theme color
        updateManifestThemeColor();
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
            if (target.classList.contains('state-artifactTypeCounts-treasure') || 
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

        // Add validation for artifactIds inputs
        dom.statesItemsContainer.addEventListener('input', (event) => {
            const target = event.target;
            if (target.classList.contains('state-artifactIds-1') || 
                target.classList.contains('state-artifactIds-2') || 
                target.classList.contains('state-artifactIds-3') || 
                target.classList.contains('state-artifactIds-4')) {
                
                // Ensure value is within -1 to 1023 range
                if (target.value !== '') {
                    const value = parseInt(target.value);
                    if (!isNaN(value)) {
                        if (value < -1) target.value = -1;
                        if (value > 1023) target.value = 1023;
                    }
                }
            }
        });

        // State tab handling
        dom.statesTabsHeaders.addEventListener('click', handleTabClick);
        dom.removeStateButton.addEventListener('click', removeActiveState);

        // Delegation for spell tab handling
        dom.statesItemsContainer.addEventListener('click', handleSpellTabClick);
        dom.statesItemsContainer.addEventListener('click', handleAddSpellBtnClick);
        dom.statesItemsContainer.addEventListener('click', handleRemoveSpellBtnClick);

        // Grid popup event listeners
        dom.customizeGridBtn.addEventListener('click', openGridPopup);
        dom.closeGridPopup.addEventListener('click', closeGridPopup);
        dom.applyGrid.addEventListener('click', applyGridSelections);
        dom.cancelGrid.addEventListener('click', closeGridPopup);
        dom.defendersButton.addEventListener('click', () => switchGridMode('defenders'));
        dom.attackersButton.addEventListener('click', () => switchGridMode('attackers'));
        dom.disabledCellsToggle.addEventListener('change', toggleDisabledCellsStyle);
        
        // Close grid popup when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === dom.gridPopup) {
                closeGridPopup();
            }
        });

        // Add event listener for isBank select changes
        dom.isBankSelect.addEventListener('change', () => {
            // Always reset to defaults when isBank changes
            usingDefaultAttackers = true;
            usingDefaultDefenders = true;
            
            // Clear existing lists
            attackersList.length = 0;
            defendersList.length = 0;
            
            // Get new default values based on isBank
            const isBank = dom.isBankSelect.value === 'true';
            attackersList.push(...getDefaultAttackers(isBank));
            defendersList.push(...getDefaultDefenders(isBank));
            
            // Update UI if grid popup is open
            if (dom.gridPopup.style.display === 'block') {
                refreshCellDisplay();
                updateGridSelectionDisplay();
                updateGridUiBasedOnIsBank(isBank);
            }
            
            // Update input fields and JSON
            updateTroopPlacementInputs();
            updateJsonPreview();
        });

        // Add listener for customDef checkbox changes to trigger warnings check
        if (editorContainer) {
            editorContainer.addEventListener('change', (event) => {
                if (event.target.classList.contains('state-customDef-checkbox')) {
                    updateCustomDefWarnings();
                }
            });
            
            // Add listener for customDef input changes
            editorContainer.addEventListener('input', (event) => {
                if (event.target.classList.contains('state-customDef-input')) {
                    updateCustomDefWarnings();
                }
            });
        }
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
         // Validate .def files on blur
         if (target.classList.contains('state-customDef-input')) {
             validateDefFile(target);
             updateCustomDefWarnings(); // Check consistency across states
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
        // Don't handle state-item removal here anymore - it's handled by removeActiveState
        if (targetSelector === 'state-item') return;

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

        // Handle state buttons when states checkbox is toggled
        if (checkbox.id === 'states-checkbox') {
            updateStateButtonsState(isChecked);
            // Check customDef warnings when states are toggled
            if (isChecked) {
                updateCustomDefWarnings();
            }
        }

        // Handle spell buttons when spells checkbox is toggled
        if (checkbox.classList.contains('state-spells-checkbox')) {
            const stateItem = checkbox.closest('.state-item');
            if (stateItem) {
                updateSpellButtonsState(stateItem, isChecked);
            }
        }

        // Handle customDef checkboxes - update warnings
        if (checkbox.classList.contains('state-customDef-checkbox')) {
            updateCustomDefWarnings();
        }

        updateJsonPreview();
        updateSaveButtonState(); // State of 'enabled' affects requirements
    };

    // New function to update state buttons based on checkbox state
    const updateStateButtonsState = (enabled) => {
        dom.addStateButton.disabled = !enabled;
        dom.removeStateButton.disabled = !enabled || dom.statesItemsContainer.querySelectorAll('.state-item').length <= 1;
    };

    // New function to update spell buttons for a specific state
    const updateSpellButtonsState = (stateItem, enabled) => {
        const addSpellBtn = stateItem.querySelector('.add-spell-btn');
        const removeSpellBtn = stateItem.querySelector('.remove-spell-btn');
        
        if (addSpellBtn) {
            addSpellBtn.disabled = !enabled;
            // If enabled, also check the number of spells (max 4)
            if (enabled) {
                const spellsCount = stateItem.querySelectorAll('.state-spells-items .array-item').length;
                addSpellBtn.disabled = spellsCount >= 4;
            }
        }
        
        if (removeSpellBtn) {
            removeSpellBtn.disabled = !enabled || stateItem.querySelectorAll('.state-spells-items .array-item').length <= 1;
        }
    };

    // New function to initialize all button states based on checkbox states
    const initializeButtonStates = () => {
        // Initialize state buttons
        const statesCheckbox = document.getElementById('states-checkbox');
        if (statesCheckbox) {
            updateStateButtonsState(statesCheckbox.checked);
        }
        
        // Initialize spell buttons for each state
        document.querySelectorAll('.state-item').forEach(stateItem => {
            const spellsCheckbox = stateItem.querySelector('.state-spells-checkbox');
            if (spellsCheckbox) {
                updateSpellButtonsState(stateItem, spellsCheckbox.checked);
            }
        });
    };

    const toggleJsonPreview = () => {
        const isVisible = dom.jsonPreview.classList.toggle('show');
        dom.toggleJsonButton.textContent = isVisible ? translations.hideJsonCode : translations.showJsonCode;
        if (isVisible) {
            updateJsonPreview(); // Ensure preview is up-to-date when shown
        }
    };

    // --- States Tabs Management ---
    const handleTabClick = (event) => {
        const tabHeader = event.target.closest('.state-tab-header');
        if (!tabHeader) return;
        
        const tabIndex = parseInt(tabHeader.dataset.tabIndex);
        if (isNaN(tabIndex)) return;
        
        activateStateTab(tabIndex);
    };

    const activateStateTab = (tabIndex) => {
        // Update active tab state
        activeStateTab = tabIndex;
        
        // Update tab headers
        const tabHeaders = dom.statesTabsHeaders.querySelectorAll('.state-tab-header');
        tabHeaders.forEach((header, index) => {
            if (index === tabIndex) {
                header.classList.add('active');
            } else {
                header.classList.remove('active');
            }
        });
        
        // Update tab content
        const stateItems = dom.statesItemsContainer.querySelectorAll('.state-item');
        stateItems.forEach((item, index) => {
            if (index === tabIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Enable remove button when we have more than 1 state
        dom.removeStateButton.disabled = stateItems.length <= 1;
    };

    const updateStateTabs = () => {
        // Clear existing tab headers
        dom.statesTabsHeaders.innerHTML = '';
        
        // Create tab headers for each state
        const stateItems = dom.statesItemsContainer.querySelectorAll('.state-item');
        stateItems.forEach((item, index) => {
            const tabHeader = document.createElement('div');
            tabHeader.className = 'state-tab-header';
            tabHeader.textContent = `State #${index + 1}`;
            tabHeader.dataset.tabIndex = index;
            
            if (index === activeStateTab) {
                tabHeader.classList.add('active');
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
            
            dom.statesTabsHeaders.appendChild(tabHeader);
        });
        
        // Update remove button state
        dom.removeStateButton.disabled = stateItems.length <= 1;
        
        // Update add button state - fix for button not being re-enabled after removing states
        dom.addStateButton.disabled = stateItems.length >= 4;
    };

    const removeActiveState = () => {
        const stateItems = dom.statesItemsContainer.querySelectorAll('.state-item');
        if (stateItems.length <= 1) return; // Don't remove the last state
        
        // Check if any state has customDef enabled and collect that info before removal
        const hasCustomDef = Array.from(stateItems).some(item => {
            const checkbox = item.querySelector('.state-customDef-checkbox');
            return checkbox && checkbox.checked;
        });
        
        // Remove the active state item
        if (stateItems[activeStateTab]) {
            stateItems[activeStateTab].remove();
        }
        
        // Update activeStateTab if needed
        if (activeStateTab >= stateItems.length - 1) {
            activeStateTab = stateItems.length - 2; // Go to previous tab
        }
        
        // Renumber states and update tabs
        renumberStates();
        updateStateTabs();
        
        // Check customDef consistency after removal and before JSON update
        updateCustomDefWarnings();
        
        // Update JSON preview and save button state
        updateJsonPreview();
        updateSaveButtonState();
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
            // Setup tabs for existing states
            updateStateTabs();
        }
    }

    const addState = () => {
        const statesCount = dom.statesItemsContainer.children.length;
        if (statesCount >= 4) return; // Max 4 states

        // Check existing states for customDef before adding a new state
        const hasExistingCustomDef = Array.from(dom.statesItemsContainer.querySelectorAll('.state-item')).some(item => {
            const checkbox = item.querySelector('.state-customDef-checkbox');
            return checkbox && checkbox.checked;
        });

        const template = dom.stateItemTemplate.content.cloneNode(true);
        const newStateItem = template.querySelector('.state-item');

        // Add spell tabs container to the new state
        const spellsContainer = newStateItem.querySelector('.state-spells-container');
        if (spellsContainer) {
            const spellsTabsContainer = document.createElement('div');
            spellsTabsContainer.className = 'spells-tabs-container';
            
            const spellsTabsHeaders = document.createElement('div');
            
            const spellsItemsContainer = newStateItem.querySelector('.state-spells-items');
            if (spellsItemsContainer) {
                spellsItemsContainer.className = 'state-spells-items spells-tabs-content';
                
                // Wrap existing content
                const parentContainer = spellsItemsContainer.parentNode;
                parentContainer.insertBefore(spellsTabsContainer, spellsItemsContainer);
                spellsTabsContainer.appendChild(spellsTabsHeaders);
                spellsTabsContainer.appendChild(spellsItemsContainer);
            }
        }

        dom.statesItemsContainer.appendChild(newStateItem);

        // Initialize dependencies after adding to DOM
        initCreatureRewardDependencies(newStateItem);
        initGuardianFieldDependencies(newStateItem);

        // Add the first default (empty) spell structure
        const newSpell = addSpellToState(newStateItem, false); // Add spell but don't update JSON yet
        
        // Initialize active spell tab for this new state
        const newStateIndex = dom.statesItemsContainer.children.length - 1;
        activeSpellTabs[newStateIndex] = 0;
        
        // Update tab navigation and switch to the new tab
        activeStateTab = newStateIndex; // Set active tab to the new state
        updateStateTabs();
        
        // Make the first spell active
        if (newSpell) {
            newSpell.classList.add('active');
        }
        
        // Initialize spell buttons state based on spells checkbox
        const spellsCheckbox = newStateItem.querySelector('.state-spells-checkbox');
        if (spellsCheckbox) {
            updateSpellButtonsState(newStateItem, spellsCheckbox.checked);
        }

        // If existing states have customDef, we need to auto-check customDef in the new state
        // to maintain consistency and avoid warnings
        if (hasExistingCustomDef) {
            const customDefCheckbox = newStateItem.querySelector('.state-customDef-checkbox');
            if (customDefCheckbox) {
                customDefCheckbox.checked = true;
                // Also enable the container
                const customDefContainer = newStateItem.querySelector('.state-customDef-container');
                if (customDefContainer) {
                    customDefContainer.classList.remove('disabled');
                }
            }
        }
        
        // Disable add button if max reached
        dom.addStateButton.disabled = dom.statesItemsContainer.children.length >= 4;

        updateJsonPreview(); // Update JSON after adding
        updateCustomDefWarnings(); // Check customDef consistency and show appropriate warnings
    };

    const renumberStates = () => {
        // Update state tabs - now handled by updateStateTabs()
        updateStateTabs();
        
        // Recreate activeSpellTabs object for the current states
        const newActiveSpellTabs = {};
        dom.statesItemsContainer.querySelectorAll('.state-item').forEach((stateItem, stateIndex) => {
            newActiveSpellTabs[stateIndex] = activeSpellTabs[stateIndex] || 0;
            updateSpellTabs(stateItem, stateIndex);
        });
        activeSpellTabs = newActiveSpellTabs;
        
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

        // Update spell tabs
        const stateIndex = Array.from(dom.statesItemsContainer.children).indexOf(stateItemElement);
        updateSpellTabs(stateItemElement, stateIndex);

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

        // Update spell buttons state
        const spellsCheckbox = stateItemElement.querySelector('.state-spells-checkbox');
        if (spellsCheckbox && spellsCheckbox.checked) {
            updateSpellButtonsState(stateItemElement, true);
        }

        if (triggerJsonUpdate) {
            updateJsonPreview();
        }
        
        return newSpellItem;
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

    // Add new validation function for DEF files
    const validateDefFile = (inputElement) => {
        const value = inputElement.value.trim();
        if (value && !value.toLowerCase().endsWith('.def')) {
            // Append .def if missing, but allow empty input
            inputElement.value = value + '.def';
            updateJsonPreview(); // Update JSON if value changed
        }
    };

    const updateCustomDefWarnings = () => {
        // First check if any state has a customDef
        const stateItems = dom.statesItemsContainer.querySelectorAll('.state-item');
        let hasAnyCustomDef = false;
        let areAllCustomDefsFilled = true;
        
        // Get all customDef values
        const customDefValues = Array.from(stateItems).map(stateItem => {
            const customDefInput = stateItem.querySelector('.state-customDef-input');
            const checkbox = stateItem.querySelector('.state-customDef-checkbox');
            
            // Only consider the value if the checkbox is checked
            if (checkbox && checkbox.checked) {
                const value = customDefInput?.value.trim() || '';
                if (value) {
                    hasAnyCustomDef = true;
                } else {
                    areAllCustomDefsFilled = false;
                }
                return value;
            }
            // If checkbox isn't checked, we don't count this in our consistency check
            return null;
        }).filter(value => value !== null);
        
        // Show warnings if at least one state has customDef
        if (hasAnyCustomDef && stateItems.length > 1) {
            // Add warning to all states if any has customDef
            stateItems.forEach((stateItem) => {
                const customDefInput = stateItem.querySelector('.state-customDef-input');
                const customDefContainer = stateItem.querySelector('.state-customDef-container');
                const checkbox = stateItem.querySelector('.state-customDef-checkbox');
                
                if (!customDefContainer) return;
                
                let warningIcon = customDefContainer.querySelector('.customDef-warning');
                
                // If any state has customDef, all states must have it filled
                if (!checkbox || !checkbox.checked || (customDefInput && !customDefInput.value.trim())) {
                    // Need to add or show warning
                    if (!warningIcon) {
                        warningIcon = document.createElement('span');
                        warningIcon.className = 'customDef-warning property-warning'; // Reuse property-warning style
                        warningIcon.innerHTML = '⚠️';
                        warningIcon.title = translations.customDefWarning || 'All states must have a customDef if any state has one';
                        customDefContainer.insertBefore(warningIcon, customDefInput);
                    } else {
                        warningIcon.style.display = 'inline-flex';
                    }
                } else if (warningIcon) {
                    // Hide warning if value exists and checkbox checked and all states are filled
                    if (areAllCustomDefsFilled && 
                        customDefValues.length === stateItems.length) {
                        warningIcon.style.display = 'none';
                    } else {
                        warningIcon.style.display = 'inline-flex';
                    }
                }
            });
        } else {
            // No warnings needed, hide any existing ones
            document.querySelectorAll('.customDef-warning').forEach(warning => {
                warning.style.display = 'none';
            });
        }
        
        // Force a JSON update to reflect warning changes immediately
        updateJsonPreview();
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

                // Check if any customDef fields have warnings across all states
                const hasAnyCustomDefWarning = Array.from(stateItems).some(state => {
                    const warningIcon = state.querySelector('.customDef-warning');
                    return warningIcon && warningIcon.style.display !== 'none';
                });

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
                    if (getCheckbox('state-artifactIds-checkbox').checked) {
                        // Get values from individual artifact id fields
                        const artifactId1Input = stateElement.querySelector('.state-artifactIds-1');
                        const artifactId2Input = stateElement.querySelector('.state-artifactIds-2');
                        const artifactId3Input = stateElement.querySelector('.state-artifactIds-3');
                        const artifactId4Input = stateElement.querySelector('.state-artifactIds-4');
                        
                        // Create artifactIds array with only the entered values
                        const artifactIds = [];
                        
                        // Helper function to add values only if they're valid and not default (-1)
                        const addArtifactId = (input) => {
                            if (input && input.value !== '') {
                                const val = parseInt(input.value);
                                if (!isNaN(val)) {
                                    artifactIds.push(val);
                                }
                            }
                        };
                        
                        // Process each field
                        addArtifactId(artifactId1Input);
                        addArtifactId(artifactId2Input);
                        addArtifactId(artifactId3Input);
                        addArtifactId(artifactId4Input);
                        
                        // Only add to state object if we have values
                        if (artifactIds.length > 0) {
                            stateObj.artifactIds = artifactIds;
                        }
                    }
                    
                    if (getCheckbox('state-artifactTypeCounts-checkbox').checked) {
                        // Get values from individual artifact type fields
                        const treasureInput = stateElement.querySelector('.state-artifactTypeCounts-treasure');
                        const minorInput = stateElement.querySelector('.state-artifactTypeCounts-minor');
                        const majorInput = stateElement.querySelector('.state-artifactTypeCounts-major');
                        const relicInput = stateElement.querySelector('.state-artifactTypeCounts-relic');
                        
                        const treasure = treasureInput && treasureInput.value !== '' ? parseInt(treasureInput.value) : 0;
                        const minor = minorInput && minorInput.value !== '' ? parseInt(minorInput.value) : 0;
                        const major = majorInput && majorInput.value !== '' ? parseInt(majorInput.value) : 0;
                        const relic = relicInput && relicInput.value !== '' ? parseInt(relicInput.value) : 0;
                        
                        // Create artifact type counts array
                        stateObj.artifactTypeCounts = [
                            isNaN(treasure) ? 0 : treasure,
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

                    // Handle customDef - only add if no warnings in ANY state
                    if (getCheckbox('state-customDef-checkbox').checked && !hasAnyCustomDefWarning) {
                        const customDef = getInputValue('state-customDef-container');
                        if (customDef) {
                            stateObj.customDef = customDef;
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

        // --- Optional: Troop Placement ---
        if (dom.troopPlacementCheckbox.checked) {
            const isBank = dom.isBankSelect.value === 'true';
            
            // Parse the arrays from inputs only if not using defaults
            let attackers = [];
            let defenders = [];
            
            try {
                // Only attempt to parse if not using defaults and values look like arrays
                if (!usingDefaultAttackers && dom.attackersInput.value && 
                    dom.attackersInput.value !== (translations.default || "Default")) {
                    const attackersValue = dom.attackersInput.value.trim();
                    if (attackersValue.startsWith('[') && attackersValue.endsWith(']')) {
                        const parsedAttackers = JSON.parse(attackersValue);
                        // Ensure it's an array with valid content
                        if (Array.isArray(parsedAttackers) && 
                            parsedAttackers.every(item => typeof item === 'string' || typeof item === 'number')) {
                            attackers = parsedAttackers;
                        }
                    }
                }
                
                if (!usingDefaultDefenders && dom.defendersInput.value && 
                    dom.defendersInput.value !== (translations.default || "Default")) {
                    const defendersValue = dom.defendersInput.value.trim();
                    if (defendersValue.startsWith('[') && defendersValue.endsWith(']')) {
                        const parsedDefenders = JSON.parse(defendersValue);
                        // Ensure it's an array with valid content
                        if (Array.isArray(parsedDefenders) && 
                            parsedDefenders.every(item => typeof item === 'string' || typeof item === 'number')) {
                            defenders = parsedDefenders;
                        }
                    }
                }
            } catch (e) {
                console.error('Error parsing troop placement data:', e);
            }
            
            // Add troop placement data to JSON
            innerJsonObj.troopPlacement = {
                isBank: isBank
            };
            
            // Only add custom selections to JSON, not defaults
            if (!usingDefaultAttackers && Array.isArray(attackers) && attackers.length > 0) {
                innerJsonObj.troopPlacement.attackers = attackers;
            }
            
            if (!usingDefaultDefenders && Array.isArray(defenders) && defenders.length > 0) {
                innerJsonObj.troopPlacement.defenders = defenders;
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
                 }).catch(err => {
                     // Handle errors, including user cancellation (AbortError)
                     if (err.name !== 'AbortError') {
                         console.error('Error saving file with File System Access API:', err);
                         // Fallback to legacy method if specific errors occur?
                         saveFileLegacy(blob, filename);
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
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = filename;
         document.body.appendChild(a);
         a.click();
         document.body.removeChild(a);
         URL.revokeObjectURL(url); // Clean up
    };

    // --- PWA Functionality ---
    const updateManifestThemeColor = async () => {
        try {
            // Try to fetch the manifest file
            const manifestResponse = await fetch('./manifest.json');
            if (!manifestResponse.ok) {
                console.warn('Could not fetch manifest.json for theme update');
                return;
            }
            
            const manifest = await manifestResponse.json();
            
            // Update theme color in manifest (this won't actually modify the file,
            // but it's good to have this function for when server-side updates are implemented)
            manifest.theme_color = isDarkTheme ? "#1f2937" : "#f3f4f6";
            
            // Log that we would update the manifest (in a real implementation)
            // console.log('Manifest theme color would be updated to:', manifest.theme_color);
            
        } catch (error) {
            console.error('Error updating manifest theme color:', error);
        }
    };

    const setupPWA = () => {
        // Hide button initially (ensures it's hidden even if CSS doesn't load)
        if (dom.installPwaButton) {
            dom.installPwaButton.style.display = 'none';
        }

        // Register service worker if supported
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', async () => {
                try {
                    const registration = await navigator.serviceWorker.register('./js/sw.js');
                    console.log('ServiceWorker registration successful with scope:', registration.scope);
                } catch (error) {
                    console.error('ServiceWorker registration failed:', error);
                }
            });
        }

        window.addEventListener('beforeinstallprompt', (e) => {
            // Store the event for later use
            deferredPrompt = e;
            // Make the install button visible
            if (dom.installPwaButton) {
                dom.installPwaButton.style.display = 'block';
            }
        });

        // Track installation
        window.addEventListener('appinstalled', () => {
            // Hide the install button after successful installation
            if (dom.installPwaButton) {
                dom.installPwaButton.style.display = 'none';
            }
            // Clear the deferred prompt
            deferredPrompt = null;
        });

        // Update manifest theme color
        updateManifestThemeColor();
    };

    const handleInstallPrompt = async () => {
        if (!deferredPrompt) {
            return;
        }

        // Disable the button during the prompt
        dom.installPwaButton.disabled = true;

        try {
            // Show the prompt
            deferredPrompt.prompt();
            
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
        } catch (error) {
            console.error('Error showing install prompt:', error);
        } finally {
            // Clear the deferredPrompt variable since it can only be used once
            deferredPrompt = null;
            // Re-enable the button
            dom.installPwaButton.disabled = false;
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

    // --- Spells Tabs Management ---
    const initializeSpellTabs = () => {
        // Initialize spell tabs for all states
        dom.statesItemsContainer.querySelectorAll('.state-item').forEach((stateItem, stateIndex) => {
            // Initialize this state's spell tabs if not already in our tracking object
            if (!activeSpellTabs[stateIndex]) {
                activeSpellTabs[stateIndex] = 0;
            }
            updateSpellTabs(stateItem, stateIndex);
        });
    };

    const handleSpellTabClick = (event) => {
        const tabHeader = event.target.closest('.spell-tab-header');
        if (!tabHeader) return;
        
        const tabIndex = parseInt(tabHeader.dataset.tabIndex);
        if (isNaN(tabIndex)) return;
        
        const stateItem = tabHeader.closest('.state-item');
        const stateIndex = Array.from(dom.statesItemsContainer.children).indexOf(stateItem);
        
        activateSpellTab(stateItem, stateIndex, tabIndex);
    };

    const activateSpellTab = (stateItem, stateIndex, spellIndex) => {
        // Store active tab for this state
        activeSpellTabs[stateIndex] = spellIndex;
        
        // Update tab headers
        const tabHeaders = stateItem.querySelectorAll('.spell-tab-header');
        tabHeaders.forEach((header, index) => {
            if (index === spellIndex) {
                header.classList.add('active');
            } else {
                header.classList.remove('active');
            }
        });
        
        // Update tab content
        const spellItems = stateItem.querySelectorAll('.state-spells-items .array-item');
        spellItems.forEach((item, index) => {
            if (index === spellIndex) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Enable/disable remove button based on number of spells
        const removeSpellBtn = stateItem.querySelector('.remove-spell-btn');
        if (removeSpellBtn) {
            removeSpellBtn.disabled = spellItems.length <= 1;
        }
    };

    const updateSpellTabs = (stateItem, stateIndex) => {
        // Clear existing tab headers
        const headersContainer = stateItem.querySelector('.spells-tabs-headers');
        if (!headersContainer) return;
        
        headersContainer.innerHTML = '';
        
        // Create tab headers for each spell
        const spellItems = stateItem.querySelectorAll('.state-spells-items .array-item');
        spellItems.forEach((item, index) => {
            const tabHeader = document.createElement('div');
            tabHeader.className = 'spell-tab-header';
            tabHeader.textContent = `Spell #${index + 1}`;
            tabHeader.dataset.tabIndex = index;
            
            if (index === activeSpellTabs[stateIndex]) {
                tabHeader.classList.add('active');
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
            
            headersContainer.appendChild(tabHeader);
        });
        
        // Update remove button state
        const removeSpellBtn = stateItem.querySelector('.remove-spell-btn');
        if (removeSpellBtn) {
            removeSpellBtn.disabled = spellItems.length <= 1;
        }
        
        // Update add button state
        const addSpellBtn = stateItem.querySelector('.add-spell-btn');
        if (addSpellBtn) {
            addSpellBtn.disabled = spellItems.length >= 4;
        }
    };

    const handleAddSpellBtnClick = (event) => {
        const addSpellBtn = event.target.closest('.add-spell-btn');
        if (!addSpellBtn) return;
        
        const stateItem = addSpellBtn.closest('.state-item');
        if (!stateItem) return;
        
        const stateIndex = Array.from(dom.statesItemsContainer.children).indexOf(stateItem);
        const spellsContainer = stateItem.querySelector('.state-spells-items');
        
        if (spellsContainer && spellsContainer.children.length < 4) {
            addSpellToState(stateItem);
            
            // Set active tab to the new spell
            const newSpellIndex = spellsContainer.children.length - 1;
            activateSpellTab(stateItem, stateIndex, newSpellIndex);
            
            // Update JSON
            updateJsonPreview();
        }
    };

    const handleRemoveSpellBtnClick = (event) => {
        const removeSpellBtn = event.target.closest('.remove-spell-btn');
        if (!removeSpellBtn) return;
        
        const stateItem = removeSpellBtn.closest('.state-item');
        if (!stateItem) return;
        
        const stateIndex = Array.from(dom.statesItemsContainer.children).indexOf(stateItem);
        const spellsContainer = stateItem.querySelector('.state-spells-items');
        const spellItems = spellsContainer?.querySelectorAll('.array-item');
        
        if (spellItems && spellItems.length > 1) {
            // Get current active spell index
            const activeIndex = activeSpellTabs[stateIndex] || 0;
            
            // Remove the active spell
            if (spellItems[activeIndex]) {
                spellItems[activeIndex].remove();
            }
            
            // Adjust active index if needed
            if (activeIndex >= spellItems.length - 1) {
                activeSpellTabs[stateIndex] = spellItems.length - 2;
            }
            
            // Update tabs
            updateSpellTabs(stateItem, stateIndex);
            
            // Update JSON
            updateJsonPreview();
        }
    };

    // --- Hexagonal Grid Functions ---
    
    // Initialize grid popup
    const initGridPopup = () => {
        // Set translated text for the popup
        updateGridTranslations();
        
        // Initialize the toggle state and preview
        if (dom.disabledCellsToggle.checked) {
            dom.blockedPreview.classList.add('styled');
        } else {
            dom.blockedPreview.classList.remove('styled');
        }
    };
    
    // Update grid popup translations
    const updateGridTranslations = () => {
        if (translations) {
            dom.gridPopupTitle.textContent = translations.customizeGrid || 'Customize Troop Placement';
            dom.applyGrid.textContent = translations.apply || 'Apply';
            dom.cancelGrid.textContent = translations.cancel || 'Cancel';
            dom.defendersButton.textContent = translations.defenders || 'Defenders';
            dom.attackersButton.textContent = translations.attackers || 'Attackers';
            dom.currentMode.textContent = currentGridMode === 'defenders' ? 
                translations.defenders || 'Defenders' : 
                translations.attackers || 'Attackers';
            dom.disabledCellsLabel.textContent = translations.disabledCellsStyle || 'Disabled cells style';
                
            // Update "Default" text in grid info using translation
            if (usingDefaultDefenders) {
                dom.defendersCells.textContent = translations.default || "Default";
            }
            if (usingDefaultAttackers) {
                dom.attackersCells.textContent = translations.default || "Default";
            }
        }
    };
    
    // Create hexagonal grid
    const createHexagonalGrid = () => {
        dom.hexGrid.innerHTML = '';
        
        const rows = 11;
        const cols = 17;
        let cellCount = 0;

        for (let row = 0; row < rows; row++) {
            const rowDiv = document.createElement('div');
            rowDiv.classList.add('grid-row');
            
            for (let col = 0; col < cols; col++) {
                const cell = document.createElement('div');
                const cellContent = document.createElement('div');
                const cellNum = cellCount.toString().padStart(2, '0');
                
                cell.classList.add('hex-cell');
                cellContent.classList.add('hex-content');
                cell.dataset.id = cellNum;
                cellContent.textContent = cellNum;
                
                // Mark border cells
                if (borderCells.includes(cellNum)) {
                    cell.classList.add('border-cell');
                } else {
                    cell.addEventListener('click', () => toggleCellSelection(cell));
                }
                
                cell.appendChild(cellContent);
                rowDiv.appendChild(cell);
                cellCount++;
            }
            
            dom.hexGrid.appendChild(rowDiv);
        }
        
        // Apply initial cell highlights
        refreshCellDisplay();
    };
    
    // Function to get adjacent cell IDs in hexagonal grid
    const getAdjacentCells = (cellId) => {
        // Convert cell ID to row and column
        const cellNum = parseInt(cellId);
        const totalCols = 17; // Columns per row
        const row = Math.floor(cellNum / totalCols);
        const col = cellNum % totalCols;
        
        // Determine if this is an even or odd row (different offsets)
        const isOddRow = row % 2 === 1;
        
        let rightCell = null;
        let leftCell = null;
        let farRightCell = null;  // Add cell that is two steps to the right
        let farLeftCell = null;   // Add cell that is two steps to the left
        
        // Calculate right adjacent cell
        if (col < totalCols - 1) {
            rightCell = (row * totalCols + col + 1).toString().padStart(2, '0');
            
            // Calculate far right cell (two steps away)
            if (col < totalCols - 2) {
                farRightCell = (row * totalCols + col + 2).toString().padStart(2, '0');
            }
        }
        
        // Calculate left adjacent cell
        if (col > 0) {
            leftCell = (row * totalCols + col - 1).toString().padStart(2, '0');
            
            // Calculate far left cell (two steps away)
            if (col > 1) {
                farLeftCell = (row * totalCols + col - 2).toString().padStart(2, '0');
            }
        }
        
        return { leftCell, rightCell, farLeftCell, farRightCell };
    };

    // Function to update blocked cells based on current selections
    const updateBlockedCells = () => {
        // First, remove all blocked classes
        document.querySelectorAll('.hex-cell.blocked').forEach(cell => {
            cell.classList.remove('blocked');
        });
        
        // Then block cells to the right of attackers
        document.querySelectorAll('.hex-cell.attackers').forEach(cell => {
            const cellId = cell.dataset.id;
            const { rightCell, farRightCell } = getAdjacentCells(cellId);
            
            if (rightCell) {
                const rightCellElement = document.querySelector(`.hex-cell[data-id="${rightCell}"]`);
                if (rightCellElement && !rightCellElement.classList.contains('border-cell') && 
                    !rightCellElement.classList.contains('attackers') && 
                    !rightCellElement.classList.contains('defenders')) {
                    rightCellElement.classList.add('blocked');
                }
            }
            
            // Block cell that is two steps to the right (for defenders)
            if (farRightCell) {
                const farRightCellElement = document.querySelector(`.hex-cell[data-id="${farRightCell}"]`);
                if (farRightCellElement && !farRightCellElement.classList.contains('border-cell') && 
                    !farRightCellElement.classList.contains('attackers') && 
                    currentGridMode === 'defenders') { // Only block if trying to place defenders
                    farRightCellElement.classList.add('blocked');
                }
            }
        });
        
        // Block cells to the left of defenders
        document.querySelectorAll('.hex-cell.defenders').forEach(cell => {
            const cellId = cell.dataset.id;
            const { leftCell, farLeftCell } = getAdjacentCells(cellId);
            
            if (leftCell) {
                const leftCellElement = document.querySelector(`.hex-cell[data-id="${leftCell}"]`);
                if (leftCellElement && !leftCellElement.classList.contains('border-cell') && 
                    !leftCellElement.classList.contains('attackers') && 
                    !leftCellElement.classList.contains('defenders')) {
                    leftCellElement.classList.add('blocked');
                }
            }
            
            // Block cell that is two steps to the left (for attackers)
            if (farLeftCell) {
                const farLeftCellElement = document.querySelector(`.hex-cell[data-id="${farLeftCell}"]`);
                if (farLeftCellElement && !farLeftCellElement.classList.contains('border-cell') && 
                    !farLeftCellElement.classList.contains('defenders') && 
                    currentGridMode === 'attackers') { // Only block if trying to place attackers
                    farLeftCellElement.classList.add('blocked');
                }
            }
        });
        
        // Apply styling based on toggle
        toggleDisabledCellsStyle();
    };

    // Toggle cell selection with defaults handling
    const toggleCellSelection = (cell) => {
        const cellId = cell.dataset.id;
        const currentArray = currentGridMode === 'defenders' ? defendersList : attackersList;
        const index = currentArray.indexOf(cellId);
        
        // Check if the cell is already selected in the other array
        const otherArray = currentGridMode === 'defenders' ? attackersList : defendersList;
        if (otherArray.includes(cellId)) {
            return; // Can't select a cell that's already in the other array
        }
        
        // Check if the cell is blocked
        if (cell.classList.contains('blocked')) {
            return; // Can't select a blocked cell
        }
        
        // If using defaults, clear them on first user selection
        if ((currentGridMode === 'defenders' && usingDefaultDefenders) || 
            (currentGridMode === 'attackers' && usingDefaultAttackers)) {
            
            // Clear the current array
            currentArray.length = 0;
            
            // Update the flag
            if (currentGridMode === 'defenders') {
                usingDefaultDefenders = false;
            } else {
                usingDefaultAttackers = false;
            }
            
            // Clear all highlighted cells of this type
            document.querySelectorAll(`.hex-cell.${currentGridMode}`).forEach(cell => {
                cell.classList.remove(currentGridMode);
                cell.classList.remove('default');
            });
        }
        
        if (index === -1) {
            // Cell is not selected, add it if we haven't reached the maximum
            if (currentArray.length < MAX_GRID_SELECTIONS) {
                currentArray.push(cellId);
                cell.classList.add(currentGridMode);
                
                // Update blocked cells after selection
                updateBlockedCells();
            }
        } else {
            // Cell is already selected, remove it
            currentArray.splice(index, 1);
            cell.classList.remove(currentGridMode);
            
            // Update blocked cells after deselection
            updateBlockedCells();
            
            // If this was the last custom cell, revert to defaults
            if (currentArray.length === 0) {
                if (currentGridMode === 'defenders') {
                    usingDefaultDefenders = true;
                    const isBank = dom.isBankSelect.value === 'true';
                    defendersList.push(...getDefaultDefenders(isBank));
                } else {
                    usingDefaultAttackers = true;
                    const isBank = dom.isBankSelect.value === 'true';
                    attackersList.push(...getDefaultAttackers(isBank));
                }
                refreshCellDisplay();
                updateBlockedCells(); // Update blocked cells after reverting to defaults
            }
        }
        
        // Update display
        updateGridSelectionDisplay();
    };

    // Update the display of selected cells with translation
    const updateGridSelectionDisplay = () => {
        dom.defendersCells.textContent = usingDefaultDefenders ? 
            (translations.default || "Default") : 
            JSON.stringify(defendersList);
        dom.defendersCount.textContent = `${defendersList.length}/${MAX_GRID_SELECTIONS}`;
        
        dom.attackersCells.textContent = usingDefaultAttackers ? 
            (translations.default || "Default") : 
            JSON.stringify(attackersList);
        dom.attackersCount.textContent = `${attackersList.length}/${MAX_GRID_SELECTIONS}`;
    };
    
    // Switch between defenders and attackers modes
    const switchGridMode = (mode) => {
        currentGridMode = mode;
        dom.currentMode.textContent = mode === 'defenders' ? 
            translations.defenders || 'Defenders' : 
            translations.attackers || 'Attackers';
        
        // Update button styles
        if (mode === 'defenders') {
            dom.defendersButton.classList.add('active');
            dom.attackersButton.classList.remove('active');
        } else {
            dom.defendersButton.classList.remove('active');
            dom.attackersButton.classList.add('active');
        }
        
        // Update blocked cells when switching modes
        updateBlockedCells();
    };
    
    // Apply grid selections to the form inputs
    const applyGridSelections = () => {
        dom.attackersInput.value = usingDefaultAttackers ? "Default" : JSON.stringify(attackersList);
        dom.defendersInput.value = usingDefaultDefenders ? "Default" : JSON.stringify(defendersList);
        closeGridPopup();
        updateJsonPreview(); // Update the JSON preview with new values
    };
    
    // Open the grid popup
    const openGridPopup = () => {
        dom.gridPopup.style.display = 'block';
        
        // Get current isBank value and update UI
        const isBank = dom.isBankSelect.value === 'true';
        updateGridUiBasedOnIsBank(isBank);
        
        // Initialize grid if it doesn't exist
        if (dom.hexGrid.children.length === 0) {
            createHexagonalGrid();
        }
        
        // Load current values or defaults
        try {
            // Clear existing selections
            attackersList.length = 0;
            defendersList.length = 0;
            
            // Check if we're using defaults or custom values
            if (dom.attackersInput.value === "Default" || 
                dom.attackersInput.value === (translations.default || "Default") || 
                dom.attackersInput.value === "") {
                usingDefaultAttackers = true;
                const isBank = dom.isBankSelect.value === 'true';
                attackersList.push(...getDefaultAttackers(isBank));
            } else {
                usingDefaultAttackers = false;
                try {
                    const attackers = JSON.parse(dom.attackersInput.value);
                    if (Array.isArray(attackers)) {
                        attackersList.push(...attackers);
                    }
                } catch (e) {
                    console.error('Error parsing attackers:', e);
                }
            }
            
            if (dom.defendersInput.value === "Default" || 
                dom.defendersInput.value === (translations.default || "Default") || 
                dom.defendersInput.value === "") {
                usingDefaultDefenders = true;
                const isBank = dom.isBankSelect.value === 'true';
                defendersList.push(...getDefaultDefenders(isBank));
            } else {
                usingDefaultDefenders = false;
                try {
                    const defenders = JSON.parse(dom.defendersInput.value);
                    if (Array.isArray(defenders)) {
                        defendersList.push(...defenders);
                    }
                } catch (e) {
                    console.error('Error parsing defenders:', e);
                }
            }
            
            // Refresh display
            refreshCellDisplay();
            updateGridSelectionDisplay();
            updateBlockedCells(); // Add this line to initialize blocked cells
        } catch (e) {
            console.error('Error loading grid data:', e);
        }
    };
    
    // Close the grid popup
    const closeGridPopup = () => {
        dom.gridPopup.style.display = 'none';
    };
    
    // Apply cell highlights for current selections
    const refreshCellDisplay = () => {
        document.querySelectorAll('.hex-cell:not(.border-cell)').forEach(cell => {
            const cellId = cell.dataset.id;
            cell.classList.remove('defenders', 'attackers', 'default', 'blocked');
            
            // Get default cell arrays based on current isBank value
            const isBank = dom.isBankSelect.value === 'true';
            const defaultDefenders = getDefaultDefenders(isBank);
            const defaultAttackers = getDefaultAttackers(isBank);
            
            // Add appropriate class based on current arrays
            if (defendersList.includes(cellId)) {
                cell.classList.add('defenders');
                // Add default class if this cell is part of default defenders and we're using defaults
                if (usingDefaultDefenders && defaultDefenders.includes(cellId)) {
                    cell.classList.add('default');
                }
            } else if (attackersList.includes(cellId)) {
                cell.classList.add('attackers');
                // Add default class if this cell is part of default attackers and we're using defaults
                if (usingDefaultAttackers && defaultAttackers.includes(cellId)) {
                    cell.classList.add('default');
                }
            }
        });
        
        // Update blocked cells after refreshing display
        updateBlockedCells();
    };

    // New function to initialize default troop placements
    const initializeDefaultTroopPlacements = () => {
        // Initialize with default values
        updateTroopPlacementInputs();
    };

    // New function to get default attackers based on isBank value
    const getDefaultAttackers = (isBank) => {
        return isBank ? DEFAULT_BANK_TRUE_ATTACKERS : DEFAULT_BANK_FALSE_ATTACKERS;
    };
    
    // New function to get default defenders based on isBank value
    const getDefaultDefenders = (isBank) => {
        return isBank ? DEFAULT_BANK_TRUE_DEFENDERS : DEFAULT_BANK_FALSE_DEFENDERS;
    };
    
    // New function to update troop placement input fields with translation
    const updateTroopPlacementInputs = () => {
        const defaultText = translations.default || "Default";
        dom.attackersInput.value = usingDefaultAttackers ? defaultText : JSON.stringify(attackersList);
        dom.defendersInput.value = usingDefaultDefenders ? defaultText : JSON.stringify(defendersList);
    };

    // Add this new function after other grid-related functions
    const updateGridUiBasedOnIsBank = (isBank) => {
        if (!isBank) {
            // Visually dim the grid but still allow scrolling
            dom.hexGrid.style.opacity = '0.5';
            
            // Disable individual cell interactions instead
            document.querySelectorAll('.hex-cell:not(.border-cell)').forEach(cell => {
                cell.style.pointerEvents = 'none';
            });
            
            // Hide the Apply button
            dom.applyGrid.style.display = 'none';
            
            // Change Cancel button text to Ok
            dom.cancelGrid.textContent = translations.ok || 'Ok';
        } else {
            // Enable the grid
            dom.hexGrid.style.opacity = '1';
            
            // Re-enable individual cell interactions
            document.querySelectorAll('.hex-cell:not(.border-cell)').forEach(cell => {
                cell.style.pointerEvents = 'auto';
            });
            
            // Show the Apply button
            dom.applyGrid.style.display = 'block';
            
            // Restore Cancel button text
            dom.cancelGrid.textContent = translations.cancel || 'Cancel';
        }
    };

    // New function to toggle disabled cells styling
    const toggleDisabledCellsStyle = () => {
        const showStyle = dom.disabledCellsToggle.checked;
        
        // Update preview
        if (showStyle) {
            dom.blockedPreview.classList.add('styled');
        } else {
            dom.blockedPreview.classList.remove('styled');
        }
        
        // Update all blocked cells
        document.querySelectorAll('.hex-cell.blocked .hex-content').forEach(content => {
            if (showStyle) {
                content.classList.add('styled');
            } else {
                content.classList.remove('styled');
            }
        });
    };

    // --- Start the Application ---
    init();
});