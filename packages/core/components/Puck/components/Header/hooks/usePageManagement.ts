import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useAppStore, useAppStoreApi } from "../../../../../store";
import { Page, SEO } from "../types";
import { getPages, getPage, addPage, updatePage, deletePage, createPagePrivate, updatePagePrivate } from "../api";
import toast from "react-hot-toast";

export const usePageManagement = (selectedLanguageId: string | null, siteId?: string) => {
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [newPage, setNewPage] = useState<Omit<Page, 'id'>>({
    title: '',
    slug: '',
    content: '',
    seo: undefined,
    isActive: true,
    languageId: undefined,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const dispatch = useAppStore((s) => s.dispatch);
  const appStore = useAppStoreApi();

  const loadPages = useCallback(async () => {
    const pagesData = await getPages(siteId);
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
          data: (prevData: any) => ({
            ...prevData,
            content: safeParseContent(firstActivePage.content),
            root: {
              ...prevData?.root,
              props: {
                ...prevData?.root?.props,
                title: firstActivePage.title,
                slug: firstActivePage.slug,
                seo: firstActivePage.seo ?? prevData?.root?.props?.seo,
              },
            },
          }),
        });
      }
    }
    
    return pagesData;
  }, [currentPageId, dispatch, siteId]);

  // Hook ilk yüklendiğinde sayfaları yükle
  useEffect(() => {
    loadPages();
  }, [loadPages, siteId]);

  // Dil değiştiğinde sayfa listesini yeniden yükle ve currentPageId'yi güncelle
  useEffect(() => {
    if (selectedLanguageId) {
      const loadPagesForLanguage = async () => {
        const pagesData = await getPages(siteId);
        setPages(pagesData);
        
        // Seçili dildeki ilk aktif sayfayı bul
        const firstActivePageInLanguage = pagesData.find(
          page => page.isActive !== false && page.languageId === selectedLanguageId
        );
        
        if (firstActivePageInLanguage) {
          // Eğer mevcut sayfa farklı dildeyse, yeni dildeki ilk sayfayı seç
          if (currentPageId) {
            const currentPage = pagesData.find(p => p.id === currentPageId);
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
                data: (prevData: any) => ({
                  ...prevData,
                  content: safeParseContent(firstActivePageInLanguage.content),
                  root: {
                    ...prevData?.root,
                    props: {
                      ...prevData?.root?.props,
                      title: firstActivePageInLanguage.title,
                      slug: firstActivePageInLanguage.slug,
                      seo: firstActivePageInLanguage.seo ?? prevData?.root?.props?.seo,
                    },
                  },
                }),
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
              data: (prevData: any) => ({
                ...prevData,
                content: safeParseContent(firstActivePageInLanguage.content),
                root: {
                  ...prevData?.root,
                  props: {
                    ...prevData?.root?.props,
                    title: firstActivePageInLanguage.title,
                    slug: firstActivePageInLanguage.slug,
                    seo: firstActivePageInLanguage.seo ?? prevData?.root?.props?.seo,
                  },
                },
              }),
            });
          }
        } else {
          // Seçili dilde sayfa yoksa currentPageId'yi temizle
          setCurrentPageId(null);
        }
      };
      
      loadPagesForLanguage();
    }
  }, [selectedLanguageId, currentPageId, dispatch, siteId]);

  const normalizeSlug = useCallback((value: string) => {
    return value.trim().toLowerCase().replace(/^\/+/, "");
  }, []);

  const handleSelectPage = useCallback(async (id: string) => {
    const selected = await getPage(id, siteId);
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

    dispatch({
      type: 'setData',
      data: (prevData: any) => ({
        ...prevData,
        content: safeParseContent(selected.content),
        root: {
          ...prevData?.root,
          props: {
            ...prevData?.root?.props,
            title: selected.title,
            slug: selected.slug,
            seo: selected.seo ?? prevData?.root?.props?.seo,
          },
        },
      }),
    });

    setCurrentPageId(id);
  }, [dispatch, siteId]);

  const handleAddPage = useCallback(async () => {
    // Form validasyonu
    if (!newPage.title.trim()) {
      toast.error('Sayfa başlığı boş bırakılamaz!');
      return;
    }

    // Kullanıcı yazdıysa olduğu gibi, boşsa ana sayfa "/" kabul edilir
    const enteredSlug = newPage.slug.trim();
    const finalSlug = enteredSlug === '' ? '/' : enteredSlug;

    const duplicateTitle = pages.some(
      (p) => p.title.trim().toLowerCase() === newPage.title.trim().toLowerCase()
    );
    const duplicateSlug = pages.some(
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
        title: newPage.title,
        slug: finalSlug,
        content: newPage.content ?? '',
        seo: newPage.seo,
        isActive: newPage.isActive ?? true,
        languageId: newPage.languageId || selectedLanguageId || undefined,
      }, siteId);
      if (result) {
        setCurrentPageId(result.id);
        await handleSelectPage(result.id);
        await loadPages();
        setNewPage({ title: '', slug: '', content: '', seo: undefined, isActive: true, languageId: undefined });
        setModalOpen(false);
        toast.success('Sayfa başarıyla eklendi!');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Sayfa eklenemedi');
    }
  }, [newPage, loadPages, pages, handleSelectPage, selectedLanguageId, siteId]);

  const handleUpdatePage = useCallback(async () => {
    if (!editingPage) return;
    
    // Form validasyonu
    if (!editingPage.title.trim()) {
      toast.error('Sayfa başlığı boş bırakılamaz!');
      return;
    }

    // Kullanıcı yazdıysa olduğu gibi, boşsa ana sayfa "/" kabul edilir
    const enteredSlug = editingPage.slug.trim();
    const finalSlug = enteredSlug === '' ? '/' : enteredSlug;

    try {
      const result = await updatePage(editingPage.id, { ...editingPage, slug: finalSlug }, siteId);
      if (result) {
        await loadPages();
        setEditingPage(null);
        setModalOpen(false);
        toast.success('Sayfa başarıyla güncellendi!');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Sayfa güncellenemedi');
    }
  }, [editingPage, loadPages, siteId]);

  const handleDeletePage = useCallback(async (id: string) => {
    if (!confirm('Bu sayfayı silmek istediğinizden emin misiniz?')) return;
    
    try {
      const success = await deletePage(id, siteId);
      if (success) {
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
            await handleSelectPage(next.id);
          } else {
            setCurrentPageId(null);
          }
        }
        toast.success('Sayfa başarıyla silindi!');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Sayfa silinemedi');
    }
  }, [loadPages, selectedLanguageId, currentPageId, handleSelectPage, siteId]);

  const handleDuplicatePage = useCallback(async (id: string) => {
    const pageToDuplicate = pages.find(p => p.id === id);
    if (!pageToDuplicate) return;
    
    try {
      // Kopyalanacak sayfanın verilerini hazırla
      const duplicatedPage = {
        title: `${pageToDuplicate.title} (Kopya)`,
        slug: `${pageToDuplicate.slug}-kopya`,
        content: pageToDuplicate.content,
        seo: pageToDuplicate.seo,
        isActive: pageToDuplicate.isActive,
        languageId: pageToDuplicate.languageId,
      };
      
      // Slug benzersizliğini kontrol et
      const duplicateSlug = pages.some(
        (p) => normalizeSlug(p.slug) === normalizeSlug(duplicatedPage.slug)
      );
      
      if (duplicateSlug) {
        // Benzersiz slug bul
        let counter = 1;
        let newSlug = duplicatedPage.slug;
        while (pages.some(p => normalizeSlug(p.slug) === normalizeSlug(newSlug))) {
          newSlug = `${pageToDuplicate.slug}-kopya-${counter}`;
          counter++;
        }
        duplicatedPage.slug = newSlug;
      }
      
      // Sayfayı ekle
      const result = await addPage(duplicatedPage, siteId);
      if (result) {
        await loadPages();
        toast.success('Sayfa başarıyla kopyalandı!');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Sayfa kopyalanamadı');
    }
  }, [pages, addPage, loadPages, normalizeSlug, siteId]);

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

      // Kullanıcı yazdıysa olduğu gibi, boşsa ana sayfa "/" kabul edilir
      const trimmed = slug.trim();
      const finalSlug = trimmed === '' ? '/' : trimmed;

      const payload: Omit<Page, 'id'> = {
        title: title,
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

      if (!currentPageId) {
        const duplicateTitle = pages.some(
          (p) => p.title.trim().toLowerCase() === normalizedTitle
        );
        const duplicateSlug = pages.some(
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
        const duplicateTitle = pages.some(
          (p) => p.id !== currentPageId && p.title.trim().toLowerCase() === normalizedTitle
        );
        const duplicateSlug = pages.some(
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
        const updated = (await updatePagePrivate(currentPageId, payload, siteId))
          || (await updatePage(currentPageId, payload, siteId));
        if (!updated) throw new Error('Sayfa güncellenemedi');
      } else {
        const created = (await createPagePrivate(payload, siteId))
          || (await addPage(payload, siteId));
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
  }, [appStore, currentPageId, loadPages, editingPage, newPage, selectedLanguageId, pages, siteId]);

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