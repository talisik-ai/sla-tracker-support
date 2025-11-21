import axios, { AxiosError } from 'axios';

// Use import.meta.env for Vite/TanStack Start
const JIRA_BASE_URL = import.meta.env.VITE_JIRA_INSTANCE_URL;
const JIRA_EMAIL = import.meta.env.VITE_JIRA_EMAIL;
const JIRA_API_TOKEN = import.meta.env.VITE_JIRA_API_TOKEN;

// We'll allow missing credentials for now to support mock mode
const isMockMode = !JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN;

// Browser-compatible base64 encoding
const authHeader = !isMockMode
    ? `Basic ${btoa(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`)}`
    : '';

export const jiraClient = axios.create({
    baseURL: JIRA_BASE_URL,
    headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 seconds
});

// Request interceptor for logging
jiraClient.interceptors.request.use(
    (config) => {
        if (isMockMode) {
            console.warn('[Jira API] Mock mode active, request might fail if not mocked');
        }
        console.log(`[Jira API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
jiraClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error: AxiosError) => {
        if (error.response) {
            console.error('[Jira API Error]', {
                status: error.response.status,
                data: error.response.data,
            });
        } else if (error.request) {
            console.error('[Jira API] No response received', error.request);
        } else {
            console.error('[Jira API] Request setup error', error.message);
        }

        return Promise.reject(error);
    }
);

export default jiraClient;
