import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Typography,
    IconButton,
    Button,
    Box,
    Stack
} from '@mui/material';
import {
    Close as CloseIcon,
    DriveFileMove as DriveFileMoveIcon,
    Folder as FolderIcon,
    ArrowRight as ArrowRightIcon,
    ArrowDropDown as ArrowDropDownIcon,
    CreateNewFolder as CreateNewFolderIcon
} from '@mui/icons-material';
import { useFetchX } from '../../context/FetchXContext';
import { NAMESPACE_ICONS } from '../../utils/constants';

export function MoveDialog() {
    const {
        theme,
        moveOpen,
        setMoveOpen,
        moveTargetIdx,
        requests,
        folders,
        namespaces,
        activeNamespaceId,
        expandedNsMove,
        setExpandedNsMove,
        createFolderInNs,
        confirmMoveRequest
    } = useFetchX();

    return (
        <Dialog
            open={moveOpen}
            onClose={() => setMoveOpen(false)}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 0,
                    bgcolor: theme.bgElevated,
                    backgroundImage: `radial-gradient(circle at top left, ${theme.primary}10, transparent 40%)`,
                    border: `1px solid ${theme.border}`,
                    boxShadow: `0 8px 32px rgba(0,0,0,0.8)`,
                    overflow: 'hidden'
                }
            }}
        >
            <DialogTitle sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${theme.border}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DriveFileMoveIcon sx={{ color: theme.primary, fontSize: 20 }} />
                    <Typography sx={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.text }}>Move / Overwrite</Typography>
                </Box>
                <IconButton size="small" onClick={() => setMoveOpen(false)} sx={{ color: theme.muted }}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0, maxHeight: 480 }}>
                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderBottom: `1px solid ${theme.border}` }}>
                    <Typography sx={{ fontSize: 9, color: theme.muted, fontWeight: 700, textTransform: 'uppercase', mb: 0.5 }}>Moving</Typography>
                    <Typography sx={{ fontSize: 13, color: theme.text, fontWeight: 700, fontFamily: 'monospace' }}>{requests[moveTargetIdx]?.name}</Typography>
                </Box>
                <Box sx={{ p: 1 }}>
                    <Stack spacing={0.5} sx={{ maxHeight: 350, overflowY: 'auto', pr: 0.5 }}>
                        {namespaces.map((ns) => {
                            const isExpanded = !!expandedNsMove[ns.id];
                            const nsReqs = ns.id === activeNamespaceId ? requests : (ns.requests || []);
                            const nsFolders = ns.id === activeNamespaceId ? folders : (ns.folders || []);

                            return (
                                <Box key={ns.id} sx={{ mb: 0.5, border: `1px solid ${isExpanded ? 'rgba(255,255,255,0.05)' : 'transparent'}`, borderRadius: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5 }}>
                                        <Button
                                            fullWidth
                                            onClick={() => setExpandedNsMove(prev => ({ ...prev, [ns.id]: !isExpanded }))}
                                            sx={{ justifyContent: 'flex-start', color: theme.text, textTransform: 'none', py: 1 }}
                                        >
                                            {isExpanded ? <ArrowDropDownIcon /> : <ArrowRightIcon />}
                                            <Box sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: `${theme.primary}20`, borderRadius: 0.5, mr: 1.5, fontSize: 12 }}>
                                                {ns.icon ? (NAMESPACE_ICONS.find(i => i.id === ns.icon)?.icon || ns.icon) : ns.name[0].toUpperCase()}
                                            </Box>
                                            <Typography sx={{ fontSize: 12, fontWeight: 700, flex: 1 }}>{ns.name}</Typography>
                                        </Button>
                                        <IconButton size="small" onClick={() => createFolderInNs(ns.id)} sx={{ color: theme.muted, '&:hover': { color: theme.primary } }}><CreateNewFolderIcon sx={{ fontSize: 16 }} /></IconButton>
                                        <Button onClick={() => confirmMoveRequest(ns.id, null)} sx={{ height: 24, minWidth: 0, px: 2, fontSize: 9, fontWeight: 800, color: theme.primary }}>ROOT</Button>
                                    </Box>

                                    {isExpanded && (
                                        <Box sx={{ pl: 4.5, pr: 1, pb: 1, bgcolor: 'rgba(0,0,0,0.1)' }}>
                                            {nsFolders.map(f => (
                                                <Box key={f.id} sx={{ mt: 1 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                        <FolderIcon sx={{ fontSize: 14, color: theme.primary, mr: 1, opacity: 0.6 }} />
                                                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: theme.muted, flex: 1 }}>{f.name}</Typography>
                                                        <Button onClick={() => confirmMoveRequest(ns.id, f.id)} sx={{ height: 18, fontSize: 8, fontWeight: 800, color: theme.primary }}>MOVE HERE</Button>
                                                    </Box>
                                                    <Stack spacing={0.2}>
                                                        {nsReqs.filter(r => r.folderId === f.id).map((r, i) => (
                                                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', py: 0.4, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                                <Typography noWrap sx={{ fontSize: 11, color: theme.text, flex: 1, opacity: 0.6, fontFamily: 'monospace' }}>{r.name}</Typography>
                                                                <Button onClick={() => confirmMoveRequest(ns.id, f.id, nsReqs.indexOf(r))} sx={{ height: 16, fontSize: 8, fontWeight: 800, color: '#ff5c5c' }}>OVERWRITE</Button>
                                                            </Box>
                                                        ))}
                                                    </Stack>
                                                </Box>
                                            ))}

                                            {nsReqs.filter(r => !r.folderId).length > 0 && (
                                                <Box sx={{ mt: 1 }}>
                                                    <Typography sx={{ fontSize: 9, fontWeight: 800, color: theme.muted, textTransform: 'uppercase', mb: 0.5 }}>Uncategorized</Typography>
                                                    <Stack spacing={0.2}>
                                                        {nsReqs.filter(r => !r.folderId).map((r, i) => (
                                                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', py: 0.4, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                                <Typography noWrap sx={{ fontSize: 11, color: theme.text, flex: 1, opacity: 0.6, fontFamily: 'monospace' }}>{r.name}</Typography>
                                                                <Button onClick={() => confirmMoveRequest(ns.id, null, nsReqs.indexOf(r))} sx={{ height: 16, fontSize: 8, fontWeight: 800, color: '#ff5c5c' }}>OVERWRITE</Button>
                                                            </Box>
                                                        ))}
                                                    </Stack>
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                    </Stack>
                </Box>
            </DialogContent>
        </Dialog>
    );
}
