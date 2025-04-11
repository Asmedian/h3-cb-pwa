'use strict';

// Import DOM elements that are needed for grid functionality
import { dom, borderCells } from './dom-elements.js';

// Constants for default cell positions based on isBank values
const DEFAULT_BANK_TRUE_ATTACKERS = ['57', '61', '90', '93', '96', '125', '129'];
const DEFAULT_BANK_TRUE_DEFENDERS = ['15', '185', '172', '02', '100', '87', '08'];
const DEFAULT_BANK_FALSE_ATTACKERS = ['01', '35', '69', '86', '103', '137', '171'];
const DEFAULT_BANK_FALSE_DEFENDERS = ['15', '49', '83', '100', '117', '151', '185'];
const MAX_GRID_SELECTIONS = 7;

// State variables for grid
let currentGridMode = 'attackers';
const defendersList = [];
const attackersList = [];
let usingDefaultAttackers = true;
let usingDefaultDefenders = true;

// Initialize grid popup
const initGridPopup = (translations) => {
    // Set translated text for the popup
    updateGridTranslations(translations);
    
    // Initialize the toggle state and preview
    if (dom.disabledCellsToggle.checked) {
        dom.blockedPreview.classList.add('styled');
    } else {
        dom.blockedPreview.classList.remove('styled');
    }
};

// Update grid popup translations
const updateGridTranslations = (translations) => {
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
    
    // Check for adjacent occupied cells based on mode
    if (currentGridMode === 'attackers') {
        // Get cell to the right
        const { rightCell } = getAdjacentCells(cellId);
        // Check if the right cell is already an attacker (can't have attackers next to each other horizontally)
        if (rightCell && attackersList.includes(rightCell)) {
            return; // Can't select a cell with an attacker to its right
        }
    } else { // defenders mode
        // Get cell to the left
        const { leftCell } = getAdjacentCells(cellId);
        // Check if the left cell is already a defender (can't have defenders next to each other horizontally)
        if (leftCell && defendersList.includes(leftCell)) {
            return; // Can't select a cell with a defender to its left
        }
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
const updateGridSelectionDisplay = (translations) => {
    const translatedDefault = translations?.default || "Default";
    dom.defendersCells.textContent = usingDefaultDefenders ? 
        translatedDefault : 
        JSON.stringify(defendersList);
    dom.defendersCount.textContent = `${defendersList.length}/${MAX_GRID_SELECTIONS}`;
    
    dom.attackersCells.textContent = usingDefaultAttackers ? 
        translatedDefault : 
        JSON.stringify(attackersList);
    dom.attackersCount.textContent = `${attackersList.length}/${MAX_GRID_SELECTIONS}`;
};

// Switch between defenders and attackers modes
const switchGridMode = (mode, translations) => {
    currentGridMode = mode;
    dom.currentMode.textContent = mode === 'defenders' ? 
        translations?.defenders || 'Defenders' : 
        translations?.attackers || 'Attackers';
    
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
const applyGridSelections = (updateJsonPreview) => {
    dom.attackersInput.value = usingDefaultAttackers ? "Default" : JSON.stringify(attackersList);
    dom.defendersInput.value = usingDefaultDefenders ? "Default" : JSON.stringify(defendersList);
    closeGridPopup();
    updateJsonPreview(); // Update the JSON preview with new values
};

// Open the grid popup
const openGridPopup = (translations) => {
    dom.gridPopup.style.display = 'block';
    
    // Get current isBank value and update UI
    const isBank = dom.isBankSelect.value === 'true';
    updateGridUiBasedOnIsBank(isBank, translations);
    
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
            dom.attackersInput.value === (translations?.default || "Default") || 
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
            dom.defendersInput.value === (translations?.default || "Default") || 
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
        updateGridSelectionDisplay(translations);
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

// Initialize default troop placements
const initializeDefaultTroopPlacements = () => {
    // Initialize with default values
    updateTroopPlacementInputs();
};

// Get default attackers based on isBank value
const getDefaultAttackers = (isBank) => {
    return isBank ? DEFAULT_BANK_TRUE_ATTACKERS : DEFAULT_BANK_FALSE_ATTACKERS;
};

// Get default defenders based on isBank value
const getDefaultDefenders = (isBank) => {
    return isBank ? DEFAULT_BANK_TRUE_DEFENDERS : DEFAULT_BANK_FALSE_DEFENDERS;
};

// Update troop placement input fields with translation
const updateTroopPlacementInputs = (translations = window.appTranslations) => {
    const defaultText = translations?.default || "Default";
    dom.attackersInput.value = usingDefaultAttackers ? defaultText : JSON.stringify(attackersList);
    dom.defendersInput.value = usingDefaultDefenders ? defaultText : JSON.stringify(defendersList);
};

// Update grid UI based on isBank value
const updateGridUiBasedOnIsBank = (isBank, translations) => {
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
        dom.cancelGrid.textContent = translations?.ok || 'Ok';
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
        dom.cancelGrid.textContent = translations?.cancel || 'Cancel';
    }
};

// Toggle disabled cells styling
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

// Add these setter functions to modify the state variables
const setUsingDefaultAttackers = (value) => {
    usingDefaultAttackers = value;
};

const setUsingDefaultDefenders = (value) => {
    usingDefaultDefenders = value;
};

// Clear both attackers and defenders lists
const clearTroopLists = () => {
    attackersList.length = 0;
    defendersList.length = 0;
};

// Reset to defaults based on isBank value
const resetToDefaults = (isBank, translations) => {
    // Set flags to true
    usingDefaultAttackers = true;
    usingDefaultDefenders = true;
    
    // Clear lists
    clearTroopLists();
    
    // Add default values
    attackersList.push(...getDefaultAttackers(isBank));
    defendersList.push(...getDefaultDefenders(isBank));
    
    // Update input fields
    updateTroopPlacementInputs(translations);
};

// Export all grid-related functions and variables
export {
    initGridPopup,
    updateGridTranslations,
    createHexagonalGrid,
    getAdjacentCells,
    updateBlockedCells,
    toggleCellSelection,
    updateGridSelectionDisplay,
    switchGridMode,
    applyGridSelections,
    openGridPopup,
    closeGridPopup,
    refreshCellDisplay,
    initializeDefaultTroopPlacements,
    getDefaultAttackers,
    getDefaultDefenders,
    updateTroopPlacementInputs,
    updateGridUiBasedOnIsBank,
    toggleDisabledCellsStyle,
    defendersList,
    attackersList,
    usingDefaultAttackers,
    usingDefaultDefenders,
    MAX_GRID_SELECTIONS,
    setUsingDefaultAttackers,
    setUsingDefaultDefenders,
    clearTroopLists,
    resetToDefaults
};
