import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Code, Target, GraduationCap, Briefcase, TrendingUp, 
  Github, Sparkles, Zap, CheckCircle2, Award, Cpu, Terminal, Database,
  ArrowRight, Upload, AlertTriangle, ShieldAlert, Lightbulb, Star
} from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import LoadingSpinner from './components/LoadingSpinner';
import { analyzeCode, AnalysisResult } from './services/gemini';
import { fetchGithubRepo } from './services/github';
import { cn } from './lib/utils';

type Tab = 'dashboard' | 'analyzer' | 'radar' | 'learning' | 'career' | 'growth';

const formatText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <span key={i} className="font-semibold text-white">{part.slice(2, -2)}</span>;
    }
    return part;
  });
};

const navItems: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analyzer', label: 'Code Analyzer', icon: Code },
  { id: 'radar', label: 'Skill Radar', icon: Target },
  { id: 'learning', label: 'Learning Path', icon: GraduationCap },
  { id: 'career', label: 'Career Generator', icon: Briefcase },
  { id: 'growth', label: 'Growth', icon: TrendingUp },
];

function App() {
  const [isHome, setIsHome] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reportData, setReportData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [repoUrl, setRepoUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<any>(null);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRes = await fetch('/api/github/user');
        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
          
          setIsLoadingRepos(true);
          const reposRes = await fetch('/api/github/repositories');
          if (reposRes.ok) {
            const reposData = await reposRes.json();
            setRepositories(reposData);
          }
          setIsLoadingRepos(false);
        } else if (userRes.status === 401) {
          // Not logged in, clear user state
          setUser(null);
          setRepositories([]);
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    fetchUserData();

    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetchUserData();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleLogin = async () => {
    try {
      const response = await fetch('/api/auth/url');
      if (!response.ok) {
        throw new Error('Failed to get auth URL');
      }
      const { url } = await response.json();
      
      const authWindow = window.open(
        url,
        'oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        alert('Please allow popups for this site to connect your account.');
      }
    } catch (error) {
      console.error('OAuth error:', error);
      setError('Failed to initiate login.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setRepositories([]);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAnalyze = async (code: string) => {
    setIsAnalyzing(true);
    setError(null);
    setIsHome(false); // Switch to dashboard view to show loading spinner
    
    try {
      const result = await analyzeCode(code);
      setReportData(result);
      setActiveTab('dashboard'); // Switch to dashboard on success
    } catch (err) {
      console.error(err);
      setError("Failed to analyze code. Please try again.");
      setIsHome(true); // Go back to home on error
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGithubAudit = async (url: string) => {
    if (!url) return;
    setIsAnalyzing(true);
    setError(null);
    setIsHome(false); // Switch to dashboard view to show loading spinner
    
    try {
      const code = await fetchGithubRepo(url);
      await handleAnalyze(code);
    } catch (err: any) {
      setError(err.message || "Failed to fetch GitHub repository.");
      setIsAnalyzing(false);
      setIsHome(true); // Go back to home on error
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        handleAnalyze(e.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return "bg-emerald-400/10 border-emerald-400/20";
    if (score >= 70) return "bg-yellow-400/10 border-yellow-400/20";
    return "bg-red-400/10 border-red-400/20";
  };

  // Render functions for different tabs
  const renderContent = () => {
    if (isAnalyzing) {
      return (
        <div className="flex-1 flex items-center justify-center h-full">
          <LoadingSpinner />
        </div>
      );
    }

    if (!reportData) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
          <Code className="w-16 h-16 opacity-20" />
          <p className="text-lg">No data available.</p>
          <button 
            onClick={() => setIsHome(true)}
            className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors"
          >
            Go to Home Page
          </button>
        </div>
      );
    }

    if (activeTab === 'analyzer') {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto w-full space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Code Analyzer</h1>
              <p className="text-slate-400 mt-1">Detailed code review and architectural feedback.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={cn("backdrop-blur-md border rounded-2xl p-6 flex flex-col justify-center items-center gap-4 text-center", getScoreBg(reportData.code_review.score))}>
              <Award className={cn("w-12 h-12", getScoreColor(reportData.code_review.score))} />
              <div>
                <p className="text-slate-400 text-sm font-mono uppercase tracking-wider mb-1">Quality Score</p>
                <h3 className={cn("text-5xl font-bold", getScoreColor(reportData.code_review.score))}>
                  {reportData.code_review.score}/100
                </h3>
              </div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col justify-center items-center gap-4 text-center">
              <Terminal className="w-12 h-12 text-blue-400" />
              <div>
                <p className="text-slate-400 text-sm font-mono uppercase tracking-wider mb-1">Primary Tech Stack</p>
                <h3 className="text-3xl font-bold text-white">{reportData.tech_stack.language}</h3>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strengths Card */}
            <div className="bg-[#131825] rounded-2xl p-8 border border-emerald-500/20 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
              <div className="absolute -top-6 -right-6 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                <CheckCircle2 className="w-40 h-40 text-emerald-500" />
              </div>
              <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="text-lg font-bold text-white tracking-wide">Strengths</h2>
              </div>
              <ul className="space-y-5 relative z-10">
                {reportData.code_review.positive_observations.map((item, i) => (
                  <li key={i} className="flex items-start gap-4 text-slate-300 text-[14px] leading-relaxed">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    <span>{formatText(item)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses Card */}
            <div className="bg-[#131825] rounded-2xl p-8 border border-red-500/20 relative overflow-hidden group hover:border-red-500/40 transition-colors">
              <div className="absolute -top-6 -right-6 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                <AlertTriangle className="w-40 h-40 text-red-500" />
              </div>
              <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <h2 className="text-lg font-bold text-white tracking-wide">Areas for Improvement</h2>
              </div>
              <ul className="space-y-5 relative z-10">
                {reportData.code_review.weaknesses?.length ? (
                  reportData.code_review.weaknesses.map((item, i) => (
                    <li key={i} className="flex items-start gap-4 text-slate-300 text-[14px] leading-relaxed">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 shadow-[0_0_8px_rgba(248,113,113,0.8)]" />
                      <span>{formatText(item)}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-500 italic text-sm">No major weaknesses identified.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Refactoring Suggestions Card */}
          <div className="bg-[#131825] rounded-2xl p-8 border border-amber-500/20 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
            <div className="absolute -top-10 -right-10 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
              <Lightbulb className="w-64 h-64 text-amber-500" />
            </div>
            <div className="flex items-center gap-3 mb-8 relative z-10">
              <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <Lightbulb className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">Refactoring Suggestions</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
              {reportData.code_review.refactoring_suggestions.map((item, i) => (
                <div key={i} className="flex items-start gap-4 text-slate-300 text-[14px] leading-relaxed p-5 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-amber-500/30 transition-colors">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                  <span>{formatText(item)}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      );
    }

    if (!reportData) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
          <Code className="w-16 h-16 opacity-20" />
          <p className="text-lg">No data available.</p>
          <button 
            onClick={() => setActiveTab('analyzer')}
            className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors"
          >
            Go to Code Analyzer
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto w-full space-y-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
              <p className="text-slate-400">Overview of your latest code audit.</p>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Key Strengths
              </h3>
              <ul className="space-y-3">
                {reportData.code_review.positive_observations.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        );
      case 'radar': {
        // Fallback data in case the user hasn't re-analyzed since the schema update
        const radarScores = reportData.skill_radar || {
          frontend: 45,
          backend: 85,
          devops: 30,
          security: 50,
          design: 25,
          architecture: 70
        };

        const radarData = [
          { subject: 'Frontend', A: radarScores.frontend, fullMark: 100 },
          { subject: 'Backend', A: radarScores.backend, fullMark: 100 },
          { subject: 'DevOps', A: radarScores.devops, fullMark: 100 },
          { subject: 'Security', A: radarScores.security, fullMark: 100 },
          { subject: 'Design', A: radarScores.design, fullMark: 100 },
          { subject: 'Architecture', A: radarScores.architecture, fullMark: 100 },
        ];

        // Sort skills to separate Top Strengths from Areas for Growth
        const sortedSkills = [...radarData].sort((a, b) => b.A - a.A);
        const topStrengths = sortedSkills.filter(s => s.A >= 70);
        // If none are >= 70, just take the top 1
        if (topStrengths.length === 0) topStrengths.push(sortedSkills[0]);
        
        const areasForGrowth = sortedSkills.filter(s => !topStrengths.includes(s));

        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto w-full space-y-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white tracking-tight">Skill Radar</h1>
              <p className="text-slate-400">Visualizing your technical strengths based on your latest analysis.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Radar Chart Card */}
              <div className="lg:col-span-2 bg-[#131825] rounded-2xl p-6 border border-slate-800/50 min-h-[400px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Skills"
                      dataKey="A"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="#10b981"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Strengths & Growth Cards */}
              <div className="space-y-6">
                {/* Top Strengths */}
                <div className="bg-[#131825] rounded-2xl p-6 border border-slate-800/50">
                  <h3 className="text-emerald-400 font-bold mb-6">Top Strengths</h3>
                  <div className="space-y-4">
                    {topStrengths.map((skill) => (
                      <div key={skill.subject} className="flex items-center justify-between gap-4">
                        <span className="text-white font-medium text-sm w-24">{skill.subject}</span>
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-400 rounded-full" 
                            style={{ width: `${skill.A}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Areas for Growth */}
                <div className="bg-[#131825] rounded-2xl p-6 border border-slate-800/50">
                  <h3 className="text-yellow-400 font-bold mb-6">Areas for Growth</h3>
                  <div className="space-y-4">
                    {areasForGrowth.map((skill) => (
                      <div key={skill.subject} className="flex items-center justify-between gap-4">
                        <span className="text-white font-medium text-sm w-24">{skill.subject}</span>
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-yellow-400 rounded-full" 
                            style={{ width: `${skill.A}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      }
      case 'learning': {
        // Fallback data in case the user hasn't re-analyzed since the schema update
        const learningPath = reportData.learning_path || {
          focus_area: "Full-Stack Development",
          reasoning: "Based on your code, you have a good foundation but could benefit from understanding the full request lifecycle.",
          roadmap: [
            {
              step: 1,
              title: "Master Frontend Fundamentals",
              description: "Ensure a deep understanding of React, state management, and component architecture.",
              resources: ["React Official Docs", "Advanced State Management"]
            },
            {
              step: 2,
              title: "Explore Backend Basics",
              description: "Learn how to build simple REST APIs using Node.js and Express.",
              resources: ["Node.js Crash Course", "Express.js Routing"]
            },
            {
              step: 3,
              title: "Database Integration",
              description: "Connect your backend to a database (SQL or NoSQL) to persist data.",
              resources: ["PostgreSQL Basics", "MongoDB for Beginners"]
            }
          ]
        };

        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto w-full space-y-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white tracking-tight">Learning Path</h1>
              <p className="text-slate-400">Your personalized roadmap based on industry trends and your code analysis.</p>
            </div>

            {/* Focus Area Card */}
            <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-500/20 rounded-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Target className="w-32 h-32 text-emerald-400" />
              </div>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-bold tracking-wide uppercase mb-4">
                  Primary Focus
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">{learningPath.focus_area}</h2>
                <p className="text-slate-300 leading-relaxed max-w-3xl text-lg">
                  {learningPath.reasoning}
                </p>
              </div>
            </div>

            {/* Roadmap Timeline */}
            <div className="mt-12">
              <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-blue-400" />
                Recommended Roadmap
              </h3>
              
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-blue-500 before:to-slate-800">
                {learningPath.roadmap.map((step, index) => (
                  <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    {/* Icon */}
                    <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-[#0A0A0B] bg-slate-800 text-slate-400 group-[.is-active]:bg-emerald-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <span className="font-bold">{step.step}</span>
                    </div>
                    
                    {/* Card */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-[#131825] border border-slate-800/50 shadow-xl transition-all hover:border-slate-700">
                      <h4 className="text-xl font-bold text-white mb-2">{step.title}</h4>
                      <p className="text-slate-400 mb-6 leading-relaxed">
                        {step.description}
                      </p>
                      
                      {step.resources && step.resources.length > 0 && (
                        <div>
                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Recommended Topics</h5>
                          <div className="flex flex-wrap gap-2">
                            {step.resources.map((resource, i) => (
                              <span key={i} className="px-3 py-1.5 bg-slate-800/80 text-slate-300 text-sm rounded-lg border border-slate-700/50 flex items-center gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                                {resource}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );
      }
      case 'career':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto w-full space-y-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white tracking-tight">Career Generator</h1>
              <p className="text-slate-400">Professional resume bullets generated from your code.</p>
            </div>
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-1 overflow-hidden">
              <div className="bg-slate-950/80 rounded-xl p-8">
                <div className="space-y-4">
                  {reportData.professional_impact.resume_bullets.map((bullet, i) => (
                    <div key={i} className="group relative p-5 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors flex gap-4">
                      <TrendingUp className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-slate-200 leading-relaxed text-lg">
                        {bullet}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-8 border-t border-slate-800">
                  <button 
                    onClick={() => navigator.clipboard.writeText(reportData.professional_impact.resume_bullets.join('\n'))}
                    className="w-full py-4 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                  >
                    <Briefcase className="w-5 h-5" />
                    Copy All to Clipboard
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 'growth':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto w-full space-y-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white tracking-tight">Growth</h1>
              <p className="text-slate-400">Track your progress over time.</p>
            </div>
            <div className="flex flex-col items-center justify-center p-16 border border-dashed border-slate-700 rounded-2xl bg-slate-900/30 text-center">
              <TrendingUp className="w-16 h-16 text-slate-600 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Historical Tracking Coming Soon</h3>
              <p className="text-slate-400 max-w-md">
                We're building features to track your code quality improvements across multiple projects and over time.
              </p>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  if (isHome) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex flex-col relative overflow-hidden selection:bg-emerald-500/30">
        {/* Background Gradients */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px]" />
        </div>

        {/* Header */}
        <div className="relative z-10 border-b border-slate-800/50">
          <header className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10">
                <LayoutDashboard className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                Portfolio<span className="text-emerald-400">Path</span>
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a 
                href="https://github.com/AlbertCJC/PortfolioPath" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                <Github className="w-4 h-4" />
                View Source
              </a>
              <div className="w-px h-4 bg-slate-800"></div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                AI Powered
              </div>
            </div>
          </header>
        </div>

        {/* Hero Section */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto w-full mt-[-8vh]">
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 leading-tight">
            Turn Your Code Into<br />
            <span className="text-emerald-400">
              Career Gold
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl leading-relaxed">
            Upload your project code. Our AI auditor evaluates quality, performance, and generates resume-ready bullet points instantly.
          </p>

          <div className="w-full max-w-2xl flex flex-col items-center gap-6">
            {!user ? (
              <button
                onClick={handleLogin}
                className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-3 text-lg shadow-lg"
              >
                <Github className="w-6 h-6" />
                Login with GitHub
              </button>
            ) : (
              <div className="w-full text-left">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    {user.avatar_url && (
                      <img src={user.avatar_url} alt={user.login} className="w-10 h-10 rounded-full border border-slate-700" referrerPolicy="no-referrer" />
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-white">{user.name || user.login}</h3>
                      <p className="text-sm text-slate-400">Select a repository to analyze</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    Logout
                  </button>
                </div>

                {isLoadingRepos ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {repositories.map((repo) => (
                      <button
                        key={repo.id}
                        onClick={() => handleGithubAudit(repo.html_url)}
                        disabled={isAnalyzing}
                        className="flex flex-col items-start p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 hover:border-emerald-500/50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <div className="flex items-center gap-2 mb-2 w-full">
                          <Github className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                          <span className="font-bold text-slate-200 truncate">{repo.name}</span>
                        </div>
                        {repo.description && (
                          <p className="text-sm text-slate-400 line-clamp-2 mb-3">{repo.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-auto text-xs text-slate-500">
                          {repo.language && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                              {repo.language}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            {repo.stargazers_count}
                          </span>
                        </div>
                      </button>
                    ))}
                    {repositories.length === 0 && (
                      <div className="col-span-2 text-center py-8 text-slate-500">
                        No repositories found.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-4 w-full my-4">
              <div className="h-px bg-slate-800 flex-1"></div>
              <span className="text-sm text-slate-500 font-medium">OR</span>
              <div className="h-px bg-slate-800 flex-1"></div>
            </div>

            <div className="flex flex-col sm:flex-row w-full gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Github className="w-5 h-5 text-slate-500" />
                </div>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="Enter GitHub Repo URL manually..."
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors text-base"
                />
              </div>
              <button
                onClick={() => handleGithubAudit(repoUrl)}
                disabled={isAnalyzing || !repoUrl}
                className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base whitespace-nowrap"
              >
                {isAnalyzing ? 'Scanning...' : 'Start Audit'}
                {!isAnalyzing && <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.html,.css,.json,.rb,.go,.rs,.php"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm">Or upload your project files directly</span>
            </button>

            {error && (
              <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm w-full">
                {error}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0A0A0B] text-slate-200 overflow-hidden selection:bg-emerald-500/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800/50 bg-[#0A0A0B] flex flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <LayoutDashboard className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">
              Portfolio<span className="text-emerald-400">Path</span>
            </span>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-sm" 
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-emerald-400" : "text-slate-500")} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/50">
          <a 
            href="https://github.com/AlbertCJC/PortfolioPath" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50"
          >
            <Github className="w-4 h-4" />
            View Source
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Background Gradients */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px]" />
        </div>

        {/* Analyze New Code Button */}
        <div className="absolute top-6 right-8 z-50">
          <button 
            onClick={() => setIsHome(true)}
            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Code className="w-4 h-4" />
            Analyze New Code
          </button>
        </div>

        <div className="relative z-10 p-8 md:p-12 min-h-full flex flex-col pt-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + (isAnalyzing ? '-loading' : '')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default App;
