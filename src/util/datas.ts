/** Data local no formato AAAA-MM-DD. */
export function diaLocal(data: Date = new Date()): string {
  const a = data.getFullYear();
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const d = String(data.getDate()).padStart(2, '0');
  return `${a}-${m}-${d}`;
}

/** "2026-10-29" + 3 dias → "2026-11-01". */
export function somarDias(dia: string, dias: number): string {
  const [a, m, d] = dia.split('-').map(Number);
  return diaLocal(new Date(a, m - 1, d + dias));
}

/** Dias entre duas datas "AAAA-MM-DD" (b − a). */
export function diasEntre(a: string, b: string): number {
  const [a1, m1, d1] = a.split('-').map(Number);
  const [a2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86400000);
}

/** Hora local no formato HH:MM. */
export function formatarHora(data: Date): string {
  return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
}

/** Data e hora curtas: "29/10 às 13:00". */
export function formatarDataHora(data: Date): string {
  const d = String(data.getDate()).padStart(2, '0');
  const m = String(data.getMonth() + 1).padStart(2, '0');
  return `${d}/${m} às ${formatarHora(data)}`;
}

/** Soma minutos a um horário "HH:MM", dando a volta no dia. */
export function somarMinutos(horario: string, minutos: number): string {
  const [h, m] = horario.split(':').map(Number);
  const total = (((h * 60 + m + minutos) % 1440) + 1440) % 1440;
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}
