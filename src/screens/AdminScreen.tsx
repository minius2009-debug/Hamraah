import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Megaphone, 
  Users, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  Search,
  MoreVertical,
  Filter
} from 'lucide-react';

interface CivicIssue {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'resolved' | 'archived';
  category: string;
  upvotes: number;
  author: string;
  createdAt: string;
}

export const AdminScreen: React.FC = () => {
  const [issues, setIssues] = useState<CivicIssue[]>([
    {
      id: '1',
      title: 'Water Scarcity in Denin',
      description: 'Residents haven\'t had clean water supply for 3 days.',
      status: 'active',
      category: 'Utilities',
      upvotes: 245,
      author: 'Ahmad Khan',
      createdAt: '2026-10-01'
    },
    {
      id: '2',
      title: 'Broken Bridge near Ayun',
      description: 'The main crossing bridge is damaged after recent rains.',
      status: 'pending',
      category: 'Infrastructure',
      upvotes: 189,
      author: 'Sher Ali',
      createdAt: '2026-10-02'
    },
    {
      id: '3',
      title: 'Waste Management in Main Bazaar',
      description: 'Garbage collection has been irregular, causing hygiene issues.',
      status: 'active',
      category: 'Sanitation',
      upvotes: 120,
      author: 'Fatima Bibi',
      createdAt: '2026-09-30'
    }
  ]);

  const stats = [
    { label: 'Active Issues', value: '12', icon: Megaphone, color: 'text-crimson' },
    { label: 'Total Users', value: '5,240', icon: Users, color: 'text-teal' },
    { label: 'Verified Providers', value: '142', icon: ShieldCheck, color: 'text-emerald-500' },
    { label: 'Pending Approvals', value: '8', icon: AlertTriangle, color: 'text-gold' }
  ];

  return (
    <div className="p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-black text-teal mb-2">Admin Dashboard</h1>
        <p className="text-slate-500">Manage community advocacy, verify providers, and monitor platform activity.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm"
            >
              <div className={`${stat.color} mb-4`}>
                <Icon size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-teal">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Issues Management Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-teal">Civic Advocacy (Protests)</h2>
          <div className="flex gap-2">
            <button className="p-2 bg-slate-50 rounded-xl text-slate-500 hover:bg-slate-100">
              <Filter size={18} />
            </button>
            <button className="p-2 bg-slate-50 rounded-xl text-slate-500 hover:bg-slate-100">
              <Search size={18} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Issue</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Upvotes</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {issues.map((issue) => (
                <tr key={issue.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-teal">{issue.title}</p>
                    <p className="text-xs text-slate-500 truncate max-w-[200px]">{issue.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black px-2 py-1 bg-slate-100 rounded-lg text-slate-500">
                      {issue.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-emerald-500 font-bold">
                      <TrendingUp size={14} />
                      {issue.upvotes}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-1.5 text-xs font-bold ${
                      issue.status === 'active' ? 'text-crimson' : 
                      issue.status === 'resolved' ? 'text-emerald-500' : 'text-gold'
                    }`}>
                      {issue.status === 'active' ? <AlertTriangle size={14} /> : 
                       issue.status === 'resolved' ? <CheckCircle2 size={14} /> : <HourglassIcon />}
                      <span className="capitalize">{issue.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg">
                        <CheckCircle2 size={18} />
                      </button>
                      <button className="p-1.5 text-crimson hover:bg-crimson/5 rounded-lg">
                        <XCircle size={18} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Provider Verification Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-black text-teal">Provider Verification</h2>
        <div className="bg-gold/10 p-6 rounded-[32px] border border-gold/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gold shadow-sm">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="font-bold text-teal">8 Pending Verifications</p>
              <p className="text-xs text-teal/60 font-medium">New professionals waiting for profile approval.</p>
            </div>
          </div>
          <button className="bg-teal text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-teal/20">
            Review Queue
          </button>
        </div>
      </section>
    </div>
  );
};

const HourglassIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 2h14"/><path d="M5 22h14"/><path d="M19 2l-7 7-7-7"/><path d="M5 22l7-7 7 7"/></svg>
);
