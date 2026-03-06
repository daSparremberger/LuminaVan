import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { PageTransition } from '../components/ui/PageTransition';
import { api } from '../lib/api';
import type { RotaHistorico } from '@rotavans/shared';

export function Historico() {
  const [historico, setHistorico] = useState<RotaHistorico[]>([]);

  useEffect(() => {
    api.get<RotaHistorico[]>('/execucao/historico').then(setHistorico).catch(() => {});
  }, []);

  function formatDate(d?: string) {
    if (!d) return '-';
    return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }

  return (
    <PageTransition>
    <div>
      <PageHeader title="Historico" subtitle="Ultimas execucoes de rotas" />

      {historico.length === 0 ? <EmptyState icon={History} message="Nenhum historico de execucao" /> : (
        <div className="border border-border/30 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface2 text-left text-sm text-text-muted">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Rota</th>
                <th className="px-4 py-3">Motorista</th>
                <th className="px-4 py-3">Embarcados</th>
                <th className="px-4 py-3">Pulados</th>
                <th className="px-4 py-3">KM</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {historico.map((h) => (
                <tr key={h.id} className="border-t border-border/30 hover:bg-surface2">
                  <td className="px-4 py-3 text-text">{formatDate(h.data_inicio)}</td>
                  <td className="px-4 py-3 text-text-muted">{h.rota_nome || '-'}</td>
                  <td className="px-4 py-3 text-text-muted">{h.motorista_nome || '-'}</td>
                  <td className="px-4 py-3 text-accent2">{h.alunos_embarcados}</td>
                  <td className="px-4 py-3 text-warn">{h.alunos_pulados}</td>
                  <td className="px-4 py-3 text-text-muted">{h.km_total?.toFixed(1) || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </PageTransition>
  );
}
