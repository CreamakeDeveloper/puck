import { Viewports } from "../../types";

export const defaultViewports: Required<Viewports> = [
  { width: 360, height: "auto", icon: "Smartphone", label: "Küçük" },
  { width: 768, height: "auto", icon: "Tablet", label: "Orta" },
  { width: 1280, height: "auto", icon: "Monitor", label: "Büyük" },
];
