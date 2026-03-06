import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    IconButton,
    Button,
    Box,
    Stack
} from '@mui/material';
import {
    Close as CloseIcon,
    Download as DownloadIcon,
} from '@mui/icons-material';
import { useFetchX } from '../../context/FetchXContext';
import { shimmer, NAMESPACE_ICONS } from '../../utils/constants';

export function ImportDialog() {
    const {
        theme,
        importOpen,
        setImportOpen,
        importStep,
        setImportStep,
        importSource,
        setImportSource,
        importUrl,
        setImportUrl,
        importTarget,
        setImportTarget,
        importLoading,
        importedSpec,
        newNsName,
        setNewNsName,
        newNsIcon,
        setNewNsIcon,
        handleImportSource,
        handleFileChange,
        finishImport,
        confirmImportNamespace,
        namespaces,
        activeNamespaceId
    } = useFetchX();

    return (
        <Dialog
            open={importOpen}
            onClose={() => setImportOpen(false)}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 0,
                    bgcolor: theme.bgElevated,
                    backgroundImage: `radial-gradient(circle at top left, ${theme.primary}08 0%, transparent 40%)`,
                    border: `1px solid ${theme.border !== 'transparent' ? theme.border : 'rgba(255,255,255,0.1)'}`,
                    boxShadow: `0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px ${theme.primary}10`,
                    position: 'relative',
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0, left: 0, right: 0, height: 3,
                        background: theme.gradient,
                        backgroundSize: '200% 200%',
                        animation: `shimmer 3s linear infinite`,
                        '@keyframes shimmer': shimmer
                    }
                }
            }}
        >
            <DialogTitle sx={{
                p: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: `1px solid ${theme.border}`
            }}>
                <Typography sx={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: theme.text }}>
                    {importStep === 0 ? 'Import API Spec' : importStep === 1 ? 'Configure Import' : 'Initialize Workspace'}
                </Typography>
                <IconButton size="small" onClick={() => setImportOpen(false)} sx={{ color: theme.muted }}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ px: 3, py: 4 }}>
                {importStep === 0 && (
                    <Stack spacing={3}>
                        <Box sx={{ display: 'flex', gap: 1, p: 0.5, bgcolor: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.border}` }}>
                            <Button
                                fullWidth
                                onClick={() => setImportSource('url')}
                                sx={{
                                    fontSize: 10, fontWeight: 700, borderRadius: 0,
                                    bgcolor: importSource === 'url' ? `${theme.primary}20` : 'transparent',
                                    color: importSource === 'url' ? theme.primary : theme.muted,
                                    border: `1px solid ${importSource === 'url' ? `${theme.primary}40` : 'transparent'}`,
                                }}
                            >URL</Button>
                            <Button
                                fullWidth
                                onClick={() => setImportSource('file')}
                                sx={{
                                    fontSize: 10, fontWeight: 700, borderRadius: 0,
                                    bgcolor: importSource === 'file' ? `${theme.primary}20` : 'transparent',
                                    color: importSource === 'file' ? theme.primary : theme.muted,
                                    border: `1px solid ${importSource === 'file' ? `${theme.primary}40` : 'transparent'}`,
                                }}
                            >FILE</Button>
                        </Box>

                        {importSource === 'url' ? (
                            <Box>
                                <Typography sx={{ fontSize: 10, color: theme.muted, mb: 1, fontWeight: 600 }}>SPECIFICATION URL</Typography>
                                <Box component="input"
                                    placeholder="https://api.example.com/swagger.json"
                                    value={importUrl}
                                    onChange={(e) => setImportUrl(e.target.value)}
                                    sx={{
                                        width: '100%', bgcolor: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.border}`,
                                        outline: 'none', color: theme.text, p: 1.5, fontSize: 12, fontFamily: 'monospace',
                                        '&:focus': { border: `1px solid ${theme.primary}50` }
                                    }}
                                />
                            </Box>
                        ) : (
                            <Button
                                component="label"
                                sx={{
                                    height: 100, border: `2px dashed ${theme.border}`, borderRadius: 0,
                                    display: 'flex', flexDirection: 'column', gap: 1, color: theme.muted,
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.02)', border: `2px dashed ${theme.primary}40` }
                                }}
                            >
                                <DownloadIcon sx={{ fontSize: 24, opacity: 0.5 }} />
                                <Typography sx={{ fontSize: 10, fontWeight: 600 }}>CHOOSE JSON OR YAML FILE</Typography>
                                <input type="file" hidden accept=".json,.yaml,.yml" onChange={handleFileChange} />
                            </Button>
                        )}
                    </Stack>
                )}

                {importStep === 1 && (
                    <Stack spacing={3}>
                        <Box>
                            <Typography sx={{ fontSize: 10, color: theme.muted, mb: 2, fontWeight: 600 }}>IMPORT TARGET</Typography>
                            <Stack spacing={1.5}>
                                <Button
                                    onClick={() => setImportTarget('current')}
                                    sx={{
                                        justifyContent: 'flex-start', p: 2, borderRadius: 0,
                                        bgcolor: importTarget === 'current' ? `${theme.primary}10` : 'rgba(255,255,255,0.01)',
                                        border: `1px solid ${importTarget === 'current' ? theme.primary : theme.border}`,
                                        textAlign: 'left'
                                    }}
                                >
                                    <Box>
                                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: theme.text }}>Merge into current Workspace</Typography>
                                        <Typography sx={{ fontSize: 10, color: theme.muted }}>Add {importedSpec?.requests.length} requests to {namespaces.find(n => n.id === activeNamespaceId)?.name}</Typography>
                                    </Box>
                                </Button>
                                <Button
                                    onClick={() => setImportTarget('new')}
                                    sx={{
                                        justifyContent: 'flex-start', p: 2, borderRadius: 0,
                                        bgcolor: importTarget === 'new' ? `${theme.primary}10` : 'rgba(255,255,255,0.01)',
                                        border: `1px solid ${importTarget === 'new' ? theme.primary : theme.border}`,
                                        textAlign: 'left'
                                    }}
                                >
                                    <Box>
                                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: theme.text }}>Create new Workspace</Typography>
                                        <Typography sx={{ fontSize: 10, color: theme.muted }}>Initialize a clean namespace for this API</Typography>
                                    </Box>
                                </Button>
                            </Stack>
                        </Box>
                    </Stack>
                )}

                {importStep === 2 && (
                    <Stack spacing={3}>
                        <Box>
                            <Typography sx={{ fontSize: 10, color: theme.muted, mb: 1, fontWeight: 600 }}>WORKSPACE NAME</Typography>
                            <Box component="input"
                                value={newNsName}
                                onChange={(e) => setNewNsName(e.target.value)}
                                sx={{
                                    width: '100%', bgcolor: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.border}`,
                                    outline: 'none', color: theme.text, p: 1.5, fontSize: 14, fontWeight: 600,
                                    '&:focus': { border: `1px solid ${theme.primary}50` }
                                }}
                            />
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: 10, color: theme.muted, mb: 1.5, fontWeight: 600 }}>ASSIGN ICON</Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1 }}>
                                {NAMESPACE_ICONS.map((item) => (
                                    <Button
                                        key={item.id}
                                        onClick={() => setNewNsIcon(item.id)}
                                        sx={{
                                            minWidth: 0, height: 60, p: 0, borderRadius: 0,
                                            bgcolor: newNsIcon === item.id ? `${theme.primary}20` : 'rgba(255,255,255,0.01)',
                                            border: `1px solid ${newNsIcon === item.id ? theme.primary : 'transparent'}`,
                                            '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' }
                                        }}
                                    >
                                        {typeof item.icon === 'string' ? item.icon : React.cloneElement(item.icon, { sx: { fontSize: 24 } })}
                                    </Button>
                                ))}
                            </Box>
                        </Box>
                    </Stack>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 1, borderTop: `1px solid ${theme.border}` }}>
                <Button onClick={() => setImportOpen(false)} sx={{ color: theme.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Cancel</Button>
                <Box sx={{ flex: 1 }} />
                {importStep > 0 && (
                    <Button
                        onClick={() => setImportStep(s => s - 1)}
                        sx={{ color: theme.text, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', mr: 2 }}
                    >Back</Button>
                )}
                <Button
                    onClick={importStep === 0 ? handleImportSource : importStep === 1 ? finishImport : confirmImportNamespace}
                    disabled={importLoading || (importStep === 0 && importSource === 'url' && !importUrl)}
                    sx={{
                        bgcolor: theme.primary, color: '#000', fontSize: 11, px: 4, py: 1, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: 0,
                        backgroundImage: theme.gradient,
                        '&:hover': { opacity: 0.9 },
                        '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)', backgroundImage: 'none' }
                    }}
                >
                    {importLoading ? 'Importing...' : importStep === 2 ? 'Initialize Workspace' : 'Continue'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
