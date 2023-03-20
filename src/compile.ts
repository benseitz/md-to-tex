import {
  existsSync,
  lstatSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import path from "path";
import { convert } from "./convert";

export function compile(inputPath: string, outputPath: string): void {
  const input = readMdFiles(inputPath);
  const content = convert(input);
  writeTexFile(outputPath, content);
}

function readMdFiles(inputPath: string): string {
  // check if the path exists
  if (!existsSync(inputPath)) {
    throw new Error("Input path does not exist.");
  }

  // check if the path points to a directory
  const isDirectory = lstatSync(inputPath).isDirectory();
  if (!isDirectory) {
    // check if the path points to an md file
    if (!inputPath.endsWith(".md")) {
      throw new Error(
        "Input path does not point to an md file. Point to either a md file or a directory containing md files."
      );
    }

    // read the md file and return its content
    return readFileSync(inputPath, "utf-8");
  }

  // get all files in the directory
  const files = readdirSync(inputPath);

  // filter out non-md files
  const mdFiles = files.filter((file) => file.endsWith(".md"));

  if (mdFiles.length === 0) {
    throw new Error(
      "Directory does not contain any md files. Point to either a md file or a directory containing md files."
    );
  }

  // read all md files and concatenate their content
  const contents = mdFiles.map((file) =>
    readFileSync(path.join(inputPath, file), "utf-8")
  );
  return contents.join("\n");
}

function writeTexFile(outputPath: string, content: string): void {
  // check if the path exists
  if (!existsSync(outputPath)) {
    throw new Error("Output path does not exist.");
  }

  // check if the path points to a directory
  const isDirectory = lstatSync(outputPath).isDirectory();
  if (!isDirectory) {
    throw new Error("Output path does not point to a directory");
  }

  writeFileSync(path.join(outputPath, "content.tex"), content);
}
