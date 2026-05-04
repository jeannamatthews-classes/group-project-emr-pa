import multer from 'multer';
import fs from 'fs';
import path from 'path';

const backendAppRoot = path.resolve(__dirname, '..', '..');
const repoRoot = path.resolve(backendAppRoot, '..', '..');

// Always keep new uploads inside the backend app so the storage location is stable.
export const uploadsRoot = path.resolve(backendAppRoot, 'uploads');

const uploadRoots = Array.from(
  new Set(
    [
      uploadsRoot,
      path.resolve(backendAppRoot, '..', 'uploads'),
      path.resolve(repoRoot, 'uploads'),
      path.resolve(process.cwd(), 'uploads'),
    ].map((candidate) => path.normalize(candidate))
  )
);

function ensureDirectoryExists(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function getRelativeUploadPath(fileUrl: string): string | null {
  if (typeof fileUrl !== 'string' || !fileUrl.startsWith('/uploads/')) {
    return null;
  }

  const relativePath = fileUrl.replace(/^\/uploads\//, '');
  if (!relativePath) {
    return null;
  }

  return relativePath;
}

function resolveUploadPathWithinRoot(root: string, relativePath: string): string | null {
  const resolvedPath = path.resolve(root, relativePath);
  const relativeToRoot = path.relative(root, resolvedPath);

  if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
    return null;
  }

  return resolvedPath;
}

function createStorage(subdirectory: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      const destination = path.join(uploadsRoot, subdirectory);
      ensureDirectoryExists(destination);
      cb(null, destination);
    },
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });
}

function createUploader(
  allowedMimeTypes: string[],
  maxFileSize: number,
  subdirectory: string
) {
  const storage = createStorage(subdirectory);

  return multer({
    storage,
    limits: { fileSize: maxFileSize },
    fileFilter: (_req, file, cb) => {
      cb(null, allowedMimeTypes.includes(file.mimetype));
    },
  });
}

export const upload = createUploader(
  ['image/jpeg', 'image/png', 'image/webp'],
  5 * 1024 * 1024,
  'pictures'
);

export const labUpload = createUploader(
  [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
    'text/csv',
    'application/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  10 * 1024 * 1024,
  'labs'
);

export type UploadedFileLike = {
  filename: string;
  originalname: string;
  mimetype: string;
  destination: string;
};

export function buildUploadUrl(file: UploadedFileLike): string {
  const relativeDirectory = path.relative(uploadsRoot, file.destination).replace(/\\/g, '/');
  return relativeDirectory ? `/uploads/${relativeDirectory}/${file.filename}` : `/uploads/${file.filename}`;
}

export function resolveUploadPathFromUrl(fileUrl: string): string | null {
  const relativePath = getRelativeUploadPath(fileUrl);
  if (!relativePath) return null;
  return resolveUploadPathWithinRoot(uploadsRoot, relativePath);
}

export function resolveExistingUploadPathFromUrl(fileUrl: string): string | null {
  const relativePath = getRelativeUploadPath(fileUrl);
  if (!relativePath) {
    return null;
  }

  for (const root of uploadRoots) {
    const resolvedPath = resolveUploadPathWithinRoot(root, relativePath);
    if (resolvedPath && fs.existsSync(resolvedPath)) {
      return resolvedPath;
    }
  }

  return null;
}

export function copyUploadFileToSubdirectory(
  fileUrl: string,
  subdirectory: string,
  originalFilename?: string
): string {
  const sourcePath = resolveExistingUploadPathFromUrl(fileUrl);
  if (!sourcePath) {
    throw new Error(`Stored upload file is missing for ${fileUrl}`);
  }

  const destination = path.join(uploadsRoot, subdirectory);
  ensureDirectoryExists(destination);

  const extension = path.extname(originalFilename || sourcePath) || path.extname(sourcePath);
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
  const destinationPath = path.join(destination, filename);
  fs.copyFileSync(sourcePath, destinationPath);

  return buildUploadUrl({
    filename,
    originalname: originalFilename || path.basename(sourcePath),
    mimetype: '',
    destination,
  });
}

export function deleteUploadFileIfExists(fileUrl: string): void {
  const relativePath = getRelativeUploadPath(fileUrl);
  if (!relativePath) {
    return;
  }

  for (const root of uploadRoots) {
    const resolvedPath = resolveUploadPathWithinRoot(root, relativePath);
    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      continue;
    }

    try {
      fs.unlinkSync(resolvedPath);
    } catch (error) {
      console.error(`Failed to delete upload file at ${resolvedPath}:`, error);
    }
  }
}
