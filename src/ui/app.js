/**
 * ChromaMatch Lite - Advanced Color Grading Application
 * Full Stack with Smart Reference Search and Presets System
 */

// Global state
let sourceImage = null;
let targetImage = null;
let colorTransfer = new ColorTransfer();
let imageAdjustments = new ImageAdjustments();
let lutExport = new LUTExport();
let exportManager = new ExportManager();
let colorAnalysis = new ColorAnalysis();
let smartMatcher = new SmartMatcher();
let presetManager = new PresetManager();

let originalResultData = null;
let currentAdjustedResultData = null;
let cachedSourceImageData = null;
let cachedTargetImageData = null;
let analysisUpdateTimer = null;
let strengthDebounceTimer = null;
let adjustmentFrame = null;
let analysisFrame = null;
let interactiveAdjustTimer = null;
let isInteractiveAdjusting = false;
let adjustmentPreviewBaseImageData = null;
let shouldAutoScrollToResults = true;
let currentReferenceDataUrl = null;
const REFERENCE_MEMORY_KEY = 'chromamatch_reference_memory';
const SESSION_LIBRARY_KEY = 'chromamatch_sessions_v1';
const displayScratchCanvas = document.createElement('canvas');
const analysisScratchCanvas = document.createElement('canvas');
let sessionLibrary = { activeSessionId: null, sessions: [] };

// Search state
let searchService = new SearchService();

// DOM elements
const sourceInput = document.getElementById('sourceInput');
const targetInput = document.getElementById('targetInput');
const sessionHub = document.getElementById('sessionHub');
const uploadSection = document.getElementById('uploadSection');
const sourcePreview = document.getElementById('sourcePreview');
const targetPreview = document.getElementById('targetPreview');
const sourceImg = document.getElementById('sourceImg');
const targetImg = document.getElementById('targetImg');
const referenceTray = document.getElementById('referenceTray');
const referenceThumbList = document.getElementById('referenceThumbList');
const addReferenceBtn = document.getElementById('addReferenceBtn');
const sourceThumbList = document.getElementById('sourceThumbList');
const referenceRailList = document.getElementById('referenceRailList');
const lookThumbList = document.getElementById('lookThumbList');
const lookCompareGrid = document.getElementById('lookCompareGrid');
const compareBoardSummary = document.getElementById('compareBoardSummary');
const processBtn = document.getElementById('processBtn');
const statusMessage = document.getElementById('statusMessage');
const resultsSection = document.getElementById('resultsSection');
const themeToggle = document.getElementById('themeToggle');
const originalCanvas = document.getElementById('originalCanvas');
const referenceCanvas = document.getElementById('referenceCanvas');
const resultCanvas = document.getElementById('resultCanvas');

const adjustmentsSection = document.getElementById('adjustmentsSection');
const temperatureSlider = document.getElementById('temperatureSlider');
const tintSlider = document.getElementById('tintSlider');
const exposureSlider = document.getElementById('exposureSlider');
const contrastSlider = document.getElementById('contrastSlider');
const highlightsSlider = document.getElementById('highlightsSlider');
const shadowsSlider = document.getElementById('shadowsSlider');
const whitesSlider = document.getElementById('whitesSlider');
const blacksSlider = document.getElementById('blacksSlider');
const saturationSlider = document.getElementById('saturationSlider');

const temperatureValue = document.getElementById('temperatureValue');
const tintValue = document.getElementById('tintValue');
const exposureValue = document.getElementById('exposureValue');
const contrastValue = document.getElementById('contrastValue');
const highlightsValue = document.getElementById('highlightsValue');
const shadowsValue = document.getElementById('shadowsValue');
const whitesValue = document.getElementById('whitesValue');
const blacksValue = document.getElementById('blacksValue');
const saturationValue = document.getElementById('saturationValue');
const strengthSlider = document.getElementById('strengthSlider');
const strengthValue = document.getElementById('strengthValue');
const algorithmMethod = document.getElementById('algorithmMethod');
const performanceMode = document.getElementById('performanceMode');
const methodHint = document.getElementById('methodHint');
const curvesCanvas = document.getElementById('curvesCanvas');
const resetCurveBtn = document.getElementById('resetCurveBtn');
const shadowWheelCanvas = document.getElementById('shadowWheelCanvas');
const shadowWheelColor = document.getElementById('shadowWheelColor');
const shadowWheelAmount = document.getElementById('shadowWheelAmount');
const shadowWheelAmountValue = document.getElementById('shadowWheelAmountValue');
const midtoneWheelCanvas = document.getElementById('midtoneWheelCanvas');
const midtoneWheelColor = document.getElementById('midtoneWheelColor');
const midtoneWheelAmount = document.getElementById('midtoneWheelAmount');
const midtoneWheelAmountValue = document.getElementById('midtoneWheelAmountValue');
const highlightWheelCanvas = document.getElementById('highlightWheelCanvas');
const highlightWheelColor = document.getElementById('highlightWheelColor');
const highlightWheelAmount = document.getElementById('highlightWheelAmount');
const highlightWheelAmountValue = document.getElementById('highlightWheelAmountValue');
const dashboardWorkspace = document.getElementById('dashboardWorkspace');

// Advanced mode toggles
const advancedOptionsPanel = document.getElementById('advancedOptionsPanel');
const presetPanelBtn = document.getElementById('presetPanelBtn');
const sessionGrid = document.getElementById('sessionGrid');
const currentSessionNameEl = document.getElementById('currentSessionName');
const currentSessionStatsEl = document.getElementById('currentSessionStats');
const newSessionBtn = document.getElementById('newSessionBtn');
const duplicateSessionBtn = document.getElementById('duplicateSessionBtn');
const deleteSessionBtn = document.getElementById('deleteSessionBtn');
const renameSessionBtn = document.getElementById('renameSessionBtn');
const openSessionBtn = document.getElementById('openSessionBtn');
const workspaceShell = document.getElementById('workspaceShell');
const workspaceSessionName = document.getElementById('workspaceSessionName');
const workspaceSessionSubtitle = document.getElementById('workspaceSessionSubtitle');
const backToSessionsBtn = document.getElementById('backToSessionsBtn');
const addSourceToSessionBtn = document.getElementById('addSourceToSessionBtn');
const addReferenceToSessionTopBtn = document.getElementById('addReferenceToSessionTopBtn');
const addSourceRailBtn = document.getElementById('addSourceRailBtn');
const addReferenceRailBtn = document.getElementById('addReferenceRailBtn');
const quickStartSourceBtn = document.getElementById('quickStartSourceBtn');
const quickStartReferenceBtn = document.getElementById('quickStartReferenceBtn');
const newLookBtn = document.getElementById('newLookBtn');
const clearCompareBoardBtn = document.getElementById('clearCompareBoardBtn');
const DASHBOARD_MARGIN = 16;
const DASHBOARD_GRID = 12;
const DASHBOARD_SNAP_DISTANCE = 22;
const snapPreview = document.getElementById('workspaceSnapPreview');
const wheelDefaults = {
    shadow: '#3a6cff',
    midtone: '#ffffff',
    highlight: '#ffb347'
};
let snapTargetLayer = null;
let verticalDivider = null;
let horizontalDivider = null;
let currentWorkspacePreset = 'edit';
let workspaceMode = 'home';
const workspaceSplitState = {
    rightRatio: 0.32,
    bottomRatio: 0.30
};

function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    if (themeToggle) {
        themeToggle.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('chromamatch-theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    applyTheme(initialTheme);
}

function toggleTheme() {
    const current = document.body.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('chromamatch-theme', next);
    applyTheme(next);
}

function createSessionTemplate(name = '') {
    return {
        id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: name || `Session ${new Date().toLocaleDateString()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sources: [],
        references: [],
        activeSourceIds: [],
        activeReferenceIds: [],
        activeLookIds: [],
        focusedLookId: null,
        looks: [],
        styleState: null,
        layout: {
            preset: 'edit',
            floating: {},
            dividerRatios: { right: 0.32, bottom: 0.30 },
            panelRects: {},
            panelSlots: {}
        }
    };
}

function loadSessionLibrary() {
    try {
        const raw = localStorage.getItem(SESSION_LIBRARY_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed.sessions)) {
                sessionLibrary = parsed;
            }
        }
    } catch {}

    if (!Array.isArray(sessionLibrary.sessions) || sessionLibrary.sessions.length === 0) {
        const starter = createSessionTemplate('First Session');
        sessionLibrary = {
            activeSessionId: starter.id,
            sessions: [starter]
        };
        saveSessionLibrary();
    } else if (!sessionLibrary.activeSessionId || !sessionLibrary.sessions.some((session) => session.id === sessionLibrary.activeSessionId)) {
        sessionLibrary.activeSessionId = sessionLibrary.sessions[0].id;
    }
    sessionLibrary.sessions = sessionLibrary.sessions.map(normalizeSessionRecord);
}

function normalizeSessionRecord(session) {
    const normalized = { ...createSessionTemplate(session.name), ...session };
    if (session.source && (!Array.isArray(session.sources) || !session.sources.length)) {
        normalized.sources = [{
            id: session.source.id || `source_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            dataUrl: session.source.dataUrl,
            name: session.source.name || 'Source'
        }];
    }
    normalized.sources = Array.isArray(normalized.sources) ? normalized.sources : [];
    normalized.references = Array.isArray(normalized.references) ? normalized.references : [];
    normalized.looks = Array.isArray(normalized.looks) ? normalized.looks : [];
    normalized.activeSourceIds = Array.isArray(normalized.activeSourceIds) ? normalized.activeSourceIds : [];
    normalized.activeReferenceIds = Array.isArray(normalized.activeReferenceIds) ? normalized.activeReferenceIds : [];
    normalized.activeLookIds = Array.isArray(normalized.activeLookIds) ? normalized.activeLookIds : [];
    if (!normalized.activeSourceIds.length && normalized.sources[0]) normalized.activeSourceIds = [normalized.sources[0].id];
    if (!normalized.activeReferenceIds.length && normalized.references[0]) normalized.activeReferenceIds = [normalized.references[0].id];
    normalized.activeLookIds = normalized.activeLookIds.filter((id) => normalized.looks.some((look) => look.id === id)).slice(0, 4);
    normalized.focusedLookId = normalized.focusedLookId || normalized.activeLookIds[0] || normalized.looks[0]?.id || null;
    normalized.layout = {
        preset: normalized.layout?.preset || 'edit',
        floating: normalized.layout?.floating || {},
        dividerRatios: {
            right: normalized.layout?.dividerRatios?.right ?? 0.32,
            bottom: normalized.layout?.dividerRatios?.bottom ?? 0.30
        },
        panelRects: normalized.layout?.panelRects || {},
        panelSlots: normalized.layout?.panelSlots || {}
    };
    return normalized;
}

function saveSessionLibrary() {
    try {
        localStorage.setItem(SESSION_LIBRARY_KEY, JSON.stringify(sessionLibrary));
    } catch {}
}

function getActiveSession() {
    return sessionLibrary.sessions.find((session) => session.id === sessionLibrary.activeSessionId) || null;
}

function touchActiveSession() {
    const session = getActiveSession();
    if (!session) return null;
    session.updatedAt = new Date().toISOString();
    saveSessionLibrary();
    return session;
}

function getActiveReferenceRecord() {
    const session = getActiveSession();
    if (!session) return null;
    return session.references.find((reference) => reference.id === session.activeReferenceIds[0]) || session.references[0] || null;
}

function getActiveSourceRecord() {
    const session = getActiveSession();
    if (!session) return null;
    return session.sources.find((source) => source.id === session.activeSourceIds[0]) || session.sources[0] || null;
}

function getSessionPresets(sessionId = sessionLibrary.activeSessionId) {
    const session = sessionLibrary.sessions.find((item) => item.id === sessionId);
    return Array.isArray(session?.looks) ? session.looks : [];
}

function getSessionLayoutState() {
    const session = getActiveSession();
    if (!session) return null;
    session.layout = session.layout || {};
    session.layout.preset = session.layout.preset || 'edit';
    session.layout.floating = session.layout.floating || {};
    session.layout.dividerRatios = session.layout.dividerRatios || { right: 0.32, bottom: 0.30 };
    session.layout.panelRects = session.layout.panelRects || {};
    session.layout.panelSlots = session.layout.panelSlots || {};
    return session.layout;
}

function syncWorkspaceLayoutState() {
    const layout = getSessionLayoutState();
    if (!layout) return;
    currentWorkspacePreset = layout.preset || 'edit';
    workspaceSplitState.rightRatio = layout.dividerRatios?.right ?? 0.32;
    workspaceSplitState.bottomRatio = layout.dividerRatios?.bottom ?? 0.30;
}

function getFocusedLook() {
    const session = getActiveSession();
    if (!session?.focusedLookId) return null;
    return session.looks.find((look) => look.id === session.focusedLookId) || null;
}

function saveSessionLook(look) {
    const session = touchActiveSession();
    if (!session) return null;
    const looks = Array.isArray(session.looks) ? session.looks : [];
    const id = look.id || `look_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const nextLook = {
        ...look,
        id,
        sessionId: session.id,
        updatedAt: new Date().toISOString(),
        createdAt: look.createdAt || new Date().toISOString()
    };
    const existingIndex = looks.findIndex((item) => item.id === id);
    if (existingIndex >= 0) looks[existingIndex] = nextLook;
    else looks.unshift(nextLook);
    session.looks = looks.slice(0, 24);
    session.focusedLookId = id;
    session.activeLookIds = [id, ...(session.activeLookIds || []).filter((activeId) => activeId !== id)].slice(0, 4);
    saveSessionLibrary();
    return nextLook;
}

function deleteSessionLook(lookId) {
    const session = touchActiveSession();
    if (!session || !Array.isArray(session.looks)) return false;
    session.looks = session.looks.filter((look) => look.id !== lookId);
    session.activeLookIds = (session.activeLookIds || []).filter((id) => id !== lookId);
    if (session.focusedLookId === lookId) {
        session.focusedLookId = session.looks[0]?.id || null;
    }
    saveSessionLibrary();
    return true;
}

function switchSession(sessionId) {
    if (!sessionLibrary.sessions.some((session) => session.id === sessionId)) return;
    sessionLibrary.activeSessionId = sessionId;
    saveSessionLibrary();
    syncWorkspaceLayoutState();
    hydrateActiveSession();
    renderSessionHub();
    if (workspaceMode === 'session') initializeDashboardWindows();
}

function duplicateActiveSession() {
    const active = getActiveSession();
    if (!active) return;
    const copy = JSON.parse(JSON.stringify(active));
    copy.id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    copy.name = `${active.name} Copy`;
    copy.createdAt = new Date().toISOString();
    copy.updatedAt = new Date().toISOString();
    copy.looks = (copy.looks || []).map((look, index) => ({
        ...look,
        id: `look_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
        sessionId: copy.id
    }));
    sessionLibrary.sessions.unshift(copy);
    sessionLibrary.activeSessionId = copy.id;
    saveSessionLibrary();
    syncWorkspaceLayoutState();
    hydrateActiveSession();
    renderSessionHub();
}

function createNewSession() {
    const session = createSessionTemplate();
    sessionLibrary.sessions.unshift(session);
    sessionLibrary.activeSessionId = session.id;
    saveSessionLibrary();
    syncWorkspaceLayoutState();
    hydrateActiveSession();
    renderSessionHub();
}

function deleteActiveSession() {
    if (sessionLibrary.sessions.length <= 1) {
        showError('Keep at least one session.');
        return;
    }
    const activeId = sessionLibrary.activeSessionId;
    sessionLibrary.sessions = sessionLibrary.sessions.filter((session) => session.id !== activeId);
    sessionLibrary.activeSessionId = sessionLibrary.sessions[0]?.id || null;
    saveSessionLibrary();
    syncWorkspaceLayoutState();
    hydrateActiveSession();
    renderSessionHub();
}

function renameActiveSession() {
    const session = getActiveSession();
    if (!session) return;
    const nextName = window.prompt('Rename session', session.name);
    if (!nextName || !nextName.trim()) return;
    session.name = nextName.trim();
    touchActiveSession();
    renderSessionHub();
}

function renderSessionHub() {
    const active = getActiveSession();
    if (!active) return;
    if (currentSessionNameEl) currentSessionNameEl.textContent = active.name;
    if (currentSessionStatsEl) {
        const sourceLabel = `${active.sources.length} source${active.sources.length === 1 ? '' : 's'}`;
        const referenceLabel = `${active.references.length} reference${active.references.length === 1 ? '' : 's'}`;
        const lookLabel = `${(active.looks || []).length} looks`;
        currentSessionStatsEl.textContent = `${sourceLabel}, ${referenceLabel}, ${lookLabel}`;
    }
    if (workspaceSessionName) workspaceSessionName.textContent = active.name;
    if (workspaceSessionSubtitle) workspaceSessionSubtitle.textContent = `${active.sources.length} sources · ${active.references.length} references · ${(active.looks || []).length} looks`;
    if (sessionGrid) {
        sessionGrid.innerHTML = sessionLibrary.sessions.map((session) => `
            <article class="session-card ${session.id === sessionLibrary.activeSessionId ? 'active' : ''}" data-session-id="${session.id}">
                <div class="session-card-header">
                    <div class="session-card-title">${session.name}</div>
                    <span class="session-chip">${session.id === sessionLibrary.activeSessionId ? 'Current' : 'Library'}</span>
                </div>
                <div class="session-card-meta">${session.sources.length ? `${session.sources.length} sources` : 'No source yet'} · ${session.references.length} refs</div>
                <div class="session-card-looks">${(session.looks || []).length} saved looks</div>
                <div class="session-card-tags">
                    ${(session.references || []).slice(0, 3).map((reference) => `<span class="session-chip">${reference.name || 'Reference'}</span>`).join('')}
                </div>
                <button type="button" class="mini-btn session-open-btn" data-open-session="${session.id}">Open</button>
            </article>
        `).join('');
        sessionGrid.querySelectorAll('.session-card').forEach((card) => {
            card.addEventListener('click', (event) => {
                if (event.target.closest('[data-open-session]')) return;
                switchSession(card.dataset.sessionId);
            });
        });
        sessionGrid.querySelectorAll('[data-open-session]').forEach((button) => {
            button.addEventListener('click', () => {
                switchSession(button.dataset.openSession);
                enterWorkspace();
            });
        });
    }
}

function renderReferenceTray() {
    const session = getActiveSession();
    if (!referenceTray || !referenceThumbList || !session) return;
    const references = session.references || [];
    referenceTray.style.display = references.length ? 'block' : 'none';
    referenceThumbList.innerHTML = references.map((reference, index) => `
        <button type="button" class="reference-thumb ${reference.id === session.activeReferenceIds[0] ? 'active' : ''}" data-reference-id="${reference.id}">
            <img src="${reference.dataUrl}" alt="${reference.name || `Reference ${index + 1}`}" />
            <span>${reference.name || `Ref ${index + 1}`}</span>
        </button>
    `).join('');
    referenceThumbList.querySelectorAll('.reference-thumb').forEach((button) => {
        button.addEventListener('click', () => activateReference(button.dataset.referenceId));
    });
}

function renderSourceTray() {
    const session = getActiveSession();
    if (!sourceThumbList || !session) return;
    sourceThumbList.innerHTML = (session.sources || []).map((source, index) => `
        <button type="button" class="reference-thumb ${source.id === session.activeSourceIds[0] ? 'active' : ''}" data-source-id="${source.id}">
            <img src="${source.dataUrl}" alt="${source.name || `Source ${index + 1}`}" />
            <span>${source.name || `Source ${index + 1}`}</span>
        </button>
    `).join('');
    sourceThumbList.querySelectorAll('[data-source-id]').forEach((button) => {
        button.addEventListener('click', () => activateSource(button.dataset.sourceId));
    });
}

function renderReferenceRail() {
    if (!referenceRailList) return;
    referenceRailList.innerHTML = referenceThumbList?.innerHTML || '';
    referenceRailList.querySelectorAll('.reference-thumb').forEach((button) => {
        button.addEventListener('click', () => activateReference(button.dataset.referenceId));
    });
}

function renderLookStrip() {
    const session = getActiveSession();
    if (!lookThumbList || !session) return;
    lookThumbList.innerHTML = (session.looks || []).map((look, index) => `
        <div class="reference-thumb look-thumb ${look.id === session.focusedLookId ? 'active' : ''}" data-look-id="${look.id}">
            ${look.previewDataUrl ? `<img src="${look.previewDataUrl}" alt="${look.name || `Look ${index + 1}`}" />` : ''}
            <span>${look.name || `Look ${index + 1}`}</span>
            <small>${look.referenceIds?.length ? 'Ref-linked' : 'Manual'}${look.sourceId ? ' · Source linked' : ''}</small>
            <div class="look-thumb-actions">
                <button type="button" class="mini-btn" data-action="apply">Apply</button>
                <button type="button" class="mini-btn" data-action="compare">${(session.activeLookIds || []).includes(look.id) ? 'Unpin' : 'Pin'}</button>
                <button type="button" class="mini-btn" data-action="export">LUT</button>
            </div>
        </div>
    `).join('');
    lookThumbList.querySelectorAll('[data-look-id]').forEach((card) => {
        card.addEventListener('click', (event) => {
            const action = event.target.closest('[data-action]')?.dataset.action;
            const lookId = card.dataset.lookId;
            if (action === 'export') {
                exportLookLut(lookId);
                return;
            }
            if (action === 'compare') {
                toggleLookCompare(lookId);
                return;
            }
            loadPreset(lookId);
        });
    });
    renderLookCompareBoard();
}

function exportLookLut(lookId) {
    const session = getActiveSession();
    const look = session?.looks?.find((item) => item.id === lookId);
    if (!look) return;
    loadPreset(lookId);
    showLUTExportDialog();
}

function toggleLookCompare(lookId) {
    const session = touchActiveSession();
    if (!session) return;
    const selected = [...(session.activeLookIds || [])];
    const existingIndex = selected.indexOf(lookId);
    if (existingIndex >= 0) {
        selected.splice(existingIndex, 1);
    } else {
        selected.unshift(lookId);
    }
    session.activeLookIds = selected.slice(0, 4);
    saveSessionLibrary();
    renderLookStrip();
}

function renderLookCompareBoard() {
    const session = getActiveSession();
    if (!lookCompareGrid || !compareBoardSummary || !session) return;
    const selectedLooks = (session.activeLookIds || []).map((id) => session.looks.find((look) => look.id === id)).filter(Boolean);
    compareBoardSummary.textContent = selectedLooks.length
        ? `${selectedLooks.length} look${selectedLooks.length === 1 ? '' : 's'} pinned for compare.`
        : 'Pin up to 4 looks for side-by-side review.';
    lookCompareGrid.innerHTML = selectedLooks.map((look) => {
        const source = session.sources.find((item) => item.id === look.sourceId);
        const reference = session.references.find((item) => item.id === look.referenceIds?.[0]);
        return `
        <article class="compare-look-card ${look.id === session.focusedLookId ? 'active' : ''}">
            ${look.previewDataUrl ? `<img src="${look.previewDataUrl}" alt="${look.name}" />` : ''}
            <div class="compare-look-meta">
                <strong>${look.name}</strong>
                <span>${source?.name || 'No source selected'} · ${reference?.name || 'No reference linked'}</span>
            </div>
            <div class="look-thumb-actions">
                <button type="button" class="mini-btn" data-action="apply" data-look-id="${look.id}">Apply</button>
                <button type="button" class="mini-btn" data-action="export" data-look-id="${look.id}">Export LUT</button>
                <button type="button" class="mini-btn" data-action="remove" data-look-id="${look.id}">Remove</button>
            </div>
        </article>
    `;
    }).join('') || `<div class="compare-board-empty">Pin looks from the strip above to compare references, sources, and LUT candidates side by side.</div>`;
    lookCompareGrid.querySelectorAll('[data-look-id]').forEach((button) => {
        button.addEventListener('click', () => {
            const lookId = button.dataset.lookId;
            if (button.dataset.action === 'export') exportLookLut(lookId);
            else if (button.dataset.action === 'remove') toggleLookCompare(lookId);
            else loadPreset(lookId);
        });
    });
}

function applySourceDataUrl(dataUrl) {
    if (!dataUrl) {
        sourceImage = null;
        sourceImg.src = '';
        sourcePreview.style.display = 'none';
        document.getElementById('sourceUpload').classList.remove('has-image');
        updateProcessButton();
        return;
    }
    const img = new Image();
    img.onload = () => {
        sourceImage = img;
        sourceImg.src = dataUrl;
        sourcePreview.style.display = 'block';
        document.getElementById('sourceUpload').classList.add('has-image');
        updateProcessButton();
    };
    img.src = dataUrl;
}

function activateSource(sourceId) {
    const session = touchActiveSession();
    if (!session) return;
    const source = session.sources.find((item) => item.id === sourceId);
    if (!source) return;
    session.activeSourceIds = [source.id];
    saveSessionLibrary();
    applySourceDataUrl(source.dataUrl);
    renderSourceTray();
    renderSessionHub();
    if (targetImage && resultsSection.style.display !== 'none') processImages();
}

function activateReference(referenceId) {
    const session = touchActiveSession();
    if (!session) return;
    const reference = session.references.find((item) => item.id === referenceId);
    if (!reference) return;
    session.activeReferenceIds = [reference.id];
    currentReferenceDataUrl = reference.dataUrl;
    targetImg.src = reference.dataUrl;
    targetPreview.style.display = 'block';
    document.getElementById('targetUpload').classList.add('has-image');
    const img = new Image();
    img.onload = () => {
        targetImage = img;
        updateProcessButton();
        renderReferenceTray();
        renderReferenceRail();
        if (sourceImage && resultsSection.style.display !== 'none') processImages();
    };
    img.src = reference.dataUrl;
}

function hydrateActiveSession() {
    const session = getActiveSession();
    if (!session) return;
    syncWorkspaceLayoutState();
    const source = getActiveSourceRecord();
    applySourceDataUrl(source?.dataUrl || null);
    const reference = getActiveReferenceRecord();
    if (reference) {
        activateReference(reference.id);
    } else {
        targetImage = null;
        currentReferenceDataUrl = null;
        targetImg.src = '';
        targetPreview.style.display = 'none';
        document.getElementById('targetUpload').classList.remove('has-image');
        updateProcessButton();
        renderReferenceTray();
        renderReferenceRail();
    }
    renderSourceTray();
    renderLookStrip();
    if (!source || !reference) {
        hideResults();
    }
    renderSessionHub();
}

function enterWorkspace() {
    workspaceMode = 'session';
    if (workspaceShell) workspaceShell.style.display = 'block';
    if (sessionHub) sessionHub.style.display = 'none';
    syncWorkspaceLayoutState();
    renderSessionHub();
    renderSourceTray();
    renderReferenceTray();
    renderReferenceRail();
    renderLookStrip();
    initializeDashboardWindows();
}

function exitWorkspace() {
    workspaceMode = 'home';
    if (workspaceShell) workspaceShell.style.display = 'none';
    if (sessionHub) sessionHub.style.display = 'grid';
    closeAllModals();
}

// Event listeners
sourceInput.addEventListener('change', (e) => handleImageUpload(e, 'source'));
if (targetInput) {
    targetInput.addEventListener('change', (e) => handleImageUpload(e, 'target'));
}

temperatureSlider.addEventListener('input', (e) => updateAdjustment('temperature', e.target.value));
tintSlider.addEventListener('input', (e) => updateAdjustment('tint', e.target.value));
exposureSlider.addEventListener('input', (e) => updateAdjustment('exposure', e.target.value));
contrastSlider.addEventListener('input', (e) => updateAdjustment('contrast', e.target.value));
highlightsSlider.addEventListener('input', (e) => updateAdjustment('highlights', e.target.value));
shadowsSlider.addEventListener('input', (e) => updateAdjustment('shadows', e.target.value));
whitesSlider.addEventListener('input', (e) => updateAdjustment('whites', e.target.value));
blacksSlider.addEventListener('input', (e) => updateAdjustment('blacks', e.target.value));
saturationSlider.addEventListener('input', (e) => updateAdjustment('saturation', e.target.value));
strengthSlider.addEventListener('input', (e) => updateStrength(e.target.value));
shadowWheelAmount?.addEventListener('input', (e) => updateWheelAdjustment('shadow', e.target.value));
midtoneWheelAmount?.addEventListener('input', (e) => updateWheelAdjustment('midtone', e.target.value));
highlightWheelAmount?.addEventListener('input', (e) => updateWheelAdjustment('highlight', e.target.value));
shadowWheelColor?.addEventListener('input', () => updateWheelColor('shadow'));
midtoneWheelColor?.addEventListener('input', () => updateWheelColor('midtone'));
highlightWheelColor?.addEventListener('input', () => updateWheelColor('highlight'));
resetCurveBtn?.addEventListener('click', resetCurves);

algorithmMethod.addEventListener('change', () => {
    updateMethodHint();
    if (cachedSourceImageData) reapplyTransfer();
});
performanceMode.addEventListener('change', () => {
    updateMethodHint();
    if (cachedSourceImageData) reapplyTransfer();
});

// Advanced feature buttons
if (presetPanelBtn) {
    presetPanelBtn.addEventListener('click', togglePresetPanel);
}
newSessionBtn?.addEventListener('click', createNewSession);
duplicateSessionBtn?.addEventListener('click', duplicateActiveSession);
deleteSessionBtn?.addEventListener('click', deleteActiveSession);
renameSessionBtn?.addEventListener('click', renameActiveSession);
addReferenceBtn?.addEventListener('click', openReferencePopup);
openSessionBtn?.addEventListener('click', enterWorkspace);
backToSessionsBtn?.addEventListener('click', exitWorkspace);
addSourceToSessionBtn?.addEventListener('click', () => sourceInput?.click());
addReferenceToSessionTopBtn?.addEventListener('click', openReferencePopup);
addSourceRailBtn?.addEventListener('click', () => sourceInput?.click());
addReferenceRailBtn?.addEventListener('click', openReferencePopup);
quickStartSourceBtn?.addEventListener('click', () => {
    createNewSession();
    enterWorkspace();
    sourceInput?.click();
});
quickStartReferenceBtn?.addEventListener('click', () => {
    createNewSession();
    enterWorkspace();
    openReferencePopup();
});
newLookBtn?.addEventListener('click', () => {
    if (document.getElementById('presetPanel')?.style.display === 'none') {
        togglePresetPanel();
    }
    document.getElementById('presetNameInput')?.focus();
});
clearCompareBoardBtn?.addEventListener('click', () => {
    const session = touchActiveSession();
    if (!session) return;
    session.activeLookIds = [];
    saveSessionLibrary();
    renderLookStrip();
    showStatus('Compare selection cleared.', 'success');
});

function updateMethodHint(result = null) {
    const method = algorithmMethod.value;
    const perf = performanceMode.value;
    const baseHint = {
        'hybrid-lab': 'Hybrid LAB: balanced global transfer plus histogram refinement for higher matching accuracy.',
        'reinhard-lab': 'Reinhard LAB: fast and natural global color transfer.',
        'lab-histogram': 'LAB histogram matching: better tonal alignment, slower on large images.',
        'rgb-mean-std': 'RGB mean/std: fastest option, less perceptual accuracy.',
        'auto': 'Auto mode picks method from image size + performance setting.'
    }[method];

    const perfHint = {
        fast: 'Fast mode uses heavier sampling for speed.',
        balanced: 'Balanced mode provides good speed/quality tradeoff.',
        quality: 'Quality mode uses dense sampling for better accuracy.'
    }[perf];

    const resolved = result?.method && result.method !== method
        ? ` Active: ${result.method}.`
        : '';

    if (methodHint) {
        methodHint.textContent = `${baseHint} ${perfHint}${resolved}`;
    }
}

function revertToImageSelection() {
    if (uploadSection) {
        uploadSection.style.display = 'block';
    }
    hideResults();
    shouldAutoScrollToResults = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeAllModals() {
    ['fullExportModal', 'lutExportModal', 'refPopup', 'settingsModal', 'imagePreviewModal'].forEach((id) => {
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = 'none';
        }
    });
}

function openImagePreview(src, options = {}) {
    const modal = document.getElementById('imagePreviewModal');
    const img = document.getElementById('imagePreviewModalImg');
    const title = document.getElementById('imagePreviewTitle');
    const primaryAction = document.getElementById('imagePreviewPrimaryAction');
    if (!modal || !img || !title || !primaryAction) return;

    img.src = src;
    title.textContent = options.title || 'Preview';
    if (options.actionLabel && typeof options.onAction === 'function') {
        primaryAction.textContent = options.actionLabel;
        primaryAction.style.display = 'inline-flex';
        primaryAction.onclick = options.onAction;
    } else {
        primaryAction.style.display = 'none';
        primaryAction.onclick = null;
    }

    modal.style.display = 'flex';
}

function closeImagePreview() {
    const modal = document.getElementById('imagePreviewModal');
    const img = document.getElementById('imagePreviewModalImg');
    const primaryAction = document.getElementById('imagePreviewPrimaryAction');
    if (modal) modal.style.display = 'none';
    if (img) img.src = '';
    if (primaryAction) {
        primaryAction.style.display = 'none';
        primaryAction.onclick = null;
    }
}

function setActiveDashboardWindow(windowId, options = {}) {
    const { forceVisible = false } = options;
    const panel = document.getElementById(windowId);
    if (!panel) return;
    const activePanels = Array.from(document.querySelectorAll('.dashboard-window.active'));
    if (!forceVisible && panel.classList.contains('active') && activePanels.length > 1) {
        panel.classList.remove('active');
    } else {
        panel.classList.add('active');
        bringWindowToFront(panel);
    }
    const resultWindowToggles = document.getElementById('resultWindowToggles');
    if (resultWindowToggles) {
        resultWindowToggles.querySelectorAll('.window-toggle').forEach((btn) => {
            if (!btn.dataset.window) return;
            const targetPanel = document.getElementById(btn.dataset.window);
            btn.classList.toggle('active', !!targetPanel && targetPanel.classList.contains('active'));
        });
    }

    if (windowId === 'windowOrigVsResult' && panel.classList.contains('active') && originalCanvas.width) {
        const slider = document.getElementById('compareOriginalResultSlider');
        redrawComparison(
            document.getElementById('compareOriginalResultBottom'),
            document.getElementById('compareOriginalResultTop'),
            originalCanvas, resultCanvas,
            slider ? parseInt(slider.value, 10) : 50
        );
    }
    if (windowId === 'windowRefVsResult' && panel.classList.contains('active') && referenceCanvas.width) {
        const slider = document.getElementById('compareReferenceResultSlider');
        redrawComparison(
            document.getElementById('compareReferenceResultBottom'),
            document.getElementById('compareReferenceResultTop'),
            referenceCanvas, resultCanvas,
            slider ? parseInt(slider.value, 10) : 50
        );
    }
}

function getDashboardLayouts() {
    return getSessionLayoutState()?.panelRects || {};
}

function getWorkspaceRect() {
    if (!dashboardWorkspace) return { width: 1280, height: 860 };
    return {
        width: dashboardWorkspace.clientWidth || 1280,
        height: dashboardWorkspace.clientHeight || 860
    };
}

function roundToGrid(value) {
    return Math.round(value / DASHBOARD_GRID) * DASHBOARD_GRID;
}

function clampWindowRect(rect, panel, workspaceRect) {
    const minWidth = parseInt(getComputedStyle(panel).minWidth || '320', 10);
    const minHeight = parseInt(getComputedStyle(panel).minHeight || '220', 10);
    const width = Math.max(minWidth, Math.min(rect.width, workspaceRect.width - DASHBOARD_MARGIN * 2));
    const height = Math.max(minHeight, Math.min(rect.height, workspaceRect.height - DASHBOARD_MARGIN * 2));
    return {
        width,
        height,
        left: Math.max(0, Math.min(rect.left, workspaceRect.width - width)),
        top: Math.max(0, Math.min(rect.top, workspaceRect.height - height))
    };
}

function applyRectToPanel(panel, rect) {
    const nextLeft = `${rect.left}px`;
    const nextTop = `${rect.top}px`;
    const nextWidth = `${rect.width}px`;
    const nextHeight = `${rect.height}px`;
    if (panel.style.left !== nextLeft) panel.style.left = nextLeft;
    if (panel.style.top !== nextTop) panel.style.top = nextTop;
    if (panel.style.width !== nextWidth) panel.style.width = nextWidth;
    if (panel.style.height !== nextHeight) panel.style.height = nextHeight;
}

function getPanelSlots(workspaceRect) {
    const halfW = Math.floor((workspaceRect.width - DASHBOARD_MARGIN * 3) / 2);
    const halfH = Math.floor((workspaceRect.height - DASHBOARD_MARGIN * 3) / 2);
    const thirdW = Math.floor((workspaceRect.width - DASHBOARD_MARGIN * 4) / 3);
    const thirdH = Math.floor((workspaceRect.height - DASHBOARD_MARGIN * 4) / 3);
    return {
        full: { left: DASHBOARD_MARGIN, top: DASHBOARD_MARGIN, width: workspaceRect.width - DASHBOARD_MARGIN * 2, height: workspaceRect.height - DASHBOARD_MARGIN * 2 },
        left: { left: DASHBOARD_MARGIN, top: DASHBOARD_MARGIN, width: halfW, height: workspaceRect.height - DASHBOARD_MARGIN * 2 },
        right: { left: DASHBOARD_MARGIN * 2 + halfW, top: DASHBOARD_MARGIN, width: halfW, height: workspaceRect.height - DASHBOARD_MARGIN * 2 },
        top: { left: DASHBOARD_MARGIN, top: DASHBOARD_MARGIN, width: workspaceRect.width - DASHBOARD_MARGIN * 2, height: halfH },
        bottom: { left: DASHBOARD_MARGIN, top: DASHBOARD_MARGIN * 2 + halfH, width: workspaceRect.width - DASHBOARD_MARGIN * 2, height: halfH },
        topLeft: { left: DASHBOARD_MARGIN, top: DASHBOARD_MARGIN, width: halfW, height: halfH },
        topRight: { left: DASHBOARD_MARGIN * 2 + halfW, top: DASHBOARD_MARGIN, width: halfW, height: halfH },
        bottomLeft: { left: DASHBOARD_MARGIN, top: DASHBOARD_MARGIN * 2 + halfH, width: halfW, height: halfH },
        bottomRight: { left: DASHBOARD_MARGIN * 2 + halfW, top: DASHBOARD_MARGIN * 2 + halfH, width: halfW, height: halfH },
        center: { left: DASHBOARD_MARGIN + thirdW, top: DASHBOARD_MARGIN + thirdH, width: thirdW, height: thirdH }
    };
}

function getPreferredSlot(panelId) {
    const stored = getSessionLayoutState()?.panelSlots || {};
    const defaults = {
        windowThreeUp: 'topLeft',
        windowAdjustments: 'right',
        windowAnalysis: 'bottom',
        windowOrigVsResult: 'topRight',
        windowRefVsResult: 'center'
    };
    return stored[panelId] || defaults[panelId] || 'center';
}

function savePreferredSlot(panelId, slotName) {
    const layout = getSessionLayoutState();
    if (!layout) return;
    const stored = layout.panelSlots || {};
    stored[panelId] = slotName;
    layout.panelSlots = stored;
}

function findClosestSlot(panel, workspaceRect, clientX, clientY) {
    const slots = getPanelSlots(workspaceRect);
    const pointer = { x: clientX - workspaceRect.left, y: clientY - workspaceRect.top };
    const preferred = getPreferredSlot(panel.id);
    let bestName = preferred;
    let bestScore = Number.POSITIVE_INFINITY;
    Object.entries(slots).forEach(([name, rect]) => {
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = pointer.x - cx;
        const dy = pointer.y - cy;
        const dist = Math.hypot(dx, dy);
        if (dist < bestScore) {
            bestScore = dist;
            bestName = name;
        }
    });
    return { name: bestName, rect: snapWindowRect(slots[bestName], panel, workspaceRect) };
}

function snapWindowRect(rect, panel, workspaceRect) {
    let left = rect.left;
    let top = rect.top;
    let width = rect.width;
    let height = rect.height;
    const rightGap = workspaceRect.width - (left + width);
    const bottomGap = workspaceRect.height - (top + height);

    if (Math.abs(left - DASHBOARD_MARGIN) <= DASHBOARD_SNAP_DISTANCE) left = DASHBOARD_MARGIN;
    if (Math.abs(top - DASHBOARD_MARGIN) <= DASHBOARD_SNAP_DISTANCE) top = DASHBOARD_MARGIN;
    if (Math.abs(rightGap - DASHBOARD_MARGIN) <= DASHBOARD_SNAP_DISTANCE) {
        left = workspaceRect.width - width - DASHBOARD_MARGIN;
    }
    if (Math.abs(bottomGap - DASHBOARD_MARGIN) <= DASHBOARD_SNAP_DISTANCE) {
        top = workspaceRect.height - height - DASHBOARD_MARGIN;
    }

    if (panel.classList.contains('dock-right') && Math.abs(rightGap - DASHBOARD_MARGIN) <= DASHBOARD_SNAP_DISTANCE * 1.5) {
        left = workspaceRect.width - width - DASHBOARD_MARGIN;
    }
    if (panel.classList.contains('dock-bottom') && Math.abs(bottomGap - DASHBOARD_MARGIN) <= DASHBOARD_SNAP_DISTANCE * 1.5) {
        top = workspaceRect.height - height - DASHBOARD_MARGIN;
    }

    left = roundToGrid(left);
    top = roundToGrid(top);
    width = roundToGrid(width);
    height = roundToGrid(height);

    return clampWindowRect({ left, top, width, height }, panel, workspaceRect);
}

function getSmartDefaultLayout(panelId, workspaceRect) {
    const w = workspaceRect.width;
    const h = workspaceRect.height;
    const rightWidth = Math.max(392, Math.min(456, Math.round(w * 0.3)));
    const bottomHeight = Math.max(236, Math.min(292, Math.round(h * 0.3)));
    const mainWidth = Math.max(520, w - rightWidth - DASHBOARD_MARGIN * 3);
    const mainHeight = Math.max(360, h - bottomHeight - DASHBOARD_MARGIN * 3);
    const analysisWidth = Math.max(760, w - DASHBOARD_MARGIN * 2);

    const defaults = {
        windowThreeUp: { left: DASHBOARD_MARGIN, top: DASHBOARD_MARGIN, width: mainWidth, height: mainHeight },
        windowAdjustments: { left: w - rightWidth - DASHBOARD_MARGIN, top: DASHBOARD_MARGIN, width: rightWidth, height: mainHeight },
        windowAnalysis: { left: DASHBOARD_MARGIN, top: h - bottomHeight - DASHBOARD_MARGIN, width: analysisWidth, height: bottomHeight },
        windowOrigVsResult: { left: DASHBOARD_MARGIN + 36, top: DASHBOARD_MARGIN + 32, width: Math.min(720, mainWidth - 28), height: Math.min(440, mainHeight - 28) },
        windowRefVsResult: { left: DASHBOARD_MARGIN + 82, top: DASHBOARD_MARGIN + 78, width: Math.min(720, mainWidth - 18), height: Math.min(440, mainHeight - 18) }
    };

    return snapWindowRect(defaults[panelId] || {
        left: parseInt(document.getElementById(panelId)?.dataset.defaultX || '16', 10),
        top: parseInt(document.getElementById(panelId)?.dataset.defaultY || '16', 10),
        width: parseInt(document.getElementById(panelId)?.dataset.defaultW || '620', 10),
        height: parseInt(document.getElementById(panelId)?.dataset.defaultH || '400', 10)
    }, document.getElementById(panelId), workspaceRect);
}

function getPresetLayout(layoutName, workspaceRect) {
    const w = workspaceRect.width;
    const h = workspaceRect.height;
    const rightDock = Math.max(360, Math.min(520, Math.round(w * workspaceSplitState.rightRatio)));
    const bottomDock = Math.max(220, Math.min(360, Math.round(h * workspaceSplitState.bottomRatio)));
    const mainWidth = w - rightDock - DASHBOARD_MARGIN * 3;
    const topHeight = h - bottomDock - DASHBOARD_MARGIN * 3;
    const defaults = {
        edit: {
            windowThreeUp: { left: DASHBOARD_MARGIN, top: DASHBOARD_MARGIN, width: mainWidth, height: topHeight },
            windowAdjustments: { left: w - rightDock - DASHBOARD_MARGIN, top: DASHBOARD_MARGIN, width: rightDock, height: topHeight },
            windowAnalysis: { left: DASHBOARD_MARGIN, top: h - bottomDock - DASHBOARD_MARGIN, width: w - DASHBOARD_MARGIN * 2, height: bottomDock },
            windowOrigVsResult: { left: 64, top: 64, width: 620, height: 390 },
            windowRefVsResult: { left: 116, top: 112, width: 620, height: 390 }
        },
        compare: {
            windowThreeUp: { left: DASHBOARD_MARGIN, top: DASHBOARD_MARGIN, width: Math.max(440, mainWidth * 0.52), height: topHeight },
            windowOrigVsResult: { left: DASHBOARD_MARGIN * 2 + Math.max(440, mainWidth * 0.52), top: DASHBOARD_MARGIN, width: Math.max(280, (mainWidth * 0.48) / 2 - DASHBOARD_MARGIN), height: topHeight },
            windowRefVsResult: { left: DASHBOARD_MARGIN * 3 + Math.max(440, mainWidth * 0.52) + Math.max(280, (mainWidth * 0.48) / 2 - DASHBOARD_MARGIN), top: DASHBOARD_MARGIN, width: Math.max(280, (mainWidth * 0.48) / 2 - DASHBOARD_MARGIN), height: topHeight },
            windowAnalysis: { left: DASHBOARD_MARGIN, top: h - bottomDock - DASHBOARD_MARGIN, width: w - DASHBOARD_MARGIN * 2, height: bottomDock },
            windowAdjustments: { left: w - rightDock - DASHBOARD_MARGIN, top: DASHBOARD_MARGIN, width: rightDock, height: topHeight }
        },
        analysis: {
            windowThreeUp: { left: DASHBOARD_MARGIN, top: DASHBOARD_MARGIN, width: Math.max(420, mainWidth * 0.5), height: topHeight },
            windowAdjustments: { left: DASHBOARD_MARGIN * 2 + Math.max(420, mainWidth * 0.5), top: DASHBOARD_MARGIN, width: Math.max(300, mainWidth * 0.22), height: topHeight },
            windowOrigVsResult: { left: w - rightDock - DASHBOARD_MARGIN, top: DASHBOARD_MARGIN, width: rightDock, height: Math.max(180, topHeight * 0.45) },
            windowRefVsResult: { left: w - rightDock - DASHBOARD_MARGIN, top: DASHBOARD_MARGIN * 2 + Math.max(180, topHeight * 0.45), width: rightDock, height: Math.max(160, topHeight * 0.55 - DASHBOARD_MARGIN) },
            windowAnalysis: { left: DASHBOARD_MARGIN, top: h - bottomDock - DASHBOARD_MARGIN, width: w - DASHBOARD_MARGIN * 2, height: bottomDock }
        }
    };
    return defaults[layoutName] || defaults.edit;
}

function applyWorkspacePreset(layoutName) {
    if (!dashboardWorkspace || window.innerWidth <= 980) return;
    currentWorkspacePreset = layoutName;
    const layoutState = getSessionLayoutState();
    if (layoutState) {
        layoutState.preset = layoutName;
        layoutState.dividerRatios = {
            right: workspaceSplitState.rightRatio,
            bottom: workspaceSplitState.bottomRatio
        };
    }
    const workspaceRect = getWorkspaceRect();
    const preset = getPresetLayout(layoutName, workspaceRect);
    document.querySelectorAll('.dashboard-window').forEach((panel, index) => {
        const raw = preset[panel.id] || getSmartDefaultLayout(panel.id, workspaceRect);
        const snapped = snapWindowRect(raw, panel, workspaceRect);
        panel.classList.add('active');
        applyRectToPanel(panel, snapped);
        panel.style.zIndex = String(index + 1);
    });
    if (layoutName === 'edit') {
        document.getElementById('windowOrigVsResult')?.classList.remove('active');
        document.getElementById('windowRefVsResult')?.classList.remove('active');
    }
    if (layoutName === 'compare') {
        document.getElementById('windowAnalysis')?.classList.add('active');
    }
    if (layoutName === 'analysis') {
        document.getElementById('windowAnalysis')?.classList.add('active');
    }
    saveDashboardLayouts();
    updateComparisonViews();
    updateWindowDensityClasses();
    updateWorkspaceDividers();
}

function showSnapPreview(rect) {
    if (!snapPreview || !rect) return;
    snapPreview.style.display = 'block';
    snapPreview.style.left = `${rect.left}px`;
    snapPreview.style.top = `${rect.top}px`;
    snapPreview.style.width = `${rect.width}px`;
    snapPreview.style.height = `${rect.height}px`;
}

function hideSnapPreview() {
    if (!snapPreview) return;
    snapPreview.style.display = 'none';
}

function ensureSnapTargetLayer() {
    if (!dashboardWorkspace || snapTargetLayer) return;
    snapTargetLayer = document.createElement('div');
    snapTargetLayer.className = 'workspace-snap-target-layer';
    dashboardWorkspace.appendChild(snapTargetLayer);
}

function showSnapTargets(workspaceRect, activeSlotName) {
    ensureSnapTargetLayer();
    if (!snapTargetLayer) return;
    const slots = getPanelSlots(workspaceRect);
    snapTargetLayer.innerHTML = Object.entries(slots).map(([name, rect]) => `
        <div class="workspace-snap-target ${name === activeSlotName ? 'active' : ''}" data-slot="${name}" style="left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;display:flex;">
            ${name.replace(/([A-Z])/g, ' $1')}
        </div>
    `).join('');
}

function hideSnapTargets() {
    if (!snapTargetLayer) return;
    snapTargetLayer.innerHTML = '';
}

function updateWindowDensityClasses() {
    document.querySelectorAll('.dashboard-window').forEach((panel) => {
        const width = panel.offsetWidth || parseInt(panel.style.width || '0', 10);
        panel.classList.toggle('compact', width > 0 && width < 430);
        panel.classList.toggle('expanded', width >= 720);
    });
}

function ensureWorkspaceDividers() {
    if (!dashboardWorkspace) return;
    if (!verticalDivider) {
        verticalDivider = document.createElement('div');
        verticalDivider.className = 'workspace-divider vertical';
        dashboardWorkspace.appendChild(verticalDivider);
    }
    if (!horizontalDivider) {
        horizontalDivider = document.createElement('div');
        horizontalDivider.className = 'workspace-divider horizontal';
        dashboardWorkspace.appendChild(horizontalDivider);
    }
}

function updateWorkspaceDividers() {
    ensureWorkspaceDividers();
    if (!verticalDivider || !horizontalDivider || window.innerWidth <= 980) return;
    const analysisPanel = document.getElementById('windowAnalysis');
    const adjustmentPanel = document.getElementById('windowAdjustments');
    const analysisTop = parseInt(analysisPanel?.style.top || '0', 10);
    const adjustmentLeft = parseInt(adjustmentPanel?.style.left || '0', 10);
    verticalDivider.style.display = adjustmentPanel?.classList.contains('active') ? 'block' : 'none';
    horizontalDivider.style.display = analysisPanel?.classList.contains('active') ? 'block' : 'none';
    verticalDivider.style.left = `${adjustmentLeft - 4}px`;
    verticalDivider.style.top = `${DASHBOARD_MARGIN}px`;
    verticalDivider.style.height = `${Math.max(120, analysisTop - DASHBOARD_MARGIN - 8)}px`;
    horizontalDivider.style.left = `${DASHBOARD_MARGIN}px`;
    horizontalDivider.style.top = `${analysisTop - 4}px`;
    horizontalDivider.style.width = `${Math.max(240, getWorkspaceRect().width - DASHBOARD_MARGIN * 2)}px`;
}

function saveDashboardLayouts() {
    if (!dashboardWorkspace || window.innerWidth <= 980) return;
    const layoutState = getSessionLayoutState();
    if (!layoutState) return;
    const layouts = {};
    document.querySelectorAll('.dashboard-window').forEach((panel) => {
        layouts[panel.id] = {
            left: panel.style.left,
            top: panel.style.top,
            width: panel.style.width,
            height: panel.style.height,
            active: panel.classList.contains('active'),
            zIndex: panel.style.zIndex || '1'
        };
    });
    layoutState.panelRects = layouts;
    layoutState.preset = currentWorkspacePreset;
    layoutState.dividerRatios = {
        right: workspaceSplitState.rightRatio,
        bottom: workspaceSplitState.bottomRatio
    };
    touchActiveSession();
}

function bringWindowToFront(panel) {
    const panels = Array.from(document.querySelectorAll('.dashboard-window'));
    const maxZ = panels.reduce((max, node) => Math.max(max, parseInt(node.style.zIndex || '1', 10)), 1);
    panel.style.zIndex = String(maxZ + 1);
}

function resetDashboardLayout() {
    const layoutState = getSessionLayoutState();
    if (layoutState) {
        layoutState.panelRects = {};
        layoutState.panelSlots = {};
        layoutState.preset = 'edit';
        layoutState.dividerRatios = { right: 0.32, bottom: 0.30 };
        touchActiveSession();
        syncWorkspaceLayoutState();
    }
    initializeDashboardWindows(true);
}

function initializeDashboardWindows(forceReset = false) {
    if (!dashboardWorkspace) return;
    const isMobile = window.innerWidth <= 980;
    const stored = forceReset ? {} : getDashboardLayouts();
    const workspaceRect = getWorkspaceRect();
    document.querySelectorAll('.dashboard-window').forEach((panel, index) => {
        panel.classList.add('active');
        if (isMobile) {
            panel.style.left = '';
            panel.style.top = '';
            panel.style.width = '';
            panel.style.height = '';
            panel.style.zIndex = '';
            return;
        }
        const layout = stored[panel.id] || {};
        const defaultLayout = getSmartDefaultLayout(panel.id, workspaceRect);
        const resolved = clampWindowRect({
            left: parseInt(layout.left || `${defaultLayout.left}`, 10),
            top: parseInt(layout.top || `${defaultLayout.top}`, 10),
            width: parseInt(layout.width || `${defaultLayout.width}`, 10),
            height: parseInt(layout.height || `${defaultLayout.height}`, 10)
        }, panel, workspaceRect);
        applyRectToPanel(panel, resolved);
        panel.style.zIndex = layout.zIndex || String(index + 1);
        if (layout.active === false && panel.id !== 'windowThreeUp') {
            panel.classList.remove('active');
        }
        if (panel.dataset.focusBound !== 'true') {
            panel.dataset.focusBound = 'true';
            panel.addEventListener('mousedown', () => bringWindowToFront(panel));
        }
    });
    const toggles = document.getElementById('resultWindowToggles');
    toggles?.querySelectorAll('.window-toggle').forEach((btn) => {
        if (!btn.dataset.window) return;
        const targetPanel = document.getElementById(btn.dataset.window);
        btn.classList.toggle('active', !!targetPanel?.classList.contains('active'));
    });
    updateWindowDensityClasses();
    updateWorkspaceDividers();
    saveDashboardLayouts();
}

function setupDashboardWindowInteractions() {
    if (!dashboardWorkspace || dashboardWorkspace.dataset.bound === 'true') return;
    dashboardWorkspace.dataset.bound = 'true';
    initializeDashboardWindows();
    updateWindowDensityClasses();
    hideSnapPreview();
    ensureWorkspaceDividers();
    updateWorkspaceDividers();
    document.getElementById('resetWindowLayoutBtn')?.addEventListener('click', resetDashboardLayout);

    let dragState = null;
    let dividerState = null;
    const startDrag = (event) => {
        if (window.innerWidth <= 980) return;
        const divider = event.target.closest('.workspace-divider');
        if (divider) {
            dividerState = {
                type: divider.classList.contains('vertical') ? 'vertical' : 'horizontal',
                workspaceRect: dashboardWorkspace.getBoundingClientRect()
            };
            divider.classList.add('active');
            return;
        }
        const bar = event.target.closest('.dashboard-window-bar');
        if (!bar) return;
        const panel = bar.closest('.dashboard-window');
        if (!panel) return;
        bringWindowToFront(panel);
        const rect = panel.getBoundingClientRect();
        const workspaceRect = dashboardWorkspace.getBoundingClientRect();
        dragState = {
            panel,
            offsetX: event.clientX - rect.left,
            offsetY: event.clientY - rect.top,
            workspaceRect,
            slotName: getPreferredSlot(panel.id),
            slotRect: null
        };
        panel.classList.add('dragging');
        showSnapTargets(workspaceRect, dragState.slotName);
    };

    const moveDrag = (event) => {
        if (dividerState) {
            const workspaceRect = dividerState.workspaceRect;
            if (dividerState.type === 'vertical') {
                const pointerX = event.clientX - workspaceRect.left;
                workspaceSplitState.rightRatio = 1 - Math.max(0.22, Math.min(0.48, pointerX / workspaceRect.width));
            } else {
                const pointerY = event.clientY - workspaceRect.top;
                workspaceSplitState.bottomRatio = 1 - Math.max(0.22, Math.min(0.5, pointerY / workspaceRect.height));
            }
            const layout = getSessionLayoutState();
            if (layout) {
                layout.dividerRatios = {
                    right: workspaceSplitState.rightRatio,
                    bottom: workspaceSplitState.bottomRatio
                };
            }
            applyWorkspacePreset(currentWorkspacePreset);
            return;
        }
        if (!dragState) return;
        const { panel, workspaceRect } = dragState;
        const slot = findClosestSlot(panel, workspaceRect, event.clientX, event.clientY);
        dragState.slotName = slot.name;
        dragState.slotRect = slot.rect;
        showSnapTargets(workspaceRect, slot.name);
        showSnapPreview(slot.rect);
    };

    const stopDrag = () => {
        if (dividerState) {
            verticalDivider?.classList.remove('active');
            horizontalDivider?.classList.remove('active');
            dividerState = null;
            saveDashboardLayouts();
            return;
        }
        if (!dragState) return;
        dragState.panel.classList.remove('dragging');
        if (dragState.slotName) savePreferredSlot(dragState.panel.id, dragState.slotName);
        if (dragState.slotRect) applyRectToPanel(dragState.panel, dragState.slotRect);
        hideSnapPreview();
        hideSnapTargets();
        dragState = null;
        saveDashboardLayouts();
        updateWindowDensityClasses();
    };

    dashboardWorkspace.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', moveDrag);
    window.addEventListener('mouseup', stopDrag);

    if ('ResizeObserver' in window) {
        const observer = new ResizeObserver(() => {
            const workspaceRect = getWorkspaceRect();
            document.querySelectorAll('.dashboard-window.active').forEach((panel) => {
                const snapped = snapWindowRect({
                    left: parseInt(panel.style.left || '0', 10),
                    top: parseInt(panel.style.top || '0', 10),
                    width: parseInt(panel.style.width || `${panel.offsetWidth}`, 10),
                    height: parseInt(panel.style.height || `${panel.offsetHeight}`, 10)
                }, panel, workspaceRect);
                applyRectToPanel(panel, snapped);
            });
            saveDashboardLayouts();
            updateComparisonViews();
            updateWindowDensityClasses();
        });
        document.querySelectorAll('.dashboard-window').forEach((panel) => observer.observe(panel));
    }

    window.addEventListener('resize', () => initializeDashboardWindows());
}

function setActiveToolLayer(layerId) {
    document.querySelectorAll('.tool-layer').forEach((layer) => {
        layer.classList.toggle('active', layer.id === layerId);
    });

    const toolLayerToggles = document.getElementById('toolLayerToggles');
    if (toolLayerToggles) {
        toolLayerToggles.querySelectorAll('.layer-toggle').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.layer === layerId);
        });
    }
}

function setupDashboardInteractions() {
    const resultWindowToggles = document.getElementById('resultWindowToggles');
    if (resultWindowToggles) {
        resultWindowToggles.addEventListener('click', (event) => {
            const button = event.target.closest('.window-toggle');
            if (!button) return;
            if (button.dataset.layoutPreset) {
                applyWorkspacePreset(button.dataset.layoutPreset);
                return;
            }
            setActiveDashboardWindow(button.dataset.window);
        });
    }

    const toolLayerToggles = document.getElementById('toolLayerToggles');
    if (toolLayerToggles) {
        toolLayerToggles.addEventListener('click', (event) => {
            const button = event.target.closest('.layer-toggle');
            if (!button) return;
            setActiveToolLayer(button.dataset.layer);
        });
    }

    const origSlider = document.getElementById('compareOriginalResultSlider');
    if (origSlider) {
        origSlider.addEventListener('input', () => {
            redrawComparison(
                document.getElementById('compareOriginalResultBottom'),
                document.getElementById('compareOriginalResultTop'),
                originalCanvas, resultCanvas,
                parseInt(origSlider.value, 10)
            );
        });
    }

    const refSlider = document.getElementById('compareReferenceResultSlider');
    if (refSlider) {
        refSlider.addEventListener('input', () => {
            redrawComparison(
                document.getElementById('compareReferenceResultBottom'),
                document.getElementById('compareReferenceResultTop'),
                referenceCanvas, resultCanvas,
                parseInt(refSlider.value, 10)
            );
        });
    }

    [
        [sourceImg, 'Source Image'],
        [targetImg, 'Reference Image']
    ].forEach(([imgEl, title]) => {
        imgEl?.addEventListener('click', () => {
            if (imgEl.src) openImagePreview(imgEl.src, { title });
        });
    });

    [
        [originalCanvas, 'Original Preview'],
        [referenceCanvas, 'Reference Preview'],
        [resultCanvas, 'Result Preview']
    ].forEach(([canvas, title]) => {
        canvas?.addEventListener('click', () => {
            if (canvas.width) openImagePreview(canvas.toDataURL('image/png'), { title });
        });
    });
}

function getTransferOptions() {
    return {
        strength: parseInt(strengthSlider.value, 10) / 100,
        method: algorithmMethod.value,
        performanceMode: performanceMode.value
    };
}

function getProcessingMaxSize() {
    const mode = performanceMode ? performanceMode.value : 'balanced';
    if (mode === 'fast') return 1280;
    if (mode === 'quality') return 2400;
    return 1800;
}

function handleImageUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showStatus('Please select a valid image file.', 'error');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showStatus('Image file is too large. Please select a file smaller than 10MB.', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            if (type === 'source') {
                sourceImage = img;
                sourceImg.src = e.target.result;
                sourcePreview.style.display = 'block';
                document.getElementById('sourceUpload').classList.add('has-image');
                const session = touchActiveSession();
                if (session) {
                    const sourceRecord = {
                        id: `source_${Date.now()}`,
                        dataUrl: e.target.result,
                        name: file.name || 'Source'
                    };
                    session.sources = [sourceRecord, ...(session.sources || []).filter((source) => source.dataUrl !== sourceRecord.dataUrl)].slice(0, 12);
                    session.activeSourceIds = [sourceRecord.id];
                    saveSessionLibrary();
                    renderSessionHub();
                    renderSourceTray();
                }
            } else {
                targetImage = img;
                currentReferenceDataUrl = e.target.result;
                targetImg.src = e.target.result;
                targetPreview.style.display = 'block';
                document.getElementById('targetUpload').classList.add('has-image');
                const session = touchActiveSession();
                if (session) {
                    const referenceRecord = {
                        id: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                        dataUrl: e.target.result,
                        name: file.name || `Reference ${session.references.length + 1}`
                    };
                    session.references = [referenceRecord, ...(session.references || []).filter((ref) => ref.dataUrl !== referenceRecord.dataUrl)].slice(0, 12);
                    session.activeReferenceIds = [referenceRecord.id];
                    saveSessionLibrary();
                    renderReferenceTray();
                    renderReferenceRail();
                    renderSessionHub();
                }
            }

            updateProcessButton();
            showStatus('Image loaded successfully!', 'success');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function removeImage(type) {
    closeImagePreview();
    if (uploadSection) {
        uploadSection.style.display = 'block';
    }

    if (type === 'source') {
        sourceImage = null;
        sourceInput.value = '';
        sourcePreview.style.display = 'none';
        document.getElementById('sourceUpload').classList.remove('has-image');
        const session = touchActiveSession();
        if (session) {
            session.sources = (session.sources || []).filter((source) => source.id !== session.activeSourceIds[0]);
            session.activeSourceIds = session.sources[0]?.id ? [session.sources[0].id] : [];
            saveSessionLibrary();
            renderSourceTray();
            renderSessionHub();
            if (session.activeSourceIds[0]) {
                activateSource(session.activeSourceIds[0]);
            }
        }
    } else {
        targetInput.value = '';
        const session = touchActiveSession();
        if (session) {
            session.references = (session.references || []).filter((reference) => reference.id !== session.activeReferenceIds[0]);
            session.activeReferenceIds = session.references[0]?.id ? [session.references[0].id] : [];
            saveSessionLibrary();
            renderReferenceTray();
            renderReferenceRail();
            renderSessionHub();
            if (session.activeReferenceIds[0]) {
                activateReference(session.activeReferenceIds[0]);
            } else {
                targetImage = null;
                currentReferenceDataUrl = null;
                targetPreview.style.display = 'none';
                document.getElementById('targetUpload').classList.remove('has-image');
            }
        }
    }

    updateProcessButton();
    hideResults();
    showStatus('');
}

function updateProcessButton() {
    if (processBtn) {
        processBtn.disabled = !sourceImage || !targetImage;
    }
}

function showStatus(message, type = '') {
    if (statusMessage) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
    }
}

function showError(message) {
    showStatus(message, 'error');
}

function getReferenceMemory() {
    try {
        return JSON.parse(localStorage.getItem(REFERENCE_MEMORY_KEY)) || {
            lastQuery: '',
            searchHistory: [],
            selectedPresetId: null,
            savedLooks: []
        };
    } catch {
        return {
            lastQuery: '',
            searchHistory: [],
            selectedPresetId: null,
            savedLooks: []
        };
    }
}

function saveReferenceMemory(memory) {
    localStorage.setItem(REFERENCE_MEMORY_KEY, JSON.stringify(memory));
}

function updateReferenceMemory(patch) {
    const next = { ...getReferenceMemory(), ...patch };
    saveReferenceMemory(next);
    return next;
}

function rememberSearchQuery(query, details = {}) {
    const memory = getReferenceMemory();
    const searchHistory = [
        { query, timestamp: new Date().toISOString(), ...details },
        ...memory.searchHistory.filter((item) => item.query !== query)
    ].slice(0, 12);
    saveReferenceMemory({
        ...memory,
        lastQuery: query,
        searchHistory
    });
}

function rememberReferenceSelection(meta = {}) {
    const memory = getReferenceMemory();
    const savedLooks = [
        {
            timestamp: new Date().toISOString(),
            presetId: memory.selectedPresetId,
            styleState: unifiedSession?.styleState || null,
            ...meta
        },
        ...memory.savedLooks
    ].slice(0, 8);
    saveReferenceMemory({
        ...memory,
        savedLooks
    });
}

function applyReferenceMemoryToPrompt(query) {
    const memory = getReferenceMemory();
    const preset = memory.selectedPresetId ? presetManager.getPresetById(memory.selectedPresetId) : null;
    const recentQueries = memory.searchHistory.slice(0, 3).map((item) => item.query);
    const hints = [];

    if (preset?.name) {
        hints.push(`anchor preset: ${preset.name}`);
    }
    if (preset?.tags?.length) {
        hints.push(`preset tags: ${preset.tags.join(', ')}`);
    }
    if (unifiedSession?.styleState?.visualStyle) {
        hints.push(`style memory: ${unifiedSession.styleState.visualStyle}`);
    }
    if (recentQueries.length) {
        hints.push(`recent reference intent: ${recentQueries.join(' | ')}`);
    }

    return hints.length ? `${query}\nContext: ${hints.join(' ; ')}` : query;
}

function buildReferenceSearchContext(query) {
    const memory = getReferenceMemory();
    const preset = memory.selectedPresetId ? presetManager.getPresetById(memory.selectedPresetId) : null;
    const hints = [];

    if (preset?.name) hints.push(`anchor preset: ${preset.name}`);
    if (preset?.tags?.length) hints.push(`preset tags: ${preset.tags.slice(0, 4).join(', ')}`);
    if (unifiedSession?.styleState?.visualStyle) hints.push(`style memory: ${unifiedSession.styleState.visualStyle}`);

    return hints.length ? `${query}\nSearch context: ${hints.join(' ; ')}` : query;
}

function showLoading() {
    const btnText = processBtn.querySelector('.btn-text');
    const spinner = processBtn.querySelector('.spinner');

    btnText.textContent = 'Processing...';
    spinner.style.display = 'block';
    processBtn.disabled = true;
}

function hideLoading() {
    const btnText = processBtn.querySelector('.btn-text');
    const spinner = processBtn.querySelector('.spinner');

    btnText.textContent = 'Transfer Colors';
    spinner.style.display = 'none';
    processBtn.disabled = !sourceImage || !targetImage;
}

async function processImages() {
    if (!sourceImage || !targetImage) return;

    showLoading();
    showStatus('Processing images...', 'processing');
    hideResults();

    try {
        const maxProcessingSize = getProcessingMaxSize();
        const sourceCanvas = resizeImage(sourceImage, maxProcessingSize);
        const targetCanvas = resizeImage(targetImage, maxProcessingSize);

        const sourceCtx = sourceCanvas.getContext('2d');
        const targetCtx = targetCanvas.getContext('2d');

        const sourceImageData = sourceCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
        const targetImageData = targetCtx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);

        showStatus('Applying color transfer algorithm...', 'processing');

        cachedSourceImageData = sourceImageData;
        cachedTargetImageData = targetImageData;

        const options = getTransferOptions();
        let result;

        result = colorTransfer.transferColors(sourceImageData, targetImageData, options);

        updateMethodHint(result);

        displayResults(sourceImageData, targetImageData, result);
        showStatus('Color transfer completed successfully!', 'success');

    } catch (error) {
        console.error('Error processing images:', error);
        showStatus('An error occurred while processing the images. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

function resizeImage(img, maxSize) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    let { width, height } = img;

    if (width > height) {
        if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
        }
    } else {
        if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
        }
    }

    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    ctx.drawImage(img, 0, 0, width, height);

    return canvas;
}

function displayResults(sourceData, targetData, result) {
    adjustmentPreviewBaseImageData = null;
    originalResultData = result.imageData;
    currentAdjustedResultData = result.imageData;
    imageAdjustments.setOriginalImageData(result.imageData);

    displayImageData(originalCanvas, sourceData);
    displayImageData(referenceCanvas, targetData);
    displayImageData(resultCanvas, result.imageData);
    updateComparisonViews();

    generateColorAnalysisVisualization(sourceData, targetData, result.imageData);

    adjustmentsSection.style.display = 'block';

    setActiveDashboardWindow('windowThreeUp', { forceVisible: true });
    setActiveToolLayer('layerTransfer');

    if (uploadSection) {
        uploadSection.style.display = 'none';
    }

    resultsSection.style.display = 'block';
    if (shouldAutoScrollToResults) {
        shouldAutoScrollToResults = false;
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function updateComparisonViews() {
    const compareOriginalResultBottom = document.getElementById('compareOriginalResultBottom');
    const compareOriginalResultTop = document.getElementById('compareOriginalResultTop');
    const compareOriginalResultSlider = document.getElementById('compareOriginalResultSlider');
    const compareReferenceResultBottom = document.getElementById('compareReferenceResultBottom');
    const compareReferenceResultTop = document.getElementById('compareReferenceResultTop');
    const compareReferenceResultSlider = document.getElementById('compareReferenceResultSlider');

    if (document.getElementById('windowOrigVsResult')?.classList.contains('active') && compareOriginalResultSlider && compareOriginalResultBottom) {
        redrawComparison(
            compareOriginalResultBottom,
            compareOriginalResultTop,
            originalCanvas,
            resultCanvas,
            parseInt(compareOriginalResultSlider.value, 10)
        );
    }

    if (document.getElementById('windowRefVsResult')?.classList.contains('active') && compareReferenceResultSlider && compareReferenceResultBottom) {
        redrawComparison(
            compareReferenceResultBottom,
            compareReferenceResultTop,
            referenceCanvas,
            resultCanvas,
            parseInt(compareReferenceResultSlider.value, 10)
        );
    }
}

function redrawComparison(bottomCanvas, topCanvas, leftCanvas, rightCanvas, splitPercent) {
    if (!leftCanvas.width || !rightCanvas.width) return;

    const width = Math.max(leftCanvas.width, rightCanvas.width);
    const height = Math.max(leftCanvas.height, rightCanvas.height);

    bottomCanvas.width = width;
    bottomCanvas.height = height;
    topCanvas.width = width;
    topCanvas.height = height;

    const bottomCtx = bottomCanvas.getContext('2d');
    const topCtx = topCanvas.getContext('2d');
    bottomCtx.clearRect(0, 0, width, height);
    topCtx.clearRect(0, 0, width, height);

    const drawContained = (ctx, sourceCanvas) => {
        const scale = Math.min(width / sourceCanvas.width, height / sourceCanvas.height);
        const drawW = Math.max(1, Math.round(sourceCanvas.width * scale));
        const drawH = Math.max(1, Math.round(sourceCanvas.height * scale));
        const dx = Math.round((width - drawW) / 2);
        const dy = Math.round((height - drawH) / 2);
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg-tertiary') || '#f4f4f5';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(sourceCanvas, dx, dy, drawW, drawH);
    };

    drawContained(bottomCtx, leftCanvas);
    drawContained(topCtx, rightCanvas);

    topCanvas.style.clipPath = `inset(0 0 0 ${splitPercent}%)`;
}

function displayImageData(canvas, imageData) {
    const displayMode = performanceMode ? performanceMode.value : 'balanced';
    const MAX_DISPLAY = displayMode === 'fast' ? 960 : displayMode === 'quality' ? 1320 : 1120;
    const panel = canvas.closest('.result-item, .comparison-stage');
    const targetWidth = Math.max(240, Math.min(MAX_DISPLAY, Math.round(panel?.clientWidth || imageData.width)));
    const targetHeight = Math.max(180, Math.min(420, Math.round((panel?.clientHeight || targetWidth * 0.66) - 24)));
    let w = targetWidth;
    let h = targetHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    displayScratchCanvas.width = imageData.width;
    displayScratchCanvas.height = imageData.height;
    displayScratchCanvas.getContext('2d').putImageData(imageData, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const scale = Math.min(w / imageData.width, h / imageData.height);
    const drawW = Math.max(1, Math.round(imageData.width * scale));
    const drawH = Math.max(1, Math.round(imageData.height * scale));
    const dx = Math.round((w - drawW) / 2);
    const dy = Math.round((h - drawH) / 2);
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg-tertiary') || '#f4f4f5';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(displayScratchCanvas, dx, dy, drawW, drawH);
}

function hideResults() {
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }
    adjustmentsSection.style.display = 'none';
    originalResultData = null;
    currentAdjustedResultData = null;
    cachedSourceImageData = null;
    cachedTargetImageData = null;
    adjustmentPreviewBaseImageData = null;
    if (adjustmentFrame) cancelAnimationFrame(adjustmentFrame);
    if (analysisFrame) cancelAnimationFrame(analysisFrame);
    clearTimeout(analysisUpdateTimer);
    clearTimeout(strengthDebounceTimer);
    clearTimeout(interactiveAdjustTimer);
    adjustmentFrame = null;
    analysisFrame = null;
    isInteractiveAdjusting = false;
    imageAdjustments.resetAdjustments();
}

function downloadResult() {
    const link = document.createElement('a');
    link.download = 'chromamatch-result.png';
    link.href = resultCanvas.toDataURL();
    link.click();
}

async function quickExportResult() {
    if (!resultCanvas) {
        showStatus('No processed image available for export.', 'error');
        return;
    }

    try {
        const result = await exportManager.quickExport(resultCanvas, 'chromamatch-quick', {
            format: 'jpeg',
            quality: 0.85,
            maxDimension: 2048,
            showProgress: true
        });

        showStatus(`Quick export completed: ${result.filename}`, 'success');
    } catch (error) {
        console.error('Quick export error:', error);
        showStatus(`Quick export failed: ${error.message}`, 'error');
    }
}

function showFullExportDialog() {
    if (!resultCanvas) {
        showStatus('No processed image available for export.', 'error');
        return;
    }

    const exportFormat = document.getElementById('exportFormat');
    const exportQuality = document.getElementById('exportQuality');
    const exportResolution = document.getElementById('exportResolution');
    const qualityGroup = document.getElementById('qualityGroup');
    const customSizeGroup = document.getElementById('customSizeGroup');

    if (exportFormat) exportFormat.value = 'png';
    if (exportQuality) exportQuality.value = '0.95';
    if (exportResolution) exportResolution.value = 'original';

    if (qualityGroup) qualityGroup.style.display = 'none';
    if (customSizeGroup) customSizeGroup.style.display = 'none';

    document.getElementById('fullExportModal').style.display = 'flex';
}

function closeFullExportDialog() {
    document.getElementById('fullExportModal').style.display = 'none';
}

async function executeFullExport() {
    if (!resultCanvas) {
        showStatus('No processed image available for export.', 'error');
        return;
    }

    const settings = {
        filename: document.getElementById('exportFilename')?.value || 'chromamatch-full-quality',
        format: document.getElementById('exportFormat')?.value || 'png',
        quality: parseFloat(document.getElementById('exportQuality')?.value || '0.95'),
        resolution: document.getElementById('exportResolution')?.value || 'original'
    };

    try {
        closeFullExportDialog();
        const result = await exportManager.fullQualityExport(resultCanvas, settings);
        showStatus(`Full quality export completed: ${result.filename}`, 'success');
    } catch (error) {
        console.error('Full quality export error:', error);
        showStatus(`Full quality export failed: ${error.message}`, 'error');
    }
}

function generateColorAnalysisVisualization(sourceData, targetData, resultData) {
    showStatus('Generating color analysis...', 'processing');
    clearTimeout(analysisUpdateTimer);
    analysisUpdateTimer = setTimeout(() => {
        try {
            const originalAnalysis = colorAnalysis.analyzeImage(sourceData, 'Original Image');
            const referenceAnalysis = colorAnalysis.analyzeImage(targetData, 'Reference Image');
            const resultAnalysis = colorAnalysis.analyzeImage(resultData, 'Result Image');

            const container = document.getElementById('colorVisualizationContainer');

            colorAnalysis.createComprehensiveVisualization(
                originalAnalysis,
                referenceAnalysis,
                resultAnalysis,
                container
            );

            showStatus('Color analysis completed!', 'success');

        } catch (error) {
            console.error('Color analysis error:', error);
            showStatus('Error generating color analysis.', 'error');
        }
    }, 60);
}

function setupDragAndDrop() {
    const uploadBoxes = document.querySelectorAll('.upload-box');

    uploadBoxes.forEach(box => {
        box.addEventListener('dragover', (e) => {
            e.preventDefault();
            box.style.borderColor = '#667eea';
            box.style.backgroundColor = '#f8f9ff';
        });

        box.addEventListener('dragleave', (e) => {
            e.preventDefault();
            box.style.borderColor = '#ddd';
            box.style.backgroundColor = '';
        });

        box.addEventListener('drop', (e) => {
            e.preventDefault();
            box.style.borderColor = '#ddd';
            box.style.backgroundColor = '';

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const type = box.id === 'sourceUpload' ? 'source' : 'target';
                const input = type === 'source' ? sourceInput : targetInput;
                input.files = files;
                handleImageUpload({ target: input }, type);
            }
        });
    });
}

function updateAdjustment(adjustmentType, value) {
    const numValue = parseInt(value);

    const valueElement = document.getElementById(`${adjustmentType}Value`);
    if (valueElement) {
        valueElement.textContent = numValue;
    }

    imageAdjustments.updateAdjustments({ [adjustmentType]: numValue });

    if (originalResultData) {
        markInteractiveAdjustment();
        scheduleAdjustmentPreview();
    }
}

function updateWheelAdjustment(wheelType, value) {
    const numeric = parseInt(value, 10);
    const valueEl = document.getElementById(`${wheelType}WheelAmountValue`);
    if (valueEl) valueEl.textContent = numeric;
    imageAdjustments.updateAdjustments({ [`${wheelType}WheelAmount`]: numeric });
    if (originalResultData) {
        markInteractiveAdjustment();
        scheduleAdjustmentPreview();
    }
}

function updateWheelColor(wheelType) {
    const colorEl = document.getElementById(`${wheelType}WheelColor`);
    imageAdjustments.updateAdjustments({ [`${wheelType}WheelColor`]: colorEl?.value || '#ffffff' });
    drawColorWheel(wheelType);
    if (originalResultData) {
        markInteractiveAdjustment();
        scheduleAdjustmentPreview();
    }
}

function hexToHsv(hex) {
    const safe = (hex || '#ffffff').replace('#', '');
    const expanded = safe.length === 3 ? safe.split('').map((char) => char + char).join('') : safe;
    const num = parseInt(expanded, 16);
    let r = ((num >> 16) & 255) / 255;
    let g = ((num >> 8) & 255) / 255;
    let b = (num & 255) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;
    if (d !== 0) {
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            default: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h, s, v };
}

function hsvToHex(h, s, v) {
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    let r = 0; let g = 0; let b = 0;
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        default: r = v; g = p; b = q; break;
    }
    return `#${[r, g, b].map((channel) => Math.round(channel * 255).toString(16).padStart(2, '0')).join('')}`;
}

function getWheelCanvas(wheelType) {
    return {
        shadow: shadowWheelCanvas,
        midtone: midtoneWheelCanvas,
        highlight: highlightWheelCanvas
    }[wheelType];
}

function drawColorWheel(wheelType) {
    const canvas = getWheelCanvas(wheelType);
    const colorEl = document.getElementById(`${wheelType}WheelColor`);
    if (!canvas || !colorEl) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 6;
    const image = ctx.createImageData(width, height);
    const data = image.data;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dx = x - centerX;
            const dy = y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const idx = (y * width + x) * 4;
            if (dist > radius) {
                data[idx + 3] = 0;
                continue;
            }
            const hue = ((Math.atan2(dy, dx) / (Math.PI * 2)) + 1) % 1;
            const sat = Math.min(1, dist / radius);
            const hex = hsvToHex(hue, sat, 1);
            data[idx] = parseInt(hex.slice(1, 3), 16);
            data[idx + 1] = parseInt(hex.slice(3, 5), 16);
            data[idx + 2] = parseInt(hex.slice(5, 7), 16);
            data[idx + 3] = 255;
        }
    }
    ctx.putImageData(image, 0, 0);

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const { h, s } = hexToHsv(colorEl.value);
    const angle = h * Math.PI * 2;
    const handleRadius = Math.max(0, Math.min(radius, s * radius));
    const handleX = centerX + Math.cos(angle) * handleRadius;
    const handleY = centerY + Math.sin(angle) * handleRadius;
    ctx.beginPath();
    ctx.arc(handleX, handleY, 7, 0, Math.PI * 2);
    ctx.fillStyle = colorEl.value;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.restore();
}

function setWheelColorFromPoint(wheelType, clientX, clientY) {
    const canvas = getWheelCanvas(wheelType);
    const colorEl = document.getElementById(`${wheelType}WheelColor`);
    if (!canvas || !colorEl) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const dx = x - centerX;
    const dy = y - centerY;
    const radius = Math.min(canvas.width, canvas.height) / 2 - 6;
    const distance = Math.min(radius, Math.sqrt(dx * dx + dy * dy));
    const hue = ((Math.atan2(dy, dx) / (Math.PI * 2)) + 1) % 1;
    const sat = Math.min(1, distance / radius);
    colorEl.value = hsvToHex(hue, sat, 1);
    updateWheelColor(wheelType);
}

function setupColorWheels() {
    const wheelTypes = ['shadow', 'midtone', 'highlight'];
    let activeWheel = null;

    wheelTypes.forEach((wheelType) => {
        drawColorWheel(wheelType);
        const canvas = getWheelCanvas(wheelType);
        canvas?.addEventListener('mousedown', (event) => {
            activeWheel = wheelType;
            setWheelColorFromPoint(wheelType, event.clientX, event.clientY);
        });
    });

    window.addEventListener('mousemove', (event) => {
        if (!activeWheel) return;
        setWheelColorFromPoint(activeWheel, event.clientX, event.clientY);
    });

    window.addEventListener('mouseup', () => {
        activeWheel = null;
    });

    document.querySelectorAll('[data-wheel-reset]').forEach((button) => {
        button.addEventListener('click', () => {
            const wheelType = button.dataset.wheelReset;
            const colorEl = document.getElementById(`${wheelType}WheelColor`);
            if (colorEl) colorEl.value = wheelDefaults[wheelType];
            const amountEl = document.getElementById(`${wheelType}WheelAmount`);
            const amountValueEl = document.getElementById(`${wheelType}WheelAmountValue`);
            if (amountEl) amountEl.value = 0;
            if (amountValueEl) amountValueEl.textContent = '0';
            imageAdjustments.updateAdjustments({
                [`${wheelType}WheelAmount`]: 0,
                [`${wheelType}WheelColor`]: wheelDefaults[wheelType]
            });
            drawColorWheel(wheelType);
            if (originalResultData) scheduleAdjustmentPreview();
        });
    });
}

function drawCurvesEditor() {
    if (!curvesCanvas) return;
    const ctx = curvesCanvas.getContext('2d');
    const width = curvesCanvas.width;
    const height = curvesCanvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(127,127,127,0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const x = (width / 4) * i;
        const y = (height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(200,200,200,0.5)';
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, 0);
    ctx.stroke();

    const points = imageAdjustments.getCurvePoints();
    ctx.strokeStyle = '#6f86ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let step = 0; step <= 128; step++) {
        const xNorm = step / 128;
        const yNorm = imageAdjustments.applyCurveValue(xNorm);
        const x = xNorm * width;
        const y = height - yNorm * height;
        if (step === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    points.forEach((point, index) => {
        const x = point.x * width;
        const y = height - point.y * height;
        ctx.fillStyle = index === 0 || index === points.length - 1 ? '#9aa4b8' : '#6f86ff';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
    });
}

function getCurvePointAt(clientX, clientY) {
    if (!curvesCanvas) return -1;
    const rect = curvesCanvas.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = 1 - ((clientY - rect.top) / rect.height);
    const points = imageAdjustments.getCurvePoints();
    return points.findIndex((point, index) => (
        Math.abs(point.x - x) < 0.05 && Math.abs(point.y - y) < 0.07 && index > 0 && index < points.length - 1
    ));
}

function setupCurvesEditor() {
    if (!curvesCanvas || curvesCanvas.dataset.bound === 'true') return;
    curvesCanvas.dataset.bound = 'true';
    drawCurvesEditor();
    let dragIndex = -1;
    curvesCanvas.addEventListener('mousedown', (event) => {
        dragIndex = getCurvePointAt(event.clientX, event.clientY);
        if (dragIndex >= 0) return;
        const rect = curvesCanvas.getBoundingClientRect();
        const x = Math.max(0.05, Math.min(0.95, (event.clientX - rect.left) / rect.width));
        const y = Math.max(0.02, Math.min(0.98, 1 - ((event.clientY - rect.top) / rect.height)));
        dragIndex = imageAdjustments.addCurvePoint(x, y);
        drawCurvesEditor();
        if (originalResultData) scheduleAdjustmentPreview();
    });
    window.addEventListener('mousemove', (event) => {
        if (dragIndex < 0) return;
        const rect = curvesCanvas.getBoundingClientRect();
        const x = Math.max(0.08, Math.min(0.92, (event.clientX - rect.left) / rect.width));
        const y = Math.max(0.02, Math.min(0.98, 1 - ((event.clientY - rect.top) / rect.height)));
        imageAdjustments.updateCurvePoint(dragIndex, x, y);
        drawCurvesEditor();
        if (originalResultData) scheduleAdjustmentPreview();
    });
    window.addEventListener('mouseup', () => {
        dragIndex = -1;
    });
    curvesCanvas.addEventListener('dblclick', (event) => {
        const index = getCurvePointAt(event.clientX, event.clientY);
        if (index < 0) return;
        imageAdjustments.removeCurvePoint(index);
        drawCurvesEditor();
        if (originalResultData) scheduleAdjustmentPreview();
    });
}

function resetCurves() {
    imageAdjustments.resetCurvePoints();
    drawCurvesEditor();
    if (originalResultData) {
        markInteractiveAdjustment();
        scheduleAdjustmentPreview();
    }
}

function markInteractiveAdjustment() {
    isInteractiveAdjusting = true;
    clearTimeout(interactiveAdjustTimer);
    interactiveAdjustTimer = setTimeout(() => {
        isInteractiveAdjusting = false;
        adjustmentPreviewBaseImageData = null;
        scheduleAdjustmentPreview(true);
    }, 140);
}

function getAdjustmentPreviewSource() {
    if (!originalResultData) return null;
    if (!isInteractiveAdjusting) return originalResultData;
    if (adjustmentPreviewBaseImageData) return adjustmentPreviewBaseImageData;

    const mode = performanceMode ? performanceMode.value : 'balanced';
    const maxSize = mode === 'fast' ? 720 : mode === 'quality' ? 1280 : 960;
    if (originalResultData.width <= maxSize && originalResultData.height <= maxSize) {
        adjustmentPreviewBaseImageData = originalResultData;
        return adjustmentPreviewBaseImageData;
    }

    const scale = maxSize / Math.max(originalResultData.width, originalResultData.height);
    const w = Math.max(1, Math.round(originalResultData.width * scale));
    const h = Math.max(1, Math.round(originalResultData.height * scale));
    displayScratchCanvas.width = originalResultData.width;
    displayScratchCanvas.height = originalResultData.height;
    displayScratchCanvas.getContext('2d').putImageData(originalResultData, 0, 0);
    analysisScratchCanvas.width = w;
    analysisScratchCanvas.height = h;
    const ctx = analysisScratchCanvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(displayScratchCanvas, 0, 0, w, h);
    adjustmentPreviewBaseImageData = ctx.getImageData(0, 0, w, h);
    return adjustmentPreviewBaseImageData;
}

function applyAdjustmentsRealTime(forceFullResolution = false) {
    if (!originalResultData) return;

    const sourceImageData = forceFullResolution ? originalResultData : getAdjustmentPreviewSource();
    const originalBase = imageAdjustments.originalImageData;
    if (sourceImageData && sourceImageData !== originalBase) {
        imageAdjustments.setOriginalImageData(sourceImageData);
    }
    const adjustedImageData = imageAdjustments.applyAllAdjustments();
    if (originalBase && imageAdjustments.originalImageData !== originalBase) {
        imageAdjustments.setOriginalImageData(originalBase);
    }
    if (adjustedImageData) {
        currentAdjustedResultData = adjustedImageData;
        displayImageData(resultCanvas, adjustedImageData);
        updateComparisonViews();
        if (!isInteractiveAdjusting || forceFullResolution) {
            scheduleAnalysisUpdate();
        }
    }
}

function scheduleAdjustmentPreview(forceFullResolution = false) {
    if (adjustmentFrame) {
        cancelAnimationFrame(adjustmentFrame);
    }

    adjustmentFrame = requestAnimationFrame(() => {
        adjustmentFrame = null;
        applyAdjustmentsRealTime(forceFullResolution);
    });
}

function reapplyTransfer() {
    if (!cachedSourceImageData || !cachedTargetImageData) return;

    const result = colorTransfer.transferColors(cachedSourceImageData, cachedTargetImageData, getTransferOptions());
    updateMethodHint(result);
    originalResultData = result.imageData;
    imageAdjustments.setOriginalImageData(result.imageData);
    applyAdjustmentsRealTime();
}

function scheduleAnalysisUpdate() {
    clearTimeout(analysisUpdateTimer);
    if (analysisFrame) cancelAnimationFrame(analysisFrame);
    analysisUpdateTimer = setTimeout(() => {
        analysisFrame = requestAnimationFrame(() => {
            analysisFrame = null;
            updateLiveAnalysis();
        });
    }, 180);
}

function updateLiveAnalysis() {
    if (!currentAdjustedResultData || !colorAnalysis.cachedRefAnalysis) return;

    const mode = performanceMode ? performanceMode.value : 'balanced';
    const maxSize = mode === 'fast' ? 280 : mode === 'quality' ? 460 : 360;
    let imageData = currentAdjustedResultData;

    if (currentAdjustedResultData.width > maxSize || currentAdjustedResultData.height > maxSize) {
        const scale = maxSize / Math.max(currentAdjustedResultData.width, currentAdjustedResultData.height);
        const w = Math.round(currentAdjustedResultData.width * scale);
        const h = Math.round(currentAdjustedResultData.height * scale);
        analysisScratchCanvas.width = w;
        analysisScratchCanvas.height = h;
        const scratchCtx = analysisScratchCanvas.getContext('2d');
        displayScratchCanvas.width = currentAdjustedResultData.width;
        displayScratchCanvas.height = currentAdjustedResultData.height;
        displayScratchCanvas.getContext('2d').putImageData(currentAdjustedResultData, 0, 0);
        scratchCtx.clearRect(0, 0, w, h);
        scratchCtx.drawImage(displayScratchCanvas, 0, 0, w, h);
        imageData = scratchCtx.getImageData(0, 0, w, h);
    }

    colorAnalysis.updateResultVisualization(imageData);
}

function updateStrength(value) {
    strengthValue.textContent = parseInt(value);
    clearTimeout(strengthDebounceTimer);
    strengthDebounceTimer = setTimeout(reapplyTransfer, 120);
}

function resetAdjustments() {
    imageAdjustments.resetAdjustments();

    temperatureSlider.value = 0;
    tintSlider.value = 0;
    exposureSlider.value = 0;
    contrastSlider.value = 0;
    highlightsSlider.value = 0;
    shadowsSlider.value = 0;
    whitesSlider.value = 0;
    blacksSlider.value = 0;
    saturationSlider.value = 0;
    strengthSlider.value = 100;

    temperatureValue.textContent = '0';
    tintValue.textContent = '0';
    exposureValue.textContent = '0';
    contrastValue.textContent = '0';
    highlightsValue.textContent = '0';
    shadowsValue.textContent = '0';
    whitesValue.textContent = '0';
    blacksValue.textContent = '0';
    saturationValue.textContent = '0';
    strengthValue.textContent = '100';
    if (shadowWheelAmount) shadowWheelAmount.value = 0;
    if (midtoneWheelAmount) midtoneWheelAmount.value = 0;
    if (highlightWheelAmount) highlightWheelAmount.value = 0;
    if (shadowWheelAmountValue) shadowWheelAmountValue.textContent = '0';
    if (midtoneWheelAmountValue) midtoneWheelAmountValue.textContent = '0';
    if (highlightWheelAmountValue) highlightWheelAmountValue.textContent = '0';
    if (shadowWheelColor) shadowWheelColor.value = '#3a6cff';
    if (midtoneWheelColor) midtoneWheelColor.value = '#ffffff';
    if (highlightWheelColor) highlightWheelColor.value = '#ffb347';
    resetCurves();
    drawColorWheel('shadow');
    drawColorWheel('midtone');
    drawColorWheel('highlight');

    if (cachedSourceImageData) {
        reapplyTransfer();
    }
}

// Reference Popup System
function openReferencePopup() {
    closeAllModals();
    document.getElementById('refPopup').style.display = 'flex';
    setupRefPopupEvents();
}

function closeReferencePopup() {
    document.getElementById('refPopup').style.display = 'none';
}

function setupRefPopupEvents() {
    const searchInput = document.getElementById('refPopupSearchInput');
    const searchBtn = document.getElementById('refPopupDoSearch');
    const sourceSelect = document.getElementById('refPopupSourceSelect');
    const chips = document.querySelectorAll('.ref-popup-chips button');
    const tabs = document.querySelectorAll('.ref-tab-btn');
    
    searchBtn.onclick = () => doRefPopupSearch();
    searchInput.onkeypress = (e) => { if (e.key === 'Enter') doRefPopupSearch(); };
    if (sourceSelect && !sourceSelect.dataset.bound) {
        sourceSelect.dataset.bound = 'true';
        sourceSelect.addEventListener('change', updateReferenceModeHint);
        updateReferenceModeHint();
    }
    
    chips.forEach(ch => {
        ch.onclick = () => { searchInput.value = ch.dataset.search; doRefPopupSearch(); };
    });
    
    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.ref-panel').forEach(p => p.style.display = 'none');
            const panel = document.getElementById(tab.dataset.panel);
            if (panel) panel.style.display = 'block';
        };
    });
    
    document.getElementById('refAiSend').onclick = sendRefAiMessage;
    document.getElementById('refAiInput').onkeypress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendRefAiMessage(); }
    };
    
    document.querySelectorAll('.ref-ai-quick-chips button').forEach(btn => {
        btn.onclick = () => {
            document.getElementById('refAiInput').value = btn.dataset.msg;
            sendRefAiMessage();
        };
    });
    
    const zone = document.getElementById('refUploadZone');
    if (zone && !zone._dropSetup) {
        zone._dropSetup = true;
        zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('dragover');
            const f = e.dataTransfer?.files?.[0];
            if (f) handleRefFile(f);
        });
    }
}

function updateReferenceModeHint() {
    const mode = document.getElementById('refPopupSourceSelect')?.value || 'ai';
    const hint = document.getElementById('refSourceHint');
    if (!hint) return;

    const text = {
        ai: 'AI expands fuzzy descriptions and searches across the best sources.',
        cinema: 'Bias toward film stills, widescreen frames, and cinematography references.',
        photo: 'Bias toward strong photographic lighting, palette, and environment references.',
        archive: 'Bias toward literal documentary and archival imagery with less stylization.'
    }[mode] || '';

    hint.textContent = text;
}

function summarizeReferenceClassification(classification) {
    if (!classification) return '';
    const facets = classification.facets || {};
    const parts = [
        ...(facets.colors || []).slice(0, 2),
        ...(facets.subjects || []).slice(0, 2),
        ...(facets.techniques || []).slice(0, 2),
        ...Object.values(facets.taxonomy || {}).flat().slice(0, 2)
    ].filter(Boolean);

    const labelMap = {
        film: 'Film match',
        'film-keyword': 'Cinema search',
        style: 'Style search',
        descriptive: 'Visual search',
        keyword: 'Keyword search'
    };

    const label = labelMap[classification.type] || 'Search';
    return parts.length ? `${label}: ${parts.join(' • ')}` : label;
}

async function doRefPopupSearch() {
    const query = document.getElementById('refPopupSearchInput')?.value?.trim();
    if (!query) return;
    
    const source = document.getElementById('refPopupSourceSelect')?.value || 'ai';
    const container = document.getElementById('refPopupResults');
    const grid = document.getElementById('refPopupGrid');
    
    const oldBanner = container.querySelector('.film-match-banner, .desc-banner');
    if (oldBanner) oldBanner.remove();
    
    grid.innerHTML = '<div class="loading">Searching...</div>';
    container.style.display = 'block';
    rememberSearchQuery(query, { source });
    
    try {
        let result;
        const aiSearchPrompt = buildReferenceSearchContext(query);
        const aiProvider = getSelectedAiProvider() || unifiedSession.routeTask('chat', aiSearchPrompt);
        const aiKey = getAIKey(aiProvider);
        const aiModel = getAIChatModel(aiProvider);
        const aiBaseUrl = getAIBaseUrl(aiProvider);
        
        const modeSources = searchService.resolveMode(source);

        if (aiKey && source === 'ai') {
            result = await searchService.aiDrivenSearch(query, {
                provider: aiProvider,
                apiKey: aiKey,
                model: aiModel,
                baseUrl: aiBaseUrl,
                contextHint: aiSearchPrompt,
                sources: modeSources
            });
        } else {
            result = await searchService.smartSearch(query, modeSources);
        }
        
        const existingBanner = container.querySelector('.film-match-banner, .desc-banner');
        if (existingBanner) existingBanner.remove();
        
        if (result.filmMatch) {
            const banner = document.createElement('div');
            banner.className = 'film-match-banner';
            banner.textContent = `${result.filmMatch.title} (${result.filmMatch.year}) \u2014 Dir: ${result.filmMatch.director} \u2014 DP: ${result.filmMatch.dp} \u2014 ${result.filmMatch.keywords}`;
            container.insertBefore(banner, grid);
        } else if (result.classification?.type === 'descriptive' || result.classification?.type === 'style' || result.classification?.type === 'film-keyword') {
            const banner = document.createElement('div');
            banner.className = 'desc-banner';
            banner.textContent = summarizeReferenceClassification(result.classification);
            container.insertBefore(banner, grid);
        }
        
        if (!result.results || !result.results.length) {
            grid.innerHTML = '<div class="no-results">No results found. Try simplifying your search, using a film title, director name, or style keywords like "teal orange cinematic".</div>';
            return;
        }
        
        grid.innerHTML = result.results.map(img => `
            <div class="reference-result-card" data-url="${img.url}" data-thumb="${img.thumbnail}">
                <img src="${img.thumbnail}" alt="${img.description || 'Reference'}" loading="lazy" />
                <div class="result-overlay"><span class="result-source">${img.source}</span></div>
            </div>
        `).join('');
        grid.querySelectorAll('.reference-result-card').forEach(card => {
            card.addEventListener('click', () => openReferenceResultPreview(card));
        });
    } catch (e) {
        console.error('Search error:', e);
        grid.innerHTML = '<div class="error-message">Search failed. Check the browser console for details.</div>';
    }
}

function openReferenceResultPreview(card) {
    const url = card.dataset.url;
    const title = card.querySelector('img')?.alt || 'Reference Preview';
    openImagePreview(url, {
        title,
        actionLabel: 'Use as Reference',
        onAction: () => {
            loadRefPopupImage(card);
            closeImagePreview();
        }
    });
}

function loadRefPopupImage(card) {
    const url = card.dataset.url;
    showStatus('Loading reference image...', 'processing');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        c.getContext('2d').drawImage(img, 0, 0);
        try {
            const id = c.getContext('2d').getImageData(0, 0, c.width, c.height);
            setRefImageData(id);
            closeReferencePopup();
        } catch (e) { showError('CORS error. Try upload instead.'); }
    };
    img.onerror = () => showError('Failed to load. Try another image.');
    img.src = url;
}

function setRefImageData(imageData) {
    const c = document.createElement('canvas');
    c.width = imageData.width; c.height = imageData.height;
    c.getContext('2d').putImageData(imageData, 0, 0);
    const dataUrl = c.toDataURL();
    currentReferenceDataUrl = dataUrl;
    cachedTargetImageData = imageData;
    rememberReferenceSelection({
        width: imageData.width,
        height: imageData.height,
        referenceDataUrl: dataUrl.slice(0, 128)
    });
    targetImg.src = dataUrl;
    targetPreview.style.display = 'block';
    document.getElementById('targetUpload').classList.add('has-image');
    const session = touchActiveSession();
    if (session) {
        const existing = (session.references || []).find((reference) => reference.dataUrl === dataUrl);
        const referenceRecord = existing || {
            id: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            dataUrl,
            name: `Reference ${session.references.length + 1}`
        };
        session.references = [referenceRecord, ...(session.references || []).filter((reference) => reference.id !== referenceRecord.id)].slice(0, 12);
        session.activeReferenceIds = [referenceRecord.id];
        saveSessionLibrary();
        renderReferenceTray();
        renderReferenceRail();
        renderSessionHub();
    }
    
    const img = new Image();
    img.onload = () => {
        targetImage = img;
        updateProcessButton();
        if (cachedSourceImageData) processImages();
    };
    img.src = dataUrl;
    
    updateProcessButton();
    showStatus('Loaded!', 'success');
}

function handleRefFile(file) {
    if (!file.type.startsWith('image/')) { showError('Select an image file'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const c = document.createElement('canvas');
            c.width = img.width; c.height = img.height;
            c.getContext('2d').drawImage(img, 0, 0);
            setRefImageData(c.getContext('2d').getImageData(0, 0, c.width, c.height));
            closeReferencePopup();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// AI Unified Session
const unifiedSession = new UnifiedSession();

function getAIKey(provider) { return localStorage.getItem('ai_key_' + provider) || ''; }
function getAIBaseUrl(provider) { var c = PROVIDER_CONFIGS[provider]; return localStorage.getItem('ai_baseurl_' + provider) || (c && c.chatBaseUrl) || ''; }
function getAIChatModel(provider) {
    var customOverride = localStorage.getItem('ai_custom_chatmodel_' + provider) || '';
    return customOverride || localStorage.getItem('ai_chatmodel_' + provider) || (PROVIDER_CONFIGS[provider] && PROVIDER_CONFIGS[provider].chatModels[0] && PROVIDER_CONFIGS[provider].chatModels[0].value) || '';
}
function getAIImgModel(provider) {
    var customOverride = localStorage.getItem('ai_custom_imgmodel_' + provider) || '';
    return customOverride || localStorage.getItem('ai_imgmodel_' + provider) || (PROVIDER_CONFIGS[provider] && PROVIDER_CONFIGS[provider].imgModels[0] && PROVIDER_CONFIGS[provider].imgModels[0].value) || '';
}
const PROVIDER_REGISTRY_KEY = 'cm_provider_registry_v1';
const PROVIDER_MODEL_CACHE_KEY = 'cm_provider_model_cache_v1';
let providerEditorState = { editingId: null };

function readJsonStorage(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
        return fallback;
    }
}

function writeJsonStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getProviderModelCache() {
    return readJsonStorage(PROVIDER_MODEL_CACHE_KEY, {});
}

function setProviderModelCache(cache) {
    writeJsonStorage(PROVIDER_MODEL_CACHE_KEY, cache || {});
}

function buildProviderEntry(preset, overrides) {
    const config = PROVIDER_CONFIGS[preset] || {};
    const now = new Date().toISOString();
    return {
        id: 'provider_' + Math.random().toString(36).slice(2, 10),
        preset,
        displayName: config.label || preset,
        apiKey: '',
        baseUrl: config.chatBaseUrl || '',
        chatModel: config.chatModels?.[0]?.value || '',
        imgModel: config.imgModels?.[0]?.value || '',
        customChatModel: '',
        customImgModel: '',
        docsUrl: config.docsUrl || '',
        createdAt: now,
        updatedAt: now,
        ...(overrides || {})
    };
}

function syncLegacyProviderSettings(entries) {
    ['openai', 'gemini', 'deerapi', 'custom'].forEach((preset) => {
        const entry = entries.find((item) => item.preset === preset);
        const values = {
            ['ai_key_' + preset]: entry?.apiKey || '',
            ['ai_baseurl_' + preset]: entry?.baseUrl || (PROVIDER_CONFIGS[preset]?.chatBaseUrl || ''),
            ['ai_chatmodel_' + preset]: entry?.chatModel || (PROVIDER_CONFIGS[preset]?.chatModels?.[0]?.value || ''),
            ['ai_imgmodel_' + preset]: entry?.imgModel || (PROVIDER_CONFIGS[preset]?.imgModels?.[0]?.value || ''),
            ['ai_custom_chatmodel_' + preset]: entry?.customChatModel || '',
            ['ai_custom_imgmodel_' + preset]: entry?.customImgModel || ''
        };
        Object.entries(values).forEach(([key, value]) => {
            if (value) localStorage.setItem(key, value);
            else localStorage.removeItem(key);
        });
    });
}

function migrateLegacyProviderRegistry() {
    const entries = [];
    ['openai', 'gemini', 'deerapi', 'custom'].forEach((preset) => {
        const apiKey = localStorage.getItem('ai_key_' + preset) || '';
        const baseUrl = localStorage.getItem('ai_baseurl_' + preset) || (PROVIDER_CONFIGS[preset]?.chatBaseUrl || '');
        const chatModel = localStorage.getItem('ai_chatmodel_' + preset) || (PROVIDER_CONFIGS[preset]?.chatModels?.[0]?.value || '');
        const imgModel = localStorage.getItem('ai_imgmodel_' + preset) || (PROVIDER_CONFIGS[preset]?.imgModels?.[0]?.value || '');
        const customChatModel = localStorage.getItem('ai_custom_chatmodel_' + preset) || '';
        const customImgModel = localStorage.getItem('ai_custom_imgmodel_' + preset) || '';
        if (apiKey || baseUrl || chatModel || imgModel || customChatModel || customImgModel) {
            entries.push(buildProviderEntry(preset, {
                displayName: PROVIDER_CONFIGS[preset]?.label || preset,
                apiKey,
                baseUrl,
                chatModel,
                imgModel,
                customChatModel,
                customImgModel,
                docsUrl: PROVIDER_CONFIGS[preset]?.docsUrl || ''
            }));
        }
    });
    if (entries.length) {
        writeJsonStorage(PROVIDER_REGISTRY_KEY, entries);
    }
    return entries;
}

function getProviderRegistry() {
    const stored = readJsonStorage(PROVIDER_REGISTRY_KEY, null);
    return Array.isArray(stored) ? stored : migrateLegacyProviderRegistry();
}

function saveProviderRegistry(entries) {
    writeJsonStorage(PROVIDER_REGISTRY_KEY, entries);
    syncLegacyProviderSettings(entries);
}

function getProviderPresetOptions() {
    return Object.keys(PROVIDER_CONFIGS).map((preset) => ({
        value: preset,
        label: PROVIDER_CONFIGS[preset].label || preset
    }));
}

function maskKey(key) {
    if (!key) return 'Missing key';
    if (key.length <= 8) return 'Saved';
    return key.slice(0, 4) + '…' + key.slice(-4);
}

function getProviderStatus(entry) {
    if (!entry.apiKey) return 'Needs API key';
    if (entry.preset === 'custom' && !entry.baseUrl) return 'Needs base URL';
    return 'Ready';
}

function getMergedModelOptions(preset, kind, currentValue) {
    const configOptions = (kind === 'chat' ? PROVIDER_CONFIGS[preset]?.chatModels : PROVIDER_CONFIGS[preset]?.imgModels) || [];
    const cache = getProviderModelCache();
    const cachedOptions = cache[preset]?.[kind] || [];
    const map = new Map();
    [...configOptions, ...cachedOptions].forEach((item) => {
        if (!item?.value) return;
        map.set(item.value, { value: item.value, label: item.label || item.value });
    });
    if (currentValue && !map.has(currentValue)) {
        map.set(currentValue, { value: currentValue, label: currentValue + ' (current)' });
    }
    return Array.from(map.values());
}

function populateModelSelect(selectId, options, selectedValue) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = options.map((option) => `<option value="${option.value}">${option.label}</option>`).join('');
    select.value = selectedValue && options.some((option) => option.value === selectedValue)
        ? selectedValue
        : (options[0]?.value || '');
}

function renderProviderRegistryTable() {
    const tbody = document.getElementById('providerRegistryTableBody');
    if (!tbody) return;
    const entries = getProviderRegistry();
    if (!entries.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="table-muted">No providers added yet. Use “Add Provider” to start from a preset.</td></tr>';
        return;
    }
    tbody.innerHTML = entries.map((entry) => `
        <tr>
            <td>${entry.displayName || PROVIDER_CONFIGS[entry.preset]?.label || entry.preset}<div class="provider-subtle">${maskKey(entry.apiKey)}</div></td>
            <td>${PROVIDER_CONFIGS[entry.preset]?.label || entry.preset}</td>
            <td><span class="provider-status-chip ${getProviderStatus(entry) === 'Ready' ? 'ready' : 'pending'}">${getProviderStatus(entry)}</span></td>
            <td>${entry.customChatModel || entry.chatModel || '<span class="table-muted">Unset</span>'}</td>
            <td>${entry.customImgModel || entry.imgModel || '<span class="table-muted">Unset</span>'}</td>
            <td>${entry.baseUrl || '<span class="table-muted">Default</span>'}</td>
            <td>${entry.docsUrl ? `<a href="${entry.docsUrl}" target="_blank" rel="noopener noreferrer">Docs</a>` : '<span class="table-muted">Custom</span>'}</td>
            <td><button type="button" class="secondary-btn provider-edit-btn" data-provider-id="${entry.id}">Edit</button></td>
        </tr>
    `).join('');
    tbody.querySelectorAll('.provider-edit-btn').forEach((button) => {
        button.addEventListener('click', () => openProviderEditor(button.dataset.providerId));
    });
}

function getSelectablePresets(editingId) {
    const entries = getProviderRegistry();
    const editingEntry = entries.find((entry) => entry.id === editingId);
    const taken = new Set(entries.filter((entry) => entry.id !== editingId).map((entry) => entry.preset));
    return getProviderPresetOptions().filter((option) => !taken.has(option.value) || option.value === editingEntry?.preset);
}

function refreshProviderPresetSelect(editingId) {
    const select = document.getElementById('providerPresetSelect');
    if (!select) return;
    const options = getSelectablePresets(editingId);
    select.innerHTML = options.map((option) => `<option value="${option.value}">${option.label}</option>`).join('');
}

function updateProviderEditorModels(preset, entry) {
    populateModelSelect('providerChatModel', getMergedModelOptions(preset, 'chat', entry.chatModel), entry.chatModel);
    populateModelSelect('providerImgModel', getMergedModelOptions(preset, 'img', entry.imgModel), entry.imgModel);
}

function applyProviderPreset(preset, entry) {
    const config = PROVIDER_CONFIGS[preset] || {};
    const docsLink = document.getElementById('providerDocsLink');
    const hint = document.getElementById('providerEditorHint');
    const baseInput = document.getElementById('providerBaseUrl');
    if (docsLink) {
        docsLink.href = config.docsUrl || '#';
        docsLink.style.display = config.docsUrl ? 'inline-flex' : 'none';
    }
    if (hint) {
        hint.textContent = config.setupBlurb || 'Fill the required fields for this provider.';
    }
    if (baseInput && !providerEditorState.editingId && !baseInput.value) {
        baseInput.value = config.chatBaseUrl || '';
    }
    updateProviderEditorModels(preset, entry);
}

function closeProviderEditor() {
    providerEditorState.editingId = null;
    const card = document.getElementById('providerEditorCard');
    if (card) card.style.display = 'none';
}

function openProviderEditor(providerId) {
    const entries = getProviderRegistry();
    const editing = entries.find((entry) => entry.id === providerId) || null;
    providerEditorState.editingId = editing?.id || null;
    refreshProviderPresetSelect(providerEditorState.editingId);
    const selectablePresets = getSelectablePresets(providerEditorState.editingId);
    if (!editing && !selectablePresets.length) {
        showError('All built-in provider presets are already added. Edit an existing row instead.');
        return;
    }
    const preset = editing?.preset || document.getElementById('providerPresetSelect')?.value || selectablePresets?.[0]?.value || 'openai';
    const entry = editing || buildProviderEntry(preset);
    document.getElementById('providerEditorCard').style.display = 'block';
    document.getElementById('providerEditorTitle').textContent = editing ? 'Edit Provider' : 'Add Provider';
    document.getElementById('providerPresetSelect').value = preset;
    document.getElementById('providerDisplayName').value = entry.displayName || '';
    document.getElementById('providerApiKey').value = entry.apiKey || '';
    document.getElementById('providerBaseUrl').value = entry.baseUrl || '';
    document.getElementById('providerCustomChatModel').value = entry.customChatModel || '';
    document.getElementById('providerCustomImgModel').value = entry.customImgModel || '';
    document.getElementById('deleteProviderBtn').style.display = editing ? 'inline-flex' : 'none';
    applyProviderPreset(preset, entry);
}

function collectProviderEditorData() {
    const preset = document.getElementById('providerPresetSelect')?.value || 'openai';
    return {
        preset,
        displayName: document.getElementById('providerDisplayName')?.value?.trim() || (PROVIDER_CONFIGS[preset]?.label || preset),
        apiKey: document.getElementById('providerApiKey')?.value?.trim() || '',
        baseUrl: document.getElementById('providerBaseUrl')?.value?.trim() || (PROVIDER_CONFIGS[preset]?.chatBaseUrl || ''),
        chatModel: document.getElementById('providerChatModel')?.value || '',
        imgModel: document.getElementById('providerImgModel')?.value || '',
        customChatModel: document.getElementById('providerCustomChatModel')?.value?.trim() || '',
        customImgModel: document.getElementById('providerCustomImgModel')?.value?.trim() || '',
        docsUrl: PROVIDER_CONFIGS[preset]?.docsUrl || ''
    };
}

function saveProviderFromEditor() {
    const data = collectProviderEditorData();
    if (!data.apiKey) {
        showError('API key is required for a provider to be usable.');
        return;
    }
    if (data.preset === 'custom' && !data.baseUrl) {
        showError('Custom providers need a base URL.');
        return;
    }
    const entries = getProviderRegistry();
    const duplicate = entries.find((entry) => entry.preset === data.preset && entry.id !== providerEditorState.editingId);
    if (duplicate) {
        showError((PROVIDER_CONFIGS[data.preset]?.label || data.preset) + ' is already added. Edit the existing row instead.');
        return;
    }
    if (providerEditorState.editingId) {
        const index = entries.findIndex((entry) => entry.id === providerEditorState.editingId);
        if (index >= 0) entries[index] = { ...entries[index], ...data, updatedAt: new Date().toISOString() };
    } else {
        entries.push(buildProviderEntry(data.preset, data));
    }
    saveProviderRegistry(entries);
    renderProviderRegistryTable();
    showStatus('Provider saved.', 'success');
    closeProviderEditor();
}

function deleteProviderFromEditor() {
    if (!providerEditorState.editingId) return;
    const entries = getProviderRegistry().filter((entry) => entry.id !== providerEditorState.editingId);
    saveProviderRegistry(entries);
    renderProviderRegistryTable();
    showStatus('Provider removed.', 'success');
    closeProviderEditor();
}

function classifyRemoteModels(provider, modelIds) {
    const chat = [];
    const img = [];
    modelIds.forEach((modelId) => {
        const lower = modelId.toLowerCase();
        const option = { value: modelId, label: modelId };
        if (/image|imagen|vision-image|dall-e|gpt-image/.test(lower)) img.push(option);
        else if (!/embed|embedding|tts|transcrib|speech|rerank/.test(lower)) chat.push(option);
    });
    return {
        chat: chat.length ? chat : getMergedModelOptions(provider, 'chat'),
        img: img.length ? img : getMergedModelOptions(provider, 'img')
    };
}

async function refreshProviderModels() {
    const data = collectProviderEditorData();
    if (!data.apiKey) {
        showError('Add an API key first so the app can ask the provider for its model list.');
        return;
    }
    const baseUrl = (data.baseUrl || PROVIDER_CONFIGS[data.preset]?.chatBaseUrl || '').replace(/\/+$/, '');
    if (!baseUrl) {
        showError('This provider needs a base URL before models can be refreshed.');
        return;
    }
    try {
        let modelIds = [];
        if (data.preset === 'gemini') {
            const response = await fetch(baseUrl + '/models?key=' + encodeURIComponent(data.apiKey));
            const payload = await response.json();
            if (!response.ok) throw new Error(payload?.error?.message || 'Failed to load Gemini models');
            modelIds = (payload.models || []).map((model) => String(model.name || '').replace(/^models\//, '')).filter(Boolean);
        } else {
            const response = await fetch(baseUrl + '/models', {
                headers: { Authorization: 'Bearer ' + data.apiKey }
            });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload?.error?.message || 'Failed to load models');
            modelIds = (payload.data || []).map((model) => model.id).filter(Boolean);
        }
        const cache = getProviderModelCache();
        cache[data.preset] = classifyRemoteModels(data.preset, modelIds);
        setProviderModelCache(cache);
        applyProviderPreset(data.preset, { ...data });
        showStatus('Model list refreshed.', 'success');
    } catch (error) {
        showError('Could not refresh models: ' + error.message);
    }
}

function initSettingsUi() {
    if (document.body.dataset.settingsUiReady === 'true') return;
    document.body.dataset.settingsUiReady = 'true';
    document.getElementById('addProviderBtn')?.addEventListener('click', () => openProviderEditor());
    document.getElementById('providerEditorClose')?.addEventListener('click', closeProviderEditor);
    document.getElementById('saveProviderBtn')?.addEventListener('click', saveProviderFromEditor);
    document.getElementById('deleteProviderBtn')?.addEventListener('click', deleteProviderFromEditor);
    document.getElementById('refreshProviderModelsBtn')?.addEventListener('click', refreshProviderModels);
    document.getElementById('providerPresetSelect')?.addEventListener('change', (event) => {
        const preset = event.target.value;
        const entry = buildProviderEntry(preset, {
            displayName: document.getElementById('providerDisplayName')?.value?.trim() || (PROVIDER_CONFIGS[preset]?.label || preset),
            apiKey: document.getElementById('providerApiKey')?.value?.trim() || '',
            baseUrl: document.getElementById('providerBaseUrl')?.value?.trim() || (PROVIDER_CONFIGS[preset]?.chatBaseUrl || ''),
            customChatModel: document.getElementById('providerCustomChatModel')?.value?.trim() || '',
            customImgModel: document.getElementById('providerCustomImgModel')?.value?.trim() || ''
        });
        applyProviderPreset(preset, entry);
    });
}
function getSelectedAiProvider() {
    var selected = document.getElementById('refAiProvider')?.value || 'auto';
    return selected === 'auto' ? null : selected;
}
function getSelectedAiAction() {
    return document.getElementById('refAiAction')?.value || 'auto';
}
function resolveProviderForIntent(intent, message) {
    var forcedProvider = getSelectedAiProvider();
    if (forcedProvider) return forcedProvider;
    if (intent === 'generate' || intent === 'tune') return unifiedSession.routeTask('generate_image', message);
    return unifiedSession.routeTask('chat', message);
}
function getReferenceImageForAi() {
    return currentReferenceDataUrl || targetImg?.src || unifiedSession.generatedImages[unifiedSession.generatedImages.length - 1] || null;
}

function sendRefAiMessage() {
    var input = document.getElementById('refAiInput');
    var chat = document.getElementById('refAiChat');
    var msg = input.value.trim();
    if (!msg) return;
    var welcome = chat.querySelector('.ref-ai-welcome');
    if (welcome) welcome.remove();
    appendChatMessage('user', msg);
    input.value = '';
    var enrichedMessage = applyReferenceMemoryToPrompt(msg);
    var intent = classifyUserIntent(msg, getSelectedAiAction());
    var provider = resolveProviderForIntent(intent, msg);
    var apiKey = getAIKey(provider);
    if (!apiKey) {
        appendChatMessage('assistant', 'No API key for ' + (PROVIDER_CONFIGS[provider] ? PROVIDER_CONFIGS[provider].label : provider) + '. Go to Settings.');
        return;
    }
    var model = getAIChatModel(provider);
    var baseUrl = getAIBaseUrl(provider);
    rememberSearchQuery(msg, { source: 'ai-guide', provider, intent });
    if (intent === 'generate') { doGenerateImage(provider, enrichedMessage, apiKey, getAIImgModel(provider), baseUrl, chat); return; }
    if (intent === 'tune') { doTuneReference(provider, enrichedMessage, apiKey, getAIImgModel(provider), baseUrl, chat); return; }
    if (intent === 'search') { doSearchIntent(enrichedMessage, provider, model, apiKey, baseUrl, chat); return; }
    doChatIntent(enrichedMessage, provider, model, apiKey, baseUrl, chat);
}

function classifyUserIntent(msg, forcedAction) {
    if (forcedAction && forcedAction !== 'auto') {
        return forcedAction;
    }
    var l = msg.toLowerCase();
    if (/\b(tune|edit|adjust|refine|variant|remix|iterate)\b/i.test(l) && /\b(reference|image|shot|look)\b/i.test(l)) return 'tune';
    if (/\b(generate|create|make|draw|paint|produce|dall-e|imagen)\b/i.test(l) && /\b(image|picture|scene|visual)\b/i.test(l)) return 'generate';
    if (l.startsWith('generate ') || l.startsWith('create ')) return 'generate';
    if (/\b(search|find|look|browse|fetch|get me|show me|give me)\b/i.test(l)) return 'search';
    if (l.startsWith('find ') || l.startsWith('search ')) return 'search';
    return 'chat';
}

async function doChatIntent(msg, provider, model, apiKey, baseUrl, chat) {
    var thinkEl = appendChatMessage('assistant', 'Thinking...', 'thinking');
    try {
        var reply = await unifiedSession.chat(msg, [], {
            provider: provider, chatModel: model, baseUrl: baseUrl, apiKey: apiKey,
            systemPrompt: 'You are a professional color grading and cinematography assistant. Help with film references, color palettes, lighting, visual aesthetics. Be concise (2-4 sentences).',
            metadata: { routed_to: provider }
        });
        if (thinkEl) thinkEl.remove();
        appendChatMessage('assistant', reply);
    } catch (e) { if (thinkEl) thinkEl.remove(); appendChatMessage('assistant', 'Error: ' + e.message); }
}

async function doSearchIntent(msg, provider, model, apiKey, baseUrl, chat) {
    var thinkEl = appendChatMessage('assistant', 'Searching...', 'thinking');
    try {
        var kw = await getSearchKeywordsFromAI(provider, msg, apiKey, model, baseUrl);
        if (thinkEl) thinkEl.remove();
        appendChatMessage('assistant', 'Searching with: ' + kw);
        var sources = ['wikimedia', 'flickr'];
        if (localStorage.getItem('sett_tmdb_key')) sources.push('tmdb');
        if (localStorage.getItem('sett_unsplash_key')) sources.push('unsplash');
        if (localStorage.getItem('sett_pexels_key')) sources.push('pexels');
        var keywords = kw.split(/\n|,/).map(function(part) { return part.trim(); }).filter(Boolean);
        var searches = keywords.length ? keywords : [msg];
        var collected = await searchService.searchMultiQuery(searches, sources, { perPage: 8, limit: 16 });
        var ranked = searchService.rankResults(collected, msg, searchService.classifyQuery(msg));
        var r = { results: ranked.slice(0, 16) };
        if (!r.results || !r.results.length) { appendChatMessage('assistant', 'No results.'); return; }
        appendChatMessage('assistant', 'Found ' + r.results.length + ' images:');
        renderChatResults(chat, r.results);
    } catch (e) { if (thinkEl) thinkEl.remove(); appendChatMessage('assistant', 'Failed: ' + e.message); }
}

async function getSearchKeywordsFromAI(provider, msg, apiKey, model, baseUrl) {
    try {
        var ts = new UnifiedSession();
        var r = await ts.chat(msg, [], {
            provider: provider, chatModel: model, baseUrl: baseUrl, apiKey: apiKey,
            systemPrompt: 'Turn the request into 3 short search queries for finding cinematic reference imagery. Use one line per query. Include film titles or style terms only when they improve retrieval. Output only the queries.'
        });
        return r ? r.replace(/["']/g, '').trim() : msg;
    } catch (e) { return msg; }
}

function renderChatResults(chat, results) {
    var g = document.createElement('div');
    g.className = 'ref-popup-grid chat-inline-grid';
    g.innerHTML = results.map(function(i) {
        return '<div class="reference-result-card" data-url="' + i.url + '" data-thumb="' + i.thumbnail + '"><img src="' + i.thumbnail + '" alt="' + (i.description || 'Ref') + '" loading="lazy" /><div class="result-overlay"><span class="result-source">' + i.source + '</span></div></div>';
    }).join('');
    g.querySelectorAll('.reference-result-card').forEach(function(c) {
        c.addEventListener('click', function() { loadRefPopupImage(c); });
    });
    chat.appendChild(g); chat.scrollTop = chat.scrollHeight;
}

async function doGenerateImage(provider, prompt, apiKey, imgModel, baseUrl, chat) {
    var label = PROVIDER_CONFIGS[provider] ? PROVIDER_CONFIGS[provider].label : provider;
    var thinkEl = appendChatMessage('assistant', 'Generating image (' + label + ')...', 'thinking');
    try {
        var url = await unifiedSession.generateImage(prompt, { provider: provider, imgModel: imgModel, baseUrl: baseUrl, apiKey: apiKey });
        if (thinkEl) thinkEl.remove();
        if (!url) { appendChatMessage('assistant', 'No image generated.'); return; }
        appendChatMessage('assistant', 'Generated image:');
        var c = document.createElement('div'); c.className = 'chat-generated-img';
        c.innerHTML = '<img src="' + url + '" alt="Generated" /><button class="use-gen-btn">Use as Reference</button>';
        c.querySelector('button').onclick = function() {
            var i = new Image(); i.crossOrigin = 'anonymous';
            i.onload = function() {
                var cv = document.createElement('canvas'); cv.width = i.width; cv.height = i.height;
                cv.getContext('2d').drawImage(i, 0, 0);
                try { setRefImageData(cv.getContext('2d').getImageData(0, 0, cv.width, cv.height)); closeReferencePopup(); } catch(e) { showError('CORS error.'); }
            };
            i.src = url;
        };
        chat.appendChild(c); chat.scrollTop = chat.scrollHeight;
    } catch (e) { if (thinkEl) thinkEl.remove(); appendChatMessage('assistant', 'Failed: ' + e.message); }
}

async function doTuneReference(provider, prompt, apiKey, imgModel, baseUrl, chat) {
    var referenceImage = getReferenceImageForAi();
    if (!referenceImage) {
        appendChatMessage('assistant', 'Load or generate a reference first, then ask me to tune it.');
        return;
    }

    var thinkEl = appendChatMessage('assistant', 'Tuning current reference...', 'thinking');
    try {
        var url = await unifiedSession.generateImage(prompt, {
            provider: provider,
            imgModel: imgModel,
            baseUrl: baseUrl,
            apiKey: apiKey,
            referenceImages: [referenceImage]
        });
        if (thinkEl) thinkEl.remove();
        if (!url) {
            appendChatMessage('assistant', 'No edited image returned.');
            return;
        }
        appendChatMessage('assistant', 'Tuned reference ready:');
        var c = document.createElement('div'); c.className = 'chat-generated-img';
        c.innerHTML = '<img src="' + url + '" alt="Tuned reference" /><button class="use-gen-btn">Use as Reference</button>';
        c.querySelector('button').onclick = function() {
            var i = new Image(); i.crossOrigin = 'anonymous';
            i.onload = function() {
                var cv = document.createElement('canvas'); cv.width = i.width; cv.height = i.height;
                cv.getContext('2d').drawImage(i, 0, 0);
                try { setRefImageData(cv.getContext('2d').getImageData(0, 0, cv.width, cv.height)); closeReferencePopup(); } catch(e) { showError('CORS error.'); }
            };
            i.src = url;
        };
        chat.appendChild(c); chat.scrollTop = chat.scrollHeight;
    } catch (e) {
        if (thinkEl) thinkEl.remove();
        appendChatMessage('assistant', 'Failed: ' + e.message);
    }
}

function appendChatMessage(role, text, extraClass) {
    var chat = document.getElementById('refAiChat');
    var el = document.createElement('div');
    el.className = 'chat-msg ' + role + (extraClass ? ' ' + extraClass : '');
    el.textContent = text;
    chat.appendChild(el);
    chat.scrollTop = chat.scrollHeight;
    return el;
}

function openSettings() {
    closeAllModals();
    initSettingsUi();
    document.getElementById('settingsModal').style.display = 'flex';
    renderProviderRegistryTable();
    closeProviderEditor();
    const tmdb = document.getElementById('settTmdbKey');
    const unsplash = document.getElementById('settUnsplashKey');
    const pexels = document.getElementById('settPexelsKey');
    if (tmdb) tmdb.value = localStorage.getItem('sett_tmdb_key') || '';
    if (unsplash) unsplash.value = localStorage.getItem('sett_unsplash_key') || '';
    if (pexels) pexels.value = localStorage.getItem('sett_pexels_key') || '';
    document.getElementById('settSaveBtn').onclick = saveSettings;
}

function saveSettings() {
    var g = function(id) { var el = document.getElementById(id); return el ? (el.value || '').trim() : ''; };
    localStorage.setItem('sett_tmdb_key', g('settTmdbKey'));
    localStorage.setItem('sett_unsplash_key', g('settUnsplashKey'));
    localStorage.setItem('sett_pexels_key', g('settPexelsKey'));
    if (g('settTmdbKey')) searchService.apiKeys.tmdb = g('settTmdbKey');
    if (g('settUnsplashKey')) searchService.apiKeys.unsplash = g('settUnsplashKey');
    if (g('settPexelsKey')) searchService.apiKeys.pexels = g('settPexelsKey');
    searchService.saveApiKeys(searchService.apiKeys); searchService.tmdbConfig = null;
    showStatus('All settings saved!', 'success'); closeSettings();
}

function closeSettings() { document.getElementById('settingsModal').style.display = 'none'; }

function exposeUiActions() {
    Object.assign(window, {
        removeImage,
        processImages,
        openReferencePopup,
        closeReferencePopup,
        resetAdjustments,
        quickExportResult,
        showFullExportDialog,
        closeFullExportDialog,
        executeFullExport,
        showLUTExportDialog,
        closeLUTExportDialog,
        exportLUT,
        openSettings,
        closeSettings,
        closeImagePreview,
        toggleTheme
    });
}

function setupModalDismissals() {
    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                if (overlay.id === 'imagePreviewModal') closeImagePreview();
                else overlay.style.display = 'none';
            }
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeAllModals();
        }
    });
}

// Preset System
function togglePresetPanel() {
    const presetPanel = document.getElementById('presetPanel');

    if (presetPanel) {
        const isVisible = presetPanel.style.display !== 'none';
        presetPanel.style.display = isVisible ? 'none' : 'block';

        if (!isVisible) {
            initPresetPanel();
        }
    }
}

function initPresetPanel() {
    const presetPanel = document.getElementById('presetPanel');
    if (!presetPanel) return;

    const presets = getVisiblePresets();
    const session = getActiveSession();

    presetPanel.innerHTML = `
        <div class="preset-panel-header">
            <h3>Session Looks</h3>
            <button class="preset-panel-close" id="closePresetPanel">×</button>
        </div>
        <div class="preset-search">
            <input type="text" id="presetSearchInput" placeholder="Search built-ins and this session's looks..." />
        </div>
        <div class="preset-list" id="presetList">
            ${renderPresetCardsMarkup(presets)}
        </div>
        <div class="preset-save-form">
            <input type="text" id="presetNameInput" placeholder="Save current look for ${session?.name || 'session'}" />
            <input type="text" id="presetTagsInput" placeholder="Tags (comma separated)" value="session look" />
        </div>
        <div class="preset-actions">
            <button class="preset-action-btn" id="saveCurrentAsPreset">Save Look</button>
            <button class="preset-action-btn" id="importPresetsBtn">Import</button>
            <button class="preset-action-btn" id="exportPresetsBtn">Export Session Looks</button>
        </div>
        <input type="file" id="presetImportInput" accept=".json" hidden />
    `;

    document.getElementById('closePresetPanel')?.addEventListener('click', togglePresetPanel);

    document.getElementById('presetSearchInput')?.addEventListener('input', (e) => {
        const filtered = searchVisiblePresets(e.target.value);
        renderPresetList(filtered);
    });
    bindPresetPanelActions();
    document.getElementById('saveCurrentAsPreset')?.addEventListener('click', saveCurrentAsPreset);
    document.getElementById('importPresetsBtn')?.addEventListener('click', () => document.getElementById('presetImportInput')?.click());
    document.getElementById('exportPresetsBtn')?.addEventListener('click', exportAllPresets);
    document.getElementById('presetImportInput')?.addEventListener('change', importPresetFile);
}

function getVisiblePresets() {
    const builtIns = presetManager.getBuiltInPresets().map((preset) => ({ ...preset, builtIn: true, scope: 'Built-in' }));
    const sessionLooks = getSessionPresets().map((look) => ({ ...look, builtIn: false, scope: 'Session' }));
    return [...sessionLooks, ...builtIns];
}

function searchVisiblePresets(query) {
    const normalized = (query || '').trim().toLowerCase();
    if (!normalized) return getVisiblePresets();
    return getVisiblePresets().filter((preset) => {
        if (preset.name.toLowerCase().includes(normalized)) return true;
        return (preset.tags || []).some((tag) => tag.toLowerCase().includes(normalized));
    });
}

function renderPresetList(presets) {
    const list = document.getElementById('presetList');
    if (!list) return;

    list.innerHTML = renderPresetCardsMarkup(presets);
    bindPresetPanelActions();
}

function renderPresetCardsMarkup(presets) {
    const activePresetId = getActiveSession()?.focusedLookId || getReferenceMemory().selectedPresetId;
    return presets.map(p => `
        <div class="preset-card ${activePresetId === p.id ? 'active' : ''}" data-preset-id="${p.id}">
            <div class="preset-name">${p.name}</div>
            <div class="preset-tags">${(p.tags || []).join(', ')}</div>
            <div class="preset-meta">
                <span class="preset-badge">${p.scope || (p.builtIn ? 'Built-in' : 'Saved')}</span>
                <div class="preset-inline-actions">
                    <button type="button" data-action="apply" data-preset-id="${p.id}">Apply</button>
                    <button type="button" data-action="duplicate" data-preset-id="${p.id}">Duplicate</button>
                    ${p.builtIn ? '' : `<button type="button" data-action="delete" data-preset-id="${p.id}">Delete</button>`}
                </div>
            </div>
        </div>
    `).join('');
}

function bindPresetPanelActions() {
    document.querySelectorAll('.preset-inline-actions button').forEach((button) => {
        button.onclick = (event) => {
            event.stopPropagation();
            const presetId = button.dataset.presetId;
            const action = button.dataset.action;
            if (action === 'apply') loadPreset(presetId);
            if (action === 'duplicate') {
                const preset = getVisiblePresets().find((item) => item.id === presetId);
                if (preset) {
                    saveSessionLook({
                        name: `${preset.name} Copy`,
                        tags: [...(preset.tags || [])],
                        adjustments: JSON.parse(JSON.stringify(preset.adjustments || {})),
                        sourceId: getActiveSourceRecord()?.id || null,
                        referenceIds: [getActiveSession()?.activeReferenceIds?.[0]].filter(Boolean)
                    });
                }
                initPresetPanel();
                renderSessionHub();
                showStatus('Look duplicated.', 'success');
            }
            if (action === 'delete') {
                deleteSessionLook(presetId);
                initPresetPanel();
                renderSessionHub();
                showStatus('Look deleted.', 'success');
            }
        };
    });
    document.querySelectorAll('.preset-card').forEach((card) => {
        card.onclick = () => loadPreset(card.dataset.presetId);
    });
}

function loadPreset(presetId) {
    const preset = getVisiblePresets().find(p => p.id === presetId);
    if (!preset) {
        showStatus('Preset not found.', 'error');
        return;
    }

    if (preset.adjustments) {
        const session = touchActiveSession();
        if (session) session.focusedLookId = preset.id;
        updateReferenceMemory({ selectedPresetId: preset.id });
        unifiedSession.setStyleState({
            visualStyle: preset.name,
            colorPalette: (preset.tags || []).join(', ')
        });
        if (!preset.builtIn && preset.sourceId) {
            activateSource(preset.sourceId);
        }
        if (!preset.builtIn && Array.isArray(preset.referenceIds) && preset.referenceIds.length && preset.referenceIds[0]) {
            activateReference(preset.referenceIds[0]);
        }
        applyPresetAdjustments(preset.adjustments);
        renderSessionHub();
        renderLookStrip();
        showStatus(`Look "${preset.name}" loaded!`, 'success');
        if (document.getElementById('presetPanel')?.style.display !== 'none') {
            initPresetPanel();
        }
    } else {
        showStatus('Preset has no adjustment data.', 'error');
    }
}

function applyPresetAdjustments(adj) {
    if (adj.temperature !== undefined) {
        temperatureSlider.value = adj.temperature;
        temperatureValue.textContent = adj.temperature;
    }
    if (adj.tint !== undefined) {
        tintSlider.value = adj.tint;
        tintValue.textContent = adj.tint;
    }
    if (adj.saturation !== undefined) {
        saturationSlider.value = adj.saturation;
        saturationValue.textContent = adj.saturation;
    }
    if (adj.contrast !== undefined) {
        contrastSlider.value = adj.contrast;
        contrastValue.textContent = adj.contrast;
    }
    if (adj.highlights !== undefined) {
        highlightsSlider.value = adj.highlights;
        highlightsValue.textContent = adj.highlights;
    }
    if (adj.shadows !== undefined) {
        shadowsSlider.value = adj.shadows;
        shadowsValue.textContent = adj.shadows;
    }
    if (adj.whites !== undefined) {
        whitesSlider.value = adj.whites;
        whitesValue.textContent = adj.whites;
    }
    if (adj.blacks !== undefined) {
        blacksSlider.value = adj.blacks;
        blacksValue.textContent = adj.blacks;
    }
    if (adj.exposure !== undefined) {
        exposureSlider.value = adj.exposure;
        exposureValue.textContent = adj.exposure;
    }
    if (adj.strength !== undefined) {
        strengthSlider.value = adj.strength;
        strengthValue.textContent = adj.strength;
    }
    if (adj.method !== undefined) {
        algorithmMethod.value = adj.method;
    }
    if (adj.shadowWheelAmount !== undefined && shadowWheelAmount) {
        shadowWheelAmount.value = adj.shadowWheelAmount;
        shadowWheelAmountValue.textContent = adj.shadowWheelAmount;
    }
    if (adj.midtoneWheelAmount !== undefined && midtoneWheelAmount) {
        midtoneWheelAmount.value = adj.midtoneWheelAmount;
        midtoneWheelAmountValue.textContent = adj.midtoneWheelAmount;
    }
    if (adj.highlightWheelAmount !== undefined && highlightWheelAmount) {
        highlightWheelAmount.value = adj.highlightWheelAmount;
        highlightWheelAmountValue.textContent = adj.highlightWheelAmount;
    }
    if (adj.shadowWheelColor && shadowWheelColor) shadowWheelColor.value = adj.shadowWheelColor;
    if (adj.midtoneWheelColor && midtoneWheelColor) midtoneWheelColor.value = adj.midtoneWheelColor;
    if (adj.highlightWheelColor && highlightWheelColor) highlightWheelColor.value = adj.highlightWheelColor;
    if (adj.curvePoints) {
        imageAdjustments.setCurvePoints(adj.curvePoints);
    } else {
        imageAdjustments.resetCurvePoints();
    }
    imageAdjustments.updateAdjustments({
        shadowWheelAmount: parseInt(shadowWheelAmount?.value || '0', 10),
        midtoneWheelAmount: parseInt(midtoneWheelAmount?.value || '0', 10),
        highlightWheelAmount: parseInt(highlightWheelAmount?.value || '0', 10),
        shadowWheelColor: shadowWheelColor?.value || '#3a6cff',
        midtoneWheelColor: midtoneWheelColor?.value || '#ffffff',
        highlightWheelColor: highlightWheelColor?.value || '#ffb347'
    });
    drawColorWheel('shadow');
    drawColorWheel('midtone');
    drawColorWheel('highlight');
    drawCurvesEditor();

    reapplyTransfer();
}

function saveCurrentAsPreset() {
    const name = document.getElementById('presetNameInput')?.value?.trim();
    if (!name) {
        showError('Enter a preset name first.');
        return;
    }

    const tags = document.getElementById('presetTagsInput')?.value?.trim() || 'custom';

    const adjustments = {
        temperature: parseInt(temperatureSlider.value),
        tint: parseInt(tintSlider.value),
        saturation: parseInt(saturationSlider.value),
        contrast: parseInt(contrastSlider.value),
        highlights: parseInt(highlightsSlider.value),
        shadows: parseInt(shadowsSlider.value),
        whites: parseInt(whitesSlider.value),
        blacks: parseInt(blacksSlider.value),
        exposure: parseInt(exposureSlider.value),
        strength: parseInt(strengthSlider.value),
        method: algorithmMethod.value,
        shadowWheelAmount: parseInt(shadowWheelAmount?.value || '0', 10),
        midtoneWheelAmount: parseInt(midtoneWheelAmount?.value || '0', 10),
        highlightWheelAmount: parseInt(highlightWheelAmount?.value || '0', 10),
        shadowWheelColor: shadowWheelColor?.value || '#3a6cff',
        midtoneWheelColor: midtoneWheelColor?.value || '#ffffff',
        highlightWheelColor: highlightWheelColor?.value || '#ffb347',
        curvePoints: imageAdjustments.getCurvePoints()
    };

    const preset = saveSessionLook({
        name,
        tags: tags.split(',').map(t => t.trim()),
        adjustments,
        sourceId: getActiveSourceRecord()?.id || null,
        referenceIds: [getActiveSession()?.activeReferenceIds?.[0]].filter(Boolean),
        referenceMemory: getReferenceMemory(),
        sessionStyleState: unifiedSession.styleState || null,
        previewDataUrl: resultCanvas?.width ? resultCanvas.toDataURL('image/png') : null
    });

    updateReferenceMemory({ selectedPresetId: preset.id });
    renderSessionHub();
    renderLookStrip();
    showStatus(`Look "${name}" saved to this session!`, 'success');
    const nameInput = document.getElementById('presetNameInput');
    if (nameInput) nameInput.value = '';
    initPresetPanel();
}

function importPresetFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const text = String(reader.result || '');
            const data = JSON.parse(text);
            if (Array.isArray(data.presets)) {
                data.presets.forEach((preset) => {
                    if (preset.name && preset.adjustments) {
                        saveSessionLook({
                            name: preset.name,
                            tags: preset.tags || [],
                            adjustments: preset.adjustments,
                            referenceIds: preset.referenceIds || []
                        });
                    }
                });
                showStatus(`Imported ${data.presets.length} looks.`, 'success');
            } else {
                saveSessionLook({
                    name: data.name,
                    tags: data.tags || [],
                    adjustments: data.adjustments,
                    referenceIds: data.referenceIds || []
                });
                showStatus('Look imported.', 'success');
            }
            renderSessionHub();
            initPresetPanel();
        } catch (error) {
            showError(`Preset import failed: ${error.message}`);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function exportAllPresets() {
    try {
        const exportData = JSON.stringify({
            exportedAt: new Date().toISOString(),
            sessionId: getActiveSession()?.id || null,
            sessionName: getActiveSession()?.name || null,
            presets: getSessionPresets()
        }, null, 2);
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `chromamatch-presets-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
        showStatus('Preset export ready.', 'success');
    } catch (error) {
        showError(`Preset export failed: ${error.message}`);
    }
}

// LUT Export
function showLUTExportDialog() {
    if (!originalResultData) {
        showStatus('No processed image available for LUT export.', 'error');
        return;
    }
    const look = getFocusedLook();
    const source = getActiveSourceRecord();
    const reference = getActiveReferenceRecord();
    const safeBaseName = (look?.name || `${source?.name || 'source'}-${reference?.name || 'reference'}`)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    const filenameInput = document.getElementById('lutFilename');
    const titleInput = document.getElementById('lutTitle');
    if (filenameInput && !filenameInput.value.trim()) filenameInput.value = safeBaseName || 'chromamatch-lut';
    if (titleInput && !titleInput.value.trim()) titleInput.value = look?.name || 'ChromaMatch LUT';
    document.getElementById('lutExportModal').style.display = 'flex';
}

function closeLUTExportDialog() {
    document.getElementById('lutExportModal').style.display = 'none';
    document.getElementById('exportProgress').style.display = 'none';
    document.getElementById('progressFill').style.width = '0%';
}

async function exportLUT() {
    if (!originalResultData) {
        showStatus('No processed image available for LUT export.', 'error');
        return;
    }

    const format = document.getElementById('lutFormat')?.value || 'cube';
    const lutSize = parseInt(document.getElementById('lutSize')?.value || '33');
    const bitDepth = parseInt(document.getElementById('lutBitDepth')?.value || '16');
    const filename = document.getElementById('lutFilename')?.value || 'chromamatch-lut';
    const title = document.getElementById('lutTitle')?.value || 'ChromaMatch LUT';

    document.getElementById('exportProgress').style.display = 'block';
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    try {
        const result = await lutExport.exportLUT(colorTransfer, imageAdjustments, {
            format,
            lutSize,
            bitDepth,
            filename,
            title,
            progressCallback: (progress, message) => {
                if (progressFill) progressFill.style.width = `${progress}%`;
                if (progressText) progressText.textContent = message;
            }
        });

        const session = touchActiveSession();
        const look = session?.looks?.find((item) => item.id === session.focusedLookId);
        if (look) {
            look.exportHistory = [
                {
                    filename: result.filename,
                    format,
                    lutSize,
                    bitDepth,
                    exportedAt: new Date().toISOString()
                },
                ...(look.exportHistory || [])
            ].slice(0, 12);
            saveSessionLibrary();
        }

        showStatus(`LUT exported: ${result.filename}`, 'success');

        setTimeout(() => {
            closeLUTExportDialog();
        }, 2000);

    } catch (error) {
        console.error('LUT export error:', error);
        showStatus(`LUT export failed: ${error.message}`, 'error');
        if (progressText) progressText.textContent = 'Export failed';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    exposeUiActions();
    initializeTheme();
    loadSessionLibrary();
    hydrateActiveSession();
    renderSessionHub();
    exitWorkspace();
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    setupDragAndDrop();
    setupDashboardInteractions();
    setupDashboardWindowInteractions();
    setupColorWheels();
    setupCurvesEditor();
    setupModalDismissals();
    setActiveDashboardWindow('windowThreeUp', { forceVisible: true });
    setActiveToolLayer('layerTransfer');

    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openSettings);
    }

    const changeImagesBtn = document.getElementById('changeImagesBtn');
    if (changeImagesBtn) {
        changeImagesBtn.addEventListener('click', revertToImageSelection);
    }

    updateMethodHint();

    const exportFormat = document.getElementById('exportFormat');
    const exportResolution = document.getElementById('exportResolution');
    const exportQuality = document.getElementById('exportQuality');

    if (exportFormat) exportFormat.addEventListener('change', () => {
        const qualityGroup = document.getElementById('qualityGroup');
        if (qualityGroup) {
            qualityGroup.style.display = exportFormat.value === 'png' ? 'none' : 'block';
        }
    });
    if (exportResolution) exportResolution.addEventListener('change', () => {
        const customSizeGroup = document.getElementById('customSizeGroup');
        if (customSizeGroup) {
            customSizeGroup.style.display = exportResolution.value === 'custom' ? 'block' : 'none';
        }
    });
    if (exportQuality) exportQuality.addEventListener('input', () => {
        const qualityValue = document.getElementById('qualityValue');
        if (qualityValue) {
            qualityValue.textContent = Math.round(exportQuality.value * 100) + '%';
        }
    });
});
