import { Tokenizer } from "marked";
import { EOL } from "os";

// Heavily inspired by marked-tex-renderer
// https://github.com/sampathsris/marked-tex-renderer

type Renderer = {
  code(code: string, infostring: string, escaped: boolean): string;
  blockquote(quote: string): string;
  html(html: string): string;
  heading(text: string, level: number, raw?: string, slugger?: Slugger): string;
  hr(): string;
  list(body: string, ordered: boolean, start?: number): string;
  listitem(text: string, task?: boolean, checked?: boolean): string;
  checkbox(checked: boolean): string;
  paragraph(text: string): string;
  table(header: string, body: string): string;
  tablerow(content: string): string;
  tablecell(content: string, flags: object): string;
  strong(text: string): string;
  em(text: string): string;
  codespan(code: string): string;
  br(): string;
  del(text: string): string;
  link(href: string, title: string, text: string): string;
  image(href: string, title: string, text: string): string;
  text(text: string): string;
};

type Slugger = {
  slug(text: string): string;
};

export const renderer: Renderer = {
  code(code, lang, escaped) {
    if (lang === "mdtotex") {
      return code + EOL + EOL;
    }
    throw new Error("Code blocks are not supported.");
  },
  blockquote(quote) {
    throw new Error("Blockquotes are not supported.");
  },
  html(html) {
    throw new Error("HTML is not supported.");
  },
  heading(text, level, raw) {
    let command = "";

    switch (level) {
      case 1:
        command = "\\chapter";
        break;
      case 2:
        command = "\\section";
        break;
      case 3:
        command = "\\subsection";
        break;
      case 4:
        command = "\\subsubsection";
        break;
      case 5:
        command = "\\paragraph";
        break;
      case 6:
        command = "\\subparagraph";
        break;
    }

    // TODO: Handle hiding of headings in TOC, by adding a * after the command

    return EOL + command + "{" + text + "}" + EOL + EOL;
  },
  hr() {
    return EOL + "\\clearpage" + EOL + EOL;
  },
  list(body, ordered) {
    if (ordered) {
      return (
        EOL + "\\begin{enumerate}" + EOL + body + EOL + "\\end{enumerate}" + EOL
      );
    } else {
      return EOL + "\\begin{itemize}" + EOL + body + "\\end{itemize}" + EOL;
    }
  },
  listitem(text) {
    return "\\item " + text + EOL;
  },
  checkbox(checked) {
    throw new Error("Checkboxes are not supported.");
  },
  paragraph(text) {
    return text + EOL + EOL;
  },
  table(header, body) {
    throw new Error("Tables are not supported.");
  },
  tablerow(content) {
    throw new Error("Table rows are not supported.");
  },
  tablecell(content, flags) {
    throw new Error("Table cells are not supported.");
  },
  strong(text) {
    return "\\textbf{" + text + "}";
  },
  em(text) {
    return "\\emph{" + text + "}";
  },
  codespan(code) {
    const unescapedCode = unescape(code);
    if (unescapedCode.startsWith("mdtotex")) {
      const rawCode = unescapedCode.replace("mdtotex", "").trim();
      return rawCode;
    }
    return "\\texttt{" + unescapedCode + "}";
  },
  br() {
    return "\\\\";
  },
  del(text) {
    throw new Error(`Strikethrough is not supported. ["${text}"]`);
  },
  link(href, title, text) {
    // requires \usepackage{hyperref}
    return "\\href{" + href + "}{" + text + "}";
  },
  image(href, title, text) {
    return `\\input{${text}}` + EOL;
  },
  text(text) {
    return texEscape(htmlUnescape(text));
  },
};

// Renderer Helper
function htmlUnescape(html) {
  return html.replace(/&([#\w]+);/g, function (_, n) {
    n = n.toLowerCase();

    if (n === "colon") return ":";
    if (n === "amp") return "&";

    if (n.charAt(0) === "#") {
      var charCode = 0;

      if (n.charAt(1) === "x") {
        charCode = parseInt(n.substring(2), 16);
      } else {
        charCode = +n.substring(1);
      }

      return String.fromCharCode(charCode);
    }

    return "";
  });
}

function texEscape(text) {
  // some characters have special meaning in TeX
  //     \ & % $ # _ { } ~ ^
  return text
    .replace(/\\/g, "\\textbackslash ")
    .replace(/\&/g, "\\& ")
    .replace(/%/g, "\\% ")
    .replace(/\$/g, "\\$ ")
    .replace(/#/g, "\\# ")
    .replace(/\_/g, "\\_ ")
    .replace(/\{/g, "\\{ ")
    .replace(/\}/g, "\\} ")
    .replace(/~/g, "\\textasciitilde ")
    .replace(/\^/g, "\\textasciicircum ");
}

function unescape(text: string): string {
  const escapeReplacements = [
    ["&amp;", "&"],
    ["&lt;", "<"],
    ["&gt;", ">"],
    ["&quot;", '"'],
    ["&#39;", "'"],
  ];

  let result = text;
  for (const [key, value] of escapeReplacements) {
    const regex = new RegExp(key, "g");
    result = result.replace(regex, value);
  }
  return result;
}

export const extensions = [
  {
    name: "latex",
    level: "inline",
    start(src) {
      return src.match(/\$/)?.index;
    },
    tokenizer(src, tokens) {
      const rule = /^\$([^\$\n]+)\$/;
      const match = rule.exec(src);
      if (match) {
        return {
          type: "latex",
          raw: match[0],
          latexExpression: match[1],
        };
      }
    },
    renderer(token) {
      return "$" + token.latexExpression + "$";
    },
  },
  {
    name: "cite",
    level: "inline",
    start(src) {
      return src.match(/@|\[@/)?.index;
    },
    tokenizer(src, tokens) {
      const directRule = /^@([a-zA-Z][a-zA-Z0-9]*)(?:\s\[(.*?)\])?/;
      const indirectRule =
        /^\[@[a-zA-Z][a-zA-Z0-9]*(,\s(.*?))?(;\s@[a-zA-Z][a-zA-Z0-9]*(,\s(.*?))?)*\]/;

      const directMatch = directRule.exec(src);
      if (directMatch) {
        const authors = [];
        const pages = [];

        authors.push(directMatch[1].trim());
        if (directMatch[2]) {
          pages.push(directMatch[2].trim().replace(/\s/g, "~"));
        }

        return {
          type: "cite",
          raw: directMatch[0],
          authors,
          pages,
          isIndirect: false,
        };
      }

      const indirectMatch = indirectRule.exec(src);
      if (indirectMatch) {
        const authors = [];
        const pages = [];

        const parts = indirectMatch[0].slice(1, -1).split(";");
        parts.forEach((part) => {
          const [author, page] = part.split(",").map((s) => s.trim());
          authors.push(author.startsWith("@") ? author.slice(1) : author);
          if (page) {
            pages.push(page.replace(/\s/g, "~"));
          }
        });

        return {
          type: "cite",
          raw: indirectMatch[0],
          authors,
          pages,
          isIndirect: true,
        };
      }
    },
    renderer({ authors, pages, isIndirect }) {
      if (isIndirect) {
        const citations = [];
        authors.forEach((author, index) => {
          citations.push(
            `||citeauthor{${author} \\citeyear[${pages[index]}]{${author}}`
          );
        });
        return `(${citations.join("; ")})`;
      } else {
        return `\\citeauthor{${authors[0]} (\\citeyear[${pages[0]}]{${authors[0]}}`;
      }
    },
  },
];
