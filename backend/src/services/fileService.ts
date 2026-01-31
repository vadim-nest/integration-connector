import fs from "fs";
import csv from "csv-parser";
import path from "path";

export const parseCsv = <T>(filePath: string): Promise<T[]> => {
  const absolutePath = path.resolve(process.cwd(), filePath);

  const results: T[] = [];

  return new Promise((resolve, reject) => {
    if (!fs.existsSync(absolutePath)) {
      return reject(new Error(`File not found: ${absolutePath}`));
    }

    fs.createReadStream(absolutePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
};
