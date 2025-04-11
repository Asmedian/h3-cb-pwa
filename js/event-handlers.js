'use strict';

// Import DOM elements dependency
import { dom } from './dom-elements.js';

/**
 * Handles input change events
 * @param {Event} event - The input change event
 */
export const handleInputChange = (event, updatePropertyWarnings, updateJsonPreview, updateSaveButtonState, validatePropertyInput) => {
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

/**
 * Handles input blur events for validation
 * @param {Event} event - The blur event
 */
export const handleInputBlur = (event, validateWavFile, validateDefFile, validatePropertyInput, updateCustomDefWarnings, updatePropertyWarnings, updateSaveButtonState) => {
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

/**
 * Handles remove button clicks
 * @param {Event} event - The click event
 */
export const handleRemoveClick = (event, updatePropertyRemoveButtons, renumberStates, updateJsonPreview, updateSaveButtonState, updatePropertyWarnings) => {
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

/**
 * Handles spell removal button clicks
 * @param {Event} event - The click event
 */
export const handleSpellRemoveClick = (event, updateJsonPreview) => {
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

/**
 * Handles add spell button clicks
 * @param {Event} event - The click event
 */
export const handleAddSpellClick = (event, addSpellToState) => {
    const addSpellButton = event.target.closest('.add-spell');
    if (!addSpellButton) return;

    const stateItem = addSpellButton.closest('.state-item');
    if (stateItem) {
        addSpellToState(stateItem);
    }
};

/**
 * Handles optional field checkbox toggle
 * @param {Event} event - The change event
 */
export const handleOptionalFieldToggle = (event, updateStateButtonsState, updateSpellButtonsState, updateCustomDefWarnings, updateJsonPreview, updateSaveButtonState, saveCurrentObjectData) => {
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

    // Save the current form state to the object
    if (typeof saveCurrentObjectData === 'function') {
        saveCurrentObjectData();
    }
};

/**
 * Handles tab clicks for state selection
 * @param {Event} event - The click event
 */
export const handleTabClick = (event, activateStateTab) => {
    const tabHeader = event.target.closest('.state-tab-header');
    if (!tabHeader) return;
    
    const tabIndex = parseInt(tabHeader.dataset.tabIndex);
    if (isNaN(tabIndex)) return;
    
    activateStateTab(tabIndex);
};

/**
 * Handles spell tab clicks
 * @param {Event} event - The click event
 */
export const handleSpellTabClick = (event, activateSpellTab) => {
    const tabHeader = event.target.closest('.spell-tab-header');
    if (!tabHeader) return;
    
    const tabIndex = parseInt(tabHeader.dataset.tabIndex);
    if (isNaN(tabIndex)) return;
    
    const stateItem = tabHeader.closest('.state-item');
    const stateIndex = Array.from(dom.statesItemsContainer.children).indexOf(stateItem);
    
    activateSpellTab(stateItem, stateIndex, tabIndex);
};

/**
 * Handles add spell button clicks
 * @param {Event} event - The click event
 */
export const handleAddSpellBtnClick = (event, addSpellToState, activateSpellTab, updateJsonPreview, getTranslations) => {
    const addSpellBtn = event.target.closest('.add-spell-btn');
    if (!addSpellBtn) return;
    
    const stateItem = addSpellBtn.closest('.state-item');
    if (!stateItem) return;
    
    const stateIndex = Array.from(dom.statesItemsContainer.children).indexOf(stateItem);
    const spellsContainer = stateItem.querySelector('.state-spells-items');
    
    if (spellsContainer && spellsContainer.children.length < 4) {
        // Get translations and pass them to addSpellToState
        const translations = getTranslations();
        addSpellToState(stateItem, true, translations, updateJsonPreview);
        
        // Set active tab to the new spell
        const newSpellIndex = spellsContainer.children.length - 1;
        activateSpellTab(stateItem, stateIndex, newSpellIndex);
        
        // Update JSON
        updateJsonPreview();
    }
};

/**
 * Handles remove spell button clicks
 * @param {Event} event - The click event
 */
export const handleRemoveSpellBtnClick = (event, updateSpellTabs, updateJsonPreview, activeSpellTabs) => {
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

/**
 * Ограничивает ввод в числовых полях только цифрами и знаком минус (где применимо)
 * @param {Event} event - Событие ввода
 */
export const handleNumberInput = (event) => {
    const target = event.target;
    
    // Проверяем, является ли поле числовым по атрибуту type или классу
    const isNumberField = 
        target.type === 'number' || 
        target.classList.contains('numeric-input') ||
        /state-(morale|luck|spellPoints|experience|skills-primary|artifactTypeCounts|resources|upgrade|chance|creatureRewardType|creatureRewardCount|guardians|artifactIds)/i.test(target.className);
    
    if (!isNumberField) return;
    
    // Определить, может ли поле принимать отрицательные значения
    const allowNegative = 
        target.classList.contains('state-morale-input') || 
        target.classList.contains('state-luck-input') ||
        target.classList.contains('state-guardians-type-1') ||
        target.classList.contains('state-guardians-type-2') ||
        target.classList.contains('state-guardians-type-3') ||
        target.classList.contains('state-guardians-type-4') ||
        target.classList.contains('state-guardians-type-5') ||
        target.classList.contains('state-guardians-type-6') ||
        target.classList.contains('state-guardians-type-7') ||
        target.classList.contains('state-artifactIds-1') ||
        target.classList.contains('state-artifactIds-2') ||
        target.classList.contains('state-artifactIds-3') ||
        target.classList.contains('state-artifactIds-4') ||
        target.classList.contains('state-creatureRewardType-input');
    
    // Ограничить ввод допустимыми символами
    const value = target.value;
    if (allowNegative) {
        // Разрешить цифры и один "-" в начале
        target.value = value.replace(/[^0-9-]/g, '').replace(/(?!^)-/g, '');
    } else {
        // Разрешить только цифры
        target.value = value.replace(/[^0-9]/g, '');
    }
};
