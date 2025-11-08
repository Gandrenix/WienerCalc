"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // --- Library Management (v0.2) ---
    addFood: (foodName, databaseId) => electron_1.ipcRenderer.invoke('add-food', foodName, databaseId),
    getFoods: () => electron_1.ipcRenderer.invoke('get-foods'),
    getFoodDetails: (foodId) => electron_1.ipcRenderer.invoke('get-food-details', foodId),
    updateFoodDetails: (foodData) => electron_1.ipcRenderer.invoke('update-food-details', foodData),
    deleteFood: (foodId) => electron_1.ipcRenderer.invoke('delete-food', foodId),
    importExcel: (databaseId) => // Import food library
     electron_1.ipcRenderer.invoke('import-excel', databaseId),
    importCSV: (databaseId) => electron_1.ipcRenderer.invoke('import-csv', databaseId),
    getDatabases: () => electron_1.ipcRenderer.invoke('get-databases'),
    addDatabase: (dbName) => electron_1.ipcRenderer.invoke('add-database', dbName),
    deleteDatabase: (databaseId) => electron_1.ipcRenderer.invoke('delete-database', databaseId),
    // --- Consumption Log Management (v0.2) ---
    searchFoods: (searchTerm, referenceDbId) => electron_1.ipcRenderer.invoke('search-foods', searchTerm, referenceDbId),
    addLogEntry: (logData) => electron_1.ipcRenderer.invoke('add-log-entry', logData),
    getLogEntries: (userId, date) => electron_1.ipcRenderer.invoke('get-log-entries', userId, date),
    deleteLogEntry: (logId) => electron_1.ipcRenderer.invoke('delete-log-entry', logId),
    editLogEntry: (logId, newGrams) => electron_1.ipcRenderer.invoke('edit-log-entry', logId, newGrams),
    importConsumptionLog: () => // Import consumption log (Excel)
     electron_1.ipcRenderer.invoke('import-consumption-log'),
    // *** ESTA ES LA LÍNEA QUE FALTABA ***
    importConsumptionLogCsv: () => electron_1.ipcRenderer.invoke('import-consumption-log-csv'),
    getUniqueUserIds: () => electron_1.ipcRenderer.invoke('get-unique-user-ids'),
    // --- Calculation Function (v0.2) ---
    calculateIntake: (userId, startDate, endDate, referenceDbId) => electron_1.ipcRenderer.invoke('calculate-intake', userId, startDate, endDate, referenceDbId),
    // Exportar Reporte (v0.2)
    exportReport: (reportTitle, data, format) => electron_1.ipcRenderer.invoke('export-report', reportTitle, data, format),
    // --- Funciones de Análisis (v0.3) ---
    getStatisticalReport: (userIds, startDate, endDate, referenceDbId, nutrient) => electron_1.ipcRenderer.invoke('get-statistical-report', userIds, startDate, endDate, referenceDbId, nutrient),
    getDailyIntakeOverTime: (userId, startDate, endDate, referenceDbId, nutrient) => electron_1.ipcRenderer.invoke('get-daily-intake-over-time', userId, startDate, endDate, referenceDbId, nutrient),
    getNutrientContribution: (userId, startDate, endDate, referenceDbId, nutrient) => electron_1.ipcRenderer.invoke('get-nutrient-contribution', userId, startDate, endDate, referenceDbId, nutrient),
    getMealContribution: (userId, startDate, endDate, referenceDbId, nutrient) => electron_1.ipcRenderer.invoke('get-meal-contribution', userId, startDate, endDate, referenceDbId, nutrient),
    // --- Diálogos Asíncronos (v0.2) ---
    showConfirmDialog: (options) => electron_1.ipcRenderer.invoke('show-confirm-dialog', options),
    showErrorDialog: (title, content) => electron_1.ipcRenderer.invoke('show-error-dialog', title, content),
    showInfoDialog: (title, content) => electron_1.ipcRenderer.invoke('show-info-dialog', title, content),
});
