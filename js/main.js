'use strict';

// Import DOM elements from the module
import { dom } from './dom-elements.js';
// Import event handlers
import {
    handleInputChange,
    handleInputBlur,
    handleRemoveClick,
    handleSpellRemoveClick,
    handleAddSpellClick,
    handleOptionalFieldToggle,
    handleTabClick,
    handleSpellTabClick,
    handleAddSpellBtnClick,
    handleRemoveSpellBtnClick,
    handleNumberInput
} from './event-handlers.js';
// Import state management functionality
import {
    addState,
    addInitialState,
    removeActiveState,
    updateStateTabs,
    activateStateTab,
    renumberStates,
    initializeSpellTabs,
    activateSpellTab,
    updateSpellTabs,
    updateStateButtonsState,
    updateSpellButtonsState,
    initializeButtonStates,
    addSpellToState,
    updateFlagsValue,
    updateLevelsValue,
    updateSchoolsValue,
    activeSpellTabs
} from './state-management.js';
// Import grid management functionality
import {
    initGridPopup,
    updateGridTranslations,
    updateGridSelectionDisplay,
    switchGridMode,
    applyGridSelections,
    openGridPopup,
    closeGridPopup,
    refreshCellDisplay,
    initializeDefaultTroopPlacements,
    updateGridUiBasedOnIsBank,
    toggleDisabledCellsStyle,
    usingDefaultAttackers,
    usingDefaultDefenders,
    resetToDefaults,
    updateTroopPlacementInputs
} from './grid-management.js';
// Import JSON handling functionality
import {
    buildJsonObject,
    updateJsonPreview as updateJsonPreviewBase,
    validateRequiredFields
} from './json-handling.js';
// Import localization functionality
import {
    loadLanguage,
    getTranslations
} from './localization.js';
// Import theme management functionality
import {
    toggleTheme,
    loadThemePreference,
    getThemeState
} from './theme-management.js';
// Import PWA setup functionality
import { setupPWA } from './pwa-setup.js';
// Import validation functionality
import {
    updateSaveButtonState,
    validatePropertyInput,
    updatePropertyWarnings,
    validateWavFile,
    validateDefFile,
    updateCustomDefWarnings
} from './validation.js';
// Import file handling functionality
import { saveFile } from './file-saving.js';
import { handleOpenJsonFile } from './file-loading.js';
// Import object management functionality
import {
    createNewObject,
    removeCurrentObject,
    saveCurrentObjectData,
    loadObjectData,
    updateObjectSelector,
    updateObjectSelectorOption,
    captureFormState,
    resetStateItem,
    showDuplicateWarning,
} from './object-management.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- Application State ---
    let handleInstallPrompt; // For PWA installation
    let indentSize = 2; // Default indent size for JSON
    let formModified = false; // Track if the form has been modified
    
    // Track multiple objects
    let objectsList = []; // Array to hold all type/subtype combinations
    let currentObjectIndex = 0; // Index of the currently selected object
    
    // Create wrapper for updateJsonPreview to pass necessary state
    const updateJsonPreview = () => {
        const state = {
            usingDefaultAttackers,
            usingDefaultDefenders,
            indentSize, // Pass indent size to JSON preview
            objectsList // Pass the list of all objects
        };
        updateJsonPreviewBase(dom, (domElements) => buildJsonObject(domElements, state), indentSize);
    };
    
    // --- Initialization ---
    const init = () => {
        loadThemePreference(dom);
        setupEventListeners();
        
        // Load saved indent preference from localStorage if available
        const savedIndent = localStorage.getItem('jsonIndentSize');
        if (savedIndent) {
            indentSize = parseInt(savedIndent);
            document.getElementById(`indent-${indentSize}`).checked = true;
        }
        
        // Create update actions object to pass to loadLanguage
        const updateActions = {
            isDarkTheme: getThemeState(),
            updateSaveButtonState,
            updateGridTranslations,
            updateAllLineBreakIndicators,
            updateFlagsValue,
            updateTroopPlacementInputs,
            updateActionButtonState,
            updateJsonPreview, // Add this function to update JSON preview after language change
            updateObjectSelector: () => {
                // Update object selector with new translations
                updateObjectSelector(objectsList, currentObjectIndex, updateActionButtonState);
            }
        };
        
        // Load preferred language from localStorage or fallback to 'en'
        const preferredLanguage = localStorage.getItem('preferredLanguage') || 'en';
        loadLanguage(preferredLanguage, dom, updateActions);
        
        handleInstallPrompt = setupPWA(dom);
        addInitialState(dom, () => addState(dom, updateJsonPreview, updateCustomDefWarnings, (stateItem, update) => addSpellToState(stateItem, update, getTranslations(), updateJsonPreview), getTranslations()), updateStateTabs); // Add the first state block
        updatePropertyRemoveButtons(); // Initialize property remove buttons visibility
        updateJsonPreview(); // Initial JSON preview
        updateSaveButtonState(); // Initial save button state
        updateAllLineBreakIndicators(); // Initial check for textareas
        updatePropertyWarnings(); // Initial check for property warnings
        initializeSpellTabs(dom); // Initialize spell tabs for any existing states
        initializeButtonStates(dom); // Initialize button states based on checkboxes
        initGridPopup(getTranslations()); // Initialize grid popup functionality
        initializeDefaultTroopPlacements(); // Initialize default troop placements
        updateCustomDefWarnings(); // Initialize customDef warnings
        updateResetButtonState(); // Initialize reset button state

        // Initialize with default object (type 16, subtype 0)
        objectsList.push({ type: '16', subtype: '0' });
        updateObjectSelector(objectsList, currentObjectIndex, updateActionButtonState);
    };

    // Update the action button text and state
    const updateActionButtonState = (isModified = formModified) => {
        const actionButton = document.getElementById('action-btn');
        if (!actionButton) return;
        
        const translations = getTranslations();
        
        if (objectsList.length <= 1) {
            // In single object mode - show "Reset" functionality
            actionButton.textContent = translations.resetButton || 'Reset';
            actionButton.classList.remove('remove-object-btn');
            actionButton.disabled = !isModified; // Only enable if form modified
        } else {
            // In multiple objects mode - show "Remove" functionality
            actionButton.textContent = translations.removeButton || 'Remove';
            actionButton.classList.add('remove-object-btn');
            actionButton.disabled = false; // Always enable when multiple objects
        }
    };
    
    // Create a wrapper for calling createNewObject with needed context
    const handleCreateNewObject = () => {
        currentObjectIndex = createNewObject(
            dom, 
            objectsList, 
            currentObjectIndex, 
            () => handleSaveCurrentObjectData(), 
            (newIndex) => {
                updateObjectSelector(objectsList, newIndex, updateActionButtonState);
                currentObjectIndex = newIndex;
            }, 
            resetEditorForm,
            updateJsonPreview,
            () => updateActionButtonState(false)
        );
        formModified = false;
    };
    
    // Create a wrapper for calling saveCurrentObjectData with needed context
    const handleSaveCurrentObjectData = () => {
        return saveCurrentObjectData(
            objectsList,
            currentObjectIndex,
            dom.objectTypeInput,
            dom.objectSubtypeInput,
            () => captureFormState(dom),
            updateObjectSelectorOption,
            showDuplicateWarning,
            dom.duplicateWarning,
            dom.saveFileButton,
            validateRequiredFields,
            dom,
            updateJsonPreview
        );
    };
    
    // Create a wrapper for calling removeCurrentObject with needed context
    const handleRemoveCurrentObject = () => {
        currentObjectIndex = removeCurrentObject(
            objectsList, 
            currentObjectIndex, 
            (newIndex) => {
                updateObjectSelector(objectsList, newIndex, updateActionButtonState);
                currentObjectIndex = newIndex;
            },
            (index) => handleLoadObjectData(index),
            updateJsonPreview,
            () => updateActionButtonState(false),
            getTranslations
        );
        formModified = false;
    };

    // Create a wrapper for calling loadObjectData with needed context
    const handleLoadObjectData = (index) => {
        loadObjectData(
            objectsList,
            index,
            resetEditorForm,
            updatePropertyWarnings,
            updateJsonPreview,
            updateCustomDefWarnings,
            updateResetButtonState,
            updateStateTabs,
            activateStateTab,
            updateSpellTabs,
            updateLineBreakIndicators,
            dom
        );
    };
    
    // Handle object selector change
    const handleObjectSelectorChange = (event) => {
        const newIndex = parseInt(event.target.value);
        
        // Save current form data
        handleSaveCurrentObjectData();
        
        // Update current index
        currentObjectIndex = newIndex;
        
        // Load the selected object data
        handleLoadObjectData(currentObjectIndex);
    };

    // --- UI Interaction & Event Listeners ---
    const setupEventListeners = () => {
        // Header Controls
        dom.themeToggleButton.addEventListener('click', () => toggleTheme(dom));
        dom.langSelectorButton.addEventListener('click', () => {
            dom.langDropdown.classList.toggle('show');
        });
        dom.installPwaButton.addEventListener('click', () => {
            const result = handleInstallPrompt();
            if (result === null) handleInstallPrompt = setupPWA(dom);
        });
        dom.openJsonFileButton.addEventListener('click', () => {
            handleOpenJsonFile(
                dom,
                updateJsonPreview,
                updateCustomDefWarnings,
                validatePropertyInput,
                getTranslations,
                (objects) => {
                    // Set the objects list and reset current index
                    objectsList = objects;
                    currentObjectIndex = 0;
                    // Update the object selector to show all loaded objects
                    updateObjectSelector(objectsList, currentObjectIndex, updateActionButtonState);
                    // Update warnings after loading new objects
                    updatePropertyWarnings();
                }
            );
        });

        // Language Selection
        dom.langDropdown.addEventListener('click', (event) => {
            if (event.target.tagName === 'BUTTON' && event.target.dataset.lang) {
                // Create update actions object to pass to loadLanguage
                const updateActions = {
                    isDarkTheme: getThemeState(),
                    updateSaveButtonState,
                    updateGridTranslations,
                    updateAllLineBreakIndicators,
                    updateFlagsValue,
                    updateTroopPlacementInputs, 
                    updateActionButtonState,
                    updateJsonPreview,
                    updateObjectSelector: () => {
                        // Update object selector with new translations
                        updateObjectSelector(objectsList, currentObjectIndex, updateActionButtonState);
                    }
                };
                
                // Force a full UI update when changing languages
                loadLanguage(event.target.dataset.lang, dom, updateActions);
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
        dom.addStateButton.addEventListener('click', () => addState(dom, updateJsonPreview, updateCustomDefWarnings, (stateItem, update) => addSpellToState(stateItem, update, getTranslations(), updateJsonPreview), getTranslations()));
        dom.saveFileButton.addEventListener('click', () => {
            const state = {
                usingDefaultAttackers,
                usingDefaultDefenders,
                indentSize,
                objectsList // Add objectsList to save all objects
            };
            saveFile(dom, buildJsonObject, validateRequiredFields, state);
        });
        dom.toggleJsonButton.addEventListener('click', toggleJsonPreview);

        // Input changes triggering JSON update and validation
        // Using event delegation on a common ancestor (e.g., main container)
        const editorContainer = document.querySelector('.editor-container');
        if (editorContainer) {
            // Добавляем обработчик для ограничения ввода числовых полей
            editorContainer.addEventListener('input', handleNumberInput);
            
            editorContainer.addEventListener('input', (event) => {
                formModified = true;
                updateResetButtonState();
                handleInputChange(
                    event, 
                    updatePropertyWarnings, 
                    updateJsonPreview, 
                    updateSaveButtonState, 
                    validatePropertyInput
                );
                
                // Автоматически сохраняем изменения в объект
                handleSaveCurrentObjectData();
            });
            editorContainer.addEventListener('change', (event) => {
                formModified = true;
                updateResetButtonState();
                handleInputChange(
                    event, 
                    updatePropertyWarnings, 
                    updateJsonPreview, 
                    updateSaveButtonState, 
                    validatePropertyInput
                );
                
                // Автоматически сохраняем изменения в объект
                handleSaveCurrentObjectData();
            }); // For select & checkbox
            editorContainer.addEventListener('blur', (event) => handleInputBlur(
                event, 
                validateWavFile, 
                validateDefFile, 
                validatePropertyInput, 
                updateCustomDefWarnings, 
                updatePropertyWarnings, 
                updateSaveButtonState
            ), true); // For validation on blur
        } else {
            console.error("Editor container not found for event delegation.");
        }


        // Dynamic element removal using event delegation
        dom.propertiesContainer.addEventListener('click', (event) => handleRemoveClick(
            event, 
            updatePropertyRemoveButtons, 
            renumberStates, 
            updateJsonPreview, 
            updateSaveButtonState, 
            updatePropertyWarnings
        ));
        dom.statesItemsContainer.addEventListener('click', (event) => handleRemoveClick(
            event, 
            updatePropertyRemoveButtons, 
            renumberStates, 
            updateJsonPreview, 
            updateSaveButtonState, 
            updatePropertyWarnings
        ));
        // Delegation for spell removal needs to be attached to statesItemsContainer as well
        dom.statesItemsContainer.addEventListener('click', (event) => handleSpellRemoveClick(
            event, 
            updateJsonPreview
        ));
        // Delegation for adding spells within states
        dom.statesItemsContainer.addEventListener('click', (event) => handleAddSpellClick(
            event, 
            addSpellToState
        ));


        // Optional Field Toggling (using delegation on a container)
        if (editorContainer) {
            editorContainer.addEventListener('change', (event) => handleOptionalFieldToggle(
                event, 
                updateStateButtonsState, 
                updateSpellButtonsState, 
                updateCustomDefWarnings, 
                updateJsonPreview, 
                updateSaveButtonState
            ));
        }

        // Textarea resize handling
        dom.textVisitTextarea.addEventListener('mouseup', () => updateLineBreakIndicators(dom.textVisitTextarea));
        dom.textVisitTextarea.addEventListener('input', () => updateLineBreakIndicators(dom.textVisitTextarea));

        // Make sure we update property warnings when subtype changes
        dom.objectSubtypeInput.addEventListener('input', () => {
            updatePropertyWarnings();
            handleSaveCurrentObjectData(); // This will update the selector option text too
            updateSaveButtonState();
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
        dom.statesTabsHeaders.addEventListener('click', (event) => handleTabClick(
            event, 
            (tabIndex) => activateStateTab(tabIndex, dom)
        ));
        dom.removeStateButton.addEventListener('click', () => removeActiveState(dom, updateJsonPreview, updateSaveButtonState, updateCustomDefWarnings));

        // Delegation for spell tab handling
        dom.statesItemsContainer.addEventListener('click', (event) => handleSpellTabClick(
            event, 
            (stateItem, stateIndex, spellIndex) => activateSpellTab(stateItem, stateIndex, spellIndex)
        ));
        dom.statesItemsContainer.addEventListener('click', (event) => handleAddSpellBtnClick(
            event, 
            addSpellToState, 
            (stateItem, stateIndex, spellIndex) => activateSpellTab(stateItem, stateIndex, spellIndex), 
            updateJsonPreview,
            getTranslations // Pass the getTranslations function to provide translations
        ));
        dom.statesItemsContainer.addEventListener('click', (event) => handleRemoveSpellBtnClick(
            event, 
            updateSpellTabs, 
            updateJsonPreview, 
            activeSpellTabs
        ));

        // Grid popup event listeners
        dom.customizeGridBtn.addEventListener('click', () => openGridPopup(getTranslations()));
        dom.closeGridPopup.addEventListener('click', closeGridPopup);
        dom.applyGrid.addEventListener('click', () => applyGridSelections(updateJsonPreview));
        dom.cancelGrid.addEventListener('click', closeGridPopup);
        dom.defendersButton.addEventListener('click', () => switchGridMode('defenders', getTranslations()));
        dom.attackersButton.addEventListener('click', () => switchGridMode('attackers', getTranslations()));
        dom.disabledCellsToggle.addEventListener('change', toggleDisabledCellsStyle);
        
        // Close grid popup when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === dom.gridPopup) {
                closeGridPopup();
            }
        });

        // Add event listener for isBank select changes
        dom.isBankSelect.addEventListener('change', () => {
            // Use the resetToDefaults function instead of direct assignments
            const isBank = dom.isBankSelect.value === 'true';
            resetToDefaults(isBank, getTranslations());
            
            // Update UI if grid popup is open
            if (dom.gridPopup.style.display === 'block') {
                refreshCellDisplay();
                updateGridSelectionDisplay(getTranslations());
                updateGridUiBasedOnIsBank(isBank, getTranslations());
            }
            
            // JSON preview is already updated in resetToDefaults
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

            // Add listener for troopPlacement checkbox changes
            editorContainer.addEventListener('change', (event) => {
                if (event.target.id === 'troopPlacement-checkbox') {
                    // Use the resetToDefaults function instead of direct assignments
                    const isBank = dom.isBankSelect.value === 'true';
                    resetToDefaults(isBank, getTranslations());
                    
                    // JSON preview is already updated in resetToDefaults
                    updateJsonPreview();
                }
            });
        }

        // Settings button and indentation selection
        const settingsButton = document.getElementById('settings-button');
        const settingsDropdown = document.getElementById('settings-dropdown');
        
        settingsButton.addEventListener('click', () => {
            settingsDropdown.classList.toggle('show');
        });
        
        // Close settings dropdown when clicking outside
        window.addEventListener('click', (event) => {
            if (!settingsButton.contains(event.target) && !settingsDropdown.contains(event.target)) {
                settingsDropdown.classList.remove('show');
            }
        });
        
        // Handle indentation change
        document.querySelectorAll('input[name="indent-size"]').forEach(radio => {
            radio.addEventListener('change', (event) => {
                indentSize = parseInt(event.target.value);
                localStorage.setItem('jsonIndentSize', indentSize);
                
                // Update the JSON preview if it's visible
                if (dom.jsonPreview.classList.contains('show')) {
                    updateJsonPreview();
                }
            });
        });

        // Add event listeners for object selector and buttons
        const objectSelector = document.getElementById('object-selector');
        if (objectSelector) {
            objectSelector.addEventListener('change', handleObjectSelectorChange);
        }
        
        const newObjectBtn = document.getElementById('new-object-btn');
        if (newObjectBtn) {
            newObjectBtn.addEventListener('click', handleCreateNewObject);
        }
        
        // Replace separate button handlers with combined action button handler
        const actionButton = document.getElementById('action-btn');
        if (actionButton) {
            actionButton.addEventListener('click', () => {
                const translations = getTranslations();
                
                if (objectsList.length <= 1) {
                    // Reset functionality
                    if (confirm(translations.resetConfirmation)) {
                        resetEditorForm();
                        updateJsonPreview();
                        updateSaveButtonState();
                        updateResetButtonState();
                    }
                } else {
                    // Remove functionality
                    handleRemoveCurrentObject();
                }
            });
        }
    };

    // --- Reset Form Functionality ---
    const resetEditorForm = (preserveSubtype = '0') => {
        // Reset optional fields by unchecking all optional checkboxes
        // Directly get checkbox elements by ID to ensure we're working with the actual DOM elements
        const optionalCheckboxes = [
            document.getElementById('name-checkbox'),
            document.getElementById('sound-checkbox'), 
            document.getElementById('text-checkbox'), 
            document.getElementById('troopPlacement-checkbox'), 
            document.getElementById('states-checkbox')
        ];
        
        optionalCheckboxes.forEach(checkbox => {
            if (checkbox && checkbox.checked) {
                checkbox.checked = false;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        
        // Set object subtype to the preserved value instead of always defaulting to '0'
        if (dom.objectSubtypeInput) {
            dom.objectSubtypeInput.value = preserveSubtype;
        }
        
        // Clear all text inputs in optional sections
        if (dom.nameInput) dom.nameInput.value = '';
        if (dom.soundEnterInput) dom.soundEnterInput.value = '';
        if (dom.soundLoopInput) dom.soundLoopInput.value = '';
        if (dom.textVisitTextarea) dom.textVisitTextarea.value = '';
        
        // Reset properties container
        const propertyItems = dom.propertiesContainer.querySelectorAll('.property-item');
        
        // Keep only the first property item and clear its value
        if (propertyItems.length > 0) {
            const firstInput = propertyItems[0].querySelector('.property-input');
            if (firstInput) {
                firstInput.value = '';
            }
            
            // Remove additional property items
            for (let i = 1; i < propertyItems.length; i++) {
                propertyItems[i].remove();
            }
        }
        
        // Reset enabled checkbox
        if (dom.enabledCheckbox) {
            dom.enabledCheckbox.checked = false;
            dom.enabledCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        // Reset troopPlacement
        if (dom.isBankSelect) {
            const trueOption = dom.isBankSelect.querySelector('option[value="true"]');
            if (trueOption) {
                trueOption.selected = true;
                dom.isBankSelect.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
        
        // Reset states - remove all except the first one
        const stateItems = dom.statesItemsContainer.querySelectorAll('.state-item');
        if (stateItems.length > 1) {
            // Keep the first state but reset its values
            const firstState = stateItems[0];
            resetStateItem(firstState);
            
            // Remove additional states
            for (let i = 1; i < stateItems.length; i++) {
                stateItems[i].remove();
            }
            
            // Update tabs
            updateStateTabs(dom);
            activateStateTab(0, dom);
        } else if (stateItems.length === 1) {
            // Just reset the single state
            resetStateItem(stateItems[0]);
        }
        
        formModified = false;
        updatePropertyWarnings();
    };
    
    // Update reset button state based on form changes
    const updateResetButtonState = (isModified = formModified) => {
        updateActionButtonState(isModified); // Use the combined function for both cases
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

    const toggleJsonPreview = () => {
        const isVisible = dom.jsonPreview.classList.toggle('show');
        const translations = getTranslations();
        dom.toggleJsonButton.textContent = isVisible ? translations.hideJsonCode : translations.showJsonCode;
        if (isVisible) {
            updateJsonPreview(); // Ensure preview is up-to-date when shown
        }
    };

    // --- Properties Management ---
    // Add the missing function that was referenced in the event listeners
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
        updatePropertyWarnings(); // Make sure we check for warnings on the new property
        updateSaveButtonState(); // Update save button state after adding property
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

    // --- Start the Application ---
    init();
    
    // Create a custom event that can be used to trigger adding a property
    // (Used by loadObjectData in object-management.js)
    document.addEventListener('addProperty', addProperty);
});