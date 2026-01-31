const fs = require('fs');
const path = require('path');

// Dynamic store for API files
const apiFilesStore = [
    {
        fullPath: 'D:\\Files\\Education\\projects and else\\project-name-pending\\server\\console\\api\\mongo.js',
        path: `../api/mongo`
    }
];

/**
 * Gets a specific API file from the store by name and imports it
 * @param {string} index - Items index
 * @returns {Object|null} The imported module or null if not found
 */
function useApi(index) {
    const file = apiFilesStore[index];
    if (file && file.path) {
        try {
            global.API = require(file.path)
            return require(file.path);
        } catch (error) {
            console.error(`DB_Handler> Error importing module at index ${index}:`, error);
            return null;
        }
    }
    return null;
}


/**
 * Loads all files from the api folder and stores them with their file paths
 * @returns {Object} The populated store with all API files
 */
function loadApi() {
    const apiFolderPath = path.join(__dirname, '../api');

    try {
        const files = fs.readdirSync(apiFolderPath);

        files.forEach(file => {
            if (file.endsWith('.js')) {
                const filePath = path.join(apiFolderPath, file);
                const relativePath = `../api/${file}`;

                // Check if file already exists in store
                const fileExists = apiFilesStore.some(item => item.fullPath === filePath);

                if (!fileExists) {
                    const fileName = apiFilesStore.length;

                    apiFilesStore[fileName] = {
                        fullPath: filePath,
                        path: relativePath
                    };

                    console.log(`DB_Handler> API File Loaded: ${fileName} -> ./api/${fileName}`);
                } else {
                    console.log(`DB_Handler> API File Already Loaded: ./api/${file}`);
                }
            }
        });

        // Update global store after loading
        return apiFilesStore;
    } catch (error) {
        console.error('DB_Handler> Error loading API files:', error);
        return apiFilesStore;
    }
}

/**
 * Gets a specific API file from the store by name
 * @param {string} fileName - The name of the file (without .js extension)
 * @returns {Object|null} The file info object or null if not found
 */
function getApi(fileName) {
    return apiFilesStore[fileName] || null;
}

/**
 * Gets all stored API files
 * @returns {Object} The entire store
 */
function getAllApi() {
    return apiFilesStore;
}

/**
 * Gets the file path for a specific API file
 * @param {string} fileName - The name of the file (without .js extension)
 * @returns {string|null} The file path or null if not found
 */
function getApiPath(fileName) {
    const file = apiFilesStore[fileName];
    return file ? file.filePath : null;
}

/**
 * Gets all file paths from the store
 * @returns {Array} Array of file paths
 */
function getAllApiPaths() {
    return Object.values(apiFilesStore).map(file => file.filePath);
}

module.exports = {
    loadApi,
    getApi,
    getAllApi,
    getApiPath,
    getAllApiPaths,
    useApi
};
