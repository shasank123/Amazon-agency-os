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

export interface PricingAnalysisRequest {
    product: string
    price: number
    cost: number
    competitor_price: number
}

export const pennyApi = {
    getRepricingLog: () =>
        api.get<PennyResponse>('/agents/penny/repricing-log'),

    analyzePricing: (data: PricingAnalysisRequest) =>
        api.post('/agents/penny/analyze', data),

    getTaskStatus: (taskId: string) =>
        api.get<TaskStatus>(`/tasks/${taskId}`),
}

// --- Adam (Ads Agent) ---
export interface AdCampaignRequest {
    campaign_name: string
}

export const adamApi = {
    optimizeCampaign: (data: AdCampaignRequest) =>
        api.post('/agents/adam/optimize', data),

    getTaskStatus: (taskId: string) =>
        api.get<TaskStatus>(`/tasks/${taskId}`),
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

export interface TicketRequest {
    ticket_text: string
    order_status: string
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

    handleTicket: (data: TicketRequest) =>
        api.post('/agents/sue/handle-ticket', data),

    getTaskStatus: (taskId: string) =>
        api.get<TaskStatus>(`/tasks/${taskId}`),
}

// --- Ivan (Inventory Agent) ---
export interface InventoryRequest {
    sku: string
}

export const ivanApi = {
    checkStock: (data: InventoryRequest) =>
        api.post('/agents/ivan/check-stock', data),

    getTaskStatus: (taskId: string) =>
        api.get<TaskStatus>(`/tasks/${taskId}`),
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
