import React, { useState, useEffect } from 'react';
import { X, Package, DollarSign, Scale } from 'lucide-react';
import { Produto, UnidadeMedida } from '../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  produtoParaEditar?: Produto | null;
  onSave: (produto: Omit<Produto, 'id' | 'custoUnitario'> | Produto) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  produtoParaEditar,
  onSave,
}) => {
  const [nome, setNome] = useState('');
  const [unidade, setUnidade] = useState<UnidadeMedida>('ml');
  const [precoPago, setPrecoPago] = useState<string>('');
  const [quantidadeEmbalagem, setQuantidadeEmbalagem] = useState<string>('');
  const [ativo, setAtivo] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (produtoParaEditar) {
      setNome(produtoParaEditar.nome);
      setUnidade(produtoParaEditar.unidade);
      setPrecoPago(produtoParaEditar.precoPago.toString());
      setQuantidadeEmbalagem(produtoParaEditar.quantidadeEmbalagem.toString());
      setAtivo(produtoParaEditar.ativo);
    } else {
      setNome('');
      setUnidade('ml');
      setPrecoPago('');
      setQuantidadeEmbalagem('');
      setAtivo(true);
    }
    setErro(null);
  }, [produtoParaEditar, isOpen]);

  if (!isOpen) return null;

  const precoNum = parseFloat(precoPago) || 0;
  const qtdNum = parseFloat(quantidadeEmbalagem) || 0;
  const custoUnitario = qtdNum > 0 ? precoNum / qtdNum : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErro('Por favor, informe o nome do produto.');
      return;
    }
    if (precoNum <= 0) {
      setErro('O preço pago pela embalagem deve ser maior que zero.');
      return;
    }
    if (qtdNum <= 0) {
      setErro('A quantidade da embalagem deve ser maior que zero.');
      return;
    }

    if (produtoParaEditar) {
      onSave({
        ...produtoParaEditar,
        nome: nome.trim(),
        unidade,
        precoPago: precoNum,
        quantidadeEmbalagem: qtdNum,
        ativo,
      });
    } else {
      onSave({
        nome: nome.trim(),
        unidade,
        precoPago: precoNum,
        quantidadeEmbalagem: qtdNum,
        ativo,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121214] border border-[#27272A] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#27272A] bg-[#18181B]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#E50914]/10 rounded-xl text-[#E50914] border border-[#E50914]/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {produtoParaEditar ? 'Editar Produto / Insumo' : 'Novo Produto / Insumo'}
              </h2>
              <p className="text-xs text-zinc-400">Controle de custos por dose para estética</p>
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
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
              {erro}
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Nome do Produto / Insumo *
            </label>
            <input
              type="text"
              placeholder="Ex: Shampoo Neutro V-Floc, Selante SiO2..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-[#1C1C1F] border border-[#2E2E33] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50914] transition"
              required
            />
          </div>

          {/* Unidade de Medida */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-[#E50914]" />
              Unidade de Medida *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'ml', label: 'Mililitros (ml)', desc: 'Líquidos' },
                  { id: 'g', label: 'Gramas (g)', desc: 'Pastas/Ceras' },
                  { id: 'unidade', label: 'Unidade (un)', desc: 'Panos/Boinas' },
                ] as const
              ).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setUnidade(u.id)}
                  className={`py-2 px-2.5 rounded-xl border text-left transition cursor-pointer ${
                    unidade === u.id
                      ? 'border-[#E50914] bg-[#E50914]/10 text-white'
                      : 'border-[#2E2E33] bg-[#1A1A1D] text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  <p className="text-xs font-bold">{u.id.toUpperCase()}</p>
                  <p className="text-[10px] text-zinc-400">{u.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Preço e Quantidade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Preço Pago (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Ex: 85.00"
                value={precoPago}
                onChange={(e) => setPrecoPago(e.target.value)}
                className="w-full bg-[#1C1C1F] border border-[#2E2E33] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50914] transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Qtd. Embalagem ({unidade}) *
              </label>
              <input
                type="number"
                step="any"
                min="0.001"
                placeholder={unidade === 'ml' ? 'Ex: 3000' : unidade === 'g' ? 'Ex: 500' : 'Ex: 1'}
                value={quantidadeEmbalagem}
                onChange={(e) => setQuantidadeEmbalagem(e.target.value)}
                className="w-full bg-[#1C1C1F] border border-[#2E2E33] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50914] transition"
                required
              />
            </div>
          </div>

          {/* Custo Unitário Calculado Automaticamente */}
          <div className="p-3.5 bg-[#18181C] border border-[#27272A] rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold block">
                Custo Calculado por Dose
              </span>
              <span className="text-xs text-zinc-500">
                {precoNum > 0 && qtdNum > 0
                  ? `R$ ${precoNum.toFixed(2)} / ${qtdNum} ${unidade}`
                  : 'Preencha os valores acima'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-base font-bold text-emerald-400 font-mono">
                R$ {custoUnitario.toFixed(4)}
              </span>
              <span className="text-[11px] text-zinc-400 block">/ {unidade}</span>
            </div>
          </div>

          {/* Ativo toggle */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-medium text-zinc-300">Produto Ativo no Estoque</span>
            <button
              type="button"
              onClick={() => setAtivo(!ativo)}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition ${
                ativo ? 'bg-[#E50914] justify-end' : 'bg-zinc-700 justify-start'
              }`}
            >
              <div className="bg-white w-4 h-4 rounded-full shadow-md" />
            </button>
          </div>

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
              {produtoParaEditar ? 'Salvar Alterações' : 'Cadastrar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
