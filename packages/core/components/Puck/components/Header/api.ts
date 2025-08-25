// API fonksiyonları
import { Page, Language } from './types';

// Site ID'yi almak için yardımcı fonksiyon
let cachedSiteId: string | null = null;

export const getSiteId = async (): Promise<string> => {
  if (cachedSiteId !== null) {
    return cachedSiteId;
  }

  try {
    console.log('🔍 Site ID aranıyor...');

    // Önce site-config API'sini dene
    try {
      const configResponse = await fetch('/api/site-config');
      if (configResponse.ok) {
        const config = await configResponse.json();
        console.log('📋 Site Config Response:', config);
        if (config.siteId) {
          cachedSiteId = config.siteId;
          console.log('✅ Site ID bulundu (config):', config.siteId);
          return config.siteId;
        }
      } else {
        console.log('⚠️ /api/site-config mevcut değil:', configResponse.status);
      }
    } catch (err) {
      console.log('⚠️ /api/site-config hatası:', err);
    }

    // Fallback: current-site API'sini dene
    try {
      const currentSiteResponse = await fetch('/api/current-site');
      if (currentSiteResponse.ok) {
        const site = await currentSiteResponse.json();
        console.log('🏠 Current Site Response:', site);
        if (site.id) {
          cachedSiteId = site.id;
          console.log('✅ Site ID bulundu (current-site):', site.id);
          return site.id;
        }
      } else {
        console.log('⚠️ /api/current-site mevcut değil:', currentSiteResponse.status);
      }
    } catch (err) {
      console.log('⚠️ /api/current-site hatası:', err);
    }

    // Üçüncü fallback: user-theme'den site ID'yi çıkar
    try {
      const themeResponse = await fetch('/api/private/themes/user-theme/1');
      if (themeResponse.ok) {
        const themeData = await themeResponse.json();
        console.log('🎨 Theme Response:', themeData);
        if (themeData.siteId) {
          cachedSiteId = themeData.siteId;
          console.log('✅ Site ID bulundu (theme):', themeData.siteId);
          return themeData.siteId;
        }
      }
    } catch (err) {
      console.log('⚠️ Theme API hatası:', err);
    }

    // Dördüncü fallback: window.location'dan al
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const pathname = window.location.pathname;
      console.log('🌐 Window location:', { hostname, pathname });
      
      // Subdomain'den site ID'yi çıkar
      if (hostname.includes('.')) {
        const subdomain = hostname.split('.')[0];
        if (subdomain && subdomain !== 'www' && subdomain !== 'localhost' && subdomain !== '127') {
          cachedSiteId = subdomain;
          console.log('✅ Site ID bulundu (subdomain):', subdomain);
          return subdomain;
        }
      }
      
      // Path'den site ID'yi çıkar (admin veya edit path'i varsa)
      const pathParts = pathname.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        // admin, edit, puck gibi path'leri geç
        const skipPaths = ['admin', 'edit', 'puck', 'dashboard'];
        const siteIdCandidate = pathParts.find(part => !skipPaths.includes(part.toLowerCase()));
        if (siteIdCandidate && siteIdCandidate.length > 2) {
          cachedSiteId = siteIdCandidate;
          console.log('✅ Site ID bulundu (path):', siteIdCandidate);
          return siteIdCandidate;
        }
      }
    }

    // Son fallback: Hardcoded site ID (geçici çözüm)
    // TODO: Bu değeri backend'inizin gerçek site ID'si ile değiştirin
    const hardcodedSiteId = '1'; // Varsayılan site ID
    cachedSiteId = hardcodedSiteId;
    console.log('🔧 Varsayılan Site ID kullanılıyor:', hardcodedSiteId);
    return hardcodedSiteId;
  } catch (error) {
    console.error('❌ Site ID alınırken genel hata:', error);
    cachedSiteId = '1';
    return '1';
  }
};

// Site ID'yi temizle (test için)
export const clearSiteIdCache = () => {
  cachedSiteId = null;
};

// Site ID'yi manuel olarak ayarla (geliştirme için)
export const setSiteId = (siteId: string) => {
  cachedSiteId = siteId;
  console.log('🔧 Site ID manuel olarak ayarlandı:', siteId);
};

// Sayfa API fonksiyonları
export const getPages = async (): Promise<Page[]> => {
  try {
    const siteId = await getSiteId();
    const response = await fetch(`/api/pages?siteId=${siteId}`);
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

export const getPage = async (id: string): Promise<Page | null> => {
  try {
    const siteId = await getSiteId();
    const response = await fetch(`/api/pages/${id}?siteId=${siteId}`);
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

export const addPage = async (page: Omit<Page, 'id'>): Promise<Page | null> => {
  try {
    console.log('📝 Adding Page (Frontend Format):', page);
    
    const siteId = await getSiteId();
    
    // Frontend formatını backend formatına çevir
    const backendPage = {
      ...page,
      languageCode: page.languageId, // languageId -> languageCode dönüşümü
      languageId: undefined, // Backend alanını temizle
      siteId // Site ID ekle
    };
    
    console.log('🔄 Backend Format:', backendPage);
    
    const response = await fetch(`/api/pages?siteId=${siteId}`, {
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

export const updatePage = async (id: string, data: Partial<Page>): Promise<Page | null> => {
  try {
    console.log('📝 Updating Page (Frontend Format):', { id, data });
    
    const siteId = await getSiteId();
    
    // Frontend formatını backend formatına çevir
    const backendData = {
      ...data,
      languageCode: data.languageId, // languageId -> languageCode dönüşümü
      languageId: undefined, // Backend alanını temizle
      siteId // Site ID ekle
    };
    
    console.log('🔄 Backend Update Format:', backendData);
    
    const response = await fetch(`/api/pages/${id}?siteId=${siteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendData),
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

export const deletePage = async (id: string): Promise<boolean> => {
  try {
    const siteId = await getSiteId();
    const response = await fetch(`/api/pages/${id}?siteId=${siteId}`, {
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
    const siteId = await getSiteId();
    
    // Senin site-languages API'ni kullan
    const response = await fetch(`/api/site-languages?siteId=${siteId}`);
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
    const fallbackResponse = await fetch(`/api/languages?siteId=${siteId}`);
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

export const addLanguage = async (language: Omit<Language, 'id'>): Promise<Language | null> => {
  try {
    const siteId = await getSiteId();
    const response = await fetch(`/api/languages?siteId=${siteId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...language, siteId }),
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
    const siteId = await getSiteId();
    const response = await fetch(`/api/languages/${id}?siteId=${siteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, siteId }),
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
    const siteId = await getSiteId();
    const response = await fetch(`/api/languages/${id}?siteId=${siteId}`, {
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
    const siteId = await getSiteId();
    
    // Frontend formatını backend formatına çevir
    const backendPage = {
      ...page,
      languageCode: page.languageId,
      languageId: undefined,
      siteId
    };
    
    const response = await fetch(`/api/private/create/page?siteId=${siteId}`, {
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
  data: Partial<Page>
): Promise<Page | null> => {
  try {
    const siteId = await getSiteId();
    
    // Frontend formatını backend formatına çevir
    const backendData = {
      ...data,
      languageCode: data.languageId,
      languageId: undefined,
      siteId
    };
    
    const response = await fetch(`/api/private/update/page?siteId=${siteId}`, {
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