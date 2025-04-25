'use strict';

// Private state for the module
let translations = {};
let currentLang = 'en';

// Helper functions for updating UI elements
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
};

// Load language files and set up translations
const loadLanguage = async (lang, dom, updateActions) => {
    try {
        const response = await fetch(`./lang/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load language file: ${response.status}`);
        }
        translations = await response.json();
        // Store translations globally for components that might not have direct access
        window.appTranslations = translations;
        currentLang = lang;
        document.documentElement.lang = lang; // Set HTML lang attribute
        
        // Save the selected language to localStorage
        localStorage.setItem('preferredLanguage', lang);
        
        updateUILanguage(dom, updateActions);
        return translations;
    } catch (error) {
        console.error('Error loading language file:', error);
        // Fallback to English if the selected language fails
        if (lang !== 'en') {
            console.warn('Falling back to English.');
            return loadLanguage('en', dom, updateActions);
        } else {
            // If English itself fails, display an error
            console.error('Translations are missing. Falling back to hardcoded defaults.');

            // Provide minimal default texts
            translations = {
                appTitle: 'Error loading language data'
            };

            dom.appTitle.textContent = translations.appTitle;
            
            updateUILanguage(dom, updateActions); // Apply fallback texts
            return translations;
        }
    }
};

// Update all UI elements with translations
const updateUILanguage = (dom, updateActions) => {
    if (!translations) return; // Don't run if translations aren't loaded

    const { 
        isDarkTheme, 
        updateSaveButtonState, 
        updateGridTranslations, 
        updateAllLineBreakIndicators,
        updateFlagsValue,
        updateTroopPlacementInputs, 
        updateActionButtonState,
        updateJsonPreview,
        updateObjectSelector  // Extract the new function from updateActions
    } = updateActions;

    // --- Update Static Text ---
    setText(dom.appTitle, translations.appTitle);
    setText(dom.installPwaButton, translations.installPwa);
    setText(dom.themeToggleButton, isDarkTheme ? translations.darkTheme : translations.lightTheme);
    setText(dom.langSelectorButton, translations.currentLanguage);
    setText(dom.browserSupportInfo, translations.browserSupport);
    setText(dom.objectSubtypeTitle, translations.objectParameters);
    setText(document.getElementById('object-generation-title'), translations.objectGenerationTitle);
    setText(dom.requiredFieldsTitle, translations.requiredFields);
    setText(dom.optionalFieldsTitle, translations.optionalFields);
    setText(dom.addPropertyButton, translations.addProperty);
    setText(dom.addStateButton, translations.addState);
    setText(dom.removeStateButton, translations.removeState);
    setText(dom.saveFileButton, translations.saveFile);
    setText(dom.openJsonFileButton, translations.openJsonFile);
    setText(document.getElementById('reset-form'), translations.resetButton);
    setText(document.getElementById('new-object-btn'), translations.newButton);
    
    // Call the updateActionButtonState function to set the correct text based on current state
    if (updateActionButtonState) {
        updateActionButtonState();
    }

    setText(document.getElementById('customize-grid-btn'), translations.customizeButton);
    setHtml(dom.propertyHintText, translations.propertyHint);
    document.getElementById('property-hint-text').textContent = translations.propertyHint;

    // Update all field labels throughout the application
    updateFieldLabels();

    // Update spell levels and schools
    updateSpellLabels();

    // Update state & spell tab headers text
    document.querySelectorAll('.state-tab-header').forEach(header => {
        localizeStateTabHeader(header);
    });

    document.querySelectorAll('.spell-tab-header').forEach(header => {
        localizeSpellTabHeader(header);
    });

    // Update creature reward and guardians labels - improved targeting
    document.querySelectorAll('.field-label-small, .guardian-field label').forEach(label => {
        const labelText = label.childNodes[0]?.textContent.trim();
        
        // Rather than checking for the text content, check for the container elements
        if (label.closest('.state-creatureRewardType-container') || 
            label.closest('.field-row')?.querySelector('.state-creatureRewardType-container')) {
            // This is a creatureReward type label
            setText(label.childNodes[0], translations.fieldLabels?.type || 'type');
        } else if (label.closest('.creature-reward-count') || 
                   label.closest('.field-row')?.querySelector('.state-creatureRewardCount-container')) {
            // This is a creatureReward count label
            setText(label.childNodes[0], translations.fieldLabels?.count || 'count');
        } else if (label.closest('.guardian-field') && !labelText?.startsWith('Slot') && !labelText?.startsWith('Слот')) {
            // This is a guardian type label
            setText(label, translations.fieldLabels?.guardianType || 'Type');
        } else if (label.closest('.guardian-field') && (labelText?.startsWith('Slot') || labelText?.startsWith('Слот'))) {
            // This is a guardian slot label
            const slotNum = labelText.match(/\d+/)[0]; // Extract the number regardless of language
            setText(label, `${translations.fieldLabels?.guardianSlot || 'Slot'} ${slotNum}`);
        }
    });

    // Improve direct targeting for creature reward type and count labels
    document.querySelectorAll('.state-creatureReward-container .field-label-small').forEach(label => {
        const textNode = Array.from(label.childNodes).find(node => 
            node.nodeType === Node.TEXT_NODE);
        
        if (textNode) {
            if (label.closest('.state-creatureRewardType-container') || 
                label.nextElementSibling?.classList.contains('state-creatureRewardType-container')) {
                textNode.textContent = translations.fieldLabels?.type + ' ';
            } else if (label.closest('.state-creatureRewardCount-container') || 
                      label.nextElementSibling?.classList.contains('state-creatureRewardCount-container') ||
                      label.nextElementSibling?.classList.contains('creature-reward-count')) {
                textNode.textContent = translations.fieldLabels?.count + ' ';
            }
        }
    });

    // Update guardian labels directly by position rather than text content
    document.querySelectorAll('.guardians-group').forEach((groupContainer, containerIndex) => {
        const isTypeGroup = containerIndex === 0; // First guardians-group is for types
        const isSlotGroup = containerIndex === 1; // Second guardians-group is for slots

        // Update the group heading
        const heading = groupContainer.querySelector('h4');
        if (heading) {
            if (isTypeGroup) {
                setText(heading, translations.fieldLabels?.guardianType || 'Type');
            } else if (isSlotGroup) {
                setText(heading, translations.fieldLabels?.guardianSlot || 'Slot');
            }
        }
        
        // Keep the numbered labels as they are - they don't need translation
    });

    // Update grid popup title texts
    setText(document.getElementById('current-mode').previousElementSibling, `${translations.currentMode}:`);
    setText(document.getElementById('defenders-count').previousElementSibling, `${translations.defenders}:`);
    setText(document.getElementById('attackers-count').previousElementSibling, `${translations.attackers}:`);

    const isJsonPreviewVisible = dom.jsonPreview.classList.contains('show');
    setText(dom.toggleJsonButton, isJsonPreviewVisible ? translations.hideJsonCode : translations.showJsonCode);

    // --- Update Dropdown Options ---
    // Update select options for enabled dropdown
    if (translations.dropdownOptions?.enabled) {
        const enabledSelect = document.getElementById('enabled');
        if (enabledSelect) {
            const trueOption = enabledSelect.querySelector('option[value="true"]');
            const falseOption = enabledSelect.querySelector('option[value="false"]');
            if (trueOption) setText(trueOption, translations.dropdownOptions.enabled.true);
            if (falseOption) setText(falseOption, translations.dropdownOptions.enabled.false);
        }
    }

    // Update select options for isBank dropdown
    if (translations.dropdownOptions?.isBank) {
        const isBankSelect = document.getElementById('isBank');
        if (isBankSelect) {
            const trueOption = isBankSelect.querySelector('option[value="true"]');
            const falseOption = isBankSelect.querySelector('option[value="false"]');
            if (trueOption) setText(trueOption, translations.dropdownOptions.isBank.true);
            if (falseOption) setText(falseOption, translations.dropdownOptions.isBank.false);
        }
    }

    // --- Update Settings Dropdown ---
    const settingsGroup = document.querySelector('.settings-dropdown .settings-group h4');
    if (settingsGroup) {
        setText(settingsGroup, translations.settings?.indentSize);
    }

    const indentOptions = document.querySelectorAll('.settings-dropdown .radio-option label');
    if (indentOptions && indentOptions.length >= 2) {
        setText(indentOptions[0], translations.settings?.twoSpaces);
        setText(indentOptions[1], translations.settings?.fourSpaces);
    }

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
        } else {
            // Try converting hyphenated ID to camelCase for guardians tooltips
            const camelCaseKey = key.replace(/-(\w)/g, (_, c) => c.toUpperCase());
            if (translations.helpTexts?.[camelCaseKey]) {
                el.textContent = translations.helpTexts[camelCaseKey];
            }
        }
    });

    // Update property warning titles
    document.querySelectorAll('.property-warning').forEach(icon => {
        setTitle(icon, translations.propertyWarning);
        setText(icon, '⚠️'); // Set warning icon text
    });

    // Update placeholders
    setPlaceholder(dom.soundEnterInput, translations.soundPlaceholder);
    setPlaceholder(dom.soundLoopInput, translations.soundPlaceholder);
    setPlaceholder(dom.textVisitTextarea, translations.textVisitPlaceholder);
    // Placeholders inside dynamic elements are set during cloning

    // Update spellFlags dropdown options
    document.querySelectorAll('.flags-checkbox-container').forEach(container => {
        // Get the current flags value from the hidden input field
        const flagsContainer = container.closest('.spell-bits-flags-container');
        const flagsValueInput = flagsContainer?.querySelector('.spell-bits-flags-value');
        const flagsSelectedValues = flagsContainer?.querySelector('.flags-selected-values');
        const currentFlagsValue = flagsValueInput && flagsValueInput.value ? parseInt(flagsValueInput.value) : 0;
        
        // Clear existing checkboxes
        container.innerHTML = '';
        
        // Add checkboxes from translations
        if (translations.spellFlags) {
            const selectedValues = [];
            
            Object.keys(translations.spellFlags).forEach(key => {
                const checkboxItem = document.createElement('div');
                checkboxItem.className = 'flag-checkbox-item';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = key;
                checkbox.className = 'spell-flag-checkbox';
                checkbox.id = `flag-${key}-${Date.now()}-${Math.floor(Math.random() * 1000)}`; // Unique ID
                
                // Set the checked state based on the current flags value
                const flagValue = parseInt(key);
                if (!isNaN(flagValue) && !isNaN(currentFlagsValue)) {
                    checkbox.checked = (currentFlagsValue & flagValue) === flagValue;
                    if (checkbox.checked) {
                        selectedValues.push(flagValue);
                    }
                }
                
                const label = document.createElement('label');
                label.setAttribute('for', checkbox.id);
                label.textContent = translations.spellFlags[key];
                
                checkboxItem.appendChild(checkbox);
                checkboxItem.appendChild(label);
                container.appendChild(checkboxItem);
                
                // Add event listener for each checkbox
                checkbox.addEventListener('change', function() {
                    if (updateActions.updateFlagsValue) {
                        updateActions.updateFlagsValue(this.closest('.array-item'), updateActions.updateJsonPreview);
                    }
                });
            });
            
            // Update the selected values display
            if (flagsSelectedValues) {
                if (selectedValues.length > 1) {
                    flagsSelectedValues.textContent = selectedValues.join(', ') + ` (Sum: ${currentFlagsValue})`;
                } else if (selectedValues.length === 1) {
                    flagsSelectedValues.textContent = currentFlagsValue;
                } else {
                    flagsSelectedValues.textContent = '0';
                }
            }
        }
    });

    // Update primary skills labels
    document.querySelectorAll('.primary-attack-label').forEach(label => {
        setText(label, translations.primarySkills?.attack);
    });
    document.querySelectorAll('.primary-defense-label').forEach(label => {
        setText(label, translations.primarySkills?.defense);
    });
    document.querySelectorAll('.primary-power-label').forEach(label => {
        setText(label, translations.primarySkills?.power);
    });
    document.querySelectorAll('.primary-knowledge-label').forEach(label => {
        setText(label, translations.primarySkills?.knowledge);
    });

    // Keep the original ID-based selectors for backward compatibility
    setText(document.getElementById('primary-attack-label'), translations.primarySkills?.attack);
    setText(document.getElementById('primary-defense-label'), translations.primarySkills?.defense);
    setText(document.getElementById('primary-power-label'), translations.primarySkills?.power);
    setText(document.getElementById('primary-knowledge-label'), translations.primarySkills?.knowledge);

    // Update the translations for artifact type labels
    document.querySelectorAll('.artifact-treasure-label').forEach(label => {
        setText(label, translations.artifactTypes?.treasure);
    });
    document.querySelectorAll('.artifact-minor-label').forEach(label => {
        setText(label, translations.artifactTypes?.minor);
    });
    document.querySelectorAll('.artifact-major-label').forEach(label => {
        setText(label, translations.artifactTypes?.major);
    });
    document.querySelectorAll('.artifact-relic-label').forEach(label => {
        setText(label, translations.artifactTypes?.relic);
    });

    // Update resource fields translations
    document.querySelectorAll('.resource-wood-label').forEach(label => {
        setText(label, translations.resourceTypes?.wood);
    });
    document.querySelectorAll('.resource-ore-label').forEach(label => {
        setText(label, translations.resourceTypes?.ore);
    });
    document.querySelectorAll('.resource-mercury-label').forEach(label => {
        setText(label, translations.resourceTypes?.mercury);
    });
    document.querySelectorAll('.resource-sulfur-label').forEach(label => {
        setText(label, translations.resourceTypes?.sulfur);
    });
    document.querySelectorAll('.resource-crystal-label').forEach(label => {
        setText(label, translations.resourceTypes?.crystal);
    });
    document.querySelectorAll('.resource-gems-label').forEach(label => {
        setText(label, translations.resourceTypes?.gems);
    });
    document.querySelectorAll('.resource-gold-label').forEach(label => {
        setText(label, translations.resourceTypes?.gold);
    });
    document.querySelectorAll('.resource-mithril-label').forEach(label => {
        setText(label, translations.resourceTypes?.mithril);
    });

    // Re-evaluate save button state as language might affect validation perception
    if (updateSaveButtonState) {
        updateSaveButtonState();
    }
    
    // Update "Add Spell" and "Remove Spell" buttons
    document.querySelectorAll('.add-spell-btn').forEach(button => {
        setText(button, translations.addSpell);
    });
    
    document.querySelectorAll('.remove-spell-btn').forEach(button => {
        setText(button, translations.removeSpell);
    });

    // Update object selector with new translations
    if (updateObjectSelector) {
        updateObjectSelector();
    }

    // Update grid popup translations
    if (updateGridTranslations) {
        updateGridTranslations(translations);
    }

    // Update line break indicators
    if (updateAllLineBreakIndicators) {
        updateAllLineBreakIndicators();
    }

    // Update troop placement inputs with translated "Default" text
    if (updateTroopPlacementInputs) {
        updateTroopPlacementInputs(translations);
    }

    // Set validation dialog texts (for use in other files)
    window.dialogTexts = {
        validationErrorsTitle: translations.validationErrorsTitle,
        confirmFileOpen: translations.confirmFileOpen,
        resetConfirmation: translations.resetConfirmation
    };
};

/**
 * Updates all field labels in the application using translations from fieldLabels object
 */
const updateFieldLabels = () => {
    if (!translations.fieldLabels) return;

    // Process field labels that are direct text content of labels
    document.querySelectorAll('.field-label, .field-label-small').forEach(label => {
        // Skip labels with checkboxes (they're handled differently)
        if (label.querySelector('input[type="checkbox"]')) return;
        if (label.querySelector('input[type="radio"]')) return;

        // Get the first text node (the label text)
        const textNode = Array.from(label.childNodes).find(node => 
            node.nodeType === Node.TEXT_NODE && node.textContent.trim());
        
        if (!textNode) return;
        
        const labelText = textNode.textContent.trim();
        // Look for this label in the translations
        if (translations.fieldLabels[labelText]) {
            textNode.textContent = translations.fieldLabels[labelText] + ' ';
        }
    });

    // Specifically target spell bits section headers by their container classes
    // These need separate handling since they may not be properly caught by the general selectors
    const bitsHeadersMap = {
        '.spell-bits-flags-container': 'flags',
        '.spell-bits-levels-container': 'levels',
        '.spell-bits-schools-container': 'schools'
    };
    
    Object.entries(bitsHeadersMap).forEach(([containerSelector, fieldKey]) => {
        // For each container, find the preceding label
        document.querySelectorAll(containerSelector).forEach(container => {
            const fieldRow = container.closest('.field-row');
            if (!fieldRow) return;
            
            const label = fieldRow.querySelector('.field-label');
            if (!label || label.querySelector('input[type="radio"]')) return;
            
            // Get the text node (excluding help icons, etc.)
            const textNode = Array.from(label.childNodes).find(node => 
                node.nodeType === Node.TEXT_NODE && node.textContent.trim());
            
            if (textNode && translations.fieldLabels[fieldKey]) {
                textNode.textContent = translations.fieldLabels[fieldKey] + ' ';
            }
        });
    });

    // Specific handling for spell bits section headers (flags, levels, schools)
    document.querySelectorAll('.spell-bits-container .field-label').forEach(label => {
        // Skip radio button labels (they're handled separately)
        if (label.querySelector('input[type="radio"]')) return;
        
        // Find the text node (the header text)
        const textNode = Array.from(label.childNodes).find(node => 
            node.nodeType === Node.TEXT_NODE && node.textContent.trim());
        
        if (!textNode) return;
        
        const labelText = textNode.textContent.trim();
        // Look for this label in the translations
        if (translations.fieldLabels && translations.fieldLabels[labelText]) {
            textNode.textContent = translations.fieldLabels[labelText] + ' ';
        }
    });

    // Process labels with checkboxes (where the text is a sibling of the checkbox)
    document.querySelectorAll('.field-label input[type="checkbox"], .field-label-small input[type="checkbox"]').forEach(checkbox => {
        const label = checkbox.parentNode;
        // Get the text node that follows the checkbox
        const textNode = Array.from(label.childNodes).find(node => 
            node.nodeType === Node.TEXT_NODE && 
            node.textContent.trim() && 
            Array.from(label.childNodes).indexOf(node) > Array.from(label.childNodes).indexOf(checkbox));
        
        if (!textNode) return;
        
        const labelText = textNode.textContent.trim();
        // Look for this label in the translations
        if (translations.fieldLabels[labelText]) {
            textNode.textContent = ' ' + translations.fieldLabels[labelText] + ' ';
        }
    });

    // Process radio button labels (special case for spell type radios)
    document.querySelectorAll('.radio-label input[type="radio"]').forEach(radio => {
        const label = radio.parentNode;
        // Use translations from fieldLabels if available
        let translatedPrefix = '';
        if (translations.fieldLabels) {
            if (radio.value === 'id' && translations.fieldLabels.id) {
                translatedPrefix = translations.fieldLabels.id;
            } else if (radio.value === 'bits' && translations.fieldLabels.bits) {
                translatedPrefix = translations.fieldLabels.bits;
            }
        }
        
        if (!translatedPrefix) {
            // Fallback if translations not available
            translatedPrefix = radio.value === 'id' ? 'ID' : 'Bits';
        }
        
        // Find the text node after the radio
        const textNodes = Array.from(label.childNodes).filter(node => 
            node.nodeType === Node.TEXT_NODE && node.textContent.trim());
        
        if (textNodes.length > 0) {
            textNodes[0].textContent = ' ' + translatedPrefix + ' ';
        }
    });

    // Handle specific state item fields with checkboxes
    const fieldLabelMap = {
        'states': '#states-checkbox',  // Add this line to map the main states checkbox
        'spells': '.state-spells-checkbox',
        'skills': '.state-skills-checkbox',
        'primary': '.state-skills-primary-container',
        'creatureReward': '.state-creatureReward-checkbox',
        'guardians': '.state-guardians-checkbox',
        'upgrade': '.state-upgrade-checkbox',
        'morale': '.state-morale-checkbox',
        'luck': '.state-luck-checkbox',
        'spellPoints': '.state-spellPoints-checkbox',
        'experience': '.state-experience-checkbox',
        'artifactIds': '.state-artifactIds-checkbox',
        'artifactTypeCounts': '.state-artifactTypeCounts-checkbox',
        'resources': '.state-resources-checkbox',
        'customDef': '.state-customDef-checkbox',
        'chance': '.state-chance-checkbox'
    };

    // Apply translations to all state item fields
    Object.entries(fieldLabelMap).forEach(([key, selector]) => {
        if (translations.fieldLabels && translations.fieldLabels[key]) {
            // Select all matching elements across all state items
            document.querySelectorAll(selector).forEach(el => {
                // Special handling for the main states checkbox which has a different structure
                if (selector === '#states-checkbox') {
                    const parentLabel = el.parentNode;
                    if (parentLabel) {
                        const textNodes = Array.from(parentLabel.childNodes).filter(node => 
                            node.nodeType === Node.TEXT_NODE && node.textContent.trim());
                        
                        if (textNodes.length > 0) {
                            // Find the text node after the checkbox
                            const textNode = textNodes.find(node => 
                                Array.from(parentLabel.childNodes).indexOf(node) > 
                                Array.from(parentLabel.childNodes).indexOf(el));
                            
                            if (textNode) {
                                textNode.textContent = ' ' + translations.fieldLabels[key] + ' ';
                            }
                        }
                    }
                }
                // For primary label, which has a special structure
                else if (selector === '.state-skills-primary-container') {
                    // Find the associated label
                    const fieldRow = el.closest('.field-row');
                    if (fieldRow) {
                        const label = fieldRow.querySelector('.field-label');
                        if (label) {
                            const textNode = Array.from(label.childNodes).find(node => 
                                node.nodeType === Node.TEXT_NODE && node.textContent.trim());
                            
                            if (textNode) {
                                textNode.textContent = translations.fieldLabels[key] + ' ';
                            }
                        }
                    }
                } else {
                    const parentLabel = el.closest('.field-label, .field-label-small');
                    if (parentLabel) {
                        const textNodes = Array.from(parentLabel.childNodes).filter(node => 
                            node.nodeType === Node.TEXT_NODE && node.textContent.trim());
                        
                        if (textNodes.length > 0) {
                            // Find the text node after the checkbox
                            const textNode = textNodes.find(node => 
                                Array.from(parentLabel.childNodes).indexOf(node) > 
                                Array.from(parentLabel.childNodes).indexOf(el));
                            
                            if (textNode) {
                                textNode.textContent = ' ' + translations.fieldLabels[key] + ' ';
                            }
                        }
                    }
                }
            });
        }
    });

    // Special handling for "count" labels in creatureReward
    document.querySelectorAll('.creature-reward-count, .state-creatureRewardCount-container').forEach(container => {
        // Find the associated label that comes right before this container
        const label = container.previousElementSibling;
        if (label && label.classList.contains('field-label-small')) {
            // Get the text node (excluding the help icon)
            const textNode = Array.from(label.childNodes).find(node => 
                node.nodeType === Node.TEXT_NODE);
            
            if (textNode && textNode.textContent.trim().toLowerCase() === 'count') {
                textNode.textContent = translations.fieldLabels.count + ' ';
            }
        }
    });

    // Direct targeting for creature reward type and count labels
    document.querySelectorAll('.state-creatureReward-container .field-label-small').forEach(label => {
        const textNode = Array.from(label.childNodes).find(node => 
            node.nodeType === Node.TEXT_NODE);
        
        if (textNode) {
            const text = textNode.textContent.trim().toLowerCase();
            if (text === 'count' && translations.fieldLabels.count) {
                textNode.textContent = translations.fieldLabels.count + ' ';
            } else if (text === 'type' && translations.fieldLabels.type) {
                textNode.textContent = translations.fieldLabels.type + ' ';
            }
        }
    });

    // Fix for "primary" label which uses a special structure
    const primaryLabels = document.querySelectorAll('.field-label:has(~ .field-input > .state-skills-primary-container), .field-label:has(~ .state-skills-primary-container)');
    if (primaryLabels.length === 0) {
        // Browser compatibility fix if :has() is not supported
        document.querySelectorAll('.field-label').forEach(label => {
            // Find labels adjacent to primary container
            const container = label.nextElementSibling;
            if (container && 
                ((container.classList.contains('field-input') && container.querySelector('.state-skills-primary-container')) ||
                container.classList.contains('state-skills-primary-container'))) {
                
                const textNode = Array.from(label.childNodes).find(node => 
                    node.nodeType === Node.TEXT_NODE && node.textContent.trim());
                
                if (textNode && textNode.textContent.trim() === 'primary' && translations.fieldLabels?.primary) {
                    textNode.textContent = translations.fieldLabels.primary + ' ';
                }
            }
        });
    } else {
        // If :has() is supported, use it
        primaryLabels.forEach(label => {
            const textNode = Array.from(label.childNodes).find(node => 
                node.nodeType === Node.TEXT_NODE && node.textContent.trim());
            
            if (textNode && textNode.textContent.trim() === 'primary' && translations.fieldLabels?.primary) {
                textNode.textContent = translations.fieldLabels.primary + ' ';
            }
        });
    }

    // Special handling for certain specific labels - use direct ID-based selectors where possible
    const specialLabelSelectors = {
        // More compatible selectors that don't use :has()
        'type': '#object-type',
        'subtype': '#object-subtype',
        'properties': '#properties-container', 
        'value': '#value',
        'density': '#density',
        'enabled': '#enabled-checkbox',
        // Add specific selectors for problematic fields
        'name': '#name-checkbox',
        'sound': '#sound-checkbox',
        'text': '#text-checkbox',
        'troopPlacement': '#troopPlacement-checkbox'
    };

    // Apply the special label mappings
    for (const [key, selector] of Object.entries(specialLabelSelectors)) {
        // First, get the element
        const element = document.querySelector(selector);
        if (!element) continue;
        
        // Then find its label - traverse up to parent for field input and then find previous sibling
        let label;
        
        if (selector.startsWith('#') && !selector.endsWith('-checkbox')) {
            // For regular inputs, look for label with matching 'for' attribute
            label = document.querySelector(`label[for="${selector.substring(1)}"]`);
            
            // If no explicit label, try to find the closest field-label
            if (!label) {
                const parent = element.closest('.field-input');
                if (parent) {
                    // Find the previous sibling that's a label
                    label = parent.previousElementSibling;
                    if (label && !label.classList.contains('field-label') && !label.classList.contains('field-label-small')) {
                        label = null;
                    }
                }
            }
        } else if (selector.endsWith('-checkbox')) {
            // For checkboxes, the label is the parent
            label = element.parentElement;
        } else if (selector === '#properties-container') {
            // Special case for properties which has a unique structure
            const parent = element.closest('.field-input');
            if (parent) {
                label = parent.previousElementSibling;
            }
        }
        
        // If we found a label, update its text content
        if (label && translations.fieldLabels[key]) {
            // Find the text node
            const textNode = Array.from(label.childNodes).find(node => 
                node.nodeType === Node.TEXT_NODE && node.textContent.trim());
            
            if (textNode) {
                textNode.textContent = translations.fieldLabels[key] + ' ';
            }
        }
    }
    
    // Handle the nested fields under sound, text, and troopPlacement
    const nestedFieldMappings = [
        { selector: 'label[for="sound-enter"]', key: 'enter' },
        { selector: 'label[for="sound-loop"]', key: 'loop' },
        { selector: 'label[for="text-visit"]', key: 'visit' },
        { selector: 'label[for="isBank"]', key: 'isBank' },
        { selector: 'label[for="attackers"]', key: 'attackers' },
        { selector: 'label[for="defenders"]', key: 'defenders' }
    ];
    
    nestedFieldMappings.forEach(mapping => {
        const label = document.querySelector(mapping.selector);
        if (label && translations.fieldLabels[mapping.key]) {
            // Get the text node (exclude help icons and other elements)
            const textNode = Array.from(label.childNodes).find(node => 
                node.nodeType === Node.TEXT_NODE && node.textContent.trim());
            
            if (textNode) {
                textNode.textContent = translations.fieldLabels[mapping.key] + ' ';
            }
        }
    });

    // Update guardian labels directly by position rather than text content
    document.querySelectorAll('.guardians-fields').forEach((groupContainer, containerIndex) => {
        const isTypeGroup = containerIndex === 0; // First guardians-group is for types
        const isCountGroup = containerIndex === 1; // Second guardians-group is for counts

        // Update the group heading
        const heading = groupContainer.previousElementSibling;
        if (heading) {
            const textNode = Array.from(heading.childNodes).find(node => 
                node.nodeType === Node.TEXT_NODE && node.textContent.trim());
            
            if (textNode) {
                if (isTypeGroup) {
                    setText(textNode, translations.fieldLabels?.type || 'Type');
                } else if (isCountGroup) {
                    setText(textNode, translations.fieldLabels?.count || 'Count');
                }
            }
        }
        
        // Keep the numbered labels as they are - they don't need translation
    });

    // Special handling for guardian type/count field labels
    document.querySelectorAll('.state-guardians-fields-container .field-group > .field-label').forEach(label => {
        const textNode = Array.from(label.childNodes).find(node => 
            node.nodeType === Node.TEXT_NODE && node.textContent.trim());
        
        if (!textNode) return;
        
        const labelText = textNode.textContent.trim();
        if (labelText === 'Type' && translations.fieldLabels?.type) {
            textNode.textContent = translations.fieldLabels.type + ' ';
        } else if (labelText === 'Count' && translations.fieldLabels?.count) {
            textNode.textContent = translations.fieldLabels.count + ' ';
        }
    });
};

/**
 * Updates the labels for spell levels and schools based on current translations
 */
const updateSpellLabels = () => {
    // Update spell level labels
    document.querySelectorAll('[data-spell-level]').forEach(element => {
        const level = element.getAttribute('data-spell-level');
        if (translations.spellLevels && translations.spellLevels[level]) {
            element.textContent = translations.spellLevels[level];
        }
    });

    // Update spell school labels
    document.querySelectorAll('[data-spell-school]').forEach(element => {
        const school = element.getAttribute('data-spell-school');
        if (translations.spellSchools && translations.spellSchools[school]) {
            element.textContent = translations.spellSchools[school];
        }
    });
};

/**
 * Localizes a state tab header
 * @param {HTMLElement} header - The state tab header element to localize
 * @returns {void}
 */
const localizeStateTabHeader = (header) => {
    if (!header || !translations.state) return;
    
    const stateNumber = header.textContent.replace(/[^\d]+(\d+)/, '$1');
    if (stateNumber) {
        header.textContent = `${translations.state} #${stateNumber}`;
    }
};

/**
 * Localizes a spell tab header
 * @param {HTMLElement} header - The spell tab header element to localize
 * @returns {void}
 */
const localizeSpellTabHeader = (header) => {
    if (!header || !translations.spell) return;
    
    const spellNumber = header.textContent.replace(/[^\d]+(\d+)/, '$1');
    if (spellNumber) {
        header.textContent = `${translations.spell} #${spellNumber}`;
    }
};

// Get the current translations object
const getTranslations = () => translations;

// Export public methods and properties
export {
    loadLanguage,
    updateUILanguage,
    getTranslations,
    setText,
    setHtml,
    setPlaceholder,
    setTitle,
    localizeStateTabHeader,
    localizeSpellTabHeader,
    updateSpellLabels,
    updateFieldLabels // Export the new function
};
