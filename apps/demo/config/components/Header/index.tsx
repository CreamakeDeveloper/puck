import { getClassNameFactory } from "@/core/lib";

import styles from "./styles.module.css";

const getClassName = getClassNameFactory("Header", styles);

const NavItem = ({ label, href }: { label: string; href: string }) => {
  const navPath =
    typeof window !== "undefined"
      ? window.location.pathname.replace("/edit", "") || "/"
      : "/";

  const isActive = navPath === (href.replace("/edit", "") || "/");

  const El = href ? "a" : "span";

  return (
    <El
      href={href || "/"}
      style={{
        textDecoration: "none",
        color: isActive
          ? "var(--puck-color-grey-02)"
          : "var(--puck-color-grey-06)",
        fontWeight: isActive ? "600" : "400",
      }}
    >
      {label}
    </El>
  );
};

const Header = ({ 
  editMode, 
  logo = "LOGO", 
  navigation = [] 
}: { 
  editMode: boolean; 
  logo?: string; 
  navigation?: Array<{ label: string; href: string }>;
}) => (
  <div className={getClassName()}>
    <header className={getClassName("inner")}>
      <div className={getClassName("logo")}>{logo}</div>
      <nav className={getClassName("items")}>
        {navigation.map((item, index) => (
          <NavItem 
            key={index}
            label={item.label} 
            href={editMode ? "" : item.href} 
          />
        ))}
      </nav>
    </header>
  </div>
);

export { Header };
