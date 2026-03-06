import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography, Select, MenuItem, Menu, Button, Checkbox, TextField, Tooltip } from '@mui/material';
import Editor from '@monaco-editor/react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { useFetchX } from '../../context/FetchXContext';
import { METHODS, COMPOSER_TABS, METHOD_COLORS, makeRow } from '../../utils/constants';

const parseVariableLookup = (rawJson) => {
    try {
        const parsed = JSON.parse(typeof rawJson === 'string' ? rawJson : '{}');
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
        return Object.fromEntries(
            Object.entries(parsed).map(([key, value]) => [String(key), value])
        );
    } catch {
        const fallback = {};
        const raw = typeof rawJson === 'string' ? rawJson : '';
        const keyRegex = /"([^"\\]+)"\s*:/g;
        let match = keyRegex.exec(raw);
        while (match) {
            const key = String(match[1] || '').trim();
            if (key && !Object.prototype.hasOwnProperty.call(fallback, key)) {
                fallback[key] = '';
            }
            match = keyRegex.exec(raw);
        }
        return fallback;
    }
};

const inferVariableType = (value) => {
    if (Array.isArray(value)) return 'array';
    if (value === null) return 'null';
    return typeof value;
};

const toPreviewString = (value) => {
    if (value === undefined) return '';
    if (value === null) return 'null';
    if (typeof value === 'string') return value;
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
};

const toReplacementString = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
};

const upsertVariableInJson = (rawJson, variableName) => {
    const safeName = String(variableName || '').trim();
    if (!safeName) return typeof rawJson === 'string' ? rawJson : '{}';

    let base = {};
    try {
        const parsed = JSON.parse(typeof rawJson === 'string' ? rawJson : '{}');
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            base = { ...parsed };
        }
    } catch {
        base = { ...parseVariableLookup(rawJson) };
    }

    if (!Object.prototype.hasOwnProperty.call(base, safeName)) {
        base[safeName] = '';
    }
    return JSON.stringify(base, null, 2);
};

const getTemplateContextAtCursor = (value, cursor) => {
    const source = String(value ?? '');
    const safeCursor = Math.max(0, Math.min(typeof cursor === 'number' ? cursor : source.length, source.length));
    const beforeCursor = source.slice(0, safeCursor);
    const openIndex = beforeCursor.lastIndexOf('{{');
    if (openIndex < 0) return null;
    const closeIndex = beforeCursor.lastIndexOf('}}');
    if (closeIndex > openIndex) return null;
    const afterOpen = beforeCursor.slice(openIndex + 2);
    const match = afterOpen.match(/^\s*([a-zA-Z0-9_.-]*)$/);
    if (!match) return null;
    const typed = match[1] || '';
    return {
        typed,
        replaceStart: safeCursor - typed.length,
        replaceEnd: safeCursor,
    };
};

const extractMissingTemplateNames = (value, variableLookup) => {
    const source = String(value ?? '');
    const missing = [];
    const seen = new Set();
    const regex = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;
    let match = regex.exec(source);
    while (match) {
        const name = String(match[1] || '').trim();
        if (name && !Object.prototype.hasOwnProperty.call(variableLookup, name) && !seen.has(name)) {
            seen.add(name);
            missing.push(name);
        }
        match = regex.exec(source);
    }
    return missing;
};

const sameTemplateTarget = (a, b) =>
    a?.type === b?.type &&
    a?.tab === b?.tab &&
    a?.index === b?.index &&
    a?.field === b?.field;

const getTemplateFieldState = (value, variableLookup) => {
    const source = String(value ?? '');
    const hasTemplate = /\{\{\s*[a-zA-Z0-9_.-]+\s*\}\}/.test(source);
    const missing = extractMissingTemplateNames(source, variableLookup);
    return { hasTemplate, missing };
};

export function ComposerPanel() {
    const {
        theme,
        selected,
        updateSelected,
        syncRowsFromUrl,
        onSend,
        sending,
        composerTab,
        setComposerTab,
        requestBody,
        setRequestBody,
        beautify,
        queryRows,
        setQueryRows,
        headerRows,
        setHeaderRows,
        updateRows,
        variablesJson,
        setVariablesJson
    } = useFetchX();

    const activeMethodTone = METHOD_COLORS[selected?.method] ?? theme.primary;

    const tabButtonSx = (active) => ({
        minWidth: 0,
        height: '100%',
        px: 1.5,
        borderRadius: '0px',
        bgcolor: 'transparent',
        color: active ? theme.text : theme.muted,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.08em',
        border: 'none',
        boxShadow: active ? `inset 0 -2px 0 ${theme.primary}` : 'none',
        background: active && theme.gradient ? `linear-gradient(to top, ${theme.primary}10, transparent 6px), inset 0 -2px 0 ${theme.primary}` : 'none',
        transition: 'all 120ms ease',
        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.02)', color: theme.text },
    });

    const fieldSx = {
        flex: 1,
        height: '100%',
        '& .MuiOutlinedInput-root': {
            height: '100%',
            borderRadius: 0,
            bgcolor: 'transparent',
            color: theme.text,
            '& fieldset': { border: 'none' },
            '&:hover fieldset': { border: 'none' },
            '&.Mui-focused fieldset': { border: 'none' },
            '& input': { px: 1, py: 0, height: '100%', fontSize: 13, fontFamily: 'monospace' }
        },
        '& .MuiInputBase-input::placeholder': { color: theme.muted, opacity: 0.5 },
    };

    const previewCardSx = {
        border: `1px solid ${theme.border}`,
        borderRadius: '12px',
        bgcolor: theme.panelHeader,
        overflow: 'hidden',
        boxShadow: theme.isDark ? '0 12px 28px rgba(0, 0, 0, 0.45)' : '0 12px 28px rgba(0, 0, 0, 0.1)',
    };

    const previewData = useMemo(() => {
        const vars = parseVariableLookup(variablesJson);
        const normalizeTemplateInput = (input) => String(input ?? '')
            .replace(/%7B%7B/gi, '{{')
            .replace(/%7D%7D/gi, '}}');

        const interpolateLoose = (input) => {
            const normalized = String(input ?? '')
                .replace(/%7B%7B/gi, '{{')
                .replace(/%7D%7D/gi, '}}');
            return normalized.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (fullMatch, name) => {
                if (Object.prototype.hasOwnProperty.call(vars, name)) {
                    return toReplacementString(vars[name]);
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

        const interpolateJsonBody = (input) => {
            const text = normalizeTemplateInput(input);
            return text.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (fullMatch, name, offset) => {
                if (!Object.prototype.hasOwnProperty.call(vars, name)) return fullMatch;
                const value = vars[name];
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

        const interpolatePreviewUrl = (input) => {
            const text = normalizeTemplateInput(input).trim();
            if (!text) return '';

            const [rawPath, ...rawQueryParts] = text.split('?');
            const resolvedPath = interpolateLoose(rawPath);
            const rawQuery = rawQueryParts.join('?');
            if (!rawQuery) return resolvedPath;

            const encodedPairs = rawQuery
                .split('&')
                .filter((segment) => segment.length > 0)
                .map((segment) => {
                    const eqIndex = segment.indexOf('=');
                    const rawKey = eqIndex === -1 ? segment : segment.slice(0, eqIndex);
                    const rawValue = eqIndex === -1 ? '' : segment.slice(eqIndex + 1);
                    const resolvedKey = interpolateLoose(decodeURIComponentSafe(rawKey));
                    const resolvedValue = interpolateLoose(decodeURIComponentSafe(rawValue));
                    return `${encodeURIComponent(resolvedKey)}=${encodeURIComponent(resolvedValue)}`;
                });
            return encodedPairs.length > 0 ? `${resolvedPath}?${encodedPairs.join('&')}` : resolvedPath;
        };

        const unresolvedByName = new Map();
        const collectUnresolved = (source, location) => {
            const text = String(source ?? '');
            const regex = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;
            let match = regex.exec(text);
            while (match) {
                const name = String(match[1] || '').trim();
                if (name && !Object.prototype.hasOwnProperty.call(vars, name)) {
                    const locations = unresolvedByName.get(name) ?? new Set();
                    locations.add(location);
                    unresolvedByName.set(name, locations);
                }
                match = regex.exec(text);
            }
        };

        const method = selected?.method || 'GET';
        const rawUrlInput = selected?.url || '';
        const interpolatedUrl = interpolatePreviewUrl(rawUrlInput).trim();
        const fullUrl = interpolatedUrl && !interpolatedUrl.includes('://')
            ? `https://${interpolatedUrl}`
            : interpolatedUrl;

        const filteredQueryRows = queryRows.filter((row) => row.enabled && String(row.key || '').trim());
        const filteredHeaderRows = headerRows.filter((row) => row.enabled && String(row.key || '').trim());

        const queryEntries = filteredQueryRows
            .map((row) => ({
                key: interpolateLoose(row.key).trim(),
                value: interpolateLoose(row.value),
            }))
            .filter((row) => row.key);

        const headers = filteredHeaderRows
            .map((row) => ({
                key: interpolateLoose(row.key).trim(),
                value: interpolateLoose(row.value),
                inferred: false,
            }))
            .filter((row) => row.key);

        const body = interpolateJsonBody(requestBody ?? '');
        if (body.trim() && !headers.some((header) => header.key.toLowerCase() === 'content-type')) {
            headers.push({ key: 'Content-Type', value: 'application/json', inferred: true });
        }

        collectUnresolved(rawUrlInput, 'URL');
        filteredQueryRows.forEach((row) => {
            collectUnresolved(row.key, 'Query key');
            collectUnresolved(row.value, 'Query value');
        });
        filteredHeaderRows.forEach((row) => {
            collectUnresolved(row.key, 'Header key');
            collectUnresolved(row.value, 'Header value');
        });
        collectUnresolved(requestBody, 'Body');

        const unresolvedVariables = Array.from(unresolvedByName.entries()).map(([name, locations]) => ({
            name,
            locations: Array.from(locations),
        }));

        let urlQueryEntries = [];
        if (fullUrl) {
            try {
                const parsed = new URL(fullUrl);
                const entries = [];
                parsed.searchParams.forEach((value, key) => entries.push({ key, value }));
                urlQueryEntries = entries;
            } catch {
                urlQueryEntries = queryEntries;
            }
        }

        const requestLine = `${method} ${fullUrl || '(empty url)'}`;
        const rawHeaderBlock = headers.map((h) => `${h.key}: ${h.value}`).join('\n');
        const rawRequestPreview = `${requestLine}${rawHeaderBlock ? `\n${rawHeaderBlock}` : ''}\n\n${body}`;

        return {
            method,
            url: fullUrl || '(empty url)',
            body,
            headers,
            queryEntries: urlQueryEntries.length > 0 ? urlQueryEntries : queryEntries,
            unresolvedVariables,
            rawRequestPreview,
        };
    }, [selected?.method, selected?.url, queryRows, headerRows, requestBody, variablesJson]);

    const variableCompletionDisposableRef = useRef(null);
    const variableCodeActionDisposableRef = useRef(null);
    const variableAddCommandDisposableRef = useRef(null);
    const validationDisposableRef = useRef(null);
    const editorRef = useRef(null);
    const monacoRef = useRef(null);
    const templateAssistTimerRef = useRef(null);
    const variableLookupRef = useRef(parseVariableLookup(variablesJson));
    const validateTemplateAwareJsonRef = useRef(() => {});

    const clearTemplateAssistTimer = () => {
        if (templateAssistTimerRef.current !== null) {
            window.clearTimeout(templateAssistTimerRef.current);
            templateAssistTimerRef.current = null;
        }
    };

    useEffect(() => () => {
        variableCompletionDisposableRef.current?.dispose?.();
        variableCodeActionDisposableRef.current?.dispose?.();
        variableAddCommandDisposableRef.current?.dispose?.();
        validationDisposableRef.current?.dispose?.();
        clearTemplateAssistTimer();
    }, []);

    const variableLookup = () => parseVariableLookup(variablesJson);

    const [templateAssist, setTemplateAssist] = useState({
        open: false,
        anchorEl: null,
        target: null,
        suggestions: [],
        activeIndex: 0,
        replaceStart: 0,
        replaceEnd: 0,
    });
    const [focusedTemplateFieldKey, setFocusedTemplateFieldKey] = useState(null);
    const [templateValidationTouched, setTemplateValidationTouched] = useState({});

    const getTemplateFieldKey = (target) => {
        if (!target) return '';
        if (target.type === 'url') return 'url';
        return `${target.tab}:${target.index}:${target.field}`;
    };

    const shouldShowTemplateValidation = (target) => {
        const key = getTemplateFieldKey(target);
        if (!key) return false;
        if (focusedTemplateFieldKey === key) return false;
        return Boolean(templateValidationTouched[key]);
    };

    const closeTemplateAssist = () => {
        clearTemplateAssistTimer();
        setTemplateAssist((prev) => (prev.open
            ? { ...prev, open: false, anchorEl: null, target: null, suggestions: [], activeIndex: 0 }
            : prev));
    };

    const variableSuggestionItems = (typed) => {
        const normalizedTyped = String(typed || '').trim().toLowerCase();
        const seen = new Set();
        const items = [];
        Object.entries(variableLookupRef.current).forEach(([key, value]) => {
            const normalizedKey = String(key || '').trim();
            if (!normalizedKey || seen.has(normalizedKey)) return;
            if (normalizedTyped && !normalizedKey.toLowerCase().startsWith(normalizedTyped)) return;
            seen.add(normalizedKey);
            items.push({
                key: normalizedKey,
                type: inferVariableType(value),
                preview: toPreviewString(value),
            });
        });
        items.sort((a, b) => a.key.localeCompare(b.key));
        return items;
    };

    const getTargetValue = (target) => {
        if (!target) return '';
        if (target.type === 'url') return String(selected?.url ?? '');
        const rows = target.tab === 'query' ? queryRows : headerRows;
        const row = rows[target.index];
        if (!row) return '';
        return String(row[target.field] ?? '');
    };

    const setTargetValue = (target, nextValue) => {
        if (!target) return;
        if (target.type === 'url') {
            updateSelected({ url: nextValue });
            syncRowsFromUrl(nextValue);
            return;
        }
        const setter = target.tab === 'query' ? setQueryRows : setHeaderRows;
        const rows = target.tab === 'query' ? queryRows : headerRows;
        updateRows(setter, rows, target.index, { [target.field]: nextValue });
    };

    const defineMissingVariables = (names) => {
        const unique = Array.from(new Set((Array.isArray(names) ? names : []).map((name) => String(name || '').trim()).filter(Boolean)));
        if (unique.length === 0) return;
        setVariablesJson((prev) => unique.reduce((nextJson, name) => upsertVariableInJson(nextJson, name), prev));
    };

    const renderTemplateFixTooltip = (content, missingNames) => {
        if (!Array.isArray(missingNames) || missingNames.length === 0) return content;
        const list = missingNames.map((name) => `{{${name}}}`).join(', ');
        return (
            <Tooltip
                arrow
                placement="top"
                enterDelay={220}
                leaveDelay={100}
                slotProps={{
                    tooltip: {
                        sx: {
                            bgcolor: theme.bgElevated,
                            border: `1px solid ${theme.border}`,
                            boxShadow: theme.isDark ? '0 12px 24px rgba(0,0,0,0.45)' : '0 12px 24px rgba(0,0,0,0.12)',
                            maxWidth: 320,
                            p: 1,
                        }
                    }
                }}
                title={(
                    <Box>
                        <Typography sx={{ fontSize: 11, color: '#facc15', fontFamily: 'monospace', mb: 0.4 }}>
                            {`Undefined: ${list}`}
                        </Typography>
                        <Button
                            size="small"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                defineMissingVariables(missingNames);
                            }}
                            sx={{
                                minWidth: 0,
                                px: 0.9,
                                py: 0.25,
                                fontSize: 10,
                                fontWeight: 700,
                                color: '#facc15',
                                border: '1px solid rgba(250, 204, 21, 0.5)',
                                borderRadius: 0.8,
                                textTransform: 'none',
                                '&:hover': { bgcolor: 'rgba(250, 204, 21, 0.12)' },
                            }}
                        >
                            Define in Request Variables
                        </Button>
                    </Box>
                )}
            >
                <Box sx={{ display: 'flex', width: '100%', height: '100%' }}>
                    {content}
                </Box>
            </Tooltip>
        );
    };

    const openTemplateAssistForInput = (inputEl, value, target) => {
        const cursor = typeof inputEl?.selectionStart === 'number' ? inputEl.selectionStart : String(value ?? '').length;
        const ctx = getTemplateContextAtCursor(value, cursor);
        if (!ctx) {
            closeTemplateAssist();
            return;
        }
        const suggestions = variableSuggestionItems(ctx.typed);
        if (suggestions.length === 0) {
            closeTemplateAssist();
            return;
        }
        setTemplateAssist({
            open: true,
            anchorEl: inputEl,
            target,
            suggestions,
            activeIndex: 0,
            replaceStart: ctx.replaceStart,
            replaceEnd: ctx.replaceEnd,
        });
    };

    const applyTemplateSuggestion = (index = templateAssist.activeIndex) => {
        clearTemplateAssistTimer();
        const candidate = templateAssist.suggestions[index];
        const target = templateAssist.target;
        const inputEl = templateAssist.anchorEl;
        if (!candidate || !target) {
            closeTemplateAssist();
            return;
        }

        const currentValue = getTargetValue(target);
        const safeStart = Math.max(0, Math.min(templateAssist.replaceStart, currentValue.length));
        const safeEnd = Math.max(safeStart, Math.min(templateAssist.replaceEnd, currentValue.length));
        const nextValue = `${currentValue.slice(0, safeStart)}${candidate.key}${currentValue.slice(safeEnd)}`;
        setTargetValue(target, nextValue);
        closeTemplateAssist();

        const nextCursor = safeStart + candidate.key.length;
        requestAnimationFrame(() => {
            if (inputEl && typeof inputEl.focus === 'function') {
                inputEl.focus();
                if (typeof inputEl.setSelectionRange === 'function') {
                    inputEl.setSelectionRange(nextCursor, nextCursor);
                }
            }
        });
    };

    const scheduleTemplateAssistOpen = (inputEl, value, target) => {
        clearTemplateAssistTimer();
        templateAssistTimerRef.current = window.setTimeout(() => {
            openTemplateAssistForInput(inputEl, value, target);
        }, 1000);
    };

    const onTemplatedInputChange = (event, target, nextValue) => {
        scheduleTemplateAssistOpen(event.target, nextValue, target);
    };

    const onTemplatedInputKeyDown = (event, target) => {
        if (!templateAssist.open || !sameTemplateTarget(templateAssist.target, target)) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setTemplateAssist((prev) => ({ ...prev, activeIndex: (prev.activeIndex + 1) % prev.suggestions.length }));
            return;
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setTemplateAssist((prev) => ({ ...prev, activeIndex: (prev.activeIndex - 1 + prev.suggestions.length) % prev.suggestions.length }));
            return;
        }
        if (event.key === 'Enter' || event.key === 'Tab') {
            event.preventDefault();
            applyTemplateSuggestion();
            return;
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            closeTemplateAssist();
        }
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

    const asJsonStringFragment = (rawValue) => JSON.stringify(toPreviewString(rawValue)).slice(1, -1);

    const materializeTemplatesForLint = (sourceText) => {
        const vars = variableLookupRef.current;
        return sourceText.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (match, name, offset) => {
            const value = Object.prototype.hasOwnProperty.call(vars, name) ? vars[name] : '';
            if (isInsideJsonStringAt(sourceText, offset)) {
                return asJsonStringFragment(value);
            }
            return asJsonLiteral(value);
        });
    };

    const validateTemplateAwareJson = () => {
        const editor = editorRef.current;
        const monaco = monacoRef.current;
        if (!editor || !monaco) return;
        const model = editor.getModel();
        if (!model) return;

        const source = model.getValue();
        if (!source.trim()) {
            monaco.editor.setModelMarkers(model, 'fetchx-template-json', []);
            return;
        }

        const markers = [];
        const vars = variableLookupRef.current;
        const templateRegex = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;
        let templateMatch = templateRegex.exec(source);
        while (templateMatch) {
            const name = String(templateMatch[1] || '').trim();
            if (name && !Object.prototype.hasOwnProperty.call(vars, name)) {
                const startOffset = templateMatch.index;
                const endOffset = templateMatch.index + templateMatch[0].length;
                const start = model.getPositionAt(startOffset);
                const end = model.getPositionAt(endOffset);
                markers.push({
                    severity: monaco.MarkerSeverity.Warning,
                    message: `Variable "${name}" is not defined in Request Variables JSON.`,
                    code: `fetchx-undefined-variable:${name}`,
                    source: 'fetchx-template',
                    startLineNumber: start.lineNumber,
                    startColumn: start.column,
                    endLineNumber: end.lineNumber,
                    endColumn: end.column,
                });
            }
            templateMatch = templateRegex.exec(source);
        }

        const lintText = materializeTemplatesForLint(source);
        try {
            JSON.parse(lintText);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            const posMatch = message.match(/position\s+(\d+)/i);
            const position = posMatch ? Number(posMatch[1]) : 0;
            const safePos = Number.isFinite(position) ? Math.max(0, Math.min(position, source.length)) : 0;
            const loc = model.getPositionAt(safePos);
            markers.push({
                severity: monaco.MarkerSeverity.Error,
                message: `Template JSON error: ${message}`,
                source: 'fetchx-template',
                startLineNumber: loc.lineNumber,
                startColumn: loc.column,
                endLineNumber: loc.lineNumber,
                endColumn: loc.column + 1,
            });
        }
        monaco.editor.setModelMarkers(model, 'fetchx-template-json', markers);
    };

    useEffect(() => {
        validateTemplateAwareJsonRef.current = validateTemplateAwareJson;
    });

    const applyMonacoTheme = (monaco, t) => {
        monaco.editor.defineTheme('fetchx-theme', {
            base: t.isDark ? 'vs-dark' : 'vs',
            inherit: true,
            rules: [
                { token: 'string.key.json', foreground: t.primary.replace('#', '') },
                { token: 'string.value.json', foreground: t.secondary.replace('#', '') },
            ],
            colors: {
                'editor.background': t.editorBg,
                'editor.foreground': t.text,
                'editorLineNumber.foreground': t.isDark ? '#bcc9e4' : t.muted,
                'editorLineNumber.activeForeground': t.text,
                'editorGutter.background': t.editorGutterBg,
                'editor.lineHighlightBackground': t.isDark ? '#ffffff09' : '#00000007',
                'editorIndentGuide.background1': `${t.muted}44`,
                'editorIndentGuide.activeBackground1': `${t.primary}99`,
                'editor.selectionBackground': t.selection,
                'editorCursor.foreground': t.primary,
            },
        });
        monaco.editor.setTheme('fetchx-theme');
    };

    const localHandleMonacoMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        applyMonacoTheme(monaco, theme);
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
            validate: false,
            allowComments: false,
            enableSchemaRequest: false,
        });
        editor.updateOptions({
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontFamily: '"Geist Mono", "JetBrains Mono", "Fira Code", monospace',
            fontSize: 13,
            lineNumbersMinChars: 3,
            padding: { top: 10, bottom: 10 },
            folding: true,
            formatOnPaste: true,
            formatOnType: true,
            wordWrap: 'on',
            automaticLayout: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: { other: true, comments: false, strings: true },
        });

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
            editor.trigger('fetchx-vars', 'editor.action.triggerSuggest', {});
        });

        editor.onDidChangeModelContent(() => {
            const model = editor.getModel();
            const position = editor.getPosition();
            if (!model || !position) return;
            const beforeCursor = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
            });
            if (/\{\{\s*[a-zA-Z0-9_.-]*$/.test(beforeCursor)) {
                editor.trigger('fetchx-vars', 'editor.action.triggerSuggest', {});
            }
            validateTemplateAwareJsonRef.current?.();
        });

        validationDisposableRef.current?.dispose?.();
        validationDisposableRef.current = editor.onDidBlurEditorText(() => {
            validateTemplateAwareJsonRef.current?.();
        });

        variableCompletionDisposableRef.current?.dispose?.();
        variableCompletionDisposableRef.current = monaco.languages.registerCompletionItemProvider('json', {
            triggerCharacters: ['{'],
            provideCompletionItems(model, position) {
                const prefix = model.getValueInRange({
                    startLineNumber: position.lineNumber,
                    startColumn: 1,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column,
                });

                const openIndex = prefix.lastIndexOf('{{');
                const closeIndex = prefix.lastIndexOf('}}');
                const inTemplate = openIndex !== -1 && closeIndex < openIndex;
                if (!inTemplate) return { suggestions: [] };

                const match = prefix.match(/\{\{\s*([a-zA-Z0-9_.-]*)$/);
                if (!match) return { suggestions: [] };

                const typed = match[1] || '';
                const suggestions = [];
                const seen = new Set();
                const startColumn = position.column - typed.length;

                Object.entries(variableLookupRef.current).forEach(([key, value]) => {
                    const normalizedKey = String(key || '').trim();
                    const valueType = inferVariableType(value);
                    const normalizedValue = toPreviewString(value);
                    if (!normalizedKey || seen.has(normalizedKey)) return;
                    if (typed && !normalizedKey.toLowerCase().startsWith(typed.toLowerCase())) return;
                    seen.add(normalizedKey);
                    suggestions.push({
                        label: normalizedKey,
                        kind: monaco.languages.CompletionItemKind.Variable,
                        detail: `{{${normalizedKey}}} (${valueType})`,
                        documentation: normalizedValue
                            ? `Current value (${valueType}): ${normalizedValue.slice(0, 120)}${normalizedValue.length > 120 ? '…' : ''}`
                            : `Variable reference (${valueType})`,
                        insertText: normalizedKey,
                        range: {
                            startLineNumber: position.lineNumber,
                            endLineNumber: position.lineNumber,
                            startColumn,
                            endColumn: position.column,
                        },
                    });
                });

                return { suggestions };
            },
        });

        variableAddCommandDisposableRef.current?.dispose?.();
        variableAddCommandDisposableRef.current = monaco.editor.registerCommand('fetchx.addVariableFromTemplate', (_accessor, variableNameArg) => {
            const variableName = String(variableNameArg || '').trim();
            if (!variableName) return;
            setVariablesJson((prev) => upsertVariableInJson(prev, variableName));
        });

        const quickFixKind = monaco.languages?.CodeActionKind?.QuickFix || 'quickfix';
        variableCodeActionDisposableRef.current?.dispose?.();
        variableCodeActionDisposableRef.current = monaco.languages.registerCodeActionProvider('json', {
            providedCodeActionKinds: [quickFixKind],
            provideCodeActions(model, _range, context) {
                if (model !== editor.getModel()) return { actions: [], dispose: () => {} };

                const seen = new Set();
                const actions = [];
                context.markers.forEach((marker) => {
                    let variableName = '';
                    if (typeof marker.code === 'string' && marker.code.startsWith('fetchx-undefined-variable:')) {
                        variableName = marker.code.slice('fetchx-undefined-variable:'.length).trim();
                    } else {
                        const fromMessage = String(marker.message || '').match(/Variable "([^"]+)"/);
                        variableName = String(fromMessage?.[1] || '').trim();
                    }

                    if (!variableName || seen.has(variableName)) return;
                    seen.add(variableName);
                    actions.push({
                        title: `Define "${variableName}" in Request Variables`,
                        kind: quickFixKind,
                        diagnostics: [marker],
                        isPreferred: true,
                        command: {
                            id: 'fetchx.addVariableFromTemplate',
                            title: 'Add variable to request',
                            arguments: [variableName],
                        },
                    });
                });
                return { actions, dispose: () => {} };
            },
        });

        validateTemplateAwareJson();
    };

    const localHandleVariableEditorMount = (editor, monaco) => {
        applyMonacoTheme(monaco, theme);
        editor.updateOptions({
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontFamily: '"Geist Mono", "JetBrains Mono", "Fira Code", monospace',
            fontSize: 12,
            lineNumbers: 'off',
            folding: true,
            formatOnPaste: true,
            formatOnType: true,
            wordWrap: 'on',
            automaticLayout: true,
        });
    };

    useEffect(() => {
        variableLookupRef.current = variableLookup();
        validateTemplateAwareJsonRef.current?.();
    }, [variablesJson]);

    const urlTemplateState = useMemo(
        () => getTemplateFieldState(selected?.url ?? '', variableLookupRef.current),
        [selected?.url, variablesJson]
    );
    const urlTarget = { type: 'url' };
    const urlShowValidation = shouldShowTemplateValidation(urlTarget);
    const urlWarningText = (urlShowValidation && urlTemplateState.missing.length > 0)
        ? `Undefined variable(s): ${urlTemplateState.missing.map((name) => `{{${name}}}`).join(', ')}`
        : '';

    return (
        <Box sx={{
            height: '100%',
            bgcolor: theme.panel,
            borderRight: `1px solid ${theme.border}`,
            boxShadow: 'none',
            backdropFilter: `blur(${theme.glass.blur}) saturate(160%)`,
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column'
        }}>
            {/* URL BAR GRID ROW */}
            <Box sx={{ height: 44, display: 'flex', alignItems: 'stretch', bgcolor: theme.panelHeader, borderBottom: `1px solid ${theme.border}` }}>
                <Select
                    value={selected.method}
                    onChange={(e) => updateSelected({ method: e.target.value })}
                    variant="outlined" size="small"
                    sx={{
                        width: 90, minWidth: 90, height: '100%',
                        '& .MuiSelect-select': { display: 'flex', alignItems: 'center', height: '100% !important', py: 0, pl: 2, color: activeMethodTone, fontSize: 11, fontWeight: 500, fontFamily: 'monospace' },
                        '& .MuiOutlinedInput-notchedOutline': { border: 0 },
                        '& .MuiSvgIcon-root': { color: activeMethodTone, fontSize: 18 },
                        bgcolor: 'rgba(255, 255, 255, 0.01)',
                    }}
                    MenuProps={{
                        PaperProps: {
                            sx: {
                                bgcolor: theme.bgElevated,
                                borderRadius: 0,
                                border: `1px solid rgba(255,255,255,0.1)`,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                                backgroundImage: 'none',
                                color: theme.text,
                                '& .MuiMenuItem-root': {
                                    fontSize: 11,
                                    fontWeight: 500,
                                    color: theme.text,
                                    fontFamily: 'monospace',
                                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' },
                                    '&.Mui-selected': { bgcolor: `${theme.primary}25`, color: theme.primary },
                                },
                            },
                        },
                    }}
                >
                    {METHODS.map((m) => (
                        <MenuItem key={m} value={m} sx={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 500, color: METHOD_COLORS[m] ?? theme.text }}>{m}</MenuItem>
                    ))}
                </Select>
                {renderTemplateFixTooltip(
                    <Box
                        component="input"
                        value={selected.url}
                        title={urlWarningText}
                        onChange={(e) => {
                            const val = e.target.value;
                            updateSelected({ url: val });
                            syncRowsFromUrl(val);
                            onTemplatedInputChange(e, urlTarget, val);
                        }}
                        onKeyDown={(e) => onTemplatedInputKeyDown(e, urlTarget)}
                        onFocus={() => {
                            setFocusedTemplateFieldKey(getTemplateFieldKey(urlTarget));
                        }}
                        onBlur={() => {
                            const fieldKey = getTemplateFieldKey(urlTarget);
                            setFocusedTemplateFieldKey((prev) => (prev === fieldKey ? null : prev));
                            setTemplateValidationTouched((prev) => ({ ...prev, [fieldKey]: true }));
                            clearTemplateAssistTimer();
                            if (sameTemplateTarget(templateAssist.target, urlTarget)) {
                                setTimeout(() => closeTemplateAssist(), 90);
                            }
                        }}
                        sx={{
                            flex: 1,
                            px: 2,
                            border: 0,
                            outline: 'none',
                            bgcolor: (urlShowValidation && urlTemplateState.missing.length > 0)
                                ? 'rgba(250, 204, 21, 0.08)'
                                : ((urlShowValidation && urlTemplateState.hasTemplate) ? 'rgba(34, 197, 94, 0.08)' : 'transparent'),
                            color: theme.text,
                            fontSize: 13,
                            fontFamily: 'monospace',
                            borderLeft: `1px solid ${
                                (urlShowValidation && urlTemplateState.missing.length > 0)
                                    ? 'rgba(250, 204, 21, 0.65)'
                                    : ((urlShowValidation && urlTemplateState.hasTemplate) ? 'rgba(34, 197, 94, 0.65)' : theme.border)
                            }`,
                            borderRight: `1px solid ${
                                (urlShowValidation && urlTemplateState.missing.length > 0)
                                    ? 'rgba(250, 204, 21, 0.65)'
                                    : ((urlShowValidation && urlTemplateState.hasTemplate) ? 'rgba(34, 197, 94, 0.65)' : theme.border)
                            }`,
                            boxShadow: (urlShowValidation && urlTemplateState.missing.length > 0)
                                ? 'inset 0 -1px 0 rgba(250, 204, 21, 0.7)'
                                : ((urlShowValidation && urlTemplateState.hasTemplate) ? 'inset 0 -1px 0 rgba(34, 197, 94, 0.75)' : 'none'),
                        }}
                    />,
                    urlShowValidation ? urlTemplateState.missing : []
                )}
                <Button onClick={onSend} disabled={sending}
                    sx={{
                        minWidth: 100,
                        borderRadius: 0,
                        background: theme.gradient || theme.primary,
                        color: '#fff',
                        fontWeight: 500,
                        fontSize: 12,
                        height: '100%',
                        '&:hover': { background: theme.gradient ? theme.gradient : theme.secondary, filter: 'brightness(1.1)' },
                        '&:active': { transform: 'scale(0.98)' },
                        transition: 'all 0.1s ease',
                    }}
                >
                    {sending ? '...' : 'SEND'}
                </Button>
            </Box>
            {/* COMPOSER TABS */}
            <Box sx={{ height: 38, px: 0, display: 'flex', alignItems: 'center', bgcolor: theme.panelHeader, borderBottom: `1px solid ${theme.border}` }}>
                {COMPOSER_TABS.map((tab) => (
                    <Button key={tab} size="small" onClick={() => setComposerTab(tab)} sx={tabButtonSx(composerTab === tab)}>{tab.toUpperCase()}</Button>
                ))}
            </Box>
            {/* COMPOSER EDITOR */}
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
                {composerTab === 'json' && (
                    <PanelGroup direction="vertical">
                        <Panel defaultSize={68} minSize={30}>
                            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ flex: 1 }}>
                                    <Editor
                                        value={requestBody}
                                        language="json"
                                        height="100%"
                                        onChange={(v) => setRequestBody(v ?? '')}
                                        onMount={localHandleMonacoMount}
                                        theme="fetchx-theme"
                                        options={{ glyphMargin: false }}
                                    />
                                </Box>
                                <Box sx={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1, borderTop: `1px solid ${theme.border}` }}>
                                    <Typography sx={{ fontSize: 10, color: theme.muted, fontFamily: 'monospace' }}>Type <Box component="span" sx={{ color: theme.primary }}>{'{{variable_name}}'}</Box> for autocomplete</Typography>
                                    <Button size="small" onClick={beautify} sx={{ fontSize: 10, fontWeight: 500, color: theme.muted }}>BEAUTIFY</Button>
                                </Box>
                            </Box>
                        </Panel>
                        <PanelResizeHandle style={{ height: 4, background: 'transparent', borderTop: `1px solid ${theme.border}` }} />
                        <Panel defaultSize={32} minSize={18}>
                            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: theme.panelHeader }}>
                                <Box sx={{ height: 34, px: 1.25, display: 'flex', alignItems: 'center', borderBottom: `1px solid ${theme.border}` }}>
                                    <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: theme.text, textTransform: 'uppercase', flex: 1 }}>Request Variables (JSON)</Typography>
                                </Box>
                                <Box sx={{ flex: 1, overflow: 'hidden', bgcolor: theme.panel }}>
                                    <Editor
                                        value={variablesJson}
                                        language="json"
                                        height="100%"
                                        onChange={(v) => setVariablesJson(v ?? '')}
                                        onMount={localHandleVariableEditorMount}
                                        theme="fetchx-theme"
                                        options={{ glyphMargin: false }}
                                    />
                                </Box>
                                <Box sx={{ height: 28, px: 1.2, display: 'flex', alignItems: 'center', borderTop: `1px solid ${theme.border}` }}>
                                    <Typography sx={{ fontSize: 9, color: theme.muted, fontFamily: 'monospace' }}>This JSON is request-specific. Reference keys as <Box component="span" sx={{ color: theme.primary }}>{'{{name}}'}</Box>.</Typography>
                                </Box>
                            </Box>
                        </Panel>
                    </PanelGroup>
                )}
                {composerTab === 'preview' && (
                    <Box sx={{ height: '100%', overflowY: 'auto', p: 1.25, bgcolor: theme.panel }}>
                        <Box
                            sx={{
                                ...previewCardSx,
                                mb: 1,
                                p: 1.35,
                                borderColor: `${activeMethodTone}88`,
                                background: `linear-gradient(135deg, ${activeMethodTone}14 0%, transparent 58%)`,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box
                                        sx={{
                                            px: 1,
                                            py: 0.45,
                                            borderRadius: '999px',
                                            border: `1px solid ${activeMethodTone}66`,
                                            color: activeMethodTone,
                                            fontSize: 11,
                                            fontWeight: 700,
                                            letterSpacing: '0.06em',
                                            fontFamily: 'monospace',
                                            bgcolor: `${activeMethodTone}12`,
                                        }}
                                    >
                                        {previewData.method}
                                    </Box>
                                    <Typography sx={{ fontSize: 10, color: theme.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Rendered Request</Typography>
                                </Box>
                                {previewData.unresolvedVariables.length > 0 && (
                                    <Box
                                        sx={{
                                            px: 1,
                                            py: 0.4,
                                            borderRadius: '999px',
                                            border: '1px solid rgba(250, 204, 21, 0.55)',
                                            bgcolor: 'rgba(250, 204, 21, 0.14)',
                                            color: '#facc15',
                                            fontSize: 10,
                                            fontWeight: 700,
                                            fontFamily: 'monospace',
                                            letterSpacing: '0.05em',
                                        }}
                                    >
                                        {previewData.unresolvedVariables.length} unresolved variable{previewData.unresolvedVariables.length === 1 ? '' : 's'}
                                    </Box>
                                )}
                            </Box>
                            <Box sx={{ mt: 1, px: 1, py: 0.8, border: `1px solid ${theme.border}`, borderRadius: 1.5, bgcolor: 'rgba(0,0,0,0.24)' }}>
                                <Typography sx={{ fontSize: 12, color: theme.text, fontFamily: '"Geist Mono", "JetBrains Mono", monospace', wordBreak: 'break-all' }}>
                                    {previewData.url}
                                </Typography>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 1, mb: 1 }}>
                            <Box sx={{ ...previewCardSx, p: 1 }}>
                                <Typography sx={{ fontSize: 9, color: theme.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Headers</Typography>
                                <Typography sx={{ mt: 0.35, fontSize: 16, fontWeight: 700, color: theme.text }}>{previewData.headers.length}</Typography>
                            </Box>
                            <Box sx={{ ...previewCardSx, p: 1 }}>
                                <Typography sx={{ fontSize: 9, color: theme.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Query Params</Typography>
                                <Typography sx={{ mt: 0.35, fontSize: 16, fontWeight: 700, color: theme.text }}>{previewData.queryEntries.length}</Typography>
                            </Box>
                            <Box sx={{ ...previewCardSx, p: 1 }}>
                                <Typography sx={{ fontSize: 9, color: theme.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Body Bytes</Typography>
                                <Typography sx={{ mt: 0.35, fontSize: 16, fontWeight: 700, color: theme.text }}>{new TextEncoder().encode(previewData.body).length}</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.25fr) minmax(0, 0.75fr)' }, gap: 1 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box sx={previewCardSx}>
                                    <Box sx={{ height: 30, px: 1, display: 'flex', alignItems: 'center', borderBottom: `1px solid ${theme.border}` }}>
                                        <Typography sx={{ fontSize: 9, color: theme.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Query</Typography>
                                    </Box>
                                    <Box sx={{ maxHeight: 180, overflowY: 'auto' }}>
                                        {previewData.queryEntries.length === 0 && (
                                            <Typography sx={{ px: 1, py: 1.15, fontSize: 11, color: theme.muted }}>No query parameters</Typography>
                                        )}
                                        {previewData.queryEntries.map((entry, idx) => (
                                            <Box key={`${entry.key}-${idx}`} sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.42fr) minmax(0, 0.58fr)', px: 1, py: 0.72, borderBottom: idx === previewData.queryEntries.length - 1 ? 'none' : `1px solid ${theme.border}` }}>
                                                <Typography sx={{ fontSize: 11, color: theme.text, fontFamily: 'monospace', wordBreak: 'break-all' }}>{entry.key}</Typography>
                                                <Typography sx={{ fontSize: 11, color: theme.muted, fontFamily: 'monospace', wordBreak: 'break-all' }}>{entry.value}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>

                                <Box sx={previewCardSx}>
                                    <Box sx={{ height: 30, px: 1, display: 'flex', alignItems: 'center', borderBottom: `1px solid ${theme.border}` }}>
                                        <Typography sx={{ fontSize: 9, color: theme.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Body</Typography>
                                    </Box>
                                    <Box component="pre" sx={{ m: 0, p: 1, maxHeight: 260, overflow: 'auto', fontSize: 11, color: theme.text, fontFamily: '"Geist Mono", "JetBrains Mono", monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5 }}>
                                        {previewData.body || '(empty body)'}
                                    </Box>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box sx={previewCardSx}>
                                    <Box sx={{ height: 30, px: 1, display: 'flex', alignItems: 'center', borderBottom: `1px solid ${theme.border}` }}>
                                        <Typography sx={{ fontSize: 9, color: theme.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Headers</Typography>
                                    </Box>
                                    <Box sx={{ maxHeight: 230, overflowY: 'auto' }}>
                                        {previewData.headers.length === 0 && (
                                            <Typography sx={{ px: 1, py: 1.15, fontSize: 11, color: theme.muted }}>No headers</Typography>
                                        )}
                                        {previewData.headers.map((header, idx) => (
                                            <Box key={`${header.key}-${idx}`} sx={{ px: 1, py: 0.72, borderBottom: idx === previewData.headers.length - 1 ? 'none' : `1px solid ${theme.border}` }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.35 }}>
                                                    <Typography sx={{ fontSize: 11, color: theme.text, fontFamily: 'monospace', wordBreak: 'break-all' }}>{header.key}</Typography>
                                                    {header.inferred && (
                                                        <Box sx={{ px: 0.5, py: '1px', borderRadius: 0.8, fontSize: 8, fontWeight: 700, color: theme.secondary, border: `1px solid ${theme.secondary}66`, bgcolor: `${theme.secondary}14`, letterSpacing: '0.08em' }}>
                                                            AUTO
                                                        </Box>
                                                    )}
                                                </Box>
                                                <Typography sx={{ fontSize: 11, color: theme.muted, fontFamily: 'monospace', wordBreak: 'break-all' }}>{header.value}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>

                                <Box sx={{ ...previewCardSx, borderColor: previewData.unresolvedVariables.length > 0 ? 'rgba(250, 204, 21, 0.6)' : theme.border }}>
                                    <Box sx={{ height: 30, px: 1, display: 'flex', alignItems: 'center', borderBottom: `1px solid ${theme.border}` }}>
                                        <Typography sx={{ fontSize: 9, color: theme.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Template Warnings</Typography>
                                    </Box>
                                    <Box sx={{ maxHeight: 180, overflowY: 'auto' }}>
                                        {previewData.unresolvedVariables.length === 0 && (
                                            <Typography sx={{ px: 1, py: 1.15, fontSize: 11, color: theme.secondary }}>All template variables are resolved.</Typography>
                                        )}
                                        {previewData.unresolvedVariables.map((item) => (
                                            <Box key={item.name} sx={{ px: 1, py: 0.72, borderBottom: `1px solid ${theme.border}` }}>
                                                <Typography sx={{ fontSize: 11, color: '#facc15', fontFamily: 'monospace' }}>{`{{${item.name}}}`}</Typography>
                                                <Typography sx={{ mt: 0.25, fontSize: 10, color: theme.muted }}>{item.locations.join(', ')}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={{ ...previewCardSx, mt: 1 }}>
                            <Box sx={{ height: 30, px: 1, display: 'flex', alignItems: 'center', borderBottom: `1px solid ${theme.border}` }}>
                                <Typography sx={{ fontSize: 9, color: theme.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Raw Request Preview</Typography>
                            </Box>
                            <Box component="pre" sx={{ m: 0, p: 1, maxHeight: 220, overflow: 'auto', fontSize: 11, color: theme.text, fontFamily: '"Geist Mono", "JetBrains Mono", monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.55 }}>
                                {previewData.rawRequestPreview}
                            </Box>
                        </Box>
                    </Box>
                )}
                {(composerTab === 'query' || composerTab === 'headers') && (
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '42px 1fr 1fr 34px', bgcolor: theme.panelHeader, height: 32, alignItems: 'center', borderBottom: `1px solid ${theme.border}` }}>
                            <Typography sx={{ fontSize: 8, fontWeight: 600, color: theme.muted, pl: 1.5 }}>ON</Typography>
                            <Typography sx={{ fontSize: 8, fontWeight: 600, color: theme.muted }}>KEY</Typography>
                            <Typography sx={{ fontSize: 8, fontWeight: 600, color: theme.muted }}>VALUE</Typography>
                            <Typography sx={{ fontSize: 8, fontWeight: 600, color: theme.muted }}>DEL</Typography>
                        </Box>
                        <Box sx={{ flex: 1, overflowY: 'auto' }}>
                            {(composerTab === 'query' ? queryRows : headerRows).map((row, i) => {
                                const tab = composerTab === 'query' ? 'query' : 'headers';
                                const keyTarget = { type: 'row', tab, index: i, field: 'key' };
                                const valueTarget = { type: 'row', tab, index: i, field: 'value' };
                                const keyFieldKey = getTemplateFieldKey(keyTarget);
                                const valueFieldKey = getTemplateFieldKey(valueTarget);
                                const keyShowValidation = shouldShowTemplateValidation(keyTarget);
                                const valueShowValidation = shouldShowTemplateValidation(valueTarget);
                                const keyTemplateState = getTemplateFieldState(row.key, variableLookupRef.current);
                                const valueTemplateState = getTemplateFieldState(row.value, variableLookupRef.current);
                                const keyWarningText = (keyShowValidation && keyTemplateState.missing.length > 0)
                                    ? `Undefined variable(s): ${keyTemplateState.missing.map((name) => `{{${name}}}`).join(', ')}`
                                    : '';
                                const valueWarningText = (valueShowValidation && valueTemplateState.missing.length > 0)
                                    ? `Undefined variable(s): ${valueTemplateState.missing.map((name) => `{{${name}}}`).join(', ')}`
                                    : '';

                                return (
                                    <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '42px 1fr 1fr 34px', height: 32, alignItems: 'stretch', borderBottom: `1px solid ${theme.border}` }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Checkbox size="small" padding="none" checked={row.enabled} onChange={(e) => updateRows(composerTab === 'query' ? setQueryRows : setHeaderRows, composerTab === 'query' ? queryRows : headerRows, i, { enabled: e.target.checked })} sx={{ p: 0 }} />
                                        </Box>
                                        {renderTemplateFixTooltip(
                                            <TextField
                                                size="small"
                                                placeholder="KEY"
                                                value={row.key}
                                                onChange={(e) => {
                                                    const nextValue = e.target.value;
                                                    updateRows(composerTab === 'query' ? setQueryRows : setHeaderRows, composerTab === 'query' ? queryRows : headerRows, i, { key: nextValue });
                                                    onTemplatedInputChange(e, keyTarget, nextValue);
                                                }}
                                                onKeyDown={(e) => onTemplatedInputKeyDown(e, keyTarget)}
                                                onFocus={() => {
                                                    setFocusedTemplateFieldKey(keyFieldKey);
                                                }}
                                                onBlur={() => {
                                                    setFocusedTemplateFieldKey((prev) => (prev === keyFieldKey ? null : prev));
                                                    setTemplateValidationTouched((prev) => ({ ...prev, [keyFieldKey]: true }));
                                                    clearTemplateAssistTimer();
                                                    if (sameTemplateTarget(templateAssist.target, keyTarget)) {
                                                        setTimeout(() => closeTemplateAssist(), 90);
                                                    }
                                                }}
                                                inputProps={{ title: keyWarningText }}
                                                sx={[
                                                    fieldSx,
                                                    (keyShowValidation && keyTemplateState.missing.length > 0)
                                                        ? {
                                                            '& .MuiOutlinedInput-root': {
                                                                bgcolor: 'rgba(250, 204, 21, 0.08)',
                                                                boxShadow: 'inset 0 -1px 0 rgba(250, 204, 21, 0.7)',
                                                            }
                                                        }
                                                        : ((keyShowValidation && keyTemplateState.hasTemplate) ? {
                                                            '& .MuiOutlinedInput-root': {
                                                                bgcolor: 'rgba(34, 197, 94, 0.08)',
                                                                boxShadow: 'inset 0 -1px 0 rgba(34, 197, 94, 0.75)',
                                                            }
                                                        } : null)
                                                ]}
                                            />,
                                            keyShowValidation ? keyTemplateState.missing : []
                                        )}
                                        {renderTemplateFixTooltip(
                                            <TextField
                                                size="small"
                                                placeholder="VALUE"
                                                value={row.value}
                                                onChange={(e) => {
                                                    const nextValue = e.target.value;
                                                    updateRows(composerTab === 'query' ? setQueryRows : setHeaderRows, composerTab === 'query' ? queryRows : headerRows, i, { value: nextValue });
                                                    onTemplatedInputChange(e, valueTarget, nextValue);
                                                }}
                                                onKeyDown={(e) => onTemplatedInputKeyDown(e, valueTarget)}
                                                onFocus={() => {
                                                    setFocusedTemplateFieldKey(valueFieldKey);
                                                }}
                                                onBlur={() => {
                                                    setFocusedTemplateFieldKey((prev) => (prev === valueFieldKey ? null : prev));
                                                    setTemplateValidationTouched((prev) => ({ ...prev, [valueFieldKey]: true }));
                                                    clearTemplateAssistTimer();
                                                    if (sameTemplateTarget(templateAssist.target, valueTarget)) {
                                                        setTimeout(() => closeTemplateAssist(), 90);
                                                    }
                                                }}
                                                inputProps={{ title: valueWarningText }}
                                                sx={[
                                                    fieldSx,
                                                    (valueShowValidation && valueTemplateState.missing.length > 0)
                                                        ? {
                                                            '& .MuiOutlinedInput-root': {
                                                                bgcolor: 'rgba(250, 204, 21, 0.08)',
                                                                boxShadow: 'inset 0 -1px 0 rgba(250, 204, 21, 0.7)',
                                                            }
                                                        }
                                                        : ((valueShowValidation && valueTemplateState.hasTemplate) ? {
                                                            '& .MuiOutlinedInput-root': {
                                                                bgcolor: 'rgba(34, 197, 94, 0.08)',
                                                                boxShadow: 'inset 0 -1px 0 rgba(34, 197, 94, 0.75)',
                                                            }
                                                        } : null)
                                                ]}
                                            />,
                                            valueShowValidation ? valueTemplateState.missing : []
                                        )}
                                        <Button size="small" color="error" sx={{ minWidth: 0, p: 0 }} onClick={() => {
                                            const rows = composerTab === 'query' ? queryRows : headerRows;
                                            if (rows.length === 1) return;
                                            (composerTab === 'query' ? setQueryRows : setHeaderRows)(rows.filter((_, idx) => idx !== i));
                                        }}>✕</Button>
                                    </Box>
                                );
                            })}
                        </Box>
                        <Box sx={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', px: 1, borderTop: `1px solid ${theme.border}` }}>
                            <Button size="small" onClick={() => (composerTab === 'query' ? setQueryRows : setHeaderRows)((p) => [...p, makeRow()])} sx={{ fontSize: 10, fontWeight: 500, color: theme.muted }}>+ ADD ROW</Button>
                        </Box>
                    </Box>
                )}
            </Box>
            <Menu
                anchorEl={templateAssist.anchorEl}
                open={templateAssist.open}
                onClose={closeTemplateAssist}
                autoFocus={false}
                disableAutoFocusItem
                transformOrigin={{ horizontal: 'left', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 0.4,
                            minWidth: 220,
                            borderRadius: 1,
                            border: `1px solid ${theme.border}`,
                            bgcolor: theme.bgElevated,
                            boxShadow: theme.isDark ? '0 12px 24px rgba(0,0,0,0.45)' : '0 12px 24px rgba(0,0,0,0.12)',
                            backgroundImage: 'none',
                        }
                    }
                }}
            >
                {templateAssist.suggestions.map((item, idx) => (
                    <MenuItem
                        key={item.key}
                        selected={idx === templateAssist.activeIndex}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyTemplateSuggestion(idx)}
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.2 }}
                    >
                        <Typography sx={{ fontSize: 12, color: theme.text, fontFamily: 'monospace' }}>{item.key}</Typography>
                        <Typography sx={{ fontSize: 10, color: theme.muted, fontFamily: 'monospace' }}>{item.type}</Typography>
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    );
}
