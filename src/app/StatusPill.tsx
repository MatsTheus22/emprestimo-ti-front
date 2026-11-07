export type StatusTone = 'ok' | 'warn' | 'error' | 'muted';

// layout.md §1 e §3: pill de situação, com a trinca de cor de cada estado.
export function StatusPill({ tone, children }: { tone: StatusTone; children: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 9px',
        borderRadius: 999,
        border: `1px solid var(--status-${tone}-bd)`,
        background: `var(--status-${tone}-bg)`,
        color: `var(--status-${tone}-fg)`,
        fontSize: 12,
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}
