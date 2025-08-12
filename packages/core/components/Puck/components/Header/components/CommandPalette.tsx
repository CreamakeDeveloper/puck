import React from "react";
import { Search, Plus, FileText, Edit, Trash } from "lucide-react";
import { getClassNameFactory } from "../../../../../lib";
import { Page, Language } from "../types";
import { getFlagEmoji } from "../utils/languageUtils";
import styles from "../styles.module.css";

const getClassName = getClassNameFactory("PuckHeader", styles);

interface CommandPaletteProps {
  dropdownOpen: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredPages: Page[];
  languages: Language[];
  currentPageId: string | null;
  onSelectPage: (id: string) => void;
  onEditPage: (page: Page) => void;
  onDeletePage: (id: string) => void;
  onAddNewPage: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  dropdownOpen,
  searchTerm,
  setSearchTerm,
  filteredPages,
  languages,
  currentPageId,
  onSelectPage,
  onEditPage,
  onDeletePage,
  onAddNewPage,
}) => {
  if (!dropdownOpen) return null;

  return (
    <div className={`${getClassName("commandPalette")} ${getClassName("pagesPalette")}`}>
      <div className={getClassName("commandPaletteHeader")}>
        <div className={getClassName("searchBox")}>
          <Search size={16} className={getClassName("searchIcon")} />
          <input
            type="text"
            placeholder="Sayfa ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={getClassName("searchInput")}
            autoFocus
          />
          {searchTerm && (
            <button
              className={getClassName("clearSearch")}
              onClick={() => setSearchTerm('')}
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
            <span>Hızlı İşlemler</span>
          </div>
          <button
            className={getClassName("commandItem")}
            onClick={onAddNewPage}
            type="button"
          >
            <Plus size={16} className={getClassName("commandItemIcon")} />
            <div className={getClassName("commandItemText")}>
              <span className={getClassName("commandItemTitle")}>Yeni Sayfa Oluştur</span>
              <span className={getClassName("commandItemDesc")}>Boş bir sayfa oluşturun</span>
            </div>
            <span className={getClassName("commandItemShortcut")}>Ctrl+N</span>
          </button>
        </div>

        {filteredPages.length > 0 && (
          <div className={getClassName("commandSection")}>
            <div className={getClassName("sectionHeader")}>
              <span>Sayfalar ({filteredPages.length})</span>
            </div>
            {filteredPages.map((page) => (
              <div
                key={page.id}
                className={`${getClassName("commandItem")} ${
                  page.id === currentPageId ? getClassName("commandItem--selected") : ""
                }`}
                onClick={() => onSelectPage(page.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectPage(page.id);
                  }
                }}
              > 
                <FileText size={16} className={getClassName("commandItemIcon")} />
                <div className={getClassName("commandItemText")}>
                  <span className={getClassName("commandItemTitle")}>{page.title}</span>
                  <span className={getClassName("commandItemDesc")}>
                    {page.slug.startsWith('/') ? page.slug : `/${page.slug}`}
                    {page.languageId && (
                      <span style={{ 
                        marginLeft: 8, 
                        fontSize: 12, 
                        color: 'var(--puck-color-grey-06)',
                        background: 'var(--puck-color-grey-10)',
                        padding: '2px 6px',
                        borderRadius: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <span style={{ fontSize: '10px' }}>
                          {getFlagEmoji(languages.find(l => l.id === page.languageId)?.code || '')}
                        </span>
                        {languages.find(l => l.id === page.languageId)?.name || page.languageId}
                      </span>
                    )}
                  </span>
                </div>
                <div className={getClassName("commandItemActions")}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditPage(page);
                    }}
                    className={getClassName("commandActionButton")}
                    type="button"
                    title="Düzenle"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePage(page.id);
                    }}
                    className={`${getClassName("commandActionButton")} ${getClassName("commandActionButton--delete")}`}
                    type="button"
                    title="Sil"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredPages.length === 0 && searchTerm && (
          <div className={getClassName("emptySearchState")}>
            <Search size={24} className={getClassName("emptySearchIcon")} />
            <p className={getClassName("emptySearchText")}>
              &quot;<strong>{searchTerm}</strong>&quot; için sonuç bulunamadı
            </p>
          </div>
        )}

        {filteredPages.length === 0 && !searchTerm && (
          <div className={getClassName("emptyState")}>
            <FileText size={32} className={getClassName("emptyStateIcon")} />
            <p className={getClassName("emptyStateText")}>Henüz sayfa yok</p>
            <p className={getClassName("emptyStateSubtext")}>İlk sayfanızı oluşturmak için Ctrl+N&apos;e basın</p>
          </div>
        )}
      </div>
    </div>
  );
};