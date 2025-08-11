import React from "react";
import { Globe } from "lucide-react";
import { getClassNameFactory } from "../../../../../lib";
import { Button } from "../../../../Button";
import { Language } from "../types";
import styles from "../styles.module.css";

const getClassName = getClassNameFactory("PuckHeader", styles);

interface LanguageModalProps {
  languageModalOpen: boolean;
  editingLanguage: Language | null;
  newLanguage: Omit<Language, 'id'>;
  onClose: () => void;
  onSave: () => void;
  onLanguageChange: (language: Language) => void;
  onNewLanguageChange: (language: Omit<Language, 'id'>) => void;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({
  languageModalOpen,
  editingLanguage,
  newLanguage,
  onClose,
  onSave,
  onLanguageChange,
  onNewLanguageChange,
}) => {
  if (!languageModalOpen) return null;

  return (
    <div className={getClassName("modal")}>
      <div className={getClassName("modalContent")}>
        <div className={getClassName("modalHeader")}>
          <h3>{editingLanguage ? 'Dil Düzenle' : 'Yeni Dil Ekle'}</h3>
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
            <label>Dil Adı</label>
            <input
              type="text"
              value={editingLanguage ? editingLanguage.name : newLanguage.name}
              onChange={(e) => {
                if (editingLanguage) {
                  onLanguageChange({ ...editingLanguage, name: e.target.value });
                } else {
                  onNewLanguageChange({ ...newLanguage, name: e.target.value });
                }
              }}
              placeholder="Türkçe"
              className={getClassName("input")}
            />
          </div>
          
          <div className={getClassName("formGroup")}>
            <label>Dil Kodu</label>
            <input
              type="text"
              value={editingLanguage ? editingLanguage.code : newLanguage.code}
              onChange={(e) => {
                if (editingLanguage) {
                  onLanguageChange({ ...editingLanguage, code: e.target.value });
                } else {
                  onNewLanguageChange({ ...newLanguage, code: e.target.value });
                }
              }}
              placeholder="tr"
              className={getClassName("input")}
            />
          </div>
          
          <div className={getClassName("formGroup")}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={editingLanguage ? (editingLanguage.isDefault ?? false) : (newLanguage.isDefault ?? false)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  if (editingLanguage) {
                    onLanguageChange({ ...editingLanguage, isDefault: checked });
                  } else {
                    onNewLanguageChange({ ...newLanguage, isDefault: checked });
                  }
                }}
              />
              Varsayılan Dil
            </label>
          </div>

          <div className={getClassName("formGroup")}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={editingLanguage ? (editingLanguage.isActive ?? true) : (newLanguage.isActive ?? true)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  if (editingLanguage) {
                    onLanguageChange({ ...editingLanguage, isActive: checked });
                  } else {
                    onNewLanguageChange({ ...newLanguage, isActive: checked });
                  }
                }}
              />
              Aktif
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
            {editingLanguage ? 'Güncelle' : 'Kaydet'}
          </Button>
        </div>
      </div>
    </div>
  );
};