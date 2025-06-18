#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { generateComponent } from "./utils/generateComponent.js";

yargs(hideBin(process.argv))
  .command(
    "add <name>",
    "Gera um componente React",
    (yargs) => {
      return yargs.positional("name", {
        type: "string",
        describe: "Nome do componente",
      });
    },
    (argv) => {
      if (typeof argv.name === "string") {
        generateComponent(argv.name);
      } else {
        console.error("O nome do componente é obrigatório.");
        process.exit(1);
      }
    }
  )
  .demandCommand()
  .parse();