#!/usr/bin/env node
/**
 * Generate JSON Schema bundle for UI consumption
 * Runs as part of the build process
 */

import { zodToJsonSchema } from "zod-to-json-schema";
import { schemas } from "../src/types.js";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const jsonSchemaBundle = {
	$schema: "http://json-schema.org/draft-07/schema#",
	title: "AI-Quant Core Schemas",
	version: "0.1.0",
	schemas: Object.fromEntries(
		Object.entries(schemas).map(([name, zodSchema]) => [
			name,
			zodToJsonSchema(zodSchema, { $refStrategy: "none" }),
		])
	),
};

const outputPath = resolve(__dirname, "../schema.json");
writeFileSync(outputPath, JSON.stringify(jsonSchemaBundle, null, 2), "utf-8");

console.log(`✓ Generated JSON Schema bundle: ${outputPath}`);
