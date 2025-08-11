import React, { memo, useCallback, useMemo, useState, useEffect, useRef } from "react";
import { useAppStore, useAppStoreApi } from "../../../../store";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Globe,
  PanelLeft,
  PanelRight,
  Plus,
  Edit,
  Trash,
  FileText,
  Search,
  Command,
} from "lucide-react";
import { Heading } from "../../../Heading";
import { IconButton } from "../../../IconButton/IconButton";
import { MenuBar } from "../../../MenuBar";
import { Button } from "../../../Button";
import { Config, Overrides, UserGenerics } from "../../../../types";
import { DefaultOverride } from "../../../DefaultOverride";
import { usePropsContext } from "../..";
import { getClassNameFactory } from "../../../../lib";
import styles from "./styles.module.css";

// Page tipi tanımı
type SEO = {
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  jsonLd?: string;
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
    url?: string;
  };
  [key: string]: any;
};

type Language = {
  id: string;
  name: string;
  code: string;
  isDefault?: boolean;
  isActive?: boolean;
};

type Page = {
  id: string;
  title: string;
  slug: string;
  content: string;
  seo?: SEO;
  isActive?: boolean;
  languageId?: string; // Dil ID'si eklendi
};

// API fonksiyonları
const getPages = async (): Promise<Page[]> => {
  try {
    const response = await fetch('/api/pages');
    if (!response.ok) throw new Error('Sayfalar getirilemedi');
    return response.json();
  } catch (error) {
    console.error('Sayfa listesi alınırken hata:', error);
    return [];
  }
};

const getPage = async (id: string): Promise<Page | null> => {
  try {
    const response = await fetch(`/api/pages/${id}`);
    if (!response.ok) throw new Error('Sayfa getirilemedi');
    return response.json();
  } catch (error) {
    console.error('Sayfa alınırken hata:', error);
    return null;
  }
};

const addPage = async (page: Omit<Page, 'id'>): Promise<Page | null> => {
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

const updatePage = async (id: string, data: Partial<Page>): Promise<Page | null> => {
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

const deletePage = async (id: string): Promise<boolean> => {
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
const getLanguages = async (): Promise<Language[]> => {
  try {
    const response = await fetch('/api/languages');
    if (!response.ok) throw new Error('Diller getirilemedi');
    return response.json();
  } catch (error) {
    console.error('Dil listesi alınırken hata:', error);
    return [];
  }
};

const addLanguage = async (language: Omit<Language, 'id'>): Promise<Language | null> => {
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

const updateLanguage = async (id: string, data: Partial<Language>): Promise<Language | null> => {
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

const deleteLanguage = async (id: string): Promise<boolean> => {
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
const createPagePrivate = async (
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

const updatePagePrivate = async (
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

const getClassName = getClassNameFactory("PuckHeader", styles);

const HeaderInner = <
  UserConfig extends Config = Config,
  G extends UserGenerics<UserConfig> = UserGenerics<UserConfig>
>() => {
  const {
    onPublish,
    renderHeader,
    renderHeaderActions,
    headerTitle,
    headerPath,
    iframe: _iframe,
    onBack,
    backButtonText = "Geri Dön",
    backButtonIcon = ArrowLeft,
  } = usePropsContext();
  
  const [pages, setPages] = useState<Page[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [languageModalOpen, setLanguageModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [newPage, setNewPage] = useState<Omit<Page, 'id'>>({
    title: '',
    slug: '',
    content: '',
    seo: undefined,
    isActive: true,
    languageId: undefined,
  });
  const [newLanguage, setNewLanguage] = useState<Omit<Language, 'id'>>({
    name: '',
    code: '',
    isDefault: false,
    isActive: true,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [seoOpen, setSeoOpen] = useState(false);
  const [seoActiveTab, setSeoActiveTab] = useState<'general' | 'jsonld' | 'opengraph' | 'preview'>('general');
  const commandWrapperRef = useRef<HTMLDivElement | null>(null);
  const seoWrapperRef = useRef<HTMLDivElement | null>(null);
  const languageWrapperRef = useRef<HTMLDivElement | null>(null);
  const languageInitializedRef = useRef<boolean>(false);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [languageSearchTerm, setLanguageSearchTerm] = useState('');

  const dispatch = useAppStore((s) => s.dispatch);
  const appStore = useAppStoreApi();

  const loadPages = useCallback(async () => {
    const pagesData = await getPages();
    setPages(pagesData);
  }, []);

  const loadLanguages = useCallback(async () => {
    const languagesData = await getLanguages();
    setLanguages(languagesData);

    // Varsayılan dili sadece ilk yüklemede ata. Kullanıcı "Tüm Diller" (null) seçerse
    // sonraki yüklemelerde varsayılanla ezilmesin.
    if (!languageInitializedRef.current) {
      const defaultLanguage = languagesData.find((lang) => lang.isDefault);
      if (defaultLanguage && !selectedLanguageId) {
        setSelectedLanguageId(defaultLanguage.id);
      }
      languageInitializedRef.current = true;
    }
  }, [selectedLanguageId]);

  useEffect(() => {
    loadPages();
    loadLanguages();
  }, [loadPages, loadLanguages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        dropdownOpen &&
        commandWrapperRef.current &&
        !commandWrapperRef.current.contains(target)
      ) {
        setDropdownOpen(false);
      }

      if (
        seoOpen &&
        seoWrapperRef.current &&
        !seoWrapperRef.current.contains(target)
      ) {
        setSeoOpen(false);
      }

      if (
        languageDropdownOpen &&
        languageWrapperRef.current &&
        !languageWrapperRef.current.contains(target)
      ) {
        setLanguageDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen, seoOpen, languageDropdownOpen]);

  // Klavye kısayolları: Ctrl+K -> Sayfalama (sayfa listesi) aç, Ctrl+L -> SEO aç
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey;
      if (!isModifier) return;

      const target = e.target as HTMLElement | null;
      const tagName = (target?.tagName || '').toLowerCase();
      const isEditable =
        tagName === 'input' ||
        tagName === 'textarea' ||
        (target && (target as any).isContentEditable);
      if (isEditable) return;

      const key = e.key.toLowerCase();

      if (key === 'k') {
        e.preventDefault();
        setDropdownOpen(true);
        setSeoOpen(false);
        setLanguageDropdownOpen(false);
      }
      if (key === 'l') {
        e.preventDefault();
        setSeoOpen(true);
        setDropdownOpen(false);
        setLanguageDropdownOpen(false);
      }
      if (key === 'g') {
        e.preventDefault();
        setLanguageDropdownOpen(true);
        setDropdownOpen(false);
        setSeoOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
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

    setDropdownOpen(false);
    setCurrentPageId(id);
    setSelectedLanguageId(selected.languageId || null);
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

  // Dil yönetimi fonksiyonları
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
      const result = await addLanguage(newLanguage);
      if (result) {
        await loadLanguages();
        setNewLanguage({ name: '', code: '', isDefault: false, isActive: true });
        setLanguageModalOpen(false);
      }
    } catch (e: any) {
      window.alert(e?.message || 'Dil eklenemedi');
    }
  }, [newLanguage, loadLanguages, languages]);

  const handleUpdateLanguage = useCallback(async () => {
    if (!editingLanguage) return;
    
    const result = await updateLanguage(editingLanguage.id, editingLanguage);
    if (result) {
      await loadLanguages();
      setEditingLanguage(null);
      setLanguageModalOpen(false);
    }
  }, [editingLanguage, loadLanguages]);

  const handleDeleteLanguage = useCallback(async (id: string) => {
    if (!confirm('Bu dili silmek istediğinizden emin misiniz?')) return;
    
    const success = await deleteLanguage(id);
    if (success) {
      await loadLanguages();
    }
  }, [loadLanguages]);

  

  const handlePublish = useCallback(async () => {
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

      onPublish && onPublish(data as G["UserData"]);
    } catch (e) {
      console.error('Yayınlama sırasında hata:', e);
    } finally {
      setIsPublishing(false);
    }
  }, [appStore, currentPageId, onPublish, loadPages, editingPage]);

  const filteredPages = useMemo(() => {
    let filtered = pages;
    
    // Dil filtresi
    if (selectedLanguageId) {
      filtered = filtered.filter(page => page.languageId === selectedLanguageId);
    }
    
    // Arama filtresi
    if (searchTerm) {
      filtered = filtered.filter(page => 
        page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        page.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [pages, searchTerm, selectedLanguageId]);

  const defaultHeaderRender = useMemo((): Overrides["header"] => {
    if (renderHeader) {
      console.warn(
        "`renderHeader` is deprecated. Please use `overrides.header` and the `usePuck` hook instead"
      );

      const RenderHeader = ({ actions, ...props }: any) => {
        const Comp = renderHeader!;

        const appState = useAppStore((s) => s.state);

        return (
          <Comp {...props} dispatch={dispatch} state={appState}>
            {actions}
          </Comp>
        );
      };

      return RenderHeader;
    }

    return DefaultOverride;
  }, [renderHeader]);

  const defaultHeaderActionsRender = useMemo((): Overrides["headerActions"] => {
    if (renderHeaderActions) {
      console.warn(
        "`renderHeaderActions` is deprecated. Please use `overrides.headerActions` and the `usePuck` hook instead."
      );

      const RenderHeader = (props: any) => {
        const Comp = renderHeaderActions!;

        const appState = useAppStore((s) => s.state);

        return <Comp {...props} dispatch={dispatch} state={appState}></Comp>;
      };

      return RenderHeader;
    }

    return DefaultOverride;
  }, [renderHeader]);

  const CustomHeader = useAppStore(
    (s) => s.overrides.header || defaultHeaderRender
  );

  const CustomHeaderActions = useAppStore(
    (s) => s.overrides.headerActions || defaultHeaderActionsRender
  );

  const [menuOpen, setMenuOpen] = useState(false);

  const rootTitle = useAppStore((s) => {
    const rootData = s.state.indexes.nodes["root"]?.data as G["UserRootProps"];

    return rootData.props.title ?? "";
  });

  const seoTitle = useAppStore(
    (s) => ((s.state.indexes.nodes["root"]?.data as any)?.props?.seo?.title as string) ?? ""
  );
  const seoDescription = useAppStore(
    (s) => ((s.state.indexes.nodes["root"]?.data as any)?.props?.seo?.description as string) ?? ""
  );
  const seoCanonical = useAppStore(
    (s) => ((s.state.indexes.nodes["root"]?.data as any)?.props?.seo?.canonical as string) ?? ""
  );
  const seoRobots = useAppStore(
    (s) => ((s.state.indexes.nodes["root"]?.data as any)?.props?.seo?.robots as string) ?? "index"
  );

  const rootSlug = useAppStore((s) => {
    const rootData = s.state.indexes.nodes["root"]?.data as any;
    return rootData?.props?.slug ?? "";
  });

  const seoJsonLd = useAppStore(
    (s) => ((s.state.indexes.nodes["root"]?.data as any)?.props?.seo?.jsonLd as string) ?? ""
  );
  const seoOgTitle = useAppStore(
    (s) => ((s.state.indexes.nodes["root"]?.data as any)?.props?.seo?.openGraph?.title as string) ?? ""
  );
  const seoOgDescription = useAppStore(
    (s) => ((s.state.indexes.nodes["root"]?.data as any)?.props?.seo?.openGraph?.description as string) ?? ""
  );
  const seoOgImage = useAppStore(
    (s) => ((s.state.indexes.nodes["root"]?.data as any)?.props?.seo?.openGraph?.image as string) ?? ""
  );
  const seoOgType = useAppStore(
    (s) => ((s.state.indexes.nodes["root"]?.data as any)?.props?.seo?.openGraph?.type as string) ?? ""
  );
  const seoOgUrl = useAppStore(
    (s) => ((s.state.indexes.nodes["root"]?.data as any)?.props?.seo?.openGraph?.url as string) ?? ""
  );

  const leftSideBarVisible = useAppStore((s) => s.state.ui.leftSideBarVisible);
  const rightSideBarVisible = useAppStore(
    (s) => s.state.ui.rightSideBarVisible
  );

  const toggleSidebars = useCallback(
    (sidebar: "left" | "right") => {
      const widerViewport = window.matchMedia("(min-width: 638px)").matches;
      const sideBarVisible =
        sidebar === "left" ? leftSideBarVisible : rightSideBarVisible;
      const oppositeSideBar =
        sidebar === "left" ? "rightSideBarVisible" : "leftSideBarVisible";

      dispatch({
        type: "setUi",
        ui: {
          [`${sidebar}SideBarVisible`]: !sideBarVisible,
          ...(!widerViewport ? { [oppositeSideBar]: false } : {}),
        },
      });
    },
    [dispatch, leftSideBarVisible, rightSideBarVisible]
  );

  // SEO dropdown açıldığında canonical alanını uygun şekilde otomatik doldur (opsiyonel)
  useEffect(() => {
    if (!seoOpen) return;

    const hasWindow = typeof window !== "undefined";
    const origin = hasWindow ? window.location.origin : "";
    const currentPath = (headerPath && headerPath.toString()) || (rootSlug ? `/${rootSlug}` : (hasWindow ? window.location.pathname : ""));
    const computedCanonical = origin && currentPath ? `${origin}${currentPath.startsWith("/") ? "" : "/"}${currentPath}` : "";

    if (!seoCanonical && computedCanonical) {
      dispatch({
        type: 'setData',
        data: (prev: any) => ({
          ...prev,
          root: {
            ...prev?.root,
            props: {
              ...prev?.root?.props,
              seo: { ...prev?.root?.props?.seo, canonical: computedCanonical },
            },
          },
        }),
      });
    }

    const effectiveCanonical = seoCanonical || computedCanonical;
    if (!seoOgUrl && effectiveCanonical) {
      dispatch({
        type: 'setData',
        data: (prev: any) => ({
          ...prev,
          root: {
            ...prev?.root,
            props: {
              ...prev?.root?.props,
              seo: {
                ...prev?.root?.props?.seo,
                openGraph: {
                  ...(prev?.root?.props?.seo?.openGraph ?? {}),
                  url: effectiveCanonical,
                },
              },
            },
          },
        }),
      });
    }

    const effectiveTitle = seoTitle || rootTitle || "";

    // JSON-LD varsayılanı (boşsa doldur)
    if (!seoJsonLd) {
      const jsonLdObj: any = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: effectiveTitle,
      };
      if (effectiveCanonical) jsonLdObj.url = effectiveCanonical;

      dispatch({
        type: 'setData',
        data: (prev: any) => ({
          ...prev,
          root: {
            ...prev?.root,
            props: {
              ...prev?.root?.props,
              seo: { ...prev?.root?.props?.seo, jsonLd: JSON.stringify(jsonLdObj, null, 2) },
            },
          },
        }),
      });
    }

    // Open Graph varsayılanları (eksik olanları doldur)
    if (!seoOgUrl || !seoOgType || !seoOgTitle || !seoOgDescription) {
      dispatch({
        type: 'setData',
        data: (prev: any) => ({
          ...prev,
          root: {
            ...prev?.root,
            props: {
              ...prev?.root?.props,
              seo: {
                ...prev?.root?.props?.seo,
                openGraph: {
                  ...(prev?.root?.props?.seo?.openGraph ?? {}),
                  url: (prev?.root?.props?.seo?.openGraph?.url ?? effectiveCanonical) ?? undefined,
                  type: prev?.root?.props?.seo?.openGraph?.type ?? 'website',
                  title: prev?.root?.props?.seo?.openGraph?.title ?? effectiveTitle,
                  description: prev?.root?.props?.seo?.openGraph?.description ?? seoDescription ?? '',
                },
              },
            },
          },
        }),
      });
    }
  }, [seoOpen]);

  return (
    <CustomHeader
      actions={
        <>
          <CustomHeaderActions>
            <Button
              onClick={handlePublish}
              icon={<Globe size="14px" />}
            >
              {isPublishing ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </CustomHeaderActions>
        </>
      }
    >
      <header
        className={getClassName({ leftSideBarVisible, rightSideBarVisible })}
      >
        <div className={getClassName("inner")}>
          <div className={getClassName("toggle")}>
            {onBack && (
              <div className={getClassName("backButton-container")}>
                <button
                  className={getClassName("backButton")}
                  onClick={onBack}
                  type="button"
                  title={backButtonText}
                >
                  {backButtonIcon && React.createElement(backButtonIcon, { size: 24 })}
                  <span>{backButtonText}</span>
                </button>
              </div>
            )}
            <div className={getClassName("leftSideBarToggle")}>
              <IconButton
                type="button"
                onClick={() => {
                  toggleSidebars("left");
                }}
                title="Sol taraflı menüyü aç/kapat"
              >
                <PanelLeft focusable="false" />
              </IconButton>
            </div>
            <div className={getClassName("rightSideBarToggle")}>
              <IconButton
                type="button"
                onClick={() => {
                  toggleSidebars("right");
                }}
                title="Sağ taraflı menüyü aç/kapat"
              >
                <PanelRight focusable="false" />
              </IconButton>
            </div>
            <div
              ref={seoWrapperRef}
              className={getClassName("seoSettingsWrapper")}
              style={{ marginLeft: 130, position: "relative" }}
            >
              <button
                className={getClassName("commandButton")}
                onClick={() => setSeoOpen(!seoOpen)}
                type="button"
                title="SEO Ayarları"
              >
                <div className={getClassName("commandButtonLeft")}>
                  <Search size={18} className={getClassName("commandIcon")} />
                  <span className={getClassName("commandText")}>SEO</span>
                </div>
                <div className={getClassName("commandButtonRight")}>
                  <span className={getClassName("commandHint")}>⌘/CTRL + L</span>
                  <ChevronDown
                    size={16}
                    className={`${getClassName("commandChevron")} ${seoOpen ? getClassName("commandChevron--open") : ""}`}
                  />
                </div>
              </button>

              {seoOpen && (
                  <div className={getClassName("commandPalette")} style={{ width: 420 }}>
                  <div className={getClassName("commandPaletteHeader")}> 
                    <div className={getClassName("sectionHeader")}>
                      <span>SEO Ayarları</span>
                    </div>
                    <div style={{display:'flex', gap:8, marginTop:8}}>
                      <button type="button" className={getClassName("commandItem")} onClick={() => setSeoActiveTab('general')} style={{padding:'8px 10px', borderRadius:6, border: seoActiveTab==='general' ? '1px solid var(--puck-color-grey-09)' : '1px solid transparent', background: seoActiveTab==='general' ? 'var(--puck-color-grey-11)' : 'transparent'}}>Genel</button>
                      <button type="button" className={getClassName("commandItem")} onClick={() => setSeoActiveTab('jsonld')} style={{padding:'8px 10px', borderRadius:6, border: seoActiveTab==='jsonld' ? '1px solid var(--puck-color-grey-09)' : '1px solid transparent', background: seoActiveTab==='jsonld' ? 'var(--puck-color-grey-11)' : 'transparent'}}>JSON-LD</button>
                      <button type="button" className={getClassName("commandItem")} onClick={() => setSeoActiveTab('opengraph')} style={{padding:'8px 10px', borderRadius:6, border: seoActiveTab==='opengraph' ? '1px solid var(--puck-color-grey-09)' : '1px solid transparent', background: seoActiveTab==='opengraph' ? 'var(--puck-color-grey-11)' : 'transparent'}}>Open Graph</button>
                      <button type="button" className={getClassName("commandItem")} onClick={() => setSeoActiveTab('preview')} style={{padding:'8px 10px', borderRadius:6, border: seoActiveTab==='preview' ? '1px solid var(--puck-color-grey-09)' : '1px solid transparent', background: seoActiveTab==='preview' ? 'var(--puck-color-grey-11)' : 'transparent'}}>Önizleme</button>
                    </div>
                  </div>
                  <div className={getClassName("commandList")}>
                    {seoActiveTab === 'general' && (
                    <div className={getClassName("formGroup")}>
                      <label>Meta Başlık</label>
                      <input
                        type="text"
                        value={seoTitle}
                        onChange={(e) => {
                          dispatch({
                            type: 'setData',
                            data: (prev: any) => ({
                              ...prev,
                              root: {
                                ...prev?.root,
                                props: {
                                  ...prev?.root?.props,
                                  seo: { ...prev?.root?.props?.seo, title: e.target.value },
                                },
                              },
                            }),
                          });
                        }}
                        className={getClassName("input")}
                      />
                    </div>
                    )}
                    {seoActiveTab === 'general' && (
                    <div className={getClassName("formGroup")}>
                      <label>Meta Açıklama</label>
                      <textarea
                        value={seoDescription}
                        onChange={(e) => {
                          dispatch({
                            type: 'setData',
                            data: (prev: any) => ({
                              ...prev,
                              root: {
                                ...prev?.root,
                                props: {
                                  ...prev?.root?.props,
                                  seo: { ...prev?.root?.props?.seo, description: e.target.value },
                                },
                              },
                            }),
                          });
                        }}
                        className={getClassName("textarea")}
                        rows={3}
                      />
                    </div>
                    )}
                      <div className={getClassName("formGroup")}>
                        <label>Canonical (opsiyonel)</label>
                        <input
                          type="text"
                          value={seoCanonical}
                          onChange={(e) => {
                            dispatch({
                              type: 'setData',
                              data: (prev: any) => ({
                                ...prev,
                                root: {
                                  ...prev?.root,
                                  props: {
                                    ...prev?.root?.props,
                                    seo: { ...prev?.root?.props?.seo, canonical: e.target.value },
                                  },
                                },
                              }),
                            });
                          }}
                          className={getClassName("input")}
                        />
                      </div>
                    {seoActiveTab === 'general' && (
                    <div className={getClassName("formGroup")}>
                      <label>Robots</label>
                      <select
                        value={seoRobots}
                        onChange={(e) => {
                          dispatch({
                            type: 'setData',
                            data: (prev: any) => ({
                              ...prev,
                              root: {
                                ...prev?.root,
                                props: {
                                  ...prev?.root?.props,
                                  seo: { ...prev?.root?.props?.seo, robots: e.target.value },
                                },
                              },
                            }),
                          });
                        }}
                        className={getClassName("input")}
                      >
                        <option value="index">index</option>
                        <option value="noindex">noindex</option>
                        <option value="follow">follow</option>
                        <option value="nofollow">nofollow</option>
                      </select>
                    </div>
                    )}

                    {seoActiveTab === 'jsonld' && (
                      <div className={getClassName("formGroup")}>
                        <label>JSON-LD (opsiyonel)</label>
                        <textarea
                          value={seoJsonLd}
                          onChange={(e) => {
                            dispatch({
                              type: 'setData',
                              data: (prev: any) => ({
                                ...prev,
                                root: {
                                  ...prev?.root,
                                  props: {
                                    ...prev?.root?.props,
                                    seo: { ...prev?.root?.props?.seo, jsonLd: e.target.value },
                                  },
                                },
                              }),
                            });
                          }}
                          className={getClassName("textarea")}
                          rows={4}
                          placeholder="JSON-LD (örnek: https://schema.org)"
                        />
                      </div>
                    )}

                    {seoActiveTab === 'opengraph' && (
                      <div className={getClassName("formGroup")}>
                        <label>Open Graph Başlık (opsiyonel)</label>
                        <input
                          type="text"
                          value={seoOgTitle}
                          onChange={(e) => {
                            dispatch({
                              type: 'setData',
                              data: (prev: any) => ({
                                ...prev,
                                root: {
                                  ...prev?.root,
                                  props: {
                                    ...prev?.root?.props,
                                    seo: {
                                      ...prev?.root?.props?.seo,
                                      openGraph: {
                                        ...(prev?.root?.props?.seo?.openGraph ?? {}),
                                        title: e.target.value,
                                      },
                                    },
                                  },
                                },
                              }),
                            });
                          }}
                          className={getClassName("input")}
                        />
                      </div>
                      )}
                      {seoActiveTab === 'opengraph' && (
                      <div className={getClassName("formGroup")}>
                        <label>Open Graph Açıklama (opsiyonel)</label>
                        <textarea
                          value={seoOgDescription}
                          onChange={(e) => {
                            dispatch({
                              type: 'setData',
                              data: (prev: any) => ({
                                ...prev,
                                root: {
                                  ...prev?.root,
                                  props: {
                                    ...prev?.root?.props,
                                    seo: {
                                      ...prev?.root?.props?.seo,
                                      openGraph: {
                                        ...(prev?.root?.props?.seo?.openGraph ?? {}),
                                        description: e.target.value,
                                      },
                                    },
                                  },
                                },
                              }),
                            });
                          }}
                          className={getClassName("textarea")}
                          rows={3}
                        />
                      </div>
                      )}
                      {seoActiveTab === 'opengraph' && (
                      <div className={getClassName("formGroup")}>
                        <label>Open Graph Görsel URL (opsiyonel)</label>
                        <input
                          type="text"
                          value={seoOgImage}
                          onChange={(e) => {
                            dispatch({
                              type: 'setData',
                              data: (prev: any) => ({
                                ...prev,
                                root: {
                                  ...prev?.root,
                                  props: {
                                    ...prev?.root?.props,
                                    seo: {
                                      ...prev?.root?.props?.seo,
                                      openGraph: {
                                        ...(prev?.root?.props?.seo?.openGraph ?? {}),
                                        image: e.target.value,
                                      },
                                    },
                                  },
                                },
                              }),
                            });
                          }}
                          className={getClassName("input")}
                        />
                      </div>
                      )}
                      {seoActiveTab === 'opengraph' && (
                      <div className={getClassName("formGroup")}>
                        <label>Open Graph Türü (opsiyonel)</label>
                        <input
                          type="text"
                          value={seoOgType}
                          onChange={(e) => {
                            dispatch({
                              type: 'setData',
                              data: (prev: any) => ({
                                ...prev,
                                root: {
                                  ...prev?.root,
                                  props: {
                                    ...prev?.root?.props,
                                    seo: {
                                      ...prev?.root?.props?.seo,
                                      openGraph: {
                                        ...(prev?.root?.props?.seo?.openGraph ?? {}),
                                        type: e.target.value,
                                      },
                                    },
                                  },
                                },
                              }),
                            });
                          }}
                          className={getClassName("input")}
                          placeholder="website, article vb."
                        />
                      </div>
                      )}
                      {seoActiveTab === 'opengraph' && (
                      <div className={getClassName("formGroup")}>
                        <label>Open Graph URL (opsiyonel)</label>
                        <input
                          type="text"
                          value={seoOgUrl}
                          onChange={(e) => {
                            dispatch({
                              type: 'setData',
                              data: (prev: any) => ({
                                ...prev,
                                root: {
                                  ...prev?.root,
                                  props: {
                                    ...prev?.root?.props,
                                    seo: {
                                      ...prev?.root?.props?.seo,
                                      openGraph: {
                                        ...(prev?.root?.props?.seo?.openGraph ?? {}),
                                        url: e.target.value,
                                      },
                                    },
                                  },
                                },
                              }),
                            });
                          }}
                          className={getClassName("input")}
                        />
                      </div>
                      )}

                    {seoActiveTab === 'preview' && (
                      <div className={getClassName("formGroup")}>
                        <label>Google Önizleme</label>
                        <div style={{padding: '12px', border:'1px solid var(--puck-color-grey-09)', borderRadius:8}}>
                          <div style={{color:'#1a0dab', fontSize:16, lineHeight:1.3, marginBottom:2}}>{seoTitle || rootTitle || 'Sayfa Başlığı'}</div>
                          <div style={{color:'#006621', fontSize:12, marginBottom:4}}>{seoCanonical || 'https://www.ornek.com/ornek-sayfa'}</div>
                          <div style={{color:'#545454', fontSize:13}}>{seoDescription || 'Bu alan arama sonuçlarında görünecek açıklamayı temsil eder.'}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className={getClassName("commandCenter")}>
            <div ref={commandWrapperRef} className={getClassName("commandCenterWrapper")}>
              <button
                className={getClassName("commandButton")}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                type="button"
              >
                <div className={getClassName("commandButtonLeft")}>
                  <FileText size={18} className={getClassName("commandIcon")} />
                  <span className={getClassName("commandText")}>
                    {headerTitle || rootTitle || "Sayfa Yönetimi"}
                  </span>
                  {headerPath && (
                    <code className={getClassName("commandPath")}>{headerPath}</code>
                  )}
                </div>
                <div className={getClassName("commandButtonRight")}>
                  <span className={getClassName("commandHint")}>⌘/CTRL + K</span>
                  <ChevronDown 
                    size={16} 
                    className={`${getClassName("commandChevron")} ${dropdownOpen ? getClassName("commandChevron--open") : ""}`} 
                  />
                </div>
              </button>
              {/* Dil Komut Paleti Butonu - sayfalamanın sağına, absolute konumlandır */}
              <div ref={languageWrapperRef} className={getClassName("languageButtonWrap")}>
                <button
                  className={getClassName("commandButton")}
                  onClick={() => setLanguageDropdownOpen(!languageDropdownOpen)}
                  type="button"
                  title="Dil Seçimi"
                  style={{ width: 'auto' }}
                >
                  <div className={getClassName("commandButtonLeft")}>
                    <Globe size={18} className={getClassName("commandIcon")} />
                    <span className={getClassName("commandText")}>
                      {languages.find(l => l.id === selectedLanguageId)?.name || 'Dil'}
                    </span>
                  </div>
                  <div className={getClassName("commandButtonRight")}>
                    <span className={getClassName("commandHint")}>⌘/CTRL + G</span>
                    <ChevronDown 
                      size={16} 
                      className={`${getClassName("commandChevron")} ${languageDropdownOpen ? getClassName("commandChevron--open") : ""}`} 
                    />
                  </div>
                </button>

                {languageDropdownOpen && (
                  <div className={`${getClassName("commandPalette")} ${getClassName("languagePalette")}`} style={{ width: 220 }}>
                    <div className={getClassName("commandPaletteHeader")}>
                      <div className={getClassName("searchBox")}>
                        <Search size={16} className={getClassName("searchIcon")} />
                        <input
                          type="text"
                          placeholder="Dil ara..."
                          value={languageSearchTerm}
                          onChange={(e) => setLanguageSearchTerm(e.target.value)}
                          className={getClassName("searchInput")}
                          autoFocus
                        />
                        {languageSearchTerm && (
                          <button
                            className={getClassName("clearSearch")}
                            onClick={() => setLanguageSearchTerm('')}
                            type="button"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>

                    <div className={getClassName("commandList")}>
                      <div className={getClassName("commandSection")}>
                        <div className={getClassName("sectionHeader")}>
                          <span>Diller</span>
                        </div>
                        {/* Tüm Diller seçeneği */}
                        <div
                          className={`${getClassName("commandItem")} ${!selectedLanguageId ? getClassName("commandItem--selected") : ''}`}
                          onClick={() => { setSelectedLanguageId(null); setLanguageDropdownOpen(false); }}
                          role="button"
                          tabIndex={0}
                        >
                          <Globe size={16} className={getClassName("commandItemIcon")} />
                          <div className={getClassName("commandItemText")}>
                            <span className={getClassName("commandItemTitle")}>Tüm Diller</span>
                          </div>
                        </div>

                        {languages
                          .filter(l => l.name.toLowerCase().includes(languageSearchTerm.toLowerCase()) || l.code.toLowerCase().includes(languageSearchTerm.toLowerCase()))
                          .map((lang) => (
                            <div
                              key={lang.id}
                              className={`${getClassName("commandItem")} ${selectedLanguageId === lang.id ? getClassName("commandItem--selected") : ''}`}
                              onClick={() => { setSelectedLanguageId(lang.id); setLanguageDropdownOpen(false); }}
                              role="button"
                              tabIndex={0}
                            >
                              <Globe size={16} className={getClassName("commandItemIcon")} />
                              <div className={getClassName("commandItemText")}>
                                <span className={getClassName("commandItemTitle")}>{lang.name}</span>
                                <span className={getClassName("commandItemDesc")}>{lang.code}{lang.isDefault ? ' · Varsayılan' : ''}</span>
                              </div>
                            </div>
                        ))}
                      </div>

                      {languages.length === 0 && !languageSearchTerm && (
                        <div className={getClassName("emptyState")}>
                          <FileText size={32} className={getClassName("emptyStateIcon")} />
                          <p className={getClassName("emptyStateText")}>Henüz dil yok</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {dropdownOpen && (
                <div className={getClassName("commandPalette")}>
                  <div className={getClassName("commandPaletteHeader")}>
                    <div className={getClassName("searchBox")}>
                      <Search size={16} className={getClassName("searchIcon")} />
                      <input
                        type="text"
                        placeholder="Sayfa ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={getClassName("searchInput")}
                        autoFocus
                      />
                      {searchTerm && (
                        <button
                          className={getClassName("clearSearch")}
                          onClick={() => setSearchTerm('')}
                          type="button"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className={getClassName("commandList")}>
                    <div className={getClassName("commandSection")}>
                      <div className={getClassName("sectionHeader")}>
                        <span>Hızlı İşlemler</span>
                      </div>
                      <button
                        className={getClassName("commandItem")}
                        onClick={() => {
                          setEditingPage(null);
                          setNewPage({ title: '', slug: '', content: '' });
                          setModalOpen(true);
                          setDropdownOpen(false);
                        }}
                        type="button"
                      >
                        <Plus size={16} className={getClassName("commandItemIcon")} />
                        <div className={getClassName("commandItemText")}>
                          <span className={getClassName("commandItemTitle")}>Yeni Sayfa Oluştur</span>
                          <span className={getClassName("commandItemDesc")}>Boş bir sayfa oluşturun</span>
                        </div>
                        <span className={getClassName("commandItemShortcut")}>Ctrl+N</span>
                      </button>
                    </div>

                    {filteredPages.length > 0 && (
                      <div className={getClassName("commandSection")}>
                        <div className={getClassName("sectionHeader")}>
                          <span>Sayfalar ({filteredPages.length})</span>
                        </div>
                        {filteredPages.map((page) => (
                          <div
                            key={page.id}
                            className={`${getClassName("commandItem")} ${
                              page.id === currentPageId ? getClassName("commandItem--selected") : ""
                            }`}
                            onClick={() => handleSelectPage(page.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleSelectPage(page.id);
                              }
                            }}
                          > 
                            <FileText size={16} className={getClassName("commandItemIcon")} />
                            <div className={getClassName("commandItemText")}>
                              <span className={getClassName("commandItemTitle")}>{page.title}</span>
                              <span className={getClassName("commandItemDesc")}>
                                /{page.slug}
                                {page.languageId && (
                                  <span style={{ 
                                    marginLeft: 8, 
                                    fontSize: 12, 
                                    color: 'var(--puck-color-grey-06)',
                                    background: 'var(--puck-color-grey-10)',
                                    padding: '2px 6px',
                                    borderRadius: 4
                                  }}>
                                    {languages.find(l => l.id === page.languageId)?.name || page.languageId}
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className={getClassName("commandItemActions")}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPage(page);
                                  setModalOpen(true);
                                  setDropdownOpen(false);
                                }}
                                className={getClassName("commandActionButton")}
                                type="button"
                                title="Düzenle"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePage(page.id);
                                }}
                                className={`${getClassName("commandActionButton")} ${getClassName("commandActionButton--delete")}`}
                                type="button"
                                title="Sil"
                              >
                                <Trash size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {filteredPages.length === 0 && searchTerm && (
                      <div className={getClassName("emptySearchState")}>
                        <Search size={24} className={getClassName("emptySearchIcon")} />
                        <p className={getClassName("emptySearchText")}>
                          &quot;<strong>{searchTerm}</strong>&quot; için sonuç bulunamadı
                        </p>
                      </div>
                    )}

                    {pages.length === 0 && !searchTerm && (
                      <div className={getClassName("emptyState")}>
                        <FileText size={32} className={getClassName("emptyStateIcon")} />
                        <p className={getClassName("emptyStateText")}>Henüz sayfa yok</p>
                        <p className={getClassName("emptyStateSubtext")}>İlk sayfanızı oluşturmak için Ctrl+N&apos;e basın</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className={getClassName("tools")}>
            <div className={getClassName("menuButton")}>
              <IconButton
                type="button"
                onClick={() => {
                  return setMenuOpen(!menuOpen);
                }}
                title="Toggle menu bar"
              >
                {menuOpen ? (
                  <ChevronUp focusable="false" />
                ) : (
                  <ChevronDown focusable="false" />
                )}
              </IconButton>
            </div>
            <MenuBar<G["UserData"]>
              dispatch={dispatch}
              onPublish={onPublish}
              menuOpen={menuOpen}
              renderHeaderActions={() => (
                <CustomHeaderActions>
                  <Button
                    onClick={handlePublish}
                    icon={<Globe size="14px" />}
                  >
                    {isPublishing ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                </CustomHeaderActions>
              )}
              setMenuOpen={setMenuOpen}
            />
          </div>
        </div>
      </header>

      {/* Sayfa Ekleme/Düzenleme Modal */}
      {modalOpen && (
        <div className={getClassName("modal")}>
          <div className={getClassName("modalContent")}>
            <div className={getClassName("modalHeader")}>
              <h3>{editingPage ? 'Sayfa Düzenle' : 'Yeni Sayfa Ekle'}</h3>
              <button
                className={getClassName("closeButton")}
                onClick={() => {
                  setModalOpen(false);
                  setEditingPage(null);
                }}
                type="button"
              >
                ×
              </button>
            </div>
            
            <div className={getClassName("modalBody")}>
              <div className={getClassName("formGroup")}>
                <label>Başlık</label>
                <input
                  type="text"
                  value={editingPage ? editingPage.title : newPage.title}
                  onChange={(e) => {
                    if (editingPage) {
                      setEditingPage({ ...editingPage, title: e.target.value });
                    } else {
                      setNewPage({ ...newPage, title: e.target.value });
                    }
                  }}
                  placeholder="Sayfa başlığı"
                  className={getClassName("input")}
                />
              </div>
              
              <div className={getClassName("formGroup")}>
                <label>Slug</label>
                <input
                  type="text"
                  value={editingPage ? editingPage.slug : newPage.slug}
                  onChange={(e) => {
                    if (editingPage) {
                      setEditingPage({ ...editingPage, slug: e.target.value });
                    } else {
                      setNewPage({ ...newPage, slug: e.target.value });
                    }
                  }}
                  placeholder="sayfa-slug"
                  className={getClassName("input")}
                />
              </div>
              
              <div className={getClassName("formGroup")}>
                <label>Dil</label>
                <select
                  value={editingPage ? (editingPage.languageId || '') : (newPage.languageId || '')}
                  onChange={(e) => {
                    const value = e.target.value || undefined;
                    if (editingPage) {
                      setEditingPage({ ...editingPage, languageId: value });
                    } else {
                      setNewPage({ ...newPage, languageId: value });
                    }
                  }}
                  className={getClassName("input")}
                >
                  <option value="">Dil Seçin</option>
                  {languages.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name} {lang.isDefault ? '(Varsayılan)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={getClassName("formGroup")}>
                <label>İçerik</label>
                <textarea
                  value={editingPage ? editingPage.content : newPage.content}
                  onChange={(e) => {
                    if (editingPage) {
                      setEditingPage({ ...editingPage, content: e.target.value });
                    } else {
                      setNewPage({ ...newPage, content: e.target.value });
                    }
                  }}
                  placeholder="Sayfa içeriği"
                  className={getClassName("textarea")}
                  rows={6}
                />
              </div>

              {/* Yayın Durumu */}

              <div className={getClassName("formGroup")}>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={editingPage ? (editingPage.isActive ?? true) : (newPage.isActive ?? true)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (editingPage) {
                        setEditingPage({ ...editingPage, isActive: checked });
                      } else {
                        setNewPage({ ...newPage, isActive: checked });
                      }
                    }}
                  />
                  Yayın Durumu
                </label>
              </div>


            </div>
            
            <div className={getClassName("modalFooter")}>
              <button
                className={getClassName("cancelButton")}
                onClick={() => {
                  setModalOpen(false);
                  setEditingPage(null);
                }}
                type="button"
              >
                İptal
              </button>
              <Button
                onClick={editingPage ? handleUpdatePage : handleAddPage}
                icon={<Globe size="14px" />}
                type="button"
                variant="primary"
              >
                {editingPage ? 'Güncelle' : 'Kaydet'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dil Yönetimi Modal */}
      {languageModalOpen && (
        <div className={getClassName("modal")}>
          <div className={getClassName("modalContent")}>
            <div className={getClassName("modalHeader")}>
              <h3>{editingLanguage ? 'Dil Düzenle' : 'Yeni Dil Ekle'}</h3>
              <button
                className={getClassName("closeButton")}
                onClick={() => {
                  setLanguageModalOpen(false);
                  setEditingLanguage(null);
                }}
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
                      setEditingLanguage({ ...editingLanguage, name: e.target.value });
                    } else {
                      setNewLanguage({ ...newLanguage, name: e.target.value });
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
                      setEditingLanguage({ ...editingLanguage, code: e.target.value });
                    } else {
                      setNewLanguage({ ...newLanguage, code: e.target.value });
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
                        setEditingLanguage({ ...editingLanguage, isDefault: checked });
                      } else {
                        setNewLanguage({ ...newLanguage, isDefault: checked });
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
                        setEditingLanguage({ ...editingLanguage, isActive: checked });
                      } else {
                        setNewLanguage({ ...newLanguage, isActive: checked });
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
                onClick={() => {
                  setLanguageModalOpen(false);
                  setEditingLanguage(null);
                }}
                type="button"
              >
                İptal
              </button>
              <Button
                onClick={editingLanguage ? handleUpdateLanguage : handleAddLanguage}
                icon={<Globe size="14px" />}
                type="button"
                variant="primary"
              >
                {editingLanguage ? 'Güncelle' : 'Kaydet'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </CustomHeader>
  );
};

export const Header = memo(HeaderInner);
