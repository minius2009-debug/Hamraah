import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Thermometer, Wind, Droplets } from 'lucide-react';
import { motion } from 'motion/react';

export const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<{
    temp: number;
    condition: string;
    humidity: number;
    wind: number;
    description: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulated weather fetch for Chitral
  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      // In a real app, you'd use your OpenWeather API key via server proxy
      // For this demo, we'll simulate a realistic Chitral weather pattern
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const conditions = ['Sunny', 'Partly Cloudy', 'Clear Skies', 'Light Snow'];
      const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
      
      setWeather({
        temp: Math.floor(Math.random() * (15 - (-5))) + (-5), // -5 to 15 degrees
        condition: randomCondition,
        humidity: Math.floor(Math.random() * 60) + 20,
        wind: Math.floor(Math.random() * 20) + 5,
        description: 'Chitral, KP'
      });
      setLoading(false);
    };

    fetchWeather();
  }, []);

  const getWeatherIcon = (condition: string) => {
    if (condition.includes('Sun') || condition.includes('Clear')) return <Sun className="text-orange-400" size={32} />;
    if (condition.includes('Rain')) return <CloudRain className="text-blue-400" size={32} />;
    return <Cloud className="text-slate-400" size={32} />;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-6 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-1/3 mb-4" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
          <div className="space-y-2">
            <div className="h-6 bg-slate-100 rounded w-16" />
            <div className="h-3 bg-slate-100 rounded w-24" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-teal text-xs uppercase tracking-widest">Live Weather</h3>
        <span className="text-[10px] font-bold text-slate-400">{weather?.description}</span>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center">
          {weather && getWeatherIcon(weather.condition)}
        </div>
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-teal">{weather?.temp}</span>
            <span className="text-lg font-bold text-teal/40">°C</span>
          </div>
          <p className="text-sm font-bold text-slate-500">{weather?.condition}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-2">
          <Droplets size={14} className="text-blue-400" />
          <span className="text-[10px] font-black text-teal uppercase">{weather?.humidity}% Hum</span>
        </div>
        <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-2">
          <Wind size={14} className="text-emerald-400" />
          <span className="text-[10px] font-black text-teal uppercase">{weather?.wind} km/h</span>
        </div>
      </div>
    </motion.div>
  );
};
