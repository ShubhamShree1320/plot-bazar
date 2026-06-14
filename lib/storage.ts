import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";

const USE_S3 = !!(process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID);

export async function uploadFile(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<string> {
  if (USE_S3) {
    const { uploadToS3 } = await import("./s3");
    return uploadToS3(fileBuffer, originalName, mimeType);
  }
  return saveLocally(fileBuffer, originalName);
}

export async function deleteFile(fileUrl: string): Promise<void> {
  if (USE_S3 && fileUrl.includes("amazonaws.com")) {
    const { deleteFromS3 } = await import("./s3");
    return deleteFromS3(fileUrl);
  }
  if (fileUrl.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", fileUrl);
    try { await fs.unlink(filePath); } catch { /* ignore missing files */ }
  }
}

async function saveLocally(buffer: Buffer, originalName: string): Promise<string> {
  const ext = path.extname(originalName) || ".jpg";
  const fileName = `${uuidv4()}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "plots");

  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, fileName), buffer);

  return `/uploads/plots/${fileName}`;
}
