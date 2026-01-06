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
    const query = useMutation({
        mutationFn: () => pennyApi.getRepricingLog(),
    })

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-500" />
                        <CardTitle className="text-lg">Penny</CardTitle>
                    </div>
                    <Badge variant="outline">Pricing</Badge>
                </div>
                <CardDescription>Competitor price matching</CardDescription>
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
                    Check Prices
                </Button>
                {query.data && (
                    <div className="text-sm space-y-1">
                        {query.data.data.optimization_events.map((e, i) => (
                            <div key={i} className="flex items-center gap-2">
                                {e.action === 'DECREASE_PRICE' ? (
                                    <AlertCircle className="h-3 w-3 text-yellow-500" />
                                ) : (
                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                )}
                                <span className="truncate">{e.sku}: {e.action}</span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// --- Adam Card ---
function AdamCard() {
    const query = useMutation({
        mutationFn: () => adamApi.auditAccount(),
    })

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-orange-500" />
                        <CardTitle className="text-lg">Adam</CardTitle>
                    </div>
                    <Badge variant="outline">Ads</Badge>
                </div>
                <CardDescription>Bleeding keyword detection</CardDescription>
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
                    Audit Ads
                </Button>
                {query.data && (
                    <div className="text-sm space-y-1">
                        {query.data.data.actions.map((a, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <Badge variant={a.action === 'NEGATIVE_MATCH' ? 'destructive' : 'default'} className="text-xs">
                                    {a.action}
                                </Badge>
                                <span className="truncate text-xs">{a.keyword}</span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// --- Sue Card ---
function SueCard() {
    const [review, setReview] = useState('')
    const [draft, setDraft] = useState('')

    const startMutation = useMutation({
        mutationFn: () => sueApi.startWorkflow(review),
        onSuccess: (res) => setDraft(res.data.draft),
    })

    const approveMutation = useMutation({
        mutationFn: () => sueApi.approve(draft),
    })

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-purple-500" />
                        <CardTitle className="text-lg">Sue</CardTitle>
                    </div>
                    <Badge variant="outline">Reputation</Badge>
                </div>
                <CardDescription>Review reply with RAG</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <Input
                    placeholder="Enter bad review..."
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                />
                {!draft ? (
                    <Button
                        className="w-full"
                        onClick={() => startMutation.mutate()}
                        disabled={startMutation.isPending || !review}
                    >
                        {startMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Play className="h-4 w-4 mr-2" />
                        )}
                        Draft Reply
                    </Button>
                ) : (
                    <>
                        <div className="p-2 bg-muted rounded text-sm">{draft}</div>
                        <Button
                            className="w-full"
                            variant="secondary"
                            onClick={() => approveMutation.mutate()}
                            disabled={approveMutation.isPending}
                        >
                            {approveMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                            )}
                            Approve & Publish
                        </Button>
                    </>
                )}
                {approveMutation.isSuccess && (
                    <Badge className="bg-green-600">Published!</Badge>
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
