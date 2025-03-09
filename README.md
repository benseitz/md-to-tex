# md-to-tex

GitHub Action to compile Markdown documents to LaTeX and then to PDF.

The markdown files in `./<input-path>/` is compiled to `./<output-path>/content.tex`. This file needs to be included inside `./<output-path>/main.tex` via `\include{content}`.

`./<output-path>/content.tex` will be treated as the root file of the LaTeX project for the PDF compiler.

The complete content of `<output-path>`, including the `.tex` and `.pdf` files, are uploaded to the _GitHub Action Artefacts_.

It uses [markedjs/marked
](https://github.com/markedjs/marked) and [xu-cheng/latex-action](https://github.com/xu-cheng/latex-action). See their documentation for more details.

## Inputs

Each input is provided as a key inside the `with` section of the action.

- `input-path` (required)

  The path to a `.md` file or a directory containing multiple `.md` files. For example:

  ```yaml
  - uses: benseitz/md-to-tex@v1
    with:
      input-path: ./documents
      output-path: ./latex
  ```

- `output-path` (required)

  The path to a directory. **Must** contain an existing `main.tex`. For example:

  ```yaml
  - uses: benseitz/md-to-tex@v1
    with:
      input-path: ./documents
      output-path: ./latex
  ```

## Example

```yaml
name: Build PDF from Markdown documents
on: [push]
jobs:
  build_latex:
    runs-on: ubuntu-latest
    steps:
      - name: Set up Git repository
        uses: actions/checkout@v3
      - name: Compile MD to TEX to PDF
        uses: benseitz/md-to-tex@v1
        with:
          input-path: ./documents
          output-path: ./latex
```
