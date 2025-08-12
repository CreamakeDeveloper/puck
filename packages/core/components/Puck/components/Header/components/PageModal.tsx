import React, { useState, useMemo } from "react";
import { Globe, AlertCircle } from "lucide-react";
import { getClassNameFactory } from "../../../../../lib";
import { Button } from "../../../../Button";
import { Page, Language } from "../types";
import styles from "../styles.module.css";

const getClassName = getClassNameFactory("PuckHeader", styles);

interface PageModalProps {
  modalOpen: boolean;
  editingPage: Page | null;
  newPage: Omit<Page, 'id'>;
  languages: Language[];
  existingPages?: Page[]; // Mevcut sayfalar slug kontrolü için
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
  existingPages = [],
  onClose,
  onSave,
  onPageChange,
  onNewPageChange,
}) => {
  const [showSlugError, setShowSlugError] = useState(false);

  if (!modalOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Slug normalizasyonu (Türkçe karakterler vs.)
  const normalizeSlug = (slug: string): string => {
    return slug
      .toLowerCase()
      .trim()
      .replace(/[çğıöşü]/g, (char) => {
        const map: Record<string, string> = {
          'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u'
        };
        return map[char] || char;
      })
      .replace(/[^a-z0-9-/]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Slug çakışması kontrolü
  const currentSlug = editingPage ? editingPage.slug : newPage.slug;
  const normalizedCurrentSlug = normalizeSlug(currentSlug || '');
  
  const slugConflict = useMemo(() => {
    if (!currentSlug) return false;
    
    const normalized = normalizeSlug(currentSlug);
    
    return existingPages.some(page => {
      // Düzenleme modunda kendi sayfasını hariç tut
      if (editingPage && page.id === editingPage.id) return false;
      
      const pageSlug = normalizeSlug(page.slug || '');
      return pageSlug === normalized || 
             (pageSlug === '' && normalized === '') ||
             (pageSlug === '/' && normalized === '') ||
             (pageSlug === '' && normalized === '/');
    });
  }, [currentSlug, existingPages, editingPage]);

  // Kaydet butonu durumu
  const canSave = useMemo(() => {
    const title = editingPage ? editingPage.title : newPage.title;
    return title.trim() !== '' && !slugConflict;
  }, [editingPage, newPage, slugConflict]);

  const handleSave = () => {
    if (slugConflict) {
      setShowSlugError(true);
      return;
    }
    setShowSlugError(false);
    onSave();
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
              onChange={(e) => {
                if (editingPage) {
                  onPageChange({ ...editingPage, title: e.target.value });
                } else {
                  onNewPageChange({ ...newPage, title: e.target.value });
                }
              }}
              placeholder="Sayfa başlığı"
              className={getClassName("input")}
            />
          </div>
          
          <div className={getClassName("formGroup")}>
            <label>Slug</label>
            <input
              type="text"
              value={editingPage ? editingPage.slug : newPage.slug}
              onChange={(e) => {
                setShowSlugError(false); // Kullanıcı değiştirince hatayı gizle
                if (editingPage) {
                  onPageChange({ ...editingPage, slug: e.target.value });
                } else {
                  onNewPageChange({ ...newPage, slug: e.target.value });
                }
              }}
              placeholder="Sayfa Slug"
              className={`${getClassName("input")} ${slugConflict ? getClassName("inputError") : ""}`}
              style={{
                borderColor: slugConflict ? "var(--puck-color-red-05)" : undefined
              }}
            />
            {slugConflict && (
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "4px", 
                color: "var(--puck-color-red-05)", 
                fontSize: "12px", 
                marginTop: "4px" 
              }}>
                <AlertCircle size={12} />
                <span>Bu slug zaten kullanılıyor. Farklı bir slug seçin.</span>
              </div>
            )}
            <small style={{ color: "var(--puck-color-grey-05)", fontSize: "12px", marginTop: "4px" }}>
              Örnek: hakkimizda veya /hakkimizda. Boşsa "/" (ana sayfa).
            </small>
          </div>
          
          <div className={getClassName("formGroup")}>
            <label>Dil</label>
            <select
              value={editingPage ? (editingPage.languageId || '') : (newPage.languageId || '')}
              onChange={(e) => {
                const value = e.target.value || undefined;
                if (editingPage) {
                  onPageChange({ ...editingPage, languageId: value });
                } else {
                  onNewPageChange({ ...newPage, languageId: value });
                }
              }}
              className={getClassName("input")}
            >
              <option value="">Dil Seçin</option>
              {languages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name} {lang.isDefault ? '(Varsayılan)' : ''}
                </option>
              ))}
            </select>
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
            onClick={handleSave}
            icon={<Globe size="14px" />}
            type="button"
            variant="primary"
            disabled={!canSave}
          >
            {editingPage ? 'Güncelle' : 'Kaydet'}
          </Button>
        </div>
      </div>
    </div>
  );
};