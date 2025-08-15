export type SEO = {
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

export type Language = {
  id: string;
  name: string;
  code: string;
  isDefault?: boolean;
  isActive?: boolean;
};

export type Page = {
  id: string;
  title: string;
  slug: string;
  content: string;
  seo?: SEO;
  isActive?: boolean;
  languageId?: string;
};

export type ThemeHeader = {
  id: string;
  title: string;
  content: string;
  seo?: SEO;
  isActive?: boolean;
  themeId: string;
};

export type ThemeFooter = {
  id: string;
  title: string;
  content: string;
  seo?: SEO;
  isActive?: boolean;
  themeId: string;
};
