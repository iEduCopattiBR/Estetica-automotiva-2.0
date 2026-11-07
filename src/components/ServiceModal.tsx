import React, { useState, useEffect } from 'react';
import { X, Wrench, DollarSign, Clock, Plus, Trash2, TrendingUp, AlertCircle } from 'lucide-react';
import { TipoServico, Produto, ComboProdutoItem } from '../types';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  servicoParaEditar?: TipoServico | null;
  produtosDisponiveis: Produto[];
  onSave: (servico: Omit<TipoServico, 'id'> | TipoServico) => void;
  onDelete?: (servicoId: string) => void;
  onOpenNovoProduto?: () => void;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  servicoParaEditar,
  produtosDisponiveis,
  onSave,
  onDelete,
  onOpenNovoProduto,
}) => {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [precoPadrao, setPrecoPadrao] = useState<string>('');
  const [duracaoMinutos, setDuracaoMinutos] = useState<string>('120');
  const [itensCombo, setItensCombo] = useState<ComboProdutoItem[]>([]);
  const [ativo, setAtivo] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  useEffect(() => {
    if (servicoParaEditar) {
      setNome(servicoParaEditar.nome);
      setDescricao(servicoParaEditar.descricao || '');
      setPrecoPadrao(servicoParaEditar.precoPadrao.toString());
      setDuracaoMinutos((servicoParaEditar.duracaoMinutos || 120).toString());
      setItensCombo(servicoParaEditar.produtos ? [...servicoParaEditar.produtos] : []);
      setAtivo(servicoParaEditar.ativo);
    } else {
      setNome('');
      setDescricao('');
      setPrecoPadrao('');
      setDuracaoMinutos('120');
      // If products exist, pre-select the first product for convenience
      setItensCombo(produtosDisponiveis.length > 0 ? [{ produtoId: produtosDisponiveis[0].id, quantidadeUtilizada: 50 }] : []);
      setAtivo(true);
    }
    setErro(null);
    setConfirmarExclusao(false);
  }, [servicoParaEditar, isOpen, produtosDisponiveis]);

  if (!isOpen) return null;

  const precoNum = parseFloat(precoPadrao) || 0;
  const duracaoNum = parseInt(duracaoMinutos, 10) || 60;

  // Mapa de produtos para lookup rápido de preços e unidades
  const prodMap = new Map(produtosDisponiveis.map((p) => [p.id, p]));

  // Cálculo ao vivo dos custos dos insumos neste combo
  let custoTotalInsumos = 0;
  const itensCalculados = itensCombo.map((item) => {
    const prod = prodMap.get(item.produtoId);
    const custoUnitario = prod ? prod.custoUnitario : 0;
    const custoItem = custoUnitario * item.quantidadeUtilizada;
    custoTotalInsumos += custoItem;
    return {
      ...item,
      produto: prod,
      custoItem,
    };
  });

  const margemLucro = precoNum - custoTotalInsumos;
  const margemLucroPct = precoNum > 0 ? (margemLucro / precoNum) * 100 : 0;

  const handleAdicionarItemCombo = () => {
    // Escolhe o primeiro produto que ainda não esteja na lista, ou o primeiro disponível
    const idsUsados = new Set(itensCombo.map((i) => i.produtoId));
    const disponivel = produtosDisponiveis.find((p) => !idsUsados.has(p.id)) || produtosDisponiveis[0];

    if (!disponivel) {
      setErro('Nenhum produto cadastrado no estoque. Cadastre um produto primeiro.');
      return;
    }

    const defaultQtd = disponivel.unidade === 'unidade' ? 1 : disponivel.unidade === 'g' ? 25 : 50;
    setItensCombo([...itensCombo, { produtoId: disponivel.id, quantidadeUtilizada: defaultQtd }]);
  };

  const handleRemoverItemCombo = (index: number) => {
    const novaLista = [...itensCombo];
    novaLista.splice(index, 1);
    setItensCombo(novaLista);
  };

  const handleAtualizarItemCombo = (index: number, campo: 'produtoId' | 'quantidadeUtilizada', valor: any) => {
    const novaLista = [...itensCombo];
    novaLista[index] = {
      ...novaLista[index],
      [campo]: valor,
    };
    setItensCombo(novaLista);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErro('Informe o nome do serviço.');
      return;
    }
    if (precoNum <= 0) {
      setErro('O valor cobrado pelo serviço deve ser maior que zero.');
      return;
    }

    // Filtrar itens válidos
    const produtosFiltrados = itensCombo.filter((i) => i.produtoId && i.quantidadeUtilizada > 0);

    if (servicoParaEditar) {
      onSave({
        ...servicoParaEditar,
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        precoPadrao: precoNum,
        duracaoMinutos: duracaoNum,
        produtos: produtosFiltrados,
        ativo,
      });
    } else {
      onSave({
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        precoPadrao: precoNum,
        duracaoMinutos: duracaoNum,
        produtos: produtosFiltrados,
        ativo,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121214] border border-[#27272A] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#27272A] bg-[#18181B]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#E50914]/10 rounded-xl text-[#E50914] border border-[#E50914]/20">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {servicoParaEditar ? 'Editar Serviço / Combo' : 'Novo Serviço / Combo'}
              </h2>
              <p className="text-xs text-zinc-400">Defina o valor cobrado e produtos utilizados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          {erro && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {/* Nome do Serviço */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Nome do Serviço *
            </label>
            <input
              type="text"
              placeholder="Ex: Lavagem Detalhada, Polimento Comercial, Vitrificação 9H..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-[#1C1C1F] border border-[#2E2E33] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50914] transition"
              required
            />
          </div>

          {/* Preço e Duração */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Valor Cobrado (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Ex: 250.00"
                value={precoPadrao}
                onChange={(e) => setPrecoPadrao(e.target.value)}
                className="w-full bg-[#1C1C1F] border border-[#2E2E33] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50914] transition font-semibold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                Duração Estimada (min)
              </label>
              <input
                type="number"
                step="15"
                min="15"
                placeholder="Ex: 120"
                value={duracaoMinutos}
                onChange={(e) => setDuracaoMinutos(e.target.value)}
                className="w-full bg-[#1C1C1F] border border-[#2E2E33] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50914] transition"
              />
            </div>
          </div>

          {/* Descrição Técnica */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Descrição do Serviço / O que está incluso
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Descontaminação de pintura, aplicação de cera carnaúba, limpeza de caixas de roda..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full bg-[#1C1C1F] border border-[#2E2E33] rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50914] transition resize-none"
            />
          </div>

          {/* Seção de Produtos Utilizados no Combo */}
          <div className="pt-2 border-t border-[#27272A]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#E50914]" />
                  Produtos & Insumos Utilizados no Combo
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Dose de cada produto consumida na execução deste serviço
                </p>
              </div>
              <button
                type="button"
                onClick={handleAdicionarItemCombo}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#E50914]/10 hover:bg-[#E50914]/20 border border-[#E50914]/30 rounded-lg text-xs font-bold text-[#E50914] transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Produto</span>
              </button>
            </div>

            {produtosDisponiveis.length === 0 ? (
              <div className="p-4 bg-[#18181C] border border-dashed border-zinc-700 rounded-xl text-center">
                <p className="text-xs text-zinc-400 mb-2">Nenhum produto cadastrado no estoque ainda.</p>
                {onOpenNovoProduto && (
                  <button
                    type="button"
                    onClick={onOpenNovoProduto}
                    className="text-xs text-[#E50914] hover:underline font-semibold"
                  >
                    + Cadastrar primeiro insumo
                  </button>
                )}
              </div>
            ) : itensCombo.length === 0 ? (
              <div className="p-3 bg-[#18181C] border border-[#27272A] rounded-xl text-center">
                <p className="text-xs text-zinc-400">
                  Nenhum produto adicionado a este serviço ainda.
                </p>
                <button
                  type="button"
                  onClick={handleAdicionarItemCombo}
                  className="mt-1 text-xs text-[#E50914] hover:underline font-medium"
                >
                  Clique aqui para selecionar os produtos usados
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {itensCalculados.map((item, idx) => {
                  const unidadeProd = item.produto?.unidade || 'ml';
                  return (
                    <div
                      key={idx}
                      className="p-2.5 bg-[#18181C] border border-[#27272A] rounded-xl flex items-center gap-2"
                    >
                      {/* Seleção do Produto */}
                      <div className="flex-1 min-w-0">
                        <select
                          value={item.produtoId}
                          onChange={(e) => handleAtualizarItemCombo(idx, 'produtoId', e.target.value)}
                          className="w-full bg-[#121214] border border-[#2E2E33] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#E50914] transition"
                        >
                          {produtosDisponiveis.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nome} ({p.unidade})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantidade Utilizada */}
                      <div className="w-24 shrink-0 flex items-center gap-1">
                        <input
                          type="number"
                          step="any"
                          min="0.1"
                          value={item.quantidadeUtilizada}
                          onChange={(e) =>
                            handleAtualizarItemCombo(
                              idx,
                              'quantidadeUtilizada',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full bg-[#121214] border border-[#2E2E33] rounded-lg px-2 py-1.5 text-xs text-white text-right focus:outline-none focus:border-[#E50914] transition"
                        />
                        <span className="text-[11px] text-zinc-400 font-mono shrink-0">
                          {unidadeProd}
                        </span>
                      </div>

                      {/* Custo calculado deste item */}
                      <div className="w-20 text-right shrink-0">
                        <span className="text-xs font-semibold text-zinc-300 font-mono block">
                          R$ {item.custoItem.toFixed(2)}
                        </span>
                      </div>

                      {/* Remover Item */}
                      <button
                        type="button"
                        onClick={() => handleRemoverItemCombo(idx)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition shrink-0"
                        title="Remover produto do combo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resumo Financeiro do Serviço / Margem de Lucro */}
          <div className="p-3.5 bg-gradient-to-r from-[#18181C] to-[#1F1416] border border-[#E50914]/20 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Valor Cobrado:</span>
              <span className="font-bold text-white font-mono">
                R$ {precoNum.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Custo Total dos Insumos:</span>
              <span className="font-semibold text-red-400 font-mono">
                - R$ {custoTotalInsumos.toFixed(2)}
              </span>
            </div>
            <div className="h-px bg-zinc-800 my-1" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Lucro Bruto Estimado:</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  R$ {margemLucro.toFixed(2)}
                </span>
                <span
                  className={`text-[11px] font-bold ml-1.5 px-1.5 py-0.5 rounded ${
                    margemLucroPct >= 70
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : margemLucroPct >= 40
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {margemLucroPct.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Confirmar Exclusão */}
          {servicoParaEditar && onDelete && (
            <div className="pt-2">
              {confirmarExclusao ? (
                <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl space-y-2">
                  <p className="text-xs text-red-300 font-medium">
                    Tem certeza de que deseja excluir este serviço? Esta ação não pode ser desfeita.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmarExclusao(false)}
                      className="flex-1 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-semibold hover:bg-zinc-700"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(servicoParaEditar.id);
                        onClose();
                      }}
                      className="flex-1 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 shadow-md"
                    >
                      Sim, Excluir Serviço
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmarExclusao(true)}
                  className="w-full py-2 bg-transparent hover:bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir este Serviço</span>
                </button>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-[#1C1C1F] hover:bg-zinc-800 border border-[#2E2E33] rounded-xl text-xs font-semibold text-zinc-300 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#E50914] hover:bg-red-700 rounded-xl text-xs font-bold text-white transition shadow-lg shadow-red-950/40"
            >
              {servicoParaEditar ? 'Salvar Alterações' : 'Criar Serviço'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
