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

// En src/renderer.ts
interface ISearchFoodResult {
  FoodID: number;
  Name: string;
  // *** AÑADE ESTAS DOS LÍNEAS ***
  FoodType: 'simple' | 'recipe';
  RecipeYieldGrams: number | null;
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

interface IRecipeIngredient {
  foodId: number;
  name: string; // <-- AÑADE ESTA PROPIEDAD
  grams: number;
}


// *** ACTUALIZADO: "tabla paisa" ***
interface IFoodDetails {
    FoodID: number;
    Name: string;
    FoodType?: 'simple' | 'recipe';
    Ingredients?: IRecipeIngredient[];
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


//Variable RDI ANALISYS
let rdiAnalysisProfileSelect: HTMLSelectElement | null = null;


// --- NUEVAS VARIABLES PARA FILTRAR LA LISTA ---
let foodListSearchInputElement: HTMLInputElement | null = null;
let foodListDbFilterElement: HTMLSelectElement | null = null;
let allFoodsCache: IFoodDetail[] = []; // Caché para guardar la lista completa

// --- NUEVAS VARIABLES PARA PAGINACIÓN ---
let currentFoodListPage = 1;
const itemsPerPage = 7; // ¡Mostraremos 7 por página!

let foodListPaginationElement: HTMLElement | null = null;
let prevPageBtn: HTMLButtonElement | null = null;
let nextPageBtn: HTMLButtonElement | null = null;
let pageIndicatorElement: HTMLElement | null = null;
let showAllToggleElement: HTMLInputElement | null = null;
let pageControlsContainer: HTMLElement | null = null; // <-- AÑADE ESTA LÍNEA

// --- NUEVAS VARIABLES PARA PAGINACIÓN DE LOGS ---
let allLogsCache: ILogEntry[] = [];
let currentLogPage = 1;
const logsPerPage = 7; // ¡Mostraremos 7 por página!

let logSearchInputElement: HTMLInputElement | null = null;
let logPaginationContainer: HTMLElement | null = null;
let logPrevPageBtn: HTMLButtonElement | null = null;
let logNextPageBtn: HTMLButtonElement | null = null;
let logPageIndicatorElement: HTMLElement | null = null;

// --- NUEVA VARIABLE DE ESTADO PARA ANÁLISIS ---
// Guarda qué tipo de análisis está activo actualmente
let currentAnalysisMode: 'stats' | 'histogram' | 'boxplot' | 'pie-food' | 'pie-meal' | 'line' | 'macro-dist' | 'adequacy' | null = null;

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
let gramsInputContainer: HTMLElement | null = null;
let portionsInputContainer: HTMLElement | null = null;
let portionsInputElement: HTMLInputElement | null = null;
let recipeYieldLabel: HTMLElement | null = null;

// Detailed Food Edit Form
let editFoodFormContainer: HTMLElement | null = null;
let editFoodIdInput: HTMLInputElement | null = null;
let editFoodNameInput: HTMLInputElement | null = null;
let editFoodTypeSelect: HTMLSelectElement | null = null;
let simpleFoodNutrientsDiv: HTMLElement | null = null;
let recipeIngredientsDiv: HTMLElement | null = null;
let recipeFoodSearchInput: HTMLInputElement | null = null;
let recipeFoodSelect: HTMLSelectElement | null = null;
let recipeGramsInput: HTMLInputElement | null = null;
let addIngredientBtn: HTMLButtonElement | null = null;
let ingredientList: HTMLUListElement | null = null;
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
let renderAdequacyBtn: HTMLButtonElement | null = null; // <-- NUEVO
let renderTopFoodsBtn: HTMLButtonElement | null = null;
let renderMealBtn: HTMLButtonElement | null = null;
let renderMacroDistBtn: HTMLButtonElement | null = null; // <-- NUEVO
let renderOverTimeBtn: HTMLButtonElement | null = null;
let chartContainer: HTMLElement | null = null;
let multiChartContainer: HTMLElement | null = null; // <-- NUEVO
let statsResults: HTMLElement | null = null;
let myChart: echarts.ECharts | null = null; // Instancia del gráfico

// Global variable to store last calculation results
let lastCalculatedTotals: INutrientTotals | null = null;
let lastReportTitle: string = 'Report';

///Rdi import values

    let rdiProfileSelect: HTMLSelectElement | null = null;
    let btnImportRdiValues: HTMLButtonElement | null = null;
    let newRdiProfileName: HTMLInputElement | null = null;
    let btnCreateRdiProfile: HTMLButtonElement | null = null;
    let rdiStatusMsg: HTMLElement | null = null;








// Almacena los resultados de la última búsqueda de alimentos del log
let currentFoodSearchResults: ISearchFoodResult[] = [];

// *** CAMBIA 'IRecipeIngredient' a 'ILocalIngredient' ***
let currentRecipeIngredients: IRecipeIngredient[] = [];

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
if (!dbSelectElement || !importDbSelectElement || !refDbSelectElement || !reportRefDbSelectElement || !foodListDbFilterElement) {         console.error("One or more DB selectors not found during loadDatabasesIntoSelectors");
         return;
    }
    const currentDbSelect = dbSelectElement;
    const currentImportDbSelect = importDbSelectElement;
    const currentRefDbSelect = refDbSelectElement;
    const currentReportRefDbSelect = reportRefDbSelectElement;
    const currentFoodListDbFilter = foodListDbFilterElement; // <-- AÑADE ESTA LÍNEA

    try {
        const databases = await window.electronAPI.getDatabases();
        console.log("Databases loaded for selectors:", databases);
        currentDbSelect.innerHTML = '';
        currentImportDbSelect.innerHTML = '';
        currentRefDbSelect.innerHTML = '';
        currentReportRefDbSelect.innerHTML = '';
        currentFoodListDbFilter.innerHTML = ''; // <-- AÑADE ESTA LÍNEA

        const selectOption = new Option("-- Select Database --", "-1");
        currentRefDbSelect.add(selectOption.cloneNode(true) as HTMLOptionElement);
        currentReportRefDbSelect.add(selectOption.cloneNode(true) as HTMLOptionElement);

        currentFoodListDbFilter.add(new Option("-- Mostrar Todas --", "all"));

        if (databases.length === 0) {
            const defaultOption = new Option("No Databases Found", "-1");
            currentDbSelect.add(defaultOption.cloneNode(true) as HTMLOptionElement);
            currentImportDbSelect.add(defaultOption.cloneNode(true) as HTMLOptionElement);
            currentDbSelect.disabled = true;
            currentImportDbSelect.disabled = true;
            currentRefDbSelect.disabled = true;
            currentReportRefDbSelect.disabled = true;
            currentFoodListDbFilter.disabled = true; // <-- AÑADE ESTA LÍNEA
        } else {
             currentDbSelect.disabled = false;
             currentImportDbSelect.disabled = false;
             currentRefDbSelect.disabled = false;
             currentReportRefDbSelect.disabled = false;
             currentFoodListDbFilter.disabled = false; // <-- AÑADE ESTA LÍNEA
            databases.forEach(db => {
                const option = new Option(db.DatabaseName, db.DatabaseID.toString());
                currentDbSelect.add(option.cloneNode(true) as HTMLOptionElement);
                currentImportDbSelect.add(option.cloneNode(true) as HTMLOptionElement);
                currentRefDbSelect.add(option.cloneNode(true) as HTMLOptionElement);
                currentReportRefDbSelect.add(option.cloneNode(true) as HTMLOptionElement);
                currentFoodListDbFilter.add(new Option(db.DatabaseName, db.DatabaseName));
            
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
            loadAllLogs();
        }

        await window.electronAPI.showInfoDialog('Success', result);

    } catch (error) {
        console.error("Failed to delete database:", error);
        await window.electronAPI.showErrorDialog('Error Deleting Database', String(error));
    }
}


// --- FOOD LIST FUNCTIONS ---

// --- NUEVAS FUNCIONES DE PAGINACIÓN ---

// Se llama cuando el usuario escribe en "Buscar" o cambia el filtro "BD"
function handleFilterChange() {
  currentFoodListPage = 1; // Reinicia a la página 1
  renderFilteredFoodList();
}

// Se llama cuando el usuario hace clic en "< Anterior"
function handlePrevPage() {
  if (currentFoodListPage > 1) {
    currentFoodListPage--;
    renderFilteredFoodList();
  }
}

// Se llama cuando el usuario hace clic en "Siguiente >"
function handleNextPage() {
  // El chequeo de límite se hace en la función de renderizado
  currentFoodListPage++;
  renderFilteredFoodList();
}

// Se llama cuando el usuario marca/desmarca "Mostrar Todo"
function handleToggleShowAll() {
  currentFoodListPage = 1; // Reinicia a la página 1
  renderFilteredFoodList();
}









// Renderiza la lista de alimentos basándose en los filtros y la agrupa por inicial.
// ¡VERSIÓN 2.0!

function renderFilteredFoodList() {
  if (!foodListElement || !foodListSearchInputElement || !foodListDbFilterElement || 
      !showAllToggleElement || !foodListPaginationElement || !prevPageBtn || 
      !nextPageBtn || !pageIndicatorElement || !pageControlsContainer) { // <-- CAMBIO: Añadido chequeo    console.warn("Elementos de la lista de alimentos no encontrados, saltando renderizado.");
      console.warn("Elementos de la lista de alimentos no encontrados, saltando renderizado.");
    return;
  }

  // 1. Obtener valores de los filtros
  const searchTerm = foodListSearchInputElement.value.toLowerCase();
  const dbFilter = foodListDbFilterElement.value; // ("all" o el DatabaseName)
  const showAll = showAllToggleElement.checked;

  // 2. Aplicar filtros al caché
  let filteredFoods = allFoodsCache;
  if (dbFilter !== 'all') {
    filteredFoods = filteredFoods.filter(food => food.DatabaseName === dbFilter);
  }
  if (searchTerm.length > 0) {
    filteredFoods = filteredFoods.filter(food => 
      food.Name.toLowerCase().includes(searchTerm) || 
      food.DatabaseName.toLowerCase().includes(searchTerm)
    );
  }

  // 3. Limpiar la lista
  foodListElement.innerHTML = '';
  const totalItems = filteredFoods.length;
  foodListPaginationElement.style.display = 'flex';
  if (totalItems === 0) {
    foodListElement.innerHTML = '<p>No se encontraron alimentos con esos filtros.</p>';
    pageControlsContainer.style.display = 'none'; // <-- CAMBIO: Ocultar solo los controles
    // Dejamos el "Mostrar Todo" visible por si quieren desmarcarlo
    return;
  }

  // 4. Decidir qué vista renderizar
if (showAll) {
    // --- VISTA "MOSTRAR TODO" (AGRUPADA POR INICIAL) ---
    pageControlsContainer.style.display = 'none'; // <-- CAMBIO: Ocultar solo los controles
    foodListPaginationElement.style.justifyContent = 'flex-end'; // <-- CAMBIO: Alinear la casilla a la derecha

    const groupedFoods: { [key: string]: IFoodDetail[] } = {};
    filteredFoods.forEach(food => {
      const initial = food.Name[0]?.toUpperCase() || '?';
      if (!groupedFoods[initial]) groupedFoods[initial] = [];
      groupedFoods[initial].push(food);
    });

    const sortedInitials = Object.keys(groupedFoods).sort();

    for (const initial of sortedInitials) {
      const groupHeader = document.createElement('h3');
      groupHeader.textContent = initial;
      groupHeader.style.borderBottom = '1px solid #ccc';
      groupHeader.style.marginTop = '15px';
      foodListElement.appendChild(groupHeader);

      const ul = document.createElement('ul');
      ul.style.listStyleType = 'none'; ul.style.paddingLeft = '0';
      groupedFoods[initial].forEach(food => renderFoodListItem(food, ul));
      foodListElement.appendChild(ul);
    }

  } else {
    // --- VISTA PAGINADA (POR DEFECTO) ---
    pageControlsContainer.style.display = 'block'; // <-- CAMBIO: Mostrar solo los controles
    foodListPaginationElement.style.justifyContent = 'space-between'; // <-- CAMBIO: Volver al alineado normal

    // Calcular páginas
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (currentFoodListPage > totalPages) currentFoodListPage = totalPages;
    if (currentFoodListPage < 1) currentFoodListPage = 1;

    // Actualizar indicador
    pageIndicatorElement.textContent = `Página ${currentFoodListPage} de ${totalPages}`;

    // Habilitar/Deshabilitar botones
    prevPageBtn.disabled = (currentFoodListPage === 1);
    nextPageBtn.disabled = (currentFoodListPage === totalPages);

    // Cortar el array para mostrar solo la página actual
    const startIndex = (currentFoodListPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToDisplay = filteredFoods.slice(startIndex, endIndex);

    // Renderizar solo esos 7 (o menos) items
    const ul = document.createElement('ul');
    ul.style.listStyleType = 'none'; ul.style.paddingLeft = '0';
    itemsToDisplay.forEach(food => renderFoodListItem(food, ul));
    foodListElement.appendChild(ul);
  }
}

// ¡NUEVA FUNCIÓN AUXILIAR!
// La lógica para crear un <li> (ítem de la lista) se repite, así que la aislamos.
function renderFoodListItem(food: IFoodDetail, ul: HTMLUListElement) {
  const li = document.createElement('li');
  li.dataset.foodId = food.FoodID.toString();
  
  const nameSpan = document.createElement('span');
  nameSpan.className = 'food-name';
  nameSpan.textContent = `${food.Name} (${food.DatabaseName})`;
  li.appendChild(nameSpan);

  // Botones
  const editButton = document.createElement('button');
  editButton.textContent = 'Edit';
  editButton.className = 'edit-btn';
  editButton.onclick = () => showEditForm(food.FoodID, food.Name);
  li.appendChild(editButton);

  const deleteButton = document.createElement('button');
  deleteButton.textContent = 'Delete';
  deleteButton.className = 'delete-btn';
  deleteButton.onclick = () => handleDelete(food.FoodID);
  li.appendChild(deleteButton);

  ul.appendChild(li);
}

// Fetches list from backend and calls display function
async function loadAndDisplayFoods() {
  try {
    allFoodsCache = await window.electronAPI.getFoods(); // Guarda en caché
    renderFilteredFoodList(); // Llama al renderizador
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

function toggleEditFormView() {
  if (!editFoodTypeSelect || !simpleFoodNutrientsDiv || !recipeIngredientsDiv) {
    console.warn("No se pueden encontrar los elementos del formulario de tipo de alimento.");
    return;
  }

  const selectedType = editFoodTypeSelect.value;

  if (selectedType === 'recipe') {
    simpleFoodNutrientsDiv.style.display = 'none';
    recipeIngredientsDiv.style.display = 'block';
  } else {
    // Por defecto (o si es 'simple')
    simpleFoodNutrientsDiv.style.display = 'block';
    recipeIngredientsDiv.style.display = 'none';
  }
}


// --- DETAILED EDIT FORM LOGIC ---
async function showEditForm(foodId: number, currentName: string) {
    currentRecipeIngredients = []; // Limpiar ingredientes de la receta anterior
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
    if (editFoodTypeSelect) {
    // Si el foodType existe en los datos, úsalo; si no, pon 'simple' por defecto
    editFoodTypeSelect.value = foodDetails.FoodType || 'simple';
    }

    if (foodDetails.FoodType === 'recipe') {
      console.log('Food is a recipe. Fetching ingredients...');
      // Si es una receta, busca sus ingredientes
      currentRecipeIngredients = await window.electronAPI.getRecipeIngredients(foodId);
      console.log('Fetched ingredients:', currentRecipeIngredients);
    } else {
      // Si es simple, asegúrate de que la lista esté vacía
      currentRecipeIngredients = [];
    }
    
    // Ahora que SÍ tenemos los ingredientes, dibujamos la lista
    renderIngredientList();


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
    // Asegurarnos de que la vista correcta (simple/recipe) se muestre al abrir
    toggleEditFormView();
    if (foodListElement) foodListElement.style.display = 'none';
    if (foodListElement) foodListElement.style.display = 'none';
    if (foodForm) (foodForm as HTMLFormElement).style.display = 'none';
    editFoodNameInput.focus();
}

// En src/renderer.ts
async function handleSaveEditFood() {
  if (!editFoodIdInput || !editFoodNameInput) { 
    await window.electronAPI.showErrorDialog('Error', 'Cannot find required form elements to save.'); 
    return; 
  }

  const foodId = parseInt(editFoodIdInput.value, 10);
  const newName = editFoodNameInput.value.trim();
  const foodType = editFoodTypeSelect?.value as ('simple' | 'recipe') || 'simple';

  if (isNaN(foodId) || foodId <= 0) { 
    await window.electronAPI.showErrorDialog('Input Error', 'Invalid Food ID.'); 
    return; 
  }
  if (!newName) { 
    await window.electronAPI.showErrorDialog('Input Error', 'Food name cannot be empty.'); 
    return; 
  }

  console.log(`Debug: Saving FoodID ${foodId} with Type: ${foodType}`);

  // *** USANDO TU NOMBRE DE VARIABLE ORIGINAL: foodData ***
  const foodData: IFoodDetails = {
    FoodID: foodId,
    Name: newName,
    FoodType: foodType,
    
    // 1. AÑADE LA LISTA DE INGREDIENTES
    // En handleSaveEditFood
 
    Ingredients: foodType === 'recipe' ? currentRecipeIngredients : [],

    // 2. MODIFICA TODOS LOS NUTRIENTES PARA ENVIAR 'null' SI ES UNA RECETA
    Energy_kcal: foodType === 'simple' ? getNutrientValue(editEnergyKcalInput) : null,
    Water_g: foodType === 'simple' ? getNutrientValue(editWaterGInput) : null,
    Protein_g: foodType === 'simple' ? getNutrientValue(editProteinGInput) : null,
    Fat_g: foodType === 'simple' ? getNutrientValue(editFatGInput) : null,
    Carbohydrate_g: foodType === 'simple' ? getNutrientValue(editCarbohydrateGInput) : null,
    Fiber_g: foodType === 'simple' ? getNutrientValue(editFiberGInput) : null,
    Sugar_g: foodType === 'simple' ? getNutrientValue(editSugarGInput) : null,
    Ash_g: foodType === 'simple' ? getNutrientValue(editAshGInput) : null,
    
    // Fat Details
    SaturatedFat_g: foodType === 'simple' ? getNutrientValue(editSaturatedFatGInput) : null,
    MonounsaturatedFat_g: foodType === 'simple' ? getNutrientValue(editMonounsaturatedFatGInput) : null,
    PolyunsaturatedFat_g: foodType === 'simple' ? getNutrientValue(editPolyunsaturatedFatGInput) : null,
    Cholesterol_mg: foodType === 'simple' ? getNutrientValue(editCholesterolMgInput) : null,

    // Minerals
    Calcium_mg: foodType === 'simple' ? getNutrientValue(editCalciumMgInput) : null,
    Phosphorus_mg: foodType === 'simple' ? getNutrientValue(editPhosphorusMgInput) : null,
    Iron_mg: foodType === 'simple' ? getNutrientValue(editIronMgInput) : null,
    Sodium_mg: foodType === 'simple' ? getNutrientValue(editSodiumMgInput) : null,
    Potassium_mg: foodType === 'simple' ? getNutrientValue(editPotassiumMgInput) : null,
    Magnesium_mg: foodType === 'simple' ? getNutrientValue(editMagnesiumMgInput) : null,
    Zinc_mg: foodType === 'simple' ? getNutrientValue(editZincMgInput) : null,
    Copper_mg: foodType === 'simple' ? getNutrientValue(editCopperMgInput) : null,
    Manganese_mg: foodType === 'simple' ? getNutrientValue(editManganeseMgInput) : null,

    // Vitamins
    VitaminA_ER: foodType === 'simple' ? getNutrientValue(editVitaminAERInput) : null,
    Thiamin_mg: foodType === 'simple' ? getNutrientValue(editThiaminMgInput) : null,
    Riboflavin_mg: foodType === 'simple' ? getNutrientValue(editRiboflavinMgInput) : null,
    Niacin_mg: foodType === 'simple' ? getNutrientValue(editNiacinMgInput) : null,
    PantothenicAcid_mg: foodType === 'simple' ? getNutrientValue(editPantothenicAcidMgInput) : null,
    VitaminB6_mg: foodType === 'simple' ? getNutrientValue(editVitaminB6MgInput) : null, 
    Folate_mcg: foodType === 'simple' ? getNutrientValue(editFolateMcgInput) : null,
    VitaminB12_mcg: foodType === 'simple' ? getNutrientValue(editVitaminB12McgInput) : null, 
    VitaminC_mg: foodType === 'simple' ? getNutrientValue(editVitaminCMgInput) : null
  };
  
  try {
    // La variable 'foodData' se usa aquí
    const result = await window.electronAPI.updateFoodDetails(foodData);
    console.log(result);
    
    // Restablecer y recargar
    handleCancelEditFood(); 
    loadAndDisplayFoods();
    await window.electronAPI.showInfoDialog('Success', result);

  } catch (error) {
    console.error("Failed to update food details:", error);
    await window.electronAPI.showErrorDialog('Save Error', `Error updating food: ${error}`);
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
// <-- !! LÍNEA ELIMINADA DE AQUÍ!!
const currentFoodSearchInput = foodSearchInputElement; const currentRefDbSelect = refDbSelectElement;
const currentFoodSelect = foodSelectElement; const searchTerm = currentFoodSearchInput.value.trim();
const selectedDbId = parseInt(currentRefDbSelect.value, 10);
currentFoodSelect.innerHTML = ''; currentFoodSelect.disabled = true;
if (!selectedDbId || selectedDbId <= 0) { currentFoodSelect.add(new Option("Select Reference DB first", "")); return; }
if (searchTerm.length < 1) { 
  currentFoodSearchResults = []; // <-- 1. LA AÑADIMOS AQUÍ
  currentFoodSelect.add(new Option("-- Type to search --", "")); 
  return; 
}
console.log(`Searching for "${searchTerm}" in DB ID ${selectedDbId}`);
try {
  currentFoodSearchResults = []; // <-- 2. Y TAMBIÉN LA AÑADIMOS AQUÍ
  const results = await window.electronAPI.searchFoods(searchTerm, selectedDbId);
  // TU LOG DE DEPURACIÓN (PUEDES DEJARLO O QUITARLO)
  console.log('--- DATOS CRUDOS RECIBIDOS DEL BACKEND ---', results); 
  currentFoodSearchResults = results;

    currentFoodSelect.innerHTML = '';
if (results.length > 0) {
  results.forEach(food => {
    const option = new Option(food.Name, food.FoodID.toString());
    // --- LÍNEAS NUEVAS ---
    option.dataset.foodType = food.FoodType;
    option.dataset.recipeYield = food.RecipeYieldGrams ? food.RecipeYieldGrams.toString() : '0';
    // --- FIN LÍNEAS NUEVAS ---
    currentFoodSelect.add(option);
  });
  currentFoodSelect.disabled = false;
} else {
  currentFoodSelect.add(new Option("No results found", ""));
}
    
handleFoodSelectionChange(); // Forzar la actualización de la UI
loadAllLogs(); // <-- AÑADE ESTA LÍNEA (Para recargar el caché)
    } catch (error) {
        console.error('Food search failed:', error); currentFoodSelect.innerHTML = '';
        currentFoodSelect.add(new Option("Error during search", ""));
    }
}

//Se llama cuando el usuario selecciona un alimento del dropdown de log. Muestra/oculta los campos "Grams" o "Portions" basado en el tipo de alimento.

function handleFoodSelectionChange() {
  if (!foodSelectElement || !gramsInputContainer || !portionsInputContainer || !portionsInputElement || !recipeYieldLabel) {
    console.warn("Faltan elementos de UI para handleFoodSelectionChange");
    return;
  }

  // 1. Obtener el <option> seleccionado
const selectedOption = foodSelectElement.options[foodSelectElement.selectedIndex];
if (!selectedOption || !selectedOption.value) {
  gramsInputContainer.style.display = 'block';
  portionsInputContainer.style.display = 'none';
  return;
}

// 2. Leer los datos directamente del dataset del <option>
const foodType = selectedOption.dataset.foodType;
const recipeYield = parseFloat(selectedOption.dataset.recipeYield || '0');
console.log('Alimento seleccionado (dataset):', { type: foodType, yield: recipeYield });

if (foodType === 'recipe') {
  // --- ES UNA RECETA ---
  gramsInputContainer.style.display = 'none';
  portionsInputContainer.style.display = 'block';

  if (recipeYield > 0) {
    recipeYieldLabel.textContent = `(1 porción = ${recipeYield}g)`;
  } else {
    recipeYieldLabel.textContent = '(Error: Rendimiento no definido)';
  }
  portionsInputElement.value = '1';
} else {
  // --- ES UN ALIMENTO SIMPLE ---
  gramsInputContainer.style.display = 'block';
  portionsInputContainer.style.display = 'none';
  recipeYieldLabel.textContent = '';
}
}


async function searchAllFoodsForRecipe() {
  if (!recipeFoodSearchInput || !recipeFoodSelect) {
    console.warn("Elementos de búsqueda de ingredientes no encontrados.");
    return;
  }

  const searchTerm = recipeFoodSearchInput.value.trim();
  const selectElement = recipeFoodSelect;

  selectElement.innerHTML = ''; // Limpiar resultados anteriores
  selectElement.disabled = true;

  if (searchTerm.length < 1) {
    selectElement.add(new Option("-- Type to search --", ""));
    return;
  }

  try {
    const results = await window.electronAPI.searchAllFoods(searchTerm);
    currentFoodSearchResults = results;

    if (results.length === 0) {
      selectElement.add(new Option("No foods found", ""));
    } else {
      results.forEach(food => {
        // El 'Name' ya viene formateado como "Manzana (Default)" desde el backend
        selectElement.add(new Option(food.Name, food.FoodID.toString()));
      });
      selectElement.disabled = false;
    }
  } catch (error) {
    console.error('Error searching all foods:', error);
    selectElement.add(new Option("Error searching", ""));
  }
}

// Dibuja la lista de ingrdientes (currentRecipeIngredients) en el DOM.

function renderIngredientList() {
  
  // 1. Obtenemos el elemento de la lista CADA VEZ que se ejecuta la función
  const listElement = document.getElementById('ingredientList') as HTMLUListElement | null;

  // 2. Comprobamos si existe
  if (listElement) {
    
    // Ahora TypeScript sabe que listElement no es null en este bloque
    listElement.innerHTML = ''; // Limpiar lista

    if (currentRecipeIngredients.length === 0) {
      listElement.innerHTML = '<li><p>No ingredients added yet.</p></li>';
    } else {
      currentRecipeIngredients.forEach((ingredient, index) => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        li.style.padding = '5px';
        li.style.borderBottom = '1px solid #eee';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = `${ingredient.name} - ${ingredient.grams}g`;
        li.appendChild(nameSpan);

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.className = 'delete-btn';
        removeBtn.style.padding = '2px 5px';
        removeBtn.onclick = () => {
          currentRecipeIngredients.splice(index, 1);
          // La llamada recursiva ahora es segura, porque
          // la próxima ejecución volverá a buscar el elemento.
          renderIngredientList();
        };
        li.appendChild(removeBtn);

        listElement.appendChild(li); // Usamos la constante local listElement
      });
    }
  } else {
    // Esto solo debería ocurrir si el DOM está roto
    console.warn("renderIngredientList called, but 'ingredientList' element (ID) was not found in the DOM.");
  }
}   

function handleAddIngredient() {
  if (!recipeFoodSelect || !recipeGramsInput || !recipeFoodSearchInput) return;

  // 1. Obtener valores
  const foodId = parseInt(recipeFoodSelect.value, 10);
  const selectedOption = recipeFoodSelect.options[recipeFoodSelect.selectedIndex];
  const foodName = selectedOption ? selectedOption.text : 'Unknown Food';
  const grams = parseFloat(recipeGramsInput.value);

  // 2. Validar
  if (!foodId || isNaN(foodId) || foodId <= 0) {
    window.electronAPI.showErrorDialog('Input Error', 'Please search for and select a valid ingredient.');
    return;
  }
  if (isNaN(grams) || grams <= 0) {
    window.electronAPI.showErrorDialog('Input Error', 'Please enter a valid positive number for grams.');
    return;
  }

  // 3. Añadir al array local
  currentRecipeIngredients.push({
    foodId: foodId,
    name: foodName,
    grams: grams
  });

  console.log('Added ingredient:', currentRecipeIngredients);

  // 4. Actualizar la UI
  renderIngredientList();

  // 5. Limpiar campos
  recipeFoodSearchInput.value = '';
  recipeFoodSelect.innerHTML = '<option value="">-- Type to search --</option>';
  recipeFoodSelect.disabled = true;
  recipeGramsInput.value = '';
  recipeFoodSearchInput.focus();
}



async function addLogEntry(e: Event) {
  e.preventDefault();
  
  if (!userIdInputElement || !consumptionDateElement || !refDbSelectElement || !foodSelectElement || 
      !gramsInputElement || !portionsInputElement || !mealTypeSelectElement) {
    console.error("Missing elements for adding log entry");
    return;
  }

  // --- 1. Obtener datos comunes ---
  const userId = userIdInputElement.value.trim();
  const consumptionDate = consumptionDateElement.value;
  const mealType = mealTypeSelectElement.value;
  const foodId = parseInt(foodSelectElement.value, 10);
  const referenceDatabaseId = parseInt(refDbSelectElement.value, 10);

  // --- 2. Validación Común ---
  if (!userId) { await window.electronAPI.showErrorDialog('Input Error', 'Please enter a User/Group ID.'); return; }
  if (!consumptionDate) { await window.electronAPI.showErrorDialog('Input Error', 'Please select a date.'); return; }
  if (!foodId || foodId <= 0 || isNaN(foodId)) { await window.electronAPI.showErrorDialog('Input Error', 'Please search and select a valid food.'); return; }
  if (!referenceDatabaseId || referenceDatabaseId <= 0) { await window.electronAPI.showErrorDialog('Input Error', 'Please select a valid Reference DB.'); return; }

  // --- 3. Lógica de Gramos/Porciones ---
  let gramsToSave: number = 0;
  const selectedOption = foodSelectElement.options[foodSelectElement.selectedIndex];
const foodType = selectedOption.dataset.foodType;
const recipeYield = parseFloat(selectedOption.dataset.recipeYield || '0');

if (foodType === 'recipe') {
// Es RECETA: Calcular gramos desde porciones
const portions = parseFloat(portionsInputElement.value);
const yieldGrams = recipeYield; // <-- Usar el valor del dataset

    if (isNaN(portions) || portions <= 0) {
      await window.electronAPI.showErrorDialog('Input Error', 'Please enter a valid number of portions.');
      return;
    }
    if (!yieldGrams || yieldGrams <= 0) {
      await window.electronAPI.showErrorDialog('Data Error', 'This recipe has no yield (total grams) defined. Cannot calculate portions.');
      return;
    }
    gramsToSave = portions * yieldGrams;

  } else {
    // Es ALIMENTO SIMPLE: Tomar gramos directamente
    gramsToSave = parseFloat(gramsInputElement.value);
  }

  // --- 4. Validación Final de Gramos ---
  if (isNaN(gramsToSave) || gramsToSave <= 0) {
    await window.electronAPI.showErrorDialog('Input Error', 'Grams must be a positive number.');
    return;
  }

  // --- 5. Enviar al Backend ---
  const logData: INewLogEntryData = {
    userId,
    consumptionDate,
    mealType: mealType || undefined,
    foodId,
    referenceDatabaseId,
    grams: gramsToSave // Siempre enviamos el total de gramos calculados
  };

  try {
    const result = await window.electronAPI.addLogEntry(logData);
    console.log(result);
    loadAllLogs(); // Recargar la lista
    
    // Limpiar campos de entrada
    if (foodSearchInputElement) foodSearchInputElement.value = '';
    foodSelectElement.innerHTML = '<option value="">-- Select Food --</option>';
    foodSelectElement.disabled = true;
    gramsInputElement.value = '';
    portionsInputElement.value = '1';
    handleFoodSelectionChange(); // Volver a poner la UI por defecto (Grams)

  } catch (error) {
    console.error("Failed to add log entry:", error);
    await window.electronAPI.showErrorDialog('Save Error', `Error adding log entry: ${error}`);
  }
}



// Carga TODOS los logs de la BD al caché y renderiza
async function loadAllLogs() {
  try {
    allLogsCache = await window.electronAPI.getAllLogs();
    console.log(`Loaded ${allLogsCache.length} log entries into cache.`);
    renderFilteredLogList(); // Renderiza la lista inicial
  } catch (error) {
    console.error("Failed to load all logs:", error);
    if (logEntriesElement) logEntriesElement.innerHTML = `<p style="color: red;">Error loading logs.</p>`;
  }
}

// Se llama cuando el usuario escribe en CUALQUIER filtro de log
function handleLogFilterChange() {
  currentLogPage = 1; // Reinicia a la página 1
  renderFilteredLogList();
}

// Se llama cuando el usuario hace clic en "< Anterior" (Logs)
function handlePrevLogPage() {
  if (currentLogPage > 1) {
    currentLogPage--;
    renderFilteredLogList();
  }
}

// Se llama cuando el usuario hace clic en "Siguiente >" (Logs)
function handleNextLogPage() {
  // El chequeo de límite se hace en la función de renderizado
  currentLogPage++;
  renderFilteredLogList();
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
                    loadAllLogs(); 
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
       
  // Filtra y pagina la lista de logs desde el caché
function renderFilteredLogList() {
  if (!logEntriesElement || !userIdInputElement || !consumptionDateElement || 
      !logSearchInputElement || !logPaginationContainer || !logPrevPageBtn || 
      !logNextPageBtn || !logPageIndicatorElement) {
    console.warn("Log list elements not found, skipping render.");
    return;
  }

  // 1. Obtener valores de los filtros
  const userIdFilter = userIdInputElement.value.trim().toLowerCase();
  const dateFilter = consumptionDateElement.value;
  const searchFilter = logSearchInputElement.value.trim().toLowerCase();

  // 2. Aplicar filtros al caché
  let filteredLogs = allLogsCache;

  if (userIdFilter) {
    filteredLogs = filteredLogs.filter(log => log.UserID.toLowerCase().includes(userIdFilter));
  }
  // IMPORTANTE: Si la fecha está vacía, no se filtra.
  if (dateFilter) {
    filteredLogs = filteredLogs.filter(log => log.ConsumptionDate === dateFilter);
  }
  if (searchFilter) {
    filteredLogs = filteredLogs.filter(log => 
      log.FoodName.toLowerCase().includes(searchFilter) ||
      (log.MealType && log.MealType.toLowerCase().includes(searchFilter)) ||
      log.ReferenceDatabaseName.toLowerCase().includes(searchFilter)
    );
  }

  // 3. Aplicar paginación
  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / logsPerPage);
  if (currentLogPage > totalPages) currentLogPage = totalPages;
  if (currentLogPage < 1) currentLogPage = 1;

  const startIndex = (currentLogPage - 1) * logsPerPage;
  const endIndex = startIndex + logsPerPage;
  const logsToDisplay = filteredLogs.slice(startIndex, endIndex);

  // 4. Renderizar la tabla (¡Reutilizamos la función que ya teníamos!)
  // Esta función ya sabe cómo mostrar los botones de editar/borrar [cite: 3397-3454]
  displayLogEntries(logsToDisplay);

  // 5. Actualizar UI de paginación
  if (totalItems === 0) {
    if (userIdFilter || dateFilter || searchFilter) {
      logEntriesElement.innerHTML = '<p>No se encontraron logs con esos filtros.</p>';
    } else {
      logEntriesElement.innerHTML = '<p>No hay logs de consumo en la base de datos.</p>';
    }
    logPaginationContainer.style.display = 'none';
  } else {
    logPaginationContainer.style.display = 'flex';
  }

  logPageIndicatorElement.textContent = `Página ${currentLogPage} de ${totalPages || 1}`;
  logPrevPageBtn.disabled = (currentLogPage === 1);
  logNextPageBtn.disabled = (currentLogPage === totalPages);
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
            loadAllLogs();
             
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
        loadAllLogs(); // <-- REEMPLAZA (Para recargar el caché)
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
  if (multiChartContainer) multiChartContainer.innerHTML = ''; // <-- LIMPIAR NUEVO CONTENEDOR
  if (chartContainer) chartContainer.style.display = 'none';
  if (myChart) {
    myChart.clear();
  }
}

















// --- NUEVA FUNCIÓN DE AUTO-ACTUALIZACIÓN ---
// Se llama cuando cambia el selector de nutrientes
function handleAutoUpdateAnalysis() {
  if (!currentAnalysisMode) return;

  console.log(`Auto-updating analysis view: ${currentAnalysisMode}`);

  switch (currentAnalysisMode) {
    case 'stats': handleRenderStatsTable(); break;
    case 'histogram': handleRenderHistogram(); break;
    case 'boxplot': handleRenderBoxPlot(); break;
    case 'pie-food': handleRenderPieChart('food'); break;
    case 'pie-meal': handleRenderPieChart('meal'); break;
    case 'line': handleRenderLineChart(); break;
    case 'macro-dist': handleRenderMacroDistribution(); break; // <-- ASEGÚRATE DE QUE ESTÉ ESTA LÍNEA
    case 'adequacy': handleRenderAdequacyChart(); break; // <-- AÑADIR
  
  }
}



// --- NUEVA FUNCIÓN DE CÁLCULO DE MACRONUTRIENTES ---
async function handleRenderMacroDistribution() {
  currentAnalysisMode = 'macro-dist'; // Establecer el estado

  const criteria = await getAnalysisCriteria();
  if (!criteria) return;

  clearAnalysisResults();
  if (reportResultsElement) reportResultsElement.innerHTML = '<p>Calculando distribución de macronutrientes...</p>';

  // --- LÓGICA MULTI-USUARIO ---
  if (criteria.userIds.length > 1) {
      if (!multiChartContainer) return;
      
      // Ocultar el contenedor simple
      if (chartContainer) chartContainer.style.display = 'none';

      // Generar un gráfico por cada usuario
      for (const userId of criteria.userIds) {
          await renderSingleMacroChart(userId, criteria);
      }
  } else {
      // Lógica de usuario único
      await renderSingleMacroChart(criteria.singleUserId, criteria);
  }

  if (reportResultsElement) reportResultsElement.innerHTML = '';
}

// 2. Función Renderizadora Individual (Worker)
async function renderSingleMacroChart(userId: string, criteria: any) {
    const chartElementId = `macro-chart-${userId}`;
    
    try {
        // a. Obtener totales para ESTE usuario específico
        // (El backend ya suma los ingredientes de las recetas correctamente)
        const totals: INutrientTotals = await window.electronAPI.calculateIntake(
            userId, criteria.startDate, criteria.endDate, criteria.referenceDbId
        );

        const proteinG = totals.totalProtein_g || 0;
        const fatG = totals.totalFat_g || 0;
        const carbG = totals.totalCarbohydrate_g || 0;

        // b. Calcular Kcal (Factores Atwater: 4, 9, 4)
        const proteinKcal = proteinG * 4;
        const fatKcal = fatG * 9;
        const carbKcal = carbG * 4;
        const totalKcalMacros = proteinKcal + fatKcal + carbKcal;

        if (totalKcalMacros === 0) {
            if (multiChartContainer && criteria.userIds.length > 1) {
                multiChartContainer.innerHTML += `<div style="width:400px; height:400px; display:flex; align-items:center; justify-content:center; border:1px solid #eee;">
                    <p>Sin datos para ${userId}</p>
                </div>`;
            }
            return;
        }

        const data = [
            { name: 'Proteína', value: proteinKcal },
            { name: 'Grasa', value: fatKcal },
            { name: 'Carbohidratos', value: carbKcal }
        ];

        // c. Configurar el contenedor (Dinámico vs Principal)
        let targetChart: echarts.ECharts | null;
        let chartDiv: HTMLElement | null;

        if (multiChartContainer && criteria.userIds.length > 1) {
            // Crear div dinámico
            chartDiv = document.createElement('div');
            chartDiv.id = chartElementId;
            chartDiv.style.width = '400px';
            chartDiv.style.height = '400px';
            chartDiv.style.border = '1px solid #f0f0f0'; // Borde sutil para separar usuarios
            chartDiv.style.borderRadius = '8px';
            chartDiv.style.padding = '10px';
            multiChartContainer.appendChild(chartDiv);
            targetChart = echarts.init(chartDiv);
        } else {
            // Usar div principal
            chartDiv = chartContainer;
            if (chartContainer) chartContainer.style.display = 'block';
            targetChart = myChart;
        }

        if (!targetChart) return;

        // d. Configurar el Gráfico
        const totalEnergy = totals.totalEnergy_kcal || 0;
        
        targetChart.setOption({
            title: {
                text: 'Distribución de Macros',
                subtext: `${userId}\nTotal: ${totalKcalMacros.toFixed(0)} kcal`, // Muestra el usuario en el subtítulo
                left: 'center', top: 10
            },
            tooltip: {
                trigger: 'item',
                formatter: (params: any) => {
                    const percentage = ((params.value / totalKcalMacros) * 100).toFixed(1);
                    return `${params.name}: ${params.value.toFixed(0)} kcal (${percentage}%)`;
                }
            },
            legend: {
                orient: 'horizontal',
                left: 'center',
                bottom: '5%'
            },
            series: [{
                name: 'Distribución',
                type: 'pie',
                radius: ['40%', '60%'], // Dona
                center: ['50%', '50%'],
                data: data.map(item => ({...item, value: parseFloat(item.value.toFixed(2))})),
                label: {
                    show: true,
                    position: 'outside',
                    formatter: '{b}\n{d}%',
                    color: '#333'
                },
                labelLine: { show: true },
                itemStyle: {
                    color: (params: any) => {
                        if (params.name === 'Proteína') return '#4CAF50'; // Verde
                        if (params.name === 'Grasa') return '#FF9800'; // Naranja
                        if (params.name === 'Carbohidratos') return '#2196F3'; // Azul
                        return params.color;
                    }
                }
            }]
        });
        targetChart.resize();

    } catch (error) {
        console.error(`Error rendering macro chart for ${userId}:`, error);
    }
}
























// --- NUEVO: Funciones de renderizado de gráficos (v0.3) ---

// 1. Botón "Get Group Statistics"
async function handleRenderStatsTable() {
  currentAnalysisMode = 'stats'; // <-- AÑADE ESTO
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



// --- NUEVA FUNCIÓN AUXILIAR PARA HISTOGRAMA (Cálculo Manual) ---
function calculateHistogramData(data: number[]) {
  if (data.length === 0) return [];

  const min = Math.min(...data);
  const max = Math.max(...data);
  
  // 1. Determinar el número de "bins" (barras) usando la Regla de Sturges
  // Esto decide si mostrar 5 barras o 10 barras según la cantidad de datos.
  const binCount = Math.ceil(1 + 3.322 * Math.log10(data.length));
  
  // Evitar división por cero si todos los datos son iguales
  const range = max - min;
  const binWidth = range === 0 ? 1 : range / binCount;

  // 2. Crear los bins vacíos
  const bins: { x0: number, x1: number, count: number }[] = [];
  for (let i = 0; i < binCount; i++) {
    bins.push({
      x0: min + (i * binWidth),
      x1: min + ((i + 1) * binWidth),
      count: 0
    });
  }

  // 3. Llenar los bins
  data.forEach(value => {
    // Encontrar a qué bin pertenece este valor
    let index = Math.floor((value - min) / binWidth);
    // Caso borde: si el valor es exactamente el máximo, va al último bin
    if (index >= binCount) index = binCount - 1;
    if (index < 0) index = 0; // Seguridad
    
    bins[index].count++;
  });

  return bins;
}


// 2. Botón "Show Distribution (Histogram)" - DISEÑO FINAL Y PULIDO
async function handleRenderHistogram() {
  // [ESTADO] Guardamos que estamos viendo el histograma
  currentAnalysisMode = 'histogram'; 

  const criteria = await getAnalysisCriteria();
  if (!criteria) return;

  clearAnalysisResults();
  if (reportResultsElement) reportResultsElement.innerHTML = '<p>Calculando distribución...</p>';

  try {
    const stats = await window.electronAPI.getStatisticalReport(
      criteria.userIds, criteria.startDate, criteria.endDate, 
      criteria.referenceDbId, criteria.nutrient
    );

    if (!stats.rawData || stats.rawData.length === 0) {
      if (reportResultsElement) reportResultsElement.innerHTML = '<p>No hay datos suficientes.</p>';
      return;
    }

    const bins = calculateHistogramData(stats.rawData);
    const chartCategories = bins.map(b => `${Math.round(b.x0)} - ${Math.round(b.x1)}`);
    const chartData = bins.map(b => b.count);

    if (reportResultsElement) reportResultsElement.innerHTML = '';
    if (chartContainer) chartContainer.style.display = 'block';

    myChart?.setOption({
      title: {
        text: `Distribución de ${criteria.nutrientLabel}`,
        subtext: `Basado en ${stats.rawData.length} registros diarios`,
        left: 'center', top: 10
      },
      grid: {
        left: '15%', // <-- AUMENTADO: Más espacio a la izquierda para "Frecuencia..."
        right: '5%',
        bottom: '15%', // <-- AUMENTADO: Más espacio abajo para las etiquetas
        containLabel: true 
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const index = params[0].dataIndex;
          const bin = bins[index];
          return `
            <strong>${criteria.nutrientLabel}:</strong> ${bin.x0.toFixed(1)} - ${bin.x1.toFixed(1)}<br/>
            <strong>Frecuencia:</strong> ${bin.count} registro(s)
          `;
        }
      },
      xAxis: {
        type: 'category',
        data: chartCategories,
        name: criteria.nutrientLabel, // <-- CORREGIDO: Dice "Energy (kcal)"
        nameLocation: 'middle',
        nameGap: 40, // Más espacio entre el nombre y los números
      },
      yAxis: {
        type: 'value',
        name: 'Frecuencia\n(Días/Registros)', // Salto de línea para ahorrar espacio
        nameLocation: 'middle',
        nameGap: 50 // Espacio para que no se solape con el eje
      },
      series: [{
        name: 'Registros',
        type: 'bar',
        barWidth: '95%',
        data: chartData,
        itemStyle: { color: '#5470C6' }
      }]
    });
    myChart?.resize();

  } catch (error) {
    console.error("Failed to render histogram:", error);
    await window.electronAPI.showErrorDialog('Analysis Error', `Error: ${error}`);
    if (reportResultsElement) reportResultsElement.innerHTML = '';
  }
}



















// 3. Botón "Compare Groups (Box Plot)"
async function handleRenderBoxPlot() {

  currentAnalysisMode = 'boxplot'; // <-- AÑADE ESTO
  // 1. Obtener los criterios (UserID(s), fechas, nutriente)
  const criteria = await getAnalysisCriteria();
  if (!criteria) return;

  clearAnalysisResults();
  if (reportResultsElement) reportResultsElement.innerHTML = '<p>Generando gráfico de cajas...</p>';

  try {
    const categories: string[] = []; // Los nombres de los grupos (e.g., "UserA", "UserB")
    const dataArrays: number[][] = []; // Un array de arrays, e.g. [ [1,2,3], [4,5,6] ]

    // 2. Iterar sobre cada "grupo" (cada UserID separado por coma)
    //    y obtener sus datos estadísticos
    for (const groupName of criteria.userIds) {
      
      // Llamamos a la API de estadísticas para CADA grupo [cite: 340]
      const stats = await window.electronAPI.getStatisticalReport(
        [groupName], // Pasamos el nombre del grupo como un array de un solo ítem
        criteria.startDate,
        criteria.endDate,
        criteria.referenceDbId,
        criteria.nutrient
      );

      // Solo añadimos el grupo si tiene datos válidos
      if (stats.rawData && stats.rawData.length > 0) {
        categories.push(groupName);
        dataArrays.push(stats.rawData); // stats.rawData es el array de promedios diarios [cite: 871]
      }
    }

    if (dataArrays.length === 0) {
      if (reportResultsElement) reportResultsElement.innerHTML = '<p>No se encontraron datos para los grupos especificados.</p>';
      return;
    }

    // 3. Usar la herramienta de ECharts para preparar los datos del Box Plot [cite: 318]
    const boxplotData = (echarts as any).dataTool.prepareBoxplotData(dataArrays);

    if (reportResultsElement) reportResultsElement.innerHTML = '';
    if (chartContainer) chartContainer.style.display = 'block';

    // 4. Renderizar el gráfico
    myChart?.setOption({
  title: {
    text: `Comparación de Grupos para ${criteria.nutrientLabel}`,
    subtext: `Datos de ${criteria.startDate} a ${criteria.endDate}`,
    left: 'center', top: 10
  },
  tooltip: {
    trigger: 'item',
    axisPointer: { type: 'shadow' }
  },
  // --- ARREGLO DE LAYOUT: Margenes y espacio ---
  grid: {
    left: '10%',     // Asegura que el nombre del eje Y no se corte
    right: '5%',
    bottom: '15%',   // Más espacio para los nombres largos de los grupos
    containLabel: true // Ajusta el gráfico para incluir todas las etiquetas
  },
  // ---------------------------------------------
  xAxis: {
    type: 'category',
    data: categories, 
    name: 'Grupo/Usuario',
    nameLocation: 'middle', 
    nameGap: 30,
    // [NUEVO] Si los nombres de usuario son muy largos, rotarlos un poco:
    axisLabel: {
        rotate: 0, // 0 es horizontal. Si son largos, puedes probar 30
        interval: 0
    }
  },
  yAxis: {
    type: 'value',
    name: criteria.nutrientLabel,
    nameLocation: 'middle',
    nameGap: 40, // Más espacio para el nombre del eje Y
    splitArea: { show: true }
  },
  series: [
    {
      name: 'BoxPlot',
      type: 'boxplot',
      data: boxplotData.boxData 
    },
    {
      name: 'Outliers',
      type: 'scatter',
      data: boxplotData.outliers 
    }
  ]
});
myChart?.resize();

  } catch (error) {
    console.error("Failed to render box plot:", error);
    await window.electronAPI.showErrorDialog('Analysis Error', `Error rendering box plot: ${error}`);
    if (reportResultsElement) reportResultsElement.innerHTML = '';
  }
}

// --- Reemplaza la función handleRenderPieChart ---

// 4. Botón "Top 5 Food Sources (Pie)" / "Intake by Meal (Pie)"
async function handleRenderPieChart(type: 'food' | 'meal') {
  currentAnalysisMode = type === 'food' ? 'pie-food' : 'pie-meal';
  const criteria = await getAnalysisCriteria();
  if (!criteria) return;

  clearAnalysisResults();
  if (reportResultsElement) reportResultsElement.innerHTML = '<p>Generando gráficos de pastel...</p>';

  // --- LÓGICA DE RENDERING MÚLTIPLE ---
  if (criteria.userIds.length > 1) {
    // Si hay múltiples usuarios, renderea un gráfico por usuario
    if (!multiChartContainer) return; // Chequeo de seguridad

    // Escondemos el contenedor de gráficos individuales
    if (chartContainer) chartContainer.style.display = 'none'; 
    
    // Iterar sobre cada usuario seleccionado
    for (const userId of criteria.userIds) {
      await renderSinglePieChart(type, userId, criteria);
    }
    
    if (reportResultsElement) reportResultsElement.innerHTML = '';
    return;
  }
  
  // --- LÓGICA DE RENDERING INDIVIDUAL (Un solo gráfico) ---
  await renderSinglePieChart(type, criteria.singleUserId, criteria);
  
  if (reportResultsElement) reportResultsElement.innerHTML = '';
}

// --- NUEVA FUNCIÓN AUXILIAR PARA RENDERIZAR UN SOLO GRÁFICO DE PASTEL ---

async function renderSinglePieChart(type: 'food' | 'meal', userId: string, criteria: any) {
  const chartElementId = `pie-chart-${userId}-${type}`;
  const titleText = type === 'food' ? `Top 5 Fuentes de ${criteria.nutrientLabel}` : `Ingesta por Comida de ${criteria.nutrientLabel}`;
  const subtext = `Usuario: ${userId} (${criteria.startDate} a ${criteria.endDate})`;

  try {
    let data: IContributionReport[] = [];
    
    // 1. Obtener los datos del backend
    if (type === 'food') {
      data = await window.electronAPI.getNutrientContribution(userId, criteria.startDate, criteria.endDate, criteria.referenceDbId, criteria.nutrient);
    } else {
      data = await window.electronAPI.getMealContribution(userId, criteria.startDate, criteria.endDate, criteria.referenceDbId, criteria.nutrient);
    }

    if (data.length === 0) {
      if (multiChartContainer) multiChartContainer.innerHTML += `<p>No hay datos de contribución para ${userId}.</p>`;
      return;
    }

    // Lógica para "Top 5 + Otros" (solo si es por alimento)
    if (type === 'food' && data.length > 5) {
      const top5 = data.slice(0, 5);
      const othersValue = data.slice(5).reduce((sum, item) => sum + item.value, 0);
      data = top5;
      if (othersValue > 0) {
        data.push({ name: 'Otros', value: othersValue });
      }
    }
    
    // 2. Definir el contenedor target (principal o dinámico)
    let targetChart: echarts.ECharts | null;
    let chartDiv: HTMLElement | null;

    if (multiChartContainer && criteria.userIds.length > 1) {
      // Creamos el contenedor dinámico y lo inicializamos
      chartDiv = document.createElement('div');
      chartDiv.id = chartElementId;
      chartDiv.style.width = '400px'; 
      chartDiv.style.height = '400px';
      multiChartContainer.appendChild(chartDiv);
      targetChart = echarts.init(chartDiv);
      
      // Aseguramos que el contenedor principal esté oculto
      if (chartContainer) chartContainer.style.display = 'none';
    } else {
      // Usamos el contenedor principal (myChart)
      chartDiv = chartContainer;
      if (chartContainer) chartContainer.style.display = 'block';
      targetChart = myChart;
    }
    
    if (!targetChart || !chartDiv) return;

    // 3. CONFIGURACIÓN ECHARTS FINAL
    targetChart.setOption({
      title: {
        text: titleText,
        subtext: subtext,
        left: 'center',
        top: 10
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      // --- LEYENDA CORREGIDA: Abajo y con scroll si hay muchos elementos ---
      legend: {
        orient: 'horizontal',
        left: 'center',
        bottom: '5%', // Posición fija y baja
        type: data.length > 6 ? 'scroll' : 'plain' // Usar scroll si hay muchos ítems
      },
      series: [{
        name: 'Contribution',
        type: 'pie',
        radius: '50%', // <-- REDUCIDO: Pastel un poco más pequeño para dejar margen
        center: ['50%', '45%'], // <-- CENTRADO Y SUBIDO: Posición estable
        data: data.map(item => ({...item, value: parseFloat(item.value.toFixed(2))})),
        
        // --- ARREGLO DE ETIQUETAS Y COLORES DE COMIDA ---
        label: {
          show: true,
          position: 'outside', 
          formatter: '{b|{b}}\n{d|{d}%}', // Formato limpio para etiquetas fuera
          rich: {
              b: { fontSize: 12, lineHeight: 15 },
              d: { fontSize: 12, lineHeight: 15, fontWeight: 'bold' }
          }
        },
        labelLine: {
          show: true
        },
        itemStyle: {
            // Usamos una función para mapear nombres de categorías a colores específicos
            color: (params: any) => {
                const name = params.name.toLowerCase();

                // 1. Definir nuestra paleta de colores para las categorías conocidas
                if (name.includes('breakfast')) return '#009688'; // Teal (Verde Azulado)
                if (name.includes('lunch')) return '#FF9800';     // Orange (Naranja)
                if (name.includes('dinner')) return '#F44336';    // Red (Rojo)
                if (name.includes('snack')) return '#9C27B0';     // Purple (Púrpura)
                
                // 2. Colores para Top 5 Food Sources (ej. para tus leches)
                if (name.includes('leche entera cruda')) return '#3F51B5'; // Blue (Azul)
                if (name.includes('leche entera hervida')) return '#5D7E9F';// Gray Blue (Azul Grisáceo)
                if (name.includes('otros')) return '#9E9E9E';     // Gray (Gris) para 'Otros'

                // 3. Devolver color por defecto si no coincide con nada
                return params.color;
            }
        }
        // ------------------------------------------------
      }]
    });
    targetChart.resize();

  } catch (error) {
    console.error(`Failed to render ${type} pie chart for ${userId}:`, error);
    await window.electronAPI.showErrorDialog('Analysis Error', `Error generando gráfico para ${userId}: ${error}`);
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
    loadAllLogs(); // <-- REEMPLAZA (Para recargar el caché)    loadUniqueUserIDs(); // Recargar la lista de usuarios (que estará vacía)
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
    loadAllLogs(); // Recargar la lista de logs
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

//Gestion RDI

// --- FUNCIÓN loadRdiProfiles ACTUALIZADA ---
async function loadRdiProfiles() {
    if (!rdiProfileSelect || !rdiAnalysisProfileSelect) return;

    try {
        const profiles = await window.electronAPI.getRdiProfiles();
        
        // Limpiar y poblar el selector de GESTIÓN (Módulo 1)
        rdiProfileSelect.innerHTML = '';
        
        // Limpiar y poblar el selector de ANÁLISIS (Módulo 3)
        rdiAnalysisProfileSelect.innerHTML = '';
        
        if (profiles.length === 0) {
            rdiProfileSelect.add(new Option("No hay perfiles creados", ""));
            rdiAnalysisProfileSelect.add(new Option("Perfil no disponible", ""));
        } else {
            profiles.forEach(p => {
                // Selector de Gestión (Módulo 1)
                rdiProfileSelect!.add(new Option(p.ProfileName, p.ProfileID.toString()));
                
                // Selector de Análisis (Módulo 3)
                rdiAnalysisProfileSelect!.add(new Option(p.ProfileName, p.ProfileID.toString()));
            });
        }
    } catch (error) {
        console.error("Error loading RDI profiles:", error);
    }
}

async function handleCreateRdiProfile() {
    if (!newRdiProfileName || !rdiStatusMsg) return;
    const name = newRdiProfileName.value.trim();
    if (!name) return;

    try {
        const result = await window.electronAPI.createRdiProfile(name);
        rdiStatusMsg.textContent = result;
        rdiStatusMsg.style.color = 'green';
        newRdiProfileName.value = '';
        loadRdiProfiles(); // Recargar lista
    } catch (error) {
        rdiStatusMsg.textContent = "Error: " + error;
        rdiStatusMsg.style.color = 'red';
    }
}

async function handleImportRdiExcel() {
    if (!rdiProfileSelect || !rdiStatusMsg) return;
    const profileId = parseInt(rdiProfileSelect.value);
    
    if (isNaN(profileId)) {
        await window.electronAPI.showErrorDialog("Error", "Selecciona un perfil válido primero.");
        return;
    }

    rdiStatusMsg.textContent = "Importando valores...";
    try {
        const result = await window.electronAPI.importRdiExcel(profileId);
        rdiStatusMsg.textContent = result;
        rdiStatusMsg.style.color = 'blue';
    } catch (error) {
        rdiStatusMsg.textContent = "Error importando: " + error;
        rdiStatusMsg.style.color = 'red';
    }
}

// --- GRÁFICO DE ADECUACIÓN NUTRICIONAL (Barra de Porcentaje) ---
// --- FUNCIÓN FINAL: GRÁFICO DE ADECUACIÓN NUTRICIONAL ---
async function handleRenderAdequacyChart() {
  currentAnalysisMode = 'adequacy'; 
  
  const criteria = await getAnalysisCriteria();
  if (!criteria || !rdiAnalysisProfileSelect) return; // Asegurar que el selector existe

  // 1. Obtener el ProfileID del selector del Módulo 3
  const selectedProfileId = parseInt(rdiAnalysisProfileSelect.value);
  
  if (isNaN(selectedProfileId)) {
       await window.electronAPI.showErrorDialog("Error", "Por favor, selecciona un Perfil de Requerimiento (RDI) válido.");
       return;
  }
  
  // Como el gráfico muestra TODOS los nutrientes, no hay necesidad de usar el selector de 'Nutrient to Analyze'.

  clearAnalysisResults();
  if (reportResultsElement) reportResultsElement.innerHTML = '<p>Calculando adecuación nutricional...</p>';

  try {
    // 2. Llamar al backend con el ProfileID seleccionado
    const adequacyData = await window.electronAPI.getAdequacyReport(
        criteria.userIds.join(','), 
        criteria.startDate,
        criteria.endDate,
        criteria.referenceDbId,
        selectedProfileId // <-- Usamos el ID del selector
    );

    if (adequacyData.length === 0) {
         if (reportResultsElement) reportResultsElement.innerHTML = '<p>No se encontraron datos de adecuación (o el perfil RDI está vacío).</p>';
         return;
    }

    // 3. Preparar datos y renderizar (Lógica de Colores Semáforo)
    const categories = adequacyData.map(d => d.nutrient);
    const values = adequacyData.map(d => d.percentage);
    const profileName = rdiAnalysisProfileSelect.options[rdiAnalysisProfileSelect.selectedIndex].text;

    if (reportResultsElement) reportResultsElement.innerHTML = '';
    if (chartContainer) chartContainer.style.display = 'block';

    myChart?.setOption({
      title: {
        text: `Adecuación Nutricional (% de Cobertura)`,
        subtext: `Promedio del Grupo vs. ${profileName} (${criteria.userIds.length} users)`,
        left: 'center', top: 10
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
            const index = params[0].dataIndex;
            const item = adequacyData[index];
            return `
                <strong>${item.nutrient}</strong><br/>
                Ingesta: ${item.intake.toFixed(2)}<br/>
                Recomendación (${item.type}): ${item.rdi.toFixed(0)}<br/>
                <strong>Cumplimiento: ${item.percentage.toFixed(1)}%</strong>
            `;
        }
      },
      grid: {
        left: '5%', right: '5%', bottom: '15%', containLabel: true
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: { rotate: 45, interval: 0 } 
      },
      yAxis: {
        type: 'value',
        name: '% Adecuación',
        axisLabel: { formatter: '{value} %' },
        max: 150 // Límite en 150% para ver la meta más claramente
      },
      series: [{
        name: 'Adecuación',
        type: 'bar',
        data: values,
        markLine: {
            data: [{ yAxis: 100, name: 'Meta (100% RDA)', lineStyle: { color: 'red', type: 'dashed', width: 2 } }],
            symbol: 'none'
        },
        itemStyle: {
            color: (params: any) => {
                const val = params.value;
                if (val < 70) return '#F44336'; // Rojo (Deficiente)
                if (val > 120) return '#FF9800'; // Naranja (Posible Exceso - Ojo con UL)
                return '#4CAF50'; // Verde (Adecuado)
            }
        }
      }]
    });
    myChart?.resize();

  } catch (error) {
    console.error("Failed to render adequacy chart:", error);
    await window.electronAPI.showErrorDialog('Analysis Error', `Error: ${error}`);
    if (reportResultsElement) reportResultsElement.innerHTML = '';
  }
}




















// --- Reemplaza la función handleRenderLineChart ---

// 5. Botón "Intake Over Time (Line)" - AHORA SOPORTA MÚLTIPLES USUARIOS
async function handleRenderLineChart() {
  currentAnalysisMode = 'line'; // Actualizar estado

  // getAnalysisCriteria ya nos da un array de userIds (e.g., ['UserA', 'UserB'])
  const criteria = await getAnalysisCriteria();
  if (!criteria) return;

  clearAnalysisResults();
  if (reportResultsElement) reportResultsElement.innerHTML = '<p>Generando gráfico de línea...</p>';

  try {
    // 1. Obtener todos los datos diarios para TODOS los usuarios a la vez
    const dailyDataByUser = await window.electronAPI.getDailyIntakeOverTime(
      criteria.userIds, // Pasamos el array completo
      criteria.startDate, 
      criteria.endDate, 
      criteria.referenceDbId, 
      criteria.nutrient
    );
    
    // 2. Extraer las fechas únicas que se usarán como Eje X
    const allDates = new Set<string>();
    dailyDataByUser.forEach(userArray => userArray.forEach(item => allDates.add(item.date)));
    const sortedDates = Array.from(allDates).sort();

    if (sortedDates.length === 0) {
      if (reportResultsElement) reportResultsElement.innerHTML = '<p>No se encontraron datos diarios para este período.</p>';
      return;
    }

    // 3. Crear las series (una línea por cada usuario)
    const chartSeries: any[] = [];
    const legendData: string[] = [];

    criteria.userIds.forEach(userId => {
        const userData = dailyDataByUser.find(arr => arr[0]?.userId === userId);
        
        // Mapear los valores para que coincidan con el eje X (las fechas)
        const dataMap = new Map(userData ? userData.map(item => [item.date, item.value]) : []);
        
        const seriesData = sortedDates.map(date => dataMap.get(date) ?? 0); // Usar 0 si no hay dato para ese día
        
        legendData.push(userId); // Añadir el nombre del usuario a la leyenda

        chartSeries.push({
            name: userId,
            type: 'line',
            smooth: true,
            data: seriesData
        });
    });

    if (reportResultsElement) reportResultsElement.innerHTML = '';
    if (chartContainer) chartContainer.style.display = 'block';

    // 4. Renderizar el gráfico con múltiples series
    myChart?.setOption({
      title: {
    text: `Ingesta Diaria de ${criteria.nutrientLabel}`,
    subtext: `Comparación: ${criteria.userIds.join(', ')}`,
    left: 'center', top: 10 // [AJUSTE] Top 10px (menos que 20px)
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any[]) => {
            // Formatea el tooltip para mostrar los valores de todas las líneas en ese día
            let tooltipHtml = `<strong>${params[0].axisValue}</strong><br/>`;
            params.forEach(param => {
                tooltipHtml += `<span style="color:${param.color}">●</span> ${param.seriesName}: ${param.value.toFixed(2)}<br/>`;
            });
            return tooltipHtml;
        }
      },
      legend: {
          data: legendData,
          top: 50
      },


    // --- ARREGLOS DE LAYOUT: Margenes y espacio ---
  grid: {
      left: '3%',
      right: '5%',
      top: '25%', // [AJUSTE CRÍTICO] Baja el área del gráfico (25%) para dar espacio al Título y Leyenda.
      bottom: '10%',
      containLabel: true // Asegura que todas las etiquetas sean visibles
  },
  // ------------------------------------------------


      xAxis: {
        type: 'category',
        data: sortedDates, // Usar todas las fechas únicas
        name: 'Fecha'
      },
      yAxis: {
        type: 'value',
        name: criteria.nutrientLabel,
        axisLabel: { formatter: '{value}' }
      },
      series: chartSeries // El array de líneas
    });

    myChart?.resize();

  } catch (error) {
    console.error("Failed to render multi-series line chart:", error);
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
    
    //Elementos RDI DOMContentloaded
rdiProfileSelect = document.getElementById('rdiProfileSelect') as HTMLSelectElement | null;
    btnImportRdiValues = document.getElementById('btnImportRdiValues') as HTMLButtonElement | null;
    newRdiProfileName = document.getElementById('newRdiProfileName') as HTMLInputElement | null;
    btnCreateRdiProfile = document.getElementById('btnCreateRdiProfile') as HTMLButtonElement | null;
    rdiStatusMsg = document.getElementById('rdiStatusMsg');
    
    // Cargar perfiles al iniciar
    loadRdiProfiles();

 
    // --- ASIGNAR NUEVOS ELEMENTOS DE FILTRO ---
foodListSearchInputElement = document.getElementById('foodListSearchInput') as HTMLInputElement | null;
foodListDbFilterElement = document.getElementById('foodListDbFilter') as HTMLSelectElement | null;

// --- ASIGNAR NUEVOS ELEMENTOS DE PAGINACIÓN ---
foodListPaginationElement = document.getElementById('foodListPagination');
prevPageBtn = document.getElementById('prevPageBtn') as HTMLButtonElement | null;
nextPageBtn = document.getElementById('nextPageBtn') as HTMLButtonElement | null;
pageIndicatorElement = document.getElementById('pageIndicator');
showAllToggleElement = document.getElementById('showAllToggle') as HTMLInputElement | null;
pageControlsContainer = document.getElementById('pageControlsContainer'); // <-- AÑADE ESTA LÍNEA



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
    
    // --- ASIGNAR NUEVOS ELEMENTOS DE LOGS ---
logSearchInputElement = document.getElementById('logSearchInput') as HTMLInputElement | null;
logPaginationContainer = document.getElementById('logPaginationContainer');
logPrevPageBtn = document.getElementById('logPrevPageBtn') as HTMLButtonElement | null;
logNextPageBtn = document.getElementById('logNextPageBtn') as HTMLButtonElement | null;
logPageIndicatorElement = document.getElementById('logPageIndicator');
    
    
    
    
    
    
    
    
    
    
    gramsInputContainer = document.getElementById('gramsInputContainer');
    portionsInputContainer = document.getElementById('portionsInputContainer');
    portionsInputElement = document.getElementById('portionsInput') as HTMLInputElement | null;
    recipeYieldLabel = document.getElementById('recipeYieldLabel');
    
    
    
    
    // Detailed Edit Form
    editFoodFormContainer = document.getElementById('editFoodFormContainer');
    editFoodIdInput = document.getElementById('editFoodId') as HTMLInputElement | null;
    editFoodNameInput = document.getElementById('editFoodName') as HTMLInputElement | null;
    editFoodTypeSelect = document.getElementById('editFoodType') as HTMLSelectElement | null;
    simpleFoodNutrientsDiv = document.getElementById('simpleFoodNutrients');
    recipeIngredientsDiv = document.getElementById('recipeIngredients');
    recipeFoodSearchInput = document.getElementById('recipeFoodSearchInput') as HTMLInputElement | null;
    recipeFoodSelect = document.getElementById('recipeFoodSelect') as HTMLSelectElement | null;
    recipeGramsInput = document.getElementById('recipeGramsInput') as HTMLInputElement | null;
    addIngredientBtn = document.getElementById('addIngredientBtn') as HTMLButtonElement | null;
    ingredientList = document.getElementById('ingredientList') as HTMLUListElement | null;
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
    rdiAnalysisProfileSelect = document.getElementById('rdiAnalysisProfileSelect') as HTMLSelectElement | null; // <-- NUEVO
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
    renderAdequacyBtn = document.getElementById('renderAdequacyBtn') as HTMLButtonElement | null; // <-- NUEVO
    renderTopFoodsBtn = document.getElementById('renderTopFoodsBtn') as HTMLButtonElement | null;
    renderMealBtn = document.getElementById('renderMealBtn') as HTMLButtonElement | null;
    renderMacroDistBtn = document.getElementById('renderMacroDistBtn') as HTMLButtonElement | null; // <-- NUEVO
    renderOverTimeBtn = document.getElementById('renderOverTimeBtn') as HTMLButtonElement | null;
    chartContainer = document.getElementById('chartContainer');
    multiChartContainer = document.getElementById('multiChartContainer'); // <-- NUEVO
    statsResults = document.getElementById('statsResults');


    // --- Load initial data ---
    loadDatabasesIntoSelectors();
    loadAndDisplayFoods();
    loadUniqueUserIDs();
    loadAllLogs();
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

    // Para editar el tipo de comida
    if (editFoodTypeSelect) {
    editFoodTypeSelect.addEventListener('change', toggleEditFormView);
    } else {
    console.error("Could not find Edit Food Type select (editFoodTypeSelect)");
    }

    // Listeners para el formulario de ingredientes de receta
    if (recipeFoodSearchInput) {
    // Usamos 'keyup' para buscar mientras se escribe
    recipeFoodSearchInput.addEventListener('keyup', searchAllFoodsForRecipe);
    } else {
    console.error("Could not find Recipe Food Search input");
    }

    if (addIngredientBtn) {
    // *** DESCOMENTA (O AÑADE) ESTA LÍNEA ***
    addIngredientBtn.addEventListener('click', handleAddIngredient);
  } else {
    console.error("Could not find Add Ingredient button");
  } 

    // Consumption Log
    if (userIdInputElement) { userIdInputElement.addEventListener('input', handleLogFilterChange);    
    } else { console.error("Could not find User ID input (userIdInputElement)"); }
    if (foodSelectElement) {
  foodSelectElement.addEventListener('change', handleFoodSelectionChange);
} else {
  console.error("Could not find Log Food Select (foodSelectElement)");
}
    if (consumptionDateElement) { consumptionDateElement.addEventListener('change', handleLogFilterChange); } else { console.error("Could not find Date input (consumptionDateElement)"); }
    if (refDbSelectElement) { refDbSelectElement.addEventListener('change', searchFoods); } else { console.error("Could not find Reference DB select (refDbSelectElement)"); }
    if (foodSearchInputElement) { foodSearchInputElement.addEventListener('input', () => { if (searchTimeout) clearTimeout(searchTimeout); searchTimeout = setTimeout(searchFoods, 300); }); } else { console.error("Could not find Food Search input (foodSearchInputElement)"); }
    if (logFormElement) { logFormElement.addEventListener('submit', addLogEntry); } else { console.error("Could not find Log form (logFormElement)"); }

    // --- AÑADIR NUEVOS LISTENERS DE FILTRO/PAGINACIÓN DE LOGS ---
if (logSearchInputElement) {
  logSearchInputElement.addEventListener('input', handleLogFilterChange);
} else { console.error("Could not find Log Search Input"); }

if (logPrevPageBtn) {
  logPrevPageBtn.addEventListener('click', handlePrevLogPage);
} else { console.error("Could not find logPrevPageBtn"); }

if (logNextPageBtn) {
  logNextPageBtn.addEventListener('click', handleNextLogPage);
} else { console.error("Could not find logNextPageBtn"); }




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

   if (renderAdequacyBtn) {
    renderAdequacyBtn.addEventListener('click', handleRenderAdequacyChart);
  } else { console.error("Could not find renderAdequacyBtn"); }




    if (renderTopFoodsBtn) {
        renderTopFoodsBtn.addEventListener('click', () => handleRenderPieChart('food'));
    } else { console.error("Could not find renderTopFoodsBtn"); }
    
    if (renderMealBtn) {
        renderMealBtn.addEventListener('click', () => handleRenderPieChart('meal'));
    } else { console.error("Could not find renderMealBtn"); }

   // AÑADE ESTO:
   if (renderMacroDistBtn) {
  renderMacroDistBtn.addEventListener('click', handleRenderMacroDistribution);
   } else { console.error("Could not find renderMacroDistBtn"); }


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

   // --- LISTENERS PARA LOS NUEVOS FILTROS DE LA LISTA ---
if (foodListSearchInputElement) {
  foodListSearchInputElement.addEventListener('input', handleFilterChange); // <-- CAMBIADO
} else {
  console.error("Could not find Food List Search Input");
}

if (foodListDbFilterElement) {
  foodListDbFilterElement.addEventListener('change', handleFilterChange); // <-- CAMBIADO
} else {
  console.error("Could not find Food List DB Filter");
}




//Listeners de paginacion
if (prevPageBtn) {
  prevPageBtn.addEventListener('click', handlePrevPage);
} else { console.error("Could not find prevPageBtn"); }

if (nextPageBtn) {
  nextPageBtn.addEventListener('click', handleNextPage);
} else { console.error("Could not find nextPageBtn"); }

if (showAllToggleElement) {
  showAllToggleElement.addEventListener('click', handleToggleShowAll);
} else { console.error("Could not find showAllToggleElement"); }


 if (nutrientSelect) {
    nutrientSelect.addEventListener('change', handleAutoUpdateAnalysis);
} else {
    console.error("Could not find nutrientSelect for auto-update");
}


//Listeners Rdi
if (btnCreateRdiProfile) btnCreateRdiProfile.addEventListener('click', handleCreateRdiProfile);
if (btnImportRdiValues) btnImportRdiValues.addEventListener('click', handleImportRdiExcel);



}); // End DOMContentLoaded