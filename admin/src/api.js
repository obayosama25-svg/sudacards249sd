const API_BASE = 'http://2.24.108.101:5000/api';

// Helper to get stored token
const getToken = () => localStorage.getItem('sudacards_token');

// Generic fetch wrapper
async function apiFetch(endpoint, options = {}) {
    const token = getToken();
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        },
        ...options,
    };

    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json();
    
    if (!res.ok) {
        if (res.status === 401) {
            localStorage.removeItem('sudacards_token');
            window.location.href = '/login';
        }
        throw new Error(data.message || 'ط­ط¯ط« ط®ط·ط£ ظپظٹ ط§ظ„ط®ط§ط¯ظ…');
    }
    return data;
}

// â”€â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const login = (username, password) =>
    apiFetch('/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) });

export const getMe = () => apiFetch('/admin/me');

const cleanParams = (params) => {
    const clean = {};
    for (const key in params) {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            clean[key] = params[key];
        }
    }
    return clean;
};

// â”€â”€â”€ Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getDashboardStats = (params = {}) => {
    const query = new URLSearchParams(cleanParams(params)).toString();
    return apiFetch(`/dashboard/stats?${query}`);
};

// â”€â”€â”€ Users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getUsersStats = () => apiFetch('/users/stats');
export const getUsers = (params = {}) => {
    const query = new URLSearchParams(cleanParams(params)).toString();
    return apiFetch(`/users?${query}`);
};
export const toggleUserStatus = (id) =>
    apiFetch(`/users/${id}/status`, { method: 'PUT' });
export const deleteUser = (id) =>
    apiFetch(`/users/${id}`, { method: 'DELETE' });
export const getUserDetails = (id) => apiFetch(`/users/${id}/details`);
export const getUserAnalytics = (id) => apiFetch(`/users/${id}/analytics`);
export const adjustUserBalance = (id, actionType, amount, reason) => 
    apiFetch(`/users/${id}/adjust-balance`, { 
        method: 'POST', 
        body: JSON.stringify({ actionType, amount, reason }) 
    });
export const getUserStatement = (id, from, to) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return apiFetch(`/users/${id}/statement?${params}`);
};
export const getPendingUsers = () => apiFetch('/users/pending');
export const getPendingCount = () => apiFetch('/users/pending/count');
export const approveUser = (id) => apiFetch(`/users/${id}/approve`, { method: 'PUT' });
export const rejectUser = (id) => apiFetch(`/users/${id}/reject`, { method: 'PUT' });

// â”€â”€â”€ Transactions / Ledger â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getTransactions = (params = {}) => {
    const query = new URLSearchParams(cleanParams(params)).toString();
    return apiFetch(`/transactions?${query}`);
};
export const reverseTransaction = (transactionId, reason) =>
    apiFetch('/ledger/reverse', { method: 'POST', body: JSON.stringify({ transactionId, reason }) });
export const reconcileTransaction = (txId) =>
    apiFetch(`/ledger/reconcile/${txId}`, { method: 'PUT' });
export const getRevenue = (from, to) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return apiFetch(`/ledger/revenue?${params}`);
};

// â”€â”€â”€ Admins & Branches â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getAdmins = () => apiFetch('/admins');
export const createAdmin = (data) =>
    apiFetch('/admins', { method: 'POST', body: JSON.stringify(data) });
export const getBranches = () => apiFetch('/branches');
export const createBranch = (data) =>
    apiFetch('/branches', { method: 'POST', body: JSON.stringify(data) });

// â”€â”€â”€ System â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getSystemAccounts = () => apiFetch('/system-accounts');
export const getAuditLog = (params = {}) => {
    const query = new URLSearchParams(cleanParams(params)).toString();
    return apiFetch(`/audit-log?${query}`);
};

// â”€â”€â”€ Bank Gateways â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getBankGateways = () => apiFetch('/admin/bank-gateways');
export const createBankGateway = (data) => apiFetch('/admin/bank-gateways', { method: 'POST', body: JSON.stringify(data) });
export const updateBankGateway = (id, data) => apiFetch(`/admin/bank-gateways/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const testBankGateway = (id) => apiFetch(`/admin/bank-gateways/${id}/test`, { method: 'POST' });

// â”€â”€â”€ Devices â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getDevices = () => apiFetch('/admin/devices');
export const getDeviceDetails = (id) => apiFetch(`/admin/devices/${id}`);

// â”€â”€â”€ NFC Cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getNfcCards = () => apiFetch('/admin/nfc-cards');
export const createNfcCard = (data) => apiFetch('/admin/nfc-cards', { method: 'POST', body: JSON.stringify(data) });
export const updateNfcCardStatus = (id, status) => apiFetch(`/admin/nfc-cards/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
