import fs from "fs";
import path from "path";
import { parse } from "fast-csv";
import { NextResponse } from "next/server";

export async function GET(req, res) {
  const filePath = path.join(
    process.cwd(),
    "/src/app/api/questions/questions.csv"
  );
  const fileContent = fs.createReadStream(filePath, "utf-8");

  const results = [];
  return new Promise((resolve, reject) => {
    fileContent
      .pipe(parse({ headers: true, discardUnmappedColumns: true }))
      .on("data", (data) => {
        results.push(data);
      })
      .on("end", () => {
        resolve(NextResponse.json(results));
      })
      .on("error", (err) => {
        resolve(NextResponse.json({ error: err.message }, { status: 500 }));
      });
  });
}
