import { useLocale } from '../../lib/locale';

export default function LanguageSwitch({ className = '' }) {
  const { language, setLanguage } = useLocale();

  return (
    <div className={`inline-flex items-center rounded-xl border border-white/10 bg-surfaceSoft p-1 ${className}`}>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors ${
          language === 'en' ? 'bg-primary text-black' : 'text-textMuted'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('am')}
        className={`h-8 px-3 rounded-lg text-xs font-semibold transition-colors ${
          language === 'am' ? 'bg-primary text-black' : 'text-textMuted'
        }`}
      >
        አማ
      </button>
    </div>
  );
}
