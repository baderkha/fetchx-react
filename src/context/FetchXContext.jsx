import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import yaml from 'js-yaml';
import { themes } from '../theme';
import {
    METHODS,
    initialRequests,
    makeRow,
    createId,
    NAMESPACE_ICONS,
    FONT_PRESETS,
    STATUS_REASON
} from '../utils/constants';
import { normalizeSidebarOrder, parseBody } from '../utils/logic';

const FetchXContext = createContext();
const DEFAULT_REQUEST_VARIABLES_JSON = '{}';
const FETCHX_STATE_VERSION = 1;

const clampIndex = (value, max) => {
    if (!Number.isFinite(value)) return 0;
    if (max <= 0) return 0;
    return Math.min(Math.max(Math.trunc(value), 0), max - 1);
};

const normalizeRow = (row) => ({
    enabled: row?.enabled !== false,
    key: typeof row?.key === 'string' ? row.key : '',
    value: typeof row?.value === 'string' ? row.value : '',
});

const normalizeRows = (rows) => {
    if (!Array.isArray(rows)) return [makeRow()];
    const out = rows.map(normalizeRow);
    return out.length > 0 ? out : [makeRow()];
};

const normalizeRequest = (request, idx = 0) => {
    const method = String(request?.method || 'GET').toUpperCase();
    return {
        ...request,
        id: typeof request?.id === 'string' && request.id ? request.id : createId(),
        name: typeof request?.name === 'string' && request.name ? request.name : `Request ${idx + 1}`,
        method: METHODS.includes(method) ? method : 'GET',
        url: typeof request?.url === 'string' ? request.url : '',
        folderId: typeof request?.folderId === 'string' ? request.folderId : null,
        queryRows: normalizeRows(request?.queryRows),
        headerRows: normalizeRows(request?.headerRows),
        body: typeof request?.body === 'string' ? request.body : '',
        variablesJson: typeof request?.variablesJson === 'string' ? request.variablesJson : DEFAULT_REQUEST_VARIABLES_JSON,
    };
};

const normalizeFolders = (folders) => {
    if (!Array.isArray(folders)) return [];
    return folders
        .map((folder, idx) => ({
            ...folder,
            id: typeof folder?.id === 'string' && folder.id ? folder.id : createId(),
            name: typeof folder?.name === 'string' && folder.name ? folder.name : `Folder ${idx + 1}`,
            expanded: folder?.expanded !== false,
        }))
        .filter((folder) => folder && folder.id);
};

const buildDefaultNamespaces = () => ([
    {
        id: '1',
        name: 'Main',
        icon: '🚀',
        requests: initialRequests.map((request, idx) => normalizeRequest(request, idx)),
        folders: [],
        selectedIndex: 0,
        sidebarOrder: [],
    },
    {
        id: '2',
        name: 'Tests',
        icon: null,
        requests: [normalizeRequest({ id: 'test-1', name: 'Test Request', method: 'GET', url: 'https://httpbin.org/get', variablesJson: DEFAULT_REQUEST_VARIABLES_JSON })],
        folders: [],
        selectedIndex: 0,
        sidebarOrder: [],
    },
]);

const normalizeNamespace = (namespace, idx = 0) => {
    const requests = Array.isArray(namespace?.requests) && namespace.requests.length > 0
        ? namespace.requests.map((request, requestIdx) => normalizeRequest(request, requestIdx))
        : [normalizeRequest({ name: 'Request 1' })];
    const folders = normalizeFolders(namespace?.folders);
    const selectedIndex = clampIndex(namespace?.selectedIndex ?? 0, requests.length);
    const sidebarOrder = normalizeSidebarOrder(
        Array.isArray(namespace?.sidebarOrder) ? namespace.sidebarOrder : [],
        folders,
        requests
    );

    return {
        ...namespace,
        id: typeof namespace?.id === 'string' && namespace.id ? namespace.id : createId(),
        name: typeof namespace?.name === 'string' && namespace.name ? namespace.name : `Workspace ${idx + 1}`,
        icon: namespace?.icon ?? null,
        requests,
        folders,
        selectedIndex,
        sidebarOrder,
    };
};

const createDefaultPersistedState = () => {
    const namespaces = buildDefaultNamespaces();
    const activeNamespaceId = namespaces[0]?.id || '1';
    const active = namespaces.find((ns) => ns.id === activeNamespaceId) || namespaces[0];
    const selected = active.requests[active.selectedIndex] || active.requests[0];
    return {
        version: FETCHX_STATE_VERSION,
        settingsOpen: false,
        searchOpen: false,
        searchQuery: '',
        themeName: 'Dark',
        fontPreset: 'Premium',
        composerTab: 'json',
        responseTab: 'body',
        editingIndex: null,
        editingValue: '',
        namespaces,
        activeNamespaceId,
        nsDialogOpen: false,
        newNsName: '',
        newNsIcon: 'FOLDER',
        iconSearch: '',
        requests: active.requests,
        folders: active.folders,
        selectedIndex: active.selectedIndex,
        sidebarOrder: active.sidebarOrder,
        activeDragId: null,
        variablesJson: selected?.variablesJson || DEFAULT_REQUEST_VARIABLES_JSON,
        queryRows: selected?.queryRows || [makeRow()],
        headerRows: selected?.headerRows || [makeRow()],
        requestBody: selected?.body || '{\n  "sample": true\n}',
        responseBody: '{}',
        responseHeaders: {},
        rawRequest: '',
        rawResponse: '',
        timeline: [],
        csvPage: 1,
        bodyMode: 'preview',
        jsonFilter: '',
        status: '-',
        elapsed: '-',
        error: '',
        requestMenu: { open: false, mouseX: null, mouseY: null, index: null, folderId: null },
        moveOpen: false,
        moveTargetIdx: null,
        expandedNsMove: {},
        importOpen: false,
        importStep: 0,
        importSource: 'url',
        importUrl: '',
        importTarget: 'current',
        importedSpec: null,
    };
};

const normalizePersistedState = (raw) => {
    const defaults = createDefaultPersistedState();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return defaults;

    const namespacesRaw = Array.isArray(raw.namespaces) && raw.namespaces.length > 0
        ? raw.namespaces
        : defaults.namespaces;
    const namespaces = namespacesRaw.map((namespace, idx) => normalizeNamespace(namespace, idx));
    const activeNamespaceId = namespaces.some((ns) => ns.id === raw.activeNamespaceId)
        ? raw.activeNamespaceId
        : (namespaces[0]?.id || defaults.activeNamespaceId);
    const activeNamespace = namespaces.find((ns) => ns.id === activeNamespaceId) || namespaces[0];

    const requests = Array.isArray(raw.requests) && raw.requests.length > 0
        ? raw.requests.map((request, idx) => normalizeRequest(request, idx))
        : activeNamespace.requests;
    const folders = Array.isArray(raw.folders) ? normalizeFolders(raw.folders) : activeNamespace.folders;
    const selectedIndex = clampIndex(raw.selectedIndex ?? activeNamespace.selectedIndex, requests.length);
    const sidebarOrder = normalizeSidebarOrder(
        Array.isArray(raw.sidebarOrder) ? raw.sidebarOrder : activeNamespace.sidebarOrder,
        folders,
        requests
    );
    const selected = requests[selectedIndex] || requests[0];

    return {
        ...defaults,
        ...raw,
        version: FETCHX_STATE_VERSION,
        themeName: typeof raw.themeName === 'string' ? raw.themeName : defaults.themeName,
        fontPreset: typeof raw.fontPreset === 'string' ? raw.fontPreset : defaults.fontPreset,
        composerTab: typeof raw.composerTab === 'string' ? raw.composerTab : defaults.composerTab,
        responseTab: typeof raw.responseTab === 'string' ? raw.responseTab : defaults.responseTab,
        editingIndex: raw.editingIndex ?? defaults.editingIndex,
        editingValue: typeof raw.editingValue === 'string' ? raw.editingValue : defaults.editingValue,
        namespaces,
        activeNamespaceId,
        nsDialogOpen: Boolean(raw.nsDialogOpen),
        newNsName: typeof raw.newNsName === 'string' ? raw.newNsName : defaults.newNsName,
        newNsIcon: raw.newNsIcon ?? defaults.newNsIcon,
        iconSearch: typeof raw.iconSearch === 'string' ? raw.iconSearch : defaults.iconSearch,
        requests,
        folders,
        selectedIndex,
        sidebarOrder,
        activeDragId: raw.activeDragId ?? null,
        variablesJson: typeof raw.variablesJson === 'string' ? raw.variablesJson : (selected?.variablesJson || DEFAULT_REQUEST_VARIABLES_JSON),
        queryRows: normalizeRows(raw.queryRows ?? selected?.queryRows),
        headerRows: normalizeRows(raw.headerRows ?? selected?.headerRows),
        requestBody: typeof raw.requestBody === 'string' ? raw.requestBody : (selected?.body || defaults.requestBody),
        responseBody: typeof raw.responseBody === 'string' ? raw.responseBody : defaults.responseBody,
        responseHeaders: raw.responseHeaders && typeof raw.responseHeaders === 'object' && !Array.isArray(raw.responseHeaders) ? raw.responseHeaders : {},
        rawRequest: typeof raw.rawRequest === 'string' ? raw.rawRequest : defaults.rawRequest,
        rawResponse: typeof raw.rawResponse === 'string' ? raw.rawResponse : defaults.rawResponse,
        timeline: Array.isArray(raw.timeline) ? raw.timeline : [],
        csvPage: Number.isFinite(raw.csvPage) ? raw.csvPage : defaults.csvPage,
        bodyMode: typeof raw.bodyMode === 'string' ? raw.bodyMode : defaults.bodyMode,
        jsonFilter: typeof raw.jsonFilter === 'string' ? raw.jsonFilter : defaults.jsonFilter,
        status: typeof raw.status === 'string' ? raw.status : defaults.status,
        elapsed: typeof raw.elapsed === 'string' ? raw.elapsed : defaults.elapsed,
        error: typeof raw.error === 'string' ? raw.error : defaults.error,
        requestMenu: raw.requestMenu && typeof raw.requestMenu === 'object'
            ? { ...defaults.requestMenu, ...raw.requestMenu }
            : defaults.requestMenu,
        moveOpen: Boolean(raw.moveOpen),
        moveTargetIdx: raw.moveTargetIdx ?? defaults.moveTargetIdx,
        expandedNsMove: raw.expandedNsMove && typeof raw.expandedNsMove === 'object' ? raw.expandedNsMove : {},
        importOpen: Boolean(raw.importOpen),
        importStep: Number.isFinite(raw.importStep) ? raw.importStep : defaults.importStep,
        importSource: typeof raw.importSource === 'string' ? raw.importSource : defaults.importSource,
        importUrl: typeof raw.importUrl === 'string' ? raw.importUrl : defaults.importUrl,
        importTarget: typeof raw.importTarget === 'string' ? raw.importTarget : defaults.importTarget,
        importedSpec: raw.importedSpec ?? null,
    };
};

const getPersistenceApi = () => {
    if (typeof window === 'undefined') return null;
    const api = window.fetchxApi;
    if (!api) return null;
    if (typeof api.getPersistedState !== 'function') return null;
    if (typeof api.setPersistedState !== 'function') return null;
    return api;
};

export function FetchXProvider({ children }) {
    // === DIALOGS & UI STATE ===
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Settings
    const [themeName, setThemeName] = useState('Dark');
    const [fontPreset, setFontPreset] = useState('Premium');
    const theme = useMemo(() => themes.find((t) => t.name === themeName) ?? themes[0], [themeName]);
    const currentFont = FONT_PRESETS.find((preset) => preset.name === fontPreset)?.family ?? FONT_PRESETS[0].family;

    // Tabs
    const [composerTab, setComposerTab] = useState('json');
    const [responseTab, setResponseTab] = useState('body');

    // Request Renaming
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingValue, setEditingValue] = useState('');

    // === WORKSPACES (NAMESPACES) STATE ===
    const [namespaces, setNamespaces] = useState([
        { id: '1', name: 'Main', icon: '🚀', requests: initialRequests, folders: [], selectedIndex: 0, sidebarOrder: [] },
        { id: '2', name: 'Tests', icon: null, requests: [{ id: 'test-1', name: 'Test Request', method: 'GET', url: 'https://httpbin.org/get', variablesJson: DEFAULT_REQUEST_VARIABLES_JSON }], folders: [], selectedIndex: 0, sidebarOrder: [] }
    ]);
    const [activeNamespaceId, setActiveNamespaceId] = useState('1');
    const activeNamespace = namespaces.find(n => n.id === activeNamespaceId);

    // Namespace Dialog
    const [nsDialogOpen, setNsDialogOpen] = useState(false);
    const [newNsName, setNewNsName] = useState('');
    const [newNsIcon, setNewNsIcon] = useState('FOLDER');
    const [iconSearch, setIconSearch] = useState('');

    // === CURRENT NAMESPACE STATE ===
    const [requests, setRequests] = useState(initialRequests);
    const [folders, setFolders] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [sidebarOrder, setSidebarOrder] = useState([]);
    const [activeDragId, setActiveDragId] = useState(null);
    const [variablesJson, setVariablesJson] = useState(DEFAULT_REQUEST_VARIABLES_JSON);

    const isSwitchingRef = useRef(false);
    const [hasHydratedPersistence, setHasHydratedPersistence] = useState(false);

    // Active Request
    const selected = requests[selectedIndex] ?? requests[0] ?? { name: 'Empty', method: 'GET', url: '' };

    // === COMPOSER ROWS ===
    const [queryRows, setQueryRows] = useState([makeRow()]);
    const [headerRows, setHeaderRows] = useState([makeRow()]);

    // Sync rows from current request on switch
    useEffect(() => {
        if (selected) {
            setQueryRows(selected.queryRows || [makeRow()]);
            setHeaderRows(selected.headerRows || [makeRow()]);
        }
    }, [selected?.id]);

    // Persistent rows back to request state
    useEffect(() => {
        // Only update if not switching context to prevent loop overrides
        if (!isSwitchingRef.current) {
            updateSelected({ queryRows, headerRows });
        }
    }, [queryRows, headerRows]);

    // Auto-sync everything back to namespaces
    useEffect(() => {
        if (isSwitchingRef.current) return;
        setNamespaces(prev => prev.map(ns => ns.id === activeNamespaceId ? { ...ns, requests, folders, selectedIndex, sidebarOrder } : ns));
    }, [requests, folders, selectedIndex, activeNamespaceId, sidebarOrder]);

    // === REQUEST/RESPONSE STATE ===
    const [requestBody, setRequestBody] = useState('{\n  "sample": true\n}');
    const [responseBody, setResponseBody] = useState('{}');
    const [responseHeaders, setResponseHeaders] = useState({});
    const [rawRequest, setRawRequest] = useState('');
    const [rawResponse, setRawResponse] = useState('');
    const [timeline, setTimeline] = useState([]);
    const [csvPage, setCsvPage] = useState(1);
    const [bodyMode, setBodyMode] = useState('preview'); // preview, raw
    const [bodyMenuAnchor, setBodyMenuAnchor] = useState(null);
    const [jsonFilter, setJsonFilter] = useState('');

    const [status, setStatus] = useState('-');
    const [elapsed, setElapsed] = useState('-');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [monacoApi, setMonacoApi] = useState(null);

    // Sync body from active request
    useEffect(() => {
        if (selected) {
            setRequestBody(typeof selected.body === 'string' ? selected.body : '');
        }
    }, [selected?.id]);

    // Persist body back to active request
    useEffect(() => {
        if (!isSwitchingRef.current) {
            updateSelected({ body: requestBody });
        }
    }, [requestBody]);

    // Sync request-local variables JSON from active request on switch
    useEffect(() => {
        if (!selected) return;
        if (typeof selected.variablesJson === 'string') {
            setVariablesJson(selected.variablesJson);
            return;
        }

        // Backward compatibility for older row-based variable shape
        if (Array.isArray(selected.variables)) {
            const migrated = {};
            selected.variables.forEach((row) => {
                const key = String(row?.key || '').trim();
                if (!key) return;
                migrated[key] = String(row?.value ?? '');
            });
            setVariablesJson(JSON.stringify(migrated, null, 2));
            return;
        }

        setVariablesJson(DEFAULT_REQUEST_VARIABLES_JSON);
    }, [selected?.id]);

    // Persist request-local variables JSON back to selected request
    useEffect(() => {
        if (!isSwitchingRef.current) {
            updateSelected({ variablesJson });
        }
    }, [variablesJson]);

    // === CONTEXT MENUS & MOVE DIALOG ===
    const searchInputRef = useRef(null);
    const [requestMenu, setRequestMenu] = useState({ open: false, mouseX: null, mouseY: null, index: null, folderId: null });
    const [moveOpen, setMoveOpen] = useState(false);
    const [moveTargetIdx, setMoveTargetIdx] = useState(null);
    const [expandedNsMove, setExpandedNsMove] = useState({});

    // === IMPORT WIZARD STATE ===
    const [importOpen, setImportOpen] = useState(false);
    const [importStep, setImportStep] = useState(0);
    const [importSource, setImportSource] = useState('url');
    const [importUrl, setImportUrl] = useState('');
    const [importTarget, setImportTarget] = useState('current');
    const [importLoading, setImportLoading] = useState(false);
    const [importedSpec, setImportedSpec] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const persistenceApi = getPersistenceApi();
        if (!persistenceApi) {
            setHasHydratedPersistence(true);
            return undefined;
        }

        const hydrateState = async () => {
            try {
                const raw = await persistenceApi.getPersistedState();
                if (cancelled) return;

                const persisted = normalizePersistedState(raw);
                isSwitchingRef.current = true;

                setSettingsOpen(Boolean(persisted.settingsOpen));
                setSearchOpen(Boolean(persisted.searchOpen));
                setSearchQuery(persisted.searchQuery);
                setThemeName(persisted.themeName);
                setFontPreset(persisted.fontPreset);
                setComposerTab(persisted.composerTab);
                setResponseTab(persisted.responseTab);
                setEditingIndex(persisted.editingIndex);
                setEditingValue(persisted.editingValue);
                setNamespaces(persisted.namespaces);
                setActiveNamespaceId(persisted.activeNamespaceId);
                setNsDialogOpen(Boolean(persisted.nsDialogOpen));
                setNewNsName(persisted.newNsName);
                setNewNsIcon(persisted.newNsIcon);
                setIconSearch(persisted.iconSearch);
                setRequests(persisted.requests);
                setFolders(persisted.folders);
                setSelectedIndex(persisted.selectedIndex);
                setSidebarOrder(persisted.sidebarOrder);
                setActiveDragId(persisted.activeDragId ?? null);
                setVariablesJson(persisted.variablesJson);
                setQueryRows(persisted.queryRows);
                setHeaderRows(persisted.headerRows);
                setRequestBody(persisted.requestBody);
                setResponseBody(persisted.responseBody);
                setResponseHeaders(persisted.responseHeaders);
                setRawRequest(persisted.rawRequest);
                setRawResponse(persisted.rawResponse);
                setTimeline(persisted.timeline);
                setCsvPage(persisted.csvPage);
                setBodyMode(persisted.bodyMode);
                setJsonFilter(persisted.jsonFilter);
                setStatus(persisted.status);
                setElapsed(persisted.elapsed);
                setError(persisted.error);
                setRequestMenu(persisted.requestMenu);
                setMoveOpen(Boolean(persisted.moveOpen));
                setMoveTargetIdx(persisted.moveTargetIdx);
                setExpandedNsMove(persisted.expandedNsMove);
                setImportOpen(Boolean(persisted.importOpen));
                setImportStep(persisted.importStep);
                setImportSource(persisted.importSource);
                setImportUrl(persisted.importUrl);
                setImportTarget(persisted.importTarget);
                setImportedSpec(persisted.importedSpec);
                setImportLoading(false);
                setSending(false);
                setBodyMenuAnchor(null);
                setMonacoApi(null);
            } catch {
                // Ignore hydration failures and continue with in-memory defaults.
            } finally {
                if (cancelled) return;
                setTimeout(() => {
                    isSwitchingRef.current = false;
                }, 120);
                setHasHydratedPersistence(true);
            }
        };

        hydrateState();
        return () => {
            cancelled = true;
        };
    }, []);

    const persistedStateModel = useMemo(() => {
        const nextRequests = (Array.isArray(requests) ? requests : []).map((request, index) => {
            if (index !== selectedIndex) return normalizeRequest(request, index);
            return normalizeRequest({
                ...request,
                queryRows: normalizeRows(queryRows),
                headerRows: normalizeRows(headerRows),
                body: requestBody,
                variablesJson: typeof variablesJson === 'string' ? variablesJson : DEFAULT_REQUEST_VARIABLES_JSON,
            }, index);
        });
        const normalizedRequests = nextRequests.length > 0
            ? nextRequests
            : [normalizeRequest({ name: 'Request 1' })];
        const normalizedFolders = normalizeFolders(folders);
        const normalizedSelectedIndex = clampIndex(selectedIndex, normalizedRequests.length);
        const normalizedSidebar = normalizeSidebarOrder(sidebarOrder, normalizedFolders, normalizedRequests);

        const normalizedNamespaces = (Array.isArray(namespaces) ? namespaces : []).map((namespace, index) => {
            if (namespace?.id !== activeNamespaceId) return normalizeNamespace(namespace, index);
            return normalizeNamespace({
                ...namespace,
                requests: normalizedRequests,
                folders: normalizedFolders,
                selectedIndex: normalizedSelectedIndex,
                sidebarOrder: normalizedSidebar,
            }, index);
        });
        const safeNamespaces = normalizedNamespaces.length > 0 ? normalizedNamespaces : buildDefaultNamespaces();
        const safeActiveNamespaceId = safeNamespaces.some((namespace) => namespace.id === activeNamespaceId)
            ? activeNamespaceId
            : (safeNamespaces[0]?.id || '1');

        return {
            version: FETCHX_STATE_VERSION,
            settingsOpen,
            searchOpen,
            searchQuery,
            themeName,
            fontPreset,
            composerTab,
            responseTab,
            editingIndex,
            editingValue,
            namespaces: safeNamespaces,
            activeNamespaceId: safeActiveNamespaceId,
            nsDialogOpen,
            newNsName,
            newNsIcon,
            iconSearch,
            requests: normalizedRequests,
            folders: normalizedFolders,
            selectedIndex: normalizedSelectedIndex,
            sidebarOrder: normalizedSidebar,
            activeDragId,
            variablesJson: typeof variablesJson === 'string' ? variablesJson : DEFAULT_REQUEST_VARIABLES_JSON,
            queryRows: normalizeRows(queryRows),
            headerRows: normalizeRows(headerRows),
            requestBody: typeof requestBody === 'string' ? requestBody : '',
            responseBody: typeof responseBody === 'string' ? responseBody : '{}',
            responseHeaders: responseHeaders && typeof responseHeaders === 'object' && !Array.isArray(responseHeaders) ? responseHeaders : {},
            rawRequest: typeof rawRequest === 'string' ? rawRequest : '',
            rawResponse: typeof rawResponse === 'string' ? rawResponse : '',
            timeline: Array.isArray(timeline) ? timeline : [],
            csvPage: Number.isFinite(csvPage) ? csvPage : 1,
            bodyMode: typeof bodyMode === 'string' ? bodyMode : 'preview',
            jsonFilter: typeof jsonFilter === 'string' ? jsonFilter : '',
            status: typeof status === 'string' ? status : '-',
            elapsed: typeof elapsed === 'string' ? elapsed : '-',
            error: typeof error === 'string' ? error : '',
            requestMenu: {
                open: Boolean(requestMenu?.open),
                mouseX: null,
                mouseY: null,
                index: requestMenu?.index ?? null,
                folderId: requestMenu?.folderId ?? null,
            },
            moveOpen: Boolean(moveOpen),
            moveTargetIdx: moveTargetIdx ?? null,
            expandedNsMove: expandedNsMove && typeof expandedNsMove === 'object' ? expandedNsMove : {},
            importOpen: Boolean(importOpen),
            importStep: Number.isFinite(importStep) ? importStep : 0,
            importSource: typeof importSource === 'string' ? importSource : 'url',
            importUrl: typeof importUrl === 'string' ? importUrl : '',
            importTarget: typeof importTarget === 'string' ? importTarget : 'current',
            importedSpec: importedSpec ?? null,
        };
    }, [
        settingsOpen,
        searchOpen,
        searchQuery,
        themeName,
        fontPreset,
        composerTab,
        responseTab,
        editingIndex,
        editingValue,
        namespaces,
        activeNamespaceId,
        nsDialogOpen,
        newNsName,
        newNsIcon,
        iconSearch,
        requests,
        folders,
        selectedIndex,
        sidebarOrder,
        activeDragId,
        variablesJson,
        queryRows,
        headerRows,
        requestBody,
        responseBody,
        responseHeaders,
        rawRequest,
        rawResponse,
        timeline,
        csvPage,
        bodyMode,
        jsonFilter,
        status,
        elapsed,
        error,
        requestMenu,
        moveOpen,
        moveTargetIdx,
        expandedNsMove,
        importOpen,
        importStep,
        importSource,
        importUrl,
        importTarget,
        importedSpec,
    ]);

    useEffect(() => {
        if (!hasHydratedPersistence) return;
        const persistenceApi = getPersistenceApi();
        if (!persistenceApi) return;

        const timeoutId = setTimeout(() => {
            persistenceApi.setPersistedState(persistedStateModel).catch(() => {
                // Ignore persistence errors and keep app responsive.
            });
        }, 250);

        return () => clearTimeout(timeoutId);
    }, [hasHydratedPersistence, persistedStateModel]);

    // === KEYBOARD SHORTCUTS ===
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
                e.preventDefault();
                setSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // === ACTIONS ===

    const updateSelected = (patch) => {
        setRequests((prev) => prev.map((r, i) => (i === selectedIndex ? { ...r, ...patch } : r)));
    };

    const variableValueMap = useMemo(() => {
        try {
            const parsed = JSON.parse(typeof variablesJson === 'string' ? variablesJson : DEFAULT_REQUEST_VARIABLES_JSON);
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
            return Object.fromEntries(Object.entries(parsed).map(([key, value]) => [String(key), value]));
        } catch {
            return {};
        }
    }, [variablesJson]);

    const variableMap = useMemo(
        () => Object.fromEntries(
            Object.entries(variableValueMap).map(([key, value]) => {
                if (value === null || value === undefined) return [String(key), ''];
                if (typeof value === 'string') return [String(key), value];
                try {
                    return [String(key), JSON.stringify(value)];
                } catch {
                    return [String(key), String(value)];
                }
            })
        ),
        [variableValueMap]
    );

    const normalizeTemplateInput = (input) => String(input ?? '')
        .replace(/%7B%7B/gi, '{{')
        .replace(/%7D%7D/gi, '}}');

    const interpolateVariables = (input) => {
        const text = normalizeTemplateInput(input);
        return text.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (fullMatch, name) => {
            if (Object.prototype.hasOwnProperty.call(variableMap, name)) {
                return variableMap[name];
            }
            return fullMatch;
        });
    };

    const isInsideJsonStringAt = (source, index) => {
        let inString = false;
        let escaped = false;
        for (let i = 0; i < index; i += 1) {
            const ch = source[i];
            if (escaped) {
                escaped = false;
                continue;
            }
            if (inString && ch === '\\') {
                escaped = true;
                continue;
            }
            if (ch === '"') {
                inString = !inString;
            }
        }
        return inString;
    };

    const asJsonLiteral = (rawValue) => {
        if (rawValue === undefined) return '""';
        return JSON.stringify(rawValue);
    };

    const asJsonStringFragment = (rawValue) => {
        if (rawValue === undefined) return '';
        const text = rawValue === null
            ? 'null'
            : (typeof rawValue === 'string' ? rawValue : JSON.stringify(rawValue));
        return JSON.stringify(text).slice(1, -1);
    };

    const interpolateBodyVariables = (input) => {
        const text = normalizeTemplateInput(input);
        return text.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (fullMatch, name, offset) => {
            if (!Object.prototype.hasOwnProperty.call(variableValueMap, name)) return fullMatch;
            const value = variableValueMap[name];
            if (isInsideJsonStringAt(text, offset)) {
                return asJsonStringFragment(value);
            }
            return asJsonLiteral(value);
        });
    };

    const decodeURIComponentSafe = (value) => {
        try {
            return decodeURIComponent(value);
        } catch {
            return value;
        }
    };

    const interpolateUrlVariables = (input) => {
        const text = normalizeTemplateInput(input).trim();
        if (!text) return '';

        const [rawPath, ...rawQueryParts] = text.split('?');
        const resolvedPath = interpolateVariables(rawPath);
        const rawQuery = rawQueryParts.join('?');
        if (!rawQuery) return resolvedPath;

        const encodedPairs = rawQuery
            .split('&')
            .filter((segment) => segment.length > 0)
            .map((segment) => {
                const eqIndex = segment.indexOf('=');
                const rawKey = eqIndex === -1 ? segment : segment.slice(0, eqIndex);
                const rawValue = eqIndex === -1 ? '' : segment.slice(eqIndex + 1);
                const decodedKey = decodeURIComponentSafe(rawKey);
                const decodedValue = decodeURIComponentSafe(rawValue);
                const resolvedKey = interpolateVariables(decodedKey);
                const resolvedValue = interpolateVariables(decodedValue);
                return `${encodeURIComponent(resolvedKey)}=${encodeURIComponent(resolvedValue)}`;
            });

        return encodedPairs.length > 0 ? `${resolvedPath}?${encodedPairs.join('&')}` : resolvedPath;
    };

    const syncUrlFromRows = (newRows) => {
        try {
            const src = selected?.url || '';
            const [baseUrl] = src.split('?');
            const encodeQueryPart = (value) =>
                encodeURIComponent(String(value ?? ''))
                    .replace(/%7B/gi, '{')
                    .replace(/%7D/gi, '}');
            const qs = newRows
                .filter(r => r.enabled && r.key.trim())
                .map((r) => `${encodeQueryPart(r.key.trim())}=${encodeQueryPart(r.value)}`)
                .join('&');
            updateSelected({ url: qs ? `${baseUrl}?${qs}` : baseUrl });
        } catch { }
    };

    const updateRows = (setter, rows, i, patch) => {
        const next = rows.map((row, idx) => (idx === i ? { ...row, ...patch } : row));
        setter(next);
        if (setter === setQueryRows) {
            syncUrlFromRows(next);
        }
    };

    const filteredHeaders = Object.fromEntries(
        headerRows.filter((r) => r.enabled && r.key.trim()).map((r) => [r.key.trim(), r.value])
    );

    const addNamespace = () => {
        setNewNsName('');
        setNewNsIcon('📂');
        setNsDialogOpen(true);
    };

    const confirmAddNamespace = () => {
        if (!newNsName.trim()) return;
        const id = Date.now().toString();
        const newNs = {
            id,
            name: newNsName,
            icon: newNsIcon,
            requests: [{ id: createId(), name: 'Initial Request', method: 'GET', url: '', variablesJson: DEFAULT_REQUEST_VARIABLES_JSON }],
            folders: [],
            sidebarOrder: [],
            selectedIndex: 0,
        };
        setNamespaces([...namespaces, newNs]);
        setNsDialogOpen(false);
        switchNamespace(id);
    };

    const switchNamespace = (id) => {
        isSwitchingRef.current = true;
        const target = namespaces.find(n => n.id === id);
        if (target) {
            setActiveNamespaceId(id);
            setRequests(target.requests || []);
            setFolders(target.folders || []);
            setSelectedIndex(target.selectedIndex || 0);
            setSidebarOrder(normalizeSidebarOrder(target.sidebarOrder, target.folders || [], target.requests || []));
        }
        setTimeout(() => { isSwitchingRef.current = false; }, 100);
    };

    const addRequest = (folderId = null) => {
        setRequests((prev) => {
            const id = createId();
            const nextName = `Request ${prev.length + 1}`;
            const next = [...prev, { id, name: nextName, method: 'GET', url: '', folderId, variablesJson: DEFAULT_REQUEST_VARIABLES_JSON }];
            if (!folderId) {
                setSidebarOrder((so) => [...(Array.isArray(so) ? so.filter(Boolean) : []), { id, type: 'request' }]);
            }
            const nextIdx = next.length - 1;
            setSelectedIndex(nextIdx);
            setEditingIndex(nextIdx);
            setEditingValue(nextName);
            return next;
        });
    };

    const addFolder = () => {
        const id = createId();
        const name = `Folder ${folders.length + 1}`;
        setFolders([...folders, { id, name, expanded: true }]);
        setSidebarOrder((so) => [...(Array.isArray(so) ? so.filter(Boolean) : []), { id, type: 'folder' }]);
    };

    const deleteRequest = (index) => {
        setRequests((prev) => {
            if (prev.length <= 1) {
                const id = createId();
                setSidebarOrder([{ id, type: 'request' }]);
                setSelectedIndex(0);
                return [{ id, name: 'Request 1', method: 'GET', url: '', variablesJson: DEFAULT_REQUEST_VARIABLES_JSON }];
            }
            const removed = prev[index];
            if (removed?.id && !removed.folderId) {
                setSidebarOrder((so) => (Array.isArray(so) ? so : []).filter(
                    (item) => !(item?.type === 'request' && item?.id === removed.id)
                ));
            }
            const next = prev.filter((_, i) => i !== index);
            setSelectedIndex((current) => {
                if (current > index) return current - 1;
                if (current === index) return Math.max(0, index - 1);
                return current;
            });
            return next;
        });
    };

    const toggleFolder = (folderId) => {
        setFolders(prev => prev.map(f => f.id === folderId ? { ...f, expanded: !f.expanded } : f));
    };

    const deleteFolder = (folderId) => {
        setFolders(prev => prev.filter(f => f.id !== folderId));
        setRequests(prev => prev.map(r => r.folderId === folderId ? { ...r, folderId: null } : r));
    };

    const startRenameFolder = (folderId) => {
        const f = folders.find(f => f.id === folderId);
        if (!f) return;
        setEditingIndex('folder-' + folderId);
        setEditingValue(f.name);
    };

    const saveFolderRename = (folderId) => {
        const val = editingValue.trim();
        if (val) {
            setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name: val } : f));
        }
        setEditingIndex(null);
        setEditingValue('');
    };

    const startRenameRequest = (index) => {
        const current = requests[index];
        if (!current) return;
        setEditingIndex(index);
        setEditingValue(current.name);
    };

    const saveRename = () => {
        const val = editingValue.trim();
        if (editingIndex !== null && typeof editingIndex === 'number' && val) {
            setRequests((prev) => prev.map((r, i) => (i === editingIndex ? { ...r, name: val } : r)));
        }
        setEditingIndex(null);
        setEditingValue('');
    };

    const onDragEnd = (result) => {
        const { destination, source, draggableId, combine } = result;
        setActiveDragId(null);

        // Handle dropping a request directly on top of a folder row.
        if (combine?.draggableId?.startsWith('folder-')) {
            const targetFolderId = combine.draggableId.replace('folder-', '');
            const requestId = draggableId.startsWith('request-') ? draggableId.replace('request-', '') : draggableId;
            if (!requestId) return;

            setRequests(prev => prev.map(r => r.id === requestId ? { ...r, folderId: targetFolderId } : r));

            // If it came from root sidebar, remove it from root ordering.
            if (source.droppableId === 'sidebar') {
                setSidebarOrder(prev => (Array.isArray(prev) ? prev : []).filter(
                    (item) => !(item?.type === 'request' && item?.id === requestId)
                ));
            }
            return;
        }

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        if (source.droppableId === 'sidebar' && destination.droppableId === 'sidebar') {
            const newOrder = Array.from(normalizeSidebarOrder(sidebarOrder, folders, requests));
            const [moved] = newOrder.splice(source.index, 1);
            if (!moved) return;
            newOrder.splice(destination.index, 0, moved);
            setSidebarOrder(newOrder);
            return;
        }

        if (source.droppableId === 'sidebar' && destination.droppableId !== 'sidebar') {
            if (!draggableId.startsWith('request-')) return;
            const requestId = draggableId.replace('request-', '');
            const folderId = destination.droppableId;

            setRequests(prev => prev.map(r => r.id === requestId ? { ...r, folderId } : r));
            setSidebarOrder(prev => (Array.isArray(prev) ? prev : []).filter(
                (item) => !(item?.type === 'request' && item?.id === requestId)
            ));
            return;
        }

        if (source.droppableId !== 'sidebar' && destination.droppableId === 'sidebar') {
            const requestId = draggableId;

            setRequests(prev => prev.map(r => r.id === requestId ? { ...r, folderId: null } : r));
            setSidebarOrder(prev => {
                const next = (Array.isArray(prev) ? prev : []).filter(
                    (item) => !(item?.type === 'request' && item?.id === requestId)
                );
                const safeIndex = Math.min(Math.max(destination.index, 0), next.length);
                next.splice(safeIndex, 0, { id: requestId, type: 'request' });
                return next;
            });
            return;
        }

        if (source.droppableId !== 'sidebar' && destination.droppableId !== 'sidebar') {
            const requestId = draggableId;
            const targetFolderId = destination.droppableId;

            setRequests(prev => {
                const next = [...prev];
                const movedIdx = next.findIndex(r => r.id === requestId);
                if (movedIdx === -1) return prev;

                const [moved] = next.splice(movedIdx, 1);
                moved.folderId = targetFolderId;

                const inTarget = next.filter(r => r.folderId === targetFolderId);
                let realInsertIdx;
                if (destination.index < inTarget.length) {
                    const targetItem = inTarget[destination.index];
                    realInsertIdx = next.findIndex(r => r.id === targetItem.id);
                } else {
                    if (inTarget.length > 0) {
                        const lastItem = inTarget[inTarget.length - 1];
                        realInsertIdx = next.findIndex(r => r.id === lastItem.id) + 1;
                    } else {
                        realInsertIdx = next.length;
                    }
                }
                next.splice(realInsertIdx, 0, moved);
                return next;
            });
            return;
        }
    };

    const confirmMoveRequest = (targetNsId, targetFolderId = null, overwriteIdx = null) => {
        if (moveTargetIdx === null) return;
        const req = { ...requests[moveTargetIdx] };
        if (!req) return;

        if (targetNsId === activeNamespaceId) {
            if (overwriteIdx !== null) {
                setRequests(prev => {
                    const next = prev.map((r, i) => i === overwriteIdx ? { ...req, folderId: targetFolderId } : r);
                    return next.filter((_, i) => i !== moveTargetIdx);
                });
            } else {
                setRequests(prev => prev.map((r, i) => i === moveTargetIdx ? { ...r, folderId: targetFolderId } : r));
            }
        } else {
            setNamespaces(prev => prev.map(ns => {
                if (ns.id === targetNsId) {
                    const nextReqs = [...(ns.requests || [])];
                    if (overwriteIdx !== null) {
                        nextReqs[overwriteIdx] = { ...req, folderId: targetFolderId };
                    } else {
                        nextReqs.push({ ...req, folderId: targetFolderId });
                    }
                    return { ...ns, requests: nextReqs };
                }
                return ns;
            }));
            setRequests(prev => prev.filter((_, i) => i !== moveTargetIdx));
            if (selectedIndex === moveTargetIdx) setSelectedIndex(0);
        }
        setMoveOpen(false);
        setMoveTargetIdx(null);
    };

    const createFolderInNs = (nsId) => {
        const id = Math.random().toString(36).substring(2, 9);
        const name = `New Folder`;
        if (nsId === activeNamespaceId) {
            setFolders([...folders, { id, name, expanded: true }]);
        } else {
            setNamespaces(prev => prev.map(ns => {
                if (ns.id === nsId) {
                    return { ...ns, folders: [...(ns.folders || []), { id, name, expanded: true }] };
                }
                return ns;
            }));
        }
    };

    const buildUrl = () => {
        const src = interpolateUrlVariables(selected?.url?.trim() || '');
        if (!src) throw new Error('Please enter a URL');
        return src.includes('://') ? src : `https://${src}`;
    };

    const onSend = async () => {
        setError('');
        setSending(true);
        setCsvPage(1);
        try {
            const interpolatedBody = interpolateBodyVariables(requestBody);
            const resolvedHeaders = Object.fromEntries(
                Object.entries(filteredHeaders).map(([key, value]) => [key, interpolateVariables(value)])
            );
            const payload = {
                method: selected.method,
                url: buildUrl(),
                body: interpolatedBody,
                headers: interpolatedBody.trim().length > 0 && !Object.keys(resolvedHeaders).some((h) => h.toLowerCase() === 'content-type')
                    ? { ...resolvedHeaders, 'Content-Type': 'application/json' }
                    : resolvedHeaders,
            };
            const result = await window.fetchxApi.sendRequest(payload);
            setElapsed(`${result.elapsedMs} ms`);
            setTimeline(result.timeline || []);
            if (!result.ok) {
                setStatus('-');
                setResponseHeaders({});
                setResponseBody('{}');
                setRawResponse(result.error || 'Request failed');
                setError(result.error || 'Request failed');
                return;
            }
            const reason = STATUS_REASON[result.status] ?? '';
            setStatus(reason ? `${result.status} ${reason}` : String(result.status));
            setResponseHeaders(result.headers || {});
            setResponseBody(parseBody(result.body || ''));
            setRawRequest(result.rawRequest || '');
            setRawResponse(result.rawResponse || '');
            setResponseTab('body');
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            setStatus('-');
        } finally {
            setSending(false);
        }
    };

    const beautify = () => {
        try {
            setRequestBody(JSON.stringify(JSON.parse(requestBody), null, 2));
            setError('');
        } catch {
            setError('Body is not valid JSON.');
        }
    };

    // === EXPORT IMPORT LOGIC ===
    const parseOpenApi = (content) => {
        try {
            let doc;
            try {
                doc = JSON.parse(content);
            } catch {
                doc = yaml.load(content);
            }

            const resolveRef = (node, seen = new Set()) => {
                if (!node || typeof node !== 'object') return node;
                if (typeof node.$ref === 'string' && node.$ref.startsWith('#/')) {
                    if (seen.has(node.$ref)) return {};
                    const nextSeen = new Set(seen);
                    nextSeen.add(node.$ref);
                    const target = node.$ref
                        .slice(2)
                        .split('/')
                        .reduce((acc, part) => (acc && typeof acc === 'object' ? acc[part] : undefined), doc);
                    return resolveRef(target, nextSeen);
                }
                return node;
            };

            const firstObjectValue = (obj) => {
                if (!obj || typeof obj !== 'object') return undefined;
                const values = Object.values(obj);
                return values.length ? values[0] : undefined;
            };

            const toCellValue = (value) => {
                if (value === null || value === undefined) return '';
                if (typeof value === 'string') return value;
                if (typeof value === 'number' || typeof value === 'boolean') return String(value);
                try {
                    return JSON.stringify(value);
                } catch {
                    return String(value);
                }
            };

            const pickSchemaExample = (schema, depth = 0) => {
                const resolved = resolveRef(schema);
                if (!resolved || depth > 6 || typeof resolved !== 'object') return undefined;

                if (resolved.example !== undefined) return resolved.example;
                if (resolved.default !== undefined) return resolved.default;
                if (Array.isArray(resolved.enum) && resolved.enum.length > 0) return resolved.enum[0];
                if (Array.isArray(resolved.examples) && resolved.examples.length > 0) return resolved.examples[0];
                if (resolved.examples && typeof resolved.examples === 'object') {
                    const exEntry = firstObjectValue(resolved.examples);
                    if (exEntry && typeof exEntry === 'object' && 'value' in exEntry) return exEntry.value;
                    if (exEntry !== undefined) return exEntry;
                }

                if (Array.isArray(resolved.oneOf) && resolved.oneOf.length > 0) {
                    return pickSchemaExample(resolved.oneOf[0], depth + 1);
                }
                if (Array.isArray(resolved.anyOf) && resolved.anyOf.length > 0) {
                    return pickSchemaExample(resolved.anyOf[0], depth + 1);
                }
                if (Array.isArray(resolved.allOf) && resolved.allOf.length > 0) {
                    const merged = {};
                    resolved.allOf.forEach((part) => {
                        const partExample = pickSchemaExample(part, depth + 1);
                        if (partExample && typeof partExample === 'object' && !Array.isArray(partExample)) {
                            Object.assign(merged, partExample);
                        }
                    });
                    if (Object.keys(merged).length > 0) return merged;
                    return pickSchemaExample(resolved.allOf[0], depth + 1);
                }

                if (resolved.type === 'object' || resolved.properties) {
                    const out = {};
                    const props = resolved.properties || {};
                    Object.entries(props).forEach(([key, propSchema]) => {
                        const value = pickSchemaExample(propSchema, depth + 1);
                        out[key] = value !== undefined ? value : '';
                    });
                    return out;
                }

                if (resolved.type === 'array' || resolved.items) {
                    const itemExample = pickSchemaExample(resolved.items, depth + 1);
                    return itemExample === undefined ? [] : [itemExample];
                }

                if (resolved.type === 'integer' || resolved.type === 'number') return 0;
                if (resolved.type === 'boolean') return true;
                if (resolved.type === 'string') return '';
                return undefined;
            };

            const pickParameterValue = (param) => {
                const p = resolveRef(param);
                if (!p || typeof p !== 'object') return '';

                if (p.example !== undefined) return toCellValue(p.example);
                if (p.examples && typeof p.examples === 'object') {
                    const exEntry = firstObjectValue(p.examples);
                    if (exEntry && typeof exEntry === 'object' && 'value' in exEntry) {
                        return toCellValue(exEntry.value);
                    }
                    if (exEntry !== undefined) return toCellValue(exEntry);
                }

                if (p.schema) {
                    const schemaExample = pickSchemaExample(p.schema);
                    if (schemaExample !== undefined) return toCellValue(schemaExample);
                }

                if (p.content && typeof p.content === 'object') {
                    const media = resolveRef(firstObjectValue(p.content));
                    if (media?.example !== undefined) return toCellValue(media.example);
                    if (media?.examples && typeof media.examples === 'object') {
                        const exEntry = firstObjectValue(media.examples);
                        if (exEntry && typeof exEntry === 'object' && 'value' in exEntry) {
                            return toCellValue(exEntry.value);
                        }
                        if (exEntry !== undefined) return toCellValue(exEntry);
                    }
                    if (media?.schema) {
                        const schemaExample = pickSchemaExample(media.schema);
                        if (schemaExample !== undefined) return toCellValue(schemaExample);
                    }
                }

                if (p.default !== undefined) return toCellValue(p.default);
                if (Array.isArray(p.enum) && p.enum.length > 0) return toCellValue(p.enum[0]);
                if (p.required) return `{{${p.name}}}`;
                return '';
            };

            const extractRequestBody = (operation) => {
                const op = resolveRef(operation) || {};

                // OpenAPI 3.x requestBody
                const requestBody = resolveRef(op.requestBody);
                if (requestBody?.content && typeof requestBody.content === 'object') {
                    const contentTypes = Object.keys(requestBody.content);
                    const preferredType = contentTypes.find((t) => t.includes('json')) || contentTypes[0];
                    if (preferredType) {
                        const media = resolveRef(requestBody.content[preferredType]);
                        let example = media?.example;
                        if (example === undefined && media?.examples && typeof media.examples === 'object') {
                            const exEntry = firstObjectValue(media.examples);
                            example = exEntry && typeof exEntry === 'object' && 'value' in exEntry ? exEntry.value : exEntry;
                        }
                        if (example === undefined && media?.schema) {
                            example = pickSchemaExample(media.schema);
                        }

                        let bodyText = '';
                        if (example !== undefined) {
                            if (typeof example === 'string' && !preferredType.includes('json')) {
                                bodyText = example;
                            } else {
                                bodyText = JSON.stringify(example, null, 2);
                            }
                        }
                        return { bodyText, contentType: preferredType };
                    }
                }

                // Swagger 2.0 body/formData
                const opParams = Array.isArray(op.parameters) ? op.parameters.map(resolveRef).filter(Boolean) : [];
                const bodyParam = opParams.find((p) => p.in === 'body');
                if (bodyParam?.schema) {
                    const example = pickSchemaExample(bodyParam.schema);
                    const bodyText = example !== undefined ? JSON.stringify(example, null, 2) : '';
                    const consumes = op.consumes || doc.consumes || [];
                    const contentType = consumes.find((t) => t.includes('json')) || consumes[0] || 'application/json';
                    return { bodyText, contentType };
                }

                const formParams = opParams.filter((p) => p.in === 'formData');
                if (formParams.length > 0) {
                    const formObject = {};
                    formParams.forEach((param) => {
                        formObject[param.name] = pickParameterValue(param) || '';
                    });
                    const consumes = op.consumes || doc.consumes || [];
                    const contentType = consumes[0] || 'application/x-www-form-urlencoded';
                    return { bodyText: JSON.stringify(formObject, null, 2), contentType };
                }

                return { bodyText: '', contentType: null };
            };

            const addRowIfMissing = (rows, key, value) => {
                const normalizedKey = String(key || '').trim();
                if (!normalizedKey) return;
                if (rows.some((row) => String(row.key || '').trim().toLowerCase() === normalizedKey.toLowerCase())) return;
                rows.push({ enabled: true, key: normalizedKey, value: value ?? '' });
            };

            const applySecurityDefaults = (operation, queryRows, headerRows) => {
                const schemes = doc.components?.securitySchemes || doc.securityDefinitions || {};
                const securityRequirements = operation.security !== undefined ? operation.security : doc.security;
                if (!Array.isArray(securityRequirements) || securityRequirements.length === 0) return;

                securityRequirements.forEach((requirement) => {
                    if (!requirement || typeof requirement !== 'object') return;
                    Object.keys(requirement).forEach((schemeName) => {
                        const scheme = resolveRef(schemes[schemeName]);
                        if (!scheme || typeof scheme !== 'object') return;

                        const type = scheme.type;
                        if (type === 'apiKey') {
                            const keyName = scheme.name || schemeName;
                            const placeholder = `{{${schemeName}}}`;
                            if (scheme.in === 'query') addRowIfMissing(queryRows, keyName, placeholder);
                            else if (scheme.in === 'header') addRowIfMissing(headerRows, keyName, placeholder);
                            else if (scheme.in === 'cookie') addRowIfMissing(headerRows, 'Cookie', `${keyName}=${placeholder}`);
                            return;
                        }

                        if (type === 'http') {
                            const httpScheme = (scheme.scheme || '').toLowerCase();
                            if (httpScheme === 'basic') {
                                addRowIfMissing(headerRows, 'Authorization', 'Basic {{base64Credentials}}');
                            } else {
                                addRowIfMissing(headerRows, 'Authorization', 'Bearer {{token}}');
                            }
                            return;
                        }

                        if (type === 'oauth2' || type === 'openIdConnect' || type === 'openId') {
                            addRowIfMissing(headerRows, 'Authorization', 'Bearer {{token}}');
                            return;
                        }

                        // Swagger 2.0 non-http basic
                        if (type === 'basic') {
                            addRowIfMissing(headerRows, 'Authorization', 'Basic {{base64Credentials}}');
                        }
                    });
                });
            };

            let baseUrl = 'http://localhost';
            if (doc.servers && doc.servers[0]?.url) {
                baseUrl = doc.servers[0].url;
            } else if (doc.host) {
                const scheme = doc.schemes?.[0] || 'http';
                baseUrl = `${scheme}://${doc.host}${doc.basePath || ''}`;
            }

            if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

            const newRequests = [];
            const newFolders = [];
            const tagMap = new Map();

            if (doc.paths) {
                Object.entries(doc.paths).forEach(([pathName, pathObj]) => {
                    Object.entries(pathObj).forEach(([method, methodObj]) => {
                        if (METHODS.includes(method.toUpperCase())) {
                            const operation = resolveRef(methodObj) || {};
                            const tags = operation.tags || [];
                            let folderId = null;
                            if (tags.length > 0) {
                                const tagName = tags[0];
                                if (!tagMap.has(tagName)) {
                                    const id = createId();
                                    tagMap.set(tagName, id);
                                    newFolders.push({ id, name: tagName, expanded: true });
                                }
                                folderId = tagMap.get(tagName);
                            }

                            const parameterMap = new Map();
                            const pathParams = Array.isArray(pathObj.parameters) ? pathObj.parameters : [];
                            const operationParams = Array.isArray(operation.parameters) ? operation.parameters : [];
                            [...pathParams, ...operationParams].forEach((param) => {
                                const resolved = resolveRef(param);
                                if (!resolved?.name || !resolved?.in) return;
                                parameterMap.set(`${resolved.in}:${resolved.name}`, resolved);
                            });

                            const queryRows = [];
                            const headerRows = [];
                            const cookiePairs = [];
                            let resolvedPath = pathName;

                            parameterMap.forEach((param) => {
                                const value = pickParameterValue(param);
                                if (param.in === 'query') {
                                    queryRows.push({ enabled: true, key: param.name, value });
                                } else if (param.in === 'header') {
                                    headerRows.push({ enabled: true, key: param.name, value });
                                } else if (param.in === 'cookie') {
                                    cookiePairs.push(`${param.name}=${value || `{{${param.name}}}`}`);
                                } else if (param.in === 'path') {
                                    const token = value || `{{${param.name}}}`;
                                    const replacement = token.startsWith('{') ? token : encodeURIComponent(token);
                                    resolvedPath = resolvedPath.replace(new RegExp(`\\{${param.name}\\}`, 'g'), replacement);
                                }
                            });

                            const { bodyText, contentType } = extractRequestBody(operation);
                            if (contentType) {
                                addRowIfMissing(headerRows, 'Content-Type', contentType);
                            }
                            if (cookiePairs.length > 0) {
                                addRowIfMissing(headerRows, 'Cookie', cookiePairs.join('; '));
                            }

                            applySecurityDefaults(operation, queryRows, headerRows);

                            newRequests.push({
                                id: createId(),
                                name: operation.summary || operation.operationId || `${method.toUpperCase()} ${pathName}`,
                                method: method.toUpperCase(),
                                url: `${baseUrl}${resolvedPath}`,
                                queryRows: queryRows.length > 0 ? queryRows : [makeRow()],
                                headerRows: headerRows.length > 0 ? headerRows : [makeRow()],
                                body: bodyText,
                                variablesJson: DEFAULT_REQUEST_VARIABLES_JSON,
                                folderId
                            });
                        }
                    });
                });
            }
            return {
                name: doc.info?.title || 'Imported API',
                requests: newRequests,
                folders: newFolders
            };
        } catch (err) {
            setError('Invalid OpenAPI Spec: ' + err.message);
            return null;
        }
    };

    const handleImportSource = async () => {
        setImportLoading(true);
        let specData = null;

        if (importSource === 'url') {
            try {
                const payload = { method: 'GET', url: importUrl, headers: {} };
                const result = await window.fetchxApi.sendRequest(payload);
                if (result.ok) {
                    specData = parseOpenApi(result.body);
                } else {
                    setError(result.error || 'Failed to fetch spec from URL');
                }
            } catch (err) {
                setError('Failed to fetch URL: ' + err.message);
            }
        }

        if (specData) {
            setImportedSpec(specData);
            setImportStep(1);
        }
        setImportLoading(false);
    };

    const finishImport = () => {
        if (!importedSpec) return;

        if (importTarget === 'current') {
            setRequests(prev => [...prev, ...importedSpec.requests]);
            setFolders(prev => [...prev, ...(importedSpec.folders || [])]);
            setImportOpen(false);
            setImportStep(0);
            setImportedSpec(null);
        } else {
            setImportStep(2);
            setNewNsName(importedSpec.name);
        }
    };

    const confirmImportNamespace = () => {
        const id = Date.now().toString();
        const newNs = {
            id,
            name: newNsName,
            icon: newNsIcon,
            requests: importedSpec.requests,
            folders: importedSpec.folders || [],
            sidebarOrder: [],
            selectedIndex: 0,
            sourceUrl: importSource === 'url' ? importUrl : null
        };
        setNamespaces([...namespaces, newNs]);
        setImportOpen(false);
        setImportStep(0);
        setImportedSpec(null);
        switchNamespace(id);
    };

    const refreshOpenApi = async (namespaceId) => {
        const ns = namespaces.find(n => n.id === namespaceId);
        if (!ns || !ns.sourceUrl) return;

        setImportLoading(true);
        try {
            const payload = { method: 'GET', url: ns.sourceUrl, headers: {} };
            const result = await window.fetchxApi.sendRequest(payload);
            if (result.ok) {
                const specData = parseOpenApi(result.body);
                if (specData) {
                    setNamespaces(prev => prev.map(n =>
                        n.id === namespaceId ? { ...n, requests: specData.requests, folders: specData.folders || [] } : n
                    ));
                    if (activeNamespaceId === namespaceId) {
                        setRequests(specData.requests);
                        setFolders(specData.folders || []);
                    }
                }
            }
        } catch (err) {
            setError('Failed to refresh spec: ' + err.message);
        }
        setImportLoading(false);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const specData = parseOpenApi(event.target.result);
            if (specData) {
                setImportedSpec(specData);
                setImportStep(1);
            }
        };
        reader.readAsText(file);
    };

    const downloadResponse = () => {
        if (!responseBody) return;
        const ct = (responseHeaders['content-type'] || responseHeaders['Content-Type'] || 'application/octet-stream').split(';')[0];
        const extension = ct.split('/')[1] || 'bin';
        const filename = `fetchx-response-${Date.now()}.${extension}`;

        const link = document.createElement('a');
        link.href = responseBody.startsWith('data:') ? responseBody : `data:${ct};base64,${responseBody}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const syncRowsFromUrl = (newUrl) => {
        try {
            const urlPart = newUrl.includes('?') ? newUrl.split('?')[1] : '';
            const params = new URLSearchParams(urlPart);
            const newRows = [];
            params.forEach((value, key) => {
                newRows.push({ enabled: true, key, value });
            });
            if (newRows.length === 0) newRows.push(makeRow());
            setQueryRows(newRows);
        } catch { }
    };

    const openRequestMenu = (event, index = null, folderId = null) => {
        event.preventDefault();
        setRequestMenu({ open: true, mouseX: event.clientX + 2, mouseY: event.clientY - 6, index, folderId });
    };

    const closeRequestMenu = () => setRequestMenu({ open: false, mouseX: null, mouseY: null, index: null, folderId: null });

    // === CONTEXT VALUE ===
    const value = {
        // Theme
        theme, themeName, setThemeName, fontPreset, setFontPreset, currentFont,

        // Dialogs
        settingsOpen, setSettingsOpen,
        searchOpen, setSearchOpen, searchQuery, setSearchQuery, searchInputRef,
        nsDialogOpen, setNsDialogOpen, newNsName, setNewNsName, newNsIcon, setNewNsIcon, iconSearch, setIconSearch,
        requestMenu, openRequestMenu, closeRequestMenu,
        moveOpen, setMoveOpen, moveTargetIdx, setMoveTargetIdx, expandedNsMove, setExpandedNsMove,
        importOpen, setImportOpen, importStep, setImportStep, importSource, setImportSource, importUrl, setImportUrl,
        importTarget, setImportTarget, importLoading, setImportLoading, importedSpec, setImportedSpec,

        // Workspaces
        namespaces, setNamespaces, activeNamespaceId, activeNamespace, switchNamespace, addNamespace, confirmAddNamespace,

        // Active Workspace State
        requests, setRequests, folders, setFolders,
        selectedIndex, setSelectedIndex, selected,
        sidebarOrder, setSidebarOrder,
        activeDragId, setActiveDragId,
        variablesJson, setVariablesJson,
        editingIndex, setEditingIndex, editingValue, setEditingValue,

        // Actions
        updateSelected, addRequest, addFolder, deleteRequest, toggleFolder, deleteFolder,
        startRenameFolder, saveFolderRename, startRenameRequest, saveRename,
        onDragEnd, confirmMoveRequest, createFolderInNs,

        // Composer State
        composerTab, setComposerTab, queryRows, setQueryRows, headerRows, setHeaderRows,
        requestBody, setRequestBody, updateRows, syncRowsFromUrl,
        filteredHeaders,

        // Send logic
        onSend, sending, beautify, status, elapsed, error, setError,

        // Response State
        responseTab, setResponseTab, responseBody, setResponseBody, responseHeaders, setResponseHeaders,
        rawRequest, setRawRequest, rawResponse, setRawResponse, timeline, setTimeline,
        csvPage, setCsvPage, bodyMode, setBodyMode, bodyMenuAnchor, setBodyMenuAnchor,
        jsonFilter, setJsonFilter,

        // Exports
        handleImportSource, handleFileChange, finishImport, confirmImportNamespace, refreshOpenApi,
        downloadResponse,

        // Monaco
        monacoApi, setMonacoApi,
    };

    return (
        <FetchXContext.Provider value={value}>
            {children}
        </FetchXContext.Provider>
    );
}

export function useFetchX() {
    const context = useContext(FetchXContext);
    if (!context) {
        throw new Error('useFetchX must be used within a FetchXProvider');
    }
    return context;
}
