/**
 * Lightweight SVG chart primitives (no dependencies).
 * All charts use CSS variables for theming.
 */

export function PieChart({ data, size = 200, thickness = 32, centerLabel, centerValue }) {
  const total = data.reduce((s, d) => s + Math.max(0, d.value), 0);
  const r = size / 2 - thickness / 2;
  const cx = size / 2, cy = size / 2;
  let acc = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Tortni graf">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-border)" strokeWidth={thickness} />
      {total > 0 && data.map((d, i) => {
        const v = Math.max(0, d.value);
        if (v === 0) return null;
        const len = (v / total) * (2 * Math.PI * r);
        const dash = `${len} ${2 * Math.PI * r - len}`;
        const offset = -acc;
        acc += len;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={d.color || 'var(--color-accent)'}
            strokeWidth={thickness}
            strokeDasharray={dash}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        );
      })}
      {(centerLabel || centerValue) && (
        <g>
          {centerValue && (
            <text x={cx} y={cy - 2} textAnchor="middle" dominantBaseline="middle"
              fill="var(--color-text)" fontSize={Math.round(size * 0.13)} fontWeight="700">
              {centerValue}
            </text>
          )}
          {centerLabel && (
            <text x={cx} y={cy + 16} textAnchor="middle" dominantBaseline="middle"
              fill="var(--color-text-muted)" fontSize={Math.round(size * 0.07)}>
              {centerLabel}
            </text>
          )}
        </g>
      )}
    </svg>
  );
}

export function BarChart({ data, height = 220, format = (v) => String(v) }) {
  const max = Math.max(1, ...data.map((d) => Math.max(Math.abs(d.income || 0), Math.abs(d.expense || 0), Math.abs(d.value || 0))));
  const w = 100;
  const padX = 6;
  const usableW = w - 2 * padX;
  const barAreaW = usableW / data.length;
  const isDual = data.some((d) => 'income' in d || 'expense' in d);

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${w} 100`} preserveAspectRatio="none" width="100%" height={height} style={{ display: 'block' }}>
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <line key={p} x1={padX} x2={w - padX} y1={5 + 90 * (1 - p)} y2={5 + 90 * (1 - p)}
            stroke="var(--color-border)" strokeWidth="0.2" vectorEffect="non-scaling-stroke" />
        ))}
        {data.map((d, i) => {
          const x = padX + i * barAreaW;
          if (isDual) {
            const inc = Math.max(0, d.income || 0);
            const exp = Math.max(0, d.expense || 0);
            const ih = (inc / max) * 90;
            const eh = (exp / max) * 90;
            const bw = barAreaW * 0.35;
            return (
              <g key={i}>
                <rect x={x + barAreaW * 0.1} y={5 + (90 - ih)} width={bw} height={ih} fill="#059669" rx="0.5" />
                <rect x={x + barAreaW * 0.1 + bw + 1} y={5 + (90 - eh)} width={bw} height={eh} fill="#dc2626" rx="0.5" />
              </g>
            );
          }
          const v = Math.max(0, d.value || 0);
          const h = (v / max) * 90;
          return <rect key={i} x={x + barAreaW * 0.15} y={5 + (90 - h)} width={barAreaW * 0.7} height={h} fill={d.color || 'var(--color-accent)'} rx="0.5" />;
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.7rem', color: 'var(--color-text-subtle)' }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function LineChart({ series, height = 220, format = (v) => String(v) }) {
  const allPoints = series.flatMap((s) => s.points);
  if (allPoints.length === 0) return null;
  const max = Math.max(...allPoints.map((p) => p.y));
  const min = Math.min(0, ...allPoints.map((p) => p.y));
  const range = Math.max(1, max - min);
  const w = 100, h = 100;
  const padL = 4, padR = 2, padT = 4, padB = 8;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const labels = series[0]?.points.map((p) => p.label) ?? [];
  const xStep = labels.length > 1 ? innerW / (labels.length - 1) : innerW;

  const yPos = (v) => padT + innerH * (1 - (v - min) / range);
  const xPos = (i) => padL + i * xStep;

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" width="100%" height={height} style={{ display: 'block' }}>
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <line key={p} x1={padL} x2={w - padR} y1={padT + innerH * (1 - p)} y2={padT + innerH * (1 - p)}
            stroke="var(--color-border)" strokeWidth="0.2" vectorEffect="non-scaling-stroke" />
        ))}
        {series.map((s, si) => {
          const path = s.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i)} ${yPos(p.y)}`).join(' ');
          return (
            <g key={si}>
              {s.fill && (
                <path
                  d={`${path} L ${xPos(s.points.length - 1)} ${yPos(0)} L ${xPos(0)} ${yPos(0)} Z`}
                  fill={s.color}
                  opacity="0.12"
                />
              )}
              <path d={path} fill="none" stroke={s.color || 'var(--color-accent)'} strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
              {s.points.map((p, i) => (
                <circle key={i} cx={xPos(i)} cy={yPos(p.y)} r="0.7" fill={s.color || 'var(--color-accent)'} />
              ))}
            </g>
          );
        })}
      </svg>
      {labels.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.7rem', color: 'var(--color-text-subtle)' }}>
          {labels.map((l, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>{l}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProgressBar({ value, max, color = 'var(--color-accent)', height = 8 }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <div style={{
      width: '100%', height, background: 'var(--color-border)', borderRadius: height,
      overflow: 'hidden',
    }}>
      <div style={{
        width: `${pct * 100}%`, height: '100%',
        background: color,
        transition: 'width 0.3s ease',
      }} />
    </div>
  );
}

export function StackedBar({ segments, height = 14 }) {
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0);
  return (
    <div style={{
      display: 'flex', width: '100%', height, borderRadius: height,
      overflow: 'hidden', background: 'var(--color-border)',
    }}>
      {total > 0 && segments.map((s, i) => {
        const pct = (Math.max(0, s.value) / total) * 100;
        if (pct === 0) return null;
        return (
          <div key={i} title={s.label}
            style={{ width: `${pct}%`, background: s.color, transition: 'width 0.3s ease' }}
          />
        );
      })}
    </div>
  );
}

/**
 * Sankey-style flow chart: incomes -> total -> expense categories.
 * Custom minimal renderer (single hub).
 */
export function FlowChart({ incomes, expenses, height = 360 }) {
  const totalIn = incomes.reduce((s, d) => s + Math.max(0, d.value), 0);
  const totalOut = expenses.reduce((s, d) => s + Math.max(0, d.value), 0);
  const total = Math.max(totalIn, totalOut, 1);
  const w = 100;
  const hubW = 8;
  const hubX = (w - hubW) / 2;

  let leftAcc = 0;
  let rightAcc = 0;
  const incomeNodes = incomes.map((d) => {
    const h = (Math.max(0, d.value) / total) * 100;
    const node = { ...d, h, y: leftAcc };
    leftAcc += h + 1.5;
    return node;
  });
  const expenseNodes = expenses.map((d) => {
    const h = (Math.max(0, d.value) / total) * 100;
    const node = { ...d, h, y: rightAcc };
    rightAcc += h + 1.5;
    return node;
  });

  const incTotalH = incomeNodes.reduce((s, n) => s + n.h, 0) + Math.max(0, incomeNodes.length - 1) * 1.5;
  const expTotalH = expenseNodes.reduce((s, n) => s + n.h, 0) + Math.max(0, expenseNodes.length - 1) * 1.5;

  let hubInY = 0;
  let hubOutY = 0;

  return (
    <svg viewBox={`0 0 ${w} 100`} preserveAspectRatio="none" width="100%" height={height} style={{ display: 'block' }}>
      <rect x={hubX} y={0} width={hubW} height={100} fill="var(--color-accent)" opacity="0.7" rx="0.5" />
      {incomeNodes.map((n, i) => {
        const sourceX = 0;
        const sourceY = n.y + n.h / 2;
        const targetX = hubX;
        const targetY = hubInY + n.h / 2;
        hubInY += n.h;
        const path = `M ${sourceX} ${sourceY} C ${(sourceX + targetX) / 2} ${sourceY}, ${(sourceX + targetX) / 2} ${targetY}, ${targetX} ${targetY}`;
        return (
          <g key={`in-${i}`}>
            <rect x={0} y={n.y} width={2} height={n.h} fill={n.color} rx="0.3" />
            <path d={path} stroke={n.color} strokeWidth={n.h} fill="none" opacity="0.45"
              vectorEffect="non-scaling-stroke" style={{ strokeWidth: `${n.h}px`, strokeLinecap: 'butt' }} />
          </g>
        );
      })}
      {expenseNodes.map((n, i) => {
        const sourceX = hubX + hubW;
        const sourceY = hubOutY + n.h / 2;
        hubOutY += n.h;
        const targetX = w;
        const targetY = n.y + n.h / 2;
        const path = `M ${sourceX} ${sourceY} C ${(sourceX + targetX) / 2} ${sourceY}, ${(sourceX + targetX) / 2} ${targetY}, ${targetX} ${targetY}`;
        return (
          <g key={`out-${i}`}>
            <rect x={w - 2} y={n.y} width={2} height={n.h} fill={n.color} rx="0.3" />
            <path d={path} stroke={n.color} strokeWidth={n.h} fill="none" opacity="0.45"
              vectorEffect="non-scaling-stroke" style={{ strokeWidth: `${n.h}px`, strokeLinecap: 'butt' }} />
          </g>
        );
      })}
    </svg>
  );
}
