import { useComponentList } from "../../../../lib/use-component-list";
import { useAppStore } from "../../../../store";
import { ComponentList } from "../../../ComponentList";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import styles from "./styles.module.css";
import getClassNameFactory from "../../../../lib/get-class-name-factory";

const getClassName = getClassNameFactory("HorizontalComponents", styles);

export const HorizontalComponents = () => {
  const overrides = useAppStore((s) => s.overrides);
  const config = useAppStore((s) => s.config);
  const [isExpanded, setIsExpanded] = useState(false);

  const componentList = useComponentList();

  const Wrapper = useMemo(() => {
    return overrides.components || overrides.drawer || "div";
  }, [overrides]);

  const handleAddModuleClick = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={getClassName()}>
      <button 
        className={getClassName("addButton")} 
        onClick={handleAddModuleClick}
        type="button"
      >
        <Plus size={16} />
        Modul Ekle
      </button>
      
      {isExpanded && (
        <div className={getClassName("horizontalContainer")}>
          <div className={getClassName("scrollableArea")}>
            <Wrapper>
              {componentList ? (
                componentList
              ) : (
                <div className={getClassName("componentsGrid")}>
                  {Object.keys(config.components).map((componentKey) => {
                    const component = config.components[componentKey];
                    return (
                      <div key={componentKey} className={getClassName("componentCard")}>
                        <ComponentList.Item
                          label={component["label"] ?? componentKey}
                          name={componentKey}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </Wrapper>
          </div>
        </div>
      )}
    </div>
  );
};