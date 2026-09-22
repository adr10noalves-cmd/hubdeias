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
} from 'lucide-react';
import {
  ArtifactItem,
  getStoredArtifacts,
  saveArtifact,
  exportArtifactAsFile,
  exportProjectZipSimulation,
} from '../../services/artifactEngineService';

export const UniversalStudioView: React.FC = () => {
  const [artifacts, setArtifacts] = useState<ArtifactItem[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactItem | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'assets'>('preview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [generationType, setGenerationType] = useState<'html' | 'image' | 'code'>('html');

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
    const text = promptInput.trim();
    setPromptInput('');

    try {
      const res = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'GEMINI',
          modelId: 'gemini-3.8-flash',
          systemPrompt: `Você é o motor gerador de artefatos do Estúdio Universal do Hub. Crie o código HTML/CSS completo ou a estrutura solicitada pelo usuário de forma profissional, moderna e limpa. Retorne apenas o código ou texto solicitado sem marcações extras se possível, ou JSON.`,
          userPrompt: text,
          complexityLevel: 5,
        }),
      });

      const raw = await res.json();
      let content = '';
      if (raw.success && raw.data) {
        content = typeof raw.data === 'string' ? raw.data : raw.data.response || raw.text || JSON.stringify(raw.data);
      } else {
        content = raw.text || `<!DOCTYPE html><html><head><title>${text}</title><style>body{font-family:sans-serif;background:#0f172a;color:#f8fafc;padding:40px;}</style></head><body><h1>${text}</h1><p>Artefato gerado dinamicamente pelo Estúdio Universal.</p></body></html>`;
      }

      const title = text.slice(0, 30) + (text.length > 30 ? '...' : '');
      const newArtifact = saveArtifact({
        title,
        type: generationType,
        content,
        origin: 'Estúdio Universal',
        assets: {
          'cover.png': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
        },
      });

      const updated = getStoredArtifacts();
      setArtifacts(updated);
      setSelectedArtifact(newArtifact);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
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
      'README.md': `# ${selectedArtifact.title}\nGerado em ${selectedArtifact.createdAt}`,
      'assets/cover.png': selectedArtifact.assets?.['cover.png'] || '',
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
                  Estúdio Universal & Artifact Engine
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Estúdio de Criação</h1>
              <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Crie sites, códigos, imagens e relatórios reais orientados por capacidades. O Artifact Engine gerencia assets, versões e exportações em ZIP em tempo real.
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
          <option value="html">Site / HTML</option>
          <option value="code">Código / App</option>
          <option value="image">Asset Visual</option>
        </select>

        <input
          type="text"
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          placeholder={`Descreva o que deseja criar (ex: "Crie um site profissional para uma empresa de construção civil com imagens e seções")`}
          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500"
        />

        <button
          type="submit"
          disabled={!promptInput.trim() || isGenerating}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20 shrink-0 cursor-pointer"
        >
          {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>Gerar Artefato</span>
        </button>
      </form>

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Artifacts List */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 h-[600px] overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Artefatos Registrados</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800">{artifacts.length}</span>
          </div>

          {artifacts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Nenhum artefato criado ainda. Use a barra acima para gerar seu primeiro projeto.
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
                <div className="text-[10px] text-slate-400">{new Date(art.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {art.origin}</div>
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
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assets Vinculados ao Projeto</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(selectedArtifact.assets || {}).map(([name, url]) => (
                        <div key={name} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                          <div className="text-xs font-bold text-purple-300">{name}</div>
                          <img src={url} alt={name} className="w-full h-32 object-cover rounded-lg border border-slate-800" />
                          <div className="text-[10px] text-slate-500 truncate">{url}</div>
                        </div>
                      ))}
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
