import fs from "fs";
import path from "path";

const baseDirectory = path.join(process.cwd(), "uploads", "ai-chat");

async function ensureDirectory(target: string) {
  if (!fs.existsSync(target)) {
    await fs.promises.mkdir(target, { recursive: true });
  }
}

export async function ensureAiChatFolders() {
  await ensureDirectory(baseDirectory);
  await ensureDirectory(path.join(baseDirectory, "tmp"));
}

export async function saveUploadedAudio(
  conversationId: number,
  file: Express.Multer.File
): Promise<string> {
  await ensureAiChatFolders();

  const sessionFolder = path.join(baseDirectory, String(conversationId));
  await ensureDirectory(sessionFolder);

  const extension = path.extname(file.originalname) || ".webm";
  const fileName = `${Date.now()}${extension}`;
  const targetPath = path.join(sessionFolder, fileName);

  await fs.promises.rename(file.path, targetPath);

  return path.relative(process.cwd(), targetPath).replace(/\\/g, "/");
}

export async function createAudioWriteStream(
  conversationId: number,
  fileName: string
): Promise<fs.WriteStream> {
  await ensureAiChatFolders();
  const sessionFolder = path.join(baseDirectory, String(conversationId));
  await ensureDirectory(sessionFolder);

  const targetPath = path.join(sessionFolder, fileName);
  return fs.createWriteStream(targetPath);
}

export function resolveAudioPath(relativePath: string): string {
  return path.join(process.cwd(), relativePath);
}
