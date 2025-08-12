// API fonksiyonları
import { Page, Language } from './types';

// Sayfa API fonksiyonları
export const getPages = async (): Promise<Page[]> => {
  try {
    const response = await fetch('/api/pages');
    if (!response.ok) throw new Error('Sayfalar getirilemedi');
    return response.json();
  } catch (error) {
    console.error('Sayfa listesi alınırken hata:', error);
    return [];
  }
};

export const getPage = async (id: string): Promise<Page | null> => {
  try {
    const response = await fetch(`/api/pages/${id}`);
    if (!response.ok) throw new Error('Sayfa getirilemedi');
    return response.json();
  } catch (error) {
    console.error('Sayfa alınırken hata:', error);
    return null;
  }
};

export const addPage = async (page: Omit<Page, 'id'>): Promise<Page | null> => {
  try {
    const response = await fetch('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(page),
    });
    if (!response.ok) {
      let message = 'Sayfa eklenemedi';
      try {
        const err = await response.json();
        message = err?.message || err?.error || message;
      } catch {}
      throw new Error(message);
    }
    return response.json();
  } catch (error) {
    console.error('Sayfa eklenirken hata:', error);
    throw error;
  }
};

export const updatePage = async (id: string, data: Partial<Page>): Promise<Page | null> => {
  try {
    const response = await fetch(`/api/pages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Sayfa güncellenemedi');
    return response.json();
  } catch (error) {
    console.error('Sayfa güncellenirken hata:', error);
    return null;
  }
};

export const deletePage = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/pages/${id}`, {
      method: 'DELETE',
    });
    return response.ok;
  } catch (error) {
    console.error('Sayfa silinirken hata:', error);
    return false;
  }
};

// Dil API fonksiyonları
export const getLanguages = async (): Promise<Language[]> => {
  try {
    // Önce senin site-languages API'ni dene
    const response = await fetch('/api/site-languages');
    if (response.ok) {
      const data = await response.json();
      // Backend formatını frontend formatına çevir
      return data.languages.map((lang: any) => ({
        id: `${lang.code}-id`, // code'dan id oluştur
        name: lang.name,
        code: lang.code,
        isDefault: lang.code === data.defaultLanguage,
        isActive: lang.isActive
      }));
    }
    
    // Fallback: orijinal API
    const fallbackResponse = await fetch('/api/languages');
    if (!fallbackResponse.ok) throw new Error('Diller getirilemedi');
    return fallbackResponse.json();
  } catch (error) {
    console.error('Dil listesi alınırken hata:', error);
    return [];
  }
};

export const addLanguage = async (language: Omit<Language, 'id'>): Promise<Language | null> => {
  try {
    const response = await fetch('/api/languages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(language),
    });
    if (!response.ok) {
      let message = 'Dil eklenemedi';
      try {
        const err = await response.json();
        message = err?.message || err?.error || message;
      } catch {}
      throw new Error(message);
    }
    return response.json();
  } catch (error) {
    console.error('Dil eklenirken hata:', error);
    throw error;
  }
};

export const updateLanguage = async (id: string, data: Partial<Language>): Promise<Language | null> => {
  try {
    const response = await fetch(`/api/languages/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Dil güncellenemedi');
    return response.json();
  } catch (error) {
    console.error('Dil güncellenirken hata:', error);
    return null;
  }
};

export const deleteLanguage = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/languages/${id}`, {
      method: 'DELETE',
    });
    return response.ok;
  } catch (error) {
    console.error('Dil silinirken hata:', error);
    return false;
  }
};

// Özel admin uçları (varsa) için yardımcılar
export const createPagePrivate = async (
  page: Omit<Page, "id">
): Promise<Page | null> => {
  try {
    const response = await fetch("/api/private/create/page", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(page),
    });
    if (!response.ok) throw new Error("Özel uç: sayfa oluşturulamadı");
    return response.json();
  } catch (error) {
    console.warn("/api/private/create/page çağrısı başarısız, /api/pages kullanılacak.", error);
    return null;
  }
};

export const updatePagePrivate = async (
  id: string,
  data: Partial<Page>
): Promise<Page | null> => {
  try {
    const response = await fetch("/api/private/update/page", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    if (!response.ok) throw new Error("Özel uç: sayfa güncellenemedi");
    return response.json();
  } catch (error) {
    console.warn("/api/private/update/page çağrısı başarısız, /api/pages kullanılacak.", error);
    return null;
  }
};