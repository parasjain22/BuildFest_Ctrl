const API_BASE = 'http://localhost:5000/api';

interface ApiResponse<T = any> {
    status: string;
    message?: string;
    data?: T;
    errors?: Array<{ field: string; message: string }>;
}

const getAuthHeaders = (): Record<string, string> => {
    const token = sessionStorage.getItem('bharatvote-token');
    return {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

const jsonHeaders = (): Record<string, string> => ({
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
});

const handleResponse = async <T>(res: Response): Promise<ApiResponse<T>> => {
    const data = await res.json();
    if (!res.ok) {
        throw { status: res.status, ...data };
    }
    return data;
};

// ========== AUTH ==========

export const api = {
    auth: {
        register: async (formData: FormData) => {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: formData,
            });
            return handleResponse(res);
        },

        loginInitiate: async (aadhaar: string) => {
            const res = await fetch(`${API_BASE}/auth/login/initiate`, {
                method: 'POST',
                headers: jsonHeaders(),
                body: JSON.stringify({ aadhaar }),
            });
            return handleResponse(res);
        },

        verifyOTP: async (aadhaar: string, otp: string) => {
            const res = await fetch(`${API_BASE}/auth/login/verify-otp`, {
                method: 'POST',
                headers: jsonHeaders(),
                body: JSON.stringify({ aadhaar, otp }),
            });
            return handleResponse(res);
        },

        faceVerify: async (tempToken: string, liveImage?: File) => {
            const formData = new FormData();
            formData.append('temp_token', tempToken);
            if (liveImage) formData.append('live_image', liveImage);
            const res = await fetch(`${API_BASE}/auth/login/face-verify`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: formData,
            });
            return handleResponse(res);
        },

        logout: async () => {
            const res = await fetch(`${API_BASE}/auth/logout`, {
                method: 'POST',
                headers: jsonHeaders(),
            });
            return handleResponse(res);
        },
    },

    // ========== VOTE ==========
    vote: {
        createSession: async (election_id: string) => {
            const res = await fetch(`${API_BASE}/vote/session`, {
                method: 'POST',
                headers: jsonHeaders(),
                body: JSON.stringify({ election_id }),
            });
            return handleResponse(res);
        },

        cast: async (data: { candidate_id: string; session_id: string; election_id: string }) => {
            const res = await fetch(`${API_BASE}/vote/cast`, {
                method: 'POST',
                headers: jsonHeaders(),
                body: JSON.stringify(data),
            });
            return handleResponse(res);
        },

        reportViolation: async (session_id: string, violation_type: string) => {
            const res = await fetch(`${API_BASE}/vote/violation`, {
                method: 'POST',
                headers: jsonHeaders(),
                body: JSON.stringify({ session_id, violation_type }),
            });
            return handleResponse(res);
        },

        getReceipt: async (receiptId: string) => {
            const res = await fetch(`${API_BASE}/vote/receipt/${receiptId}`, {
                headers: jsonHeaders(),
            });
            return handleResponse(res);
        },

        downloadReceipt: async (receiptId: string) => {
            const res = await fetch(`${API_BASE}/vote/receipt/${receiptId}/download`, {
                headers: getAuthHeaders(),
            });
            if (!res.ok) throw new Error('Download failed');
            return res.blob();
        },

        emailReceipt: async (receiptId: string, email: string) => {
            const res = await fetch(`${API_BASE}/vote/receipt/${receiptId}/email`, {
                method: 'POST',
                headers: jsonHeaders(),
                body: JSON.stringify({ email }),
            });
            return handleResponse(res);
        },

        getShareData: async (receiptId: string) => {
            const res = await fetch(`${API_BASE}/vote/receipt/${receiptId}/share`, {
                headers: jsonHeaders(),
            });
            return handleResponse(res);
        },
    },

    // ========== AUDIT ==========
    audit: {
        getStats: async () => {
            const res = await fetch(`${API_BASE}/audit/stats`);
            return handleResponse(res);
        },

        verify: async (receiptId: string) => {
            const res = await fetch(`${API_BASE}/audit/verify/${receiptId}`);
            return handleResponse(res);
        },

        getMerkleRoot: async () => {
            const res = await fetch(`${API_BASE}/audit/merkle-root`);
            return handleResponse(res);
        },

        getTimeline: async () => {
            const res = await fetch(`${API_BASE}/audit/timeline`);
            return handleResponse(res);
        },
    },

    // ========== PUBLIC ==========
    public: {
        getWelcome: async () => {
            const res = await fetch(`${API_BASE}/public/welcome`);
            return handleResponse(res);
        },

        getLiveElection: async () => {
            const res = await fetch(`${API_BASE}/public/election/live`);
            return handleResponse(res);
        },

        getScheduledElections: async () => {
            const res = await fetch(`${API_BASE}/public/election/scheduled`);
            return handleResponse(res);
        },

        getPublicCandidates: async (election_id: string) => {
            const res = await fetch(`${API_BASE}/public/candidates?election_id=${election_id}`);
            return handleResponse(res);
        },
    },

    // ========== ADMIN ==========
    admin: {
        login: async (email: string, password: string) => {
            const res = await fetch(`${API_BASE}/auth/admin-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            return handleResponse(res);
        },

        getElections: async () => {
            const res = await fetch(`${API_BASE}/admin/elections`, {
                headers: jsonHeaders(),
            });
            return handleResponse(res);
        },

        createElection: async (data: any) => {
            const res = await fetch(`${API_BASE}/admin/elections`, {
                method: 'POST',
                headers: jsonHeaders(),
                body: JSON.stringify(data),
            });
            return handleResponse(res);
        },

        updateElectionStatus: async (id: string, status: string) => {
            const res = await fetch(`${API_BASE}/admin/elections/${id}/status`, {
                method: 'PATCH',
                headers: jsonHeaders(),
                body: JSON.stringify({ status }),
            });
            return handleResponse(res);
        },

        deleteElection: async (id: string) => {
            const res = await fetch(`${API_BASE}/admin/elections/${id}`, {
                method: 'DELETE',
                headers: jsonHeaders(),
            });
            return handleResponse(res);
        },

        addCandidate: async (data: any) => {
            const res = await fetch(`${API_BASE}/admin/candidates`, {
                method: 'POST',
                headers: jsonHeaders(),
                body: JSON.stringify(data),
            });
            return handleResponse(res);
        },

        getCandidates: async (election_id?: string) => {
            const url = election_id
                ? `${API_BASE}/admin/candidates?election_id=${election_id}`
                : `${API_BASE}/admin/candidates`;
            const res = await fetch(url, { headers: jsonHeaders() });
            return handleResponse(res);
        },

        deleteCandidate: async (id: string) => {
            const res = await fetch(`${API_BASE}/admin/candidates/${id}`, {
                method: 'DELETE',
                headers: jsonHeaders(),
            });
            return handleResponse(res);
        },

        getRealtimeStats: async () => {
            const res = await fetch(`${API_BASE}/admin/stats/realtime`, {
                headers: jsonHeaders(),
            });
            return handleResponse(res);
        },

        getDuplicateFlags: async () => {
            const res = await fetch(`${API_BASE}/admin/monitoring/flags`, {
                headers: jsonHeaders(),
            });
            return handleResponse(res);
        },

        getWarnings: async () => {
            const res = await fetch(`${API_BASE}/admin/monitoring/warnings`, {
                headers: jsonHeaders(),
            });
            return handleResponse(res);
        },

        addWarning: async (election_id: string, type: string, message: string) => {
            const res = await fetch(`${API_BASE}/admin/monitoring/warnings`, {
                method: 'POST',
                headers: jsonHeaders(),
                body: JSON.stringify({ election_id, type, message }),
            });
            return handleResponse(res);
        },

        resolveWarning: async (warningIndex: number, election_id: string) => {
            const res = await fetch(`${API_BASE}/admin/monitoring/warnings/${warningIndex}/resolve`, {
                method: 'PATCH',
                headers: jsonHeaders(),
                body: JSON.stringify({ election_id }),
            });
            return handleResponse(res);
        },

        getComplaints: async () => {
            const res = await fetch(`${API_BASE}/admin/complaints`, {
                headers: jsonHeaders(),
            });
            return handleResponse(res);
        },

        updateComplaintStatus: async (id: string, status: string, admin_notes?: string) => {
            const res = await fetch(`${API_BASE}/admin/complaints/${id}/status`, {
                method: 'PATCH',
                headers: jsonHeaders(),
                body: JSON.stringify({ status, admin_notes }),
            });
            return handleResponse(res);
        },

        getAuditLogs: async () => {
            const res = await fetch(`${API_BASE}/admin/audit-logs`, {
                headers: jsonHeaders(),
            });
            return handleResponse(res);
        },
    },


    // ========== RESULTS ==========
    results: {
        get: async (electionId: string) => {
            const res = await fetch(`${API_BASE}/results/${electionId}`);
            return handleResponse(res);
        },
    },

    // ========== COMPLAINTS ==========
    complaints: {
        submit: async (formData: FormData) => {
            const res = await fetch(`${API_BASE}/complaints`, {
                method: 'POST',
                body: formData,
            });
            return handleResponse(res);
        },

        track: async (complaintId: string) => {
            const res = await fetch(`${API_BASE}/complaints/${complaintId}`);
            return handleResponse(res);
        },
    },
};

export default api;
