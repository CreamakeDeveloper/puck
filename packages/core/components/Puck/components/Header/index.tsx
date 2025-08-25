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
import { Toaster } from "react-hot-toast";

// Import edilen bileşenler ve hook'lar
import { Page, Language } from "./types";
import { usePageManagement } from "./hooks/usePageManagement";
import { useLanguageManagement } from "./hooks/useLanguageManagement";
import { useSEOManagement } from "./hooks/useSEOManagement";
import { CommandPalette } from "./components/CommandPalette";
import { LanguagePalette } from "./components/LanguagePalette";
import { SEOPanel } from "./components/SEOPanel";
import { PageModal } from "./components/PageModal";
import { LanguageModal } from "./components/LanguageModal";
import { renderFlagIcon } from "./utils/languageUtils";

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
    siteId,
  } = usePropsContext();
  
  // Custom hook'ları kullan
  const languageManagement = useLanguageManagement(siteId);
  const pageManagement = usePageManagement(languageManagement.selectedLanguageId, siteId);
  const seoManagement = useSEOManagement(headerPath);

  // Yeni LanguageModal için adapter veriler
  const availableLanguages = useMemo(
    () => languageManagement.languages.map(l => ({ id: l.id, name: l.name, code: l.code })),
    [languageManagement.languages]
  );

  const siteLanguages = useMemo(
    () => languageManagement.languages.map(l => ({ langCode: l.code, isActive: l.isActive ?? true, name: l.name })),
    [languageManagement.languages]
  );

  const siteSettings = useMemo(
    () => ({ defaultLanguage: languageManagement.languages.find(l => l.isDefault)?.code || "tr" }),
    [languageManagement.languages]
  );

  const onAddLanguage = useCallback(async (langCode: string) => {
    console.warn('[LanguageModal] onAddLanguage implement edilmemiş. langCode:', langCode);
  }, []);

  const onUpdateLanguageStatus = useCallback(async (langCode: string, isActive: boolean) => {
    console.warn('[LanguageModal] onUpdateLanguageStatus implement edilmemiş.', { langCode, isActive });
  }, []);

  const onRemoveLanguage = useCallback(async (langCode: string) => {
    console.warn('[LanguageModal] onRemoveLanguage implement edilmemiş. langCode:', langCode);
  }, []);

  const onSetDefaultLanguage = useCallback(async (langCode: string) => {
    console.warn('[LanguageModal] onSetDefaultLanguage implement edilmemiş. langCode:', langCode);
  }, []);

  // UI state'leri
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Ref'ler
  const commandWrapperRef = useRef<HTMLDivElement | null>(null);
  const seoWrapperRef = useRef<HTMLDivElement | null>(null);
  const languageWrapperRef = useRef<HTMLDivElement | null>(null);

  const dispatch = useAppStore((s) => s.dispatch);

  // İlk yükleme
  useEffect(() => {
    // Sadece dilleri yükle, sayfalar usePageManagement hook'unda otomatik yüklenecek
    languageManagement.loadLanguages();
  }, [languageManagement.loadLanguages]);

  // Click outside handler
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
        seoManagement.seoOpen &&
        seoWrapperRef.current &&
        !seoWrapperRef.current.contains(target)
      ) {
        seoManagement.setSeoOpen(false);
      }

      if (
        languageManagement.languageDropdownOpen &&
        languageWrapperRef.current &&
        !languageWrapperRef.current.contains(target)
      ) {
        languageManagement.setLanguageDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen, seoManagement.seoOpen, languageManagement.languageDropdownOpen]);

  // Klavye kısayolları: Ctrl+K -> Sayfalama, Ctrl+L -> SEO, Ctrl+G -> Dil
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
        seoManagement.setSeoOpen(false);
        languageManagement.setLanguageDropdownOpen(false);
      }
      if (key === 'l') {
        e.preventDefault();
        seoManagement.setSeoOpen(true);
        setDropdownOpen(false);
        languageManagement.setLanguageDropdownOpen(false);
      }
      if (key === 'g') {
        e.preventDefault();
        languageManagement.setLanguageDropdownOpen(true);
        setDropdownOpen(false);
        seoManagement.setSeoOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtrelenmiş sayfalar (sadece arama filtresi)
  const filteredPages = useMemo(() => {
    let filtered = pageManagement.filteredPages; // Hook içinde zaten dil filtresi uygulanmış
    
    console.log('🔍 Filtreleme Debug:', {
      selectedLanguageId: languageManagement.selectedLanguageId,
      allPagesCount: pageManagement.pages.length,
      filteredPagesCount: pageManagement.filteredPages.length,
      allPages: pageManagement.pages.map(p => ({ id: p.id, title: p.title, languageId: p.languageId })),
      filteredPages: pageManagement.filteredPages.map(p => ({ id: p.id, title: p.title, languageId: p.languageId })),
      languages: languageManagement.languages.map(l => ({ id: l.id, name: l.name, code: l.code }))
    });
    
    // Arama filtresi
    if (searchTerm) {
      filtered = filtered.filter(page => 
        page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        page.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [pageManagement.filteredPages, searchTerm, languageManagement.selectedLanguageId, pageManagement.pages, languageManagement.languages]);

  // Handle functions
  const handleSelectPage = useCallback((id: string) => {
    pageManagement.handleSelectPage(id);
    setDropdownOpen(false);
    languageManagement.setSelectedLanguageId(pageManagement.pages.find(p => p.id === id)?.languageId || null);
  }, [pageManagement.handleSelectPage, pageManagement.pages, languageManagement.setSelectedLanguageId]);

  const handleEditPage = useCallback((page: Page) => {
    pageManagement.setEditingPage(page);
    pageManagement.setModalOpen(true);
    setDropdownOpen(false);
  }, [pageManagement.setEditingPage, pageManagement.setModalOpen]);

  const handleAddNewPage = useCallback(() => {
    pageManagement.setEditingPage(null);
    pageManagement.setNewPage({ 
      title: '', 
      slug: '', 
      content: '', 
      seo: undefined, 
      isActive: true, 
      languageId: languageManagement.selectedLanguageId || undefined // Seçili dili otomatik ata
    });
    pageManagement.setModalOpen(true);
    setDropdownOpen(false);
  }, [pageManagement.setEditingPage, pageManagement.setNewPage, pageManagement.setModalOpen, languageManagement.selectedLanguageId]);

  const handleAddNewLanguage = useCallback(() => {
    languageManagement.setEditingLanguage(null);
    languageManagement.setLanguageModalOpen(true);
    languageManagement.setLanguageDropdownOpen(false);
  }, [languageManagement.setEditingLanguage, languageManagement.setLanguageModalOpen, languageManagement.setLanguageDropdownOpen]);

  const handleSelectLanguage = useCallback((id: string | null) => {
    languageManagement.setSelectedLanguageId(id);
    languageManagement.setLanguageDropdownOpen(false);
  }, [languageManagement.setSelectedLanguageId, languageManagement.setLanguageDropdownOpen]);

  const handlePublish = useCallback(() => {
    pageManagement.handlePublish(onPublish);
  }, [pageManagement.handlePublish, onPublish]);

  const handleClosePageModal = useCallback(() => {
    pageManagement.setModalOpen(false);
    pageManagement.setEditingPage(null);
  }, [pageManagement.setModalOpen, pageManagement.setEditingPage]);

  const handleCloseLanguageModal = useCallback(() => {
    languageManagement.setLanguageModalOpen(false);
    languageManagement.setEditingLanguage(null);
  }, [languageManagement.setLanguageModalOpen, languageManagement.setEditingLanguage]);

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

  // Seçili sayfanın adını bul
  const currentPageTitle = useMemo(() => {
    if (pageManagement.currentPageId) {
      const currentPage = pageManagement.pages.find(p => p.id === pageManagement.currentPageId);
      return currentPage?.title;
    }
    return null;
  }, [pageManagement.currentPageId, pageManagement.pages]);


  return (
    <CustomHeader
      actions={
        <>
          <CustomHeaderActions>
            <Button
              onClick={handlePublish}
              icon={<Globe size="14px" />}
            >
              {pageManagement.isPublishing ? 'Kaydediliyor...' : 'Kaydet'}
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
            {/* SEO Butonu */}
            <div
              ref={seoWrapperRef}
              className={getClassName("seoSettingsWrapper")}
            >
              <button
                className={getClassName("commandButton")}
                onClick={() => {
                  seoManagement.setSeoOpen(!seoManagement.seoOpen);
                  // Diğer panelleri kapat
                  setDropdownOpen(false);
                  languageManagement.setLanguageDropdownOpen(false);
                }}
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
                    className={`${getClassName("commandChevron")} ${seoManagement.seoOpen ? getClassName("commandChevron--open") : ""}`}
                  />
                </div>
              </button>

              <SEOPanel
                seoOpen={seoManagement.seoOpen}
                seoActiveTab={seoManagement.seoActiveTab}
                setSeoActiveTab={seoManagement.setSeoActiveTab}
                seoTitle={seoManagement.seoTitle}
                seoDescription={seoManagement.seoDescription}
                seoCanonical={seoManagement.seoCanonical}
                seoRobots={seoManagement.seoRobots}
                seoJsonLd={seoManagement.seoJsonLd}
                seoOgTitle={seoManagement.seoOgTitle}
                seoOgDescription={seoManagement.seoOgDescription}
                seoOgImage={seoManagement.seoOgImage}
                seoOgType={seoManagement.seoOgType}
                seoOgUrl={seoManagement.seoOgUrl}
                rootTitle={seoManagement.rootTitle}
                updateSeoField={seoManagement.updateSeoField}
                updateOpenGraphField={seoManagement.updateOpenGraphField}
              />
            </div>

            {/* Sayfa Yönetimi Butonu */}
            <div ref={commandWrapperRef} className={getClassName("commandCenterWrapper")}>
              <button
                className={getClassName("commandButton")}
                onClick={() => {
                  setDropdownOpen(!dropdownOpen);
                  // Diğer panelleri kapat
                  seoManagement.setSeoOpen(false);
                  languageManagement.setLanguageDropdownOpen(false);
                }}
                type="button"
              >
                <div className={getClassName("commandButtonLeft")}>
                  <FileText size={18} className={getClassName("commandIcon")} />
                  <span className={getClassName("commandText")}>
                    {currentPageTitle || headerTitle || rootTitle || "Sayfa Yönetimi"}
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
              
              <CommandPalette
                dropdownOpen={dropdownOpen}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filteredPages={filteredPages}
                languages={languageManagement.languages}
                currentPageId={pageManagement.currentPageId}
                onSelectPage={handleSelectPage}
                onEditPage={handleEditPage}
                onDeletePage={pageManagement.handleDeletePage}
                onDuplicatePage={pageManagement.handleDuplicatePage}
                onAddNewPage={handleAddNewPage}
              />
            </div>

            {/* Dil Seçimi Butonu */}
            <div ref={languageWrapperRef} className={getClassName("languageButtonWrap")}>
              <button
                className={getClassName("commandButton")}
                onClick={() => {
                  languageManagement.setLanguageDropdownOpen(!languageManagement.languageDropdownOpen);
                  // Diğer panelleri kapat
                  setDropdownOpen(false);
                  seoManagement.setSeoOpen(false);
                }}
                type="button"
                title="Dil Seçimi"
              >
                <div className={getClassName("commandButtonLeft")}>
                  {languageManagement.selectedLanguageId ? (
                    renderFlagIcon(
                      languageManagement.languages.find(l => l.id === languageManagement.selectedLanguageId)?.code || '',
                      { fontSize: '18px', marginRight: '4px' }
                    )
                  ) : (
                    <Globe size={18} className={getClassName("commandIcon")} />
                  )}
                  <span className={getClassName("commandText")}>
                    {languageManagement.languages.find(l => l.id === languageManagement.selectedLanguageId)?.name || 'Dil'}
                  </span>
                </div>
                <div className={getClassName("commandButtonRight")}>
                  <span className={getClassName("commandHint")}>⌘/CTRL + G</span>
                  <ChevronDown 
                    size={16} 
                    className={`${getClassName("commandChevron")} ${languageManagement.languageDropdownOpen ? getClassName("commandChevron--open") : ""}`} 
                  />
                </div>
              </button>

              <LanguagePalette
                languageDropdownOpen={languageManagement.languageDropdownOpen}
                languageSearchTerm={languageManagement.languageSearchTerm}
                setLanguageSearchTerm={languageManagement.setLanguageSearchTerm}
                filteredLanguages={languageManagement.filteredLanguages}
                selectedLanguageId={languageManagement.selectedLanguageId}
                onSelectLanguage={handleSelectLanguage}
              />
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
                    {pageManagement.isPublishing ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                </CustomHeaderActions>
              )}
              setMenuOpen={setMenuOpen}
            />
          </div>
        </div>
      </header>

      {/* Sayfa Ekleme/Düzenleme Modal */}
      <PageModal
        modalOpen={pageManagement.modalOpen}
        editingPage={pageManagement.editingPage}
        newPage={pageManagement.newPage}
        languages={languageManagement.languages}
        onClose={handleClosePageModal}
        onSave={pageManagement.editingPage ? pageManagement.handleUpdatePage : pageManagement.handleAddPage}
        onPageChange={pageManagement.setEditingPage}
        onNewPageChange={pageManagement.setNewPage}
      />

      {/* Dil Yönetimi Modal */}
      <LanguageModal
        languageModalOpen={languageManagement.languageModalOpen}
        editingSiteLanguage={null}
        availableLanguages={availableLanguages}
        siteLanguages={siteLanguages}
        siteSettings={siteSettings}
        isLoading={false}
        onClose={handleCloseLanguageModal}
        onAddLanguage={onAddLanguage}
        onUpdateLanguageStatus={onUpdateLanguageStatus}
        onRemoveLanguage={onRemoveLanguage}
        onSetDefaultLanguage={onSetDefaultLanguage}
      />

      {/* Toast Bildirimleri */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--puck-color-white)',
            color: 'var(--puck-color-black)',
            border: '1px solid var(--puck-color-grey-09)',
            borderRadius: '8px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: 'var(--puck-color-green-05)',
              secondary: 'var(--puck-color-white)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--puck-color-red-05)',
              secondary: 'var(--puck-color-white)',
            },
          },
        }}
      />
    </CustomHeader>
  );
};

export const Header = memo(HeaderInner);
