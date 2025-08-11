import { useMemo, useState } from "react";
import { X, PlusCircle } from "lucide-react";
import styles from "./styles.module.css";
import getClassNameFactory from "../../../../lib/get-class-name-factory";
import { useAppStore } from "../../../../store";
import { Outline } from "../Outline";
import { ComponentList } from "../../../ComponentList";

const getClassName = getClassNameFactory("ConfigWithAddModule", styles);

export const ConfigWithAddModule = () => {
  const [panelOpen, setPanelOpen] = useState(false);
  const config = useAppStore((s) => s.config);

  const totalComponents = useMemo(
    () => Object.keys(config.components || {}).length,
    [config.components]
  );

  return (
    <div className={getClassName({ isOpen: panelOpen })}>
      <div className={getClassName("outline")}> 
        <Outline />
      </div>

      <div className={getClassName("addButtonWrapper")}>
        <button
          type="button"
          className={getClassName("addButton")}
          onClick={() => setPanelOpen(true)}
        >
          <PlusCircle size={16} />
          Yeni Bölüm
        </button>
      </div>

      <div className={getClassName("sidePanel")} aria-hidden={!panelOpen}>
        <div className={getClassName("sidePanelHeader")}>
          <div className={getClassName("sidePanelTitle")}>
            Bölüm Seç ({totalComponents})
          </div>
          <button
            type="button"
            className={getClassName("closeButton")}
            onClick={() => setPanelOpen(false)}
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        <div className={getClassName("sidePanelBody")}>
          {/* Var olan liste/drag yapısının tekrar kullanımı */}
          <ComponentList id="all" />
        </div>
      </div>
    </div>
  );
};

