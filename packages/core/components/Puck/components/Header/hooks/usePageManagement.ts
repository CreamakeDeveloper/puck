import { useState, useCallback, useMemo } from "react";
import { useAppStore, useAppStoreApi } from "../../../../../store";
import { Page, SEO, ThemeHeader, ThemeFooter } from "../types";
import {
  getPages, getPage, addPage, updatePage, deletePage,
  createPagePrivate, updatePagePrivate,
  getThemeHeaders, getThemeHeader, addThemeHeader, updateThemeHeader, deleteThemeHeader,
  getThemeFooters, getThemeFooter, addThemeFooter, updateThemeFooter, deleteThemeFooter
} from "../api";
import toast from "react-hot-toast";

type Mode = "page" | "header" | "footer";

export const usePageManagement = (
  selectedLanguageId: string | null,
  options?: { mode?: Mode; themeId?: string }
) => {
  const mode = options?.mode || "page";
  const themeId = options?.themeId || null;

  const [items, setItems] = useState<(Page | ThemeHeader | ThemeFooter)[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newItem, setNewItem] = useState<any>({
    title: "",
    slug: "",
    content: "",
    seo: undefined,
    isActive: true,
    languageId: undefined,
    themeId: themeId || undefined
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const dispatch = useAppStore((s) => s.dispatch);
  const appStore = useAppStoreApi();

  const api = useMemo(() => {
    if (mode === "header") {
      return {
        getAll: () => {
          if (!themeId) throw new Error("Theme ID gerekli");
          return getThemeHeaders(themeId);
        },
        getOne: getThemeHeader,
        add: addThemeHeader,
        update: updateThemeHeader,
        delete: deleteThemeHeader
      };
    }
    if (mode === "footer") {
      return {
        getAll: () => {
          if (!themeId) throw new Error("Theme ID gerekli");
          return getThemeFooters(themeId);
        },
        getOne: getThemeFooter,
        add: addThemeFooter,
        update: updateThemeFooter,
        delete: deleteThemeFooter
      };
    }
    // default: page
    return {
      getAll: getPages,
      getOne: getPage,
      add: addPage,
      update: updatePage,
      delete: deletePage
    };
  }, [mode, themeId]);
  
  /** Liste yükleme */
  const loadItems = useCallback(async () => {
    if ((mode === "header" || mode === "footer") && !themeId) {
      toast.error("Theme ID gerekli");
      return [];
    }
    const data = await api.getAll();
    setItems(data);
    return data;
  }, [api, mode, themeId]);

  /** Slug normalize */
  const normalizeSlug = useCallback((value: string) => {
    return value.trim().toLowerCase().replace(/^\/+/, "");
  }, []);

  /** Seçim */
  const handleSelect = useCallback(async (id: string) => {
    const selected = await api.getOne(id);
    if (!selected) return;

    const safeParseContent = (value: unknown) => {
      if (!value) return [] as any[];
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          return [];
        }
      }
      return value as any[];
    };

    dispatch({
      type: "setData",
      data: (prevData: any) => ({
        ...prevData,
        content: safeParseContent(selected.content),
        root: {
          ...prevData?.root,
          props: {
            ...prevData?.root?.props,
            title: (selected as Page).title ?? prevData?.root?.props?.title,
            slug: (selected as Page).slug ?? prevData?.root?.props?.slug,
            seo: selected.seo ?? prevData?.root?.props?.seo
          }
        }
      })
    });

    setCurrentId(id);
  }, [api, dispatch]);

  /** Ekleme */
  const handleAdd = useCallback(async () => {
    if (mode === "page" && !newItem.title.trim()) {
      toast.error("Sayfa başlığı boş bırakılamaz!");
      return;
    }

    try {
      const result = await api.add({
        ...newItem,
        themeId: themeId || undefined,
        languageId: mode === "page" ? (newItem.languageId || selectedLanguageId) : undefined
      });
      if (result) {
        setCurrentId(result.id);
        await handleSelect(result.id);
        await loadItems();
        setNewItem({
          title: "",
          slug: "",
          content: "",
          seo: undefined,
          isActive: true,
          languageId: undefined,
          themeId: themeId || undefined
        });
        setModalOpen(false);
        toast.success(`${mode} başarıyla eklendi!`);
      }
    } catch (e: any) {
      toast.error(e?.message || `${mode} eklenemedi`);
    }
  }, [api, mode, newItem, loadItems, handleSelect, selectedLanguageId, themeId]);

  /** Güncelleme */
  const handleUpdate = useCallback(async () => {
    if (!editingItem) return;

    if (mode === "page" && !editingItem.title.trim()) {
      toast.error("Sayfa başlığı boş bırakılamaz!");
      return;
    }

    try {
      const result = await api.update(editingItem.id, { ...editingItem });
      if (result) {
        await loadItems();
        setEditingItem(null);
        setModalOpen(false);
        toast.success(`${mode} başarıyla güncellendi!`);
      }
    } catch (e: any) {
      toast.error(e?.message || `${mode} güncellenemedi`);
    }
  }, [api, mode, editingItem, loadItems]);

  /** Silme */
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm(`Bu ${mode} silinsin mi?`)) return;
    try {
      const success = await api.delete(id);
      if (success) {
        const data = await loadItems();
        const currentStillValid = !!data.find((p: any) => p.id === currentId);
        if (!currentStillValid) {
          const next = data[0];
          if (next) {
            await handleSelect(next.id);
          } else {
            setCurrentId(null);
          }
        }
        toast.success(`${mode} başarıyla silindi!`);
      }
    } catch (e: any) {
      toast.error(e?.message || `${mode} silinemedi`);
    }
  }, [api, mode, currentId, handleSelect, loadItems]);

  /** Yayınlama */
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

      const mergedSeo: SEO | undefined = {
        ...(editingItem?.seo || {}),
        ...(newItem?.seo || {}),
        ...(rootProps.seo || {})
      };

      let payload: any = {
        content: JSON.stringify(data?.content ?? []),
        seo: mergedSeo
      };

      if (mode === "page") {
        payload = {
          ...payload,
          title: rootProps.title ?? editingItem?.title ?? newItem?.title,
          slug: rootProps.slug ?? editingItem?.slug ?? newItem?.slug,
          isActive: rootProps.isActive ?? editingItem?.isActive ?? newItem?.isActive ?? true,
          languageId: editingItem?.languageId ?? newItem?.languageId ?? selectedLanguageId
        };
      } else {
        payload.themeId = themeId;
      }

      if (currentId) {
        await api.update(currentId, payload);
      } else {
        const created = await api.add(payload);
        setCurrentId(created.id);
      }

      await loadItems();
      toast.success(`${mode} başarıyla kaydedildi!`);
      onPublish && onPublish(data);
    } catch (e: any) {
      toast.error(e?.message || `${mode} kaydedilemedi`);
    } finally {
      setIsPublishing(false);
    }
  }, [api, mode, appStore, currentId, loadItems, editingItem, newItem, selectedLanguageId, themeId]);

  const filteredItems = useMemo(() => {
    let filtered = items;
    if (mode === "page") {
      filtered = filtered.filter((page: any) => page.isActive !== false);
      if (selectedLanguageId) {
        filtered = filtered.filter((page: any) => page.languageId === selectedLanguageId);
      }
    }
    return filtered;
  }, [items, mode, selectedLanguageId]);

  return {
  // Eski API ile uyumlu alanlar
  pages: items as Page[],
  filteredPages: filteredItems as Page[],
  currentPageId: currentId,
  editingPage: editingItem,
  newPage: newItem,
  modalOpen,
  isPublishing,

  // Eski isimlere denk gelen fonksiyonlar
  loadPages: loadItems,
  handleSelectPage: handleSelect,
  handleAddPage: handleAdd,
  handleUpdatePage: handleUpdate,
  handleDeletePage: handleDelete,
  handlePublish,

  // State setter’lar
  setEditingPage: setEditingItem,
  setNewPage: setNewItem,
  setModalOpen,
  setCurrentPageId: setCurrentId,
};

};
