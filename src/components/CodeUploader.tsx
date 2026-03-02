import React, { useState, useRef } from 'react';
import { Upload, FileCode, X, Code2, Github, Folder, FileText, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface CodeUploaderProps {
  onAnalyze: (code: string) => void;
  isAnalyzing: boolean;
}

interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url: string | null;
  html_url: string;
}

export default function CodeUploader({ onAnalyze, isAnalyzing }: CodeUploaderProps) {
  const [mode, setMode] = useState<'upload' | 'github'>('upload');
  const [code, setCode] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  
  // GitHub State
  const [repoUrl, setRepoUrl] = useState('');
  const [githubFiles, setGithubFiles] = useState<GitHubFile[]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [isLoadingGithub, setIsLoadingGithub] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCode(e.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const clearFile = () => {
    setFileName(null);
    setCode('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = () => {
    if (code.trim()) {
      onAnalyze(code);
    }
  };

  const fetchGithubContents = async (url: string) => {
    setIsLoadingGithub(true);
    setGithubError(null);
    try {
      const res = await fetch(`/api/github/contents?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error('Failed to fetch repository contents');
      const data = await res.json();
      if (Array.isArray(data)) {
        setGithubFiles(data.sort((a, b) => (a.type === b.type ? 0 : a.type === 'dir' ? -1 : 1)));
      } else {
        throw new Error('Invalid repository URL or empty');
      }
    } catch (err: any) {
      setGithubError(err.message);
    } finally {
      setIsLoadingGithub(false);
    }
  };

  const handleGithubFileClick = async (file: GitHubFile) => {
    if (file.type === 'dir') {
      // For simplicity in this MVP, we'll just append the path to the repo URL query
      // A robust implementation would handle navigation state better
      // Here we assume the user enters the root repo URL
      // To navigate dirs, we'd need to construct the new URL or use the API's 'url' field recursively
      // But the API returns a 'url' for the contents of the dir.
      // Let's try fetching that.
      try {
        setIsLoadingGithub(true);
        const res = await fetch(file.url); // This is the GitHub API URL
        const data = await res.json();
        if (Array.isArray(data)) {
           setGithubFiles(data.sort((a, b) => (a.type === b.type ? 0 : a.type === 'dir' ? -1 : 1)));
           setCurrentPath([...currentPath, file.name]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingGithub(false);
      }
    } else {
      // Fetch raw content
      if (!file.download_url) return;
      setIsLoadingGithub(true);
      try {
        const res = await fetch(`/api/github/raw?url=${encodeURIComponent(file.download_url)}`);
        if (!res.ok) throw new Error('Failed to fetch file content');
        const text = await res.text();
        setCode(text);
        setFileName(file.name);
        onAnalyze(text); // Trigger analysis immediately
      } catch (err: any) {
        setGithubError(err.message);
      } finally {
        setIsLoadingGithub(false);
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Code2 className="w-6 h-6 text-emerald-400" />
          Input Source
        </h2>
        
        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setMode('upload')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2",
              mode === 'upload' 
                ? "bg-slate-800 text-white shadow-lg shadow-black/20 ring-1 ring-white/10" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            )}
          >
            <Upload className="w-4 h-4" />
            Upload / Paste
          </button>
          <button
            onClick={() => setMode('github')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2",
              mode === 'github' 
                ? "bg-[#24292e] text-white shadow-lg shadow-black/20 ring-1 ring-white/10" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            )}
          >
            <Github className="w-4 h-4" />
            GitHub Repo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Input Area */}
        <div className="lg:col-span-3 space-y-4">
          
          {mode === 'github' ? (
            <div className="min-h-[400px] bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 flex flex-col">
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  onClick={() => fetchGithubContents(repoUrl)}
                  disabled={isLoadingGithub || !repoUrl}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingGithub ? 'Loading...' : 'Fetch'}
                </button>
              </div>

              {githubError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {githubError}
                </div>
              )}

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {githubFiles.length > 0 ? (
                  <div className="space-y-1">
                    {currentPath.length > 0 && (
                      <button 
                        onClick={() => {
                          // Simple back navigation - strictly for MVP
                          // Ideally we'd keep a history stack
                          setGithubFiles([]); 
                          setCurrentPath([]);
                          fetchGithubContents(repoUrl);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-slate-800/50 rounded-lg transition-colors text-sm"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        ..
                      </button>
                    )}
                    {githubFiles.map((file) => (
                      <button
                        key={file.path}
                        onClick={() => handleGithubFileClick(file)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-800/50 hover:text-white rounded-lg transition-colors text-left group"
                      >
                        {file.type === 'dir' ? (
                          <Folder className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                        ) : (
                          <FileText className="w-4 h-4 text-slate-500 group-hover:text-slate-400" />
                        )}
                        <span className="text-sm font-mono truncate flex-1">{file.name}</span>
                        {file.type === 'file' && (
                          <span className="opacity-0 group-hover:opacity-100 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded border border-emerald-500/30 transition-opacity">
                            Scan
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                    <Github className="w-12 h-12 opacity-20" />
                    <p className="text-sm">Enter a repository URL to browse files</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div 
              className={cn(
                "relative group rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out bg-slate-900/50 backdrop-blur-sm overflow-hidden",
                dragActive ? "border-emerald-500 bg-emerald-500/10" : "border-slate-700 hover:border-slate-600",
                "min-h-[400px] flex flex-col"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-900/80">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                  </div>
                  <span className="ml-3 text-xs font-mono text-slate-500">
                    {fileName || 'untitled_snippet'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleChange}
                    accept=".js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.html,.css,.json,.rb,.go,.rs,.php"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload File
                  </button>
                  <button
                    onClick={() => setCode(`def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr`)}
                    className="px-3 py-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-colors"
                  >
                    Try Demo
                  </button>
                  {code && (
                    <button
                      onClick={clearFile}
                      className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                      title="Clear code"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Text Area */}
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Paste your code here or drag & drop a file..."
                className="flex-1 w-full p-6 bg-transparent text-slate-300 font-mono text-sm resize-none focus:outline-none placeholder:text-slate-600"
                spellCheck={false}
              />

              {/* Drag Overlay */}
              <AnimatePresence>
                {dragActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center z-10 backdrop-blur-sm"
                  >
                    <FileCode className="w-16 h-16 text-emerald-400 mb-4" />
                    <p className="text-xl font-bold text-white">Drop file to import</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!code.trim() || isAnalyzing}
              className={cn(
                "px-8 py-4 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center gap-3",
                !code.trim() || isAnalyzing
                  ? "bg-slate-700 cursor-not-allowed opacity-50"
                  : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-emerald-500/25"
              )}
            >
              {isAnalyzing ? (
                "Processing..."
              ) : (
                <>
                  Run Audit
                  <Code2 className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
