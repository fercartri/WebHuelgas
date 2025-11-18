import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  DocumentData,
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);


export interface Ubicacion {
  id: string;
  nombre: string;
  descripcion: string;
  foto_url: string;
  orden: number;
  x: number;
  y: number;
}

// Define el tipo de datos que se guardarán, excluyendo 'id'
export type UbicacionData = Omit<Ubicacion, 'id'>;


// 4. Operaciones CRUD (CREATE, READ, UPDATE, DELETE)

const UBICACIONES_COLLECTION = "ubicaciones";

/**
 * Obtiene todas las ubicaciones de la colección "ubicaciones" de Firestore, 
 * ordenadas por el campo 'orden'.
 * @returns {Promise<Ubicacion[]>} Lista de objetos de ubicación.
 */
export async function getUbicaciones(): Promise<Ubicacion[]> {
  const ubicacionesRef = collection(db, UBICACIONES_COLLECTION);
  
  const q = query(ubicacionesRef, orderBy("orden", "asc"));
  
  const querySnapshot = await getDocs(q);
  
  const ubicacionesList: Ubicacion[] = querySnapshot.docs.map(doc => {
    const data = doc.data() as DocumentData;
    
    return {
      id: doc.id,
      nombre: (data.nombre as string) || 'Sin Nombre',
      descripcion: (data.descripcion as string) || 'Sin Descripción',
      foto_url: (data.foto_url as string) || '',
      orden: (data.orden as number) || 0,
      x: (data.x as number) || 0,
      y: (data.y as number) || 0,
    };
  });

  return ubicacionesList;
}

/**
 * Crea una nueva ubicación en Firestore.
 */
export async function createUbicacion(data: UbicacionData): Promise<void> {
  await addDoc(collection(db, UBICACIONES_COLLECTION), data);
}

/**
 * Modifica una ubicación existente por su ID.
 */
export async function updateUbicacion(id: string, data: Partial<UbicacionData>): Promise<void> {
  const ubicacionDoc = doc(db, UBICACIONES_COLLECTION, id);
  // Nota: data es Partial, solo se actualizan los campos proporcionados
  await updateDoc(ubicacionDoc, data);
}

/**
 * Elimina una ubicación por su ID.
 */
export async function deleteUbicacion(id: string): Promise<void> {
  const ubicacionDoc = doc(db, UBICACIONES_COLLECTION, id);
  await deleteDoc(ubicacionDoc);
}