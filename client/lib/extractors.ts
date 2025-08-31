import Tesseract from "tesseract.js";

const workerUrl = "/tesseract/worker.min.js";
const coreUrl = "/tesseract/tesseract-core.wasm.js";


import PdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?worker";
import * as pdfjs from "pdfjs-dist";


const worker = new PdfWorker();

(pdfjs as any).GlobalWorkerOptions.workerPort = worker;

export async function extractTextFromPdf(file: File): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await (pdfjs as any).getDocument({ data }).promise;
  let fullText = "";
  const pageCount = doc.numPages;
  for (let i = 1; i <= pageCount; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings: string[] = (content.items || []).map((it: any) => it.str || "");
    fullText += strings.join(" ") + "\n";
  }
  return fullText.trim();
}

export async function extractTextFromImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const { data } = await Tesseract.recognize(url, "eng", {
      workerPath: workerUrl as unknown as string,
      corePath: coreUrl as unknown as string,
      langPath: "https://tessdata.projectnaptha.com/4.0.0",
    } as any);
    return (data?.text || "").trim();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === "application/pdf") return extractTextFromPdf(file);
  if (file.type.startsWith("image/")) return extractTextFromImage(file);
  return "";
}
