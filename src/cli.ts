import { program } from "commander";
import { version } from "../package.json";
import { compile } from "./compile";

program.version(version).description("Convert MD to TeX");

program
  .requiredOption("-i, --input <path>", "Path to MD file")
  .requiredOption("-o, --output <path>", "Path to TeX file");

program.parse();

const options = program.opts();

compile(options.input, options.output);
