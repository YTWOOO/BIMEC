/** Data local no formato AAAA-MM-DD. */
export function diaLocal(data: Date = new Date()): string {
  const a = data.getFullYear();
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const d = String(data.getDate()).padStart(2, '0');
  return `${a}-${m}-${d}`;
}

/** Soma minutos a um horário "HH:MM", dando a volta no dia. */
export function somarMinutos(horario: string, minutos: number): string {
  const [h, m] = horario.split(':').map(Number);
  const total = (((h * 60 + m + minutos) % 1440) + 1440) % 1440;
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}
