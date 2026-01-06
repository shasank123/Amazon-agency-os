import axios from 'axios'

// API client configured for FastAPI backend
const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
})

// --- Jeff (Sales Agent) ---
export interface CampaignRequest {
    niche: string
    min_revenue: number
}

export interface TaskStatus {
    task_id: string
    status: string
    result: unknown
}

export const jeffApi = {
    startCampaign: (data: CampaignRequest) =>
        api.post('/agents/jeff/start-campaign', data),

    getTaskStatus: (taskId: string) =>
        api.get<TaskStatus>(`/tasks/${taskId}`),
}

// --- Penny (Pricing Agent) ---
export interface PricingLog {
    sku: string
    action: string
    old_price?: number
    new_price?: number
    reason: string
}

export interface PennyResponse {
    agent: string
    optimization_events: PricingLog[]
}

export const pennyApi = {
    getRepricingLog: () =>
        api.get<PennyResponse>('/agents/penny/repricing-log'),
}

// --- Adam (Ads Agent) ---
export interface AdAction {
    keyword: string
    action: string
    reason: string
}

export interface AdamResponse {
    agent: string
    actions: AdAction[]
}

export const adamApi = {
    auditAccount: () =>
        api.get<AdamResponse>('/agents/adam/audit-account'),
}

// --- Sue (Reputation Agent) ---
export interface SueDraftResponse {
    status: string
    draft: string
    message: string
}

export interface SueApproveResponse {
    status: string
    final_output: string
}

export const sueApi = {
    startWorkflow: (review: string) =>
        api.post<SueDraftResponse>('/agents/sue/start-workflow', null, {
            params: { review },
        }),

    approve: (editedText: string) =>
        api.post<SueApproveResponse>('/agents/sue/approve', null, {
            params: { edited_text: editedText },
        }),
}

// --- Ivan (Inventory Agent) ---
export interface StockAlert {
    sku: string
    status: string
    days_remaining: number
    action: string
    quantity_to_order: number
}

export interface IvanResponse {
    agent: string
    stock_alerts: StockAlert[]
}

export const ivanApi = {
    getForecast: () =>
        api.get<IvanResponse>('/agents/ivan/forecast'),
}

// --- Lisa (SEO Agent) ---
export interface LisaResponse {
    agent: string
    current_title: string
    missing_keywords: string[]
    optimized_title: string
}

export const lisaApi = {
    auditListing: (sku: string) =>
        api.get<LisaResponse>(`/agents/lisa/audit-listing/${sku}`),
}

export default api
