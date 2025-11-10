// --- src/preload.d.ts ---

// Interface for basic database info
export interface IDatabaseInfo {
  DatabaseID: number;
  DatabaseName: string;
}

// Interface for food search results (simplified)
export interface ISearchFoodResult {
  FoodID: number;
  Name: string;
}

// Interface for a complete log entry (data received FROM main process)
export interface ILogEntry {
  LogID: number;
  UserID: string;
  ConsumptionDate: string; // YYYY-MM-DD
  MealType?: string; // Optional (will be undefined if null in DB)
  FoodID: number;
  FoodName: string; // Joined from Foods table
  ReferenceDatabaseID: number;
  ReferenceDatabaseName: string; // Joined from FoodDatabases table
  Grams: number;
  Timestamp: string; // ISO format string
}

// Interface for data sent TO main process when adding a new log entry
export interface INewLogEntryData {
  userId: string;
  consumptionDate: string; // YYYY-MM-DD
  mealType?: string; // Optional
  foodId: number;
  referenceDatabaseId: number;
  grams: number;
}

// Interface for FULL food details (sent TO main process for updating)
// *** ACTUALIZADA CON CAMPOS DE "TABLA PAISA" ***
export interface IFoodDetails {
  FoodID: number; // Required to identify which food to update
  Name: string; // Required new name
  // Macros & Energía
  Energy_kcal?: number | null;
  Water_g?: number | null;
  Protein_g?: number | null;
  Fat_g?: number | null; // Grasa Total
  Carbohydrate_g?: number | null;
  // Sub-componentes de Grasa
  SaturatedFat_g?: number | null;
  MonounsaturatedFat_g?: number | null;
  PolyunsaturatedFat_g?: number | null;
  Cholesterol_mg?: number | null;
  // Sub-componentes de Carbohidratos
  Fiber_g?: number | null;
  Sugar_g?: number | null;
  // Minerales
  Ash_g?: number | null;
  Calcium_mg?: number | null;
  Phosphorus_mg?: number | null;
  Iron_mg?: number | null;
  Sodium_mg?: number | null;
  Potassium_mg?: number | null;
  Magnesium_mg?: number | null;
  Zinc_mg?: number | null;
  Copper_mg?: number | null;
  Manganese_mg?: number | null;
  // Vitaminas
  VitaminA_ER?: number | null;
  Thiamin_mg?: number | null;
  Riboflavin_mg?: number | null;
  Niacin_mg?: number | null;
  PantothenicAcid_mg?: number | null;
  VitaminB6_mg?: number | null;
  Folate_mcg?: number | null;
  VitaminB12_mcg?: number | null;
  VitaminC_mg?: number | null;
}

// Interface for Nutrient Totals Result (data received FROM main process)
// *** ACTUALIZADA CON CAMPOS DE "TABLA PAISA" ***
export interface INutrientTotals {
  [key: string]: number; // Permite acceso dinámico
  totalEnergy_kcal: number;
  totalWater_g: number;
  totalProtein_g: number;
  totalFat_g: number;
  totalCarbohydrate_g: number;
  totalSaturatedFat_g: number;
  totalMonounsaturatedFat_g: number;
  totalPolyunsaturatedFat_g: number;
  totalCholesterol_mg: number;
  totalFiber_g: number;
  totalSugar_g: number;
  totalAsh_g: number;
  totalCalcium_mg: number;
  totalPhosphorus_mg: number;
  totalIron_mg: number;
  totalSodium_mg: number;
  totalPotassium_mg: number;
  totalMagnesium_mg: number;
  totalZinc_mg: number;
  totalCopper_mg: number;
  totalManganese_mg: number;
  totalVitaminA_ER: number;
  totalThiamin_mg: number;
  totalRiboflavin_mg: number;
  totalNiacin_mg: number;
  totalPantothenicAcid_mg: number;
  totalVitaminB6_mg: number;
  totalFolate_mcg: number;
  totalVitaminB12_mcg: number;
  totalVitaminC_mg: number;
}

// *** Interfaz para los datos del reporte formateados ***
export interface IReportRow {
  nutrient: string; // ej. "Energy Kcal"
  value: string;    // ej. "106.80"
  unit: string;     // ej. "kcal"
}

// *** NUEVO: Interfaces para Análisis Estadístico (v0.3) ***
export interface IStatisticalReport {
    count: number;
    mean: number;
    median: number;
    stdDev: number;
    variance: number;
    min: number;
    max: number;
    q1: number; // Percentil 25 (para IQR y Box Plot)
    q3: number; // Percentil 75 (para IQR y Box Plot)
    rawData: number[]; // Para el Histograma
}

export interface IContributionReport {
    name: string;
    value: number;
}

export interface IDailyIntake {
    date: string;
    value: number;
}


// --- Define the API exposed by preload.ts ---
export interface IElectronAPI {
  // Library Management
  addFood: (foodName: string, databaseId: number) => Promise<string>;
  getFoods: () => Promise<{ FoodID: number; Name: string; DatabaseName: string }[]>;
  getFoodDetails: (foodId: number) => Promise<IFoodDetails | null>;
  updateFoodDetails: (foodData: IFoodDetails) => Promise<string>;
  deleteFood: (foodId: number) => Promise<string>;
  importExcel: (databaseId: number) => Promise<string>;
  importCSV: (databaseId: number) => Promise<string>;
  getDatabases: () => Promise<IDatabaseInfo[]>;
  addDatabase: (dbName: string) => Promise<string>;
  deleteDatabase: (databaseId: number) => Promise<string>;
  purgeFoodLibrary: (databaseId: number) => Promise<string>;
  deleteLogsForUser: (userId: string) => Promise<string>;
  deleteAllLogs: () => Promise<string>;
  
  // Consumption Log
  searchFoods: (searchTerm: string, referenceDbId: number) => Promise<ISearchFoodResult[]>;
  addLogEntry: (logData: INewLogEntryData) => Promise<string>;
  getLogEntries: (userId: string, date: string) => Promise<ILogEntry[]>;
  deleteLogEntry: (logId: number) => Promise<string>;
  editLogEntry: (logId: number, newGrams: number) => Promise<string>;
  importConsumptionLog: () => Promise<{ message: string, firstEntry?: { userId: string, date: string } }>;
  
  // *** NUEVO: Importar Log desde CSV ***
  importConsumptionLogCsv: () => Promise<{ message: string, firstEntry?: { userId: string, date: string } }>;
  
  getUniqueUserIds: () => Promise<string[]>;

  deleteLogsForUser: (userId: string) => Promise<string>;
  deleteAllLogs: () => Promise<string>;

  // Calculation Function (v0.2)
  calculateIntake: (
    userId: string,
    startDate: string,
    endDate: string,
    referenceDbId: number
  ) => Promise<INutrientTotals>;

  // Exportar Reporte (v0.2)
  exportReport: (
    reportTitle: string,
    data: IReportRow[],
    format: 'csv' | 'xlsx'
  ) => Promise<string>;

  // Análisis (v0.3)
  getStatisticalReport: (
    userIds: string[], 
    startDate: string, 
    endDate: string, 
    referenceDbId: number, 
    nutrient: string
  ) => Promise<IStatisticalReport>;

  getDailyIntakeOverTime: (
    userId: string, 
    startDate: string, 
    endDate: string, 
    referenceDbId: number, 
    nutrient: string
  ) => Promise<IDailyIntake[]>;
  
  getNutrientContribution: (
    userId: string, 
    startDate: string, 
    endDate: string, 
    referenceDbId: number, 
    nutrient: string
  ) => Promise<IContributionReport[]>;

  getMealContribution: (
    userId: string, 
    startDate: string, 
    endDate: string, 
    referenceDbId: number, 
    nutrient: string
  ) => Promise<IContributionReport[]>;

  // Firmas para Diálogos Asíncronos
  showConfirmDialog: (options: Electron.MessageBoxOptions) => Promise<Electron.MessageBoxReturnValue>;
  showErrorDialog: (title: string, content: string) => Promise<Electron.MessageBoxReturnValue>;
  showInfoDialog: (title: string, content: string) => Promise<Electron.MessageBoxReturnValue>;
}


// --- Extend the Window interface ---
// Augment the global Window interface
declare global {
    interface Window {
        electronAPI: IElectronAPI;
    }
}