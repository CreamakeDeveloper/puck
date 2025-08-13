import { Button } from "./blocks/Button";
import { Card } from "./blocks/Card";
import { Grid } from "./blocks/Grid";
import { Hero } from "./blocks/Hero";
import { Heading } from "./blocks/Heading";
import { Flex } from "./blocks/Flex";
import { Logos } from "./blocks/Logos";
import { Stats } from "./blocks/Stats";
import { Template } from "./blocks/Template";
import { Text } from "./blocks/Text";
import { Space } from "./blocks/Space";

import Root from "./root";
import { UserConfig } from "./types";
import { initialData } from "./initial-data";

// We avoid the name config as next gets confused
export const conf: UserConfig = {
  root: Root,
  categories: {
    layout: {
      components: ["Grid", "Flex", "Space"],
    },
    typography: {
      components: ["Heading", "Text"],
    },
    interactive: {
      title: "Actions",
      components: ["Button"],
    },
    other: {
      title: "Other",
      components: ["Card", "Hero", "Logos", "Stats", "Template"],
    },
  },
  components: {
    Button,
    Card,
    Grid,
    Hero,
    Heading,
    Flex,
    Logos,
    Stats,
    Template,
    Text,
    Space,
  },
  header: {
    label: "Header",
    fields: {
      language: {
        type: "select",
        options: [
          { label: "Türkçe", value: "tr" },
          { label: "English", value: "en" },
          { label: "Français", value: "fr" },
        ],
      },
      logo: { type: "text" },
      navigation: {
        type: "array",
        arrayFields: {
          label: { type: "text" },
          href: { type: "text" },
        },
      },
    },
  },
  footer: {
    label: "Footer",
    fields: {
      language: {
        type: "select",
        options: [
          { label: "Türkçe", value: "tr" },
          { label: "English", value: "en" },
          { label: "Français", value: "fr" },
        ],
      },
      sections: {
        type: "array",
        arrayFields: {
          title: { type: "text" },
          links: {
            type: "array",
            arrayFields: {
              label: { type: "text" },
              href: { type: "text" },
            },
          },
        },
      },
      copyright: { type: "text" },
    },
  },
};

export const componentKey = Buffer.from(
  `${Object.keys(conf.components).join("-")}-${JSON.stringify(initialData)}`
).toString("base64");

export default conf;
