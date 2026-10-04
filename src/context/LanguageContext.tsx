import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'khw' | 'ur';

interface Translations {
  [key: string]: {
    [key in Language]: string;
  };
}

export const translations: Translations = {
  // Navigation
  nav_services: { en: 'Services', khw: 'خدمات', ur: 'خدمات' },
  nav_dashboard: { en: 'Dashboard', khw: 'ڈیش بورڈ', ur: 'ڈیش بورڈ' },
  nav_bookings: { en: 'Bookings', khw: 'بکنگ', ur: 'بکنگ' },
  nav_updates: { en: 'Updates', khw: 'اپڈیٹس', ur: 'تازہ ترین' },
  nav_emergency: { en: 'Emergency', khw: 'ہنگامی', ur: 'ہنگامی' },
  nav_profile: { en: 'Profile', khw: 'پروفائل', ur: 'پروفائل' },
  nav_support: { en: 'Support', khw: 'سپورٹ', ur: 'سپورٹ' },
  nav_admin: { en: 'Admin', khw: 'ایڈمن', ur: 'ایڈمن' },
  
  // Home Screen
  welcome_msg: { en: 'Assalam-o-Alaikum,', khw: 'اسلام علیکم،', ur: 'اسلام علیکم،' },
  hero_subtitle: { en: 'Find the right companion for your needs in Chitral.', khw: 'چترال میں اپنی ضروریات کے لیے صحیح ساتھی تلاش کریں۔', ur: 'چترال میں اپنی ضروریات کے لیے درست ساتھی تلاش کریں۔' },
  service_categories: { en: 'Service Categories', khw: 'خدمات کے زمرے', ur: 'سروس کیٹیگریز' },
  how_it_works: { en: 'How Hamraah Works', khw: 'ہمراہ کیسے کام کرتا ہے؟', ur: 'ہمراہ کیسے کام کرتا ہے؟' },
  step_1: { en: 'Post your service need as a Service Taker.', khw: 'سروس لینے والے کے طور پر اپنی ضرورت پوسٹ کریں۔', ur: 'سروس لینے والے کے طور پر اپنی ضرورت پوسٹ کریں۔' },
  step_2: { en: 'Service Providers bid and negotiate the best price.', khw: 'سروس فراہم کرنے والے بولی لگاتے ہیں اور بہترین قیمت طے کرتے ہیں۔', ur: 'سروس فراہم کرنے والے بولی لگاتے ہیں اور بہترین قیمت طے کرتے ہیں۔' },
  step_3: { en: 'Accept a professional, chat live, and pay after completion.', khw: 'پیشہ ور کو قبول کریں، لائیو چیٹ کریں، اور کام مکمل ہونے کے بعد ادائیگی کریں۔', ur: 'پیشہ ور کو قبول کریں، لائیو چیٹ کریں، اور کام مکمل ہونے کے بعد ادائیگی کریں۔' },
  ai_matching: { en: 'New: AI-powered Professional Job Briefs for better matching!', khw: 'نیا: بہتر میچنگ کے لیے AI سے چلنے والے پیشہ ورانہ جاب بریف!', ur: 'نیا: بہتر میچنگ کے لیے AI سے چلنے والے پیشہ ورانہ جاب بریف!' },
  faq_title: { en: 'Frequently Asked Questions', khw: 'اکثر پوچھے گئے سوالات', ur: 'اکثر پوچھے گئے سوالات' },
  faq_ask_placeholder: { en: 'Ask anything about Chitral services...', khw: 'چترال کی خدمات کے بارے میں کچھ بھی پوچھیں...', ur: 'چترال کی خدمات کے بارے میں کچھ بھی پوچھیں...' },

  // Profile Screen
  language: { en: 'Language', khw: 'زبان', ur: 'زبان' },
  referral_points: { en: 'Community Points', khw: 'کمیونٹی پوائنٹس', ur: 'کمیونٹی پوائنٹس' },
  referral_code: { en: 'Your Referral Code', khw: 'آپ کا ریفرل کوڈ', ur: 'آپ کا ریفرل کوڈ' },
  invite_friends: { en: 'Invite friends to earn points!', khw: 'پوائنٹس حاصل کرنے کے لیے دوستوں کو مدعو کریں!', ur: 'پوائنٹس حاصل کرنے کے لیے دوستوں کو مدعو کریں!' },
  delete_account: { en: 'DELETE ACCOUNT PERMANENTLY', khw: 'اکاؤنٹ ہمیشہ کے لیے ختم کریں', ur: 'اکاؤنٹ مستقل طور پر حذف کریں' },
  danger_zone: { en: 'Danger Zone', khw: 'خطرناک زون', ur: 'خطرناک علاقہ' },
  delete_warning: { en: 'This will permanently remove your profile, ratings, and all history. This action cannot be undone.', khw: 'یہ آپ کے پروفائل، ریٹنگز اور تمام ہسٹری کو مستقل طور پر ختم کر دے گا۔ یہ عمل واپس نہیں لیا جا سکتا۔', ur: 'یہ مستقل طور پر آپ کا پروفائل، ریٹنگز اور تمام ہسٹری حذف کر دے گا۔ یہ عمل واپس نہیں لیا جا سکتا۔' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('hamrah_lang') as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('hamrah_lang', language);
    document.documentElement.dir = language === 'ur' || language === 'khw' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div dir={language === 'ur' || language === 'khw' ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
