import { useEffect } from 'react';

const DURACAO_MS = 2600;

// layout.md §5.6. A caixa externa centraliza: o `fadeUp` termina em `transform: none`,
// que apagaria um translateX(-50%) no próprio toast.
export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, DURACAO_MS);
    return () => clearTimeout(timer);
  }, [message, onDone]);

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 28,
        zIndex: 40,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        role="status"
        style={{
          padding: '12px 20px',
          borderRadius: 999,
          border: '1px solid var(--color-accent-700)',
          background: 'var(--color-accent-900)',
          color: 'var(--color-accent-200)',
          fontSize: 13.5,
          animation: 'fadeUp .2s ease both',
        }}
      >
        {message}
      </div>
    </div>
  );
}
