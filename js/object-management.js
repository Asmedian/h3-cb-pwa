'use strict';

// Import translation function
import { getTranslations } from './localization.js';

/**
 * Check if a type/subtype combination already exists
 * @param {Array} objectsList - List of objects
 * @param {string} type - Object type
 * @param {string} subtype - Object subtype
 * @param {number} currentObjectIndex - Current object index
 * @returns {boolean} - True if duplicate exists
 */
export const isDuplicateObject = (objectsList, type, subtype, currentObjectIndex) => {
    return objectsList.some((obj, index) => 
        index !== currentObjectIndex && obj.type === type && obj.subtype === subtype
    );
};

/**
 * Show or hide the duplicate warning
 * @param {boolean} show - Whether to show warning
 * @param {HTMLElement} warningElement - Warning element
 * @param {HTMLElement} saveButton - Save button element
 * @param {Function} validateRequiredFields - Function to validate required fields
 * @param {Object} dom - DOM elements
 */
export const showDuplicateWarning = (show, warningElement, saveButton, validateRequiredFields, dom) => {
    if (warningElement) {
        warningElement.style.display = show ? 'flex' : 'none';
    }
    
    // Also disable the save button if warning is shown
    if (saveButton) {
        saveButton.disabled = show || !validateRequiredFields(dom);
    }
};

/**
 * Create a new object
 * @param {Object} dom - DOM elements
 * @param {Array} objectsList - List of objects
 * @param {number} currentObjectIndex - Current object index
 * @param {Function} saveCurrentObjectDataFn - Function to save current object data
 * @param {Function} updateObjectSelector - Function to update object selector
 * @param {Function} resetEditorForm - Function to reset editor form
 * @param {Function} updateJsonPreview - Function to update JSON preview
 * @param {Function} updateActionButtonState - Function to update action button state
 * @returns {number} - New current object index
 */
export const createNewObject = (
    dom, 
    objectsList, 
    currentObjectIndex,
    saveCurrentObjectDataFn, 
    updateObjectSelector, 
    resetEditorForm,
    updateJsonPreview,
    updateActionButtonState
) => {
    // Get current type
    const type = dom.objectTypeInput ? dom.objectTypeInput.textContent : '16';
    
    // Save current form data for the current object
    saveCurrentObjectDataFn();
    
    // Add the new object to the list with the default subtype value "0"
    objectsList.push({ 
        type: type, 
        subtype: '0',
        data: {} // Empty data object to be filled later
    });
    
    // Update the current index to point to the new object
    const newIndex = objectsList.length - 1;
    
    // Update the selector UI
    updateObjectSelector(newIndex);
    
    // Reset the form for the new object with default subtype '0'
    resetEditorForm('0');
    
    updateJsonPreview();
    updateActionButtonState(false); // Reset form modified state
    
    return newIndex;
};

/**
 * Remove the current object
 * @param {Array} objectsList - List of objects
 * @param {number} currentObjectIndex - Current object index
 * @param {Function} updateObjectSelector - Function to update object selector
 * @param {Function} loadObjectData - Function to load object data
 * @param {Function} updateJsonPreview - Function to update JSON preview
 * @param {Function} updateActionButtonState - Function to update action button state
 * @param {Function} getTranslations - Function to get translations
 * @returns {number} - New current object index
 */
export const removeCurrentObject = (
    objectsList, 
    currentObjectIndex, 
    updateObjectSelector, 
    loadObjectData,
    updateJsonPreview,
    updateActionButtonState,
    getTranslations
) => {
    const translations = getTranslations();
    
    // Don't allow removing if only one object
    if (objectsList.length <= 1) {
        return currentObjectIndex;
    }
    
    // Show confirmation dialog
    if (confirm(translations.removeObjectConfirmation || 'Are you sure you want to remove this object?')) {
        // Remove the current object
        objectsList.splice(currentObjectIndex, 1);
        
        // Adjust current index if needed
        if (currentObjectIndex >= objectsList.length) {
            currentObjectIndex = objectsList.length - 1;
        }
        
        // Update selector UI
        updateObjectSelector(currentObjectIndex);
        
        // Load the data for the now-current object
        loadObjectData(currentObjectIndex);
        
        updateJsonPreview();
        updateActionButtonState(false); // Reset form modified state
    }
    
    return currentObjectIndex;
};

/**
 * Update the object selector dropdown with current objects
 * @param {Array} objectsList - List of objects
 * @param {number} currentObjectIndex - Current object index
 * @param {Function} updateActionButtonState - Function to update action button state
 */
export const updateObjectSelector = (objectsList, currentObjectIndex, updateActionButtonState) => {
    const selector = document.getElementById('object-selector');
    if (!selector) return;
    
    // Clear existing options
    selector.innerHTML = '';
    
    // Get translations for type and subtype
    const translations = getTranslations();
    const typeLabel = translations.fieldLabels?.type || 'type';
    const subtypeLabel = translations.fieldLabels?.subtype || 'subtype';
    
    // Add each object as an option
    objectsList.forEach((obj, index) => {
        const option = document.createElement('option');
        option.value = index;
        
        // Display name if available, otherwise show type and subtype
        if (obj.data && obj.data.name) {
            option.textContent = `[#${index + 1}] ${obj.data.name}`;
        } else {
            option.textContent = `[#${index + 1}] ${typeLabel}:${obj.type} ${subtypeLabel}:${obj.subtype}`;
        }
        
        selector.appendChild(option);
    });
    
    // Set the current selection
    selector.value = currentObjectIndex;
    
    // Update the action button based on number of objects
    updateActionButtonState();
};

/**
 * Update the object selector option text
 * @param {HTMLElement} selector - Object selector element
 * @param {number} currentObjectIndex - Current object index
 * @param {HTMLElement} objectTypeInput - Object type input
 * @param {HTMLElement} objectSubtypeInput - Object subtype input
 * @param {HTMLElement} nameCheckbox - Name checkbox element
 * @param {HTMLElement} nameInput - Name input element
 */
export const updateObjectSelectorOption = (
    selector,
    currentObjectIndex,
    objectTypeInput,
    objectSubtypeInput,
    nameCheckbox,
    nameInput
) => {
    const option = selector.options[currentObjectIndex];
    if (option) {
        // Check if name field is enabled and has a value
        if (nameCheckbox && nameCheckbox.checked && nameInput && nameInput.value.trim()) {
            option.textContent = `[#${currentObjectIndex + 1}] ${nameInput.value.trim()}`;
        } else {
            const translations = getTranslations();
            const typeLabel = translations.fieldLabels?.type || 'type';
            const subtypeLabel = translations.fieldLabels?.subtype || 'subtype';
            const type = objectTypeInput ? objectTypeInput.textContent : '16';
            const subtype = objectSubtypeInput ? objectSubtypeInput.value : '0';
            option.textContent = `[#${currentObjectIndex + 1}] ${typeLabel}:${type} ${subtypeLabel}:${subtype}`;
        }
    }
};

/**
 * Save current form data to the objects list
 * @param {Array} objectsList - List of objects
 * @param {number} currentObjectIndex - Current object index
 * @param {HTMLElement} objectTypeInput - Object type input
 * @param {HTMLElement} objectSubtypeInput - Object subtype input
 * @param {Function} captureFormState - Function to capture form state
 * @param {Function} updateObjectSelectorOption - Function to update object selector option
 * @param {Function} showDuplicateWarning - Function to show duplicate warning
 * @param {HTMLElement} warningElement - Warning element
 * @param {HTMLElement} saveButton - Save button element
 * @param {Function} validateRequiredFields - Function to validate required fields
 * @param {Object} dom - DOM elements
 * @param {Function} updateJsonPreview - Function to update JSON preview
 * @returns {boolean} - True if duplicate exists
 */
export const saveCurrentObjectData = (
    objectsList,
    currentObjectIndex,
    objectTypeInput,
    objectSubtypeInput,
    captureFormState,
    updateObjectSelectorOption,
    showDuplicateWarningFn,
    warningElement,
    saveButton,
    validateRequiredFields,
    dom,
    updateJsonPreview
) => {
    // Get current values
    const type = objectTypeInput ? objectTypeInput.textContent : '16';
    const subtype = objectSubtypeInput ? objectSubtypeInput.value : '0';
    
    // Update type/subtype in the objects list
    if (objectsList[currentObjectIndex]) {
        objectsList[currentObjectIndex].type = type;
        objectsList[currentObjectIndex].subtype = subtype;
        
        // Store the form data in the objects list
        objectsList[currentObjectIndex].data = captureFormState();
        
        // Update the selector option text immediately
        const selector = document.getElementById('object-selector');
        if (selector) {
            const nameCheckbox = document.getElementById('name-checkbox');
            updateObjectSelectorOption(
                selector, 
                currentObjectIndex, 
                objectTypeInput, 
                objectSubtypeInput, 
                nameCheckbox, 
                dom.nameInput
            );
        }
    }
    
    // Check for duplicates after updating
    const isDuplicate = objectsList.some((obj, index) => 
        index !== currentObjectIndex && obj.type === type && obj.subtype === subtype
    );
    
    showDuplicateWarningFn(isDuplicate, warningElement, saveButton, validateRequiredFields, dom);
    
    // Update JSON preview
    updateJsonPreview();
    
    return isDuplicate;
};

/**
 * Capture the current form state
 * @param {Object} dom - DOM elements
 * @returns {Object} - Form data object
 */
export const captureFormState = (dom) => {
    // Create an object to store all form data
    const formData = {
        properties: Array.from(dom.propertiesContainer.querySelectorAll('.property-input'))
            .map(input => input.value),
    };

    // Object Generation
    if (dom.enabledCheckbox.checked) {
        formData.enabled = dom.enabledSelect.value === 'true';
        formData.value = dom.valueInput.value;
        formData.density = dom.densityInput.value;
    }

    // Optional fields
    if (document.getElementById('name-checkbox').checked && dom.nameInput.value.trim()) {
        formData.name = dom.nameInput.value;
    }

    if (document.getElementById('sound-checkbox').checked) {
        const enter = dom.soundEnterInput.value.trim();
        const loop = dom.soundLoopInput.value.trim();
        if (enter || loop) {
            formData.sound = {};
            if (enter) formData.sound.enter = enter;
            if (loop) formData.sound.loop = loop;
        }
    }

    if (document.getElementById('text-checkbox').checked && dom.textVisitTextarea.value.trim()) {
        formData.text = { visit: dom.textVisitTextarea.value };
    }

    // Troop Placement
    if (dom.troopPlacementCheckbox.checked) {
        formData.troopPlacement = {
            isBank: dom.isBankSelect.value === 'true'
        };
        
        if (dom.attackersInput.value) {
            const value = dom.attackersInput.value.trim();
            if (value.startsWith('[') && value.endsWith(']')) {
                try {
                    formData.troopPlacement.attackers = JSON.parse(value);
                } catch (e) {
                    console.error('Error parsing attackers data:', e);
                }
            }
        }
        
        if (dom.defendersInput.value) {
            const value = dom.defendersInput.value.trim();
            if (value.startsWith('[') && value.endsWith(']')) {
                try {
                    formData.troopPlacement.defenders = JSON.parse(value);
                } catch (e) {
                    console.error('Error parsing defenders data:', e);
                }
            }
        }
    }

    // States
    if (dom.statesCheckbox.checked) {
        const stateItems = dom.statesItemsContainer.querySelectorAll('.state-item');
        if (stateItems.length > 0) {
            formData.states = [];
            
            stateItems.forEach(stateElement => {
                const stateObj = {};
                
                // Helper functions for extracting values from state
                const getCheckboxValue = selector => {
                    const checkbox = stateElement.querySelector(selector);
                    return checkbox ? checkbox.checked : false;
                };
                
                const getInputValue = selector => {
                    const input = stateElement.querySelector(selector);
                    return input ? input.value : '';
                };
                
                // Morale
                if (getCheckboxValue('.state-morale-checkbox')) {
                    const value = parseInt(getInputValue('.state-morale-input'));
                    if (!isNaN(value)) stateObj.morale = value;
                }
                
                // Luck
                if (getCheckboxValue('.state-luck-checkbox')) {
                    const value = parseInt(getInputValue('.state-luck-input'));
                    if (!isNaN(value)) stateObj.luck = value;
                }
                
                // Spell Points
                if (getCheckboxValue('.state-spellPoints-checkbox')) {
                    const value = parseInt(getInputValue('.state-spellPoints-input'));
                    if (!isNaN(value)) stateObj.spellPoints = value;
                }
                
                // Experience
                if (getCheckboxValue('.state-experience-checkbox')) {
                    const value = parseInt(getInputValue('.state-experience-input'));
                    if (!isNaN(value)) stateObj.experience = value;
                }
                
                // Creature Reward
                if (getCheckboxValue('.state-creatureReward-checkbox')) {
                    const type = parseInt(getInputValue('.state-creatureRewardType-input'));
                    if (!isNaN(type)) {
                        stateObj.creatureRewardType = type;
                        
                        if (type !== -1) {
                            const count = parseInt(getInputValue('.state-creatureRewardCount-input'));
                            if (!isNaN(count)) stateObj.creatureRewardCount = count;
                        }
                    }
                }
                
                // Custom DEF
                if (getCheckboxValue('.state-customDef-checkbox')) {
                    const customDef = getInputValue('.state-customDef-input');
                    if (customDef) stateObj.customDef = customDef;
                }
                
                // Upgrade
                if (getCheckboxValue('.state-upgrade-checkbox')) {
                    const value = parseInt(getInputValue('.state-upgrade-input'));
                    if (!isNaN(value)) stateObj.upgrade = value;
                }
                
                // Chance
                if (getCheckboxValue('.state-chance-checkbox')) {
                    const value = parseInt(getInputValue('.state-chance-input'));
                    if (!isNaN(value)) stateObj.chance = value;
                }
                
                // Skills
                if (getCheckboxValue('.state-skills-checkbox')) {
                    const attack = parseInt(getInputValue('.state-skills-primary-attack'));
                    const defense = parseInt(getInputValue('.state-skills-primary-defense'));
                    const power = parseInt(getInputValue('.state-skills-primary-power'));
                    const knowledge = parseInt(getInputValue('.state-skills-primary-knowledge'));
                    
                    if (!isNaN(attack) || !isNaN(defense) || !isNaN(power) || !isNaN(knowledge)) {
                        stateObj.skills = {
                            primary: [
                                !isNaN(attack) ? attack : 0,
                                !isNaN(defense) ? defense : 0,
                                !isNaN(power) ? power : 0,
                                !isNaN(knowledge) ? knowledge : 0
                            ]
                        };
                    }
                }
                
                // Artifact IDs
                if (getCheckboxValue('.state-artifactIds-checkbox')) {
                    const ids = [];
                    for (let i = 1; i <= 4; i++) {
                        const value = parseInt(getInputValue(`.state-artifactIds-${i}`));
                        if (!isNaN(value) && value !== -1) ids.push(value);
                    }
                    if (ids.length > 0) stateObj.artifactIds = ids;
                }
                
                // Artifact Type Counts
                if (getCheckboxValue('.state-artifactTypeCounts-checkbox')) {
                    const treasure = parseInt(getInputValue('.state-artifactTypeCounts-treasure'));
                    const minor = parseInt(getInputValue('.state-artifactTypeCounts-minor'));
                    const major = parseInt(getInputValue('.state-artifactTypeCounts-major'));
                    const relic = parseInt(getInputValue('.state-artifactTypeCounts-relic'));
                    
                    if (!isNaN(treasure) || !isNaN(minor) || !isNaN(major) || !isNaN(relic)) {
                        stateObj.artifactTypeCounts = [
                            !isNaN(treasure) ? treasure : 0,
                            !isNaN(minor) ? minor : 0,
                            !isNaN(major) ? major : 0,
                            !isNaN(relic) ? relic : 0
                        ];
                    }
                }
                
                // Resources
                if (getCheckboxValue('.state-resources-checkbox')) {
                    const wood = parseInt(getInputValue('.state-resources-wood'));
                    const ore = parseInt(getInputValue('.state-resources-ore'));
                    const mercury = parseInt(getInputValue('.state-resources-mercury'));
                    const sulfur = parseInt(getInputValue('.state-resources-sulfur'));
                    const crystal = parseInt(getInputValue('.state-resources-crystal'));
                    const gems = parseInt(getInputValue('.state-resources-gems'));
                    const gold = parseInt(getInputValue('.state-resources-gold'));
                    const mithril = parseInt(getInputValue('.state-resources-mithril'));
                    
                    stateObj.resources = [
                        !isNaN(wood) ? wood : 0,
                        !isNaN(ore) ? ore : 0,
                        !isNaN(mercury) ? mercury : 0,
                        !isNaN(sulfur) ? sulfur : 0,
                        !isNaN(crystal) ? crystal : 0,
                        !isNaN(gems) ? gems : 0,
                        !isNaN(gold) ? gold : 0,
                        !isNaN(mithril) ? mithril : 0
                    ];
                }
                
                // Guardians
                if (getCheckboxValue('.state-guardians-checkbox')) {
                    const guardianTypes = [];
                    const guardianCounts = [];
                    
                    for (let i = 1; i <= 7; i++) {
                        const type = parseInt(getInputValue(`.state-guardians-type-${i}`));
                        const count = parseInt(getInputValue(`.state-guardians-count-${i}`));
                        if (!isNaN(type)) guardianTypes.push(type);
                        if (!isNaN(count)) guardianCounts.push(count);
                    }
                    
                    if (guardianTypes.length > 0 || guardianCounts.length > 0) {
                        stateObj.guardians = {};
                        if (guardianTypes.length > 0) stateObj.guardians.type = guardianTypes;
                        if (guardianCounts.length > 0) stateObj.guardians.count = guardianCounts;
                    }
                }
                
                // Spells
                if (getCheckboxValue('.state-spells-checkbox')) {
                    const spellItems = stateElement.querySelectorAll('.state-spells-items .array-item');
                    if (spellItems.length > 0) {
                        stateObj.spells = [];
                        
                        spellItems.forEach(spellItem => {
                            const spellObj = {};
                            const idRadio = spellItem.querySelector('.spell-type-radio[value="id"]');
                            
                            if (idRadio && idRadio.checked) {
                                const idInput = spellItem.querySelector('.spell-id-input');
                                if (idInput) {
                                    const id = parseInt(idInput.value);
                                    if (!isNaN(id)) spellObj.id = id;
                                }
                            } else {
                                const bits = {};
                                const flagsInput = spellItem.querySelector('.spell-bits-flags-value');
                                const levelsInput = spellItem.querySelector('.spell-bits-levels-value');
                                const schoolsInput = spellItem.querySelector('.spell-bits-schools-value');
                                
                                if (flagsInput && flagsInput.value) {
                                    const flags = parseInt(flagsInput.value);
                                    if (!isNaN(flags)) bits.flags = flags;
                                }
                                
                                if (levelsInput && levelsInput.value) {
                                    const levels = parseInt(levelsInput.value);
                                    if (!isNaN(levels)) bits.levels = levels;
                                }
                                
                                if (schoolsInput && schoolsInput.value) {
                                    const schools = parseInt(schoolsInput.value);
                                    if (!isNaN(schools)) bits.schools = schools;
                                }
                                
                                if (Object.keys(bits).length > 0) spellObj.bits = bits;
                            }
                            
                            if (Object.keys(spellObj).length > 0) {
                                stateObj.spells.push(spellObj);
                            }
                        });
                    }
                }
                
                // Add state to array only if it contains data
                if (Object.keys(stateObj).length > 0) {
                    formData.states.push(stateObj);
                }
            });
        }
    }

    return formData;
};

/**
 * Load object data into the form
 * @param {Array} objectsList - List of objects
 * @param {number} index - Object index to load
 * @param {Function} resetEditorForm - Function to reset editor form
 * @param {Function} updatePropertyWarnings - Function to update property warnings
 * @param {Function} updateJsonPreview - Function to update JSON preview
 * @param {Function} updateCustomDefWarnings - Function to update custom def warnings
 * @param {Function} updateResetButtonState - Function to update reset button state
 * @param {Function} updateStateTabs - Function to update state tabs
 * @param {Function} activateStateTab - Function to activate state tab
 * @param {Function} updateSpellTabs - Function to update spell tabs
 * @param {Function} updateLineBreakIndicators - Function to update line break indicators
 * @param {Function} resetSpellItem - Function to reset spell item
 * @param {Function} populateSpellItem - Function to populate spell item
 * @param {Object} dom - DOM elements
 */
export const loadObjectData = (
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
) => {
    if (!objectsList[index]) {
        return; // Exit if no object at this index
    }
    
    // Always preserve the subtype from the objectsList
    const preservedSubtype = objectsList[index].subtype;
    
    if (!objectsList[index].data) {
        // If no data, reset the form with preserved subtype directly
        resetEditorForm(preservedSubtype);
        return;
    }
    
    const data = objectsList[index].data;
    
    // Reset the form with preserved subtype (no need to set it again later)
    resetEditorForm(preservedSubtype);
    
    // Restore properties
    if (data.properties && data.properties.length > 0) {
        // Set the first property
        const firstInput = dom.propertiesContainer.querySelector('.property-input');
        if (firstInput && data.properties[0]) {
            firstInput.value = data.properties[0];
        }
        
        // Add additional properties
        for (let i = 1; i < data.properties.length; i++) {
            const addPropertyEvent = new CustomEvent('addProperty');
            document.dispatchEvent(addPropertyEvent);
            
            const newInput = dom.propertiesContainer.querySelector(`.property-item:nth-child(${i+1}) .property-input`);
            if (newInput && data.properties[i]) {
                newInput.value = data.properties[i];
            }
        }
    }
    
    // Restore Object Generation fields
    if (data.enabled !== undefined) {
        dom.enabledCheckbox.checked = true;
        dom.enabledCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        dom.enabledSelect.value = data.enabled.toString();
        
        if (data.value !== undefined) {
            dom.valueInput.value = data.value;
        }
        
        if (data.density !== undefined) {
            dom.densityInput.value = data.density;
        }
    }
    
    // Restore name field
    if (data.name) {
        const nameCheckbox = document.getElementById('name-checkbox');
        if (nameCheckbox) {
            nameCheckbox.checked = true;
            nameCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
        dom.nameInput.value = data.name;
    }
    
    // Restore sound fields
    if (data.sound) {
        const soundCheckbox = document.getElementById('sound-checkbox');
        if (soundCheckbox) {
            soundCheckbox.checked = true;
            soundCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        if (data.sound.enter) {
            dom.soundEnterInput.value = data.sound.enter;
        }
        
        if (data.sound.loop) {
            dom.soundLoopInput.value = data.sound.loop;
        }
    }
    
    // Restore text field
    if (data.text && data.text.visit) {
        const textCheckbox = document.getElementById('text-checkbox');
        if (textCheckbox) {
            textCheckbox.checked = true;
            textCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
        dom.textVisitTextarea.value = data.text.visit;
        // Update line break indicators
        updateLineBreakIndicators(dom.textVisitTextarea);
    }
    
    // Restore troop placement
    if (data.troopPlacement) {
        dom.troopPlacementCheckbox.checked = true;
        dom.troopPlacementCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        
        if (data.troopPlacement.isBank !== undefined) {
            dom.isBankSelect.value = data.troopPlacement.isBank.toString();
            // Need to trigger change event to update any dependent UI
            dom.isBankSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        // Only set custom attackers/defenders if they exist
        if (data.troopPlacement.attackers) {
            dom.attackersInput.value = JSON.stringify(data.troopPlacement.attackers);
        }
        
        if (data.troopPlacement.defenders) {
            dom.defendersInput.value = JSON.stringify(data.troopPlacement.defenders);
        }
    }
    
    // Restore states
    if (data.states && data.states.length > 0) {
        dom.statesCheckbox.checked = true;
        dom.statesCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Remove existing states except the first one
        const stateItems = dom.statesItemsContainer.querySelectorAll('.state-item');
        for (let i = 1; i < stateItems.length; i++) {
            stateItems[i].remove();
        }
        
        // Reset first state
        if (stateItems.length > 0) {
            resetStateItem(stateItems[0]);
        }
        
        // Add more states if needed
        for (let i = 1; i < data.states.length; i++) {
            dom.addStateButton.click(); // Use the existing add state functionality
        }
        
        // Now populate each state
        const updatedStateItems = dom.statesItemsContainer.querySelectorAll('.state-item');
        data.states.forEach((stateData, idx) => {
            if (idx < updatedStateItems.length) {
                populateStateItem(updatedStateItems[idx], stateData, updateSpellTabs);
            }
        });
        
        // Update state tabs
        updateStateTabs(dom);
        activateStateTab(0, dom);
    }
    
    // Update UI state
    updatePropertyWarnings();
    updateJsonPreview();
    updateCustomDefWarnings();
    updateResetButtonState(false); // Reset form modified state
};

/**
 * Helper function to reset a spell item
 * @param {HTMLElement} spellItem - Spell item element
 */
export const resetSpellItem = (spellItem) => {
    if (!spellItem) return;
    
    // Reset to ID mode
    const idRadio = spellItem.querySelector('.spell-type-radio[value="id"]');
    if (idRadio) {
        idRadio.checked = true;
        idRadio.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Reset ID value
    const idInput = spellItem.querySelector('.spell-id-input');
    if (idInput) {
        idInput.value = '0';
    }
    
    // Reset all checkboxes for flags/levels/schools
    const checkboxes = spellItem.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Reset hidden values
    const hiddenInputs = spellItem.querySelectorAll('.spell-bits-flags-value, .spell-bits-levels-value, .spell-bits-schools-value');
    hiddenInputs.forEach(input => {
        input.value = '';
    });
};

/**
 * Helper function to populate a spell item with data
 * @param {HTMLElement} spellItem - Spell item element
 * @param {Object} spellData - Spell data object
 */
export const populateSpellItem = (spellItem, spellData) => {
    if (!spellItem || !spellData) return;
    
    if (spellData.id !== undefined) {
        // Set ID radio button
        const idRadio = spellItem.querySelector('.spell-type-radio[value="id"]');
        if (idRadio) {
            idRadio.checked = true;
            idRadio.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Set ID value
            const idInput = spellItem.querySelector('.spell-id-input');
            if (idInput) {
                idInput.value = spellData.id;
            }
        }
    } else if (spellData.bits) {
        // Set Bits radio button
        const bitsRadio = spellItem.querySelector('.spell-type-radio[value="bits"]');
        if (bitsRadio) {
            bitsRadio.checked = true;
            bitsRadio.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Set flags
            if (spellData.bits.flags !== undefined) {
                const flagsInput = spellItem.querySelector('.spell-bits-flags-value');
                if (flagsInput) {
                    flagsInput.value = spellData.bits.flags;
                    
                    // Update flag checkboxes
                    const flagsValue = parseInt(spellData.bits.flags);
                    if (!isNaN(flagsValue)) {
                        spellItem.querySelectorAll('.spell-flag-checkbox').forEach(checkbox => {
                            const flagBit = parseInt(checkbox.value);
                            checkbox.checked = (flagsValue & flagBit) === flagBit;
                        });
                    }
                }
            }
            
            // Set levels
            if (spellData.bits.levels !== undefined) {
                const levelsInput = spellItem.querySelector('.spell-bits-levels-value');
                if (levelsInput) {
                    levelsInput.value = spellData.bits.levels;
                    
                    // Update level checkboxes
                    const levelsValue = parseInt(spellData.bits.levels);
                    if (!isNaN(levelsValue)) {
                        spellItem.querySelectorAll('.spell-level-checkbox').forEach(checkbox => {
                            const levelBit = parseInt(checkbox.value);
                            checkbox.checked = (levelsValue & levelBit) === levelBit;
                        });
                    }
                }
            }
            
            // Set schools
            if (spellData.bits.schools !== undefined) {
                const schoolsInput = spellItem.querySelector('.spell-bits-schools-value');
                if (schoolsInput) {
                    schoolsInput.value = spellData.bits.schools;
                    
                    // Update school checkboxes
                    const schoolsValue = parseInt(spellData.bits.schools);
                    if (!isNaN(schoolsValue)) {
                        spellItem.querySelectorAll('.spell-school-checkbox').forEach(checkbox => {
                            const schoolBit = parseInt(checkbox.value);
                            checkbox.checked = (schoolsValue & schoolBit) === schoolBit;
                        });
                    }
                }
            }
        }
    }
};

/**
 * Helper function to reset a state item
 * @param {HTMLElement} stateItem - State item element
 */
export const resetStateItem = (stateItem) => {
    // Uncheck all checkboxes
    const checkboxes = stateItem.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            checkbox.checked = false;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
    
    // Set specific fields to empty string instead of default values
    const fieldsToEmpty = [
        '.spell-id-input',           // spells->By ID
        '.state-skills-primary-attack', '.state-skills-primary-defense', 
        '.state-skills-primary-power', '.state-skills-primary-knowledge', // skills->primary
        '.state-upgrade-input',      // upgrade
        '.state-morale-input',       // morale
        '.state-luck-input',         // luck
        '.state-spellPoints-input',  // spellPoints
        '.state-experience-input',   // experience
        '.state-chance-input',       // chance
        '.state-artifactTypeCounts-treasure', '.state-artifactTypeCounts-minor',
        '.state-artifactTypeCounts-major', '.state-artifactTypeCounts-relic' // artifactTypeCounts
    ];
    
    fieldsToEmpty.forEach(selector => {
        const input = stateItem.querySelector(selector);
        if (input) input.value = '';
    });
    
    // Reset spells
    const spellItems = stateItem.querySelectorAll('.state-spells-items .array-item');
    if (spellItems.length > 0) {
        // Keep only first spell but reset it
        const firstSpell = spellItems[0];
        if (firstSpell) {
            const idInput = firstSpell.querySelector('.spell-id-input');
            if (idInput) idInput.value = ''; // Set to empty instead of '0'
            
            // Reset radio buttons to ID selection
            const idRadio = firstSpell.querySelector('.spell-type-radio[value="id"]');
            if (idRadio && !idRadio.checked) {
                idRadio.checked = true;
                idRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
        
        // Remove additional spells
        for (let i = 1; i < spellItems.length; i++) {
            spellItems[i].remove();
        }
        
        // Update spell tabs
        const updateSpellTabsEvent = new CustomEvent('updateSpellTabs', {
            detail: { stateItem, tabIndex: 0 }
        });
        document.dispatchEvent(updateSpellTabsEvent);
    }
};

/**
 * Helper function to populate a state item with data
 * @param {HTMLElement} stateItem - State item element
 * @param {Object} stateData - State data object
 * @param {Function} updateSpellTabs - Function to update spell tabs
 */
export const populateStateItem = (stateItem, stateData, updateSpellTabs) => {
    // Restore morale
    if (stateData.morale !== undefined) {
        const moraleCheckbox = stateItem.querySelector('.state-morale-checkbox');
        const moraleInput = stateItem.querySelector('.state-morale-input');
        if (moraleCheckbox && moraleInput) {
            moraleCheckbox.checked = true;
            moraleCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
            moraleInput.value = stateData.morale;
        }
    }
    
    // Restore luck
    if (stateData.luck !== undefined) {
        const luckCheckbox = stateItem.querySelector('.state-luck-checkbox');
        const luckInput = stateItem.querySelector('.state-luck-input');
        if (luckCheckbox && luckInput) {
            luckCheckbox.checked = true;
            luckCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
            luckInput.value = stateData.luck;
        }
    }
    
    // Restore spell points
    if (stateData.spellPoints !== undefined) {
        const spellPointsCheckbox = stateItem.querySelector('.state-spellPoints-checkbox');
        const spellPointsInput = stateItem.querySelector('.state-spellPoints-input');
        if (spellPointsCheckbox && spellPointsInput) {
            spellPointsCheckbox.checked = true;
            spellPointsCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
            spellPointsInput.value = stateData.spellPoints;
        }
    }
    
    // Restore experience
    if (stateData.experience !== undefined) {
        const experienceCheckbox = stateItem.querySelector('.state-experience-checkbox');
        const experienceInput = stateItem.querySelector('.state-experience-input');
        if (experienceCheckbox && experienceInput) {
            experienceCheckbox.checked = true;
            experienceCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
            experienceInput.value = stateData.experience;
        }
    }
    
    // Restore creature reward
    if (stateData.creatureRewardType !== undefined) {
        const creatureRewardCheckbox = stateItem.querySelector('.state-creatureReward-checkbox');
        const typeInput = stateItem.querySelector('.state-creatureRewardType-input');
        const countInput = stateItem.querySelector('.state-creatureRewardCount-input');
        
        if (creatureRewardCheckbox && typeInput) {
            creatureRewardCheckbox.checked = true;
            creatureRewardCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
            typeInput.value = stateData.creatureRewardType;
            
            // Trigger input event to update related count field
            typeInput.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Only set count if type is not -1
            if (stateData.creatureRewardCount !== undefined && stateData.creatureRewardType !== -1) {
                if (countInput) countInput.value = stateData.creatureRewardCount;
            }
        }
    }
    
    // Restore custom DEF
    if (stateData.customDef !== undefined) {
        const customDefCheckbox = stateItem.querySelector('.state-customDef-checkbox');
        const customDefInput = stateItem.querySelector('.state-customDef-input');
        if (customDefCheckbox && customDefInput) {
            customDefCheckbox.checked = true;
            customDefCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
            customDefInput.value = stateData.customDef;
        }
    }
    
    // Restore upgrade
    if (stateData.upgrade !== undefined) {
        const upgradeCheckbox = stateItem.querySelector('.state-upgrade-checkbox');
        const upgradeInput = stateItem.querySelector('.state-upgrade-input');
        if (upgradeCheckbox && upgradeInput) {
            upgradeCheckbox.checked = true;
            upgradeCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
            upgradeInput.value = stateData.upgrade;
        }
    }
    
    // Restore chance
    if (stateData.chance !== undefined) {
        const chanceCheckbox = stateItem.querySelector('.state-chance-checkbox');
        const chanceInput = stateItem.querySelector('.state-chance-input');
        if (chanceCheckbox && chanceInput) {
            chanceCheckbox.checked = true;
            chanceCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
            chanceInput.value = stateData.chance;
        }
    }
    
    // Restore skills
    if (stateData.skills && stateData.skills.primary) {
        const skillsCheckbox = stateItem.querySelector('.state-skills-checkbox');
        if (skillsCheckbox) {
            skillsCheckbox.checked = true;
            skillsCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
            
            const attackInput = stateItem.querySelector('.state-skills-primary-attack');
            const defenseInput = stateItem.querySelector('.state-skills-primary-defense');
            const powerInput = stateItem.querySelector('.state-skills-primary-power');
            const knowledgeInput = stateItem.querySelector('.state-skills-primary-knowledge');
            
            if (attackInput && stateData.skills.primary[0] !== undefined) {
                attackInput.value = stateData.skills.primary[0];
            }
            if (defenseInput && stateData.skills.primary[1] !== undefined) {
                defenseInput.value = stateData.skills.primary[1];
            }
            if (powerInput && stateData.skills.primary[2] !== undefined) {
                powerInput.value = stateData.skills.primary[2];
            }
            if (knowledgeInput && stateData.skills.primary[3] !== undefined) {
                knowledgeInput.value = stateData.skills.primary[3];
            }
        }
    }
    
    // Restore artifact IDs
    if (stateData.artifactIds && stateData.artifactIds.length > 0) {
        const artifactIdsCheckbox = stateItem.querySelector('.state-artifactIds-checkbox');
        if (artifactIdsCheckbox) {
            artifactIdsCheckbox.checked = true;
            artifactIdsCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Set values for up to 4 artifacts
            for (let i = 0; i < Math.min(stateData.artifactIds.length, 4); i++) {
                const input = stateItem.querySelector(`.state-artifactIds-${i+1}`);
                if (input) {
                    input.value = stateData.artifactIds[i];
                }
            }
        }
    }
    
    // Restore artifact type counts
    if (stateData.artifactTypeCounts && stateData.artifactTypeCounts.length > 0) {
        const artifactTypeCountsCheckbox = stateItem.querySelector('.state-artifactTypeCounts-checkbox');
        if (artifactTypeCountsCheckbox) {
            artifactTypeCountsCheckbox.checked = true;
            artifactTypeCountsCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
            
            const treasureInput = stateItem.querySelector('.state-artifactTypeCounts-treasure');
            const minorInput = stateItem.querySelector('.state-artifactTypeCounts-minor');
            const majorInput = stateItem.querySelector('.state-artifactTypeCounts-major');
            const relicInput = stateItem.querySelector('.state-artifactTypeCounts-relic');
            
            if (treasureInput && stateData.artifactTypeCounts[0] !== undefined) {
                treasureInput.value = stateData.artifactTypeCounts[0];
            }
            if (minorInput && stateData.artifactTypeCounts[1] !== undefined) {
                minorInput.value = stateData.artifactTypeCounts[1];
            }
            if (majorInput && stateData.artifactTypeCounts[2] !== undefined) {
                majorInput.value = stateData.artifactTypeCounts[2];
            }
            if (relicInput && stateData.artifactTypeCounts[3] !== undefined) {
                relicInput.value = stateData.artifactTypeCounts[3];
            }
        }
    }
    
    // Restore resources
    if (stateData.resources && stateData.resources.length > 0) {
        const resourcesCheckbox = stateItem.querySelector('.state-resources-checkbox');
        if (resourcesCheckbox) {
            resourcesCheckbox.checked = true;
            resourcesCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
            
            const resourceTypes = ['wood', 'ore', 'mercury', 'sulfur', 'crystal', 'gems', 'gold', 'mithril'];
            resourceTypes.forEach((type, idx) => {
                if (stateData.resources[idx] !== undefined) {
                    const input = stateItem.querySelector(`.state-resources-${type}`);
                    if (input) {
                        input.value = stateData.resources[idx];
                    }
                }
            });
        }
    }
    
    // Restore guardians
    if (stateData.guardians) {
        const guardiansCheckbox = stateItem.querySelector('.state-guardians-checkbox');
        if (guardiansCheckbox) {
            guardiansCheckbox.checked = true;
            guardiansCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Set guardian types
            if (stateData.guardians.type && stateData.guardians.type.length > 0) {
                for (let i = 0; i < Math.min(stateData.guardians.type.length, 7); i++) {
                    const input = stateItem.querySelector(`.state-guardians-type-${i+1}`);
                    if (input) {
                        input.value = stateData.guardians.type[i];
                        // Trigger input to update count dependencies
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            }
            
            // Set guardian counts
            if (stateData.guardians.count && stateData.guardians.count.length > 0) {
                for (let i = 0; i < Math.min(stateData.guardians.count.length, 7); i++) {
                    const input = stateItem.querySelector(`.state-guardians-count-${i+1}`);
                    if (input) {
                        input.value = stateData.guardians.count[i];
                    }
                }
            }
        }
    }
    
    // Restore spells
    if (stateData.spells && stateData.spells.length > 0) {
        const spellsCheckbox = stateItem.querySelector('.state-spells-checkbox');
        if (spellsCheckbox) {
            spellsCheckbox.checked = true;
            spellsCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Clean up existing spells except the first one
            const existingSpells = stateItem.querySelectorAll('.state-spells-items .array-item');
            for (let i = 1; i < existingSpells.length; i++) {
                existingSpells[i].remove();
            }
            
            // Reset first spell if it exists
            if (existingSpells.length > 0) {
                resetSpellItem(existingSpells[0]);
            }
            
            // Populate first spell
            if (existingSpells.length > 0 && stateData.spells[0]) {
                populateSpellItem(existingSpells[0], stateData.spells[0]);
            }
            
            // Add and populate additional spells
            for (let i = 1; i < stateData.spells.length; i++) {
                // Use the state's add spell button
                const addSpellButton = stateItem.querySelector('.add-spell-btn');
                if (addSpellButton) {
                    addSpellButton.click();
                    // Get the newly added spell item
                    const newSpells = stateItem.querySelectorAll('.state-spells-items .array-item');
                    const newSpell = newSpells[newSpells.length - 1];
                    if (newSpell) {
                        populateSpellItem(newSpell, stateData.spells[i]);
                    }
                }
            }
            
            // Update spell tabs
            updateSpellTabs(stateItem, 0);
        }
    }
};
