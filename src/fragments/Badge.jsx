import React from 'react';
import { Box, Typography } from '@mui/material';
import { getAccessibleColor } from '../utils/logic';
import { useFetchX } from '../context/FetchXContext';

export function Badge({ text, label }) {
    const { theme } = useFetchX();

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', px: 1.25 }}>
            <Typography sx={{ fontSize: 8, fontWeight: 600, color: getAccessibleColor(theme.muted, theme.bgElevated, 4.5), textTransform: 'uppercase', letterSpacing: '0.1em', mb: 0.2 }}>{label}</Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: theme.text, fontFamily: 'monospace' }}>{text}</Typography>
        </Box>
    );
}
