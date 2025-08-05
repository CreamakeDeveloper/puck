import React, { memo, useCallback, useMemo, useState } from "react";
import { useAppStore, useAppStoreApi } from "../../../../store";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Globe,
  PanelLeft,
  PanelRight,
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

  const dispatch = useAppStore((s) => s.dispatch);
  const appStore = useAppStoreApi();

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
          <div className={getClassName("title")}>
            <Heading rank="2" size="xs">
              {headerTitle || rootTitle || "Page"}
              {headerPath && (
                <>
                  {" "}
                  <code className={getClassName("path")}>{headerPath}</code>
                </>
              )}
            </Heading>
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
    </CustomHeader>
  );
};

export const Header = memo(HeaderInner);
