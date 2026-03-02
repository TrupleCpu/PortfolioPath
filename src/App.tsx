import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Github, Sparkles } from 'lucide-react';
import CodeUploader from './components/CodeUploader';
import LoadingSpinner from './components/LoadingSpinner';
import ReportCard from './components/ReportCard';
import { analyzeCode, AnalysisResult } from './services/gemini';

function App() {
  const [view, setView] = useState<'input' | 'loading' | 'report'>('input');
  const [reportData, setReportData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (code: string) => {
    setView('loading');
    setError(null);
    
    try {
      const result = await analyzeCode(code);
      setReportData(result);
      setView('report');
    } catch (err) {
      console.error(err);
      setError("Failed to analyze code. Please try again.");
      setView('input');
    }
  };

  const reset = () => {
    setView('input');
    setReportData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 selection:bg-emerald-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 border-b border-slate-800/50 bg-[#0A0A0B]/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group" 
            onClick={reset}
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
              <LayoutDashboard className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">
              Portfolio<span className="text-emerald-400">Path</span>
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href="#" 
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">View Source</span>
            </a>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">AI Powered</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 min-h-[calc(100vh-64px)] flex flex-col">
        <AnimatePresence mode="wait">
          {view === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center"
            >
              <div className="text-center mb-12 space-y-4 max-w-2xl">
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                  Turn Your Code Into <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
                    Career Gold
                  </span>
                </h1>
                <p className="text-lg text-slate-400">
                  Upload your project code. Our AI auditor evaluates quality, performance, and generates resume-ready bullet points instantly.
                </p>
              </div>
              
              <CodeUploader onAnalyze={handleAnalyze} isAnalyzing={false} />
              
              {error && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}
            </motion.div>
          )}

          {view === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center"
            >
              <LoadingSpinner />
            </motion.div>
          )}

          {view === 'report' && reportData && (
            <motion.div
              key="report"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full"
            >
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Audit Report</h2>
                  <p className="text-slate-400 text-sm">Generated on {new Date().toLocaleDateString()}</p>
                </div>
                <button 
                  onClick={reset}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors"
                >
                  Analyze Another
                </button>
              </div>
              <ReportCard data={reportData} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
