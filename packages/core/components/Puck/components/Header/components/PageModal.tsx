import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Globe, ChevronDown } from "lucide-react";
import { getClassNameFactory } from "../../../../../lib";
import { Button } from "../../../../Button";
import { Page, Language } from "../types";
import { renderFlagIcon, getFlagClass } from "../utils/languageUtils";
import styles from "../styles.module.css";

const getClassName = getClassNameFactory("PuckHeader", styles);

interface PageModalProps {
  modalOpen: boolean;
  editingPage: Page | null;
  newPage: Omit<Page, 'id'>;
  languages: Language[];
  onClose: () => void;
  onSave: () => void;
  onPageChange: (page: Page) => void;
  onNewPageChange: (page: Omit<Page, 'id'>) => void;
}

export const PageModal: React.FC<PageModalProps> = ({
  modalOpen,
  editingPage,
  newPage,
  languages,
  onClose,
  onSave,
  onPageChange,
  onNewPageChange,
}) => {
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Başlıktan slug oluşturma fonksiyonu - "/" ile başlayacak şekilde
  const generateSlug = (title: string): string => {
    if (!title.trim()) return '/';
    
    const slug = title
      .toLowerCase()
      .trim()
      // Türkçe karakterleri değiştir
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      // Özel karakterleri ve boşlukları tire ile değiştir
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    // "/" ile başlayacak şekilde döndür
    return slug ? `/${slug}` : '/';
  };

  // Başlık değiştiğinde slug'ı otomatik güncelle
  const handleTitleChange = (title: string) => {
    if (editingPage) {
      onPageChange({ ...editingPage, title });
      // Yeni sayfa eklerken slug'ı otomatik güncelle
      if (!editingPage.id) {
        const newSlug = generateSlug(title);
        onPageChange({ ...editingPage, title, slug: newSlug });
      }
    } else {
      onNewPageChange({ ...newPage, title });
      // Yeni sayfa eklerken slug'ı otomatik güncelle
      const newSlug = generateSlug(title);
      onNewPageChange({ ...newPage, title, slug: newSlug });
    }
  };

  // Slug manuel olarak değiştirildiğinde "/" ile başlamasını sağla
  const handleSlugChange = (slug: string) => {
    // "/" ile başlamıyorsa ekle
    let normalizedSlug = slug;
    if (!normalizedSlug.startsWith('/')) {
      normalizedSlug = `/${normalizedSlug}`;
    }
    
    // Boş slug ise "/" yap
    if (normalizedSlug === '/') {
      normalizedSlug = '/';
    }
    
    if (editingPage) {
      onPageChange({ ...editingPage, slug: normalizedSlug });
    } else {
      onNewPageChange({ ...newPage, slug: normalizedSlug });
    }
  };

  // Modal açıldığında slug'ı "/" ile başlat
  useEffect(() => {
    if (modalOpen && !editingPage) {
      // Yeni sayfa için slug'ı "/" ile başlat
      if (!newPage.slug || newPage.slug === '') {
        onNewPageChange({ ...newPage, slug: '/' });
      }
    }
  }, [modalOpen, editingPage, newPage, onNewPageChange]);
  
  // Dropdown dışına tıklayınca kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Dropdown ref'i ve portal içindeki dropdown elementi kontrol et
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        // Portal içindeki dropdown elementini de kontrol et
        const dropdownPortal = document.querySelector('[data-dropdown-portal]');
        if (!dropdownPortal || !dropdownPortal.contains(target)) {
          setLanguageDropdownOpen(false);
        }
      }
    };

    if (languageDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [languageDropdownOpen]);

  // Dropdown pozisyonunu hesapla
  useEffect(() => {
    if (languageDropdownOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [languageDropdownOpen]);
  
  if (!modalOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      // Dropdown açıksa önce onu kapat
      if (languageDropdownOpen) {
        setLanguageDropdownOpen(false);
        return;
      }
      onClose();
    }
  };

  return (
    <div className={getClassName("modal")} onClick={handleBackdropClick}>
      <div className={getClassName("modalContent")}>
        <div className={getClassName("modalHeader")}>
          <h3>{editingPage ? 'Sayfa Düzenle' : 'Yeni Sayfa Ekle'}</h3>
          <button
            className={getClassName("closeButton")}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        
        <div className={getClassName("modalBody")}>
          <div className={getClassName("formGroup")}>
            <label>Başlık</label>
            <input
              type="text"
              value={editingPage ? editingPage.title : newPage.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Sayfa başlığı"
              className={getClassName("input")}
            />
          </div>
          
          <div className={getClassName("formGroup")}>
            <label>Slug</label>
            <input
              type="text"
              value={editingPage ? editingPage.slug : newPage.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="/sayfa-slug"
              className={getClassName("input")}
            />
            <small style={{ color: "var(--puck-color-grey-05)", fontSize: "12px", marginTop: "4px" }}>
              Slug "/" ile başlamalıdır. Örnek: /hakkimizda. Boşsa "/" (ana sayfa).
            </small>
          </div>
          
          <div className={getClassName("formGroup")}>
            <label>Dil</label>
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className={getClassName("input")}
                onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  background: 'var(--puck-color-white)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {(() => {
                    const currentLanguageId = editingPage ? editingPage.languageId : newPage.languageId;
                    const currentLanguage = languages.find(l => l.id === currentLanguageId);
                    
                    if (currentLanguage) {
                      return (
                        <>
                          {renderFlagIcon(currentLanguage.code)}
                          <span>{currentLanguage.name} {currentLanguage.isDefault ? '(Varsayılan)' : ''}</span>
                        </>
                      );
                    }
                    
                    return <span style={{ color: 'var(--puck-color-grey-05)' }}>Dil Seçin</span>;
                  })()}
                </div>
                <ChevronDown size={16} />
              </button>
              
              {languageDropdownOpen && createPortal(
                <div
                  data-dropdown-portal
                  style={{
                    position: 'fixed',
                    top: dropdownPosition.top,
                    left: dropdownPosition.left,
                    width: dropdownPosition.width,
                    background: 'var(--puck-color-white)',
                    border: '1px solid var(--puck-color-grey-09)',
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    zIndex: 9999,
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}
                >
                  <div
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--puck-color-grey-10)',
                      transition: 'background-color 0.2s'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (editingPage) {
                        onPageChange({ ...editingPage, languageId: undefined });
                      } else {
                        onNewPageChange({ ...newPage, languageId: undefined });
                      }
                      setLanguageDropdownOpen(false);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--puck-color-grey-10)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span style={{ color: 'var(--puck-color-grey-05)' }}>Dil Seçin</span>
                  </div>
                  
                  {languages.map((lang) => (
                    <div
                      key={lang.id}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'background-color 0.2s'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (editingPage) {
                          onPageChange({ ...editingPage, languageId: lang.id });
                        } else {
                          onNewPageChange({ ...newPage, languageId: lang.id });
                        }
                        setLanguageDropdownOpen(false);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--puck-color-grey-10)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {renderFlagIcon(lang.code)}
                      <span>{lang.name} {lang.isDefault ? '(Varsayılan)' : ''}</span>
                    </div>
                  ))}
                </div>,
                document.body
              )}
            </div>
          </div>
          


          <div className={getClassName("formGroup")}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={editingPage ? (editingPage.isActive ?? true) : (newPage.isActive ?? true)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  if (editingPage) {
                    onPageChange({ ...editingPage, isActive: checked });
                  } else {
                    onNewPageChange({ ...newPage, isActive: checked });
                  }
                }}
              />
              Yayın Durumu
            </label>
          </div>
        </div>
        
        <div className={getClassName("modalFooter")}>
          <button
            className={getClassName("cancelButton")}
            onClick={onClose}
            type="button"
          >
            İptal
          </button>
          <Button
            onClick={onSave}
            icon={<Globe size="14px" />}
            type="button"
            variant="primary"
          >
            {editingPage ? 'Güncelle' : 'Kaydet'}
          </Button>
        </div>
      </div>
    </div>
  );
};