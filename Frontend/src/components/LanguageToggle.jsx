import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageToggle = () => {
  const { i18n } = useTranslation();
  const isHindi = i18n.language === 'hi';

  const switchLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
  };

  return (
    <div className="inline-flex items-center rounded-full border border-[#1B3A6F]/20 overflow-hidden shadow-sm" style={{ transition: 'all 200ms ease' }}>
      <button
        onClick={() => switchLanguage('en')}
        className={`px-3 py-1.5 text-xs font-bold tracking-wide transition-all duration-200 ${
          !isHindi
            ? 'bg-[#1B3A6F] text-white'
            : 'bg-white text-[#6B7280] hover:bg-[#EEF2F7]'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => switchLanguage('hi')}
        className={`px-3 py-1.5 text-xs font-bold tracking-wide transition-all duration-200 ${
          isHindi
            ? 'bg-[#1B3A6F] text-white'
            : 'bg-white text-[#6B7280] hover:bg-[#EEF2F7]'
        }`}
      >
        हिंदी
      </button>
    </div>
  );
};

export default LanguageToggle;
