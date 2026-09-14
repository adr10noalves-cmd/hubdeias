import React, { useState, useEffect } from 'react';
import { X, Save, Sparkles, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { IAItem, IACategory, IALevel, IADifficulty, IAPricing, CATEGORIES } from '../types';
import { categoryIcons } from '../utils/helpers';

interface IAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ia: Partial<IAItem> & { id?: number }) => void;
  editingIA: IAItem | null;
}

export const IAModal: React.FC<IAModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingIA,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<IACategory>(CATEGORIES[0]);
  const [level, setLevel] = useState<IALevel>('Alta Performance');
  const [difficulty, setDifficulty] = useState<IADifficulty>('Iniciante');
  const [pricing, setPricing] = useState<IAPricing>('Freemium (Grátis + Pago)');
  const [pricingDetails, setPricingDetails] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [differential, setDifferential] = useState('');
  const [whatIsIt, setWhatIsIt] = useState('');
  const [whatIsItFor, setWhatIsItFor] = useState('');
  const [bestTasksText, setBestTasksText] = useState('');
  const [beginnerTip, setBeginnerTip] = useState('');
  const [link, setLink] = useState('');
  const [scores, setScores] = useState({
    Geral: 4,
    Código: 3,
    Pesquisa: 3,
    Criação: 3,
    Automação: 3,
  });

  // Novos campos opcionais V2.2 para a Ficha Operacional
  const [paraQueServe, setParaQueServe] = useState('');
  const [quandoUsar, setQuandoUsar] = useState('');
  const [quandoNaoUsar, setQuandoNaoUsar] = useState('');
  const [melhorPara, setMelhorPara] = useState('');
  const [pontosFortes, setPontosFortes] = useState('');
  const [limitacoes, setLimitacoes] = useState('');
  const [exemploPrompt, setExemploPrompt] = useState('');
  const [observacaoEstrategica, setObservacaoEstrategica] = useState('');
  const [showFichaFields, setShowFichaFields] = useState(true);

  useEffect(() => {
    if (editingIA) {
      setName(editingIA.name);
      setCategory(editingIA.category);
      setLevel(editingIA.level);
      setDifficulty(editingIA.difficulty || 'Intermediário');
      setPricing(editingIA.pricing || 'Freemium (Grátis + Pago)');
      setPricingDetails(editingIA.pricingDetails || '');
      setSpecialty(editingIA.specialty);
      setDifferential(editingIA.differential);
      setWhatIsIt(editingIA.whatIsIt || '');
      setWhatIsItFor(editingIA.whatIsItFor || '');
      setBestTasksText(editingIA.bestTasks ? editingIA.bestTasks.join('\n') : '');
      setBeginnerTip(editingIA.beginnerTip || '');
      setLink(editingIA.link);
      setScores({
        Geral: editingIA.scores?.Geral ?? 4,
        Código: editingIA.scores?.Código ?? 3,
        Pesquisa: editingIA.scores?.Pesquisa ?? 3,
        Criação: editingIA.scores?.Criação ?? 3,
        Automação: editingIA.scores?.Automação ?? 3,
      });
      // V2.2
      setParaQueServe(editingIA.paraQueServe || '');
      setQuandoUsar(editingIA.quandoUsar || '');
      setQuandoNaoUsar(editingIA.quandoNaoUsar || '');
      setMelhorPara(editingIA.melhorPara || '');
      setPontosFortes(editingIA.pontosFortes || '');
      setLimitacoes(editingIA.limitacoes || '');
      setExemploPrompt(editingIA.exemploPrompt || '');
      setObservacaoEstrategica(editingIA.observacaoEstrategica || '');
    } else {
      setName('');
      setCategory(CATEGORIES[0]);
      setLevel('Alta Performance');
      setDifficulty('Iniciante');
      setPricing('Freemium (Grátis + Pago)');
      setPricingDetails('Versão gratuita disponível com limites diários.');
      setSpecialty('');
      setDifferential('');
      setWhatIsIt('');
      setWhatIsItFor('');
      setBestTasksText('');
      setBeginnerTip('');
      setLink('https://');
      setScores({
        Geral: 4,
        Código: 3,
        Pesquisa: 3,
        Criação: 3,
        Automação: 3,
      });
      // V2.2
      setParaQueServe('');
      setQuandoUsar('');
      setQuandoNaoUsar('');
      setMelhorPara('');
      setPontosFortes('');
      setLimitacoes('');
      setExemploPrompt('');
      setObservacaoEstrategica('');
    }
  }, [editingIA, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !specialty.trim() || !differential.trim() || !link.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios marcados com (*).');
      return;
    }

    const bestTasks = bestTasksText
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);

    onSave({
      id: editingIA ? editingIA.id : undefined,
      name: name.trim(),
      category,
      level,
      difficulty,
      pricing,
      pricingDetails: pricingDetails.trim() || undefined,
      specialty: specialty.trim(),
      differential: differential.trim(),
      whatIsIt: whatIsIt.trim() || undefined,
      whatIsItFor: whatIsItFor.trim() || undefined,
      bestTasks: bestTasks.length > 0 ? bestTasks : undefined,
      beginnerTip: beginnerTip.trim() || undefined,
      link: link.trim(),
      scores,
      // Novos campos V2.2 para Ficha Operacional (opcionais)
      paraQueServe: paraQueServe.trim() || undefined,
      quandoUsar: quandoUsar.trim() || undefined,
      quandoNaoUsar: quandoNaoUsar.trim() || undefined,
      melhorPara: melhorPara.trim() || undefined,
      pontosFortes: pontosFortes.trim() || undefined,
      limitacoes: limitacoes.trim() || undefined,
      exemploPrompt: exemploPrompt.trim() || undefined,
      observacaoEstrategica: observacaoEstrategica.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#0d1528] border border-cyan-500/40 rounded-3xl p-5 sm:p-7 shadow-[0_25px_80px_rgba(0,0,0,0.8)] my-6 max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20 shrink-0">
          <div>
            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>drico IAS • Catálogo V2.0</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-display">
              {editingIA ? `✏️ Editar IA: ${editingIA.name}` : '＋ Cadastrar Nova IA'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto py-4 space-y-4 pr-1 text-xs sm:text-sm">
          {/* Linha 1: Nome e Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Nome da Ferramenta *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Claude 3.7 Sonnet"
                className="w-full bg-[#040a18] border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Link Oficial (URL) *
              </label>
              <input
                type="url"
                required
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#040a18] border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-cyan-500/20"
              />
            </div>
          </div>

          {/* Linha 2: Categoria & Nível Técnico */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Categoria Principal *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IACategory)}
                className="w-full bg-[#040a18] border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {categoryIcons[cat]} {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Classificação Operacional
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as IALevel)}
                className="w-full bg-[#040a18] border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-white outline-none focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
              >
                <option value="Elite">Elite (Líder Absoluto)</option>
                <option value="Alta Performance">Alta Performance</option>
                <option value="Especializada">Especializada (Nicho)</option>
              </select>
            </div>
          </div>

          {/* Linha 3: Dificuldade & Modelo de Preço */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3 rounded-2xl bg-[#060c1c] border border-cyan-500/20">
            <div>
              <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                Nível de Dificuldade (Iniciantes)
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as IADifficulty)}
                className="w-full bg-[#040a18] border border-emerald-500/30 focus:border-emerald-400 rounded-xl px-3.5 py-2 text-white outline-none cursor-pointer"
              >
                <option value="Iniciante">🟢 Fácil (Iniciante - sem pré-requisitos)</option>
                <option value="Intermediário">🔵 Intermediário (Exige familiaridade)</option>
                <option value="Avançado">🟣 Avançado (Fluxos técnicos / prompts refinados)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-teal-400 uppercase tracking-wider mb-1">
                Modelo de Cobrança / Gratuidade
              </label>
              <select
                value={pricing}
                onChange={(e) => setPricing(e.target.value as IAPricing)}
                className="w-full bg-[#040a18] border border-teal-500/30 focus:border-teal-400 rounded-xl px-3.5 py-2 text-white outline-none cursor-pointer"
              >
                <option value="Gratuito">100% Gratuito</option>
                <option value="Freemium (Grátis + Pago)">Freemium (Grátis com limites + Plano Pago)</option>
                <option value="Pago com Teste Grátis">Pago com Teste / Créditos Grátis</option>
                <option value="Pago">Pago (Sem plano gratuito permanente)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Detalhes da Versão Gratuita & Limitações
              </label>
              <input
                type="text"
                value={pricingDetails}
                onChange={(e) => setPricingDetails(e.target.value)}
                placeholder="Ex: Grátis até 10 imagens por dia; plano Pro desbloqueia modo ultra-rápido."
                className="w-full bg-[#040a18] border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          {/* O que é & Para que serve */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                1. O que é esta IA?
              </label>
              <textarea
                rows={2}
                value={whatIsIt}
                onChange={(e) => setWhatIsIt(e.target.value)}
                placeholder="Ex: É um assistente conversacional inteligente desenvolvido pela Anthropic focado em escrita natural e raciocínio."
                className="w-full bg-[#040a18] border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                2. Para que serve?
              </label>
              <textarea
                rows={2}
                value={whatIsItFor}
                onChange={(e) => setWhatIsItFor(e.target.value)}
                placeholder="Ex: Serve para redigir redações, sintetizar documentos longos e tirar dúvidas com clareza."
                className="w-full bg-[#040a18] border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 outline-none resize-none"
              />
            </div>
          </div>

          {/* Melhores Tarefas & Dica para Iniciantes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                3. Melhores Tarefas (Uma por linha)
              </label>
              <textarea
                rows={2}
                value={bestTasksText}
                onChange={(e) => setBestTasksText(e.target.value)}
                placeholder="Ex:&#10;Escrever e-mails e relatórios&#10;Resumir PDFs de 50 páginas&#10;Explicar conceitos complexos de forma didática"
                className="w-full bg-[#040a18] border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                4. Dica Prática para Iniciantes
              </label>
              <textarea
                rows={2}
                value={beginnerTip}
                onChange={(e) => setBeginnerTip(e.target.value)}
                placeholder="Ex: Cole o seu texto e peça: 'Melhore a clareza e corrija a pontuação mantendo meu tom'."
                className="w-full bg-[#040a18] border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 outline-none resize-none"
              />
            </div>
          </div>

          {/* Especialidade & Diferencial */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Especialidade Principal *
              </label>
              <input
                type="text"
                required
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Ex: Raciocínio matemático e redação fluida"
                className="w-full bg-[#040a18] border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Diferencial Competitivo *
              </label>
              <input
                type="text"
                required
                value={differential}
                onChange={(e) => setDifferential(e.target.value)}
                placeholder="Ex: Janela de contexto de 200k tokens com altíssima fidelidade"
                className="w-full bg-[#040a18] border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          {/* SEÇÃO V2.2: CAMPOS DA FICHA OPERACIONAL (OPCIONAIS) */}
          <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-3.5">
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => setShowFichaFields(!showFichaFields)}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  📘 Campos da Ficha Operacional (V2.2 — Opcionais)
                </span>
              </div>
              <button
                type="button"
                className="text-xs text-cyan-400 hover:text-cyan-200 font-semibold flex items-center gap-1"
              >
                <span>{showFichaFields ? 'Ocultar' : 'Expandir'}</span>
                {showFichaFields ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-normal">
              Todos os campos abaixo são <strong>opcionais</strong>. Se deixados em branco, o Hub gera automaticamente uma <em>“Descrição estratégica baseada nos dados cadastrados”</em>.
            </p>

            {showFichaFields && (
              <div className="space-y-3 pt-1 border-t border-cyan-500/15">
                {/* paraQueServe */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    1. Para que serve (Qual problema resolve)
                  </label>
                  <textarea
                    rows={2}
                    value={paraQueServe}
                    onChange={(e) => setParaQueServe(e.target.value)}
                    placeholder="Ex: Resolve dúvidas técnicas complexas e redige conteúdos estruturados em segundos..."
                    className="w-full bg-[#040a18] border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none resize-none"
                  />
                </div>

                {/* quandoUsar & quandoNaoUsar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-emerald-300 mb-1">
                      2. Quando usar (Tarefas mais indicadas)
                    </label>
                    <textarea
                      rows={2}
                      value={quandoUsar}
                      onChange={(e) => setQuandoUsar(e.target.value)}
                      placeholder="Ex: Análise de grandes volumes de texto, síntese de artigos..."
                      className="w-full bg-[#040a18] border border-emerald-500/30 focus:border-emerald-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-amber-300 mb-1">
                      3. Quando não usar (Onde outra IA é melhor)
                    </label>
                    <textarea
                      rows={2}
                      value={quandoNaoUsar}
                      onChange={(e) => setQuandoNaoUsar(e.target.value)}
                      placeholder="Ex: Geração de imagens artísticas ou cálculos contábeis estritos..."
                      className="w-full bg-[#040a18] border border-amber-500/30 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none resize-none"
                    />
                  </div>
                </div>

                {/* melhorPara */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Melhor para (Resumo direto)
                  </label>
                  <input
                    type="text"
                    value={melhorPara}
                    onChange={(e) => setMelhorPara(e.target.value)}
                    placeholder="Ex: Brainstorming ágil e redação corporativa"
                    className="w-full bg-[#040a18] border border-cyan-500/30 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
                  />
                </div>

                {/* pontosFortes & limitacoes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-indigo-300 mb-1">
                      4. Pontos Fortes (Diferenciais principais)
                    </label>
                    <textarea
                      rows={2}
                      value={pontosFortes}
                      onChange={(e) => setPontosFortes(e.target.value)}
                      placeholder="Ex: Respostas extremamente naturais, boa formatação Markdown..."
                      className="w-full bg-[#040a18] border border-indigo-500/30 focus:border-indigo-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-rose-300 mb-1">
                      5. Limitações (Limites conhecidos ou cadastrados)
                    </label>
                    <textarea
                      rows={2}
                      value={limitacoes}
                      onChange={(e) => setLimitacoes(e.target.value)}
                      placeholder="Ex: Limite de mensagens na versão gratuita, corte temporal..."
                      className="w-full bg-[#040a18] border border-rose-500/30 focus:border-rose-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none resize-none"
                    />
                  </div>
                </div>

                {/* exemploPrompt */}
                <div>
                  <label className="block text-xs font-semibold text-cyan-300 mb-1">
                    6. Exemplo Prático (Prompt / Comando para copiar)
                  </label>
                  <textarea
                    rows={3}
                    value={exemploPrompt}
                    onChange={(e) => setExemploPrompt(e.target.value)}
                    placeholder="Ex: Atue como especialista em [área]. Analise o seguinte cenário e me dê 3 soluções práticas..."
                    className="w-full bg-[#020611] font-mono border border-cyan-500/40 focus:border-cyan-300 rounded-xl px-3.5 py-2 text-xs text-cyan-200 placeholder-slate-600 outline-none resize-none"
                  />
                </div>

                {/* observacaoEstrategica */}
                <div>
                  <label className="block text-xs font-semibold text-indigo-300 mb-1">
                    7. Observação / Recomendação Estratégica
                  </label>
                  <textarea
                    rows={2}
                    value={observacaoEstrategica}
                    onChange={(e) => setObservacaoEstrategica(e.target.value)}
                    placeholder="Ex: Excelente escolha como primeira IA para quem está começando devido à flexibilidade..."
                    className="w-full bg-[#040a18] border border-indigo-500/30 focus:border-indigo-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Scores adjustments */}
          <div className="pt-2 border-t border-slate-800">
            <span className="block text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2">
              Pontuações de Competência (1 a 5)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {(['Geral', 'Código', 'Pesquisa', 'Criação', 'Automação'] as const).map((metric) => (
                <div key={metric} className="bg-slate-900/80 p-2 rounded-xl border border-slate-800 text-center">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    {metric}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={scores[metric]}
                    onChange={(e) =>
                      setScores((prev) => ({
                        ...prev,
                        [metric]: Math.max(1, Math.min(5, Number(e.target.value) || 3)),
                      }))
                    }
                    className="w-full text-center bg-[#040a18] border border-slate-700 rounded-md py-1 text-sm font-bold text-cyan-400"
                  />
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-cyan-500/20 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm transition-all shadow-[0_2px_12px_rgba(0,180,255,0.3)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <Save className="w-4 h-4" />
            <span>Salvar IA</span>
          </button>
        </div>
      </div>
    </div>
  );
};

