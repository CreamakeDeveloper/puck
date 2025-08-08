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

type Page = {
  id: string;
  title: string;
  slug: string;
  content: string;
  seo?: SEO;
  isActive?: boolean;
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [newPage, setNewPage] = useState<Omit<Page, 'id'>>({
    title: '',
    slug: '',
    content: '',
    seo: undefined,
    isActive: true,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [seoOpen, setSeoOpen] = useState(false);
  const commandWrapperRef = useRef<HTMLDivElement | null>(null);
  const seoWrapperRef = useRef<HTMLDivElement | null>(null);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const dispatch = useAppStore((s) => s.dispatch);
  const appStore = useAppStoreApi();

  const loadPages = useCallback(async () => {
    const pagesData = await getPages();
    setPages(pagesData);
  }, []);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen, seoOpen]);

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
      }
      if (key === 'l') {
        e.preventDefault();
        setSeoOpen(true);
        setDropdownOpen(false);
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
      });
      if (result) {
        setCurrentPageId(result.id);
        await handleSelectPage(result.id);
        await loadPages();
        setNewPage({ title: '', slug: '', content: '', seo: undefined, isActive: true });
        setModalOpen(false);
      }
    } catch (e: any) {
      window.alert(e?.message || 'Sayfa eklenemedi');
    }
  }, [newPage, loadPages, pages, handleSelectPage]);

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
    return pages.filter(page => 
      page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pages, searchTerm]);

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
                  </div>
                  <div className={getClassName("commandList")}>
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
                  <span className={getClassName("commandHint")}>
                    <Command size={12} />
                    <span>P</span>
                  </span>
                  <ChevronDown 
                    size={16} 
                    className={`${getClassName("commandChevron")} ${dropdownOpen ? getClassName("commandChevron--open") : ""}`} 
                  />
                </div>
              </button>
              
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
                              <span className={getClassName("commandItemDesc")}>/{page.slug}</span>
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
    </CustomHeader>
  );
};

export const Header = memo(HeaderInner);
