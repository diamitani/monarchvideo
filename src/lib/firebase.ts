import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type { MediaAsset, VideoProject } from '../types/monarch';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

const app: FirebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const firebaseMeta = {
  projectId: firebaseConfig.projectId,
  firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
  storageBucket: firebaseConfig.storageBucket,
};

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  await ensureUserProfile(cred.user);
  return cred.user;
}

export async function signUpWithEmail(params: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, params.email, params.password);
  if (params.name.trim()) {
    await updateProfile(cred.user, { displayName: params.name.trim() });
  }
  await ensureUserProfile(cred.user, params.name.trim());
  return cred.user;
}

export async function signInWithEmail(params: {
  email: string;
  password: string;
}): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, params.email, params.password);
  await ensureUserProfile(cred.user);
  return cred.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export async function ensureUserProfile(user: User, fallbackName?: string): Promise<void> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  const displayName = (fallbackName || user.displayName || user.email?.split('@')[0] || 'Creator').slice(0, 120);
  const email = (user.email || 'creator@monarch.video').slice(0, 254);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        displayName,
        email,
        ...(user.photoURL ? { photoURL: user.photoURL.slice(0, 1000) } : {}),
        defaultBrandName: 'Monarch',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        displayName,
        ...(user.photoURL ? { photoURL: user.photoURL.slice(0, 1000) } : {}),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = stripUndefinedDeep(v);
      }
    }
    return out as T;
  }
  return value;
}

function sanitizeId(rawId: string): string {
  const clean = rawId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120);
  return clean || `item-${Date.now().toString(36)}`;
}

function toIso(val: unknown): string {
  if (
    val &&
    typeof val === 'object' &&
    'toDate' in val &&
    typeof (val as { toDate: () => Date }).toDate === 'function'
  ) {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

export async function loadUserCloudProjects(uid: string): Promise<VideoProject[]> {
  const path = 'projects';
  try {
    const q = query(
      collection(db, 'projects'),
      where('ownerId', '==', uid),
      orderBy('updatedAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        id: String(data.id || d.id),
        title: String(data.title || 'Untitled Project'),
        prompt: String(data.prompt || ''),
        status: (data.status as VideoProject['status']) || 'draft',
        createdAt: toIso(data.createdAt),
        updatedAt: toIso(data.updatedAt),
        version: Number(data.version || 1),
        aspectRatio: (data.aspectRatio as VideoProject['aspectRatio']) || '16:9',
        durationSec: Number(data.durationSec || 24),
        runtime: (data.runtime as VideoProject['runtime']) || 'hyperframes',
        routingMode: (data.routingMode as VideoProject['routingMode']) || 'managed-gateway',
        brandKit: data.brandKit as VideoProject['brandKit'],
        pal: data.pal as VideoProject['pal'],
        preProduction: data.preProduction as VideoProject['preProduction'],
        timeline: data.timeline as VideoProject['timeline'],
        mediaSelections: data.mediaSelections as VideoProject['mediaSelections'],
        editHistory: Array.isArray(data.editHistory)
          ? (data.editHistory as VideoProject['editHistory'])
          : [],
      };
    });
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('index')) {
      try {
        const fallbackQ = query(collection(db, 'projects'), where('ownerId', '==', uid));
        const snap = await getDocs(fallbackQ);
        return snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          return {
            id: String(data.id || d.id),
            title: String(data.title || 'Untitled Project'),
            prompt: String(data.prompt || ''),
            status: (data.status as VideoProject['status']) || 'draft',
            createdAt: toIso(data.createdAt),
            updatedAt: toIso(data.updatedAt),
            version: Number(data.version || 1),
            aspectRatio: (data.aspectRatio as VideoProject['aspectRatio']) || '16:9',
            durationSec: Number(data.durationSec || 24),
            runtime: (data.runtime as VideoProject['runtime']) || 'hyperframes',
            routingMode: (data.routingMode as VideoProject['routingMode']) || 'managed-gateway',
            brandKit: data.brandKit as VideoProject['brandKit'],
            pal: data.pal as VideoProject['pal'],
            preProduction: data.preProduction as VideoProject['preProduction'],
            timeline: data.timeline as VideoProject['timeline'],
            mediaSelections: data.mediaSelections as VideoProject['mediaSelections'],
            editHistory: Array.isArray(data.editHistory)
              ? (data.editHistory as VideoProject['editHistory'])
              : [],
          };
        });
      } catch (innerError) {
        handleFirestoreError(innerError, OperationType.LIST, path);
      }
    }
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveUserCloudProject(uid: string, proj: VideoProject): Promise<void> {
  const safeId = sanitizeId(proj.id);
  const path = `projects/${safeId}`;
  const ref = doc(db, 'projects', safeId);

  // Strip raw audioDataUrl blobs so Firestore docs stay compact and under 1MB
  const compactMedia = proj.mediaSelections
    ? {
        ...proj.mediaSelections,
        voiceover: {
          ...proj.mediaSelections.voiceover,
          clips: [],
        },
      }
    : undefined;

  const routingModeNormalized =
    proj.routingMode === 'byok-server' ? 'byok-server' : 'managed-gateway';

  const basePayload = stripUndefinedDeep({
    id: safeId,
    ownerId: uid,
    title: proj.title.slice(0, 160),
    prompt: proj.prompt.slice(0, 4000),
    status: proj.status,
    version: Math.max(1, Math.min(1000, Number(proj.version || 1))),
    aspectRatio: proj.aspectRatio,
    durationSec: Math.max(3, Math.min(300, Number(proj.durationSec || 24))),
    runtime: proj.runtime,
    routingMode: routingModeNormalized,
    brandKit: proj.brandKit,
    ...(proj.pal ? { pal: proj.pal } : {}),
    ...(proj.preProduction ? { preProduction: proj.preProduction } : {}),
    ...(proj.timeline ? { timeline: proj.timeline } : {}),
    ...(compactMedia ? { mediaSelections: compactMedia } : {}),
    editHistory: (proj.editHistory || []).slice(0, 50),
  });

  try {
    const existingSnap = await getDoc(ref);
    if (!existingSnap.exists()) {
      await setDoc(ref, {
        ...basePayload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        ...basePayload,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserCloudProject(projectId: string): Promise<void> {
  const safeId = sanitizeId(projectId);
  const path = `projects/${safeId}`;
  try {
    await deleteDoc(doc(db, 'projects', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveCloudMediaAsset(uid: string, asset: MediaAsset): Promise<void> {
  const safeId = sanitizeId(asset.id);
  const path = `mediaAssets/${safeId}`;
  const ref = doc(db, 'mediaAssets', safeId);
  try {
    await setDoc(ref, {
      id: safeId,
      ownerId: uid,
      name: asset.name.slice(0, 200),
      category: asset.category,
      mimeType: asset.mimeType.slice(0, 120),
      sizeBytes: Math.max(0, Number(asset.sizeBytes || 0)),
      url: asset.url.slice(0, 1500),
      tags: (asset.tags || []).slice(0, 10).map((t) => String(t).slice(0, 64)),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteCloudMediaAsset(assetId: string): Promise<void> {
  const safeId = sanitizeId(assetId);
  const path = `mediaAssets/${safeId}`;
  try {
    await deleteDoc(doc(db, 'mediaAssets', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
