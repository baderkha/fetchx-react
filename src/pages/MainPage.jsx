import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { TitleBar } from '../components/TitleBar';
import { ActivityBar } from '../components/ActivityBar';
import { Sidebar } from '../components/Sidebar';
import { ComposerPanel } from '../components/Composer/ComposerPanel';
import { ResponsePanel } from '../components/Response/ResponsePanel';
import { SettingsDialog } from '../components/Dialogs/SettingsDialog';
import { SearchDialog } from '../components/Dialogs/SearchDialog';
import { NamespaceDialog } from '../components/Dialogs/NamespaceDialog';
import { ImportDialog } from '../components/Dialogs/ImportDialog';
import { MoveDialog } from '../components/Dialogs/MoveDialog';
import { useFetchX } from '../context/FetchXContext';

export function MainPage() {
    const { theme, currentFont, requestMenu, closeRequestMenu, deleteRequest, startRenameRequest, setMoveOpen, setMoveTargetIdx } = useFetchX();

    useEffect(() => {
        document.body.style.backgroundColor = theme.bg;
        document.body.style.color = theme.text;
        document.body.style.fontFamily = currentFont;
    }, [theme, currentFont]);

    return (
        <Box sx={{
            height: '100vh', display: 'flex', flexDirection: 'column',
            bgcolor: theme.bgElevated, color: theme.text,
            fontFamily: currentFont, overflow: 'hidden'
        }}>
            <TitleBar />

            <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <ActivityBar />

                <Box sx={{ flex: 1, position: 'relative' }}>
                    <PanelGroup direction="horizontal">
                        {/* SIDEBAR PANEL */}
                        <Panel defaultSize={20} minSize={15} maxSize={40} style={{ position: 'relative' }}>
                            <Sidebar />
                        </Panel>

                        <PanelResizeHandle style={{ width: 1, background: theme.border, cursor: 'col-resize', transition: 'background 0.2s', '&:hover': { background: theme.primary } }} />

                        {/* MAIN COMPOSER PANEL */}
                        <Panel defaultSize={45} minSize={30}>
                            <ComposerPanel />
                        </Panel>

                        <PanelResizeHandle style={{ width: 1, background: theme.border, cursor: 'col-resize', transition: 'background 0.2s', '&:hover': { background: theme.primary } }} />

                        {/* RESPONSE PANEL */}
                        <Panel defaultSize={35} minSize={20}>
                            <ResponsePanel />
                        </Panel>
                    </PanelGroup>
                </Box>
            </Box>

            {/* GLOBAL MODALS */}
            <SettingsDialog />
            <SearchDialog />
            <NamespaceDialog />
            <ImportDialog />
            <MoveDialog />

            {/* CONTEXT MENU */}
            {requestMenu.open && (
                <Box
                    sx={{
                        position: 'fixed', top: requestMenu.mouseY, left: requestMenu.mouseX,
                        bgcolor: theme.panelHeader, border: `1px solid ${theme.border}`,
                        boxShadow: `0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px ${theme.border}`,
                        zIndex: 9999, minWidth: 160, borderRadius: 0.5, py: 0.5,
                        backdropFilter: `blur(${theme.glass.blur})`,
                    }}
                    onMouseLeave={closeRequestMenu}
                >
                    {requestMenu.folderId ? (
                        <Box>
                            <Box onClick={() => { /* Rename Folder handle in Sidebar instead */ closeRequestMenu(); }} sx={{ px: 2, py: 1, fontSize: 11, color: theme.text, cursor: 'pointer', '&:hover': { bgcolor: `${theme.primary}20` } }}>Rename Folder</Box>
                        </Box>
                    ) : (
                        <Box>
                            <Box onClick={() => { startRenameRequest(requestMenu.index); closeRequestMenu(); }} sx={{ px: 2, py: 1, fontSize: 11, color: theme.text, cursor: 'pointer', '&:hover': { bgcolor: `${theme.primary}20` } }}>Rename Request</Box>
                            <Box onClick={() => { setMoveTargetIdx(requestMenu.index); setMoveOpen(true); closeRequestMenu(); }} sx={{ px: 2, py: 1, fontSize: 11, color: theme.text, cursor: 'pointer', '&:hover': { bgcolor: `${theme.primary}20` } }}>Move to Namespace...</Box>
                            <Box sx={{ height: 1, bgcolor: theme.border, my: 0.5 }} />
                            <Box onClick={() => { deleteRequest(requestMenu.index); closeRequestMenu(); }} sx={{ px: 2, py: 1, fontSize: 11, color: '#ff5c5c', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255, 92, 92, 0.1)' } }}>Delete Request</Box>
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
}
