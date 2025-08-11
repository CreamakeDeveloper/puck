import React from "react";
import { Globe } from "lucide-react";
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
  if (!modalOpen) return null;

  return (
    <div className={getClassName("modal")}>
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
                if (editingPage) {
                  onPageChange({ ...editingPage, slug: e.target.value });
                } else {
                  onNewPageChange({ ...newPage, slug: e.target.value });
                }
              }}
              placeholder="hakkimizda (boş bırakılırsa ana sayfa / olur)"
              className={getClassName("input")}
            />
            <small style={{ color: "var(--puck-color-grey-05)", fontSize: "12px", marginTop: "4px" }}>
              Otomatik olarak başına "/" eklenir. Boş bırakılırsa ana sayfa "/" olur.
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