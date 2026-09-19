export interface ComplexityBadge {
  label: string;
  value: string;
}

/**
 * Pequena fileira de indicadores de complexidade sob o cabeçalho de cada
 * estrutura. É conteúdo, não decoração: ancora a página na análise
 * assintótica discutida no relatório técnico (Seção 4).
 */
export function ComplexityBadges({ items }: { items: ComplexityBadge[] }) {
  return (
    <div className="badge-row">
      {items.map((item) => (
        <span key={item.label} className="badge">
          {item.label} — <strong>{item.value}</strong>
        </span>
      ))}
    </div>
  );
}
