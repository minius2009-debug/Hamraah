import React from 'react';
import { motion } from 'motion/react';
import { Phone, AlertTriangle, Shield, HeartPulse, Flame, Siren } from 'lucide-react';

const EMERGENCY_CONTACTS = [
  { id: 1, name: 'Rescue 1122', phone: '1122', icon: Siren, color: 'bg-red-500', description: 'General medical and accident emergencies.' },
  { id: 2, name: 'Police', phone: '15', icon: Shield, color: 'bg-blue-600', description: 'For security and law enforcement matters.' },
  { id: 3, name: 'Fire Brigade', phone: '16', icon: Flame, color: 'bg-orange-500', description: 'Fire related emergencies.' },
  { id: 4, name: 'DHQ Hospital Chitral', phone: '0943-412214', icon: HeartPulse, color: 'bg-emerald-500', description: 'Main District Headquarters hospital.' },
  { id: 5, name: 'Disaster Management', phone: '0943-412151', icon: AlertTriangle, color: 'bg-amber-500', description: 'Natural disasters or road blockages.' },
];

export const EmergencyScreen: React.FC = () => {
  return (
    <div className="pb-24 px-4 pt-4">
      <div className="bg-red-500 rounded-3xl p-6 mb-8 text-white shadow-xl shadow-red-500/20">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <AlertTriangle size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Emergency Hub</h2>
            <p className="text-sm opacity-80">Immediate help at your fingertips.</p>
          </div>
        </div>
        <p className="text-sm font-medium leading-relaxed">
          Quick access to all essential emergency services in Chitral. Tap any card to call directly.
        </p>
      </div>

      <div className="space-y-4">
        {EMERGENCY_CONTACTS.map((contact, index) => {
          const Icon = contact.icon;
          return (
            <motion.a
              key={contact.id}
              href={`tel:${contact.phone}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow active:scale-95"
            >
              <div className={`w-14 h-14 ${contact.color} rounded-2xl flex items-center justify-center text-white shrink-0`}>
                <Icon size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-teal text-lg leading-tight">{contact.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-1 mb-1">{contact.description}</p>
                <p className="text-sm font-bold text-crimson">{contact.phone}</p>
              </div>
              <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 shrink-0">
                <Phone size={18} />
              </div>
            </motion.a>
          );
        })}
      </div>

      <div className="mt-10 p-6 bg-slate-50 rounded-3xl border border-slate-100">
        <h4 className="font-bold text-teal mb-2">Important Note</h4>
        <p className="text-xs text-slate-500 leading-relaxed">
          While we strive to keep these numbers updated, please note that network availability in certain parts of Chitral may affect connectivity. Always have local community elders' contacts for remote areas.
        </p>
      </div>
    </div>
  );
};
