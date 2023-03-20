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
    return (
      "\\begin{mdframed}[backgroundcolor=bg]" +
      EOL +
      "   \\begin{minted}[xleftmargin=20pt,linenos,breaklines,breakbefore=/?=]{" +
      lang +
      "}" +
      EOL +
      code +
      EOL +
      "   \\end{minted}" +
      EOL +
      "\\end{mdframed} " +
      EOL
    );
  },
  blockquote(quote) {
    return "\\begin{quote}" + EOL + quote + EOL + "\\end{quote}" + EOL;
  },
  html(html) {
    throw new Error("HTML not supported in LaTeX.");
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
    throw new Error(
      "Checkbox not supported in LaTeX. Please use a list instead."
    );
  },
  paragraph(text) {
    return text + EOL + EOL;
  },
  table(header, body) {
    // TODO: Check table implementation
    let headerArr = [];
    let bodyArr = [];
    let hasHeader = false;
    let firstRow = [];
    let tex;
    let tableSpec;

    // remove the trailing comma from header row
    if (header) {
      header = header.substr(0, header.length - 1);
      headerArr = JSON.parse(header);

      if (headerArr.length !== 0) {
        hasHeader = true;
      }
    }

    // remove the trailing comma from body row(s)
    if (body) {
      body = body.substr(0, body.length - 1);
      bodyArr = JSON.parse("[" + body + "]");
    }

    if (headerArr.length !== 0) {
      firstRow = headerArr;
    } else {
      firstRow = bodyArr[0];
    }

    tex = "\\begin{tabular}";

    // create table spec
    tableSpec = "{|";

    for (var i = 0; i < firstRow.length; i++) {
      var alignFlag = firstRow[i].flags.align || "none";
      var align = "l|";

      switch (alignFlag) {
        case "right":
          align = "r|";
          break;
        case "center":
          align = "c|";
          break;
      }

      tableSpec += align;
    }

    tableSpec += "}";
    tex += tableSpec + EOL;

    // create table body
    tex += "\\hline" + EOL;

    if (hasHeader) {
      tex += createTableRow(headerArr);
      tex += "\\hline" + EOL;
    }

    for (var j = 0; j < bodyArr.length; j++) {
      tex += createTableRow(bodyArr[j]);
    }

    tex += "\\hline" + EOL;

    tex += "\\end{tabular}" + EOL;

    return tex;
  },
  tablerow(content) {
    // TODO: Check table implementation
    // remove trailing comma from the list of cells
    let row = content.substr(0, content.length - 1);

    // and return it as a JSON array. add a comma to separate the
    // row from the subsequent rows
    return "[" + row + "],";
  },
  tablecell(content, flags) {
    // TODO: Check table implementation
    // treat the cell as an element of a JSON array, and add a comma
    // to separate it from the subsequent cells
    return JSON.stringify({ content: content, flags: flags }) + ",";
  },
  strong(text) {
    return "\\textbf{" + text + "}";
  },
  em(text) {
    return "\\emph{" + text + "}";
  },
  codespan(code) {
    return "\\texttt{" + code + "}";
  },
  br() {
    return "\\\\";
  },
  del(text) {
    throw new Error("Strikethrough not supported in LaTeX.");
  },
  link(href, title, text) {
    // requires \usepackage{hyperref}
    return "\\href{" + href + "}{" + text + "}";
  },
  image(href, title, text) {
    // requires \usepackage{graphicx}
    return (
      EOL +
      "\\begin{figure}[h]" +
      EOL +
      "   \\centering" +
      EOL +
      "   \\includegraphics{" +
      href +
      "}" +
      EOL +
      "   \\caption{" +
      text +
      "}" +
      EOL +
      "   \\label{figure:" +
      href +
      "}" +
      EOL +
      "\\end{figure}" +
      EOL
    );
  },
  text(text) {
    return texEscape(htmlUnescape(text));
  },
};

// Renderer Helper
function createTableRow(rowArr) {
  var tex = "";

  for (var c = 0; c < rowArr.length; c++) {
    tex += rowArr[c].content;

    if (c < rowArr.length - 1) {
      tex += " & ";
    } else {
      tex += " \\\\" + EOL;
    }
  }

  return tex;
}

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
    .replace(/\\/g, "\\textbackslash")
    .replace(/\&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/\_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\textasciitilde")
    .replace(/\^/g, "\\textasciicircum");
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
      return token.latexExpression;
    },
  },
  {
    name: "cite",
    level: "inline",
    start(src) {
      return src.match(/\^\[/)?.index;
    },
    tokenizer(src, tokens) {
      const rule = /^\^\[([^\^\[\n]+)\]/;
      const match = rule.exec(src);
      if (match) {
        return {
          type: "cite",
          raw: match[0],
          cite: match[1],
        };
      }
    },
    renderer(token) {
      return "\\cite{" + token.cite + "}";
    },
  },
];
