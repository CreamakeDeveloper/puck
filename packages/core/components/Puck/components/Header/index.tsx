import React, { memo, useCallback, useMemo, useState, useEffect } from "react";
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
type Page = {
  id: string;
  title: string;
  slug: string;
  content: string;
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

const addPage = async (page: Omit<Page, 'id'>): Promise<Page | null> => {
  try {
    const response = await fetch('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(page),
    });
    if (!response.ok) throw new Error('Sayfa eklenemedi');
    return response.json();
  } catch (error) {
    console.error('Sayfa eklenirken hata:', error);
    return null;
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
    onPageNavigate, // Sayfa navigasyonu için yeni prop
  } = usePropsContext();

  // Sayfa yönetimi state'leri
  const [pages, setPages] = useState<Page[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [newPage, setNewPage] = useState({ title: '', slug: '', content: '' });
  const [searchTerm, setSearchTerm] = useState('');

  const dispatch = useAppStore((s) => s.dispatch);
  const appStore = useAppStoreApi();

  // Sayfa verilerini yükle
  const loadPages = useCallback(async () => {
    const pagesData = await getPages();
    setPages(pagesData);
  }, []);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  // Dropdown dışarı tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (dropdownOpen && !target.closest(`.${getClassName("commandCenterWrapper")}`)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Sayfa CRUD işlemleri
  const handleAddPage = useCallback(async () => {
    if (!newPage.title || !newPage.slug) return;
    
    const result = await addPage(newPage);
    if (result) {
      await loadPages();
      setNewPage({ title: '', slug: '', content: '' });
      setModalOpen(false);
    }
  }, [newPage, loadPages]);

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

  // Filtrelenmiş sayfalar
  const filteredPages = useMemo(() => {
    return pages.filter(page => 
      page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pages, searchTerm]);

  // DEPRECATED
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

  // DEPRECATED
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

  return (
    <CustomHeader
      actions={
        <>
          <CustomHeaderActions>
            <Button
              onClick={() => {
                const data = appStore.getState().state.data;
                onPublish && onPublish(data as G["UserData"]);
              }}
              icon={<Globe size="14px" />}
            >
              Publish
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
          </div>
          <div className={getClassName("commandCenter")}>
            <div className={getClassName("commandCenterWrapper")}>
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
                            className={getClassName("commandItem")}
                            onClick={() => {
                              // Önce custom handler'ı dene
                              if (onPageNavigate) {
                                onPageNavigate(page);
                              } else {
                                // Fallback olarak window.location kullan
                                if (typeof window !== 'undefined') {
                                  // Next.js için: /pages/[slug] veya direkt /[slug]
                                  window.location.href = `/pages/${page.slug}`;
                                }
                              }
                              setDropdownOpen(false);
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                // Önce custom handler'ı dene
                                if (onPageNavigate) {
                                  onPageNavigate(page);
                                } else {
                                  // Fallback olarak window.location kullan
                                  if (typeof window !== 'undefined') {
                                    // Next.js için: /pages/[slug] veya direkt /[slug]
                                    window.location.href = `/pages/${page.slug}`;
                                  }
                                }
                                setDropdownOpen(false);
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
                          "<strong>{searchTerm}</strong>" için sonuç bulunamadı
                        </p>
                      </div>
                    )}

                    {pages.length === 0 && !searchTerm && (
                      <div className={getClassName("emptyState")}>
                        <FileText size={32} className={getClassName("emptyStateIcon")} />
                        <p className={getClassName("emptyStateText")}>Henüz sayfa yok</p>
                        <p className={getClassName("emptyStateSubtext")}>İlk sayfanızı oluşturmak için Ctrl+N'e basın</p>
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
                    onClick={() => {
                      const data = appStore.getState().state
                        .data as G["UserData"];
                      onPublish && onPublish(data);
                    }}
                    icon={<Globe size="14px" />}
                  >
                    Yayınla
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
              <button
                className={getClassName("saveButton")}
                onClick={editingPage ? handleUpdatePage : handleAddPage}
                type="button"
              >
                {editingPage ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomHeader>
  );
};

export const Header = memo(HeaderInner);
