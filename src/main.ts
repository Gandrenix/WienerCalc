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
  MealType?: string | null; // Allow null from DB
  FoodID: number;
  FoodName: string; // From JOIN
  ReferenceDatabaseID: number;
  ReferenceDatabaseName: string; // From JOIN
  Grams: number;
  Timestamp: string;
}

// Interface for FULL food details (including nutrients)
interface IFoodDetails {
  FoodID: number; // Needed for WHERE clause in update
  DatabaseID?: number; // Usually fixed during update
  Name: string;
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

// --- Initialize Database ---
function initializeDatabase() {
  if (!fs.existsSync(dbFolderPath)) {
    fs.mkdirSync(dbFolderPath, { recursive: true });
  }

  const db: Database = new (sqlite3.verbose().Database)(dbPath, (err: Error | null) => {
    if (err) return console.error('Error opening database', err.message);
    console.log('Database connected successfully at', dbPath);
  });

  db.run('PRAGMA foreign_keys = ON;', (err: Error | null) => {
    if (err) console.error("Could not enable foreign keys:", err.message);
    else console.log("Foreign key support enabled.");

    db.serialize(() => {
      // 1. Create FoodDatabases table
      const createDbTableQuery = `
        CREATE TABLE IF NOT EXISTS FoodDatabases (
          DatabaseID INTEGER PRIMARY KEY AUTOINCREMENT,
          DatabaseName TEXT NOT NULL UNIQUE
        );
      `;
      db.run(createDbTableQuery, (err: Error | null) => {
        if (err) return console.error('Error creating FoodDatabases table', err.message);
        console.log('Table "FoodDatabases" is ready.');

        db.run(`INSERT OR IGNORE INTO FoodDatabases (DatabaseName) VALUES (?)`, ['Default'], (insertErr: Error | null) => {
          if (insertErr) console.error('Error inserting default database:', insertErr.message);
          else console.log('Checked/Inserted "Default" database.');

          // 2. Create Foods table
          const createFoodsTableQuery = `
            CREATE TABLE IF NOT EXISTS Foods (
              FoodID INTEGER PRIMARY KEY AUTOINCREMENT, DatabaseID INTEGER NOT NULL, Name TEXT NOT NULL,
              Energy_kcal REAL, Water_g REAL, Protein_g REAL, Fat_g REAL, Carbohydrate_g REAL,
              SaturatedFat_g REAL, MonounsaturatedFat_g REAL, PolyunsaturatedFat_g REAL, Cholesterol_mg REAL,
              Fiber_g REAL, Sugar_g REAL, Ash_g REAL, Calcium_mg REAL, Phosphorus_mg REAL, Iron_mg REAL,
              Sodium_mg REAL, Potassium_mg REAL, Magnesium_mg REAL, Zinc_mg REAL, Copper_mg REAL,
              Manganese_mg REAL, VitaminA_ER REAL, Thiamin_mg REAL, Riboflavin_mg REAL, Niacin_mg REAL,
              PantothenicAcid_mg REAL, VitaminB6_mg REAL, Folate_mcg REAL, VitaminB12_mcg REAL, VitaminC_mg REAL,
              FOREIGN KEY (DatabaseID) REFERENCES FoodDatabases(DatabaseID) ON DELETE CASCADE,
              UNIQUE(DatabaseID, Name)
            );
          `;
          db.run(createFoodsTableQuery, (foodsErr: Error | null) => {
            if (foodsErr) console.error('Error creating Foods table', foodsErr.message);
            else console.log('Table "Foods" is ready (with "tabla paisa" nutrient columns).');

            // 3. Create ConsumptionLog Table
            const createLogTableQuery = `
              CREATE TABLE IF NOT EXISTS ConsumptionLog (
                LogID INTEGER PRIMARY KEY AUTOINCREMENT, UserID TEXT NOT NULL, ConsumptionDate TEXT NOT NULL,
                MealType TEXT, FoodID INTEGER NOT NULL, ReferenceDatabaseID INTEGER NOT NULL,
                Grams REAL NOT NULL CHECK(Grams > 0), Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (FoodID) REFERENCES Foods(FoodID) ON DELETE CASCADE,
                FOREIGN KEY (ReferenceDatabaseID) REFERENCES FoodDatabases(DatabaseID) ON DELETE CASCADE
              );
            `;
            db.run(createLogTableQuery, (logTableErr: Error | null) => {
              if (logTableErr) { console.error('Error creating ConsumptionLog table', logTableErr.message); }
              else { console.log('Table "ConsumptionLog" is ready.'); }

              db.close((closeErr: Error | null) => {
                  if (closeErr) console.error('Error closing database during init:', closeErr.message);
                  else console.log('Database closed after initialization.');
              });
            }); // End Create ConsumptionLog
          }); // End Create Foods
        }); // End Insert Default
      }); // End Create DBs
    }); // End db.serialize
  }); // End PRAGMA
}


// --- WINDOW CREATION ---
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900, height: 800,
webPreferences: {
  preload: path.join(__dirname, 'preload.js'),
  contextIsolation: true,  // <-- ¡Debe ser true! (Arregla Error 1)
  nodeIntegration: false // <-- ¡Debe ser false! (Es más seguro)
}

  });
  mainWindow.loadFile(path.join(__dirname, '../src/index.html'));
  mainWindow.webContents.openDevTools();
}

// --- APP LIFECYCLE ---
app.whenReady().then(() => {
  initializeDatabase();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
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


ipcMain.handle('edit-food', async (event, foodId: number, newName: string): Promise<string> => {
    console.warn("DEPRECATED: 'edit-food' handler called. Use 'update-food-details' instead.");
    return new Promise((resolve, reject) => {
        const trimmedName = newName?.trim();
        if (!trimmedName) return reject('New food name cannot be empty.');
        if (!foodId || foodId <= 0) return reject('Invalid Food ID provided.');
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err: Error | null) => {
            if (err) return reject(`Database connection error: ${err.message}`);
        });
        const updateQuery = `UPDATE Foods SET Name = ? WHERE FoodID = ?`;
        db.run(updateQuery, [trimmedName, foodId], function (this: sqlite3.RunResult, err: Error | null) {
            db.close((closeErr: Error | null) => {
                if (closeErr) console.error('Error closing database (edit-food - deprecated):', closeErr.message);
                if (err) {
                    console.error('Error updating food name', err.message);
                    if (err.message.includes('UNIQUE constraint failed')) reject(`Another food with the name "${trimmedName}" might already exist in the same database.`);
                    else reject(`Error updating food name: ${err.message}`);
                } else if (this.changes === 0) {
                    reject(`Food with ID ${foodId} not found`);
                } else {
                    console.log(`Food name with ID ${foodId} updated to ${trimmedName}`);
                    resolve('Food name updated successfully');
                }
            });
        });
    });
});

ipcMain.handle('update-food-details', async (event, foodData: IFoodDetails): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!foodData || typeof foodData.FoodID !== 'number' || foodData.FoodID <= 0) {
        return reject('Invalid Food ID provided for update.');
      }
      const trimmedName = foodData.Name?.trim();
      if (!trimmedName) {
        return reject('Food name cannot be empty.');
      }
      const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err: Error | null) => {
        if (err) return reject(`Database connection error: ${err.message}`);
      });
      const fieldsToUpdate: string[] = [ 'Name = ?' ];
      const values: (string | number | null)[] = [ trimmedName ];
      const nutrientFields: (keyof IFoodDetails)[] = [
          'Energy_kcal', 'Water_g', 'Protein_g', 'Fat_g', 'Carbohydrate_g',
          'SaturatedFat_g', 'MonounsaturatedFat_g', 'PolyunsaturatedFat_g', 'Cholesterol_mg',
          'Fiber_g', 'Sugar_g', 'Ash_g', 'Calcium_mg', 'Phosphorus_mg', 'Iron_mg', 'Sodium_mg',
          'Potassium_mg', 'Magnesium_mg', 'Zinc_mg', 'Copper_mg', 'Manganese_mg', 'VitaminA_ER',
          'Thiamin_mg', 'Riboflavin_mg', 'Niacin_mg', 'PantothenicAcid_mg', 'VitaminB6_mg',
          'Folate_mcg', 'VitaminB12_mcg', 'VitaminC_mg'
      ];
      nutrientFields.forEach(field => {
          if (foodData.hasOwnProperty(field)) {
              fieldsToUpdate.push(`${field} = ?`);
              const value = foodData[field];
              values.push(value === undefined ? null : value);
          }
      });
      values.push(foodData.FoodID);
      if (fieldsToUpdate.length <= 1) { db.close(); console.warn("update-food-details called with only Name change."); }
      const updateQuery = `UPDATE Foods SET ${fieldsToUpdate.join(', ')} WHERE FoodID = ?`;
      console.log("Executing Update Query:", updateQuery);
      console.log("With Values:", values);
      db.run(updateQuery, values, function(this: sqlite3.RunResult, err: Error | null) {
        db.close((closeErr: Error | null) => {
          if (closeErr) console.error('Error closing database (update-food-details):', closeErr.message);
        });
        if (err) {
          console.error('Error updating food details:', err.message);
          if (err.message.includes('UNIQUE constraint failed')) {
              reject(`Failed to update: Another food named "${trimmedName}" might already exist in this database.`);
          } else {
              reject(`Error updating food details: ${err.message}`);
          }
        } else if (this.changes === 0) {
          reject(`Food with ID ${foodData.FoodID} not found for update.`);
        } else {
          console.log(`Food details updated successfully for FoodID: ${foodData.FoodID}`);
          resolve('Food details updated successfully');
        }
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
                            delimiter: ';', // Usar punto y coma
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
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err: Error | null) => { if (err) return reject(`Database connection error: ${err.message}`); });
        const searchQuery = ` SELECT FoodID, Name FROM Foods WHERE DatabaseID = ? AND Name LIKE ? ORDER BY Name ASC LIMIT 20 `;
        const searchPattern = `%${trimmedSearch}%`;
        db.all(searchQuery, [referenceDbId, searchPattern], (err: Error | null, rows: ISearchFoodResult[]) => {
            db.close((closeErr: Error | null) => { if (closeErr) console.error('Error closing database (search-foods):', closeErr.message); if (err) reject(`Error searching foods: ${err.message}`); else resolve(rows); });
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
                                    delimiter: ',', // Asumimos coma para el CSV de log
                                    from_line: 2,   // Asumimos 1 fila de cabecera
                                    trim: true,
                                    columns: ['UserID', 'ConsumptionDate', 'FoodName', 'DBName', 'Grams', 'MealType'], // Mapeo directo
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


// *** NUEVO: Obtener todos los UserIDs únicos del log ***
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


// --- Calculation Handler (Module 3 - v0.2) ---
ipcMain.handle('calculate-intake', async (
    event,
    userId: string,
    startDate: string,
    endDate: string,
    referenceDbId: number
): Promise<INutrientTotals> => {
    console.log(`Calculating intake for User: ${userId}, Dates: ${startDate} to ${endDate}, RefDB: ${referenceDbId}`);
    return new Promise((resolve, reject) => {
        const trimmedUserId = userId?.trim();
        if (!trimmedUserId) return reject('UserID is required.');
        if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return reject('Valid Start Date (YYYY-MM-DD) required.');
        if (!endDate || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return reject('Valid End Date (YYYY-MM-DD) required.');
        if (startDate > endDate) return reject('Start Date cannot be after End Date.');
        if (typeof referenceDbId !== 'number' || referenceDbId <= 0) return reject('Valid Reference DB ID required.');
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err: Error | null) => {
            if (err) return reject(`Database connection error: ${err.message}`);
        });
        
        const selectLogQuery = ` SELECT LogID, FoodID, Grams FROM ConsumptionLog WHERE UserID = ? AND ConsumptionDate BETWEEN ? AND ? AND ReferenceDatabaseID = ? `;
        
        db.all(selectLogQuery, [trimmedUserId, startDate, endDate, referenceDbId], (logErr: Error | null, logEntries: { LogID: number, FoodID: number, Grams: number }[]) => {
            if (logErr) { db.close(); return reject(`Error fetching log entries: ${logErr.message}`); }
            const nutrientColumns = [
                'Energy_kcal', 'Water_g', 'Protein_g', 'Fat_g', 'Carbohydrate_g',
                'SaturatedFat_g', 'MonounsaturatedFat_g', 'PolyunsaturatedFat_g', 'Cholesterol_mg',
                'Fiber_g', 'Sugar_g', 'Ash_g',
                'Calcium_mg', 'Phosphorus_mg', 'Iron_mg', 'Sodium_mg', 'Potassium_mg',
                'Magnesium_mg', 'Zinc_mg', 'Copper_mg', 'Manganese_mg',
                'VitaminA_ER', 'Thiamin_mg', 'Riboflavin_mg', 'Niacin_mg',
                'PantothenicAcid_mg', 'VitaminB6_mg', 'Folate_mcg', 'VitaminB12_mcg', 'VitaminC_mg'
            ];
            const zeroTotals: INutrientTotals = {} as INutrientTotals;
            nutrientColumns.forEach(col => { zeroTotals[`total${col}`] = 0; });
            if (logEntries.length === 0) {
                db.close(); console.log("No log entries found, returning zero totals."); return resolve(zeroTotals);
            }
            const selectFoodQuery = ` SELECT FoodID, ${nutrientColumns.join(', ')} FROM Foods WHERE FoodID = ? AND DatabaseID = ? `;
            const totals: INutrientTotals = { ...zeroTotals };
            let processedEntries = 0;
            const errors: string[] = [];
            logEntries.forEach(entry => {
                db.get(selectFoodQuery, [entry.FoodID, referenceDbId], (foodErr: Error | null, foodDetails: any) => {
                    processedEntries++;
                    if (foodErr) { errors.push(`Error fetching FoodID ${entry.FoodID}: ${foodErr.message}`); }
                    else if (!foodDetails) { errors.push(`Details not found for FoodID ${entry.FoodID} in DB ${referenceDbId} (LogID: ${entry.LogID}).`); }
                    else {
                        const factor = entry.Grams / 100.0;
                        nutrientColumns.forEach(colName => {
                            const nutrientValue = foodDetails[colName];
                            if (typeof nutrientValue === 'number' && !isNaN(nutrientValue)) {
                                const totalKey = `total${colName}`;
                                totals[totalKey] = (totals[totalKey] || 0) + (nutrientValue * factor);
                            }
                        });
                    }
                    if (processedEntries === logEntries.length) {
                        db.close((closeErr: Error | null) => {
                            if (closeErr) console.error("Error closing DB after calculation:", closeErr.message);
                            if (errors.length > 0) { console.warn(`Calculation finished with ${errors.length} errors. First error: ${errors[0]}`); }
                            console.log("Calculation successful. Totals:", totals);
                            resolve(totals);
                        });
                    }
                }); // End db.get
            }); // End forEach
        }); // End db.all
    }); // End Promise
}); // End ipcMain.handle 'calculate-intake'


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
async function getBaseAnalyticsData(
    userIds: string[], 
    startDate: string, 
    endDate: string, 
    referenceDbId: number, 
    nutrient: string // El nombre de la columna, ej: "Energy_kcal"
): Promise<{ [userId: string]: { [date: string]: number } }> {
    return new Promise((resolve, reject) => {
        // Validar el nombre del nutriente para evitar Inyección SQL
        const allowedNutrients = [
            'Energy_kcal', 'Water_g', 'Protein_g', 'Fat_g', 'Carbohydrate_g',
            'SaturatedFat_g', 'MonounsaturatedFat_g', 'PolyunsaturatedFat_g', 'Cholesterol_mg',
            'Fiber_g', 'Sugar_g', 'Ash_g', 'Calcium_mg', 'Phosphorus_mg', 'Iron_mg', 'Sodium_mg',
            'Potassium_mg', 'Magnesium_mg', 'Zinc_mg', 'Copper_mg', 'Manganese_mg',
            'VitaminA_ER', 'Thiamin_mg', 'Riboflavin_mg', 'Niacin_mg',
            'PantothenicAcid_mg', 'VitaminB6_mg', 'Folate_mcg', 'VitaminB12_mcg', 'VitaminC_mg'
        ];
        if (!allowedNutrients.includes(nutrient)) {
            return reject(new Error(`Invalid nutrient column name: ${nutrient}`));
        }
        
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err: Error | null) => {
            if (err) return reject(`Database connection error: ${err.message}`);
        });

        // Crear placeholders (?) para el array de UserIDs
        const placeholders = userIds.map(() => '?').join(',');

        // Consulta que calcula el total de un nutriente, por usuario, por día
        const query = `
            SELECT 
                cl.UserID, 
                cl.ConsumptionDate, 
                SUM(f.${nutrient} * (cl.Grams / 100.0)) AS DailyTotal
            FROM ConsumptionLog cl
            JOIN Foods f ON cl.FoodID = f.FoodID
            WHERE 
                cl.UserID IN (${placeholders})
                AND cl.ConsumptionDate BETWEEN ? AND ?
                AND cl.ReferenceDatabaseID = ?
                AND f.${nutrient} IS NOT NULL
            GROUP BY cl.UserID, cl.ConsumptionDate
        `;

        const params = [...userIds, startDate, endDate, referenceDbId];

        db.all(query, params, (err: Error | null, rows: { UserID: string, ConsumptionDate: string, DailyTotal: number }[]) => {
            db.close();
            if (err) {
                return reject(new Error(`Failed to execute analytics query: ${err.message}`));
            }
            
            // Re-estructurar los datos en un mapa para fácil acceso: { UserA: { '2025-10-29': 1500, ... }, ... }
            const results: { [userId: string]: { [date: string]: number } } = {};
            for (const row of rows) {
                if (!results[row.UserID]) {
                    results[row.UserID] = {};
                }
                results[row.UserID][row.ConsumptionDate] = row.DailyTotal;
            }
            resolve(results);
        });
    });
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
    
    // 2. Calcular el promedio *diario* para cada usuario
    const userAverages: number[] = [];
    for (const userId of Object.keys(dailyDataByUser)) {
        const dates = Object.keys(dailyDataByUser[userId]);
        if (dates.length > 0) {
            const totalsPerDay = Object.values(dailyDataByUser[userId]);
            const userTotal = totalsPerDay.reduce((sum, val) => sum + val, 0);
            userAverages.push(userTotal / dates.length); // Promedio diario de este usuario
        }
    }

    if (userAverages.length === 0) {
        throw new Error("No data found for the selected criteria to calculate statistics.");
    }

    // 3. Calcular estadísticas sobre la lista de promedios de usuario
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
        rawData: userAverages // Enviar los promedios de cada usuario para el histograma/box plot
    };

    console.log("Generated Statistical Report:", report);
    return report;
});

// 2. ANÁLISIS NUTRICIONAL (GRÁFICO DE LÍNEA)
ipcMain.handle('get-daily-intake-over-time', async (
    event,
    userId: string, 
    startDate: string, 
    endDate: string, 
    referenceDbId: number, 
    nutrient: string
): Promise<IDailyIntake[]> => {

    // 1. Obtener los datos base. Nota: getBaseAnalyticsData espera un array de UserIDs.
    const dailyDataByUser = await getBaseAnalyticsData([userId], startDate, endDate, referenceDbId, nutrient);

    const userData = dailyDataByUser[userId];
    if (!userData) {
        return []; // Sin datos para este usuario
    }

    // 2. Convertir el mapa de datos a un array de {date, value}
    const results: IDailyIntake[] = Object.keys(userData).map(date => {
        return {
            date: date,
            value: userData[date]
        };
    });

    // 3. Ordenar por fecha
    results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    console.log("Generated Daily Intake Over Time:", results);
    return results;
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
    
    // Validar el nombre del nutriente para evitar Inyección SQL
    const allowedNutrients = [
        'Energy_kcal', 'Water_g', 'Protein_g', 'Fat_g', 'Carbohydrate_g',
        'SaturatedFat_g', 'MonounsaturatedFat_g', 'PolyunsaturatedFat_g', 'Cholesterol_mg',
        'Fiber_g', 'Sugar_g', 'Ash_g', 'Calcium_mg', 'Phosphorus_mg', 'Iron_mg', 'Sodium_mg',
        'Potassium_mg', 'Magnesium_mg', 'Zinc_mg', 'Copper_mg', 'Manganese_mg',
        'VitaminA_ER', 'Thiamin_mg', 'Riboflavin_mg', 'Niacin_mg',
        'PantothenicAcid_mg', 'VitaminB6_mg', 'Folate_mcg', 'VitaminB12_mcg', 'VitaminC_mg'
    ];
    if (!allowedNutrients.includes(nutrient)) {
        return Promise.reject(new Error(`Invalid nutrient column name: ${nutrient}`));
    }

    return new Promise((resolve, reject) => {
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err: Error | null) => {
            if (err) return reject(`Database connection error: ${err.message}`);
        });

        // Consulta que agrupa por nombre de alimento y suma el nutriente
        const query = `
            SELECT 
                f.Name AS name, 
                SUM(f.${nutrient} * (cl.Grams / 100.0)) AS value
            FROM ConsumptionLog cl
            JOIN Foods f ON cl.FoodID = f.FoodID
            WHERE 
                cl.UserID = ?
                AND cl.ConsumptionDate BETWEEN ? AND ?
                AND cl.ReferenceDatabaseID = ?
                AND f.${nutrient} IS NOT NULL
            GROUP BY f.Name
            ORDER BY value DESC
        `;

        db.all(query, [userId, startDate, endDate, referenceDbId], (err: Error | null, rows: IContributionReport[]) => {
            db.close();
            if (err) {
                return reject(new Error(`Failed to get nutrient contribution: ${err.message}`));
            }
            // Devolver solo valores positivos
            resolve(rows.filter(r => r.value > 0));
        });
    });
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

    // Validar nutriente
    const allowedNutrients = [
        'Energy_kcal', 'Water_g', 'Protein_g', 'Fat_g', 'Carbohydrate_g',
        'SaturatedFat_g', 'MonounsaturatedFat_g', 'PolyunsaturatedFat_g', 'Cholesterol_mg',
        'Fiber_g', 'Sugar_g', 'Ash_g', 'Calcium_mg', 'Phosphorus_mg', 'Iron_mg', 'Sodium_mg',
        'Potassium_mg', 'Magnesium_mg', 'Zinc_mg', 'Copper_mg', 'Manganese_mg',
        'VitaminA_ER', 'Thiamin_mg', 'Riboflavin_mg', 'Niacin_mg',
        'PantothenicAcid_mg', 'VitaminB6_mg', 'Folate_mcg', 'VitaminB12_mcg', 'VitaminC_mg'
    ];
    if (!allowedNutrients.includes(nutrient)) {
        return Promise.reject(new Error(`Invalid nutrient column name: ${nutrient}`));
    }

    return new Promise((resolve, reject) => {
        const db: Database = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err: Error | null) => {
            if (err) return reject(`Database connection error: ${err.message}`);
        });

        // Consulta que agrupa por tipo de comida
        const query = `
            SELECT 
                -- 1. Formatear la salida: Poner la primera letra en mayúscula y el resto en minúscula
                UPPER(SUBSTR(COALESCE(cl.MealType, 'Uncategorized'), 1, 1)) || LOWER(SUBSTR(COALESCE(cl.MealType, 'Uncategorized'), 2)) AS name, 
                SUM(f.${nutrient} * (cl.Grams / 100.0)) AS value
            FROM ConsumptionLog cl
            JOIN Foods f ON cl.FoodID = f.FoodID
            WHERE 
                cl.UserID = ?
                AND cl.ConsumptionDate BETWEEN ? AND ?
                AND cl.ReferenceDatabaseID = ?
                AND f.${nutrient} IS NOT NULL
            -- 2. Agrupar por el valor en minúscula (así "Lunch" y "lunch" se unen)
            GROUP BY LOWER(COALESCE(cl.MealType, 'Uncategorized'))
            ORDER BY value DESC
        `;

        db.all(query, [userId, startDate, endDate, referenceDbId], (err: Error | null, rows: IContributionReport[]) => {
            db.close();
            if (err) {
                return reject(new Error(`Failed to get meal contribution: ${err.message}`));
            }
            resolve(rows.filter(r => r.value > 0));
        });
    });
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