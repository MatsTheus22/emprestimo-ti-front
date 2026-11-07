// Spec 003: o banco guarda só o caminho no bucket, e quem exibe monta a URL pública
// com o Supabase do ambiente.
const BUCKET = 'equipamentos';

let baseUrl: string | null = null;

export function configureImages({ supabaseUrl }: { supabaseUrl: string }): void {
  baseUrl = supabaseUrl.replace(/\/$/, '');
}

export function equipmentImageUrl(imagePath: string): string {
  if (!baseUrl) throw new Error('configureImages() não foi chamado');
  return `${baseUrl}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(imagePath)}`;
}
