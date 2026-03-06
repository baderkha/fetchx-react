import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { useFetchX } from '../context/FetchXContext';

export function TitleBar() {
    const { theme, activeNamespace } = useFetchX();
    const win = window.fetchxApi;
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    return (
        <Box sx={{
            height: 38,
            display: 'flex',
            alignItems: 'center',
            bgcolor: theme.bg,
            borderBottom: `1px solid ${theme.border}`,
            WebkitAppRegion: 'drag',
            userSelect: 'none',
            px: isMac ? 10 : 2,
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 1000
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.25em',
                    color: theme.primary,
                    textTransform: 'uppercase',
                    background: theme.gradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>
                    FETCHX
                </Typography>
            </Box>

            {/* CENTERED NAMESPACE NAME */}
            <Box sx={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: 0.8,
                pointerEvents: 'none' // Click through for dragging
            }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.text, letterSpacing: '0.02em' }}>
                    {activeNamespace?.name || 'Untitled'}
                </Typography>
            </Box>

            {!isMac && (
                <Box sx={{ display: 'flex', height: '100%', WebkitAppRegion: 'no-drag' }}>
                    <IconButton
                        size="small"
                        onClick={() => win?.minimize()}
                        sx={{ borderRadius: 0, width: 44, height: '100%', color: theme.muted, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                    >
                        <Box component="span" sx={{ width: 10, height: 1, bgcolor: 'currentColor' }} />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => win?.maximize()}
                        sx={{ borderRadius: 0, width: 44, height: '100%', color: theme.muted, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                    >
                        <Box component="span" sx={{ width: 10, height: 10, border: '1px solid currentColor' }} />
                    </IconButton>
                    <IconButton
                        size="small"
                        onClick={() => win?.close()}
                        sx={{ borderRadius: 0, width: 44, height: '100%', color: theme.muted, '&:hover': { bgcolor: '#e81123', color: '#fff' } }}
                    >
                        ✕
                    </IconButton>
                </Box>
            )}
        </Box>
    );
}
