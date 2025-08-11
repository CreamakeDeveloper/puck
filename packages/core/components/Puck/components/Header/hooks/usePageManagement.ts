import { useState, useCallback, useMemo, useRef } from "react";
import { useAppStore, useAppStoreApi } from "../../../../../store";
import { Page, SEO } from "../types";
import { getPages, getPage, addPage, updatePage, deletePage, createPagePrivate, updatePagePrivate } from "../api";

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
    if (!newPage.title || !newPage.slug) return;

    const duplicateTitle = pages.some(
      (p) => p.title.trim().toLowerCase() === newPage.title.trim().toLowerCase()
    );
    const duplicateSlug = pages.some(
      (p) => p.slug.trim().toLowerCase() === newPage.slug.trim().toLowerCase()
    );
    if (duplicateTitle || duplicateSlug) {
      window.alert(
        duplicateSlug
          ? 'Aynı slug ile bir sayfa zaten mevcut.'
          : 'Aynı başlık ile bir sayfa zaten mevcut.'
      );
      return;
    }

    try {
      const result = await addPage({
        title: newPage.title,
        slug: newPage.slug,
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
      }
    } catch (e: any) {
      window.alert(e?.message || 'Sayfa eklenemedi');
    }
  }, [newPage, loadPages, pages, handleSelectPage, selectedLanguageId]);

  const handleUpdatePage = useCallback(async () => {
    if (!editingPage) return;
    
    const result = await updatePage(editingPage.id, editingPage);
    if (result) {
      await loadPages();
      setEditingPage(null);
      setModalOpen(false);
    }
  }, [editingPage, loadPages]);

  const handleDeletePage = useCallback(async (id: string) => {
    if (!confirm('Bu sayfayı silmek istediğinizden emin misiniz?')) return;
    
    const success = await deletePage(id);
    if (success) {
      await loadPages();
    }
  }, [loadPages]);

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

      const payload: Omit<Page, 'id'> = {
        title: rootProps.title ?? editingPage?.title ?? newPage?.title ?? '',
        slug: rootProps.slug ?? editingPage?.slug ?? newPage?.slug ?? '',
        content: JSON.stringify(data?.content ?? []),
        seo: mergedSeo,
        isActive:
          rootProps.isActive ??
          editingPage?.isActive ??
          newPage?.isActive ??
          true,
        languageId: (editingPage?.languageId ?? newPage?.languageId ?? selectedLanguageId) || undefined,
      };

      const normalizedTitle = (payload.title || '').trim().toLowerCase();
      const normalizedSlug = (payload.slug || '').trim().toLowerCase();

      if (!currentPageId) {
        const duplicateTitle = pages.some(
          (p) => p.title.trim().toLowerCase() === normalizedTitle
        );
        const duplicateSlug = pages.some(
          (p) => p.slug.trim().toLowerCase() === normalizedSlug
        );
        if (duplicateTitle || duplicateSlug) {
          window.alert(
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
          (p) => p.id !== currentPageId && p.slug.trim().toLowerCase() === normalizedSlug
        );
        if (duplicateTitle || duplicateSlug) {
          window.alert(
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

      onPublish && onPublish(data);
    } catch (e) {
      console.error('Yayınlama sırasında hata:', e);
    } finally {
      setIsPublishing(false);
    }
  }, [appStore, currentPageId, loadPages, editingPage, newPage, selectedLanguageId, pages]);

  const filteredPages = useMemo(() => {
    let filtered = pages;
    
    // Dil filtresi
    if (selectedLanguageId) {
      filtered = filtered.filter(page => page.languageId === selectedLanguageId);
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