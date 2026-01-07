'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Users,
    DollarSign,
    Megaphone,
    MessageSquare,
    Package,
    Search,
    Play,
    Loader2,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react'
import { jeffApi, pennyApi, adamApi, sueApi, ivanApi, lisaApi } from '@/lib/api'

export default function Dashboard() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Agent Dashboard</h1>
                <p className="text-muted-foreground">
                    Monitor and control your AI workforce
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <JeffCard />
                <PennyCard />
                <AdamCard />
                <SueCard />
                <IvanCard />
                <LisaCard />
            </div>
        </div>
    )
}

// --- Jeff Card (HITL) ---
function JeffCard() {
    const [niche, setNiche] = useState('Baby Care')
    const [minRevenue, setMinRevenue] = useState(10000)
    const [editedEmail, setEditedEmail] = useState('')

    // Workflow states: idle, searching, pending_approval, sending, completed, rejected
    const [workflowState, setWorkflowState] = useState<'idle' | 'searching' | 'pending_approval' | 'sending' | 'completed' | 'rejected'>('idle')
    const [workflowData, setWorkflowData] = useState<{
        prospect?: { name: string; url: string; snippet: string }
        email_draft?: string
        final_email?: string
    } | null>(null)

    // Start HITL workflow
    const startMutation = useMutation({
        mutationFn: () => jeffApi.startWorkflow({ niche, min_revenue: minRevenue }),
        onMutate: () => setWorkflowState('searching'),
        onSuccess: (res) => {
            setWorkflowData({
                prospect: res.data.prospect,
                email_draft: res.data.email_draft,
            })
            setEditedEmail(res.data.email_draft)
            setWorkflowState('pending_approval')
        },
        onError: () => setWorkflowState('idle'),
    })

    // Approve workflow
    const approveMutation = useMutation({
        mutationFn: () => jeffApi.approve(editedEmail),
        onMutate: () => setWorkflowState('sending'),
        onSuccess: (res) => {
            setWorkflowData(prev => ({ ...prev, final_email: res.data.final_email }))
            setWorkflowState('completed')
        },
        onError: () => setWorkflowState('pending_approval'),
    })

    // Reject workflow
    const rejectMutation = useMutation({
        mutationFn: () => jeffApi.reject(),
        onSuccess: () => {
            setWorkflowState('rejected')
            setTimeout(() => {
                setWorkflowState('idle')
                setWorkflowData(null)
                setEditedEmail('')
            }, 2000)
        },
    })

    const resetWorkflow = () => {
        setWorkflowState('idle')
        setWorkflowData(null)
        setEditedEmail('')
    }

    const isProcessing = workflowState === 'searching' || workflowState === 'sending'

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-500" />
                        <CardTitle className="text-lg">Jeff</CardTitle>
                    </div>
                    <Badge variant="outline">Sales/SDR (HITL)</Badge>
                </div>
                <CardDescription>Lead scraping & outreach with human approval</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Input Section - Only show when idle or completed */}
                {(workflowState === 'idle' || workflowState === 'completed' || workflowState === 'rejected') && (
                    <div className="space-y-2">
                        <Input
                            placeholder="Niche"
                            value={niche}
                            onChange={(e) => setNiche(e.target.value)}
                        />
                        <Input
                            type="number"
                            placeholder="Min Revenue"
                            value={minRevenue}
                            onChange={(e) => setMinRevenue(Number(e.target.value))}
                        />
                        <Button
                            className="w-full"
                            onClick={() => {
                                resetWorkflow()
                                startMutation.mutate()
                            }}
                            disabled={startMutation.isPending}
                        >
                            {startMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Play className="h-4 w-4 mr-2" />
                            )}
                            {workflowState === 'completed' ? 'Start New Campaign' : 'Start Campaign'}
                        </Button>
                    </div>
                )}

                {/* Searching State */}
                {workflowState === 'searching' && (
                    <div className="p-4 bg-blue-500/10 rounded flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        <div>
                            <p className="text-sm font-medium">Searching for prospects...</p>
                            <p className="text-xs text-muted-foreground">Jeff is finding leads in "{niche}"</p>
                        </div>
                    </div>
                )}

                {/* Pending Approval State - Show Draft for Review */}
                {workflowState === 'pending_approval' && workflowData && (
                    <div className="space-y-3">
                        {/* Prospect Info */}
                        <div className="p-2 bg-muted rounded">
                            <p className="text-xs text-muted-foreground mb-1">📎 Prospect Found:</p>
                            <p className="text-sm font-medium text-blue-400">{workflowData.prospect?.name}</p>
                            <p className="text-xs text-muted-foreground break-all">{workflowData.prospect?.url}</p>
                        </div>

                        {/* Editable Email Draft */}
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">✏️ Edit Email Draft:</p>
                            <textarea
                                className="w-full p-2 rounded bg-muted text-sm border border-input min-h-[120px] resize-y"
                                value={editedEmail}
                                onChange={(e) => setEditedEmail(e.target.value)}
                            />
                        </div>

                        {/* Approve/Reject Buttons */}
                        <div className="flex gap-2">
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => approveMutation.mutate()}
                                disabled={approveMutation.isPending || !editedEmail}
                            >
                                {approveMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                )}
                                Approve & Send
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => rejectMutation.mutate()}
                                disabled={rejectMutation.isPending}
                            >
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Reject
                            </Button>
                        </div>
                    </div>
                )}

                {/* Sending State */}
                {workflowState === 'sending' && (
                    <div className="p-4 bg-green-500/10 rounded flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-green-500" />
                        <div>
                            <p className="text-sm font-medium">Sending email...</p>
                            <p className="text-xs text-muted-foreground">Jeff is sending the approved email</p>
                        </div>
                    </div>
                )}

                {/* Completed State */}
                {workflowState === 'completed' && workflowData && (
                    <div className="space-y-2">
                        <div className="p-3 bg-green-500/10 rounded flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span className="text-sm font-medium text-green-400">Email Sent Successfully!</span>
                        </div>
                        <div className="p-2 bg-muted rounded max-h-32 overflow-y-auto">
                            <p className="text-xs text-muted-foreground mb-1">📧 Sent to: {workflowData.prospect?.name}</p>
                            <p className="text-xs text-green-400 whitespace-pre-wrap">{workflowData.final_email}</p>
                        </div>
                    </div>
                )}

                {/* Rejected State */}
                {workflowState === 'rejected' && (
                    <div className="p-3 bg-red-500/10 rounded flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <span className="text-sm font-medium text-red-400">Draft Rejected - Resetting...</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// --- Penny Card ---
function PennyCard() {
    const [product, setProduct] = useState('Wireless Earbuds')
    const [price, setPrice] = useState(49.99)
    const [cost, setCost] = useState(15.00)
    const [competitorPrice, setCompetitorPrice] = useState(44.99)
    const [taskId, setTaskId] = useState<string | null>(null)

    const startMutation = useMutation({
        mutationFn: () => pennyApi.analyzePricing({ product, price, cost, competitor_price: competitorPrice }),
        onSuccess: (res) => setTaskId(res.data.task_id),
    })

    const statusQuery = useQuery({
        queryKey: ['penny-task', taskId],
        queryFn: () => pennyApi.getTaskStatus(taskId!),
        enabled: !!taskId,
        refetchInterval: (query) => {
            const status = query.state.data?.data.status
            if (status === 'SUCCESS' || status === 'FAILURE') return false
            return 2000
        },
    })

    const taskStatus = statusQuery.data?.data.status
    const taskResult = statusQuery.data?.data.result as {
        analysis?: { margin: string; flags: string[]; strategy: string }
    } | null
    const isComplete = taskStatus === 'SUCCESS'

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-500" />
                        <CardTitle className="text-lg">Penny</CardTitle>
                    </div>
                    <Badge variant="outline">Pricing AI</Badge>
                </div>
                <CardDescription>Margin analysis + LLM strategy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Product" value={product} onChange={(e) => setProduct(e.target.value)} />
                    <Input type="number" placeholder="Our Price" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
                    <Input type="number" placeholder="Cost" value={cost} onChange={(e) => setCost(Number(e.target.value))} />
                    <Input type="number" placeholder="Competitor $" value={competitorPrice} onChange={(e) => setCompetitorPrice(Number(e.target.value))} />
                </div>

                <Button
                    className="w-full"
                    onClick={() => { setTaskId(null); startMutation.mutate() }}
                    disabled={startMutation.isPending || (!!taskId && !isComplete)}
                >
                    {startMutation.isPending || (taskId && !isComplete) ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Play className="h-4 w-4 mr-2" />
                    )}
                    {isComplete ? 'Analyze Again' : 'Analyze Pricing'}
                </Button>

                {isComplete && taskResult?.analysis && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge variant={parseFloat(taskResult.analysis.margin) < 15 ? 'destructive' : 'default'}>
                                Margin: {taskResult.analysis.margin}
                            </Badge>
                        </div>
                        {taskResult.analysis.flags.length > 0 && (
                            <div className="p-2 bg-yellow-500/10 rounded text-xs text-yellow-400 space-y-1">
                                {taskResult.analysis.flags.map((f, i) => (
                                    <p key={i}>⚠️ {f}</p>
                                ))}
                            </div>
                        )}
                        <div className="p-2 bg-muted rounded">
                            <p className="text-xs text-muted-foreground mb-1">AI Strategy:</p>
                            <p className="text-sm text-green-400 break-words whitespace-normal">
                                {taskResult.analysis.strategy}
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// --- Adam Card ---
function AdamCard() {
    const [campaign, setCampaign] = useState('Gaming Mouse - Exact')
    const [taskId, setTaskId] = useState<string | null>(null)

    const startMutation = useMutation({
        mutationFn: () => adamApi.optimizeCampaign({ campaign_name: campaign }),
        onSuccess: (res) => setTaskId(res.data.task_id),
    })

    const statusQuery = useQuery({
        queryKey: ['adam-task', taskId],
        queryFn: () => adamApi.getTaskStatus(taskId!),
        enabled: !!taskId,
        refetchInterval: (query) => {
            const status = query.state.data?.data.status
            if (status === 'SUCCESS' || status === 'FAILURE') return false
            return 2000
        },
    })

    const taskStatus = statusQuery.data?.data.status
    const taskResult = statusQuery.data?.data.result as {
        report?: { spend: string; sales: string; acos: string; decision: string; reasoning: string },
        error?: string
    } | null
    const isComplete = taskStatus === 'SUCCESS'

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-orange-500" />
                        <CardTitle className="text-lg">Adam</CardTitle>
                    </div>
                    <Badge variant="outline">PPC Analytics</Badge>
                </div>
                <CardDescription>Campaign ACOS/ROAS optimization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <select
                    className="w-full p-2 rounded bg-muted text-sm border border-input"
                    value={campaign}
                    onChange={(e) => setCampaign(e.target.value)}
                >
                    <option value="Gaming Mouse - Exact">Gaming Mouse - Exact</option>
                    <option value="Office Chair - Broad">Office Chair - Broad</option>
                    <option value="Headphones - Auto">Headphones - Auto</option>
                </select>

                <Button
                    className="w-full"
                    onClick={() => { setTaskId(null); startMutation.mutate() }}
                    disabled={startMutation.isPending || (!!taskId && !isComplete)}
                >
                    {startMutation.isPending || (taskId && !isComplete) ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Play className="h-4 w-4 mr-2" />
                    )}
                    {isComplete ? 'Analyze Again' : 'Optimize Campaign'}
                </Button>

                {isComplete && taskResult?.error && (
                    <div className="p-2 bg-red-500/10 rounded text-xs text-red-400">
                        ⚠️ {taskResult.error}
                    </div>
                )}

                {isComplete && taskResult?.report && (
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="p-2 bg-muted rounded">
                                <p className="text-xs text-muted-foreground">Spend</p>
                                <p className="text-sm font-bold text-red-400">{taskResult.report.spend}</p>
                            </div>
                            <div className="p-2 bg-muted rounded">
                                <p className="text-xs text-muted-foreground">Sales</p>
                                <p className="text-sm font-bold text-green-400">{taskResult.report.sales}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">ACOS:</span>
                            <Badge variant={parseFloat(taskResult.report.acos) > 30 ? 'destructive' : 'default'}>
                                {taskResult.report.acos}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Decision:</span>
                            <Badge variant={taskResult.report.decision.includes('DECREASE') ? 'destructive' : 'default'}>
                                {taskResult.report.decision}
                            </Badge>
                        </div>
                        <div className="p-2 bg-muted rounded">
                            <p className="text-xs text-muted-foreground mb-1">🤖 AI Analysis:</p>
                            <p className="text-sm text-green-400 break-words whitespace-normal leading-relaxed">
                                {taskResult.report.reasoning}
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// --- Sue Card (HITL) ---
function SueCard() {
    const [ticket, setTicket] = useState('I want a refund for my order')
    const [orderStatus, setOrderStatus] = useState('Delivered')
    const [editedReply, setEditedReply] = useState('')

    // Workflow states: idle, drafting, pending_approval, publishing, completed, rejected
    const [workflowState, setWorkflowState] = useState<'idle' | 'drafting' | 'pending_approval' | 'publishing' | 'completed' | 'rejected'>('idle')
    const [workflowData, setWorkflowData] = useState<{
        policy_retrieved?: string
        draft_reply?: string
        final_reply?: string
    } | null>(null)

    // Start HITL workflow
    const startMutation = useMutation({
        mutationFn: () => sueApi.startWorkflow({ ticket_text: ticket, order_status: orderStatus }),
        onMutate: () => setWorkflowState('drafting'),
        onSuccess: (res) => {
            setWorkflowData({
                policy_retrieved: res.data.policy_retrieved,
                draft_reply: res.data.draft_reply,
            })
            setEditedReply(res.data.draft_reply)
            setWorkflowState('pending_approval')
        },
        onError: () => setWorkflowState('idle'),
    })

    // Approve workflow
    const approveMutation = useMutation({
        mutationFn: () => sueApi.approve(editedReply),
        onMutate: () => setWorkflowState('publishing'),
        onSuccess: (res) => {
            setWorkflowData(prev => ({ ...prev, final_reply: res.data.final_reply }))
            setWorkflowState('completed')
        },
        onError: () => setWorkflowState('pending_approval'),
    })

    // Reject workflow
    const rejectMutation = useMutation({
        mutationFn: () => sueApi.reject(),
        onSuccess: () => {
            setWorkflowState('rejected')
            setTimeout(() => {
                setWorkflowState('idle')
                setWorkflowData(null)
                setEditedReply('')
            }, 2000)
        },
    })

    const resetWorkflow = () => {
        setWorkflowState('idle')
        setWorkflowData(null)
        setEditedReply('')
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-purple-500" />
                        <CardTitle className="text-lg">Sue</CardTitle>
                    </div>
                    <Badge variant="outline">RAG Support (HITL)</Badge>
                </div>
                <CardDescription>Policy retrieval + AI response with human approval</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Input Section - Only show when idle or completed */}
                {(workflowState === 'idle' || workflowState === 'completed' || workflowState === 'rejected') && (
                    <div className="space-y-2">
                        <Input
                            placeholder="Customer issue..."
                            value={ticket}
                            onChange={(e) => setTicket(e.target.value)}
                        />
                        <select
                            className="w-full p-2 rounded bg-muted text-sm border border-input"
                            value={orderStatus}
                            onChange={(e) => setOrderStatus(e.target.value)}
                        >
                            <option value="Delivered">Delivered</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Processing">Processing</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                        <Button
                            className="w-full"
                            onClick={() => {
                                resetWorkflow()
                                startMutation.mutate()
                            }}
                            disabled={startMutation.isPending || !ticket}
                        >
                            {startMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Play className="h-4 w-4 mr-2" />
                            )}
                            {workflowState === 'completed' ? 'Handle New Ticket' : 'Handle Ticket'}
                        </Button>
                    </div>
                )}

                {/* Drafting State */}
                {workflowState === 'drafting' && (
                    <div className="p-4 bg-purple-500/10 rounded flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                        <div>
                            <p className="text-sm font-medium">Drafting response...</p>
                            <p className="text-xs text-muted-foreground">Sue is retrieving policy and generating reply</p>
                        </div>
                    </div>
                )}

                {/* Pending Approval State - Show Draft for Review */}
                {workflowState === 'pending_approval' && workflowData && (
                    <div className="space-y-3">
                        {/* Policy Retrieved */}
                        <div className="p-2 bg-blue-500/10 rounded">
                            <p className="text-xs text-muted-foreground mb-1">📋 Policy Retrieved:</p>
                            <p className="text-xs text-blue-400 break-words whitespace-normal max-h-16 overflow-y-auto">
                                {workflowData.policy_retrieved}
                            </p>
                        </div>

                        {/* Editable Reply Draft */}
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">✏️ Edit Reply Draft:</p>
                            <textarea
                                className="w-full p-2 rounded bg-muted text-sm border border-input min-h-[100px] resize-y"
                                value={editedReply}
                                onChange={(e) => setEditedReply(e.target.value)}
                            />
                        </div>

                        {/* Approve/Reject Buttons */}
                        <div className="flex gap-2">
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => approveMutation.mutate()}
                                disabled={approveMutation.isPending || !editedReply}
                            >
                                {approveMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                )}
                                Approve & Publish
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => rejectMutation.mutate()}
                                disabled={rejectMutation.isPending}
                            >
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Reject
                            </Button>
                        </div>
                    </div>
                )}

                {/* Publishing State */}
                {workflowState === 'publishing' && (
                    <div className="p-4 bg-green-500/10 rounded flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-green-500" />
                        <div>
                            <p className="text-sm font-medium">Publishing reply...</p>
                            <p className="text-xs text-muted-foreground">Sue is posting the approved response</p>
                        </div>
                    </div>
                )}

                {/* Completed State */}
                {workflowState === 'completed' && workflowData && (
                    <div className="space-y-2">
                        <div className="p-3 bg-green-500/10 rounded flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span className="text-sm font-medium text-green-400">Reply Published Successfully!</span>
                        </div>
                        <div className="p-2 bg-muted rounded max-h-32 overflow-y-auto">
                            <p className="text-xs text-muted-foreground mb-1">💬 Published Reply:</p>
                            <p className="text-xs text-green-400 whitespace-pre-wrap">{workflowData.final_reply}</p>
                        </div>
                    </div>
                )}

                {/* Rejected State */}
                {workflowState === 'rejected' && (
                    <div className="p-3 bg-red-500/10 rounded flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <span className="text-sm font-medium text-red-400">Draft Rejected - Resetting...</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// --- Ivan Card ---
function IvanCard() {
    const [sku, setSku] = useState('GM-001')
    const [taskId, setTaskId] = useState<string | null>(null)

    const startMutation = useMutation({
        mutationFn: () => ivanApi.checkStock({ sku }),
        onSuccess: (res) => setTaskId(res.data.task_id),
    })

    const statusQuery = useQuery({
        queryKey: ['ivan-task', taskId],
        queryFn: () => ivanApi.getTaskStatus(taskId!),
        enabled: !!taskId,
        refetchInterval: (query) => {
            const status = query.state.data?.data.status
            if (status === 'SUCCESS' || status === 'FAILURE') return false
            return 2000
        },
    })

    const taskStatus = statusQuery.data?.data.status
    const taskResult = statusQuery.data?.data.result as {
        decision?: string,
        details?: string,
        po_details?: { sku: string; product: string; stock_level: string; order_qty: number; total_cost: string; supplier: string; email_draft: string },
        error?: string
    } | null
    const isComplete = taskStatus === 'SUCCESS'

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-red-500" />
                        <CardTitle className="text-lg">Ivan</CardTitle>
                    </div>
                    <Badge variant="outline">Inventory AI</Badge>
                </div>
                <CardDescription>Stock check + PO drafting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <select
                    className="w-full p-2 rounded bg-muted text-sm border border-input"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                >
                    <option value="GM-001">GM-001 - RGB Gaming Mouse (LOW)</option>
                    <option value="CH-999">CH-999 - Ergo Office Chair (OK)</option>
                </select>

                <Button
                    className="w-full"
                    onClick={() => { setTaskId(null); startMutation.mutate() }}
                    disabled={startMutation.isPending || (!!taskId && !isComplete)}
                >
                    {startMutation.isPending || (taskId && !isComplete) ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Play className="h-4 w-4 mr-2" />
                    )}
                    {isComplete ? 'Check Again' : 'Check Stock'}
                </Button>

                {isComplete && taskResult?.error && (
                    <div className="p-2 bg-red-500/10 rounded text-xs text-red-400">
                        ⚠️ {taskResult.error}
                    </div>
                )}

                {isComplete && taskResult?.decision === 'STOCK HEALTHY' && (
                    <div className="p-2 bg-green-500/10 rounded flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-400">{taskResult.details}</span>
                    </div>
                )}

                {isComplete && taskResult?.po_details && (
                    <div className="space-y-2">
                        <Badge variant="destructive" className="w-full justify-center">
                            ⚠️ REORDER TRIGGERED
                        </Badge>
                        <div className="grid grid-cols-2 gap-2 text-center text-xs">
                            <div className="p-2 bg-muted rounded">
                                <p className="text-muted-foreground">Stock</p>
                                <p className="font-bold text-red-400">{taskResult.po_details.stock_level}</p>
                            </div>
                            <div className="p-2 bg-muted rounded">
                                <p className="text-muted-foreground">Order Qty</p>
                                <p className="font-bold text-green-400">{taskResult.po_details.order_qty}</p>
                            </div>
                        </div>
                        <div className="p-2 bg-muted rounded text-xs">
                            <p className="text-muted-foreground mb-1">📧 To: {taskResult.po_details.supplier}</p>
                            <p className="text-muted-foreground mb-1">💰 Total: {taskResult.po_details.total_cost}</p>
                        </div>
                        <div className="p-2 bg-blue-500/10 rounded max-h-32 overflow-y-auto">
                            <p className="text-xs text-muted-foreground mb-1">📝 Draft PO Email:</p>
                            <p className="text-xs text-blue-400 break-words whitespace-pre-wrap leading-relaxed">
                                {taskResult.po_details.email_draft}
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// --- Lisa Card ---
function LisaCard() {
    const [url, setUrl] = useState('https://example.com')
    const [keyword, setKeyword] = useState('best product')
    const [taskId, setTaskId] = useState<string | null>(null)

    const startMutation = useMutation({
        mutationFn: () => lisaApi.auditSite({ url, keyword }),
        onSuccess: (res) => setTaskId(res.data.task_id),
    })

    const statusQuery = useQuery({
        queryKey: ['lisa-task', taskId],
        queryFn: () => lisaApi.getTaskStatus(taskId!),
        enabled: !!taskId,
        refetchInterval: (query) => {
            const status = query.state.data?.data.status
            if (status === 'SUCCESS' || status === 'FAILURE') return false
            return 2000
        },
    })

    const taskStatus = statusQuery.data?.data.status
    const taskResult = statusQuery.data?.data.result as {
        audit?: {
            url: string
            score: number
            metrics: { word_count: number; density: string; h1_found: boolean }
            issues: string[]
            recommendations: string
        }
        error?: string
    } | null
    const isComplete = taskStatus === 'SUCCESS'
    const isFailed = taskStatus === 'FAILURE'

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400'
        if (score >= 50) return 'text-yellow-400'
        return 'text-red-400'
    }

    const getScoreBadgeVariant = (score: number): 'default' | 'destructive' | 'secondary' => {
        if (score >= 80) return 'default'
        if (score >= 50) return 'secondary'
        return 'destructive'
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-cyan-500" />
                        <CardTitle className="text-lg">Lisa</CardTitle>
                    </div>
                    <Badge variant="outline">SEO Audit</Badge>
                </div>
                <CardDescription>Website SEO analysis + AI recommendations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <Input
                    placeholder="URL to audit (e.g. https://example.com)"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={!!taskId && !isComplete && !isFailed}
                />
                <Input
                    placeholder="Target keyword"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    disabled={!!taskId && !isComplete && !isFailed}
                />

                <Button
                    className="w-full"
                    onClick={() => { setTaskId(null); startMutation.mutate() }}
                    disabled={startMutation.isPending || (!!taskId && !isComplete && !isFailed) || !url || !keyword}
                >
                    {startMutation.isPending || (taskId && !isComplete && !isFailed) ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Play className="h-4 w-4 mr-2" />
                    )}
                    {isComplete ? 'Audit Again' : 'Run SEO Audit'}
                </Button>

                {isComplete && taskResult?.error && (
                    <div className="p-2 bg-red-500/10 rounded text-xs text-red-400">
                        ⚠️ {taskResult.error}
                    </div>
                )}

                {isComplete && taskResult?.audit && (
                    <div className="space-y-2">
                        {/* Score Badge */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">SEO Score:</span>
                            <Badge variant={getScoreBadgeVariant(taskResult.audit.score)}>
                                <span className={`font-bold ${getScoreColor(taskResult.audit.score)}`}>
                                    {taskResult.audit.score}/100
                                </span>
                            </Badge>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="p-2 bg-muted rounded">
                                <p className="text-muted-foreground">Words</p>
                                <p className="font-bold text-blue-400">{taskResult.audit.metrics.word_count}</p>
                            </div>
                            <div className="p-2 bg-muted rounded">
                                <p className="text-muted-foreground">Density</p>
                                <p className="font-bold text-purple-400">{taskResult.audit.metrics.density}</p>
                            </div>
                            <div className="p-2 bg-muted rounded">
                                <p className="text-muted-foreground">H1 Tag</p>
                                <p className={`font-bold ${taskResult.audit.metrics.h1_found ? 'text-green-400' : 'text-red-400'}`}>
                                    {taskResult.audit.metrics.h1_found ? '✓ Found' : '✗ Missing'}
                                </p>
                            </div>
                        </div>

                        {/* Issues List */}
                        {taskResult.audit.issues.length > 0 && (
                            <div className="p-2 bg-yellow-500/10 rounded space-y-1 max-h-24 overflow-y-auto">
                                <p className="text-xs text-muted-foreground mb-1">⚠️ Issues Found:</p>
                                {taskResult.audit.issues.map((issue, i) => (
                                    <p key={i} className="text-xs text-yellow-400 break-words whitespace-normal">
                                        • {issue}
                                    </p>
                                ))}
                            </div>
                        )}

                        {/* AI Recommendations */}
                        <div className="p-2 bg-cyan-500/10 rounded max-h-40 overflow-y-auto">
                            <p className="text-xs text-muted-foreground mb-1">🤖 AI Recommendations:</p>
                            <p className="text-xs text-cyan-400 break-words whitespace-pre-wrap leading-relaxed">
                                {taskResult.audit.recommendations}
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
