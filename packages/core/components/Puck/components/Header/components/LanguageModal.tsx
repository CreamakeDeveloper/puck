import React from "react";
import { Globe } from "lucide-react";
import { getClassNameFactory } from "../../../../../lib";
import { Button } from "../../../../Button";
import styles from "../styles.module.css";

const getClassName = getClassNameFactory("PuckHeader", styles);

// API'den gelen sabit dil tipi
export interface AvailableLanguage {
  id: string;
  name: string;
  code: string;
}

// Site dili tipi
export interface SiteLanguage {
  langCode: string;
  isActive: boolean;
  name: string; // API'den doldurulan dil adı
}

// Site ayarları tipi
export interface SiteSettings {
  defaultLanguage: string;
}

// Dil kodunu (ISO 639-1) bayrak ikonları için ülke koduna (ISO 3166-1 alpha-2) çevirir
const languageCodeToCountry = (code: string): string => {
  if (!code) return 'xx';
  const normalized = code.toLowerCase();

  // Bölgesel kod içeriyorsa (en-US gibi) ülke kodunu kullan
  if (normalized.includes('-')) {
    const parts = normalized.split('-');
    return parts[1] || parts[0];
  }

  const map: Record<string, string> = {
    en: 'gb',
    tr: 'tr',
    de: 'de',
    fr: 'fr',
    es: 'es',
    it: 'it',
    nl: 'nl',
    pt: 'pt',
    'pt-br': 'br',
    pl: 'pl',
    ro: 'ro',
    bg: 'bg',
    ru: 'ru',
    uk: 'ua',
    cs: 'cz',
    sk: 'sk',
    sl: 'si',
    hr: 'hr',
    sr: 'rs',
    hu: 'hu',
    sv: 'se',
    da: 'dk',
    fi: 'fi',
    et: 'ee',
    lv: 'lv',
    lt: 'lt',
    el: 'gr',
    ga: 'ie',
    ar: 'sa',
    he: 'il',
    fa: 'ir',
    hi: 'in',
    ur: 'pk',
    ja: 'jp',
    ko: 'kr',
    zh: 'cn',
    vi: 'vn',
    id: 'id',
    th: 'th',
  };

  return map[normalized] || normalized;
};

const renderFlagIcon = (code: string) => {
  const country = languageCodeToCountry(code);
  return <span className={`fi fi-${country}`} style={{ marginRight: 8 }} />;
};

interface LanguageModalProps {
  languageModalOpen: boolean;
  editingSiteLanguage: SiteLanguage | null;
  availableLanguages: AvailableLanguage[];
  siteLanguages: SiteLanguage[];
  siteSettings: SiteSettings;
  isLoading?: boolean;
  onClose: () => void;
  onAddLanguage: (langCode: string) => Promise<void>;
  onUpdateLanguageStatus: (langCode: string, isActive: boolean) => Promise<void>;
  onRemoveLanguage: (langCode: string) => Promise<void>;
  onSetDefaultLanguage: (langCode: string) => Promise<void>;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({
  languageModalOpen,
  editingSiteLanguage: _editingSiteLanguage,
  availableLanguages,
  siteLanguages,
  siteSettings,
  isLoading = false,
  onClose,
  onAddLanguage,
  onUpdateLanguageStatus,
  onRemoveLanguage,
  onSetDefaultLanguage,
}) => {
  const [selectedLanguageCode, setSelectedLanguageCode] = React.useState<string>('');
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  // Siteye henüz eklenmemiş dilleri filtrele
  const unaddedLanguages = availableLanguages.filter(
    lang => !siteLanguages.some(siteLang => siteLang.langCode === lang.code)
  );

  const handleAction = async (action: string, callback: () => Promise<void>) => {
    setActionLoading(action);
    try {
      await callback();
    } catch (error) {
      console.error(`Hata (${action}):`, error);
    } finally {
      setActionLoading(null);
    }
  };

  if (!languageModalOpen) return null;

  return (
    <div className={getClassName("modal")}>
      <div className={getClassName("modalContent")}>
        <div className={getClassName("modalHeader")}>
          <h3>Dil Yönetimi</h3>
          <button
            className={getClassName("closeButton")}
            onClick={onClose}
            type="button"
            disabled={isLoading || actionLoading !== null}
          >
            ×
          </button>
        </div>
        
        <div className={getClassName("modalBody")}>
          {/* Mevcut Site Dilleri */}
          <div className={getClassName("section")}>
            <h4>Site Dilleri</h4>
            {siteLanguages.length === 0 ? (
              <p className={getClassName("emptyState")}>Henüz site dili eklenmemiş.</p>
            ) : (
              <div className={getClassName("languageList")}>
                {siteLanguages.map((siteLang) => (
                  <div key={siteLang.langCode} className={getClassName("languageItem")}>
                    <div className={getClassName("languageInfo")}>
                      {renderFlagIcon(siteLang.langCode)}
                      <strong>{siteLang.name}</strong>
                      <span className={getClassName("languageCode")}>
                        ({siteLang.langCode})
                      </span>
                      {siteSettings.defaultLanguage === siteLang.langCode && (
                        <span className={getClassName("defaultBadge")}>Varsayılan</span>
                      )}
                    </div>
                    
                    <div className={getClassName("languageActions")}>
                      {/* Aktif/Pasif Toggle */}
                      <label className={getClassName("toggleLabel")}>
                        <input
                          type="checkbox"
                          checked={siteLang.isActive}
                          disabled={
                            siteSettings.defaultLanguage === siteLang.langCode || 
                            actionLoading === `toggle-${siteLang.langCode}`
                          }
                          onChange={(e) => 
                            handleAction(
                              `toggle-${siteLang.langCode}`,
                              () => onUpdateLanguageStatus(siteLang.langCode, e.target.checked)
                            )
                          }
                        />
                        <span>Aktif</span>
                      </label>

                      {/* Varsayılan Yapma */}
                      {siteLang.isActive && siteSettings.defaultLanguage !== siteLang.langCode && (
                        <Button
                          size="medium"
                          variant="secondary"
                          disabled={actionLoading === `default-${siteLang.langCode}`}
                          onClick={() =>
                            handleAction(
                              `default-${siteLang.langCode}`,
                              () => onSetDefaultLanguage(siteLang.langCode)
                            )
                          }
                        >
                          {actionLoading === `default-${siteLang.langCode}` ? 'Ayarlanıyor...' : 'Varsayılan Yap'}
                        </Button>
                      )}

                      {/* Silme */}
                      {siteSettings.defaultLanguage !== siteLang.langCode && (
                        <Button
                          size="medium"
                          variant="secondary"
                          disabled={actionLoading === `remove-${siteLang.langCode}`}
                          onClick={() =>
                            handleAction(
                              `remove-${siteLang.langCode}`,
                              () => onRemoveLanguage(siteLang.langCode)
                            )
                          }
                        >
                          {actionLoading === `remove-${siteLang.langCode}` ? 'Siliniyor...' : 'Sil'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Yeni Dil Ekleme */}
          {unaddedLanguages.length > 0 && (
            <div className={getClassName("section")}>
              <h4>Yeni Dil Ekle</h4>
              <div className={getClassName("addLanguageForm")}>
                {/* Seçilen dilin bayrak önizlemesi */}
                {selectedLanguageCode && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {renderFlagIcon(selectedLanguageCode)}
                  </div>
                )}
                <select
                  value={selectedLanguageCode}
                  onChange={(e) => setSelectedLanguageCode(e.target.value)}
                  className={getClassName("select")}
                  disabled={actionLoading === 'add-language'}
                >
                  <option value="">Dil seçiniz...</option>
                  {unaddedLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name} ({lang.code})
                    </option>
                  ))}
                </select>
                
                <Button
                  disabled={!selectedLanguageCode || actionLoading === 'add-language'}
                  onClick={() =>
                    handleAction('add-language', async () => {
                      await onAddLanguage(selectedLanguageCode);
                      setSelectedLanguageCode('');
                    })
                  }
                  icon={<Globe size="14px" />}
                  variant="primary"
                >
                  {actionLoading === 'add-language' ? 'Ekleniyor...' : 'Ekle'}
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div className={getClassName("modalFooter")}>
          <Button
            onClick={onClose}
            variant="secondary"
            disabled={isLoading || actionLoading !== null}
          >
            Kapat
          </Button>
        </div>
      </div>
    </div>
  );
};