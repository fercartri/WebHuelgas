// 1. Importaciones necesarias de Firebase
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  CollectionReference, 
  DocumentData 
} from "firebase/firestore";

// 2. Configuración de Firebase con variables de entorno
const firebaseConfig = {
  // Solo se requieren los campos esenciales para la conexión de la app.
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializa la aplicación de Firebase
// Se comprueba que el código no se ejecute múltiples veces en el servidor (aunque Next.js ya lo gestiona)
const app = initializeApp(firebaseConfig);

// Exporta la instancia de Firestore
export const db = getFirestore(app);


// 3. Define la interfaz de tus datos (para TypeScript)
export interface Ubicacion {
  id: string;
  nombre: string;
  descripcion: string;
  urlFotoSupabase: string; // La URL pública de la imagen en Supabase
  orden: number;
  coordenadaX: number;
  coordenadaY: number;
}


/**
 * Obtiene todas las ubicaciones de la colección "ubicaciones" de Firestore, 
 * ordenadas por el campo 'orden'.
 * @returns {Promise<Ubicacion[]>} Lista de objetos de ubicación.
 */
export async function getUbicaciones(): Promise<Ubicacion[]> {
  // Define la referencia a la colección 'ubicaciones'
  const ubicacionesRef = collection(db, "ubicaciones");
  
  // Crea la consulta para ordenar por el campo 'orden' de forma ascendente
  const q = query(ubicacionesRef, orderBy("orden", "asc"));
  
  // Ejecuta la consulta
  const querySnapshot = await getDocs(q);
  
  // CORRECCIÓN en el mapeo explícito para TypeScript:
  const ubicacionesList: Ubicacion[] = querySnapshot.docs.map(doc => {
    const data = doc.data() as DocumentData; // Obtén los datos como un tipo genérico DocumentData
    
    // Mapeo explícito de los campos
    return {
      id: doc.id,
      nombre: (data.nombre as string) || 'Sin Nombre',
      descripcion: (data.descripcion as string) || 'Sin Descripción',
      urlFotoSupabase: (data.foto_url as string) || '',
      orden: (data.orden as number) || 0,
      coordenadaX: (data.x as number) || 0,
      coordenadaY: (data.y as number) || 0,
    };
  });

  return ubicacionesList;
}