// Spec 002 CA-07: as telas de negócio ainda não existem (specs 003–007).
export function UnderConstruction({ title }: { title: string }) {
  return (
    <main style={{ padding: '36px 40px 64px', display: 'grid', gap: 8 }}>
      <h1 style={{ fontSize: 30 }}>{title}</h1>
      <p style={{ fontSize: 14, color: 'var(--color-text-55)' }}>Em construção.</p>
    </main>
  );
}
