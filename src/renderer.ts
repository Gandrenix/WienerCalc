/// <reference path="./preload.d.ts" />
/// <reference types="echarts" />

// --- TYPES --- (Local definitions matching preload.d.ts for clarity)
interface IDatabaseInfo {
    DatabaseID: number;
    DatabaseName: string;
}

interface IFoodDetail {
    FoodID: number;
    Name: string;
    DatabaseName: string;
}

interface ISearchFoodResult {
    FoodID: number;
    Name: string;
}

interface INewLogEntryData {
    userId: string;
    consumptionDate: string; // YYYY-MM-DD
    mealType?: string;
    foodId: number;
    referenceDatabaseId: number;
    grams: number;
}

interface ILogEntry {
    LogID: number;
    UserID: string;
    ConsumptionDate: string;
    MealType?: string; // Should be string or undefined
    FoodID: number;
    FoodName: string;
    ReferenceDatabaseID: number;
    ReferenceDatabaseName: string;
    Grams: number;
    Timestamp: string;
}

// *** ACTUALIZADO: "tabla paisa" ***
interface IFoodDetails {
    FoodID: number;
    Name: string;
    Energy_kcal?: number | null;
    Water_g?: number | null;
    Protein_g?: number | null;
    Fat_g?: number | null;
    Carbohydrate_g?: number | null;
    SaturatedFat_g?: number | null;
    MonounsaturatedFat_g?: number | null;
    PolyunsaturatedFat_g?: number | null;
    Cholesterol_mg?: number | null;
    Fiber_g?: number | null;
    Sugar_g?: number | null;
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

// *** ACTUALIZADO: "tabla paisa" ***
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

// *** Interfaz para los datos del reporte formateados ***
interface IReportRow {
  nutrient: string; // ej. "Energy Kcal"
  value: string;    // ej. "106.80"
  unit: string;     // ej. "kcal"
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
}


// --- DOM Elements (Get them once at the start) ---
// Library Management
let dbSelectElement: HTMLSelectElement | null = null;
let importDbSelectElement: HTMLSelectElement | null = null;
let foodForm: HTMLFormElement | null = null;
let foodInput: HTMLInputElement | null = null;
let foodListElement: HTMLElement | null = null;
let importButton: HTMLButtonElement | null = null; // Import Library Excel
let importCsvBtn: HTMLButtonElement | null = null; // *** NUEVO: Import Library CSV ***
let importStatus: HTMLElement | null = null; // Import Library status
let addDbBtn: HTMLButtonElement | null = null;
let newDbNameInput: HTMLInputElement | null = null;
let saveNewDbBtn: HTMLButtonElement | null = null;
let deleteDbBtn: HTMLButtonElement | null = null;
let purgeDbBtn: HTMLButtonElement | null = null;

// Consumption Log
let refDbSelectElement: HTMLSelectElement | null = null;
let userIdInputElement: HTMLInputElement | null = null;
let consumptionDateElement: HTMLInputElement | null = null;
let mealTypeSelectElement: HTMLSelectElement | null = null;
let foodSearchInputElement: HTMLInputElement | null = null;
let foodSelectElement: HTMLSelectElement | null = null;
let gramsInputElement: HTMLInputElement | null = null;
let logFormElement: HTMLFormElement | null = null;
let logEntriesElement: HTMLElement | null = null;
let searchTimeout: NodeJS.Timeout | null = null;
let importLogButton: HTMLButtonElement | null = null; // Import Log button
let importLogCsvBtn: HTMLButtonElement | null = null; // *** NUEVO: Import Log CSV ***
let importLogStatus: HTMLElement | null = null; // Import Log status
let userIdDataListElement: HTMLDataListElement | null = null; // *** NUEVO: DataList ***
let deleteAllLogsBtn: HTMLButtonElement | null = null;
let deleteUserLogsBtn: HTMLButtonElement | null = null;

// Detailed Food Edit Form
let editFoodFormContainer: HTMLElement | null = null;
let editFoodIdInput: HTMLInputElement | null = null;
let editFoodNameInput: HTMLInputElement | null = null;
let editEnergyKcalInput: HTMLInputElement | null = null;
let editWaterGInput: HTMLInputElement | null = null;
let editProteinGInput: HTMLInputElement | null = null;
let editFatGInput: HTMLInputElement | null = null;
let editCarbohydrateGInput: HTMLInputElement | null = null;
let editSaturatedFatGInput: HTMLInputElement | null = null;
let editMonounsaturatedFatGInput: HTMLInputElement | null = null;
let editPolyunsaturatedFatGInput: HTMLInputElement | null = null;
let editCholesterolMgInput: HTMLInputElement | null = null;
let editFiberGInput: HTMLInputElement | null = null;
let editSugarGInput: HTMLInputElement | null = null;
let editAshGInput: HTMLInputElement | null = null;
let editCalciumMgInput: HTMLInputElement | null = null;
let editPhosphorusMgInput: HTMLInputElement | null = null;
let editIronMgInput: HTMLInputElement | null = null;
let editSodiumMgInput: HTMLInputElement | null = null;
let editPotassiumMgInput: HTMLInputElement | null = null;
let editMagnesiumMgInput: HTMLInputElement | null = null;
let editZincMgInput: HTMLInputElement | null = null;
let editCopperMgInput: HTMLInputElement | null = null;
let editManganeseMgInput: HTMLInputElement | null = null;
let editVitaminAERInput: HTMLInputElement | null = null;
let editThiaminMgInput: HTMLInputElement | null = null;
let editRiboflavinMgInput: HTMLInputElement | null = null;
let editNiacinMgInput: HTMLInputElement | null = null;
let editPantothenicAcidMgInput: HTMLInputElement | null = null;
let editVitaminB6MgInput: HTMLInputElement | null = null;
let editFolateMcgInput: HTMLInputElement | null = null;
let editVitaminB12McgInput: HTMLInputElement | null = null;
let editVitaminCMgInput: HTMLInputElement | null = null;
let saveEditFoodBtn: HTMLButtonElement | null = null;
let cancelEditFoodBtn: HTMLButtonElement | null = null;

// *** Modal de Edición de Log ***
let editLogModal: HTMLElement | null = null;
let editLogIdInput: HTMLInputElement | null = null;
let editLogGramsInput: HTMLInputElement | null = null;
let editLogFoodName: HTMLElement | null = null;
let saveEditLogBtn: HTMLButtonElement | null = null;
let cancelEditLogBtn: HTMLButtonElement | null = null;

// Report / Calculation Section (v0.2)
let reportUserIdInputElement: HTMLInputElement | null = null;
let reportStartDateElement: HTMLInputElement | null = null;
let reportEndDateElement: HTMLInputElement | null = null;
let reportRefDbSelectElement: HTMLSelectElement | null = null;
let calculateBtnElement: HTMLButtonElement | null = null;
let reportResultsElement: HTMLElement | null = null;
let exportControls: HTMLElement | null = null;
let exportCsvBtn: HTMLButtonElement | null = null;
let exportExcelBtn: HTMLButtonElement | null = null;

// *** NUEVO: Elementos de Análisis (v0.3) ***
let nutrientSelect: HTMLSelectElement | null = null;
let calcStatsBtn: HTMLButtonElement | null = null;
let renderHistogramBtn: HTMLButtonElement | null = null;
let renderBoxPlotBtn: HTMLButtonElement | null = null;
let renderTopFoodsBtn: HTMLButtonElement | null = null;
let renderMealBtn: HTMLButtonElement | null = null;
let renderOverTimeBtn: HTMLButtonElement | null = null;
let chartContainer: HTMLElement | null = null;
let statsResults: HTMLElement | null = null;
let myChart: echarts.ECharts | null = null; // Instancia del gráfico

// Global variable to store last calculation results
let lastCalculatedTotals: INutrientTotals | null = null;
let lastReportTitle: string = "";


// --- Helper Function to Parse Nutrient Input ---
function getNutrientValue(inputElement: HTMLInputElement | null): number | null {
    if (!inputElement || inputElement.value.trim() === '') {
        return null;
    }
    const value = parseFloat(inputElement.value);
    return isNaN(value) ? null : value;
}

// --- DATABASE FUNCTIONS ---

// Cargar UserIDs únicos en el <datalist>
async function loadUniqueUserIDs() {
    const listElement = userIdDataListElement;
    if (!listElement) {
        console.error("UserID datalist element not found.");
        return;
    }
    
    try {
        const userIDs = await window.electronAPI.getUniqueUserIds();
        console.log("Loaded unique UserIDs:", userIDs);
        
        listElement.innerHTML = '';
        
        userIDs.forEach((userId: string) => {
            const option = document.createElement('option');
            option.value = userId;
            listElement.appendChild(option);
        });
    } catch (error) {
        console.error("Failed to load unique UserIDs:", error);
    }
}

// Fetches databases and populates ALL relevant select dropdowns
async function loadDatabasesIntoSelectors() {
    if (!dbSelectElement || !importDbSelectElement || !refDbSelectElement || !reportRefDbSelectElement) {
         console.error("One or more DB selectors not found during loadDatabasesIntoSelectors");
         return;
    }
    const currentDbSelect = dbSelectElement;
    const currentImportDbSelect = importDbSelectElement;
    const currentRefDbSelect = refDbSelectElement;
    const currentReportRefDbSelect = reportRefDbSelectElement;

    try {
        const databases = await window.electronAPI.getDatabases();
        console.log("Databases loaded for selectors:", databases);
        currentDbSelect.innerHTML = '';
        currentImportDbSelect.innerHTML = '';
        currentRefDbSelect.innerHTML = '';
        currentReportRefDbSelect.innerHTML = '';

        const selectOption = new Option("-- Select Database --", "-1");
        currentRefDbSelect.add(selectOption.cloneNode(true) as HTMLOptionElement);
        currentReportRefDbSelect.add(selectOption.cloneNode(true) as HTMLOptionElement);

        if (databases.length === 0) {
            const defaultOption = new Option("No Databases Found", "-1");
            currentDbSelect.add(defaultOption.cloneNode(true) as HTMLOptionElement);
            currentImportDbSelect.add(defaultOption.cloneNode(true) as HTMLOptionElement);
            currentDbSelect.disabled = true;
            currentImportDbSelect.disabled = true;
            currentRefDbSelect.disabled = true;
            currentReportRefDbSelect.disabled = true;
        } else {
             currentDbSelect.disabled = false;
             currentImportDbSelect.disabled = false;
             currentRefDbSelect.disabled = false;
             currentReportRefDbSelect.disabled = false;
            databases.forEach(db => {
                const option = new Option(db.DatabaseName, db.DatabaseID.toString());
                currentDbSelect.add(option.cloneNode(true) as HTMLOptionElement);
                currentImportDbSelect.add(option.cloneNode(true) as HTMLOptionElement);
                currentRefDbSelect.add(option.cloneNode(true) as HTMLOptionElement);
                currentReportRefDbSelect.add(option.cloneNode(true) as HTMLOptionElement);
            });
            console.log("Selectors populated.");
        }
    } catch (error) {
        console.error('Failed to load databases:', error);
         if (currentDbSelect) currentDbSelect.disabled = true;
         if (currentImportDbSelect) currentImportDbSelect.disabled = true;
         if (currentRefDbSelect) currentRefDbSelect.disabled = true;
         if (currentReportRefDbSelect) currentReportRefDbSelect.disabled = true;
    }
}

// Function to show UI for adding a new database name
async function handleAddNewDatabase() {
     if (!newDbNameInput || !saveNewDbBtn || !addDbBtn) return;
     addDbBtn.style.display = 'none';
     newDbNameInput.style.display = 'inline-block';
     saveNewDbBtn.style.display = 'inline-block';
     newDbNameInput.focus();
}

// Function to save the new database name via IPC
async function handleSaveNewDatabase() {
      if (!newDbNameInput || !saveNewDbBtn || !addDbBtn) return;
     const newName = newDbNameInput.value.trim();
     if (newName) {
         try {
             const result = await window.electronAPI.addDatabase(newName);
             console.log(result);
             loadDatabasesIntoSelectors();
         } catch (error) {
             console.error('Failed to add database:', error);
             await window.electronAPI.showErrorDialog('Save Error', `Error adding database: ${error}`);
         }
     }
      newDbNameInput.value = '';
      newDbNameInput.style.display = 'none';
      saveNewDbBtn.style.display = 'none';
      addDbBtn.style.display = 'inline-block';
}

// Function to delete the selected database
async function handleDeleteDatabase() {
    if (!dbSelectElement) {
        console.error("Database select element not found.");
        return;
    }
    
    const selectedDbId = parseInt(dbSelectElement.value, 10);
    const selectedDbName = dbSelectElement.options[dbSelectElement.selectedIndex]?.text;

    if (!selectedDbId || selectedDbId <= 0) {
        await window.electronAPI.showErrorDialog('Invalid Selection', 'Please select a valid database to delete.');
        return;
    }

    const confirm1Result = await window.electronAPI.showConfirmDialog({
        type: 'warning',
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete the database "${selectedDbName}" (ID: ${selectedDbId})?`,
        buttons: ['Cancel', 'Yes, Delete It'],
        defaultId: 0, cancelId: 0
    });

    if (confirm1Result.response === 0) return;

    const confirm2Result = await window.electronAPI.showConfirmDialog({
        type: 'error',
        title: 'FINAL WARNING',
        message: `This action is IRREVERSIBLE.\n\nALL foods AND ALL consumption log entries associated with "${selectedDbName}" will be PERMANENTLY deleted.\n\nAre you absolutely sure?`,
        buttons: ['Cancel', 'Yes, I understand. Delete everything.'],
        defaultId: 0, cancelId: 0
    });

    if (confirm2Result.response === 0) return;

    try {
        const result = await window.electronAPI.deleteDatabase(selectedDbId);
        
        loadDatabasesIntoSelectors();
        loadAndDisplayFoods();
        if (refDbSelectElement && parseInt(refDbSelectElement.value, 10) === selectedDbId) {
            loadAndDisplayLogEntries();
        }

        await window.electronAPI.showInfoDialog('Success', result);

    } catch (error) {
        console.error("Failed to delete database:", error);
        await window.electronAPI.showErrorDialog('Error Deleting Database', String(error));
    }
}


// --- FOOD LIST FUNCTIONS ---

// Updates the HTML list of foods
function displayFoods(foods: IFoodDetail[]) {
    if (!foodListElement) return;
    foodListElement.innerHTML = '';
    if (foods.length === 0) {
        foodListElement.innerHTML = '<p>No foods added yet.</p>';
        return;
    }
    const ul = document.createElement('ul');
    ul.style.listStyleType = 'none';
    ul.style.paddingLeft = '0';
    foods.forEach(food => {
        const li = document.createElement('li');
        li.dataset.foodId = food.FoodID.toString();
        li.style.marginBottom = '5px';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'food-name';
        nameSpan.textContent = `${food.Name} (${food.DatabaseName})`;
        li.appendChild(nameSpan);
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.className = 'edit-btn';
        editButton.style.marginLeft = '10px';
        editButton.style.padding = '2px 5px';
        editButton.onclick = () => showEditForm(food.FoodID, food.Name);
        li.appendChild(editButton);
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-btn';
        deleteButton.style.marginLeft = '5px';
        deleteButton.style.padding = '2px 5px';
        deleteButton.onclick = () => handleDelete(food.FoodID);
        li.appendChild(deleteButton);
        ul.appendChild(li);
    });
    foodListElement.appendChild(ul);
}

// Fetches list from backend and calls display function
async function loadAndDisplayFoods() {
    try {
        const foods = await window.electronAPI.getFoods();
        displayFoods(foods);
    } catch (error) {
        console.error('Failed to load foods:', error);
        if (foodListElement) foodListElement.innerHTML = `<p style="color: red;">Error loading food list.</p>`;
    }
}

// Función para manejar la importación de BIBLIOTECA desde CSV
async function handleImportCSV() {
    if (!importDbSelectElement || !importStatus || !importCsvBtn) { 
        console.error("Import CSV elements missing"); 
        return; 
    }
    const selectedDbIdString = importDbSelectElement.value;
    const selectedDbId = parseInt(selectedDbIdString, 10);
    
    if (!selectedDbId || selectedDbId <= 0) { 
        await window.electronAPI.showErrorDialog('Input Error', 'Please select a valid database to import into.');
        return; 
    }

    importStatus.textContent = 'Importing CSV... Please wait.';
    importCsvBtn.disabled = true;
    if (importButton) importButton.disabled = true;
    importDbSelectElement.disabled = true;

    try {
        const resultMessage = await window.electronAPI.importCSV(selectedDbId);
        importStatus.textContent = resultMessage;
        loadAndDisplayFoods(); // Refresh food list
    } catch (error) {
        console.error('CSV Import failed:', error);
        const errorMsg = String(error);
        if (importStatus) { importStatus.textContent = `CSV Import failed: ${errorMsg}`; }
        await window.electronAPI.showErrorDialog('CSV Import Failed', errorMsg);
    } finally {
        if (importCsvBtn) importCsvBtn.disabled = false;
        if (importButton) importButton.disabled = false;
        if (importDbSelectElement) importDbSelectElement.disabled = false;
    }
}


// --- DETAILED EDIT FORM LOGIC ---
async function showEditForm(foodId: number, currentName: string) {
    console.log(`Editing food ID: ${foodId}, Initial Name: ${currentName}`);
    if (!editFoodFormContainer || !editFoodIdInput || !editFoodNameInput) {
        console.error("Essential Edit form elements not found!");
        await window.electronAPI.showErrorDialog('Error', 'Could not find the core edit form elements.');
        return;
    }
    let foodDetails: IFoodDetails | null = null;
    try {
        editFoodFormContainer.style.display = 'block';
        editFoodIdInput.value = foodId.toString();
        editFoodNameInput.value = "Loading details...";
        foodDetails = await window.electronAPI.getFoodDetails(foodId);
        if (!foodDetails) {
            await window.electronAPI.showErrorDialog('Error', `Could not find details for food ID ${foodId}. Maybe it was deleted?`);
            handleCancelEditFood();
            return;
        }
        console.log("Fetched details for edit:", foodDetails);
    } catch (error) {
        console.error("Failed to fetch food details for editing:", error);
        await window.electronAPI.showErrorDialog('Error Fetching Data', `Error fetching food details: ${error}`);
        handleCancelEditFood();
        return;
    }
    editFoodIdInput.value = foodDetails.FoodID.toString();
    editFoodNameInput.value = foodDetails.Name;
    const setInputValue = (input: HTMLInputElement | null, value: number | null | undefined) => {
        if (input) { input.value = (value != null && !isNaN(value)) ? value.toString() : ''; }
    };
    setInputValue(editEnergyKcalInput, foodDetails.Energy_kcal); setInputValue(editWaterGInput, foodDetails.Water_g);
    setInputValue(editProteinGInput, foodDetails.Protein_g); setInputValue(editFatGInput, foodDetails.Fat_g);
    setInputValue(editCarbohydrateGInput, foodDetails.Carbohydrate_g); setInputValue(editFiberGInput, foodDetails.Fiber_g);
    setInputValue(editSugarGInput, foodDetails.Sugar_g); setInputValue(editAshGInput, foodDetails.Ash_g);
    setInputValue(editSaturatedFatGInput, foodDetails.SaturatedFat_g); setInputValue(editMonounsaturatedFatGInput, foodDetails.MonounsaturatedFat_g);
    setInputValue(editPolyunsaturatedFatGInput, foodDetails.PolyunsaturatedFat_g); setInputValue(editCholesterolMgInput, foodDetails.Cholesterol_mg);
    setInputValue(editCalciumMgInput, foodDetails.Calcium_mg); setInputValue(editPhosphorusMgInput, foodDetails.Phosphorus_mg);
    setInputValue(editIronMgInput, foodDetails.Iron_mg); setInputValue(editSodiumMgInput, foodDetails.Sodium_mg);
    setInputValue(editPotassiumMgInput, foodDetails.Potassium_mg); setInputValue(editMagnesiumMgInput, foodDetails.Magnesium_mg);
    setInputValue(editZincMgInput, foodDetails.Zinc_mg); setInputValue(editCopperMgInput, foodDetails.Copper_mg);
    setInputValue(editManganeseMgInput, foodDetails.Manganese_mg); setInputValue(editVitaminAERInput, foodDetails.VitaminA_ER);
    setInputValue(editThiaminMgInput, foodDetails.Thiamin_mg); setInputValue(editRiboflavinMgInput, foodDetails.Riboflavin_mg);
    setInputValue(editNiacinMgInput, foodDetails.Niacin_mg); setInputValue(editPantothenicAcidMgInput, foodDetails.PantothenicAcid_mg);
    setInputValue(editVitaminB6MgInput, foodDetails.VitaminB6_mg); setInputValue(editFolateMcgInput, foodDetails.Folate_mcg);
    setInputValue(editVitaminB12McgInput, foodDetails.VitaminB12_mcg); setInputValue(editVitaminCMgInput, foodDetails.VitaminC_mg);
    if (foodListElement) foodListElement.style.display = 'none';
    if (foodForm) (foodForm as HTMLFormElement).style.display = 'none';
    editFoodNameInput.focus();
}
async function handleSaveEditFood() {
    console.log("Save edit button clicked");
    if (!editFoodIdInput || !editFoodNameInput) { await window.electronAPI.showErrorDialog('Error', 'Cannot find required form elements to save.'); return; }
    const foodId = parseInt(editFoodIdInput.value, 10);
    const newName = editFoodNameInput.value.trim();
    if (isNaN(foodId) || foodId <= 0) { await window.electronAPI.showErrorDialog('Input Error', 'Invalid Food ID.'); return; }
    if (!newName) { await window.electronAPI.showErrorDialog('Input Error', 'Food name cannot be empty.'); return; }
    const foodData: IFoodDetails = {
        FoodID: foodId, Name: newName,
        Energy_kcal: getNutrientValue(editEnergyKcalInput), Water_g: getNutrientValue(editWaterGInput),
        Protein_g: getNutrientValue(editProteinGInput), Fat_g: getNutrientValue(editFatGInput),
        Carbohydrate_g: getNutrientValue(editCarbohydrateGInput), Fiber_g: getNutrientValue(editFiberGInput),
        Sugar_g: getNutrientValue(editSugarGInput), Ash_g: getNutrientValue(editAshGInput),
        SaturatedFat_g: getNutrientValue(editSaturatedFatGInput), MonounsaturatedFat_g: getNutrientValue(editMonounsaturatedFatGInput),
        PolyunsaturatedFat_g: getNutrientValue(editPolyunsaturatedFatGInput), Cholesterol_mg: getNutrientValue(editCholesterolMgInput),
        Calcium_mg: getNutrientValue(editCalciumMgInput), Phosphorus_mg: getNutrientValue(editPhosphorusMgInput),
        Iron_mg: getNutrientValue(editIronMgInput), Sodium_mg: getNutrientValue(editSodiumMgInput),
        Potassium_mg: getNutrientValue(editPotassiumMgInput), Magnesium_mg: getNutrientValue(editMagnesiumMgInput),
        Zinc_mg: getNutrientValue(editZincMgInput), Copper_mg: getNutrientValue(editCopperMgInput),
        Manganese_mg: getNutrientValue(editManganeseMgInput), VitaminA_ER: getNutrientValue(editVitaminAERInput),
        Thiamin_mg: getNutrientValue(editThiaminMgInput), Riboflavin_mg: getNutrientValue(editRiboflavinMgInput),
        Niacin_mg: getNutrientValue(editNiacinMgInput), PantothenicAcid_mg: getNutrientValue(editPantothenicAcidMgInput),
        VitaminB6_mg: getNutrientValue(editVitaminB6MgInput), Folate_mcg: getNutrientValue(editFolateMcgInput),
        VitaminB12_mcg: getNutrientValue(editVitaminB12McgInput), // <-- CORRECCIÓN DE TIPEO
        VitaminC_mg: getNutrientValue(editVitaminCMgInput),
    };
    console.log("Saving food data:", foodData);
    try {
        const result = await window.electronAPI.updateFoodDetails(foodData);
        console.log(result); 
        await window.electronAPI.showInfoDialog('Success', result);
        handleCancelEditFood(); 
        loadAndDisplayFoods();
    } catch (error) {
        console.error("Failed to save edited food details:", error); 
        await window.electronAPI.showErrorDialog('Save Error', `Error saving changes: ${error}`);
    }
}
function handleCancelEditFood() {
    console.log("Cancel edit button clicked");
    if (editFoodFormContainer) { editFoodFormContainer.style.display = 'none'; }
    if (foodListElement) { foodListElement.style.display = 'block'; }
    if (foodForm) { (foodForm as HTMLFormElement).style.display = 'block'; }
    if (editFoodIdInput) editFoodIdInput.value = ''; if (editFoodNameInput) editFoodNameInput.value = '';
    if (editEnergyKcalInput) editEnergyKcalInput.value = ''; if (editWaterGInput) editWaterGInput.value = '';
    if (editProteinGInput) editProteinGInput.value = ''; if (editFatGInput) editFatGInput.value = '';
    if (editCarbohydrateGInput) editCarbohydrateGInput.value = ''; if (editFiberGInput) editFiberGInput.value = '';
    if (editSugarGInput) editSugarGInput.value = ''; if (editAshGInput) editAshGInput.value = '';
    if (editSaturatedFatGInput) editSaturatedFatGInput.value = ''; if (editMonounsaturatedFatGInput) editMonounsaturatedFatGInput.value = '';
    if (editPolyunsaturatedFatGInput) editPolyunsaturatedFatGInput.value = ''; if (editCholesterolMgInput) editCholesterolMgInput.value = '';
    if (editCalciumMgInput) editCalciumMgInput.value = ''; if (editPhosphorusMgInput) editPhosphorusMgInput.value = '';
    if (editIronMgInput) editIronMgInput.value = ''; if (editSodiumMgInput) editSodiumMgInput.value = '';
    if (editPotassiumMgInput) editPotassiumMgInput.value = ''; if (editMagnesiumMgInput) editMagnesiumMgInput.value = '';
    if (editZincMgInput) editZincMgInput.value = ''; if (editCopperMgInput) editCopperMgInput.value = '';
    if (editManganeseMgInput) editManganeseMgInput.value = ''; if (editVitaminAERInput) editVitaminAERInput.value = '';
    if (editThiaminMgInput) editThiaminMgInput.value = ''; if (editRiboflavinMgInput) editRiboflavinMgInput.value = '';
    if (editNiacinMgInput) editNiacinMgInput.value = ''; if (editPantothenicAcidMgInput) editPantothenicAcidMgInput.value = '';
    if (editVitaminB6MgInput) editVitaminB6MgInput.value = ''; if (editFolateMcgInput) editFolateMcgInput.value = '';
    if (editVitaminB12McgInput) editVitaminB12McgInput.value = ''; if (editVitaminCMgInput) editVitaminCMgInput.value = '';
}
async function handleDelete(foodId: number) {
    const confirmResult = await window.electronAPI.showConfirmDialog({
        type: 'warning', title: 'Confirm Delete',
        message: `Are you sure you want to delete food ID ${foodId}? This will also delete related consumption logs.`,
        buttons: ['Cancel', 'Delete'], defaultId: 0, cancelId: 0
    });
    if (confirmResult.response === 1) { // 1 = Delete
        try {
            const result = await window.electronAPI.deleteFood(foodId);
            console.log(result); 
            await window.electronAPI.showInfoDialog('Success', result);
            loadAndDisplayFoods();
        } catch (error) {
            console.error("Failed to delete food:", error); 
            await window.electronAPI.showErrorDialog('Delete Error', `Error deleting food: ${error}`);
        }
    }
}


// --- CONSUMPTION LOG FUNCTIONS ---
async function searchFoods() {
    if (!foodSearchInputElement || !refDbSelectElement || !foodSelectElement) { console.error("Missing elements for food search"); return; }
    const currentFoodSearchInput = foodSearchInputElement; const currentRefDbSelect = refDbSelectElement;
    const currentFoodSelect = foodSelectElement; const searchTerm = currentFoodSearchInput.value.trim();
    const selectedDbId = parseInt(currentRefDbSelect.value, 10);
    currentFoodSelect.innerHTML = ''; currentFoodSelect.disabled = true;
    if (!selectedDbId || selectedDbId <= 0) { currentFoodSelect.add(new Option("Select Reference DB first", "")); return; }
    if (searchTerm.length < 1) { currentFoodSelect.add(new Option("-- Type to search --", "")); return; }
    console.log(`Searching for "${searchTerm}" in DB ID ${selectedDbId}`);
    try {
        const results = await window.electronAPI.searchFoods(searchTerm, selectedDbId);
        currentFoodSelect.innerHTML = '';
        if (results.length > 0) { results.forEach(food => currentFoodSelect.add(new Option(food.Name, food.FoodID.toString()))); currentFoodSelect.disabled = false; }
        else { currentFoodSelect.add(new Option("No results found", "")); }
    } catch (error) {
        console.error('Food search failed:', error); currentFoodSelect.innerHTML = '';
        currentFoodSelect.add(new Option("Error during search", ""));
    }
}
async function addLogEntry(event: Event) {
    event.preventDefault();
    if (!userIdInputElement || !consumptionDateElement || !refDbSelectElement || !foodSelectElement || !gramsInputElement || !mealTypeSelectElement) { console.error("Missing elements for adding log entry"); return; }
    const userId = userIdInputElement.value.trim(); const consumptionDate = consumptionDateElement.value;
    const mealType = mealTypeSelectElement.value; const foodId = parseInt(foodSelectElement.value, 10);
    const referenceDatabaseId = parseInt(refDbSelectElement.value, 10); const grams = parseFloat(gramsInputElement.value);
    if (!userId) { await window.electronAPI.showErrorDialog('Input Error', 'Please enter a User/Group ID.'); return; }
    if (!consumptionDate) { await window.electronAPI.showErrorDialog('Input Error', 'Please select a date.'); return; }
    if (!foodId || foodId <= 0 || isNaN(foodId)) { await window.electronAPI.showErrorDialog('Input Error', 'Please search and select a valid food.'); return; }
    if (!referenceDatabaseId || referenceDatabaseId <= 0) { await window.electronAPI.showErrorDialog('Input Error', 'Please select a valid reference database.'); return; }
    if (isNaN(grams) || grams <= 0) { await window.electronAPI.showErrorDialog('Input Error', 'Please enter a valid positive number for grams.'); return; }
    const logData: INewLogEntryData = { userId, consumptionDate, mealType: mealType || undefined, foodId, referenceDatabaseId, grams };
    console.log("Adding log entry:", logData);
    try {
        const result = await window.electronAPI.addLogEntry(logData); console.log(result);
        if (foodSearchInputElement) foodSearchInputElement.value = '';
        if (foodSelectElement) { foodSelectElement.innerHTML = ''; foodSelectElement.add(new Option("-- Search results --", "")); foodSelectElement.disabled = true; }
        if (gramsInputElement) gramsInputElement.value = '';
        loadAndDisplayLogEntries();
        loadUniqueUserIDs(); // *** NUEVO: Actualizar datalist ***
    } catch (error) {
        console.error("Failed to add log entry:", error); 
        await window.electronAPI.showErrorDialog('Save Error', `Error adding log entry: ${error}`);
    }
}
function displayLogEntries(entries: ILogEntry[]) {
     if (!logEntriesElement) return;
     logEntriesElement.innerHTML = '';
     if (entries.length === 0) { logEntriesElement.innerHTML = '<p>No log entries found for this user and date.</p>'; return; }
     const table = document.createElement('table'); table.style.width = '100%'; table.style.borderCollapse = 'collapse'; table.style.marginTop = '10px';
     const thead = table.createTHead(); const headerRow = thead.insertRow();
     ['Time Added', 'Meal', 'Food', 'Ref DB', 'Grams', 'Actions'].forEach(text => {
         const th = document.createElement('th'); th.textContent = text;
         th.style.border = '1px solid #ccc'; th.style.padding = '4px 8px'; th.style.textAlign = 'left'; th.style.backgroundColor = '#f2f2f2';
         headerRow.appendChild(th);
     });
     const tbody = table.createTBody();
     entries.forEach(entry => {
        const row = tbody.insertRow(); 
        
        // *** CORRECCIÓN DE ZONA HORARIA ***
        const timestamp = entry.Timestamp 
            ? new Date(entry.Timestamp.replace(" ", "T") + "Z").toLocaleTimeString() 
            : 'N/A';
        
        [ timestamp, entry.MealType || '-', entry.FoodName, entry.ReferenceDatabaseName, entry.Grams.toString(), '' ]
        .forEach((text, index) => {
            const cell = row.insertCell(); cell.textContent = text;
            cell.style.border = '1px solid #ccc'; cell.style.padding = '4px 8px';
            if (index === 4) cell.style.textAlign = 'right';
        });
        const actionCell = row.cells[row.cells.length - 1]; actionCell.style.textAlign = 'center';

        // *** Botón de Editar Log ***
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.style.padding = '2px 5px';
        editBtn.style.marginRight = '5px';
        editBtn.onclick = () => {
            handleEditLogEntry(entry.LogID, entry.FoodName, entry.Grams);
        };
        actionCell.appendChild(editBtn);
        
        // Botón Borrar (con diálogo no bloqueante)
        const deleteBtn = document.createElement('button'); deleteBtn.textContent = 'Delete'; deleteBtn.style.padding = '2px 5px';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = async () => { 
            const confirmResult = await window.electronAPI.showConfirmDialog({
                type: 'warning', title: 'Confirm Deletion',
                message: `Delete entry: ${entry.FoodName} (${entry.Grams}g)?`,
                buttons: ['Cancel', 'Delete'], defaultId: 0, cancelId: 0
            });
            if (confirmResult.response === 1) { // 1 = Delete
                try { 
                    const result = await window.electronAPI.deleteLogEntry(entry.LogID); 
                    console.log(result); 
                    loadAndDisplayLogEntries(); 
                } catch (err) { 
                    console.error("Failed to delete log entry:", err); 
                    await window.electronAPI.showErrorDialog('Delete Error', `Error deleting log entry: ${err}`);
                } 
            } 
        };
        actionCell.appendChild(deleteBtn);
    });
    logEntriesElement.appendChild(table);
}
async function loadAndDisplayLogEntries() {
     if (!userIdInputElement || !consumptionDateElement || !logEntriesElement) return;
     const userId = userIdInputElement.value.trim(); const date = consumptionDateElement.value;
     logEntriesElement.innerHTML = '';
     if (!userId || !date) { logEntriesElement.innerHTML = '<p>Please enter User/Group ID and select a date to view logs.</p>'; return; }
     logEntriesElement.innerHTML = '<p>Loading entries...</p>';
     console.log(`Loading log entries for User: ${userId}, Date: ${date}`);
     try {
         const entries = await window.electronAPI.getLogEntries(userId, date);
         console.log("Log entries received:", entries); displayLogEntries(entries);
     } catch (error) {
         console.error('Failed to load log entries:', error);
         if (logEntriesElement) logEntriesElement.innerHTML = `<p style="color: red;">Error loading log entries: ${error}</p>`;
     }
}

// *** MODIFICADO: Ahora acepta 'useCsv' ***
async function handleImportLog(useCsv: boolean = false) {
    const importType = useCsv ? 'CSV' : 'Excel';
    console.log(`Import Log (${importType}) button clicked!`);

    if (!importLogButton || !importLogCsvBtn || !importLogStatus) {
        console.error("Import Log button or status element not found.");
        return;
    }
    importLogStatus.textContent = `Importing log from ${importType}... Please wait.`;
    importLogButton.disabled = true;
    importLogCsvBtn.disabled = true;

    try {
        let response;
        // *** MODIFICADO: Llama a la función correcta ***
        if (useCsv) {
            response = await window.electronAPI.importConsumptionLogCsv();
        } else {
            response = await window.electronAPI.importConsumptionLog();
        }
        
        console.log(`Log import (${importType}) result:`, response.message);
        importLogStatus.textContent = response.message;
        
        if (response.message.toLowerCase().includes('success')) {
            loadUniqueUserIDs(); // Actualizar datalist
            
            if (response.firstEntry) {
                // Rellenar los filtros con el primer dato importado
                if (userIdInputElement) {
                    userIdInputElement.value = response.firstEntry.userId;
                }
                if (consumptionDateElement) {
                    consumptionDateElement.value = response.firstEntry.date;
                }
            }
            // Recargar la lista usando los filtros (ahora actualizados)
            loadAndDisplayLogEntries();
             
        } else if (!response.message.toLowerCase().includes('success')) {
             await window.electronAPI.showErrorDialog('Log Import Warning', response.message);
        }
    } catch (error) {
        console.error(`Log import (${importType}) failed:`, error);
        const errorMsg = String(error);
        importLogStatus.textContent = `Log import (${importType}) failed: ${errorMsg}`;
        await window.electronAPI.showErrorDialog('Log Import Failed', errorMsg);
    } finally {
        if (importLogButton) importLogButton.disabled = false;
        if (importLogCsvBtn) importLogCsvBtn.disabled = false;
    }
}
async function handleEditLogEntry(logId: number, foodName: string, currentGrams: number) {
    console.log(`Attempting to edit LogID: ${logId} (${foodName})`);

    // 1. Verificar si los elementos del modal existen
    if (!editLogModal || !editLogIdInput || !editLogGramsInput || !editLogFoodName) {
        console.error("Edit Log Modal elements not found!");
        await window.electronAPI.showErrorDialog('UI Error', 'Could not find the log edit modal elements.');
        return;
    }

    // 2. Rellenar el modal con los datos actuales
    editLogIdInput.value = logId.toString();
    editLogFoodName.textContent = foodName;
    editLogGramsInput.value = currentGrams.toString();
    
    // 3. Mostrar el modal
    editLogModal.style.display = 'block';
    editLogGramsInput.focus();
    editLogGramsInput.select();
}
function handleCancelLogEdit() {
    if (editLogModal) {
        editLogModal.style.display = 'none';
    }
    // Limpiar campos
    if (editLogIdInput) editLogIdInput.value = '';
    if (editLogFoodName) editLogFoodName.textContent = '';
    if (editLogGramsInput) editLogGramsInput.value = '';
}
async function handleSaveLogEdit() {
    if (!editLogIdInput || !editLogGramsInput) {
        console.error("Modal elements missing during save.");
        return;
    }
    
    const logId = parseInt(editLogIdInput.value, 10);
    const newGrams = parseFloat(editLogGramsInput.value);

    // 1. Validar la entrada
    if (isNaN(logId) || logId <= 0) {
        await window.electronAPI.showErrorDialog('Error', 'Invalid Log ID. Cannot save.');
        return;
    }
    if (isNaN(newGrams) || newGrams <= 0) {
        await window.electronAPI.showErrorDialog('Invalid Input', 'Please enter a valid positive number for grams.');
        return;
    }

    // 2. Llamar al backend
    try {
        const result = await window.electronAPI.editLogEntry(logId, newGrams); 
        console.log(result);
        
        // 3. Cerrar modal y recargar
        handleCancelLogEdit(); // Cierra y limpia el modal
        loadAndDisplayLogEntries(); // Recarga la tabla de logs

    } catch (error) {
        console.error("Failed to edit log entry:", error);
        await window.electronAPI.showErrorDialog('Edit Error', `Error editing log entry: ${error}`);
    }
}


// --- CALCULATION / REPORTING FUNCTIONS (Module 3) ---
const nutrientDisplayOrder: (keyof INutrientTotals)[] = [
    'totalEnergy_kcal', 'totalWater_g', 'totalProtein_g', 'totalFat_g', 'totalCarbohydrate_g',
    'totalFiber_g', 'totalSugar_g', 'totalSaturatedFat_g', 'totalMonounsaturatedFat_g',
    'totalPolyunsaturatedFat_g', 'totalCholesterol_mg', 'totalAsh_g', 'totalCalcium_mg',
    'totalPhosphorus_mg', 'totalIron_mg', 'totalSodium_mg', 'totalPotassium_mg',
    'totalMagnesium_mg', 'totalZinc_mg', 'totalCopper_mg', 'totalManganese_mg',
    'totalVitaminA_ER', 'totalThiamin_mg', 'totalRiboflavin_mg', 'totalNiacin_mg',
    'totalPantothenicAcid_mg', 'totalVitaminB6_mg', 'totalFolate_mcg',
    'totalVitaminB12_mcg', 'totalVitaminC_mg'
];
async function handleCalculateIntake() {
    console.log("Calculate Intake button clicked.");
    if (!reportUserIdInputElement || !reportStartDateElement || !reportEndDateElement || !reportRefDbSelectElement || !reportResultsElement) { /* ... */ return; }
    lastCalculatedTotals = null;
    if (exportControls) exportControls.style.display = 'none';
    const userId = reportUserIdInputElement.value.trim();
    const startDate = reportStartDateElement.value;
    const endDate = reportEndDateElement.value;
    const referenceDbId = parseInt(reportRefDbSelectElement.value, 10);
    if (!userId) { reportResultsElement.innerHTML = `<p style="color: orange;">Please enter a User/Group ID.</p>`; return; }
    if (!startDate) { reportResultsElement.innerHTML = `<p style="color: orange;">Please select a Start Date.</p>`; return; }
    if (!endDate) { reportResultsElement.innerHTML = `<p style="color: orange;">Please select an End Date.</p>`; return; }
    if (startDate > endDate) { reportResultsElement.innerHTML = `<p style="color: orange;">Start Date cannot be after End Date.</p>`; return; }
    if (!referenceDbId || referenceDbId <= 0) { reportResultsElement.innerHTML = `<p style="color: orange;">Please select a valid Reference Database.</p>`; return; }
    reportResultsElement.innerHTML = '<p>Calculating...</p>';
    
    // *** NUEVO v0.3: Limpiar resultados de análisis al calcular totales ***
    clearAnalysisResults();

    try {
        console.log(`Requesting calculation for User: ${userId}, Dates: ${startDate} to ${endDate}, RefDB: ${referenceDbId}`);
        const totals: INutrientTotals = await window.electronAPI.calculateIntake(userId, startDate, endDate, referenceDbId);
        console.log("Calculation results received:", totals);
        lastCalculatedTotals = totals;
        lastReportTitle = `Nutrient Totals for ${userId} (${startDate === endDate ? startDate : `${startDate} to ${endDate}`})`;
        displayReportResults(totals, userId, startDate, endDate);
    } catch (error) {
        console.error("Calculation failed:", error);
        reportResultsElement.innerHTML = `<p style="color: red;">Error calculating intake: ${error}</p>`;
        await window.electronAPI.showErrorDialog('Calculation Error', `Error calculating intake: ${error}`);
    }
}
function displayReportResults(totals: INutrientTotals, userId: string, startDate: string, endDate: string) {
    if (!reportResultsElement) return;
    reportResultsElement.innerHTML = '';
    const title = document.createElement('h3');
    const dateRangeString = startDate === endDate ? startDate : `${startDate} to ${endDate}`;
    title.textContent = `Nutrient Totals for ${userId} (${dateRangeString})`;
    reportResultsElement.appendChild(title);
    const table = document.createElement('table');
    table.style.width = '100%'; table.style.marginTop = '10px'; table.style.borderCollapse = 'collapse';
    const tbody = table.createTBody();
    let nutrientsFound = false;
    nutrientDisplayOrder.forEach(key => {
        if (totals.hasOwnProperty(key) && totals[key] != null) {
            nutrientsFound = true;
            const keyAsString: string = key as string;
            let displayName = keyAsString.replace(/^total/, '');
            let unit = '';
            if (displayName.includes('_')) {
                const parts = displayName.split('_');
                unit = parts.pop() || '';
                displayName = parts.map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
            } else {
                displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
            }
            const value = totals[key];
            const row = tbody.insertRow();
            const cellName = row.insertCell(); cellName.textContent = displayName; cellName.style.fontWeight = 'bold'; cellName.style.padding = '4px 8px'; cellName.style.border = '1px solid #ddd';
            const cellValue = row.insertCell();
            const formattedValue = value.toFixed(Math.abs(value) < 1 ? 2 : (Math.abs(value) < 100 ? 1 : 0));
            cellValue.textContent = formattedValue;
            cellValue.style.textAlign = 'right'; cellValue.style.padding = '4px 8px'; cellValue.style.border = '1px solid #ddd';
            const cellUnit = row.insertCell(); cellUnit.textContent = unit;
            cellUnit.style.padding = '4px 8px'; cellUnit.style.border = '1px solid #ddd';
        } else if (!totals.hasOwnProperty(key)) {
             console.warn(`Nutrient key "${key}" from display order not found in calculation results.`);
        }
    });
    if (!nutrientsFound) {
         reportResultsElement.innerHTML += '<p>No nutrient data found or calculated for the specified order.</p>';
         if (exportControls) exportControls.style.display = 'none';
         return;
    }
    reportResultsElement.appendChild(table);
    if (exportControls) {
        exportControls.style.display = 'block';
    }
    const allKeysInTotals: string[] = Object.keys(totals);
    const remainingKeys = allKeysInTotals.filter(k => totals[k] != null && !nutrientDisplayOrder.includes(k as keyof INutrientTotals));
    if (remainingKeys.length > 0) {
        console.warn("Nutrients found but not in display order (these were not displayed):", remainingKeys);
    }
}
async function handleExport(format: 'csv' | 'xlsx') {
    if (!lastCalculatedTotals) {
        await window.electronAPI.showErrorDialog('Export Error', 'Please run a calculation first before exporting.');
        return;
    }
    if (!exportCsvBtn || !exportExcelBtn) return;
    exportCsvBtn.disabled = true;
    exportExcelBtn.disabled = true;
    try {
        const dataToExport: IReportRow[] = [];
        nutrientDisplayOrder.forEach(key => {
            if (lastCalculatedTotals!.hasOwnProperty(key) && lastCalculatedTotals![key] != null) {
                const keyAsString: string = key as string;
                let displayName = keyAsString.replace(/^total/, '');
                let unit = '';
                if (displayName.includes('_')) {
                    const parts = displayName.split('_');
                    unit = parts.pop() || '';
                    displayName = parts.map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
                } else {
                    displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
                }
                const value = lastCalculatedTotals![key];
                const formattedValue = value.toFixed(Math.abs(value) < 1 ? 2 : (Math.abs(value) < 100 ? 1 : 0));
                dataToExport.push({ nutrient: displayName, value: formattedValue, unit: unit });
            }
        });
        console.log(`Exporting report as ${format}...`);
        const result = await window.electronAPI.exportReport(lastReportTitle, dataToExport, format);
        console.log(result);
        await window.electronAPI.showInfoDialog('Export Success', result);
    } catch (error) {
        console.error(`Failed to export as ${format}:`, error);
        await window.electronAPI.showErrorDialog('Export Error', `Error exporting report: ${error}`);
    } finally {
        if (exportCsvBtn) exportCsvBtn.disabled = false;
        if (exportExcelBtn) exportExcelBtn.disabled = false;
    }
}

// *** NUEVO: Rellenar el selector de nutrientes (v0.3) ***
function populateNutrientSelect() {
    // *** CORRECCIÓN: Comprobar la constante local ***
    const selectElement = nutrientSelect;
    if (!selectElement) {
        console.error("Nutrient select element not found!");
        return;
    }
    
    selectElement.innerHTML = ''; // Limpiar opciones
    
    nutrientDisplayOrder.forEach(key => {
        const keyAsString: string = key as string;
        let displayName = keyAsString.replace(/^total/, '');
        let unit = '';
        if (displayName.includes('_')) {
            const parts = displayName.split('_');
            unit = parts.pop() || '';
            displayName = parts.map((part: string) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
        } else {
            displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
        }
        
        const option = document.createElement('option');
        option.value = keyAsString.replace('total', ''); // "Energy_kcal"
        option.textContent = `${displayName} (${unit})`; // "Energy (kcal)"
        selectElement.appendChild(option);
    });
}

// *** NUEVO: Función de ayuda para obtener criterios de análisis (v0.3) ***
async function getAnalysisCriteria(): Promise<{ userIds: string[], singleUserId: string, startDate: string, endDate: string, referenceDbId: number, nutrient: string, nutrientLabel: string } | null> {
    if (!reportUserIdInputElement || !reportStartDateElement || !reportEndDateElement || !reportRefDbSelectElement || !nutrientSelect) {
        await window.electronAPI.showErrorDialog('Error', 'Missing UI elements for analysis.');
        return null;
    }
    
    const userIds = reportUserIdInputElement.value.split(',').map(id => id.trim()).filter(id => id.length > 0);
    const startDate = reportStartDateElement.value;
    const endDate = reportEndDateElement.value;
    const referenceDbId = parseInt(reportRefDbSelectElement.value, 10);
    const nutrient = nutrientSelect.value; // ej: "Energy_kcal"
    const nutrientLabel = nutrientSelect.options[nutrientSelect.selectedIndex]?.text; // ej: "Energy (kcal)"

    // --- Validación ---
    if (userIds.length === 0) {
        await window.electronAPI.showErrorDialog('Input Error', 'Please enter at least one User/Group ID for analysis.');
        return null;
    }
    if (!startDate) { await window.electronAPI.showErrorDialog('Input Error', 'Please select a Start Date.'); return null; }
    if (!endDate) { await window.electronAPI.showErrorDialog('Input Error', 'Please select an End Date.'); return null; }
    if (startDate > endDate) { await window.electronAPI.showErrorDialog('Input Error', 'Start Date cannot be after End Date.'); return null; }
    if (!referenceDbId || referenceDbId <= 0) { await window.electronAPI.showErrorDialog('Input Error', 'Please select a valid Reference Database.'); return null; }
    if (!nutrient) { await window.electronAPI.showErrorDialog('Input Error', 'Please select a nutrient to analyze.'); return null; }

    return { userIds, singleUserId: userIds[0], startDate, endDate, referenceDbId, nutrient, nutrientLabel };
}

// *** NUEVO: Limpiar resultados de análisis (v0.3) ***
function clearAnalysisResults() {
    if (statsResults) statsResults.innerHTML = '';
    if (chartContainer) chartContainer.style.display = 'none';
    if (myChart) {
        myChart.clear();
    }
}

// --- NUEVO: Funciones de renderizado de gráficos (v0.3) ---

// 1. Botón "Get Group Statistics"
async function handleRenderStatsTable() {
    const criteria = await getAnalysisCriteria();
    if (!criteria) return;
    
    clearAnalysisResults();
    if (reportResultsElement) reportResultsElement.innerHTML = '<p>Calculating statistics...</p>';
    
    try {
        const stats = await window.electronAPI.getStatisticalReport(criteria.userIds, criteria.startDate, criteria.endDate, criteria.referenceDbId, criteria.nutrient);
        
        if (reportResultsElement) reportResultsElement.innerHTML = ''; // Limpiar "calculando"
        if (!statsResults) return;

        statsResults.innerHTML = `
            <h3>Statistical Report for ${criteria.nutrientLabel}</h3>
            <p>Based on the daily average intake of <strong>${stats.count} user(s)</strong>.</p>
            <table style="width: 300px;">
                <tbody>
                    <tr><td>Mean (Promedio)</td><td style="text-align: right;">${stats.mean.toFixed(2)}</td></tr>
                    <tr><td>Median (Mediana)</td><td style="text-align: right;">${stats.median.toFixed(2)}</td></tr>
                    <tr><td>Std. Deviation (DE)</td><td style="text-align: right;">${stats.stdDev.toFixed(2)}</td></tr>
                    <tr><td>Variance (Varianza)</td><td style="text-align: right;">${stats.variance.toFixed(2)}</td></tr>
                    <tr><td>Minimum</td><td style="text-align: right;">${stats.min.toFixed(2)}</td></tr>
                    <tr><td>Maximum</td><td style="text-align: right;">${stats.max.toFixed(2)}</td></tr>
                    <tr><td>25th Percentile (Q1)</td><td style="text-align: right;">${stats.q1.toFixed(2)}</td></tr>
                    <tr><td>75th Percentile (Q3)</td><td style="text-align: right;">${stats.q3.toFixed(2)}</td></tr>
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error("Failed to get statistical report:", error);
        await window.electronAPI.showErrorDialog('Analysis Error', `Error calculating statistics: ${error}`);
        if (reportResultsElement) reportResultsElement.innerHTML = '';
    }
}

// 2. Botón "Show Distribution (Histogram)"
async function handleRenderHistogram() {
    const criteria = await getAnalysisCriteria();
    if (!criteria) return;

    clearAnalysisResults();
    if (reportResultsElement) reportResultsElement.innerHTML = '<p>Generating histogram...</p>';

    try {
        const stats = await window.electronAPI.getStatisticalReport(criteria.userIds, criteria.startDate, criteria.endDate, criteria.referenceDbId, criteria.nutrient);
        if (stats.rawData.length === 0) {
            if (reportResultsElement) reportResultsElement.innerHTML = '<p>No data found to build histogram.</p>';
            return;
        }

        // *** CORRECCIÓN: Usar (echarts as any).dataTool.histogram ***
        const bins = (echarts as any).dataTool.histogram(stats.rawData);
        
        const chartData = bins.data.map((item: any) => {
            return [item.x0, item.count]; // [inicio_del_bin, conteo]
        });

        if (reportResultsElement) reportResultsElement.innerHTML = '';
        if (chartContainer) chartContainer.style.display = 'block';

        myChart?.setOption({
            title: {
                text: `Distribution of ${criteria.nutrientLabel}`,
                subtext: `Daily Averages for ${stats.count} Users`,
                left: 'center',
                top: 20
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: (params: any) => {
                    const data = params[0].data;
                    const binInfo = bins.data[params[0].dataIndex];
                    if (binInfo) {
                        return `Range: ${data[0].toFixed(1)} - ${binInfo.x1.toFixed(1)}<br/>Count: ${data[1]}`;
                    }
                    return `Range: ${data[0].toFixed(1)}<br/>Count: ${data[1]}`;
                }
            },
            xAxis: {
                type: 'value',
                name: criteria.nutrientLabel,
                nameLocation: 'middle',
                nameGap: 30,
                axisLabel: { formatter: '{value}' }
            },
            yAxis: {
                type: 'value',
                name: 'Number of Users'
            },
            series: [{
                name: 'Count',
                type: 'bar',
                barWidth: '99%',
                data: chartData
            }]
        });
        
        // *** CORRECCIÓN Bug de Tamaño: Añadir resize() DESPUÉS de setOption ***
        myChart?.resize();

    } catch (error) {
        console.error("Failed to render histogram:", error);
        await window.electronAPI.showErrorDialog('Analysis Error', `Error rendering histogram: ${error}`);
        if (reportResultsElement) reportResultsElement.innerHTML = '';
    }
}

// 3. Botón "Compare Groups (Box Plot)"
async function handleRenderBoxPlot() {
    // Esta función es más compleja, por ahora solo mostramos los datos del primer grupo
    // En una v0.4, modificaríamos getAnalysisCriteria para agrupar por UserID
    await window.electronAPI.showInfoDialog("Función en Desarrollo", "La comparación de grupos (Box Plot) se implementará en una futura versión. Por ahora, use 'Get Group Statistics' para ver los datos de un grupo.");
    
    // Aquí iría la lógica futura:
    // 1. Obtener UserIDs (ej. "GrupoA:User1,User2", "GrupoB:User3,User4")
    // 2. Llamar a `getStatisticalReport` por *cada grupo*.
    // 3. Formatear los datos para ECharts boxplot: [min, q1, median, q3, max]
    // 4. myChart.setOption(...)
}

// 4. Botón "Top 5 Food Sources (Pie)"
async function handleRenderPieChart(type: 'food' | 'meal') {
    const criteria = await getAnalysisCriteria();
    if (!criteria) return;
    if (criteria.userIds.length > 1) {
        await window.electronAPI.showErrorDialog('Input Error', 'Pie charts are for individual analysis. Please enter only one User/Group ID.');
        return;
    }

    clearAnalysisResults();
    if (reportResultsElement) reportResultsElement.innerHTML = '<p>Generating pie chart...</p>';

    try {
        let data: IContributionReport[] = [];
        let titleText = '';

        if (type === 'food') {
            data = await window.electronAPI.getNutrientContribution(criteria.singleUserId, criteria.startDate, criteria.endDate, criteria.referenceDbId, criteria.nutrient);
            titleText = `Top Food Sources for ${criteria.nutrientLabel}`;
        } else {
            data = await window.electronAPI.getMealContribution(criteria.singleUserId, criteria.startDate, criteria.endDate, criteria.referenceDbId, criteria.nutrient);
            titleText = `Intake by Meal for ${criteria.nutrientLabel}`;
        }

        if (data.length === 0) {
            if (reportResultsElement) reportResultsElement.innerHTML = '<p>No contribution data found.</p>';
            return;
        }

        // Lógica para "Top 5 + Otros" (si es por comida)
        if (type === 'food' && data.length > 5) {
            const top5 = data.slice(0, 5);
            const othersValue = data.slice(5).reduce((sum, item) => sum + item.value, 0);
            data = top5;
            if (othersValue > 0) {
                data.push({ name: 'Others', value: othersValue });
            }
        }
        
        if (reportResultsElement) reportResultsElement.innerHTML = '';
        if (chartContainer) chartContainer.style.display = 'block';

        myChart?.setOption({
            title: {
                text: titleText,
                subtext: `User: ${criteria.singleUserId} (${criteria.startDate} to ${criteria.endDate})`,
                left: 'center',
                top: 20
            },
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c} ({d}%)' // {b} = name, {c} = value, {d} = percent
            },
            legend: {
                orient: 'vertical',
                left: 'left',
                top: 'middle'
            },
            series: [{
                name: 'Contribution',
                type: 'pie',
                radius: '55%',
                center: ['55%', '50%'],
                data: data.map(item => ({...item, value: parseFloat(item.value.toFixed(2))})), // Formatear valor
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }]
        });
        
        // *** CORRECCIÓN Bug de Tamaño: Añadir resize() DESPUÉS de setOption ***
        myChart?.resize();

    } catch (error) {
        console.error(`Failed to render ${type} pie chart:`, error);
        await window.electronAPI.showErrorDialog('Analysis Error', `Error rendering pie chart: ${error}`);
        if (reportResultsElement) reportResultsElement.innerHTML = '';
    }
}

// Borrar todos los logs de un click

async function handleDeleteAllLogs() {
  // 1. Primera Confirmación
  const confirm1 = await window.electronAPI.showConfirmDialog({
    type: 'warning',
    title: 'Confirm Delete ALL Logs',
    message: 'Are you sure you want to delete ALL consumption log entries for ALL users?',
    detail: 'This action is irreversible and will completely empty the log. This cannot be undone.',
    buttons: ['Cancel', 'Yes, Delete All Logs'],
    defaultId: 0, cancelId: 0
  });

  if (confirm1.response !== 1) return;

  // 2. Segunda Confirmación (MUY Fuerte)
  const confirm2 = await window.electronAPI.showConfirmDialog({
    type: 'error',
    title: 'FINAL WARNING',
    message: 'This will delete EVERY log entry in the database. Are you absolutely sure?',
    buttons: ['Cancel', 'Yes, I understand, delete everything.'],
    defaultId: 0, cancelId: 0
  });

  if (confirm2.response !== 1) return;

  try {
    const result = await window.electronAPI.deleteAllLogs();
    await window.electronAPI.showInfoDialog('Success', result);
    loadAndDisplayLogEntries(); // Recargar la lista de logs (que estará vacía)
    loadUniqueUserIDs(); // Recargar la lista de usuarios (que estará vacía)
  } catch (error) {
    console.error("Failed to delete all logs:", error);
    await window.electronAPI.showErrorDialog('Error Deleting All Logs', String(error));
  }
}


async function handleDeleteLogsForUser() {
  if (!userIdInputElement) {
    console.error("UserID input element not found.");
    return;
  }
  const userId = userIdInputElement.value.trim();

  if (!userId) {
    await window.electronAPI.showErrorDialog('Invalid UserID', 'Please enter a UserID to delete.');
    return;
  }
  
  const confirm1 = await window.electronAPI.showConfirmDialog({
    type: 'warning',
    title: 'Confirm Delete User Logs',
    message: `Are you sure you want to delete ALL log entries for "${userId}"?`,
    detail: 'This will permanently remove all consumption records for this user, across all dates. This action is irreversible.',
    buttons: ['Cancel', 'Yes, Delete All'],
    defaultId: 0, cancelId: 0
  });

  if (confirm1.response !== 1) return; // Si no es "Yes, Delete All"

  try {
    const result = await window.electronAPI.deleteLogsForUser(userId);
    await window.electronAPI.showInfoDialog('Success', result);
    loadAndDisplayLogEntries(); // Recargar la lista de logs
    loadUniqueUserIDs(); // Recargar la lista de usuarios
  } catch (error) {
    console.error("Failed to delete user logs:", error);
    await window.electronAPI.showErrorDialog('Error Deleting Logs', String(error));
  }
}

// Funcion de purga de la base de datos

// En src/renderer.ts
async function handlePurgeFoodLibrary() {
  console.log('--- Debug: handlePurgeFoodLibrary Fired ---'); // <-- LOG 1
  if (!dbSelectElement) {
    console.error("Database select element not found.");
    return;
  }
  const selectedDbId = parseInt(dbSelectElement.value, 10);
  const selectedDbName = dbSelectElement.options[dbSelectElement.selectedIndex]?.text;

  console.log(`Debug: Selected DB ID: ${selectedDbId}, Name: ${selectedDbName}`); // <-- LOG 2

  if (!selectedDbId || selectedDbId <= 0) {
    console.log('Debug: Invalid DB ID selected.'); // <-- LOG 3
    await window.electronAPI.showErrorDialog('Invalid Selection', 'Please select a valid database to purge.');
    return;
  }
  
  // 1. Primera Confirmación
  const confirm1 = await window.electronAPI.showConfirmDialog({
    type: 'warning',
    title: 'Confirm Purge Library',
    message: `Are you sure you want to delete ALL food items from "${selectedDbName}"?`,
    detail: 'This action is irreversible and will remove all food entries from this library. The library itself will remain.',
    buttons: ['Cancel', 'Yes, Purge Foods'],
    defaultId: 0, cancelId: 0
  });

  if (confirm1.response !== 1) {
    console.log('Debug: User cancelled at first dialog.'); // <-- LOG 4
    return;
  }

  console.log('Debug: User passed first confirmation.'); // <-- LOG 5

  // 2. Segunda Confirmación (más fuerte)
  const confirm2 = await window.electronAPI.showConfirmDialog({
    type: 'error',
    title: 'FINAL WARNING',
    message: `All ${selectedDbName} foods will be deleted. Are you absolutely sure?`,
    buttons: ['Cancel', 'Yes, Delete All Foods'],
    defaultId: 0, cancelId: 0
  });

  if (confirm2.response !== 1) {
    console.log('Debug: User cancelled at FINAL dialog.'); // <-- LOG 6
    return;
  }

  console.log('Debug: User passed second confirmation. Sending IPC call...'); // <-- LOG 7

  try {
    const result = await window.electronAPI.purgeFoodLibrary(selectedDbId);
    console.log('Debug: IPC call successful. Result:', result); // <-- LOG 8
    await window.electronAPI.showInfoDialog('Success', result);
    loadAndDisplayFoods(); // Recargar la lista de alimentos
  } catch (error) {
    console.error("Debug: IPC call FAILED.", error); // <-- LOG 9 (ERROR)
    await window.electronAPI.showErrorDialog('Error Purging Library', String(error));
  }
}








// 5. Botón "Intake Over Time (Line)"
async function handleRenderLineChart() {
    const criteria = await getAnalysisCriteria();
    if (!criteria) return;
    if (criteria.userIds.length > 1) {
        await window.electronAPI.showErrorDialog('Input Error', 'Line charts are for individual analysis. Please enter only one User/Group ID.');
        return;
    }

    clearAnalysisResults();
    if (reportResultsElement) reportResultsElement.innerHTML = '<p>Generating line chart...</p>';

    try {
        const data = await window.electronAPI.getDailyIntakeOverTime(criteria.singleUserId, criteria.startDate, criteria.endDate, criteria.referenceDbId, criteria.nutrient);
        
        if (data.length === 0) {
            if (reportResultsElement) reportResultsElement.innerHTML = '<p>No daily intake data found for this period.</p>';
            return;
        }

        if (reportResultsElement) reportResultsElement.innerHTML = '';
        if (chartContainer) chartContainer.style.display = 'block';

        myChart?.setOption({
            title: {
                text: `Daily Intake for ${criteria.nutrientLabel}`,
                subtext: `User: ${criteria.singleUserId}`,
                left: 'center',
                top: 20
            },
            tooltip: {
                trigger: 'axis',
                formatter: (params: any) => `${params[0].axisValue}<br/>${params[0].seriesName}: ${params[0].value.toFixed(2)}`
            },
            xAxis: {
                type: 'category',
                data: data.map(item => item.date), // Fechas
                name: 'Date'
            },
            yAxis: {
                type: 'value',
                name: criteria.nutrientLabel,
                axisLabel: { formatter: '{value}' }
            },
            series: [{
                name: criteria.nutrientLabel,
                type: 'line',
                data: data.map(item => item.value), // Valores
                smooth: true
            }]
        });
        
        // *** CORRECCIÓN Bug de Tamaño: Añadir resize() DESPUÉS de setOption ***
        myChart?.resize();

    } catch (error) {
        console.error("Failed to render line chart:", error);
        await window.electronAPI.showErrorDialog('Analysis Error', `Error rendering line chart: ${error}`);
        if (reportResultsElement) reportResultsElement.innerHTML = '';
    }
}


// --- DOMContentLoaded ---
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');

    // --- Assign ALL DOM Elements ---
    // Library Management
    dbSelectElement = document.getElementById('dbSelect') as HTMLSelectElement | null;
    importDbSelectElement = document.getElementById('importDbSelect') as HTMLSelectElement | null;
    foodForm = document.getElementById('foodForm') as HTMLFormElement | null;
    foodInput = document.getElementById('foodName') as HTMLInputElement | null;
    foodListElement = document.getElementById('foodList');
    importButton = document.getElementById('importBtn') as HTMLButtonElement | null;
    importCsvBtn = document.getElementById('importCsvBtn') as HTMLButtonElement | null;
    importStatus = document.getElementById('importStatus');
    addDbBtn = document.getElementById('addDbBtn') as HTMLButtonElement | null;
    newDbNameInput = document.getElementById('newDbName') as HTMLInputElement | null;
    saveNewDbBtn = document.getElementById('saveNewDbBtn') as HTMLButtonElement | null;
    deleteDbBtn = document.getElementById('deleteDbBtn') as HTMLButtonElement | null;
    purgeDbBtn = document.getElementById('purgeDbBtn') as HTMLButtonElement | null;

    // Consumption Log
    refDbSelectElement = document.getElementById('refDbSelect') as HTMLSelectElement | null;
    userIdInputElement = document.getElementById('userIdInput') as HTMLInputElement | null;
    consumptionDateElement = document.getElementById('consumptionDate') as HTMLInputElement | null;
    mealTypeSelectElement = document.getElementById('mealTypeSelect') as HTMLSelectElement | null;
    foodSearchInputElement = document.getElementById('foodSearchInput') as HTMLInputElement | null;
    foodSelectElement = document.getElementById('foodSelect') as HTMLSelectElement | null;
    gramsInputElement = document.getElementById('gramsInput') as HTMLInputElement | null;
    logFormElement = document.getElementById('logForm') as HTMLFormElement | null;
    logEntriesElement = document.getElementById('logEntries');
    importLogButton = document.getElementById('importLogBtn') as HTMLButtonElement | null;
    importLogCsvBtn = document.getElementById('importLogCsvBtn') as HTMLButtonElement | null; // *** NUEVO ***
    importLogStatus = document.getElementById('importLogStatus');
    userIdDataListElement = document.getElementById('userIdDataList') as HTMLDataListElement | null;
    deleteAllLogsBtn = document.getElementById('deleteAllLogsBtn') as HTMLButtonElement | null;
    deleteUserLogsBtn = document.getElementById('deleteUserLogsBtn') as HTMLButtonElement | null;
    // Detailed Edit Form
    editFoodFormContainer = document.getElementById('editFoodFormContainer');
    editFoodIdInput = document.getElementById('editFoodId') as HTMLInputElement | null;
    editFoodNameInput = document.getElementById('editFoodName') as HTMLInputElement | null;
    editEnergyKcalInput = document.getElementById('editEnergyKcal') as HTMLInputElement | null;
    editWaterGInput = document.getElementById('editWaterG') as HTMLInputElement | null;
    editProteinGInput = document.getElementById('editProteinG') as HTMLInputElement | null;
    editFatGInput = document.getElementById('editFatG') as HTMLInputElement | null;
    editCarbohydrateGInput = document.getElementById('editCarbohydrateG') as HTMLInputElement | null;
    editSaturatedFatGInput = document.getElementById('editSaturatedFatG') as HTMLInputElement | null;
    editMonounsaturatedFatGInput = document.getElementById('editMonounsaturatedFatG') as HTMLInputElement | null;
    editPolyunsaturatedFatGInput = document.getElementById('editPolyunsaturatedFatG') as HTMLInputElement | null;
    editCholesterolMgInput = document.getElementById('editCholesterolMg') as HTMLInputElement | null;
    editFiberGInput = document.getElementById('editFiberG') as HTMLInputElement | null;
    editSugarGInput = document.getElementById('editSugarG') as HTMLInputElement | null;
    editAshGInput = document.getElementById('editAshG') as HTMLInputElement | null;
    editCalciumMgInput = document.getElementById('editCalciumMg') as HTMLInputElement | null;
    editPhosphorusMgInput = document.getElementById('editPhosphorusMg') as HTMLInputElement | null;
    editIronMgInput = document.getElementById('editIronMg') as HTMLInputElement | null;
    editSodiumMgInput = document.getElementById('editSodiumMg') as HTMLInputElement | null;
    editPotassiumMgInput = document.getElementById('editPotassiumMg') as HTMLInputElement | null;
    editMagnesiumMgInput = document.getElementById('editMagnesiumMg') as HTMLInputElement | null;
    editZincMgInput = document.getElementById('editZincMg') as HTMLInputElement | null;
    editCopperMgInput = document.getElementById('editCopperMg') as HTMLInputElement | null;
    editManganeseMgInput = document.getElementById('editManganeseMg') as HTMLInputElement | null;
    editVitaminAERInput = document.getElementById('editVitaminAER') as HTMLInputElement | null;
    editThiaminMgInput = document.getElementById('editThiaminMg') as HTMLInputElement | null;
    editRiboflavinMgInput = document.getElementById('editRiboflavinMg') as HTMLInputElement | null;
    editNiacinMgInput = document.getElementById('editNiacinMg') as HTMLInputElement | null;
    editPantothenicAcidMgInput = document.getElementById('editPantothenicAcidMg') as HTMLInputElement | null;
    editVitaminB6MgInput = document.getElementById('editVitaminB6Mg') as HTMLInputElement | null;
    editFolateMcgInput = document.getElementById('editFolateMcg') as HTMLInputElement | null;
    editVitaminB12McgInput = document.getElementById('editVitaminB12Mcg') as HTMLInputElement | null;
    editVitaminCMgInput = document.getElementById('editVitaminCMg') as HTMLInputElement | null;
    saveEditFoodBtn = document.getElementById('saveEditFoodBtn') as HTMLButtonElement | null;
    cancelEditFoodBtn = document.getElementById('cancelEditFoodBtn') as HTMLButtonElement | null;
    
    // Modal de Edición de Log
    editLogModal = document.getElementById('editLogModal');
    editLogIdInput = document.getElementById('editLogId') as HTMLInputElement | null;
    editLogGramsInput = document.getElementById('editLogGramsInput') as HTMLInputElement | null;
    editLogFoodName = document.getElementById('editLogFoodName');
    saveEditLogBtn = document.getElementById('saveEditLogBtn') as HTMLButtonElement | null;
    cancelEditLogBtn = document.getElementById('cancelEditLogBtn') as HTMLButtonElement | null;

    // Report / Calculation Section (v0.2)
    reportUserIdInputElement = document.getElementById('reportUserIdInput') as HTMLInputElement | null;
    reportStartDateElement = document.getElementById('reportStartDate') as HTMLInputElement | null;
    reportEndDateElement = document.getElementById('reportEndDate') as HTMLInputElement | null;
    reportRefDbSelectElement = document.getElementById('reportRefDbSelect') as HTMLSelectElement | null;
    calculateBtnElement = document.getElementById('calculateBtn') as HTMLButtonElement | null;
    reportResultsElement = document.getElementById('reportResults');
    exportControls = document.getElementById('exportControls');
    exportCsvBtn = document.getElementById('exportCsvBtn') as HTMLButtonElement | null;
    exportExcelBtn = document.getElementById('exportExcelBtn') as HTMLButtonElement | null;

    // *** NUEVO: Asignar Elementos de Análisis (v0.3) ***
    nutrientSelect = document.getElementById('nutrientSelect') as HTMLSelectElement | null;
    calcStatsBtn = document.getElementById('calcStatsBtn') as HTMLButtonElement | null;
    renderHistogramBtn = document.getElementById('renderHistogramBtn') as HTMLButtonElement | null;
    renderBoxPlotBtn = document.getElementById('renderBoxPlotBtn') as HTMLButtonElement | null;
    renderTopFoodsBtn = document.getElementById('renderTopFoodsBtn') as HTMLButtonElement | null;
    renderMealBtn = document.getElementById('renderMealBtn') as HTMLButtonElement | null;
    renderOverTimeBtn = document.getElementById('renderOverTimeBtn') as HTMLButtonElement | null;
    chartContainer = document.getElementById('chartContainer');
    statsResults = document.getElementById('statsResults');


    // --- Load initial data ---
    loadDatabasesIntoSelectors();
    loadAndDisplayFoods();
    loadUniqueUserIDs();
    populateNutrientSelect(); // *** NUEVO: Rellenar selector de nutrientes ***

    // *** NUEVO: Inicializar ECharts ***
    if (chartContainer) {
        myChart = echarts.init(chartContainer);
    } else {
        console.error("Chart container not found!");
    }

    // Set default date for BOTH date pickers and load initial logs if applicable
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;

    if (consumptionDateElement) {
        consumptionDateElement.value = todayString;
        if (userIdInputElement?.value.trim()) { loadAndDisplayLogEntries(); }
        else if (logEntriesElement) { logEntriesElement.innerHTML = '<p>Enter User/Group ID and select Date to view logs.</p>'; }
    }
    if (reportStartDateElement) { reportStartDateElement.value = todayString; }
    if (reportEndDateElement) { reportEndDateElement.value = todayString; }


    // --- Add ALL Event Listeners ---

    // Library Management
    if (foodForm) {
        foodForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!foodInput || !dbSelectElement) { console.error("Add food form elements missing"); return; }
            const name = foodInput.value.trim();
            const selectedDbId = parseInt(dbSelectElement.value, 10);
            if (name && selectedDbId > 0) {
                try {
                    const result = await window.electronAPI.addFood(name, selectedDbId);
                    console.log(result);
                    foodInput.value = '';
                    loadAndDisplayFoods();
                } catch (error) {
                    console.error('Failed to add food:', error);
                    await window.electronAPI.showErrorDialog('Save Error', `Error adding food: ${error}`);
                }
            } else if (!name) {
                await window.electronAPI.showErrorDialog('Input Error', 'Please enter a food name.');
            } else {
                await window.electronAPI.showErrorDialog('Input Error', 'Please select a valid target database.');
            }
        });
    } else { console.error("Could not find food form (foodForm)"); }
    
    if (importButton) { // Import Library Button
        importButton.addEventListener('click', async () => {
            if (!importDbSelectElement || !importStatus || !importButton) { console.error("Import button elements missing"); return; }
            const selectedDbIdString = importDbSelectElement.value;
            const selectedDbId = parseInt(selectedDbIdString, 10);
            if (!selectedDbId || selectedDbId <= 0) { 
                await window.electronAPI.showErrorDialog('Input Error', 'Please select a valid database to import into.');
                return; 
            }
            importStatus.textContent = 'Importing... Please wait.';
            importButton.disabled = true;
            if (importCsvBtn) importCsvBtn.disabled = true;
            importDbSelectElement.disabled = true;
            try {
                const resultMessage = await window.electronAPI.importExcel(selectedDbId);
                importStatus.textContent = resultMessage;
                loadAndDisplayFoods();
            } catch (error) {
                console.error('Import failed:', error);
                const errorMsg = String(error);
                if (importStatus) { importStatus.textContent = `Import failed: ${errorMsg}`; }
                await window.electronAPI.showErrorDialog('Import Failed', errorMsg);
            } finally {
                if (importButton) importButton.disabled = false;
                if (importCsvBtn) importCsvBtn.disabled = false;
                if (importDbSelectElement) importDbSelectElement.disabled = false;
            }
        });
    } else { console.error("Could not find import button (importButton)"); }

    if (importCsvBtn) {
        importCsvBtn.addEventListener('click', handleImportCSV);
    } else {
        console.error("Could not find Import CSV button (importCsvBtn)");
    }
    
    if (addDbBtn) { addDbBtn.onclick = handleAddNewDatabase; } else { console.error("Could not find Add DB button (addDbBtn)"); }
    if (saveNewDbBtn) { saveNewDbBtn.onclick = handleSaveNewDatabase; } else { console.error("Could not find Save New DB button (saveNewDbBtn)"); }

    if (deleteDbBtn) {
        deleteDbBtn.addEventListener('click', handleDeleteDatabase);
    } else {
        console.error("Could not find Delete DB button (deleteDbBtn)");
    }


 if (purgeDbBtn) {
    console.log(
      '%c--- ¡ÉXITO! Botón "purgeDbBtn" encontrado en el DOM. ---', 
      'color: green; font-weight: bold; font-size: 14px;'
    );
    purgeDbBtn.addEventListener('click', handlePurgeFoodLibrary);
    console.log(
      '%c--- ¡ÉXITO! Listener "handlePurgeFoodLibrary" AÑADIDO. ---', 
      'color: blue; font-weight: bold; font-size: 14px;'
    );
 } else {
    console.error(
      '%c--- ¡FALLO! No se encontró el botón con id "purgeDbBtn" en el DOM. ---', 
      'color: red; font-weight: bold; font-size: 14px;'
    );
 }

    // Detailed Edit Form Buttons
    if (saveEditFoodBtn) { saveEditFoodBtn.addEventListener('click', handleSaveEditFood); } else { console.error("Could not find Save Edit Food button (saveEditFoodBtn)"); }
    if (cancelEditFoodBtn) { cancelEditFoodBtn.addEventListener('click', handleCancelEditFood); } else { console.error("Could not find Cancel Edit Food button (cancelEditFoodBtn)"); }

    // Consumption Log
    if (userIdInputElement) { userIdInputElement.addEventListener('change', loadAndDisplayLogEntries); } else { console.error("Could not find User ID input (userIdInputElement)"); }
    if (consumptionDateElement) { consumptionDateElement.addEventListener('change', loadAndDisplayLogEntries); } else { console.error("Could not find Date input (consumptionDateElement)"); }
    if (refDbSelectElement) { refDbSelectElement.addEventListener('change', searchFoods); } else { console.error("Could not find Reference DB select (refDbSelectElement)"); }
    if (foodSearchInputElement) { foodSearchInputElement.addEventListener('input', () => { if (searchTimeout) clearTimeout(searchTimeout); searchTimeout = setTimeout(searchFoods, 300); }); } else { console.error("Could not find Food Search input (foodSearchInputElement)"); }
    if (logFormElement) { logFormElement.addEventListener('submit', addLogEntry); } else { console.error("Could not find Log form (logFormElement)"); }

    if (importLogButton) {
        // *** MODIFICADO: Llamar con 'false' para Excel ***
        importLogButton.addEventListener('click', () => handleImportLog(false));
    } else {
        console.error("Could not find Import Log button (importLogButton)");
    }
    
    // *** NUEVO: Listener para Importar Log CSV ***
    if (importLogCsvBtn) {
        importLogCsvBtn.addEventListener('click', () => handleImportLog(true)); // true = usar CSV
    } else {
        console.error("Could not find Import Log CSV button (importLogCsvBtn)");
    }

    if (deleteAllLogsBtn) {
    deleteAllLogsBtn.addEventListener('click', handleDeleteAllLogs);
  } else {
    console.error("Could not find Delete All Logs button (deleteAllLogsBtn)");
  }

    // Modal de Edición de Log Listeners
    if (saveEditLogBtn) {
        saveEditLogBtn.addEventListener('click', handleSaveLogEdit);
    } else {
        console.error("Could not find Save Log Edit button (saveEditLogBtn)");
    }
    if (cancelEditLogBtn) {
        cancelEditLogBtn.addEventListener('click', handleCancelLogEdit);
    } else {
        console.error("Could not find Cancel Log Edit button (cancelEditLogBtn)");
    }

if (deleteUserLogsBtn) {
    deleteUserLogsBtn.addEventListener('click', handleDeleteLogsForUser);
  } else {
    console.error("Could not find Delete User Logs button (deleteUserLogsBtn)");
  }
    

    // Calculation / Reporting (v0.2)
    if (calculateBtnElement) { calculateBtnElement.addEventListener('click', handleCalculateIntake); } else { console.error("Could not find Calculate Intake button (calculateBtnElement)"); }

    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => handleExport('csv'));
    } else {
        console.error("Could not find Export CSV button (exportCsvBtn)");
    }
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', () => handleExport('xlsx'));
    } else {
        console.error("Could not find Export Excel button (exportExcelBtn)");
    }

    // ***Listener de 



    // *** NUEVO: Listeners de Análisis (v0.3) ***
    if (calcStatsBtn) {
        calcStatsBtn.addEventListener('click', handleRenderStatsTable);
    } else { console.error("Could not find calcStatsBtn"); }
    
    if (renderHistogramBtn) {
        renderHistogramBtn.addEventListener('click', handleRenderHistogram);
    } else { console.error("Could not find renderHistogramBtn"); }

    if (renderBoxPlotBtn) {
        renderBoxPlotBtn.addEventListener('click', handleRenderBoxPlot);
    } else { console.error("Could not find renderBoxPlotBtn"); }

    if (renderTopFoodsBtn) {
        renderTopFoodsBtn.addEventListener('click', () => handleRenderPieChart('food'));
    } else { console.error("Could not find renderTopFoodsBtn"); }
    
    if (renderMealBtn) {
        renderMealBtn.addEventListener('click', () => handleRenderPieChart('meal'));
    } else { console.error("Could not find renderMealBtn"); }

    if (renderOverTimeBtn) {
        renderOverTimeBtn.addEventListener('click', handleRenderLineChart);
    } else { console.error("Could not find renderOverTimeBtn"); }

   if (deleteDbBtn) {
  deleteDbBtn.addEventListener('click', handleDeleteDatabase);
} else {
  console.error("Could not find Delete DB button (deleteDbBtn)");
}

// *** ASEGÚRATE DE QUE ESTE BLOQUE ESTÉ ASÍ ***
if (purgeDbBtn) {
    console.log(
      '%c--- ¡ÉXITO! Botón "purgeDbBtn" encontrado y listener añadido. ---', 
      'color: green; font-weight: bold; font-size: 14px;'
    );
    purgeDbBtn.addEventListener('click', handlePurgeFoodLibrary);
} else {
    console.error(
      '%c--- ¡FALLO! No se encontró el botón con id "purgeDbBtn" en el DOM. ---', 
      'color: red; font-weight: bold; font-size: 14px;'
    );
}




}); // End DOMContentLoaded