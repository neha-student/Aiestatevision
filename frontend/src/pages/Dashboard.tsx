import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Upload, ChevronRight, Download, LogOut, Image, Sliders } from 'lucide-react';
import ChatPanel from '../chatbot/ChatPanel';
import { API_BASE_URL } from '../config';
import ProceduralHouse from '../3d/ProceduralHouse';

export default function Dashboard() {
  const [houseData, setHouseData] = useState(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [style, setStyle] = useState('modern');
  const [customInstructions, setCustomInstructions] = useState('');
  const [uploading, setUploading] = useState(false);
  const [_uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [upgradeResult, setUpgradeResult] = useState<string | null>(null);

  // Ollama Model State
  const [modelToPull, setModelToPull] = useState('llama3');
  const [pulling, setPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState('');

  const navigate = useNavigate();



  const handleLogout = () => {
    toast.success('Returned to Landing Page');
    navigate('/');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setUploadedImageUrl(null);
      setUpgradeResult(null);
    }
  };

  const handleUploadAndGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      return toast.error('Please choose a room image first!');
    }

    setUploading(true);
    const toastId = toast.loading('Uploading room image...');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      // 1. Upload file
      const uploadRes = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.message || 'Upload failed');
      }

      setUploadedImageUrl(uploadData.url);
      toast.loading('Analyzing room structure & generating upgrade...', { id: toastId });

      const grokApiKey = localStorage.getItem('grok_api_key') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (grokApiKey.trim()) {
        headers['x-grok-api-key'] = grokApiKey.trim();
      }

      // 2. Query design generation based on selected style and instructions
      const designRes = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          prompt: `Upgrade this room into a ${style} design. Instructions: ${customInstructions || 'Make it look premium and beautiful.'}`,
          model: 'llama3',
        }),
      });

      const designData = await designRes.json();
      if (!designRes.ok) {
        throw new Error(designData.error || 'AI generation failed');
      }

      setUpgradeResult(designData.response || 'Upgrade completed successfully!');
      toast.success('Success! AI upgraded design generated.', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to complete design generation', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handlePullModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelToPull.trim()) return toast.error('Enter a valid model name');

    setPulling(true);
    setPullProgress('Starting download stream...');
    const toastId = toast.loading(`Pulling "${modelToPull}" from Ollama...`);

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ model: modelToPull }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.message || 'Model download failed');
      }

      setPullProgress('Model pulled successfully!');
      toast.success(`Model "${modelToPull}" is ready!`, { id: toastId });
    } catch (err: any) {
      console.error(err);
      setPullProgress(`Error: ${err.message}`);
      toast.error(err.message || 'Failed to contact local Ollama', { id: toastId });
    } finally {
      setPulling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col relative overflow-hidden text-white font-sans">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/10 blur-[120px]"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purpleGlow/10 blur-[120px]"></div>

      {/* Elegant Header */}
      <header className="w-full px-6 py-4 glass border-b border-white/10 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent to-purpleGlow flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)]">
            <span className="font-bold text-black text-xl leading-none">A</span>
          </div>
          <span className="text-2xl font-bold tracking-tighter">
            Archi<span className="text-accent text-glow">AI</span> Dashboard
          </span>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-[0.98] text-gray-300 font-semibold text-sm transition-all"
        >
          <LogOut className="w-4 h-4 rotate-180" />
          Exit Dashboard
        </button>
      </header>

      {/* Main Multi-Pane Layout */}
      <main className="flex-grow flex flex-col lg:flex-row p-6 gap-6 h-[calc(100vh-80px)] overflow-hidden z-10">
        
        {/* Panel 1: Chat Assistant (Left Sidebar) */}
        <section className="w-full lg:w-1/4 glass-card border-glow flex flex-col overflow-hidden relative">
          <ChatPanel setHouseData={setHouseData} />
        </section>

        {/* Panel 2: 3D Generation Viewer (Middle Pane) */}
        <section className="flex-grow glass-card flex flex-col relative overflow-hidden p-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <h3 className="font-semibold text-md tracking-wider text-accent text-glow">3D Architectural Blueprint</h3>
            <span className="text-xs text-gray-500 bg-white/5 border border-white/10 px-3 py-1 rounded-full font-mono">
              Three.js Canvas
            </span>
          </div>
          <div className="flex-grow w-full items-center justify-center flex bg-black/40 rounded-xl overflow-hidden relative">
            <ProceduralHouse houseData={houseData} />
          </div>
        </section>

        {/* Panel 3: Room Style Upgrader & Ollama Manager (Right Sidebar) */}
        <section className="w-full lg:w-1/4 flex flex-col gap-6 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
          
          {/* Section 3.1: Image Upload & Room Style Upgrader */}
          <div className="glass-card p-5 border border-white/10 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Image className="w-5 h-5 text-accent" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-gray-300">Room AI Upgrader</h3>
            </div>

            <form onSubmit={handleUploadAndGenerate} className="space-y-4">
              {/* File Dropzone */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400">Upload Room Image</label>
                <div className="relative border border-dashed border-white/20 hover:border-accent/40 rounded-xl p-4 text-center cursor-pointer bg-white/5 transition-all">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {previewUrl ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={previewUrl} alt="Preview" className="w-24 h-24 object-cover rounded-lg border border-white/10" />
                      <span className="text-xs text-accent">Click to replace file</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-gray-500" />
                      <span className="text-xs text-gray-400">Drag & drop or browse</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Style Presets */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400">Design Aesthetic Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {['modern', 'traditional', 'luxury', 'contemporary', 'minimalist'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStyle(s)}
                      className={`py-2 px-3 rounded-lg text-xs capitalize font-semibold border transition-all ${
                        style === s 
                          ? 'bg-accent/15 border-accent text-accent shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom prompt instructions */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Custom Directives</label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-accent"
                  rows={2}
                  placeholder="e.g. Add premium brass lighting, warm wooden floors..."
                />
              </div>

              {/* Upgrade Trigger */}
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="w-full py-2.5 bg-gradient-to-r from-accent to-purpleGlow text-black font-extrabold rounded-lg text-xs hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Analyzing and Re-designing...' : 'Upgrade Room Design'}
              </button>
            </form>

            {/* Display AI Results */}
            {upgradeResult && (
              <div className="mt-2 bg-accent/5 border border-accent/20 rounded-xl p-3 text-xs leading-relaxed text-gray-300">
                <h4 className="font-bold text-accent mb-1 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" /> Design Recommendation
                </h4>
                {upgradeResult}
              </div>
            )}
          </div>

          {/* Section 3.2: Ollama Local Model Downloader */}
          <div className="glass-card p-5 border border-white/10 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Download className="w-5 h-5 text-purpleGlow" />
              <h3 className="font-bold text-sm uppercase tracking-wider text-gray-300">Ollama Downloader</h3>
            </div>

            <form onSubmit={handlePullModel} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400">Ollama Model Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={modelToPull}
                    onChange={(e) => setModelToPull(e.target.value)}
                    className="flex-grow bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purpleGlow"
                    placeholder="e.g., llama3.1, mistral, gemma"
                    required
                  />
                  <button
                    type="submit"
                    disabled={pulling}
                    className="px-4 bg-purpleGlow text-white font-bold rounded-lg text-xs hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    Pull
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {pullProgress && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-[10px] font-mono text-gray-400 break-words leading-normal max-h-24 overflow-y-auto">
                  {pullProgress}
                </div>
              )}
            </form>
          </div>

        </section>

      </main>
    </div>
  );
}
