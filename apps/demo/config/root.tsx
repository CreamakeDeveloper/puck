import { DefaultRootProps, RootConfig } from "@/core";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { useContext } from "react";
import { renderContext } from "@/core/components/Render";

export type RootProps = DefaultRootProps & {
  language?: string;
};

// Helper fonksiyon: aktif dil için header/footer verisini bulur
const getLanguageData = (data: any[], language: string = "tr") => {
  return data?.find(item => item.language === language) || data?.[0] || { props: {} };
};

export const Root: RootConfig<RootProps> = {
  defaultProps: {
    title: "My Page",
    language: "tr",
  },
  fields: {
    title: { type: "text" },
    language: {
      type: "select",
      options: [
        { label: "Türkçe", value: "tr" },
        { label: "English", value: "en" },
        { label: "Français", value: "fr" },
      ],
    },
  },
  render: ({ puck: { isEditing, renderDropZone: DropZone }, language }) => {
    const { data } = useContext(renderContext);
    const currentLanguage = language || "tr";
    
    // Aktif dil için header ve footer verilerini al
    const headerData = getLanguageData(data.header || [], currentLanguage);
    const footerData = getLanguageData(data.footer || [], currentLanguage);

    return (
      <div
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <Header 
          editMode={isEditing} 
          logo={headerData.props.logo}
          navigation={headerData.props.navigation || []}
        />
        <DropZone zone="default-zone" style={{ flexGrow: 1 }} />

        <Footer>
          {footerData.props.sections?.map((section: any, index: number) => (
            <Footer.List key={index} title={section.title}>
              {section.links?.map((link: any, linkIndex: number) => (
                <Footer.Link key={linkIndex} href={link.href}>
                  {link.label}
                </Footer.Link>
              ))}
            </Footer.List>
          ))}
        </Footer>
      </div>
    );
  },
};

export default Root;
