import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useAppStore, useAppStoreApi } from "../../../../../store";
import { Page, SEO } from "../types";
import { getPages, getPage, addPage, updatePage, deletePage, createPagePrivate, updatePagePrivate } from "../api";
import toast from "react-hot-toast";

export const usePageManagement = (selectedLanguageId: string | null, siteId?: string, themeId?: string, isAdmin?: boolean) => {
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [newPage, setNewPage] = useState<Omit<Page, 'id'>>({
    title: '',
    slug: '/',
    content: '',
    seo: undefined,
    isActive: true,
    languageId: undefined,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const dispatch = useAppStore((s) => s.dispatch);
  const appStore = useAppStoreApi();

  // currentPageId için ref kullan
  const currentPageIdRef = useRef<string | null>(null);
  currentPageIdRef.current = currentPageId;

  const loadPages = useCallback(async () => {
    try {
      const pagesData = await getPages(siteId, themeId);
      setPages(pagesData);
      
      // İlk yükleme sırasında varsayılan olarak ilk aktif sayfayı seç
      if (pagesData.length > 0 && !currentPageId) {
        // İlk aktif sayfayı bul
        const firstActivePage = pagesData.find(page => page.isActive !== false);
        
        if (firstActivePage) {
          setCurrentPageId(firstActivePage.id);
          // İlk sayfayı otomatik olarak yükle
          const safeParseContent = (value: unknown) => {
            if (!value) return [] as any[];
            if (typeof value === 'string') {
              try {
                return JSON.parse(value);
              } catch {
                return [] as any[];
              }
            }
            return value as any[];
          };

          dispatch({
            type: 'setData',
            data: (prevData: any) => {
              // Ana sayfa için root props'u tamamen koru
              const isRootPage = firstActivePage.slug === '/' || firstActivePage.slug === '';
              
              if (isRootPage) {
                return {
                  ...prevData,
                  content: safeParseContent(firstActivePage.content),
                  root: {
                    ...prevData?.root,
                    props: {
                      ...prevData?.root?.props, // Mevcut tüm props'ları koru
                      title: firstActivePage.title, // Başlığı güncelle
                      slug: firstActivePage.slug, // Slug'ı güncelle
                      seo: firstActivePage.seo ?? prevData?.root?.props?.seo, // SEO'yu güncelle
                      // Diğer mevcut root props'lar korunuyor
                    },
                  },
                };
              } else {
                return {
                  ...prevData,
                  content: safeParseContent(firstActivePage.content),
                  root: {
                    ...prevData?.root,
                    props: {
                      ...prevData?.root?.props, // Mevcut tüm props'ları koru
                      title: firstActivePage.title, // Başlığı güncelle
                      slug: firstActivePage.slug, // Slug'ı güncelle
                      seo: firstActivePage.seo ?? prevData?.root?.props?.seo, // SEO'yu güncelle
                      // Diğer mevcut root props'lar korunuyor
                    },
                  },
                };
              }
            },
          });
        }
      }
      
      return pagesData;
    } catch (error) {
      console.error('Sayfa listesi yüklenirken hata:', error);
      // Hata durumunda mevcut state'i koru
      return [];
    }
  }, [currentPageId, dispatch, siteId, themeId]);

  // Hook ilk yüklendiğinde sayfaları yükle
  useEffect(() => {
    const initialLoad = async () => {
      await loadPages();
    };
    initialLoad();
  }, [siteId]);

  // Dil değiştiğinde sayfa listesini yeniden yükle ve currentPageId'yi güncelle
  useEffect(() => {
    if (selectedLanguageId) {
      const updatePagesForLanguage = async () => {
        const pagesData = await getPages(siteId, themeId);
        setPages(pagesData);
        
        // Seçili dildeki ilk aktif sayfayı bul
        const firstActivePageInLanguage = pagesData.find(
          page => page.isActive !== false && page.languageId === selectedLanguageId
        );
        
        if (firstActivePageInLanguage) {
          // Mevcut currentPageId'yi ref'ten al
          const currentPageIdValue = currentPageIdRef.current;
          
          // Eğer mevcut sayfa farklı dildeyse, yeni dildeki ilk sayfayı seç
          if (currentPageIdValue) {
            const currentPage = pagesData.find(p => p.id === currentPageIdValue);
            if (!currentPage || currentPage.languageId !== selectedLanguageId) {
              setCurrentPageId(firstActivePageInLanguage.id);
              // Sayfa verilerini yükle
              const safeParseContent = (value: unknown) => {
                if (!value) return [] as any[];
                if (typeof value === 'string') {
                  try {
                    return JSON.parse(value);
                  } catch {
                    return [] as any[];
                  }
                }
                return value as any[];
              };

              dispatch({
                type: 'setData',
                data: (prevData: any) => {
                  // Ana sayfa için root props'u tamamen koru
                  const isRootPage = firstActivePageInLanguage.slug === '/' || firstActivePageInLanguage.slug === '';
                  
                  if (isRootPage) {
                    return {
                      ...prevData,
                      content: safeParseContent(firstActivePageInLanguage.content),
                      root: {
                        ...prevData?.root,
                        props: {
                          ...prevData?.root?.props, // Mevcut tüm props'ları koru
                          title: firstActivePageInLanguage.title, // Başlığı güncelle
                          slug: firstActivePageInLanguage.slug, // Slug'ı güncelle
                          seo: firstActivePageInLanguage.seo ?? prevData?.root?.props?.seo, // SEO'yu güncelle
                          // Diğer mevcut root props'lar korunuyor
                        },
                      },
                    };
                  } else {
                    return {
                      ...prevData,
                      content: safeParseContent(firstActivePageInLanguage.content),
                      root: {
                        ...prevData?.root,
                        props: {
                          ...prevData?.root?.props, // Mevcut tüm props'ları koru
                          title: firstActivePageInLanguage.title, // Başlığı güncelle
                          slug: firstActivePageInLanguage.slug, // Slug'ı güncelle
                          seo: firstActivePageInLanguage.seo ?? prevData?.root?.props?.seo, // SEO'yu güncelle
                          // Diğer mevcut root props'lar korunuyor
                        },
                      },
                    };
                  }
                },
              });
            }
          } else {
            setCurrentPageId(firstActivePageInLanguage.id);
            // Sayfa verilerini yükle
            const safeParseContent = (value: unknown) => {
              if (!value) return [] as any[];
              if (typeof value === 'string') {
                try {
                  return JSON.parse(value);
                } catch {
                  return [] as any[];
                }
              }
              return value as any[];
            };

            dispatch({
              type: 'setData',
              data: (prevData: any) => {
                // Ana sayfa için root props'u tamamen koru
                const isRootPage = firstActivePageInLanguage.slug === '/' || firstActivePageInLanguage.slug === '';
                
                if (isRootPage) {
                  return {
                    ...prevData,
                    content: safeParseContent(firstActivePageInLanguage.content),
                    root: {
                      ...prevData?.root,
                      props: {
                        ...prevData?.root?.props, // Mevcut tüm props'ları koru
                        title: firstActivePageInLanguage.title, // Başlığı güncelle
                        slug: firstActivePageInLanguage.slug, // Slug'ı güncelle
                        seo: firstActivePageInLanguage.seo ?? prevData?.root?.props?.seo, // SEO'yu güncelle
                        // Diğer mevcut root props'lar korunuyor
                      },
                    },
                  };
                } else {
                  return {
                    ...prevData,
                    content: safeParseContent(firstActivePageInLanguage.content),
                    root: {
                      ...prevData?.root,
                      props: {
                        ...prevData?.root?.props, // Mevcut tüm props'ları koru
                        title: firstActivePageInLanguage.title, // Başlığı güncelle
                        slug: firstActivePageInLanguage.slug, // Slug'ı güncelle
                        seo: firstActivePageInLanguage.seo ?? prevData?.root?.props?.seo, // SEO'yu güncelle
                        // Diğer mevcut root props'lar korunuyor
                      },
                    },
                  };
                }
              },
            });
          }
        } else {
          // Seçili dilde sayfa yoksa currentPageId'yi temizle
          setCurrentPageId(null);
        }
      };
      
      updatePagesForLanguage();
    }
  }, [selectedLanguageId, dispatch, siteId, themeId]);

  const normalizeSlug = useCallback((value: string) => {
    // "/" ile başlamasını sağla
    let normalized = value.trim();
    if (!normalized.startsWith('/')) {
      normalized = `/${normalized}`;
    }
    // Boş slug ise "/" yap
    if (normalized === '/') {
      return '/';
    }
    return normalized.toLowerCase();
  }, []);

  const handleSelectPage = useCallback(async (id: string) => {
    const selected = await getPage(id, siteId, themeId, isAdmin);
    if (!selected) return;

    const safeParseContent = (value: unknown) => {
      if (!value) return [] as any[];
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return [] as any[];
        }
      }
      return value as any[];
    };

    // Ana sayfa (slug = "/") için özel kontrol
    const isRootPage = selected.slug === '/' || selected.slug === '';

    dispatch({
      type: 'setData',
      data: (prevData: any) => {
        // Ana sayfa için root props'u tamamen koru, sadece gerekli alanları güncelle
        if (isRootPage) {
          return {
            ...prevData,
            content: safeParseContent(selected.content),
            root: {
              ...prevData?.root,
              props: {
                ...prevData?.root?.props, // Mevcut tüm props'ları koru
                title: selected.title, // Başlığı güncelle
                slug: selected.slug, // Slug'ı güncelle
                seo: selected.seo ?? prevData?.root?.props?.seo, // SEO'yu güncelle
                // Diğer mevcut root props'lar korunuyor
              },
            },
          };
        } else {
          // Normal sayfalar için standart güncelleme
          return {
            ...prevData,
            content: safeParseContent(selected.content),
            root: {
              ...prevData?.root,
              props: {
                ...prevData?.root?.props, // Mevcut tüm props'ları koru
                title: selected.title, // Başlığı güncelle
                slug: selected.slug, // Slug'ı güncelle
                seo: selected.seo ?? prevData?.root?.props?.seo, // SEO'yu güncelle
                // Diğer mevcut root props'lar korunuyor
              },
            },
          };
        }
      },
    });

    setCurrentPageId(id);
  }, [dispatch, siteId, themeId, isAdmin]);

  const handleAddPage = useCallback(async () => {
    // Form validasyonu
    if (!newPage.title.trim()) {
      toast.error('Sayfa başlığı boş bırakılamaz!');
      return;
    }

    // Slug'ı normalize et - "/" ile başlamasını sağla
    let finalSlug = newPage.slug.trim();
    if (!finalSlug || finalSlug === '') {
      finalSlug = '/';
    } else if (!finalSlug.startsWith('/')) {
      finalSlug = `/${finalSlug}`;
    }

    // Sayfa listesini güncel tut
    const currentPages = await loadPages();

    const duplicateTitle = currentPages.some(
      (p) => p.title.trim().toLowerCase() === newPage.title.trim().toLowerCase()
    );
    const duplicateSlug = currentPages.some(
      (p) => normalizeSlug(p.slug) === normalizeSlug(finalSlug)
    );
    if (duplicateTitle || duplicateSlug) {
      toast.error(
        duplicateSlug
          ? 'Aynı slug ile bir sayfa zaten mevcut.'
          : 'Aynı başlık ile bir sayfa zaten mevcut.'
      );
      return;
    }

    try {
      const result = await addPage({
        title: newPage.title.trim(),
        slug: finalSlug,
        content: newPage.content ?? '',
        seo: newPage.seo,
        isActive: newPage.isActive ?? true,
        languageId: newPage.languageId || selectedLanguageId || undefined,
      }, siteId, themeId);
      if (result) {
        setCurrentPageId(result.id);
        await handleSelectPage(result.id);
        await loadPages();
        setNewPage({ title: '', slug: '/', content: '', seo: undefined, isActive: true, languageId: undefined });
        setModalOpen(false);
        toast.success('Sayfa başarıyla eklendi!');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Sayfa eklenemedi');
    }
  }, [newPage, loadPages, handleSelectPage, selectedLanguageId, siteId, themeId]);

  const handleUpdatePage = useCallback(async () => {
    if (!editingPage) return;
    
    // Form validasyonu
    if (!editingPage.title.trim()) {
      toast.error('Sayfa başlığı boş bırakılamaz!');
      return;
    }

    // Slug'ı normalize et - "/" ile başlamasını sağla
    let finalSlug = editingPage.slug.trim();
    if (!finalSlug || finalSlug === '') {
      finalSlug = '/';
    } else if (!finalSlug.startsWith('/')) {
      finalSlug = `/${finalSlug}`;
    }

    try {
      const result = await updatePage(editingPage.id, { ...editingPage, slug: finalSlug }, siteId, themeId, isAdmin);
      if (result) {
        await loadPages();
        setEditingPage(null);
        setModalOpen(false);
        toast.success('Sayfa başarıyla güncellendi!');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Sayfa güncellenemedi');
    }
  }, [editingPage, loadPages, siteId, themeId]);

  const handleDeletePage = useCallback(async (id: string) => {
    if (!confirm('Bu sayfayı silmek istediğinizden emin misiniz?')) return;
    
    try {
      await deletePage(id, siteId, themeId);
      
      // Sayfa silindikten sonra sayfa listesini yeniden yükle
      const pagesData = await loadPages();
      
      // Silinen sayfa aktifse veya mevcut aktif sayfa artık yoksa
      const activePages = (pagesData || [])
        .filter((p) => p.isActive !== false)
        .filter((p) => (selectedLanguageId ? p.languageId === selectedLanguageId : true));

      const currentStillValid = !!activePages.find((p) => p.id === currentPageId);
      const deletedWasCurrent = currentPageId === id;

      if (deletedWasCurrent || !currentStillValid) {
        const next = activePages[0];
        if (next) {
          // Yeni sayfa seçimi yap
          await handleSelectPage(next.id);
        } else {
          // Hiç aktif sayfa yoksa currentPageId'yi temizle
          setCurrentPageId(null);
          // App state'i temizle
          dispatch({
            type: 'setData',
            data: (prevData: any) => ({
              ...prevData,
              content: [],
              root: {
                ...prevData?.root,
                props: {
                  ...prevData?.root?.props,
                  title: '',
                  slug: '',
                  seo: undefined,
                },
              },
            }),
          });
        }
      }
      
      toast.success('Sayfa başarıyla silindi!');
    } catch (e: any) {
      console.error('Sayfa silme hatası:', e);
      toast.error(e?.message || 'Sayfa silinemedi');
    }
  }, [loadPages, selectedLanguageId, currentPageId, handleSelectPage, siteId, themeId]);

  const handleDuplicatePage = useCallback(async (id: string) => {
    const pageToDuplicate = pages.find(p => p.id === id);
    if (!pageToDuplicate) return;
    
    try {
      // Kopyalanacak sayfanın verilerini hazırla
      const duplicatedPage = {
        title: `${pageToDuplicate.title} (Kopya)`,
        slug: pageToDuplicate.slug.startsWith('/') ? `${pageToDuplicate.slug}-kopya` : `/${pageToDuplicate.slug}-kopya`,
        content: pageToDuplicate.content,
        seo: pageToDuplicate.seo,
        isActive: pageToDuplicate.isActive,
        languageId: pageToDuplicate.languageId,
      };
      
      // Sayfa listesini güncel tut
      const currentPages = await loadPages();
      
      // Slug benzersizliğini kontrol et
      const duplicateSlug = currentPages.some(
        (p) => normalizeSlug(p.slug) === normalizeSlug(duplicatedPage.slug)
      );
      
      if (duplicateSlug) {
        // Benzersiz slug bul
        let counter = 1;
        let newSlug = duplicatedPage.slug;
        while (currentPages.some(p => normalizeSlug(p.slug) === normalizeSlug(newSlug))) {
          newSlug = `${pageToDuplicate.slug.startsWith('/') ? pageToDuplicate.slug : `/${pageToDuplicate.slug}`}-kopya-${counter}`;
          counter++;
        }
        duplicatedPage.slug = newSlug;
      }
      
      // Sayfayı ekle
      const result = await addPage(duplicatedPage, siteId, themeId, isAdmin);
      if (result) {
        await loadPages();
        toast.success('Sayfa başarıyla kopyalandı!');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Sayfa kopyalanamadı');
    }
  }, [pages, addPage, loadPages, normalizeSlug, siteId, themeId]);

  const handlePublish = useCallback(async (onPublish?: any) => {
    try {
      setIsPublishing(true);
      const data = appStore.getState().state.data as any;

      const rootProps = (data?.root?.props || {}) as {
        title?: string;
        slug?: string;
        seo?: SEO;
        isActive?: boolean;
      };

      const mergedSeo: SEO | undefined = (() => {
        const anySeo = rootProps.seo || editingPage?.seo || newPage?.seo;
        if (!anySeo) return undefined;
        return {
          ...(editingPage?.seo || {}),
          ...(newPage?.seo || {}),
          ...(rootProps.seo || {}),
        } as SEO;
      })();

      // Form validasyonu
      const title = rootProps.title ?? editingPage?.title ?? newPage?.title ?? '';
      const slug = rootProps.slug ?? editingPage?.slug ?? newPage?.slug ?? '';
      
      if (!title.trim()) {
        toast.error('Sayfa başlığı boş bırakılamaz!');
        setIsPublishing(false);
        return;
      }

      // Slug'ı normalize et - "/" ile başlamasını sağla
      let finalSlug = slug.trim();
      if (!finalSlug || finalSlug === '') {
        finalSlug = '/';
      } else if (!finalSlug.startsWith('/')) {
        finalSlug = `/${finalSlug}`;
      }

      const payload: Omit<Page, 'id'> = {
        title: title.trim(),
        slug: finalSlug,
        content: JSON.stringify(data?.content ?? []),
        seo: mergedSeo,
        isActive:
          rootProps.isActive ??
          editingPage?.isActive ??
          newPage?.isActive ??
          true,
        languageId: (editingPage?.languageId ?? newPage?.languageId ?? selectedLanguageId) || undefined,
      };

      const normalizedTitle = payload.title.trim().toLowerCase();
      const normalizedSlug = normalizeSlug(payload.slug);

      // Sayfa listesini güncel tut
      const currentPages = await loadPages();

      if (!currentPageId) {
        // Yeni sayfa oluşturuluyor
        const duplicateTitle = currentPages.some(
          (p) => p.title.trim().toLowerCase() === normalizedTitle
        );
        const duplicateSlug = currentPages.some(
          (p) => normalizeSlug(p.slug) === normalizedSlug
        );
        if (duplicateTitle || duplicateSlug) {
          toast.error(
            duplicateSlug
              ? 'Aynı slug ile bir sayfa zaten mevcut.'
              : 'Aynı başlık ile bir sayfa zaten mevcut.'
          );
          setIsPublishing(false);
          return;
        }
      } else {
        // Mevcut sayfa güncelleniyor
        const duplicateTitle = currentPages.some(
          (p) => p.id !== currentPageId && p.title.trim().toLowerCase() === normalizedTitle
        );
        const duplicateSlug = currentPages.some(
          (p) => p.id !== currentPageId && normalizeSlug(p.slug) === normalizedSlug
        );
        if (duplicateTitle || duplicateSlug) {
          toast.error(
            duplicateSlug
              ? 'Aynı slug ile başka bir sayfa mevcut.'
              : 'Aynı başlık ile başka bir sayfa mevcut.'
          );
          setIsPublishing(false);
          return;
        }
      }

      if (currentPageId) {
                  const updated = (await updatePagePrivate(currentPageId, payload, siteId, themeId, isAdmin))
          || (await updatePage(currentPageId, payload, siteId, themeId, isAdmin));
        if (!updated) throw new Error('Sayfa güncellenemedi');
      } else {
                  const created = (await createPagePrivate(payload, siteId, themeId, isAdmin))
          || (await addPage(payload, siteId, themeId, isAdmin));
        if (!created) throw new Error('Sayfa oluşturulamadı');
        setCurrentPageId(created.id);
      }

      await loadPages();
      toast.success('Sayfa başarıyla kaydedildi!');

      onPublish && onPublish(data);
    } catch (e: any) {
      console.error('Yayınlama sırasında hata:', e);
      toast.error(e?.message || 'Kaydetme sırasında hata oluştu');
    } finally {
      setIsPublishing(false);
    }
  }, [appStore, currentPageId, loadPages, editingPage, newPage, selectedLanguageId, siteId, themeId]);

  const filteredPages = useMemo(() => {
    let filtered = pages.filter((page) => page.isActive !== false);
    
    // Dil filtresi
    if (selectedLanguageId) {
      filtered = filtered.filter((page) => page.languageId === selectedLanguageId);
    }
    
    return filtered;
  }, [pages, selectedLanguageId]);

  return {
    pages,
    filteredPages,
    currentPageId,
    editingPage,
    newPage,
    modalOpen,
    isPublishing,
    loadPages,
    handleSelectPage,
    handleAddPage,
    handleUpdatePage,
    handleDeletePage,
    handleDuplicatePage,
    handlePublish,
    setEditingPage,
    setNewPage,
    setModalOpen,
    setCurrentPageId,
  };
};