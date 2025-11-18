import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
// Correct import for typing Database instance
import sqlite3, { Database } from 'sqlite3';
import * as ExcelJS from 'exceljs';
import { parse } from 'csv-parse';

// *** NUEVO: Importar 'simple-statistics' ***
// (Usamos '*' porque no tiene un export default)
import * as ss from 'simple-statistics';

// --- TYPE DEFINITIONS ---
interface IDatabaseInfo {
  DatabaseID: number;
  DatabaseName: string;
}

interface ISearchFoodResult {
  FoodID: number;
  Name: string;
  FoodType: 'simple' | 'recipe';
  RecipeYieldGrams: number | null;
}

interface INewLogEntryData {
  userId: string;
  consumptionDate: string;
  mealType?: string;
  foodId: number;
  referenceDatabaseId: number;
  grams: number;
}

interface ILogEntry {
  LogID: number;
  UserID: string;
  ConsumptionDate: string;
  MealType?: string | null;
  FoodID: number;
  FoodName: string; // From JOIN
  ReferenceDatabaseID: number;
  ReferenceDatabaseName: string; // From JOIN
  Grams: number;
  Timestamp: string;
}

interface IRecipeIngredient {
  foodId: number;
  grams: number;
  name?: string; // 'name' es opcional. El backend lo AÑADE al leer
}



// Interface for FULL food details (including nutrients)

interface IFoodDetails {
  FoodID: number;
  DatabaseID?: number; // Usualmente fijo durante update
  Name: string;
  FoodType?: 'simple' | 'recipe';
  
  // *** ESTA ES LA LÍNEA QUE AÑADIMOS ***
  Ingredients?: IRecipeIngredient[];


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

// Interface for Nutrient Totals Result (Module 3)
interface INutrientTotals {
  [key: string]: number;
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

// Interfaz para los datos del reporte formateados
interface ExportDataRow {
  nutrient: string;
  value: number | string;
  unit: string;
}

// *** NUEVO: Interfaces para Análisis Estadístico (v0.3) ***
interface IStatisticalReport {
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

interface IContributionReport {
    name: string;
    value: number;
}

interface IDailyIntake {
    date: string;
    value: number;
}


// --- DATABASE SETUP ---
const dbFolderPath = path.join(app.getPath('userData'), 'database');
const dbPath = path.join(dbFolderPath, 'foodcalc.db');

// En src/main.ts

// --- Initialize Database ---
function initializeDatabase(): Promise<void> { // <-- MODIFICADO: Devuelve Promise<void>
  
  // Envolvemos todo en una Promesa
  return new Promise((resolve, reject) => { 
    
    if (!fs.existsSync(dbFolderPath)) {
      fs.mkdirSync(dbFolderPath, { recursive: true });
      console.log('Created database directory:', dbFolderPath);
    }

    const db: Database = new (sqlite3.verbose().Database)(dbPath, (err: Error | null) => {
      if (err) {
        console.error('Error opening database', err.message);
        return reject(err); // <-- Rechaza la promesa si falla la conexión
      }
      console.log('Database connected successfully at', dbPath);
    });

    db.run('PRAGMA foreign_keys = ON;', (err: Error | null) => {
      if (err) {
        console.error("Could not enable foreign keys:", err.message);
        return reject(err); // <-- Rechaza la promesa
      }
      console.log("Foreign key support enabled.");
    });

    db.serialize(() => {
      // 1. Create FoodDatabases table
      const createDbTableQuery = `
        CREATE TABLE IF NOT EXISTS FoodDatabases (
          DatabaseID INTEGER PRIMARY KEY AUTOINCREMENT,
          DatabaseName TEXT NOT NULL UNIQUE
        );
      `;
      db.run(createDbTableQuery, (err: Error | null) => {
        if (err) {
          console.error('Error creating FoodDatabases table', err.message);
          return reject(err); // <-- Rechaza la promesa
        }
        console.log('Table "FoodDatabases" is ready.');

        // Insert default DB
        db.run(`INSERT OR IGNORE INTO FoodDatabases (DatabaseName) VALUES (?)`, ['Default'], (insertErr: Error | null) => {
          if (insertErr) {
            console.error('Error inserting default database:', insertErr.message);
            return reject(insertErr); // <-- Rechaza la promesa
          }
          console.log('Checked/Inserted "Default" database.');

          // 2. Create Foods table
          const createFoodsTableQuery = `
            CREATE TABLE IF NOT EXISTS Foods (
              FoodID INTEGER PRIMARY KEY AUTOINCREMENT,
              DatabaseID INTEGER NOT NULL,
              Name TEXT NOT NULL,
              Energy_kcal REAL, Water_g REAL, Protein_g REAL, Fat_g REAL, Carbohydrate_g REAL,
              SaturatedFat_g REAL, MonounsaturatedFat_g REAL, PolyunsaturatedFat_g REAL, Cholesterol_mg REAL,
              Fiber_g REAL, Sugar_g REAL, Ash_g REAL, Calcium_mg REAL, Phosphorus_mg REAL, Iron_mg REAL,
              Sodium_mg REAL, Potassium_mg REAL, Magnesium_mg REAL, Zinc_mg REAL, Copper_mg REAL,
              Manganese_mg REAL, VitaminA_ER REAL, Thiamin_mg REAL, Riboflavin_mg REAL, Niacin_mg REAL,
              PantothenicAcid_mg REAL, VitaminB6_mg REAL, Folate_mcg REAL, VitaminB12_mcg REAL, VitaminC_mg REAL,
              FoodType TEXT NOT NULL DEFAULT 'simple',
              RecipeYieldGrams REAL DEFAULT NULL,
              FOREIGN KEY (DatabaseID) REFERENCES FoodDatabases(DatabaseID) ON DELETE CASCADE,
              UNIQUE(DatabaseID, Name)
            );
          `;
          db.run(createFoodsTableQuery, (foodsErr: Error | null) => {
            if (foodsErr) {
              console.error('Error creating Foods table', foodsErr.message);
              return reject(foodsErr); // <-- Rechaza la promesa
            }
            console.log('Table "Foods" is ready (with FoodType column).');

            // 3. Create RecipeIngredients Table
            const createRecipeTableQuery = `
              CREATE TABLE IF NOT EXISTS RecipeIngredients (
                RecipeIngredientID INTEGER PRIMARY KEY AUTOINCREMENT,
                ParentFoodID INTEGER NOT NULL,
                IngredientFoodID INTEGER NOT NULL,
                IngredientGrams REAL NOT NULL,
                FOREIGN KEY (ParentFoodID) REFERENCES Foods(FoodID) ON DELETE CASCADE,
                FOREIGN KEY (IngredientFoodID) REFERENCES Foods(FoodID) ON DELETE CASCADE
              );
            `;
            db.run(createRecipeTableQuery, (recipeTableErr: Error | null) => {
              if (recipeTableErr) { 
                console.error('Error creating RecipeIngredients table', recipeTableErr.message);
                return reject(recipeTableErr); // <-- Rechaza la promesa
              }
              console.log('Table "RecipeIngredients" is ready.');

              // 4. Create ConsumptionLog Table
              const createLogTableQuery = `
                CREATE TABLE IF NOT EXISTS ConsumptionLog (
                  LogID INTEGER PRIMARY KEY AUTOINCREMENT,
                  UserID TEXT NOT NULL,
                  ConsumptionDate TEXT NOT NULL,
                  MealType TEXT,
                  FoodID INTEGER NOT NULL,
                  ReferenceDatabaseID INTEGER NOT NULL,
                  Grams REAL NOT NULL,
                  Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (FoodID) REFERENCES Foods(FoodID) ON DELETE CASCADE,
                  FOREIGN KEY (ReferenceDatabaseID) REFERENCES FoodDatabases(DatabaseID) ON DELETE CASCADE
                );
              `;
              db.run(createLogTableQuery, (logTableErr: Error | null) => {
                if (logTableErr) { 
                  console.error('Error creating ConsumptionLog table', logTableErr.message);
                  return reject(logTableErr); // <-- Rechaza la promesa
                }
                console.log('Table "ConsumptionLog" is ready.');



// 5. Create RDIProfiles Table (v0.5 - Arquitectura Flexible)
        const createRdiProfilesQuery = `
          CREATE TABLE IF NOT EXISTS RDIProfiles (
            ProfileID INTEGER PRIMARY KEY AUTOINCREMENT,
            ProfileName TEXT NOT NULL UNIQUE,
            Description TEXT,
            Source TEXT -- Ej: "Resolución 3803 de 2016 (Colombia)"
          );
        `;
        db.run(createRdiProfilesQuery, (rdiProfErr: Error | null) => {
           if (rdiProfErr) { console.error('Error creating RDIProfiles table', rdiProfErr.message); return reject(rdiProfErr); }
           console.log('Table "RDIProfiles" is ready.');

           // 6. Create RDIValues Table (MEJORADA con 'Type')
           // Type puede ser: 'RDA', 'EAR', 'AI', 'UL', 'AMDR_MIN', 'AMDR_MAX'
           const createRdiValuesQuery = `
             CREATE TABLE IF NOT EXISTS RDIValues (
               ValueID INTEGER PRIMARY KEY AUTOINCREMENT,
               ProfileID INTEGER NOT NULL,
               NutrientKey TEXT NOT NULL,
               RecommendedValue REAL NOT NULL,
               Type TEXT NOT NULL DEFAULT 'RDA', 
               FOREIGN KEY (ProfileID) REFERENCES RDIProfiles(ProfileID) ON DELETE CASCADE,
               UNIQUE(ProfileID, NutrientKey, Type)
             );
           `;
           db.run(createRdiValuesQuery, (rdiValErr: Error | null) => {
             if (rdiValErr) { console.error('Error creating RDIValues table', rdiValErr.message); return reject(rdiValErr); }
             console.log('Table "RDIValues" is ready (with Type support).');

             // 7. Insertar Perfil por Defecto: RIEN Colombia - Hombres 19-30 años (Basado en Res. 3803/2016)
             const defaultProfileName = 'RIEN Colombia (Hombres 19-50a)';
             db.run(`INSERT OR IGNORE INTO RDIProfiles (ProfileID, ProfileName, Source) VALUES (1, ?, 'Res. 3803 de 2016')`, [defaultProfileName], (insertProfileErr) => {
                if (!insertProfileErr) {
                    // Valores reales extraídos de las tablas 9, 14, 15, 20, 21, 22, 23 del documento
                    const defaultValues = [
                        // Energía y Macros (AMDR y Referencias generales)
                        ['Energy_kcal', 2400, 'RDA'], // Referencia genérica
                        ['Protein_g', 56, 'RDA'], // Tabla 12 (0.92g/kg aprox para 60kg referencia)
                        ['Carbohydrate_g', 130, 'RDA'], // Tabla 17
                        ['Fiber_g', 38, 'AI'], // Tabla 18

                        // Minerales (Tabla 22 y 23)
                        ['Calcium_mg', 1000, 'RDA'], ['Calcium_mg', 2500, 'UL'],
                        ['Iron_mg', 8, 'RDA'], ['Iron_mg', 45, 'UL'], // Nota: Hombres necesitan menos hierro
                        ['Sodium_mg', 1500, 'AI'], ['Sodium_mg', 2300, 'UL'],
                        ['Zinc_mg', 11, 'RDA'], ['Zinc_mg', 40, 'UL'],
                        ['Magnesium_mg', 400, 'RDA'],
                        
                        // Vitaminas (Tabla 20 y 21)
                        ['VitaminC_mg', 90, 'RDA'], ['VitaminC_mg', 2000, 'UL'],
                        ['VitaminA_ER', 900, 'RDA'], ['VitaminA_ER', 3000, 'UL'],
                        ['VitaminB12_mcg', 2.4, 'RDA'],
                        ['Folate_mcg', 400, 'RDA'], ['Folate_mcg', 1000, 'UL']
                    ];

                    const stmt = db.prepare(`INSERT OR IGNORE INTO RDIValues (ProfileID, NutrientKey, RecommendedValue, Type) VALUES (1, ?, ?, ?)`);
                    defaultValues.forEach(val => stmt.run(val));
                    stmt.finalize();
                    console.log('Default RIEN Profile initialized.');
                }
             });

             // --- CERRAR BD ---
             db.close((closeErr: Error | null) => {
                if (closeErr) return reject(closeErr);
                resolve(); 
           }); 
        });







                }); // End Close
              }); // End Create Log
            }); // End Create Recipe
          }); // End Create Foods
        }); // End Insert Default
      }); // End Create DBs
    }); // End db.serialize
  }); // End Promise
}


// --- WINDOW CREATION ---
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900, height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
    }
  });
  mainWindow.loadFile(path.join(__dirname, '../src/index.html'));
  mainWindow.webContents.openDevTools();
}

// En src/main.ts

// --- APP LIFECYCLE ---
app.whenReady().then(async () => { // <-- AÑADIDO 'async'
  
  try {
    // AÑADIDO 'await': No continuará hasta que la promesa de initializeDatabase() se resuelva
    await initializeDatabase(); 
    
    console.log("--- Database Initialization Complete. Creating Window. ---");
    
    // Solo crea la ventana DESPUÉS de que la BD esté lista
    createWindow(); 

  } catch (error) {
    console.error("!!! FATAL: Database failed to initialize. App will not start. !!!", error);
    // Aquí podrías mostrar un diálogo de error al usuario
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// --- IPC EVENT HANDLERS ---

// --- Library Management Handlers ---

ipcMain.handle('add-food', async (event, foodName: string, databaseId: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!databaseId || databaseId <= 0) return reject('Invalid Database ID provided.');
        const trimmedFoodName = foodName?.trim();
        if (!trimmedFoodName) return reject('Food name cannot be empty.');
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err: Error | null) => {
            if (err) return reject(`Database connection error: ${err.message}`);
        });
        const insertQuery = `INSERT INTO Foods (Name, DatabaseID) VALUES (?, ?)`;
        db.run(insertQuery, [trimmedFoodName, databaseId], function (this: sqlite3.RunResult, err: Error | null) {
            db.close((closeErr: Error | null) => {
                if (closeErr) console.error('Error closing database (add-food):', closeErr.message);
                if (err) {
                    console.error('Error inserting food', err.message);
                    if (err.message.includes('UNIQUE constraint failed')) reject(`Food named "${trimmedFoodName}" already exists in this database.`);
                    else if (err.message.includes('FOREIGN KEY constraint failed')) reject(`Invalid Database ID (${databaseId}). Does not exist.`);
                    else reject(`Error inserting food: ${err.message}`);
                } else {
                    console.log(`A new food has been added with ID: ${this.lastID} to DB ID ${databaseId}`);
                    resolve('Food added successfully');
                }
            });
        });
    });
});

ipcMain.handle('get-foods', async (): Promise<{ FoodID: number; Name: string; DatabaseName: string }[]> => {
    return new Promise((resolve, reject) => {
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err: Error | null) => {
            if (err) return reject(`Database connection error: ${err.message}`);
        });
        const selectQuery = `
            SELECT f.FoodID, f.Name, d.DatabaseName
            FROM Foods f
            JOIN FoodDatabases d ON f.DatabaseID = d.DatabaseID
            ORDER BY d.DatabaseName ASC, f.Name ASC
        `;
        db.all(selectQuery, [], (err: Error | null, rows: { FoodID: number; Name: string; DatabaseName: string }[]) => {
            db.close((closeErr: Error | null) => {
                if (closeErr) console.error('Error closing database (get-foods):', closeErr.message);
                if (err) reject(`Error fetching foods: ${err.message}`);
                else resolve(rows);
            });
        });
    });
});

ipcMain.handle('get-food-details', async (event, foodId: number): Promise<IFoodDetails | null> => {
    return new Promise((resolve, reject) => {
        if (!foodId || foodId <= 0) { return reject('Invalid Food ID provided.'); }
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err: Error | null) => {
            if (err) return reject(`Database connection error: ${err.message}`);
        });
        const selectQuery = `SELECT * FROM Foods WHERE FoodID = ?`;
        db.get(selectQuery, [foodId], (err: Error | null, row: IFoodDetails) => {
            db.close((closeErr: Error | null) => {
                if (closeErr) console.error('Error closing database (get-food-details):', closeErr.message);
            });
            if (err) {
                console.error('Error fetching food details:', err.message);
                reject(`Error fetching food details: ${err.message}`);
            } else if (!row) {
                console.warn(`Food details not found for FoodID: ${foodId}`);
                resolve(null);
            } else {
                console.log(`Fetched details for FoodID: ${foodId}`);
                resolve(row);
            }
        });
    });
});

ipcMain.handle('get-recipe-ingredients', async (event, foodId: number): Promise<IRecipeIngredient[]> => {
  return new Promise((resolve, reject) => {
    if (!foodId || foodId <= 0) {
      return reject('Invalid Food ID provided.');
    }

    const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err: Error | null) => {
      if (err) return reject(`Database connection error: ${err.message}`);
    });

    const query = `
      SELECT
        ri.IngredientFoodID AS foodId,
        f.Name AS name,
        d.DatabaseName AS dbName,
        ri.IngredientGrams AS grams
      FROM RecipeIngredients ri
      JOIN Foods f ON ri.IngredientFoodID = f.FoodID
      JOIN FoodDatabases d ON f.DatabaseID = d.DatabaseID
      WHERE ri.ParentFoodID = ?
      ORDER BY ri.RecipeIngredientID ASC
    `;

    db.all(query, [foodId], (err: Error | null, rows: any[]) => {
      db.close();
      if (err) {
        return reject(`Error fetching recipe ingredients: ${err.message}`);
      }
      
      // Reformateamos los datos para que coincidan con la interfaz IRecipeIngredient
      const ingredients: IRecipeIngredient[] = rows.map(row => ({
        foodId: row.foodId,
        name: `${row.name} (${row.dbName})`, // Formato: "Arroz (Default)"
        grams: row.grams
      }));
      
      console.log(`[IPC] Found ${ingredients.length} ingredients for FoodID ${foodId}`);
      resolve(ingredients);
    });
  });
});


ipcMain.handle('get-databases', async (): Promise<IDatabaseInfo[]> => {
    return new Promise((resolve, reject) => {
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err: Error | null) => {
            if (err) return reject(`Database connection error: ${err.message}`);
        });
        const selectQuery = `SELECT DatabaseID, DatabaseName FROM FoodDatabases ORDER BY DatabaseName ASC`;
        db.all(selectQuery, [], (err: Error | null, rows: IDatabaseInfo[]) => {
            db.close((closeErr: Error | null) => {
                if (closeErr) console.error('Error closing database (get-databases):', closeErr.message);
                if (err) reject(`Error fetching databases: ${err.message}`);
                else resolve(rows);
            });
        });
    });
});

ipcMain.handle('add-database', async (event, dbName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const trimmedName = dbName?.trim();
        if (!trimmedName) return reject('Database name cannot be empty.');
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err: Error | null) => {
            if (err) return reject(`Database connection error: ${err.message}`);
        });




        const insertQuery = `INSERT INTO FoodDatabases (DatabaseName) VALUES (?)`;
        db.run(insertQuery, [trimmedName], function (this: sqlite3.RunResult, err: Error | null) {
            db.close((closeErr: Error | null) => {
                if (closeErr) console.error('Error closing database (add-database):', closeErr.message);
                if (err) {
                    console.error('Error inserting database name', err.message);
                    if (err.message.includes('UNIQUE constraint failed')) reject(`Database named "${trimmedName}" already exists.`);
                    else reject(`Error inserting database name: ${err.message}`);
                } else {
                    console.log(`New database added with ID: ${this.lastID}, Name: ${trimmedName}`);
                    resolve('Database added successfully');
                }
            });
        });
    });
});

ipcMain.handle('delete-database', async (event, databaseId: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (databaseId === 1) {
            return reject('Cannot delete the "Default" database. It is required by the application.');
        }
        if (!databaseId || databaseId <= 0) {
            return reject('Invalid Database ID provided for deletion.');
        }
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err: Error | null) => {
            if (err) return reject(`Database connection error: ${err.message}`);
        });
        db.run('PRAGMA foreign_keys = ON;', (pragmaErr: Error | null) => {
            if (pragmaErr) {
                db.close();
                return reject(`Failed to enable foreign keys: ${pragmaErr.message}`);
            }
            const deleteQuery = `DELETE FROM FoodDatabases WHERE DatabaseID = ?`;
            console.log(`Attempting to delete database with ID: ${databaseId}`);
            db.run(deleteQuery, [databaseId], function (this: sqlite3.RunResult, err: Error | null) {
                db.close((closeErr: Error | null) => {
                    if (closeErr) console.error('Error closing database (delete-database):', closeErr.message);
                });
                if (err) {
                    console.error('Error deleting database:', err.message);
                    reject(`Error deleting database: ${err.message}`);
                } else if (this.changes === 0) {
                    reject(`Database with ID ${databaseId} not found.`);
                } else {
                    console.log(`Successfully deleted database ID: ${databaseId} and all associated data.`);
                    resolve('Database deleted successfully (along with all associated foods and log entries).');
                }
            });
        });
    });
});


ipcMain.handle('update-food-details', async (event, foodData: IFoodDetails): Promise<string> => {
  return new Promise((resolve, reject) => {
    // --- Validación Inicial ---
    if (!foodData || typeof foodData.FoodID !== 'number' || foodData.FoodID <= 0) {
      return reject('Invalid Food ID provided for update.');
    }
    const trimmedName = foodData.Name?.trim();
    if (!trimmedName) {
      return reject('Food name cannot be empty.');
    }

    // --- Conexión a la BD ---
    const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err: Error | null) => {
      if (err) return reject(`Database connection error: ${err.message}`);
    });

    // --- Iniciar Transacción ---
    db.serialize(() => {
      db.run('BEGIN TRANSACTION;', (beginErr: Error | null) => {
        if (beginErr) {
          db.close();
          return reject(`Failed to start transaction: ${beginErr.message}`);
        }
      });

      // --- 1. Calcular el rendimiento (si es receta) ---
let recipeYield: number | null = null;
if (foodData.FoodType === 'recipe' && foodData.Ingredients && foodData.Ingredients.length > 0) {
  recipeYield = foodData.Ingredients.reduce((sum, ing) => sum + ing.grams, 0);
}

// --- 2. Actualizar la tabla 'Foods' ---
const fieldsToUpdate: string[] = ['Name = ?', 'FoodType = ?', 'RecipeYieldGrams = ?']; // <-- AÑADIDO RecipeYieldGrams
const values: (string | number | null)[] = [trimmedName, foodData.FoodType || 'simple', recipeYield]; // <-- AÑADIDO recipeYield




      // Definimos explícitamente sobre qué campos iterar.
      // 1. Definimos un tipo que es 'keyof IFoodDetails' PERO EXCLUYE las claves que no son nutrientes
      type NutrientKey = Exclude<keyof IFoodDetails, 'FoodID' | 'DatabaseID' | 'Name' | 'FoodType' | 'Ingredients'>;

      // 2. Ahora 'nutrientFields' usa este tipo más específico
      const nutrientFields: NutrientKey[] = [
        'Energy_kcal', 'Water_g', 'Protein_g', 'Fat_g', 'Carbohydrate_g',
        'SaturatedFat_g', 'MonounsaturatedFat_g', 'PolyunsaturatedFat_g', 'Cholesterol_mg',
        'Fiber_g', 'Sugar_g', 'Ash_g', 'Calcium_mg', 'Phosphorus_mg', 'Iron_mg',
        'Sodium_mg', 'Potassium_mg', 'Magnesium_mg', 'Zinc_mg', 'Copper_mg',
        'Manganese_mg', 'VitaminA_ER', 'Thiamin_mg', 'Riboflavin_mg', 'Niacin_mg',
        'PantothenicAcid_mg', 'VitaminB6_mg', 'Folate_mcg', 'VitaminB12_mcg', 'VitaminC_mg'
      ];


      nutrientFields.forEach(field => {
        if (foodData.hasOwnProperty(field)) {
          fieldsToUpdate.push(`${field} = ?`);
          const value = foodData[field]; 
          values.push(value === undefined ? null : value);
        }
      });

      values.push(foodData.FoodID); // Añadir el ID para el 'WHERE'

      const updateQuery = `UPDATE Foods SET ${fieldsToUpdate.join(', ')} WHERE FoodID = ?`;
      
      db.run(updateQuery, values, function(this: sqlite3.RunResult, err: Error | null) {
        if (err) {
          console.error('Error updating food details:', err.message);
          db.run('ROLLBACK;');
          db.close();
          return reject(`Error updating food: ${err.message}`);
        }
        if (this.changes === 0) {
          db.run('ROLLBACK;');
          db.close();
          return reject(`Food with ID ${foodData.FoodID} not found for update.`);
        }

        // --- 2. Borrar ingredientes antiguos ---
        const deleteQuery = `DELETE FROM RecipeIngredients WHERE ParentFoodID = ?`;
        db.run(deleteQuery, [foodData.FoodID], (deleteErr: Error | null) => {
          if (deleteErr) {
            console.error('Error deleting old ingredients:', deleteErr.message);
            db.run('ROLLBACK;');
            db.close();
            return reject(`Error clearing old ingredients: ${deleteErr.message}`);
          }

          // --- 3. Insertar nuevos ingredientes ---
          if (foodData.FoodType === 'recipe' && foodData.Ingredients && foodData.Ingredients.length > 0) {
            const insertQuery = `INSERT INTO RecipeIngredients (ParentFoodID, IngredientFoodID, IngredientGrams) VALUES (?, ?, ?)`;
            const stmt = db.prepare(insertQuery);
            let ingredientsProcessed = 0;
            
            foodData.Ingredients.forEach(ing => {
              stmt.run([foodData.FoodID, ing.foodId, ing.grams], (runErr: Error | null) => {
                ingredientsProcessed++;
                if (runErr) {
                  console.error('Error inserting ingredient:', runErr.message);
                }

                if (ingredientsProcessed === foodData.Ingredients!.length) {
                  stmt.finalize((finalizeErr: Error | null) => {
                    if (finalizeErr) {
                      db.run('ROLLBACK;');
                      db.close();
                      return reject(`Error saving ingredients: ${finalizeErr.message}`);
                    }
                    
                    db.run('COMMIT;', (commitErr: Error | null) => {
                      db.close();
                      if (commitErr) {
                        return reject(`Error committing transaction: ${commitErr.message}`);
                      }
                      resolve('Food and recipe details updated successfully');
                    });
                  });
                }
              });
            });
          } else {
            // No hay ingredientes (es 'simple' o receta vacía)
            db.run('COMMIT;', (commitErr: Error | null) => {
              db.close();
              if (commitErr) {
                return reject(`Error committing transaction: ${commitErr.message}`);
              }
              resolve('Food details updated successfully (no ingredients).');
            });
          }
        }); // Fin Delete
      }); // Fin Update Foods
    }); // Fin db.serialize
  }); // Fin Promise
});









//El main handle para purgar las bases de datos
ipcMain.handle('purge-food-library', async (event, databaseId: number): Promise<string> => {
  // ...
  return new Promise((resolve, reject) => {
    if (!databaseId || databaseId <= 0) {
      // ...
      return reject('Invalid Database ID provided.');
    }
    
    /* <-- ASEGÚRATE DE QUE ESTO SIGUE COMENTADO
    // Protección eliminada por solicitud del usuario (para poder limpiar la DB "Default")
    if (databaseId === 1) { 
      console.log('[IPC] Debug: Rejecting. Attempt to purge "Default" DB.'); 
      return reject('Cannot purge the "Default" database. You can only delete individual items from it.');
    }
    */

    // Añadimos un log para saber si estamos purgando la DB "Default"
    if (databaseId === 1) {
      console.warn('[IPC] Debug: ¡ATENCIÓN! Purgando la base de datos "Default".');
    }

    const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err: Error | null) => {
      if (err) {
        console.error('[IPC] Debug: DB connection error.', err.message); // <-- LOG D (ERROR)
        return reject(`Database connection error: ${err.message}`);
      }
      console.log('[IPC] Debug: Database connected.'); // <-- LOG E
    });

    db.run('PRAGMA foreign_keys = ON;', (pragmaErr: Error | null) => {
      if (pragmaErr) {
        console.error('[IPC] Debug: Failed to enable foreign keys.', pragmaErr.message); // <-- LOG F (ERROR)
        db.close();
        return reject(`Failed to enable foreign keys: ${pragmaErr.message}`);
      }
      
      const deleteQuery = `DELETE FROM Foods WHERE DatabaseID = ?`;
      console.log(`[IPC] Debug: Attempting to run query: ${deleteQuery} with ID ${databaseId}`); // <-- LOG G

      db.run(deleteQuery, [databaseId], function (this: sqlite3.RunResult, err: Error | null) {
        if (err) {
          console.error('[IPC] Debug: SQL query failed.', err.message); // <-- LOG H (ERROR)
          db.close();
          reject(`Error purging library: ${err.message}`);
          return;
        }

        console.log(`[IPC] Debug: SQL query successful. Changes: ${this.changes}`); // <-- LOG I

        db.close((closeErr: Error | null) => {
          if (closeErr) console.error('[IPC] Debug: Error closing DB after query:', closeErr.message);
        });

        if (this.changes === 0) {
          console.log('[IPC] Debug: Query ran but found 0 rows to delete.'); // <-- LOG J
          resolve('No foods found in that library to delete.');
        } else {
          console.log(`[IPC] Debug: Successfully purged ${this.changes} food(s).`); // <-- LOG K
          resolve(`Successfully purged ${this.changes} food entries from the database.`);
        }
      });
    });
  });
});




ipcMain.handle('delete-food', async (event, foodId: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!foodId || foodId <= 0) return reject('Invalid Food ID provided.');
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err: Error | null) => { if (err) return reject(`Database connection error: ${err.message}`); });
        db.run('PRAGMA foreign_keys = ON;', (pragmaErr: Error | null) => {
             if (pragmaErr) { db.close(); return reject(`Failed to enable foreign keys: ${pragmaErr.message}`); }
            const deleteQuery = `DELETE FROM Foods WHERE FoodID = ?`;
            db.run(deleteQuery, [foodId], function (this: sqlite3.RunResult, err: Error | null) {
                db.close((closeErr: Error | null) => {
                    if (closeErr) console.error('Error closing database (delete-food):', closeErr.message);
                    if (err) reject(`Error deleting food: ${err.message}`);
                    else if (this.changes === 0) reject(`Food with ID ${foodId} not found`);
                    else { console.log(`Food with ID ${foodId} deleted`); resolve('Food deleted successfully'); }
                });
            });
        });
    });
});

ipcMain.handle('import-excel', async (event, databaseId: number): Promise<string> => {
     if (!databaseId || databaseId <= 0) return Promise.reject('Invalid Database ID provided for import.');
    console.log(`Starting Excel import process into Database ID: ${databaseId}...`);
    const result = await dialog.showOpenDialog({
        title: 'Select Excel File (.xlsx)',
        properties: ['openFile'],
        filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
     });
    if (result.canceled || result.filePaths.length === 0) return 'Import cancelled.';
    const filePath = result.filePaths[0];
    console.log('Selected file:', filePath);
    const workbook = new ExcelJS.Workbook();
    try { await workbook.xlsx.readFile(filePath); }
    catch (error: any) { return `Error reading file: ${error.message || error}`; }
    const worksheet = workbook.worksheets[0];
    if (!worksheet) return 'Error: No worksheet found in the Excel file.';
    console.log(`Found worksheet: ${worksheet.name} with approx ${worksheet.rowCount} rows.`);
    let importedCount = 0;
    const errors: string[] = [];
    let db: Database | null = null;
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (connectErr: Error | null) => {
            if (connectErr) return reject(`DB connection error during import: ${connectErr.message}`);
            if (!db) return reject("DB object failed to initialize after connection.");
            console.log('Database connected for import.');
            const dbColumnMappings: { dbCol: keyof IFoodDetails; excelCol: string }[] = [
                { dbCol: 'Name', excelCol: 'A' }, { dbCol: 'Energy_kcal', excelCol: 'B' }, { dbCol: 'Water_g', excelCol: 'C' },
                { dbCol: 'Protein_g', excelCol: 'D' }, { dbCol: 'Fat_g', excelCol: 'E' },
                { dbCol: 'SaturatedFat_g', excelCol: 'F' }, { dbCol: 'MonounsaturatedFat_g', excelCol: 'G' },
                { dbCol: 'PolyunsaturatedFat_g', excelCol: 'H' }, { dbCol: 'Cholesterol_mg', excelCol: 'I' },
                { dbCol: 'Carbohydrate_g', excelCol: 'J' }, { dbCol: 'Fiber_g', excelCol: 'L' },
                { dbCol: 'Ash_g', excelCol: 'M' }, { dbCol: 'Calcium_mg', excelCol: 'N' },
                { dbCol: 'Phosphorus_mg', excelCol: 'O' }, { dbCol: 'Iron_mg', excelCol: 'P' },
                { dbCol: 'Sodium_mg', excelCol: 'Q' }, { dbCol: 'Potassium_mg', excelCol: 'R' },
                { dbCol: 'Magnesium_mg', excelCol: 'S' }, { dbCol: 'Zinc_mg', excelCol: 'T' },
                { dbCol: 'Copper_mg', excelCol: 'U' }, { dbCol: 'Manganese_mg', excelCol: 'V' },
                { dbCol: 'VitaminA_ER', excelCol: 'X' }, { dbCol: 'Thiamin_mg', excelCol: 'Y' },
                { dbCol: 'Riboflavin_mg', excelCol: 'Z' }, { dbCol: 'Niacin_mg', excelCol: 'AA' },
                { dbCol: 'PantothenicAcid_mg', excelCol: 'AB' }, { dbCol: 'VitaminB6_mg', excelCol: 'AC' },
                { dbCol: 'Folate_mcg', excelCol: 'AD' }, { dbCol: 'VitaminB12_mcg', excelCol: 'AE' },
                { dbCol: 'VitaminC_mg', excelCol: 'AF' },
            ];
            const dbColumns = dbColumnMappings.map(m => m.dbCol);
            dbColumns.push('DatabaseID');
            const placeholders = dbColumns.map(() => '?').join(', ');
            const insertQuery = `INSERT OR IGNORE INTO Foods (${dbColumns.join(', ')}) VALUES (${placeholders})`;
            const stmt = db.prepare(insertQuery, (prepareErr: Error | null) => {
                if (prepareErr || !db) { db?.close(); return reject(`DB prepare error: ${prepareErr?.message}`); }
                const currentDb_prepare = db;
                currentDb_prepare.run('BEGIN TRANSACTION;', (beginErr) => {
                    if (beginErr) { stmt.finalize(); currentDb_prepare.close(); return reject("Failed to start DB transaction."); }
                    const startRow = 3; 
                    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                        if (rowNumber < startRow) return;
                        const values: (string | number | null)[] = [];
                        let validRow = true;
                        let foodName = '';
                        dbColumnMappings.forEach(mapping => {
                            const cellValue = row.getCell(mapping.excelCol).value;
                            if (mapping.dbCol === 'Name') {
                                foodName = cellValue?.toString().trim() || '';
                                if (!foodName) { validRow = false; if(errors.length < 10) errors.push(`Row ${rowNumber}: Food name is missing (Col ${mapping.excelCol}).`); }
                                values.push(foodName);
                            } else {
                                if (cellValue == null || cellValue === undefined) {
                                    values.push(null);
                                } else {
                                    const sanitizedValue = cellValue.toString().replace(',', '.'); // Reemplazar coma
                                    const numValue = parseFloat(sanitizedValue);
                                    values.push(isNaN(numValue) ? null : numValue);
                                }
                            }
                        });
                        values.push(databaseId);
                        if (validRow && foodName) {
                            stmt.run(values, (runErr: Error | null) => {
                                if (runErr) { if(errors.length < 10) errors.push(`Row ${rowNumber} ('${foodName}'): DB insert error - ${runErr.message}`); }
                                else { importedCount++; }
                            });
                        } else if (validRow && !foodName && errors.length === 0) { if(errors.length < 10) errors.push(`Row ${rowNumber}: Skipped due to missing food name.`); }
                    }); // End eachRow
                    stmt.finalize((finalizeErr: Error | null) => {
                        const db_finalize = currentDb_prepare;
                        if (!db_finalize) { return reject("DB connection lost before finalizing import."); }
                        const commitOrRollback = (finalErrOccurred: Error | null = null) => {
                            const action = finalErrOccurred || errors.length > 0 ? 'ROLLBACK' : 'COMMIT';
                            console.log(`${action} transaction...`);
                            db_finalize.run(`${action};`, (commitErr) => {
                                if (commitErr) console.error(`Error during ${action}:`, commitErr.message);
                                db_finalize.close((closeErr: Error | null) => {
                                    if (closeErr) console.error('Error closing database after import:', closeErr.message);
                                    if (finalErrOccurred) reject(`Error finalizing import: ${finalErrOccurred.message}`);
                                    else if (errors.length > 0) resolve(`Import finished with ${errors.length} errors (or more). ${action === 'ROLLBACK' ? 'No changes were saved.' : `${importedCount} foods were processed.`} First few errors: ${errors.slice(0, 5).join('; ')}`);
                                    else resolve(`Successfully imported/ignored ${importedCount} foods into DB ID ${databaseId}.`);
                                });
                            });
                        };
                        commitOrRollback(finalizeErr);
                    }); // End stmt.finalize
                }); // End BEGIN TRANSACTION
            }); // End db.prepare
        }); // End db connect
    }); // End Promise
}); // End import-excel handler

// Importar Biblioteca de Alimentos desde CSV
ipcMain.handle('import-csv', async (event, databaseId: number): Promise<string> => {
    if (!databaseId || databaseId <= 0) {
        return Promise.reject('Invalid Database ID provided for CSV import.');
    }
    console.log(`Starting CSV import process into Database ID: ${databaseId}...`);
    const result = await dialog.showOpenDialog({
        title: 'Select CSV File (.csv)',
        properties: ['openFile'],
        filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    });
    if (result.canceled || result.filePaths.length === 0) {
        return 'CSV Import cancelled.';
    }
    const filePath = result.filePaths[0];
    console.log('Selected CSV file:', filePath);

    let importedCount = 0;
    const errors: string[] = [];
    let db: Database | null = null;

    const csvColumns: (keyof IFoodDetails | 'skip')[] = [
        'Name', 'Energy_kcal', 'Water_g', 'Protein_g', 'Fat_g',
        'SaturatedFat_g', 'MonounsaturatedFat_g', 'PolyunsaturatedFat_g', 'Cholesterol_mg',
        'Carbohydrate_g', 'skip', // F.Cruda (K)
        'Fiber_g', 'Ash_g', 'Calcium_mg', 'Phosphorus_mg', 'Iron_mg', 'Sodium_mg',
        'Potassium_mg', 'Magnesium_mg', 'Zinc_mg', 'Copper_mg', 'Manganese_mg',
        'skip', // VitA_IU (W)
        'VitaminA_ER', 'Thiamin_mg', 'Riboflavin_mg', 'Niacin_mg',
        'PantothenicAcid_mg', 'VitaminB6_mg', 'Folate_mcg', 'VitaminB12_mcg', 'VitaminC_mg'
    ];
    const dbColumns = csvColumns.filter(col => col !== 'skip');
    dbColumns.push('DatabaseID');
    const placeholders = dbColumns.map(() => '?').join(', ');
    const insertQuery = `INSERT OR IGNORE INTO Foods (${dbColumns.join(', ')}) VALUES (${placeholders})`;

    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (connectErr: Error | null) => {
            if (connectErr) return reject(`DB connection error: ${connectErr.message}`);
            if (!db) return reject("DB object failed to initialize.");
            
            const currentDb = db;
            console.log('Database connected for CSV import.');

            const stmt = currentDb.prepare(insertQuery, (prepareErr: Error | null) => {
                if (prepareErr) {
                    currentDb.close(); return reject(`DB prepare error: ${prepareErr.message}`);
                }

                currentDb.run('BEGIN TRANSACTION;', (beginErr) => {
                    if (beginErr) {
                        stmt.finalize(); currentDb.close(); return reject("Failed to start DB transaction.");
                    }

                    const parser = fs.createReadStream(filePath)
                        .pipe(parse({
                            delimiter: [',', ';'], // *** CORRECCIÓN: Aceptar coma O punto y coma ***
                            from_line: 3,   // Omitir 2 filas de cabecera
                            trim: true,
                        }));

                    parser.on('data', (row: string[]) => {
                        try {
                            const values: (string | number | null)[] = [];
                            let foodName = '';

                            csvColumns.forEach((colName, index) => {
                                if (colName === 'skip') return;
                                const cellValue = row[index];
                                if (colName === 'Name') {
                                    foodName = cellValue?.trim() || '';
                                    values.push(foodName);
                                } else {
                                    if (cellValue == null || cellValue === undefined) {
                                        values.push(null);
                                    } else {
                                        const sanitizedValue = cellValue.toString().replace(',', '.');
                                        const numValue = parseFloat(sanitizedValue);
                                        values.push(isNaN(numValue) ? null : numValue);
                                    }
                                }
                            });

                            if (!foodName) {
                                if (errors.length < 10) errors.push(`Row (approx ${parser.info.records}): Skipped due to missing food name.`);
                                return;
                            }
                            values.push(databaseId);

                            stmt.run(values, (runErr: Error | null) => {
                                if (runErr) {
                                    if (errors.length < 10) errors.push(`Row ${parser.info.records} ('${foodName}'): DB insert error - ${runErr.message}`);
                                } else {
                                    importedCount++;
                                }
                            });
                        } catch (parseErr: any) {
                            if (errors.length < 10) errors.push(`Row ${parser.info.records}: Error parsing row data - ${parseErr.message}`);
                        }
                    });

                    parser.on('end', () => {
                        stmt.finalize((finalizeErr: Error | null) => {
                            const db_finalize = currentDb;
                            if (!db_finalize) { return reject("DB connection lost before finalizing import."); }
                            const commitOrRollback = (finalErrOccurred: Error | null = null) => {
                                const action = finalErrOccurred || errors.length > 0 ? 'ROLLBACK' : 'COMMIT';
                                console.log(`${action} CSV transaction...`);
                                db_finalize.run(`${action};`, (commitErr) => {
                                    if (commitErr) console.error(`Error during ${action}:`, commitErr.message);
                                    db_finalize.close((closeErr: Error | null) => {
                                        if (closeErr) console.error('Error closing database after CSV import:', closeErr.message);
                                        if (finalErrOccurred) reject(`Error finalizing CSV import: ${finalErrOccurred.message}`);
                                        else if (errors.length > 0) resolve(`CSV Import finished with ${errors.length} errors. ${action === 'ROLLBACK' ? 'No changes saved.' : `${importedCount} foods processed.`} First error: ${errors[0]}`);
                                        else resolve(`Successfully imported ${importedCount} foods from CSV.`);
                                    });
                                });
                            };
                            commitOrRollback(finalizeErr);
                        });
                    });

                    parser.on('error', (err: Error) => {
                        console.error('CSV Parser error:', err.message);
                        stmt.finalize();
                        currentDb.run('ROLLBACK;', () => {
                            currentDb.close();
                        });
                        reject(`Error reading CSV file: ${err.message}`);
                    });

                }); // End BEGIN TRANSACTION
            }); // End db.prepare
        }); // End db connect
    }); // End Promise
}); // End import-csv handler


// --- Consumption Log Handlers ---

ipcMain.handle('search-foods', async (event, searchTerm: string, referenceDbId: number): Promise<ISearchFoodResult[]> => {
  return new Promise((resolve, reject) => {
    const trimmedSearch = searchTerm?.trim();
    if (!trimmedSearch || !referenceDbId || referenceDbId <= 0) { return resolve([]); }
    
    const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err: Error | null) => { 
      if (err) return reject(`Database connection error: ${err.message}`); 
    });
    
    // *** ESTA ES LA CONSULTA CORREGIDA ***
    // (Selecciona las columnas que faltaban: FoodType y RecipeYieldGrams)
    const searchQuery = ` 
      SELECT FoodID, Name, FoodType, RecipeYieldGrams 
      FROM Foods 
      WHERE DatabaseID = ? AND Name LIKE ? 
      ORDER BY Name ASC 
      LIMIT 20 
    `;
    
    const searchPattern = `%${trimmedSearch}%`;
    
    // El callback no necesita cambiar, 'rows' ahora tendrá las nuevas propiedades
    db.all(searchQuery, [referenceDbId, searchPattern], (err: Error | null, rows: ISearchFoodResult[]) => {
        db.close((closeErr: Error | null) => { 
          if (closeErr) console.error('Error closing database (search-foods):', closeErr.message); 
          if (err) reject(`Error searching foods: ${err.message}`); 
          
          // 'rows' ahora incluirá las nuevas columnas (FoodType, RecipeYieldGrams)
          else resolve(rows); 
        });
    });
  });
});

ipcMain.handle('search-all-foods', async (event, searchTerm: string): Promise<ISearchFoodResult[]> => {
  return new Promise((resolve, reject) => {
    const trimmedSearch = searchTerm?.trim();
    if (!trimmedSearch) {
      return resolve([]);
    }

    const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err: Error | null) => {
      if (err) return reject(`Database connection error: ${err.message}`);
    });

    // *** CONSULTA MODIFICADA: Añadimos f.FoodType y f.RecipeYieldGrams ***
    const searchQuery = `
      SELECT f.FoodID, f.Name, d.DatabaseName, f.FoodType, f.RecipeYieldGrams
      FROM Foods f
      JOIN FoodDatabases d ON f.DatabaseID = d.DatabaseID
      WHERE f.Name LIKE ?
      ORDER BY f.Name ASC
      LIMIT 20
    `;
    
    const searchPattern = `%${trimmedSearch}%`;

    db.all(searchQuery, [searchPattern], (err: Error | null, rows: any[]) => {
      db.close((closeErr: Error | null) => {
        if (closeErr) console.error('Error closing database (search-all-foods):', closeErr.message);
      });

      if (err) {
        reject(`Error searching all foods: ${err.message}`);
      } else {
        // *** MAPEO MODIFICADO: Añadimos las nuevas propiedades al objeto de retorno ***
        const formattedRows: ISearchFoodResult[] = rows.map(row => ({
          FoodID: row.FoodID,
          Name: `${row.Name} (${row.DatabaseName})`,
          FoodType: row.FoodType, // <-- Añadido
          RecipeYieldGrams: row.RecipeYieldGrams // <-- Añadido
        }));
        resolve(formattedRows);
      }
    });
  });
});

ipcMain.handle('add-log-entry', async (event, logData: INewLogEntryData): Promise<string> => {
     return new Promise((resolve, reject) => {
        if (!logData) return reject('No log data provided.');
        const userId = logData.userId?.trim();
        const date = logData.consumptionDate; const foodId = logData.foodId;
        const refDbId = logData.referenceDatabaseId; const grams = logData.grams;
        if (!userId) return reject('UserID cannot be empty.');
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return reject('Invalid date (YYYY-MM-DD).');
        if (typeof foodId !== 'number' || foodId <= 0) return reject('Invalid Food ID.');
        if (typeof refDbId !== 'number' || refDbId <= 0) return reject('Invalid Reference DB ID.');
        if (typeof grams !== 'number' || isNaN(grams) || grams <= 0) return reject('Grams must be positive.');
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err: Error | null) => { if (err) return reject(`DB connection error: ${err.message}`); });
        const insertQuery = ` INSERT INTO ConsumptionLog (UserID, ConsumptionDate, MealType, FoodID, ReferenceDatabaseID, Grams) VALUES (?, ?, ?, ?, ?, ?) `;
        const mealTypeParam = logData.mealType || null;
        const params = [userId, date, mealTypeParam, foodId, refDbId, grams];
        db.run(insertQuery, params, function (this: sqlite3.RunResult, err: Error | null) {
            db.close((closeErr: Error | null) => {
                if (closeErr) console.error('Error closing DB (add-log-entry):', closeErr.message);
                if (err) { console.error('Error inserting log:', err.message); if (err.message.includes('FOREIGN KEY')) reject('Error: Invalid Food/DB ID.'); else if (err.message.includes('CHECK constraint')) reject('Error: Grams must be > 0.'); else reject(`Error inserting log: ${err.message}`); }
                else { console.log(`New log added with ID: ${this.lastID}`); resolve('Log entry added'); }
            });
        });
    });
});

ipcMain.handle('get-log-entries', async (event, userId: string, date: string): Promise<ILogEntry[]> => {
     return new Promise((resolve, reject) => {
        const trimmedUserId = userId?.trim();
        if (!trimmedUserId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { return reject('Valid UserID and Date (YYYY-MM-DD) required.'); }
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err: Error | null) => { if (err) return reject(`DB connection error: ${err.message}`); });
        const selectQuery = ` SELECT cl.*, f.Name AS FoodName, fd.DatabaseName AS ReferenceDatabaseName FROM ConsumptionLog cl JOIN Foods f ON cl.FoodID = f.FoodID JOIN FoodDatabases fd ON cl.ReferenceDatabaseID = fd.DatabaseID WHERE cl.UserID = ? AND cl.ConsumptionDate = ? ORDER BY cl.Timestamp ASC `;
        db.all(selectQuery, [trimmedUserId, date], (err: Error | null, rows: ILogEntry[]) => {
            db.close((closeErr: Error | null) => {
                if (closeErr) console.error('Error closing DB (get-log-entries):', closeErr.message);
                if (err) reject(`Error fetching logs: ${err.message}`);
                const cleanedRows = rows.map(row => ({ ...row, MealType: row.MealType === null ? undefined : row.MealType }));
                resolve(cleanedRows);
            });
        });
    });
});

ipcMain.handle('delete-log-entry', async (event, logId: number): Promise<string> => {
     return new Promise((resolve, reject) => {
        if (!logId || typeof logId !== 'number' || logId <= 0) { return reject('Invalid Log ID.'); }
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err: Error | null) => { if (err) return reject(`DB connection error: ${err.message}`); });
        const deleteQuery = `DELETE FROM ConsumptionLog WHERE LogID = ?`;
        db.run(deleteQuery, [logId], function(this: sqlite3.RunResult, err: Error | null) {
            db.close((closeErr: Error | null) => {
                 if (closeErr) console.error('Error closing DB (delete-log-entry):', closeErr.message);
                 if (err) { console.error('Error deleting log:', err.message); reject(`Error deleting log: ${err.message}`); }
                 else if (this.changes === 0) { reject(`Log entry ID ${logId} not found.`); }
                 else { console.log(`Log entry ID ${logId} deleted.`); resolve('Log entry deleted'); }
            });
        });
    });
});

ipcMain.handle('delete-all-logs', async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err: Error | null) => {
      if (err) return reject(`Database connection error: ${err.message}`);
    });

    const deleteQuery = `DELETE FROM ConsumptionLog`;
    console.log(`Attempting to delete ALL logs from ConsumptionLog table...`);

    db.run(deleteQuery, [], function (this: sqlite3.RunResult, err: Error | null) {
      db.close((closeErr: Error | null) => {
        if (closeErr) console.error('Error closing database (delete-all-logs):', closeErr.message);
      });

      if (err) {
        console.error('Error deleting all logs:', err.message);
        reject(`Error deleting all logs: ${err.message}`);
      } else {
        resolve(`Successfully deleted all ${this.changes} log entries from the table.`);
      }
    });
  });
});


ipcMain.handle('get-all-logs', async (): Promise<ILogEntry[]> => {
  return new Promise((resolve, reject) => {
    const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err: Error | null) => { 
      if (err) return reject(`DB connection error: ${err.message}`); 
    });

    const selectQuery = `
      SELECT cl.*, f.Name AS FoodName, fd.DatabaseName AS ReferenceDatabaseName 
      FROM ConsumptionLog cl 
      JOIN Foods f ON cl.FoodID = f.FoodID 
      JOIN FoodDatabases fd ON cl.ReferenceDatabaseID = fd.DatabaseID 
      ORDER BY cl.ConsumptionDate DESC, cl.Timestamp DESC
    `; // Ordenamos por más reciente primero

    db.all(selectQuery, [], (err: Error | null, rows: ILogEntry[]) => {
      db.close((closeErr: Error | null) => {
        if (closeErr) console.error('Error closing DB (get-all-logs):', closeErr.message);
      });
      if (err) {
        reject(`Error fetching all logs: ${err.message}`);
      } else {
        // Limpiar MealType (igual que en get-log-entries)
        const cleanedRows = rows.map(row => ({ ...row, MealType: row.MealType === null ? undefined : row.MealType }));
        resolve(cleanedRows);
      }
    });
  });
});















ipcMain.handle('edit-log-entry', async (
    event,
    logId: number,
    newGrams: number
): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!logId || typeof logId !== 'number' || logId <= 0) { return reject('Invalid Log ID provided for update.'); }
        if (typeof newGrams !== 'number' || isNaN(newGrams) || newGrams <= 0) { return reject('Invalid grams value. It must be a positive number.'); }
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err: Error | null) => { if (err) return reject(`DB connection error: ${err.message}`); });
        const updateQuery = `UPDATE ConsumptionLog SET Grams = ? WHERE LogID = ?`;
        db.run(updateQuery, [newGrams, logId], function (this: sqlite3.RunResult, err: Error | null) {
            db.close((closeErr: Error | null) => { if (closeErr) console.error('Error closing database (edit-log-entry):', closeErr.message); });
            if (err) { console.error('Error updating log entry:', err.message); reject(`Error updating log entry: ${err.message}`); }
            else if (this.changes === 0) { reject(`Log entry with ID ${logId} not found.`); }
            else { console.log(`Log entry ${logId} updated successfully to ${newGrams}g.`); resolve('Log entry updated successfully.'); }
        });
    });
});

ipcMain.handle('import-consumption-log', async (): Promise<{ message: string, firstEntry?: { userId: string, date: string } }> => {
    console.log('Starting Consumption Log import process (Excel)...');

    const result = await dialog.showOpenDialog({
        title: 'Select Consumption Log Excel File (.xlsx)',
        properties: ['openFile'],
        filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
    });

    if (result.canceled || result.filePaths.length === 0) {
        return { message: 'Log import cancelled.' };
    }

    const filePath = result.filePaths[0];
    console.log('Selected log file:', filePath);

    const dbLookupMap = new Map<string, number>();
    const foodLookupMap = new Map<string, number>();

    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    let db: Database | null = null;
    let firstSuccessfulEntry: { userId: string, date: string } | undefined = undefined;

    return new Promise((resolve, reject) => {
        // 1. Conectar a la BD
        db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (connectErr: Error | null) => {
            if (connectErr) return reject(`DB connection error: ${connectErr.message}`);
            if (!db) return reject("DB object failed to initialize.");
            
            const currentDb = db; 
            console.log('Database connected for log import.');

            // 2. Cargar DBs
            currentDb.all(`SELECT DatabaseID, DatabaseName FROM FoodDatabases`, [], (dbErr, dbs: IDatabaseInfo[]) => {
                if (dbErr) { currentDb.close(); return reject(`Error fetching databases: ${dbErr.message}`); }
                dbs.forEach(dbItem => dbLookupMap.set(dbItem.DatabaseName.toLowerCase().trim(), dbItem.DatabaseID));
                console.log(`Loaded ${dbLookupMap.size} databases into lookup map.`);

                // 3. Cargar Alimentos
                currentDb.all(`SELECT FoodID, Name, DatabaseID FROM Foods`, [], (foodErr, foods: { FoodID: number, Name: string, DatabaseID: number }[]) => {
                    if (foodErr) { currentDb.close(); return reject(`Error fetching foods: ${foodErr.message}`); }
                    
                    const keysGenerated: string[] = [];
                    foods.forEach(food => {
                        const key = `${food.Name.toLowerCase().trim()}-${food.DatabaseID}`;
                        foodLookupMap.set(key, food.FoodID);
                        if(keysGenerated.length < 10) { keysGenerated.push(key); }
                    });
                    console.log(`Loaded ${foodLookupMap.size} foods into lookup map.`);
                    console.log(`First 10 keys in foodLookupMap: [${keysGenerated.join(', ')}]`);

                    // 4. Preparar Statement
                    const insertQuery = ` INSERT INTO ConsumptionLog (UserID, ConsumptionDate, FoodID, ReferenceDatabaseID, Grams, MealType) VALUES (?, ?, ?, ?, ?, ?) `;
                    const stmt = currentDb.prepare(insertQuery, (prepareErr: Error | null) => {
                        if (prepareErr) {
                            console.error('Error preparing log statement:', prepareErr.message);
                            currentDb.close(); return reject(`DB prepare error: ${prepareErr.message}`);
                        }
                        
                        // 5. Iniciar Transacción
                        currentDb.run('BEGIN TRANSACTION;', async (beginErr) => {
                            if (beginErr) {
                                console.error("Failed to begin log transaction:", beginErr.message);
                                stmt.finalize(); currentDb.close();
                                return reject("Failed to start DB transaction.");
                            }

                            // 6. Leer Excel
                            const workbook = new ExcelJS.Workbook();
                            try {
                                await workbook.xlsx.readFile(filePath);
                            } catch (error: any) {
                                console.error('Error reading log Excel file:', error);
                                currentDb.close(); 
                                return reject(`Error reading file: ${error.message || error}`);
                            }
                            const worksheet = workbook.worksheets[0];
                            if (!worksheet) { 
                                currentDb.close();
                                return reject('Error: No worksheet found.'); 
                            }
                            const startRow = 2; 

                            // 7. Iterar Filas
                            worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                                if (rowNumber < startRow) return;
                                try {
                                    const userId = row.getCell('A').value?.toString().trim();
                                    const dateValue = row.getCell('B').value;
                                    let consumptionDate: string | null = null;
                                    if (dateValue instanceof Date) { consumptionDate = dateValue.toISOString().split('T')[0]; }
                                    else if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue.trim())) { consumptionDate = dateValue.trim(); }
                                    const foodName = row.getCell('C').value?.toString().toLowerCase().trim();
                                    const dbName = row.getCell('D').value?.toString().toLowerCase().trim();
                                    const grams = parseFloat(row.getCell('E').value as string);
                                    const mealType = row.getCell('F').value?.toString().trim() || null;
                                    if (!userId || !consumptionDate || !foodName || !dbName || isNaN(grams) || grams <= 0) {
                                        if (errors.length < 10) errors.push(`Row ${rowNumber}: Invalid/missing data (UserID, Date, FoodName, DBName, or Grams).`);
                                        skippedCount++; return;
                                    }
                                    const dbId = dbLookupMap.get(dbName);
                                    if (!dbId) {
                                        if (errors.length < 10) errors.push(`Row ${rowNumber}: Database name "${dbName}" not found. Map keys: [${Array.from(dbLookupMap.keys()).join(', ')}]`);
                                        skippedCount++; return;
                                    }
                                    const lookupKey = `${foodName}-${dbId}`;
                                    const foodId = foodLookupMap.get(lookupKey);
                                    if (!foodId) {
                                        if (errors.length < 10) errors.push(`Row ${rowNumber}: Food "${foodName}" (key: ${lookupKey}) not found in database "${dbName}".`);
                                        skippedCount++; return;
                                    }
                                    stmt.run([userId, consumptionDate, foodId, dbId, grams, mealType], (runErr: Error | null) => {
                                        if (runErr) { if (errors.length < 10) errors.push(`Row ${rowNumber} ('${userId}'): DB insert error - ${runErr.message}`); skippedCount++; }
                                        else { 
                                            importedCount++;
                                            if (!firstSuccessfulEntry) {
                                                firstSuccessfulEntry = { userId: userId, date: consumptionDate! };
                                            }
                                        }
                                    });
                                } catch (parseError: any) {
                                    if (errors.length < 10) errors.push(`Row ${rowNumber}: Error parsing data - ${parseError.message}`);
                                    skippedCount++;
                                }
                            }); // End eachRow

                            // 9. Finalizar Transacción
                            stmt.finalize((finalizeErr: Error | null) => {
                                const db_finalize = currentDb;
                                if (!db_finalize) { return reject("DB connection lost before finalizing log import."); }
                                const commitOrRollback = (finalErrOccurred: Error | null = null) => {
                                    const action = finalErrOccurred || errors.length > 0 ? 'ROLLBACK' : 'COMMIT';
                                    console.log(`${action} log import transaction...`);
                                    db_finalize.run(`${action};`, (commitErr) => {
                                        if (commitErr) console.error(`Error during ${action}:`, commitErr.message);
                                        db_finalize.close((closeErr: Error | null) => {
                                            if (closeErr) console.error('Error closing DB after log import:', closeErr.message);
                                            if (finalErrOccurred) reject(`Error finalizing: ${finalErrOccurred.message}`);
                                            else if (errors.length > 0) resolve({ message: `Log import finished with ${errors.length} errors and ${skippedCount} skipped rows. ${action === 'ROLLBACK' ? 'No changes saved.' : `${importedCount} entries processed.`} First error: ${errors[0]}` });
                                            else resolve({ message: `Successfully imported ${importedCount} log entries.`, firstEntry: firstSuccessfulEntry });
                                        });
                                    });
                                };
                                commitOrRollback(finalizeErr);
                            }); // End stmt.finalize
                        }); // End BEGIN TRANSACTION
                    }); // End db.prepare
                }); // End db.all (Foods)
            }); // End db.all (Databases)
        }); // End db connect
    }); // End Promise
}); // End import-consumption-log

// *** NUEVO: Importar Log de Consumo desde CSV ***
ipcMain.handle('import-consumption-log-csv', async (): Promise<{ message: string, firstEntry?: { userId: string, date: string } }> => {
    console.log('Starting Consumption Log import process (CSV)...');

    const result = await dialog.showOpenDialog({
        title: 'Select Consumption Log CSV File (.csv)',
        properties: ['openFile'],
        filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    });

    if (result.canceled || result.filePaths.length === 0) {
        return { message: 'CSV Log import cancelled.' };
    }

    const filePath = result.filePaths[0];
    console.log('Selected log file:', filePath);

    const dbLookupMap = new Map<string, number>();
    const foodLookupMap = new Map<string, number>();
    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    let db: Database | null = null;
    let firstSuccessfulEntry: { userId: string, date: string } | undefined = undefined;

    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (connectErr: Error | null) => {
            if (connectErr) return reject(`DB connection error: ${connectErr.message}`);
            if (!db) return reject("DB object failed to initialize.");
            
            const currentDb = db; 
            console.log('Database connected for CSV log import.');

            currentDb.all(`SELECT DatabaseID, DatabaseName FROM FoodDatabases`, [], (dbErr, dbs: IDatabaseInfo[]) => {
                if (dbErr) { currentDb.close(); return reject(`Error fetching databases: ${dbErr.message}`); }
                dbs.forEach(dbItem => dbLookupMap.set(dbItem.DatabaseName.toLowerCase().trim(), dbItem.DatabaseID));
                console.log(`Loaded ${dbLookupMap.size} databases into lookup map.`);

                currentDb.all(`SELECT FoodID, Name, DatabaseID FROM Foods`, [], (foodErr, foods: { FoodID: number, Name: string, DatabaseID: number }[]) => {
                    if (foodErr) { currentDb.close(); return reject(`Error fetching foods: ${foodErr.message}`); }
                    
                    foods.forEach(food => {
                        const key = `${food.Name.toLowerCase().trim()}-${food.DatabaseID}`;
                        foodLookupMap.set(key, food.FoodID);
                    });
                    console.log(`Loaded ${foodLookupMap.size} foods into lookup map.`);

                    const insertQuery = ` INSERT INTO ConsumptionLog (UserID, ConsumptionDate, FoodID, ReferenceDatabaseID, Grams, MealType) VALUES (?, ?, ?, ?, ?, ?) `;
                    const stmt = currentDb.prepare(insertQuery, (prepareErr: Error | null) => {
                        if (prepareErr) {
                            console.error('Error preparing log statement:', prepareErr.message);
                            currentDb.close(); return reject(`DB prepare error: ${prepareErr.message}`);
                        }
                        
                        currentDb.run('BEGIN TRANSACTION;', async (beginErr) => {
                            if (beginErr) {
                                console.error("Failed to begin log transaction:", beginErr.message);
                                stmt.finalize(); currentDb.close();
                                return reject("Failed to start DB transaction.");
                            }

                            // Configurar el parser de CSV
                            const parser = fs.createReadStream(filePath)
                                .pipe(parse({
                                    delimiter: [';'], // *** CORRECCIÓN: Aceptar coma O punto y coma ***
                                    from_line: 2,   // Asumimos 1 fila de cabecera
                                    trim: true,
                                    columns: ['UserID', 'ConsumptionDate', 'FoodName', 'DBName', 'Grams', 'MealType'],
                                    quote: '"', // Dejamos las comillas por si un nombre de alimento las usa
                                    relax_quotes: true, 
                                }));

                            parser.on('data', (row: any) => {
                                try {
                                    const userId = row.UserID?.trim();
                                    const consumptionDate = row.ConsumptionDate?.trim(); // Asumimos formato YYYY-MM-DD
                                    const foodName = row.FoodName?.toLowerCase().trim();
                                    const dbName = row.DBName?.toLowerCase().trim();
                                    const grams = parseFloat(row.Grams?.replace(',', '.')); // Reemplazar coma decimal si existe
                                    const mealType = row.MealType?.trim() || null;

                                    if (!userId || !consumptionDate || !/^\d{4}-\d{2}-\d{2}$/.test(consumptionDate) || !foodName || !dbName || isNaN(grams) || grams <= 0) {
                                        if (errors.length < 10) errors.push(`Row ${parser.info.records}: Invalid/missing data.`);
                                        skippedCount++; return;
                                    }

                                    const dbId = dbLookupMap.get(dbName);
                                    if (!dbId) {
                                        if (errors.length < 10) errors.push(`Row ${parser.info.records}: Database name "${dbName}" not found.`);
                                        skippedCount++; return;
                                    }
                                    
                                    const lookupKey = `${foodName}-${dbId}`;
                                    const foodId = foodLookupMap.get(lookupKey);
                                    if (!foodId) {
                                        if (errors.length < 10) errors.push(`Row ${parser.info.records}: Food "${foodName}" not found in database "${dbName}".`);
                                        skippedCount++; return;
                                    }
                                    
                                    stmt.run([userId, consumptionDate, foodId, dbId, grams, mealType], (runErr: Error | null) => {
                                        if (runErr) {
                                            if (errors.length < 10) errors.push(`Row ${parser.info.records} ('${userId}'): DB insert error - ${runErr.message}`);
                                            skippedCount++;
                                        } else {
                                            importedCount++;
                                            if (!firstSuccessfulEntry) {
                                                firstSuccessfulEntry = { userId: userId, date: consumptionDate };
                                            }
                                        }
                                    });
                                } catch (parseError: any) {
                                    if (errors.length < 10) errors.push(`Row ${parser.info.records}: Error parsing data - ${parseError.message}`);
                                    skippedCount++;
                                }
                            }); // End parser.on('data')

                            parser.on('end', () => {
                                stmt.finalize((finalizeErr: Error | null) => {
                                    const db_finalize = currentDb;
                                    if (!db_finalize) { return reject("DB connection lost before finalizing log import."); }
                                    
                                    const commitOrRollback = (finalErrOccurred: Error | null = null) => {
                                        const action = finalErrOccurred || errors.length > 0 ? 'ROLLBACK' : 'COMMIT';
                                        console.log(`${action} CSV log import transaction...`);
                                        
                                        db_finalize.run(`${action};`, (commitErr) => {
                                            if (commitErr) console.error(`Error during ${action}:`, commitErr.message);
                                            
                                            db_finalize.close((closeErr: Error | null) => {
                                                if (closeErr) console.error('Error closing DB after CSV log import:', closeErr.message);
                                                if (finalErrOccurred) reject(`Error finalizing: ${finalErrOccurred.message}`);
                                                else if (errors.length > 0) resolve({ message: `CSV Log import finished with ${errors.length} errors and ${skippedCount} skipped rows. ${action === 'ROLLBACK' ? 'No changes saved.' : `${importedCount} entries processed.`} First error: ${errors[0]}` });
                                                else resolve({ message: `Successfully imported ${importedCount} log entries from CSV.`, firstEntry: firstSuccessfulEntry });
                                            });
                                        });
                                    };
                                    commitOrRollback(finalizeErr);
                                }); // End stmt.finalize
                            }); // End parser.on('end')

                            parser.on('error', (err: Error) => {
                                console.error('CSV Parser error:', err.message);
                                stmt.finalize();
                                currentDb.run('ROLLBACK;', () => currentDb.close());
                                reject(`Error reading CSV file: ${err.message}`);
                            });

                        }); // End BEGIN TRANSACTION
                    }); // End db.prepare
                }); // End db.all (Foods)
            }); // End db.all (Databases)
        }); // End db connect
    }); // End Promise
}); // End import-consumption-log-csv


ipcMain.handle('get-unique-user-ids', async (): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err: Error | null) => {
            if (err) return reject(`Database connection error: ${err.message}`);
        });
        const selectQuery = `
            SELECT DISTINCT UserID 
            FROM ConsumptionLog 
            ORDER BY UserID ASC
        `;
        db.all(selectQuery, [], (err: Error | null, rows: { UserID: string }[]) => {
            db.close((closeErr: Error | null) => {
                if (closeErr) console.error('Error closing database (get-unique-user-ids):', closeErr.message);
            });
            if (err) {
                console.error('Error fetching unique UserIDs:', err.message);
                reject(`Error fetching unique UserIDs: ${err.message}`);
            } else {
                resolve(rows.map(row => row.UserID)); 
            }
        });
    });
});




const nutrientColumnNames: string[] = [
  'Energy_kcal', 'Water_g', 'Protein_g', 'Fat_g', 'Carbohydrate_g',
  'SaturatedFat_g', 'MonounsaturatedFat_g', 'PolyunsaturatedFat_g', 'Cholesterol_mg',
  'Fiber_g', 'Sugar_g', 'Ash_g',
  'Calcium_mg', 'Phosphorus_mg', 'Iron_mg', 'Sodium_mg', 'Potassium_mg',
  'Magnesium_mg', 'Zinc_mg', 'Copper_mg', 'Manganese_mg',
  'VitaminA_ER', 'Thiamin_mg', 'Riboflavin_mg', 'Niacin_mg', // <-- CORREGIDO
  'PantothenicAcid_mg', 'VitaminB6_mg', 'Folate_mcg', 'VitaminB12_mcg', 'VitaminC_mg'
];

// Creamos un array de llaves con el prefijo 'total' para la interfaz INutrientTotals
const nutrientTotalKeys: (keyof INutrientTotals)[] = nutrientColumnNames.map(col => `total${col}`) as (keyof INutrientTotals)[];
// --- FUNCIÓN AUXILIAR RECURSIVA ---
// Esta es la nueva lógica de "explosión" [cite: 412-413]
async function getNutrientsForFoodRecursive(
  foodId: number,
  gramsConsumed: number,
  referenceDbId: number,
  db: Database,
  depth: number = 0
): Promise<INutrientTotals> {

  // 1. Inicializar totales en cero
  const totals: INutrientTotals = {} as INutrientTotals;
  nutrientTotalKeys.forEach(key => { totals[key] = 0; });

  if (depth > 10) {
    console.error(`[Calc] Recursion limit reached for FoodID ${foodId}. Aborting to prevent infinite loop.`);
    return totals; // Evitar bucles infinitos
  }

  // 2. Obtener los detalles del alimento (tipo, rendimiento, nutrientes)
  const foodDetails = await new Promise<any>((resolve, reject) => {
    // Seleccionamos las columnas de nutrientes que definimos arriba
    db.get(
      `SELECT FoodID, FoodType, RecipeYieldGrams, ${nutrientColumnNames.join(', ')} FROM Foods WHERE FoodID = ? AND DatabaseID = ?`,
      [foodId, referenceDbId],
      (err, row) => (err ? reject(err) : resolve(row))
    );
  });

  if (!foodDetails) {
    console.warn(`[Calc] FoodID ${foodId} not found in DB ${referenceDbId}. Returning zero.`);
    return totals;
  }

  // 3. Decidir la lógica: Simple o Receta
  if (foodDetails.FoodType === 'simple') {
    // --- LÓGICA SIMPLE ---
    const factor = gramsConsumed / 100.0;
    nutrientColumnNames.forEach((colName, index) => {
      const nutrientValue = foodDetails[colName];
      if (typeof nutrientValue === 'number' && !isNaN(nutrientValue)) {
        const totalKey = nutrientTotalKeys[index]; // ej: 'totalEnergy_kcal'
        totals[totalKey] += nutrientValue * factor;
      }
    });

  } else {
    // --- LÓGICA DE RECETA (RECURSIVA) ---
    const yieldGrams = foodDetails.RecipeYieldGrams;
    if (!yieldGrams || yieldGrams <= 0) {
      console.warn(`[Calc] Recipe FoodID ${foodId} has no yield (RecipeYieldGrams is ${yieldGrams}). Returning zero.`);
      return totals;
    }

    // Calcular el factor de escala [cite: 413]
    const scaleFactor = gramsConsumed / yieldGrams;

    // Obtener los ingredientes de esta receta
    const ingredients = await new Promise<any[]>((resolve, reject) => {
      db.all(
        `SELECT IngredientFoodID, IngredientGrams FROM RecipeIngredients WHERE ParentFoodID = ?`,
        [foodId],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });

    // Calcular recursivamente los nutrientes para cada ingrediente
    for (const ingredient of ingredients) {
      // Ajustar los gramos del ingrediente por el factor de escala
      const ingredientGrams = ingredient.IngredientGrams * scaleFactor;
      
      // ¡Llamada recursiva! [cite: 413]
      const ingredientNutrients = await getNutrientsForFoodRecursive(
        ingredient.IngredientFoodID,
        ingredientGrams,
        referenceDbId, // Asumimos que los ingredientes usan la misma DB de referencia
        db,
        depth + 1
      );

      // Sumar los nutrientes del ingrediente a los totales
      nutrientTotalKeys.forEach(key => {
        totals[key] += ingredientNutrients[key];
      });
    }
  }

  return totals;
}


































ipcMain.handle('export-report', async (
  event,
  reportTitle: string,
  data: ExportDataRow[],
  format: 'csv' | 'xlsx'
): Promise<string> => {

  const filters = format === 'csv'
    ? [{ name: 'CSV File', extensions: ['csv'] }]
    : [{ name: 'Excel File', extensions: ['xlsx'] }];
  
  const defaultFileName = `${reportTitle.replace(/[\(\) \/:]/g, '_')}.${format}`;

  const { canceled, filePath } = await dialog.showSaveDialog({
    title: `Export Report as ${format.toUpperCase()}`,
    defaultPath: defaultFileName,
    filters: filters,
  });

  if (canceled || !filePath) {
    return 'Export cancelled.';
  }

  console.log(`Exporting report to: ${filePath}`);

  try {
    if (format === 'csv') {
      const csvHeader = "Nutriente,Valor,Unidad\n";
      const csvRows = data.map(row =>
        `"${row.nutrient}","${row.value}","${row.unit}"`
      ).join('\n');
      const csvContent = csvHeader + csvRows;
      fs.writeFileSync(filePath, csvContent, 'utf-8');

    } else {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Report');
      worksheet.addRow([reportTitle]);
      worksheet.mergeCells('A1:C1');
      worksheet.getCell('A1').font = { size: 16, bold: true };
      worksheet.addRow([]);
      worksheet.addRow(['Nutriente', 'Valor', 'Unidad']);
      const headerRow = worksheet.lastRow!;
      headerRow.font = { bold: true };
      headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
        // *** CORRECCIÓN DE TIPEO: argb en lugar de argB ***
        cell.border = { bottom: { style: 'thin', color: { argb: 'FF000000' } } };
      });
      data.forEach(row => {
        const numericValue = parseFloat(String(row.value).replace(',', '.')); // Convertir string a número
        const dataRow = worksheet.addRow([
            row.nutrient,
            isNaN(numericValue) ? row.value : numericValue,
            row.unit
        ]);
        const valueCell = dataRow.getCell(2);
        valueCell.numFmt = '0.00';
        valueCell.alignment = { horizontal: 'right' };
      });
      worksheet.getColumn('A').width = 30;
      worksheet.getColumn('B').width = 15;
      worksheet.getColumn('C').width = 12;
      await workbook.xlsx.writeFile(filePath);
    }
    console.log('Report exported successfully.');
    return 'Report exported successfully.';
  } catch (error: any) {
    console.error('Error exporting report:', error);
    return `Error exporting report: ${error.message}`;
  }
});

// --- NUEVOS Manejadores de Análisis (v0.3) ---

// (Función auxiliar 'getBaseAnalyticsData'...)

// (Función auxiliar 'getBaseAnalyticsData'...)
async function getBaseAnalyticsData(
  userIds: string[],
  startDate: string,
  endDate: string,
  referenceDbId: number,
  nutrient: string // El nombre de la columna, ej: "Energy_kcal"
): Promise<{ [userId: string]: { [date: string]: number } }> {
 
    // 1. Conectar a la BD
    const db: Database = await new Promise((resolve, reject) => {
      const dbInstance = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err: Error | null) => {
        if (err) reject(`Database connection error: ${err.message}`);
        else resolve(dbInstance);
      });
    });

    // 2. Validar el nutriente
    const allowedNutrients = nutrientColumnNames;
    if (!allowedNutrients.includes(nutrient)) {
        db.close();
    return Promise.reject(new Error(`Invalid nutrient column name: ${nutrient}`));
  }
    // Convertir ej: "Energy_kcal" a "totalEnergy_kcal"
    const nutrientTotalKey = `total${nutrient}` as keyof INutrientTotals;

    // 3. Crear placeholders (?) para el array de UserIDs
  const placeholders = userIds.map(() => '?').join(',');

    try {
      // 4. Obtener los logs CRUDOS (sin calcular)
      const query = `
        SELECT cl.UserID, cl.ConsumptionDate, cl.FoodID, cl.Grams
        FROM ConsumptionLog cl
        WHERE 
            cl.UserID IN (${placeholders})
            AND cl.ConsumptionDate BETWEEN ? AND ?
            AND cl.ReferenceDatabaseID = ?
      `;
      const params = [...userIds, startDate, endDate, referenceDbId];
      
      const logEntries: any[] = await new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => err ? reject(err) : resolve(rows));
      });

      // 5. Mapa de resultados: { UserA: { '2025-10-29': 0, ... }, ... }
      const results: { [userId: string]: { [date: string]: number } } = {};
      userIds.forEach(id => { results[id] = {}; });

      // 6. Procesar cada log recursivamente
      for (const entry of logEntries) {
        const nutrients = await getNutrientsForFoodRecursive(
          entry.FoodID,
          entry.Grams,
          referenceDbId,
          db
        );
        
        const nutrientValue = nutrients[nutrientTotalKey];

        // Inicializar la fecha si no existe
        if (!results[entry.UserID][entry.ConsumptionDate]) {
          results[entry.UserID][entry.ConsumptionDate] = 0;
        }
        // Acumular el valor para ese día/usuario
        results[entry.UserID][entry.ConsumptionDate] += nutrientValue;
      }

      db.close();
      return results;

    } catch (error) {
      if(db) db.close();
      throw error;
    }
}







// 1. ANÁLISIS EPIDEMIOLÓGICO (ESTADÍSTICAS DE GRUPO)
ipcMain.handle('get-statistical-report', async (
    event,
    userIds: string[], 
    startDate: string, 
    endDate: string, 
    referenceDbId: number, 
    nutrient: string
): Promise<IStatisticalReport> => {
    
  // 1. Obtener los datos base (totales por día por usuario)
  const dailyDataByUser = await getBaseAnalyticsData(userIds, startDate, endDate, referenceDbId, nutrient);

  // 2. Calcular el promedio *diario* para CADA usuario (para las estadísticas)
  const userAverages: number[] = [];
  // 3. Recolectar los datos diarios CRUDOS (para el Box Plot)
  const rawDailyData: number[] = []; 

  for (const userId of Object.keys(dailyDataByUser)) {
      const dailyTotals = Object.values(dailyDataByUser[userId]); // e.g., [120, 180, 240, 186]
      if (dailyTotals.length > 0) {
          
          // Para las estadísticas (Q1, Media, etc.) usamos el PROMEDIO del usuario
          const userTotal = dailyTotals.reduce((sum, val) => sum + val, 0);
          userAverages.push(userTotal / dailyTotals.length); // e.g., 181.5
          
          // Para el Box Plot (rawData) usamos TODOS los puntos diarios
          rawDailyData.push(...dailyTotals); // e.g., 120, 180, 240, 186
      }
  }

  if (userAverages.length === 0) {
      throw new Error("No data found for the selected criteria to calculate statistics.");
  }

  // 4. Calcular estadísticas sobre la lista de PROMEDIOS DE USUARIO (N=2 en tu prueba)
  // Esto es lo que quiere el "Get Group Statistics" [cite: 317, 320]
  const report: IStatisticalReport = {
      count: userAverages.length,
      mean: ss.mean(userAverages),
      median: ss.median(userAverages),
      stdDev: ss.standardDeviation(userAverages),
      variance: ss.variance(userAverages),
      min: ss.min(userAverages),
      max: ss.max(userAverages),
      q1: ss.quantile(userAverages, 0.25),
      q3: ss.quantile(userAverages, 0.75),
      
      // 5. Devolver los DATOS DIARIOS CRUDOS (N=8 en tu prueba)
      // Esto es lo que quiere el Box Plot [cite: 337]
      // (Si solo se pidió 1 usuario, esto devolverá solo los datos de ese usuario)
      rawData: rawDailyData 
  };

  console.log("Generated Statistical Report:", report);
  return report;
});


// 2. ANÁLISIS NUTRICIONAL (GRÁFICO DE LÍNEA) - AHORA SOPORTA MÚLTIPLES USUARIOS
ipcMain.handle('get-daily-intake-over-time', async (
    event,
    userIds: string[], // <-- Acepta múltiples UserIDs
    startDate: string,
    endDate: string,
    referenceDbId: number,
    nutrient: string
): Promise<IDailyIntake[][]> => { // <-- Devuelve un Array de Arrays

    // 1. Obtener los datos base. Usamos la función auxiliar que ya creamos.
    // Esta función devuelve los totales diarios de nutrientes agrupados por UserID.
    const dailyDataByUser = await getBaseAnalyticsData(userIds, startDate, endDate, referenceDbId, nutrient);
    
    // 2. Convertir el mapa de datos a un array de series, una para cada usuario
    const results: IDailyIntake[][] = [];
    
    for (const userId of userIds) {
        const userDataMap = dailyDataByUser[userId];
        
        if (userDataMap) {
            const userDailyIntake: IDailyIntake[] = Object.keys(userDataMap).map(date => {
                return {
                    date: date,
                    value: userDataMap[date],
                    userId: userId // Añadimos el userId para usarlo en el frontend (aunque no está en el tipo, es útil)
                };
            });
            
            // 3. Ordenar por fecha
            userDailyIntake.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            if (userDailyIntake.length > 0) {
                results.push(userDailyIntake);
            }
        }
    }

    console.log("Generated Multi-Series Daily Intake Over Time:", results);
    return results; // Array de arrays, donde cada array interior es una línea de usuario
});











// 3. ANÁLISIS NUTRICIONAL (GRÁFICO DE PASTEL - ALIMENTOS)

ipcMain.handle('get-nutrient-contribution', async (
  event,
  userId: string,
  startDate: string,
  endDate: string,
  referenceDbId: number,
  nutrient: string
): Promise<IContributionReport[]> => {

    // 1. Validar nutriente
    const allowedNutrients = nutrientColumnNames;
  if (!allowedNutrients.includes(nutrient)) {
    return Promise.reject(new Error(`Invalid nutrient column name: ${nutrient}`));
  }
    const nutrientTotalKey = `total${nutrient}` as keyof INutrientTotals;

    // 2. Conectar a BD
    const db: Database = await new Promise((resolve, reject) => {
      const dbInstance = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err: Error | null) => {
        if (err) reject(`Database connection error: ${err.message}`);
        else resolve(dbInstance);
      });
    });

    try {
      // 3. Obtener logs CRUDOS (con nombre de alimento)
      const query = `
        SELECT cl.FoodID, cl.Grams, f.Name AS FoodName
        FROM ConsumptionLog cl
        JOIN Foods f ON cl.FoodID = f.FoodID
        WHERE 
            cl.UserID = ?
            AND cl.ConsumptionDate BETWEEN ? AND ?
            AND cl.ReferenceDatabaseID = ?
      `;
      
      const logEntries: any[] = await new Promise((resolve, reject) => {
        db.all(query, [userId, startDate, endDate, referenceDbId], (err, rows) => err ? reject(err) : resolve(rows));
      });

      // 4. Mapa de resultados: { "Manzana": 0, "Pollo": 0 }
      const contributionMap = new Map<string, number>();

      // 5. Procesar cada log recursivamente
      for (const entry of logEntries) {
        const nutrients = await getNutrientsForFoodRecursive(
          entry.FoodID,
          entry.Grams,
          referenceDbId,
          db
        );

        const nutrientValue = nutrients[nutrientTotalKey];
        const currentTotal = contributionMap.get(entry.FoodName) || 0;
        contributionMap.set(entry.FoodName, currentTotal + nutrientValue);
      }

      db.close();

      // 6. Convertir el Mapa a un Array y ordenar
      const results: IContributionReport[] = Array.from(contributionMap.entries())
        .map(([name, value]) => ({ name, value }))
        .filter(r => r.value > 0) // Devolver solo valores positivos
        .sort((a, b) => b.value - a.value); // Ordenar DESC

      return results;

    } catch (error) {
      if(db) db.close();
      throw error;
    }
});


// 4. ANÁLISIS NUTRICIONAL (GRÁFICO DE PASTEL - COMIDAS)
ipcMain.handle('get-meal-contribution', async (
  event,
  userId: string,
  startDate: string,
  endDate: string,
  referenceDbId: number,
  nutrient: string
): Promise<IContributionReport[]> => {

    // 1. Validar nutriente
    const allowedNutrients = nutrientColumnNames;
  if (!allowedNutrients.includes(nutrient)) {
    return Promise.reject(new Error(`Invalid nutrient column name: ${nutrient}`));
  }
    const nutrientTotalKey = `total${nutrient}` as keyof INutrientTotals;

    // 2. Conectar a BD
    const db: Database = await new Promise((resolve, reject) => {
      const dbInstance = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err: Error | null) => {
        if (err) reject(`Database connection error: ${err.message}`);
        else resolve(dbInstance);
      });
    });

    try {
      // 3. Obtener logs CRUDOS (con tipo de comida)
      const query = `
        SELECT cl.FoodID, cl.Grams, COALESCE(cl.MealType, 'Uncategorized') AS MealName
        FROM ConsumptionLog cl
        WHERE 
            cl.UserID = ?
            AND cl.ConsumptionDate BETWEEN ? AND ?
            AND cl.ReferenceDatabaseID = ?
      `;
      
      const logEntries: any[] = await new Promise((resolve, reject) => {
        db.all(query, [userId, startDate, endDate, referenceDbId], (err, rows) => err ? reject(err) : resolve(rows));
      });

      // 4. Mapa de resultados: { "Breakfast": 0, "Lunch": 0 }
      const contributionMap = new Map<string, number>();

      // 5. Procesar cada log recursivamente
      for (const entry of logEntries) {
        const nutrients = await getNutrientsForFoodRecursive(
          entry.FoodID,
          entry.Grams,
          referenceDbId,
          db
        );

        const nutrientValue = nutrients[nutrientTotalKey];
        
        // Agrupar por el nombre de la comida (ignorando mayúsculas/minúsculas)
        const mealKey = entry.MealName.toLowerCase();
        const currentTotal = contributionMap.get(mealKey) || 0;
        contributionMap.set(mealKey, currentTotal + nutrientValue);
      }

      db.close();

      // 6. Convertir el Mapa a un Array y ordenar
      const results: IContributionReport[] = Array.from(contributionMap.entries())
        .map(([name, value]) => ({
            // Poner la primera letra en mayúscula
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value 
        }))
        .filter(r => r.value > 0) // Devolver solo valores positivos
        .sort((a, b) => b.value - a.value); // Ordenar DESC

      return results;

    } catch (error) {
      if(db) db.close();
      throw error;
    }
});



// --- Diálogos Asíncronos (v0.2) ---
ipcMain.handle('show-confirm-dialog', async (event, options: Electron.MessageBoxOptions): Promise<Electron.MessageBoxReturnValue> => {
    const window = BrowserWindow.getFocusedWindow();
    if (window) {
        return dialog.showMessageBox(window, options);
    }
    return dialog.showMessageBox(options);
});

ipcMain.handle('show-error-dialog', async (event, title: string, content: string) => {
    const window = BrowserWindow.getFocusedWindow();
    const options: Electron.MessageBoxOptions = {
        type: 'error',
        title: title,
        message: content
    };
    if (window) {
        return dialog.showMessageBox(window, options);
    }
    return dialog.showMessageBox(options);
});

ipcMain.handle('show-info-dialog', async (event, title: string, content: string) => {
    const window = BrowserWindow.getFocusedWindow();
    const options: Electron.MessageBoxOptions = {
        type: 'info',
        title: title,
        message: content
    };
    if (window) {
        return dialog.showMessageBox(window, options);
    }
    return dialog.showMessageBox(options);
});



// --- GESTIÓN DE PERFILES RDI (Módulo de Configuración) ---

// 1. Obtener lista de perfiles
ipcMain.handle('get-rdi-profiles', async (): Promise<{ ProfileID: number, ProfileName: string }[]> => {
    return new Promise((resolve, reject) => {
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => err ? reject(err) : null);
        db.all('SELECT ProfileID, ProfileName FROM RDIProfiles ORDER BY ProfileName ASC', [], (err, rows: any[]) => {
            db.close();
            if (err) reject(err);
            else resolve(rows);
        });
    });
});

// 2. Crear nuevo perfil
ipcMain.handle('create-rdi-profile', async (event, profileName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const trimmed = profileName?.trim();
        if (!trimmed) return reject("El nombre del perfil no puede estar vacío.");
        
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => err ? reject(err) : null);
        db.run('INSERT INTO RDIProfiles (ProfileName) VALUES (?)', [trimmed], function(err) {
            db.close();
            if (err) {
                if (err.message.includes('UNIQUE')) reject("Ya existe un perfil con ese nombre.");
                else reject(err.message);
            } else {
                resolve("Perfil creado exitosamente.");
            }
        });
    });
});

// 3. Importar valores RDI desde Excel (ACTUALIZADO v0.5)
// Espera columnas: A:Nutriente, B:Valor, C:Tipo (Opcional, default RDA)
ipcMain.handle('import-rdi-excel', async (event, profileId: number): Promise<string> => {
    if (!profileId) return "ID de perfil inválido.";

    const result = await dialog.showOpenDialog({
        title: 'Importar Valores RDI (Excel)',
        filters: [{ name: 'Excel', extensions: ['xlsx'] }],
        properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) return "Importación cancelada.";

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(result.filePaths[0]);
    const worksheet = workbook.worksheets[0];
    
    if (!worksheet) return "No se encontró hoja de cálculo.";

    let importedCount = 0;
    // ... (Mismo mapa de nutrientes de antes) ...
    const nutrientMap: { [key: string]: string } = {
        'calorias': 'Energy_kcal', 'energia': 'Energy_kcal', 'energy': 'Energy_kcal',
        'proteina': 'Protein_g', 'protein': 'Protein_g',
        'grasa': 'Fat_g', 'lipidos': 'Fat_g', 'fat': 'Fat_g',
        'carbohidratos': 'Carbohydrate_g', 'cho': 'Carbohydrate_g',
        'fibra': 'Fiber_g', 'azucar': 'Sugar_g',
        'calcio': 'Calcium_mg', 'hierro': 'Iron_mg', 'sodio': 'Sodium_mg',
        'vitamina c': 'VitaminC_mg', 'vitamina a': 'VitaminA_ER', 
        'vitamina b12': 'VitaminB12_mcg', 'folato': 'Folate_mcg',
        'zinc': 'Zinc_mg', 'magnesio': 'Magnesium_mg', 'potasio': 'Potassium_mg'
    };

    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE);
        
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            // Borramos datos previos para evitar mezclas corruptas
            db.run('DELETE FROM RDIValues WHERE ProfileID = ?', [profileId]);

            // Ahora insertamos 4 valores: ID, Key, Valor, TIPO
            const stmt = db.prepare('INSERT INTO RDIValues (ProfileID, NutrientKey, RecommendedValue, Type) VALUES (?, ?, ?, ?)');

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Saltar cabecera

                let nutrientName = row.getCell(1).value?.toString().trim().toLowerCase() || '';
                let value = row.getCell(2).value;
                // NUEVO: Leemos la columna C para el Tipo. Si no hay, usamos RDA.
                let typeRaw = row.getCell(3).value?.toString().trim().toUpperCase();
                
                // Normalizar tipos permitidos
                let type = 'RDA'; 
                if (typeRaw) {
                    if (['RDA', 'EAR', 'AI', 'UL', 'AMDR_MIN', 'AMDR_MAX'].includes(typeRaw)) {
                        type = typeRaw;
                    } else if (typeRaw.includes('MAX') || typeRaw.includes('UL')) type = 'UL';
                    else if (typeRaw.includes('PROMEDIO') || typeRaw.includes('EAR')) type = 'EAR';
                }

                let dbKey = nutrientMap[nutrientName];
                if (!dbKey) {
                    const exactMatch = nutrientColumnNames.find(n => n.toLowerCase() === nutrientName);
                    if (exactMatch) dbKey = exactMatch;
                }

                if (dbKey && value) {
                    const numValue = parseFloat(value.toString().replace(',', '.'));
                    if (!isNaN(numValue)) {
                        stmt.run([profileId, dbKey, numValue, type], (err: Error) => {
                            if (!err) importedCount++;
                        });
                    }
                }
            });

            stmt.finalize();
            db.run('COMMIT', (err) => {
                db.close();
                if (err) reject("Error en transacción: " + err.message);
                else resolve(`Importados ${importedCount} valores al perfil (con soporte de tipos).`);
            });
        });
    });
});
































// --- MANEJADOR DE ADECUACIÓN NUTRICIONAL (RDI) ---
// --- LÓGICA INTERNA REUTILIZABLE (Soluciona el error 2554) ---
async function calculateIntakeInternal(
    userId: string,
    startDate: string,
    endDate: string,
    referenceDbId: number
): Promise<INutrientTotals> {
    console.log(`[Internal Calc] User: ${userId}, Dates: ${startDate} to ${endDate}`);

    // 1. Validar entradas
    const userIds = userId.split(',').map(id => id.trim()).filter(id => id.length > 0);
    if (userIds.length === 0) throw new Error('UserID(s) are required.');
    
    // 2. Conectar a la BD
    const db: Database = await new Promise((resolve, reject) => {
        const dbInstance = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err: Error | null) => {
            if (err) reject(`Database connection error: ${err.message}`);
            else resolve(dbInstance);
        });
    });

    // 3. Inicializar totales
    const accumulatedTotals: INutrientTotals = {} as INutrientTotals;
    nutrientTotalKeys.forEach(key => { accumulatedTotals[key] = 0; });

    try {
        const placeholders = userIds.map(() => '?').join(',');
        const selectLogQuery = `
            SELECT LogID, FoodID, Grams FROM ConsumptionLog
            WHERE UserID IN (${placeholders})
            AND ConsumptionDate BETWEEN ? AND ?
            AND ReferenceDatabaseID = ?
        `;
        const params = [...userIds, startDate, endDate, referenceDbId];

        const logEntries: { LogID: number, FoodID: number, Grams: number }[] = await new Promise((resolve, reject) => {
            db.all(selectLogQuery, params, (logErr: Error | null, logEntries) => {
                if (logErr) reject(`Error fetching log entries: ${logErr.message}`);
                else resolve(logEntries as { LogID: number, FoodID: number, Grams: number }[]);
            });
        });

        if (logEntries.length > 0) {
            for (const entry of logEntries) {
                const nutrientsForEntry = await getNutrientsForFoodRecursive(
                    entry.FoodID, entry.Grams, referenceDbId, db
                );
                nutrientTotalKeys.forEach(key => {
                    accumulatedTotals[key] += nutrientsForEntry[key];
                });
            }
        }
        db.close();
        return accumulatedTotals;

    } catch (error) {
        if (db) db.close();
        throw error;
    }
}

// --- MANEJADOR IPC: CALCULATE INTAKE (Usa la lógica interna) ---
ipcMain.handle('calculate-intake', async (event, userId, startDate, endDate, referenceDbId) => {
    return await calculateIntakeInternal(userId, startDate, endDate, referenceDbId);
});

// --- MANEJADOR DE ADECUACIÓN NUTRICIONAL (ACTUALIZADO v0.5) ---
ipcMain.handle('get-adequacy-report', async (
    event, userId: string, startDate: string, endDate: string, referenceDbId: number, profileId: number = 1
): Promise<{ nutrient: string, intake: number, rdi: number, percentage: number, type: string }[]> => {

    const intakeTotals = await calculateIntakeInternal(userId, startDate, endDate, referenceDbId);
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayCount = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 3600 * 24) + 1);

    const db: Database = await new Promise((resolve, reject) => {
        const dbInstance = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => err ? reject(err) : resolve(dbInstance));
    });

    // Obtenemos TODOS los valores del perfil
    const allValues: any[] = await new Promise((resolve, reject) => {
        db.all(`SELECT NutrientKey, RecommendedValue, Type FROM RDIValues WHERE ProfileID = ?`, [profileId], (err, rows) => err ? reject(err) : resolve(rows));
    });
    db.close();

    // Agrupar por nutriente para elegir el mejor estándar
    const valuesByNutrient: { [key: string]: { [type: string]: number } } = {};
    allValues.forEach(v => {
        if (!valuesByNutrient[v.NutrientKey]) valuesByNutrient[v.NutrientKey] = {};
        valuesByNutrient[v.NutrientKey][v.Type] = v.RecommendedValue;
    });

    const report: { nutrient: string, intake: number, rdi: number, percentage: number, type: string }[] = [];

    for (const nutrientKey in valuesByNutrient) {
        const standards = valuesByNutrient[nutrientKey];
        
        // LÓGICA DE PRIORIDAD: RDA > AI > EAR
        let targetValue = standards['RDA'] || standards['AI'] || standards['EAR'];
        let targetType = standards['RDA'] ? 'RDA' : (standards['AI'] ? 'AI' : 'EAR');

        if (targetValue) {
            const totalKey = `total${nutrientKey}` as keyof INutrientTotals;
            const totalIntake = intakeTotals[totalKey] || 0;
            const dailyAverageIntake = totalIntake / dayCount;

            report.push({
                nutrient: nutrientKey,
                intake: dailyAverageIntake,
                rdi: targetValue,
                percentage: (dailyAverageIntake / targetValue) * 100,
                type: targetType // Le decimos al frontend qué estándar estamos usando
            });
        }
    }

    return report.sort((a, b) => b.percentage - a.percentage);
});