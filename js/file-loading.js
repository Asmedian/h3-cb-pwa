'use strict';

/**
 * Handle opening and parsing JSON files
 * @param {Object} dom - DOM elements
 * @param {Function} updateJsonPreview - Function to update JSON preview
 * @param {Function} updateCustomDefWarnings - Function to update customDef warnings
 * @param {Function} validatePropertyInput - Function to validate property input
 * @param {Function} getTranslations - Function to get translations
 * @param {Function} setObjectsList - Function to set the objects list
 */
export const handleOpenJsonFile = (dom, updateJsonPreview, updateCustomDefWarnings, validatePropertyInput, getTranslations, setObjectsList) => {
    // Check if form has data that would be discarded
    if (hasFormData()) {
        const confirmMessage = getTranslations().confirmFileOpen;
        if (!confirm(confirmMessage)) {
            return; // User canceled operation
        }
    }
    
    // Use File System Access API if available (gives better control over file picker)
    if ('showOpenFilePicker' in window) {
        showOpenFilePicker({
            types: [{
                description: 'JSON Files',
                accept: { 'application/json': ['.json'] }
            }],
            excludeAcceptAllOption: true, // This removes the "All files" option
            multiple: false
        }).then(async (handles) => {
            const fileHandle = handles[0];
            const file = await fileHandle.getFile();
            
            const reader = new FileReader();
            reader.onload = (e) => {
                processJsonFile(e.target.result, dom, updateJsonPreview, updateCustomDefWarnings, validatePropertyInput, getTranslations, setObjectsList);
            };
            reader.readAsText(file);
        }).catch(error => {
            // User canceled or another error occurred
            // Only show error for non-abort errors
            if (error.name !== 'AbortError') {
                console.error('Error opening file:', error);
            }
        });
    } else {
        // Fall back to traditional file input for browsers without File System Access API
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        
        // Handle file selection
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                processJsonFile(e.target.result, dom, updateJsonPreview, updateCustomDefWarnings, validatePropertyInput, getTranslations, setObjectsList);
            };
            reader.readAsText(file);
        });
        
        // Trigger file input click
        fileInput.click();
    }
};

/**
 * Process the loaded JSON file
 * @param {string} fileContent - The content of the loaded file
 * @param {Object} dom - DOM elements
 * @param {Function} updateJsonPreview - Function to update JSON preview
 * @param {Function} updateCustomDefWarnings - Function to update customDef warnings
 * @param {Function} validatePropertyInput - Function to validate property input
 * @param {Function} getTranslations - Function to get translations
 * @param {Function} setObjectsList - Function to set the objects list
 */
const processJsonFile = (fileContent, dom, updateJsonPreview, updateCustomDefWarnings, validatePropertyInput, getTranslations, setObjectsList) => {
    try {
        // First validate the JSON and structure before resetting the form
        const jsonData = JSON.parse(fileContent);
        
        // Validate the JSON structure
        if (!validateJsonStructure(jsonData)) {
            handleFileError('structure-error', getTranslations);
            return;
        }
        
        // Extract all objects from the file
        const objects = extractObjectsFromJson(jsonData);
        
        if (objects.length === 0) {
            handleFileError('no-subtypes', getTranslations);
            return;
        }
        
        // Set the objects list - this is crucial for populating the object selector
        setObjectsList(objects);
        
        // Only reset form if JSON is valid and properly structured
        resetForm(dom);
        
        // Use the first object to populate the form
        // The other objects are now stored in the objects list and accessible through the selector
        loadFirstObject(jsonData, dom, updateJsonPreview, updateCustomDefWarnings, validatePropertyInput, getTranslations);
        
        // Update the UI to show success message (optional)
        const translations = getTranslations();
        const message = translations.fileLoadedSuccess || 
            `File loaded successfully. Found ${objects.length} object(s).`;
        console.log(message);
        
    } catch (error) {
        handleFileError('invalid-json', getTranslations);
        console.error('Error processing JSON file:', error);
        // No form reset happens here, so current values are preserved
    }
};

/**
 * Load the first object from the JSON data into the form
 * @param {Object} jsonData - The parsed JSON data
 * @param {Object} dom - DOM elements
 * @param {Function} updateJsonPreview - Function to update JSON preview
 * @param {Function} updateCustomDefWarnings - Function to update customDef warnings
 * @param {Function} validatePropertyInput - Function to validate property input
 * @param {Function} getTranslations - Function to get translations
 */
const loadFirstObject = (jsonData, dom, updateJsonPreview, updateCustomDefWarnings, validatePropertyInput, getTranslations) => {
    // Check if the required structure exists
    if (!jsonData.RMG || !jsonData.RMG.objectGeneration) {
        handleFileError('structure-error', getTranslations);
        return;
    }
    
    // Get all types
    const objectGeneration = jsonData.RMG.objectGeneration;
    const typeKeys = Object.keys(objectGeneration);
    
    if (typeKeys.length === 0) {
        handleFileError('no-types', getTranslations);
        return;
    }
    
    // Get the first type
    const firstType = typeKeys[0];
    dom.objectTypeInput.textContent = firstType; // Set the type 
    
    // Get the subtypes of this type
    const typeObjects = objectGeneration[firstType];
    const subtypeKeys = Object.keys(typeObjects);
    
    if (subtypeKeys.length === 0) {
        handleFileError('no-subtypes', getTranslations);
        return;
    }
    
    // Get the first subtype
    const firstSubtypeKey = subtypeKeys[0];
    const subtypeData = typeObjects[firstSubtypeKey];
    
    // Update the subtype input
    dom.objectSubtypeInput.value = firstSubtypeKey;
    dom.objectSubtypeInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Start populating the form with validation
    const errors = [];
    populateRequiredFields(subtypeData, dom, errors, validatePropertyInput);
    populateOptionalFields(subtypeData, dom, errors);
    
    // Update JSON preview and warnings
    updateJsonPreview();
    updateCustomDefWarnings();
    
    // Show errors if any
    if (errors.length > 0) {
        showValidationErrors(errors, getTranslations);
    }
};

/**
 * Extract all objects from the JSON file
 * @param {Object} jsonData - The parsed JSON data
 * @returns {Array} Array of objects with type, subtype, and data
 */
const extractObjectsFromJson = (jsonData) => {
    const objects = [];
    
    // Make sure we have the expected structure
    if (!jsonData.RMG || !jsonData.RMG.objectGeneration) {
        return objects;
    }
    
    // Loop through each type
    const objectGeneration = jsonData.RMG.objectGeneration;
    Object.keys(objectGeneration).forEach(type => {
        // Loop through each subtype in this type
        const typeObjects = objectGeneration[type];
        Object.keys(typeObjects).forEach(subtype => {
            // Add this object to our list
            objects.push({
                type: type,
                subtype: subtype,
                data: typeObjects[subtype]
            });
        });
    });
    
    return objects;
};

/**
 * Validate that the JSON has the required structure
 * @param {Object} jsonData - The parsed JSON data
 * @returns {boolean} Whether the JSON has valid structure
 */
const validateJsonStructure = (jsonData) => {
    return (
        jsonData &&
        jsonData.RMG && 
        jsonData.RMG.objectGeneration && 
        jsonData.RMG.objectGeneration['16'] &&
        Object.keys(jsonData.RMG.objectGeneration['16']).length > 0
    );
};

/**
 * Handle file operation errors with appropriate translated messages
 * @param {string} errorType - Type of error (invalid-json, structure-error, no-subtypes, etc.)
 * @param {Function} getTranslations - Function to get translations
 * @param {string} [customMessage] - Optional custom message or details
 */
const handleFileError = (errorType, getTranslations, customMessage = '') => {
    const translations = getTranslations();
    
    let errorMessage;
    let errorTitle = translations.validationErrorsTitle || 'Validation Errors';
    
    switch(errorType) {
        case 'invalid-json':
            errorMessage = translations.invalidJsonFile || 'Invalid JSON file';
            break;
        case 'structure-error':
            errorMessage = translations.jsonFileStructureError || '"RMG.objectGeneration.16" not found';
            break;
        case 'no-subtypes':
            errorMessage = translations.noSubtypesError || 'No subtypes found';
            break;
        default:
            errorMessage = 'Unknown error';
    }
    
    if (customMessage) {
        errorMessage += `\n${customMessage}`;
    }
    
    alert(`${errorTitle}:\n${errorMessage}`);
};

/**
 * Check if form has any data entered
 * @returns {boolean} True if form has data
 */
const hasFormData = () => {
    // Check for property values
    const propertyInputs = document.querySelectorAll('.property-input');
    for (const input of propertyInputs) {
        if (input.value.trim() !== '') {
            return true;
        }
    }
    
    // Check if enabled checkbox is checked
    const enabledCheckbox = document.getElementById('enabled-checkbox');
    if (enabledCheckbox && enabledCheckbox.checked) {
        return true;
    }
    
    // Check optional fields
    const optionalCheckboxes = [
        'name-checkbox', 'sound-checkbox', 'text-checkbox', 
        'troopPlacement-checkbox', 'states-checkbox'
    ];
    
    for (const id of optionalCheckboxes) {
        const checkbox = document.getElementById(id);
        if (checkbox && checkbox.checked) {
            return true;
        }
    }
    
    return false;
};

/**
 * Reset all form fields to their default values
 * @param {Object} dom - DOM elements
 */
const resetForm = (dom) => {
    // Reset required fields
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
    
    // Reset object subtype to default
    if (dom.objectSubtypeInput) {
        dom.objectSubtypeInput.value = '0';
    }
    
    // Uncheck enabled checkbox and reset related fields
    const enabledCheckbox = document.getElementById('enabled-checkbox');
    if (enabledCheckbox && enabledCheckbox.checked) {
        enabledCheckbox.checked = false;
        enabledCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    document.getElementById('enabled')?.querySelector('option[value="true"]')?.setAttribute('selected', true);
    document.getElementById('value').value = '';
    document.getElementById('density').value = '';
    
    // Reset optional fields by unchecking all optional checkboxes
    const optionalCheckboxes = [
        'name-checkbox', 'sound-checkbox', 'text-checkbox', 
        'troopPlacement-checkbox', 'states-checkbox'
    ];
    
    for (const id of optionalCheckboxes) {
        const checkbox = document.getElementById(id);
        if (checkbox && checkbox.checked) {
            checkbox.checked = false;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
    
    // Clear name field
    document.getElementById('name').value = '';
    
    // Clear sound fields
    document.getElementById('sound-enter').value = '';
    document.getElementById('sound-loop').value = '';
    
    // Clear text field
    document.getElementById('text-visit').value = '';
    
    // Reset troop placement
    document.getElementById('isBank')?.querySelector('option[value="true"]')?.setAttribute('selected', true);
    
    // Remove all states except the first one and reset it
    const stateItems = document.querySelectorAll('.state-item');
    if (stateItems.length > 0) {
        // Keep the first state but reset all its fields
        resetState(stateItems[0]);
        
        // Remove additional states
        for (let i = 1; i < stateItems.length; i++) {
            stateItems[i].remove();
        }
    }
};

/**
 * Reset a single state item
 * @param {HTMLElement} stateItem - The state item to reset
 */
const resetState = (stateItem) => {
    // Uncheck all checkboxes in this state
    const checkboxes = stateItem.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            checkbox.checked = false;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
    
    // Reset all number inputs to 0 or -1 depending on their min value
    const numberInputs = stateItem.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
        input.value = input.min === '-1' ? '-1' : '0';
    });
    
    // Reset any text inputs
    const textInputs = stateItem.querySelectorAll('input[type="text"]');
    textInputs.forEach(input => {
        input.value = '';
    });
    
    // Remove all spells except the first one and reset it
    const spellItems = stateItem.querySelectorAll('.array-item');
    if (spellItems.length > 0) {
        // Reset the first spell
        resetSpell(spellItems[0]);
        
        // Remove additional spells
        for (let i = 1; i < spellItems.length; i++) {
            spellItems[i].remove();
        }
    }
};

/**
 * Reset a spell item
 * @param {HTMLElement} spellItem - The spell item to reset
 */
const resetSpell = (spellItem) => {
    // Select "By ID" radio and reset ID value
    const idRadio = spellItem.querySelector('.spell-type-radio[value="id"]');
    if (idRadio) {
        idRadio.checked = true;
        idRadio.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    const idInput = spellItem.querySelector('.spell-id-input');
    if (idInput) {
        idInput.value = '0';
    }
    
    // Reset all checkboxes for bits
    const checkboxes = spellItem.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Reset hidden values for bits
    const hiddenInputs = spellItem.querySelectorAll('input[type="hidden"]');
    hiddenInputs.forEach(input => {
        input.value = '';
    });
};

/**
 * Parse JSON data and populate the form
 * @param {Object} jsonData - Parsed JSON data
 * @param {Object} dom - DOM elements
 * @param {Function} updateJsonPreview - Function to update JSON preview
 * @param {Function} updateCustomDefWarnings - Function to update customDef warnings
 * @param {Function} validatePropertyInput - Function to validate property input
 * @param {Function} getTranslations - Function to get translations
 */
const parseAndPopulateForm = (jsonData, dom, updateJsonPreview, updateCustomDefWarnings, validatePropertyInput, getTranslations) => {
    // Check if the required structure exists
    if (!jsonData.RMG || !jsonData.RMG.objectGeneration) {
        handleFileError('structure-error', getTranslations);
        return;
    }
    
    // Get all types
    const objectGeneration = jsonData.RMG.objectGeneration;
    const typeKeys = Object.keys(objectGeneration);
    
    if (typeKeys.length === 0) {
        handleFileError('no-types', getTranslations);
        return;
    }
    
    // Get the first type
    const firstType = typeKeys[0];
    dom.objectTypeInput.textContent = firstType; // Set the type 
    
    // Get the subtypes of this type
    const typeObjects = objectGeneration[firstType];
    const subtypeKeys = Object.keys(typeObjects);
    
    if (subtypeKeys.length === 0) {
        handleFileError('no-subtypes', getTranslations);
        return;
    }
    
    // Get the first subtype
    const firstSubtypeKey = subtypeKeys[0];
    const subtypeData = typeObjects[firstSubtypeKey];
    
    // Update the subtype input
    dom.objectSubtypeInput.value = firstSubtypeKey;
    dom.objectSubtypeInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Start populating the form with validation
    const errors = [];
    populateRequiredFields(subtypeData, dom, errors, validatePropertyInput);
    populateOptionalFields(subtypeData, dom, errors);
    
    // Update JSON preview and warnings
    updateJsonPreview();
    updateCustomDefWarnings();
    
    // Show errors if any
    if (errors.length > 0) {
        showValidationErrors(errors, getTranslations);
    }
};

/**
 * Populate required fields from JSON data
 * @param {Object} data - Subtype data
 * @param {Object} dom - DOM elements
 * @param {Array} errors - Array to collect validation errors
 * @param {Function} validatePropertyInput - Function to validate property input
 */
const populateRequiredFields = (data, dom, errors, validatePropertyInput) => {
    // Properties
    if (data.properties && Array.isArray(data.properties)) {
        // Clear existing properties except the first one
        const propertyItems = dom.propertiesContainer.querySelectorAll('.property-item');
        for (let i = 1; i < propertyItems.length; i++) {
            propertyItems[i].remove();
        }
        
        // Set the first property value and validate
        const firstInput = dom.propertiesContainer.querySelector('.property-input');
        if (firstInput && data.properties.length > 0) {
            firstInput.value = data.properties[0];
            validatePropertyInput(firstInput, true);
            if (firstInput.classList.contains('invalid-input')) {
                errors.push(`Property 1: Invalid format - ${data.properties[0]}`);
            }
        }
        
        // Add additional properties
        for (let i = 1; i < data.properties.length; i++) {
            // Create button click event to add property
            const addPropertyBtn = dom.addPropertyButton;
            if (addPropertyBtn) {
                addPropertyBtn.click();
                
                // Get the newly added property input
                const newPropertyInput = dom.propertiesContainer.querySelector(`.property-item:nth-child(${i+1}) .property-input`);
                if (newPropertyInput) {
                    newPropertyInput.value = data.properties[i];
                    validatePropertyInput(newPropertyInput, true);
                    if (newPropertyInput.classList.contains('invalid-input')) {
                        errors.push(`Property ${i+1}: Invalid format - ${data.properties[i]}`);
                    }
                }
            }
        }
    }
    
    // Enable checkboxes for required fields if data exists
    if (data.enabled !== undefined || data.value !== undefined || data.density !== undefined) {
        const enabledCheckbox = document.getElementById('enabled-checkbox');
        if (enabledCheckbox && !enabledCheckbox.checked) {
            enabledCheckbox.checked = true;
            enabledCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        // Enabled
        if (data.enabled !== undefined) {
            const enabledSelect = document.getElementById('enabled');
            if (enabledSelect) {
                enabledSelect.value = data.enabled.toString();
            }
        }
        
        // Value
        if (data.value !== undefined) {
            const valueInput = document.getElementById('value');
            if (valueInput) {
                const value = Number(data.value);
                if (isNaN(value) || value < 0) {
                    errors.push(`Value: Invalid value - ${data.value}`);
                } else {
                    valueInput.value = value;
                }
            }
        }
        
        // Density
        if (data.density !== undefined) {
            const densityInput = document.getElementById('density');
            if (densityInput) {
                const value = Number(data.density);
                if (isNaN(value) || value < 0) {
                    errors.push(`Density: Invalid value - ${data.density}`);
                } else {
                    densityInput.value = value;
                }
            }
        }
    }
};

/**
 * Populate optional fields from JSON data
 * @param {Object} data - Subtype data
 * @param {Object} dom - DOM elements
 * @param {Array} errors - Array to collect validation errors
 */
const populateOptionalFields = (data, dom, errors) => {
    // Name
    if (data.name !== undefined) {
        const nameCheckbox = document.getElementById('name-checkbox');
        if (nameCheckbox && !nameCheckbox.checked) {
            nameCheckbox.checked = true;
            nameCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        const nameInput = document.getElementById('name');
        if (nameInput) {
            nameInput.value = data.name;
        }
    }
    
    // Sound
    if (data.sound) {
        const soundCheckbox = document.getElementById('sound-checkbox');
        if (soundCheckbox && !soundCheckbox.checked) {
            soundCheckbox.checked = true;
            soundCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        if (data.sound.enter) {
            const enterInput = document.getElementById('sound-enter');
            if (enterInput) {
                enterInput.value = data.sound.enter;
                // Validate WAV extension
                if (!data.sound.enter.toLowerCase().endsWith('.wav')) {
                    errors.push(`Sound Enter: Invalid format - ${data.sound.enter}`);
                }
            }
        }
        
        if (data.sound.loop) {
            const loopInput = document.getElementById('sound-loop');
            if (loopInput) {
                loopInput.value = data.sound.loop;
                // Validate WAV extension
                if (!data.sound.loop.toLowerCase().endsWith('.wav')) {
                    errors.push(`Sound Loop: Invalid format - ${data.sound.loop}`);
                }
            }
        }
    }
    
    // Text
    if (data.text && data.text.visit) {
        const textCheckbox = document.getElementById('text-checkbox');
        if (textCheckbox && !textCheckbox.checked) {
            textCheckbox.checked = true;
            textCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        const visitTextarea = document.getElementById('text-visit');
        if (visitTextarea) {
            visitTextarea.value = data.text.visit;
            // Trigger update for line break indicators
            visitTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
    
    // Troop Placement
    if (data.troopPlacement) {
        const troopPlacementCheckbox = document.getElementById('troopPlacement-checkbox');
        if (troopPlacementCheckbox && !troopPlacementCheckbox.checked) {
            troopPlacementCheckbox.checked = true;
            troopPlacementCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        if (data.troopPlacement.isBank !== undefined) {
            const isBankSelect = document.getElementById('isBank');
            if (isBankSelect) {
                const isBank = data.troopPlacement.isBank;
                isBankSelect.value = isBank.toString();
                
                // Trigger change event to update grid
                // Note: resetToDefaults will be called by the change event listener
                // which will set the default attackers and defenders based on isBank value
                isBankSelect.dispatchEvent(new Event('change', { bubbles: true }));
                
                // If isBank is true, we need to populate attackers and defenders from the file
                // If isBank is false, default values will be used (already set by isBankSelect change event)
                if (isBank === true) {
                    // Populate attackers array
                    if (data.troopPlacement.attackers && Array.isArray(data.troopPlacement.attackers)) {
                        const attackersInput = document.getElementById('attackers');
                        if (attackersInput) {
                            attackersInput.value = JSON.stringify(data.troopPlacement.attackers);
                        }
                    }

                    // Populate defenders array
                    if (data.troopPlacement.defenders && Array.isArray(data.troopPlacement.defenders)) {
                        const defendersInput = document.getElementById('defenders');
                        if (defendersInput) {
                            defendersInput.value = JSON.stringify(data.troopPlacement.defenders);
                        }
                    }
                }
            }
        }
    }
    
    // States - This is complex and would require special handling for each state type
    if (data.states && Array.isArray(data.states) && data.states.length > 0) {
        const statesCheckbox = document.getElementById('states-checkbox');
        if (statesCheckbox && !statesCheckbox.checked) {
            statesCheckbox.checked = true;
            statesCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        // Get existing state count and add more if needed
        const existingStates = document.querySelectorAll('.state-item');
        
        // Add more states if needed
        for (let i = existingStates.length; i < data.states.length; i++) {
            const addStateBtn = document.getElementById('add-state');
            if (addStateBtn) {
                addStateBtn.click();
            }
        }
        
        // Now populate each state's fields
        data.states.forEach((stateData, stateIndex) => {
            populateStateFields(stateData, stateIndex, errors);
        });
    }
};

/**
 * Populate fields for a specific state
 * @param {Object} stateData - The state data from JSON
 * @param {number} stateIndex - The index of the state
 * @param {Array} errors - Array to collect validation errors
 */
const populateStateFields = (stateData, stateIndex, errors) => {
    const stateItem = document.querySelector(`.state-item:nth-child(${stateIndex + 1})`);
    if (!stateItem) {
        errors.push(`Failed to find state element for state ${stateIndex + 1}`);
        return;
    }

    // Populate spells if available
    if (stateData.spells && Array.isArray(stateData.spells) && stateData.spells.length > 0) {
        // Enable spells checkbox
        const spellsCheckbox = stateItem.querySelector('.state-spells-checkbox');
        if (spellsCheckbox && !spellsCheckbox.checked) {
            spellsCheckbox.checked = true;
            spellsCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Get existing spell count
        const existingSpells = stateItem.querySelectorAll('.array-item');
        
        // Add more spells if needed
        for (let i = existingSpells.length; i < stateData.spells.length; i++) {
            const addSpellBtn = stateItem.querySelector('.add-spell-btn');
            if (addSpellBtn) {
                addSpellBtn.click();
            }
        }

        // Populate each spell
        stateData.spells.forEach((spellData, spellIndex) => {
            const spellItem = stateItem.querySelector(`.array-item:nth-child(${spellIndex + 1})`);
            if (!spellItem) return;

            if (spellData.id !== undefined) {
                // Set radio to "By ID"
                const idRadio = spellItem.querySelector('.spell-type-radio[value="id"]');
                if (idRadio) {
                    idRadio.checked = true;
                    idRadio.dispatchEvent(new Event('change', { bubbles: true }));
                }
                
                // Set spell ID
                const idInput = spellItem.querySelector('.spell-id-input');
                if (idInput) {
                    idInput.value = spellData.id;
                }
            } else if (spellData.bits) {
                // Set radio to "By Bits"
                const bitsRadio = spellItem.querySelector('.spell-type-radio[value="bits"]');
                if (bitsRadio) {
                    bitsRadio.checked = true;
                    bitsRadio.dispatchEvent(new Event('change', { bubbles: true }));
                }
                
                // Set flags and update checkboxes
                if (spellData.bits.flags !== undefined) {
                    const flagsInput = spellItem.querySelector('.spell-bits-flags-value');
                    if (flagsInput) {
                        flagsInput.value = spellData.bits.flags;
                        
                        // Check the appropriate flag checkboxes
                        const flagValue = parseInt(spellData.bits.flags);
                        if (!isNaN(flagValue)) {
                            spellItem.querySelectorAll('.spell-flag-checkbox').forEach(checkbox => {
                                const flagBit = parseInt(checkbox.value);
                                checkbox.checked = (flagValue & flagBit) === flagBit;
                            });
                            
                            // Update selected values display
                            const selectedValues = spellItem.querySelector('.flags-selected-values');
                            if (selectedValues) {
                                selectedValues.textContent = spellData.bits.flags;
                            }
                        }
                    }
                }
                
                // Set levels and update checkboxes
                if (spellData.bits.levels !== undefined) {
                    const levelsInput = spellItem.querySelector('.spell-bits-levels-value');
                    if (levelsInput) {
                        levelsInput.value = spellData.bits.levels;
                        
                        // Check the appropriate level checkboxes
                        const levelValue = parseInt(spellData.bits.levels);
                        if (!isNaN(levelValue)) {
                            spellItem.querySelectorAll('.spell-level-checkbox').forEach(checkbox => {
                                const levelBit = parseInt(checkbox.value);
                                checkbox.checked = (levelValue & levelBit) === levelBit;
                            });
                        }
                    }
                }
                
                // Set schools and update checkboxes
                if (spellData.bits.schools !== undefined) {
                    const schoolsInput = spellItem.querySelector('.spell-bits-schools-value');
                    if (schoolsInput) {
                        schoolsInput.value = spellData.bits.schools;
                        
                        // Check the appropriate school checkboxes
                        const schoolValue = parseInt(spellData.bits.schools);
                        if (!isNaN(schoolValue)) {
                            spellItem.querySelectorAll('.spell-school-checkbox').forEach(checkbox => {
                                const schoolBit = parseInt(checkbox.value);
                                checkbox.checked = (schoolValue & schoolBit) === schoolBit;
                            });
                        }
                    }
                }
            }
        });
    }

    // Populate guardians if available
    if (stateData.guardians) {
        // Enable guardians checkbox
        const guardiansCheckbox = stateItem.querySelector('.state-guardians-checkbox');
        if (guardiansCheckbox && !guardiansCheckbox.checked) {
            guardiansCheckbox.checked = true;
            guardiansCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Set guardian types
        if (stateData.guardians.type && Array.isArray(stateData.guardians.type)) {
            stateData.guardians.type.forEach((type, index) => {
                if (index >= 7) return; // Only 7 guardian slots
                const typeInput = stateItem.querySelector(`.state-guardians-type-${index + 1}`);
                if (typeInput) {
                    typeInput.value = type;
                    // Trigger input event to update related count field
                    typeInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
        }

        // Set guardian counts
        if (stateData.guardians.count && Array.isArray(stateData.guardians.count)) {
            stateData.guardians.count.forEach((count, index) => {
                if (index >= 7) return; // Only 7 guardian slots
                const countInput = stateItem.querySelector(`.state-guardians-count-${index + 1}`);
                if (countInput) {
                    countInput.value = count;
                }
            });
        }
    }

    // Populate skills if available
    if (stateData.skills) {
        // Enable skills checkbox
        const skillsCheckbox = stateItem.querySelector('.state-skills-checkbox');
        if (skillsCheckbox && !skillsCheckbox.checked) {
            skillsCheckbox.checked = true;
            skillsCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Set primary skills
        if (stateData.skills.primary && Array.isArray(stateData.skills.primary) && stateData.skills.primary.length === 4) {
            const attackInput = stateItem.querySelector('.state-skills-primary-attack');
            const defenseInput = stateItem.querySelector('.state-skills-primary-defense');
            const powerInput = stateItem.querySelector('.state-skills-primary-power');
            const knowledgeInput = stateItem.querySelector('.state-skills-primary-knowledge');

            if (attackInput) attackInput.value = stateData.skills.primary[0];
            if (defenseInput) defenseInput.value = stateData.skills.primary[1];
            if (powerInput) powerInput.value = stateData.skills.primary[2];
            if (knowledgeInput) knowledgeInput.value = stateData.skills.primary[3];
        }
    }

    // Creature reward is a special case with type and count
    if (stateData.creatureReward || stateData.creatureRewardType !== undefined) {
        const checkbox = stateItem.querySelector('.state-creatureReward-checkbox');
        if (checkbox && !checkbox.checked) {
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Handle type
        let rewardType = -1;
        if (stateData.creatureReward && stateData.creatureReward.type !== undefined) {
            rewardType = stateData.creatureReward.type;
        } else if (stateData.creatureRewardType !== undefined) {
            rewardType = stateData.creatureRewardType;
        }

        const typeInput = stateItem.querySelector('.state-creatureRewardType-input');
        if (typeInput) {
            typeInput.value = rewardType;
            typeInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Handle count
        let rewardCount = 0;
        if (stateData.creatureReward && stateData.creatureReward.count !== undefined) {
            rewardCount = stateData.creatureReward.count;
        } else if (stateData.creatureRewardCount !== undefined) {
            rewardCount = stateData.creatureRewardCount;
        }

        const countInput = stateItem.querySelector('.state-creatureRewardCount-input');
        if (countInput) {
            countInput.value = rewardCount;
        }
    }

    // Artifact IDs handling
    if (stateData.artifactIds && Array.isArray(stateData.artifactIds) && stateData.artifactIds.length > 0) {
        const artifactIdsCheckbox = stateItem.querySelector('.state-artifactIds-checkbox');
        if (artifactIdsCheckbox && !artifactIdsCheckbox.checked) {
            artifactIdsCheckbox.checked = true;
            artifactIdsCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Set values for each artifact slot
        for (let i = 0; i < Math.min(stateData.artifactIds.length, 4); i++) {
            const inputField = stateItem.querySelector(`.state-artifactIds-${i+1}`);
            if (inputField) {
                inputField.value = stateData.artifactIds[i];
            }
        }
    }

    // Artifact Type Counts handling
    if (stateData.artifactTypeCounts && Array.isArray(stateData.artifactTypeCounts) && stateData.artifactTypeCounts.length > 0) {
        const artifactTypeCountsCheckbox = stateItem.querySelector('.state-artifactTypeCounts-checkbox');
        if (artifactTypeCountsCheckbox && !artifactTypeCountsCheckbox.checked) {
            artifactTypeCountsCheckbox.checked = true;
            artifactTypeCountsCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Set values for each artifact type
        if (stateData.artifactTypeCounts.length >= 4) {
            const treasureInput = stateItem.querySelector('.state-artifactTypeCounts-treasure');
            const minorInput = stateItem.querySelector('.state-artifactTypeCounts-minor');
            const majorInput = stateItem.querySelector('.state-artifactTypeCounts-major');
            const relicInput = stateItem.querySelector('.state-artifactTypeCounts-relic');

            if (treasureInput) treasureInput.value = stateData.artifactTypeCounts[0];
            if (minorInput) minorInput.value = stateData.artifactTypeCounts[1];
            if (majorInput) majorInput.value = stateData.artifactTypeCounts[2];
            if (relicInput) relicInput.value = stateData.artifactTypeCounts[3];
        }
    }

    // Resources handling
    if (stateData.resources && Array.isArray(stateData.resources) && stateData.resources.length > 0) {
        const resourcesCheckbox = stateItem.querySelector('.state-resources-checkbox');
        if (resourcesCheckbox && !resourcesCheckbox.checked) {
            resourcesCheckbox.checked = true;
            resourcesCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Set values for each resource
        if (stateData.resources.length >= 8) {
            const woodInput = stateItem.querySelector('.state-resources-wood');
            const oreInput = stateItem.querySelector('.state-resources-ore');
            const mercuryInput = stateItem.querySelector('.state-resources-mercury');
            const sulfurInput = stateItem.querySelector('.state-resources-sulfur');
            const crystalInput = stateItem.querySelector('.state-resources-crystal');
            const gemsInput = stateItem.querySelector('.state-resources-gems');
            const goldInput = stateItem.querySelector('.state-resources-gold');
            const mithrilInput = stateItem.querySelector('.state-resources-mithril');

            if (woodInput) woodInput.value = stateData.resources[0];
            if (oreInput) oreInput.value = stateData.resources[1];  
            if (mercuryInput) mercuryInput.value = stateData.resources[2];
            if (sulfurInput) sulfurInput.value = stateData.resources[3];
            if (crystalInput) crystalInput.value = stateData.resources[4];
            if (gemsInput) gemsInput.value = stateData.resources[5];
            if (goldInput) goldInput.value = stateData.resources[6];
            if (mithrilInput) mithrilInput.value = stateData.resources[7];
        }
    }

    // Populate other state fields as needed
    populateSimpleStateField(stateItem, stateData, 'upgrade', 'state-upgrade-checkbox', 'state-upgrade-input');
    populateSimpleStateField(stateItem, stateData, 'morale', 'state-morale-checkbox', 'state-morale-input');
    populateSimpleStateField(stateItem, stateData, 'luck', 'state-luck-checkbox', 'state-luck-input');
    populateSimpleStateField(stateItem, stateData, 'spellPoints', 'state-spellPoints-checkbox', 'state-spellPoints-input');
    populateSimpleStateField(stateItem, stateData, 'experience', 'state-experience-checkbox', 'state-experience-input');
    populateSimpleStateField(stateItem, stateData, 'customDef', 'state-customDef-checkbox', 'state-customDef-input');
    populateSimpleStateField(stateItem, stateData, 'chance', 'state-chance-checkbox', 'state-chance-input');
};

/**
 * Helper function to populate a simple state field (checkbox + input)
 * @param {HTMLElement} stateItem - The state item element
 * @param {Object} stateData - The state data from JSON
 * @param {string} fieldName - Field name in JSON
 * @param {string} checkboxClass - Checkbox class in DOM
 * @param {string} inputClass - Input class in DOM
 */
const populateSimpleStateField = (stateItem, stateData, fieldName, checkboxClass, inputClass) => {
    if (stateData[fieldName] !== undefined) {
        // Enable checkbox
        const checkbox = stateItem.querySelector(`.${checkboxClass}`);
        if (checkbox && !checkbox.checked) {
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Set value
        const input = stateItem.querySelector(`.${inputClass}`);
        if (input) {
            input.value = stateData[fieldName];
        }
    }
};

/**
 * Show error message to user
 * @param {string} message - Error message
 */
const showErrorMessage = (message) => {
    alert(message);
};

/**
 * Show validation errors to user
 * @param {Array} errors - Array of error messages
 * @param {Function} getTranslations - Function to get translations
 */
const showValidationErrors = (errors, getTranslations) => {
    if (errors.length === 0) return;
    
    const errorTitle = getTranslations().validationErrorsTitle || 'Validation Errors';
    const errorMessage = errors.join('\n');
    
    alert(`${errorTitle}:\n${errorMessage}`);
};
