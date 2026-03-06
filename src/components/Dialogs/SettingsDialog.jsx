import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Typography,
    IconButton,
    Stack,
    Box,
    Select,
    MenuItem,
    Divider,
    FormControlLabel,
    Switch
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useFetchX } from '../../context/FetchXContext';
import { getAccessibleColor } from '../../utils/logic';
import { themes } from '../../theme';
import { FONT_PRESETS } from '../../utils/constants';

export function SettingsDialog() {
    const {
        settingsOpen,
        setSettingsOpen,
        themeName,
        setThemeName,
        fontPreset,
        setFontPreset,
        theme
    } = useFetchX();

    const settingsSelectSx = {
        height: 38,
        borderRadius: 0,
        bgcolor: 'rgba(255, 255, 255, 0.02)',
        '& .MuiOutlinedInput-notchedOutline': { border: `1px solid rgba(255,255,255,0.15)` },
        '&:hover .MuiOutlinedInput-notchedOutline': { border: `1px solid ${theme.primary}60` },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { border: `1px solid ${theme.primary}` },
        '& .MuiSelect-select': { py: 0, display: 'flex', alignItems: 'center', height: '100% !important' },
        color: theme.text,
        fontSize: 12,
        fontWeight: 600,
    };

    const settingsMenuProps = {
        PaperProps: {
            sx: {
                bgcolor: theme.bgElevated,
                borderRadius: 0,
                border: `1px solid rgba(255,255,255,0.1)`,
                backgroundImage: 'none',
                color: theme.text,
                '& .MuiMenuItem-root': {
                    fontSize: 11,
                    fontWeight: 500,
                    color: theme.text,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    py: 1.25,
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' },
                    '&.Mui-selected': { bgcolor: `${theme.primary}25`, color: theme.primary },
                }
            }
        }
    };

    return (
        <Dialog
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 0,
                    bgcolor: theme.bgElevated,
                    backgroundImage: `radial-gradient(circle at top left, ${theme.primary}08 0%, transparent 40%)`,
                    border: `1px solid ${theme.border !== 'transparent' ? theme.border : 'rgba(255,255,255,0.1)'}`,
                    boxShadow: `0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px ${theme.primary}10`
                }
            }}
        >
            <DialogTitle sx={{
                p: 2,
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
                <Typography sx={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: theme.text, zIndex: 1 }}>Settings</Typography>
                <IconButton
                    size="small"
                    onClick={() => setSettingsOpen(false)}
                    sx={{ color: theme.muted, '&:hover': { color: theme.text, bgcolor: 'rgba(255,255,255,0.05)' } }}
                >
                    <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ px: 2, pt: 5, pb: 4 }}>
                <Stack spacing={4}>
                    <Box sx={{ pt: 2 }}>
                        <Typography sx={{ fontSize: 10, color: getAccessibleColor(theme.muted, theme.bgElevated, 3.5), fontWeight: 500, mb: 2, letterSpacing: '0.15em' }}>APPEARANCE</Typography>
                        <Stack spacing={2.5}>
                            <Box>
                                <Typography sx={{ fontSize: 11, color: theme.text, mb: 1, fontWeight: 600, opacity: 0.9 }}>Theme</Typography>
                                <Select
                                    value={themeName}
                                    onChange={(e) => setThemeName(e.target.value)}
                                    size="small"
                                    fullWidth
                                    sx={settingsSelectSx}
                                    MenuProps={settingsMenuProps}
                                >
                                    {themes.map((t) => (
                                        <MenuItem key={t.name} value={t.name}>{t.name}</MenuItem>
                                    ))}
                                </Select>
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: 11, color: theme.text, mb: 1, fontWeight: 600, opacity: 0.9 }}>Font Preset</Typography>
                                <Select
                                    value={fontPreset}
                                    onChange={(e) => setFontPreset(e.target.value)}
                                    size="small"
                                    fullWidth
                                    sx={settingsSelectSx}
                                    MenuProps={settingsMenuProps}
                                >
                                    {FONT_PRESETS.map((f) => (
                                        <MenuItem key={f.name} value={f.name}>{f.name}</MenuItem>
                                    ))}
                                </Select>
                            </Box>
                        </Stack>
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

                    <Box>
                        <Typography sx={{ fontSize: 10, color: getAccessibleColor(theme.muted, theme.bgElevated, 3.5), fontWeight: 500, mb: 2, letterSpacing: '0.15em' }}>EDITOR</Typography>
                        <Stack spacing={1.5}>
                            <FormControlLabel
                                control={<Switch size="small" defaultChecked sx={{ '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: theme.primary, opacity: 1 } }} />}
                                label={<Typography sx={{ fontSize: 12, color: theme.text, opacity: 0.8 }}>Minimap</Typography>}
                            />
                            <FormControlLabel
                                control={<Switch size="small" defaultChecked sx={{ '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: theme.primary, opacity: 1 } }} />}
                                label={<Typography sx={{ fontSize: 12, color: theme.text, opacity: 0.8 }}>Word Wrap</Typography>}
                            />
                            <FormControlLabel
                                control={<Switch size="small" />}
                                label={<Typography sx={{ fontSize: 12, color: theme.text, opacity: 0.8 }}>Line Numbers</Typography>}
                            />
                        </Stack>
                    </Box>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

                    <Box>
                        <Typography sx={{ fontSize: 10, color: getAccessibleColor(theme.muted, theme.bgElevated, 3.5), fontWeight: 500, mb: 2, letterSpacing: '0.15em' }}>EXPERIMENTAL</Typography>
                        <Stack spacing={1.5}>
                            <FormControlLabel
                                control={<Switch size="small" />}
                                label={<Typography sx={{ fontSize: 12, color: theme.text, opacity: 0.8 }}>Auto-save Requests</Typography>}
                            />
                            <FormControlLabel
                                control={<Switch size="small" />}
                                label={<Typography sx={{ fontSize: 12, color: theme.text, opacity: 0.8 }}>Proxy Mode</Typography>}
                            />
                        </Stack>
                    </Box>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
