'use strict';

/**
 * Validates that all required fields have values
 * @param {Object} dom - DOM elements object
 * @returns {boolean} - Whether all required fields are valid
 */
export const validateRequiredFields = (dom) => {
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

/**
 * Validates property format
 * @param {string} propertyValue - Property value to validate
 * @returns {boolean} - Whether the property is valid
 */
export const validateProperty = (propertyValue) => {
    // Format: name.def [8 groups of numbers separated by spaces]
    // Allows any characters for name, requires .def extension, followed by exactly 8 space-separated numbers.
    const regex = /^.+\.def(\s+-?\d+){8}$/; // Allow negative numbers too
    return regex.test(propertyValue);
};

/**
 * Updates the JSON preview based on current form data
 * @param {Object} dom - DOM elements object
 * @param {Function} buildJsonObject - Function to build the JSON object
 * @param {number} indentSize - Number of spaces for JSON indentation
 */
export const updateJsonPreview = (dom, buildJsonObject, indentSize = 2) => {
    try {
        const jsonObj = buildJsonObject(dom);
        // Use specified indent size
        const jsonString = JSON.stringify(jsonObj, null, indentSize);
        dom.jsonPreview.textContent = jsonString;
        dom.jsonPreview.classList.remove('invalid-json'); // Remove error state if successful
    } catch (error) {
        console.error("Error generating JSON:", error);
        dom.jsonPreview.textContent = `Error generating JSON:\n${error.message}`;
        dom.jsonPreview.classList.add('invalid-json'); // Add error state (optional styling)
    }
};

/**
 * Builds the JSON object based on current form data
 * @param {Object} dom - DOM elements object
 * @param {Object} state - Application state (attackersList, defendersList, objectsList, etc.)
 * @returns {Object} - The built JSON object
 */
export const buildJsonObject = (dom, state = {}) => {
    const { 
        usingDefaultAttackers = false, 
        usingDefaultDefenders = false,
        objectsList = [], // List of all objects with their data
        currentObjectIndex = 0 
    } = state;
    
    // Создаем финальный объект для всех типов и подтипов
    const finalObj = {
        "RMG": {
            "objectGeneration": {}
        }
    };

    // Если нет объектов в списке, используем текущие данные формы
    if (!objectsList || objectsList.length === 0) {
        const innerJsonObj = buildInnerJsonObject(dom, usingDefaultAttackers, usingDefaultDefenders);
        const type = dom.objectTypeInput ? dom.objectTypeInput.textContent : '16';
        const subtype = dom.objectSubtypeInput.value || "0";
        
        if (!finalObj.RMG.objectGeneration[type]) {
            finalObj.RMG.objectGeneration[type] = {};
        }
        
        finalObj.RMG.objectGeneration[type][subtype] = innerJsonObj;
        
        return finalObj;
    }
    
    // Обрабатываем текущий объект из формы
    const currentType = dom.objectTypeInput ? dom.objectTypeInput.textContent : '16';
    const currentSubtype = dom.objectSubtypeInput ? dom.objectSubtypeInput.value : '0';
    const currentInnerObj = buildInnerJsonObject(dom, usingDefaultAttackers, usingDefaultDefenders);
    
    if (!finalObj.RMG.objectGeneration[currentType]) {
        finalObj.RMG.objectGeneration[currentType] = {};
    }
    
    finalObj.RMG.objectGeneration[currentType][currentSubtype] = currentInnerObj;
    
    // Добавляем все остальные объекты из списка
    objectsList.forEach((obj, index) => {
        // Пропускаем текущий объект, так как он уже добавлен
        if (obj.type === currentType && obj.subtype === currentSubtype) {
            return;
        }
        
        // Проверяем, существует ли тип в финальном объекте
        if (!finalObj.RMG.objectGeneration[obj.type]) {
            finalObj.RMG.objectGeneration[obj.type] = {};
        }
        
        // Добавляем объект в финальную структуру
        // Используем сохраненные данные, если они есть
        if (obj.data && Object.keys(obj.data).length > 0) {
            finalObj.RMG.objectGeneration[obj.type][obj.subtype] = obj.data;
        } else {
            // Минимальный объект для объектов без данных
            finalObj.RMG.objectGeneration[obj.type][obj.subtype] = { 
                properties: [] 
            };
        }
    });
    
    return finalObj;
};

/**
 * Build the inner JSON object from form data
 * @param {Object} dom - DOM elements
 * @param {boolean} usingDefaultAttackers - Whether using default attackers
 * @param {boolean} usingDefaultDefenders - Whether using default defenders
 * @returns {Object} - The inner JSON object
 */
const buildInnerJsonObject = (dom, usingDefaultAttackers, usingDefaultDefenders) => {
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
                        isNaN(ore) ? 0 : ore,
                        isNaN(mercury) ? 0 : mercury,
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
                                const idInput = spellElement.querySelector('input.spell-id-input');
                                if (idInput && idInput.value.trim() !== '') {
                                    const id = parseInt(idInput.value.trim());
                                    if (!isNaN(id)) {
                                        // Store the ID even if it's out of the standard range
                                        spellObj.id = id;
                                    }
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
            const translations = window.appTranslations || {};
            
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

    return innerJsonObj;
};
