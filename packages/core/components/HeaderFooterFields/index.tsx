import { useAppStore } from "../../store";
import { useCallback, useMemo } from "react";
import { SidebarSection } from "../SidebarSection";
import { AutoFieldPrivate } from "../AutoField";
import { getClassNameFactory } from "../../lib";
import styles from "./styles.module.css";
import { Fields } from "../../types";

const getClassName = getClassNameFactory("HeaderFooterFields", styles);

type HeaderFooterFieldsProps = {
  type: "header" | "footer";
};

export const HeaderFooterFields = ({ type }: HeaderFooterFieldsProps) => {
  const config = useAppStore((s) => s.config);
  const data = useAppStore((s) => s.state.data);
  const currentLanguage = useAppStore((s) => s.state.data.root.props?.language || "tr");
  const setData = useAppStore((s) => s.setData);

  // Mevcut dil için header/footer verisi
  const currentData = useMemo(() => {
    const typeData = data[type] || [];
    return typeData.find((item: any) => item.language === currentLanguage) || { language: currentLanguage, props: {} };
  }, [data, type, currentLanguage]);

  // Konfigürasyondaki field'ları al
  const fields: Fields = useMemo(() => {
    return config[type]?.fields || {};
  }, [config, type]);

  const onChange = useCallback((fieldName: string) => {
    return async (value: any) => {
      const typeData = [...(data[type] || [])];
      const existingIndex = typeData.findIndex((item: any) => item.language === currentLanguage);
      
      const updatedItem = {
        language: currentLanguage,
        props: {
          ...currentData.props,
          [fieldName]: value,
        },
      };

      if (existingIndex >= 0) {
        typeData[existingIndex] = updatedItem;
      } else {
        typeData.push(updatedItem);
      }

      setData({
        ...data,
        [type]: typeData,
      });
    };
  }, [data, type, currentLanguage, currentData.props, setData]);

  if (!config[type]) return null;

  const title = type === "header" ? "Header" : "Footer";

  return (
    <SidebarSection title={`${title} (${currentLanguage.toUpperCase()})`} noBorderTop>
      <div className={getClassName()}>
        {Object.entries(fields).map(([fieldName, field]) => {
          if (!field || field.type === "slot" || fieldName === "language") return null;

          const id = `${type}_${field.type}_${fieldName}`;
          const value = currentData.props[fieldName];

          return (
            <div key={id} className={getClassName("field")}>
              <AutoFieldPrivate
                field={field}
                name={fieldName}
                id={id}
                readOnly={false}
                value={value}
                onChange={onChange(fieldName)}
              />
            </div>
          );
        })}
      </div>
    </SidebarSection>
  );
};