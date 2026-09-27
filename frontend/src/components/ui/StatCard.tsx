interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  color?: 'red' | 'gold' | 'blue' | 'green';
  trend?: number;
}

export default function StatCard({ title, value, subtitle, icon, color = 'red', trend }: StatCardProps) {
  const colors = {
    red: { bg: 'bg-[#E63946]/10', text: 'text-[#E63946]', border: 'border-[#E63946]/20' },
    gold: { bg: 'bg-[#FFB703]/10', text: 'text-[#FFB703]', border: 'border-[#FFB703]/20' },
    blue: { bg: 'bg-[#0088FF]/10', text: 'text-[#0088FF]', border: 'border-[#0088FF]/20' },
    green: { bg: 'bg-[#2ECC71]/10', text: 'text-[#2ECC71]', border: 'border-[#2ECC71]/20' },
  };
  const c = colors[color];

  return (
    <div className="bg-[#2D2D2D] border border-[#404040] rounded-xl p-5 card-hover">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[#B3B3B3] text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-[#B3B3B3] text-xs mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              <span className={trend >= 0 ? 'text-[#2ECC71]' : 'text-[#E63946]'}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
              <span className="text-[#B3B3B3] text-xs">so với tuần trước</span>
            </div>
          )}
        </div>
        <div className={`${c.bg} ${c.border} border rounded-xl p-3`}>
          <span className={`text-2xl ${c.text}`}>{icon}</span>
        </div>
      </div>
    </div>
  );
}
