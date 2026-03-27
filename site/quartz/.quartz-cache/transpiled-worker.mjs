var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// quartz/worker.ts
import sourceMapSupport from "source-map-support";

// quartz/plugins/transformers/frontmatter.ts
import matter from "gray-matter";
import remarkFrontmatter from "remark-frontmatter";
import yaml from "js-yaml";
import toml from "toml";

// quartz/util/path.ts
import { slug as slugAnchor } from "github-slugger";

// quartz/util/clone.ts
import rfdc from "rfdc";
var clone = rfdc();

// quartz/util/path.ts
var QUARTZ = "quartz";
function isRelativeURL(s) {
  const validStart = /^\.{1,2}/.test(s);
  const validEnding = !endsWith(s, "index");
  return validStart && validEnding && ![".md", ".html"].includes(getFileExtension(s) ?? "");
}
__name(isRelativeURL, "isRelativeURL");
function sluggify(s) {
  return s.split("/").map(
    (segment) => segment.replace(/\s/g, "-").replace(/&/g, "-and-").replace(/%/g, "-percent").replace(/\?/g, "").replace(/#/g, "")
  ).join("/").replace(/\/$/, "");
}
__name(sluggify, "sluggify");
function slugifyFilePath(fp, excludeExt) {
  fp = stripSlashes(fp);
  let ext = getFileExtension(fp);
  const withoutFileExt = fp.replace(new RegExp(ext + "$"), "");
  if (excludeExt || [".md", ".html", void 0].includes(ext)) {
    ext = "";
  }
  let slug = sluggify(withoutFileExt);
  if (endsWith(slug, "_index")) {
    slug = slug.replace(/_index$/, "index");
  }
  return slug + ext;
}
__name(slugifyFilePath, "slugifyFilePath");
function simplifySlug(fp) {
  const res = stripSlashes(trimSuffix(fp, "index"), true);
  return res.length === 0 ? "/" : res;
}
__name(simplifySlug, "simplifySlug");
function transformInternalLink(link) {
  let [fplike, anchor] = splitAnchor(decodeURI(link));
  const folderPath = isFolderPath(fplike);
  let segments = fplike.split("/").filter((x) => x.length > 0);
  let prefix = segments.filter(isRelativeSegment).join("/");
  let fp = segments.filter((seg) => !isRelativeSegment(seg) && seg !== "").join("/");
  const simpleSlug = simplifySlug(slugifyFilePath(fp));
  const joined = joinSegments(stripSlashes(prefix), stripSlashes(simpleSlug));
  const trail = folderPath ? "/" : "";
  const res = _addRelativeToStart(joined) + trail + anchor;
  return res;
}
__name(transformInternalLink, "transformInternalLink");
var _rebaseHastElement = /* @__PURE__ */ __name((el, attr, curBase, newBase) => {
  if (el.properties?.[attr]) {
    if (!isRelativeURL(String(el.properties[attr]))) {
      return;
    }
    const rel = joinSegments(resolveRelative(curBase, newBase), "..", el.properties[attr]);
    el.properties[attr] = rel;
  }
}, "_rebaseHastElement");
function normalizeHastElement(rawEl, curBase, newBase) {
  const el = clone(rawEl);
  _rebaseHastElement(el, "src", curBase, newBase);
  _rebaseHastElement(el, "href", curBase, newBase);
  if (el.children) {
    el.children = el.children.map(
      (child) => normalizeHastElement(child, curBase, newBase)
    );
  }
  return el;
}
__name(normalizeHastElement, "normalizeHastElement");
function pathToRoot(slug) {
  let rootPath = slug.split("/").filter((x) => x !== "").slice(0, -1).map((_) => "..").join("/");
  if (rootPath.length === 0) {
    rootPath = ".";
  }
  return rootPath;
}
__name(pathToRoot, "pathToRoot");
function resolveRelative(current, target) {
  const res = joinSegments(pathToRoot(current), simplifySlug(target));
  return res;
}
__name(resolveRelative, "resolveRelative");
function splitAnchor(link) {
  let [fp, anchor] = link.split("#", 2);
  if (fp.endsWith(".pdf")) {
    return [fp, anchor === void 0 ? "" : `#${anchor}`];
  }
  anchor = anchor === void 0 ? "" : "#" + slugAnchor(anchor);
  return [fp, anchor];
}
__name(splitAnchor, "splitAnchor");
function slugTag(tag) {
  return tag.split("/").map((tagSegment) => sluggify(tagSegment)).join("/");
}
__name(slugTag, "slugTag");
function joinSegments(...args) {
  if (args.length === 0) {
    return "";
  }
  let joined = args.filter((segment) => segment !== "" && segment !== "/").map((segment) => stripSlashes(segment)).join("/");
  if (args[0].startsWith("/")) {
    joined = "/" + joined;
  }
  if (args[args.length - 1].endsWith("/")) {
    joined = joined + "/";
  }
  return joined;
}
__name(joinSegments, "joinSegments");
function getAllSegmentPrefixes(tags) {
  const segments = tags.split("/");
  const results = [];
  for (let i = 0; i < segments.length; i++) {
    results.push(segments.slice(0, i + 1).join("/"));
  }
  return results;
}
__name(getAllSegmentPrefixes, "getAllSegmentPrefixes");
function transformLink(src, target, opts) {
  let targetSlug = transformInternalLink(target);
  if (opts.strategy === "relative") {
    return targetSlug;
  } else {
    const folderTail = isFolderPath(targetSlug) ? "/" : "";
    const canonicalSlug = stripSlashes(targetSlug.slice(".".length));
    let [targetCanonical, targetAnchor] = splitAnchor(canonicalSlug);
    if (opts.strategy === "shortest") {
      const matchingFileNames = opts.allSlugs.filter((slug) => {
        const parts = slug.split("/");
        const fileName = parts.at(-1);
        return targetCanonical === fileName;
      });
      if (matchingFileNames.length === 1) {
        const targetSlug2 = matchingFileNames[0];
        return resolveRelative(src, targetSlug2) + targetAnchor;
      }
    }
    return joinSegments(pathToRoot(src), canonicalSlug) + folderTail;
  }
}
__name(transformLink, "transformLink");
function isFolderPath(fplike) {
  return fplike.endsWith("/") || endsWith(fplike, "index") || endsWith(fplike, "index.md") || endsWith(fplike, "index.html");
}
__name(isFolderPath, "isFolderPath");
function endsWith(s, suffix) {
  return s === suffix || s.endsWith("/" + suffix);
}
__name(endsWith, "endsWith");
function trimSuffix(s, suffix) {
  if (endsWith(s, suffix)) {
    s = s.slice(0, -suffix.length);
  }
  return s;
}
__name(trimSuffix, "trimSuffix");
function getFileExtension(s) {
  return s.match(/\.[A-Za-z0-9]+$/)?.[0];
}
__name(getFileExtension, "getFileExtension");
function isRelativeSegment(s) {
  return /^\.{0,2}$/.test(s);
}
__name(isRelativeSegment, "isRelativeSegment");
function stripSlashes(s, onlyStripPrefix) {
  if (s.startsWith("/")) {
    s = s.substring(1);
  }
  if (!onlyStripPrefix && s.endsWith("/")) {
    s = s.slice(0, -1);
  }
  return s;
}
__name(stripSlashes, "stripSlashes");
function _addRelativeToStart(s) {
  if (s === "") {
    s = ".";
  }
  if (!s.startsWith(".")) {
    s = joinSegments(".", s);
  }
  return s;
}
__name(_addRelativeToStart, "_addRelativeToStart");

// quartz/i18n/locales/en-US.ts
var en_US_default = {
  propertyDefaults: {
    title: "Untitled",
    description: "No description provided"
  },
  components: {
    callout: {
      note: "Note",
      abstract: "Abstract",
      info: "Info",
      todo: "Todo",
      tip: "Tip",
      success: "Success",
      question: "Question",
      warning: "Warning",
      failure: "Failure",
      danger: "Danger",
      bug: "Bug",
      example: "Example",
      quote: "Quote"
    },
    backlinks: {
      title: "Backlinks",
      noBacklinksFound: "No backlinks found"
    },
    themeToggle: {
      lightMode: "Light mode",
      darkMode: "Dark mode"
    },
    readerMode: {
      title: "Reader mode"
    },
    explorer: {
      title: "Explorer"
    },
    footer: {
      createdWith: "Created with"
    },
    graph: {
      title: "Graph View"
    },
    recentNotes: {
      title: "Recent Notes",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `See ${remaining} more \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `Transclude of ${targetSlug}`, "transcludeOf"),
      linkToOriginal: "Link to original"
    },
    search: {
      title: "Search",
      searchBarPlaceholder: "Search for something"
    },
    tableOfContents: {
      title: "Table of Contents"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => `${minutes} min read`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "Recent notes",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => `Last ${count} notes`, "lastFewNotes")
    },
    error: {
      title: "Not Found",
      notFound: "Either this page is private or doesn't exist.",
      home: "Return to Homepage"
    },
    folderContent: {
      folder: "Folder",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 item under this folder." : `${count} items under this folder.`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "Tag",
      tagIndex: "Tag Index",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 item with this tag." : `${count} items with this tag.`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => `Showing first ${count} tags.`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => `Found ${count} total tags.`, "totalTags")
    }
  }
};

// quartz/i18n/locales/en-GB.ts
var en_GB_default = {
  propertyDefaults: {
    title: "Untitled",
    description: "No description provided"
  },
  components: {
    callout: {
      note: "Note",
      abstract: "Abstract",
      info: "Info",
      todo: "To-Do",
      tip: "Tip",
      success: "Success",
      question: "Question",
      warning: "Warning",
      failure: "Failure",
      danger: "Danger",
      bug: "Bug",
      example: "Example",
      quote: "Quote"
    },
    backlinks: {
      title: "Backlinks",
      noBacklinksFound: "No backlinks found"
    },
    themeToggle: {
      lightMode: "Light mode",
      darkMode: "Dark mode"
    },
    readerMode: {
      title: "Reader mode"
    },
    explorer: {
      title: "Explorer"
    },
    footer: {
      createdWith: "Created with"
    },
    graph: {
      title: "Graph View"
    },
    recentNotes: {
      title: "Recent Notes",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `See ${remaining} more \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `Transclude of ${targetSlug}`, "transcludeOf"),
      linkToOriginal: "Link to original"
    },
    search: {
      title: "Search",
      searchBarPlaceholder: "Search for something"
    },
    tableOfContents: {
      title: "Table of Contents"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => `${minutes} min read`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "Recent notes",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => `Last ${count} notes`, "lastFewNotes")
    },
    error: {
      title: "Not Found",
      notFound: "Either this page is private or doesn't exist.",
      home: "Return to Homepage"
    },
    folderContent: {
      folder: "Folder",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 item under this folder." : `${count} items under this folder.`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "Tag",
      tagIndex: "Tag Index",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 item with this tag." : `${count} items with this tag.`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => `Showing first ${count} tags.`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => `Found ${count} total tags.`, "totalTags")
    }
  }
};

// quartz/i18n/locales/fr-FR.ts
var fr_FR_default = {
  propertyDefaults: {
    title: "Sans titre",
    description: "Aucune description fournie"
  },
  components: {
    callout: {
      note: "Note",
      abstract: "R\xE9sum\xE9",
      info: "Info",
      todo: "\xC0 faire",
      tip: "Conseil",
      success: "Succ\xE8s",
      question: "Question",
      warning: "Avertissement",
      failure: "\xC9chec",
      danger: "Danger",
      bug: "Bogue",
      example: "Exemple",
      quote: "Citation"
    },
    backlinks: {
      title: "Liens retour",
      noBacklinksFound: "Aucun lien retour trouv\xE9"
    },
    themeToggle: {
      lightMode: "Mode clair",
      darkMode: "Mode sombre"
    },
    readerMode: {
      title: "Mode lecture"
    },
    explorer: {
      title: "Explorateur"
    },
    footer: {
      createdWith: "Cr\xE9\xE9 avec"
    },
    graph: {
      title: "Vue Graphique"
    },
    recentNotes: {
      title: "Notes R\xE9centes",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `Voir ${remaining} de plus \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `Transclusion de ${targetSlug}`, "transcludeOf"),
      linkToOriginal: "Lien vers l'original"
    },
    search: {
      title: "Recherche",
      searchBarPlaceholder: "Rechercher quelque chose"
    },
    tableOfContents: {
      title: "Table des Mati\xE8res"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => `${minutes} min de lecture`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "Notes r\xE9centes",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => `Les derni\xE8res ${count} notes`, "lastFewNotes")
    },
    error: {
      title: "Introuvable",
      notFound: "Cette page est soit priv\xE9e, soit elle n'existe pas.",
      home: "Retour \xE0 la page d'accueil"
    },
    folderContent: {
      folder: "Dossier",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 \xE9l\xE9ment sous ce dossier." : `${count} \xE9l\xE9ments sous ce dossier.`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "\xC9tiquette",
      tagIndex: "Index des \xE9tiquettes",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 \xE9l\xE9ment avec cette \xE9tiquette." : `${count} \xE9l\xE9ments avec cette \xE9tiquette.`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => `Affichage des premi\xE8res ${count} \xE9tiquettes.`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => `Trouv\xE9 ${count} \xE9tiquettes au total.`, "totalTags")
    }
  }
};

// quartz/i18n/locales/it-IT.ts
var it_IT_default = {
  propertyDefaults: {
    title: "Senza titolo",
    description: "Nessuna descrizione"
  },
  components: {
    callout: {
      note: "Nota",
      abstract: "Abstract",
      info: "Info",
      todo: "Da fare",
      tip: "Consiglio",
      success: "Completato",
      question: "Domanda",
      warning: "Attenzione",
      failure: "Errore",
      danger: "Pericolo",
      bug: "Problema",
      example: "Esempio",
      quote: "Citazione"
    },
    backlinks: {
      title: "Link entranti",
      noBacklinksFound: "Nessun link entrante"
    },
    themeToggle: {
      lightMode: "Tema chiaro",
      darkMode: "Tema scuro"
    },
    readerMode: {
      title: "Modalit\xE0 lettura"
    },
    explorer: {
      title: "Esplora"
    },
    footer: {
      createdWith: "Creato con"
    },
    graph: {
      title: "Vista grafico"
    },
    recentNotes: {
      title: "Note recenti",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => remaining === 1 ? "Vedi 1 altra \u2192" : `Vedi altre ${remaining} \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `Inclusione di ${targetSlug}`, "transcludeOf"),
      linkToOriginal: "Link all'originale"
    },
    search: {
      title: "Cerca",
      searchBarPlaceholder: "Cerca qualcosa"
    },
    tableOfContents: {
      title: "Indice"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => minutes === 1 ? "1 minuto" : `${minutes} minuti`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "Note recenti",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => count === 1 ? "Ultima nota" : `Ultime ${count} note`, "lastFewNotes")
    },
    error: {
      title: "Non trovato",
      notFound: "Questa pagina \xE8 privata o non esiste.",
      home: "Ritorna alla home page"
    },
    folderContent: {
      folder: "Cartella",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 oggetto in questa cartella." : `${count} oggetti in questa cartella.`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "Etichetta",
      tagIndex: "Indice etichette",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 oggetto con questa etichetta." : `${count} oggetti con questa etichetta.`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => count === 1 ? "Prima etichetta." : `Prime ${count} etichette.`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => count === 1 ? "Trovata 1 etichetta in totale." : `Trovate ${count} etichette totali.`, "totalTags")
    }
  }
};

// quartz/i18n/locales/ja-JP.ts
var ja_JP_default = {
  propertyDefaults: {
    title: "\u7121\u984C",
    description: "\u8AAC\u660E\u306A\u3057"
  },
  components: {
    callout: {
      note: "\u30CE\u30FC\u30C8",
      abstract: "\u6284\u9332",
      info: "\u60C5\u5831",
      todo: "\u3084\u308B\u3079\u304D\u3053\u3068",
      tip: "\u30D2\u30F3\u30C8",
      success: "\u6210\u529F",
      question: "\u8CEA\u554F",
      warning: "\u8B66\u544A",
      failure: "\u5931\u6557",
      danger: "\u5371\u967A",
      bug: "\u30D0\u30B0",
      example: "\u4F8B",
      quote: "\u5F15\u7528"
    },
    backlinks: {
      title: "\u30D0\u30C3\u30AF\u30EA\u30F3\u30AF",
      noBacklinksFound: "\u30D0\u30C3\u30AF\u30EA\u30F3\u30AF\u306F\u3042\u308A\u307E\u305B\u3093"
    },
    themeToggle: {
      lightMode: "\u30E9\u30A4\u30C8\u30E2\u30FC\u30C9",
      darkMode: "\u30C0\u30FC\u30AF\u30E2\u30FC\u30C9"
    },
    readerMode: {
      title: "\u30EA\u30FC\u30C0\u30FC\u30E2\u30FC\u30C9"
    },
    explorer: {
      title: "\u30A8\u30AF\u30B9\u30D7\u30ED\u30FC\u30E9\u30FC"
    },
    footer: {
      createdWith: "\u4F5C\u6210"
    },
    graph: {
      title: "\u30B0\u30E9\u30D5\u30D3\u30E5\u30FC"
    },
    recentNotes: {
      title: "\u6700\u8FD1\u306E\u8A18\u4E8B",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `\u3055\u3089\u306B${remaining}\u4EF6 \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `${targetSlug}\u306E\u307E\u3068\u3081`, "transcludeOf"),
      linkToOriginal: "\u5143\u8A18\u4E8B\u3078\u306E\u30EA\u30F3\u30AF"
    },
    search: {
      title: "\u691C\u7D22",
      searchBarPlaceholder: "\u691C\u7D22\u30EF\u30FC\u30C9\u3092\u5165\u529B"
    },
    tableOfContents: {
      title: "\u76EE\u6B21"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => `${minutes} min read`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "\u6700\u8FD1\u306E\u8A18\u4E8B",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => `\u6700\u65B0\u306E${count}\u4EF6`, "lastFewNotes")
    },
    error: {
      title: "Not Found",
      notFound: "\u30DA\u30FC\u30B8\u304C\u5B58\u5728\u3057\u306A\u3044\u304B\u3001\u975E\u516C\u958B\u8A2D\u5B9A\u306B\u306A\u3063\u3066\u3044\u307E\u3059\u3002",
      home: "\u30DB\u30FC\u30E0\u30DA\u30FC\u30B8\u306B\u623B\u308B"
    },
    folderContent: {
      folder: "\u30D5\u30A9\u30EB\u30C0",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => `${count}\u4EF6\u306E\u30DA\u30FC\u30B8`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "\u30BF\u30B0",
      tagIndex: "\u30BF\u30B0\u4E00\u89A7",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => `${count}\u4EF6\u306E\u30DA\u30FC\u30B8`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => `\u306E\u3046\u3061\u6700\u521D\u306E${count}\u4EF6\u3092\u8868\u793A\u3057\u3066\u3044\u307E\u3059`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => `\u5168${count}\u500B\u306E\u30BF\u30B0\u3092\u8868\u793A\u4E2D`, "totalTags")
    }
  }
};

// quartz/i18n/locales/de-DE.ts
var de_DE_default = {
  propertyDefaults: {
    title: "Unbenannt",
    description: "Keine Beschreibung angegeben"
  },
  components: {
    callout: {
      note: "Hinweis",
      abstract: "Zusammenfassung",
      info: "Info",
      todo: "Zu erledigen",
      tip: "Tipp",
      success: "Erfolg",
      question: "Frage",
      warning: "Warnung",
      failure: "Fehlgeschlagen",
      danger: "Gefahr",
      bug: "Fehler",
      example: "Beispiel",
      quote: "Zitat"
    },
    backlinks: {
      title: "Backlinks",
      noBacklinksFound: "Keine Backlinks gefunden"
    },
    themeToggle: {
      lightMode: "Heller Modus",
      darkMode: "Dunkler Modus"
    },
    readerMode: {
      title: "Lesemodus"
    },
    explorer: {
      title: "Explorer"
    },
    footer: {
      createdWith: "Erstellt mit"
    },
    graph: {
      title: "Graphansicht"
    },
    recentNotes: {
      title: "Zuletzt bearbeitete Seiten",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `${remaining} weitere ansehen \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `Transklusion von ${targetSlug}`, "transcludeOf"),
      linkToOriginal: "Link zum Original"
    },
    search: {
      title: "Suche",
      searchBarPlaceholder: "Suche nach etwas"
    },
    tableOfContents: {
      title: "Inhaltsverzeichnis"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => `${minutes} Min. Lesezeit`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "Zuletzt bearbeitete Seiten",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => `Letzte ${count} Seiten`, "lastFewNotes")
    },
    error: {
      title: "Nicht gefunden",
      notFound: "Diese Seite ist entweder nicht \xF6ffentlich oder existiert nicht.",
      home: "Zur Startseite"
    },
    folderContent: {
      folder: "Ordner",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 Datei in diesem Ordner." : `${count} Dateien in diesem Ordner.`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "Tag",
      tagIndex: "Tag-\xDCbersicht",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 Datei mit diesem Tag." : `${count} Dateien mit diesem Tag.`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => `Die ersten ${count} Tags werden angezeigt.`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => `${count} Tags insgesamt.`, "totalTags")
    }
  }
};

// quartz/i18n/locales/nl-NL.ts
var nl_NL_default = {
  propertyDefaults: {
    title: "Naamloos",
    description: "Geen beschrijving gegeven."
  },
  components: {
    callout: {
      note: "Notitie",
      abstract: "Samenvatting",
      info: "Info",
      todo: "Te doen",
      tip: "Tip",
      success: "Succes",
      question: "Vraag",
      warning: "Waarschuwing",
      failure: "Mislukking",
      danger: "Gevaar",
      bug: "Bug",
      example: "Voorbeeld",
      quote: "Citaat"
    },
    backlinks: {
      title: "Backlinks",
      noBacklinksFound: "Geen backlinks gevonden"
    },
    themeToggle: {
      lightMode: "Lichte modus",
      darkMode: "Donkere modus"
    },
    readerMode: {
      title: "Leesmodus"
    },
    explorer: {
      title: "Verkenner"
    },
    footer: {
      createdWith: "Gemaakt met"
    },
    graph: {
      title: "Grafiekweergave"
    },
    recentNotes: {
      title: "Recente notities",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `Zie ${remaining} meer \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `Invoeging van ${targetSlug}`, "transcludeOf"),
      linkToOriginal: "Link naar origineel"
    },
    search: {
      title: "Zoeken",
      searchBarPlaceholder: "Doorzoek de website"
    },
    tableOfContents: {
      title: "Inhoudsopgave"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => minutes === 1 ? "1 minuut leestijd" : `${minutes} minuten leestijd`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "Recente notities",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => `Laatste ${count} notities`, "lastFewNotes")
    },
    error: {
      title: "Niet gevonden",
      notFound: "Deze pagina is niet zichtbaar of bestaat niet.",
      home: "Keer terug naar de start pagina"
    },
    folderContent: {
      folder: "Map",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 item in deze map." : `${count} items in deze map.`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "Label",
      tagIndex: "Label-index",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 item met dit label." : `${count} items met dit label.`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => count === 1 ? "Eerste label tonen." : `Eerste ${count} labels tonen.`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => `${count} labels gevonden.`, "totalTags")
    }
  }
};

// quartz/i18n/locales/ro-RO.ts
var ro_RO_default = {
  propertyDefaults: {
    title: "F\u0103r\u0103 titlu",
    description: "Nici o descriere furnizat\u0103"
  },
  components: {
    callout: {
      note: "Not\u0103",
      abstract: "Rezumat",
      info: "Informa\u021Bie",
      todo: "De f\u0103cut",
      tip: "Sfat",
      success: "Succes",
      question: "\xCEntrebare",
      warning: "Avertisment",
      failure: "E\u0219ec",
      danger: "Pericol",
      bug: "Bug",
      example: "Exemplu",
      quote: "Citat"
    },
    backlinks: {
      title: "Leg\u0103turi \xEEnapoi",
      noBacklinksFound: "Nu s-au g\u0103sit leg\u0103turi \xEEnapoi"
    },
    themeToggle: {
      lightMode: "Modul luminos",
      darkMode: "Modul \xEEntunecat"
    },
    readerMode: {
      title: "Modul de citire"
    },
    explorer: {
      title: "Explorator"
    },
    footer: {
      createdWith: "Creat cu"
    },
    graph: {
      title: "Graf"
    },
    recentNotes: {
      title: "Noti\u021Be recente",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `Vezi \xEEnc\u0103 ${remaining} \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `Extras din ${targetSlug}`, "transcludeOf"),
      linkToOriginal: "Leg\u0103tur\u0103 c\u0103tre original"
    },
    search: {
      title: "C\u0103utare",
      searchBarPlaceholder: "Introduce\u021Bi termenul de c\u0103utare..."
    },
    tableOfContents: {
      title: "Cuprins"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => minutes == 1 ? `lectur\u0103 de 1 minut` : `lectur\u0103 de ${minutes} minute`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "Noti\u021Be recente",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => `Ultimele ${count} noti\u021Be`, "lastFewNotes")
    },
    error: {
      title: "Pagina nu a fost g\u0103sit\u0103",
      notFound: "Fie aceast\u0103 pagin\u0103 este privat\u0103, fie nu exist\u0103.",
      home: "Reveni\u021Bi la pagina de pornire"
    },
    folderContent: {
      folder: "Dosar",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 articol \xEEn acest dosar." : `${count} elemente \xEEn acest dosar.`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "Etichet\u0103",
      tagIndex: "Indexul etichetelor",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 articol cu aceast\u0103 etichet\u0103." : `${count} articole cu aceast\u0103 etichet\u0103.`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => `Se afi\u0219eaz\u0103 primele ${count} etichete.`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => `Au fost g\u0103site ${count} etichete \xEEn total.`, "totalTags")
    }
  }
};

// quartz/i18n/locales/ca-ES.ts
var ca_ES_default = {
  propertyDefaults: {
    title: "Sense t\xEDtol",
    description: "Sense descripci\xF3"
  },
  components: {
    callout: {
      note: "Nota",
      abstract: "Resum",
      info: "Informaci\xF3",
      todo: "Per fer",
      tip: "Consell",
      success: "\xC8xit",
      question: "Pregunta",
      warning: "Advert\xE8ncia",
      failure: "Fall",
      danger: "Perill",
      bug: "Error",
      example: "Exemple",
      quote: "Cita"
    },
    backlinks: {
      title: "Retroenlla\xE7",
      noBacklinksFound: "No s'han trobat retroenlla\xE7os"
    },
    themeToggle: {
      lightMode: "Mode clar",
      darkMode: "Mode fosc"
    },
    readerMode: {
      title: "Mode lector"
    },
    explorer: {
      title: "Explorador"
    },
    footer: {
      createdWith: "Creat amb"
    },
    graph: {
      title: "Vista Gr\xE0fica"
    },
    recentNotes: {
      title: "Notes Recents",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `Vegi ${remaining} m\xE9s \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `Transcluit de ${targetSlug}`, "transcludeOf"),
      linkToOriginal: "Enlla\xE7 a l'original"
    },
    search: {
      title: "Cercar",
      searchBarPlaceholder: "Cerca alguna cosa"
    },
    tableOfContents: {
      title: "Taula de Continguts"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => `Es llegeix en ${minutes} min`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "Notes recents",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => `\xDAltimes ${count} notes`, "lastFewNotes")
    },
    error: {
      title: "No s'ha trobat.",
      notFound: "Aquesta p\xE0gina \xE9s privada o no existeix.",
      home: "Torna a la p\xE0gina principal"
    },
    folderContent: {
      folder: "Carpeta",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 article en aquesta carpeta." : `${count} articles en esta carpeta.`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "Etiqueta",
      tagIndex: "\xEDndex d'Etiquetes",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 article amb aquesta etiqueta." : `${count} article amb aquesta etiqueta.`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => `Mostrant les primeres ${count} etiquetes.`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => `S'han trobat ${count} etiquetes en total.`, "totalTags")
    }
  }
};

// quartz/i18n/locales/es-ES.ts
var es_ES_default = {
  propertyDefaults: {
    title: "Sin t\xEDtulo",
    description: "Sin descripci\xF3n"
  },
  components: {
    callout: {
      note: "Nota",
      abstract: "Resumen",
      info: "Informaci\xF3n",
      todo: "Por hacer",
      tip: "Consejo",
      success: "\xC9xito",
      question: "Pregunta",
      warning: "Advertencia",
      failure: "Fallo",
      danger: "Peligro",
      bug: "Error",
      example: "Ejemplo",
      quote: "Cita"
    },
    backlinks: {
      title: "Retroenlaces",
      noBacklinksFound: "No se han encontrado retroenlaces"
    },
    themeToggle: {
      lightMode: "Modo claro",
      darkMode: "Modo oscuro"
    },
    readerMode: {
      title: "Modo lector"
    },
    explorer: {
      title: "Explorador"
    },
    footer: {
      createdWith: "Creado con"
    },
    graph: {
      title: "Vista Gr\xE1fica"
    },
    recentNotes: {
      title: "Notas Recientes",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `Vea ${remaining} m\xE1s \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `Transcluido de ${targetSlug}`, "transcludeOf"),
      linkToOriginal: "Enlace al original"
    },
    search: {
      title: "Buscar",
      searchBarPlaceholder: "Busca algo"
    },
    tableOfContents: {
      title: "Tabla de Contenidos"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => `Se lee en ${minutes} min`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "Notas recientes",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => `\xDAltimas ${count} notas`, "lastFewNotes")
    },
    error: {
      title: "No se ha encontrado.",
      notFound: "Esta p\xE1gina es privada o no existe.",
      home: "Regresa a la p\xE1gina principal"
    },
    folderContent: {
      folder: "Carpeta",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 art\xEDculo en esta carpeta." : `${count} art\xEDculos en esta carpeta.`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "Etiqueta",
      tagIndex: "\xCDndice de Etiquetas",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 art\xEDculo con esta etiqueta." : `${count} art\xEDculos con esta etiqueta.`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => `Mostrando las primeras ${count} etiquetas.`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => `Se han encontrado ${count} etiquetas en total.`, "totalTags")
    }
  }
};

// quartz/i18n/locales/ar-SA.ts
var ar_SA_default = {
  propertyDefaults: {
    title: "\u063A\u064A\u0631 \u0645\u0639\u0646\u0648\u0646",
    description: "\u0644\u0645 \u064A\u062A\u0645 \u062A\u0642\u062F\u064A\u0645 \u0623\u064A \u0648\u0635\u0641"
  },
  direction: "rtl",
  components: {
    callout: {
      note: "\u0645\u0644\u0627\u062D\u0638\u0629",
      abstract: "\u0645\u0644\u062E\u0635",
      info: "\u0645\u0639\u0644\u0648\u0645\u0627\u062A",
      todo: "\u0644\u0644\u0642\u064A\u0627\u0645",
      tip: "\u0646\u0635\u064A\u062D\u0629",
      success: "\u0646\u062C\u0627\u062D",
      question: "\u0633\u0624\u0627\u0644",
      warning: "\u062A\u062D\u0630\u064A\u0631",
      failure: "\u0641\u0634\u0644",
      danger: "\u062E\u0637\u0631",
      bug: "\u062E\u0644\u0644",
      example: "\u0645\u062B\u0627\u0644",
      quote: "\u0627\u0642\u062A\u0628\u0627\u0633"
    },
    backlinks: {
      title: "\u0648\u0635\u0644\u0627\u062A \u0627\u0644\u0639\u0648\u062F\u0629",
      noBacklinksFound: "\u0644\u0627 \u064A\u0648\u062C\u062F \u0648\u0635\u0644\u0627\u062A \u0639\u0648\u062F\u0629"
    },
    themeToggle: {
      lightMode: "\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0646\u0647\u0627\u0631\u064A",
      darkMode: "\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0644\u064A\u0644\u064A"
    },
    explorer: {
      title: "\u0627\u0644\u0645\u0633\u062A\u0639\u0631\u0636"
    },
    readerMode: {
      title: "\u0648\u0636\u0639 \u0627\u0644\u0642\u0627\u0631\u0626"
    },
    footer: {
      createdWith: "\u0623\u064F\u0646\u0634\u0626 \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645"
    },
    graph: {
      title: "\u0627\u0644\u062A\u0645\u062B\u064A\u0644 \u0627\u0644\u062A\u0641\u0627\u0639\u0644\u064A"
    },
    recentNotes: {
      title: "\u0622\u062E\u0631 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `\u062A\u0635\u0641\u062D ${remaining} \u0623\u0643\u062B\u0631 \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `\u0645\u0642\u062A\u0628\u0633 \u0645\u0646 ${targetSlug}`, "transcludeOf"),
      linkToOriginal: "\u0648\u0635\u0644\u0629 \u0644\u0644\u0645\u0644\u0627\u062D\u0638\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u0629"
    },
    search: {
      title: "\u0628\u062D\u062B",
      searchBarPlaceholder: "\u0627\u0628\u062D\u062B \u0639\u0646 \u0634\u064A\u0621 \u0645\u0627"
    },
    tableOfContents: {
      title: "\u0641\u0647\u0631\u0633 \u0627\u0644\u0645\u062D\u062A\u0648\u064A\u0627\u062A"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => minutes == 1 ? `\u062F\u0642\u064A\u0642\u0629 \u0623\u0648 \u0623\u0642\u0644 \u0644\u0644\u0642\u0631\u0627\u0621\u0629` : minutes == 2 ? `\u062F\u0642\u064A\u0642\u062A\u0627\u0646 \u0644\u0644\u0642\u0631\u0627\u0621\u0629` : `${minutes} \u062F\u0642\u0627\u0626\u0642 \u0644\u0644\u0642\u0631\u0627\u0621\u0629`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "\u0622\u062E\u0631 \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => `\u0622\u062E\u0631 ${count} \u0645\u0644\u0627\u062D\u0638\u0629`, "lastFewNotes")
    },
    error: {
      title: "\u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F",
      notFound: "\u0625\u0645\u0627 \u0623\u0646 \u0647\u0630\u0647 \u0627\u0644\u0635\u0641\u062D\u0629 \u062E\u0627\u0635\u0629 \u0623\u0648 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629.",
      home: "\u0627\u0644\u0639\u0648\u062F\u0647 \u0644\u0644\u0635\u0641\u062D\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629"
    },
    folderContent: {
      folder: "\u0645\u062C\u0644\u062F",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => count === 1 ? "\u064A\u0648\u062C\u062F \u0639\u0646\u0635\u0631 \u0648\u0627\u062D\u062F \u0641\u0642\u0637 \u062A\u062D\u062A \u0647\u0630\u0627 \u0627\u0644\u0645\u062C\u0644\u062F" : `\u064A\u0648\u062C\u062F ${count} \u0639\u0646\u0627\u0635\u0631 \u062A\u062D\u062A \u0647\u0630\u0627 \u0627\u0644\u0645\u062C\u0644\u062F.`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "\u0627\u0644\u0648\u0633\u0645",
      tagIndex: "\u0645\u0624\u0634\u0631 \u0627\u0644\u0648\u0633\u0645",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => count === 1 ? "\u064A\u0648\u062C\u062F \u0639\u0646\u0635\u0631 \u0648\u0627\u062D\u062F \u0641\u0642\u0637 \u062A\u062D\u062A \u0647\u0630\u0627 \u0627\u0644\u0648\u0633\u0645" : `\u064A\u0648\u062C\u062F ${count} \u0639\u0646\u0627\u0635\u0631 \u062A\u062D\u062A \u0647\u0630\u0627 \u0627\u0644\u0648\u0633\u0645.`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => `\u0625\u0638\u0647\u0627\u0631 \u0623\u0648\u0644 ${count} \u0623\u0648\u0633\u0645\u0629.`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => `\u064A\u0648\u062C\u062F ${count} \u0623\u0648\u0633\u0645\u0629.`, "totalTags")
    }
  }
};

// quartz/i18n/locales/uk-UA.ts
var uk_UA_default = {
  propertyDefaults: {
    title: "\u0411\u0435\u0437 \u043D\u0430\u0437\u0432\u0438",
    description: "\u041E\u043F\u0438\u0441 \u043D\u0435 \u043D\u0430\u0434\u0430\u043D\u043E"
  },
  components: {
    callout: {
      note: "\u041F\u0440\u0438\u043C\u0456\u0442\u043A\u0430",
      abstract: "\u0410\u0431\u0441\u0442\u0440\u0430\u043A\u0442",
      info: "\u0406\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0456\u044F",
      todo: "\u0417\u0430\u0432\u0434\u0430\u043D\u043D\u044F",
      tip: "\u041F\u043E\u0440\u0430\u0434\u0430",
      success: "\u0423\u0441\u043F\u0456\u0445",
      question: "\u041F\u0438\u0442\u0430\u043D\u043D\u044F",
      warning: "\u041F\u043E\u043F\u0435\u0440\u0435\u0434\u0436\u0435\u043D\u043D\u044F",
      failure: "\u041D\u0435\u0432\u0434\u0430\u0447\u0430",
      danger: "\u041D\u0435\u0431\u0435\u0437\u043F\u0435\u043A\u0430",
      bug: "\u0411\u0430\u0433",
      example: "\u041F\u0440\u0438\u043A\u043B\u0430\u0434",
      quote: "\u0426\u0438\u0442\u0430\u0442\u0430"
    },
    backlinks: {
      title: "\u0417\u0432\u043E\u0440\u043E\u0442\u043D\u0456 \u043F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F",
      noBacklinksFound: "\u0417\u0432\u043E\u0440\u043E\u0442\u043D\u0438\u0445 \u043F\u043E\u0441\u0438\u043B\u0430\u043D\u044C \u043D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E"
    },
    themeToggle: {
      lightMode: "\u0421\u0432\u0456\u0442\u043B\u0438\u0439 \u0440\u0435\u0436\u0438\u043C",
      darkMode: "\u0422\u0435\u043C\u043D\u0438\u0439 \u0440\u0435\u0436\u0438\u043C"
    },
    readerMode: {
      title: "\u0420\u0435\u0436\u0438\u043C \u0447\u0438\u0442\u0430\u043D\u043D\u044F"
    },
    explorer: {
      title: "\u041F\u0440\u043E\u0432\u0456\u0434\u043D\u0438\u043A"
    },
    footer: {
      createdWith: "\u0421\u0442\u0432\u043E\u0440\u0435\u043D\u043E \u0437\u0430 \u0434\u043E\u043F\u043E\u043C\u043E\u0433\u043E\u044E"
    },
    graph: {
      title: "\u0412\u0438\u0433\u043B\u044F\u0434 \u0433\u0440\u0430\u0444\u0430"
    },
    recentNotes: {
      title: "\u041E\u0441\u0442\u0430\u043D\u043D\u0456 \u043D\u043E\u0442\u0430\u0442\u043A\u0438",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `\u041F\u0435\u0440\u0435\u0433\u043B\u044F\u043D\u0443\u0442\u0438 \u0449\u0435 ${remaining} \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `\u0412\u0438\u0434\u043E\u0431\u0443\u0442\u043E \u0437 ${targetSlug}`, "transcludeOf"),
      linkToOriginal: "\u041F\u043E\u0441\u0438\u043B\u0430\u043D\u043D\u044F \u043D\u0430 \u043E\u0440\u0438\u0433\u0456\u043D\u0430\u043B"
    },
    search: {
      title: "\u041F\u043E\u0448\u0443\u043A",
      searchBarPlaceholder: "\u0428\u0443\u043A\u0430\u0442\u0438 \u0449\u043E\u0441\u044C"
    },
    tableOfContents: {
      title: "\u0417\u043C\u0456\u0441\u0442"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => `${minutes} \u0445\u0432 \u0447\u0438\u0442\u0430\u043D\u043D\u044F`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "\u041E\u0441\u0442\u0430\u043D\u043D\u0456 \u043D\u043E\u0442\u0430\u0442\u043A\u0438",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => `\u041E\u0441\u0442\u0430\u043D\u043D\u0456 \u043D\u043E\u0442\u0430\u0442\u043A\u0438: ${count}`, "lastFewNotes")
    },
    error: {
      title: "\u041D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E",
      notFound: "\u0426\u044F \u0441\u0442\u043E\u0440\u0456\u043D\u043A\u0430 \u0430\u0431\u043E \u043F\u0440\u0438\u0432\u0430\u0442\u043D\u0430, \u0430\u0431\u043E \u043D\u0435 \u0456\u0441\u043D\u0443\u0454.",
      home: "\u041F\u043E\u0432\u0435\u0440\u043D\u0443\u0442\u0438\u0441\u044F \u043D\u0430 \u0433\u043E\u043B\u043E\u0432\u043D\u0443 \u0441\u0442\u043E\u0440\u0456\u043D\u043A\u0443"
    },
    folderContent: {
      folder: "\u0422\u0435\u043A\u0430",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => count === 1 ? "\u0423 \u0446\u0456\u0439 \u0442\u0435\u0446\u0456 1 \u0435\u043B\u0435\u043C\u0435\u043D\u0442." : `\u0415\u043B\u0435\u043C\u0435\u043D\u0442\u0456\u0432 \u0443 \u0446\u0456\u0439 \u0442\u0435\u0446\u0456: ${count}.`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "\u041C\u0456\u0442\u043A\u0430",
      tagIndex: "\u0406\u043D\u0434\u0435\u043A\u0441 \u043C\u0456\u0442\u043A\u0438",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 \u0435\u043B\u0435\u043C\u0435\u043D\u0442 \u0437 \u0446\u0456\u0454\u044E \u043C\u0456\u0442\u043A\u043E\u044E." : `\u0415\u043B\u0435\u043C\u0435\u043D\u0442\u0456\u0432 \u0437 \u0446\u0456\u0454\u044E \u043C\u0456\u0442\u043A\u043E\u044E: ${count}.`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => `\u041F\u043E\u043A\u0430\u0437 \u043F\u0435\u0440\u0448\u0438\u0445 ${count} \u043C\u0456\u0442\u043E\u043A.`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => `\u0412\u0441\u044C\u043E\u0433\u043E \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E \u043C\u0456\u0442\u043E\u043A: ${count}.`, "totalTags")
    }
  }
};

// quartz/i18n/locales/ru-RU.ts
var ru_RU_default = {
  propertyDefaults: {
    title: "\u0411\u0435\u0437 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F",
    description: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u0435\u0442"
  },
  components: {
    callout: {
      note: "\u0417\u0430\u043C\u0435\u0442\u043A\u0430",
      abstract: "\u0420\u0435\u0437\u044E\u043C\u0435",
      info: "\u0418\u043D\u0444\u043E",
      todo: "\u0421\u0434\u0435\u043B\u0430\u0442\u044C",
      tip: "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430",
      success: "\u0423\u0441\u043F\u0435\u0445",
      question: "\u0412\u043E\u043F\u0440\u043E\u0441",
      warning: "\u041F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u0435",
      failure: "\u041D\u0435\u0443\u0434\u0430\u0447\u0430",
      danger: "\u041E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u044C",
      bug: "\u0411\u0430\u0433",
      example: "\u041F\u0440\u0438\u043C\u0435\u0440",
      quote: "\u0426\u0438\u0442\u0430\u0442\u0430"
    },
    backlinks: {
      title: "\u041E\u0431\u0440\u0430\u0442\u043D\u044B\u0435 \u0441\u0441\u044B\u043B\u043A\u0438",
      noBacklinksFound: "\u041E\u0431\u0440\u0430\u0442\u043D\u044B\u0435 \u0441\u0441\u044B\u043B\u043A\u0438 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u044E\u0442"
    },
    themeToggle: {
      lightMode: "\u0421\u0432\u0435\u0442\u043B\u044B\u0439 \u0440\u0435\u0436\u0438\u043C",
      darkMode: "\u0422\u0451\u043C\u043D\u044B\u0439 \u0440\u0435\u0436\u0438\u043C"
    },
    readerMode: {
      title: "\u0420\u0435\u0436\u0438\u043C \u0447\u0442\u0435\u043D\u0438\u044F"
    },
    explorer: {
      title: "\u041F\u0440\u043E\u0432\u043E\u0434\u043D\u0438\u043A"
    },
    footer: {
      createdWith: "\u0421\u043E\u0437\u0434\u0430\u043D\u043E \u0441 \u043F\u043E\u043C\u043E\u0449\u044C\u044E"
    },
    graph: {
      title: "\u0412\u0438\u0434 \u0433\u0440\u0430\u0444\u0430"
    },
    recentNotes: {
      title: "\u041D\u0435\u0434\u0430\u0432\u043D\u0438\u0435 \u0437\u0430\u043C\u0435\u0442\u043A\u0438",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `\u041F\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u043E\u0441\u0442\u0430\u0432\u0448${getForm(remaining, "\u0443\u044E\u0441\u044F", "\u0438\u0435\u0441\u044F", "\u0438\u0435\u0441\u044F")} ${remaining} \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `\u041F\u0435\u0440\u0435\u0445\u043E\u0434 \u0438\u0437 ${targetSlug}`, "transcludeOf"),
      linkToOriginal: "\u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u043E\u0440\u0438\u0433\u0438\u043D\u0430\u043B"
    },
    search: {
      title: "\u041F\u043E\u0438\u0441\u043A",
      searchBarPlaceholder: "\u041D\u0430\u0439\u0442\u0438 \u0447\u0442\u043E-\u043D\u0438\u0431\u0443\u0434\u044C"
    },
    tableOfContents: {
      title: "\u041E\u0433\u043B\u0430\u0432\u043B\u0435\u043D\u0438\u0435"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => `\u0432\u0440\u0435\u043C\u044F \u0447\u0442\u0435\u043D\u0438\u044F ~${minutes} \u043C\u0438\u043D.`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "\u041D\u0435\u0434\u0430\u0432\u043D\u0438\u0435 \u0437\u0430\u043C\u0435\u0442\u043A\u0438",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => `\u041F\u043E\u0441\u043B\u0435\u0434\u043D${getForm(count, "\u044F\u044F", "\u0438\u0435", "\u0438\u0435")} ${count} \u0437\u0430\u043C\u0435\u0442${getForm(count, "\u043A\u0430", "\u043A\u0438", "\u043E\u043A")}`, "lastFewNotes")
    },
    error: {
      title: "\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430",
      notFound: "\u042D\u0442\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u043F\u0440\u0438\u0432\u0430\u0442\u043D\u0430\u044F \u0438\u043B\u0438 \u043D\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442",
      home: "\u0412\u0435\u0440\u043D\u0443\u0442\u044C\u0441\u044F \u043D\u0430 \u0433\u043B\u0430\u0432\u043D\u0443\u044E \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443"
    },
    folderContent: {
      folder: "\u041F\u0430\u043F\u043A\u0430",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => `\u0432 \u044D\u0442\u043E\u0439 \u043F\u0430\u043F\u043A\u0435 ${count} \u044D\u043B\u0435\u043C\u0435\u043D\u0442${getForm(count, "", "\u0430", "\u043E\u0432")}`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "\u0422\u0435\u0433",
      tagIndex: "\u0418\u043D\u0434\u0435\u043A\u0441 \u0442\u0435\u0433\u043E\u0432",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => `\u0441 \u044D\u0442\u0438\u043C \u0442\u0435\u0433\u043E\u043C ${count} \u044D\u043B\u0435\u043C\u0435\u043D\u0442${getForm(count, "", "\u0430", "\u043E\u0432")}`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => `\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430${getForm(count, "\u0435\u0442\u0441\u044F", "\u044E\u0442\u0441\u044F", "\u044E\u0442\u0441\u044F")} ${count} \u0442\u0435\u0433${getForm(count, "", "\u0430", "\u043E\u0432")}`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => `\u0412\u0441\u0435\u0433\u043E ${count} \u0442\u0435\u0433${getForm(count, "", "\u0430", "\u043E\u0432")}`, "totalTags")
    }
  }
};
function getForm(number, form1, form2, form5) {
  const remainder100 = number % 100;
  const remainder10 = remainder100 % 10;
  if (remainder100 >= 10 && remainder100 <= 20) return form5;
  if (remainder10 > 1 && remainder10 < 5) return form2;
  if (remainder10 == 1) return form1;
  return form5;
}
__name(getForm, "getForm");

// quartz/i18n/locales/ko-KR.ts
var ko_KR_default = {
  propertyDefaults: {
    title: "\uC81C\uBAA9 \uC5C6\uC74C",
    description: "\uC124\uBA85 \uC5C6\uC74C"
  },
  components: {
    callout: {
      note: "\uB178\uD2B8",
      abstract: "\uAC1C\uC694",
      info: "\uC815\uBCF4",
      todo: "\uD560\uC77C",
      tip: "\uD301",
      success: "\uC131\uACF5",
      question: "\uC9C8\uBB38",
      warning: "\uC8FC\uC758",
      failure: "\uC2E4\uD328",
      danger: "\uC704\uD5D8",
      bug: "\uBC84\uADF8",
      example: "\uC608\uC2DC",
      quote: "\uC778\uC6A9"
    },
    backlinks: {
      title: "\uBC31\uB9C1\uD06C",
      noBacklinksFound: "\uBC31\uB9C1\uD06C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."
    },
    themeToggle: {
      lightMode: "\uB77C\uC774\uD2B8 \uBAA8\uB4DC",
      darkMode: "\uB2E4\uD06C \uBAA8\uB4DC"
    },
    readerMode: {
      title: "\uB9AC\uB354 \uBAA8\uB4DC"
    },
    explorer: {
      title: "\uD0D0\uC0C9\uAE30"
    },
    footer: {
      createdWith: "Created with"
    },
    graph: {
      title: "\uADF8\uB798\uD504 \uBDF0"
    },
    recentNotes: {
      title: "\uCD5C\uADFC \uAC8C\uC2DC\uAE00",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `${remaining}\uAC74 \uB354\uBCF4\uAE30 \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `${targetSlug}\uC758 \uD3EC\uD568`, "transcludeOf"),
      linkToOriginal: "\uC6D0\uBCF8 \uB9C1\uD06C"
    },
    search: {
      title: "\uAC80\uC0C9",
      searchBarPlaceholder: "\uAC80\uC0C9\uC5B4\uB97C \uC785\uB825\uD558\uC138\uC694"
    },
    tableOfContents: {
      title: "\uBAA9\uCC28"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => `${minutes} min read`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "\uCD5C\uADFC \uAC8C\uC2DC\uAE00",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => `\uCD5C\uADFC ${count} \uAC74`, "lastFewNotes")
    },
    error: {
      title: "Not Found",
      notFound: "\uD398\uC774\uC9C0\uAC00 \uC874\uC7AC\uD558\uC9C0 \uC54A\uAC70\uB098 \uBE44\uACF5\uAC1C \uC124\uC815\uC774 \uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.",
      home: "\uD648\uD398\uC774\uC9C0\uB85C \uB3CC\uC544\uAC00\uAE30"
    },
    folderContent: {
      folder: "\uD3F4\uB354",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => `${count}\uAC74\uC758 \uD56D\uBAA9`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "\uD0DC\uADF8",
      tagIndex: "\uD0DC\uADF8 \uBAA9\uB85D",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => `${count}\uAC74\uC758 \uD56D\uBAA9`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => `\uCC98\uC74C ${count}\uAC1C\uC758 \uD0DC\uADF8`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => `\uCD1D ${count}\uAC1C\uC758 \uD0DC\uADF8\uB97C \uCC3E\uC558\uC2B5\uB2C8\uB2E4.`, "totalTags")
    }
  }
};

// quartz/i18n/locales/zh-CN.ts
var zh_CN_default = {
  propertyDefaults: {
    title: "\u65E0\u9898",
    description: "\u65E0\u63CF\u8FF0"
  },
  components: {
    callout: {
      note: "\u7B14\u8BB0",
      abstract: "\u6458\u8981",
      info: "\u63D0\u793A",
      todo: "\u5F85\u529E",
      tip: "\u63D0\u793A",
      success: "\u6210\u529F",
      question: "\u95EE\u9898",
      warning: "\u8B66\u544A",
      failure: "\u5931\u8D25",
      danger: "\u5371\u9669",
      bug: "\u9519\u8BEF",
      example: "\u793A\u4F8B",
      quote: "\u5F15\u7528"
    },
    backlinks: {
      title: "\u53CD\u5411\u94FE\u63A5",
      noBacklinksFound: "\u65E0\u6CD5\u627E\u5230\u53CD\u5411\u94FE\u63A5"
    },
    themeToggle: {
      lightMode: "\u4EAE\u8272\u6A21\u5F0F",
      darkMode: "\u6697\u8272\u6A21\u5F0F"
    },
    readerMode: {
      title: "\u9605\u8BFB\u6A21\u5F0F"
    },
    explorer: {
      title: "\u63A2\u7D22"
    },
    footer: {
      createdWith: "Created with"
    },
    graph: {
      title: "\u5173\u7CFB\u56FE\u8C31"
    },
    recentNotes: {
      title: "\u6700\u8FD1\u7684\u7B14\u8BB0",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `\u67E5\u770B\u66F4\u591A${remaining}\u7BC7\u7B14\u8BB0 \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `\u5305\u542B${targetSlug}`, "transcludeOf"),
      linkToOriginal: "\u6307\u5411\u539F\u59CB\u7B14\u8BB0\u7684\u94FE\u63A5"
    },
    search: {
      title: "\u641C\u7D22",
      searchBarPlaceholder: "\u641C\u7D22\u4E9B\u4EC0\u4E48"
    },
    tableOfContents: {
      title: "\u76EE\u5F55"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => `${minutes}\u5206\u949F\u9605\u8BFB`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "\u6700\u8FD1\u7684\u7B14\u8BB0",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => `\u6700\u8FD1\u7684${count}\u6761\u7B14\u8BB0`, "lastFewNotes")
    },
    error: {
      title: "\u65E0\u6CD5\u627E\u5230",
      notFound: "\u79C1\u6709\u7B14\u8BB0\u6216\u7B14\u8BB0\u4E0D\u5B58\u5728\u3002",
      home: "\u8FD4\u56DE\u9996\u9875"
    },
    folderContent: {
      folder: "\u6587\u4EF6\u5939",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => `\u6B64\u6587\u4EF6\u5939\u4E0B\u6709${count}\u6761\u7B14\u8BB0\u3002`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "\u6807\u7B7E",
      tagIndex: "\u6807\u7B7E\u7D22\u5F15",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => `\u6B64\u6807\u7B7E\u4E0B\u6709${count}\u6761\u7B14\u8BB0\u3002`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => `\u663E\u793A\u524D${count}\u4E2A\u6807\u7B7E\u3002`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => `\u603B\u5171\u6709${count}\u4E2A\u6807\u7B7E\u3002`, "totalTags")
    }
  }
};

// quartz/i18n/locales/zh-TW.ts
var zh_TW_default = {
  propertyDefaults: {
    title: "\u7121\u984C",
    description: "\u7121\u63CF\u8FF0"
  },
  components: {
    callout: {
      note: "\u7B46\u8A18",
      abstract: "\u6458\u8981",
      info: "\u63D0\u793A",
      todo: "\u5F85\u8FA6",
      tip: "\u63D0\u793A",
      success: "\u6210\u529F",
      question: "\u554F\u984C",
      warning: "\u8B66\u544A",
      failure: "\u5931\u6557",
      danger: "\u5371\u96AA",
      bug: "\u932F\u8AA4",
      example: "\u7BC4\u4F8B",
      quote: "\u5F15\u7528"
    },
    backlinks: {
      title: "\u53CD\u5411\u9023\u7D50",
      noBacklinksFound: "\u7121\u6CD5\u627E\u5230\u53CD\u5411\u9023\u7D50"
    },
    themeToggle: {
      lightMode: "\u4EAE\u8272\u6A21\u5F0F",
      darkMode: "\u6697\u8272\u6A21\u5F0F"
    },
    readerMode: {
      title: "\u95B1\u8B80\u6A21\u5F0F"
    },
    explorer: {
      title: "\u63A2\u7D22"
    },
    footer: {
      createdWith: "Created with"
    },
    graph: {
      title: "\u95DC\u4FC2\u5716\u8B5C"
    },
    recentNotes: {
      title: "\u6700\u8FD1\u7684\u7B46\u8A18",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `\u67E5\u770B\u66F4\u591A ${remaining} \u7BC7\u7B46\u8A18 \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `\u5305\u542B ${targetSlug}`, "transcludeOf"),
      linkToOriginal: "\u6307\u5411\u539F\u59CB\u7B46\u8A18\u7684\u9023\u7D50"
    },
    search: {
      title: "\u641C\u5C0B",
      searchBarPlaceholder: "\u641C\u5C0B\u4E9B\u4EC0\u9EBC"
    },
    tableOfContents: {
      title: "\u76EE\u9304"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => `\u95B1\u8B80\u6642\u9593\u7D04 ${minutes} \u5206\u9418`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "\u6700\u8FD1\u7684\u7B46\u8A18",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => `\u6700\u8FD1\u7684 ${count} \u689D\u7B46\u8A18`, "lastFewNotes")
    },
    error: {
      title: "\u7121\u6CD5\u627E\u5230",
      notFound: "\u79C1\u4EBA\u7B46\u8A18\u6216\u7B46\u8A18\u4E0D\u5B58\u5728\u3002",
      home: "\u8FD4\u56DE\u9996\u9801"
    },
    folderContent: {
      folder: "\u8CC7\u6599\u593E",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => `\u6B64\u8CC7\u6599\u593E\u4E0B\u6709 ${count} \u689D\u7B46\u8A18\u3002`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "\u6A19\u7C64",
      tagIndex: "\u6A19\u7C64\u7D22\u5F15",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => `\u6B64\u6A19\u7C64\u4E0B\u6709 ${count} \u689D\u7B46\u8A18\u3002`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => `\u986F\u793A\u524D ${count} \u500B\u6A19\u7C64\u3002`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => `\u7E3D\u5171\u6709 ${count} \u500B\u6A19\u7C64\u3002`, "totalTags")
    }
  }
};

// quartz/i18n/locales/vi-VN.ts
var vi_VN_default = {
  propertyDefaults: {
    title: "Kh\xF4ng c\xF3 ti\xEAu \u0111\u1EC1",
    description: "Kh\xF4ng c\xF3 m\xF4 t\u1EA3"
  },
  components: {
    callout: {
      note: "Ghi ch\xFA",
      abstract: "T\u1ED5ng quan",
      info: "Th\xF4ng tin",
      todo: "C\u1EA7n ph\u1EA3i l\xE0m",
      tip: "G\u1EE3i \xFD",
      success: "Th\xE0nh c\xF4ng",
      question: "C\xE2u h\u1ECFi",
      warning: "C\u1EA3nh b\xE1o",
      failure: "Th\u1EA5t b\u1EA1i",
      danger: "Nguy hi\u1EC3m",
      bug: "L\u1ED7i",
      example: "V\xED d\u1EE5",
      quote: "Tr\xEDch d\u1EABn"
    },
    backlinks: {
      title: "Li\xEAn k\u1EBFt ng\u01B0\u1EE3c",
      noBacklinksFound: "Kh\xF4ng c\xF3 li\xEAn k\u1EBFt ng\u01B0\u1EE3c n\xE0o"
    },
    themeToggle: {
      lightMode: "Ch\u1EBF \u0111\u1ED9 s\xE1ng",
      darkMode: "Ch\u1EBF \u0111\u1ED9 t\u1ED1i"
    },
    readerMode: {
      title: "Ch\u1EBF \u0111\u1ED9 \u0111\u1ECDc"
    },
    explorer: {
      title: "N\u1ED9i dung"
    },
    footer: {
      createdWith: "\u0110\u01B0\u1EE3c t\u1EA1o b\u1EB1ng"
    },
    graph: {
      title: "S\u01A1 \u0111\u1ED3"
    },
    recentNotes: {
      title: "Ghi ch\xFA g\u1EA7n \u0111\xE2y",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `Xem th\xEAm ${remaining} ghi ch\xFA \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `Tr\xEDch d\u1EABn to\xE0n b\u1ED9 t\u1EEB ${targetSlug}`, "transcludeOf"),
      linkToOriginal: "Xem trang g\u1ED1c"
    },
    search: {
      title: "T\xECm",
      searchBarPlaceholder: "T\xECm ki\u1EBFm th\xF4ng tin"
    },
    tableOfContents: {
      title: "M\u1EE5c l\u1EE5c"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => `${minutes} ph\xFAt \u0111\u1ECDc`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "Ghi ch\xFA g\u1EA7n \u0111\xE2y",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => `${count} Trang g\u1EA7n \u0111\xE2y`, "lastFewNotes")
    },
    error: {
      title: "Kh\xF4ng t\xECm th\u1EA5y",
      notFound: "Trang n\xE0y ri\xEAng t\u01B0 ho\u1EB7c kh\xF4ng t\u1ED3n t\u1EA1i.",
      home: "V\u1EC1 trang ch\u1EE7"
    },
    folderContent: {
      folder: "Th\u01B0 m\u1EE5c",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => `C\xF3 ${count} trang trong th\u01B0 m\u1EE5c n\xE0y.`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "Th\u1EBB",
      tagIndex: "Danh s\xE1ch th\u1EBB",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => `C\xF3 ${count} trang g\u1EAFn th\u1EBB n\xE0y.`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => `\u0110ang hi\u1EC3n th\u1ECB ${count} trang \u0111\u1EA7u ti\xEAn.`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => `C\xF3 t\u1ED5ng c\u1ED9ng ${count} th\u1EBB.`, "totalTags")
    }
  }
};

// quartz/i18n/locales/pt-BR.ts
var pt_BR_default = {
  propertyDefaults: {
    title: "Sem t\xEDtulo",
    description: "Sem descri\xE7\xE3o"
  },
  components: {
    callout: {
      note: "Nota",
      abstract: "Abstrato",
      info: "Info",
      todo: "Pend\xEAncia",
      tip: "Dica",
      success: "Sucesso",
      question: "Pergunta",
      warning: "Aviso",
      failure: "Falha",
      danger: "Perigo",
      bug: "Bug",
      example: "Exemplo",
      quote: "Cita\xE7\xE3o"
    },
    backlinks: {
      title: "Backlinks",
      noBacklinksFound: "Sem backlinks encontrados"
    },
    themeToggle: {
      lightMode: "Tema claro",
      darkMode: "Tema escuro"
    },
    readerMode: {
      title: "Modo leitor"
    },
    explorer: {
      title: "Explorador"
    },
    footer: {
      createdWith: "Criado com"
    },
    graph: {
      title: "Vis\xE3o de gr\xE1fico"
    },
    recentNotes: {
      title: "Notas recentes",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `Veja mais ${remaining} \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `Transcrever de ${targetSlug}`, "transcludeOf"),
      linkToOriginal: "Link ao original"
    },
    search: {
      title: "Pesquisar",
      searchBarPlaceholder: "Pesquisar por algo"
    },
    tableOfContents: {
      title: "Sum\xE1rio"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => `Leitura de ${minutes} min`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "Notas recentes",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => `\xDAltimas ${count} notas`, "lastFewNotes")
    },
    error: {
      title: "N\xE3o encontrado",
      notFound: "Esta p\xE1gina \xE9 privada ou n\xE3o existe.",
      home: "Retornar a p\xE1gina inicial"
    },
    folderContent: {
      folder: "Arquivo",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 item neste arquivo." : `${count} items neste arquivo.`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "Tag",
      tagIndex: "Sum\xE1rio de Tags",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 item com esta tag." : `${count} items com esta tag.`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => `Mostrando as ${count} primeiras tags.`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => `Encontradas ${count} tags.`, "totalTags")
    }
  }
};

// quartz/i18n/locales/hu-HU.ts
var hu_HU_default = {
  propertyDefaults: {
    title: "N\xE9vtelen",
    description: "Nincs le\xEDr\xE1s"
  },
  components: {
    callout: {
      note: "Jegyzet",
      abstract: "Abstract",
      info: "Inform\xE1ci\xF3",
      todo: "Tennival\xF3",
      tip: "Tipp",
      success: "Siker",
      question: "K\xE9rd\xE9s",
      warning: "Figyelmeztet\xE9s",
      failure: "Hiba",
      danger: "Vesz\xE9ly",
      bug: "Bug",
      example: "P\xE9lda",
      quote: "Id\xE9zet"
    },
    backlinks: {
      title: "Visszautal\xE1sok",
      noBacklinksFound: "Nincs visszautal\xE1s"
    },
    themeToggle: {
      lightMode: "Vil\xE1gos m\xF3d",
      darkMode: "S\xF6t\xE9t m\xF3d"
    },
    readerMode: {
      title: "Olvas\xF3 m\xF3d"
    },
    explorer: {
      title: "F\xE1jlb\xF6ng\xE9sz\u0151"
    },
    footer: {
      createdWith: "K\xE9sz\xEDtve ezzel:"
    },
    graph: {
      title: "Grafikonn\xE9zet"
    },
    recentNotes: {
      title: "Legut\xF3bbi jegyzetek",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `${remaining} tov\xE1bbi megtekint\xE9se \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `${targetSlug} \xE1thivatkoz\xE1sa`, "transcludeOf"),
      linkToOriginal: "Hivatkoz\xE1s az eredetire"
    },
    search: {
      title: "Keres\xE9s",
      searchBarPlaceholder: "Keress valamire"
    },
    tableOfContents: {
      title: "Tartalomjegyz\xE9k"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => `${minutes} perces olvas\xE1s`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "Legut\xF3bbi jegyzetek",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => `Legut\xF3bbi ${count} jegyzet`, "lastFewNotes")
    },
    error: {
      title: "Nem tal\xE1lhat\xF3",
      notFound: "Ez a lap vagy priv\xE1t vagy nem l\xE9tezik.",
      home: "Vissza a kezd\u0151lapra"
    },
    folderContent: {
      folder: "Mappa",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => `Ebben a mapp\xE1ban ${count} elem tal\xE1lhat\xF3.`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "C\xEDmke",
      tagIndex: "C\xEDmke index",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => `${count} elem tal\xE1lhat\xF3 ezzel a c\xEDmk\xE9vel.`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => `Els\u0151 ${count} c\xEDmke megjelen\xEDtve.`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => `\xD6sszesen ${count} c\xEDmke tal\xE1lhat\xF3.`, "totalTags")
    }
  }
};

// quartz/i18n/locales/fa-IR.ts
var fa_IR_default = {
  propertyDefaults: {
    title: "\u0628\u062F\u0648\u0646 \u0639\u0646\u0648\u0627\u0646",
    description: "\u062A\u0648\u0636\u06CC\u062D \u062E\u0627\u0635\u06CC \u0627\u0636\u0627\u0641\u0647 \u0646\u0634\u062F\u0647 \u0627\u0633\u062A"
  },
  direction: "rtl",
  components: {
    callout: {
      note: "\u06CC\u0627\u062F\u062F\u0627\u0634\u062A",
      abstract: "\u0686\u06A9\u06CC\u062F\u0647",
      info: "\u0627\u0637\u0644\u0627\u0639\u0627\u062A",
      todo: "\u0627\u0642\u062F\u0627\u0645",
      tip: "\u0646\u06A9\u062A\u0647",
      success: "\u062A\u06CC\u06A9",
      question: "\u0633\u0624\u0627\u0644",
      warning: "\u0647\u0634\u062F\u0627\u0631",
      failure: "\u0634\u06A9\u0633\u062A",
      danger: "\u062E\u0637\u0631",
      bug: "\u0628\u0627\u06AF",
      example: "\u0645\u062B\u0627\u0644",
      quote: "\u0646\u0642\u0644 \u0642\u0648\u0644"
    },
    backlinks: {
      title: "\u0628\u06A9\u200C\u0644\u06CC\u0646\u06A9\u200C\u0647\u0627",
      noBacklinksFound: "\u0628\u062F\u0648\u0646 \u0628\u06A9\u200C\u0644\u06CC\u0646\u06A9"
    },
    themeToggle: {
      lightMode: "\u062D\u0627\u0644\u062A \u0631\u0648\u0634\u0646",
      darkMode: "\u062D\u0627\u0644\u062A \u062A\u0627\u0631\u06CC\u06A9"
    },
    readerMode: {
      title: "\u062D\u0627\u0644\u062A \u062E\u0648\u0627\u0646\u062F\u0646"
    },
    explorer: {
      title: "\u0645\u0637\u0627\u0644\u0628"
    },
    footer: {
      createdWith: "\u0633\u0627\u062E\u062A\u0647 \u0634\u062F\u0647 \u0628\u0627"
    },
    graph: {
      title: "\u0646\u0645\u0627\u06CC \u06AF\u0631\u0627\u0641"
    },
    recentNotes: {
      title: "\u06CC\u0627\u062F\u062F\u0627\u0634\u062A\u200C\u0647\u0627\u06CC \u0627\u062E\u06CC\u0631",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `${remaining} \u06CC\u0627\u062F\u062F\u0627\u0634\u062A \u062F\u06CC\u06AF\u0631 \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `\u0627\u0632 ${targetSlug}`, "transcludeOf"),
      linkToOriginal: "\u067E\u06CC\u0648\u0646\u062F \u0628\u0647 \u0627\u0635\u0644\u06CC"
    },
    search: {
      title: "\u062C\u0633\u062A\u062C\u0648",
      searchBarPlaceholder: "\u0645\u0637\u0644\u0628\u06CC \u0631\u0627 \u062C\u0633\u062A\u062C\u0648 \u06A9\u0646\u06CC\u062F"
    },
    tableOfContents: {
      title: "\u0641\u0647\u0631\u0633\u062A"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => `\u0632\u0645\u0627\u0646 \u062A\u0642\u0631\u06CC\u0628\u06CC \u0645\u0637\u0627\u0644\u0639\u0647: ${minutes} \u062F\u0642\u06CC\u0642\u0647`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "\u06CC\u0627\u062F\u062F\u0627\u0634\u062A\u200C\u0647\u0627\u06CC \u0627\u062E\u06CC\u0631",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => `${count} \u06CC\u0627\u062F\u062F\u0627\u0634\u062A \u0627\u062E\u06CC\u0631`, "lastFewNotes")
    },
    error: {
      title: "\u06CC\u0627\u0641\u062A \u0646\u0634\u062F",
      notFound: "\u0627\u06CC\u0646 \u0635\u0641\u062D\u0647 \u06CC\u0627 \u062E\u0635\u0648\u0635\u06CC \u0627\u0633\u062A \u06CC\u0627 \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F",
      home: "\u0628\u0627\u0632\u06AF\u0634\u062A \u0628\u0647 \u0635\u0641\u062D\u0647 \u0627\u0635\u0644\u06CC"
    },
    folderContent: {
      folder: "\u067E\u0648\u0634\u0647",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => count === 1 ? ".\u06CC\u06A9 \u0645\u0637\u0644\u0628 \u062F\u0631 \u0627\u06CC\u0646 \u067E\u0648\u0634\u0647 \u0627\u0633\u062A" : `${count} \u0645\u0637\u0644\u0628 \u062F\u0631 \u0627\u06CC\u0646 \u067E\u0648\u0634\u0647 \u0627\u0633\u062A.`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "\u0628\u0631\u0686\u0633\u0628",
      tagIndex: "\u0641\u0647\u0631\u0633\u062A \u0628\u0631\u0686\u0633\u0628\u200C\u0647\u0627",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => count === 1 ? "\u06CC\u06A9 \u0645\u0637\u0644\u0628 \u0628\u0627 \u0627\u06CC\u0646 \u0628\u0631\u0686\u0633\u0628" : `${count} \u0645\u0637\u0644\u0628 \u0628\u0627 \u0627\u06CC\u0646 \u0628\u0631\u0686\u0633\u0628.`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => `\u062F\u0631 \u062D\u0627\u0644 \u0646\u0645\u0627\u06CC\u0634 ${count} \u0628\u0631\u0686\u0633\u0628.`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => `${count} \u0628\u0631\u0686\u0633\u0628 \u06CC\u0627\u0641\u062A \u0634\u062F.`, "totalTags")
    }
  }
};

// quartz/i18n/locales/pl-PL.ts
var pl_PL_default = {
  propertyDefaults: {
    title: "Bez nazwy",
    description: "Brak opisu"
  },
  components: {
    callout: {
      note: "Notatka",
      abstract: "Streszczenie",
      info: "informacja",
      todo: "Do zrobienia",
      tip: "Wskaz\xF3wka",
      success: "Zrobione",
      question: "Pytanie",
      warning: "Ostrze\u017Cenie",
      failure: "Usterka",
      danger: "Niebiezpiecze\u0144stwo",
      bug: "B\u0142\u0105d w kodzie",
      example: "Przyk\u0142ad",
      quote: "Cytat"
    },
    backlinks: {
      title: "Odno\u015Bniki zwrotne",
      noBacklinksFound: "Brak po\u0142\u0105cze\u0144 zwrotnych"
    },
    themeToggle: {
      lightMode: "Trzyb jasny",
      darkMode: "Tryb ciemny"
    },
    readerMode: {
      title: "Tryb czytania"
    },
    explorer: {
      title: "Przegl\u0105daj"
    },
    footer: {
      createdWith: "Stworzone z u\u017Cyciem"
    },
    graph: {
      title: "Graf"
    },
    recentNotes: {
      title: "Najnowsze notatki",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `Zobacz ${remaining} nastepnych \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `Osadzone ${targetSlug}`, "transcludeOf"),
      linkToOriginal: "\u0141\u0105cze do orygina\u0142u"
    },
    search: {
      title: "Szukaj",
      searchBarPlaceholder: "Wpisz fraz\u0119 wyszukiwania"
    },
    tableOfContents: {
      title: "Spis tre\u015Bci"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => `${minutes} min. czytania `, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "Najnowsze notatki",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => `Ostatnie ${count} notatek`, "lastFewNotes")
    },
    error: {
      title: "Nie znaleziono",
      notFound: "Ta strona jest prywatna lub nie istnieje.",
      home: "Powr\xF3t do strony g\u0142\xF3wnej"
    },
    folderContent: {
      folder: "Folder",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => count === 1 ? "W tym folderze jest 1 element." : `Element\xF3w w folderze: ${count}.`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "Znacznik",
      tagIndex: "Spis znacznik\xF3w",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => count === 1 ? "Oznaczony 1 element." : `Element\xF3w z tym znacznikiem: ${count}.`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => `Pokazuje ${count} pierwszych znacznik\xF3w.`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => `Znalezionych wszystkich znacznik\xF3w: ${count}.`, "totalTags")
    }
  }
};

// quartz/i18n/locales/cs-CZ.ts
var cs_CZ_default = {
  propertyDefaults: {
    title: "Bez n\xE1zvu",
    description: "Nebyl uveden \u017E\xE1dn\xFD popis"
  },
  components: {
    callout: {
      note: "Pozn\xE1mka",
      abstract: "Abstract",
      info: "Info",
      todo: "Todo",
      tip: "Tip",
      success: "\xDAsp\u011Bch",
      question: "Ot\xE1zka",
      warning: "Upozorn\u011Bn\xED",
      failure: "Chyba",
      danger: "Nebezpe\u010D\xED",
      bug: "Bug",
      example: "P\u0159\xEDklad",
      quote: "Citace"
    },
    backlinks: {
      title: "P\u0159\xEDchoz\xED odkazy",
      noBacklinksFound: "Nenalezeny \u017E\xE1dn\xE9 p\u0159\xEDchoz\xED odkazy"
    },
    themeToggle: {
      lightMode: "Sv\u011Btl\xFD re\u017Eim",
      darkMode: "Tmav\xFD re\u017Eim"
    },
    readerMode: {
      title: "Re\u017Eim \u010Dte\u010Dky"
    },
    explorer: {
      title: "Proch\xE1zet"
    },
    footer: {
      createdWith: "Vytvo\u0159eno pomoc\xED"
    },
    graph: {
      title: "Graf"
    },
    recentNotes: {
      title: "Nejnov\u011Bj\u0161\xED pozn\xE1mky",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `Zobraz ${remaining} dal\u0161\xEDch \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `Zobrazen\xED ${targetSlug}`, "transcludeOf"),
      linkToOriginal: "Odkaz na p\u016Fvodn\xED dokument"
    },
    search: {
      title: "Hledat",
      searchBarPlaceholder: "Hledejte n\u011Bco"
    },
    tableOfContents: {
      title: "Obsah"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => `${minutes} min \u010Dten\xED`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "Nejnov\u011Bj\u0161\xED pozn\xE1mky",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => `Posledn\xEDch ${count} pozn\xE1mek`, "lastFewNotes")
    },
    error: {
      title: "Nenalezeno",
      notFound: "Tato str\xE1nka je bu\u010F soukrom\xE1, nebo neexistuje.",
      home: "N\xE1vrat na domovskou str\xE1nku"
    },
    folderContent: {
      folder: "Slo\u017Eka",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 polo\u017Eka v t\xE9to slo\u017Ece." : `${count} polo\u017Eek v t\xE9to slo\u017Ece.`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "Tag",
      tagIndex: "Rejst\u0159\xEDk tag\u016F",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 polo\u017Eka s t\xEDmto tagem." : `${count} polo\u017Eek s t\xEDmto tagem.`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => `Zobrazuj\xED se prvn\xED ${count} tagy.`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => `Nalezeno celkem ${count} tag\u016F.`, "totalTags")
    }
  }
};

// quartz/i18n/locales/tr-TR.ts
var tr_TR_default = {
  propertyDefaults: {
    title: "\u0130simsiz",
    description: "Herhangi bir a\xE7\u0131klama eklenmedi"
  },
  components: {
    callout: {
      note: "Not",
      abstract: "\xD6zet",
      info: "Bilgi",
      todo: "Yap\u0131lacaklar",
      tip: "\u0130pucu",
      success: "Ba\u015Far\u0131l\u0131",
      question: "Soru",
      warning: "Uyar\u0131",
      failure: "Ba\u015Far\u0131s\u0131z",
      danger: "Tehlike",
      bug: "Hata",
      example: "\xD6rnek",
      quote: "Al\u0131nt\u0131"
    },
    backlinks: {
      title: "Backlinkler",
      noBacklinksFound: "Backlink bulunamad\u0131"
    },
    themeToggle: {
      lightMode: "A\xE7\u0131k mod",
      darkMode: "Koyu mod"
    },
    readerMode: {
      title: "Okuma modu"
    },
    explorer: {
      title: "Gezgin"
    },
    footer: {
      createdWith: "\u015Eununla olu\u015Fturuldu"
    },
    graph: {
      title: "Grafik G\xF6r\xFCn\xFCm\xFC"
    },
    recentNotes: {
      title: "Son Notlar",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `${remaining} tane daha g\xF6r \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `${targetSlug} sayfas\u0131ndan al\u0131nt\u0131`, "transcludeOf"),
      linkToOriginal: "Orijinal ba\u011Flant\u0131"
    },
    search: {
      title: "Arama",
      searchBarPlaceholder: "Bir \u015Fey aray\u0131n"
    },
    tableOfContents: {
      title: "\u0130\xE7indekiler"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => `${minutes} dakika okuma s\xFCresi`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "Son notlar",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => `Son ${count} not`, "lastFewNotes")
    },
    error: {
      title: "Bulunamad\u0131",
      notFound: "Bu sayfa ya \xF6zel ya da mevcut de\u011Fil.",
      home: "Anasayfaya geri d\xF6n"
    },
    folderContent: {
      folder: "Klas\xF6r",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => count === 1 ? "Bu klas\xF6r alt\u0131nda 1 \xF6\u011Fe." : `Bu klas\xF6r alt\u0131ndaki ${count} \xF6\u011Fe.`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "Etiket",
      tagIndex: "Etiket S\u0131ras\u0131",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => count === 1 ? "Bu etikete sahip 1 \xF6\u011Fe." : `Bu etiket alt\u0131ndaki ${count} \xF6\u011Fe.`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => `\u0130lk ${count} etiket g\xF6steriliyor.`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => `Toplam ${count} adet etiket bulundu.`, "totalTags")
    }
  }
};

// quartz/i18n/locales/th-TH.ts
var th_TH_default = {
  propertyDefaults: {
    title: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E0A\u0E37\u0E48\u0E2D",
    description: "\u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E23\u0E30\u0E1A\u0E38\u0E04\u0E33\u0E2D\u0E18\u0E34\u0E1A\u0E32\u0E22\u0E22\u0E48\u0E2D"
  },
  components: {
    callout: {
      note: "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E2B\u0E15\u0E38",
      abstract: "\u0E1A\u0E17\u0E04\u0E31\u0E14\u0E22\u0E48\u0E2D",
      info: "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25",
      todo: "\u0E15\u0E49\u0E2D\u0E07\u0E17\u0E33\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E40\u0E15\u0E34\u0E21",
      tip: "\u0E04\u0E33\u0E41\u0E19\u0E30\u0E19\u0E33",
      success: "\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22",
      question: "\u0E04\u0E33\u0E16\u0E32\u0E21",
      warning: "\u0E04\u0E33\u0E40\u0E15\u0E37\u0E2D\u0E19",
      failure: "\u0E02\u0E49\u0E2D\u0E1C\u0E34\u0E14\u0E1E\u0E25\u0E32\u0E14",
      danger: "\u0E2D\u0E31\u0E19\u0E15\u0E23\u0E32\u0E22",
      bug: "\u0E1A\u0E31\u0E4A\u0E01",
      example: "\u0E15\u0E31\u0E27\u0E2D\u0E22\u0E48\u0E32\u0E07",
      quote: "\u0E04\u0E33\u0E1E\u0E39\u0E01\u0E22\u0E01\u0E21\u0E32"
    },
    backlinks: {
      title: "\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E01\u0E25\u0E48\u0E32\u0E27\u0E16\u0E36\u0E07",
      noBacklinksFound: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2B\u0E19\u0E49\u0E32\u0E17\u0E35\u0E48\u0E42\u0E22\u0E07\u0E21\u0E32\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49"
    },
    themeToggle: {
      lightMode: "\u0E42\u0E2B\u0E21\u0E14\u0E2A\u0E27\u0E48\u0E32\u0E07",
      darkMode: "\u0E42\u0E2B\u0E21\u0E14\u0E21\u0E37\u0E14"
    },
    readerMode: {
      title: "\u0E42\u0E2B\u0E21\u0E14\u0E2D\u0E48\u0E32\u0E19"
    },
    explorer: {
      title: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E2B\u0E19\u0E49\u0E32"
    },
    footer: {
      createdWith: "\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E14\u0E49\u0E27\u0E22"
    },
    graph: {
      title: "\u0E21\u0E38\u0E21\u0E21\u0E2D\u0E07\u0E01\u0E23\u0E32\u0E1F"
    },
    recentNotes: {
      title: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `\u0E14\u0E39\u0E40\u0E1E\u0E34\u0E48\u0E21\u0E2D\u0E35\u0E01 ${remaining} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23 \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `\u0E23\u0E27\u0E21\u0E02\u0E49\u0E32\u0E21\u0E40\u0E19\u0E37\u0E49\u0E2D\u0E2B\u0E32\u0E08\u0E32\u0E01 ${targetSlug}`, "transcludeOf"),
      linkToOriginal: "\u0E14\u0E39\u0E2B\u0E19\u0E49\u0E32\u0E15\u0E49\u0E19\u0E17\u0E32\u0E07"
    },
    search: {
      title: "\u0E04\u0E49\u0E19\u0E2B\u0E32",
      searchBarPlaceholder: "\u0E04\u0E49\u0E19\u0E2B\u0E32\u0E1A\u0E32\u0E07\u0E2D\u0E22\u0E48\u0E32\u0E07"
    },
    tableOfContents: {
      title: "\u0E2A\u0E32\u0E23\u0E1A\u0E31\u0E0D"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => `\u0E2D\u0E48\u0E32\u0E19\u0E23\u0E32\u0E27 ${minutes} \u0E19\u0E32\u0E17\u0E35`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => `${count} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01\u0E25\u0E48\u0E32\u0E2A\u0E38\u0E14`, "lastFewNotes")
    },
    error: {
      title: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49",
      notFound: "\u0E2B\u0E19\u0E49\u0E32\u0E19\u0E35\u0E49\u0E2D\u0E32\u0E08\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32\u0E40\u0E1B\u0E47\u0E19\u0E2A\u0E48\u0E27\u0E19\u0E15\u0E31\u0E27\u0E2B\u0E23\u0E37\u0E2D\u0E22\u0E31\u0E07\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E2A\u0E23\u0E49\u0E32\u0E07",
      home: "\u0E01\u0E25\u0E31\u0E1A\u0E2B\u0E19\u0E49\u0E32\u0E2B\u0E25\u0E31\u0E01"
    },
    folderContent: {
      folder: "\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => `\u0E21\u0E35 ${count} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E19\u0E42\u0E1F\u0E25\u0E40\u0E14\u0E2D\u0E23\u0E4C\u0E19\u0E35\u0E49`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "\u0E41\u0E17\u0E47\u0E01",
      tagIndex: "\u0E41\u0E17\u0E47\u0E01\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => `\u0E21\u0E35 ${count} \u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E43\u0E19\u0E41\u0E17\u0E47\u0E01\u0E19\u0E35\u0E49`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => `\u0E41\u0E2A\u0E14\u0E07 ${count} \u0E41\u0E17\u0E47\u0E01\u0E41\u0E23\u0E01`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => `\u0E21\u0E35\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14 ${count} \u0E41\u0E17\u0E47\u0E01`, "totalTags")
    }
  }
};

// quartz/i18n/locales/lt-LT.ts
var lt_LT_default = {
  propertyDefaults: {
    title: "Be Pavadinimo",
    description: "Apra\u0161ymas Nepateiktas"
  },
  components: {
    callout: {
      note: "Pastaba",
      abstract: "Santrauka",
      info: "Informacija",
      todo: "Darb\u0173 s\u0105ra\u0161as",
      tip: "Patarimas",
      success: "S\u0117kmingas",
      question: "Klausimas",
      warning: "\u012Esp\u0117jimas",
      failure: "Nes\u0117kmingas",
      danger: "Pavojus",
      bug: "Klaida",
      example: "Pavyzdys",
      quote: "Citata"
    },
    backlinks: {
      title: "Atgalin\u0117s Nuorodos",
      noBacklinksFound: "Atgalini\u0173 Nuorod\u0173 Nerasta"
    },
    themeToggle: {
      lightMode: "\u0160viesus Re\u017Eimas",
      darkMode: "Tamsus Re\u017Eimas"
    },
    readerMode: {
      title: "Modalit\xE0 lettore"
    },
    explorer: {
      title: "Nar\u0161ykl\u0117"
    },
    footer: {
      createdWith: "Sukurta Su"
    },
    graph: {
      title: "Grafiko Vaizdas"
    },
    recentNotes: {
      title: "Naujausi U\u017Era\u0161ai",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `Per\u017Ei\u016Br\u0117ti dar ${remaining} \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `\u012Eterpimas i\u0161 ${targetSlug}`, "transcludeOf"),
      linkToOriginal: "Nuoroda \u012F original\u0105"
    },
    search: {
      title: "Paie\u0161ka",
      searchBarPlaceholder: "Ie\u0161koti"
    },
    tableOfContents: {
      title: "Turinys"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => `${minutes} min skaitymo`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "Naujausi u\u017Era\u0161ai",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => count === 1 ? "Paskutinis 1 u\u017Era\u0161as" : count < 10 ? `Paskutiniai ${count} u\u017Era\u0161ai` : `Paskutiniai ${count} u\u017Era\u0161\u0173`, "lastFewNotes")
    },
    error: {
      title: "Nerasta",
      notFound: "Arba \u0161is puslapis yra pasiekiamas tik tam tikriems vartotojams, arba tokio puslapio n\u0117ra.",
      home: "Gr\u012F\u017Eti \u012F pagrindin\u012F puslap\u012F"
    },
    folderContent: {
      folder: "Aplankas",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 elementas \u0161iame aplanke." : count < 10 ? `${count} elementai \u0161iame aplanke.` : `${count} element\u0173 \u0161iame aplanke.`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "\u017Dyma",
      tagIndex: "\u017Dym\u0173 indeksas",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 elementas su \u0161ia \u017Eyma." : count < 10 ? `${count} elementai su \u0161ia \u017Eyma.` : `${count} element\u0173 su \u0161ia \u017Eyma.`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => count < 10 ? `Rodomos pirmosios ${count} \u017Eymos.` : `Rodomos pirmosios ${count} \u017Eym\u0173.`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => count === 1 ? "Rasta i\u0161 viso 1 \u017Eyma." : count < 10 ? `Rasta i\u0161 viso ${count} \u017Eymos.` : `Rasta i\u0161 viso ${count} \u017Eym\u0173.`, "totalTags")
    }
  }
};

// quartz/i18n/locales/fi-FI.ts
var fi_FI_default = {
  propertyDefaults: {
    title: "Nimet\xF6n",
    description: "Ei kuvausta saatavilla"
  },
  components: {
    callout: {
      note: "Merkint\xE4",
      abstract: "Tiivistelm\xE4",
      info: "Info",
      todo: "Teht\xE4v\xE4lista",
      tip: "Vinkki",
      success: "Onnistuminen",
      question: "Kysymys",
      warning: "Varoitus",
      failure: "Ep\xE4onnistuminen",
      danger: "Vaara",
      bug: "Virhe",
      example: "Esimerkki",
      quote: "Lainaus"
    },
    backlinks: {
      title: "Takalinkit",
      noBacklinksFound: "Takalinkkej\xE4 ei l\xF6ytynyt"
    },
    themeToggle: {
      lightMode: "Vaalea tila",
      darkMode: "Tumma tila"
    },
    readerMode: {
      title: "Lukijatila"
    },
    explorer: {
      title: "Selain"
    },
    footer: {
      createdWith: "Luotu k\xE4ytt\xE4en"
    },
    graph: {
      title: "Verkkon\xE4kym\xE4"
    },
    recentNotes: {
      title: "Viimeisimm\xE4t muistiinpanot",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `N\xE4yt\xE4 ${remaining} lis\xE4\xE4 \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `Upote kohteesta ${targetSlug}`, "transcludeOf"),
      linkToOriginal: "Linkki alkuper\xE4iseen"
    },
    search: {
      title: "Haku",
      searchBarPlaceholder: "Hae jotain"
    },
    tableOfContents: {
      title: "Sis\xE4llysluettelo"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => `${minutes} min lukuaika`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "Viimeisimm\xE4t muistiinpanot",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => `Viimeiset ${count} muistiinpanoa`, "lastFewNotes")
    },
    error: {
      title: "Ei l\xF6ytynyt",
      notFound: "T\xE4m\xE4 sivu on joko yksityinen tai sit\xE4 ei ole olemassa.",
      home: "Palaa etusivulle"
    },
    folderContent: {
      folder: "Kansio",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 kohde t\xE4ss\xE4 kansiossa." : `${count} kohdetta t\xE4ss\xE4 kansiossa.`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "Tunniste",
      tagIndex: "Tunnisteluettelo",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 kohde t\xE4ll\xE4 tunnisteella." : `${count} kohdetta t\xE4ll\xE4 tunnisteella.`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => `N\xE4ytet\xE4\xE4n ensimm\xE4iset ${count} tunnistetta.`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => `L\xF6ytyi yhteens\xE4 ${count} tunnistetta.`, "totalTags")
    }
  }
};

// quartz/i18n/locales/nb-NO.ts
var nb_NO_default = {
  propertyDefaults: {
    title: "Uten navn",
    description: "Ingen beskrivelse angitt"
  },
  components: {
    callout: {
      note: "Notis",
      abstract: "Abstrakt",
      info: "Info",
      todo: "Husk p\xE5",
      tip: "Tips",
      success: "Suksess",
      question: "Sp\xF8rsm\xE5l",
      warning: "Advarsel",
      failure: "Feil",
      danger: "Farlig",
      bug: "Bug",
      example: "Eksempel",
      quote: "Sitat"
    },
    backlinks: {
      title: "Tilbakekoblinger",
      noBacklinksFound: "Ingen tilbakekoblinger funnet"
    },
    themeToggle: {
      lightMode: "Lys modus",
      darkMode: "M\xF8rk modus"
    },
    readerMode: {
      title: "L\xE6semodus"
    },
    explorer: {
      title: "Utforsker"
    },
    footer: {
      createdWith: "Laget med"
    },
    graph: {
      title: "Graf-visning"
    },
    recentNotes: {
      title: "Nylige notater",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `Se ${remaining} til \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `Transkludering of ${targetSlug}`, "transcludeOf"),
      linkToOriginal: "Lenke til original"
    },
    search: {
      title: "S\xF8k",
      searchBarPlaceholder: "S\xF8k etter noe"
    },
    tableOfContents: {
      title: "Oversikt"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => `${minutes} min lesning`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "Nylige notat",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => `Siste ${count} notat`, "lastFewNotes")
    },
    error: {
      title: "Ikke funnet",
      notFound: "Enten er denne siden privat eller s\xE5 finnes den ikke.",
      home: "Returner til hovedsiden"
    },
    folderContent: {
      folder: "Mappe",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 gjenstand i denne mappen." : `${count} gjenstander i denne mappen.`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "Tagg",
      tagIndex: "Tagg Indeks",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 gjenstand med denne taggen." : `${count} gjenstander med denne taggen.`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => `Viser f\xF8rste ${count} tagger.`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => `Fant totalt ${count} tagger.`, "totalTags")
    }
  }
};

// quartz/i18n/locales/id-ID.ts
var id_ID_default = {
  propertyDefaults: {
    title: "Tanpa Judul",
    description: "Tidak ada deskripsi"
  },
  components: {
    callout: {
      note: "Catatan",
      abstract: "Abstrak",
      info: "Info",
      todo: "Daftar Tugas",
      tip: "Tips",
      success: "Berhasil",
      question: "Pertanyaan",
      warning: "Peringatan",
      failure: "Gagal",
      danger: "Bahaya",
      bug: "Bug",
      example: "Contoh",
      quote: "Kutipan"
    },
    backlinks: {
      title: "Tautan Balik",
      noBacklinksFound: "Tidak ada tautan balik ditemukan"
    },
    themeToggle: {
      lightMode: "Mode Terang",
      darkMode: "Mode Gelap"
    },
    readerMode: {
      title: "Mode Pembaca"
    },
    explorer: {
      title: "Penjelajah"
    },
    footer: {
      createdWith: "Dibuat dengan"
    },
    graph: {
      title: "Tampilan Grafik"
    },
    recentNotes: {
      title: "Catatan Terbaru",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `Lihat ${remaining} lagi \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `Transklusi dari ${targetSlug}`, "transcludeOf"),
      linkToOriginal: "Tautan ke asli"
    },
    search: {
      title: "Cari",
      searchBarPlaceholder: "Cari sesuatu"
    },
    tableOfContents: {
      title: "Daftar Isi"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => `${minutes} menit baca`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "Catatan terbaru",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => `${count} catatan terakhir`, "lastFewNotes")
    },
    error: {
      title: "Tidak Ditemukan",
      notFound: "Halaman ini bersifat privat atau tidak ada.",
      home: "Kembali ke Beranda"
    },
    folderContent: {
      folder: "Folder",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 item di bawah folder ini." : `${count} item di bawah folder ini.`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "Tag",
      tagIndex: "Indeks Tag",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => count === 1 ? "1 item dengan tag ini." : `${count} item dengan tag ini.`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => `Menampilkan ${count} tag pertama.`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => `Ditemukan total ${count} tag.`, "totalTags")
    }
  }
};

// quartz/i18n/locales/kk-KZ.ts
var kk_KZ_default = {
  propertyDefaults: {
    title: "\u0410\u0442\u0430\u0443\u0441\u044B\u0437",
    description: "\u0421\u0438\u043F\u0430\u0442\u0442\u0430\u043C\u0430 \u0431\u0435\u0440\u0456\u043B\u043C\u0435\u0433\u0435\u043D"
  },
  components: {
    callout: {
      note: "\u0415\u0441\u043A\u0435\u0440\u0442\u0443",
      abstract: "\u0410\u043D\u043D\u043E\u0442\u0430\u0446\u0438\u044F",
      info: "\u0410\u049B\u043F\u0430\u0440\u0430\u0442",
      todo: "\u0406\u0441\u0442\u0435\u0443 \u043A\u0435\u0440\u0435\u043A",
      tip: "\u041A\u0435\u04A3\u0435\u0441",
      success: "\u0421\u04D9\u0442\u0442\u0456\u043B\u0456\u043A",
      question: "\u0421\u04B1\u0440\u0430\u049B",
      warning: "\u0415\u0441\u043A\u0435\u0440\u0442\u0443",
      failure: "\u049A\u0430\u0442\u0435",
      danger: "\u049A\u0430\u0443\u0456\u043F",
      bug: "\u049A\u0430\u0442\u0435",
      example: "\u041C\u044B\u0441\u0430\u043B",
      quote: "\u0414\u04D9\u0439\u0435\u043A\u0441\u04E9\u0437"
    },
    backlinks: {
      title: "\u0410\u0440\u0442\u049B\u0430 \u0441\u0456\u043B\u0442\u0435\u043C\u0435\u043B\u0435\u0440",
      noBacklinksFound: "\u0410\u0440\u0442\u049B\u0430 \u0441\u0456\u043B\u0442\u0435\u043C\u0435\u043B\u0435\u0440 \u0442\u0430\u0431\u044B\u043B\u043C\u0430\u0434\u044B"
    },
    themeToggle: {
      lightMode: "\u0416\u0430\u0440\u044B\u049B \u0440\u0435\u0436\u0438\u043C\u0456",
      darkMode: "\u049A\u0430\u0440\u0430\u04A3\u0493\u044B \u0440\u0435\u0436\u0438\u043C"
    },
    readerMode: {
      title: "\u041E\u049B\u0443 \u0440\u0435\u0436\u0438\u043C\u0456"
    },
    explorer: {
      title: "\u0417\u0435\u0440\u0442\u0442\u0435\u0443\u0448\u0456"
    },
    footer: {
      createdWith: "\u049A\u04B1\u0440\u0430\u0441\u0442\u044B\u0440\u044B\u043B\u0493\u0430\u043D \u049B\u04B1\u0440\u0430\u043B:"
    },
    graph: {
      title: "\u0413\u0440\u0430\u0444 \u043A\u04E9\u0440\u0456\u043D\u0456\u0441\u0456"
    },
    recentNotes: {
      title: "\u0421\u043E\u04A3\u0493\u044B \u0436\u0430\u0437\u0431\u0430\u043B\u0430\u0440",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `\u0422\u0430\u0493\u044B ${remaining} \u0436\u0430\u0437\u0431\u0430\u043D\u044B \u049B\u0430\u0440\u0430\u0443 \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `${targetSlug} \u043A\u0456\u0440\u0456\u0441\u0442\u0456\u0440\u0443`, "transcludeOf"),
      linkToOriginal: "\u0411\u0430\u0441\u0442\u0430\u043F\u049B\u044B\u0493\u0430 \u0441\u0456\u043B\u0442\u0435\u043C\u0435"
    },
    search: {
      title: "\u0406\u0437\u0434\u0435\u0443",
      searchBarPlaceholder: "\u0411\u0456\u0440\u0434\u0435\u04A3\u0435 \u0456\u0437\u0434\u0435\u0443"
    },
    tableOfContents: {
      title: "\u041C\u0430\u0437\u043C\u04B1\u043D\u044B"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => `${minutes} \u043C\u0438\u043D \u043E\u049B\u0443`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "\u0421\u043E\u04A3\u0493\u044B \u0436\u0430\u0437\u0431\u0430\u043B\u0430\u0440",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => `\u0421\u043E\u04A3\u0493\u044B ${count} \u0436\u0430\u0437\u0431\u0430`, "lastFewNotes")
    },
    error: {
      title: "\u0422\u0430\u0431\u044B\u043B\u043C\u0430\u0434\u044B",
      notFound: "\u0411\u04B1\u043B \u0431\u0435\u0442 \u0436\u0435\u043A\u0435 \u043D\u0435\u043C\u0435\u0441\u0435 \u0436\u043E\u049B \u0431\u043E\u043B\u0443\u044B \u043C\u04AF\u043C\u043A\u0456\u043D.",
      home: "\u0411\u0430\u0441\u0442\u044B \u0431\u0435\u0442\u043A\u0435 \u043E\u0440\u0430\u043B\u0443"
    },
    folderContent: {
      folder: "\u049A\u0430\u043B\u0442\u0430",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => count === 1 ? "\u0411\u04B1\u043B \u049B\u0430\u043B\u0442\u0430\u0434\u0430 1 \u044D\u043B\u0435\u043C\u0435\u043D\u0442 \u0431\u0430\u0440." : `\u0411\u04B1\u043B \u049B\u0430\u043B\u0442\u0430\u0434\u0430 ${count} \u044D\u043B\u0435\u043C\u0435\u043D\u0442 \u0431\u0430\u0440.`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "\u0422\u0435\u0433",
      tagIndex: "\u0422\u0435\u0433\u0442\u0435\u0440 \u0438\u043D\u0434\u0435\u043A\u0441\u0456",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => count === 1 ? "\u0411\u04B1\u043B \u0442\u0435\u0433\u043F\u0435\u043D 1 \u044D\u043B\u0435\u043C\u0435\u043D\u0442." : `\u0411\u04B1\u043B \u0442\u0435\u0433\u043F\u0435\u043D ${count} \u044D\u043B\u0435\u043C\u0435\u043D\u0442.`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => `\u0410\u043B\u0493\u0430\u0448\u049B\u044B ${count} \u0442\u0435\u0433 \u043A\u04E9\u0440\u0441\u0435\u0442\u0456\u043B\u0443\u0434\u0435.`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => `\u0411\u0430\u0440\u043B\u044B\u0493\u044B ${count} \u0442\u0435\u0433 \u0442\u0430\u0431\u044B\u043B\u0434\u044B.`, "totalTags")
    }
  }
};

// quartz/i18n/locales/he-IL.ts
var he_IL_default = {
  propertyDefaults: {
    title: "\u05DC\u05DC\u05D0 \u05DB\u05D5\u05EA\u05E8\u05EA",
    description: "\u05DC\u05D0 \u05E1\u05D5\u05E4\u05E7 \u05EA\u05D9\u05D0\u05D5\u05E8"
  },
  direction: "rtl",
  components: {
    callout: {
      note: "\u05D4\u05E2\u05E8\u05D4",
      abstract: "\u05EA\u05E7\u05E6\u05D9\u05E8",
      info: "\u05DE\u05D9\u05D3\u05E2",
      todo: "\u05DC\u05E2\u05E9\u05D5\u05EA",
      tip: "\u05D8\u05D9\u05E4",
      success: "\u05D4\u05E6\u05DC\u05D7\u05D4",
      question: "\u05E9\u05D0\u05DC\u05D4",
      warning: "\u05D0\u05D6\u05D4\u05E8\u05D4",
      failure: "\u05DB\u05E9\u05DC\u05D5\u05DF",
      danger: "\u05E1\u05DB\u05E0\u05D4",
      bug: "\u05D1\u05D0\u05D2",
      example: "\u05D3\u05D5\u05D2\u05DE\u05D4",
      quote: "\u05E6\u05D9\u05D8\u05D5\u05D8"
    },
    backlinks: {
      title: "\u05E7\u05D9\u05E9\u05D5\u05E8\u05D9\u05DD \u05D7\u05D5\u05D6\u05E8\u05D9\u05DD",
      noBacklinksFound: "\u05DC\u05D0 \u05E0\u05DE\u05E6\u05D0\u05D5 \u05E7\u05D9\u05E9\u05D5\u05E8\u05D9\u05DD \u05D7\u05D5\u05D6\u05E8\u05D9\u05DD"
    },
    themeToggle: {
      lightMode: "\u05DE\u05E6\u05D1 \u05D1\u05D4\u05D9\u05E8",
      darkMode: "\u05DE\u05E6\u05D1 \u05DB\u05D4\u05D4"
    },
    readerMode: {
      title: "\u05DE\u05E6\u05D1 \u05E7\u05E8\u05D9\u05D0\u05D4"
    },
    explorer: {
      title: "\u05E1\u05D9\u05D9\u05E8"
    },
    footer: {
      createdWith: "\u05E0\u05D5\u05E6\u05E8 \u05D1\u05D0\u05DE\u05E6\u05E2\u05D5\u05EA"
    },
    graph: {
      title: "\u05DE\u05D1\u05D8 \u05D2\u05E8\u05E3"
    },
    recentNotes: {
      title: "\u05D4\u05E2\u05E8\u05D5\u05EA \u05D0\u05D7\u05E8\u05D5\u05E0\u05D5\u05EA",
      seeRemainingMore: /* @__PURE__ */ __name(({ remaining }) => `\u05E2\u05D9\u05D9\u05DF \u05D1 ${remaining} \u05E0\u05D5\u05E1\u05E4\u05D9\u05DD \u2192`, "seeRemainingMore")
    },
    transcludes: {
      transcludeOf: /* @__PURE__ */ __name(({ targetSlug }) => `\u05DE\u05E6\u05D5\u05D8\u05D8 \u05DE ${targetSlug}`, "transcludeOf"),
      linkToOriginal: "\u05E7\u05D9\u05E9\u05D5\u05E8 \u05DC\u05DE\u05E7\u05D5\u05E8\u05D9"
    },
    search: {
      title: "\u05D7\u05D9\u05E4\u05D5\u05E9",
      searchBarPlaceholder: "\u05D7\u05E4\u05E9\u05D5 \u05DE\u05E9\u05D4\u05D5"
    },
    tableOfContents: {
      title: "\u05EA\u05D5\u05DB\u05DF \u05E2\u05E0\u05D9\u05D9\u05E0\u05D9\u05DD"
    },
    contentMeta: {
      readingTime: /* @__PURE__ */ __name(({ minutes }) => `${minutes} \u05D3\u05E7\u05D5\u05EA \u05E7\u05E8\u05D9\u05D0\u05D4`, "readingTime")
    }
  },
  pages: {
    rss: {
      recentNotes: "\u05D4\u05E2\u05E8\u05D5\u05EA \u05D0\u05D7\u05E8\u05D5\u05E0\u05D5\u05EA",
      lastFewNotes: /* @__PURE__ */ __name(({ count }) => `${count} \u05D4\u05E2\u05E8\u05D5\u05EA \u05D0\u05D7\u05E8\u05D5\u05E0\u05D5\u05EA`, "lastFewNotes")
    },
    error: {
      title: "\u05DC\u05D0 \u05E0\u05DE\u05E6\u05D0",
      notFound: "\u05D4\u05E2\u05DE\u05D5\u05D3 \u05D4\u05D6\u05D4 \u05E4\u05E8\u05D8\u05D9 \u05D0\u05D5 \u05DC\u05D0 \u05E7\u05D9\u05D9\u05DD.",
      home: "\u05D7\u05D6\u05E8\u05D4 \u05DC\u05E2\u05DE\u05D5\u05D3 \u05D4\u05D1\u05D9\u05EA"
    },
    folderContent: {
      folder: "\u05EA\u05D9\u05E7\u05D9\u05D9\u05D4",
      itemsUnderFolder: /* @__PURE__ */ __name(({ count }) => count === 1 ? "\u05E4\u05E8\u05D9\u05D8 \u05D0\u05D7\u05D3 \u05EA\u05D7\u05EA \u05EA\u05D9\u05E7\u05D9\u05D9\u05D4 \u05D6\u05D5." : `${count} \u05E4\u05E8\u05D9\u05D8\u05D9\u05DD \u05EA\u05D7\u05EA \u05EA\u05D9\u05E7\u05D9\u05D9\u05D4 \u05D6\u05D5.`, "itemsUnderFolder")
    },
    tagContent: {
      tag: "\u05EA\u05D2\u05D9\u05EA",
      tagIndex: "\u05DE\u05E4\u05EA\u05D7 \u05D4\u05EA\u05D2\u05D9\u05D5\u05EA",
      itemsUnderTag: /* @__PURE__ */ __name(({ count }) => count === 1 ? "\u05E4\u05E8\u05D9\u05D8 \u05D0\u05D7\u05D3 \u05E2\u05DD \u05EA\u05D2\u05D9\u05EA \u05D6\u05D5." : `${count} \u05E4\u05E8\u05D9\u05D8\u05D9\u05DD \u05E2\u05DD \u05EA\u05D2\u05D9\u05EA \u05D6\u05D5.`, "itemsUnderTag"),
      showingFirst: /* @__PURE__ */ __name(({ count }) => `\u05DE\u05E8\u05D0\u05D4 \u05D0\u05EA \u05D4-${count} \u05EA\u05D2\u05D9\u05D5\u05EA \u05D4\u05E8\u05D0\u05E9\u05D5\u05E0\u05D5\u05EA.`, "showingFirst"),
      totalTags: /* @__PURE__ */ __name(({ count }) => `${count} \u05EA\u05D2\u05D9\u05D5\u05EA \u05E0\u05DE\u05E6\u05D0\u05D5 \u05E1\u05DA \u05D4\u05DB\u05DC.`, "totalTags")
    }
  }
};

// quartz/i18n/index.ts
var TRANSLATIONS = {
  "en-US": en_US_default,
  "en-GB": en_GB_default,
  "fr-FR": fr_FR_default,
  "it-IT": it_IT_default,
  "ja-JP": ja_JP_default,
  "de-DE": de_DE_default,
  "nl-NL": nl_NL_default,
  "nl-BE": nl_NL_default,
  "ro-RO": ro_RO_default,
  "ro-MD": ro_RO_default,
  "ca-ES": ca_ES_default,
  "es-ES": es_ES_default,
  "ar-SA": ar_SA_default,
  "ar-AE": ar_SA_default,
  "ar-QA": ar_SA_default,
  "ar-BH": ar_SA_default,
  "ar-KW": ar_SA_default,
  "ar-OM": ar_SA_default,
  "ar-YE": ar_SA_default,
  "ar-IR": ar_SA_default,
  "ar-SY": ar_SA_default,
  "ar-IQ": ar_SA_default,
  "ar-JO": ar_SA_default,
  "ar-PL": ar_SA_default,
  "ar-LB": ar_SA_default,
  "ar-EG": ar_SA_default,
  "ar-SD": ar_SA_default,
  "ar-LY": ar_SA_default,
  "ar-MA": ar_SA_default,
  "ar-TN": ar_SA_default,
  "ar-DZ": ar_SA_default,
  "ar-MR": ar_SA_default,
  "uk-UA": uk_UA_default,
  "ru-RU": ru_RU_default,
  "ko-KR": ko_KR_default,
  "zh-CN": zh_CN_default,
  "zh-TW": zh_TW_default,
  "vi-VN": vi_VN_default,
  "pt-BR": pt_BR_default,
  "hu-HU": hu_HU_default,
  "fa-IR": fa_IR_default,
  "pl-PL": pl_PL_default,
  "cs-CZ": cs_CZ_default,
  "tr-TR": tr_TR_default,
  "th-TH": th_TH_default,
  "lt-LT": lt_LT_default,
  "fi-FI": fi_FI_default,
  "nb-NO": nb_NO_default,
  "id-ID": id_ID_default,
  "kk-KZ": kk_KZ_default,
  "he-IL": he_IL_default
};
var defaultTranslation = "en-US";
var i18n = /* @__PURE__ */ __name((locale) => TRANSLATIONS[locale ?? defaultTranslation], "i18n");

// quartz/plugins/transformers/frontmatter.ts
var defaultOptions = {
  delimiters: "---",
  language: "yaml"
};
function coalesceAliases(data, aliases) {
  for (const alias of aliases) {
    if (data[alias] !== void 0 && data[alias] !== null) return data[alias];
  }
}
__name(coalesceAliases, "coalesceAliases");
function coerceToArray(input) {
  if (input === void 0 || input === null) return void 0;
  if (!Array.isArray(input)) {
    input = input.toString().split(",").map((tag) => tag.trim());
  }
  return input.filter((tag) => typeof tag === "string" || typeof tag === "number").map((tag) => tag.toString());
}
__name(coerceToArray, "coerceToArray");
function getAliasSlugs(aliases) {
  const res = [];
  for (const alias of aliases) {
    const isMd = getFileExtension(alias) === "md";
    const mockFp = isMd ? alias : alias + ".md";
    const slug = slugifyFilePath(mockFp);
    res.push(slug);
  }
  return res;
}
__name(getAliasSlugs, "getAliasSlugs");
var FrontMatter = /* @__PURE__ */ __name((userOpts) => {
  const opts = { ...defaultOptions, ...userOpts };
  return {
    name: "FrontMatter",
    markdownPlugins(ctx) {
      const { cfg, allSlugs } = ctx;
      return [
        [remarkFrontmatter, ["yaml", "toml"]],
        () => {
          return (_, file) => {
            const fileData = Buffer.from(file.value);
            const { data } = matter(fileData, {
              ...opts,
              engines: {
                yaml: /* @__PURE__ */ __name((s) => yaml.load(s, { schema: yaml.JSON_SCHEMA }), "yaml"),
                toml: /* @__PURE__ */ __name((s) => toml.parse(s), "toml")
              }
            });
            if (data.title != null && data.title.toString() !== "") {
              data.title = data.title.toString();
            } else {
              data.title = file.stem ?? i18n(cfg.configuration.locale).propertyDefaults.title;
            }
            const tags = coerceToArray(coalesceAliases(data, ["tags", "tag"]));
            if (tags) data.tags = [...new Set(tags.map((tag) => slugTag(tag)))];
            const aliases = coerceToArray(coalesceAliases(data, ["aliases", "alias"]));
            if (aliases) {
              data.aliases = aliases;
              file.data.aliases = getAliasSlugs(aliases);
              allSlugs.push(...file.data.aliases);
            }
            if (data.permalink != null && data.permalink.toString() !== "") {
              data.permalink = data.permalink.toString();
              const aliases2 = file.data.aliases ?? [];
              aliases2.push(data.permalink);
              file.data.aliases = aliases2;
              allSlugs.push(data.permalink);
            }
            const cssclasses = coerceToArray(coalesceAliases(data, ["cssclasses", "cssclass"]));
            if (cssclasses) data.cssclasses = cssclasses;
            const socialImage = coalesceAliases(data, ["socialImage", "image", "cover"]);
            const created = coalesceAliases(data, ["created", "date"]);
            if (created) {
              data.created = created;
            }
            const modified = coalesceAliases(data, [
              "modified",
              "lastmod",
              "updated",
              "last-modified"
            ]);
            if (modified) data.modified = modified;
            data.modified ||= created;
            const published = coalesceAliases(data, ["published", "publishDate", "date"]);
            if (published) data.published = published;
            if (socialImage) data.socialImage = socialImage;
            const uniqueSlugs = [...new Set(allSlugs)];
            allSlugs.splice(0, allSlugs.length, ...uniqueSlugs);
            file.data.frontmatter = data;
          };
        }
      ];
    }
  };
}, "FrontMatter");

// quartz/plugins/transformers/gfm.ts
import remarkGfm from "remark-gfm";
import smartypants from "remark-smartypants";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
var defaultOptions2 = {
  enableSmartyPants: true,
  linkHeadings: true
};
var GitHubFlavoredMarkdown = /* @__PURE__ */ __name((userOpts) => {
  const opts = { ...defaultOptions2, ...userOpts };
  return {
    name: "GitHubFlavoredMarkdown",
    markdownPlugins() {
      return opts.enableSmartyPants ? [remarkGfm, smartypants] : [remarkGfm];
    },
    htmlPlugins() {
      if (opts.linkHeadings) {
        return [
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            {
              behavior: "append",
              properties: {
                role: "anchor",
                ariaHidden: true,
                tabIndex: -1,
                "data-no-popover": true
              },
              content: {
                type: "element",
                tagName: "svg",
                properties: {
                  width: 18,
                  height: 18,
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  "stroke-width": "2",
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round"
                },
                children: [
                  {
                    type: "element",
                    tagName: "path",
                    properties: {
                      d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                    },
                    children: []
                  },
                  {
                    type: "element",
                    tagName: "path",
                    properties: {
                      d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                    },
                    children: []
                  }
                ]
              }
            }
          ]
        ];
      } else {
        return [];
      }
    }
  };
}, "GitHubFlavoredMarkdown");

// quartz/plugins/transformers/citations.ts
import rehypeCitation from "rehype-citation";
import { visit } from "unist-util-visit";

// quartz/plugins/transformers/lastmod.ts
import fs from "fs";
import { Repository } from "@napi-rs/simple-git";
import path from "path";
import { styleText } from "util";
var defaultOptions3 = {
  priority: ["frontmatter", "git", "filesystem"]
};
var iso8601DateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
function coerceDate(fp, d) {
  if (typeof d === "string" && iso8601DateOnlyRegex.test(d)) {
    d = `${d}T00:00:00`;
  }
  const dt = new Date(d);
  const invalidDate = isNaN(dt.getTime()) || dt.getTime() === 0;
  if (invalidDate && d !== void 0) {
    console.log(
      styleText(
        "yellow",
        `
Warning: found invalid date "${d}" in \`${fp}\`. Supported formats: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_time_string_format`
      )
    );
  }
  return invalidDate ? /* @__PURE__ */ new Date() : dt;
}
__name(coerceDate, "coerceDate");
var CreatedModifiedDate = /* @__PURE__ */ __name((userOpts) => {
  const opts = { ...defaultOptions3, ...userOpts };
  return {
    name: "CreatedModifiedDate",
    markdownPlugins(ctx) {
      return [
        () => {
          let repo = void 0;
          let repositoryWorkdir;
          if (opts.priority.includes("git")) {
            try {
              repo = Repository.discover(ctx.argv.directory);
              repositoryWorkdir = repo.workdir() ?? ctx.argv.directory;
            } catch (e) {
              console.log(
                styleText(
                  "yellow",
                  `
Warning: couldn't find git repository for ${ctx.argv.directory}`
                )
              );
            }
          }
          return async (_tree, file) => {
            let created = void 0;
            let modified = void 0;
            let published = void 0;
            const fp = file.data.relativePath;
            const fullFp = file.data.filePath;
            for (const source of opts.priority) {
              if (source === "filesystem") {
                const st = await fs.promises.stat(fullFp);
                created ||= st.birthtimeMs;
                modified ||= st.mtimeMs;
              } else if (source === "frontmatter" && file.data.frontmatter) {
                created ||= file.data.frontmatter.created;
                modified ||= file.data.frontmatter.modified;
                published ||= file.data.frontmatter.published;
              } else if (source === "git" && repo) {
                try {
                  const relativePath = path.relative(repositoryWorkdir, fullFp);
                  modified ||= await repo.getFileLatestModifiedDateAsync(relativePath);
                } catch {
                  console.log(
                    styleText(
                      "yellow",
                      `
Warning: ${file.data.filePath} isn't yet tracked by git, dates will be inaccurate`
                    )
                  );
                }
              }
            }
            file.data.dates = {
              created: coerceDate(fp, created),
              modified: coerceDate(fp, modified),
              published: coerceDate(fp, published)
            };
          };
        }
      ];
    }
  };
}, "CreatedModifiedDate");

// quartz/plugins/transformers/latex.ts
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeMathjax from "rehype-mathjax/svg";
import rehypeTypst from "@myriaddreamin/rehype-typst";
var Latex = /* @__PURE__ */ __name((opts) => {
  const engine = opts?.renderEngine ?? "katex";
  const macros = opts?.customMacros ?? {};
  return {
    name: "Latex",
    markdownPlugins() {
      return [remarkMath];
    },
    htmlPlugins() {
      switch (engine) {
        case "katex": {
          return [[rehypeKatex, { output: "html", macros, ...opts?.katexOptions ?? {} }]];
        }
        case "typst": {
          return [[rehypeTypst, opts?.typstOptions ?? {}]];
        }
        default:
        case "mathjax": {
          return [
            [
              rehypeMathjax,
              {
                ...opts?.mathJaxOptions ?? {},
                tex: {
                  ...opts?.mathJaxOptions?.tex ?? {},
                  macros
                }
              }
            ]
          ];
        }
      }
    },
    externalResources() {
      switch (engine) {
        case "katex":
          return {
            css: [{ content: "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" }],
            js: [
              {
                // fix copy behaviour: https://github.com/KaTeX/KaTeX/blob/main/contrib/copy-tex/README.md
                src: "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/copy-tex.min.js",
                loadTime: "afterDOMReady",
                contentType: "external"
              }
            ]
          };
      }
    }
  };
}, "Latex");

// quartz/plugins/transformers/description.ts
import { toString } from "hast-util-to-string";

// quartz/util/escape.ts
var escapeHTML = /* @__PURE__ */ __name((unsafe) => {
  return unsafe.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}, "escapeHTML");
var unescapeHTML = /* @__PURE__ */ __name((html) => {
  return html.replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&#039;", "'");
}, "unescapeHTML");

// quartz/plugins/transformers/description.ts
var defaultOptions4 = {
  descriptionLength: 150,
  maxDescriptionLength: 300,
  replaceExternalLinks: true
};
var urlRegex = new RegExp(
  /(https?:\/\/)?(?<domain>([\da-z\.-]+)\.([a-z\.]{2,6})(:\d+)?)(?<path>[\/\w\.-]*)(\?[\/\w\.=&;-]*)?/,
  "g"
);
var Description = /* @__PURE__ */ __name((userOpts) => {
  const opts = { ...defaultOptions4, ...userOpts };
  return {
    name: "Description",
    htmlPlugins() {
      return [
        () => {
          return async (tree, file) => {
            let frontMatterDescription = file.data.frontmatter?.description;
            let text = escapeHTML(toString(tree));
            if (opts.replaceExternalLinks) {
              frontMatterDescription = frontMatterDescription?.replace(
                urlRegex,
                "$<domain>$<path>"
              );
              text = text.replace(urlRegex, "$<domain>$<path>");
            }
            if (frontMatterDescription) {
              file.data.description = frontMatterDescription;
              file.data.text = text;
              return;
            }
            const desc = text;
            const sentences = desc.replace(/\s+/g, " ").split(/\.\s/);
            let finalDesc = "";
            let sentenceIdx = 0;
            while (sentenceIdx < sentences.length) {
              const sentence = sentences[sentenceIdx];
              if (!sentence) break;
              const currentSentence = sentence.endsWith(".") ? sentence : sentence + ".";
              const nextLength = finalDesc.length + currentSentence.length + (finalDesc ? 1 : 0);
              if (nextLength <= opts.descriptionLength || sentenceIdx === 0) {
                finalDesc += (finalDesc ? " " : "") + currentSentence;
                sentenceIdx++;
              } else {
                break;
              }
            }
            file.data.description = finalDesc.length > opts.maxDescriptionLength ? finalDesc.slice(0, opts.maxDescriptionLength) + "..." : finalDesc;
            file.data.text = text;
          };
        }
      ];
    }
  };
}, "Description");

// quartz/plugins/transformers/links.ts
import path2 from "path";
import { visit as visit2 } from "unist-util-visit";
import isAbsoluteUrl from "is-absolute-url";
var defaultOptions5 = {
  markdownLinkResolution: "absolute",
  prettyLinks: true,
  openLinksInNewTab: false,
  lazyLoad: false,
  externalLinkIcon: true
};
var CrawlLinks = /* @__PURE__ */ __name((userOpts) => {
  const opts = { ...defaultOptions5, ...userOpts };
  return {
    name: "LinkProcessing",
    htmlPlugins(ctx) {
      return [
        () => {
          return (tree, file) => {
            const curSlug = simplifySlug(file.data.slug);
            const outgoing = /* @__PURE__ */ new Set();
            const transformOptions = {
              strategy: opts.markdownLinkResolution,
              allSlugs: ctx.allSlugs
            };
            visit2(tree, "element", (node, _index, _parent) => {
              if (node.tagName === "a" && node.properties && typeof node.properties.href === "string") {
                let dest = node.properties.href;
                const classes = node.properties.className ?? [];
                const isExternal = isAbsoluteUrl(dest, { httpOnly: false });
                classes.push(isExternal ? "external" : "internal");
                if (isExternal && opts.externalLinkIcon) {
                  node.children.push({
                    type: "element",
                    tagName: "svg",
                    properties: {
                      "aria-hidden": "true",
                      class: "external-icon",
                      style: "max-width:0.8em;max-height:0.8em",
                      viewBox: "0 0 512 512"
                    },
                    children: [
                      {
                        type: "element",
                        tagName: "path",
                        properties: {
                          d: "M320 0H288V64h32 82.7L201.4 265.4 178.7 288 224 333.3l22.6-22.6L448 109.3V192v32h64V192 32 0H480 320zM32 32H0V64 480v32H32 456h32V480 352 320H424v32 96H64V96h96 32V32H160 32z"
                        },
                        children: []
                      }
                    ]
                  });
                }
                if (node.children.length === 1 && node.children[0].type === "text" && node.children[0].value !== dest) {
                  classes.push("alias");
                }
                node.properties.className = classes;
                if (isExternal && opts.openLinksInNewTab) {
                  node.properties.target = "_blank";
                }
                const isInternal = !(isAbsoluteUrl(dest, { httpOnly: false }) || dest.startsWith("#"));
                if (isInternal) {
                  dest = node.properties.href = transformLink(
                    file.data.slug,
                    dest,
                    transformOptions
                  );
                  const url = new URL(dest, "https://base.com/" + stripSlashes(curSlug, true));
                  const canonicalDest = url.pathname;
                  let [destCanonical, _destAnchor] = splitAnchor(canonicalDest);
                  if (destCanonical.endsWith("/")) {
                    destCanonical += "index";
                  }
                  const full = decodeURIComponent(stripSlashes(destCanonical, true));
                  const simple = simplifySlug(full);
                  outgoing.add(simple);
                  node.properties["data-slug"] = full;
                }
                if (opts.prettyLinks && isInternal && node.children.length === 1 && node.children[0].type === "text" && !node.children[0].value.startsWith("#")) {
                  node.children[0].value = path2.basename(node.children[0].value);
                }
              }
              if (["img", "video", "audio", "iframe"].includes(node.tagName) && node.properties && typeof node.properties.src === "string") {
                if (opts.lazyLoad) {
                  node.properties.loading = "lazy";
                }
                if (!isAbsoluteUrl(node.properties.src, { httpOnly: false })) {
                  let dest = node.properties.src;
                  dest = node.properties.src = transformLink(
                    file.data.slug,
                    dest,
                    transformOptions
                  );
                  node.properties.src = dest;
                }
              }
            });
            file.data.links = [...outgoing];
          };
        }
      ];
    }
  };
}, "CrawlLinks");

// quartz/plugins/transformers/ofm.ts
import { findAndReplace as mdastFindReplace } from "mdast-util-find-and-replace";
import rehypeRaw from "rehype-raw";
import { SKIP, visit as visit3 } from "unist-util-visit";
import path3 from "path";

// quartz/components/scripts/callout.inline.ts
var callout_inline_default = "";

// quartz/components/scripts/checkbox.inline.ts
var checkbox_inline_default = "";

// quartz/components/scripts/mermaid.inline.ts
var mermaid_inline_default = "";

// quartz/components/styles/mermaid.inline.scss
var mermaid_inline_default2 = "";

// quartz/plugins/transformers/ofm.ts
import { toHast } from "mdast-util-to-hast";
import { toHtml } from "hast-util-to-html";

// quartz/util/lang.ts
function capitalize(s) {
  return s.substring(0, 1).toUpperCase() + s.substring(1);
}
__name(capitalize, "capitalize");
function classNames(displayClass, ...classes) {
  if (displayClass) {
    classes.push(displayClass);
  }
  return classes.join(" ");
}
__name(classNames, "classNames");

// quartz/plugins/transformers/ofm.ts
var defaultOptions6 = {
  comments: true,
  highlight: true,
  wikilinks: true,
  callouts: true,
  mermaid: true,
  parseTags: true,
  parseArrows: true,
  parseBlockReferences: true,
  enableInHtmlEmbed: false,
  enableYouTubeEmbed: true,
  enableVideoEmbed: true,
  enableCheckbox: false,
  disableBrokenWikilinks: false
};
var calloutMapping = {
  note: "note",
  abstract: "abstract",
  summary: "abstract",
  tldr: "abstract",
  info: "info",
  todo: "todo",
  tip: "tip",
  hint: "tip",
  important: "tip",
  success: "success",
  check: "success",
  done: "success",
  question: "question",
  help: "question",
  faq: "question",
  warning: "warning",
  attention: "warning",
  caution: "warning",
  failure: "failure",
  missing: "failure",
  fail: "failure",
  danger: "danger",
  error: "danger",
  bug: "bug",
  example: "example",
  quote: "quote",
  cite: "quote"
};
var arrowMapping = {
  "->": "&rarr;",
  "-->": "&rArr;",
  "=>": "&rArr;",
  "==>": "&rArr;",
  "<-": "&larr;",
  "<--": "&lArr;",
  "<=": "&lArr;",
  "<==": "&lArr;"
};
function canonicalizeCallout(calloutName) {
  const normalizedCallout = calloutName.toLowerCase();
  return calloutMapping[normalizedCallout] ?? calloutName;
}
__name(canonicalizeCallout, "canonicalizeCallout");
var externalLinkRegex = /^https?:\/\//i;
var arrowRegex = new RegExp(/(-{1,2}>|={1,2}>|<-{1,2}|<={1,2})/g);
var wikilinkRegex = new RegExp(
  /!?\[\[([^\[\]\|\#\\]+)?(#+[^\[\]\|\#\\]+)?(\\?\|[^\[\]\#]*)?\]\]/g
);
var tableRegex = new RegExp(/^\|([^\n])+\|\n(\|)( ?:?-{3,}:? ?\|)+\n(\|([^\n])+\|\n?)+/gm);
var tableWikilinkRegex = new RegExp(/(!?\[\[[^\]]*?\]\]|\[\^[^\]]*?\])/g);
var highlightRegex = new RegExp(/==([^=]+)==/g);
var commentRegex = new RegExp(/%%[\s\S]*?%%/g);
var calloutRegex = new RegExp(/^\[\!([\w-]+)\|?(.+?)?\]([+-]?)/);
var calloutLineRegex = new RegExp(/^> *\[\!\w+\|?.*?\][+-]?.*$/gm);
var tagRegex = new RegExp(
  /(?<=^| )#((?:[-_\p{L}\p{Emoji}\p{M}\d])+(?:\/[-_\p{L}\p{Emoji}\p{M}\d]+)*)/gu
);
var blockReferenceRegex = new RegExp(/\^([-_A-Za-z0-9]+)$/g);
var ytLinkRegex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
var ytPlaylistLinkRegex = /[?&]list=([^#?&]*)/;
var videoExtensionRegex = new RegExp(/\.(mp4|webm|ogg|avi|mov|flv|wmv|mkv|mpg|mpeg|3gp|m4v)$/);
var wikilinkImageEmbedRegex = new RegExp(
  /^(?<alt>(?!^\d*x?\d*$).*?)?(\|?\s*?(?<width>\d+)(x(?<height>\d+))?)?$/
);
var ObsidianFlavoredMarkdown = /* @__PURE__ */ __name((userOpts) => {
  const opts = { ...defaultOptions6, ...userOpts };
  const mdastToHtml = /* @__PURE__ */ __name((ast) => {
    const hast = toHast(ast, { allowDangerousHtml: true });
    return toHtml(hast, { allowDangerousHtml: true });
  }, "mdastToHtml");
  return {
    name: "ObsidianFlavoredMarkdown",
    textTransform(_ctx, src) {
      if (opts.comments) {
        src = src.replace(commentRegex, "");
      }
      if (opts.callouts) {
        src = src.replace(calloutLineRegex, (value) => {
          return value + "\n> ";
        });
      }
      if (opts.wikilinks) {
        src = src.replace(tableRegex, (value) => {
          return value.replace(tableWikilinkRegex, (_value, raw) => {
            let escaped = raw ?? "";
            escaped = escaped.replace("#", "\\#");
            escaped = escaped.replace(/((^|[^\\])(\\\\)*)\|/g, "$1\\|");
            return escaped;
          });
        });
        src = src.replace(wikilinkRegex, (value, ...capture) => {
          const [rawFp, rawHeader, rawAlias] = capture;
          const [fp, anchor] = splitAnchor(`${rawFp ?? ""}${rawHeader ?? ""}`);
          const blockRef = Boolean(rawHeader?.startsWith("#^")) ? "^" : "";
          const displayAnchor = anchor ? `#${blockRef}${anchor.trim().replace(/^#+/, "")}` : "";
          const displayAlias = rawAlias ?? rawHeader?.replace("#", "|") ?? "";
          const embedDisplay = value.startsWith("!") ? "!" : "";
          if (rawFp?.match(externalLinkRegex)) {
            return `${embedDisplay}[${displayAlias.replace(/^\|/, "")}](${rawFp})`;
          }
          return `${embedDisplay}[[${fp}${displayAnchor}${displayAlias}]]`;
        });
      }
      return src;
    },
    markdownPlugins(ctx) {
      const plugins = [];
      plugins.push(() => {
        return (tree, file) => {
          const replacements = [];
          const base = pathToRoot(file.data.slug);
          if (opts.wikilinks) {
            replacements.push([
              wikilinkRegex,
              (value, ...capture) => {
                let [rawFp, rawHeader, rawAlias] = capture;
                const fp = rawFp?.trim() ?? "";
                const anchor = rawHeader?.trim() ?? "";
                const alias = rawAlias?.slice(1).trim();
                if (value.startsWith("!")) {
                  const ext = path3.extname(fp).toLowerCase();
                  const url2 = slugifyFilePath(fp);
                  if ([".png", ".jpg", ".jpeg", ".gif", ".bmp", ".svg", ".webp"].includes(ext)) {
                    const match = wikilinkImageEmbedRegex.exec(alias ?? "");
                    const alt = match?.groups?.alt ?? "";
                    const width = match?.groups?.width ?? "auto";
                    const height = match?.groups?.height ?? "auto";
                    return {
                      type: "image",
                      url: url2,
                      data: {
                        hProperties: {
                          width,
                          height,
                          alt
                        }
                      }
                    };
                  } else if ([".mp4", ".webm", ".ogv", ".mov", ".mkv"].includes(ext)) {
                    return {
                      type: "html",
                      value: `<video src="${url2}" controls></video>`
                    };
                  } else if ([".mp3", ".webm", ".wav", ".m4a", ".ogg", ".3gp", ".flac"].includes(ext)) {
                    return {
                      type: "html",
                      value: `<audio src="${url2}" controls></audio>`
                    };
                  } else if ([".pdf"].includes(ext)) {
                    return {
                      type: "html",
                      value: `<iframe src="${url2}" class="pdf"></iframe>`
                    };
                  } else {
                    const block = anchor;
                    return {
                      type: "html",
                      data: { hProperties: { transclude: true } },
                      value: `<blockquote class="transclude" data-url="${url2}" data-block="${block}" data-embed-alias="${alias}"><a href="${url2 + anchor}" class="transclude-inner">Transclude of ${url2}${block}</a></blockquote>`
                    };
                  }
                }
                if (opts.disableBrokenWikilinks) {
                  const slug = slugifyFilePath(fp);
                  const exists = ctx.allSlugs && ctx.allSlugs.includes(slug);
                  if (!exists) {
                    return {
                      type: "html",
                      value: `<a class="internal broken">${alias ?? fp}</a>`
                    };
                  }
                }
                const url = fp + anchor;
                return {
                  type: "link",
                  url,
                  children: [
                    {
                      type: "text",
                      value: alias ?? fp
                    }
                  ]
                };
              }
            ]);
          }
          if (opts.highlight) {
            replacements.push([
              highlightRegex,
              (_value, ...capture) => {
                const [inner] = capture;
                return {
                  type: "html",
                  value: `<span class="text-highlight">${inner}</span>`
                };
              }
            ]);
          }
          if (opts.parseArrows) {
            replacements.push([
              arrowRegex,
              (value, ..._capture) => {
                const maybeArrow = arrowMapping[value];
                if (maybeArrow === void 0) return SKIP;
                return {
                  type: "html",
                  value: `<span>${maybeArrow}</span>`
                };
              }
            ]);
          }
          if (opts.parseTags) {
            replacements.push([
              tagRegex,
              (_value, tag) => {
                if (/^[\/\d]+$/.test(tag)) {
                  return false;
                }
                tag = slugTag(tag);
                if (file.data.frontmatter) {
                  const noteTags = file.data.frontmatter.tags ?? [];
                  file.data.frontmatter.tags = [.../* @__PURE__ */ new Set([...noteTags, tag])];
                }
                return {
                  type: "link",
                  url: base + `/tags/${tag}`,
                  data: {
                    hProperties: {
                      className: ["tag-link"]
                    }
                  },
                  children: [
                    {
                      type: "text",
                      value: tag
                    }
                  ]
                };
              }
            ]);
          }
          if (opts.enableInHtmlEmbed) {
            visit3(tree, "html", (node) => {
              for (const [regex, replace] of replacements) {
                if (typeof replace === "string") {
                  node.value = node.value.replace(regex, replace);
                } else {
                  node.value = node.value.replace(regex, (substring, ...args) => {
                    const replaceValue = replace(substring, ...args);
                    if (typeof replaceValue === "string") {
                      return replaceValue;
                    } else if (Array.isArray(replaceValue)) {
                      return replaceValue.map(mdastToHtml).join("");
                    } else if (typeof replaceValue === "object" && replaceValue !== null) {
                      return mdastToHtml(replaceValue);
                    } else {
                      return substring;
                    }
                  });
                }
              }
            });
          }
          mdastFindReplace(tree, replacements);
        };
      });
      if (opts.enableVideoEmbed) {
        plugins.push(() => {
          return (tree, _file) => {
            visit3(tree, "image", (node, index, parent) => {
              if (parent && index != void 0 && videoExtensionRegex.test(node.url)) {
                const newNode = {
                  type: "html",
                  value: `<video controls src="${node.url}"></video>`
                };
                parent.children.splice(index, 1, newNode);
                return SKIP;
              }
            });
          };
        });
      }
      if (opts.callouts) {
        plugins.push(() => {
          return (tree, _file) => {
            visit3(tree, "blockquote", (node) => {
              if (node.children.length === 0) {
                return;
              }
              const [firstChild, ...calloutContent] = node.children;
              if (firstChild.type !== "paragraph" || firstChild.children[0]?.type !== "text") {
                return;
              }
              const text = firstChild.children[0].value;
              const restOfTitle = firstChild.children.slice(1);
              const [firstLine, ...remainingLines] = text.split("\n");
              const remainingText = remainingLines.join("\n");
              const match = firstLine.match(calloutRegex);
              if (match && match.input) {
                const [calloutDirective, typeString, calloutMetaData, collapseChar] = match;
                const calloutType = canonicalizeCallout(typeString.toLowerCase());
                const collapse = collapseChar === "+" || collapseChar === "-";
                const defaultState = collapseChar === "-" ? "collapsed" : "expanded";
                const titleContent = match.input.slice(calloutDirective.length).trim();
                const useDefaultTitle = titleContent === "" && restOfTitle.length === 0;
                const titleNode = {
                  type: "paragraph",
                  children: [
                    {
                      type: "text",
                      value: useDefaultTitle ? capitalize(typeString).replace(/-/g, " ") : titleContent + " "
                    },
                    ...restOfTitle
                  ]
                };
                const title = mdastToHtml(titleNode);
                const toggleIcon = `<div class="fold-callout-icon"></div>`;
                const titleHtml = {
                  type: "html",
                  value: `<div
                  class="callout-title"
                >
                  <div class="callout-icon"></div>
                  <div class="callout-title-inner">${title}</div>
                  ${collapse ? toggleIcon : ""}
                </div>`
                };
                const blockquoteContent = [titleHtml];
                if (remainingText.length > 0) {
                  blockquoteContent.push({
                    type: "paragraph",
                    children: [
                      {
                        type: "text",
                        value: remainingText
                      }
                    ]
                  });
                }
                if (calloutContent.length > 0) {
                  node.children = [
                    node.children[0],
                    {
                      data: { hProperties: { className: ["callout-content"] }, hName: "div" },
                      type: "blockquote",
                      children: [...calloutContent]
                    }
                  ];
                }
                node.children.splice(0, 1, ...blockquoteContent);
                const classNames2 = ["callout", calloutType];
                if (collapse) {
                  classNames2.push("is-collapsible");
                }
                if (defaultState === "collapsed") {
                  classNames2.push("is-collapsed");
                }
                node.data = {
                  hProperties: {
                    ...node.data?.hProperties ?? {},
                    className: classNames2.join(" "),
                    "data-callout": calloutType,
                    "data-callout-fold": collapse,
                    "data-callout-metadata": calloutMetaData
                  }
                };
              }
            });
          };
        });
      }
      if (opts.mermaid) {
        plugins.push(() => {
          return (tree, file) => {
            visit3(tree, "code", (node) => {
              if (node.lang === "mermaid") {
                file.data.hasMermaidDiagram = true;
                node.data = {
                  hProperties: {
                    className: ["mermaid"],
                    "data-clipboard": JSON.stringify(node.value)
                  }
                };
              }
            });
          };
        });
      }
      return plugins;
    },
    htmlPlugins() {
      const plugins = [rehypeRaw];
      if (opts.parseBlockReferences) {
        plugins.push(() => {
          const inlineTagTypes = /* @__PURE__ */ new Set(["p", "li"]);
          const blockTagTypes = /* @__PURE__ */ new Set(["blockquote"]);
          return (tree, file) => {
            file.data.blocks = {};
            visit3(tree, "element", (node, index, parent) => {
              if (blockTagTypes.has(node.tagName)) {
                const nextChild = parent?.children.at(index + 2);
                if (nextChild && nextChild.tagName === "p") {
                  const text = nextChild.children.at(0);
                  if (text && text.value && text.type === "text") {
                    const matches = text.value.match(blockReferenceRegex);
                    if (matches && matches.length >= 1) {
                      parent.children.splice(index + 2, 1);
                      const block = matches[0].slice(1);
                      if (!Object.keys(file.data.blocks).includes(block)) {
                        node.properties = {
                          ...node.properties,
                          id: block
                        };
                        file.data.blocks[block] = node;
                      }
                    }
                  }
                }
              } else if (inlineTagTypes.has(node.tagName)) {
                const last = node.children.at(-1);
                if (last && last.value && typeof last.value === "string") {
                  const matches = last.value.match(blockReferenceRegex);
                  if (matches && matches.length >= 1) {
                    last.value = last.value.slice(0, -matches[0].length);
                    const block = matches[0].slice(1);
                    if (last.value === "") {
                      let idx = (index ?? 1) - 1;
                      while (idx >= 0) {
                        const element = parent?.children.at(idx);
                        if (!element) break;
                        if (element.type !== "element") {
                          idx -= 1;
                        } else {
                          if (!Object.keys(file.data.blocks).includes(block)) {
                            element.properties = {
                              ...element.properties,
                              id: block
                            };
                            file.data.blocks[block] = element;
                          }
                          return;
                        }
                      }
                    } else {
                      if (!Object.keys(file.data.blocks).includes(block)) {
                        node.properties = {
                          ...node.properties,
                          id: block
                        };
                        file.data.blocks[block] = node;
                      }
                    }
                  }
                }
              }
            });
            file.data.htmlAst = tree;
          };
        });
      }
      if (opts.enableYouTubeEmbed) {
        plugins.push(() => {
          return (tree) => {
            visit3(tree, "element", (node) => {
              if (node.tagName === "img" && typeof node.properties.src === "string") {
                const match = node.properties.src.match(ytLinkRegex);
                const videoId = match && match[2].length == 11 ? match[2] : null;
                const playlistId = node.properties.src.match(ytPlaylistLinkRegex)?.[1];
                if (videoId) {
                  node.tagName = "iframe";
                  node.properties = {
                    class: "external-embed youtube",
                    allow: "fullscreen",
                    frameborder: 0,
                    width: "600px",
                    src: playlistId ? `https://www.youtube.com/embed/${videoId}?list=${playlistId}` : `https://www.youtube.com/embed/${videoId}`
                  };
                } else if (playlistId) {
                  node.tagName = "iframe";
                  node.properties = {
                    class: "external-embed youtube",
                    allow: "fullscreen",
                    frameborder: 0,
                    width: "600px",
                    src: `https://www.youtube.com/embed/videoseries?list=${playlistId}`
                  };
                }
              }
            });
          };
        });
      }
      if (opts.enableCheckbox) {
        plugins.push(() => {
          return (tree, _file) => {
            visit3(tree, "element", (node) => {
              if (node.tagName === "input" && node.properties.type === "checkbox") {
                const isChecked = node.properties?.checked ?? false;
                node.properties = {
                  type: "checkbox",
                  disabled: false,
                  checked: isChecked,
                  class: "checkbox-toggle"
                };
              }
            });
          };
        });
      }
      if (opts.mermaid) {
        plugins.push(() => {
          return (tree, _file) => {
            visit3(tree, "element", (node, _idx, parent) => {
              if (node.tagName === "code" && (node.properties?.className ?? [])?.includes("mermaid")) {
                parent.children = [
                  {
                    type: "element",
                    tagName: "button",
                    properties: {
                      className: ["expand-button"],
                      "aria-label": "Expand mermaid diagram",
                      "data-view-component": true
                    },
                    children: [
                      {
                        type: "element",
                        tagName: "svg",
                        properties: {
                          width: 16,
                          height: 16,
                          viewBox: "0 0 16 16",
                          fill: "currentColor"
                        },
                        children: [
                          {
                            type: "element",
                            tagName: "path",
                            properties: {
                              fillRule: "evenodd",
                              d: "M3.72 3.72a.75.75 0 011.06 1.06L2.56 7h10.88l-2.22-2.22a.75.75 0 011.06-1.06l3.5 3.5a.75.75 0 010 1.06l-3.5 3.5a.75.75 0 11-1.06-1.06l2.22-2.22H2.56l2.22 2.22a.75.75 0 11-1.06 1.06l-3.5-3.5a.75.75 0 010-1.06l3.5-3.5z"
                            },
                            children: []
                          }
                        ]
                      }
                    ]
                  },
                  node,
                  {
                    type: "element",
                    tagName: "div",
                    properties: { id: "mermaid-container", role: "dialog" },
                    children: [
                      {
                        type: "element",
                        tagName: "div",
                        properties: { id: "mermaid-space" },
                        children: [
                          {
                            type: "element",
                            tagName: "div",
                            properties: { className: ["mermaid-content"] },
                            children: []
                          }
                        ]
                      }
                    ]
                  }
                ];
              }
            });
          };
        });
      }
      return plugins;
    },
    externalResources() {
      const js = [];
      const css = [];
      if (opts.enableCheckbox) {
        js.push({
          script: checkbox_inline_default,
          loadTime: "afterDOMReady",
          contentType: "inline"
        });
      }
      if (opts.callouts) {
        js.push({
          script: callout_inline_default,
          loadTime: "afterDOMReady",
          contentType: "inline"
        });
      }
      if (opts.mermaid) {
        js.push({
          script: mermaid_inline_default,
          loadTime: "afterDOMReady",
          contentType: "inline",
          moduleType: "module"
        });
        css.push({
          content: mermaid_inline_default2,
          inline: true
        });
      }
      return { js, css };
    }
  };
}, "ObsidianFlavoredMarkdown");

// quartz/plugins/transformers/oxhugofm.ts
import rehypeRaw2 from "rehype-raw";
var relrefRegex = new RegExp(/\[([^\]]+)\]\(\{\{< relref "([^"]+)" >\}\}\)/, "g");
var predefinedHeadingIdRegex = new RegExp(/(.*) {#(?:.*)}/, "g");
var hugoShortcodeRegex = new RegExp(/{{(.*)}}/, "g");
var figureTagRegex = new RegExp(/< ?figure src="(.*)" ?>/, "g");
var inlineLatexRegex = new RegExp(/\\\\\((.+?)\\\\\)/, "g");
var blockLatexRegex = new RegExp(
  /(?:\\begin{equation}|\\\\\(|\\\\\[)([\s\S]*?)(?:\\\\\]|\\\\\)|\\end{equation})/,
  "g"
);
var quartzLatexRegex = new RegExp(/\$\$[\s\S]*?\$\$|\$.*?\$/, "g");

// quartz/plugins/transformers/syntax.ts
import rehypePrettyCode from "rehype-pretty-code";
var defaultOptions7 = {
  theme: {
    light: "github-light",
    dark: "github-dark"
  },
  keepBackground: false
};
var SyntaxHighlighting = /* @__PURE__ */ __name((userOpts) => {
  const opts = { ...defaultOptions7, ...userOpts };
  return {
    name: "SyntaxHighlighting",
    htmlPlugins() {
      return [[rehypePrettyCode, opts]];
    }
  };
}, "SyntaxHighlighting");

// quartz/plugins/transformers/toc.ts
import { visit as visit4 } from "unist-util-visit";
import { toString as toString2 } from "mdast-util-to-string";
import Slugger from "github-slugger";
var defaultOptions8 = {
  maxDepth: 3,
  minEntries: 1,
  showByDefault: true,
  collapseByDefault: false
};
var slugAnchor2 = new Slugger();
var TableOfContents = /* @__PURE__ */ __name((userOpts) => {
  const opts = { ...defaultOptions8, ...userOpts };
  return {
    name: "TableOfContents",
    markdownPlugins() {
      return [
        () => {
          return async (tree, file) => {
            const display = file.data.frontmatter?.enableToc ?? opts.showByDefault;
            if (display) {
              slugAnchor2.reset();
              const toc = [];
              let highestDepth = opts.maxDepth;
              visit4(tree, "heading", (node) => {
                if (node.depth <= opts.maxDepth) {
                  const text = toString2(node);
                  highestDepth = Math.min(highestDepth, node.depth);
                  toc.push({
                    depth: node.depth,
                    text,
                    slug: slugAnchor2.slug(text)
                  });
                }
              });
              if (toc.length > 0 && toc.length > opts.minEntries) {
                file.data.toc = toc.map((entry) => ({
                  ...entry,
                  depth: entry.depth - highestDepth
                }));
                file.data.collapseToc = opts.collapseByDefault;
              }
            }
          };
        }
      ];
    }
  };
}, "TableOfContents");

// quartz/plugins/transformers/linebreaks.ts
import remarkBreaks from "remark-breaks";

// quartz/plugins/transformers/roam.ts
import { visit as visit5 } from "unist-util-visit";
import { findAndReplace as mdastFindReplace2 } from "mdast-util-find-and-replace";
var orRegex = new RegExp(/{{or:(.*?)}}/, "g");
var TODORegex = new RegExp(/{{.*?\bTODO\b.*?}}/, "g");
var DONERegex = new RegExp(/{{.*?\bDONE\b.*?}}/, "g");
var blockquoteRegex = new RegExp(/(\[\[>\]\])\s*(.*)/, "g");
var roamHighlightRegex = new RegExp(/\^\^(.+)\^\^/, "g");
var roamItalicRegex = new RegExp(/__(.+)__/, "g");

// quartz/plugins/filters/draft.ts
var RemoveDrafts = /* @__PURE__ */ __name(() => ({
  name: "RemoveDrafts",
  shouldPublish(_ctx, [_tree, vfile]) {
    const draftFlag = vfile.data?.frontmatter?.draft === true || vfile.data?.frontmatter?.draft === "true";
    return !draftFlag;
  }
}), "RemoveDrafts");

// quartz/plugins/emitters/contentPage.tsx
import path5 from "path";

// quartz/components/Header.tsx
import { jsx } from "preact/jsx-runtime";
var Header = /* @__PURE__ */ __name(({ children }) => {
  return children.length > 0 ? /* @__PURE__ */ jsx("header", { children }) : null;
}, "Header");
Header.css = `
header {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin: 2rem 0;
  gap: 1.5rem;
}

header h1 {
  margin: 0;
  flex: auto;
}
`;
var Header_default = /* @__PURE__ */ __name((() => Header), "default");

// quartz/components/scripts/clipboard.inline.ts
var clipboard_inline_default = "";

// quartz/components/styles/clipboard.scss
var clipboard_default = "";

// quartz/components/Body.tsx
import { jsx as jsx2 } from "preact/jsx-runtime";
var Body = /* @__PURE__ */ __name(({ children }) => {
  return /* @__PURE__ */ jsx2("div", { id: "quartz-body", children });
}, "Body");
Body.afterDOMLoaded = clipboard_inline_default;
Body.css = clipboard_default;
var Body_default = /* @__PURE__ */ __name((() => Body), "default");

// quartz/components/renderPage.tsx
import { render } from "preact-render-to-string";

// quartz/util/resources.tsx
import { randomUUID } from "crypto";
import { jsx as jsx3 } from "preact/jsx-runtime";
function JSResourceToScriptElement(resource, preserve) {
  const scriptType = resource.moduleType ?? "application/javascript";
  const spaPreserve = preserve ?? resource.spaPreserve;
  if (resource.contentType === "external") {
    return /* @__PURE__ */ jsx3("script", { src: resource.src, type: scriptType, "data-persist": spaPreserve }, resource.src);
  } else {
    const content = resource.script;
    return /* @__PURE__ */ jsx3(
      "script",
      {
        type: scriptType,
        "data-persist": spaPreserve,
        dangerouslySetInnerHTML: { __html: content }
      },
      randomUUID()
    );
  }
}
__name(JSResourceToScriptElement, "JSResourceToScriptElement");
function CSSResourceToStyleElement(resource, preserve) {
  const spaPreserve = preserve ?? resource.spaPreserve;
  if (resource.inline ?? false) {
    return /* @__PURE__ */ jsx3("style", { children: resource.content });
  } else {
    return /* @__PURE__ */ jsx3(
      "link",
      {
        href: resource.content,
        rel: "stylesheet",
        type: "text/css",
        "data-persist": spaPreserve
      },
      resource.content
    );
  }
}
__name(CSSResourceToStyleElement, "CSSResourceToStyleElement");
function concatenateResources(...resources) {
  return resources.filter((resource) => resource !== void 0).flat();
}
__name(concatenateResources, "concatenateResources");

// quartz/components/renderPage.tsx
import { visit as visit6 } from "unist-util-visit";
import { styleText as styleText2 } from "util";
import { jsx as jsx4, jsxs } from "preact/jsx-runtime";
var headerRegex = new RegExp(/h[1-6]/);
function pageResources(baseDir, staticResources) {
  const contentIndexPath = joinSegments(baseDir, "static/contentIndex.json");
  const contentIndexScript = `const fetchData = fetch("${contentIndexPath}").then(data => data.json())`;
  const resources = {
    css: [
      {
        content: joinSegments(baseDir, "index.css")
      },
      ...staticResources.css
    ],
    js: [
      {
        src: joinSegments(baseDir, "prescript.js"),
        loadTime: "beforeDOMReady",
        contentType: "external"
      },
      {
        loadTime: "beforeDOMReady",
        contentType: "inline",
        spaPreserve: true,
        script: contentIndexScript
      },
      ...staticResources.js
    ],
    additionalHead: staticResources.additionalHead
  };
  resources.js.push({
    src: joinSegments(baseDir, "postscript.js"),
    loadTime: "afterDOMReady",
    moduleType: "module",
    contentType: "external"
  });
  return resources;
}
__name(pageResources, "pageResources");
function renderTranscludes(root, cfg, slug, componentData, visited) {
  visit6(root, "element", (node, _index, _parent) => {
    if (node.tagName === "blockquote") {
      const classNames2 = node.properties?.className ?? [];
      if (classNames2.includes("transclude")) {
        const inner = node.children[0];
        const transcludeTarget = inner.properties["data-slug"] ?? slug;
        if (visited.has(transcludeTarget)) {
          console.warn(
            styleText2(
              "yellow",
              `Warning: Skipping circular transclusion: ${slug} -> ${transcludeTarget}`
            )
          );
          node.children = [
            {
              type: "element",
              tagName: "p",
              properties: { style: "color: var(--secondary);" },
              children: [
                {
                  type: "text",
                  value: `Circular transclusion detected: ${transcludeTarget}`
                }
              ]
            }
          ];
          return;
        }
        visited.add(transcludeTarget);
        const page = componentData.allFiles.find((f) => f.slug === transcludeTarget);
        if (!page) {
          return;
        }
        let blockRef = node.properties.dataBlock;
        if (blockRef?.startsWith("#^")) {
          blockRef = blockRef.slice("#^".length);
          let blockNode = page.blocks?.[blockRef];
          if (blockNode) {
            if (blockNode.tagName === "li") {
              blockNode = {
                type: "element",
                tagName: "ul",
                properties: {},
                children: [blockNode]
              };
            }
            node.children = [
              normalizeHastElement(blockNode, slug, transcludeTarget),
              {
                type: "element",
                tagName: "a",
                properties: { href: inner.properties?.href, class: ["internal", "transclude-src"] },
                children: [
                  { type: "text", value: i18n(cfg.locale).components.transcludes.linkToOriginal }
                ]
              }
            ];
          }
        } else if (blockRef?.startsWith("#") && page.htmlAst) {
          blockRef = blockRef.slice(1);
          let startIdx = void 0;
          let startDepth = void 0;
          let endIdx = void 0;
          for (const [i, el] of page.htmlAst.children.entries()) {
            if (!(el.type === "element" && el.tagName.match(headerRegex))) continue;
            const depth = Number(el.tagName.substring(1));
            if (startIdx === void 0 || startDepth === void 0) {
              if (el.properties?.id === blockRef) {
                startIdx = i;
                startDepth = depth;
              }
            } else if (depth <= startDepth) {
              endIdx = i;
              break;
            }
          }
          if (startIdx === void 0) {
            return;
          }
          node.children = [
            ...page.htmlAst.children.slice(startIdx, endIdx).map(
              (child) => normalizeHastElement(child, slug, transcludeTarget)
            ),
            {
              type: "element",
              tagName: "a",
              properties: { href: inner.properties?.href, class: ["internal", "transclude-src"] },
              children: [
                { type: "text", value: i18n(cfg.locale).components.transcludes.linkToOriginal }
              ]
            }
          ];
        } else if (page.htmlAst) {
          node.children = [
            {
              type: "element",
              tagName: "h1",
              properties: {},
              children: [
                {
                  type: "text",
                  value: page.frontmatter?.title ?? i18n(cfg.locale).components.transcludes.transcludeOf({
                    targetSlug: page.slug
                  })
                }
              ]
            },
            ...page.htmlAst.children.map(
              (child) => normalizeHastElement(child, slug, transcludeTarget)
            ),
            {
              type: "element",
              tagName: "a",
              properties: { href: inner.properties?.href, class: ["internal", "transclude-src"] },
              children: [
                { type: "text", value: i18n(cfg.locale).components.transcludes.linkToOriginal }
              ]
            }
          ];
        }
      }
    }
  });
}
__name(renderTranscludes, "renderTranscludes");
function renderPage(cfg, slug, componentData, components, pageResources2) {
  const root = clone(componentData.tree);
  const visited = /* @__PURE__ */ new Set([slug]);
  renderTranscludes(root, cfg, slug, componentData, visited);
  componentData.tree = root;
  const {
    head: Head,
    header,
    beforeBody,
    pageBody: Content2,
    afterBody,
    left,
    right,
    footer: Footer
  } = components;
  const Header2 = Header_default();
  const Body2 = Body_default();
  const LeftComponent = /* @__PURE__ */ jsx4("div", { class: "left sidebar", children: left.map((BodyComponent) => /* @__PURE__ */ jsx4(BodyComponent, { ...componentData })) });
  const RightComponent = /* @__PURE__ */ jsx4("div", { class: "right sidebar", children: right.map((BodyComponent) => /* @__PURE__ */ jsx4(BodyComponent, { ...componentData })) });
  const lang = componentData.fileData.frontmatter?.lang ?? cfg.locale?.split("-")[0] ?? "en";
  const direction = i18n(cfg.locale).direction ?? "ltr";
  const doc = /* @__PURE__ */ jsxs("html", { lang, dir: direction, children: [
    /* @__PURE__ */ jsx4(Head, { ...componentData }),
    /* @__PURE__ */ jsx4("body", { "data-slug": slug, children: /* @__PURE__ */ jsx4("div", { id: "quartz-root", class: "page", children: /* @__PURE__ */ jsxs(Body2, { ...componentData, children: [
      LeftComponent,
      /* @__PURE__ */ jsxs("div", { class: "center", children: [
        /* @__PURE__ */ jsxs("div", { class: "page-header", children: [
          /* @__PURE__ */ jsx4(Header2, { ...componentData, children: header.map((HeaderComponent) => /* @__PURE__ */ jsx4(HeaderComponent, { ...componentData })) }),
          /* @__PURE__ */ jsx4("div", { class: "popover-hint", children: beforeBody.map((BodyComponent) => /* @__PURE__ */ jsx4(BodyComponent, { ...componentData })) })
        ] }),
        /* @__PURE__ */ jsx4(Content2, { ...componentData }),
        /* @__PURE__ */ jsx4("hr", {}),
        /* @__PURE__ */ jsx4("div", { class: "page-footer", children: afterBody.map((BodyComponent) => /* @__PURE__ */ jsx4(BodyComponent, { ...componentData })) })
      ] }),
      RightComponent,
      /* @__PURE__ */ jsx4(Footer, { ...componentData })
    ] }) }) }),
    pageResources2.js.filter((resource) => resource.loadTime === "afterDOMReady").map((res) => JSResourceToScriptElement(res, true))
  ] });
  return "<!DOCTYPE html>\n" + render(doc);
}
__name(renderPage, "renderPage");

// quartz/util/jsx.tsx
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { Fragment, jsx as jsx5, jsxs as jsxs2 } from "preact/jsx-runtime";

// quartz/util/trace.ts
import { styleText as styleText3 } from "util";
import process2 from "process";
import { isMainThread } from "workerpool";
var rootFile = /.*at file:/;
function trace(msg, err) {
  let stack = err.stack ?? "";
  const lines = [];
  lines.push("");
  lines.push(
    "\n" + styleText3(["bgRed", "black", "bold"], " ERROR ") + "\n\n" + styleText3("red", ` ${msg}`) + (err.message.length > 0 ? `: ${err.message}` : "")
  );
  let reachedEndOfLegibleTrace = false;
  for (const line of stack.split("\n").slice(1)) {
    if (reachedEndOfLegibleTrace) {
      break;
    }
    if (!line.includes("node_modules")) {
      lines.push(` ${line}`);
      if (rootFile.test(line)) {
        reachedEndOfLegibleTrace = true;
      }
    }
  }
  const traceMsg = lines.join("\n");
  if (!isMainThread) {
    throw new Error(traceMsg);
  } else {
    console.error(traceMsg);
    process2.exit(1);
  }
}
__name(trace, "trace");

// quartz/util/jsx.tsx
import { jsx as jsx6 } from "preact/jsx-runtime";
var customComponents = {
  table: /* @__PURE__ */ __name((props) => /* @__PURE__ */ jsx6("div", { class: "table-container", children: /* @__PURE__ */ jsx6("table", { ...props }) }), "table")
};
function htmlToJsx(fp, tree) {
  try {
    return toJsxRuntime(tree, {
      Fragment,
      jsx: jsx5,
      jsxs: jsxs2,
      elementAttributeNameCase: "html",
      components: customComponents
    });
  } catch (e) {
    trace(`Failed to parse Markdown in \`${fp}\` into JSX`, e);
  }
}
__name(htmlToJsx, "htmlToJsx");

// quartz/components/pages/Content.tsx
import { jsx as jsx7 } from "preact/jsx-runtime";
var Content = /* @__PURE__ */ __name(({ fileData, tree }) => {
  const content = htmlToJsx(fileData.filePath, tree);
  const classes = fileData.frontmatter?.cssclasses ?? [];
  const classString = ["popover-hint", ...classes].join(" ");
  return /* @__PURE__ */ jsx7("article", { class: classString, children: content });
}, "Content");
var Content_default = /* @__PURE__ */ __name((() => Content), "default");

// quartz/components/styles/listPage.scss
var listPage_default = "";

// quartz/components/Date.tsx
import { jsx as jsx8 } from "preact/jsx-runtime";
function getDate(cfg, data) {
  if (!cfg.defaultDateType) {
    throw new Error(
      `Field 'defaultDateType' was not set in the configuration object of quartz.config.ts. See https://quartz.jzhao.xyz/configuration#general-configuration for more details.`
    );
  }
  return data.dates?.[cfg.defaultDateType];
}
__name(getDate, "getDate");
function formatDate(d, locale = "en-US") {
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit"
  });
}
__name(formatDate, "formatDate");
function Date2({ date, locale }) {
  return /* @__PURE__ */ jsx8("time", { datetime: date.toISOString(), children: formatDate(date, locale) });
}
__name(Date2, "Date");

// quartz/components/PageList.tsx
import { jsx as jsx9, jsxs as jsxs3 } from "preact/jsx-runtime";
function byDateAndAlphabeticalFolderFirst(cfg) {
  return (f1, f2) => {
    const f1IsFolder = isFolderPath(f1.slug ?? "");
    const f2IsFolder = isFolderPath(f2.slug ?? "");
    if (f1IsFolder && !f2IsFolder) return -1;
    if (!f1IsFolder && f2IsFolder) return 1;
    if (f1.dates && f2.dates) {
      return getDate(cfg, f2).getTime() - getDate(cfg, f1).getTime();
    } else if (f1.dates && !f2.dates) {
      return -1;
    } else if (!f1.dates && f2.dates) {
      return 1;
    }
    const f1Title = f1.frontmatter?.title.toLowerCase() ?? "";
    const f2Title = f2.frontmatter?.title.toLowerCase() ?? "";
    return f1Title.localeCompare(f2Title);
  };
}
__name(byDateAndAlphabeticalFolderFirst, "byDateAndAlphabeticalFolderFirst");
var PageList = /* @__PURE__ */ __name(({ cfg, fileData, allFiles, limit, sort }) => {
  const sorter = sort ?? byDateAndAlphabeticalFolderFirst(cfg);
  let list = allFiles.sort(sorter);
  if (limit) {
    list = list.slice(0, limit);
  }
  return /* @__PURE__ */ jsx9("ul", { class: "section-ul", children: list.map((page) => {
    const title = page.frontmatter?.title;
    const tags = page.frontmatter?.tags ?? [];
    return /* @__PURE__ */ jsx9("li", { class: "section-li", children: /* @__PURE__ */ jsxs3("div", { class: "section", children: [
      /* @__PURE__ */ jsx9("p", { class: "meta", children: page.dates && /* @__PURE__ */ jsx9(Date2, { date: getDate(cfg, page), locale: cfg.locale }) }),
      /* @__PURE__ */ jsx9("div", { class: "desc", children: /* @__PURE__ */ jsx9("h3", { children: /* @__PURE__ */ jsx9("a", { href: resolveRelative(fileData.slug, page.slug), class: "internal", children: title }) }) }),
      /* @__PURE__ */ jsx9("ul", { class: "tags", children: tags.map((tag) => /* @__PURE__ */ jsx9("li", { children: /* @__PURE__ */ jsx9(
        "a",
        {
          class: "internal tag-link",
          href: resolveRelative(fileData.slug, `tags/${tag}`),
          children: tag
        }
      ) })) })
    ] }) });
  }) });
}, "PageList");
PageList.css = `
.section h3 {
  margin: 0;
}

.section > .tags {
  margin: 0;
}
`;

// quartz/components/pages/TagContent.tsx
import { Fragment as Fragment2, jsx as jsx10, jsxs as jsxs4 } from "preact/jsx-runtime";
var defaultOptions9 = {
  numPages: 10
};
var TagContent_default = /* @__PURE__ */ __name(((opts) => {
  const options2 = { ...defaultOptions9, ...opts };
  const TagContent = /* @__PURE__ */ __name((props) => {
    const { tree, fileData, allFiles, cfg } = props;
    const slug = fileData.slug;
    if (!(slug?.startsWith("tags/") || slug === "tags")) {
      throw new Error(`Component "TagContent" tried to render a non-tag page: ${slug}`);
    }
    const tag = simplifySlug(slug.slice("tags/".length));
    const allPagesWithTag = /* @__PURE__ */ __name((tag2) => allFiles.filter(
      (file) => (file.frontmatter?.tags ?? []).flatMap(getAllSegmentPrefixes).includes(tag2)
    ), "allPagesWithTag");
    const content = tree.children.length === 0 ? fileData.description : htmlToJsx(fileData.filePath, tree);
    const cssClasses = fileData.frontmatter?.cssclasses ?? [];
    const classes = cssClasses.join(" ");
    if (tag === "/") {
      const tags = [
        ...new Set(
          allFiles.flatMap((data) => data.frontmatter?.tags ?? []).flatMap(getAllSegmentPrefixes)
        )
      ].sort((a, b) => a.localeCompare(b));
      const tagItemMap = /* @__PURE__ */ new Map();
      for (const tag2 of tags) {
        tagItemMap.set(tag2, allPagesWithTag(tag2));
      }
      return /* @__PURE__ */ jsxs4("div", { class: "popover-hint", children: [
        /* @__PURE__ */ jsx10("article", { class: classes, children: /* @__PURE__ */ jsx10("p", { children: content }) }),
        /* @__PURE__ */ jsx10("p", { children: i18n(cfg.locale).pages.tagContent.totalTags({ count: tags.length }) }),
        /* @__PURE__ */ jsx10("div", { children: tags.map((tag2) => {
          const pages = tagItemMap.get(tag2);
          const listProps = {
            ...props,
            allFiles: pages
          };
          const contentPage = allFiles.filter((file) => file.slug === `tags/${tag2}`).at(0);
          const root = contentPage?.htmlAst;
          const content2 = !root || root?.children.length === 0 ? contentPage?.description : htmlToJsx(contentPage.filePath, root);
          const tagListingPage = `/tags/${tag2}`;
          const href = resolveRelative(fileData.slug, tagListingPage);
          return /* @__PURE__ */ jsxs4("div", { children: [
            /* @__PURE__ */ jsx10("h2", { children: /* @__PURE__ */ jsx10("a", { class: "internal tag-link", href, children: tag2 }) }),
            content2 && /* @__PURE__ */ jsx10("p", { children: content2 }),
            /* @__PURE__ */ jsxs4("div", { class: "page-listing", children: [
              /* @__PURE__ */ jsxs4("p", { children: [
                i18n(cfg.locale).pages.tagContent.itemsUnderTag({ count: pages.length }),
                pages.length > options2.numPages && /* @__PURE__ */ jsxs4(Fragment2, { children: [
                  " ",
                  /* @__PURE__ */ jsx10("span", { children: i18n(cfg.locale).pages.tagContent.showingFirst({
                    count: options2.numPages
                  }) })
                ] })
              ] }),
              /* @__PURE__ */ jsx10(PageList, { limit: options2.numPages, ...listProps, sort: options2?.sort })
            ] })
          ] });
        }) })
      ] });
    } else {
      const pages = allPagesWithTag(tag);
      const listProps = {
        ...props,
        allFiles: pages
      };
      return /* @__PURE__ */ jsxs4("div", { class: "popover-hint", children: [
        /* @__PURE__ */ jsx10("article", { class: classes, children: content }),
        /* @__PURE__ */ jsxs4("div", { class: "page-listing", children: [
          /* @__PURE__ */ jsx10("p", { children: i18n(cfg.locale).pages.tagContent.itemsUnderTag({ count: pages.length }) }),
          /* @__PURE__ */ jsx10("div", { children: /* @__PURE__ */ jsx10(PageList, { ...listProps, sort: options2?.sort }) })
        ] })
      ] });
    }
  }, "TagContent");
  TagContent.css = concatenateResources(listPage_default, PageList.css);
  return TagContent;
}), "default");

// quartz/util/fileTrie.ts
var FileTrieNode = class _FileTrieNode {
  static {
    __name(this, "FileTrieNode");
  }
  isFolder;
  children;
  slugSegments;
  // prefer showing the file path segment over the slug segment
  // so that folders that dont have index files can be shown as is
  // without dashes in the slug
  fileSegmentHint;
  displayNameOverride;
  data;
  constructor(segments, data) {
    this.children = [];
    this.slugSegments = segments;
    this.data = data ?? null;
    this.isFolder = false;
    this.displayNameOverride = void 0;
  }
  get displayName() {
    const nonIndexTitle = this.data?.title === "index" ? void 0 : this.data?.title;
    return this.displayNameOverride ?? nonIndexTitle ?? this.fileSegmentHint ?? this.slugSegment ?? "";
  }
  set displayName(name) {
    this.displayNameOverride = name;
  }
  get slug() {
    const path11 = joinSegments(...this.slugSegments);
    if (this.isFolder) {
      return joinSegments(path11, "index");
    }
    return path11;
  }
  get slugSegment() {
    return this.slugSegments[this.slugSegments.length - 1];
  }
  makeChild(path11, file) {
    const fullPath = [...this.slugSegments, path11[0]];
    const child = new _FileTrieNode(fullPath, file);
    this.children.push(child);
    return child;
  }
  insert(path11, file) {
    if (path11.length === 0) {
      throw new Error("path is empty");
    }
    this.isFolder = true;
    const segment = path11[0];
    if (path11.length === 1) {
      if (segment === "index") {
        this.data ??= file;
      } else {
        this.makeChild(path11, file);
      }
    } else if (path11.length > 1) {
      const child = this.children.find((c) => c.slugSegment === segment) ?? this.makeChild(path11, void 0);
      const fileParts = file.filePath.split("/");
      child.fileSegmentHint = fileParts.at(-path11.length);
      child.insert(path11.slice(1), file);
    }
  }
  // Add new file to trie
  add(file) {
    this.insert(file.slug.split("/"), file);
  }
  findNode(path11) {
    if (path11.length === 0 || path11.length === 1 && path11[0] === "index") {
      return this;
    }
    return this.children.find((c) => c.slugSegment === path11[0])?.findNode(path11.slice(1));
  }
  ancestryChain(path11) {
    if (path11.length === 0 || path11.length === 1 && path11[0] === "index") {
      return [this];
    }
    const child = this.children.find((c) => c.slugSegment === path11[0]);
    if (!child) {
      return void 0;
    }
    const childPath = child.ancestryChain(path11.slice(1));
    if (!childPath) {
      return void 0;
    }
    return [this, ...childPath];
  }
  /**
   * Filter trie nodes. Behaves similar to `Array.prototype.filter()`, but modifies tree in place
   */
  filter(filterFn) {
    this.children = this.children.filter(filterFn);
    this.children.forEach((child) => child.filter(filterFn));
  }
  /**
   * Map over trie nodes. Behaves similar to `Array.prototype.map()`, but modifies tree in place
   */
  map(mapFn) {
    mapFn(this);
    this.children.forEach((child) => child.map(mapFn));
  }
  /**
   * Sort trie nodes according to sort/compare function
   */
  sort(sortFn) {
    this.children = this.children.sort(sortFn);
    this.children.forEach((e) => e.sort(sortFn));
  }
  static fromEntries(entries) {
    const trie = new _FileTrieNode([]);
    entries.forEach(([, entry]) => trie.add(entry));
    return trie;
  }
  /**
   * Get all entries in the trie
   * in the a flat array including the full path and the node
   */
  entries() {
    const traverse = /* @__PURE__ */ __name((node) => {
      const result = [[node.slug, node]];
      return result.concat(...node.children.map(traverse));
    }, "traverse");
    return traverse(this);
  }
  /**
   * Get all folder paths in the trie
   * @returns array containing folder state for trie
   */
  getFolderPaths() {
    return this.entries().filter(([_, node]) => node.isFolder).map(([path11, _]) => path11);
  }
};

// quartz/util/ctx.ts
function trieFromAllFiles(allFiles) {
  const trie = new FileTrieNode([]);
  allFiles.forEach((file) => {
    if (file.frontmatter) {
      trie.add({
        ...file,
        slug: file.slug,
        title: file.frontmatter.title,
        filePath: file.filePath
      });
    }
  });
  return trie;
}
__name(trieFromAllFiles, "trieFromAllFiles");

// quartz/components/pages/FolderContent.tsx
import { jsx as jsx11, jsxs as jsxs5 } from "preact/jsx-runtime";
var defaultOptions10 = {
  showFolderCount: true,
  showSubfolders: true
};
var FolderContent_default = /* @__PURE__ */ __name(((opts) => {
  const options2 = { ...defaultOptions10, ...opts };
  const FolderContent = /* @__PURE__ */ __name((props) => {
    const { tree, fileData, allFiles, cfg } = props;
    const trie = props.ctx.trie ??= trieFromAllFiles(allFiles);
    const folder = trie.findNode(fileData.slug.split("/"));
    if (!folder) {
      return null;
    }
    const allPagesInFolder = folder.children.map((node) => {
      if (node.data) {
        return node.data;
      }
      if (node.isFolder && options2.showSubfolders) {
        const getMostRecentDates = /* @__PURE__ */ __name(() => {
          let maybeDates = void 0;
          for (const child of node.children) {
            if (child.data?.dates) {
              if (!maybeDates) {
                maybeDates = { ...child.data.dates };
              } else {
                if (child.data.dates.created > maybeDates.created) {
                  maybeDates.created = child.data.dates.created;
                }
                if (child.data.dates.modified > maybeDates.modified) {
                  maybeDates.modified = child.data.dates.modified;
                }
                if (child.data.dates.published > maybeDates.published) {
                  maybeDates.published = child.data.dates.published;
                }
              }
            }
          }
          return maybeDates ?? {
            created: /* @__PURE__ */ new Date(),
            modified: /* @__PURE__ */ new Date(),
            published: /* @__PURE__ */ new Date()
          };
        }, "getMostRecentDates");
        return {
          slug: node.slug,
          dates: getMostRecentDates(),
          frontmatter: {
            title: node.displayName,
            tags: []
          }
        };
      }
    }).filter((page) => page !== void 0) ?? [];
    const cssClasses = fileData.frontmatter?.cssclasses ?? [];
    const classes = cssClasses.join(" ");
    const listProps = {
      ...props,
      sort: options2.sort,
      allFiles: allPagesInFolder
    };
    const content = tree.children.length === 0 ? fileData.description : htmlToJsx(fileData.filePath, tree);
    return /* @__PURE__ */ jsxs5("div", { class: "popover-hint", children: [
      /* @__PURE__ */ jsx11("article", { class: classes, children: content }),
      /* @__PURE__ */ jsxs5("div", { class: "page-listing", children: [
        options2.showFolderCount && /* @__PURE__ */ jsx11("p", { children: i18n(cfg.locale).pages.folderContent.itemsUnderFolder({
          count: allPagesInFolder.length
        }) }),
        /* @__PURE__ */ jsx11("div", { children: /* @__PURE__ */ jsx11(PageList, { ...listProps }) })
      ] })
    ] });
  }, "FolderContent");
  FolderContent.css = concatenateResources(listPage_default, PageList.css);
  return FolderContent;
}), "default");

// quartz/components/pages/404.tsx
import { jsx as jsx12, jsxs as jsxs6 } from "preact/jsx-runtime";
var NotFound = /* @__PURE__ */ __name(({ cfg }) => {
  const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`);
  const baseDir = url.pathname;
  return /* @__PURE__ */ jsxs6("article", { class: "popover-hint", children: [
    /* @__PURE__ */ jsx12("h1", { children: "404" }),
    /* @__PURE__ */ jsx12("p", { children: i18n(cfg.locale).pages.error.notFound }),
    /* @__PURE__ */ jsx12("a", { href: baseDir, children: i18n(cfg.locale).pages.error.home })
  ] });
}, "NotFound");
var __default = /* @__PURE__ */ __name((() => NotFound), "default");

// quartz/components/ArticleTitle.tsx
import { jsx as jsx13 } from "preact/jsx-runtime";
var ArticleTitle = /* @__PURE__ */ __name(({ fileData, displayClass }) => {
  const title = fileData.frontmatter?.title;
  if (title) {
    return /* @__PURE__ */ jsx13("h1", { class: classNames(displayClass, "article-title"), children: title });
  } else {
    return null;
  }
}, "ArticleTitle");
ArticleTitle.css = `
.article-title {
  margin: 2rem 0 0 0;
}
`;
var ArticleTitle_default = /* @__PURE__ */ __name((() => ArticleTitle), "default");

// quartz/components/scripts/darkmode.inline.ts
var darkmode_inline_default = "";

// quartz/components/styles/darkmode.scss
var darkmode_default = "";

// quartz/components/Darkmode.tsx
import { jsx as jsx14, jsxs as jsxs7 } from "preact/jsx-runtime";
var Darkmode = /* @__PURE__ */ __name(({ displayClass, cfg }) => {
  return /* @__PURE__ */ jsxs7("button", { class: classNames(displayClass, "darkmode"), children: [
    /* @__PURE__ */ jsxs7(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        xmlnsXlink: "http://www.w3.org/1999/xlink",
        version: "1.1",
        class: "dayIcon",
        x: "0px",
        y: "0px",
        viewBox: "0 0 35 35",
        style: "enable-background:new 0 0 35 35",
        xmlSpace: "preserve",
        "aria-label": i18n(cfg.locale).components.themeToggle.darkMode,
        children: [
          /* @__PURE__ */ jsx14("title", { children: i18n(cfg.locale).components.themeToggle.darkMode }),
          /* @__PURE__ */ jsx14("path", { d: "M6,17.5C6,16.672,5.328,16,4.5,16h-3C0.672,16,0,16.672,0,17.5    S0.672,19,1.5,19h3C5.328,19,6,18.328,6,17.5z M7.5,26c-0.414,0-0.789,0.168-1.061,0.439l-2,2C4.168,28.711,4,29.086,4,29.5    C4,30.328,4.671,31,5.5,31c0.414,0,0.789-0.168,1.06-0.44l2-2C8.832,28.289,9,27.914,9,27.5C9,26.672,8.329,26,7.5,26z M17.5,6    C18.329,6,19,5.328,19,4.5v-3C19,0.672,18.329,0,17.5,0S16,0.672,16,1.5v3C16,5.328,16.671,6,17.5,6z M27.5,9    c0.414,0,0.789-0.168,1.06-0.439l2-2C30.832,6.289,31,5.914,31,5.5C31,4.672,30.329,4,29.5,4c-0.414,0-0.789,0.168-1.061,0.44    l-2,2C26.168,6.711,26,7.086,26,7.5C26,8.328,26.671,9,27.5,9z M6.439,8.561C6.711,8.832,7.086,9,7.5,9C8.328,9,9,8.328,9,7.5    c0-0.414-0.168-0.789-0.439-1.061l-2-2C6.289,4.168,5.914,4,5.5,4C4.672,4,4,4.672,4,5.5c0,0.414,0.168,0.789,0.439,1.06    L6.439,8.561z M33.5,16h-3c-0.828,0-1.5,0.672-1.5,1.5s0.672,1.5,1.5,1.5h3c0.828,0,1.5-0.672,1.5-1.5S34.328,16,33.5,16z     M28.561,26.439C28.289,26.168,27.914,26,27.5,26c-0.828,0-1.5,0.672-1.5,1.5c0,0.414,0.168,0.789,0.439,1.06l2,2    C28.711,30.832,29.086,31,29.5,31c0.828,0,1.5-0.672,1.5-1.5c0-0.414-0.168-0.789-0.439-1.061L28.561,26.439z M17.5,29    c-0.829,0-1.5,0.672-1.5,1.5v3c0,0.828,0.671,1.5,1.5,1.5s1.5-0.672,1.5-1.5v-3C19,29.672,18.329,29,17.5,29z M17.5,7    C11.71,7,7,11.71,7,17.5S11.71,28,17.5,28S28,23.29,28,17.5S23.29,7,17.5,7z M17.5,25c-4.136,0-7.5-3.364-7.5-7.5    c0-4.136,3.364-7.5,7.5-7.5c4.136,0,7.5,3.364,7.5,7.5C25,21.636,21.636,25,17.5,25z" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs7(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        xmlnsXlink: "http://www.w3.org/1999/xlink",
        version: "1.1",
        class: "nightIcon",
        x: "0px",
        y: "0px",
        viewBox: "0 0 100 100",
        style: "enable-background:new 0 0 100 100",
        xmlSpace: "preserve",
        "aria-label": i18n(cfg.locale).components.themeToggle.lightMode,
        children: [
          /* @__PURE__ */ jsx14("title", { children: i18n(cfg.locale).components.themeToggle.lightMode }),
          /* @__PURE__ */ jsx14("path", { d: "M96.76,66.458c-0.853-0.852-2.15-1.064-3.23-0.534c-6.063,2.991-12.858,4.571-19.655,4.571  C62.022,70.495,50.88,65.88,42.5,57.5C29.043,44.043,25.658,23.536,34.076,6.47c0.532-1.08,0.318-2.379-0.534-3.23  c-0.851-0.852-2.15-1.064-3.23-0.534c-4.918,2.427-9.375,5.619-13.246,9.491c-9.447,9.447-14.65,22.008-14.65,35.369  c0,13.36,5.203,25.921,14.65,35.368s22.008,14.65,35.368,14.65c13.361,0,25.921-5.203,35.369-14.65  c3.872-3.871,7.064-8.328,9.491-13.246C97.826,68.608,97.611,67.309,96.76,66.458z" })
        ]
      }
    )
  ] });
}, "Darkmode");
Darkmode.beforeDOMLoaded = darkmode_inline_default;
Darkmode.css = darkmode_default;
var Darkmode_default = /* @__PURE__ */ __name((() => Darkmode), "default");

// quartz/components/scripts/readermode.inline.ts
var readermode_inline_default = "";

// quartz/components/styles/readermode.scss
var readermode_default = "";

// quartz/components/ReaderMode.tsx
import { jsx as jsx15, jsxs as jsxs8 } from "preact/jsx-runtime";
var ReaderMode = /* @__PURE__ */ __name(({ displayClass, cfg }) => {
  return /* @__PURE__ */ jsx15("button", { class: classNames(displayClass, "readermode"), children: /* @__PURE__ */ jsxs8(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      xmlnsXlink: "http://www.w3.org/1999/xlink",
      version: "1.1",
      class: "readerIcon",
      fill: "currentColor",
      stroke: "currentColor",
      "stroke-width": "0.2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      width: "64px",
      height: "64px",
      viewBox: "0 0 24 24",
      "aria-label": i18n(cfg.locale).components.readerMode.title,
      children: [
        /* @__PURE__ */ jsx15("title", { children: i18n(cfg.locale).components.readerMode.title }),
        /* @__PURE__ */ jsx15("g", { transform: "translate(-1.8, -1.8) scale(1.15, 1.2)", children: /* @__PURE__ */ jsx15("path", { d: "M8.9891247,2.5 C10.1384702,2.5 11.2209868,2.96705384 12.0049645,3.76669482 C12.7883914,2.96705384 13.8709081,2.5 15.0202536,2.5 L18.7549359,2.5 C19.1691495,2.5 19.5049359,2.83578644 19.5049359,3.25 L19.5046891,4.004 L21.2546891,4.00457396 C21.6343849,4.00457396 21.9481801,4.28672784 21.9978425,4.6528034 L22.0046891,4.75457396 L22.0046891,20.25 C22.0046891,20.6296958 21.7225353,20.943491 21.3564597,20.9931534 L21.2546891,21 L2.75468914,21 C2.37499337,21 2.06119817,20.7178461 2.01153575,20.3517706 L2.00468914,20.25 L2.00468914,4.75457396 C2.00468914,4.37487819 2.28684302,4.061083 2.65291858,4.01142057 L2.75468914,4.00457396 L4.50368914,4.004 L4.50444233,3.25 C4.50444233,2.87030423 4.78659621,2.55650904 5.15267177,2.50684662 L5.25444233,2.5 L8.9891247,2.5 Z M4.50368914,5.504 L3.50468914,5.504 L3.50468914,19.5 L10.9478955,19.4998273 C10.4513189,18.9207296 9.73864328,18.5588115 8.96709342,18.5065584 L8.77307039,18.5 L5.25444233,18.5 C4.87474657,18.5 4.56095137,18.2178461 4.51128895,17.8517706 L4.50444233,17.75 L4.50368914,5.504 Z M19.5049359,17.75 C19.5049359,18.1642136 19.1691495,18.5 18.7549359,18.5 L15.2363079,18.5 C14.3910149,18.5 13.5994408,18.8724714 13.0614828,19.4998273 L20.5046891,19.5 L20.5046891,5.504 L19.5046891,5.504 L19.5049359,17.75 Z M18.0059359,3.999 L15.0202536,4 L14.8259077,4.00692283 C13.9889509,4.06666544 13.2254227,4.50975805 12.7549359,5.212 L12.7549359,17.777 L12.7782651,17.7601316 C13.4923805,17.2719483 14.3447024,17 15.2363079,17 L18.0059359,16.999 L18.0056891,4.798 L18.0033792,4.75457396 L18.0056891,4.71 L18.0059359,3.999 Z M8.9891247,4 L6.00368914,3.999 L6.00599909,4.75457396 L6.00599909,4.75457396 L6.00368914,4.783 L6.00368914,16.999 L8.77307039,17 C9.57551536,17 10.3461406,17.2202781 11.0128313,17.6202194 L11.2536891,17.776 L11.2536891,5.211 C10.8200889,4.56369974 10.1361548,4.13636104 9.37521067,4.02745763 L9.18347055,4.00692283 L8.9891247,4 Z" }) })
      ]
    }
  ) });
}, "ReaderMode");
ReaderMode.beforeDOMLoaded = readermode_inline_default;
ReaderMode.css = readermode_default;
var ReaderMode_default = /* @__PURE__ */ __name((() => ReaderMode), "default");

// quartz/util/theme.ts
var DEFAULT_SANS_SERIF = 'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';
var DEFAULT_MONO = "ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace";
function getFontSpecificationName(spec) {
  if (typeof spec === "string") {
    return spec;
  }
  return spec.name;
}
__name(getFontSpecificationName, "getFontSpecificationName");
function formatFontSpecification(type, spec) {
  if (typeof spec === "string") {
    spec = { name: spec };
  }
  const defaultIncludeWeights = type === "header" ? [400, 700] : [400, 600];
  const defaultIncludeItalic = type === "body";
  const weights = spec.weights ?? defaultIncludeWeights;
  const italic = spec.includeItalic ?? defaultIncludeItalic;
  const features = [];
  if (italic) {
    features.push("ital");
  }
  if (weights.length > 1) {
    const weightSpec = italic ? weights.flatMap((w) => [`0,${w}`, `1,${w}`]).sort().join(";") : weights.join(";");
    features.push(`wght@${weightSpec}`);
  }
  if (features.length > 0) {
    return `${spec.name}:${features.join(",")}`;
  }
  return spec.name;
}
__name(formatFontSpecification, "formatFontSpecification");
function googleFontHref(theme) {
  const { header, body, code } = theme.typography;
  const headerFont = formatFontSpecification("header", header);
  const bodyFont = formatFontSpecification("body", body);
  const codeFont = formatFontSpecification("code", code);
  return `https://fonts.googleapis.com/css2?family=${headerFont}&family=${bodyFont}&family=${codeFont}&display=swap`;
}
__name(googleFontHref, "googleFontHref");
function googleFontSubsetHref(theme, text) {
  const title = theme.typography.title || theme.typography.header;
  const titleFont = formatFontSpecification("title", title);
  return `https://fonts.googleapis.com/css2?family=${titleFont}&text=${encodeURIComponent(text)}&display=swap`;
}
__name(googleFontSubsetHref, "googleFontSubsetHref");
var fontMimeMap = {
  truetype: "ttf",
  woff: "woff",
  woff2: "woff2",
  opentype: "otf"
};
async function processGoogleFonts(stylesheet, baseUrl) {
  const fontSourceRegex = /url\((https:\/\/fonts.gstatic.com\/.+(?:\/|(?:kit=))(.+?)[.&].+?)\)\sformat\('(\w+?)'\);/g;
  const fontFiles = [];
  let processedStylesheet = stylesheet;
  let match;
  while ((match = fontSourceRegex.exec(stylesheet)) !== null) {
    const url = match[1];
    const filename = match[2];
    const extension = fontMimeMap[match[3].toLowerCase()];
    const staticUrl = `https://${baseUrl}/static/fonts/${filename}.${extension}`;
    processedStylesheet = processedStylesheet.replace(url, staticUrl);
    fontFiles.push({ url, filename, extension });
  }
  return { processedStylesheet, fontFiles };
}
__name(processGoogleFonts, "processGoogleFonts");
function joinStyles(theme, ...stylesheet) {
  return `
${stylesheet.join("\n\n")}

:root {
  --light: ${theme.colors.lightMode.light};
  --lightgray: ${theme.colors.lightMode.lightgray};
  --gray: ${theme.colors.lightMode.gray};
  --darkgray: ${theme.colors.lightMode.darkgray};
  --dark: ${theme.colors.lightMode.dark};
  --secondary: ${theme.colors.lightMode.secondary};
  --tertiary: ${theme.colors.lightMode.tertiary};
  --highlight: ${theme.colors.lightMode.highlight};
  --textHighlight: ${theme.colors.lightMode.textHighlight};

  --titleFont: "${getFontSpecificationName(theme.typography.title || theme.typography.header)}", ${DEFAULT_SANS_SERIF};
  --headerFont: "${getFontSpecificationName(theme.typography.header)}", ${DEFAULT_SANS_SERIF};
  --bodyFont: "${getFontSpecificationName(theme.typography.body)}", ${DEFAULT_SANS_SERIF};
  --codeFont: "${getFontSpecificationName(theme.typography.code)}", ${DEFAULT_MONO};
}

:root[saved-theme="dark"] {
  --light: ${theme.colors.darkMode.light};
  --lightgray: ${theme.colors.darkMode.lightgray};
  --gray: ${theme.colors.darkMode.gray};
  --darkgray: ${theme.colors.darkMode.darkgray};
  --dark: ${theme.colors.darkMode.dark};
  --secondary: ${theme.colors.darkMode.secondary};
  --tertiary: ${theme.colors.darkMode.tertiary};
  --highlight: ${theme.colors.darkMode.highlight};
  --textHighlight: ${theme.colors.darkMode.textHighlight};
}
`;
}
__name(joinStyles, "joinStyles");

// quartz/util/og.tsx
import readingTime from "reading-time";
import { jsx as jsx16, jsxs as jsxs9 } from "preact/jsx-runtime";

// quartz/plugins/emitters/ogImage.tsx
import sharp from "sharp";
import satori from "satori";

// quartz/util/emoji.ts
var U200D = String.fromCharCode(8205);

// quartz/plugins/emitters/helpers.ts
import path4 from "path";
import fs2 from "fs";
var write = /* @__PURE__ */ __name(async ({ ctx, slug, ext, content }) => {
  const pathToPage = joinSegments(ctx.argv.output, slug + ext);
  const dir = path4.dirname(pathToPage);
  await fs2.promises.mkdir(dir, { recursive: true });
  await fs2.promises.writeFile(pathToPage, content);
  return pathToPage;
}, "write");

// quartz/plugins/emitters/ogImage.tsx
import { Fragment as Fragment3, jsx as jsx17, jsxs as jsxs10 } from "preact/jsx-runtime";
var CustomOgImagesEmitterName = "CustomOgImages";

// quartz/components/Head.tsx
import { Fragment as Fragment4, jsx as jsx18, jsxs as jsxs11 } from "preact/jsx-runtime";
var Head_default = /* @__PURE__ */ __name((() => {
  const Head = /* @__PURE__ */ __name(({
    cfg,
    fileData,
    externalResources,
    ctx
  }) => {
    const titleSuffix = cfg.pageTitleSuffix ?? "";
    const title = (fileData.frontmatter?.title ?? i18n(cfg.locale).propertyDefaults.title) + titleSuffix;
    const description = fileData.frontmatter?.socialDescription ?? fileData.frontmatter?.description ?? unescapeHTML(fileData.description?.trim() ?? i18n(cfg.locale).propertyDefaults.description);
    const { css, js, additionalHead } = externalResources;
    const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`);
    const path11 = url.pathname;
    const baseDir = fileData.slug === "404" ? path11 : pathToRoot(fileData.slug);
    const iconPath = joinSegments(baseDir, "static/icon.png");
    const socialUrl = fileData.slug === "404" ? url.toString() : joinSegments(url.toString(), fileData.slug);
    const usesCustomOgImage = ctx.cfg.plugins.emitters.some(
      (e) => e.name === CustomOgImagesEmitterName
    );
    const ogImageDefaultPath = `https://${cfg.baseUrl}/static/og-image.png`;
    return /* @__PURE__ */ jsxs11("head", { children: [
      /* @__PURE__ */ jsx18("title", { children: title }),
      /* @__PURE__ */ jsx18("meta", { charSet: "utf-8" }),
      cfg.theme.cdnCaching && cfg.theme.fontOrigin === "googleFonts" && /* @__PURE__ */ jsxs11(Fragment4, { children: [
        /* @__PURE__ */ jsx18("link", { rel: "preconnect", href: "https://fonts.googleapis.com" }),
        /* @__PURE__ */ jsx18("link", { rel: "preconnect", href: "https://fonts.gstatic.com" }),
        /* @__PURE__ */ jsx18("link", { rel: "stylesheet", href: googleFontHref(cfg.theme) }),
        cfg.theme.typography.title && /* @__PURE__ */ jsx18("link", { rel: "stylesheet", href: googleFontSubsetHref(cfg.theme, cfg.pageTitle) })
      ] }),
      /* @__PURE__ */ jsx18("link", { rel: "preconnect", href: "https://cdnjs.cloudflare.com", crossOrigin: "anonymous" }),
      /* @__PURE__ */ jsx18("meta", { name: "viewport", content: "width=device-width, initial-scale=1.0" }),
      /* @__PURE__ */ jsx18("meta", { name: "og:site_name", content: cfg.pageTitle }),
      /* @__PURE__ */ jsx18("meta", { property: "og:title", content: title }),
      /* @__PURE__ */ jsx18("meta", { property: "og:type", content: "website" }),
      /* @__PURE__ */ jsx18("meta", { name: "twitter:card", content: "summary_large_image" }),
      /* @__PURE__ */ jsx18("meta", { name: "twitter:title", content: title }),
      /* @__PURE__ */ jsx18("meta", { name: "twitter:description", content: description }),
      /* @__PURE__ */ jsx18("meta", { property: "og:description", content: description }),
      /* @__PURE__ */ jsx18("meta", { property: "og:image:alt", content: description }),
      !usesCustomOgImage && /* @__PURE__ */ jsxs11(Fragment4, { children: [
        /* @__PURE__ */ jsx18("meta", { property: "og:image", content: ogImageDefaultPath }),
        /* @__PURE__ */ jsx18("meta", { property: "og:image:url", content: ogImageDefaultPath }),
        /* @__PURE__ */ jsx18("meta", { name: "twitter:image", content: ogImageDefaultPath }),
        /* @__PURE__ */ jsx18(
          "meta",
          {
            property: "og:image:type",
            content: `image/${getFileExtension(ogImageDefaultPath) ?? "png"}`
          }
        )
      ] }),
      cfg.baseUrl && /* @__PURE__ */ jsxs11(Fragment4, { children: [
        /* @__PURE__ */ jsx18("meta", { property: "twitter:domain", content: cfg.baseUrl }),
        /* @__PURE__ */ jsx18("meta", { property: "og:url", content: socialUrl }),
        /* @__PURE__ */ jsx18("meta", { property: "twitter:url", content: socialUrl })
      ] }),
      /* @__PURE__ */ jsx18("link", { rel: "icon", href: iconPath }),
      /* @__PURE__ */ jsx18("meta", { name: "description", content: description }),
      /* @__PURE__ */ jsx18("meta", { name: "generator", content: "Quartz" }),
      css.map((resource) => CSSResourceToStyleElement(resource, true)),
      js.filter((resource) => resource.loadTime === "beforeDOMReady").map((res) => JSResourceToScriptElement(res, true)),
      additionalHead.map((resource) => {
        if (typeof resource === "function") {
          return resource(fileData);
        } else {
          return resource;
        }
      })
    ] });
  }, "Head");
  return Head;
}), "default");

// quartz/components/PageTitle.tsx
import { jsx as jsx19 } from "preact/jsx-runtime";
var PageTitle = /* @__PURE__ */ __name(({ fileData, cfg, displayClass }) => {
  const title = cfg?.pageTitle ?? i18n(cfg.locale).propertyDefaults.title;
  const baseDir = pathToRoot(fileData.slug);
  return /* @__PURE__ */ jsx19("h2", { class: classNames(displayClass, "page-title"), children: /* @__PURE__ */ jsx19("a", { href: baseDir, children: title }) });
}, "PageTitle");
PageTitle.css = `
.page-title {
  font-size: 1.75rem;
  margin: 0;
  font-family: var(--titleFont);
}
`;
var PageTitle_default = /* @__PURE__ */ __name((() => PageTitle), "default");

// quartz/components/ContentMeta.tsx
import readingTime2 from "reading-time";

// quartz/components/styles/contentMeta.scss
var contentMeta_default = "";

// quartz/components/ContentMeta.tsx
import { jsx as jsx20 } from "preact/jsx-runtime";
var defaultOptions11 = {
  showReadingTime: true,
  showComma: true
};
var ContentMeta_default = /* @__PURE__ */ __name(((opts) => {
  const options2 = { ...defaultOptions11, ...opts };
  function ContentMetadata({ cfg, fileData, displayClass }) {
    const text = fileData.text;
    if (text) {
      const segments = [];
      if (fileData.dates) {
        segments.push(/* @__PURE__ */ jsx20(Date2, { date: getDate(cfg, fileData), locale: cfg.locale }));
      }
      if (options2.showReadingTime) {
        const { minutes, words: _words } = readingTime2(text);
        const displayedTime = i18n(cfg.locale).components.contentMeta.readingTime({
          minutes: Math.ceil(minutes)
        });
        segments.push(/* @__PURE__ */ jsx20("span", { children: displayedTime }));
      }
      return /* @__PURE__ */ jsx20("p", { "show-comma": options2.showComma, class: classNames(displayClass, "content-meta"), children: segments });
    } else {
      return null;
    }
  }
  __name(ContentMetadata, "ContentMetadata");
  ContentMetadata.css = contentMeta_default;
  return ContentMetadata;
}), "default");

// quartz/components/Spacer.tsx
import { jsx as jsx21 } from "preact/jsx-runtime";
function Spacer({ displayClass }) {
  return /* @__PURE__ */ jsx21("div", { class: classNames(displayClass, "spacer") });
}
__name(Spacer, "Spacer");
var Spacer_default = /* @__PURE__ */ __name((() => Spacer), "default");

// quartz/components/styles/legacyToc.scss
var legacyToc_default = "";

// quartz/components/styles/toc.scss
var toc_default = "";

// quartz/components/scripts/toc.inline.ts
var toc_inline_default = "";

// quartz/components/OverflowList.tsx
import { jsx as jsx22, jsxs as jsxs12 } from "preact/jsx-runtime";
var OverflowList = /* @__PURE__ */ __name(({
  children,
  ...props
}) => {
  return /* @__PURE__ */ jsxs12("ul", { ...props, class: [props.class, "overflow"].filter(Boolean).join(" "), id: props.id, children: [
    children,
    /* @__PURE__ */ jsx22("li", { class: "overflow-end" })
  ] });
}, "OverflowList");
var numLists = 0;
var OverflowList_default = /* @__PURE__ */ __name(() => {
  const id = `list-${numLists++}`;
  return {
    OverflowList: /* @__PURE__ */ __name((props) => /* @__PURE__ */ jsx22(OverflowList, { ...props, id }), "OverflowList"),
    overflowListAfterDOMLoaded: `
document.addEventListener("nav", (e) => {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const parentUl = entry.target.parentElement
      if (!parentUl) return
      if (entry.isIntersecting) {
        parentUl.classList.remove("gradient-active")
      } else {
        parentUl.classList.add("gradient-active")
      }
    }
  })

  const ul = document.getElementById("${id}")
  if (!ul) return

  const end = ul.querySelector(".overflow-end")
  if (!end) return

  observer.observe(end)
  window.addCleanup(() => observer.disconnect())
})
`
  };
}, "default");

// quartz/components/TableOfContents.tsx
import { jsx as jsx23, jsxs as jsxs13 } from "preact/jsx-runtime";
var defaultOptions12 = {
  layout: "modern"
};
var numTocs = 0;
var TableOfContents_default = /* @__PURE__ */ __name(((opts) => {
  const layout = opts?.layout ?? defaultOptions12.layout;
  const { OverflowList: OverflowList2, overflowListAfterDOMLoaded } = OverflowList_default();
  const TableOfContents2 = /* @__PURE__ */ __name(({
    fileData,
    displayClass,
    cfg
  }) => {
    if (!fileData.toc) {
      return null;
    }
    const id = `toc-${numTocs++}`;
    return /* @__PURE__ */ jsxs13("div", { class: classNames(displayClass, "toc"), children: [
      /* @__PURE__ */ jsxs13(
        "button",
        {
          type: "button",
          class: fileData.collapseToc ? "collapsed toc-header" : "toc-header",
          "aria-controls": id,
          "aria-expanded": !fileData.collapseToc,
          children: [
            /* @__PURE__ */ jsx23("h3", { children: i18n(cfg.locale).components.tableOfContents.title }),
            /* @__PURE__ */ jsx23(
              "svg",
              {
                xmlns: "http://www.w3.org/2000/svg",
                width: "24",
                height: "24",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                "stroke-width": "2",
                "stroke-linecap": "round",
                "stroke-linejoin": "round",
                class: "fold",
                children: /* @__PURE__ */ jsx23("polyline", { points: "6 9 12 15 18 9" })
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ jsx23(
        OverflowList2,
        {
          id,
          class: fileData.collapseToc ? "collapsed toc-content" : "toc-content",
          children: fileData.toc.map((tocEntry) => /* @__PURE__ */ jsx23("li", { class: `depth-${tocEntry.depth}`, children: /* @__PURE__ */ jsx23("a", { href: `#${tocEntry.slug}`, "data-for": tocEntry.slug, children: tocEntry.text }) }, tocEntry.slug))
        }
      )
    ] });
  }, "TableOfContents");
  TableOfContents2.css = toc_default;
  TableOfContents2.afterDOMLoaded = concatenateResources(toc_inline_default, overflowListAfterDOMLoaded);
  const LegacyTableOfContents = /* @__PURE__ */ __name(({ fileData, cfg }) => {
    if (!fileData.toc) {
      return null;
    }
    return /* @__PURE__ */ jsxs13("details", { class: "toc", open: !fileData.collapseToc, children: [
      /* @__PURE__ */ jsx23("summary", { children: /* @__PURE__ */ jsx23("h3", { children: i18n(cfg.locale).components.tableOfContents.title }) }),
      /* @__PURE__ */ jsx23("ul", { children: fileData.toc.map((tocEntry) => /* @__PURE__ */ jsx23("li", { class: `depth-${tocEntry.depth}`, children: /* @__PURE__ */ jsx23("a", { href: `#${tocEntry.slug}`, "data-for": tocEntry.slug, children: tocEntry.text }) }, tocEntry.slug)) })
    ] });
  }, "LegacyTableOfContents");
  LegacyTableOfContents.css = legacyToc_default;
  return layout === "modern" ? TableOfContents2 : LegacyTableOfContents;
}), "default");

// quartz/components/styles/explorer.scss
var explorer_default = "";

// quartz/components/scripts/explorer.inline.ts
var explorer_inline_default = "";

// quartz/components/Explorer.tsx
import { jsx as jsx24, jsxs as jsxs14 } from "preact/jsx-runtime";
var defaultOptions13 = {
  folderDefaultState: "collapsed",
  folderClickBehavior: "link",
  useSavedState: true,
  mapFn: /* @__PURE__ */ __name((node) => {
    return node;
  }, "mapFn"),
  sortFn: /* @__PURE__ */ __name((a, b) => {
    if (!a.isFolder && !b.isFolder || a.isFolder && b.isFolder) {
      return a.displayName.localeCompare(b.displayName, void 0, {
        numeric: true,
        sensitivity: "base"
      });
    }
    if (!a.isFolder && b.isFolder) {
      return 1;
    } else {
      return -1;
    }
  }, "sortFn"),
  filterFn: /* @__PURE__ */ __name((node) => node.slugSegment !== "tags", "filterFn"),
  order: ["filter", "map", "sort"]
};
var numExplorers = 0;
var Explorer_default = /* @__PURE__ */ __name(((userOpts) => {
  const opts = { ...defaultOptions13, ...userOpts };
  const { OverflowList: OverflowList2, overflowListAfterDOMLoaded } = OverflowList_default();
  const Explorer = /* @__PURE__ */ __name(({ cfg, displayClass }) => {
    const id = `explorer-${numExplorers++}`;
    return /* @__PURE__ */ jsxs14(
      "div",
      {
        class: classNames(displayClass, "explorer"),
        "data-behavior": opts.folderClickBehavior,
        "data-collapsed": opts.folderDefaultState,
        "data-savestate": opts.useSavedState,
        "data-data-fns": JSON.stringify({
          order: opts.order,
          sortFn: opts.sortFn.toString(),
          filterFn: opts.filterFn.toString(),
          mapFn: opts.mapFn.toString()
        }),
        children: [
          /* @__PURE__ */ jsx24(
            "button",
            {
              type: "button",
              class: "explorer-toggle mobile-explorer hide-until-loaded",
              "data-mobile": true,
              "aria-controls": id,
              children: /* @__PURE__ */ jsxs14(
                "svg",
                {
                  xmlns: "http://www.w3.org/2000/svg",
                  width: "24",
                  height: "24",
                  viewBox: "0 0 24 24",
                  "stroke-width": "2",
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round",
                  class: "lucide-menu",
                  children: [
                    /* @__PURE__ */ jsx24("line", { x1: "4", x2: "20", y1: "12", y2: "12" }),
                    /* @__PURE__ */ jsx24("line", { x1: "4", x2: "20", y1: "6", y2: "6" }),
                    /* @__PURE__ */ jsx24("line", { x1: "4", x2: "20", y1: "18", y2: "18" })
                  ]
                }
              )
            }
          ),
          /* @__PURE__ */ jsxs14(
            "button",
            {
              type: "button",
              class: "title-button explorer-toggle desktop-explorer",
              "data-mobile": false,
              "aria-expanded": true,
              children: [
                /* @__PURE__ */ jsx24("h2", { children: opts.title ?? i18n(cfg.locale).components.explorer.title }),
                /* @__PURE__ */ jsx24(
                  "svg",
                  {
                    xmlns: "http://www.w3.org/2000/svg",
                    width: "14",
                    height: "14",
                    viewBox: "5 8 14 8",
                    fill: "none",
                    stroke: "currentColor",
                    "stroke-width": "2",
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                    class: "fold",
                    children: /* @__PURE__ */ jsx24("polyline", { points: "6 9 12 15 18 9" })
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsx24("div", { id, class: "explorer-content", "aria-expanded": false, role: "group", children: /* @__PURE__ */ jsx24(OverflowList2, { class: "explorer-ul" }) }),
          /* @__PURE__ */ jsx24("template", { id: "template-file", children: /* @__PURE__ */ jsx24("li", { children: /* @__PURE__ */ jsx24("a", { href: "#" }) }) }),
          /* @__PURE__ */ jsx24("template", { id: "template-folder", children: /* @__PURE__ */ jsxs14("li", { children: [
            /* @__PURE__ */ jsxs14("div", { class: "folder-container", children: [
              /* @__PURE__ */ jsx24(
                "svg",
                {
                  xmlns: "http://www.w3.org/2000/svg",
                  width: "12",
                  height: "12",
                  viewBox: "5 8 14 8",
                  fill: "none",
                  stroke: "currentColor",
                  "stroke-width": "2",
                  "stroke-linecap": "round",
                  "stroke-linejoin": "round",
                  class: "folder-icon",
                  children: /* @__PURE__ */ jsx24("polyline", { points: "6 9 12 15 18 9" })
                }
              ),
              /* @__PURE__ */ jsx24("div", { children: /* @__PURE__ */ jsx24("button", { class: "folder-button", children: /* @__PURE__ */ jsx24("span", { class: "folder-title" }) }) })
            ] }),
            /* @__PURE__ */ jsx24("div", { class: "folder-outer", children: /* @__PURE__ */ jsx24("ul", { class: "content" }) })
          ] }) })
        ]
      }
    );
  }, "Explorer");
  Explorer.css = explorer_default;
  Explorer.afterDOMLoaded = concatenateResources(explorer_inline_default, overflowListAfterDOMLoaded);
  return Explorer;
}), "default");

// quartz/components/TagList.tsx
import { jsx as jsx25 } from "preact/jsx-runtime";
var TagList = /* @__PURE__ */ __name(({ fileData, displayClass }) => {
  const tags = fileData.frontmatter?.tags;
  if (tags && tags.length > 0) {
    return /* @__PURE__ */ jsx25("ul", { class: classNames(displayClass, "tags"), children: tags.map((tag) => {
      const linkDest = resolveRelative(fileData.slug, `tags/${tag}`);
      return /* @__PURE__ */ jsx25("li", { children: /* @__PURE__ */ jsx25("a", { href: linkDest, class: "internal tag-link", children: tag }) });
    }) });
  } else {
    return null;
  }
}, "TagList");
TagList.css = `
.tags {
  list-style: none;
  display: flex;
  padding-left: 0;
  gap: 0.4rem;
  margin: 1rem 0;
  flex-wrap: wrap;
}

.section-li > .section > .tags {
  justify-content: flex-end;
}
  
.tags > li {
  display: inline-block;
  white-space: nowrap;
  margin: 0;
  overflow-wrap: normal;
}

a.internal.tag-link {
  border-radius: 8px;
  background-color: var(--highlight);
  padding: 0.2rem 0.4rem;
  margin: 0 0.1rem;
}
`;
var TagList_default = /* @__PURE__ */ __name((() => TagList), "default");

// quartz/components/scripts/graph.inline.ts
var graph_inline_default = "";

// quartz/components/styles/graph.scss
var graph_default = "";

// quartz/components/Graph.tsx
import { jsx as jsx26, jsxs as jsxs15 } from "preact/jsx-runtime";
var defaultOptions14 = {
  localGraph: {
    drag: true,
    zoom: true,
    depth: 1,
    scale: 1.1,
    repelForce: 0.5,
    centerForce: 0.3,
    linkDistance: 30,
    fontSize: 0.6,
    opacityScale: 1,
    showTags: true,
    removeTags: [],
    focusOnHover: false,
    enableRadial: false
  },
  globalGraph: {
    drag: true,
    zoom: true,
    depth: -1,
    scale: 0.9,
    repelForce: 0.5,
    centerForce: 0.2,
    linkDistance: 30,
    fontSize: 0.6,
    opacityScale: 1,
    showTags: true,
    removeTags: [],
    focusOnHover: true,
    enableRadial: true
  }
};
var Graph_default = /* @__PURE__ */ __name(((opts) => {
  const Graph = /* @__PURE__ */ __name(({ displayClass, cfg }) => {
    const localGraph = { ...defaultOptions14.localGraph, ...opts?.localGraph };
    const globalGraph = { ...defaultOptions14.globalGraph, ...opts?.globalGraph };
    return /* @__PURE__ */ jsxs15("div", { class: classNames(displayClass, "graph"), children: [
      /* @__PURE__ */ jsx26("h3", { children: i18n(cfg.locale).components.graph.title }),
      /* @__PURE__ */ jsxs15("div", { class: "graph-outer", children: [
        /* @__PURE__ */ jsx26("div", { class: "graph-container", "data-cfg": JSON.stringify(localGraph) }),
        /* @__PURE__ */ jsx26("button", { class: "global-graph-icon", "aria-label": "Global Graph", children: /* @__PURE__ */ jsx26(
          "svg",
          {
            version: "1.1",
            xmlns: "http://www.w3.org/2000/svg",
            xmlnsXlink: "http://www.w3.org/1999/xlink",
            x: "0px",
            y: "0px",
            viewBox: "0 0 55 55",
            fill: "currentColor",
            xmlSpace: "preserve",
            children: /* @__PURE__ */ jsx26(
              "path",
              {
                d: "M49,0c-3.309,0-6,2.691-6,6c0,1.035,0.263,2.009,0.726,2.86l-9.829,9.829C32.542,17.634,30.846,17,29,17\n                s-3.542,0.634-4.898,1.688l-7.669-7.669C16.785,10.424,17,9.74,17,9c0-2.206-1.794-4-4-4S9,6.794,9,9s1.794,4,4,4\n                c0.74,0,1.424-0.215,2.019-0.567l7.669,7.669C21.634,21.458,21,23.154,21,25s0.634,3.542,1.688,4.897L10.024,42.562\n                C8.958,41.595,7.549,41,6,41c-3.309,0-6,2.691-6,6s2.691,6,6,6s6-2.691,6-6c0-1.035-0.263-2.009-0.726-2.86l12.829-12.829\n                c1.106,0.86,2.44,1.436,3.898,1.619v10.16c-2.833,0.478-5,2.942-5,5.91c0,3.309,2.691,6,6,6s6-2.691,6-6c0-2.967-2.167-5.431-5-5.91\n                v-10.16c1.458-0.183,2.792-0.759,3.898-1.619l7.669,7.669C41.215,39.576,41,40.26,41,41c0,2.206,1.794,4,4,4s4-1.794,4-4\n                s-1.794-4-4-4c-0.74,0-1.424,0.215-2.019,0.567l-7.669-7.669C36.366,28.542,37,26.846,37,25s-0.634-3.542-1.688-4.897l9.665-9.665\n                C46.042,11.405,47.451,12,49,12c3.309,0,6-2.691,6-6S52.309,0,49,0z M11,9c0-1.103,0.897-2,2-2s2,0.897,2,2s-0.897,2-2,2\n                S11,10.103,11,9z M6,51c-2.206,0-4-1.794-4-4s1.794-4,4-4s4,1.794,4,4S8.206,51,6,51z M33,49c0,2.206-1.794,4-4,4s-4-1.794-4-4\n                s1.794-4,4-4S33,46.794,33,49z M29,31c-3.309,0-6-2.691-6-6s2.691-6,6-6s6,2.691,6,6S32.309,31,29,31z M47,41c0,1.103-0.897,2-2,2\n                s-2-0.897-2-2s0.897-2,2-2S47,39.897,47,41z M49,10c-2.206,0-4-1.794-4-4s1.794-4,4-4s4,1.794,4,4S51.206,10,49,10z"
              }
            )
          }
        ) })
      ] }),
      /* @__PURE__ */ jsx26("div", { class: "global-graph-outer", children: /* @__PURE__ */ jsx26("div", { class: "global-graph-container", "data-cfg": JSON.stringify(globalGraph) }) })
    ] });
  }, "Graph");
  Graph.css = graph_default;
  Graph.afterDOMLoaded = graph_inline_default;
  return Graph;
}), "default");

// quartz/components/styles/backlinks.scss
var backlinks_default = "";

// quartz/components/Backlinks.tsx
import { jsx as jsx27, jsxs as jsxs16 } from "preact/jsx-runtime";
var defaultOptions15 = {
  hideWhenEmpty: true
};
var Backlinks_default = /* @__PURE__ */ __name(((opts) => {
  const options2 = { ...defaultOptions15, ...opts };
  const { OverflowList: OverflowList2, overflowListAfterDOMLoaded } = OverflowList_default();
  const Backlinks = /* @__PURE__ */ __name(({
    fileData,
    allFiles,
    displayClass,
    cfg
  }) => {
    const slug = simplifySlug(fileData.slug);
    const backlinkFiles = allFiles.filter((file) => file.links?.includes(slug));
    if (options2.hideWhenEmpty && backlinkFiles.length == 0) {
      return null;
    }
    return /* @__PURE__ */ jsxs16("div", { class: classNames(displayClass, "backlinks"), children: [
      /* @__PURE__ */ jsx27("h3", { children: i18n(cfg.locale).components.backlinks.title }),
      /* @__PURE__ */ jsx27(OverflowList2, { children: backlinkFiles.length > 0 ? backlinkFiles.map((f) => /* @__PURE__ */ jsx27("li", { children: /* @__PURE__ */ jsx27("a", { href: resolveRelative(fileData.slug, f.slug), class: "internal", children: f.frontmatter?.title }) })) : /* @__PURE__ */ jsx27("li", { children: i18n(cfg.locale).components.backlinks.noBacklinksFound }) })
    ] });
  }, "Backlinks");
  Backlinks.css = backlinks_default;
  Backlinks.afterDOMLoaded = overflowListAfterDOMLoaded;
  return Backlinks;
}), "default");

// quartz/components/styles/search.scss
var search_default = "";

// quartz/components/scripts/search.inline.ts
var search_inline_default = "";

// quartz/components/Search.tsx
import { jsx as jsx28, jsxs as jsxs17 } from "preact/jsx-runtime";
var defaultOptions16 = {
  enablePreview: true
};
var Search_default = /* @__PURE__ */ __name(((userOpts) => {
  const Search = /* @__PURE__ */ __name(({ displayClass, cfg }) => {
    const opts = { ...defaultOptions16, ...userOpts };
    const searchPlaceholder = i18n(cfg.locale).components.search.searchBarPlaceholder;
    return /* @__PURE__ */ jsxs17("div", { class: classNames(displayClass, "search"), children: [
      /* @__PURE__ */ jsxs17("button", { class: "search-button", children: [
        /* @__PURE__ */ jsxs17("svg", { role: "img", xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 19.9 19.7", children: [
          /* @__PURE__ */ jsx28("title", { children: "Search" }),
          /* @__PURE__ */ jsxs17("g", { class: "search-path", fill: "none", children: [
            /* @__PURE__ */ jsx28("path", { "stroke-linecap": "square", d: "M18.5 18.3l-5.4-5.4" }),
            /* @__PURE__ */ jsx28("circle", { cx: "8", cy: "8", r: "7" })
          ] })
        ] }),
        /* @__PURE__ */ jsx28("p", { children: i18n(cfg.locale).components.search.title })
      ] }),
      /* @__PURE__ */ jsx28("div", { class: "search-container", children: /* @__PURE__ */ jsxs17("div", { class: "search-space", children: [
        /* @__PURE__ */ jsx28(
          "input",
          {
            autocomplete: "off",
            class: "search-bar",
            name: "search",
            type: "text",
            "aria-label": searchPlaceholder,
            placeholder: searchPlaceholder
          }
        ),
        /* @__PURE__ */ jsx28("div", { class: "search-layout", "data-preview": opts.enablePreview })
      ] }) })
    ] });
  }, "Search");
  Search.afterDOMLoaded = search_inline_default;
  Search.css = search_default;
  return Search;
}), "default");

// quartz/components/styles/footer.scss
var footer_default = "";

// package.json
var version = "4.5.2";

// quartz/components/Footer.tsx
import { jsx as jsx29, jsxs as jsxs18 } from "preact/jsx-runtime";
var Footer_default = /* @__PURE__ */ __name(((opts) => {
  const Footer = /* @__PURE__ */ __name(({ displayClass, cfg }) => {
    const year = (/* @__PURE__ */ new Date()).getFullYear();
    const links = opts?.links ?? [];
    return /* @__PURE__ */ jsxs18("footer", { class: `${displayClass ?? ""}`, children: [
      /* @__PURE__ */ jsxs18("p", { children: [
        i18n(cfg.locale).components.footer.createdWith,
        " ",
        /* @__PURE__ */ jsxs18("a", { href: "https://quartz.jzhao.xyz/", children: [
          "Quartz v",
          version
        ] }),
        " \xA9 ",
        year
      ] }),
      /* @__PURE__ */ jsx29("ul", { children: Object.entries(links).map(([text, link]) => /* @__PURE__ */ jsx29("li", { children: /* @__PURE__ */ jsx29("a", { href: link, children: text }) })) })
    ] });
  }, "Footer");
  Footer.css = footer_default;
  return Footer;
}), "default");

// quartz/components/DesktopOnly.tsx
import { jsx as jsx30 } from "preact/jsx-runtime";
var DesktopOnly_default = /* @__PURE__ */ __name(((component) => {
  const Component = component;
  const DesktopOnly = /* @__PURE__ */ __name((props) => {
    return /* @__PURE__ */ jsx30(Component, { displayClass: "desktop-only", ...props });
  }, "DesktopOnly");
  DesktopOnly.displayName = component.displayName;
  DesktopOnly.afterDOMLoaded = component?.afterDOMLoaded;
  DesktopOnly.beforeDOMLoaded = component?.beforeDOMLoaded;
  DesktopOnly.css = component?.css;
  return DesktopOnly;
}), "default");

// quartz/components/MobileOnly.tsx
import { jsx as jsx31 } from "preact/jsx-runtime";
var MobileOnly_default = /* @__PURE__ */ __name(((component) => {
  const Component = component;
  const MobileOnly = /* @__PURE__ */ __name((props) => {
    return /* @__PURE__ */ jsx31(Component, { displayClass: "mobile-only", ...props });
  }, "MobileOnly");
  MobileOnly.displayName = component.displayName;
  MobileOnly.afterDOMLoaded = component?.afterDOMLoaded;
  MobileOnly.beforeDOMLoaded = component?.beforeDOMLoaded;
  MobileOnly.css = component?.css;
  return MobileOnly;
}), "default");

// quartz/components/RecentNotes.tsx
import { jsx as jsx32, jsxs as jsxs19 } from "preact/jsx-runtime";

// quartz/components/styles/breadcrumbs.scss
var breadcrumbs_default = "";

// quartz/components/Breadcrumbs.tsx
import { jsx as jsx33, jsxs as jsxs20 } from "preact/jsx-runtime";
var defaultOptions17 = {
  spacerSymbol: "\u276F",
  rootName: "Home",
  resolveFrontmatterTitle: true,
  showCurrentPage: true
};
function formatCrumb(displayName, baseSlug, currentSlug) {
  return {
    displayName: displayName.replaceAll("-", " "),
    path: resolveRelative(baseSlug, currentSlug)
  };
}
__name(formatCrumb, "formatCrumb");
var Breadcrumbs_default = /* @__PURE__ */ __name(((opts) => {
  const options2 = { ...defaultOptions17, ...opts };
  const Breadcrumbs = /* @__PURE__ */ __name(({
    fileData,
    allFiles,
    displayClass,
    ctx
  }) => {
    const trie = ctx.trie ??= trieFromAllFiles(allFiles);
    const slugParts = fileData.slug.split("/");
    const pathNodes = trie.ancestryChain(slugParts);
    if (!pathNodes) {
      return null;
    }
    const crumbs = pathNodes.map((node, idx) => {
      const crumb = formatCrumb(node.displayName, fileData.slug, simplifySlug(node.slug));
      if (idx === 0) {
        crumb.displayName = options2.rootName;
      }
      if (idx === pathNodes.length - 1) {
        crumb.path = "";
      }
      return crumb;
    });
    if (!options2.showCurrentPage) {
      crumbs.pop();
    }
    return /* @__PURE__ */ jsx33("nav", { class: classNames(displayClass, "breadcrumb-container"), "aria-label": "breadcrumbs", children: crumbs.map((crumb, index) => /* @__PURE__ */ jsxs20("div", { class: "breadcrumb-element", children: [
      /* @__PURE__ */ jsx33("a", { href: crumb.path, children: crumb.displayName }),
      index !== crumbs.length - 1 && /* @__PURE__ */ jsx33("p", { children: ` ${options2.spacerSymbol} ` })
    ] })) });
  }, "Breadcrumbs");
  Breadcrumbs.css = breadcrumbs_default;
  return Breadcrumbs;
}), "default");

// quartz/components/Comments.tsx
import { Fragment as Fragment5, jsx as jsx34 } from "preact/jsx-runtime";

// quartz/components/Flex.tsx
import { jsx as jsx35 } from "preact/jsx-runtime";
var Flex_default = /* @__PURE__ */ __name(((config2) => {
  const Flex = /* @__PURE__ */ __name((props) => {
    const direction = config2.direction ?? "row";
    const wrap = config2.wrap ?? "nowrap";
    const gap = config2.gap ?? "1rem";
    return /* @__PURE__ */ jsx35(
      "div",
      {
        class: classNames(props.displayClass, "flex-component"),
        style: `flex-direction: ${direction}; flex-wrap: ${wrap}; gap: ${gap};`,
        children: config2.components.map((c) => {
          const grow = c.grow ? 1 : 0;
          const shrink = c.shrink ?? true ? 1 : 0;
          const basis = c.basis ?? "auto";
          const order = c.order ?? 0;
          const align = c.align ?? "center";
          const justify = c.justify ?? "center";
          return /* @__PURE__ */ jsx35(
            "div",
            {
              style: `flex-grow: ${grow}; flex-shrink: ${shrink}; flex-basis: ${basis}; order: ${order}; align-self: ${align}; justify-self: ${justify};`,
              children: /* @__PURE__ */ jsx35(c.Component, { ...props })
            }
          );
        })
      }
    );
  }, "Flex");
  Flex.afterDOMLoaded = concatenateResources(
    ...config2.components.map((c) => c.Component.afterDOMLoaded)
  );
  Flex.beforeDOMLoaded = concatenateResources(
    ...config2.components.map((c) => c.Component.beforeDOMLoaded)
  );
  Flex.css = concatenateResources(...config2.components.map((c) => c.Component.css));
  return Flex;
}), "default");

// quartz/components/ConditionalRender.tsx
import { jsx as jsx36 } from "preact/jsx-runtime";
var ConditionalRender_default = /* @__PURE__ */ __name(((config2) => {
  const ConditionalRender = /* @__PURE__ */ __name((props) => {
    if (config2.condition(props)) {
      return /* @__PURE__ */ jsx36(config2.component, { ...props });
    }
    return null;
  }, "ConditionalRender");
  ConditionalRender.afterDOMLoaded = config2.component.afterDOMLoaded;
  ConditionalRender.beforeDOMLoaded = config2.component.beforeDOMLoaded;
  ConditionalRender.css = config2.component.css;
  return ConditionalRender;
}), "default");

// quartz/components/ChatWidget.tsx
import { jsx as jsx37 } from "preact/jsx-runtime";
var ChatWidget_default = /* @__PURE__ */ __name(((opts) => {
  const ChatWidget = /* @__PURE__ */ __name(({ displayClass }) => {
    const wiki = opts.wiki || "scott_adams";
    const apiUrl = opts.apiUrl || "http://localhost:8081";
    const widgetScript = `
(function() {
  const WIKI = "${wiki}";
  const API_URL = "${apiUrl}";

  const THINKING_PHRASES = [
    "Consulting the archives...",
    "Searching transcripts...",
    "Cross-referencing sources...",
    "Pondering the question...",
    "Evaluating the evidence...",
    "Synthesizing insights...",
  ];

  const styles = \`
    #wiki-chat-widget {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      font-family: system-ui, -apple-system, sans-serif;
    }
    #wiki-chat-toggle {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--secondary, #2563eb);
      color: white;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
    }
    #wiki-chat-toggle:hover { transform: scale(1.05); }
    #wiki-chat-toggle svg { width: 26px; height: 26px; }
    #wiki-chat-panel {
      display: none;
      position: absolute;
      bottom: 65px;
      right: 0;
      width: 360px;
      max-height: 480px;
      background: var(--light, white);
      border-radius: 12px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.15);
      overflow: hidden;
      flex-direction: column;
    }
    #wiki-chat-panel.open { display: flex; }
    #wiki-chat-header {
      background: var(--secondary, #2563eb);
      color: white;
      padding: 14px 16px;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #wiki-chat-close {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 20px;
    }
    #wiki-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 14px;
      max-height: 280px;
      background: var(--lightgray, #f9fafb);
    }
    .wiki-chat-message {
      margin-bottom: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      max-width: 90%;
      line-height: 1.5;
      font-size: 13px;
    }
    .wiki-chat-message.user {
      background: var(--secondary, #2563eb);
      color: white;
      margin-left: auto;
    }
    .wiki-chat-message.bot {
      background: var(--light, white);
      border: 1px solid var(--gray, #e5e7eb);
      color: var(--dark, #333);
    }
    .wiki-chat-message.bot p { margin: 0 0 8px 0; }
    .wiki-chat-message.bot p:last-child { margin-bottom: 0; }
    .wiki-chat-thinking { color: var(--gray, #6b7280); font-style: italic; }
    #wiki-chat-input-area {
      padding: 12px;
      border-top: 1px solid var(--gray, #e5e7eb);
      background: var(--light, white);
    }
    #wiki-chat-email-gate { text-align: center; padding: 16px; }
    #wiki-chat-email-gate input {
      width: 100%;
      padding: 10px;
      border: 1px solid var(--gray, #d1d5db);
      border-radius: 6px;
      margin-bottom: 10px;
      font-size: 14px;
    }
    #wiki-chat-email-gate button, #wiki-chat-send {
      padding: 10px 16px;
      background: var(--secondary, #2563eb);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
    }
    #wiki-chat-email-gate button:disabled, #wiki-chat-send:disabled {
      background: var(--gray, #9ca3af);
      cursor: not-allowed;
    }
    #wiki-chat-form { display: flex; gap: 8px; }
    #wiki-chat-input {
      flex: 1;
      padding: 10px;
      border: 1px solid var(--gray, #d1d5db);
      border-radius: 6px;
      font-size: 14px;
    }
  \`;

  function createWidget() {
    const widget = document.createElement('div');
    widget.id = 'wiki-chat-widget';
    widget.innerHTML = \`
      <style>\${styles}</style>
      <button id="wiki-chat-toggle" aria-label="Open chat">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>
      <div id="wiki-chat-panel">
        <div id="wiki-chat-header">
          <span>Ask the Archive</span>
          <button id="wiki-chat-close">&times;</button>
        </div>
        <div id="wiki-chat-messages"></div>
        <div id="wiki-chat-input-area">
          <div id="wiki-chat-email-gate">
            <p style="margin-bottom:12px;color:var(--dark,#374151);">Enter your email to start chatting</p>
            <input type="email" id="wiki-chat-email" placeholder="you@example.com" />
            <button id="wiki-chat-email-submit" style="width:100%;" disabled>Continue</button>
          </div>
          <form id="wiki-chat-form" style="display:none;">
            <input type="text" id="wiki-chat-input" placeholder="Ask a question..." />
            <button type="submit" id="wiki-chat-send">Send</button>
          </form>
        </div>
      </div>
    \`;
    document.body.appendChild(widget);
    initWidget();
  }

  function initWidget() {
    const toggle = document.getElementById('wiki-chat-toggle');
    const panel = document.getElementById('wiki-chat-panel');
    const closeBtn = document.getElementById('wiki-chat-close');
    const emailGate = document.getElementById('wiki-chat-email-gate');
    const emailInput = document.getElementById('wiki-chat-email');
    const emailSubmit = document.getElementById('wiki-chat-email-submit');
    const chatForm = document.getElementById('wiki-chat-form');
    const chatInput = document.getElementById('wiki-chat-input');
    const messages = document.getElementById('wiki-chat-messages');

    let userEmail = localStorage.getItem('wiki_chat_email');
    let isLoading = false;

    if (userEmail) {
      emailGate.style.display = 'none';
      chatForm.style.display = 'flex';
    }

    toggle.addEventListener('click', () => {
      panel.classList.toggle('open');
      if (panel.classList.contains('open')) {
        (userEmail ? chatInput : emailInput).focus();
      }
    });

    closeBtn.addEventListener('click', () => panel.classList.remove('open'));

    emailInput.addEventListener('input', () => {
      emailSubmit.disabled = !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(emailInput.value);
    });

    emailSubmit.addEventListener('click', async () => {
      userEmail = emailInput.value.toLowerCase();
      localStorage.setItem('wiki_chat_email', userEmail);
      try {
        await fetch(API_URL + '/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail }),
        });
      } catch (e) {}
      emailGate.style.display = 'none';
      chatForm.style.display = 'flex';
      chatInput.focus();
      addMessage('bot', "Hi! Ask me anything about the archive.");
    });

    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const query = chatInput.value.trim();
      if (!query || isLoading) return;
      addMessage('user', query);
      chatInput.value = '';
      isLoading = true;
      let phraseIdx = 0;
      const thinkingMsg = addMessage('bot', THINKING_PHRASES[0], 'wiki-chat-thinking');
      const interval = setInterval(() => {
        phraseIdx = (phraseIdx + 1) % THINKING_PHRASES.length;
        thinkingMsg.textContent = THINKING_PHRASES[phraseIdx];
      }, 2000);
      try {
        const res = await fetch(API_URL + '/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-User-Email': userEmail },
          body: JSON.stringify({ wiki: WIKI, query, limit: 8 }),
        });
        const data = await res.json();
        thinkingMsg.remove();
        if (res.ok) {
          let html = formatMd(data.answer);
          if (data.sources?.length) {
            html += '<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--gray,#e5e7eb);font-size:11px;color:var(--gray,#6b7280);"><strong>Sources:</strong> ' +
              data.sources.slice(0,3).map(s => s.title).join(', ') + '</div>';
          }
          addMessage('bot', html, null, true);
        } else {
          addMessage('bot', 'Error: ' + (data.detail || 'Request failed'));
        }
      } catch (err) {
        thinkingMsg.remove();
        addMessage('bot', 'Error: ' + err.message);
      } finally {
        clearInterval(interval);
        isLoading = false;
      }
    });

    function addMessage(type, content, extraClass, isHtml) {
      const msg = document.createElement('div');
      msg.className = 'wiki-chat-message ' + type + (extraClass ? ' ' + extraClass : '');
      if (isHtml) msg.innerHTML = content;
      else msg.textContent = content;
      messages.appendChild(msg);
      messages.scrollTop = messages.scrollHeight;
      return msg;
    }

    function formatMd(text) {
      return text
        .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
        .replace(/\\*(.+?)\\*/g, '<em>$1</em>')
        .replace(/\\n\\n/g, '</p><p>')
        .replace(/\\n/g, '<br>')
        .replace(/^/, '<p>').replace(/$/, '</p>');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
`;
    return /* @__PURE__ */ jsx37("script", { dangerouslySetInnerHTML: { __html: widgetScript } });
  }, "ChatWidget");
  return ChatWidget;
}), "default");

// quartz/components/ChatBanner.tsx
import { Fragment as Fragment6, jsx as jsx38, jsxs as jsxs21 } from "preact/jsx-runtime";
var ChatBanner_default = /* @__PURE__ */ __name(((opts) => {
  const ChatBanner = /* @__PURE__ */ __name(({ displayClass }) => {
    const label = opts?.label || "Ask the Archive";
    const description = opts?.description || "Chat with an AI that's read every episode";
    const bannerScript = `
(function() {
  const banner = document.getElementById('chat-banner');
  if (!banner) return;

  banner.addEventListener('click', function() {
    const toggle = document.getElementById('wiki-chat-toggle');
    const panel = document.getElementById('wiki-chat-panel');
    if (toggle && panel) {
      panel.classList.add('open');
      const input = document.getElementById('wiki-chat-input') || document.getElementById('wiki-chat-email');
      if (input) input.focus();
    }
  });
})();
`;
    return /* @__PURE__ */ jsxs21(Fragment6, { children: [
      /* @__PURE__ */ jsx38("div", { id: "chat-banner", class: `chat-banner ${displayClass ?? ""}`, children: /* @__PURE__ */ jsxs21("div", { class: "chat-banner-inner", children: [
        /* @__PURE__ */ jsx38("div", { class: "chat-banner-icon", children: /* @__PURE__ */ jsx38("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", children: /* @__PURE__ */ jsx38("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" }) }) }),
        /* @__PURE__ */ jsxs21("div", { class: "chat-banner-text", children: [
          /* @__PURE__ */ jsx38("span", { class: "chat-banner-label", children: label }),
          /* @__PURE__ */ jsx38("span", { class: "chat-banner-desc", children: description })
        ] }),
        /* @__PURE__ */ jsx38("div", { class: "chat-banner-arrow", children: /* @__PURE__ */ jsx38("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", children: /* @__PURE__ */ jsx38("polyline", { points: "9 18 15 12 9 6" }) }) })
      ] }) }),
      /* @__PURE__ */ jsx38("script", { dangerouslySetInnerHTML: { __html: bannerScript } })
    ] });
  }, "ChatBanner");
  ChatBanner.css = `
    .chat-banner {
      margin: 0 0 1rem 0;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .chat-banner:hover {
      transform: translateY(-1px);
    }
    .chat-banner-inner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 10px;
      background: var(--secondary);
      color: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    }
    .chat-banner:hover .chat-banner-inner {
      box-shadow: 0 4px 16px rgba(0,0,0,0.18);
    }
    .chat-banner-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      flex-shrink: 0;
    }
    .chat-banner-text {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }
    .chat-banner-label {
      font-weight: 700;
      font-size: 0.95rem;
      line-height: 1.3;
    }
    .chat-banner-desc {
      font-size: 0.8rem;
      opacity: 0.85;
      line-height: 1.3;
    }
    .chat-banner-arrow {
      flex-shrink: 0;
      opacity: 0.7;
      transition: transform 0.2s;
    }
    .chat-banner:hover .chat-banner-arrow {
      transform: translateX(2px);
      opacity: 1;
    }
  `;
  return ChatBanner;
}), "default");

// quartz.layout.ts
var sharedPageComponents = {
  head: Head_default(),
  header: [],
  afterBody: [
    ChatWidget_default({
      wiki: "scott_adams",
      apiUrl: "https://api-production-4224.up.railway.app"
    })
  ],
  footer: Footer_default({
    links: {
      "About Scott Adams": "/about",
      "GitHub": "https://github.com"
    }
  })
};
var defaultContentPageLayout = {
  beforeBody: [
    ChatBanner_default({
      label: "Ask the Archive",
      description: "Chat with an AI that's read all 1,151 episodes"
    }),
    ConditionalRender_default({
      component: Breadcrumbs_default(),
      condition: /* @__PURE__ */ __name((page) => page.fileData.slug !== "index", "condition")
    }),
    ArticleTitle_default(),
    ContentMeta_default(),
    TagList_default()
  ],
  left: [
    PageTitle_default(),
    MobileOnly_default(Spacer_default()),
    Flex_default({
      components: [
        {
          Component: Search_default(),
          grow: true
        },
        { Component: Darkmode_default() },
        { Component: ReaderMode_default() }
      ]
    }),
    Explorer_default({
      folderDefaultState: "open",
      filterFn: /* @__PURE__ */ __name((node) => {
        return node.slugSegment !== "tags" && node.slugSegment !== "episodes";
      }, "filterFn"),
      sortFn: /* @__PURE__ */ __name((a, b) => {
        const order = ["domains", "frameworks", "cases", "people"];
        const aIdx = order.indexOf(a.slugSegment ?? "");
        const bIdx = order.indexOf(b.slugSegment ?? "");
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
        return a.displayName.localeCompare(b.displayName);
      }, "sortFn")
    })
  ],
  right: [
    Graph_default(),
    DesktopOnly_default(TableOfContents_default()),
    Backlinks_default()
  ]
};
var defaultListPageLayout = {
  beforeBody: [Breadcrumbs_default(), ArticleTitle_default(), ContentMeta_default()],
  left: [
    PageTitle_default(),
    MobileOnly_default(Spacer_default()),
    Flex_default({
      components: [
        {
          Component: Search_default(),
          grow: true
        },
        { Component: Darkmode_default() }
      ]
    }),
    Explorer_default({
      folderDefaultState: "open",
      filterFn: /* @__PURE__ */ __name((node) => {
        return node.slugSegment !== "tags" && node.slugSegment !== "episodes";
      }, "filterFn"),
      sortFn: /* @__PURE__ */ __name((a, b) => {
        const order = ["domains", "frameworks", "cases", "people"];
        const aIdx = order.indexOf(a.slugSegment ?? "");
        const bIdx = order.indexOf(b.slugSegment ?? "");
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
        return a.displayName.localeCompare(b.displayName);
      }, "sortFn")
    })
  ],
  right: []
};

// quartz/plugins/emitters/contentPage.tsx
import { styleText as styleText4 } from "util";
async function processContent(ctx, tree, fileData, allFiles, opts, resources) {
  const slug = fileData.slug;
  const cfg = ctx.cfg.configuration;
  const externalResources = pageResources(pathToRoot(slug), resources);
  const componentData = {
    ctx,
    fileData,
    externalResources,
    cfg,
    children: [],
    tree,
    allFiles
  };
  const content = renderPage(cfg, slug, componentData, opts, externalResources);
  return write({
    ctx,
    content,
    slug,
    ext: ".html"
  });
}
__name(processContent, "processContent");
var ContentPage = /* @__PURE__ */ __name((userOpts) => {
  const opts = {
    ...sharedPageComponents,
    ...defaultContentPageLayout,
    pageBody: Content_default(),
    ...userOpts
  };
  const { head: Head, header, beforeBody, pageBody, afterBody, left, right, footer: Footer } = opts;
  const Header2 = Header_default();
  const Body2 = Body_default();
  return {
    name: "ContentPage",
    getQuartzComponents() {
      return [
        Head,
        Header2,
        Body2,
        ...header,
        ...beforeBody,
        pageBody,
        ...afterBody,
        ...left,
        ...right,
        Footer
      ];
    },
    async *emit(ctx, content, resources) {
      const allFiles = content.map((c) => c[1].data);
      let containsIndex = false;
      for (const [tree, file] of content) {
        const slug = file.data.slug;
        if (slug === "index") {
          containsIndex = true;
        }
        if (slug.endsWith("/index") || slug.startsWith("tags/")) continue;
        yield processContent(ctx, tree, file.data, allFiles, opts, resources);
      }
      if (!containsIndex) {
        console.log(
          styleText4(
            "yellow",
            `
Warning: you seem to be missing an \`index.md\` home page file at the root of your \`${ctx.argv.directory}\` folder (\`${path5.join(ctx.argv.directory, "index.md")} does not exist\`). This may cause errors when deploying.`
          )
        );
      }
    },
    async *partialEmit(ctx, content, resources, changeEvents) {
      const allFiles = content.map((c) => c[1].data);
      const changedSlugs = /* @__PURE__ */ new Set();
      for (const changeEvent of changeEvents) {
        if (!changeEvent.file) continue;
        if (changeEvent.type === "add" || changeEvent.type === "change") {
          changedSlugs.add(changeEvent.file.data.slug);
        }
      }
      for (const [tree, file] of content) {
        const slug = file.data.slug;
        if (!changedSlugs.has(slug)) continue;
        if (slug.endsWith("/index") || slug.startsWith("tags/")) continue;
        yield processContent(ctx, tree, file.data, allFiles, opts, resources);
      }
    }
  };
}, "ContentPage");

// quartz/plugins/vfile.ts
import { VFile } from "vfile";
function defaultProcessedContent(vfileData) {
  const root = { type: "root", children: [] };
  const vfile = new VFile("");
  vfile.data = vfileData;
  return [root, vfile];
}
__name(defaultProcessedContent, "defaultProcessedContent");

// quartz/plugins/emitters/tagPage.tsx
function computeTagInfo(allFiles, content, locale) {
  const tags = new Set(
    allFiles.flatMap((data) => data.frontmatter?.tags ?? []).flatMap(getAllSegmentPrefixes)
  );
  tags.add("index");
  const tagDescriptions = Object.fromEntries(
    [...tags].map((tag) => {
      const title = tag === "index" ? i18n(locale).pages.tagContent.tagIndex : `${i18n(locale).pages.tagContent.tag}: ${tag}`;
      return [
        tag,
        defaultProcessedContent({
          slug: joinSegments("tags", tag),
          frontmatter: { title, tags: [] }
        })
      ];
    })
  );
  for (const [tree, file] of content) {
    const slug = file.data.slug;
    if (slug.startsWith("tags/")) {
      const tag = slug.slice("tags/".length);
      if (tags.has(tag)) {
        tagDescriptions[tag] = [tree, file];
        if (file.data.frontmatter?.title === tag) {
          file.data.frontmatter.title = `${i18n(locale).pages.tagContent.tag}: ${tag}`;
        }
      }
    }
  }
  return [tags, tagDescriptions];
}
__name(computeTagInfo, "computeTagInfo");
async function processTagPage(ctx, tag, tagContent, allFiles, opts, resources) {
  const slug = joinSegments("tags", tag);
  const [tree, file] = tagContent;
  const cfg = ctx.cfg.configuration;
  const externalResources = pageResources(pathToRoot(slug), resources);
  const componentData = {
    ctx,
    fileData: file.data,
    externalResources,
    cfg,
    children: [],
    tree,
    allFiles
  };
  const content = renderPage(cfg, slug, componentData, opts, externalResources);
  return write({
    ctx,
    content,
    slug: file.data.slug,
    ext: ".html"
  });
}
__name(processTagPage, "processTagPage");
var TagPage = /* @__PURE__ */ __name((userOpts) => {
  const opts = {
    ...sharedPageComponents,
    ...defaultListPageLayout,
    pageBody: TagContent_default({ sort: userOpts?.sort }),
    ...userOpts
  };
  const { head: Head, header, beforeBody, pageBody, afterBody, left, right, footer: Footer } = opts;
  const Header2 = Header_default();
  const Body2 = Body_default();
  return {
    name: "TagPage",
    getQuartzComponents() {
      return [
        Head,
        Header2,
        Body2,
        ...header,
        ...beforeBody,
        pageBody,
        ...afterBody,
        ...left,
        ...right,
        Footer
      ];
    },
    async *emit(ctx, content, resources) {
      const allFiles = content.map((c) => c[1].data);
      const cfg = ctx.cfg.configuration;
      const [tags, tagDescriptions] = computeTagInfo(allFiles, content, cfg.locale);
      for (const tag of tags) {
        yield processTagPage(ctx, tag, tagDescriptions[tag], allFiles, opts, resources);
      }
    },
    async *partialEmit(ctx, content, resources, changeEvents) {
      const allFiles = content.map((c) => c[1].data);
      const cfg = ctx.cfg.configuration;
      const affectedTags = /* @__PURE__ */ new Set();
      for (const changeEvent of changeEvents) {
        if (!changeEvent.file) continue;
        const slug = changeEvent.file.data.slug;
        if (slug.startsWith("tags/")) {
          const tag = slug.slice("tags/".length);
          affectedTags.add(tag);
        }
        const fileTags = changeEvent.file.data.frontmatter?.tags ?? [];
        fileTags.flatMap(getAllSegmentPrefixes).forEach((tag) => affectedTags.add(tag));
        affectedTags.add("index");
      }
      if (affectedTags.size > 0) {
        const [_tags, tagDescriptions] = computeTagInfo(allFiles, content, cfg.locale);
        for (const tag of affectedTags) {
          if (tagDescriptions[tag]) {
            yield processTagPage(ctx, tag, tagDescriptions[tag], allFiles, opts, resources);
          }
        }
      }
    }
  };
}, "TagPage");

// quartz/plugins/emitters/folderPage.tsx
import path6 from "path";
async function* processFolderInfo(ctx, folderInfo, allFiles, opts, resources) {
  for (const [folder, folderContent] of Object.entries(folderInfo)) {
    const slug = joinSegments(folder, "index");
    const [tree, file] = folderContent;
    const cfg = ctx.cfg.configuration;
    const externalResources = pageResources(pathToRoot(slug), resources);
    const componentData = {
      ctx,
      fileData: file.data,
      externalResources,
      cfg,
      children: [],
      tree,
      allFiles
    };
    const content = renderPage(cfg, slug, componentData, opts, externalResources);
    yield write({
      ctx,
      content,
      slug,
      ext: ".html"
    });
  }
}
__name(processFolderInfo, "processFolderInfo");
function computeFolderInfo(folders, content, locale) {
  const folderInfo = Object.fromEntries(
    [...folders].map((folder) => [
      folder,
      defaultProcessedContent({
        slug: joinSegments(folder, "index"),
        frontmatter: {
          title: `${i18n(locale).pages.folderContent.folder}: ${folder}`,
          tags: []
        }
      })
    ])
  );
  for (const [tree, file] of content) {
    const slug = stripSlashes(simplifySlug(file.data.slug));
    if (folders.has(slug)) {
      folderInfo[slug] = [tree, file];
    }
  }
  return folderInfo;
}
__name(computeFolderInfo, "computeFolderInfo");
function _getFolders(slug) {
  var folderName = path6.dirname(slug ?? "");
  const parentFolderNames = [folderName];
  while (folderName !== ".") {
    folderName = path6.dirname(folderName ?? "");
    parentFolderNames.push(folderName);
  }
  return parentFolderNames;
}
__name(_getFolders, "_getFolders");
var FolderPage = /* @__PURE__ */ __name((userOpts) => {
  const opts = {
    ...sharedPageComponents,
    ...defaultListPageLayout,
    pageBody: FolderContent_default({ sort: userOpts?.sort }),
    ...userOpts
  };
  const { head: Head, header, beforeBody, pageBody, afterBody, left, right, footer: Footer } = opts;
  const Header2 = Header_default();
  const Body2 = Body_default();
  return {
    name: "FolderPage",
    getQuartzComponents() {
      return [
        Head,
        Header2,
        Body2,
        ...header,
        ...beforeBody,
        pageBody,
        ...afterBody,
        ...left,
        ...right,
        Footer
      ];
    },
    async *emit(ctx, content, resources) {
      const allFiles = content.map((c) => c[1].data);
      const cfg = ctx.cfg.configuration;
      const folders = new Set(
        allFiles.flatMap((data) => {
          return data.slug ? _getFolders(data.slug).filter(
            (folderName) => folderName !== "." && folderName !== "tags"
          ) : [];
        })
      );
      const folderInfo = computeFolderInfo(folders, content, cfg.locale);
      yield* processFolderInfo(ctx, folderInfo, allFiles, opts, resources);
    },
    async *partialEmit(ctx, content, resources, changeEvents) {
      const allFiles = content.map((c) => c[1].data);
      const cfg = ctx.cfg.configuration;
      const affectedFolders = /* @__PURE__ */ new Set();
      for (const changeEvent of changeEvents) {
        if (!changeEvent.file) continue;
        const slug = changeEvent.file.data.slug;
        const folders = _getFolders(slug).filter(
          (folderName) => folderName !== "." && folderName !== "tags"
        );
        folders.forEach((folder) => affectedFolders.add(folder));
      }
      if (affectedFolders.size > 0) {
        const folderInfo = computeFolderInfo(affectedFolders, content, cfg.locale);
        yield* processFolderInfo(ctx, folderInfo, allFiles, opts, resources);
      }
    }
  };
}, "FolderPage");

// quartz/plugins/emitters/contentIndex.tsx
import { toHtml as toHtml2 } from "hast-util-to-html";
import { jsx as jsx39 } from "preact/jsx-runtime";
var defaultOptions18 = {
  enableSiteMap: true,
  enableRSS: true,
  rssLimit: 10,
  rssFullHtml: false,
  rssSlug: "index",
  includeEmptyFiles: true
};
function generateSiteMap(cfg, idx) {
  const base = cfg.baseUrl ?? "";
  const createURLEntry = /* @__PURE__ */ __name((slug, content) => `<url>
    <loc>https://${joinSegments(base, encodeURI(slug))}</loc>
    ${content.date && `<lastmod>${content.date.toISOString()}</lastmod>`}
  </url>`, "createURLEntry");
  const urls = Array.from(idx).map(([slug, content]) => createURLEntry(simplifySlug(slug), content)).join("");
  return `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`;
}
__name(generateSiteMap, "generateSiteMap");
function generateRSSFeed(cfg, idx, limit) {
  const base = cfg.baseUrl ?? "";
  const createURLEntry = /* @__PURE__ */ __name((slug, content) => `<item>
    <title>${escapeHTML(content.title)}</title>
    <link>https://${joinSegments(base, encodeURI(slug))}</link>
    <guid>https://${joinSegments(base, encodeURI(slug))}</guid>
    <description><![CDATA[ ${content.richContent ?? content.description} ]]></description>
    <pubDate>${content.date?.toUTCString()}</pubDate>
  </item>`, "createURLEntry");
  const items = Array.from(idx).sort(([_, f1], [__, f2]) => {
    if (f1.date && f2.date) {
      return f2.date.getTime() - f1.date.getTime();
    } else if (f1.date && !f2.date) {
      return -1;
    } else if (!f1.date && f2.date) {
      return 1;
    }
    return f1.title.localeCompare(f2.title);
  }).map(([slug, content]) => createURLEntry(simplifySlug(slug), content)).slice(0, limit ?? idx.size).join("");
  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
    <channel>
      <title>${escapeHTML(cfg.pageTitle)}</title>
      <link>https://${base}</link>
      <description>${!!limit ? i18n(cfg.locale).pages.rss.lastFewNotes({ count: limit }) : i18n(cfg.locale).pages.rss.recentNotes} on ${escapeHTML(
    cfg.pageTitle
  )}</description>
      <generator>Quartz -- quartz.jzhao.xyz</generator>
      ${items}
    </channel>
  </rss>`;
}
__name(generateRSSFeed, "generateRSSFeed");
var ContentIndex = /* @__PURE__ */ __name((opts) => {
  opts = { ...defaultOptions18, ...opts };
  return {
    name: "ContentIndex",
    async *emit(ctx, content) {
      const cfg = ctx.cfg.configuration;
      const linkIndex = /* @__PURE__ */ new Map();
      for (const [tree, file] of content) {
        const slug = file.data.slug;
        const date = getDate(ctx.cfg.configuration, file.data) ?? /* @__PURE__ */ new Date();
        if (opts?.includeEmptyFiles || file.data.text && file.data.text !== "") {
          linkIndex.set(slug, {
            slug,
            filePath: file.data.relativePath,
            title: file.data.frontmatter?.title,
            links: file.data.links ?? [],
            tags: file.data.frontmatter?.tags ?? [],
            content: file.data.text ?? "",
            richContent: opts?.rssFullHtml ? escapeHTML(toHtml2(tree, { allowDangerousHtml: true })) : void 0,
            date,
            description: file.data.description ?? ""
          });
        }
      }
      if (opts?.enableSiteMap) {
        yield write({
          ctx,
          content: generateSiteMap(cfg, linkIndex),
          slug: "sitemap",
          ext: ".xml"
        });
      }
      if (opts?.enableRSS) {
        yield write({
          ctx,
          content: generateRSSFeed(cfg, linkIndex, opts.rssLimit),
          slug: opts?.rssSlug ?? "index",
          ext: ".xml"
        });
      }
      const fp = joinSegments("static", "contentIndex");
      const simplifiedIndex = Object.fromEntries(
        Array.from(linkIndex).map(([slug, content2]) => {
          delete content2.description;
          delete content2.date;
          return [slug, content2];
        })
      );
      yield write({
        ctx,
        content: JSON.stringify(simplifiedIndex),
        slug: fp,
        ext: ".json"
      });
    },
    externalResources: /* @__PURE__ */ __name((ctx) => {
      if (opts?.enableRSS) {
        return {
          additionalHead: [
            /* @__PURE__ */ jsx39(
              "link",
              {
                rel: "alternate",
                type: "application/rss+xml",
                title: "RSS Feed",
                href: `https://${ctx.cfg.configuration.baseUrl}/index.xml`
              }
            )
          ]
        };
      }
    }, "externalResources")
  };
}, "ContentIndex");

// quartz/plugins/emitters/aliases.ts
import path7 from "path";
async function* processFile(ctx, file) {
  const ogSlug = simplifySlug(file.data.slug);
  for (const aliasTarget of file.data.aliases ?? []) {
    const aliasTargetSlug = isRelativeURL(aliasTarget) ? path7.normalize(path7.join(ogSlug, "..", aliasTarget)) : aliasTarget;
    const redirUrl = resolveRelative(aliasTargetSlug, ogSlug);
    yield write({
      ctx,
      content: `
        <!DOCTYPE html>
        <html lang="en-us">
        <head>
        <title>${ogSlug}</title>
        <link rel="canonical" href="${redirUrl}">
        <meta name="robots" content="noindex">
        <meta charset="utf-8">
        <meta http-equiv="refresh" content="0; url=${redirUrl}">
        </head>
        </html>
        `,
      slug: aliasTargetSlug,
      ext: ".html"
    });
  }
}
__name(processFile, "processFile");
var AliasRedirects = /* @__PURE__ */ __name(() => ({
  name: "AliasRedirects",
  async *emit(ctx, content) {
    for (const [_tree, file] of content) {
      yield* processFile(ctx, file);
    }
  },
  async *partialEmit(ctx, _content, _resources, changeEvents) {
    for (const changeEvent of changeEvents) {
      if (!changeEvent.file) continue;
      if (changeEvent.type === "add" || changeEvent.type === "change") {
        yield* processFile(ctx, changeEvent.file);
      }
    }
  }
}), "AliasRedirects");

// quartz/plugins/emitters/assets.ts
import path9 from "path";
import fs3 from "fs";

// quartz/util/glob.ts
import path8 from "path";
import { globby } from "globby";
function toPosixPath(fp) {
  return fp.split(path8.sep).join("/");
}
__name(toPosixPath, "toPosixPath");
async function glob(pattern, cwd, ignorePatterns) {
  const fps = (await globby(pattern, {
    cwd,
    ignore: ignorePatterns,
    gitignore: true
  })).map(toPosixPath);
  return fps;
}
__name(glob, "glob");

// quartz/plugins/emitters/assets.ts
var filesToCopy = /* @__PURE__ */ __name(async (argv, cfg) => {
  return await glob("**", argv.directory, ["**/*.md", ...cfg.configuration.ignorePatterns]);
}, "filesToCopy");
var copyFile = /* @__PURE__ */ __name(async (argv, fp) => {
  const src = joinSegments(argv.directory, fp);
  const name = slugifyFilePath(fp);
  const dest = joinSegments(argv.output, name);
  const dir = path9.dirname(dest);
  await fs3.promises.mkdir(dir, { recursive: true });
  await fs3.promises.copyFile(src, dest);
  return dest;
}, "copyFile");
var Assets = /* @__PURE__ */ __name(() => {
  return {
    name: "Assets",
    async *emit({ argv, cfg }) {
      const fps = await filesToCopy(argv, cfg);
      for (const fp of fps) {
        yield copyFile(argv, fp);
      }
    },
    async *partialEmit(ctx, _content, _resources, changeEvents) {
      for (const changeEvent of changeEvents) {
        const ext = path9.extname(changeEvent.path);
        if (ext === ".md") continue;
        if (changeEvent.type === "add" || changeEvent.type === "change") {
          yield copyFile(ctx.argv, changeEvent.path);
        } else if (changeEvent.type === "delete") {
          const name = slugifyFilePath(changeEvent.path);
          const dest = joinSegments(ctx.argv.output, name);
          await fs3.promises.unlink(dest);
        }
      }
    }
  };
}, "Assets");

// quartz/plugins/emitters/static.ts
import fs4 from "fs";
import { dirname } from "path";
var Static = /* @__PURE__ */ __name(() => ({
  name: "Static",
  async *emit({ argv, cfg }) {
    const staticPath = joinSegments(QUARTZ, "static");
    const fps = await glob("**", staticPath, cfg.configuration.ignorePatterns);
    const outputStaticPath = joinSegments(argv.output, "static");
    await fs4.promises.mkdir(outputStaticPath, { recursive: true });
    for (const fp of fps) {
      const src = joinSegments(staticPath, fp);
      const dest = joinSegments(outputStaticPath, fp);
      await fs4.promises.mkdir(dirname(dest), { recursive: true });
      await fs4.promises.copyFile(src, dest);
      yield dest;
    }
  },
  async *partialEmit() {
  }
}), "Static");

// quartz/plugins/emitters/favicon.ts
import sharp2 from "sharp";
var Favicon = /* @__PURE__ */ __name(() => ({
  name: "Favicon",
  async *emit({ argv }) {
    const iconPath = joinSegments(QUARTZ, "static", "icon.png");
    const faviconContent = sharp2(iconPath).resize(48, 48).toFormat("png");
    yield write({
      ctx: { argv },
      slug: "favicon",
      ext: ".ico",
      content: faviconContent
    });
  },
  async *partialEmit() {
  }
}), "Favicon");

// quartz/components/scripts/spa.inline.ts
var spa_inline_default = "";

// quartz/components/scripts/popover.inline.ts
var popover_inline_default = "";

// quartz/styles/custom.scss
var custom_default = "";

// quartz/components/styles/popover.scss
var popover_default = "";

// quartz/plugins/emitters/componentResources.ts
import { Features, transform } from "lightningcss";
import { transform as transpile } from "esbuild";
function getComponentResources(ctx) {
  const allComponents = /* @__PURE__ */ new Set();
  for (const emitter of ctx.cfg.plugins.emitters) {
    const components = emitter.getQuartzComponents?.(ctx) ?? [];
    for (const component of components) {
      allComponents.add(component);
    }
  }
  const componentResources = {
    css: /* @__PURE__ */ new Set(),
    beforeDOMLoaded: /* @__PURE__ */ new Set(),
    afterDOMLoaded: /* @__PURE__ */ new Set()
  };
  function normalizeResource(resource) {
    if (!resource) return [];
    if (Array.isArray(resource)) return resource;
    return [resource];
  }
  __name(normalizeResource, "normalizeResource");
  for (const component of allComponents) {
    const { css, beforeDOMLoaded, afterDOMLoaded } = component;
    const normalizedCss = normalizeResource(css);
    const normalizedBeforeDOMLoaded = normalizeResource(beforeDOMLoaded);
    const normalizedAfterDOMLoaded = normalizeResource(afterDOMLoaded);
    normalizedCss.forEach((c) => componentResources.css.add(c));
    normalizedBeforeDOMLoaded.forEach((b) => componentResources.beforeDOMLoaded.add(b));
    normalizedAfterDOMLoaded.forEach((a) => componentResources.afterDOMLoaded.add(a));
  }
  return {
    css: [...componentResources.css],
    beforeDOMLoaded: [...componentResources.beforeDOMLoaded],
    afterDOMLoaded: [...componentResources.afterDOMLoaded]
  };
}
__name(getComponentResources, "getComponentResources");
async function joinScripts(scripts) {
  const script = scripts.map((script2) => `(function () {${script2}})();`).join("\n");
  const res = await transpile(script, {
    minify: true
  });
  return res.code;
}
__name(joinScripts, "joinScripts");
function addGlobalPageResources(ctx, componentResources) {
  const cfg = ctx.cfg.configuration;
  if (cfg.enablePopovers) {
    componentResources.afterDOMLoaded.push(popover_inline_default);
    componentResources.css.push(popover_default);
  }
  if (cfg.analytics?.provider === "google") {
    const tagId = cfg.analytics.tagId;
    componentResources.afterDOMLoaded.push(`
      const gtagScript = document.createElement('script');
      gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=${tagId}';
      gtagScript.defer = true;
      gtagScript.onload = () => {
        window.dataLayer = window.dataLayer || [];
        function gtag() {
          dataLayer.push(arguments);
        }
        gtag('js', new Date());
        gtag('config', '${tagId}', { send_page_view: false });
        gtag('event', 'page_view', { page_title: document.title, page_location: location.href });
        document.addEventListener('nav', () => {
          gtag('event', 'page_view', { page_title: document.title, page_location: location.href });
        });
      };
      
      document.head.appendChild(gtagScript);
    `);
  } else if (cfg.analytics?.provider === "plausible") {
    const plausibleHost = cfg.analytics.host ?? "https://plausible.io";
    componentResources.afterDOMLoaded.push(`
      const plausibleScript = document.createElement('script');
      plausibleScript.src = '${plausibleHost}/js/script.manual.js';
      plausibleScript.setAttribute('data-domain', location.hostname);
      plausibleScript.defer = true;
      plausibleScript.onload = () => {
        window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
        plausible('pageview');
        document.addEventListener('nav', () => {
          plausible('pageview');
        });
      };

      document.head.appendChild(plausibleScript);
    `);
  } else if (cfg.analytics?.provider === "umami") {
    componentResources.afterDOMLoaded.push(`
      const umamiScript = document.createElement("script");
      umamiScript.src = "${cfg.analytics.host ?? "https://analytics.umami.is"}/script.js";
      umamiScript.setAttribute("data-website-id", "${cfg.analytics.websiteId}");
      umamiScript.setAttribute("data-auto-track", "true");
      umamiScript.defer = true;

      document.head.appendChild(umamiScript);
    `);
  } else if (cfg.analytics?.provider === "goatcounter") {
    componentResources.afterDOMLoaded.push(`
      const goatcounterScriptPre = document.createElement('script');
      goatcounterScriptPre.textContent = \`
        window.goatcounter = { no_onload: true };
      \`;
      document.head.appendChild(goatcounterScriptPre);

      const endpoint = "https://${cfg.analytics.websiteId}.${cfg.analytics.host ?? "goatcounter.com"}/count";
      const goatcounterScript = document.createElement('script');
      goatcounterScript.src = "${cfg.analytics.scriptSrc ?? "https://gc.zgo.at/count.js"}";
      goatcounterScript.defer = true;
      goatcounterScript.setAttribute('data-goatcounter', endpoint);
      goatcounterScript.onload = () => {
        window.goatcounter.endpoint = endpoint;
        goatcounter.count({ path: location.pathname });
        document.addEventListener('nav', () => {
          goatcounter.count({ path: location.pathname });
        });
      };

      document.head.appendChild(goatcounterScript);
    `);
  } else if (cfg.analytics?.provider === "posthog") {
    componentResources.afterDOMLoaded.push(`
      const posthogScript = document.createElement("script");
      posthogScript.innerHTML= \`!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
      posthog.init('${cfg.analytics.apiKey}', {
        api_host: '${cfg.analytics.host ?? "https://app.posthog.com"}',
        capture_pageview: false,
      });
      document.addEventListener('nav', () => {
        posthog.capture('$pageview', { path: location.pathname });
      })\`

      document.head.appendChild(posthogScript);
    `);
  } else if (cfg.analytics?.provider === "tinylytics") {
    const siteId = cfg.analytics.siteId;
    componentResources.afterDOMLoaded.push(`
      const tinylyticsScript = document.createElement('script');
      tinylyticsScript.src = 'https://tinylytics.app/embed/${siteId}.js?spa';
      tinylyticsScript.defer = true;
      tinylyticsScript.onload = () => {
        window.tinylytics.triggerUpdate();
        document.addEventListener('nav', () => {
          window.tinylytics.triggerUpdate();
        });
      };
      
      document.head.appendChild(tinylyticsScript);
    `);
  } else if (cfg.analytics?.provider === "cabin") {
    componentResources.afterDOMLoaded.push(`
      const cabinScript = document.createElement("script")
      cabinScript.src = "${cfg.analytics.host ?? "https://scripts.withcabin.com"}/hello.js"
      cabinScript.defer = true
      document.head.appendChild(cabinScript)
    `);
  } else if (cfg.analytics?.provider === "clarity") {
    componentResources.afterDOMLoaded.push(`
      const clarityScript = document.createElement("script")
      clarityScript.innerHTML= \`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.defer=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${cfg.analytics.projectId}");\`
      document.head.appendChild(clarityScript)
    `);
  } else if (cfg.analytics?.provider === "matomo") {
    componentResources.afterDOMLoaded.push(`
      const matomoScript = document.createElement("script");
      matomoScript.innerHTML = \`
      let _paq = window._paq = window._paq || [];

      // Track SPA navigation
      // https://developer.matomo.org/guides/spa-tracking
      document.addEventListener("nav", () => {
        _paq.push(['setCustomUrl', location.pathname]);
        _paq.push(['setDocumentTitle', document.title]);
        _paq.push(['trackPageView']);
      });

      _paq.push(['trackPageView']);
      _paq.push(['enableLinkTracking']);
      (function() {
        const u="//${cfg.analytics.host}/";
        _paq.push(['setTrackerUrl', u+'matomo.php']);
        _paq.push(['setSiteId', ${cfg.analytics.siteId}]);
        const d=document, g=d.createElement('script'), s=d.getElementsByTagName
('script')[0];
        g.type='text/javascript'; g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
      })();
      \`
      document.head.appendChild(matomoScript);
    `);
  } else if (cfg.analytics?.provider === "vercel") {
    componentResources.beforeDOMLoaded.push(`
      window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    `);
    componentResources.afterDOMLoaded.push(`
      const vercelInsightsScript = document.createElement("script")
      vercelInsightsScript.src = "/_vercel/insights/script.js"
      vercelInsightsScript.defer = true
      document.head.appendChild(vercelInsightsScript)
    `);
  } else if (cfg.analytics?.provider === "rybbit") {
    componentResources.afterDOMLoaded.push(`
      const rybbitScript = document.createElement("script");
      rybbitScript.src = "${cfg.analytics.host ?? "https://app.rybbit.io"}/api/script.js";
      rybbitScript.setAttribute("data-site-id", "${cfg.analytics.siteId}");
      rybbitScript.async = true;
      rybbitScript.defer = true;

      document.head.appendChild(rybbitScript);
    `);
  }
  if (cfg.enableSPA) {
    componentResources.afterDOMLoaded.push(spa_inline_default);
  } else {
    componentResources.afterDOMLoaded.push(`
      window.spaNavigate = (url, _) => window.location.assign(url)
      window.addCleanup = () => {}
      const event = new CustomEvent("nav", { detail: { url: document.body.dataset.slug } })
      document.dispatchEvent(event)
    `);
  }
}
__name(addGlobalPageResources, "addGlobalPageResources");
var ComponentResources = /* @__PURE__ */ __name(() => {
  return {
    name: "ComponentResources",
    async *emit(ctx, _content, _resources) {
      const cfg = ctx.cfg.configuration;
      const componentResources = getComponentResources(ctx);
      let googleFontsStyleSheet = "";
      if (cfg.theme.fontOrigin === "local") {
      } else if (cfg.theme.fontOrigin === "googleFonts" && !cfg.theme.cdnCaching) {
        const theme = ctx.cfg.configuration.theme;
        const response = await fetch(googleFontHref(theme));
        googleFontsStyleSheet = await response.text();
        if (theme.typography.title) {
          const title = ctx.cfg.configuration.pageTitle;
          const response2 = await fetch(googleFontSubsetHref(theme, title));
          googleFontsStyleSheet += `
${await response2.text()}`;
        }
        if (!cfg.baseUrl) {
          throw new Error(
            "baseUrl must be defined when using Google Fonts without cfg.theme.cdnCaching"
          );
        }
        const { processedStylesheet, fontFiles } = await processGoogleFonts(
          googleFontsStyleSheet,
          cfg.baseUrl
        );
        googleFontsStyleSheet = processedStylesheet;
        for (const fontFile of fontFiles) {
          const res = await fetch(fontFile.url);
          if (!res.ok) {
            throw new Error(`Failed to fetch font ${fontFile.filename}`);
          }
          const buf = await res.arrayBuffer();
          yield write({
            ctx,
            slug: joinSegments("static", "fonts", fontFile.filename),
            ext: `.${fontFile.extension}`,
            content: Buffer.from(buf)
          });
        }
      }
      addGlobalPageResources(ctx, componentResources);
      const stylesheet = joinStyles(
        ctx.cfg.configuration.theme,
        googleFontsStyleSheet,
        ...componentResources.css,
        custom_default
      );
      const [prescript, postscript] = await Promise.all([
        joinScripts(componentResources.beforeDOMLoaded),
        joinScripts(componentResources.afterDOMLoaded)
      ]);
      yield write({
        ctx,
        slug: "index",
        ext: ".css",
        content: transform({
          filename: "index.css",
          code: Buffer.from(stylesheet),
          minify: true,
          targets: {
            safari: 15 << 16 | 6 << 8,
            // 15.6
            ios_saf: 15 << 16 | 6 << 8,
            // 15.6
            edge: 115 << 16,
            firefox: 102 << 16,
            chrome: 109 << 16
          },
          include: Features.MediaQueries
        }).code.toString()
      });
      yield write({
        ctx,
        slug: "prescript",
        ext: ".js",
        content: prescript
      });
      yield write({
        ctx,
        slug: "postscript",
        ext: ".js",
        content: postscript
      });
    },
    async *partialEmit() {
    }
  };
}, "ComponentResources");

// quartz/plugins/emitters/404.tsx
var NotFoundPage = /* @__PURE__ */ __name(() => {
  const opts = {
    ...sharedPageComponents,
    pageBody: __default(),
    beforeBody: [],
    left: [],
    right: []
  };
  const { head: Head, pageBody, footer: Footer } = opts;
  const Body2 = Body_default();
  return {
    name: "404Page",
    getQuartzComponents() {
      return [Head, Body2, pageBody, Footer];
    },
    async *emit(ctx, _content, resources) {
      const cfg = ctx.cfg.configuration;
      const slug = "404";
      const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`);
      const path11 = url.pathname;
      const notFound = i18n(cfg.locale).pages.error.title;
      const [tree, vfile] = defaultProcessedContent({
        slug,
        text: notFound,
        description: notFound,
        frontmatter: { title: notFound, tags: [] }
      });
      const externalResources = pageResources(path11, resources);
      const componentData = {
        ctx,
        fileData: vfile.data,
        externalResources,
        cfg,
        children: [],
        tree,
        allFiles: []
      };
      yield write({
        ctx,
        content: renderPage(cfg, slug, componentData, opts, externalResources),
        slug,
        ext: ".html"
      });
    },
    async *partialEmit() {
    }
  };
}, "NotFoundPage");

// quartz.config.ts
var config = {
  configuration: {
    pageTitle: "Scott Adams Wiki",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "plausible"
    },
    locale: "en-US",
    baseUrl: "scottadams.wiki",
    ignorePatterns: ["private", "templates", ".obsidian", "_templates"],
    defaultDateType: "created",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "Inter",
        body: "Inter",
        code: "JetBrains Mono"
      },
      colors: {
        lightMode: {
          light: "#faf8f8",
          lightgray: "#e5e5e5",
          gray: "#b8b8b8",
          darkgray: "#4e4e4e",
          dark: "#2b2b2b",
          secondary: "#284b63",
          tertiary: "#84a59d",
          highlight: "rgba(143, 159, 169, 0.15)",
          textHighlight: "#fff23688"
        },
        darkMode: {
          light: "#161618",
          lightgray: "#393639",
          gray: "#646464",
          darkgray: "#d4d4d4",
          dark: "#ebebec",
          secondary: "#7b97aa",
          tertiary: "#84a59d",
          highlight: "rgba(143, 159, 169, 0.15)",
          textHighlight: "#fff23688"
        }
      }
    }
  },
  plugins: {
    transformers: [
      FrontMatter(),
      CreatedModifiedDate({
        priority: ["frontmatter", "filesystem"]
      }),
      SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark"
        },
        keepBackground: false
      }),
      ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      GitHubFlavoredMarkdown(),
      TableOfContents(),
      CrawlLinks({ markdownLinkResolution: "shortest" }),
      Description(),
      Latex({ renderEngine: "katex" })
    ],
    filters: [RemoveDrafts()],
    emitters: [
      AliasRedirects(),
      ComponentResources(),
      ContentPage(),
      FolderPage(),
      TagPage(),
      ContentIndex({
        enableSiteMap: true,
        enableRSS: true
      }),
      Assets(),
      Static(),
      Favicon(),
      NotFoundPage()
    ]
  }
};
var quartz_config_default = config;

// quartz/processors/parse.ts
import esbuild from "esbuild";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

// quartz/util/perf.ts
import pretty from "pretty-time";
import { styleText as styleText5 } from "util";
var PerfTimer = class {
  static {
    __name(this, "PerfTimer");
  }
  evts;
  constructor() {
    this.evts = {};
    this.addEvent("start");
  }
  addEvent(evtName) {
    this.evts[evtName] = process.hrtime();
  }
  timeSince(evtName) {
    return styleText5("yellow", pretty(process.hrtime(this.evts[evtName ?? "start"])));
  }
};

// quartz/processors/parse.ts
import { read } from "to-vfile";
import path10 from "path";
import workerpool from "workerpool";

// quartz/util/log.ts
import truncate from "ansi-truncate";

// quartz/processors/parse.ts
function createMdProcessor(ctx) {
  const transformers = ctx.cfg.plugins.transformers;
  return unified().use(remarkParse).use(
    transformers.flatMap((plugin) => plugin.markdownPlugins?.(ctx) ?? [])
  );
}
__name(createMdProcessor, "createMdProcessor");
function createHtmlProcessor(ctx) {
  const transformers = ctx.cfg.plugins.transformers;
  return unified().use(remarkRehype, { allowDangerousHtml: true }).use(transformers.flatMap((plugin) => plugin.htmlPlugins?.(ctx) ?? []));
}
__name(createHtmlProcessor, "createHtmlProcessor");
function createFileParser(ctx, fps) {
  const { argv, cfg } = ctx;
  return async (processor) => {
    const res = [];
    for (const fp of fps) {
      try {
        const perf = new PerfTimer();
        const file = await read(fp);
        file.value = file.value.toString().trim();
        for (const plugin of cfg.plugins.transformers.filter((p) => p.textTransform)) {
          file.value = plugin.textTransform(ctx, file.value.toString());
        }
        file.data.filePath = file.path;
        file.data.relativePath = path10.posix.relative(argv.directory, file.path);
        file.data.slug = slugifyFilePath(file.data.relativePath);
        const ast = processor.parse(file);
        const newAst = await processor.run(ast, file);
        res.push([newAst, file]);
        if (argv.verbose) {
          console.log(`[markdown] ${fp} -> ${file.data.slug} (${perf.timeSince()})`);
        }
      } catch (err) {
        trace(`
Failed to process markdown \`${fp}\``, err);
      }
    }
    return res;
  };
}
__name(createFileParser, "createFileParser");
function createMarkdownParser(ctx, mdContent) {
  return async (processor) => {
    const res = [];
    for (const [ast, file] of mdContent) {
      try {
        const perf = new PerfTimer();
        const newAst = await processor.run(ast, file);
        res.push([newAst, file]);
        if (ctx.argv.verbose) {
          console.log(`[html] ${file.data.slug} (${perf.timeSince()})`);
        }
      } catch (err) {
        trace(`
Failed to process html \`${file.data.filePath}\``, err);
      }
    }
    return res;
  };
}
__name(createMarkdownParser, "createMarkdownParser");

// quartz/util/sourcemap.ts
import fs5 from "fs";
import { fileURLToPath } from "url";
var options = {
  // source map hack to get around query param
  // import cache busting
  retrieveSourceMap(source) {
    if (source.includes(".quartz-cache")) {
      let realSource = fileURLToPath(source.split("?", 2)[0] + ".map");
      return {
        map: fs5.readFileSync(realSource, "utf8")
      };
    } else {
      return null;
    }
  }
};

// quartz/worker.ts
sourceMapSupport.install(options);
async function parseMarkdown(partialCtx, fps) {
  const ctx = {
    ...partialCtx,
    cfg: quartz_config_default
  };
  return await createFileParser(ctx, fps)(createMdProcessor(ctx));
}
__name(parseMarkdown, "parseMarkdown");
function processHtml(partialCtx, mds) {
  const ctx = {
    ...partialCtx,
    cfg: quartz_config_default
  };
  return createMarkdownParser(ctx, mds)(createHtmlProcessor(ctx));
}
__name(processHtml, "processHtml");
export {
  parseMarkdown,
  processHtml
};
//# sourceMappingURL=transpiled-worker.mjs.map
