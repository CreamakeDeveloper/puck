// API fonksiyonları
import { Page, Language } from './types';

// Site ID validation helper
const validateSiteId = (siteId?: string): string => {
  if (!siteId) {
    console.warn('⚠️ Site ID bulunamadı, varsayılan kullanılıyor: 1');
    return '1';
  }
  return siteId;
};

// Theme ID validation helper
const validateThemeId = (themeId?: string): string => {
  if (!themeId) {
    console.warn('⚠️ Theme ID bulunamadı, varsayılan kullanılıyor: 1');
    return '1';
  }
  return themeId;
};

// Query parameters helper
const buildQueryParams = (params: Record<string, string>): string => {
  const searchParams = new URLSearchParams(params);
  return searchParams.toString();
};

// Sayfa API fonksiyonları
export const getPages = async (siteId?: string, themeId?: string, isAdmin?: boolean): Promise<Page[]> => {
  try {
    const validSiteId = validateSiteId(siteId);
    const validThemeId = validateThemeId(themeId);
    const queryParams = buildQueryParams({ 
      siteId: validSiteId, 
      themeId: validThemeId,
      ...(isAdmin && { isAdmin: 'true' })
    });
    const response = await fetch(`/api/pages?${queryParams}`);
    if (!response.ok) throw new Error('Sayfalar getirilemedi');
    const rawPages = await response.json();
    
    console.log('📄 Raw Pages API Response:', rawPages.map((p: any) => ({
      id: p.id,
      title: p.title,
      languageCode: p.languageCode,
      slug: p.slug
    })));
    
    // Backend formatını frontend formatına çevir
    const pages = rawPages.map((p: any) => ({
      id: String(p.id),
      title: p.title,
      slug: p.slug,
      content: p.page?.content || p.content || '',
      seo: p.seo,
      isActive: p.isActive,
      languageId: p.languageCode // languageCode -> languageId dönüşümü
    }));
    
    console.log('🎯 Converted Pages:', pages.map((p: any) => ({
      id: p.id,
      title: p.title,
      languageId: p.languageId,
      slug: p.slug
    })));
    
    return pages;
  } catch (error) {
    console.error('Sayfa listesi alınırken hata:', error);
    return [];
  }
};

export const getPage = async (id: string, siteId?: string, themeId?: string, isAdmin?: boolean): Promise<Page | null> => {
  try {
    const validSiteId = validateSiteId(siteId);
    const validThemeId = validateThemeId(themeId);
    const queryParams = buildQueryParams({ 
      siteId: validSiteId, 
      themeId: validThemeId,
      ...(isAdmin && { isAdmin: 'true' })
    });
    const response = await fetch(`/api/pages/${id}?${queryParams}`);
    if (!response.ok) throw new Error('Sayfa getirilemedi');
    const rawPage = await response.json();
    
    console.log('📄 Raw Page API Response:', {
      id: rawPage.id,
      title: rawPage.title,
      languageCode: rawPage.languageCode
    });
    
    // Backend formatını frontend formatına çevir
    const page = {
      id: String(rawPage.id),
      title: rawPage.title,
      slug: rawPage.slug,
      content: rawPage.page?.content || rawPage.content || '',
      seo: rawPage.seo,
      isActive: rawPage.isActive,
      languageId: rawPage.languageCode // languageCode -> languageId dönüşümü
    };
    
    console.log('🎯 Converted Page:', {
      id: page.id,
      title: page.title,
      languageId: page.languageId
    });
    
    return page;
  } catch (error) {
    console.error('Sayfa alınırken hata:', error);
    return null;
  }
};

export const addPage = async (page: Omit<Page, 'id'>, siteId?: string, themeId?: string, isAdmin?: boolean): Promise<Page | null> => {
  try {
    console.log('📝 Adding Page (Frontend Format):', page);
    
    const validSiteId = validateSiteId(siteId);
    const validThemeId = validateThemeId(themeId);
    
    // Frontend formatını backend formatına çevir
    const backendPage = {
      ...page,
      languageCode: page.languageId, // languageId -> languageCode dönüşümü
      languageId: undefined, // Backend alanını temizle
      siteId: validSiteId, // Site ID ekle
      themeId: validThemeId, // Theme ID ekle
      ...(isAdmin && { isAdmin: true }) // Admin yetkisi ekle
    };
    
    console.log('🔄 Backend Format:', backendPage);
    
    const response = await fetch('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendPage),
    });
    if (!response.ok) {
      let message = 'Sayfa eklenemedi';
      try {
        const err = await response.json();
        message = err?.message || err?.error || message;
      } catch {}
      throw new Error(message);
    }
    const rawResult = await response.json();
    
    // Backend response'unu frontend formatına çevir
    const result = {
      id: String(rawResult.id),
      title: rawResult.title,
      slug: rawResult.slug,
      content: rawResult.page?.content || rawResult.content || '',
      seo: rawResult.seo,
      isActive: rawResult.isActive,
      languageId: rawResult.languageCode // languageCode -> languageId dönüşümü
    };
    
    console.log('✅ Page Added (Frontend Format):', result);
    return result;
  } catch (error) {
    console.error('Sayfa eklenirken hata:', error);
    throw error;
  }
};

export const updatePage = async (id: string, data: Partial<Page>, siteId?: string, themeId?: string, isAdmin?: boolean): Promise<Page | null> => {
  try {
    console.log('📝 Updating Page (Frontend Format):', { id, data });
    
    const validSiteId = validateSiteId(siteId);
    const validThemeId = validateThemeId(themeId);
    
    // Frontend formatını backend formatına çevir
    const backendData = {
      ...data,
      languageCode: data.languageId, // languageId -> languageCode dönüşümü
      languageId: undefined, // Backend alanını temizle
      siteId: validSiteId, // Site ID ekle
      themeId: validThemeId // Theme ID ekle
    };
    
    console.log('🔄 Backend Update Format:', backendData);
    
    const queryParams = buildQueryParams({ 
      siteId: validSiteId, 
      themeId: validThemeId,
      ...(isAdmin && { isAdmin: 'true' })
    });
    const response = await fetch(`/api/pages/${id}?${queryParams}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...backendData,
        ...(isAdmin && { isAdmin: true })
      }),
    });
    if (!response.ok) throw new Error('Sayfa güncellenemedi');
    
    const rawResult = await response.json();
    
    // Backend response'unu frontend formatına çevir
    const result = {
      id: String(rawResult.id),
      title: rawResult.title,
      slug: rawResult.slug,
      content: rawResult.page?.content || rawResult.content || '',
      seo: rawResult.seo,
      isActive: rawResult.isActive,
      languageId: rawResult.languageCode // languageCode -> languageId dönüşümü
    };
    
    console.log('✅ Page Updated (Frontend Format):', result);
    return result;
  } catch (error) {
    console.error('Sayfa güncellenirken hata:', error);
    return null;
  }
};

export const deletePage = async (id: string, siteId?: string, themeId?: string, isAdmin?: boolean): Promise<boolean> => {
  try {
    const validSiteId = validateSiteId(siteId);
    const validThemeId = validateThemeId(themeId);
    const queryParams = buildQueryParams({ 
      siteId: validSiteId, 
      themeId: validThemeId,
      ...(isAdmin && { isAdmin: 'true' })
    });
    const response = await fetch(`/api/pages/${id}?${queryParams}`, {
      method: 'DELETE',
    });
    return response.ok;
  } catch (error) {
    console.error('Sayfa silinirken hata:', error);
    return false;
  }
};

// Dil API fonksiyonları
export const getLanguages = async (siteId?: string, themeId?: string, isAdmin?: boolean): Promise<Language[]> => {
  try {
    const validSiteId = validateSiteId(siteId);
    const validThemeId = validateThemeId(themeId);
    
    // Senin site-languages API'ni kullan
    const queryParams = buildQueryParams({ 
      siteId: validSiteId, 
      themeId: validThemeId,
      ...(isAdmin && { isAdmin: 'true' })
    });
    const response = await fetch(`/api/site-languages?${queryParams}`);
    if (response.ok) {
      const data = await response.json();
      
      console.log('🌍 Site Languages API Response:', data);
      
      // Backend formatını frontend formatına çevir
      const languages = data.languages.map((lang: any) => ({
        id: lang.code, // ID olarak code kullan (tr, en, de)
        name: lang.name,
        code: lang.code,
        isDefault: lang.code === data.defaultLanguage,
        isActive: lang.isActive
      }));
      
      console.log('🎯 Converted Languages:', languages);
      return languages;
    }
    
    // Fallback: /api/languages (ID'li format)
    const fallbackQueryParams = buildQueryParams({ 
      siteId: validSiteId, 
      themeId: validThemeId,
      ...(isAdmin && { isAdmin: 'true' })
    });
    const fallbackResponse = await fetch(`/api/languages?${fallbackQueryParams}`);
    if (!fallbackResponse.ok) throw new Error('Diller getirilemedi');
    const fallbackData = await fallbackResponse.json();
    
    console.log('🔄 Fallback Languages API Response:', fallbackData);
    
    // Fallback formatı zaten uyumlu, sadece eksik alanları ekle
    return fallbackData.map((lang: any) => ({
      ...lang,
      isDefault: false, // Varsayılan dil bilgisi yok
      isActive: true    // Aktif kabul et
    }));
  } catch (error) {
    console.error('Dil listesi alınırken hata:', error);
    return [];
  }
};

export const addLanguage = async (language: Omit<Language, 'id'>, siteId?: string, themeId?: string, isAdmin?: boolean): Promise<Language | null> => {
  try {
    const validSiteId = validateSiteId(siteId);
    const validThemeId = validateThemeId(themeId);
    const response = await fetch('/api/languages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ...language, 
        siteId: validSiteId, 
        themeId: validThemeId,
        ...(isAdmin && { isAdmin: true })
      }),
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

export const updateLanguage = async (id: string, data: Partial<Language>, siteId?: string, themeId?: string, isAdmin?: boolean): Promise<Language | null> => {
  try {
    const validSiteId = validateSiteId(siteId);
    const validThemeId = validateThemeId(themeId);
    const queryParams = buildQueryParams({ 
      siteId: validSiteId, 
      themeId: validThemeId,
      ...(isAdmin && { isAdmin: 'true' })
    });
    const response = await fetch(`/api/languages/${id}?${queryParams}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ...data, 
        siteId: validSiteId, 
        themeId: validThemeId,
        ...(isAdmin && { isAdmin: true })
      }),
    });
    if (!response.ok) throw new Error('Dil güncellenemedi');
    return response.json();
  } catch (error) {
    console.error('Dil güncellenirken hata:', error);
    return null;
  }
};

export const deleteLanguage = async (id: string, siteId?: string, themeId?: string, isAdmin?: boolean): Promise<boolean> => {
  try {
    const validSiteId = validateSiteId(siteId);
    const validThemeId = validateThemeId(themeId);
    const queryParams = buildQueryParams({ 
      siteId: validSiteId, 
      themeId: validThemeId,
      ...(isAdmin && { isAdmin: 'true' })
    });
    const response = await fetch(`/api/languages/${id}?${queryParams}`, {
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
  page: Omit<Page, "id">,
  siteId?: string,
  themeId?: string,
  isAdmin?: boolean
): Promise<Page | null> => {
  try {
    const validSiteId = validateSiteId(siteId);
    const validThemeId = validateThemeId(themeId);
    
    // Frontend formatını backend formatına çevir
    const backendPage = {
      ...page,
      languageCode: page.languageId,
      languageId: undefined,
      siteId: validSiteId,
      themeId: validThemeId,
      ...(isAdmin && { isAdmin: true })
    };
    
    const response = await fetch("/api/private/create/page", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(backendPage),
    });
    if (!response.ok) throw new Error("Özel uç: sayfa oluşturulamadı");
    
    const rawResult = await response.json();
    
    // Backend response'unu frontend formatına çevir
    return {
      id: String(rawResult.id),
      title: rawResult.title,
      slug: rawResult.slug,
      content: rawResult.page?.content || rawResult.content || '',
      seo: rawResult.seo,
      isActive: rawResult.isActive,
      languageId: rawResult.languageCode
    };
  } catch (error) {
    console.warn("/api/private/create/page çağrısı başarısız, /api/pages kullanılacak.", error);
    return null;
  }
};

export const updatePagePrivate = async (
  id: string,
  data: Partial<Page>,
  siteId?: string,
  themeId?: string,
  isAdmin?: boolean
): Promise<Page | null> => {
  try {
    const validSiteId = validateSiteId(siteId);
    const validThemeId = validateThemeId(themeId);
    
    // Frontend formatını backend formatına çevir
    const backendData = {
      ...data,
      languageCode: data.languageId,
      languageId: undefined,
      siteId: validSiteId,
      themeId: validThemeId,
      ...(isAdmin && { isAdmin: true })
    };
    
    const response = await fetch("/api/private/update/page", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...backendData }),
    });
    if (!response.ok) throw new Error("Özel uç: sayfa güncellenemedi");
    
    const rawResult = await response.json();
    
    // Backend response'unu frontend formatına çevir
    return {
      id: String(rawResult.id),
      title: rawResult.title,
      slug: rawResult.slug,
      content: rawResult.page?.content || rawResult.content || '',
      seo: rawResult.seo,
      isActive: rawResult.isActive,
      languageId: rawResult.languageCode
    };
  } catch (error) {
    console.warn("/api/private/update/page çağrısı başarısız, /api/pages kullanılacak.", error);
    return null;
  }
};