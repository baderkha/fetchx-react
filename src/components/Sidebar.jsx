import React from 'react';
import { Box, Typography, IconButton, Button } from '@mui/material';
import {
    Autorenew as AutorenewIcon,
    CreateNewFolder as CreateNewFolderIcon,
    ArrowRight as ArrowRightIcon,
    ArrowDropDown as ArrowDropDownIcon,
    Folder as FolderIcon,
    DragIndicator as DragIndicatorIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getAccessibleColor } from '../utils/logic';
import { useFetchX } from '../context/FetchXContext';
import { normalizeSidebarOrder } from '../utils/logic';
import { METHOD_COLORS } from '../utils/constants';

export function Sidebar() {
    const {
        theme,
        activeNamespace,
        refreshOpenApi,
        activeNamespaceId,
        addFolder,
        addRequest,
        folders,
        requests,
        sidebarOrder,
        toggleFolder,
        startRenameFolder,
        openFolderMenu,
        saveFolderRename,
        editingIndex,
        editingValue,
        setEditingValue,
        setSelectedIndex,
        startRenameRequest,
        openRequestMenu,
        saveRename,
        selectedIndex,
        onDragEnd,
        setActiveDragId,
        activeDragId
    } = useFetchX();

    return (
        <Box sx={{ height: '100%', bgcolor: theme.panel, backdropFilter: `blur(${theme.glass.blur}) saturate(160%)`, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ height: 44, px: 2, display: 'flex', alignItems: 'center', bgcolor: theme.panelHeader, borderBottom: `1px solid ${theme.border}` }}>
                <Typography sx={{ fontSize: 10, fontWeight: 500, color: getAccessibleColor(theme.muted, theme.bgElevated, 4.5), textTransform: 'uppercase', letterSpacing: '0.15em', flex: 1 }}>Requests</Typography>
                {activeNamespace?.sourceUrl && (
                    <IconButton size="small" onClick={() => refreshOpenApi(activeNamespaceId)} sx={{ color: theme.primary, mr: 1, p: 0.5, '&:hover': { color: theme.text } }}>
                        <AutorenewIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                )}
                <IconButton size="small" onClick={addFolder} sx={{ color: theme.muted, mr: 0.5 }}>
                    <CreateNewFolderIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton size="small" onClick={() => addRequest()} sx={{ color: theme.text, borderRadius: 0 }}>
                    <Typography sx={{ fontSize: 20, lineHeight: 1 }}>+</Typography>
                </IconButton>
            </Box>
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
                <DragDropContext
                    onDragStart={(start) => setActiveDragId(start.draggableId)}
                    onDragEnd={onDragEnd}
                >
                    <Droppable droppableId="sidebar" type="TOP_LEVEL" isCombineEnabled>
                        {(provided, snapshot) => (
                            <Box
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                sx={{
                                    flex: 1,
                                    minHeight: 180,
                                    bgcolor: snapshot.isDraggingOver ? 'rgba(255,255,255,0.02)' : 'transparent',
                                    transition: 'background-color 0.2s ease',
                                    px: 0.5,
                                    '&::-webkit-scrollbar': { width: 4 },
                                    '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                                    '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }
                                }}
                                onContextMenu={(e) => { if (e.target === e.currentTarget) openRequestMenu(e, null); }}
                            >
                                {(() => {
                                    const currentSidebarOrder = normalizeSidebarOrder(sidebarOrder, folders, requests);
                                    return currentSidebarOrder.map((item, index) => {
                                        if (!item || typeof item !== 'object') return null;
                                        if (item.type === 'folder') {
                                            const folder = folders.find(f => f.id === item.id);
                                            if (!folder) return null;
                                            const folderRequests = requests.filter(r => r.folderId === folder.id);
                                            return (
                                                <Draggable key={"folder-" + folder.id} draggableId={"folder-" + folder.id} index={index}>
                                                    {(p1, s1) => (
                                                        <Box ref={p1.innerRef} {...p1.draggableProps} sx={{ mb: 0.5, opacity: s1.isDragging ? 0.8 : 1, zIndex: s1.isDragging ? 2000 : 1 }}>
                                                            <Button
                                                                fullWidth
                                                                onMouseDown={(e) => { if (e.target.closest('.drag-handle')) e.stopPropagation(); }}
                                                                onClick={(e) => { if (!e.target.closest('.drag-handle')) { e.stopPropagation(); toggleFolder(folder.id); } }}
                                                                onDoubleClick={() => startRenameFolder(folder.id)}
                                                                onContextMenu={(e) => { e.stopPropagation(); openRequestMenu(e, null, folder.id); }}
                                                                sx={{
                                                                    height: 32, px: 1.5, pl: 1, justifyContent: 'flex-start', color: theme.text, borderRadius: 0.5, textTransform: 'none', gap: 0.7,
                                                                    bgcolor: s1.isDragging ? theme.bgElevated : 'transparent', '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' }
                                                                }}
                                                            >
                                                                <Box className="drag-handle" {...p1.dragHandleProps} sx={{ opacity: 0.3, '&:hover': { opacity: 0.7 }, mr: 0.3, display: 'flex', alignItems: 'center', cursor: 'grab', transition: 'opacity 0.2s' }}>
                                                                    <DragIndicatorIcon sx={{ fontSize: 14 }} />
                                                                </Box>
                                                                {folder.expanded ? <ArrowDropDownIcon sx={{ fontSize: 16, color: theme.muted }} /> : <ArrowRightIcon sx={{ fontSize: 16, color: theme.muted }} />}
                                                                <FolderIcon sx={{ fontSize: 16, color: theme.primary, opacity: 0.7 }} />
                                                                {editingIndex === 'folder-' + folder.id ? (
                                                                    <Box component="input" autoFocus value={editingValue} onChange={(e) => setEditingValue(e.target.value)} onBlur={() => saveFolderRename(folder.id)}
                                                                        onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') saveFolderRename(folder.id); if (e.key === 'Escape') setEditingIndex(null); }}
                                                                        onClick={(e) => e.stopPropagation()} sx={{ flex: 1, bgcolor: 'transparent', border: 'none', outline: 'none', color: theme.text, fontSize: 11, fontWeight: 700 }} />
                                                                ) : <Typography noWrap sx={{ fontSize: 11, fontWeight: 700 }}>{folder.name}</Typography>}
                                                            </Button>
                                                            {folder.expanded && (
                                                                <Droppable
                                                                    droppableId={folder.id}
                                                                    type="TOP_LEVEL"
                                                                    isDropDisabled={Boolean(activeDragId && activeDragId.startsWith('folder-'))}
                                                                >
                                                                    {(provided2, snapshot2) => (
                                                                        <Box {...provided2.droppableProps} ref={provided2.innerRef} sx={{ minHeight: folderRequests.length === 0 ? 12 : 4, bgcolor: snapshot2.isDraggingOver ? 'rgba(255,255,255,0.03)' : 'transparent', position: 'relative', ml: 2, mr: 0.5, borderLeft: `1px solid ${theme.border}40` }}>
                                                                            {folderRequests.map((r, i) => {
                                                                                const globalIdx = requests.findIndex(item => item.id === r.id);
                                                                                return (
                                                                                    <Draggable key={r.id} draggableId={r.id} index={i}>
                                                                                        {(p2, s2) => (
                                                                                            <Box ref={p2.innerRef} {...p2.draggableProps} style={{ ...p2.draggableProps.style, zIndex: s2.isDragging ? 3000 : 1 }}>
                                                                                                <Button fullWidth onClick={() => { if (editingIndex !== globalIdx) setSelectedIndex(globalIdx); }} onDoubleClick={() => startRenameRequest(globalIdx)} onContextMenu={(e) => { e.stopPropagation(); openRequestMenu(e, globalIdx); }}
                                                                                                    sx={{
                                                                                                        justifyContent: 'flex-start', height: 32, px: 2, pl: 1, borderRadius: 0.5,
                                                                                                        bgcolor: s2.isDragging ? theme.bgElevated : (globalIdx === selectedIndex ? `${theme.primary}10` : 'transparent'),
                                                                                                        color: globalIdx === selectedIndex ? theme.text : theme.muted, fontSize: 12, textTransform: 'none',
                                                                                                        boxShadow: s2.isDragging ? `0 12px 48px rgba(0,0,0,0.8), 0 0 0 1px ${theme.primary}40` : 'none',
                                                                                                        borderLeft: globalIdx === selectedIndex ? `2px solid ${theme.primary}` : '2px solid transparent',
                                                                                                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.02)', color: theme.text }, transition: 'all 0.2s ease', transform: s2.isDragging ? 'scale(1.02)' : 'none', '&:hover .drag-handle': { opacity: 0.6 }
                                                                                                    }}>
                                                                                                    <Box className="drag-handle" {...p2.dragHandleProps} sx={{ display: 'flex', alignItems: 'center', opacity: 0.3, mr: 0.5, cursor: 'grab', transition: 'opacity 0.2s' }}>
                                                                                                        <DragIndicatorIcon sx={{ fontSize: 14 }} />
                                                                                                    </Box>
                                                                                                    <Box sx={{ width: 42, flexShrink: 0, fontFamily: 'monospace', fontSize: 10, fontWeight: 500, color: METHOD_COLORS[r.method] ?? theme.primary }}>{r.method}</Box>
                                                                                                    {editingIndex === globalIdx ? (
                                                                                                        <Box component="input" autoFocus value={editingValue} onChange={(e) => setEditingValue(e.target.value)} onBlur={saveRename} onKeyDown={(e) => e.key === 'Enter' && saveRename()} sx={{ flex: 1, bgcolor: 'transparent', border: 'none', outline: 'none', color: theme.text, fontSize: 12, fontWeight: 600, p: 0 }} />
                                                                                                    ) : <Typography noWrap sx={{ fontSize: 11, fontWeight: globalIdx === selectedIndex ? 600 : 400 }}>{r.name}</Typography>}
                                                                                                </Button>
                                                                                            </Box>
                                                                                        )}
                                                                                    </Draggable>
                                                                                );
                                                                            })}
                                                                            {provided2.placeholder}
                                                                        </Box>
                                                                    )}
                                                                </Droppable>
                                                            )}
                                                        </Box>
                                                    )}
                                                </Draggable>
                                            );
                                        } else if (item.type === 'request') {
                                            const r = requests.find(req => req.id === item.id);
                                            if (!r) return null;
                                            const globalIdx = requests.findIndex(item => item.id === r.id);
                                            return (
                                                <Draggable key={"request-" + r.id} draggableId={"request-" + r.id} index={index}>
                                                    {(p2, s2) => (
                                                        <Box ref={p2.innerRef} {...p2.draggableProps} style={{ ...p2.draggableProps.style, zIndex: s2.isDragging ? 2000 : 1 }} sx={{ mb: 0.5 }}>
                                                            <Button fullWidth onClick={() => { if (editingIndex !== globalIdx) setSelectedIndex(globalIdx); }} onDoubleClick={() => startRenameRequest(globalIdx)} onContextMenu={(e) => { e.stopPropagation(); openRequestMenu(e, globalIdx); }}
                                                                sx={{
                                                                    justifyContent: 'flex-start', height: 32, px: 2, pl: 1, borderRadius: 0.5,
                                                                    bgcolor: s2.isDragging ? theme.bgElevated : (globalIdx === selectedIndex ? `${theme.primary}10` : 'transparent'),
                                                                    color: globalIdx === selectedIndex ? theme.text : theme.muted, fontSize: 12, textTransform: 'none',
                                                                    boxShadow: s2.isDragging ? `0 12px 48px rgba(0,0,0,0.8), 0 0 0 1px ${theme.primary}40` : 'none',
                                                                    borderLeft: globalIdx === selectedIndex ? `2px solid ${theme.primary}` : '2px solid transparent',
                                                                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.02)', color: theme.text }, transition: 'all 0.2s ease', transform: s2.isDragging ? 'scale(1.02)' : 'none', '&:hover .drag-handle': { opacity: 0.6 }
                                                                }}>
                                                                <Box className="drag-handle" {...p2.dragHandleProps} sx={{ display: 'flex', alignItems: 'center', opacity: 0.3, mr: 0.5, cursor: 'grab', transition: 'opacity 0.2s' }}>
                                                                    <DragIndicatorIcon sx={{ fontSize: 14 }} />
                                                                </Box>
                                                                <Box sx={{ width: 42, flexShrink: 0, fontFamily: 'monospace', fontSize: 10, fontWeight: 500, color: METHOD_COLORS[r.method] ?? theme.primary }}>{r.method}</Box>
                                                                {editingIndex === globalIdx ? (
                                                                    <Box component="input" autoFocus value={editingValue} onChange={(e) => setEditingValue(e.target.value)} onBlur={saveRename} onKeyDown={(e) => e.key === 'Enter' && saveRename()} sx={{ flex: 1, bgcolor: 'transparent', border: 'none', outline: 'none', color: theme.text, fontSize: 12, fontWeight: 600, p: 0 }} />
                                                                ) : <Typography noWrap sx={{ fontSize: 11, fontWeight: globalIdx === selectedIndex ? 600 : 400 }}>{r.name}</Typography>}
                                                            </Button>
                                                        </Box>
                                                    )}
                                                </Draggable>
                                            );
                                        } else {
                                            return null;
                                        }
                                    });
                                })()}
                                {provided.placeholder}
                            </Box>
                        )}
                    </Droppable>
                </DragDropContext>
            </Box>
        </Box>
    );
}
