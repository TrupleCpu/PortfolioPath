import React from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Database, 
  Award, 
  Briefcase, 
  CheckCircle2, 
  AlertTriangle,
  Terminal,
  Cpu,
  TrendingUp
} from 'lucide-react';
import { AnalysisResult } from '@/services/gemini';
import { cn } from '@/lib/utils';

interface ReportCardProps {
  data: AnalysisResult;
}

export default function ReportCard({ data }: ReportCardProps) {
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

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Header Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex items-center gap-4"
        >
          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <Terminal className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-mono uppercase tracking-wider">Tech Stack</p>
            <h3 className="text-2xl font-bold text-white">{data.tech_stack.language}</h3>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "backdrop-blur-md border rounded-2xl p-6 flex items-center gap-4",
            getScoreBg(data.code_review.score)
          )}
        >
          <div className="p-3 bg-current/10 rounded-xl border border-current/20">
            <Award className={cn("w-8 h-8", getScoreColor(data.code_review.score))} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-mono uppercase tracking-wider">Quality Score</p>
            <h3 className={cn("text-2xl font-bold", getScoreColor(data.code_review.score))}>
              {data.code_review.score}/100
            </h3>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex items-center gap-4"
        >
          <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <Cpu className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-mono uppercase tracking-wider">Complexity</p>
            <h3 className="text-2xl font-bold text-white font-mono">{data.performance.time_complexity}</h3>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Performance & Code Review */}
        <div className="lg:col-span-2 space-y-8">
          {/* Performance Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-8"
          >
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <Zap className="w-5 h-5 text-yellow-400" />
              Performance Metrics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <p className="text-slate-400 text-xs font-mono mb-1">Time Complexity</p>
                <p className="text-lg font-mono text-emerald-400">{data.performance.time_complexity}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <p className="text-slate-400 text-xs font-mono mb-1">Space Complexity</p>
                <p className="text-lg font-mono text-blue-400">{data.performance.space_complexity}</p>
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
              <p className="text-slate-400 text-xs font-mono mb-2 uppercase tracking-wider">Bottleneck Analysis</p>
              <p className="text-slate-300 leading-relaxed">
                {data.performance.bottleneck_analysis}
              </p>
            </div>
          </motion.div>

          {/* Code Review Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-8"
          >
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Code Review
            </h3>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Strengths</h4>
                <ul className="space-y-2">
                  {data.code_review.positive_observations.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-300">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="h-px bg-slate-800" />

              <div>
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Refactoring Suggestions</h4>
                <ul className="space-y-2">
                  {data.code_review.refactoring_suggestions.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-300">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Career Translation */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-1"
        >
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-1 overflow-hidden h-full">
            <div className="bg-slate-950/50 rounded-xl p-6 h-full flex flex-col">
              <div className="mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Career Translation</h3>
                <p className="text-slate-400 text-sm">
                  We've translated your code into professional bullet points for your resume.
                </p>
              </div>

              <div className="space-y-4 flex-1">
                {data.professional_impact.resume_bullets.map((bullet, i) => (
                  <div key={i} className="group relative p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors">
                    <div className="absolute top-4 left-4">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="pl-8 text-slate-300 text-sm leading-relaxed">
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-800">
                <button 
                  onClick={() => navigator.clipboard.writeText(data.professional_impact.resume_bullets.join('\n'))}
                  className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  Copy to Clipboard
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
