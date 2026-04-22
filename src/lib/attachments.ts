import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { Alert, Platform } from 'react-native';
import { Attachment, AttachmentKind } from '../types';
import { generateId } from './uuid';

const ATTACHMENTS_DIR_NAME = 'attachments';

function ensureAttachmentsDir(): Directory {
  const dir = new Directory(Paths.document, ATTACHMENTS_DIR_NAME);
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

function inferExtension(uri: string, fallback: string): string {
  const cleanUri = uri.split('?')[0]?.split('#')[0] ?? uri;
  const dot = cleanUri.lastIndexOf('.');
  if (dot === -1) return fallback;
  const ext = cleanUri.slice(dot);
  return ext.length > 1 && ext.length < 8 ? ext : fallback;
}

function persist(sourceUri: string, kind: AttachmentKind, name: string, mimeType?: string, size?: number): Attachment {
  const dir = ensureAttachmentsDir();
  const id = generateId();
  const fallbackExt = kind === 'image' ? '.jpg' : '';
  const ext = inferExtension(sourceUri, inferExtension(name, fallbackExt));
  const targetName = `${id}${ext}`;
  const target = new File(dir, targetName);
  new File(sourceUri).copy(target);
  return {
    id,
    uri: target.uri,
    name: name || targetName,
    kind,
    mimeType,
    size,
  };
}

export async function pickFromGallery(): Promise<Attachment[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permissão negada', 'Concede acesso à galeria para anexar fotos.');
    return [];
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    quality: 0.85,
    selectionLimit: 5,
  });
  if (result.canceled || !result.assets) return [];
  return result.assets.map((a) =>
    persist(a.uri, 'image', a.fileName ?? 'foto.jpg', a.mimeType, a.fileSize),
  );
}

export async function takePhoto(): Promise<Attachment[]> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permissão negada', 'Concede acesso à câmara para tirar fotos.');
    return [];
  }
  const result = await ImagePicker.launchCameraAsync({
    quality: 0.85,
    mediaTypes: ['images'],
  });
  if (result.canceled || !result.assets) return [];
  return result.assets.map((a) =>
    persist(a.uri, 'image', a.fileName ?? `foto-${Date.now()}.jpg`, a.mimeType, a.fileSize),
  );
}

export async function pickDocument(): Promise<Attachment[]> {
  const result = await DocumentPicker.getDocumentAsync({
    multiple: true,
    copyToCacheDirectory: true,
    type: '*/*',
  });
  if (result.canceled || !result.assets) return [];
  return result.assets.map((a) =>
    persist(a.uri, 'document', a.name, a.mimeType ?? undefined, a.size ?? undefined),
  );
}

export function deleteAttachmentFile(attachment: Attachment): void {
  try {
    const file = new File(attachment.uri);
    if (file.exists) file.delete();
  } catch {
    // best-effort cleanup
  }
}

export function isImage(attachment: Attachment): boolean {
  if (attachment.kind === 'image') return true;
  return !!attachment.mimeType?.startsWith('image/');
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const __ATTACHMENTS_PLATFORM__ = Platform.OS;
