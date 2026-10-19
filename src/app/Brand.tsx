// Marca (layout.md §2/§4): EMPREST peso 700 + .AI no acento.
export function Brand({ size = 15 }: { size?: number }) {
  return (
    <span className="nav-brand" style={{ fontSize: size }}>
      <span className="brand-mark" aria-hidden />
      <span>
        EMPREST<span style={{ color: 'var(--color-accent)' }}>.AI</span>
      </span>
    </span>
  );
}
