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
    Search as SearchIcon
} from '@mui/icons-material';
import { useFetchX } from '../../context/FetchXContext';
import { NAMESPACE_ICONS } from '../../utils/constants';

export function NamespaceDialog() {
    const {
        theme,
        currentFont,
        nsDialogOpen,
        setNsDialogOpen,
        newNsName,
        setNewNsName,
        newNsIcon,
        setNewNsIcon,
        iconSearch,
        setIconSearch,
        confirmAddNamespace
    } = useFetchX();

    return (
        <Dialog
            open={nsDialogOpen}
            onClose={() => setNsDialogOpen(false)}
            PaperProps={{
                sx: {
                    borderRadius: 0,
                    bgcolor: theme.bgElevated,
                    backgroundImage: `radial-gradient(circle at top left, ${theme.primary}08 0%, transparent 40%)`,
                    border: `1px solid ${theme.border !== 'transparent' ? theme.border : 'rgba(255,255,255,0.1)'}`,
                    maxWidth: 420,
                    width: '100%',
                    boxShadow: `0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px ${theme.primary}10`
                }
            }}
        >
            <DialogTitle sx={{
                color: theme.text, fontSize: 16, fontWeight: 700, pb: 2,
                background: `linear-gradient(to right, ${theme.primary}20, transparent)`,
                borderBottom: `1px solid ${theme.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0, left: 0, right: 0, height: 2,
                    background: theme.gradient
                }
            }}>
                <Typography variant="span" sx={{ zIndex: 1 }}>Create New Namespace</Typography>
                <IconButton
                    size="small"
                    onClick={() => setNsDialogOpen(false)}
                    sx={{ color: theme.muted, '&:hover': { color: theme.text, bgcolor: 'rgba(255,255,255,0.05)' } }}
                >
                    <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 4 }}>
                <Stack spacing={4}>
                    <Box sx={{ pt: 2 }}>
                        <Typography sx={{ fontSize: 10, color: theme.primary, mb: 1, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Namespace Identity</Typography>
                        <Box component="input"
                            autoFocus
                            placeholder="e.g. Production API"
                            value={newNsName}
                            onChange={(e) => setNewNsName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && confirmAddNamespace()}
                            sx={{
                                width: '100%', py: 1.5, px: 2, bgcolor: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.border}`,
                                outline: 'none', color: theme.text, fontSize: 14, fontFamily: currentFont,
                                transition: 'all 0.2s ease',
                                '&:focus': { borderColor: theme.primary, bgcolor: 'rgba(255,255,255,0.04)' }
                            }}
                        />
                    </Box>

                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                            <Typography sx={{ fontSize: 10, color: theme.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Visual Signature</Typography>
                            <Box sx={{
                                display: 'flex', alignItems: 'center', gap: 1,
                                bgcolor: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.border}`,
                                borderRadius: 0, px: 1.5,
                                transition: 'all 0.2s ease',
                                '&:focus-within': { borderColor: theme.primary, bgcolor: 'rgba(255,255,255,0.05)' }
                            }}>
                                <SearchIcon sx={{ fontSize: 16, color: theme.muted }} />
                                <Box component="input"
                                    placeholder="Search Icon Lib..."
                                    value={iconSearch}
                                    onChange={(e) => setIconSearch(e.target.value)}
                                    sx={{ bgcolor: 'transparent', border: 'none', outline: 'none', color: theme.text, fontSize: 11, py: 1, width: 120 }}
                                />
                            </Box>
                        </Box>

                        <Button
                            onClick={() => setNewNsIcon(null)}
                            sx={{
                                mb: 1.5,
                                width: '100%',
                                py: 1.5,
                                borderRadius: 0,
                                fontSize: 10,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                bgcolor: newNsIcon === null ? `${theme.primary}25` : 'rgba(255,255,255,0.01)',
                                border: `1px solid ${newNsIcon === null ? theme.primary : theme.border}`,
                                color: newNsIcon === null ? theme.text : theme.muted,
                                transition: 'all 0.2s ease',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                            }}
                        >
                            None (Use Text Abbreviation)
                        </Button>

                        <Box sx={{
                            maxHeight: 280, overflowY: 'auto', pr: 1,
                            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1,
                            '&::-webkit-scrollbar': { width: 4 },
                            '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                            '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)' },
                        }}>
                            {NAMESPACE_ICONS
                                .filter(item => !iconSearch || item.name.toLowerCase().includes(iconSearch.toLowerCase()) || item.id.toLowerCase().includes(iconSearch.toLowerCase()))
                                .map(item => (
                                    <Button
                                        key={item.id}
                                        onClick={() => setNewNsIcon(item.id)}
                                        sx={{
                                            minWidth: 0, p: 1, borderRadius: 0, color: theme.text, height: 74,
                                            display: 'flex', flexDirection: 'column', gap: 0.8,
                                            bgcolor: newNsIcon === item.id ? `${theme.primary}20` : 'rgba(255,255,255,0.01)',
                                            border: `1px solid ${newNsIcon === item.id ? theme.primary : 'transparent'}`,
                                            transition: 'all 0.2s ease',
                                            '&:hover': { bgcolor: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.border}` },
                                        }}
                                    >
                                        <Box sx={{ fontSize: 24, display: 'flex', color: newNsIcon === item.id ? theme.primary : 'inherit' }}>
                                            {typeof item.icon === 'string' ? item.icon : React.cloneElement(item.icon, { sx: { fontSize: 24 } })}
                                        </Box>
                                        <Typography sx={{
                                            fontSize: 8,
                                            fontWeight: 700,
                                            color: newNsIcon === item.id ? theme.text : theme.muted,
                                            textTransform: 'uppercase',
                                            textAlign: 'center',
                                            lineHeight: 1.2
                                        }}>
                                            {item.name}
                                        </Typography>
                                    </Button>
                                ))}
                        </Box>
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 1, borderTop: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={() => setNsDialogOpen(false)} sx={{ color: theme.muted, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cancel</Button>
                <Button
                    onClick={confirmAddNamespace}
                    disabled={!newNsName.trim()}
                    sx={{
                        bgcolor: theme.primary, color: '#000', fontSize: 11, px: 4, py: 1, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: 0,
                        backgroundImage: theme.gradient,
                        '&:hover': { opacity: 0.9 },
                        '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)', backgroundImage: 'none' }
                    }}
                >
                    Initialize Workspace
                </Button>
            </DialogActions>
        </Dialog>
    );
}
