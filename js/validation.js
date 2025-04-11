'use strict';

// Import DOM elements dependency
import { dom } from './dom-elements.js';
// Import validation functions from json-handling
import { validateProperty, validateRequiredFields } from './json-handling.js';
// Import translations function
import { getTranslations } from './localization.js';

/**
 * Checks if any property has a visible warning icon
 * @returns {boolean} True if any property has a visible warning
 */
export const hasPropertyWarnings = () => {
    const warnings = dom.propertiesContainer.querySelectorAll('.property-warning');
    return Array.from(warnings).some(warning => {
        return window.getComputedStyle(warning).display !== 'none';
    });
};

/**
 * Updates the state of the save button based on field validation
 * @param {Object} updateJsonPreview - Function to update JSON preview
 */
export const updateSaveButtonState = () => {
    // Disable save button if there are required fields missing OR if there are property warnings
    dom.saveFileButton.disabled = !validateRequiredFields(dom) || hasPropertyWarnings();
};

/**
 * Validates property type and subtype against object settings
 * @param {string} propertyValue - The property value to validate
 * @returns {Object|boolean} Validation results or false if invalid
 */
export const validatePropertyTypeSubtype = (propertyValue) => {
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

/**
 * Validates a property input element
 * @param {HTMLElement} inputElement - The input element to validate
 * @param {boolean} checkContent - Whether to perform full content validation
 */
export const validatePropertyInput = (inputElement, checkContent = false) => {
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

/**
 * Updates warning indicators for property inputs
 * @param {Function} updateJsonPreview - Function to update JSON preview
 */
export const updatePropertyWarnings = () => {
    const translations = getTranslations();
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

/**
 * Validates WAV file input, appending .wav if missing
 * @param {HTMLElement} inputElement - The input element to validate
 * @param {Function} updateJsonPreview - Function to update JSON preview
 */
export const validateWavFile = (inputElement) => {
    const value = inputElement.value.trim();
    if (value && !value.toLowerCase().endsWith('.wav')) {
        // Append .wav if missing, but allow empty input
        inputElement.value = value + '.wav';
        // Note: updateJsonPreview needs to be called from the caller
    }
};

/**
 * Validates DEF file input, appending .def if missing
 * @param {HTMLElement} inputElement - The input element to validate
 * @param {Function} updateJsonPreview - Function to update JSON preview
 */
export const validateDefFile = (inputElement) => {
    const value = inputElement.value.trim();
    if (value && !value.toLowerCase().endsWith('.def')) {
        // Append .def if missing, but allow empty input
        inputElement.value = value + '.def';
        // Note: updateJsonPreview needs to be called from the caller
    }
};

/**
 * Updates warning indicators for custom DEF inputs
 * @param {Function} updateJsonPreview - Function to update JSON preview
 */
export const updateCustomDefWarnings = () => {
    const translations = getTranslations();
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
    
    // Note: updateJsonPreview needs to be called from the caller
};
