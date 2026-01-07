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

export interface JeffWorkflowResponse {
    agent: string
    status: string
    prospect: {
        name: string
        url: string
        snippet: string
    }
    email_draft: string
    message: string
}

export interface JeffApproveResponse {
    agent: string
    status: string
    final_email: string
    message: string
}

export const jeffApi = {
    // Legacy Celery-based endpoint (for reference)
    startCampaign: (data: CampaignRequest) =>
        api.post('/agents/jeff/start-campaign', data),

    getTaskStatus: (taskId: string) =>
        api.get<TaskStatus>(`/tasks/${taskId}`),

    // HITL Workflow endpoints
    startWorkflow: (data: CampaignRequest) =>
        api.post<JeffWorkflowResponse>('/agents/jeff/start-workflow', data),

    approve: (edited_email: string) =>
        api.post<JeffApproveResponse>('/agents/jeff/approve', { edited_email }),

    reject: () =>
        api.post('/agents/jeff/reject'),
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
export interface TicketRequest {
    ticket_text: string
    order_status: string
}

export interface SueWorkflowResponse {
    agent: string
    status: string
    policy_retrieved: string
    draft_reply: string
    message: string
}

export interface SueApproveResponse {
    agent: string
    status: string
    final_reply: string
    message: string
}

export const sueApi = {
    // Legacy Celery-based endpoint (for reference)
    handleTicket: (data: TicketRequest) =>
        api.post('/agents/sue/handle-ticket', data),

    getTaskStatus: (taskId: string) =>
        api.get<TaskStatus>(`/tasks/${taskId}`),

    // HITL Workflow endpoints
    startWorkflow: (data: TicketRequest) =>
        api.post<SueWorkflowResponse>('/agents/sue/start-workflow', data),

    approve: (edited_reply: string) =>
        api.post<SueApproveResponse>('/agents/sue/approve', { edited_reply }),

    reject: () =>
        api.post('/agents/sue/reject'),
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
export interface SeoRequest {
    url: string
    keyword: string
}

export const lisaApi = {
    auditSite: (data: SeoRequest) =>
        api.post('/agents/lisa/audit', data),

    getTaskStatus: (taskId: string) =>
        api.get<TaskStatus>(`/tasks/${taskId}`),
}

export default api
