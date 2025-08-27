import { useState, useCallback, useRef } from "react";
import { Language } from "../types";
import { getLanguages, addLanguage, updateLanguage, deleteLanguage } from "../api";

export const useLanguageManagement = (siteId?: string, themeId?: string, isAdmin?: boolean) => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(null);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [newLanguage, setNewLanguage] = useState<Omit<Language, 'id'>>({
    name: '',
    code: '',
    isDefault: false,
    isActive: true,
  });
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [languageSearchTerm, setLanguageSearchTerm] = useState('');
  const languageInitializedRef = useRef<boolean>(false);

  const loadLanguages = useCallback(async () => {
    const languagesData = await getLanguages(siteId, themeId, isAdmin);
    setLanguages(languagesData);

    // Varsayılan dili sadece ilk yüklemede ata. Kullanıcı "Tüm Diller" (null) seçerse
    // sonraki yüklemelerde varsayılanla ezilmesin.
    if (!languageInitializedRef.current) {
      const defaultLanguage = languagesData.find((lang) => lang.isDefault);
      if (defaultLanguage) {
        setSelectedLanguageId(defaultLanguage.id);
      }
      languageInitializedRef.current = true;
    }
  }, [siteId, themeId]);

  const handleAddLanguage = useCallback(async () => {
    if (!newLanguage.name || !newLanguage.code) return;

    const duplicateName = languages.some(
      (l) => l.name.trim().toLowerCase() === newLanguage.name.trim().toLowerCase()
    );
    const duplicateCode = languages.some(
      (l) => l.code.trim().toLowerCase() === newLanguage.code.trim().toLowerCase()
    );
    if (duplicateName || duplicateCode) {
      window.alert(
        duplicateCode
          ? 'Aynı kod ile bir dil zaten mevcut.'
          : 'Aynı isim ile bir dil zaten mevcut.'
      );
      return;
    }

    try {
      const result = await addLanguage(newLanguage, siteId, themeId, isAdmin);
      if (result) {
        await loadLanguages();
        setNewLanguage({ name: '', code: '', isDefault: false, isActive: true });
        setLanguageModalOpen(false);
      }
    } catch (e: any) {
      window.alert(e?.message || 'Dil eklenemedi');
    }
  }, [newLanguage, loadLanguages, languages, siteId, themeId, isAdmin]);

  const handleUpdateLanguage = useCallback(async () => {
    if (!editingLanguage) return;
    
    const result = await updateLanguage(editingLanguage.id, editingLanguage, siteId, themeId, isAdmin);
    if (result) {
      await loadLanguages();
      setEditingLanguage(null);
      setLanguageModalOpen(false);
    }
  }, [editingLanguage, loadLanguages, siteId, themeId, isAdmin]);

  const handleDeleteLanguage = useCallback(async (id: string) => {
    if (!confirm('Bu dili silmek istediğinizden emin misiniz?')) return;
    
    const success = await deleteLanguage(id, siteId, themeId, isAdmin);
    if (success) {
      await loadLanguages();
    }
  }, [loadLanguages, siteId, themeId, isAdmin]);

  const filteredLanguages = languages.filter(l => 
    l.name.toLowerCase().includes(languageSearchTerm.toLowerCase()) || 
    l.code.toLowerCase().includes(languageSearchTerm.toLowerCase())
  );

  return {
    languages,
    filteredLanguages,
    selectedLanguageId,
    editingLanguage,
    newLanguage,
    languageModalOpen,
    languageDropdownOpen,
    languageSearchTerm,
    loadLanguages,
    handleAddLanguage,
    handleUpdateLanguage,
    handleDeleteLanguage,
    setSelectedLanguageId,
    setEditingLanguage,
    setNewLanguage,
    setLanguageModalOpen,
    setLanguageDropdownOpen,
    setLanguageSearchTerm,
  };
};