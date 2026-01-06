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

// --- Jeff Card ---
function JeffCard() {
    const [niche, setNiche] = useState('Baby Care')
    const [minRevenue, setMinRevenue] = useState(10000)
    const [taskId, setTaskId] = useState<string | null>(null)

    const startMutation = useMutation({
        mutationFn: () => jeffApi.startCampaign({ niche, min_revenue: minRevenue }),
        onSuccess: (res) => setTaskId(res.data.task_id),
    })

    const statusQuery = useQuery({
        queryKey: ['jeff-task', taskId],
        queryFn: () => jeffApi.getTaskStatus(taskId!),
        enabled: !!taskId,
        refetchInterval: (query) => {
            // Stop polling when task completes or fails
            const status = query.state.data?.data.status
            if (status === 'SUCCESS' || status === 'FAILURE') {
                return false
            }
            return 2000 // Poll every 2s while pending
        },
    })

    const taskStatus = statusQuery.data?.data.status
    const taskResult = statusQuery.data?.data.result as { leads?: string[] } | null
    const isComplete = taskStatus === 'SUCCESS'
    const isFailed = taskStatus === 'FAILURE'
    const isPending = taskStatus === 'PENDING' || taskStatus === 'STARTED'

    const resetTask = () => {
        setTaskId(null)
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-500" />
                        <CardTitle className="text-lg">Jeff</CardTitle>
                    </div>
                    <Badge variant="outline">Sales/SDR</Badge>
                </div>
                <CardDescription>Lead scraping & outreach</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="space-y-2">
                    <Input
                        placeholder="Niche"
                        value={niche}
                        onChange={(e) => setNiche(e.target.value)}
                        disabled={!!taskId && !isComplete}
                    />
                    <Input
                        type="number"
                        placeholder="Min Revenue"
                        value={minRevenue}
                        onChange={(e) => setMinRevenue(Number(e.target.value))}
                        disabled={!!taskId && !isComplete}
                    />
                </div>

                {!taskId || isComplete || isFailed ? (
                    <Button
                        className="w-full"
                        onClick={() => {
                            resetTask()
                            startMutation.mutate()
                        }}
                        disabled={startMutation.isPending}
                    >
                        {startMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Play className="h-4 w-4 mr-2" />
                        )}
                        {isComplete ? 'Run Again' : 'Start Campaign'}
                    </Button>
                ) : (
                    <Button className="w-full" disabled variant="secondary">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                    </Button>
                )}

                {taskId && (
                    <div className="text-sm space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Status:</span>
                            {isComplete ? (
                                <Badge variant="default" className="bg-green-600">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Complete
                                </Badge>
                            ) : isFailed ? (
                                <Badge variant="destructive">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Failed
                                </Badge>
                            ) : (
                                <Badge variant="secondary">
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    {taskStatus || 'Queued'}
                                </Badge>
                            )}
                        </div>

                        {/* Show results when complete */}
                        {isComplete && taskResult?.leads && taskResult.leads.length > 0 && (
                            <div className="p-2 bg-muted rounded space-y-2 max-h-48 overflow-y-auto">
                                {taskResult.leads.map((lead, i) => (
                                    <p key={i} className="text-xs text-green-400 break-words whitespace-normal leading-relaxed">
                                        ✓ {lead}
                                    </p>
                                ))}
                            </div>
                        )}
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

// --- Sue Card ---
function SueCard() {
    const [ticket, setTicket] = useState('I want a refund for my order')
    const [orderStatus, setOrderStatus] = useState('Delivered')
    const [taskId, setTaskId] = useState<string | null>(null)

    const startMutation = useMutation({
        mutationFn: () => sueApi.handleTicket({ ticket_text: ticket, order_status: orderStatus }),
        onSuccess: (res) => setTaskId(res.data.task_id),
    })

    const statusQuery = useQuery({
        queryKey: ['sue-task', taskId],
        queryFn: () => sueApi.getTaskStatus(taskId!),
        enabled: !!taskId,
        refetchInterval: (query) => {
            const status = query.state.data?.data.status
            if (status === 'SUCCESS' || status === 'FAILURE') return false
            return 2000
        },
    })

    const taskStatus = statusQuery.data?.data.status
    const taskResult = statusQuery.data?.data.result as {
        response?: { reply: string; policy_used: string }
    } | null
    const isComplete = taskStatus === 'SUCCESS'

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-purple-500" />
                        <CardTitle className="text-lg">Sue</CardTitle>
                    </div>
                    <Badge variant="outline">RAG Support</Badge>
                </div>
                <CardDescription>Policy retrieval + AI response</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
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
                    onClick={() => { setTaskId(null); startMutation.mutate() }}
                    disabled={startMutation.isPending || (!!taskId && !isComplete) || !ticket}
                >
                    {startMutation.isPending || (taskId && !isComplete) ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Play className="h-4 w-4 mr-2" />
                    )}
                    {isComplete ? 'Handle Another' : 'Handle Ticket'}
                </Button>

                {isComplete && taskResult?.response && (
                    <div className="space-y-2">
                        <div className="p-2 bg-blue-500/10 rounded">
                            <p className="text-xs text-muted-foreground mb-1">📋 Policy Retrieved:</p>
                            <p className="text-xs text-blue-400 break-words whitespace-normal">
                                {taskResult.response.policy_used}
                            </p>
                        </div>
                        <div className="p-2 bg-muted rounded">
                            <p className="text-xs text-muted-foreground mb-1">💬 AI Response:</p>
                            <p className="text-sm text-green-400 break-words whitespace-normal leading-relaxed">
                                {taskResult.response.reply}
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// --- Ivan Card ---
function IvanCard() {
    const query = useMutation({
        mutationFn: () => ivanApi.getForecast(),
    })

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-red-500" />
                        <CardTitle className="text-lg">Ivan</CardTitle>
                    </div>
                    <Badge variant="outline">Inventory</Badge>
                </div>
                <CardDescription>Stockout prediction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <Button
                    className="w-full"
                    onClick={() => query.mutate()}
                    disabled={query.isPending}
                >
                    {query.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Play className="h-4 w-4 mr-2" />
                    )}
                    Forecast Stock
                </Button>
                {query.data && (
                    <div className="text-sm space-y-1">
                        {query.data.data.stock_alerts.length === 0 ? (
                            <div className="flex items-center gap-2 text-green-500">
                                <CheckCircle2 className="h-3 w-3" />
                                All stock levels OK
                            </div>
                        ) : (
                            query.data.data.stock_alerts.map((a, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Badge variant="destructive" className="text-xs">
                                        {a.status}
                                    </Badge>
                                    <span className="truncate text-xs">
                                        {a.sku}: {Math.round(a.days_remaining)} days left
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// --- Lisa Card ---
function LisaCard() {
    const [sku, setSku] = useState('sku_123')

    const query = useMutation({
        mutationFn: () => lisaApi.auditListing(sku),
    })

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-cyan-500" />
                        <CardTitle className="text-lg">Lisa</CardTitle>
                    </div>
                    <Badge variant="outline">SEO</Badge>
                </div>
                <CardDescription>Listing keyword audit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <Input
                    placeholder="SKU"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                />
                <Button
                    className="w-full"
                    onClick={() => query.mutate()}
                    disabled={query.isPending || !sku}
                >
                    {query.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Play className="h-4 w-4 mr-2" />
                    )}
                    Audit Listing
                </Button>
                {query.data && (
                    <div className="text-sm space-y-2">
                        <div className="p-2 bg-muted rounded">
                            <p className="text-muted-foreground text-xs mb-1">Missing Keywords:</p>
                            <p className="text-yellow-400 text-xs break-words whitespace-normal">
                                {query.data.data.missing_keywords.join(', ')}
                            </p>
                        </div>
                        <div className="p-2 bg-muted rounded">
                            <p className="text-muted-foreground text-xs mb-1">Optimized Title:</p>
                            <p className="text-green-400 text-xs break-words whitespace-normal leading-relaxed">
                                {query.data.data.optimized_title}
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
