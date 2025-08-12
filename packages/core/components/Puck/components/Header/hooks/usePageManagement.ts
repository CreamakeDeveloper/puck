import { useState, useCallback, useMemo, useRef } from "react";
import { useAppStore, useAppStoreApi } from "../../../../../store";
import { Page, SEO } from "../types";
import { getPages, getPage, addPage, updatePage, deletePage, createPagePrivate, updatePagePrivate } from "../api";
import toast from "react-hot-toast";

export const usePageManagement = (selectedLanguageId: string | null) => {
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
    const pagesData = await getPages();
    setPages(pagesData);
    return pagesData;
  }, []);

  const handleSelectPage = useCallback(async (id: string) => {
    const selected = await getPage(id);
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
  }, [dispatch]);

  const handleAddPage = useCallback(async () => {
    // Form validasyonu
    if (!newPage.title.trim()) {
      toast.error('Sayfa başlığı boş bırakılamaz!');
      return;
    }

    // Slug otomatik düzenleme - boş ise ana sayfa için "/" yap
    let finalSlug = newPage.slug.trim();
    if (!finalSlug) {
      finalSlug = '/';
    } else if (!finalSlug.startsWith('/')) {
      finalSlug = '/' + finalSlug;
    }

    const duplicateTitle = pages.some(
      (p) => p.title.trim().toLowerCase() === newPage.title.trim().toLowerCase()
    );
    const duplicateSlug = pages.some(
      (p) => p.slug.trim().toLowerCase() === finalSlug.toLowerCase()
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
      });
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
  }, [newPage, loadPages, pages, handleSelectPage, selectedLanguageId]);

  const handleUpdatePage = useCallback(async () => {
    if (!editingPage) return;
    
    // Form validasyonu
    if (!editingPage.title.trim()) {
      toast.error('Sayfa başlığı boş bırakılamaz!');
      return;
    }

    // Slug düzenleme
    let finalSlug = editingPage.slug.trim();
    if (!finalSlug) {
      finalSlug = '/';
    } else if (!finalSlug.startsWith('/')) {
      finalSlug = '/' + finalSlug;
    }

    try {
      const result = await updatePage(editingPage.id, { ...editingPage, slug: finalSlug });
      if (result) {
        await loadPages();
        setEditingPage(null);
        setModalOpen(false);
        toast.success('Sayfa başarıyla güncellendi!');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Sayfa güncellenemedi');
    }
  }, [editingPage, loadPages]);

  const handleDeletePage = useCallback(async (id: string) => {
    if (!confirm('Bu sayfayı silmek istediğinizden emin misiniz?')) return;
    
    try {
      const success = await deletePage(id);
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
  }, [loadPages, selectedLanguageId, currentPageId, handleSelectPage]);

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

      // Slug otomatik düzenleme
      let finalSlug = slug.trim();
      if (!finalSlug) {
        finalSlug = '/';
      } else if (!finalSlug.startsWith('/')) {
        finalSlug = '/' + finalSlug;
      }

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
      const normalizedSlug = payload.slug.toLowerCase();

      if (!currentPageId) {
        const duplicateTitle = pages.some(
          (p) => p.title.trim().toLowerCase() === normalizedTitle
        );
        const duplicateSlug = pages.some(
          (p) => p.slug.toLowerCase() === normalizedSlug
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
          (p) => p.id !== currentPageId && p.slug.toLowerCase() === normalizedSlug
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
        const updated = (await updatePagePrivate(currentPageId, payload))
          || (await updatePage(currentPageId, payload));
        if (!updated) throw new Error('Sayfa güncellenemedi');
      } else {
        const created = (await createPagePrivate(payload))
          || (await addPage(payload));
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
  }, [appStore, currentPageId, loadPages, editingPage, newPage, selectedLanguageId, pages]);

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
    handlePublish,
    setEditingPage,
    setNewPage,
    setModalOpen,
    setCurrentPageId,
  };
};