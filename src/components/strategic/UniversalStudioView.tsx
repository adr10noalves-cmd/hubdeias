import React, { useState, useEffect } from 'react';
import {
  Code2,
  FileCode,
  Image as ImageIcon,
  Download,
  Eye,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Layers,
  Folder,
  FileText,
  Trash2,
  AlertTriangle,
  History,
  RotateCcw,
  Send,
  Wand2,
} from 'lucide-react';
import {
  ArtifactItem,
  getStoredArtifacts,
  saveArtifact,
  exportArtifactAsFile,
  exportProjectRealZip,
  revertArtifactToPreviousVersion,
} from '../../services/artifactEngineService';
import {
  executeMultimodalCreation,
} from '../../services/multimodalStudioPipeline';

export const UniversalStudioView: React.FC = () => {
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactItem | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'assets' | 'versions'>('preview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [conversationalInput, setConversationalInput] = useState('');
  const [pipelineStatus, setPipelineStatus] = useState<string>('');
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    const loaded = getStoredArtifacts();
    setArtifacts(loaded);
    if (loaded.length > 0 && !selectedArtifact) {
      setSelectedArtifact(loaded[0]);
    }
  }, []);

  const getImageSrc = (content: string, mimeType = 'image/png') => {
    if (!content) return '';
    if (content.startsWith('data:') || content.startsWith('http')) {
      return content;
    }
    if (content.includes('<img')) {
      const match = content.match(/src=["']([^"']+)["']/);
      if (match && match[1]) {
        return match[1].startsWith('data:') || match[1].startsWith('http')
          ? match[1]
          : `data:${mimeType};base64,${match[1]}`;
      }
    }
    return `data:${mimeType};base64,${content}`;
  };

  const handleCreateOrRefine = async (textToProcess: string, isConversational = false) => {
    if (!textToProcess.trim() || isGenerating) return;

    setIsGenerating(true);
    setGenerationError(null);
    const text = textToProcess.trim();
    if (isConversational) {
      setConversationalInput('');
    } else {
      setPromptInput('');
    }

    try {
      const targetArtifact = isConversational ? selectedArtifact : null;
      const result = await executeMultimodalCreation(text, targetArtifact, (step) => {
        setPipelineStatus(step);
      });

      if (!result.success || !result.artifact) {
        throw new Error(result.error || 'Falha ao processar solicitação no Estúdio Universal.');
      }

      const updatedAll = getStoredArtifacts();
      setArtifacts(updatedAll);
      setSelectedArtifact(result.artifact);
      setActiveTab('preview');
    } catch (err: any) {
      console.error(err);
      setGenerationError(err?.message || 'Erro ao executar pipeline do Estúdio Universal.');
    } finally {
      setIsGenerating(false);
      setPipelineStatus('');
    }
  };

  const handleDownloadCurrent = () => {
    if (!selectedArtifact) return;
    exportArtifactAsFile(selectedArtifact);
  };

  const handleDownloadZip = () => {
    if (!selectedArtifact) return;
    exportProjectRealZip(selectedArtifact);
  };

  const handleRollback = () => {
    if (!selectedArtifact) return;
    const restored = revertArtifactToPreviousVersion(selectedArtifact.id);
    if (restored) {
      const updatedAll = getStoredArtifacts();
      setArtifacts(updatedAll);
      setSelectedArtifact(restored);
      setActiveTab('preview');
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/70 to-slate-900 border border-purple-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/30 shrink-0">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-900 text-purple-300 border border-purple-700 uppercase tracking-widest">
                  Estúdio Universal Multimodal 2.0
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/60">
                  Workers AI Flux.1 + Gemini + Code Engine
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Estúdio de Criação Multimodal</h1>
              <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Crie projetos web completos combinando raciocínio, geração de código responsivo e imagens originais reais em alta definição com exportação ZIP autêntica.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              disabled={!selectedArtifact}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
            >
              <Folder className="w-4 h-4" /> Exportar Projeto (ZIP)
            </button>
          </div>
        </div>
      </div>

      {/* Main Creation Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleCreateOrRefine(promptInput, false);
        }}
        className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row gap-3 items-center"
      >
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-purple-300 text-xs font-bold shrink-0">
          <Wand2 className="w-4 h-4 text-purple-400" />
          <span>Multimodal Automático</span>
        </div>

        <input
          type="text"
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          placeholder={`Ex: "Crie um site profissional para uma construtora chamada Atlas Engenharia com imagem original"`}
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500"
        />

        <button
          type="submit"
          disabled={!promptInput.trim() || isGenerating}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20 shrink-0 cursor-pointer"
        >
          {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>{isGenerating ? 'Processando...' : 'Gerar Artefato'}</span>
        </button>
      </form>

      {isGenerating && pipelineStatus && (
        <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-3 text-xs text-purple-300 flex items-center gap-2 animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
          <span>{pipelineStatus}</span>
        </div>
      )}

      {generationError && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-4 text-xs text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-amber-300 uppercase tracking-wide">Aviso de Execução</span>
            <p className="leading-relaxed">{generationError}</p>
          </div>
        </div>
      )}

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Artifacts List */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 h-[680px] overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Artefatos do Estúdio</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800">{artifacts.length}</span>
          </div>

          {artifacts.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              Nenhum artefato criado ainda. Use a barra acima para gerar um projeto completo.
            </div>
          ) : (
            artifacts.map((art) => (
              <div
                key={art.id}
                onClick={() => setSelectedArtifact(art)}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all space-y-1.5 ${
                  selectedArtifact?.id === art.id
                    ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-purple-300 uppercase">{art.type}</span>
                  <span className="text-slate-500">v{art.version}</span>
                </div>
                <div className="font-semibold text-white text-xs sm:text-sm truncate">{art.title}</div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>{new Date(art.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-purple-400 font-mono">
                    {Object.keys(art.assets || {}).length > 0 ? `${Object.keys(art.assets || {}).length} assets` : 'Código puro'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Artifact Viewer / Studio */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[680px] overflow-hidden">
          {selectedArtifact ? (
            <>
              {/* Viewer Header */}
              <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{selectedArtifact.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                    Versão {selectedArtifact.version}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'preview' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'code' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Código / Arquivos
                  </button>
                  <button
                    onClick={() => setActiveTab('assets')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === 'assets' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Assets ({Object.keys(selectedArtifact.assets || {}).length})
                  </button>
                  <button
                    onClick={() => setActiveTab('versions')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      activeTab === 'versions' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Versões ({(selectedArtifact.history?.length || 0) + 1})</span>
                  </button>

                  <button
                    onClick={handleDownloadCurrent}
                    className="ml-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar
                  </button>
                </div>
              </div>

              {/* Viewer Content */}
              <div className="flex-1 overflow-hidden bg-slate-950 flex flex-col relative">
                {activeTab === 'preview' && (
                  <div className="flex-1 bg-white relative overflow-auto">
                    {selectedArtifact.type === 'image' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-950 overflow-auto space-y-4">
                        <div className="relative max-w-4xl max-h-[62vh] overflow-hidden rounded-2xl shadow-2xl border border-slate-800 bg-slate-900 flex items-center justify-center p-2">
                          <img
                            src={getImageSrc(selectedArtifact.content, selectedArtifact.metadata?.mimeType || 'image/png')}
                            alt={selectedArtifact.title}
                            className="max-w-full max-h-[58vh] object-contain rounded-xl"
                          />
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-3">
                          <span className="px-2.5 py-1 rounded-lg bg-purple-950/60 text-purple-300 border border-purple-800/60 font-mono">
                            Provider: {selectedArtifact.metadata?.provider || 'cloudflare'}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 font-mono border border-slate-800">
                            Model: {selectedArtifact.metadata?.model || 'flux-1-schnell'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <iframe
                        srcDoc={selectedArtifact.content}
                        title={selectedArtifact.title}
                        className="w-full h-full border-0"
                      />
                    )}
                  </div>
                )}

                {activeTab === 'code' && (
                  <div className="flex-1 p-4 overflow-auto bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed">
                    <pre className="whitespace-pre-wrap">{selectedArtifact.content}</pre>
                  </div>
                )}

                {activeTab === 'assets' && (
                  <div className="flex-1 p-6 overflow-auto space-y-4 text-slate-200">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assets Vinculados ao Projeto</h3>
                    {Object.keys(selectedArtifact.assets || {}).length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs">Nenhum asset binário registrado neste artefato.</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(selectedArtifact.assets || {}).map(([name, assetUrl]) => {
                          const urlStr = assetUrl as string;
                          return (
                            <div key={name} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-purple-300 font-mono">{name}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                                  Gerado via Flux.1
                                </span>
                              </div>
                              <div className="h-40 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                                <img src={urlStr} alt={name} className="w-full h-full object-cover" />
                              </div>
                              <div className="text-[10px] text-slate-400 truncate font-mono">
                                Tamanho estimado: ~{Math.round((urlStr.length * 3) / 4 / 1024)} KB
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'versions' && (
                  <div className="flex-1 p-6 overflow-auto space-y-4 text-slate-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Histórico de Versões e Reversão</h3>
                      <button
                        onClick={handleRollback}
                        disabled={!selectedArtifact.history || selectedArtifact.history.length === 0}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reverter para Versão Anterior
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/40 space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                          <span>Versão Atual: v{selectedArtifact.version}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900 text-purple-200">Ativa no Preview</span>
                        </div>
                        <p className="text-xs text-slate-300">{selectedArtifact.title}</p>
                        <span className="text-[10px] text-slate-400">Atualizado em: {new Date(selectedArtifact.updatedAt).toLocaleString()}</span>
                      </div>

                      {(selectedArtifact.history || []).map((hist, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                            <span>Versão Anterior: v{hist.version}</span>
                            <span className="text-[10px] text-slate-500">{new Date(hist.updatedAt).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-slate-400">{hist.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Conversational Refinement Bar */}
              <div className="p-3 border-t border-slate-800 bg-slate-950/90 flex flex-col gap-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] text-slate-400">
                  <span className="font-bold text-purple-400 shrink-0">Ações Rápidas:</span>
                  <button
                    onClick={() => handleCreateOrRefine('Troque somente a imagem principal.', true)}
                    disabled={isGenerating}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-purple-500 text-slate-300 hover:text-white transition-all shrink-0 cursor-pointer"
                  >
                    🎨 Trocar Imagem Principal
                  </button>
                  <button
                    onClick={() => handleCreateOrRefine('Deixe o site mais sofisticado com design escuro moderno.', true)}
                    disabled={isGenerating}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-purple-500 text-slate-300 hover:text-white transition-all shrink-0 cursor-pointer"
                  >
                    ✨ Deixar mais Sofisticado
                  </button>
                  <button
                    onClick={() => handleCreateOrRefine('Volte para a versão anterior.', true)}
                    disabled={isGenerating || !selectedArtifact.history || selectedArtifact.history.length === 0}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white disabled:opacity-40 transition-all shrink-0 cursor-pointer"
                  >
                    ↩️ Voltar para Versão Anterior
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateOrRefine(conversationalInput, true);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={conversationalInput}
                    onChange={(e) => setConversationalInput(e.target.value)}
                    placeholder={`Refinar este projeto (Ex: "Adicione depoimentos", "Troque a cor de destaque para dourado")...`}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={!conversationalInput.trim() || isGenerating}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-500/20 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Refinar</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center space-y-2">
              <Sparkles className="w-10 h-10 text-purple-500/40 animate-pulse" />
              <div className="text-sm font-medium text-slate-300">Nenhum artefato selecionado</div>
              <p className="text-xs max-w-sm">Escolha um item na lista ao lado ou crie um novo usando a barra superior.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
