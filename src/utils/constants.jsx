import React from 'react';
import {
    Folder as FolderIcon,
    Cloud as CloudIcon,
    Storage as StorageIcon,
    Api as ApiIcon,
    Code as CodeIcon,
    Terminal as TerminalIcon,
    BugReport as BugReportIcon,
    Build as BuildIcon,
    Dns as DnsIcon,
    Hub as HubIcon,
    Memory as MemoryIcon,
    Router as RouterIcon,
    Webhook as WebhookIcon,
    Dashboard as DashboardIcon,
    Layers as LayersIcon,
    Public as PublicIcon,
    Lock as LockIcon,
    Security as SecurityIcon,
    Bolt as BoltIcon,
    AutoAwesome as AutoAwesomeIcon,
    Science as ScienceIcon,
    RocketLaunch as RocketLaunchIcon,
    Work as WorkIcon,
    Person as PersonIcon,
    Groups as GroupsIcon,
    Favorite as FavoriteIcon,
    Star as StarIcon,
    Home as HomeIcon,
} from '@mui/icons-material';

export const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'];
export const COMPOSER_TABS = ['json', 'query', 'headers', 'preview'];
export const RESPONSE_TABS = ['body', 'headers', 'cookies', 'timeline'];

export const initialRequests = [
    { id: '1', name: 'Get Posts', method: 'GET', url: 'https://jsonplaceholder.typicode.com/posts' },
    { id: '2', name: 'Get Users', method: 'GET', url: 'https://jsonplaceholder.typicode.com/users' },
];

export const METHOD_COLORS = {
    GET: '#22c55e',
    POST: '#eab308',
    PUT: '#3b82f6',
    PATCH: '#a855f7',
    DELETE: '#ef4444',
    HEAD: '#06b6d4',
};

export const FONT_PRESETS = [
    {
        name: 'Premium',
        family: '"Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    {
        name: 'System',
        family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    },
    {
        name: 'IBM Plex',
        family: '"IBM Plex Sans", "IBM Plex Mono", sans-serif',
    },
];

export const STATUS_REASON = {
    100: 'Continue',
    101: 'Switching Protocols',
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    204: 'No Content',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    409: 'Conflict',
    415: 'Unsupported Media Type',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
};

export const NAMESPACE_ICONS = [
    { id: 'FOLDER', name: 'Folder', icon: <FolderIcon /> },
    { id: 'CLOUD', name: 'Cloud / Server', icon: <CloudIcon /> },
    { id: 'STORAGE', name: 'Database / Storage', icon: <StorageIcon /> },
    { id: 'API', name: 'API / Network', icon: <ApiIcon /> },
    { id: 'CODE', name: 'Code / Script', icon: <CodeIcon /> },
    { id: 'TERMINAL', name: 'Terminal / CLI', icon: <TerminalIcon /> },
    { id: 'BUG', name: 'Debug / Bug', icon: <BugReportIcon /> },
    { id: 'BUILD', name: 'Build / Tools', icon: <BuildIcon /> },
    { id: 'DNS', name: 'DNS / Server', icon: <DnsIcon /> },
    { id: 'HUB', name: 'Hub / Node', icon: <HubIcon /> },
    { id: 'MEMORY', name: 'Memory / CPU', icon: <MemoryIcon /> },
    { id: 'ROUTER', name: 'Router / Bridge', icon: <RouterIcon /> },
    { id: 'WEBHOOK', name: 'Webhook', icon: <WebhookIcon /> },
    { id: 'DASHBOARD', name: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'LAYERS', name: 'Environment', icon: <LayersIcon /> },
    { id: 'PUBLIC', name: 'Public / Global', icon: <PublicIcon /> },
    { id: 'LOCK', name: 'Security / Auth', icon: <LockIcon /> },
    { id: 'SECURITY', name: 'Firewall', icon: <SecurityIcon /> },
    { id: 'BOLT', name: 'Fast / Performance', icon: <BoltIcon /> },
    { id: 'MAGIC', name: 'AI / Magic', icon: <AutoAwesomeIcon /> },
    { id: 'SCIENCE', name: 'Science / Lab', icon: <ScienceIcon /> },
    { id: 'ROCKET', name: 'Launch / Production', icon: <RocketLaunchIcon /> },
    { id: 'WORK', name: 'Work / Project', icon: <WorkIcon /> },
    { id: 'PERSON', name: 'User / Identity', icon: <PersonIcon /> },
    { id: 'GROUPS', name: 'Team / Collab', icon: <GroupsIcon /> },
    { id: 'FAVORITE', name: 'Wishlist', icon: <FavoriteIcon /> },
    { id: 'STAR', name: 'Bookmarked', icon: <StarIcon /> },
    { id: 'HOME', name: 'Root / Home', icon: <HomeIcon /> },
    { id: '🚀', name: 'Rocket Emoji', icon: '🚀' },
    { id: '🧪', name: 'Science Emoji', icon: '🧪' },
    { id: '🔒', name: 'Secure Emoji', icon: '🔒' },
    { id: '📦', name: 'Package Emoji', icon: '📦' },
    { id: '🌊', name: 'Water Emoji', icon: '🌊' },
    { id: '🔥', name: 'Fire Emoji', icon: '🔥' },
    { id: '👾', name: 'Alien Emoji', icon: '👾' },
    { id: '🌈', name: 'Colors Emoji', icon: '🌈' },
    { id: '⚡️', name: 'Lightning Emoji', icon: '⚡️' },
    { id: '🍏', name: 'Health Emoji', icon: '🍏' },
    { id: '🛠️', name: 'Repair Emoji', icon: '🛠️' },
];

export const shimmer = {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
};

export const makeRow = () => ({ enabled: true, key: '', value: '' });
export const createId = () => Math.random().toString(36).substring(2, 9);
