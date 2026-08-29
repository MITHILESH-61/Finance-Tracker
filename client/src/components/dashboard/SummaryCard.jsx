function SummaryCard({ label, value, tone = 'slate', subtitle, icon }) {
  const configs = {
    slate: {
      card: 'border-slate-200/80 bg-white text-slate-900 shadow-sm hover:shadow-md hover:border-slate-300',
      iconBg: 'bg-slate-100 text-slate-700',
      pill: 'bg-slate-100 text-slate-700',
      valueColor: 'text-slate-900',
      defaultIcon: '💳'
    },
    green: {
      card: 'border-emerald-200/60 bg-gradient-to-br from-white to-emerald-50/40 text-slate-900 shadow-sm hover:shadow-md hover:border-emerald-300',
      iconBg: 'bg-emerald-100 text-emerald-700',
      pill: 'bg-emerald-100/80 text-emerald-800',
      valueColor: 'text-emerald-700',
      defaultIcon: '↗'
    },
    red: {
      card: 'border-rose-200/60 bg-gradient-to-br from-white to-rose-50/40 text-slate-900 shadow-sm hover:shadow-md hover:border-rose-300',
      iconBg: 'bg-rose-100 text-rose-700',
      pill: 'bg-rose-100/80 text-rose-800',
      valueColor: 'text-rose-600',
      defaultIcon: '↘'
    },
    blue: {
      card: 'border-indigo-200/60 bg-gradient-to-br from-white to-indigo-50/40 text-slate-900 shadow-sm hover:shadow-md hover:border-indigo-300',
      iconBg: 'bg-indigo-100 text-indigo-700',
      pill: 'bg-indigo-100/80 text-indigo-800',
      valueColor: 'text-indigo-700',
      defaultIcon: '🎯'
    }
  }

  const current = configs[tone] || configs.slate

  return (
    <div className={`rounded-2xl border p-5 transition-all duration-200 ${current.card}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-base font-bold shadow-sm ${current.iconBg}`}>
          {icon || current.defaultIcon}
        </span>
      </div>
      <div className="mt-4">
        <p className={`text-3xl font-extrabold tracking-tight ${current.valueColor}`}>{value}</p>
        {subtitle && (
          <p className="mt-1.5 text-xs font-medium text-slate-500">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

export default SummaryCard
