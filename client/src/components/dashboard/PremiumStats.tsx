import { Target, Zap, Activity, Flame } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface StatProps {
  label: string;
  value: string | number;
  target: number;
  unit: string;
  icon: React.ElementType;
  color: string;
}

function StatCard({ label, value, target, unit, icon: Icon, color }: StatProps) {
  const percentage = Math.min(100, (Number(value) / target) * 100);
  
  return (
    <Card className="glass-card border-primary/10 overflow-hidden relative group">
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 transition-transform group-hover:scale-150 duration-700`} style={{ backgroundColor: color }} />
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">{label}</p>
            <div className="flex items-baseline gap-1 mt-1">
              <h3 className="text-3xl font-black tracking-tighter">{value}</h3>
              <span className="text-xs text-muted-foreground font-medium">{unit}</span>
            </div>
          </div>
          <div className="p-2 rounded-xl bg-primary/5 border border-primary/10">
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-primary">{Math.round(percentage)}%</span>
          </div>
          <Progress value={percentage} className="h-1.5 bg-primary/10" />
          <p className="text-[9px] text-muted-foreground text-right italic">Target: {target} {unit}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function PremiumStats({ profile }: { profile: any }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard 
        label="Calorie Balance"
        value={1840}
        target={profile?.calorieTarget || 2200}
        unit="kcal"
        icon={Flame}
        color="#22c55e"
      />
      <StatCard 
        label="Protein Intake"
        value={142}
        target={180}
        unit="g"
        icon={Zap}
        color="#3b82f6"
      />
      <StatCard 
        label="Activity Level"
        value={8420}
        target={10000}
        unit="steps"
        icon={Activity}
        color="#a855f7"
      />
      <StatCard 
        label="Metabolic Rate"
        value={2150}
        target={2400}
        unit="bmr"
        icon={Target}
        color="#eab308"
      />
    </div>
  );
}
