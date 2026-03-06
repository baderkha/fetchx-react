import { JSONPath } from 'jsonpath-plus';
import { colord, extend } from 'colord';
import a11yPlugin from 'colord/plugins/a11y';

extend([a11yPlugin]);

export const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
};

export const buildSidebarOrder = (folders = [], requests = []) => [
    ...(Array.isArray(folders) ? folders : [])
        .filter((folder) => folder?.id)
        .map((folder) => ({ id: folder.id, type: 'folder' })),
    ...(Array.isArray(requests) ? requests : [])
        .filter((request) => request?.id && !request.folderId)
        .map((request) => ({ id: request.id, type: 'request' })),
];

export function normalizeSidebarOrder(order, folders = [], requests = []) {
    const fallback = buildSidebarOrder(folders, requests);
    if (!Array.isArray(order) || order.length === 0) return fallback;

    const folderIds = new Set((Array.isArray(folders) ? folders : []).filter((f) => f?.id).map((f) => f.id));
    const rootRequestIds = new Set(
        (Array.isArray(requests) ? requests : [])
            .filter((r) => r?.id && !r.folderId)
            .map((r) => r.id)
    );

    const normalized = [];
    const seen = new Set();
    order.forEach((item) => {
        if (!item || typeof item !== 'object') return;
        if ((item.type !== 'folder' && item.type !== 'request') || !item.id) return;

        const key = `${item.type}:${item.id}`;
        if (seen.has(key)) return;
        if (item.type === 'folder' && !folderIds.has(item.id)) return;
        if (item.type === 'request' && !rootRequestIds.has(item.id)) return;

        normalized.push({ id: item.id, type: item.type });
        seen.add(key);
    });

    fallback.forEach((item) => {
        const key = `${item.type}:${item.id}`;
        if (!seen.has(key)) {
            normalized.push(item);
            seen.add(key);
        }
    });

    return normalized;
}

export function parseBody(body) {
    if (!body) return '{}';
    try {
        return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
        return body;
    }
}

export function isJsonText(value) {
    try {
        JSON.parse(value);
        return true;
    } catch {
        return false;
    }
}

export function evaluateJsonFilter(data, filter) {
    const f = filter.trim();
    if (!f || f === '$' || f === '$.') return data;
    try {
        const json = JSON.parse(data);
        const result = JSONPath({
            path: f.startsWith('$') ? f : '$.' + f,
            json: json,
            wrap: false
        });

        if (result === undefined) return '// No results found for path: ' + f;
        return JSON.stringify(result, null, 2);
    } catch (err) {
        return `// Filter Error: ${err.message}`;
    }
}

export function isTextualContentType(ct) {
    const t = ct.toLowerCase();
    return t.includes('json') || t.includes('text/') || t.includes('xml') || t.includes('javascript') || t.includes('markdown');
}

export function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB'];
    let value = bytes / 1024;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
    }
    return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function getAccessibleColor(color, background, minContrast = 4.5) {
    const c = colord(color);
    const bg = colord(background);
    if (c.contrast(bg) >= minContrast) return color;

    return bg.isDark()
        ? c.lighten(0.2).toHex()
        : c.darken(0.2).toHex();
}
