import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import {
    Settings as SettingsIcon,


} from '@mui/icons-material';
import { useFetchX } from '../context/FetchXContext';
import { NAMESPACE_ICONS } from '../utils/constants';
import { SiSwagger as ApiIcon } from "react-icons/si";

export function ActivityBar() {
    const {
        theme,
        namespaces,
        activeNamespaceId,
        switchNamespace,
        addNamespace,
        setSettingsOpen,
        setImportOpen
    } = useFetchX();

    const glassHeader = theme.panelHeader;
    const glassBackdrop = `blur(${theme.glass.blur}) saturate(160%)`;

    const activityButtonSx = {
        width: 48,
        height: 48,
        borderRadius: 0,
        color: theme.muted,
        p: 0,
        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.03)', color: theme.text },
    };

    return (
        <Box sx={{ width: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: glassHeader, backdropFilter: glassBackdrop, borderRight: `1px solid ${theme.border}`, zIndex: 20 }}>
            {/* NAMESPACES SECTION */}
            <Box sx={{ py: 2, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                {namespaces.map((ns) => (
                    <IconButton
                        key={ns.id}
                        onClick={() => switchNamespace(ns.id)}
                        sx={{
                            width: 32, height: 32,
                            borderRadius: 1,
                            fontSize: 10,
                            fontWeight: 800,
                            color: activeNamespaceId === ns.id ? theme.text : theme.muted,
                            bgcolor: activeNamespaceId === ns.id ? `${theme.primary}20` : 'transparent',
                            border: `1px solid ${activeNamespaceId === ns.id ? `${theme.primary}40` : 'transparent'}`,
                            transition: 'all 0.2s ease',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {!ns.icon ? (
                                <Typography sx={{ fontSize: 10, fontWeight: 700 }}>{ns.name.substring(0, 2).toUpperCase()}</Typography>
                            ) : typeof ns.icon === 'string' && ns.icon.length > 2 && NAMESPACE_ICONS.some(ni => ni.id === ns.icon) ? (
                                (() => {
                                    const foundIcon = NAMESPACE_ICONS.find(ni => ni.id === ns.icon);
                                    const IconComp = foundIcon?.icon;
                                    return typeof IconComp === 'object' ? React.cloneElement(IconComp, { sx: { fontSize: 18 } }) : IconComp;
                                })()
                            ) : (
                                <Typography sx={{ fontSize: 16 }}>{ns.icon}</Typography>
                            )}
                        </Box>
                    </IconButton>
                ))}
                <IconButton
                    onClick={addNamespace}
                    sx={{
                        width: 32, height: 32,
                        borderRadius: 1,
                        color: theme.muted,
                        opacity: 0.4,
                        '&:hover': { opacity: 1, bgcolor: 'rgba(255,255,255,0.05)' }
                    }}
                >
                    <Typography sx={{ fontSize: 18, lineHeight: 1 }}>+</Typography>
                </IconButton>
            </Box>
            <Box sx={{ flex: 1 }} />
            <IconButton onClick={() => setSettingsOpen(true)} sx={activityButtonSx}>
                <SettingsIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton onClick={() => setImportOpen(true)} sx={activityButtonSx}>
                <ApiIcon sx={{ fontSize: 20 }} />
            </IconButton>
        </Box>
    );
}
