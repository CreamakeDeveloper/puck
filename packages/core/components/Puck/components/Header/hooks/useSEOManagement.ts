import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "../../../../../store";

export const useSEOManagement = (headerPath?: any) => {
  const [seoOpen, setSeoOpen] = useState(false);
  const [seoActiveTab, setSeoActiveTab] = useState<'general' | 'jsonld' | 'opengraph' | 'preview'>('general');
  const [canonicalManuallyCleared, setCanonicalManuallyCleared] = useState(false);

  const dispatch = useAppStore((s) => s.dispatch);

  // SEO değerlerini store'dan al
  const rootTitle = useAppStore((s) => {
    const rootData = s.state.indexes.nodes["root"]?.data as any;
    return rootData?.props?.title ?? "";
  });

  const rootSlug = useAppStore((s) => {
    const rootData = s.state.indexes.nodes["root"]?.data as any;
    return rootData?.props?.slug ?? "";
  });

  const seoTitle = useAppStore((s) => 
    ((s.state.indexes.nodes["root"]?.data as any)?.props?.seo?.title as string) ?? ""
  );

  const seoDescription = useAppStore((s) => 
    ((s.state.indexes.nodes["root"]?.data as any)?.props?.seo?.description as string) ?? ""
  );

  const seoCanonical = useAppStore((s) => 
    ((s.state.indexes.nodes["root"]?.data as any)?.props?.seo?.canonical as string) ?? ""
  );

  const seoRobots = useAppStore((s) => 
    ((s.state.indexes.nodes["root"]?.data as any)?.props?.seo?.robots as string) ?? "index,follow"
  );

  const seoJsonLd = useAppStore((s) => 
    ((s.state.indexes.nodes["root"]?.data as any)?.props?.seo?.jsonLd as string) ?? ""
  );

  const seoOgTitle = useAppStore((s) => 
    ((s.state.indexes.nodes["root"]?.data as any)?.props?.seo?.openGraph?.title as string) ?? ""
  );

  const seoOgDescription = useAppStore((s) => 
    ((s.state.indexes.nodes["root"]?.data as any)?.props?.seo?.openGraph?.description as string) ?? ""
  );

  const seoOgImage = useAppStore((s) => 
    ((s.state.indexes.nodes["root"]?.data as any)?.props?.seo?.openGraph?.image as string) ?? ""
  );

  const seoOgType = useAppStore((s) => 
    ((s.state.indexes.nodes["root"]?.data as any)?.props?.seo?.openGraph?.type as string) ?? ""
  );

  const seoOgUrl = useAppStore((s) => 
    ((s.state.indexes.nodes["root"]?.data as any)?.props?.seo?.openGraph?.url as string) ?? ""
  );

  // SEO form güncellemesi için yardımcı fonksiyonlar
  const updateSeoField = useCallback((field: string, value: string) => {
    // Canonical alanı silindiğinde flag'i true yap
    if (field === 'canonical' && value === '') {
      setCanonicalManuallyCleared(true);
    }
    
    dispatch({
      type: 'setData',
      data: (prev: any) => ({
        ...prev,
        root: {
          ...prev?.root,
          props: {
            ...prev?.root?.props,
            seo: { ...prev?.root?.props?.seo, [field]: value },
          },
        },
      }),
    });
  }, [dispatch]);

  const updateOpenGraphField = useCallback((field: string, value: string) => {
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
                [field]: value,
              },
            },
          },
        },
      }),
    });
  }, [dispatch]);

  // SEO dropdown açıldığında varsayılan değerleri doldur
  useEffect(() => {
    if (!seoOpen) return;

    const hasWindow = typeof window !== "undefined";
    const origin = hasWindow ? window.location.origin : "";
    const currentPath = (headerPath && headerPath.toString()) || (rootSlug ? `/${rootSlug}` : (hasWindow ? window.location.pathname : ""));
    const computedCanonical = origin && currentPath ? `${origin}${currentPath.startsWith("/") ? "" : "/"}${currentPath}` : "";

    // Canonical alanı sadece manuel olarak silinmemişse otomatik doldur
    if (!seoCanonical && computedCanonical && !canonicalManuallyCleared) {
      updateSeoField('canonical', computedCanonical);
    }

    const effectiveCanonical = seoCanonical || computedCanonical;
    if (!seoOgUrl && effectiveCanonical) {
      updateOpenGraphField('url', effectiveCanonical);
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

      updateSeoField('jsonLd', JSON.stringify(jsonLdObj, null, 2));
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
  }, [seoOpen, headerPath, rootSlug, seoCanonical, seoOgUrl, seoJsonLd, seoOgType, seoOgTitle, seoOgDescription, rootTitle, seoTitle, seoDescription, updateSeoField, updateOpenGraphField, dispatch, canonicalManuallyCleared]);

  return {
    seoOpen,
    setSeoOpen,
    seoActiveTab,
    setSeoActiveTab,
    seoTitle,
    seoDescription,
    seoCanonical,
    seoRobots,
    seoJsonLd,
    seoOgTitle,
    seoOgDescription,
    seoOgImage,
    seoOgType,
    seoOgUrl,
    rootTitle,
    updateSeoField,
    updateOpenGraphField,
  };
};