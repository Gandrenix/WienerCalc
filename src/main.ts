import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import sqlite3, { Database } from 'sqlite3';
import * as ExcelJS from 'exceljs';
import { parse } from 'csv-parse';
import * as ss from 'simple-statistics';

// ============================================================================
//REGION: TYPE DEFINITIONS & INTERFACES
// ============================================================================

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
  FoodName: string;
  ReferenceDatabaseID: number;
  ReferenceDatabaseName: string;
  Grams: number;
  Timestamp: string;
}

interface IRecipeIngredient {
  foodId: number;
  grams: number;
  name?: string;
}

interface IFoodDetails {
  FoodID: number;
  DatabaseID?: number;
  Name: string;
  FoodType?: 'simple' | 'recipe';
  Ingredients?: IRecipeIngredient[];

  // Macros & Energía
  Energy_kcal?: number | null;
  Water_g?: number | null;
  Protein_g?: number | null;
  Fat_g?: number | null;
  Carbohydrate_g?: number | null;
  // Sub-componentes Grasa
  SaturatedFat_g?: number | null;
  MonounsaturatedFat_g?: number | null;
  PolyunsaturatedFat_g?: number | null;
  Cholesterol_mg?: number | null;
  // Sub-componentes Carbohidratos
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

interface ExportDataRow {
  nutrient: string;
  value: number | string;
  unit: string;
}

interface IStatisticalReport {
  count: number;
  mean: number;
  median: number;
  stdDev: number;
  variance: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  rawData: number[];
}

interface IContributionReport {
  name: string;
  value: number;
}

interface IDailyIntake {
  date: string;
  value: number;
  userId?: string;
}

// ============================================================================
//REGION: CONFIGURATION & CONSTANTS
// ============================================================================

const dbFolderPath = path.join(app.getPath('userData'), 'database');
const dbPath = path.join(dbFolderPath, 'foodcalc.db');

const nutrientColumnNames: string[] = [
  'Energy_kcal', 'Water_g', 'Protein_g', 'Fat_g', 'Carbohydrate_g',
  'SaturatedFat_g', 'MonounsaturatedFat_g', 'PolyunsaturatedFat_g', 'Cholesterol_mg',
  'Fiber_g', 'Sugar_g', 'Ash_g',
  'Calcium_mg', 'Phosphorus_mg', 'Iron_mg', 'Sodium_mg', 'Potassium_mg',
  'Magnesium_mg', 'Zinc_mg', 'Copper_mg', 'Manganese_mg',
  'VitaminA_ER', 'Thiamin_mg', 'Riboflavin_mg', 'Niacin_mg',
  'PantothenicAcid_mg', 'VitaminB6_mg', 'Folate_mcg', 'VitaminB12_mcg', 'VitaminC_mg'
];

const nutrientTotalKeys: (keyof INutrientTotals)[] = nutrientColumnNames.map(col => `total${col}`) as (keyof INutrientTotals)[];

// ============================================================================
//REGION: DATABASE INITIALIZATION
// ============================================================================

function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(dbFolderPath)) {
      fs.mkdirSync(dbFolderPath, { recursive: true });
      console.log('Created database directory:', dbFolderPath);
    }

    const db: Database = new (sqlite3.verbose().Database)(dbPath, (err: Error | null) => {
      if (err) {
        console.error('Error opening database', err.message);
        return reject(err);
      }
      console.log('Database connected successfully at', dbPath);
    });

    db.run('PRAGMA foreign_keys = ON;', (err: Error | null) => {
      if (err) return reject(err);
      console.log("Foreign key support enabled.");
    });

    db.serialize(() => {
      // 1. Table: FoodDatabases
      db.run(`
        CREATE TABLE IF NOT EXISTS FoodDatabases (
          DatabaseID INTEGER PRIMARY KEY AUTOINCREMENT,
          DatabaseName TEXT NOT NULL UNIQUE
        );
      `, (err) => {
        if (err) return reject(err);
        
        // Insert Default DB
        db.run(`INSERT OR IGNORE INTO FoodDatabases (DatabaseName) VALUES (?)`, ['Default'], (insertErr) => {
          if (insertErr) return reject(insertErr);

          // 2. Table: Foods
          db.run(`
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
          `, (foodsErr) => {
            if (foodsErr) return reject(foodsErr);

            // 3. Table: RecipeIngredients
            db.run(`
              CREATE TABLE IF NOT EXISTS RecipeIngredients (
                RecipeIngredientID INTEGER PRIMARY KEY AUTOINCREMENT,
                ParentFoodID INTEGER NOT NULL,
                IngredientFoodID INTEGER NOT NULL,
                IngredientGrams REAL NOT NULL,
                FOREIGN KEY (ParentFoodID) REFERENCES Foods(FoodID) ON DELETE CASCADE,
                FOREIGN KEY (IngredientFoodID) REFERENCES Foods(FoodID) ON DELETE CASCADE
              );
            `, (recipeErr) => {
              if (recipeErr) return reject(recipeErr);

              // 4. Table: ConsumptionLog
              db.run(`
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
              `, (logErr) => {
                if (logErr) return reject(logErr);

                // 5. Table: RDIProfiles
                db.run(`
                  CREATE TABLE IF NOT EXISTS RDIProfiles (
                    ProfileID INTEGER PRIMARY KEY AUTOINCREMENT,
                    ProfileName TEXT NOT NULL UNIQUE,
                    Description TEXT,
                    Source TEXT
                  );
                `, (rdiProfErr) => {
                  if (rdiProfErr) return reject(rdiProfErr);

                  // 6. Table: RDIValues
                  db.run(`
                    CREATE TABLE IF NOT EXISTS RDIValues (
                      ValueID INTEGER PRIMARY KEY AUTOINCREMENT,
                      ProfileID INTEGER NOT NULL,
                      NutrientKey TEXT NOT NULL,
                      RecommendedValue REAL NOT NULL,
                      Type TEXT NOT NULL DEFAULT 'RDA',
                      FOREIGN KEY (ProfileID) REFERENCES RDIProfiles(ProfileID) ON DELETE CASCADE,
                      UNIQUE(ProfileID, NutrientKey, Type)
                    );
                  `, (rdiValErr) => {
                    if (rdiValErr) return reject(rdiValErr);

                    // 7. Table: SubjectProfiles
                    db.run(`
                      CREATE TABLE IF NOT EXISTS SubjectProfiles (
                        SubjectID INTEGER PRIMARY KEY AUTOINCREMENT,
                        UserID TEXT NOT NULL UNIQUE,
                        Name TEXT,
                        BirthDate TEXT,
                        Gender TEXT,
                        PhysioState TEXT,
                        Weight_kg REAL,
                        Height_cm REAL,
                        Notes TEXT
                      );
                    `, (subjErr) => {
                      if (subjErr) return reject(subjErr);

                      // Insert Default RDI Profile Data
                      const defaultProfileName = 'RIEN Colombia (Hombres 19-50a)';
                      db.run(`INSERT OR IGNORE INTO RDIProfiles (ProfileID, ProfileName, Source) VALUES (1, ?, 'Res. 3803 de 2016')`, [defaultProfileName], (insertProfileErr) => {
                        if (!insertProfileErr) {
                          const defaultValues = [
                            ['Energy_kcal', 2400, 'RDA'], ['Protein_g', 56, 'RDA'], ['Carbohydrate_g', 130, 'RDA'], ['Fiber_g', 38, 'AI'],
                            ['Calcium_mg', 1000, 'RDA'], ['Calcium_mg', 2500, 'UL'], ['Iron_mg', 8, 'RDA'], ['Iron_mg', 45, 'UL'],
                            ['Sodium_mg', 1500, 'AI'], ['Sodium_mg', 2300, 'UL'], ['Zinc_mg', 11, 'RDA'], ['Zinc_mg', 40, 'UL'],
                            ['Magnesium_mg', 400, 'RDA'], ['VitaminC_mg', 90, 'RDA'], ['VitaminC_mg', 2000, 'UL'],
                            ['VitaminA_ER', 900, 'RDA'], ['VitaminA_ER', 3000, 'UL'], ['VitaminB12_mcg', 2.4, 'RDA'],
                            ['Folate_mcg', 400, 'RDA'], ['Folate_mcg', 1000, 'UL']
                          ];
                          const stmt = db.prepare(`INSERT OR IGNORE INTO RDIValues (ProfileID, NutrientKey, RecommendedValue, Type) VALUES (1, ?, ?, ?)`);
                          defaultValues.forEach(val => stmt.run(val));
                          stmt.finalize();
                        }

                        // 8. Table: SubjectMeasurements
                        db.run(`
                          CREATE TABLE IF NOT EXISTS SubjectMeasurements (
                            MeasurementID INTEGER PRIMARY KEY AUTOINCREMENT,
                            UserID TEXT NOT NULL,
                            Date TEXT NOT NULL,
                            Weight_kg REAL,
                            Height_cm REAL,
                            PhysioState TEXT,
                            Notes TEXT,
                            FOREIGN KEY (UserID) REFERENCES SubjectProfiles(UserID) ON DELETE CASCADE
                          );
                        `, (measErr) => {
                          if (measErr) return reject(measErr);
                          
                          db.close((closeErr) => {
                            if (closeErr) return reject(closeErr);
                            console.log('Database initialization complete.');
                            resolve();
                          });
                        }); // End SubjectMeasurements
                      }); // End Default Profile
                    }); // End SubjectProfiles
                  }); // End RDIValues
                }); // End RDIProfiles
              }); // End ConsumptionLog
            }); // End RecipeIngredients
          }); // End Foods
        }); // End Insert Default DB
      }); // End FoodDatabases
    }); // End Serialize
  });
}

// ============================================================================
//REGION: APP LIFECYCLE
// ============================================================================

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

app.whenReady().then(async () => {
  try {
    await initializeDatabase();
    console.log("--- Database Initialization Complete. Creating Window. ---");
    createWindow();
  } catch (error) {
    console.error("!!! FATAL: Database failed to initialize. App will not start. !!!", error);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// ============================================================================
//REGION: HELPER FUNCTIONS
// ============================================================================

async function getNutrientsForFoodRecursive(
  foodId: number,
  gramsConsumed: number,
  referenceDbId: number,
  db: Database,
  depth: number = 0
): Promise<INutrientTotals> {
  const totals: INutrientTotals = {} as INutrientTotals;
  nutrientTotalKeys.forEach(key => { totals[key] = 0; });

  if (depth > 10) {
    console.error(`[Calc] Recursion limit reached for FoodID ${foodId}. Aborting.`);
    return totals;
  }

  const foodDetails = await new Promise<any>((resolve, reject) => {
    db.get(
      `SELECT FoodID, FoodType, RecipeYieldGrams, ${nutrientColumnNames.join(', ')} FROM Foods WHERE FoodID = ? AND DatabaseID = ?`,
      [foodId, referenceDbId],
      (err, row) => (err ? reject(err) : resolve(row))
    );
  });

  if (!foodDetails) {
    return totals;
  }

  if (foodDetails.FoodType === 'simple') {
    const factor = gramsConsumed / 100.0;
    nutrientColumnNames.forEach((colName, index) => {
      const nutrientValue = foodDetails[colName];
      if (typeof nutrientValue === 'number' && !isNaN(nutrientValue)) {
        const totalKey = nutrientTotalKeys[index];
        totals[totalKey] += nutrientValue * factor;
      }
    });
  } else {
    const yieldGrams = foodDetails.RecipeYieldGrams;
    if (!yieldGrams || yieldGrams <= 0) {
      return totals;
    }

    const scaleFactor = gramsConsumed / yieldGrams;
    const ingredients = await new Promise<any[]>((resolve, reject) => {
      db.all(
        `SELECT IngredientFoodID, IngredientGrams FROM RecipeIngredients WHERE ParentFoodID = ?`,
        [foodId],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });

    for (const ingredient of ingredients) {
      const ingredientGrams = ingredient.IngredientGrams * scaleFactor;
      const ingredientNutrients = await getNutrientsForFoodRecursive(
        ingredient.IngredientFoodID,
        ingredientGrams,
        referenceDbId,
        db,
        depth + 1
      );

      nutrientTotalKeys.forEach(key => {
        totals[key] += ingredientNutrients[key];
      });
    }
  }
  return totals;
}

async function getBaseAnalyticsData(
  userIds: string[],
  startDate: string,
  endDate: string,
  referenceDbId: number,
  nutrient: string
): Promise<{ [userId: string]: { [date: string]: number } }> {
  const db: Database = await new Promise((resolve, reject) => {
    const dbInstance = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) reject(`Database connection error: ${err.message}`);
      else resolve(dbInstance);
    });
  });

  if (!nutrientColumnNames.includes(nutrient)) {
    db.close();
    return Promise.reject(new Error(`Invalid nutrient column name: ${nutrient}`));
  }

  const nutrientTotalKey = `total${nutrient}` as keyof INutrientTotals;
  const placeholders = userIds.map(() => '?').join(',');

  try {
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

    const results: { [userId: string]: { [date: string]: number } } = {};
    userIds.forEach(id => { results[id] = {}; });

    for (const entry of logEntries) {
      const nutrients = await getNutrientsForFoodRecursive(
        entry.FoodID,
        entry.Grams,
        referenceDbId,
        db
      );
      const nutrientValue = nutrients[nutrientTotalKey];

      if (!results[entry.UserID][entry.ConsumptionDate]) {
        results[entry.UserID][entry.ConsumptionDate] = 0;
      }
      results[entry.UserID][entry.ConsumptionDate] += nutrientValue;
    }

    db.close();
    return results;

  } catch (error) {
    if (db) db.close();
    throw error;
  }
}

async function calculateIntakeInternal(
    userId: string,
    startDate: string,
    endDate: string,
    referenceDbId: number
): Promise<INutrientTotals> {
    const userIds = userId.split(',').map(id => id.trim()).filter(id => id.length > 0);
    if (userIds.length === 0) throw new Error('UserID(s) are required.');
    
    const db: Database = await new Promise((resolve, reject) => {
        const dbInstance = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) reject(`Database connection error: ${err.message}`);
            else resolve(dbInstance);
        });
    });

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
            db.all(selectLogQuery, params, (logErr, logEntries) => {
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

// ============================================================================
//REGION: IPC HANDLERS - FOOD LIBRARY
// ============================================================================

ipcMain.handle('add-food', async (event, foodName: string, databaseId: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!databaseId || databaseId <= 0) return reject('Invalid Database ID provided.');
        const trimmedFoodName = foodName?.trim();
        if (!trimmedFoodName) return reject('Food name cannot be empty.');
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => { if (err) return reject(`DB error: ${err.message}`); });
        
        const insertQuery = `INSERT INTO Foods (Name, DatabaseID) VALUES (?, ?)`;
        db.run(insertQuery, [trimmedFoodName, databaseId], function (this: sqlite3.RunResult, err) {
            db.close();
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) reject(`Food named "${trimmedFoodName}" already exists.`);
                else reject(`Error inserting food: ${err.message}`);
            } else {
                resolve('Food added successfully');
            }
        });
    });
});

ipcMain.handle('get-foods', async (): Promise<{ FoodID: number; Name: string; DatabaseName: string }[]> => {
    return new Promise((resolve, reject) => {
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => { if (err) return reject(`DB error: ${err.message}`); });
        const selectQuery = `
            SELECT f.FoodID, f.Name, d.DatabaseName
            FROM Foods f
            JOIN FoodDatabases d ON f.DatabaseID = d.DatabaseID
            ORDER BY d.DatabaseName ASC, f.Name ASC
        `;
        db.all(selectQuery, [], (err, rows: any[]) => {
            db.close();
            if (err) reject(`Error fetching foods: ${err.message}`);
            else resolve(rows);
        });
    });
});

ipcMain.handle('get-food-details', async (event, foodId: number): Promise<IFoodDetails | null> => {
    return new Promise((resolve, reject) => {
        if (!foodId || foodId <= 0) return reject('Invalid Food ID provided.');
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => { if (err) return reject(`DB error: ${err.message}`); });
        db.get(`SELECT * FROM Foods WHERE FoodID = ?`, [foodId], (err, row: IFoodDetails) => {
            db.close();
            if (err) reject(`Error fetching food details: ${err.message}`);
            else resolve(row || null);
        });
    });
});

ipcMain.handle('get-recipe-ingredients', async (event, foodId: number): Promise<IRecipeIngredient[]> => {
  return new Promise((resolve, reject) => {
    if (!foodId || foodId <= 0) return reject('Invalid Food ID provided.');
    const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => { if (err) return reject(`DB error: ${err.message}`); });
    
    const query = `
      SELECT ri.IngredientFoodID AS foodId, f.Name AS name, d.DatabaseName AS dbName, ri.IngredientGrams AS grams
      FROM RecipeIngredients ri
      JOIN Foods f ON ri.IngredientFoodID = f.FoodID
      JOIN FoodDatabases d ON f.DatabaseID = d.DatabaseID
      WHERE ri.ParentFoodID = ?
      ORDER BY ri.RecipeIngredientID ASC
    `;
    db.all(query, [foodId], (err, rows: any[]) => {
      db.close();
      if (err) return reject(`Error fetching ingredients: ${err.message}`);
      
      const ingredients: IRecipeIngredient[] = rows.map(row => ({
        foodId: row.foodId,
        name: `${row.name} (${row.dbName})`,
        grams: row.grams
      }));
      resolve(ingredients);
    });
  });
});

ipcMain.handle('update-food-details', async (event, foodData: IFoodDetails): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!foodData || typeof foodData.FoodID !== 'number' || foodData.FoodID <= 0) return reject('Invalid Food ID.');
    const trimmedName = foodData.Name?.trim();
    if (!trimmedName) return reject('Food name cannot be empty.');

    const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => { if (err) return reject(`DB error: ${err.message}`); });

    db.serialize(() => {
      db.run('BEGIN TRANSACTION;', (err) => { if (err) { db.close(); return reject(err.message); } });

      let recipeYield: number | null = null;
      if (foodData.FoodType === 'recipe' && foodData.Ingredients && foodData.Ingredients.length > 0) {
        recipeYield = foodData.Ingredients.reduce((sum, ing) => sum + ing.grams, 0);
      }

      const fieldsToUpdate: string[] = ['Name = ?', 'FoodType = ?', 'RecipeYieldGrams = ?'];
      const values: (string | number | null)[] = [trimmedName, foodData.FoodType || 'simple', recipeYield];

      type NutrientKey = Exclude<keyof IFoodDetails, 'FoodID' | 'DatabaseID' | 'Name' | 'FoodType' | 'Ingredients'>;
      const nutrientFields: NutrientKey[] = nutrientColumnNames as NutrientKey[];

      nutrientFields.forEach(field => {
        if (foodData.hasOwnProperty(field)) {
          fieldsToUpdate.push(`${field} = ?`);
          const value = foodData[field]; 
          values.push(value === undefined ? null : value);
        }
      });
      values.push(foodData.FoodID);

      const updateQuery = `UPDATE Foods SET ${fieldsToUpdate.join(', ')} WHERE FoodID = ?`;
      
      db.run(updateQuery, values, function(this: sqlite3.RunResult, err) {
        if (err || this.changes === 0) {
          db.run('ROLLBACK;'); db.close();
          return reject(err ? `Update failed: ${err.message}` : `Food not found.`);
        }

        db.run(`DELETE FROM RecipeIngredients WHERE ParentFoodID = ?`, [foodData.FoodID], (delErr) => {
          if (delErr) { db.run('ROLLBACK;'); db.close(); return reject(delErr.message); }

          if (foodData.FoodType === 'recipe' && foodData.Ingredients && foodData.Ingredients.length > 0) {
            const insertStmt = db.prepare(`INSERT INTO RecipeIngredients (ParentFoodID, IngredientFoodID, IngredientGrams) VALUES (?, ?, ?)`);
            let processed = 0;
            
            foodData.Ingredients.forEach(ing => {
              insertStmt.run([foodData.FoodID, ing.foodId, ing.grams], (insErr: Error) => {
                processed++;
                if (processed === foodData.Ingredients!.length) {
                  insertStmt.finalize((finErr) => {
                    if (finErr) { db.run('ROLLBACK;'); db.close(); return reject(finErr.message); }
                    db.run('COMMIT;', (comErr) => { db.close(); resolve(comErr ? comErr.message : 'Updated successfully'); });
                  });
                }
              });
            });
          } else {
            db.run('COMMIT;', (comErr) => { db.close(); resolve(comErr ? comErr.message : 'Updated successfully'); });
          }
        });
      });
    });
  });
});

ipcMain.handle('delete-food', async (event, foodId: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!foodId || foodId <= 0) return reject('Invalid Food ID.');
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => { if (err) return reject(`DB error: ${err.message}`); });
        db.run('PRAGMA foreign_keys = ON;', (err) => {
             if (err) { db.close(); return reject(err.message); }
            db.run(`DELETE FROM Foods WHERE FoodID = ?`, [foodId], function (this: sqlite3.RunResult, delErr) {
                db.close();
                if (delErr) reject(delErr.message);
                else if (this.changes === 0) reject(`Food ID ${foodId} not found`);
                else resolve('Food deleted successfully');
            });
        });
    });
});

ipcMain.handle('search-foods', async (event, searchTerm: string, referenceDbId: number): Promise<ISearchFoodResult[]> => {
  return new Promise((resolve, reject) => {
    const trimmedSearch = searchTerm?.trim();
    if (!trimmedSearch || !referenceDbId || referenceDbId <= 0) return resolve([]);
    const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => { if (err) return reject(err.message); });
    
    const searchQuery = `SELECT FoodID, Name, FoodType, RecipeYieldGrams FROM Foods WHERE DatabaseID = ? AND Name LIKE ? ORDER BY Name ASC LIMIT 20`;
    db.all(searchQuery, [referenceDbId, `%${trimmedSearch}%`], (err, rows: any[]) => {
        db.close();
        if (err) reject(err.message);
        else resolve(rows); 
    });
  });
});

ipcMain.handle('search-all-foods', async (event, searchTerm: string): Promise<ISearchFoodResult[]> => {
  return new Promise((resolve, reject) => {
    const trimmedSearch = searchTerm?.trim();
    if (!trimmedSearch) return resolve([]);
    const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => { if (err) return reject(err.message); });

    const searchQuery = `
      SELECT f.FoodID, f.Name, d.DatabaseName, f.FoodType, f.RecipeYieldGrams
      FROM Foods f
      JOIN FoodDatabases d ON f.DatabaseID = d.DatabaseID
      WHERE f.Name LIKE ?
      ORDER BY f.Name ASC LIMIT 20
    `;
    db.all(searchQuery, [`%${trimmedSearch}%`], (err, rows: any[]) => {
      db.close();
      if (err) reject(err.message);
      else {
        const formattedRows: ISearchFoodResult[] = rows.map(row => ({
          FoodID: row.FoodID,
          Name: `${row.Name} (${row.DatabaseName})`,
          FoodType: row.FoodType,
          RecipeYieldGrams: row.RecipeYieldGrams
        }));
        resolve(formattedRows);
      }
    });
  });
});

// ============================================================================
//REGION: IPC HANDLERS - DATABASES
// ============================================================================

ipcMain.handle('get-databases', async (): Promise<IDatabaseInfo[]> => {
    return new Promise((resolve, reject) => {
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => { if (err) return reject(err.message); });
        db.all(`SELECT DatabaseID, DatabaseName FROM FoodDatabases ORDER BY DatabaseName ASC`, [], (err, rows: IDatabaseInfo[]) => {
            db.close();
            if (err) reject(err.message); else resolve(rows);
        });
    });
});

ipcMain.handle('add-database', async (event, dbName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const trimmedName = dbName?.trim();
        if (!trimmedName) return reject('Database name cannot be empty.');
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => { if (err) return reject(err.message); });

        db.run(`INSERT INTO FoodDatabases (DatabaseName) VALUES (?)`, [trimmedName], function (this: sqlite3.RunResult, err) {
            db.close();
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) reject(`Database "${trimmedName}" already exists.`);
                else reject(err.message);
            } else {
                resolve('Database added successfully');
            }
        });
    });
});

ipcMain.handle('delete-database', async (event, databaseId: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (databaseId === 1) return reject('Cannot delete the "Default" database.');
        if (!databaseId || databaseId <= 0) return reject('Invalid Database ID.');
        
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => { if (err) return reject(err.message); });
        db.run('PRAGMA foreign_keys = ON;', (err) => {
            if (err) { db.close(); return reject(err.message); }
            db.run(`DELETE FROM FoodDatabases WHERE DatabaseID = ?`, [databaseId], function (this: sqlite3.RunResult, delErr) {
                db.close();
                if (delErr) reject(delErr.message);
                else if (this.changes === 0) reject(`Database ID ${databaseId} not found.`);
                else resolve('Database deleted successfully.');
            });
        });
    });
});

ipcMain.handle('purge-food-library', async (event, databaseId: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!databaseId || databaseId <= 0) return reject('Invalid Database ID.');
    if (databaseId === 1) console.warn('[IPC] Purgando base de datos Default.');

    const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => { if (err) return reject(err.message); });

    db.run('PRAGMA foreign_keys = ON;', (err) => {
      if (err) { db.close(); return reject(err.message); }
      
      db.run(`DELETE FROM Foods WHERE DatabaseID = ?`, [databaseId], function (this: sqlite3.RunResult, delErr) {
        db.close();
        if (delErr) reject(`Error purging: ${delErr.message}`);
        else if (this.changes === 0) resolve('No foods found to delete.');
        else resolve(`Purged ${this.changes} entries.`);
      });
    });
  });
});

// ============================================================================
//REGION: IPC HANDLERS - IMPORTS (EXCEL/CSV)
// ============================================================================

ipcMain.handle('import-excel', async (event, databaseId: number): Promise<string> => {
    if (!databaseId || databaseId <= 0) return Promise.reject('Invalid Database ID.');
    
    const result = await dialog.showOpenDialog({
        title: 'Select Excel File', properties: ['openFile'], filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
     });
    if (result.canceled || result.filePaths.length === 0) return 'Import cancelled.';
    
    const workbook = new ExcelJS.Workbook();
    try { await workbook.xlsx.readFile(result.filePaths[0]); }
    catch (error: any) { return `Error reading file: ${error.message}`; }
    
    const worksheet = workbook.worksheets[0];
    if (!worksheet) return 'Error: No worksheet found.';
    
    let importedCount = 0;
    const errors: string[] = [];
    let db: Database | null = null;

    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
            if (err) return reject(err.message);
            if (!db) return reject("DB initialization failed.");
            
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
            
            const stmt = db.prepare(insertQuery, (err) => {
                if (err || !db) { db?.close(); return reject(err?.message); }
                const currentDb = db;

                currentDb.run('BEGIN TRANSACTION;', (beginErr) => {
                    if (beginErr) { stmt.finalize(); currentDb.close(); return reject("Failed to start transaction."); }
                    
                    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                        if (rowNumber < 3) return;
                        const values: (string | number | null)[] = [];
                        let validRow = true;
                        let foodName = '';
                        
                        dbColumnMappings.forEach(mapping => {
                            const cellValue = row.getCell(mapping.excelCol).value;
                            if (mapping.dbCol === 'Name') {
                                foodName = cellValue?.toString().trim() || '';
                                if (!foodName) { validRow = false; if(errors.length < 10) errors.push(`Row ${rowNumber}: Missing Name.`); }
                                values.push(foodName);
                            } else {
                                if (cellValue == null) values.push(null);
                                else {
                                    const num = parseFloat(cellValue.toString().replace(',', '.'));
                                    values.push(isNaN(num) ? null : num);
                                }
                            }
                        });
                        values.push(databaseId);
                        
                        if (validRow && foodName) {
                            stmt.run(values, (runErr: Error) => {
                                if (runErr && errors.length < 10) errors.push(`Row ${rowNumber}: ${runErr.message}`);
                                else importedCount++;
                            });
                        }
                    });

                    stmt.finalize(() => {
                        const action = errors.length > 0 ? 'ROLLBACK' : 'COMMIT';
                        currentDb.run(`${action};`, (commitErr) => {
                            currentDb.close();
                            if (commitErr) reject(commitErr.message);
                            else if (errors.length > 0) resolve(`Finished with errors. ${action}. Errors: ${errors.slice(0,5).join(', ')}`);
                            else resolve(`Imported ${importedCount} foods.`);
                        });
                    });
                });
            });
        });
    });
});

ipcMain.handle('import-csv', async (event, databaseId: number): Promise<string> => {
    if (!databaseId || databaseId <= 0) return Promise.reject('Invalid Database ID.');
    
    const result = await dialog.showOpenDialog({
        title: 'Select CSV File', properties: ['openFile'], filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    });
    if (result.canceled || result.filePaths.length === 0) return 'Import cancelled.';
    
    const filePath = result.filePaths[0];
    let importedCount = 0;
    const errors: string[] = [];
    let db: Database | null = null;

    const csvColumns: (keyof IFoodDetails | 'skip')[] = [
        'Name', 'Energy_kcal', 'Water_g', 'Protein_g', 'Fat_g',
        'SaturatedFat_g', 'MonounsaturatedFat_g', 'PolyunsaturatedFat_g', 'Cholesterol_mg',
        'Carbohydrate_g', 'skip', 'Fiber_g', 'Ash_g', 'Calcium_mg', 'Phosphorus_mg', 'Iron_mg', 'Sodium_mg',
        'Potassium_mg', 'Magnesium_mg', 'Zinc_mg', 'Copper_mg', 'Manganese_mg', 'skip',
        'VitaminA_ER', 'Thiamin_mg', 'Riboflavin_mg', 'Niacin_mg',
        'PantothenicAcid_mg', 'VitaminB6_mg', 'Folate_mcg', 'VitaminB12_mcg', 'VitaminC_mg'
    ];
    
    const dbColumns = csvColumns.filter(col => col !== 'skip');
    dbColumns.push('DatabaseID');
    const placeholders = dbColumns.map(() => '?').join(', ');
    const insertQuery = `INSERT OR IGNORE INTO Foods (${dbColumns.join(', ')}) VALUES (${placeholders})`;

    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
            if (err || !db) return reject(err?.message || "DB error");
            
            const currentDb = db;
            const stmt = currentDb.prepare(insertQuery, (prepErr) => {
                if (prepErr) { currentDb.close(); return reject(prepErr.message); }

                currentDb.run('BEGIN TRANSACTION;', (beginErr) => {
                    if (beginErr) { stmt.finalize(); currentDb.close(); return reject("Transaction failed"); }

                    const parser = fs.createReadStream(filePath).pipe(parse({
                        delimiter: [',', ';'], from_line: 3, trim: true,
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
                                    if (cellValue == null) values.push(null);
                                    else {
                                        const num = parseFloat(cellValue.toString().replace(',', '.'));
                                        values.push(isNaN(num) ? null : num);
                                    }
                                }
                            });

                            if (!foodName) { if (errors.length < 10) errors.push(`Row: Missing Name`); return; }
                            values.push(databaseId);

                            stmt.run(values, (runErr: Error) => {
                                if (runErr && errors.length < 10) errors.push(`Insert error: ${runErr.message}`);
                                else importedCount++;
                            });
                        } catch (e: any) { if (errors.length < 10) errors.push(e.message); }
                    });

                    parser.on('end', () => {
                        stmt.finalize(() => {
                            const action = errors.length > 0 ? 'ROLLBACK' : 'COMMIT';
                            currentDb.run(`${action};`, () => {
                                currentDb.close();
                                if (errors.length > 0) resolve(`Import finished with errors. ${action}.`);
                                else resolve(`Successfully imported ${importedCount} foods.`);
                            });
                        });
                    });
                    
                    parser.on('error', (err) => {
                        stmt.finalize(); currentDb.run('ROLLBACK;'); currentDb.close(); reject(err.message);
                    });
                });
            });
        });
    });
});

// ============================================================================
//REGION: IPC HANDLERS - CONSUMPTION LOG
// ============================================================================

ipcMain.handle('add-log-entry', async (event, logData: INewLogEntryData): Promise<string> => {
     return new Promise((resolve, reject) => {
        if (!logData) return reject('No log data provided.');
        const { userId, consumptionDate: date, foodId, referenceDatabaseId: refDbId, grams, mealType } = logData;
        
        if (!userId?.trim()) return reject('UserID required.');
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return reject('Invalid date.');
        if (typeof foodId !== 'number' || foodId <= 0) return reject('Invalid Food ID.');
        if (typeof refDbId !== 'number' || refDbId <= 0) return reject('Invalid Reference DB ID.');
        if (typeof grams !== 'number' || isNaN(grams) || grams <= 0) return reject('Grams must be positive.');
        
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => { if (err) return reject(err.message); });
        const insertQuery = `INSERT INTO ConsumptionLog (UserID, ConsumptionDate, MealType, FoodID, ReferenceDatabaseID, Grams) VALUES (?, ?, ?, ?, ?, ?)`;
        
        db.run(insertQuery, [userId.trim(), date, mealType || null, foodId, refDbId, grams], function (this: sqlite3.RunResult, err) {
            db.close();
            if (err) reject(`Error inserting log: ${err.message}`);
            else resolve('Log entry added');
        });
    });
});

ipcMain.handle('get-log-entries', async (event, userId: string, date: string): Promise<ILogEntry[]> => {
     return new Promise((resolve, reject) => {
        const trimmedUserId = userId?.trim();
        if (!trimmedUserId || !date) return reject('UserID and Date required.');
        
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => { if (err) return reject(err.message); });
        const selectQuery = `
            SELECT cl.*, f.Name AS FoodName, fd.DatabaseName AS ReferenceDatabaseName 
            FROM ConsumptionLog cl 
            JOIN Foods f ON cl.FoodID = f.FoodID 
            JOIN FoodDatabases fd ON cl.ReferenceDatabaseID = fd.DatabaseID 
            WHERE cl.UserID = ? AND cl.ConsumptionDate = ? 
            ORDER BY cl.Timestamp ASC
        `;
        db.all(selectQuery, [trimmedUserId, date], (err, rows: ILogEntry[]) => {
            db.close();
            if (err) reject(err.message);
            else resolve(rows.map(row => ({ ...row, MealType: row.MealType ?? undefined })));
        });
    });
});

ipcMain.handle('delete-log-entry', async (event, logId: number): Promise<string> => {
     return new Promise((resolve, reject) => {
        if (!logId || logId <= 0) return reject('Invalid Log ID.');
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => { if (err) return reject(err.message); });
        
        db.run(`DELETE FROM ConsumptionLog WHERE LogID = ?`, [logId], function(this: sqlite3.RunResult, err) {
            db.close();
            if (err) reject(err.message);
            else if (this.changes === 0) reject(`Log ID ${logId} not found.`);
            else resolve('Log entry deleted');
        });
    });
});

ipcMain.handle('delete-all-logs', async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => { if (err) return reject(err.message); });
    db.run(`DELETE FROM ConsumptionLog`, [], function (this: sqlite3.RunResult, err) {
      db.close();
      if (err) reject(err.message);
      else resolve(`Deleted ${this.changes} log entries.`);
    });
  });
});

ipcMain.handle('get-all-logs', async (): Promise<ILogEntry[]> => {
  return new Promise((resolve, reject) => {
    const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => { if (err) return reject(err.message); });
    const selectQuery = `
      SELECT cl.*, f.Name AS FoodName, fd.DatabaseName AS ReferenceDatabaseName 
      FROM ConsumptionLog cl 
      JOIN Foods f ON cl.FoodID = f.FoodID 
      JOIN FoodDatabases fd ON cl.ReferenceDatabaseID = fd.DatabaseID 
      ORDER BY cl.ConsumptionDate DESC, cl.Timestamp DESC
    `;
    db.all(selectQuery, [], (err, rows: ILogEntry[]) => {
      db.close();
      if (err) reject(err.message);
      else resolve(rows.map(row => ({ ...row, MealType: row.MealType ?? undefined })));
    });
  });
});

ipcMain.handle('edit-log-entry', async (event, logId: number, newGrams: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!logId || logId <= 0) return reject('Invalid Log ID.');
        if (newGrams <= 0) return reject('Grams must be positive.');
        
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => { if (err) return reject(err.message); });
        db.run(`UPDATE ConsumptionLog SET Grams = ? WHERE LogID = ?`, [newGrams, logId], function (this: sqlite3.RunResult, err) {
            db.close();
            if (err) reject(err.message);
            else if (this.changes === 0) reject(`Log ID ${logId} not found.`);
            else resolve('Updated successfully.');
        });
    });
});

ipcMain.handle('get-unique-user-ids', async (): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => { if (err) return reject(err.message); });
        db.all(`SELECT DISTINCT UserID FROM ConsumptionLog ORDER BY UserID ASC`, [], (err, rows: { UserID: string }[]) => {
            db.close();
            if (err) reject(err.message); else resolve(rows.map(r => r.UserID)); 
        });
    });
});

// --- Log Import Handlers (Excel/CSV) ---

ipcMain.handle('import-consumption-log', async (): Promise<{ message: string, firstEntry?: { userId: string, date: string } }> => {
    const result = await dialog.showOpenDialog({
        title: 'Select Log Excel', properties: ['openFile'], filters: [{ name: 'Excel', extensions: ['xlsx'] }]
    });
    if (result.canceled || !result.filePaths.length) return { message: 'Import cancelled.' };

    const filePath = result.filePaths[0];
    const dbLookupMap = new Map<string, number>();
    const foodLookupMap = new Map<string, number>();
    let importedCount = 0, skippedCount = 0;
    const errors: string[] = [];
    let db: Database | null = null;
    let firstEntry: { userId: string, date: string } | undefined = undefined;

    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
            if (err || !db) return reject(err?.message || 'DB error');
            const currentDb = db;

            currentDb.all(`SELECT DatabaseID, DatabaseName FROM FoodDatabases`, [], (dbErr, dbs: IDatabaseInfo[]) => {
                if (dbErr) { currentDb.close(); return reject(dbErr.message); }
                dbs.forEach(x => dbLookupMap.set(x.DatabaseName.toLowerCase().trim(), x.DatabaseID));

                currentDb.all(`SELECT FoodID, Name, DatabaseID FROM Foods`, [], (foodErr, foods: any[]) => {
                    if (foodErr) { currentDb.close(); return reject(foodErr.message); }
                    foods.forEach(x => foodLookupMap.set(`${x.Name.toLowerCase().trim()}-${x.DatabaseID}`, x.FoodID));

                    const stmt = currentDb.prepare(`INSERT INTO ConsumptionLog (UserID, ConsumptionDate, FoodID, ReferenceDatabaseID, Grams, MealType) VALUES (?, ?, ?, ?, ?, ?)`);
                    
                    currentDb.run('BEGIN TRANSACTION;', async (beginErr) => {
                        if (beginErr) { stmt.finalize(); currentDb.close(); return reject("Transaction failed"); }

                        const workbook = new ExcelJS.Workbook();
                        try { await workbook.xlsx.readFile(filePath); } catch (e: any) { currentDb.close(); return reject(e.message); }
                        
                        const worksheet = workbook.worksheets[0];
                        if (!worksheet) { currentDb.close(); return reject('No worksheet.'); }

                        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                            if (rowNumber < 2) return;
                            try {
                                const userId = row.getCell('A').value?.toString().trim();
                                let dateVal = row.getCell('B').value;
                                let cDate: string | null = null;
                                if (dateVal instanceof Date) cDate = dateVal.toISOString().split('T')[0];
                                else if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal.trim())) cDate = dateVal.trim();
                                
                                const foodName = row.getCell('C').value?.toString().toLowerCase().trim();
                                const dbName = row.getCell('D').value?.toString().toLowerCase().trim();
                                const grams = parseFloat(row.getCell('E').value as string);
                                const mealType = row.getCell('F').value?.toString().trim() || null;

                                if (!userId || !cDate || !foodName || !dbName || isNaN(grams)) { skippedCount++; return; }

                                const dbId = dbLookupMap.get(dbName);
                                if (!dbId) { skippedCount++; return; }
                                const foodId = foodLookupMap.get(`${foodName}-${dbId}`);
                                if (!foodId) { skippedCount++; return; }

                                stmt.run([userId, cDate, foodId, dbId, grams, mealType], (runErr) => {
                                    if (runErr) { if (errors.length < 10) errors.push(runErr.message); skippedCount++; }
                                    else {
                                        importedCount++;
                                        if (!firstEntry) firstEntry = { userId, date: cDate! };
                                    }
                                });
                            } catch (e) { skippedCount++; }
                        });

                        stmt.finalize(() => {
                            const action = errors.length > 0 ? 'ROLLBACK' : 'COMMIT';
                            currentDb.run(`${action};`, () => {
                                currentDb.close();
                                if (errors.length > 0) resolve({ message: `Errors encountered. ${action}` });
                                else resolve({ message: `Imported ${importedCount} entries.`, firstEntry });
                            });
                        });
                    });
                });
            });
        });
    });
});

ipcMain.handle('import-consumption-log-csv', async (): Promise<{ message: string, firstEntry?: { userId: string, date: string } }> => {
    const result = await dialog.showOpenDialog({
        title: 'Select Log CSV', properties: ['openFile'], filters: [{ name: 'CSV', extensions: ['csv'] }]
    });
    if (result.canceled || !result.filePaths.length) return { message: 'Cancelled.' };
    const filePath = result.filePaths[0];

    const dbLookupMap = new Map<string, number>();
    const foodLookupMap = new Map<string, number>();
    let importedCount = 0, skippedCount = 0;
    const errors: string[] = [];
    let db: Database | null = null;
    let firstEntry: { userId: string, date: string } | undefined = undefined;

    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
            if (err || !db) return reject(err?.message || 'DB error');
            const currentDb = db;

            currentDb.all(`SELECT DatabaseID, DatabaseName FROM FoodDatabases`, [], (dbErr, dbs: any[]) => {
                if (dbErr) { currentDb.close(); return reject(dbErr.message); }
                dbs.forEach((x: any) => dbLookupMap.set(x.DatabaseName.toLowerCase().trim(), x.DatabaseID));

                currentDb.all(`SELECT FoodID, Name, DatabaseID FROM Foods`, [], (foodErr, foods: any[]) => {
                    if (foodErr) { currentDb.close(); return reject(foodErr.message); }
                    foods.forEach((x: any) => foodLookupMap.set(`${x.Name.toLowerCase().trim()}-${x.DatabaseID}`, x.FoodID));

                    const stmt = currentDb.prepare(`INSERT INTO ConsumptionLog (UserID, ConsumptionDate, FoodID, ReferenceDatabaseID, Grams, MealType) VALUES (?, ?, ?, ?, ?, ?)`);
                    
                    currentDb.run('BEGIN TRANSACTION;', (beginErr) => {
                        if (beginErr) { stmt.finalize(); currentDb.close(); return reject("Transaction failed"); }

                        const parser = fs.createReadStream(filePath).pipe(parse({
                            delimiter: [';'], from_line: 2, trim: true, columns: ['UserID', 'ConsumptionDate', 'FoodName', 'DBName', 'Grams', 'MealType'],
                            quote: '"', relax_quotes: true
                        }));

                        parser.on('data', (row: any) => {
                            try {
                                const userId = row.UserID?.trim();
                                const cDate = row.ConsumptionDate?.trim();
                                const foodName = row.FoodName?.toLowerCase().trim();
                                const dbName = row.DBName?.toLowerCase().trim();
                                const grams = parseFloat(row.Grams?.replace(',', '.'));
                                const mealType = row.MealType?.trim() || null;

                                if (!userId || !cDate || !foodName || !dbName || isNaN(grams)) { skippedCount++; return; }
                                
                                const dbId = dbLookupMap.get(dbName);
                                if (!dbId) { skippedCount++; return; }
                                const foodId = foodLookupMap.get(`${foodName}-${dbId}`);
                                if (!foodId) { skippedCount++; return; }

                                stmt.run([userId, cDate, foodId, dbId, grams, mealType], (runErr) => {
                                    if (runErr) { errors.push(runErr.message); skippedCount++; }
                                    else { importedCount++; if(!firstEntry) firstEntry = { userId, date: cDate }; }
                                });
                            } catch (e) { skippedCount++; }
                        });

                        parser.on('end', () => {
                            stmt.finalize(() => {
                                const action = errors.length > 0 ? 'ROLLBACK' : 'COMMIT';
                                currentDb.run(`${action};`, () => {
                                    currentDb.close();
                                    if (errors.length > 0) resolve({ message: `Errors encountered. ${action}` });
                                    else resolve({ message: `Imported ${importedCount} entries.`, firstEntry });
                                });
                            });
                        });
                        parser.on('error', (err) => { stmt.finalize(); currentDb.run('ROLLBACK;'); currentDb.close(); reject(err.message); });
                    });
                });
            });
        });
    });
});

// ============================================================================
//REGION: IPC HANDLERS - ANALYTICS & REPORTS
// ============================================================================

ipcMain.handle('get-statistical-report', async (event, userIds: string[], startDate: string, endDate: string, referenceDbId: number, nutrient: string): Promise<IStatisticalReport> => {
  const dailyDataByUser = await getBaseAnalyticsData(userIds, startDate, endDate, referenceDbId, nutrient);
  const userAverages: number[] = [];
  const rawDailyData: number[] = []; 

  for (const userId of Object.keys(dailyDataByUser)) {
      const dailyTotals = Object.values(dailyDataByUser[userId]);
      if (dailyTotals.length > 0) {
          const userTotal = dailyTotals.reduce((sum, val) => sum + val, 0);
          userAverages.push(userTotal / dailyTotals.length);
          rawDailyData.push(...dailyTotals);
      }
  }

  if (userAverages.length === 0) throw new Error("No data found.");

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
      rawData: rawDailyData 
  };
  return report;
});

ipcMain.handle('get-daily-intake-over-time', async (event, userIds: string[], startDate: string, endDate: string, referenceDbId: number, nutrient: string): Promise<IDailyIntake[][]> => {
    const dailyDataByUser = await getBaseAnalyticsData(userIds, startDate, endDate, referenceDbId, nutrient);
    const results: IDailyIntake[][] = [];
    
    for (const userId of userIds) {
        const userDataMap = dailyDataByUser[userId];
        if (userDataMap) {
            const userDailyIntake: IDailyIntake[] = Object.keys(userDataMap).map(date => ({
                date: date, value: userDataMap[date], userId: userId
            }));
            userDailyIntake.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            if (userDailyIntake.length > 0) results.push(userDailyIntake);
        }
    }
    return results;
});

ipcMain.handle('get-nutrient-contribution', async (event, userId: string, startDate: string, endDate: string, referenceDbId: number, nutrient: string): Promise<IContributionReport[]> => {
    if (!nutrientColumnNames.includes(nutrient)) return Promise.reject(new Error(`Invalid nutrient.`));
    const nutrientTotalKey = `total${nutrient}` as keyof INutrientTotals;
    
    const db: Database = await new Promise((resolve, reject) => {
      const dbInstance = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => err ? reject(err) : resolve(dbInstance));
    });

    try {
      const query = `SELECT cl.FoodID, cl.Grams, f.Name AS FoodName FROM ConsumptionLog cl JOIN Foods f ON cl.FoodID = f.FoodID WHERE cl.UserID = ? AND cl.ConsumptionDate BETWEEN ? AND ? AND cl.ReferenceDatabaseID = ?`;
      const logEntries: any[] = await new Promise((resolve, reject) => {
        db.all(query, [userId, startDate, endDate, referenceDbId], (err, rows) => err ? reject(err) : resolve(rows));
      });

      const contributionMap = new Map<string, number>();
      for (const entry of logEntries) {
        const nutrients = await getNutrientsForFoodRecursive(entry.FoodID, entry.Grams, referenceDbId, db);
        const val = nutrients[nutrientTotalKey];
        contributionMap.set(entry.FoodName, (contributionMap.get(entry.FoodName) || 0) + val);
      }
      db.close();

      return Array.from(contributionMap.entries())
        .map(([name, value]) => ({ name, value }))
        .filter(r => r.value > 0)
        .sort((a, b) => b.value - a.value);
    } catch (error) { if(db) db.close(); throw error; }
});

ipcMain.handle('get-meal-contribution', async (event, userId: string, startDate: string, endDate: string, referenceDbId: number, nutrient: string): Promise<IContributionReport[]> => {
    if (!nutrientColumnNames.includes(nutrient)) return Promise.reject(new Error(`Invalid nutrient.`));
    const nutrientTotalKey = `total${nutrient}` as keyof INutrientTotals;

    const db: Database = await new Promise((resolve, reject) => {
      const dbInstance = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => err ? reject(err) : resolve(dbInstance));
    });

    try {
      const query = `SELECT cl.FoodID, cl.Grams, COALESCE(cl.MealType, 'Uncategorized') AS MealName FROM ConsumptionLog cl WHERE cl.UserID = ? AND cl.ConsumptionDate BETWEEN ? AND ? AND cl.ReferenceDatabaseID = ?`;
      const logEntries: any[] = await new Promise((resolve, reject) => {
        db.all(query, [userId, startDate, endDate, referenceDbId], (err, rows) => err ? reject(err) : resolve(rows));
      });

      const contributionMap = new Map<string, number>();
      for (const entry of logEntries) {
        const nutrients = await getNutrientsForFoodRecursive(entry.FoodID, entry.Grams, referenceDbId, db);
        const val = nutrients[nutrientTotalKey];
        const mealKey = entry.MealName.toLowerCase();
        contributionMap.set(mealKey, (contributionMap.get(mealKey) || 0) + val);
      }
      db.close();

      return Array.from(contributionMap.entries())
        .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
        .filter(r => r.value > 0)
        .sort((a, b) => b.value - a.value);
    } catch (error) { if(db) db.close(); throw error; }
});

ipcMain.handle('export-report', async (event, reportTitle: string, data: ExportDataRow[], format: 'csv' | 'xlsx'): Promise<string> => {
  const defaultFileName = `${reportTitle.replace(/[\(\) \/:]/g, '_')}.${format}`;
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: `Export Report as ${format.toUpperCase()}`, defaultPath: defaultFileName,
    filters: format === 'csv' ? [{ name: 'CSV', extensions: ['csv'] }] : [{ name: 'Excel', extensions: ['xlsx'] }],
  });

  if (canceled || !filePath) return 'Export cancelled.';

  try {
    if (format === 'csv') {
      const csvContent = "Nutriente,Valor,Unidad\n" + data.map(row => `"${row.nutrient}","${row.value}","${row.unit}"`).join('\n');
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
        cell.border = { bottom: { style: 'thin', color: { argb: 'FF000000' } } };
      });

      data.forEach(row => {
        const numericValue = parseFloat(String(row.value).replace(',', '.'));
        const dataRow = worksheet.addRow([row.nutrient, isNaN(numericValue) ? row.value : numericValue, row.unit]);
        dataRow.getCell(2).numFmt = '0.00';
        dataRow.getCell(2).alignment = { horizontal: 'right' };
      });
      worksheet.getColumn('A').width = 30; worksheet.getColumn('B').width = 15; worksheet.getColumn('C').width = 12;
      await workbook.xlsx.writeFile(filePath);
    }
    return 'Report exported successfully.';
  } catch (error: any) { return `Error exporting report: ${error.message}`; }
});

// ============================================================================
//REGION: IPC HANDLERS - RDI & CONFIGURATION
// ============================================================================

ipcMain.handle('get-rdi-profiles', async (): Promise<{ ProfileID: number, ProfileName: string }[]> => {
    return new Promise((resolve, reject) => {
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => err ? reject(err) : null);
        db.all('SELECT ProfileID, ProfileName FROM RDIProfiles ORDER BY ProfileName ASC', [], (err, rows: any[]) => {
            db.close();
            err ? reject(err) : resolve(rows);
        });
    });
});

ipcMain.handle('create-rdi-profile', async (event, profileName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const trimmed = profileName?.trim();
        if (!trimmed) return reject("Name required.");
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => err ? reject(err) : null);
        db.run('INSERT INTO RDIProfiles (ProfileName) VALUES (?)', [trimmed], function(err) {
            db.close();
            if (err) reject(err.message.includes('UNIQUE') ? "Profile exists." : err.message);
            else resolve("Profile created.");
        });
    });
});

ipcMain.handle('delete-rdi-profile', async (event, profileId: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (profileId === 1) return reject('Cannot delete Default Profile.');
        if (!profileId || profileId <= 0) return reject('Invalid ID.');
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => err ? reject(err) : null);
        db.run('PRAGMA foreign_keys = ON;', () => {
            db.run('DELETE FROM RDIProfiles WHERE ProfileID = ?', [profileId], function(err) {
                db.close();
                if (err) reject(err.message);
                else if (this.changes === 0) reject(`ID ${profileId} not found.`);
                else resolve('Profile deleted.');
            });
        });
    });
});

ipcMain.handle('import-rdi-excel', async (event, profileId: number): Promise<string> => {
    if (!profileId) return "Invalid ID.";
    const result = await dialog.showOpenDialog({ title: 'Import RDI', filters: [{ name: 'Excel', extensions: ['xlsx'] }], properties: ['openFile'] });
    if (result.canceled || !result.filePaths.length) return "Cancelled.";

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(result.filePaths[0]);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) return "No worksheet.";

    let importedCount = 0;
    const nutrientMap: { [key: string]: string } = {
        'calorias': 'Energy_kcal', 'energia': 'Energy_kcal', 'energy': 'Energy_kcal',
        'proteina': 'Protein_g', 'protein': 'Protein_g', 'grasa': 'Fat_g', 'lipidos': 'Fat_g', 'fat': 'Fat_g',
        'carbohidratos': 'Carbohydrate_g', 'cho': 'Carbohydrate_g', 'fibra': 'Fiber_g', 'azucar': 'Sugar_g',
        'calcio': 'Calcium_mg', 'hierro': 'Iron_mg', 'sodio': 'Sodium_mg', 'vitamina c': 'VitaminC_mg',
        'vitamina a': 'VitaminA_ER', 'vitamina b12': 'VitaminB12_mcg', 'folato': 'Folate_mcg',
        'zinc': 'Zinc_mg', 'magnesio': 'Magnesium_mg', 'potasio': 'Potassium_mg'
    };

    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE);
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            db.run('DELETE FROM RDIValues WHERE ProfileID = ?', [profileId]);
            const stmt = db.prepare('INSERT INTO RDIValues (ProfileID, NutrientKey, RecommendedValue, Type) VALUES (?, ?, ?, ?)');

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return;
                let nutrientName = row.getCell(1).value?.toString().trim().toLowerCase() || '';
                let value = row.getCell(2).value;
                let typeRaw = row.getCell(3).value?.toString().trim().toUpperCase();
                
                let type = 'RDA'; 
                if (typeRaw) {
                    if (['RDA', 'EAR', 'AI', 'UL', 'AMDR_MIN', 'AMDR_MAX'].includes(typeRaw)) type = typeRaw;
                    else if (typeRaw.includes('MAX') || typeRaw.includes('UL')) type = 'UL';
                    else if (typeRaw.includes('PROMEDIO') || typeRaw.includes('EAR')) type = 'EAR';
                }

                let dbKey = nutrientMap[nutrientName] || nutrientColumnNames.find(n => n.toLowerCase() === nutrientName);
                if (dbKey && value) {
                    const numValue = parseFloat(value.toString().replace(',', '.'));
                    if (!isNaN(numValue)) {
                        stmt.run([profileId, dbKey, numValue, type], (err: Error) => { if (!err) importedCount++; });
                    }
                }
            });

            stmt.finalize();
            db.run('COMMIT', (err) => {
                db.close();
                if (err) reject(err.message); else resolve(`Imported ${importedCount} values.`);
            });
        });
    });
});

ipcMain.handle('get-adequacy-report', async (event, userId: string, startDate: string, endDate: string, referenceDbId: number, profileId: number = 1) => {
    const intakeTotals = await calculateIntakeInternal(userId, startDate, endDate, referenceDbId);
    const dayCount = Math.max(1, (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24) + 1);

    const db: Database = await new Promise((resolve, reject) => {
        const dbInstance = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => err ? reject(err) : resolve(dbInstance));
    });

    const allValues: any[] = await new Promise((resolve, reject) => {
        db.all(`SELECT NutrientKey, RecommendedValue, Type FROM RDIValues WHERE ProfileID = ?`, [profileId], (err, rows) => err ? reject(err) : resolve(rows));
    });
    db.close();

    const valuesByNutrient: { [key: string]: { [type: string]: number } } = {};
    allValues.forEach(v => {
        if (!valuesByNutrient[v.NutrientKey]) valuesByNutrient[v.NutrientKey] = {};
        valuesByNutrient[v.NutrientKey][v.Type] = v.RecommendedValue;
    });

    const report: any[] = [];
    for (const nutrientKey in valuesByNutrient) {
        const standards = valuesByNutrient[nutrientKey];
        let targetValue = standards['RDA'] || standards['AI'] || standards['EAR'];
        let targetType = standards['RDA'] ? 'RDA' : (standards['AI'] ? 'AI' : 'EAR');

        if (targetValue) {
            const totalKey = `total${nutrientKey}` as keyof INutrientTotals;
            const dailyAverageIntake = (intakeTotals[totalKey] || 0) / dayCount;
            report.push({
                nutrient: nutrientKey, intake: dailyAverageIntake, rdi: targetValue,
                percentage: (dailyAverageIntake / targetValue) * 100, type: targetType
            });
        }
    }
    return report.sort((a, b) => b.percentage - a.percentage);
});

ipcMain.handle('calculate-intake', async (event, userId, startDate, endDate, referenceDbId) => {
    return await calculateIntakeInternal(userId, startDate, endDate, referenceDbId);
});

// ============================================================================
//REGION: IPC HANDLERS - SUBJECTS & DEMOGRAPHICS
// ============================================================================

ipcMain.handle('get-subjects', async (): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, err => err ? reject(err) : null);
        db.all('SELECT * FROM SubjectProfiles ORDER BY UserID ASC', [], (err, rows) => {
            db.close();
            err ? reject(err) : resolve(rows);
        });
    });
});

ipcMain.handle('get-subject-by-id', async (event, userId: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, err => err ? reject(err) : null);
        db.get('SELECT * FROM SubjectProfiles WHERE UserID = ?', [userId], (err, row) => {
            db.close();
            if (err) reject(err.message); else resolve(row || null);
        });
    });
});

ipcMain.handle('save-subject', async (event, subjectData: any): Promise<string> => {
    console.log('[Main] save-subject:', subjectData);
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, err => { if (err) console.error(err.message); });
        const { UserID, Name, BirthDate, Gender, PhysioState, Weight_kg, Height_cm, Notes } = subjectData;
        const recordDate = new Date().toISOString().split('T')[0];

        if (!UserID) { db.close(); return reject("UserID required."); }

        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            const upsertProfile = `
                INSERT INTO SubjectProfiles (UserID, Name, BirthDate, Gender, PhysioState, Weight_kg, Height_cm, Notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(UserID) DO UPDATE SET
                    Name=excluded.Name, BirthDate=excluded.BirthDate, Gender=excluded.Gender,
                    PhysioState=excluded.PhysioState, Weight_kg=excluded.Weight_kg,
                    Height_cm=excluded.Height_cm, Notes=excluded.Notes;
            `;
            db.run(upsertProfile, [UserID, Name, BirthDate, Gender, PhysioState, Weight_kg, Height_cm, Notes]);

            const hasWeight = (Weight_kg !== null && Weight_kg !== undefined && Weight_kg !== '');
            const hasHeight = (Height_cm !== null && Height_cm !== undefined && Height_cm !== '');
            
            if (hasWeight || hasHeight || (PhysioState && PhysioState !== 'None')) {
                db.run(`INSERT INTO SubjectMeasurements (UserID, Date, Weight_kg, Height_cm, PhysioState, Notes) VALUES (?, ?, ?, ?, ?, ?)`,
                    [UserID, recordDate, hasWeight ? Weight_kg : null, hasHeight ? Height_cm : null, PhysioState, Notes]
                );
            }

            db.run('COMMIT', (err) => {
                db.close();
                if (err) reject(err.message); else resolve(`Subject saved.`);
            });
        });
    });
});

ipcMain.handle('delete-subject', async (event, userId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, err => err ? reject(err) : null);
        db.run('DELETE FROM SubjectProfiles WHERE UserID = ?', [userId], function(err) {
            db.close();
            if (err) reject(err.message); else resolve("Subject deleted.");
        });
    });
});

ipcMain.handle('get-subject-history', async (event, userId: string): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, err => err ? reject(err) : null);
        db.all('SELECT * FROM SubjectMeasurements WHERE UserID = ? ORDER BY Date ASC', [userId], (err, rows) => {
            db.close();
            if (err) reject(err.message); else resolve(rows);
        });
    });
});

ipcMain.handle('delete-measurement', async (event, measurementId: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!measurementId) return reject("Invalid ID.");
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, err => err ? reject(err) : null);
        db.run('DELETE FROM SubjectMeasurements WHERE MeasurementID = ?', [measurementId], function(err) {
            db.close();
            if (err) reject(err.message); else resolve("Deleted.");
        });
    });
});

ipcMain.handle('update-measurement', async (event, mId: number, weight: number, height: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, err => err ? reject(err) : null);
        db.run('UPDATE SubjectMeasurements SET Weight_kg = ?, Height_cm = ? WHERE MeasurementID = ?', [weight, height, mId], function(err) {
            db.close();
            if (err) reject(err.message); else resolve("Updated.");
        });
    });
});

// ============================================================================
//REGION: SYSTEM DIALOGS
// ============================================================================

ipcMain.handle('show-confirm-dialog', async (event, options: Electron.MessageBoxOptions) => {
    const window = BrowserWindow.getFocusedWindow();
    return window ? dialog.showMessageBox(window, options) : dialog.showMessageBox(options);
});

ipcMain.handle('show-error-dialog', async (event, title: string, content: string) => {
    const window = BrowserWindow.getFocusedWindow();
    const options: Electron.MessageBoxOptions = { type: 'error', title, message: content };
    return window ? dialog.showMessageBox(window, options) : dialog.showMessageBox(options);
});

ipcMain.handle('show-info-dialog', async (event, title: string, content: string) => {
    const window = BrowserWindow.getFocusedWindow();
    const options: Electron.MessageBoxOptions = { type: 'info', title, message: content };
    return window ? dialog.showMessageBox(window, options) : dialog.showMessageBox(options);
});