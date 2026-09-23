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
} from 'lucide-react';
import {
  ArtifactItem,
  getStoredArtifacts,
  saveArtifact,
  exportArtifactAsFile,
  exportProjectZipSimulation,
} from '../../services/artifactEngineService';
import {
  runCodeCreationPipeline,
  runImageGenerationPipeline,
} from '../../services/codeAndImagePipeline';

export const UniversalStudioView: React.FC = () => {
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactItem | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'assets'>('preview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [generationType, setGenerationType] = useState<'html' | 'image' | 'code'>('html');
  const [pipelineStatus, setPipelineStatus] = useState<string>('');
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    const loaded = getStoredArtifacts();
    setArtifacts(loaded);
    if (loaded.length > 0 && !selectedArtifact) {
      setSelectedArtifact(loaded[0]);
    }
  }, []);

  const handleCreateArtifact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim() || isGenerating) return;

    setIsGenerating(true);
    setGenerationError(null);
    const text = promptInput.trim();
    setPromptInput('');

    try {
      if (generationType === 'image') {
        setPipelineStatus('Verificando adapter multimodal de geração visual...');
        const imgResult = await runImageGenerationPipeline(text);

        if (!imgResult.success || !imgResult.imageBase64) {
          throw new Error(imgResult.error || 'A geração de imagens por IA ainda não está disponível nesta configuração.');
        }

        // Se porventura houver sucesso real (futuro)
        const title = text.slice(0, 30) + (text.length > 30 ? '...' : '');
        const newArtifact = saveArtifact({
          title,
          type: 'image',
          content: `<img src="${imgResult.imageBase64}" />`,
          origin: 'Estúdio Universal (Native Image Engine)',
          assets: {
            [imgResult.filename]: imgResult.imageBase64,
          },
          metadata: {
            source: 'generated',
            provider: imgResult.provider,
            model: imgResult.model,
          },
        });

        const updated = getStoredArtifacts();
        setArtifacts(updated);
        setSelectedArtifact(newArtifact);
      } else {
        setPipelineStatus('Extraindo requisitos e planejando arquitetura do sistema...');
        const res = await fetch('/api/orchestrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'GEMINI',
            modelId: 'gemini-3.8-flash',
            systemPrompt: `Você é o Arquiteto Chefe do Estúdio Universal. Crie um sistema funcional completo em HTML/CSS/Tailwind e JavaScript com persistência local (localStorage), dashboards interativos, cadastros, formulários funcionais, filtros e navegação completa.`,
            userPrompt: text,
            complexityLevel: 5,
          }),
        });

        const raw = await res.json();
        let rawContent = '';
        if (raw.success && raw.data) {
          rawContent = typeof raw.data === 'string' ? raw.data : raw.data.response || raw.text || JSON.stringify(raw.data);
        } else {
          rawContent = raw.text || `<h1>${text}</h1>`;
        }

        setPipelineStatus('Executando Revisor de Código e Quality Gate...');
        const pipelineRes = runCodeCreationPipeline(rawContent, text);

        const title = text.slice(0, 30) + (text.length > 30 ? '...' : '');
        const newArtifact = saveArtifact({
          title,
          type: generationType,
          content: pipelineRes.code,
          origin: 'Estúdio Universal (Code Pipeline)',
          assets: {},
          metadata: {
            qualityGatePassed: pipelineRes.qualityGatePassed,
            issuesFound: pipelineRes.issuesFound,
            source: 'generated',
          },
        });

        const updated = getStoredArtifacts();
        setArtifacts(updated);
        setSelectedArtifact(newArtifact);
      }
    } catch (err: any) {
      console.error(err);
      setGenerationError(err?.message || 'A geração de imagens por IA ainda não está disponível nesta configuração.');
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
    exportProjectZipSimulation(selectedArtifact.title, {
      'index.html': selectedArtifact.content,
      'README.md': `# ${selectedArtifact.title}\nGerado via Estúdio Universal em ${selectedArtifact.createdAt}`,
    });
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
                  Estúdio Universal — Sem Simulação Visual Falsa
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Estúdio de Criação Avançada</h1>
              <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Criação de sistemas e páginas funcionais. Geração visual por IA raster nativa reporta indisponibilidade em vez de simular SVGs ou stock externo.
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

      {/* Creation Bar */}
      <form onSubmit={handleCreateArtifact} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row gap-3 items-center">
        <select
          value={generationType}
          onChange={(e) => setGenerationType(e.target.value as any)}
          className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-xs font-bold text-slate-200 focus:outline-none focus:border-purple-500 shrink-0"
        >
          <option value="html">Sistema / Página HTML</option>
          <option value="image">Imagem por IA (GENERATE_IMAGE)</option>
          <option value="code">Código Aplicativo</option>
        </select>

        <input
          type="text"
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          placeholder={`Ex: "Crie um cachorro herói" ou "Crie um sistema de inspeções"`}
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
            <span className="font-bold text-amber-300 uppercase tracking-wide">Aviso do Sistema (Geração de Imagem Indisponível)</span>
            <p className="leading-relaxed">{generationError}</p>
          </div>
        </div>
      )}

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Artifacts List */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 h-[600px] overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Artefatos Gerados</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800">{artifacts.length}</span>
          </div>

          {artifacts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Nenhum artefato criado ainda. Use a barra acima para gerar um sistema ou página.
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
                  <span className="text-purple-400 font-mono">v{art.version}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Artifact Viewer / Studio */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[600px] overflow-hidden">
          {selectedArtifact ? (
            <>
              {/* Viewer Header */}
              <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{selectedArtifact.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">Versão {selectedArtifact.version}</span>
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
                    Código / Conteúdo
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
                    onClick={handleDownloadCurrent}
                    className="ml-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar
                  </button>
                </div>
              </div>

              {/* Viewer Content */}
              <div className="flex-1 overflow-hidden bg-slate-950 flex flex-col">
                {activeTab === 'preview' && (
                  <div className="flex-1 bg-white relative overflow-auto">
                    {selectedArtifact.type === 'html' ? (
                      <iframe
                        srcDoc={selectedArtifact.content}
                        title={selectedArtifact.title}
                        className="w-full h-full border-0"
                      />
                    ) : (
                      <div className="p-8 text-slate-900 space-y-4">
                        <h2 className="text-xl font-bold">{selectedArtifact.title}</h2>
                        <div className="p-4 bg-slate-100 rounded-xl whitespace-pre-wrap text-sm font-mono">
                          {selectedArtifact.content}
                        </div>
                      </div>
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
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assets Vinculados</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(selectedArtifact.assets || {}).map(([name, assetUrl]) => {
                        const urlStr = assetUrl as string;
                        return (
                          <div key={name} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                            <div className="text-xs font-bold text-purple-300">{name}</div>
                            <div className="p-3 bg-slate-950 rounded text-xs font-mono text-slate-400 truncate">{urlStr}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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
