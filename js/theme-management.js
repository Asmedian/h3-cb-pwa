'use strict';

// Import localization functionality to get translations
import { getTranslations } from './localization.js';

// State variables
let isDarkTheme = true;

// --- Theme Management ---
/**
 * Applies the specified theme to the application
 * @param {string} theme - 'dark' or 'light'
 * @param {Object} dom - DOM elements object containing themeToggleButton
 */
const applyTheme = (theme, dom) => {
    isDarkTheme = theme === 'dark';
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update theme-color meta tags
    document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]').content = isDarkTheme ? '#1f2937' : '#f3f4f6';
    document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: light)"]').content = isDarkTheme ? '#1f2937' : '#f3f4f6';
    
    // Update manifest theme color
    updateManifestThemeColor();
    
    // Update button text (requires translations to be loaded)
    const translations = getTranslations();
    if (translations && translations.darkTheme && translations.lightTheme) {
        dom.themeToggleButton.textContent = isDarkTheme ? translations.darkTheme : translations.lightTheme;
    }
};

/**
 * Toggles between light and dark themes
 * @param {Object} dom - DOM elements object
 */
const toggleTheme = (dom) => {
    applyTheme(isDarkTheme ? 'light' : 'dark', dom);
};

/**
 * Loads the user's theme preference from localStorage or system preference
 * @param {Object} dom - DOM elements object
 */
const loadThemePreference = (dom) => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Use saved theme, or OS preference, or default to dark
    applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'), dom);
    // ApplyTheme already sets isDarkTheme correctly
};

/**
 * Updates the theme color in the manifest.json file
 */
const updateManifestThemeColor = async () => {
    try {
        // Try to fetch the manifest file
        const manifestResponse = await fetch('./manifest.json');
        if (!manifestResponse.ok) {
            console.warn('Could not fetch manifest.json for theme update');
            return;
        }
        
        const manifest = await manifestResponse.json();
        
        // Update theme color in manifest (this won't actually modify the file,
        // but it's good to have this function for when server-side updates are implemented)
        manifest.theme_color = isDarkTheme ? "#1f2937" : "#f3f4f6";
        
        // Log that we would update the manifest (in a real implementation)
        // console.log('Manifest theme color would be updated to:', manifest.theme_color);
        
    } catch (error) {
        console.error('Error updating manifest theme color:', error);
    }
};

/**
 * Returns the current theme state (dark or light)
 * @returns {boolean} True if dark theme is active, false otherwise
 */
const getThemeState = () => isDarkTheme;

// Export the public API
export {
    applyTheme,
    toggleTheme,
    loadThemePreference,
    updateManifestThemeColor,
    getThemeState
};
