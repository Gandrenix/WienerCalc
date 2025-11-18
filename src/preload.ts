import { contextBridge, ipcRenderer } from 'electron';

// Importar explícitamente los tipos desde el archivo de definición
import type {
    IDatabaseInfo, ISearchFoodResult, INewLogEntryData, ILogEntry, IFoodDetails,
    INutrientTotals,
    IReportRow,
    // Importar tipos de reportes v0.3
    IStatisticalReport,
    IDailyIntake,
    IContributionReport
} from './preload.d'; // Apuntar explícitamente al archivo .d.ts

contextBridge.exposeInMainWorld('electronAPI', {
  // --- Library Management (v0.2) ---
  addFood: (foodName: string, databaseId: number): Promise<string> =>
    ipcRenderer.invoke('add-food', foodName, databaseId),

  getFoods: (): Promise<{ FoodID: number; Name: string; DatabaseName: string }[]> =>
    ipcRenderer.invoke('get-foods'),

  getFoodDetails: (foodId: number): Promise<IFoodDetails | null> =>
    ipcRenderer.invoke('get-food-details', foodId),

getRecipeIngredients: (foodId: number): Promise<IRecipeIngredient[]> =>
    ipcRenderer.invoke('get-recipe-ingredients', foodId),
  
  updateFoodDetails: (foodData: IFoodDetails): Promise<string> =>
    ipcRenderer.invoke('update-food-details', foodData),

  deleteFood: (foodId: number): Promise<string> =>
    ipcRenderer.invoke('delete-food', foodId),

  importExcel: (databaseId: number): Promise<string> => // Import food library
    ipcRenderer.invoke('import-excel', databaseId),

  importCSV: (databaseId: number): Promise<string> =>
    ipcRenderer.invoke('import-csv', databaseId),

  getDatabases: (): Promise<IDatabaseInfo[]> =>
    ipcRenderer.invoke('get-databases'),

  addDatabase: (dbName: string): Promise<string> =>
    ipcRenderer.invoke('add-database', dbName),

  deleteDatabase: (databaseId: number): Promise<string> => // <-- Esta es la línea existente [cite: 5051]
    ipcRenderer.invoke('delete-database', databaseId),

  // *** NUEVA LÍNEA 1 ***
  // Añadida para la función de purgar alimentos de una biblioteca
  purgeFoodLibrary: (databaseId: number): Promise<string> =>
    ipcRenderer.invoke('purge-food-library', databaseId),

  // --- Consumption Log Management ---
  searchFoods: (searchTerm: string, referenceDbId: number): Promise<ISearchFoodResult[]> =>
    ipcRenderer.invoke('search-foods', searchTerm, referenceDbId),

  searchAllFoods: (searchTerm: string): Promise<ISearchFoodResult[]> =>
    ipcRenderer.invoke('search-all-foods', searchTerm),

  addLogEntry: (logData: INewLogEntryData): Promise<string> =>
    ipcRenderer.invoke('add-log-entry', logData),

  getLogEntries: (userId: string, date: string): Promise<ILogEntry[]> =>
    ipcRenderer.invoke('get-log-entries', userId, date),

  deleteLogEntry: (logId: number): Promise<string> =>
    ipcRenderer.invoke('delete-log-entry', logId),

  editLogEntry: (logId: number, newGrams: number): Promise<string> =>
    ipcRenderer.invoke('edit-log-entry', logId, newGrams),

  importConsumptionLog: (): Promise<{ message: string, firstEntry?: { userId: string, date: string } }> => // Import consumption log (Excel)
    ipcRenderer.invoke('import-consumption-log'),
  
  // *** NUEVO: Importar Log desde CSV ***
  importConsumptionLogCsv: (): Promise<{ message: string, firstEntry?: { userId: string, date: string } }> => // [cite: 5053]
    ipcRenderer.invoke('import-consumption-log-csv'),

  getUniqueUserIds: (): Promise<string[]> => // <-- Esta es la línea existente [cite: 5053]
    ipcRenderer.invoke('get-unique-user-ids'),

  // *** NUEVA LÍNEA 2 ***
  // Añadida para borrar todos los logs de UN usuario
  deleteLogsForUser: (userId: string): Promise<string> =>
    ipcRenderer.invoke('delete-logs-for-user', userId),

  // *** NUEVA LÍNEA 3 ***
  // Añadida para borrar TODOS los logs de la base de datos
  deleteAllLogs: (): Promise<string> =>
    ipcRenderer.invoke('delete-all-logs'),

getAllLogs: (): Promise<ILogEntry[]> =>
    ipcRenderer.invoke('get-all-logs'),





  // --- Calculation Function (v0.2) ---
  calculateIntake: (
    userId: string,
    startDate: string,
    endDate: string,
    referenceDbId: number
  ): Promise<INutrientTotals> =>
    ipcRenderer.invoke('calculate-intake', userId, startDate, endDate, referenceDbId),

  // Exportar Reporte (v0.2)
  exportReport: (
    reportTitle: string,
    data: IReportRow[],
    format: 'csv' | 'xlsx'
  ): Promise<string> =>
    ipcRenderer.invoke('export-report', reportTitle, data, format),

  // --- Funciones de Análisis (v0.3) ---
  getStatisticalReport: (
    userIds: string[], 
    startDate: string, 
    endDate: string, 
    referenceDbId: number, 
    nutrient: string
  ): Promise<IStatisticalReport> =>
    ipcRenderer.invoke('get-statistical-report', userIds, startDate, endDate, referenceDbId, nutrient),

  getDailyIntakeOverTime: (
    userId: string, 
    startDate: string, 
    endDate: string, 
    referenceDbId: number, 
    nutrient: string
  ): Promise<IDailyIntake[]> =>
    ipcRenderer.invoke('get-daily-intake-over-time', userId, startDate, endDate, referenceDbId, nutrient),
  
  getNutrientContribution: (
    userId: string, 
    startDate: string, 
    endDate: string, 
    referenceDbId: number, 
    nutrient: string
  ): Promise<IContributionReport[]> =>
    ipcRenderer.invoke('get-nutrient-contribution', userId, startDate, endDate, referenceDbId, nutrient),

  getMealContribution: (
    userId: string, 
    startDate: string, 
    endDate: string, 
    referenceDbId: number, 
    nutrient: string
  ): Promise<IContributionReport[]> =>
    ipcRenderer.invoke('get-meal-contribution', userId, startDate, endDate, referenceDbId, nutrient),

    
   getAdequacyReport: (
    userId: string, 
    startDate: string, 
    endDate: string, 
    referenceDbId: number, 
    profileId?: number
) => ipcRenderer.invoke('get-adequacy-report', userId, startDate, endDate, referenceDbId, profileId),

   
   




  // --- Diálogos Asíncronos (v0.2) ---
  showConfirmDialog: (options: Electron.MessageBoxOptions): Promise<Electron.MessageBoxReturnValue> =>
    ipcRenderer.invoke('show-confirm-dialog', options),
    
  showErrorDialog: (title: string, content: string): Promise<Electron.MessageBoxReturnValue> =>
    ipcRenderer.invoke('show-error-dialog', title, content),

  showInfoDialog: (title: string, content: string): Promise<Electron.MessageBoxReturnValue> =>
    ipcRenderer.invoke('show-info-dialog', title, content),

   // ...
    getRdiProfiles: () => ipcRenderer.invoke('get-rdi-profiles'),
    
    // CORRECCIÓN: Añadido el tipo ': string'
    createRdiProfile: (name: string) => ipcRenderer.invoke('create-rdi-profile', name),
    
    // CORRECCIÓN: Añadido el tipo ': number'
    importRdiExcel: (profileId: number) => ipcRenderer.invoke('import-rdi-excel', profileId),
    // ...


  
});