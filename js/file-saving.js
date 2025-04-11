'use strict';

/**
 * Save the current form data as a JSON file
 * @param {Object} dom - DOM references
 * @param {Function} buildJsonObject - Function to build the JSON object
 * @param {Function} validateRequiredFields - Function to validate required fields
 * @param {Object} state - Application state
 */
export const saveFile = (dom, buildJsonObject, validateRequiredFields, state) => {
    if (!validateRequiredFields(dom)) {
        console.warn("Validation failed. Cannot save.");
        // Optionally show a user message
        return;
    }

    try {
        const jsonObj = buildJsonObject(dom, state);
        const indentSize = state.indentSize || 2; // Use indent size from state or default to 2
        const jsonString = JSON.stringify(jsonObj, null, indentSize);
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });

        // Generate a better filename based on content
        let filename;
        if (state.objectsList && state.objectsList.length > 1) {
            // If there are multiple objects, use a name indicating multiple objects
            filename = `creature_bank_collection_${state.objectsList.length}_objects.json`;
        } else {
            // Otherwise use the original naming convention with current subtype
            const subtypeValue = dom.objectSubtypeInput.value || 'default';
            filename = `creature_bank_type16_subtype${subtypeValue}.json`;
        }

        // Use File System Access API if available (preferred)
        if ('showSaveFilePicker' in window) {
            showSaveFilePicker({
                suggestedName: filename,
                types: [{
                    description: 'JSON Files',
                    accept: { 'application/json': ['.json'] },
                }],
            }).then(async (fileHandle) => {
                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();
            }).catch(err => {
                // Handle errors, including user cancellation (AbortError)
                if (err.name !== 'AbortError') {
                    console.error('Error saving file with File System Access API:', err);
                    // Fallback to legacy method if specific errors occur?
                    saveFileLegacy(blob, filename);
                }
            });
        } else {
            // Fallback to legacy <a> tag download method
            saveFileLegacy(blob, filename);
        }

    } catch (error) {
        console.error("Error preparing file for saving:", error);
        // Optionally show a user message
    }
};

/**
 * Legacy file saving method using anchor tag download
 * @param {Blob} blob - The file blob to save
 * @param {string} filename - The filename to use
 */
export const saveFileLegacy = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Clean up
};
