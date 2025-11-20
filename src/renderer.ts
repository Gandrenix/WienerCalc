/// <reference path="./preload.d.ts" />
/// <reference types="echarts" />

// =============================================================================
// SECCIÓN 1: INTERFACES Y TIPOS
// =============================================================================

interface IDatabaseInfo {
    DatabaseID: number;
    DatabaseName: string;
}

interface IFoodDetail {
    FoodID: number;
    Name: string;
    DatabaseName: string;
}

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

interface ISearchFoodResult {
    FoodID: number;
    Name: string;
    FoodType: 'simple' | 'recipe';
    RecipeYieldGrams: number | null;
}

interface IRecipeIngredient {
    foodId: number;
    name: string;
    grams: number;
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
    MealType?: string;
    FoodID: number;
    FoodName: string;
    ReferenceDatabaseID: number;
    ReferenceDatabaseName: string;
    Grams: number;
    Timestamp: string;
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

// Report & Stats Interfaces
interface IReportRow {
    nutrient: string;
    value: string;
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
}

// =============================================================================
// SECCIÓN 2: VARIABLES GLOBALES DE ESTADO
// =============================================================================

// Estado de Paginación y Caché (Alimentos)
let allFoodsCache: IFoodDetail[] = [];
let currentFoodListPage = 1;
const itemsPerPage = 7;

// Estado de Paginación y Caché (Logs)
let allLogsCache: ILogEntry[] = [];
let currentLogPage = 1;
const logsPerPage = 7;

// Estado de Edición y Búsqueda
let currentFoodSearchResults: ISearchFoodResult[] = [];
let currentRecipeIngredients: IRecipeIngredient[] = [];
let searchTimeout: NodeJS.Timeout | null = null;

// Estado de Análisis y Reportes
let currentAnalysisMode: 'stats' | 'histogram' | 'boxplot' | 'pie-food' | 'pie-meal' | 'line' | 'macro-dist' | 'adequacy' | null = null;
let lastCalculatedTotals: INutrientTotals | null = null;
let lastReportTitle: string = 'Report';
let myChart: echarts.ECharts | null = null; // Instancia del gráfico

// Temporizadores
let rdiStatusTimeout: any = null;

// Constantes de Visualización
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

// =============================================================================
// SECCIÓN 3: REFERENCIAS AL DOM (Inicializadas en DOMContentLoaded)
// =============================================================================

// 3.1. Gestión de Librería (Library Management)
let dbSelectElement: HTMLSelectElement | null = null;
let importDbSelectElement: HTMLSelectElement | null = null;
let foodForm: HTMLFormElement | null = null;
let foodInput: HTMLInputElement | null = null;
let foodListElement: HTMLElement | null = null;
let importButton: HTMLButtonElement | null = null;
let importCsvBtn: HTMLButtonElement | null = null;
let importStatus: HTMLElement | null = null;
let addDbBtn: HTMLButtonElement | null = null;
let newDbNameInput: HTMLInputElement | null = null;
let saveNewDbBtn: HTMLButtonElement | null = null;
let deleteDbBtn: HTMLButtonElement | null = null;
let purgeDbBtn: HTMLButtonElement | null = null;

// 3.2. Lista de Alimentos y Filtros
let foodListSearchInputElement: HTMLInputElement | null = null;
let foodListDbFilterElement: HTMLSelectElement | null = null;
let foodListPaginationElement: HTMLElement | null = null;
let prevPageBtn: HTMLButtonElement | null = null;
let nextPageBtn: HTMLButtonElement | null = null;
let pageIndicatorElement: HTMLElement | null = null;
let showAllToggleElement: HTMLInputElement | null = null;
let pageControlsContainer: HTMLElement | null = null;

// 3.3. Registro de Consumo (Consumption Log)
let refDbSelectElement: HTMLSelectElement | null = null;
let userIdInputElement: HTMLInputElement | null = null;
let consumptionDateElement: HTMLInputElement | null = null;
let mealTypeSelectElement: HTMLSelectElement | null = null;
let foodSearchInputElement: HTMLInputElement | null = null;
let foodSelectElement: HTMLSelectElement | null = null;
let gramsInputElement: HTMLInputElement | null = null;
let logFormElement: HTMLFormElement | null = null;
let logEntriesElement: HTMLElement | null = null;
let importLogButton: HTMLButtonElement | null = null;
let importLogCsvBtn: HTMLButtonElement | null = null;
let importLogStatus: HTMLElement | null = null;
let userIdDataListElement: HTMLDataListElement | null = null;
let deleteAllLogsBtn: HTMLButtonElement | null = null;
let deleteUserLogsBtn: HTMLButtonElement | null = null;

// Log Paginación
let logSearchInputElement: HTMLInputElement | null = null;
let logPaginationContainer: HTMLElement | null = null;
let logPrevPageBtn: HTMLButtonElement | null = null;
let logNextPageBtn: HTMLButtonElement | null = null;
let logPageIndicatorElement: HTMLElement | null = null;

// Log Gramos vs Porciones
let gramsInputContainer: HTMLElement | null = null;
let portionsInputContainer: HTMLElement | null = null;
let portionsInputElement: HTMLInputElement | null = null;
let recipeYieldLabel: HTMLElement | null = null;

// 3.4. Formulario de Edición de Alimentos (Detailed Food Edit)
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
let saveEditFoodBtn: HTMLButtonElement | null = null;
let cancelEditFoodBtn: HTMLButtonElement | null = null;

// Inputs Nutrientes (Edición)
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

// 3.5. Modal Edición de Log
let editLogModal: HTMLElement | null = null;
let editLogIdInput: HTMLInputElement | null = null;
let editLogGramsInput: HTMLInputElement | null = null;
let editLogFoodName: HTMLElement | null = null;
let saveEditLogBtn: HTMLButtonElement | null = null;
let cancelEditLogBtn: HTMLButtonElement | null = null;

// 3.6. Reportes y Cálculos
let reportUserIdInputElement: HTMLInputElement | null = null;
let reportStartDateElement: HTMLInputElement | null = null;
let reportEndDateElement: HTMLInputElement | null = null;
let reportRefDbSelectElement: HTMLSelectElement | null = null;
let calculateBtnElement: HTMLButtonElement | null = null;
let reportResultsElement: HTMLElement | null = null;
let exportControls: HTMLElement | null = null;
let exportCsvBtn: HTMLButtonElement | null = null;
let exportExcelBtn: HTMLButtonElement | null = null;

// 3.7. Análisis y Gráficos
let nutrientSelect: HTMLSelectElement | null = null;
let calcStatsBtn: HTMLButtonElement | null = null;
let renderHistogramBtn: HTMLButtonElement | null = null;
let renderBoxPlotBtn: HTMLButtonElement | null = null;
let renderAdequacyBtn: HTMLButtonElement | null = null;
let renderTopFoodsBtn: HTMLButtonElement | null = null;
let renderMealBtn: HTMLButtonElement | null = null;
let renderMacroDistBtn: HTMLButtonElement | null = null;
let renderOverTimeBtn: HTMLButtonElement | null = null;
let chartContainer: HTMLElement | null = null;
let multiChartContainer: HTMLElement | null = null;
let statsResults: HTMLElement | null = null;

// 3.8. Gestión RDI (Import/Create)
let rdiProfileSelect: HTMLSelectElement | null = null;
let btnImportRdiValues: HTMLButtonElement | null = null;
let newRdiProfileName: HTMLInputElement | null = null;
let btnCreateRdiProfile: HTMLButtonElement | null = null;
let rdiStatusMsg: HTMLElement | null = null;
let rdiAnalysisProfileSelect: HTMLSelectElement | null = null;
let btnDeleteRdiProfile: HTMLButtonElement | null = null;
let btnToggleCreateRdi: HTMLButtonElement | null = null;
let createRdiProfileContainer: HTMLElement | null = null;

// 3.9. Gestión de Pacientes (Subjects)
let subjectSelect: HTMLSelectElement | null = null;
let btnManageSubjects: HTMLButtonElement | null = null;
let activeSubjectInfo: HTMLElement | null = null;

// Modal Pacientes
let subjectModal: HTMLElement | null = null;
let btnSubjSave: HTMLButtonElement | null = null;
let btnSubjCancel: HTMLButtonElement | null = null;
let btnSubjDelete: HTMLButtonElement | null = null;
let subjMsg: HTMLElement | null = null;
let historyTableBody: HTMLElement | null = null;

// Inputs Pacientes
let subjIdInput: HTMLInputElement | null = null;
let subjNameInput: HTMLInputElement | null = null;
let subjBirthInput: HTMLInputElement | null = null;
let subjGenderInput: HTMLSelectElement | null = null;
let subjWeightInput: HTMLInputElement | null = null;
let subjHeightInput: HTMLInputElement | null = null;
let subjPhysioInput: HTMLSelectElement | null = null;
let subjNotesInput: HTMLTextAreaElement | null = null;


// =============================================================================
// SECCIÓN 4: FUNCIONES AUXILIARES Y UTILITARIAS
// =============================================================================

function getNutrientValue(inputElement: HTMLInputElement | null): number | null {
    if (!inputElement || inputElement.value.trim() === '') {
        return null;
    }
    const value = parseFloat(inputElement.value);
    return isNaN(value) ? null : value;
}

function showRdiStatus(message: string, color: string) {
    if (!rdiStatusMsg) return;

    // Limpiar timeout anterior si existe
    if (rdiStatusTimeout) clearTimeout(rdiStatusTimeout);

    rdiStatusMsg.textContent = message;
    rdiStatusMsg.style.color = color;
    rdiStatusMsg.style.opacity = '1';

    // Ocultar después de 3 segundos
    rdiStatusTimeout = setTimeout(() => {
        if (rdiStatusMsg) {
            rdiStatusMsg.textContent = '';
        }
    }, 3000);
}

// =============================================================================
// SECCIÓN 5: GESTIÓN DE BASES DE DATOS Y LIBRERÍA DE ALIMENTOS
// =============================================================================

// Cargar bases de datos y poblar selectores
async function loadDatabasesIntoSelectors() {
    if (!dbSelectElement || !importDbSelectElement || !refDbSelectElement || !reportRefDbSelectElement || !foodListDbFilterElement) {
        console.error("One or more DB selectors not found during loadDatabasesIntoSelectors");
        return;
    }
    const currentDbSelect = dbSelectElement;
    const currentImportDbSelect = importDbSelectElement;
    const currentRefDbSelect = refDbSelectElement;
    const currentReportRefDbSelect = reportRefDbSelectElement;
    const currentFoodListDbFilter = foodListDbFilterElement;

    try {
        const databases = await window.electronAPI.getDatabases();
        console.log("Databases loaded for selectors:", databases);
        currentDbSelect.innerHTML = '';
        currentImportDbSelect.innerHTML = '';
        currentRefDbSelect.innerHTML = '';
        currentReportRefDbSelect.innerHTML = '';
        currentFoodListDbFilter.innerHTML = '';

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
            currentFoodListDbFilter.disabled = true;
        } else {
            currentDbSelect.disabled = false;
            currentImportDbSelect.disabled = false;
            currentRefDbSelect.disabled = false;
            currentReportRefDbSelect.disabled = false;
            currentFoodListDbFilter.disabled = false;
            databases.forEach(db => {
                const option = new Option(db.DatabaseName, db.DatabaseID.toString());
                currentDbSelect.add(option.cloneNode(true) as HTMLOptionElement);
                currentImportDbSelect.add(option.cloneNode(true) as HTMLOptionElement);
                currentRefDbSelect.add(option.cloneNode(true) as HTMLOptionElement);
                currentReportRefDbSelect.add(option.cloneNode(true) as HTMLOptionElement);
                currentFoodListDbFilter.add(new Option(db.DatabaseName, db.DatabaseName));
            });
        }
    } catch (error) {
        console.error('Failed to load databases:', error);
        if (currentDbSelect) currentDbSelect.disabled = true;
        if (currentImportDbSelect) currentImportDbSelect.disabled = true;
        if (currentRefDbSelect) currentRefDbSelect.disabled = true;
        if (currentReportRefDbSelect) currentReportRefDbSelect.disabled = true;
    }
}

async function handleAddNewDatabase() {
    if (!newDbNameInput || !saveNewDbBtn || !addDbBtn) return;
    addDbBtn.style.display = 'none';
    newDbNameInput.style.display = 'inline-block';
    saveNewDbBtn.style.display = 'inline-block';
    newDbNameInput.focus();
}

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

async function handleDeleteDatabase() {
    if (!dbSelectElement) return;

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

async function handlePurgeFoodLibrary() {
    console.log('--- Debug: handlePurgeFoodLibrary Fired ---');
    if (!dbSelectElement) return;
    const selectedDbId = parseInt(dbSelectElement.value, 10);
    const selectedDbName = dbSelectElement.options[dbSelectElement.selectedIndex]?.text;

    if (!selectedDbId || selectedDbId <= 0) {
        await window.electronAPI.showErrorDialog('Invalid Selection', 'Please select a valid database to purge.');
        return;
    }

    const confirm1 = await window.electronAPI.showConfirmDialog({
        type: 'warning',
        title: 'Confirm Purge Library',
        message: `Are you sure you want to delete ALL food items from "${selectedDbName}"?`,
        detail: 'This action is irreversible and will remove all food entries from this library. The library itself will remain.',
        buttons: ['Cancel', 'Yes, Purge Foods'],
        defaultId: 0, cancelId: 0
    });

    if (confirm1.response !== 1) return;

    const confirm2 = await window.electronAPI.showConfirmDialog({
        type: 'error',
        title: 'FINAL WARNING',
        message: `All ${selectedDbName} foods will be deleted. Are you absolutely sure?`,
        buttons: ['Cancel', 'Yes, Delete All Foods'],
        defaultId: 0, cancelId: 0
    });

    if (confirm2.response !== 1) return;

    try {
        const result = await window.electronAPI.purgeFoodLibrary(selectedDbId);
        await window.electronAPI.showInfoDialog('Success', result);
        loadAndDisplayFoods();
    } catch (error) {
        await window.electronAPI.showErrorDialog('Error Purging Library', String(error));
    }
}

// 5.2. Importación de Alimentos (Excel/CSV)

async function handleImportCSV() {
    if (!importDbSelectElement || !importStatus || !importCsvBtn) return;
    const selectedDbId = parseInt(importDbSelectElement.value, 10);

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
        loadAndDisplayFoods();
    } catch (error) {
        console.error('CSV Import failed:', error);
        const errorMsg = String(error);
        if (importStatus) importStatus.textContent = `CSV Import failed: ${errorMsg}`;
        await window.electronAPI.showErrorDialog('CSV Import Failed', errorMsg);
    } finally {
        if (importCsvBtn) importCsvBtn.disabled = false;
        if (importButton) importButton.disabled = false;
        if (importDbSelectElement) importDbSelectElement.disabled = false;
    }
}

// =============================================================================
// SECCIÓN 6: LISTA Y EDICIÓN DE ALIMENTOS
// =============================================================================

// Carga la lista completa en caché
async function loadAndDisplayFoods() {
    try {
        allFoodsCache = await window.electronAPI.getFoods();
        renderFilteredFoodList();
    } catch (error) {
        console.error('Failed to load foods:', error);
        if (foodListElement) foodListElement.innerHTML = `<p style="color: red;">Error loading food list.</p>`;
    }
}

// Renderizado y Paginación de Alimentos
function handleFilterChange() {
    currentFoodListPage = 1;
    renderFilteredFoodList();
}

function handlePrevPage() {
    if (currentFoodListPage > 1) {
        currentFoodListPage--;
        renderFilteredFoodList();
    }
}

function handleNextPage() {
    currentFoodListPage++;
    renderFilteredFoodList();
}

function handleToggleShowAll() {
    currentFoodListPage = 1;
    renderFilteredFoodList();
}

function renderFilteredFoodList() {
    if (!foodListElement || !foodListSearchInputElement || !foodListDbFilterElement ||
        !showAllToggleElement || !foodListPaginationElement || !prevPageBtn ||
        !nextPageBtn || !pageIndicatorElement || !pageControlsContainer) {
        console.warn("Elementos de la lista de alimentos no encontrados, saltando renderizado.");
        return;
    }

    const searchTerm = foodListSearchInputElement.value.toLowerCase();
    const dbFilter = foodListDbFilterElement.value;
    const showAll = showAllToggleElement.checked;

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

    foodListElement.innerHTML = '';
    const totalItems = filteredFoods.length;
    foodListPaginationElement.style.display = 'flex';

    if (totalItems === 0) {
        foodListElement.innerHTML = '<p>No se encontraron alimentos con esos filtros.</p>';
        pageControlsContainer.style.display = 'none';
        return;
    }

    if (showAll) {
        pageControlsContainer.style.display = 'none';
        foodListPaginationElement.style.justifyContent = 'flex-end';

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
        pageControlsContainer.style.display = 'block';
        foodListPaginationElement.style.justifyContent = 'space-between';

        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (currentFoodListPage > totalPages) currentFoodListPage = totalPages;
        if (currentFoodListPage < 1) currentFoodListPage = 1;

        pageIndicatorElement.textContent = `Página ${currentFoodListPage} de ${totalPages}`;
        prevPageBtn.disabled = (currentFoodListPage === 1);
        nextPageBtn.disabled = (currentFoodListPage === totalPages);

        const startIndex = (currentFoodListPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const itemsToDisplay = filteredFoods.slice(startIndex, endIndex);

        const ul = document.createElement('ul');
        ul.style.listStyleType = 'none'; ul.style.paddingLeft = '0';
        itemsToDisplay.forEach(food => renderFoodListItem(food, ul));
        foodListElement.appendChild(ul);
    }
}

function renderFoodListItem(food: IFoodDetail, ul: HTMLUListElement) {
    const li = document.createElement('li');
    li.dataset.foodId = food.FoodID.toString();

    const nameSpan = document.createElement('span');
    nameSpan.className = 'food-name';
    nameSpan.textContent = `${food.Name} (${food.DatabaseName})`;
    li.appendChild(nameSpan);

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

// Funciones de Edición (Detailed Form)

function toggleEditFormView() {
    if (!editFoodTypeSelect || !simpleFoodNutrientsDiv || !recipeIngredientsDiv) return;
    const selectedType = editFoodTypeSelect.value;

    if (selectedType === 'recipe') {
        simpleFoodNutrientsDiv.style.display = 'none';
        recipeIngredientsDiv.style.display = 'block';
    } else {
        simpleFoodNutrientsDiv.style.display = 'block';
        recipeIngredientsDiv.style.display = 'none';
    }
}

async function showEditForm(foodId: number, currentName: string) {
    currentRecipeIngredients = [];
    console.log(`Editing food ID: ${foodId}, Initial Name: ${currentName}`);
    if (!editFoodFormContainer || !editFoodIdInput || !editFoodNameInput) {
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
            await window.electronAPI.showErrorDialog('Error', `Could not find details for food ID ${foodId}.`);
            handleCancelEditFood();
            return;
        }
    } catch (error) {
        await window.electronAPI.showErrorDialog('Error Fetching Data', `Error fetching food details: ${error}`);
        handleCancelEditFood();
        return;
    }

    editFoodIdInput.value = foodDetails.FoodID.toString();
    editFoodNameInput.value = foodDetails.Name;
    if (editFoodTypeSelect) {
        editFoodTypeSelect.value = foodDetails.FoodType || 'simple';
    }

    if (foodDetails.FoodType === 'recipe') {
        currentRecipeIngredients = await window.electronAPI.getRecipeIngredients(foodId);
    } else {
        currentRecipeIngredients = [];
    }

    renderIngredientList();

    const setInputValue = (input: HTMLInputElement | null, value: number | null | undefined) => {
        if (input) { input.value = (value != null && !isNaN(value)) ? value.toString() : ''; }
    };

    // Llenar inputs de nutrientes
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

    toggleEditFormView();
    if (foodListElement) foodListElement.style.display = 'none';
    if (foodForm) foodForm.style.display = 'none';
    editFoodNameInput.focus();
}

async function handleSaveEditFood() {
    if (!editFoodIdInput || !editFoodNameInput) {
        await window.electronAPI.showErrorDialog('Error', 'Cannot find required form elements to save.');
        return;
    }

    const foodId = parseInt(editFoodIdInput.value, 10);
    const newName = editFoodNameInput.value.trim();
    const foodType = editFoodTypeSelect?.value as ('simple' | 'recipe') || 'simple';

    if (isNaN(foodId) || foodId <= 0 || !newName) {
        await window.electronAPI.showErrorDialog('Input Error', 'Invalid ID or Name.');
        return;
    }

    const foodData: IFoodDetails = {
        FoodID: foodId,
        Name: newName,
        FoodType: foodType,
        Ingredients: foodType === 'recipe' ? currentRecipeIngredients : [],
        Energy_kcal: foodType === 'simple' ? getNutrientValue(editEnergyKcalInput) : null,
        Water_g: foodType === 'simple' ? getNutrientValue(editWaterGInput) : null,
        Protein_g: foodType === 'simple' ? getNutrientValue(editProteinGInput) : null,
        Fat_g: foodType === 'simple' ? getNutrientValue(editFatGInput) : null,
        Carbohydrate_g: foodType === 'simple' ? getNutrientValue(editCarbohydrateGInput) : null,
        Fiber_g: foodType === 'simple' ? getNutrientValue(editFiberGInput) : null,
        Sugar_g: foodType === 'simple' ? getNutrientValue(editSugarGInput) : null,
        Ash_g: foodType === 'simple' ? getNutrientValue(editAshGInput) : null,
        SaturatedFat_g: foodType === 'simple' ? getNutrientValue(editSaturatedFatGInput) : null,
        MonounsaturatedFat_g: foodType === 'simple' ? getNutrientValue(editMonounsaturatedFatGInput) : null,
        PolyunsaturatedFat_g: foodType === 'simple' ? getNutrientValue(editPolyunsaturatedFatGInput) : null,
        Cholesterol_mg: foodType === 'simple' ? getNutrientValue(editCholesterolMgInput) : null,
        Calcium_mg: foodType === 'simple' ? getNutrientValue(editCalciumMgInput) : null,
        Phosphorus_mg: foodType === 'simple' ? getNutrientValue(editPhosphorusMgInput) : null,
        Iron_mg: foodType === 'simple' ? getNutrientValue(editIronMgInput) : null,
        Sodium_mg: foodType === 'simple' ? getNutrientValue(editSodiumMgInput) : null,
        Potassium_mg: foodType === 'simple' ? getNutrientValue(editPotassiumMgInput) : null,
        Magnesium_mg: foodType === 'simple' ? getNutrientValue(editMagnesiumMgInput) : null,
        Zinc_mg: foodType === 'simple' ? getNutrientValue(editZincMgInput) : null,
        Copper_mg: foodType === 'simple' ? getNutrientValue(editCopperMgInput) : null,
        Manganese_mg: foodType === 'simple' ? getNutrientValue(editManganeseMgInput) : null,
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
        const result = await window.electronAPI.updateFoodDetails(foodData);
        handleCancelEditFood();
        loadAndDisplayFoods();
        await window.electronAPI.showInfoDialog('Success', result);
    } catch (error) {
        await window.electronAPI.showErrorDialog('Save Error', `Error updating food: ${error}`);
    }
}

function handleCancelEditFood() {
    if (editFoodFormContainer) editFoodFormContainer.style.display = 'none';
    if (foodListElement) foodListElement.style.display = 'block';
    if (foodForm) foodForm.style.display = 'block';
    // Limpiar todos los inputs
    if (editFoodIdInput) editFoodIdInput.value = '';
    if (editFoodNameInput) editFoodNameInput.value = '';
    const inputs = [editEnergyKcalInput, editWaterGInput, editProteinGInput, editFatGInput, editCarbohydrateGInput, editFiberGInput, editSugarGInput, editAshGInput, editSaturatedFatGInput, editMonounsaturatedFatGInput, editPolyunsaturatedFatGInput, editCholesterolMgInput, editCalciumMgInput, editPhosphorusMgInput, editIronMgInput, editSodiumMgInput, editPotassiumMgInput, editMagnesiumMgInput, editZincMgInput, editCopperMgInput, editManganeseMgInput, editVitaminAERInput, editThiaminMgInput, editRiboflavinMgInput, editNiacinMgInput, editPantothenicAcidMgInput, editVitaminB6MgInput, editFolateMcgInput, editVitaminB12McgInput, editVitaminCMgInput];
    inputs.forEach(input => { if (input) input.value = ''; });
}

async function handleDelete(foodId: number) {
    const confirmResult = await window.electronAPI.showConfirmDialog({
        type: 'warning', title: 'Confirm Delete',
        message: `Are you sure you want to delete food ID ${foodId}?`,
        buttons: ['Cancel', 'Delete'], defaultId: 0, cancelId: 0
    });
    if (confirmResult.response === 1) {
        try {
            const result = await window.electronAPI.deleteFood(foodId);
            await window.electronAPI.showInfoDialog('Success', result);
            loadAndDisplayFoods();
        } catch (error) {
            await window.electronAPI.showErrorDialog('Delete Error', `Error deleting food: ${error}`);
        }
    }
}

// Funciones de Recetas (Ingredientes)

async function searchAllFoodsForRecipe() {
    if (!recipeFoodSearchInput || !recipeFoodSelect) return;
    const searchTerm = recipeFoodSearchInput.value.trim();
    const selectElement = recipeFoodSelect;
    selectElement.innerHTML = '';
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
                selectElement.add(new Option(food.Name, food.FoodID.toString()));
            });
            selectElement.disabled = false;
        }
    } catch (error) {
        console.error('Error searching all foods:', error);
        selectElement.add(new Option("Error searching", ""));
    }
}

function renderIngredientList() {
    const listElement = document.getElementById('ingredientList') as HTMLUListElement | null;
    if (listElement) {
        listElement.innerHTML = '';
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
                    renderIngredientList();
                };
                li.appendChild(removeBtn);
                listElement.appendChild(li);
            });
        }
    }
}

function handleAddIngredient() {
    if (!recipeFoodSelect || !recipeGramsInput || !recipeFoodSearchInput) return;
    const foodId = parseInt(recipeFoodSelect.value, 10);
    const selectedOption = recipeFoodSelect.options[recipeFoodSelect.selectedIndex];
    const foodName = selectedOption ? selectedOption.text : 'Unknown Food';
    const grams = parseFloat(recipeGramsInput.value);

    if (!foodId || isNaN(foodId) || foodId <= 0) {
        window.electronAPI.showErrorDialog('Input Error', 'Please search for and select a valid ingredient.');
        return;
    }
    if (isNaN(grams) || grams <= 0) {
        window.electronAPI.showErrorDialog('Input Error', 'Please enter a valid positive number for grams.');
        return;
    }

    currentRecipeIngredients.push({
        foodId: foodId,
        name: foodName,
        grams: grams
    });

    renderIngredientList();
    recipeFoodSearchInput.value = '';
    recipeFoodSelect.innerHTML = '<option value="">-- Type to search --</option>';
    recipeFoodSelect.disabled = true;
    recipeGramsInput.value = '';
    recipeFoodSearchInput.focus();
}

// =============================================================================
// SECCIÓN 7: GESTIÓN DE PACIENTES (SUBJECTS)
// =============================================================================

async function loadSubjects() {
    if (!subjectSelect) return;
    try {
        const currentSelection = subjectSelect.value;
        const subjects = await window.electronAPI.getSubjects();
        subjectSelect.innerHTML = '<option value="">-- Seleccionar o Crear Paciente --</option>';

        subjects.forEach(s => {
            const label = s.Name ? `${s.Name} (${s.UserID})` : s.UserID;
            subjectSelect!.add(new Option(label, s.UserID));
        });

        if (currentSelection) {
            subjectSelect.value = currentSelection;
        } else if (userIdInputElement && userIdInputElement.value) {
            subjectSelect.value = userIdInputElement.value;
        }
        updateActiveSubjectInfo();
    } catch (error) {
        console.error("Error loading subjects:", error);
    }
}

function updateActiveSubjectInfo() {
    if (!subjectSelect || !userIdInputElement || !activeSubjectInfo) return;
    const selectedUserId = subjectSelect.value;
    userIdInputElement.value = selectedUserId;
    userIdInputElement.dispatchEvent(new Event('input'));

    if (selectedUserId) {
        activeSubjectInfo.textContent = `Paciente Activo: ${selectedUserId}`;
        activeSubjectInfo.style.color = '#2e7d32';
        activeSubjectInfo.style.fontWeight = 'bold';
    } else {
        activeSubjectInfo.textContent = "Ningún paciente seleccionado.";
        activeSubjectInfo.style.color = '#666';
        activeSubjectInfo.style.fontWeight = 'normal';
        if (logEntriesElement) logEntriesElement.innerHTML = '<p>Selecciona un paciente para ver sus registros.</p>';
        if (logPaginationContainer) logPaginationContainer.style.display = 'none';
    }
}

async function openSubjectModal(userIdToEdit: string | null = null) {
    if (!subjectModal || !subjMsg) return;
    subjMsg.textContent = "";
    subjectModal.style.display = 'flex';

    if (!subjIdInput || !subjNameInput || !subjBirthInput || !subjGenderInput ||
        !subjWeightInput || !subjHeightInput || !subjPhysioInput || !subjNotesInput || !btnSubjDelete) {
        return;
    }

    if (userIdToEdit) {
        // MODO EDICIÓN
        const subjects = await window.electronAPI.getSubjects();
        const subject = subjects.find(s => s.UserID === userIdToEdit);

        if (subject) {
            subjIdInput.value = subject.UserID;
            subjIdInput.disabled = true;
            subjNameInput.value = subject.Name || '';
            subjBirthInput.value = subject.BirthDate || '';
            subjGenderInput.value = subject.Gender || 'M';
            subjWeightInput.value = subject.Weight_kg ? subject.Weight_kg.toString() : '';
            subjHeightInput.value = subject.Height_cm ? subject.Height_cm.toString() : '';
            subjPhysioInput.value = subject.PhysioState || 'None';
            subjNotesInput.value = subject.Notes || '';
            btnSubjDelete.style.display = 'inline-block';
        }
    } else {
        // MODO CREAR
        subjIdInput.value = '';
        subjIdInput.disabled = false;
        subjNameInput.value = '';
        subjBirthInput.value = '';
        subjGenderInput.value = 'M';
        subjWeightInput.value = '';
        subjHeightInput.value = '';
        subjPhysioInput.value = 'None';
        subjNotesInput.value = '';
        btnSubjDelete.style.display = 'none';
        subjIdInput.focus();
    }
}

async function handleSaveSubject() {
    if (!subjMsg || !subjIdInput || !subjIdInput.value.trim()) {
        if (subjMsg) subjMsg.textContent = "El ID del paciente es obligatorio.";
        if (subjMsg) subjMsg.style.color = "red";
        return;
    }

    const subjectData = {
        UserID: subjIdInput.value.trim(),
        Name: subjNameInput?.value.trim() || null,
        BirthDate: subjBirthInput?.value || null,
        Gender: subjGenderInput?.value || 'M',
        PhysioState: subjPhysioInput?.value || 'None',
        Weight_kg: subjWeightInput?.value ? parseFloat(subjWeightInput.value) : null,
        Height_cm: subjHeightInput?.value ? parseFloat(subjHeightInput.value) : null,
        Notes: subjNotesInput?.value.trim() || null
    };

    subjMsg.textContent = "Guardando...";
    subjMsg.style.color = "blue";

    try {
        const result = await window.electronAPI.saveSubject(subjectData);
        subjMsg.textContent = result;
        subjMsg.style.color = "green";

        await loadSubjects();
        if (subjectSelect) subjectSelect.value = subjectData.UserID;
        updateActiveSubjectInfo();
        await renderSubjectHistory(subjectData.UserID);

        setTimeout(() => {
            if (subjectModal) subjectModal.style.display = 'none';
            if (subjMsg) subjMsg.textContent = "";
        }, 1500);

    } catch (error) {
        console.error(error);
        subjMsg.textContent = "Error: " + error;
        subjMsg.style.color = "red";
    }
}

async function handleDeleteSubject() {
    if (!subjIdInput || !subjMsg) return;
    const userId = subjIdInput.value;

    const confirm = await window.electronAPI.showConfirmDialog({
        type: 'warning',
        title: 'Eliminar Paciente',
        message: `¿Estás seguro de eliminar al paciente ${userId}?`,
        detail: 'Esto NO borrará sus registros de consumo automáticamente.',
        buttons: ['Cancelar', 'Eliminar']
    });

    if (confirm.response === 1) {
        try {
            await window.electronAPI.deleteSubject(userId);
            await loadSubjects();
            if (subjectSelect) subjectSelect.value = "";
            updateActiveSubjectInfo();
            if (subjectModal) subjectModal.style.display = 'none';
        } catch (error) {
            subjMsg.textContent = "Error al eliminar: " + error;
            subjMsg.style.color = "red";
        }
    }
}

async function handleSubjectIdLookup() {
    if (!subjIdInput || !subjNameInput) return;
    const idToSearch = subjIdInput.value.trim();
    if (!idToSearch || subjIdInput.disabled) return;

    try {
        const existingSubject = await window.electronAPI.getSubjectById(idToSearch);
        if (existingSubject) {
            subjMsg!.textContent = "Paciente encontrado. Cargando datos...";
            subjMsg!.style.color = "blue";

            subjNameInput.value = existingSubject.Name || '';
            if (subjBirthInput) subjBirthInput.value = existingSubject.BirthDate || '';
            if (subjGenderInput) subjGenderInput.value = existingSubject.Gender || 'M';
            if (subjWeightInput) subjWeightInput.value = existingSubject.Weight_kg ? existingSubject.Weight_kg.toString() : '';
            if (subjHeightInput) subjHeightInput.value = existingSubject.Height_cm ? existingSubject.Height_cm.toString() : '';
            if (subjPhysioInput) subjPhysioInput.value = existingSubject.PhysioState || 'None';
            if (subjNotesInput) subjNotesInput.value = existingSubject.Notes || '';

            if (btnSubjDelete) btnSubjDelete.style.display = 'inline-block';

            setTimeout(() => {
                if (subjMsg) {
                    subjMsg.textContent = "Modo Edición: Actualizando datos de " + (existingSubject.Name || idToSearch);
                    subjMsg.style.color = "#2e7d32";
                }
            }, 500);
        } else {
            if (btnSubjDelete) btnSubjDelete.style.display = 'none';
            subjMsg!.textContent = "ID nuevo. Creando paciente...";
            subjMsg!.style.color = "#666";
        }
    } catch (error) {
        console.error("Error buscando paciente:", error);
    }
}

// HISTORIAL DE PACIENTES
async function renderSubjectHistory(userId: string) {
    if (!historyTableBody) return;
    historyTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Cargando datos...</td></tr>';

    try {
        const history = await window.electronAPI.getSubjectHistory(userId);
        historyTableBody.innerHTML = '';

        if (!history || history.length === 0) {
            historyTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#999;">Sin historial.</td></tr>';
            return;
        }

        [...history].reverse().forEach((record: any) => {
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid #eee';

            // MODO LECTURA
            const renderReadMode = () => {
                row.innerHTML = '';
                const dateCell = document.createElement('td'); dateCell.textContent = record.Date; dateCell.style.padding = '8px'; row.appendChild(dateCell);
                const wCell = document.createElement('td'); wCell.textContent = record.Weight_kg ? `${record.Weight_kg} kg` : '-'; wCell.style.textAlign = 'right'; wCell.style.padding = '8px'; row.appendChild(wCell);
                const hCell = document.createElement('td'); hCell.textContent = record.Height_cm ? `${record.Height_cm} cm` : '-'; hCell.style.textAlign = 'right'; hCell.style.padding = '8px'; row.appendChild(hCell);
                const actionsCell = document.createElement('td'); actionsCell.style.textAlign = 'center'; actionsCell.style.padding = '8px';

                const editBtn = document.createElement('button'); editBtn.textContent = '✏️'; editBtn.style.border = 'none'; editBtn.style.background = 'transparent'; editBtn.style.cursor = 'pointer'; editBtn.onclick = () => renderEditMode();
                const delBtn = document.createElement('button'); delBtn.textContent = '🗑️'; delBtn.style.border = 'none'; delBtn.style.background = 'transparent'; delBtn.style.cursor = 'pointer'; delBtn.style.color = '#d32f2f';
                delBtn.onclick = async () => {
                    const confirm = await window.electronAPI.showConfirmDialog({ type: 'warning', title: 'Borrar Registro', message: `¿Eliminar el registro del ${record.Date}?`, buttons: ['Cancelar', 'Eliminar'], defaultId: 0, cancelId: 0 });
                    if (confirm.response === 1) {
                        await window.electronAPI.deleteMeasurement(record.MeasurementID);
                        renderSubjectHistory(userId);
                    }
                };
                actionsCell.appendChild(editBtn); actionsCell.appendChild(delBtn); row.appendChild(actionsCell);
            };

            // MODO EDICIÓN
            const renderEditMode = () => {
                row.innerHTML = '';
                const dateCell = document.createElement('td'); dateCell.textContent = record.Date; dateCell.style.padding = '8px'; row.appendChild(dateCell);

                const wCell = document.createElement('td'); wCell.style.padding = '8px'; wCell.style.textAlign = 'right';
                const wInput = document.createElement('input'); wInput.type = 'number'; wInput.value = record.Weight_kg ? record.Weight_kg.toString() : ''; wInput.style.width = '60px'; wInput.step = '0.1';
                wCell.appendChild(wInput); row.appendChild(wCell);

                const hCell = document.createElement('td'); hCell.style.padding = '8px'; hCell.style.textAlign = 'right';
                const hInput = document.createElement('input'); hInput.type = 'number'; hInput.value = record.Height_cm ? record.Height_cm.toString() : ''; hInput.style.width = '60px'; hInput.step = '0.1';
                hCell.appendChild(hInput); row.appendChild(hCell);

                const actionsCell = document.createElement('td'); actionsCell.style.textAlign = 'center'; actionsCell.style.padding = '8px';
                const saveBtn = document.createElement('button'); saveBtn.textContent = '💾'; saveBtn.style.border = 'none'; saveBtn.style.background = 'transparent'; saveBtn.style.cursor = 'pointer';
                saveBtn.onclick = async () => {
                    const newW = wInput.value ? parseFloat(wInput.value) : 0;
                    const newH = hInput.value ? parseFloat(hInput.value) : 0;
                    await window.electronAPI.updateMeasurement(record.MeasurementID, newW, newH);
                    renderSubjectHistory(userId);
                };
                const cancelBtn = document.createElement('button'); cancelBtn.textContent = '❌'; cancelBtn.style.border = 'none'; cancelBtn.style.background = 'transparent'; cancelBtn.style.cursor = 'pointer';
                cancelBtn.onclick = () => renderReadMode();
                actionsCell.appendChild(saveBtn); actionsCell.appendChild(cancelBtn); row.appendChild(actionsCell);
            };

            renderReadMode();
            historyTableBody!.appendChild(row);
        });
    } catch (error) {
        console.error("Error cargando historial:", error);
        historyTableBody.innerHTML = '<tr><td colspan="4" style="color:red; text-align:center;">Error cargando datos.</td></tr>';
    }
}

// =============================================================================
// SECCIÓN 8: GESTIÓN DE LOGS DE CONSUMO
// =============================================================================

// Búsqueda de Alimentos para el Log
async function searchFoods() {
    if (!foodSearchInputElement || !refDbSelectElement || !foodSelectElement) return;
    const searchTerm = foodSearchInputElement.value.trim();
    const selectedDbId = parseInt(refDbSelectElement.value, 10);
    foodSelectElement.innerHTML = '';
    foodSelectElement.disabled = true;

    if (!selectedDbId || selectedDbId <= 0) {
        foodSelectElement.add(new Option("Select Reference DB first", ""));
        return;
    }
    if (searchTerm.length < 1) {
        currentFoodSearchResults = [];
        foodSelectElement.add(new Option("-- Type to search --", ""));
        return;
    }

    try {
        currentFoodSearchResults = [];
        const results = await window.electronAPI.searchFoods(searchTerm, selectedDbId);
        currentFoodSearchResults = results;

        if (results.length > 0) {
            results.forEach(food => {
                const option = new Option(food.Name, food.FoodID.toString());
                option.dataset.foodType = food.FoodType;
                option.dataset.recipeYield = food.RecipeYieldGrams ? food.RecipeYieldGrams.toString() : '0';
                foodSelectElement!.add(option);
            });
            foodSelectElement.disabled = false;
        } else {
            foodSelectElement.add(new Option("No results found", ""));
        }
        handleFoodSelectionChange();
        loadAllLogs();
    } catch (error) {
        console.error('Food search failed:', error);
        foodSelectElement.add(new Option("Error during search", ""));
    }
}

function handleFoodSelectionChange() {
    if (!foodSelectElement || !gramsInputContainer || !portionsInputContainer || !portionsInputElement || !recipeYieldLabel) return;
    const selectedOption = foodSelectElement.options[foodSelectElement.selectedIndex];
    if (!selectedOption || !selectedOption.value) {
        gramsInputContainer.style.display = 'block';
        portionsInputContainer.style.display = 'none';
        return;
    }

    const foodType = selectedOption.dataset.foodType;
    const recipeYield = parseFloat(selectedOption.dataset.recipeYield || '0');

    if (foodType === 'recipe') {
        gramsInputContainer.style.display = 'none';
        portionsInputContainer.style.display = 'block';
        recipeYieldLabel.textContent = recipeYield > 0 ? `(1 porción = ${recipeYield}g)` : '(Error: Rendimiento no definido)';
        portionsInputElement.value = '1';
    } else {
        gramsInputContainer.style.display = 'block';
        portionsInputContainer.style.display = 'none';
        recipeYieldLabel.textContent = '';
    }
}

async function addLogEntry(e: Event) {
    e.preventDefault();
    if (!userIdInputElement || !consumptionDateElement || !refDbSelectElement || !foodSelectElement ||
        !gramsInputElement || !portionsInputElement || !mealTypeSelectElement) return;

    const userId = userIdInputElement.value.trim();
    const consumptionDate = consumptionDateElement.value;
    const mealType = mealTypeSelectElement.value;
    const foodId = parseInt(foodSelectElement.value, 10);
    const referenceDatabaseId = parseInt(refDbSelectElement.value, 10);

    if (!userId) { await window.electronAPI.showErrorDialog('Input Error', 'Please enter a User/Group ID.'); return; }
    if (!consumptionDate) { await window.electronAPI.showErrorDialog('Input Error', 'Please select a date.'); return; }
    if (!foodId || foodId <= 0) { await window.electronAPI.showErrorDialog('Input Error', 'Please search and select a valid food.'); return; }
    if (!referenceDatabaseId || referenceDatabaseId <= 0) { await window.electronAPI.showErrorDialog('Input Error', 'Please select a valid Reference DB.'); return; }

    let gramsToSave: number = 0;
    const selectedOption = foodSelectElement.options[foodSelectElement.selectedIndex];
    const foodType = selectedOption.dataset.foodType;
    const recipeYield = parseFloat(selectedOption.dataset.recipeYield || '0');

    if (foodType === 'recipe') {
        const portions = parseFloat(portionsInputElement.value);
        if (isNaN(portions) || portions <= 0) { await window.electronAPI.showErrorDialog('Input Error', 'Please enter a valid number of portions.'); return; }
        if (!recipeYield || recipeYield <= 0) { await window.electronAPI.showErrorDialog('Data Error', 'Recipe has no yield defined.'); return; }
        gramsToSave = portions * recipeYield;
    } else {
        gramsToSave = parseFloat(gramsInputElement.value);
    }

    if (isNaN(gramsToSave) || gramsToSave <= 0) {
        await window.electronAPI.showErrorDialog('Input Error', 'Grams must be a positive number.');
        return;
    }

    const logData: INewLogEntryData = {
        userId,
        consumptionDate,
        mealType: mealType || undefined,
        foodId,
        referenceDatabaseId,
        grams: gramsToSave
    };

    try {
        await window.electronAPI.addLogEntry(logData);
        loadAllLogs();
        if (foodSearchInputElement) foodSearchInputElement.value = '';
        foodSelectElement.innerHTML = '<option value="">-- Select Food --</option>';
        foodSelectElement.disabled = true;
        gramsInputElement.value = '';
        portionsInputElement.value = '1';
        handleFoodSelectionChange();
    } catch (error) {
        await window.electronAPI.showErrorDialog('Save Error', `Error adding log entry: ${error}`);
    }
}

// Listado y Paginación de Logs
async function loadAllLogs() {
    try {
        allLogsCache = await window.electronAPI.getAllLogs();
        renderFilteredLogList();
    } catch (error) {
        console.error("Failed to load all logs:", error);
        if (logEntriesElement) logEntriesElement.innerHTML = `<p style="color: red;">Error loading logs.</p>`;
    }
}

function handleLogFilterChange() {
    currentLogPage = 1;
    renderFilteredLogList();
}

function handlePrevLogPage() {
    if (currentLogPage > 1) {
        currentLogPage--;
        renderFilteredLogList();
    }
}

function handleNextLogPage() {
    currentLogPage++;
    renderFilteredLogList();
}

function renderFilteredLogList() {
    if (!logEntriesElement || !userIdInputElement || !consumptionDateElement ||
        !logSearchInputElement || !logPaginationContainer || !logPrevPageBtn ||
        !logNextPageBtn || !logPageIndicatorElement) return;

    const userIdFilter = userIdInputElement.value.trim().toLowerCase();
    const dateFilter = consumptionDateElement.value;
    const searchFilter = logSearchInputElement.value.trim().toLowerCase();

    let filteredLogs = allLogsCache;
    if (userIdFilter) filteredLogs = filteredLogs.filter(log => log.UserID.toLowerCase().includes(userIdFilter));
    if (dateFilter) filteredLogs = filteredLogs.filter(log => log.ConsumptionDate === dateFilter);
    if (searchFilter) {
        filteredLogs = filteredLogs.filter(log =>
            log.FoodName.toLowerCase().includes(searchFilter) ||
            (log.MealType && log.MealType.toLowerCase().includes(searchFilter)) ||
            log.ReferenceDatabaseName.toLowerCase().includes(searchFilter)
        );
    }

    const totalItems = filteredLogs.length;
    const totalPages = Math.ceil(totalItems / logsPerPage);
    if (currentLogPage > totalPages) currentLogPage = totalPages;
    if (currentLogPage < 1) currentLogPage = 1;

    const startIndex = (currentLogPage - 1) * logsPerPage;
    const endIndex = startIndex + logsPerPage;
    const logsToDisplay = filteredLogs.slice(startIndex, endIndex);

    displayLogEntries(logsToDisplay);

    if (totalItems === 0) {
        logEntriesElement.innerHTML = (userIdFilter || dateFilter || searchFilter)
            ? '<p>No se encontraron logs con esos filtros.</p>'
            : '<p>No hay logs de consumo en la base de datos.</p>';
        logPaginationContainer.style.display = 'none';
    } else {
        logPaginationContainer.style.display = 'flex';
    }

    logPageIndicatorElement.textContent = `Página ${currentLogPage} de ${totalPages || 1}`;
    logPrevPageBtn.disabled = (currentLogPage === 1);
    logNextPageBtn.disabled = (currentLogPage === totalPages);
}

function displayLogEntries(entries: ILogEntry[]) {
    if (!logEntriesElement) return;
    logEntriesElement.innerHTML = '';
    if (entries.length === 0) return;

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
        const timestamp = entry.Timestamp ? new Date(entry.Timestamp.replace(" ", "T") + "Z").toLocaleTimeString() : 'N/A';

        [timestamp, entry.MealType || '-', entry.FoodName, entry.ReferenceDatabaseName, entry.Grams.toString(), ''].forEach((text, index) => {
            const cell = row.insertCell(); cell.textContent = text;
            cell.style.border = '1px solid #ccc'; cell.style.padding = '4px 8px';
            if (index === 4) cell.style.textAlign = 'right';
        });

        const actionCell = row.cells[row.cells.length - 1]; actionCell.style.textAlign = 'center';

        const editBtn = document.createElement('button'); editBtn.textContent = 'Edit'; editBtn.style.padding = '2px 5px'; editBtn.style.marginRight = '5px';
        editBtn.onclick = () => handleEditLogEntry(entry.LogID, entry.FoodName, entry.Grams);
        actionCell.appendChild(editBtn);

        const deleteBtn = document.createElement('button'); deleteBtn.textContent = 'Delete'; deleteBtn.className = 'delete-btn'; deleteBtn.style.padding = '2px 5px';
        deleteBtn.onclick = async () => {
            const confirmResult = await window.electronAPI.showConfirmDialog({ type: 'warning', title: 'Confirm Deletion', message: `Delete entry: ${entry.FoodName} (${entry.Grams}g)?`, buttons: ['Cancel', 'Delete'], defaultId: 0, cancelId: 0 });
            if (confirmResult.response === 1) {
                try {
                    await window.electronAPI.deleteLogEntry(entry.LogID);
                    loadAllLogs();
                } catch (err) {
                    await window.electronAPI.showErrorDialog('Delete Error', String(err));
                }
            }
        };
        actionCell.appendChild(deleteBtn);
    });
    logEntriesElement.appendChild(table);
}

// Importación y Borrado de Logs
async function handleImportLog(useCsv: boolean = false) {
    const importType = useCsv ? 'CSV' : 'Excel';
    if (!importLogButton || !importLogCsvBtn || !importLogStatus) return;

    importLogStatus.textContent = `Importing log from ${importType}... Please wait.`;
    importLogButton.disabled = true;
    importLogCsvBtn.disabled = true;

    try {
        let response;
        if (useCsv) {
            response = await window.electronAPI.importConsumptionLogCsv();
        } else {
            response = await window.electronAPI.importConsumptionLog();
        }

        importLogStatus.textContent = response.message;

        if (response.message.toLowerCase().includes('success')) {
            loadUniqueUserIDs();
            if (response.firstEntry) {
                if (userIdInputElement) userIdInputElement.value = response.firstEntry.userId;
                if (consumptionDateElement) consumptionDateElement.value = response.firstEntry.date;
            }
            loadAllLogs();
        } else {
            await window.electronAPI.showErrorDialog('Log Import Warning', response.message);
        }
    } catch (error) {
        const errorMsg = String(error);
        importLogStatus.textContent = `Log import failed: ${errorMsg}`;
        await window.electronAPI.showErrorDialog('Log Import Failed', errorMsg);
    } finally {
        if (importLogButton) importLogButton.disabled = false;
        if (importLogCsvBtn) importLogCsvBtn.disabled = false;
    }
}

async function handleDeleteAllLogs() {
    const confirm1 = await window.electronAPI.showConfirmDialog({ type: 'warning', title: 'Confirm Delete ALL Logs', message: 'Are you sure you want to delete ALL consumption log entries for ALL users?', detail: 'Irreversible.', buttons: ['Cancel', 'Yes, Delete All Logs'], defaultId: 0, cancelId: 0 });
    if (confirm1.response !== 1) return;

    const confirm2 = await window.electronAPI.showConfirmDialog({ type: 'error', title: 'FINAL WARNING', message: 'Delete EVERY log entry?', buttons: ['Cancel', 'Yes'], defaultId: 0, cancelId: 0 });
    if (confirm2.response !== 1) return;

    try {
        const result = await window.electronAPI.deleteAllLogs();
        await window.electronAPI.showInfoDialog('Success', result);
        loadAllLogs();
        loadUniqueUserIDs();
    } catch (error) {
        await window.electronAPI.showErrorDialog('Error Deleting All Logs', String(error));
    }
}

async function handleDeleteLogsForUser() {
    if (!userIdInputElement) return;
    const userId = userIdInputElement.value.trim();
    if (!userId) { await window.electronAPI.showErrorDialog('Invalid UserID', 'Enter UserID.'); return; }

    const confirm1 = await window.electronAPI.showConfirmDialog({ type: 'warning', title: 'Confirm Delete User Logs', message: `Delete ALL log entries for "${userId}"?`, buttons: ['Cancel', 'Yes'], defaultId: 0, cancelId: 0 });
    if (confirm1.response !== 1) return;

    try {
        const result = await window.electronAPI.deleteLogsForUser(userId);
        await window.electronAPI.showInfoDialog('Success', result);
        loadAllLogs();
        loadUniqueUserIDs();
    } catch (error) {
        await window.electronAPI.showErrorDialog('Error Deleting Logs', String(error));
    }
}

async function loadUniqueUserIDs() {
    if (!userIdDataListElement) return;
    try {
        const userIDs = await window.electronAPI.getUniqueUserIds();
        userIdDataListElement.innerHTML = '';
        userIDs.forEach((userId: string) => {
            const option = document.createElement('option');
            option.value = userId;
            userIdDataListElement!.appendChild(option);
        });
    } catch (error) {
        console.error("Failed to load unique UserIDs:", error);
    }
}

// Edición de Log (Modal)
async function handleEditLogEntry(logId: number, foodName: string, currentGrams: number) {
    if (!editLogModal || !editLogIdInput || !editLogGramsInput || !editLogFoodName) return;
    editLogIdInput.value = logId.toString();
    editLogFoodName.textContent = foodName;
    editLogGramsInput.value = currentGrams.toString();
    editLogModal.style.display = 'block';
    editLogGramsInput.focus();
    editLogGramsInput.select();
}

function handleCancelLogEdit() {
    if (editLogModal) editLogModal.style.display = 'none';
    if (editLogIdInput) editLogIdInput.value = '';
    if (editLogFoodName) editLogFoodName.textContent = '';
    if (editLogGramsInput) editLogGramsInput.value = '';
}

async function handleSaveLogEdit() {
    if (!editLogIdInput || !editLogGramsInput) return;
    const logId = parseInt(editLogIdInput.value, 10);
    const newGrams = parseFloat(editLogGramsInput.value);

    if (isNaN(logId) || logId <= 0 || isNaN(newGrams) || newGrams <= 0) {
        await window.electronAPI.showErrorDialog('Error', 'Invalid Input.');
        return;
    }
    try {
        await window.electronAPI.editLogEntry(logId, newGrams);
        handleCancelLogEdit();
        loadAllLogs();
    } catch (error) {
        await window.electronAPI.showErrorDialog('Edit Error', String(error));
    }
}

// =============================================================================
// SECCIÓN 9: RDI PROFILES
// =============================================================================

async function loadRdiProfiles() {
    if (!rdiProfileSelect || !rdiAnalysisProfileSelect) return;
    try {
        const profiles = await window.electronAPI.getRdiProfiles();
        rdiProfileSelect.innerHTML = '';
        rdiAnalysisProfileSelect.innerHTML = '';
        if (profiles.length === 0) {
            rdiProfileSelect.add(new Option("No hay perfiles creados", ""));
            rdiAnalysisProfileSelect.add(new Option("Perfil no disponible", ""));
        } else {
            profiles.forEach(p => {
                rdiProfileSelect!.add(new Option(p.ProfileName, p.ProfileID.toString()));
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
        showRdiStatus(result, 'green');
        newRdiProfileName.value = '';
        loadRdiProfiles();
        if (createRdiProfileContainer) createRdiProfileContainer.style.display = 'none';
        if (btnToggleCreateRdi) btnToggleCreateRdi.textContent = '+ Nuevo Perfil';
    } catch (error) {
        showRdiStatus("Error: " + error, 'red');
    }
}

async function handleDeleteRdiProfile() {
    if (!rdiProfileSelect || !rdiStatusMsg) return;
    const profileId = parseInt(rdiProfileSelect.value);
    const profileName = rdiProfileSelect.options[rdiProfileSelect.selectedIndex]?.text;

    if (profileId === 1) {
        await window.electronAPI.showErrorDialog("Acción Bloqueada", "No puedes eliminar el perfil 'Adulto Estándar'.");
        return;
    }
    if (isNaN(profileId) || profileId <= 0) {
        await window.electronAPI.showErrorDialog("Error", "Selecciona un perfil válido.");
        return;
    }

    const confirmResult = await window.electronAPI.showConfirmDialog({
        type: 'warning', title: 'Confirmar Eliminación',
        message: `¿Eliminar perfil "${profileName}"?`,
        detail: "Irreversible.",
        buttons: ['Cancelar', 'Eliminar'], defaultId: 0, cancelId: 0
    });

    if (confirmResult.response === 1) {
        try {
            const result = await window.electronAPI.deleteRdiProfile(profileId);
            showRdiStatus(result, 'green');
            loadRdiProfiles();
        } catch (error) {
            showRdiStatus("Error: " + error, 'red');
        }
    }
}

async function handleImportRdiExcel() {
    if (!rdiProfileSelect || !rdiStatusMsg) return;
    const profileId = parseInt(rdiProfileSelect.value);
    if (isNaN(profileId)) {
        await window.electronAPI.showErrorDialog("Error", "Selecciona un perfil válido.");
        return;
    }
    rdiStatusMsg.textContent = "Importando...";
    try {
        const result = await window.electronAPI.importRdiExcel(profileId);
        showRdiStatus(result, 'blue');
    } catch (error) {
        showRdiStatus("Error importando: " + error, 'red');
    }
}

// =============================================================================
// SECCIÓN 10: REPORTES Y CÁLCULOS
// =============================================================================

async function handleCalculateIntake() {
    console.log("Calculate Intake button clicked.");
    if (!reportUserIdInputElement || !reportStartDateElement || !reportEndDateElement || !reportRefDbSelectElement || !reportResultsElement) return;
    lastCalculatedTotals = null;
    if (exportControls) exportControls.style.display = 'none';

    const userId = reportUserIdInputElement.value.trim();
    const startDate = reportStartDateElement.value;
    const endDate = reportEndDateElement.value;
    const referenceDbId = parseInt(reportRefDbSelectElement.value, 10);

    if (!userId) { reportResultsElement.innerHTML = `<p style="color: orange;">Please enter a User/Group ID.</p>`; return; }
    if (!startDate || !endDate) { reportResultsElement.innerHTML = `<p style="color: orange;">Please select dates.</p>`; return; }
    if (startDate > endDate) { reportResultsElement.innerHTML = `<p style="color: orange;">Invalid date range.</p>`; return; }
    if (!referenceDbId || referenceDbId <= 0) { reportResultsElement.innerHTML = `<p style="color: orange;">Select Reference Database.</p>`; return; }

    reportResultsElement.innerHTML = '<p>Calculating...</p>';
    clearAnalysisResults();

    try {
        const totals: INutrientTotals = await window.electronAPI.calculateIntake(userId, startDate, endDate, referenceDbId);
        lastCalculatedTotals = totals;
        lastReportTitle = `Nutrient Totals for ${userId} (${startDate === endDate ? startDate : `${startDate} to ${endDate}`})`;
        displayReportResults(totals, userId, startDate, endDate);
    } catch (error) {
        reportResultsElement.innerHTML = `<p style="color: red;">Error: ${error}</p>`;
        await window.electronAPI.showErrorDialog('Calculation Error', String(error));
    }
}

function displayReportResults(totals: INutrientTotals, userId: string, startDate: string, endDate: string) {
    if (!reportResultsElement) return;
    reportResultsElement.innerHTML = '';
    const title = document.createElement('h3');
    title.textContent = `Nutrient Totals for ${userId} (${startDate === endDate ? startDate : `${startDate} to ${endDate}`})`;
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
            cellValue.textContent = value.toFixed(Math.abs(value) < 1 ? 2 : (Math.abs(value) < 100 ? 1 : 0));
            cellValue.style.textAlign = 'right'; cellValue.style.padding = '4px 8px'; cellValue.style.border = '1px solid #ddd';
            const cellUnit = row.insertCell(); cellUnit.textContent = unit; cellUnit.style.padding = '4px 8px'; cellUnit.style.border = '1px solid #ddd';
        }
    });

    if (!nutrientsFound) {
        reportResultsElement.innerHTML += '<p>No nutrient data found.</p>';
        if (exportControls) exportControls.style.display = 'none';
        return;
    }
    reportResultsElement.appendChild(table);
    if (exportControls) exportControls.style.display = 'block';
}

async function handleExport(format: 'csv' | 'xlsx') {
    if (!lastCalculatedTotals) {
        await window.electronAPI.showErrorDialog('Export Error', 'Please run a calculation first.');
        return;
    }
    if (!exportCsvBtn || !exportExcelBtn) return;
    exportCsvBtn.disabled = true; exportExcelBtn.disabled = true;
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
                }
                const value = lastCalculatedTotals![key];
                dataToExport.push({ nutrient: displayName, value: value.toFixed(2), unit: unit });
            }
        });
        const result = await window.electronAPI.exportReport(lastReportTitle, dataToExport, format);
        await window.electronAPI.showInfoDialog('Export Success', result);
    } catch (error) {
        await window.electronAPI.showErrorDialog('Export Error', String(error));
    } finally {
        if (exportCsvBtn) exportCsvBtn.disabled = false;
        if (exportExcelBtn) exportExcelBtn.disabled = false;
    }
}

// =============================================================================
// SECCIÓN 11: ANÁLISIS ESTADÍSTICO Y GRÁFICOS (ECHARTS)
// =============================================================================

function populateNutrientSelect() {
    const selectElement = nutrientSelect;
    if (!selectElement) return;
    selectElement.innerHTML = '';
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
        option.value = keyAsString.replace('total', '');
        option.textContent = `${displayName} (${unit})`;
        selectElement.appendChild(option);
    });
}

async function getAnalysisCriteria() {
    if (!reportUserIdInputElement || !reportStartDateElement || !reportEndDateElement || !reportRefDbSelectElement || !nutrientSelect) {
        await window.electronAPI.showErrorDialog('Error', 'Missing UI elements for analysis.');
        return null;
    }
    const userIds = reportUserIdInputElement.value.split(',').map(id => id.trim()).filter(id => id.length > 0);
    const startDate = reportStartDateElement.value;
    const endDate = reportEndDateElement.value;
    const referenceDbId = parseInt(reportRefDbSelectElement.value, 10);
    const nutrient = nutrientSelect.value;
    const nutrientLabel = nutrientSelect.options[nutrientSelect.selectedIndex]?.text;

    if (userIds.length === 0 || !startDate || !endDate || startDate > endDate || !referenceDbId || !nutrient) {
        await window.electronAPI.showErrorDialog('Input Error', 'Please check inputs.');
        return null;
    }
    return { userIds, singleUserId: userIds[0], startDate, endDate, referenceDbId, nutrient, nutrientLabel };
}

function clearAnalysisResults() {
    if (statsResults) statsResults.innerHTML = '';
    if (multiChartContainer) multiChartContainer.innerHTML = '';
    if (chartContainer) chartContainer.style.display = 'none';
    if (myChart) myChart.clear();
}

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
        case 'macro-dist': handleRenderMacroDistribution(); break;
        case 'adequacy': handleRenderAdequacyChart(); break;
    }
}

// 11.1. Estadísticas Básicas
async function handleRenderStatsTable() {
    currentAnalysisMode = 'stats';
    const criteria = await getAnalysisCriteria();
    if (!criteria) return;
    clearAnalysisResults();
    if (reportResultsElement) reportResultsElement.innerHTML = '<p>Calculating statistics...</p>';

    try {
        const stats = await window.electronAPI.getStatisticalReport(criteria.userIds, criteria.startDate, criteria.endDate, criteria.referenceDbId, criteria.nutrient);
        if (reportResultsElement) reportResultsElement.innerHTML = '';
        if (!statsResults) return;

        statsResults.innerHTML = `
            <h3>Statistical Report for ${criteria.nutrientLabel}</h3>
            <p>Based on ${stats.count} users.</p>
            <table style="width: 300px;">
                <tbody>
                    <tr><td>Mean</td><td style="text-align: right;">${stats.mean.toFixed(2)}</td></tr>
                    <tr><td>Median</td><td style="text-align: right;">${stats.median.toFixed(2)}</td></tr>
                    <tr><td>Std. Dev</td><td style="text-align: right;">${stats.stdDev.toFixed(2)}</td></tr>
                    <tr><td>Min</td><td style="text-align: right;">${stats.min.toFixed(2)}</td></tr>
                    <tr><td>Max</td><td style="text-align: right;">${stats.max.toFixed(2)}</td></tr>
                </tbody>
            </table>
        `;
    } catch (error) {
        if (reportResultsElement) reportResultsElement.innerHTML = '';
        await window.electronAPI.showErrorDialog('Analysis Error', String(error));
    }
}

// 11.2. Histograma
function calculateHistogramData(data: number[]) {
    if (data.length === 0) return [];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binCount = Math.ceil(1 + 3.322 * Math.log10(data.length));
    const range = max - min;
    const binWidth = range === 0 ? 1 : range / binCount;
    const bins: { x0: number, x1: number, count: number }[] = [];

    for (let i = 0; i < binCount; i++) {
        bins.push({ x0: min + (i * binWidth), x1: min + ((i + 1) * binWidth), count: 0 });
    }
    data.forEach(value => {
        let index = Math.floor((value - min) / binWidth);
        if (index >= binCount) index = binCount - 1;
        if (index < 0) index = 0;
        bins[index].count++;
    });
    return bins;
}

async function handleRenderHistogram() {
    currentAnalysisMode = 'histogram';
    const criteria = await getAnalysisCriteria();
    if (!criteria) return;
    clearAnalysisResults();
    if (reportResultsElement) reportResultsElement.innerHTML = '<p>Calculating...</p>';

    try {
        const stats = await window.electronAPI.getStatisticalReport(criteria.userIds, criteria.startDate, criteria.endDate, criteria.referenceDbId, criteria.nutrient);
        if (!stats.rawData || stats.rawData.length === 0) return;

        const bins = calculateHistogramData(stats.rawData);
        const chartCategories = bins.map(b => `${Math.round(b.x0)} - ${Math.round(b.x1)}`);
        const chartData = bins.map(b => b.count);

        if (reportResultsElement) reportResultsElement.innerHTML = '';
        if (chartContainer) chartContainer.style.display = 'block';

        myChart?.setOption({
            title: { text: `Distribución de ${criteria.nutrientLabel}`, subtext: `N=${stats.rawData.length}`, left: 'center', top: 10 },
            grid: { left: '15%', right: '5%', bottom: '15%', containLabel: true },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            xAxis: { type: 'category', data: chartCategories, name: criteria.nutrientLabel, nameLocation: 'middle', nameGap: 40 },
            yAxis: { type: 'value', name: 'Frecuencia', nameLocation: 'middle', nameGap: 50 },
            series: [{ type: 'bar', barWidth: '95%', data: chartData, itemStyle: { color: '#5470C6' } }]
        });
        myChart?.resize();
    } catch (error) {
        if (reportResultsElement) reportResultsElement.innerHTML = '';
    }
}

// 11.3. Box Plot
async function handleRenderBoxPlot() {
    currentAnalysisMode = 'boxplot';
    const criteria = await getAnalysisCriteria();
    if (!criteria) return;
    clearAnalysisResults();
    if (reportResultsElement) reportResultsElement.innerHTML = '<p>Generating Box Plot...</p>';

    try {
        const categories: string[] = [];
        const dataArrays: number[][] = [];

        for (const groupName of criteria.userIds) {
            const stats = await window.electronAPI.getStatisticalReport([groupName], criteria.startDate, criteria.endDate, criteria.referenceDbId, criteria.nutrient);
            if (stats.rawData && stats.rawData.length > 0) {
                categories.push(groupName);
                dataArrays.push(stats.rawData);
            }
        }

        const boxplotData = (echarts as any).dataTool.prepareBoxplotData(dataArrays);
        if (reportResultsElement) reportResultsElement.innerHTML = '';
        if (chartContainer) chartContainer.style.display = 'block';

        myChart?.setOption({
            title: { text: `Comparación: ${criteria.nutrientLabel}`, left: 'center', top: 10 },
            tooltip: { trigger: 'item', axisPointer: { type: 'shadow' } },
            grid: { left: '10%', right: '5%', bottom: '15%', containLabel: true },
            xAxis: { type: 'category', data: categories, name: 'User', nameLocation: 'middle', nameGap: 30 },
            yAxis: { type: 'value', name: criteria.nutrientLabel, nameLocation: 'middle', nameGap: 40, splitArea: { show: true } },
            series: [{ name: 'BoxPlot', type: 'boxplot', data: boxplotData.boxData }, { name: 'Outliers', type: 'scatter', data: boxplotData.outliers }]
        });
        myChart?.resize();
    } catch (error) {
        if (reportResultsElement) reportResultsElement.innerHTML = '';
    }
}

// 11.4. Pie Charts (Food / Meal)
async function handleRenderPieChart(type: 'food' | 'meal') {
    currentAnalysisMode = type === 'food' ? 'pie-food' : 'pie-meal';
    const criteria = await getAnalysisCriteria();
    if (!criteria) return;
    clearAnalysisResults();
    if (reportResultsElement) reportResultsElement.innerHTML = '<p>Generating charts...</p>';

    if (criteria.userIds.length > 1) {
        if (!multiChartContainer) return;
        if (chartContainer) chartContainer.style.display = 'none';
        for (const userId of criteria.userIds) {
            await renderSinglePieChart(type, userId, criteria);
        }
        if (reportResultsElement) reportResultsElement.innerHTML = '';
    } else {
        await renderSinglePieChart(type, criteria.singleUserId, criteria);
        if (reportResultsElement) reportResultsElement.innerHTML = '';
    }
}

async function renderSinglePieChart(type: 'food' | 'meal', userId: string, criteria: any) {
    const chartElementId = `pie-chart-${userId}-${type}`;
    const titleText = type === 'food' ? `Top 5 Sources` : `Intake by Meal`;
    try {
        let data: IContributionReport[] = [];
        if (type === 'food') {
            data = await window.electronAPI.getNutrientContribution(userId, criteria.startDate, criteria.endDate, criteria.referenceDbId, criteria.nutrient);
        } else {
            data = await window.electronAPI.getMealContribution(userId, criteria.startDate, criteria.endDate, criteria.referenceDbId, criteria.nutrient);
        }

        if (data.length === 0) {
            if (multiChartContainer) multiChartContainer.innerHTML += `<p>No data for ${userId}.</p>`;
            return;
        }

        if (type === 'food' && data.length > 5) {
            const top5 = data.slice(0, 5);
            const othersValue = data.slice(5).reduce((sum, item) => sum + item.value, 0);
            data = top5;
            if (othersValue > 0) data.push({ name: 'Otros', value: othersValue });
        }

        let targetChart: echarts.ECharts | null;
        let chartDiv: HTMLElement | null;

        if (multiChartContainer && criteria.userIds.length > 1) {
            chartDiv = document.createElement('div');
            chartDiv.id = chartElementId;
            chartDiv.style.width = '400px';
            chartDiv.style.height = '400px';
            multiChartContainer.appendChild(chartDiv);
            targetChart = echarts.init(chartDiv);
            if (chartContainer) chartContainer.style.display = 'none';
        } else {
            chartDiv = chartContainer;
            if (chartContainer) chartContainer.style.display = 'block';
            targetChart = myChart;
        }

        if (!targetChart) return;

        targetChart.setOption({
            title: { text: titleText, subtext: `${userId}`, left: 'center', top: 10 },
            tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
            legend: { orient: 'horizontal', left: 'center', bottom: '5%', type: data.length > 6 ? 'scroll' : 'plain' },
            series: [{
                name: 'Contribution', type: 'pie', radius: '50%', center: ['50%', '45%'],
                data: data.map(item => ({ ...item, value: parseFloat(item.value.toFixed(2)) })),
                label: { show: true, position: 'outside', formatter: '{b}\n{d}%' },
                itemStyle: {
                    color: (params: any) => {
                        const name = params.name.toLowerCase();
                        if (name.includes('breakfast')) return '#009688';
                        if (name.includes('lunch')) return '#FF9800';
                        if (name.includes('dinner')) return '#F44336';
                        if (name.includes('snack')) return '#9C27B0';
                        return params.color;
                    }
                }
            }]
        });
        targetChart.resize();
    } catch (error) {
        console.error(`Error rendering chart for ${userId}:`, error);
    }
}

// 11.5. Macro Distribución
async function handleRenderMacroDistribution() {
    currentAnalysisMode = 'macro-dist';
    const criteria = await getAnalysisCriteria();
    if (!criteria) return;
    clearAnalysisResults();
    if (reportResultsElement) reportResultsElement.innerHTML = '<p>Calculando macros...</p>';

    if (criteria.userIds.length > 1) {
        if (!multiChartContainer) return;
        if (chartContainer) chartContainer.style.display = 'none';
        for (const userId of criteria.userIds) {
            await renderSingleMacroChart(userId, criteria);
        }
    } else {
        await renderSingleMacroChart(criteria.singleUserId, criteria);
    }
    if (reportResultsElement) reportResultsElement.innerHTML = '';
}

async function renderSingleMacroChart(userId: string, criteria: any) {
    const chartElementId = `macro-chart-${userId}`;
    try {
        const totals: INutrientTotals = await window.electronAPI.calculateIntake(userId, criteria.startDate, criteria.endDate, criteria.referenceDbId);
        const proteinKcal = (totals.totalProtein_g || 0) * 4;
        const fatKcal = (totals.totalFat_g || 0) * 9;
        const carbKcal = (totals.totalCarbohydrate_g || 0) * 4;
        const totalKcalMacros = proteinKcal + fatKcal + carbKcal;

        if (totalKcalMacros === 0) {
            if (multiChartContainer && criteria.userIds.length > 1) {
                multiChartContainer.innerHTML += `<div><p>Sin datos para ${userId}</p></div>`;
            }
            return;
        }

        const data = [
            { name: 'Proteína', value: proteinKcal },
            { name: 'Grasa', value: fatKcal },
            { name: 'Carbohidratos', value: carbKcal }
        ];

        let targetChart: echarts.ECharts | null;
        let chartDiv: HTMLElement | null;

        if (multiChartContainer && criteria.userIds.length > 1) {
            chartDiv = document.createElement('div');
            chartDiv.id = chartElementId;
            chartDiv.style.width = '400px'; chartDiv.style.height = '400px';
            multiChartContainer.appendChild(chartDiv);
            targetChart = echarts.init(chartDiv);
        } else {
            chartDiv = chartContainer;
            if (chartContainer) chartContainer.style.display = 'block';
            targetChart = myChart;
        }
        if (!targetChart) return;

        targetChart.setOption({
            title: { text: 'Distribución de Macros', subtext: `${userId}\nTotal: ${totalKcalMacros.toFixed(0)} kcal`, left: 'center', top: 10 },
            tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
            legend: { orient: 'horizontal', left: 'center', bottom: '5%' },
            series: [{
                name: 'Distribución', type: 'pie', radius: ['40%', '60%'], center: ['50%', '50%'],
                data: data.map(item => ({ ...item, value: parseFloat(item.value.toFixed(2)) })),
                label: { show: true, position: 'outside', formatter: '{b}\n{d}%' },
                itemStyle: {
                    color: (params: any) => {
                        if (params.name === 'Proteína') return '#4CAF50';
                        if (params.name === 'Grasa') return '#FF9800';
                        if (params.name === 'Carbohidratos') return '#2196F3';
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

// 11.6. Gráfico de Adecuación
async function handleRenderAdequacyChart() {
    currentAnalysisMode = 'adequacy';
    const criteria = await getAnalysisCriteria();
    if (!criteria || !rdiAnalysisProfileSelect) return;

    const selectedProfileId = parseInt(rdiAnalysisProfileSelect.value);
    if (isNaN(selectedProfileId) || selectedProfileId <= 0) {
        await window.electronAPI.showErrorDialog("Error", "Selecciona un Perfil RDI válido.");
        return;
    }

    clearAnalysisResults();
    if (reportResultsElement) reportResultsElement.innerHTML = '<p>Calculando adecuación...</p>';

    try {
        const adequacyData = await window.electronAPI.getAdequacyReport(criteria.userIds.join(','), criteria.startDate, criteria.endDate, criteria.referenceDbId, selectedProfileId);

        if (adequacyData.length === 0) {
            if (reportResultsElement) reportResultsElement.innerHTML = '<p>No se encontraron datos.</p>';
            return;
        }

        const categories = adequacyData.map(d => d.nutrient);
        const values = adequacyData.map(d => d.percentage);
        const profileName = rdiAnalysisProfileSelect.options[rdiAnalysisProfileSelect.selectedIndex].text;

        if (reportResultsElement) reportResultsElement.innerHTML = '';
        if (chartContainer) chartContainer.style.display = 'block';

        myChart?.setOption({
            title: { text: `Adecuación Nutricional`, subtext: `Promedio vs. ${profileName}`, left: 'center', top: 10 },
            tooltip: {
                trigger: 'axis', axisPointer: { type: 'shadow' },
                formatter: (params: any) => {
                    const idx = params[0].dataIndex;
                    const item = adequacyData[idx];
                    return `<strong>${item.nutrient}</strong><br/>Ingesta: ${item.intake.toFixed(2)}<br/>Meta: ${item.rdi.toFixed(0)}<br/><strong>${item.percentage.toFixed(1)}%</strong>`;
                }
            },
            grid: { left: '5%', right: '5%', bottom: '15%', containLabel: true },
            xAxis: { type: 'category', data: categories, axisLabel: { rotate: 45, interval: 0 } },
            yAxis: { type: 'value', name: '% Adecuación', max: 150 },
            series: [{
                name: 'Adecuación', type: 'bar', data: values,
                markLine: { data: [{ yAxis: 100, lineStyle: { color: 'red', type: 'dashed' } }] },
                itemStyle: {
                    color: (params: any) => {
                        const val = params.value;
                        if (val < 70) return '#F44336';
                        if (val > 120) return '#FF9800';
                        return '#4CAF50';
                    }
                }
            }]
        });
        myChart?.resize();
    } catch (error) {
        if (reportResultsElement) reportResultsElement.innerHTML = '';
    }
}

// 11.7. Gráfico de Línea (Over Time)
async function handleRenderLineChart() {
    currentAnalysisMode = 'line';
    const criteria = await getAnalysisCriteria();
    if (!criteria) return;
    clearAnalysisResults();
    if (reportResultsElement) reportResultsElement.innerHTML = '<p>Generating line chart...</p>';

    try {
        const dailyDataByUser = await window.electronAPI.getDailyIntakeOverTime(criteria.userIds, criteria.startDate, criteria.endDate, criteria.referenceDbId, criteria.nutrient);
        const allDates = new Set<string>();
        dailyDataByUser.forEach(userArray => userArray.forEach(item => allDates.add(item.date)));
        const sortedDates = Array.from(allDates).sort();

        if (sortedDates.length === 0) {
            if (reportResultsElement) reportResultsElement.innerHTML = '<p>No daily data found.</p>';
            return;
        }

        const chartSeries: any[] = [];
        const legendData: string[] = [];

        criteria.userIds.forEach(userId => {
            const userData = dailyDataByUser.find(arr => arr[0]?.userId === userId);
            const dataMap = new Map(userData ? userData.map(item => [item.date, item.value]) : []);
            const seriesData = sortedDates.map(date => dataMap.get(date) ?? 0);
            legendData.push(userId);
            chartSeries.push({ name: userId, type: 'line', smooth: true, data: seriesData });
        });

        if (reportResultsElement) reportResultsElement.innerHTML = '';
        if (chartContainer) chartContainer.style.display = 'block';

        myChart?.setOption({
            title: { text: `Ingesta Diaria de ${criteria.nutrientLabel}`, left: 'center', top: 10 },
            tooltip: {
                trigger: 'axis',
                formatter: (params: any[]) => {
                    let html = `<strong>${params[0].axisValue}</strong><br/>`;
                    params.forEach(p => { html += `<span style="color:${p.color}">●</span> ${p.seriesName}: ${p.value.toFixed(2)}<br/>`; });
                    return html;
                }
            },
            legend: { data: legendData, top: 50 },
            grid: { left: '3%', right: '5%', top: '25%', bottom: '10%', containLabel: true },
            xAxis: { type: 'category', data: sortedDates, name: 'Fecha' },
            yAxis: { type: 'value', name: criteria.nutrientLabel },
            series: chartSeries
        });
        myChart?.resize();
    } catch (error) {
        if (reportResultsElement) reportResultsElement.innerHTML = '';
    }
}

// =============================================================================
// SECCIÓN 12: INICIALIZACIÓN (DOMContentLoaded)
// =============================================================================

window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');

    // 1. Asignación de Elementos DOM (Library)
    dbSelectElement = document.getElementById('dbSelect') as HTMLSelectElement;
    importDbSelectElement = document.getElementById('importDbSelect') as HTMLSelectElement;
    foodForm = document.getElementById('foodForm') as HTMLFormElement;
    foodInput = document.getElementById('foodName') as HTMLInputElement;
    foodListElement = document.getElementById('foodList');
    importButton = document.getElementById('importBtn') as HTMLButtonElement;
    importCsvBtn = document.getElementById('importCsvBtn') as HTMLButtonElement;
    importStatus = document.getElementById('importStatus');
    addDbBtn = document.getElementById('addDbBtn') as HTMLButtonElement;
    newDbNameInput = document.getElementById('newDbName') as HTMLInputElement;
    saveNewDbBtn = document.getElementById('saveNewDbBtn') as HTMLButtonElement;
    deleteDbBtn = document.getElementById('deleteDbBtn') as HTMLButtonElement;
    purgeDbBtn = document.getElementById('purgeDbBtn') as HTMLButtonElement;

    // 2. Asignación Elementos (Food List & Pagination)
    foodListSearchInputElement = document.getElementById('foodListSearchInput') as HTMLInputElement;
    foodListDbFilterElement = document.getElementById('foodListDbFilter') as HTMLSelectElement;
    foodListPaginationElement = document.getElementById('foodListPagination');
    prevPageBtn = document.getElementById('prevPageBtn') as HTMLButtonElement;
    nextPageBtn = document.getElementById('nextPageBtn') as HTMLButtonElement;
    pageIndicatorElement = document.getElementById('pageIndicator');
    showAllToggleElement = document.getElementById('showAllToggle') as HTMLInputElement;
    pageControlsContainer = document.getElementById('pageControlsContainer');

    // 3. Asignación Elementos (Log)
    refDbSelectElement = document.getElementById('refDbSelect') as HTMLSelectElement;
    userIdInputElement = document.getElementById('userIdInput') as HTMLInputElement;
    consumptionDateElement = document.getElementById('consumptionDate') as HTMLInputElement;
    mealTypeSelectElement = document.getElementById('mealTypeSelect') as HTMLSelectElement;
    foodSearchInputElement = document.getElementById('foodSearchInput') as HTMLInputElement;
    foodSelectElement = document.getElementById('foodSelect') as HTMLSelectElement;
    gramsInputElement = document.getElementById('gramsInput') as HTMLInputElement;
    logFormElement = document.getElementById('logForm') as HTMLFormElement;
    logEntriesElement = document.getElementById('logEntries');
    importLogButton = document.getElementById('importLogBtn') as HTMLButtonElement;
    importLogCsvBtn = document.getElementById('importLogCsvBtn') as HTMLButtonElement;
    importLogStatus = document.getElementById('importLogStatus');
    userIdDataListElement = document.getElementById('userIdDataList') as HTMLDataListElement;
    deleteAllLogsBtn = document.getElementById('deleteAllLogsBtn') as HTMLButtonElement;
    deleteUserLogsBtn = document.getElementById('deleteUserLogsBtn') as HTMLButtonElement;
    logSearchInputElement = document.getElementById('logSearchInput') as HTMLInputElement;
    logPaginationContainer = document.getElementById('logPaginationContainer');
    logPrevPageBtn = document.getElementById('logPrevPageBtn') as HTMLButtonElement;
    logNextPageBtn = document.getElementById('logNextPageBtn') as HTMLButtonElement;
    logPageIndicatorElement = document.getElementById('logPageIndicator');
    gramsInputContainer = document.getElementById('gramsInputContainer');
    portionsInputContainer = document.getElementById('portionsInputContainer');
    portionsInputElement = document.getElementById('portionsInput') as HTMLInputElement;
    recipeYieldLabel = document.getElementById('recipeYieldLabel');

    // 4. Asignación Elementos (Edit Food)
    editFoodFormContainer = document.getElementById('editFoodFormContainer');
    editFoodIdInput = document.getElementById('editFoodId') as HTMLInputElement;
    editFoodNameInput = document.getElementById('editFoodName') as HTMLInputElement;
    editFoodTypeSelect = document.getElementById('editFoodType') as HTMLSelectElement;
    simpleFoodNutrientsDiv = document.getElementById('simpleFoodNutrients');
    recipeIngredientsDiv = document.getElementById('recipeIngredients');
    recipeFoodSearchInput = document.getElementById('recipeFoodSearchInput') as HTMLInputElement;
    recipeFoodSelect = document.getElementById('recipeFoodSelect') as HTMLSelectElement;
    recipeGramsInput = document.getElementById('recipeGramsInput') as HTMLInputElement;
    addIngredientBtn = document.getElementById('addIngredientBtn') as HTMLButtonElement;
    ingredientList = document.getElementById('ingredientList') as HTMLUListElement;
    saveEditFoodBtn = document.getElementById('saveEditFoodBtn') as HTMLButtonElement;
    cancelEditFoodBtn = document.getElementById('cancelEditFoodBtn') as HTMLButtonElement;
    // (Assigning Nutrient inputs one by one)
    editEnergyKcalInput = document.getElementById('editEnergyKcal') as HTMLInputElement;
    editWaterGInput = document.getElementById('editWaterG') as HTMLInputElement;
    editProteinGInput = document.getElementById('editProteinG') as HTMLInputElement;
    editFatGInput = document.getElementById('editFatG') as HTMLInputElement;
    editCarbohydrateGInput = document.getElementById('editCarbohydrateG') as HTMLInputElement;
    editSaturatedFatGInput = document.getElementById('editSaturatedFatG') as HTMLInputElement;
    editMonounsaturatedFatGInput = document.getElementById('editMonounsaturatedFatG') as HTMLInputElement;
    editPolyunsaturatedFatGInput = document.getElementById('editPolyunsaturatedFatG') as HTMLInputElement;
    editCholesterolMgInput = document.getElementById('editCholesterolMg') as HTMLInputElement;
    editFiberGInput = document.getElementById('editFiberG') as HTMLInputElement;
    editSugarGInput = document.getElementById('editSugarG') as HTMLInputElement;
    editAshGInput = document.getElementById('editAshG') as HTMLInputElement;
    editCalciumMgInput = document.getElementById('editCalciumMg') as HTMLInputElement;
    editPhosphorusMgInput = document.getElementById('editPhosphorusMg') as HTMLInputElement;
    editIronMgInput = document.getElementById('editIronMg') as HTMLInputElement;
    editSodiumMgInput = document.getElementById('editSodiumMg') as HTMLInputElement;
    editPotassiumMgInput = document.getElementById('editPotassiumMg') as HTMLInputElement;
    editMagnesiumMgInput = document.getElementById('editMagnesiumMg') as HTMLInputElement;
    editZincMgInput = document.getElementById('editZincMg') as HTMLInputElement;
    editCopperMgInput = document.getElementById('editCopperMg') as HTMLInputElement;
    editManganeseMgInput = document.getElementById('editManganeseMg') as HTMLInputElement;
    editVitaminAERInput = document.getElementById('editVitaminAER') as HTMLInputElement;
    editThiaminMgInput = document.getElementById('editThiaminMg') as HTMLInputElement;
    editRiboflavinMgInput = document.getElementById('editRiboflavinMg') as HTMLInputElement;
    editNiacinMgInput = document.getElementById('editNiacinMg') as HTMLInputElement;
    editPantothenicAcidMgInput = document.getElementById('editPantothenicAcidMg') as HTMLInputElement;
    editVitaminB6MgInput = document.getElementById('editVitaminB6Mg') as HTMLInputElement;
    editFolateMcgInput = document.getElementById('editFolateMcg') as HTMLInputElement;
    editVitaminB12McgInput = document.getElementById('editVitaminB12Mcg') as HTMLInputElement;
    editVitaminCMgInput = document.getElementById('editVitaminCMg') as HTMLInputElement;

    // 5. Asignación Elementos (Edit Log Modal)
    editLogModal = document.getElementById('editLogModal');
    editLogIdInput = document.getElementById('editLogId') as HTMLInputElement;
    editLogGramsInput = document.getElementById('editLogGramsInput') as HTMLInputElement;
    editLogFoodName = document.getElementById('editLogFoodName');
    saveEditLogBtn = document.getElementById('saveEditLogBtn') as HTMLButtonElement;
    cancelEditLogBtn = document.getElementById('cancelEditLogBtn') as HTMLButtonElement;

    // 6. Asignación Elementos (Reports & Charts)
    reportUserIdInputElement = document.getElementById('reportUserIdInput') as HTMLInputElement;
    reportStartDateElement = document.getElementById('reportStartDate') as HTMLInputElement;
    reportEndDateElement = document.getElementById('reportEndDate') as HTMLInputElement;
    reportRefDbSelectElement = document.getElementById('reportRefDbSelect') as HTMLSelectElement;
    rdiAnalysisProfileSelect = document.getElementById('rdiAnalysisProfileSelect') as HTMLSelectElement;
    calculateBtnElement = document.getElementById('calculateBtn') as HTMLButtonElement;
    reportResultsElement = document.getElementById('reportResults');
    exportControls = document.getElementById('exportControls');
    exportCsvBtn = document.getElementById('exportCsvBtn') as HTMLButtonElement;
    exportExcelBtn = document.getElementById('exportExcelBtn') as HTMLButtonElement;
    nutrientSelect = document.getElementById('nutrientSelect') as HTMLSelectElement;
    calcStatsBtn = document.getElementById('calcStatsBtn') as HTMLButtonElement;
    renderHistogramBtn = document.getElementById('renderHistogramBtn') as HTMLButtonElement;
    renderBoxPlotBtn = document.getElementById('renderBoxPlotBtn') as HTMLButtonElement;
    renderAdequacyBtn = document.getElementById('renderAdequacyBtn') as HTMLButtonElement;
    renderTopFoodsBtn = document.getElementById('renderTopFoodsBtn') as HTMLButtonElement;
    renderMealBtn = document.getElementById('renderMealBtn') as HTMLButtonElement;
    renderMacroDistBtn = document.getElementById('renderMacroDistBtn') as HTMLButtonElement;
    renderOverTimeBtn = document.getElementById('renderOverTimeBtn') as HTMLButtonElement;
    chartContainer = document.getElementById('chartContainer');
    multiChartContainer = document.getElementById('multiChartContainer');
    statsResults = document.getElementById('statsResults');

    // 7. Asignación Elementos (RDI & Subjects)
    rdiProfileSelect = document.getElementById('rdiProfileSelect') as HTMLSelectElement;
    btnImportRdiValues = document.getElementById('btnImportRdiValues') as HTMLButtonElement;
    newRdiProfileName = document.getElementById('newRdiProfileName') as HTMLInputElement;
    btnCreateRdiProfile = document.getElementById('btnCreateRdiProfile') as HTMLButtonElement;
    btnDeleteRdiProfile = document.getElementById('btnDeleteRdiProfile') as HTMLButtonElement;
    btnToggleCreateRdi = document.getElementById('btnToggleCreateRdi') as HTMLButtonElement;
    createRdiProfileContainer = document.getElementById('createRdiProfileContainer');
    rdiStatusMsg = document.getElementById('rdiStatusMsg');
    subjectSelect = document.getElementById('subjectSelect') as HTMLSelectElement;
    btnManageSubjects = document.getElementById('btnManageSubjects') as HTMLButtonElement;
    activeSubjectInfo = document.getElementById('activeSubjectInfo');
    subjectModal = document.getElementById('subjectModal');
    historyTableBody = document.getElementById('historyTableBody');
    btnSubjSave = document.getElementById('btnSubjSave') as HTMLButtonElement;
    btnSubjCancel = document.getElementById('btnSubjCancel') as HTMLButtonElement;
    btnSubjDelete = document.getElementById('btnSubjDelete') as HTMLButtonElement;
    subjMsg = document.getElementById('subjMsg');
    subjIdInput = document.getElementById('subjId') as HTMLInputElement;
    subjNameInput = document.getElementById('subjName') as HTMLInputElement;
    subjBirthInput = document.getElementById('subjBirth') as HTMLInputElement;
    subjGenderInput = document.getElementById('subjGender') as HTMLSelectElement;
    subjWeightInput = document.getElementById('subjWeight') as HTMLInputElement;
    subjHeightInput = document.getElementById('subjHeight') as HTMLInputElement;
    subjPhysioInput = document.getElementById('subjPhysio') as HTMLSelectElement;
    subjNotesInput = document.getElementById('subjNotes') as HTMLTextAreaElement;

    // 8. CARGAS INICIALES
    loadDatabasesIntoSelectors();
    loadAndDisplayFoods();
    loadUniqueUserIDs();
    loadAllLogs();
    populateNutrientSelect();
    loadRdiProfiles();
    loadSubjects();

    if (chartContainer) {
        myChart = echarts.init(chartContainer);
    }

    // Set Fechas por defecto
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    if (consumptionDateElement) consumptionDateElement.value = dateString;
    if (reportStartDateElement) reportStartDateElement.value = dateString;
    if (reportEndDateElement) reportEndDateElement.value = dateString;


    // 9. ASIGNACIÓN DE EVENT LISTENERS

    // A. Librería de Alimentos
    if (foodForm) {
        foodForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!foodInput || !dbSelectElement) return;
            const name = foodInput.value.trim();
            const selectedDbId = parseInt(dbSelectElement.value, 10);
            if (name && selectedDbId > 0) {
                try {
                    await window.electronAPI.addFood(name, selectedDbId);
                    foodInput.value = '';
                    loadAndDisplayFoods();
                } catch (error) {
                    await window.electronAPI.showErrorDialog('Save Error', String(error));
                }
            } else {
                await window.electronAPI.showErrorDialog('Input Error', 'Check name and DB.');
            }
        });
    }

    if (importButton) {
        importButton.addEventListener('click', async () => {
            if (!importDbSelectElement || !importStatus) return;
            const selectedDbId = parseInt(importDbSelectElement.value, 10);
            if (!selectedDbId || selectedDbId <= 0) {
                await window.electronAPI.showErrorDialog('Input Error', 'Select DB.'); return;
            }
            importStatus.textContent = 'Importing...';
            importButton!.disabled = true;
            if (importCsvBtn) importCsvBtn.disabled = true;
            importDbSelectElement.disabled = true;
            try {
                const result = await window.electronAPI.importExcel(selectedDbId);
                importStatus.textContent = result;
                loadAndDisplayFoods();
            } catch (error) {
                importStatus.textContent = `Error: ${error}`;
                await window.electronAPI.showErrorDialog('Import Failed', String(error));
            } finally {
                if (importButton) importButton.disabled = false;
                if (importCsvBtn) importCsvBtn.disabled = false;
                if (importDbSelectElement) importDbSelectElement.disabled = false;
            }
        });
    }

    if (importCsvBtn) importCsvBtn.addEventListener('click', handleImportCSV);
    if (addDbBtn) addDbBtn.onclick = handleAddNewDatabase;
    if (saveNewDbBtn) saveNewDbBtn.onclick = handleSaveNewDatabase;
    if (deleteDbBtn) deleteDbBtn.addEventListener('click', handleDeleteDatabase);
    if (purgeDbBtn) purgeDbBtn.addEventListener('click', handlePurgeFoodLibrary);

    // B. Lista y Filtros
    if (foodListSearchInputElement) foodListSearchInputElement.addEventListener('input', handleFilterChange);
    if (foodListDbFilterElement) foodListDbFilterElement.addEventListener('change', handleFilterChange);
    if (prevPageBtn) prevPageBtn.addEventListener('click', handlePrevPage);
    if (nextPageBtn) nextPageBtn.addEventListener('click', handleNextPage);
    if (showAllToggleElement) showAllToggleElement.addEventListener('click', handleToggleShowAll);

    // C. Edición de Alimento y Recetas
    if (saveEditFoodBtn) saveEditFoodBtn.addEventListener('click', handleSaveEditFood);
    if (cancelEditFoodBtn) cancelEditFoodBtn.addEventListener('click', handleCancelEditFood);
    if (editFoodTypeSelect) editFoodTypeSelect.addEventListener('change', toggleEditFormView);
    if (recipeFoodSearchInput) recipeFoodSearchInput.addEventListener('keyup', searchAllFoodsForRecipe);
    if (addIngredientBtn) addIngredientBtn.addEventListener('click', handleAddIngredient);

    // D. Logs de Consumo
    if (userIdInputElement) userIdInputElement.addEventListener('input', handleLogFilterChange);
    if (foodSelectElement) foodSelectElement.addEventListener('change', handleFoodSelectionChange);
    if (consumptionDateElement) consumptionDateElement.addEventListener('change', handleLogFilterChange);
    if (refDbSelectElement) refDbSelectElement.addEventListener('change', searchFoods);
    if (foodSearchInputElement) foodSearchInputElement.addEventListener('input', () => { if (searchTimeout) clearTimeout(searchTimeout); searchTimeout = setTimeout(searchFoods, 300); });
    if (logFormElement) logFormElement.addEventListener('submit', addLogEntry);

    if (logSearchInputElement) logSearchInputElement.addEventListener('input', handleLogFilterChange);
    if (logPrevPageBtn) logPrevPageBtn.addEventListener('click', handlePrevLogPage);
    if (logNextPageBtn) logNextPageBtn.addEventListener('click', handleNextLogPage);

    if (importLogButton) importLogButton.addEventListener('click', () => handleImportLog(false));
    if (importLogCsvBtn) importLogCsvBtn.addEventListener('click', () => handleImportLog(true));
    if (deleteAllLogsBtn) deleteAllLogsBtn.addEventListener('click', handleDeleteAllLogs);
    if (deleteUserLogsBtn) deleteUserLogsBtn.addEventListener('click', handleDeleteLogsForUser);

    if (saveEditLogBtn) saveEditLogBtn.addEventListener('click', handleSaveLogEdit);
    if (cancelEditLogBtn) cancelEditLogBtn.addEventListener('click', handleCancelLogEdit);

    // E. Reportes y Gráficos
    if (calculateBtnElement) calculateBtnElement.addEventListener('click', handleCalculateIntake);
    if (exportCsvBtn) exportCsvBtn.addEventListener('click', () => handleExport('csv'));
    if (exportExcelBtn) exportExcelBtn.addEventListener('click', () => handleExport('xlsx'));

    if (calcStatsBtn) calcStatsBtn.addEventListener('click', handleRenderStatsTable);
    if (renderHistogramBtn) renderHistogramBtn.addEventListener('click', handleRenderHistogram);
    if (renderBoxPlotBtn) renderBoxPlotBtn.addEventListener('click', handleRenderBoxPlot);
    if (renderAdequacyBtn) renderAdequacyBtn.addEventListener('click', handleRenderAdequacyChart);
    if (renderTopFoodsBtn) renderTopFoodsBtn.addEventListener('click', () => handleRenderPieChart('food'));
    if (renderMealBtn) renderMealBtn.addEventListener('click', () => handleRenderPieChart('meal'));
    if (renderMacroDistBtn) renderMacroDistBtn.addEventListener('click', handleRenderMacroDistribution);
    if (renderOverTimeBtn) renderOverTimeBtn.addEventListener('click', handleRenderLineChart);
    if (nutrientSelect) nutrientSelect.addEventListener('change', handleAutoUpdateAnalysis);

    // F. Pacientes y RDI
    if (subjectSelect) subjectSelect.addEventListener('change', updateActiveSubjectInfo);
    if (btnManageSubjects) btnManageSubjects.addEventListener('click', () => openSubjectModal(subjectSelect?.value || null));
    if (btnSubjCancel) btnSubjCancel.addEventListener('click', () => { if (subjectModal) subjectModal.style.display = 'none'; });
    if (btnSubjSave) btnSubjSave.addEventListener('click', handleSaveSubject);
    if (btnSubjDelete) btnSubjDelete.addEventListener('click', handleDeleteSubject);
    if (subjIdInput) subjIdInput.addEventListener('blur', handleSubjectIdLookup);

    if (btnCreateRdiProfile) btnCreateRdiProfile.addEventListener('click', handleCreateRdiProfile);
    if (btnImportRdiValues) btnImportRdiValues.addEventListener('click', handleImportRdiExcel);
    if (btnDeleteRdiProfile) btnDeleteRdiProfile.addEventListener('click', handleDeleteRdiProfile);
    if (btnToggleCreateRdi) btnToggleCreateRdi.addEventListener('click', () => {
        if (createRdiProfileContainer) {
            const isHidden = createRdiProfileContainer.style.display === 'none';
            createRdiProfileContainer.style.display = isHidden ? 'flex' : 'none';
            btnToggleCreateRdi!.textContent = isHidden ? '- Cancelar' : '+ Nuevo Perfil';
            if (!isHidden && newRdiProfileName) newRdiProfileName.value = '';
        }
    });

}); // Fin de DOMContentLoaded