import React, { useRef, useState } from 'react';
import { Download, Upload, RotateCcw, ShieldCheck } from 'lucide-react';
import * as backup from '../services/backup';

const fmtDataHora = (iso: string | null | undefined) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};

export const BackupSection: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [pendente, setPendente] = useState<{ arquivo: backup.ArquivoBackup; resumo: backup.ResumoBackup } | null>(null);
  const [ultimo, setUltimo] = useState<string | null>(() => backup.getUltimoBackup());
  const [copiaAnterior, setCopiaAnterior] = useState<string | null>(() => backup.copiaAntesDaRestauracao());

  const recarregarDepois = () => {
    setTimeout(() => window.location.reload(), 1500);
  };

  const fazerBackup = () => {
    setMensagem(null);
    try {
      const arquivo = backup.criarBackup();
      const resultado = backup.entregarBackup(arquivo, backup.nomeArquivoBackup());
      if (resultado === 'android') {
        backup.registrarUltimoBackup();
        setUltimo(backup.getUltimoBackup());
        setMensagem({
          tipo: 'ok',
          texto:
            'Backup salvo em Downloads/Schmitt Detailer. No menu que abriu, envie também para o Google Drive ou para você mesmo, para ter uma cópia fora do celular.',
        });
      } else if (resultado === 'download') {
        backup.registrarUltimoBackup();
        setUltimo(backup.getUltimoBackup());
        setMensagem({ tipo: 'ok', texto: 'Backup gerado e baixado. Guarde o arquivo em um lugar seguro.' });
      } else if (resultado === 'atualizar') {
        setMensagem({ tipo: 'erro', texto: 'Esta versão do app ainda não salva backup. Instale a versão mais recente.' });
      } else {
        setMensagem({ tipo: 'erro', texto: 'Não foi possível salvar o backup neste aparelho. Tente novamente.' });
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro ao montar o backup. Tente novamente.' });
    }
  };

  const escolherArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!arquivo) return;
    setMensagem(null);
    setPendente(null);

    const leitor = new FileReader();
    leitor.onerror = () => setMensagem({ tipo: 'erro', texto: 'Não foi possível ler o arquivo escolhido.' });
    leitor.onload = () => {
      const leitura = backup.lerBackup(String(leitor.result || ''));
      if (leitura.ok) setPendente({ arquivo: leitura.backup, resumo: leitura.resumo });
      else setMensagem({ tipo: 'erro', texto: leitura.erro });
    };
    leitor.readAsText(arquivo);
  };

  const confirmarRestauracao = () => {
    if (!pendente) return;
    const resultado = backup.restaurarBackup(pendente.arquivo);
    if (resultado.ok) {
      setPendente(null);
      setMensagem({ tipo: 'ok', texto: 'Backup restaurado com sucesso. O app vai reiniciar...' });
      recarregarDepois();
    } else {
      setMensagem({ tipo: 'erro', texto: resultado.erro });
    }
  };

  const desfazer = () => {
    const resultado = backup.desfazerRestauracao();
    if (resultado.ok) {
      setCopiaAnterior(null);
      setMensagem({ tipo: 'ok', texto: 'Restauração desfeita. O app vai reiniciar...' });
      recarregarDepois();
    } else {
      setMensagem({ tipo: 'erro', texto: resultado.erro });
    }
  };

  return (
    <div className="p-3.5 rounded-xl bg-[#111113] border border-zinc-800 space-y-3">
      <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
        <ShieldCheck size={13} className="text-[#E50914]" />
        Backup dos dados
      </h3>
      <p className="text-[11px] text-zinc-400 leading-relaxed">
        Os dados ficam só neste aparelho. Se o celular for perdido, danificado ou o app for removido, eles somem. Faça
        backup com frequência e guarde o arquivo no Google Drive.
      </p>
      <p className="text-[11px] text-zinc-500">
        {ultimo ? `Último backup: ${fmtDataHora(ultimo)}` : 'Você ainda não fez nenhum backup neste aparelho.'}
      </p>

      <button
        onClick={fazerBackup}
        className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#E50914] to-[#B3060F] text-white hover:brightness-110 transition flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <Download size={14} />
        Fazer backup agora
      </button>

      <button
        onClick={() => inputRef.current?.click()}
        className="w-full py-2.5 rounded-xl text-xs font-bold bg-[#1C1C22] text-zinc-200 hover:bg-[#25252e] transition flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <Upload size={14} />
        Restaurar de um arquivo
      </button>
      <input ref={inputRef} type="file" accept="*/*" className="hidden" onChange={escolherArquivo} />

      {pendente && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
          <div className="text-xs font-bold text-amber-300">Restaurar este backup?</div>
          <div className="text-[11px] text-zinc-300 leading-relaxed">
            Feito em {fmtDataHora(pendente.resumo.criadoEm) || 'data desconhecida'}:
            <br />
            {pendente.resumo.clientes} clientes • {pendente.resumo.agendamentos} agendamentos •{' '}
            {pendente.resumo.servicos} serviços • {pendente.resumo.produtos} produtos
          </div>
          <div className="text-[11px] text-amber-200 leading-relaxed">
            Isso substitui todos os dados atuais deste aparelho. Uma cópia dos dados atuais fica guardada para você
            poder desfazer.
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPendente(null)}
              className="py-2 rounded-xl text-xs font-bold bg-[#1C1C22] text-zinc-300 hover:bg-[#25252e] transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={confirmarRestauracao}
              className="py-2 rounded-xl text-xs font-bold bg-amber-500 text-black hover:brightness-110 transition cursor-pointer"
            >
              Restaurar
            </button>
          </div>
        </div>
      )}

      {copiaAnterior && !pendente && (
        <button
          onClick={desfazer}
          className="w-full py-2 rounded-xl text-[11px] font-bold bg-[#1C1C22] text-zinc-300 hover:bg-[#25252e] transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RotateCcw size={12} />
          Desfazer última restauração (dados de {fmtDataHora(copiaAnterior)})
        </button>
      )}

      {mensagem && (
        <div
          className={
            'text-[11px] rounded-xl p-3 border leading-relaxed ' +
            (mensagem.tipo === 'ok'
              ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
              : 'text-amber-300 bg-amber-500/10 border-amber-500/30')
          }
        >
          {mensagem.texto}
        </div>
      )}

      <p className="text-[10px] text-zinc-500 leading-relaxed">
        O arquivo de backup contém dados pessoais dos clientes. Guarde-o em local seguro e não o compartilhe com quem não
        deve ter acesso. O login do Google não entra no backup.
      </p>
    </div>
  );
};
