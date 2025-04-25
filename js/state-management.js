'use strict';

// Import DOM elements dependency
import { dom } from './dom-elements.js';

// Import localization functions for tabs
import { localizeStateTabHeader, localizeSpellTabHeader } from './localization.js';

// Track active tabs
let activeStateTab = 0; // Track which state tab is active
let activeSpellTabs = {}; // Track active spell tab for each state

/**
 * Adds a new state to the states container
 * @param {Object} dom DOM elements
 * @param {Function} updateJsonPreview Function to update JSON preview
 * @param {Function} updateCustomDefWarnings Function to update custom def warnings
 * @param {Function} addSpellToState Function to add a spell to a state
 * @param {Object} translations Translations object
 * @returns {void}
 */
const addState = (dom, updateJsonPreview, updateCustomDefWarnings, addSpellToState, translations) => {
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
    
    // Apply translations to tooltip elements in the new state
    if (translations) {
        newStateItem.querySelectorAll('[data-translate-id]').forEach(el => {
            const key = el.getAttribute('data-translate-id');
            if (translations.helpTexts && translations.helpTexts[key]) {
                el.textContent = translations.helpTexts[key];
            }
        });
        
        // Apply translations to artifact type labels
        if (translations.artifactTypes) {
            const artifactLabels = {
                '.artifact-treasure-label': translations.artifactTypes.treasure,
                '.artifact-minor-label': translations.artifactTypes.minor,
                '.artifact-major-label': translations.artifactTypes.major,
                '.artifact-relic-label': translations.artifactTypes.relic
            };
            
            Object.entries(artifactLabels).forEach(([selector, text]) => {
                const label = newStateItem.querySelector(selector);
                if (label) label.textContent = text;
            });
        }
        
        // Apply translations to resource labels
        if (translations.resourceTypes) {
            const resourceLabels = {
                '.resource-wood-label': translations.resourceTypes.wood,
                '.resource-ore-label': translations.resourceTypes.ore,
                '.resource-mercury-label': translations.resourceTypes.mercury,
                '.resource-sulfur-label': translations.resourceTypes.sulfur,
                '.resource-crystal-label': translations.resourceTypes.crystal,
                '.resource-gems-label': translations.resourceTypes.gems,
                '.resource-gold-label': translations.resourceTypes.gold,
                '.resource-mithril-label': translations.resourceTypes.mithril
            };
            
            Object.entries(resourceLabels).forEach(([selector, text]) => {
                const label = newStateItem.querySelector(selector);
                if (label) label.textContent = text;
            });
        }
        
        // Apply translations to primary skill labels
        if (translations.primarySkills) {
            const skillLabels = {
                '.primary-attack-label': translations.primarySkills.attack,
                '.primary-defense-label': translations.primarySkills.defense,
                '.primary-power-label': translations.primarySkills.power,
                '.primary-knowledge-label': translations.primarySkills.knowledge
            };
            
            Object.entries(skillLabels).forEach(([selector, text]) => {
                const label = newStateItem.querySelector(selector);
                if (label) label.textContent = text;
            });
        }
        
        // Apply translations to creatureReward labels
        const typeLabels = newStateItem.querySelectorAll('.field-label-small');
        typeLabels.forEach(label => {
            const text = label.childNodes[0].textContent.trim();
            
            if (text === 'type' && 
                (label.closest('.state-creatureRewardType-container') || 
                 label.closest('.field-row')?.querySelector('.state-creatureRewardType-container'))) {
                label.childNodes[0].textContent = translations.fieldLabels?.type || 'type';
            } else if (text === 'count' && 
                      (label.closest('.creature-reward-count') || 
                       label.closest('.field-row')?.querySelector('.state-creatureRewardCount-container'))) {
                label.childNodes[0].textContent = translations.fieldLabels?.count || 'count';
            }
        });
        
        // Apply translations to guardian labels
        const guardianLabels = newStateItem.querySelectorAll('.guardian-field label');
        guardianLabels.forEach(label => {
            const text = label.textContent.trim();
            
            if (text === 'Type') {
                label.textContent = translations.fieldLabels?.guardianType || 'Type';
            } else if (text.startsWith('Slot')) {
                const slotNum = text.split(' ')[1];
                label.textContent = `${translations.fieldLabels?.guardianSlot || 'Slot'} ${slotNum}`;
            }
        });
        
        // Localize the Add Spell and Remove Spell buttons
        const addSpellBtn = newStateItem.querySelector('.add-spell-btn');
        const removeSpellBtn = newStateItem.querySelector('.remove-spell-btn');
        
        if (addSpellBtn && translations.addSpell) {
            addSpellBtn.textContent = translations.addSpell;
        }
        
        if (removeSpellBtn && translations.removeSpell) {
            removeSpellBtn.textContent = translations.removeSpell;
        }
        
        // Localize field labels with checkboxes
        newStateItem.querySelectorAll('.field-label input[type="checkbox"], .field-label-small input[type="checkbox"]').forEach(checkbox => {
            const label = checkbox.parentNode;
            const nextSibling = Array.from(label.childNodes).find(node => 
                node.nodeType === Node.TEXT_NODE && 
                node.textContent.trim() && 
                Array.from(label.childNodes).indexOf(node) > Array.from(label.childNodes).indexOf(checkbox));
            
            if (nextSibling) {
                const labelText = nextSibling.textContent.trim();
                if (translations.fieldLabels && translations.fieldLabels[labelText]) {
                    nextSibling.textContent = ' ' + translations.fieldLabels[labelText] + ' ';
                }
            }
        });

        // Apply translations to specific field labels
        const fieldLabelMap = {
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

        // Iterate through fieldLabelMap and apply translations
        Object.entries(fieldLabelMap).forEach(([key, selector]) => {
            if (translations.fieldLabels && translations.fieldLabels[key]) {
                const elements = newStateItem.querySelectorAll(selector);
                elements.forEach(el => {
                    // For primary label, which has a special structure
                    if (selector === '.state-skills-primary-container') {
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
                        // Handle normal checkboxes
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

        // Handle non-checkbox field labels
        newStateItem.querySelectorAll('.field-label:not(:has(input[type="checkbox"]))').forEach(label => {
            const textNode = Array.from(label.childNodes).find(node => 
                node.nodeType === Node.TEXT_NODE && node.textContent.trim());
            
            if (textNode) {
                const labelText = textNode.textContent.trim();
                if (translations.fieldLabels && translations.fieldLabels[labelText]) {
                    textNode.textContent = translations.fieldLabels[labelText] + ' ';
                }
            }
        });
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
    updateStateTabs(dom);
    
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

/**
 * Adds initial state if none exists
 * @param {Object} dom DOM elements
 * @param {Function} addState Function to add a state
 * @param {Function} initializeSpellTabs Function to initialize spell tabs
 * @param {Function} updateStateTabs Function to update state tabs
 */
const addInitialState = (dom, addState, updateStateTabs) => {
    // Only add if no states exist
    if (dom.statesItemsContainer.children.length === 0) {
        addState();
    } else {
        // Initialize dependencies for existing states
        dom.statesItemsContainer.querySelectorAll('.state-item').forEach(stateItem => {
            initCreatureRewardDependencies(stateItem);
            initGuardianFieldDependencies(stateItem);
        });
        // Setup tabs for existing states
        updateStateTabs();
    }
};

/**
 * Removes the currently active state
 * @param {Object} dom DOM elements
 * @param {Function} updateJsonPreview Function to update JSON preview
 * @param {Function} updateSaveButtonState Function to update save button state
 * @param {Function} updateCustomDefWarnings Function to update custom def warnings
 */
const removeActiveState = (dom, updateJsonPreview, updateSaveButtonState, updateCustomDefWarnings) => {
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
    renumberStates(dom);
    updateStateTabs(dom);
    
    // Check customDef consistency after removal and before JSON update
    updateCustomDefWarnings();
    
    // Update JSON preview and save button state
    updateJsonPreview();
    updateSaveButtonState();
};

/**
 * Updates state tab display
 * @param {Object} dom DOM elements
 */
const updateStateTabs = (dom) => {
    // Clear existing tab headers
    dom.statesTabsHeaders.innerHTML = '';
    
    // Create tab headers for each state
    const stateItems = dom.statesItemsContainer.querySelectorAll('.state-item');
    stateItems.forEach((item, index) => {
        const tabHeader = document.createElement('div');
        tabHeader.className = 'state-tab-header';
        tabHeader.dataset.tabIndex = index;
        
        // Set initial text (will be localized next)
        tabHeader.textContent = `State #${index + 1}`;
        
        // Apply localization to the tab header
        localizeStateTabHeader(tabHeader);
        
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

/**
 * Activates a specific state tab
 * @param {number} tabIndex The index of the tab to activate
 * @param {Object} dom DOM elements
 */
const activateStateTab = (tabIndex, dom) => {
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

/**
 * Renumbers states and updates UI accordingly
 * @param {Object} dom DOM elements
 * @param {Function} updateJsonPreview Function to update JSON preview
 */
const renumberStates = (dom, updateJsonPreview) => {
    // Update state tabs - now handled by updateStateTabs()
    updateStateTabs(dom);
    
    // Recreate activeSpellTabs object for the current states
    const newActiveSpellTabs = {};
    dom.statesItemsContainer.querySelectorAll('.state-item').forEach((stateItem, stateIndex) => {
        newActiveSpellTabs[stateIndex] = activeSpellTabs[stateIndex] || 0;
        updateSpellTabs(stateItem, stateIndex);
    });
    activeSpellTabs = newActiveSpellTabs;
    
    // Update JSON preview after renumbering if state order matters in JSON
    if (updateJsonPreview) {
        updateJsonPreview();
    }
};

/**
 * Initializes spell tabs for all states
 * @param {Object} dom DOM elements 
 */
const initializeSpellTabs = (dom) => {
    // Initialize spell tabs for all states
    dom.statesItemsContainer.querySelectorAll('.state-item').forEach((stateItem, stateIndex) => {
        // Initialize this state's spell tabs if not already in our tracking object
        if (!activeSpellTabs[stateIndex]) {
            activeSpellTabs[stateIndex] = 0;
        }
        updateSpellTabs(stateItem, stateIndex);
    });
};

/**
 * Adds a spell to a state
 * @param {Element} stateItemElement State element to add spell to
 * @param {boolean} triggerJsonUpdate Whether to trigger a JSON update
 * @param {Object} translations Translations object
 * @param {Function} updateJsonPreview Function to update JSON preview
 * @returns {Element|null} The newly added spell element
 */
const addSpellToState = (stateItemElement, triggerJsonUpdate = true, translations, updateJsonPreview) => {
    const spellsContainer = stateItemElement.querySelector('.state-spells-items');
    if (!spellsContainer) return null;

    const spellsCount = spellsContainer.querySelectorAll('.array-item').length;
    if (spellsCount >= 4) return null; // Max 4 spells per state

    const template = document.getElementById('spell-item-template').content.cloneNode(true);
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
        if (translations && translations.helpTexts?.[key]) {
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

    // After creating spell item, apply translations to the spell levels and schools
    if (translations) {
        const levelLabels = newSpellItem.querySelectorAll('[data-spell-level]');
        levelLabels.forEach(element => {
            const level = element.getAttribute('data-spell-level');
            if (translations.spellLevels && translations.spellLevels[level]) {
                element.textContent = translations.spellLevels[level];
            }
        });

        const schoolLabels = newSpellItem.querySelectorAll('[data-spell-school]');
        schoolLabels.forEach(element => {
            const school = element.getAttribute('data-spell-school');
            if (translations.spellSchools && translations.spellSchools[school]) {
                element.textContent = translations.spellSchools[school];
            }
        });
        
        // Add localization for radio button labels (By ID and By Bits)
        const radioLabels = newSpellItem.querySelectorAll('.radio-label input[type="radio"]');
        radioLabels.forEach(radio => {
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
        
        // Локализация заголовков полей bits section (flags, levels, schools)
        const fieldLabels = newSpellItem.querySelectorAll('.field-label');
        fieldLabels.forEach(label => {
            // Пропускаем метки с радио-кнопками (они обрабатываются по-другому)
            if (label.querySelector('input[type="radio"]')) return;
            
            // Получаем текстовый узел (текст метки)
            const textNode = Array.from(label.childNodes).find(node => 
                node.nodeType === Node.TEXT_NODE && node.textContent.trim());
            
            if (!textNode) return;
            
            const labelText = textNode.textContent.trim();
            // Ищем эту метку в переводах
            if (translations.fieldLabels && translations.fieldLabels[labelText]) {
                textNode.textContent = translations.fieldLabels[labelText] + ' ';
            }
        });
    }

    spellsContainer.appendChild(newSpellItem);

    // Update spell tabs
    const stateIndex = Array.from(document.querySelectorAll('.state-item')).indexOf(stateItemElement);
    updateSpellTabs(stateItemElement, stateIndex);

    // After adding the new spell item to the DOM, populate flags checkboxes
    // Get global translations if not provided to ensure flags are always populated
    const appTranslations = translations || window.appTranslations;
    populateSpellFlags(newSpellItem, appTranslations, updateJsonPreview);

    // Update spell buttons state
    const spellsCheckbox = stateItemElement.querySelector('.state-spells-checkbox');
    if (spellsCheckbox && spellsCheckbox.checked) {
        updateSpellButtonsState(stateItemElement, true);
    }

    if (triggerJsonUpdate && updateJsonPreview) {
        updateJsonPreview();
    }
    
    return newSpellItem;
};

/**
 * Populates spell flags checkboxes for a spell item
 * @param {Element} spellItem The spell element to populate flags for
 * @param {Object} translations Translations object
 * @param {Function} updateJsonPreview Function to update JSON preview
 */
const populateSpellFlags = (spellItem, translations, updateJsonPreview) => {
    if (!spellItem) return;
    
    const flagsContainer = spellItem.querySelector('.flags-checkbox-container');
    if (!flagsContainer) return;
    
    // Clear container
    flagsContainer.innerHTML = '';
    
    // Only proceed if we have translations
    if (translations && translations.spellFlags) {
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
                updateFlagsValue(this.closest('.array-item'), updateJsonPreview);
            });
        });
    }
};

/**
 * Activates a specific spell tab
 * @param {Element} stateItem The state element
 * @param {number} stateIndex The index of the state
 * @param {number} spellIndex The index of the spell tab
 */
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

/**
 * Updates spell tabs for a state
 * @param {Element} stateItem The state element
 * @param {number} stateIndex The index of the state
 */
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
        tabHeader.dataset.tabIndex = index;
        
        // Set initial text (will be localized next)
        tabHeader.textContent = `Spell #${index + 1}`;
        
        // Apply localization to the tab header
        localizeSpellTabHeader(tabHeader);
        
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

/**
 * Updates state buttons based on checkbox state
 * @param {boolean} enabled Whether states are enabled
 */
const updateStateButtonsState = (enabled) => {
    dom.addStateButton.disabled = !enabled;
    dom.removeStateButton.disabled = !enabled || dom.statesItemsContainer.querySelectorAll('.state-item').length <= 1;
};

/**
 * Updates spell buttons for a specific state
 * @param {Element} stateItem The state element
 * @param {boolean} enabled Whether spells are enabled
 */
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

/**
 * Initializes all button states based on checkbox states
 * @param {Object} dom DOM elements
 */
const initializeButtonStates = (dom) => {
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

/**
 * Updates flags value based on selected checkboxes
 * @param {Element} spellItem The spell element
 * @param {Function} updateJsonPreview Function to update JSON preview
 */
const updateFlagsValue = (spellItem, updateJsonPreview) => {
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
        // Set to empty string if sum is 0, otherwise set to sum
        flagsValueInput.value = sum > 0 ? sum : '';
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
    if (updateJsonPreview) {
        updateJsonPreview();
    }
};

/**
 * Updates levels value based on selected checkboxes
 * @param {Element} spellItem The spell element
 * @param {Function} updateJsonPreview Function to update JSON preview
 */
const updateLevelsValue = (spellItem, updateJsonPreview) => {
    if (!spellItem) return;
    
    const checkboxes = spellItem.querySelectorAll('.spell-level-checkbox:checked');
    const levelsValueInput = spellItem.querySelector('.spell-bits-levels-value');
    
    // Calculate the sum of selected values
    let sum = 0;
    
    checkboxes.forEach(checkbox => {
        const value = parseInt(checkbox.value);
        if (!isNaN(value)) {
            sum += value;
        }
    });
    
    // Update the hidden input value
    if (levelsValueInput) {
        // Set to empty string if sum is 0, otherwise set to sum
        levelsValueInput.value = sum > 0 ? sum : '';
    }
    
    // Update JSON preview
    if (updateJsonPreview) {
        updateJsonPreview();
    }
};

/**
 * Updates schools value based on selected checkboxes
 * @param {Element} spellItem The spell element
 * @param {Function} updateJsonPreview Function to update JSON preview
 */
const updateSchoolsValue = (spellItem, updateJsonPreview) => {
    if (!spellItem) return;
    
    const checkboxes = spellItem.querySelectorAll('.spell-school-checkbox:checked');
    const schoolsValueInput = spellItem.querySelector('.spell-bits-schools-value');
    
    // Calculate the sum of selected values
    let sum = 0;
    
    checkboxes.forEach(checkbox => {
        const value = parseInt(checkbox.value);
        if (!isNaN(value)) {
            sum += value;
        }
    });
    
    // Update the hidden input value
    if (schoolsValueInput) {
        // Set to empty string if sum is 0, otherwise set to sum
        schoolsValueInput.value = sum > 0 ? sum : '';
    }
    
    // Update JSON preview
    if (updateJsonPreview) {
        updateJsonPreview();
    }
};

/**
 * Initializes the creature reward dependencies
 * @param {Element} stateItem The state element
 */
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

/**
 * Initializes the guardian field dependencies
 * @param {Element} stateItem The state element
 */
const initGuardianFieldDependencies = (stateItem) => {
    for (let i = 1; i <= 7; i++) {
        const typeInput = stateItem.querySelector(`.state-guardians-type-${i}`);
        const countInput = stateItem.querySelector(`.state-guardians-count-${i}`);
        
        if (typeInput && countInput) {
            // Set initial state based on type value
            if (typeInput.value === '-1' || typeInput.value === '') {
                countInput.value = ''; // Empty by default, not 0
                countInput.disabled = true;
            } else {
                countInput.disabled = false;
            }
        }
    }
};

// Export the module functions
export {
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
    initCreatureRewardDependencies,
    initGuardianFieldDependencies,
    activeStateTab,
    activeSpellTabs,
    populateSpellFlags
};
