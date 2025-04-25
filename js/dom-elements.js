'use strict';

// DOM Element References
export const dom = {
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
    statesCheckbox: document.getElementById('states-checkbox'),
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
    settingsButton: document.getElementById('settings-button'),
    settingsDropdown: document.getElementById('settings-dropdown'),
    openJsonFileButton: document.getElementById('open-json-file'),
    resetFormButton: document.getElementById('reset-form'),
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
    disabledCellsLabel: document.getElementById('disabled-cells-label'),
    gridSelectionHelp: document.getElementById('grid-selection-help'),
    
    // Object Selector UI
    objectTypeInput: document.getElementById('object-type'),
    objectSelector: document.getElementById('object-selector'),
    newObjectBtn: document.getElementById('new-object-btn'),
    removeObjectBtn: document.getElementById('remove-object-btn'),
    duplicateWarning: document.getElementById('duplicate-warning'),
};

// Export the borderCells array as well since it relates to DOM structure
export const borderCells = [
    "00", "17", "34", "51", "68", "85", "102", "119", "136", "153", "170", 
    "16", "33", "50", "67", "84", "101", "118", "135", "152", "169", "186"
];
