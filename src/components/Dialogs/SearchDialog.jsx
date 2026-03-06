import React from 'react';
import { Dialog, Box, Typography, Button, Stack } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useFetchX } from '../../context/FetchXContext';
import { METHOD_COLORS, shimmer } from '../../utils/constants';

export function SearchDialog() {
    const {
        searchOpen,
        setSearchOpen,
        searchQuery,
        setSearchQuery,
        searchInputRef,
        theme,
        currentFont,
        requests,
        setSelectedIndex
    } = useFetchX();

    return (
        <Dialog
            open={searchOpen}
            onClose={() => { setSearchOpen(false); setSearchQuery(''); }}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
                    m: 0, borderRadius: 0,
                    bgcolor: theme.bgElevated,
                    backgroundImage: 'none',
                    border: `1px solid ${theme.border !== 'transparent' ? theme.border : 'rgba(255,255,255,0.1)'}`,
                    boxShadow: `0 32px 64px rgba(0,0,0,0.9)`,
                    overflow: 'hidden',
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
            <Box sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    borderBottom: `1px solid rgba(255,255,255,0.05)`,
                }}>
                    <SearchIcon sx={{ fontSize: 18, color: theme.primary, mr: 1, opacity: 0.8 }} />
                    <Box component="input"
                        autoFocus
                        ref={searchInputRef}
                        placeholder="Search requests by name or URL..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onBlur={() => {
                            if (searchOpen) {
                                setTimeout(() => {
                                    if (searchOpen) searchInputRef.current?.focus();
                                }, 10);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const filtered = requests
                                    .map((r, i) => ({ ...r, originalIndex: i }))
                                    .filter(r =>
                                        searchQuery.trim() === '' ||
                                        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        r.url.toLowerCase().includes(searchQuery.toLowerCase())
                                    );
                                if (filtered.length > 0) {
                                    setSelectedIndex(filtered[0].originalIndex);
                                    setSearchOpen(false);
                                    setSearchQuery('');
                                }
                            }
                        }}
                        sx={{
                            flex: 1, py: 2.5, bgcolor: 'transparent', border: 'none', outline: 'none',
                            color: theme.text, fontSize: 14, fontFamily: currentFont,
                            '&::placeholder': { color: theme.muted, opacity: 0.5 }
                        }}
                    />
                    <Typography sx={{ fontSize: 9, fontWeight: 600, color: theme.muted, border: `1px solid ${theme.muted}40`, px: 0.6, py: 0.2, borderRadius: 0.5 }}>ESC</Typography>
                </Box>
                <Box sx={{ maxHeight: 400, overflowY: 'auto', p: 1 }}>
                    {requests
                        .map((r, i) => ({ ...r, originalIndex: i }))
                        .filter(r =>
                            searchQuery.trim() === '' ||
                            r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            r.url.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((r) => (
                            <Button
                                key={r.originalIndex}
                                fullWidth
                                onClick={() => {
                                    setSelectedIndex(r.originalIndex);
                                    setSearchOpen(false);
                                    setSearchQuery('');
                                }}
                                sx={{
                                    justifyContent: 'flex-start', py: 1.5, px: 1.5, borderRadius: 0,
                                    bgcolor: 'transparent', color: theme.text, textTransform: 'none',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                                }}
                            >
                                <Box sx={{
                                    width: 48, height: 20, mr: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
                                    color: METHOD_COLORS[r.method] ?? theme.primary,
                                    bgcolor: `${METHOD_COLORS[r.method] ?? theme.primary}15`,
                                    borderRadius: 0.5
                                }}>
                                    {r.method}
                                </Box>
                                <Stack spacing={0.2} alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontSize: 13, fontWeight: 500, lineHeight: 1.2 }}>{r.name}</Typography>
                                    <Typography noWrap sx={{ fontSize: 10, color: theme.muted, opacity: 0.7, fontFamily: 'monospace' }}>{r.url || 'No URL'}</Typography>
                                </Stack>
                            </Button>
                        ))}
                    {requests.filter(r => searchQuery.trim() === '' || r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.url.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                            <Typography sx={{ fontSize: 12, color: theme.muted }}>No requests found for "{searchQuery}"</Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        </Dialog>
    );
}
