import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import Link from 'next/link'
import {
    Users,
    DollarSign,
    Megaphone,
    MessageSquare,
    Package,
    Search,
    Zap
} from 'lucide-react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Amazon Agency OS',
    description: 'Multi-Agent Platform for Amazon Marketing Agencies',
}

const agents = [
    { name: 'Jeff', icon: Users, href: '/', description: 'Sales/SDR' },
    { name: 'Penny', icon: DollarSign, href: '/', description: 'Pricing' },
    { name: 'Adam', icon: Megaphone, href: '/', description: 'Ads' },
    { name: 'Sue', icon: MessageSquare, href: '/', description: 'Reputation' },
    { name: 'Ivan', icon: Package, href: '/', description: 'Inventory' },
    { name: 'Lisa', icon: Search, href: '/', description: 'SEO' },
]

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className="dark">
            <body className={inter.className}>
                <Providers>
                    <div className="flex min-h-screen">
                        {/* Sidebar */}
                        <aside className="w-64 border-r bg-card p-4">
                            <div className="flex items-center gap-2 mb-8">
                                <Zap className="h-8 w-8 text-primary" />
                                <div>
                                    <h1 className="font-bold text-lg">Agency OS</h1>
                                    <p className="text-xs text-muted-foreground">Multi-Agent Platform</p>
                                </div>
                            </div>

                            <nav className="space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                    Agents
                                </p>
                                {agents.map((agent) => (
                                    <Link
                                        key={agent.name}
                                        href={agent.href}
                                        className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors"
                                    >
                                        <agent.icon className="h-4 w-4" />
                                        <div>
                                            <span className="font-medium">{agent.name}</span>
                                            <span className="text-xs text-muted-foreground ml-2">
                                                {agent.description}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </nav>
                        </aside>

                        {/* Main Content */}
                        <main className="flex-1 p-6">
                            {children}
                        </main>
                    </div>
                </Providers>
            </body>
        </html>
    )
}
