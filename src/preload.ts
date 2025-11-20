import { contextBridge, ipcRenderer } from 'electron';

// Importar explícitamente los tipos desde el archivo de definición
import type {
  IDatabaseInfo,
  ISearchFoodResult,
  INewLogEntryData,
  ILogEntry,
  IFoodDetails,
  INutrientTotals,
  IReportRow,
  IStatisticalReport,
  IDailyIntake,
  IContributionReport,
  // Asumo que IRecipeIngredient estaba implícito o definido en preload.d.ts,
  // si no, asegúrate de importarlo o definirlo.
  IRecipeIngredient 
} from './preload.d';

contextBridge.exposeInMainWorld('electronAPI', {

  // ==========================================
  // 1. GESTIÓN DE BASES DE DATOS (Librerías)
  // ==========================================
  getDatabases: (): Promise<IDatabaseInfo[]> =>
    ipcRenderer.invoke('get-databases'),

  addDatabase: (dbName: string): Promise<string> =>
    ipcRenderer.invoke('add-database', dbName),

  deleteDatabase: (databaseId: number): Promise<string> =>
    ipcRenderer.invoke('delete-database', databaseId),

  importExcel: (databaseId: number): Promise<string> =>
    ipcRenderer.invoke('import-excel', databaseId),

  importCSV: (databaseId: number): Promise<string> =>
    ipcRenderer.invoke('import-csv', databaseId),

  // ==========================================
  // 2. GESTIÓN DE ALIMENTOS
  // ==========================================
  getFoods: (): Promise<{ FoodID: number; Name: string; DatabaseName: string }[]> =>
    ipcRenderer.invoke('get-foods'),

  addFood: (foodName: string, databaseId: number): Promise<string> =>
    ipcRenderer.invoke('add-food', foodName, databaseId),

  getFoodDetails: (foodId: number): Promise<IFoodDetails | null> =>
    ipcRenderer.invoke('get-food-details', foodId),

  updateFoodDetails: (foodData: IFoodDetails): Promise<string> =>
    ipcRenderer.invoke('update-food-details', foodData),

  deleteFood: (foodId: number): Promise<string> =>
    ipcRenderer.invoke('delete-food', foodId),

  purgeFoodLibrary: (databaseId: number): Promise<string> =>
    ipcRenderer.invoke('purge-food-library', databaseId),

  getRecipeIngredients: (foodId: number): Promise<IRecipeIngredient[]> =>
    ipcRenderer.invoke('get-recipe-ingredients', foodId),

  searchFoods: (searchTerm: string, referenceDbId: number): Promise<ISearchFoodResult[]> =>
    ipcRenderer.invoke('search-foods', searchTerm, referenceDbId),

  searchAllFoods: (searchTerm: string): Promise<ISearchFoodResult[]> =>
    ipcRenderer.invoke('search-all-foods', searchTerm),

  // ==========================================
  // 3. GESTIÓN DE SUJETOS (Pacientes/Usuarios)
  // ==========================================
  getSubjects: () => 
    ipcRenderer.invoke('get-subjects'),

  getSubjectById: (userId: string) => 
    ipcRenderer.invoke('get-subject-by-id', userId),

  saveSubject: (data: any) => 
    ipcRenderer.invoke('save-subject', data),

  deleteSubject: (userId: string) => 
    ipcRenderer.invoke('delete-subject', userId),

  getSubjectHistory: (userId: string) => 
    ipcRenderer.invoke('get-subject-history', userId),

  updateMeasurement: (id: number, weight: number, height: number) => 
    ipcRenderer.invoke('update-measurement', id, weight, height),

  deleteMeasurement: (measurementId: number) => 
    ipcRenderer.invoke('delete-measurement', measurementId),

  getUniqueUserIds: (): Promise<string[]> =>
    ipcRenderer.invoke('get-unique-user-ids'),

  // ==========================================
  // 4. GESTIÓN DE LOGS DE CONSUMO
  // ==========================================
  getLogEntries: (userId: string, date: string): Promise<ILogEntry[]> =>
    ipcRenderer.invoke('get-log-entries', userId, date),

  getAllLogs: (): Promise<ILogEntry[]> =>
    ipcRenderer.invoke('get-all-logs'),

  addLogEntry: (logData: INewLogEntryData): Promise<string> =>
    ipcRenderer.invoke('add-log-entry', logData),

  editLogEntry: (logId: number, newGrams: number): Promise<string> =>
    ipcRenderer.invoke('edit-log-entry', logId, newGrams),

  deleteLogEntry: (logId: number): Promise<string> =>
    ipcRenderer.invoke('delete-log-entry', logId),

  deleteLogsForUser: (userId: string): Promise<string> =>
    ipcRenderer.invoke('delete-logs-for-user', userId),

  deleteAllLogs: (): Promise<string> =>
    ipcRenderer.invoke('delete-all-logs'),

  importConsumptionLog: (): Promise<{ message: string, firstEntry?: { userId: string, date: string } }> =>
    ipcRenderer.invoke('import-consumption-log'),

  importConsumptionLogCsv: (): Promise<{ message: string, firstEntry?: { userId: string, date: string } }> =>
    ipcRenderer.invoke('import-consumption-log-csv'),

  // ==========================================
  // 5. PERFILES RDI (Requerimientos)
  // ==========================================
  getRdiProfiles: () => 
    ipcRenderer.invoke('get-rdi-profiles'),

  createRdiProfile: (name: string) => 
    ipcRenderer.invoke('create-rdi-profile', name),

  deleteRdiProfile: (profileId: number) => 
    ipcRenderer.invoke('delete-rdi-profile', profileId),

  importRdiExcel: (profileId: number) => 
    ipcRenderer.invoke('import-rdi-excel', profileId),

  // ==========================================
  // 6. CÁLCULOS Y REPORTES
  // ==========================================
  calculateIntake: (
    userId: string,
    startDate: string,
    endDate: string,
    referenceDbId: number
  ): Promise<INutrientTotals> =>
    ipcRenderer.invoke('calculate-intake', userId, startDate, endDate, referenceDbId),

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
  ) => 
    ipcRenderer.invoke('get-adequacy-report', userId, startDate, endDate, referenceDbId, profileId),

  exportReport: (
    reportTitle: string,
    data: IReportRow[],
    format: 'csv' | 'xlsx'
  ): Promise<string> =>
    ipcRenderer.invoke('export-report', reportTitle, data, format),

  // ==========================================
  // 7. SISTEMA Y DIÁLOGOS UI
  // ==========================================
  showConfirmDialog: (options: Electron.MessageBoxOptions): Promise<Electron.MessageBoxReturnValue> =>
    ipcRenderer.invoke('show-confirm-dialog', options),

  showErrorDialog: (title: string, content: string): Promise<Electron.MessageBoxReturnValue> =>
    ipcRenderer.invoke('show-error-dialog', title, content),

  showInfoDialog: (title: string, content: string): Promise<Electron.MessageBoxReturnValue> =>
    ipcRenderer.invoke('show-info-dialog', title, content),
});