import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, AlertCircle, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { aiApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function Insights() {
  const { data, isLoading } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => aiApi.getInsights(),
    refetchInterval: 60000 * 5, // Refresh every 5 mins
  });

  const insights = data?.data.data.insights || [];

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-primary/5 rounded-2xl border border-primary/10" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Intelligence Engine
        </h2>
        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono uppercase tracking-widest">
          Live Analysis
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {insights.map((insight: any, i: number) => {
          const Icon = insight.type === 'warning' ? AlertCircle : insight.type === 'success' ? CheckCircle2 : Info;
          return (
            <Card key={i} className="glass-card border-primary/10 hover:border-primary/30 transition-all group overflow-hidden">
              <div className={cn(
                "absolute top-0 left-0 w-1 h-full",
                insight.type === 'warning' ? "bg-orange-500" : insight.type === 'success' ? "bg-primary" : "bg-blue-500"
              )} />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Icon className={cn(
                    "w-4 h-4",
                    insight.type === 'warning' ? "text-orange-500" : insight.type === 'success' ? "text-primary" : "text-blue-500"
                  )} />
                  {insight.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {insight.description}
                </p>
                <Button variant="link" size="sm" className="p-0 h-auto mt-3 text-primary text-[10px] uppercase tracking-tighter group-hover:gap-2 transition-all">
                  Optimize Now <ArrowRight className="w-3 h-3" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
        {insights.length === 0 && (
          <Card className="md:col-span-3 glass-card border-dashed border-primary/20 flex flex-col items-center justify-center py-12 text-center">
            <BotIcon className="w-12 h-12 text-primary/20 mb-4" />
            <CardTitle className="text-muted-foreground">Gathering more metabolic data...</CardTitle>
            <CardDescription>Generate a meal plan to unlock deep AI insights</CardDescription>
          </Card>
        )}
      </div>
    </div>
  );
}

function BotIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );
}
