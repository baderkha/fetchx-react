import React from 'react';
import { Box, Typography, Stack, Button, IconButton, Menu, MenuItem, Divider } from '@mui/material';
import {
    ArrowDropDown as ArrowDropDownIcon,
    FilterList as FilterListIcon,
    Close as CloseIcon,
    Download as DownloadIcon,
    Archive as ArchiveIcon,
    InsertDriveFile as InsertDriveFileIcon,
    KeyboardArrowLeft as KeyboardArrowLeftIcon,
    KeyboardArrowRight as KeyboardArrowRightIcon
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import { useFetchX } from '../../context/FetchXContext';
import { Badge } from '../../fragments/Badge';
import { isJsonText, formatBytes, evaluateJsonFilter, isTextualContentType } from '../../utils/logic';
import { RESPONSE_TABS } from '../../utils/constants';

export function ResponsePanel() {
    const {
        theme,
        status,
        elapsed,
        responseBody,
        responseHeaders,
        responseTab,
        setResponseTab,
        bodyMode,
        setBodyMode,
        bodyMenuAnchor,
        setBodyMenuAnchor,
        downloadResponse,
        jsonFilter,
        setJsonFilter,
        rawRequest,
        rawResponse,
        timeline,
        csvPage,
        setCsvPage,
        error,
        currentFont
    } = useFetchX();

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
        applyMonacoTheme(monaco, theme);
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
        });
    };

    const renderResponseBodyContent = () => {
        if (!responseBody) return <Box sx={{ p: 3, textAlign: 'center' }}><Typography sx={{ fontSize: 11, color: theme.muted }}>No response body</Typography></Box>;

        const ct = (responseHeaders['content-type'] || responseHeaders['Content-Type'] || '').toLowerCase();
        const isJson = ct.includes('json') || isJsonText(responseBody);

        if (bodyMode === 'raw') {
            return (
                <Box sx={{ height: '100%' }}>
                    <Editor
                        value={responseBody}
                        language="plaintext"
                        height="100%"
                        onMount={localHandleMonacoMount}
                        theme="fetchx-theme"
                        options={{ readOnly: true, glyphMargin: false }}
                    />
                </Box>
            );
        }

        if (isJson && jsonFilter.trim()) {
            const filtered = evaluateJsonFilter(responseBody, jsonFilter);
            return (
                <Box sx={{ height: '100%' }}>
                    <Editor
                        value={filtered}
                        language="json"
                        height="100%"
                        onMount={localHandleMonacoMount}
                        theme="fetchx-theme"
                        options={{ readOnly: true, glyphMargin: false }}
                    />
                </Box>
            );
        }

        if (ct.includes('image/')) {
            const src = responseBody.startsWith('data:') ? responseBody : `data:${ct.split(';')[0]};base64,${responseBody}`;
            return (
                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4, bgcolor: '#000', overflow: 'auto' }}>
                    <Box component="img" src={src} sx={{ maxWidth: '100%', border: `1px solid ${theme.border}`, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} />
                </Box>
            );
        }

        if (ct.includes('video/')) {
            const src = responseBody.startsWith('data:') ? responseBody : `data:${ct.split(';')[0]};base64,${responseBody}`;
            return (
                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#000' }}>
                    <Box component="video" controls src={src} sx={{ maxWidth: '100%', maxHeight: '100%' }} />
                </Box>
            );
        }

        if (ct.includes('zip') || ct.includes('archive') || ct.includes('tar') || ct.includes('compressed') || !isTextualContentType(ct)) {
            const isArchive = ct.includes('zip') || ct.includes('archive') || ct.includes('tar') || ct.includes('compressed');
            return (
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, p: 4 }}>
                    <Box sx={{
                        width: 120, height: 120, borderRadius: '24px',
                        bgcolor: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 20px 40px rgba(0,0,0,0.4), inset 0 0 20px ${theme.primary}10`,
                        position: 'relative'
                    }}>
                        {isArchive ? (
                            <ArchiveIcon sx={{ fontSize: 64, color: theme.primary, opacity: 0.8 }} />
                        ) : (
                            <InsertDriveFileIcon sx={{ fontSize: 64, color: theme.primary, opacity: 0.8 }} />
                        )}
                        <Box sx={{
                            position: 'absolute', bottom: -10, right: -10,
                            bgcolor: theme.primary, color: '#000', px: 1.5, py: 0.5,
                            fontSize: 10, fontWeight: 800, borderRadius: 0.5,
                            textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>
                            {ct.split('/')[1]?.split(';')[0].toUpperCase() || 'FILE'}
                        </Box>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ color: theme.text, fontSize: 16, fontWeight: 700, mb: 1 }}>
                            {isArchive ? 'Archive Detected' : 'Binary File Detected'}
                        </Typography>
                        <Typography sx={{ color: theme.muted, fontSize: 12, mb: 3 }}>
                            {isArchive ? 'This response contains binary archive data.' : 'This file type cannot be rendered directly.'}
                        </Typography>
                        <Button
                            startIcon={<DownloadIcon />}
                            onClick={downloadResponse}
                            sx={{
                                bgcolor: theme.primary, color: '#000', px: 4, py: 1.2, fontWeight: 700,
                                borderRadius: 0, textTransform: 'uppercase', letterSpacing: '0.1em',
                                background: theme.gradient,
                                boxShadow: `0 10px 20px ${theme.primary}20`,
                                '&:hover': { opacity: 0.9, transform: 'translateY(-2px)' },
                                transition: 'all 0.2s ease'
                            }}
                        >
                            Download {isArchive ? 'Archive' : 'File'}
                        </Button>
                    </Box>
                </Box>
            );
        }

        if (ct.includes('application/pdf')) {
            const src = responseBody.startsWith('data:') ? responseBody : `data:application/pdf;base64,${responseBody}`;
            return <Box component="iframe" src={src} sx={{ width: '100%', height: '100%', border: 'none', bgcolor: '#fff' }} />;
        }

        if (ct.includes('text/html')) {
            return (
                <Box sx={{ height: '100%', bgcolor: '#fff', overflow: 'hidden' }}>
                    <Box component="iframe" srcDoc={responseBody} sx={{ width: '100%', height: '100%', border: 'none' }} />
                </Box>
            );
        }

        if (ct.includes('text/csv')) {
            const lines = responseBody.split('\n').filter(l => l.trim());
            if (lines.length > 0) {
                const headers = lines[0].split(',').map(h => h.trim());
                const allRows = lines.slice(1).map(l => l.split(',').map(c => c.trim()));

                const pageSize = 100;
                const totalPages = Math.ceil(allRows.length / pageSize);
                const startIndex = (csvPage - 1) * pageSize;
                const currentPageRows = allRows.slice(startIndex, startIndex + pageSize);

                return (
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ flex: 1, overflow: 'auto' }}>
                            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${theme.border}` }}>
                                <thead>
                                    <tr>
                                        {headers.map((h, i) => (
                                            <Box component="th" key={i} sx={{
                                                p: 1.5, border: `1px solid ${theme.border}`, textAlign: 'left',
                                                fontSize: 10, fontWeight: 700, color: theme.primary,
                                                bgcolor: 'rgba(255,255,255,0.02)', position: 'sticky', top: 0, zIndex: 1,
                                                textTransform: 'uppercase', letterSpacing: '0.05em'
                                            }}>{h}</Box>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentPageRows.map((row, i) => (
                                        <tr key={i}>
                                            {row.map((cell, ci) => (
                                                <Box component="td" key={ci} sx={{
                                                    p: 1.2, border: `1px solid ${theme.border}`, color: theme.text,
                                                    fontSize: 11, fontFamily: 'monospace', whiteSpace: 'nowrap'
                                                }}>{cell}</Box>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </Box>
                        </Box>

                        {/* CSV PAGINATION FOOTER */}
                        <Box sx={{
                            height: 38,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            px: 2,
                            borderTop: `1px solid ${theme.border}`,
                            bgcolor: 'rgba(255,255,255,0.01)'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ fontSize: 10, color: theme.muted, fontWeight: 600 }}>
                                    SHOWING {startIndex + 1}-{Math.min(startIndex + pageSize, allRows.length)} OF {allRows.length} ROWS
                                </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <IconButton
                                    size="small"
                                    disabled={csvPage === 1}
                                    onClick={() => setCsvPage(p => p - 1)}
                                    sx={{ color: theme.primary, '&.Mui-disabled': { color: 'rgba(255,255,255,0.05)' } }}
                                >
                                    <KeyboardArrowLeftIcon fontSize="small" />
                                </IconButton>
                                <Typography sx={{ fontSize: 10, fontWeight: 700, color: theme.text, minWidth: 60, textAlign: 'center' }}>
                                    PAGE {csvPage} / {totalPages}
                                </Typography>
                                <IconButton
                                    size="small"
                                    disabled={csvPage === totalPages}
                                    onClick={() => setCsvPage(p => p + 1)}
                                    sx={{ color: theme.primary, '&.Mui-disabled': { color: 'rgba(255,255,255,0.05)' } }}
                                >
                                    <KeyboardArrowRightIcon fontSize="small" />
                                </IconButton>
                            </Stack>
                        </Box>
                    </Box>
                );
            }
        }

        return (
            <Box sx={{ height: '100%' }}>
                <Editor
                    value={responseBody}
                    language={isJsonText(responseBody) ? 'json' : 'plaintext'}
                    height="100%"
                    onMount={localHandleMonacoMount}
                    theme="fetchx-theme"
                    options={{ readOnly: true, glyphMargin: false }}
                />
            </Box>
        );
    };

    return (
        <Box sx={{
            height: '100%',
            bgcolor: theme.panel,
            boxShadow: 'none',
            backdropFilter: `blur(${theme.glass.blur}) saturate(160%)`,
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column'
        }}>
            {/* PERFORMANCE GRID ROW */}
            <Box sx={{ height: 44, display: 'flex', alignItems: 'center', px: 2, bgcolor: theme.panelHeader, borderBottom: `1px solid ${theme.border}` }}>
                <Stack direction="row" spacing={0} alignItems="center" sx={{ flex: 1 }}>
                    <Badge label="Status" text={status} />
                    <Badge label="Time" text={elapsed} />
                    <Badge label="Size" text={formatBytes(new Blob([responseBody]).size)} />
                </Stack>
            </Box>
            {/* RESPONSE TABS */}
            <Box sx={{ height: 38, px: 0, display: 'flex', alignItems: 'center', bgcolor: theme.panelHeader, borderBottom: `1px solid ${theme.border}`, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    {RESPONSE_TABS.map((tab) => (
                        <Button key={tab} size="small" onClick={() => setResponseTab(tab)} sx={tabButtonSx(responseTab === tab)}>{tab.toUpperCase()}</Button>
                    ))}
                </Box>
            </Box>

            {/* BODY TOOLS BAR (ONLY IF BODY TAB IS ACTIVE) */}
            {responseTab === 'body' && (
                <Box sx={{ height: 32, pr: 1, display: 'flex', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.01)', borderBottom: `1px solid ${theme.border}`, gap: 1 }}>
                    <Button
                        size="small"
                        onClick={(e) => setBodyMenuAnchor(e.currentTarget)}
                        endIcon={<ArrowDropDownIcon sx={{ fontSize: 14 }} />}
                        sx={{
                            fontSize: 10, fontWeight: 500, color: theme.primary, textTransform: 'uppercase',
                            minWidth: 0, pl: 1.5, pr: 1.5, height: 32,
                            bgcolor: `${theme.primary}10`, borderRight: `1px solid ${theme.primary}30`,
                            borderRadius: 0,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' }
                        }}
                    >
                        Mode: {bodyMode}
                    </Button>
                    <Menu
                        anchorEl={bodyMenuAnchor}
                        open={Boolean(bodyMenuAnchor)}
                        onClose={() => setBodyMenuAnchor(null)}
                        PaperProps={{ sx: { bgcolor: theme.bgElevated, borderRadius: 0, border: `1px solid ${theme.border}`, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', backgroundImage: 'none' } }}
                    >
                        <MenuItem onClick={() => { setBodyMode('preview'); setBodyMenuAnchor(null); }} sx={{ fontSize: 11, color: theme.text }}>Preview / Rendered</MenuItem>
                        <MenuItem onClick={() => { setBodyMode('raw'); setBodyMenuAnchor(null); }} sx={{ fontSize: 11, color: theme.text }}>Raw Text</MenuItem>
                        <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
                        <MenuItem onClick={() => { downloadResponse(); setBodyMenuAnchor(null); }} sx={{ fontSize: 11, color: theme.text }}>Download Body</MenuItem>
                    </Menu>

                    {(responseHeaders['content-type']?.includes('json') || isJsonText(responseBody)) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, ml: 1 }}>
                            <FilterListIcon sx={{ fontSize: 14, color: theme.muted }} />
                            <Box component="input"
                                placeholder="Filter JSON (e.g. data.items.0)..."
                                value={jsonFilter}
                                onChange={(e) => setJsonFilter(e.target.value)}
                                sx={{
                                    flex: 1, bgcolor: 'transparent', border: 'none', outline: 'none',
                                    color: theme.text, fontSize: 10, fontFamily: 'monospace',
                                    '&::placeholder': { color: theme.muted, opacity: 0.4 }
                                }}
                            />
                            {jsonFilter && (
                                <IconButton size="small" onClick={() => setJsonFilter('')} sx={{ color: theme.muted, p: 0.2 }}>
                                    <CloseIcon sx={{ fontSize: 12 }} />
                                </IconButton>
                            )}
                        </Box>
                    )}
                </Box>
            )}

            {/* RESPONSE VIEWER */}
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
                {error && <Box sx={{ px: 2, py: 1, color: '#ff7c7c', fontSize: 12, borderBottom: `1px solid ${theme.border}` }}>{error}</Box>}
                {responseTab === 'body' && renderResponseBodyContent()}
                {responseTab === 'headers' && (
                    <Stack spacing={0} sx={{ height: '100%', overflowY: 'auto', p: 1 }}>
                        {Object.entries(responseHeaders).map(([k, v]) => (
                            <Box key={k} sx={{ display: 'grid', gridTemplateColumns: '220px 1fr', py: 0.5 }}>
                                <Typography sx={{ color: theme.primary, fontSize: 11, fontFamily: 'monospace', fontWeight: 500 }}>{k}</Typography>
                                <Typography sx={{ fontSize: 11, fontFamily: 'monospace' }}>{v}</Typography>
                            </Box>
                        ))}
                    </Stack>
                )}
                {responseTab === 'cookies' && (
                    <Box sx={{ height: '100%', overflowY: 'auto', p: 1 }}>
                        {(() => {
                            const setCookieHeader = responseHeaders['set-cookie'] || responseHeaders['Set-Cookie'];
                            if (!setCookieHeader) {
                                return <Box sx={{ py: 4, textAlign: 'center' }}><Typography sx={{ fontSize: 11, color: theme.muted }}>No cookies found in response</Typography></Box>;
                            }

                            // Handle both single string and array of strings
                            const cookieStrings = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];

                            return (
                                <Stack spacing={1}>
                                    {cookieStrings.map((cookieStr, i) => {
                                        const [nameValue, ...attributes] = cookieStr.split(';').map(s => s.trim());
                                        const [name, value] = nameValue.split('=');

                                        return (
                                            <Box key={i} sx={{ border: `1px solid ${theme.border}`, p: 1.5, position: 'relative', overflow: 'hidden' }}>
                                                <Box sx={{
                                                    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                                                    background: theme.gradient || theme.primary
                                                }} />
                                                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                                                    <Typography sx={{ color: theme.primary, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{name}</Typography>
                                                    <Typography sx={{ color: theme.text, fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all', opacity: 0.9 }}>{value}</Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                                    {attributes.map((attr, ai) => (
                                                        <Box key={ai} sx={{
                                                            fontSize: 9,
                                                            color: theme.muted,
                                                            bgcolor: 'rgba(255,255,255,0.03)',
                                                            px: 0.8, py: 0.2,
                                                            border: `1px solid ${theme.border}`,
                                                            fontWeight: 600,
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.05em'
                                                        }}>
                                                            {attr}
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            );
                        })()}
                    </Box>
                )}
                {responseTab === 'raw' && <Box component="pre" sx={{ m: 0, p: 2, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 11, color: theme.muted }}>{`=== REQUEST ===\n${rawRequest}\n\n=== RESPONSE ===\n${rawResponse}`}</Box>}
                {responseTab === 'timeline' && (
                    <Box sx={{ height: '100%', overflowY: 'auto', p: 3, position: 'relative' }}>
                        <Box sx={{
                            position: 'absolute', left: 28, top: 32, bottom: 32, width: 1,
                            bgcolor: 'rgba(255,255,255,0.05)',
                        }} />
                        <Stack spacing={4}>
                            {timeline.map((item, i) => (
                                <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, position: 'relative' }}>
                                    <Box sx={{
                                        width: 8, height: 8, borderRadius: '50%',
                                        bgcolor: i === timeline.length - 1 ? theme.primary : theme.secondary,
                                        mt: 0.6, zIndex: 1,
                                        boxShadow: `0 0 12px ${i === timeline.length - 1 ? theme.primary : theme.secondary}80`,
                                        border: `2px solid ${theme.bg}`
                                    }} />
                                    <Box>
                                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
                                            <Typography sx={{ color: i === timeline.length - 1 ? theme.primary : theme.secondary, fontFamily: 'monospace', fontSize: 13, fontWeight: 800 }}>
                                                {item.ms}ms
                                            </Typography>
                                            <Typography sx={{ color: theme.text, fontSize: 12, fontWeight: 600, letterSpacing: '0.01em', textTransform: 'uppercase' }}>
                                                {item.label}
                                            </Typography>
                                        </Box>
                                        {i > 0 && (
                                            <Typography sx={{ color: theme.muted, fontSize: 10, mt: 0.3, opacity: 0.6, fontWeight: 500, fontFamily: 'monospace' }}>
                                                Δ +{item.ms - timeline[i - 1].ms}ms
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            ))}
                        </Stack>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
