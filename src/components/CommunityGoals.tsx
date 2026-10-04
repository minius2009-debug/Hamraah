import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Target, Users, Hourglass, TrendingUp } from 'lucide-react';

export const CommunityGoals: React.FC = () => {
  const [goals, setGoals] = useState<{
    total_hours_goal: number;
    hours_completed: number;
    volunteers: number;
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await fetch('/api/ai/community-goals');
        if (!response.ok) throw new Error('API limit reached');
        const data = await response.json();
        setGoals(data);
      } catch (error) {
        console.error('Error fetching goals:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchGoals();
  }, []);

  if (loading) {
    return (
      <div className="bg-teal p-6 rounded-[32px] shadow-lg shadow-teal/10 mb-6 animate-pulse">
        <div className="h-4 bg-white/20 rounded w-1/2 mb-6" />
        <div className="h-2 bg-white/10 rounded-full w-full mb-2" />
        <div className="h-2 bg-white/10 rounded-full w-2/3" />
      </div>
    );
  }

  if (error || !goals) {
    return (
      <div className="bg-teal p-6 rounded-[32px] shadow-lg shadow-teal/10 mb-6 text-white/50 text-xs italic text-center">
        Community goals are currently being calculated...
      </div>
    );
  }

  const progress = goals ? Math.min(100, (goals.hours_completed / goals.total_hours_goal) * 100) : 0;

  return (
    <div className="bg-teal p-6 rounded-[32px] shadow-lg shadow-teal/10 mb-6 text-white relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-sm uppercase tracking-widest flex items-center gap-2">
            <Target size={16} />
            Community Goals
          </h3>
          <TrendingUp size={20} className="text-emerald-400" />
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-end mb-2">
            <div>
              <span className="text-3xl font-black">{goals?.hours_completed}</span>
              <span className="text-sm font-bold opacity-60 ml-1">/ {goals?.total_hours_goal}h</span>
            </div>
            <span className="text-xs font-black bg-white/20 px-2 py-1 rounded-lg">
              {Math.round(progress)}%
            </span>
          </div>
          
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest mb-4">
          <div className="flex items-center gap-1.5">
            <Users size={12} />
            {goals?.volunteers} Volunteers
          </div>
          <div className="w-1 h-1 bg-white/20 rounded-full" />
          <div className="flex items-center gap-1.5">
            <Hourglass size={12} />
            Weekly Cycle
          </div>
        </div>

        <p className="text-xs font-medium text-emerald-100 italic">
          "{goals?.message}"
        </p>
      </div>

      {/* Decorative background element */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
    </div>
  );
};
