import React from "react";
import { Search, Plus, Globe, FileText } from "lucide-react";
import { getClassNameFactory } from "../../../../../lib";
import { Language } from "../types";
import { renderFlagIcon } from "../utils/languageUtils";
import styles from "../styles.module.css";

const getClassName = getClassNameFactory("PuckHeader", styles);

interface LanguagePaletteProps {
  languageDropdownOpen: boolean;
  languageSearchTerm: string;
  setLanguageSearchTerm: (term: string) => void;
  filteredLanguages: Language[];
  selectedLanguageId: string | null;
  onSelectLanguage: (id: string | null) => void;
  onAddNewLanguage: () => void;
}

export const LanguagePalette: React.FC<LanguagePaletteProps> = ({
  languageDropdownOpen,
  languageSearchTerm,
  setLanguageSearchTerm,
  filteredLanguages,
  selectedLanguageId,
  onSelectLanguage,
  onAddNewLanguage,
}) => {
  if (!languageDropdownOpen) return null;

  return (
    <div className={`${getClassName("commandPalette")} ${getClassName("languagePalette")}`}>
      <div className={getClassName("commandPaletteHeader")}>
        <div className={getClassName("searchBox")}>
          <Search size={16} className={getClassName("searchIcon")} />
          <input
            type="text"
            placeholder="Dil ara..."
            value={languageSearchTerm}
            onChange={(e) => setLanguageSearchTerm(e.target.value)}
            className={getClassName("searchInput")}
            autoFocus
          />
          {languageSearchTerm && (
            <button
              className={getClassName("clearSearch")}
              onClick={() => setLanguageSearchTerm('')}
              type="button"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className={getClassName("commandList")}>
        <div className={getClassName("commandSection")}>
          <div className={getClassName("sectionHeader")}>
            <span>İşlemler</span>
          </div>
          <div
            className={getClassName("commandItem")}
            onClick={onAddNewLanguage}
            role="button"
            tabIndex={0}
          >
            <Plus size={16} className={getClassName("commandItemIcon")} />
            <div className={getClassName("commandItemText")}>
              <span className={getClassName("commandItemTitle")}>Yeni Dil Ekle</span>
              <span className={getClassName("commandItemDesc")}>Sisteme yeni bir dil tanımlayın</span>
            </div>
          </div>
        </div>

        <div className={getClassName("commandSection")}>
          <div className={getClassName("sectionHeader")}>
            <span>Diller</span>
          </div>
          {/* Tüm Diller seçeneği */}
          <div
            className={`${getClassName("commandItem")} ${!selectedLanguageId ? getClassName("commandItem--selected") : ''}`}
            onClick={() => onSelectLanguage(null)}
            role="button"
            tabIndex={0}
          >
            <Globe size={16} className={getClassName("commandItemIcon")} />
            <div className={getClassName("commandItemText")}>
              <span className={getClassName("commandItemTitle")}>Tüm Diller</span>
            </div>
          </div>

          {filteredLanguages.map((lang) => (
            <div
              key={lang.id}
              className={`${getClassName("commandItem")} ${selectedLanguageId === lang.id ? getClassName("commandItem--selected") : ''}`}
              onClick={() => onSelectLanguage(lang.id)}
              role="button"
              tabIndex={0}
            >
              {renderFlagIcon(lang.code)}
              <div className={getClassName("commandItemText")}>
                <span className={getClassName("commandItemTitle")}>{lang.name}</span>
                <span className={getClassName("commandItemDesc")}>{lang.code}{lang.isDefault ? ' · Varsayılan' : ''}</span>
              </div>
            </div>
          ))}
        </div>

        {filteredLanguages.length === 0 && !languageSearchTerm && (
          <div className={getClassName("emptyState")}>
            <FileText size={32} className={getClassName("emptyStateIcon")} />
            <p className={getClassName("emptyStateText")}>Henüz dil yok</p>
          </div>
        )}
      </div>
    </div>
  );
};