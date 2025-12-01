import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeftRight, Clock, Coins, TrendingUp, Lock, Zap } from 'lucide-react';

const services = [
  {
    title: 'Swap',
    description: 'Exchange tokens with optimized routes',
    href: '/swap',
    icon: ArrowLeftRight,
  },
  { title: 'DCA', description: 'Dollar Cost Averaging orders', href: '/dca', icon: Clock },
  { title: 'Tokens', description: 'Browse and search tokens', href: '/tokens', icon: Coins },
  {
    title: 'Market',
    description: 'Price feeds and market data',
    href: '/market',
    icon: TrendingUp,
  },
  { title: 'Staking', description: 'Stake STRK tokens', href: '/staking', icon: Lock },
  { title: 'Paymaster', description: 'Gasless transactions', href: '/paymaster', icon: Zap },
];

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AVNU SDK Example</h1>
        <p className="text-muted-foreground">Explore all SDK features</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Link key={service.href} href={service.href}>
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader>
                <service.icon className="size-8 mb-2 text-muted-foreground" />
                <CardTitle>{service.title}</CardTitle>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
