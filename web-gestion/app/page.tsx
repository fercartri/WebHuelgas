"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from 'react';
import { 
  getUbicaciones, 
  createUbicacion, 
  updateUbicacion, 
  deleteUbicacion, 
  Ubicacion, 
  UbicacionData,
  auth,
  googleProvider,
  signOut,
  signInWithPopup,
  User,
} from "@/lib/firebase";

const AUTHORIZED_EMAIL = "aplicacionhuelgas360@gmail.com";

// Definimos las opciones disponibles
const TIPOS_UBICACION = ["Común", "Infantil", "Primaria", "ESO"];

type FormData = UbicacionData & { id?: string };

// =========================================================================
// Componente de Formulario Modal (Crear y Modificar)
// =========================================================================
const UbicacionModal = ({ isOpen, onClose, ubicacionToEdit, refreshList, existingUbicaciones }: { 
  isOpen: boolean, 
  onClose: () => void, 
  ubicacionToEdit: Ubicacion | null,
  refreshList: () => void,
  existingUbicaciones: Ubicacion[],
}) => {
  const isEditing = !!ubicacionToEdit;
  
  // Referencia para el input del nombre
  const nombreInputRef = useRef<HTMLInputElement>(null);

  const initialState: FormData = {
    nombre: ubicacionToEdit?.nombre || '',
    descripcion: ubicacionToEdit?.descripcion || '',
    foto_url: ubicacionToEdit?.foto_url || '',
    orden: ubicacionToEdit?.orden || 0,
    x: ubicacionToEdit?.x || 0,
    y: ubicacionToEdit?.y || 0,
    tipo: ubicacionToEdit?.tipo || 'Común', // Valor por defecto
    id: ubicacionToEdit?.id,
  };

  const [formData, setFormData] = useState<FormData>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData(initialState);
    setError('');

    if (isOpen) {
      setTimeout(() => {
        nombreInputRef.current?.focus();
      }, 50);
    }
  }, [ubicacionToEdit, isOpen]); 
  
  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const nombreLower = formData.nombre.toLowerCase().trim();
      const ordenClamped = Math.max(0, Math.round(formData.orden));
      const xClamped = Math.max(0, Math.min(1, formData.x));
      const yClamped = Math.max(0, Math.min(1, formData.y));
      
      const nombreDuplicado = existingUbicaciones.some(u => {
        const isSameName = u.nombre.toLowerCase() === nombreLower;
        const isNotCurrentLocation = u.id !== formData.id;
        
        if (isEditing) {
            return isSameName && isNotCurrentLocation;
        }
        return isSameName;
      });

      if (nombreDuplicado) {
        throw new Error("Ya existe una ubicación con ese nombre.");
      }

      const dataWithoutId: UbicacionData = {
        nombre: nombreLower,
        descripcion: formData.descripcion,
        foto_url: formData.foto_url,
        orden: ordenClamped,
        x: xClamped,
        y: yClamped,
        tipo: formData.tipo, // Enviamos el tipo seleccionado
      };

      if (isEditing && formData.id) {
        await updateUbicacion(formData.id, dataWithoutId);
      } else {
        await createUbicacion(dataWithoutId);
      }
      
      refreshList();
      onClose();
    } catch (err: any) {
      setError(`${err.message || 'Error desconocido'}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-2xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">
          {isEditing ? 'Modificar Ubicación' : 'Nueva Ubicación'}
        </h2>
        
        {error && <p className="text-red-500 mb-4 font-bold">{error}</p>} 

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-zinc-700 dark:text-zinc-300">Nombre:</span>
            <input
              ref={nombreInputRef}
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              className="mt-1 block w-full p-2 border border-zinc-300 rounded-md dark:bg-zinc-700 dark:border-zinc-600"
            />
          </label>

          {/* Selector de Tipo añadido */}
          <label className="block">
            <span className="text-zinc-700 dark:text-zinc-300">Tipo:</span>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-zinc-300 rounded-md dark:bg-zinc-700 dark:border-zinc-600 dark:text-white"
            >
              {TIPOS_UBICACION.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </label>
          
          <label className="block">
            <span className="text-zinc-700 dark:text-zinc-300">Descripción:</span>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={3}
              required
              className="mt-1 block w-full p-2 border border-zinc-300 rounded-md dark:bg-zinc-700 dark:border-zinc-600"
            />
          </label>

          <label className="block">
            <span className="text-zinc-700 dark:text-zinc-300">URL Foto Supabase:</span>
            <input
              type="text"
              name="foto_url"
              value={formData.foto_url}
              onChange={handleChange}
              required
              className="mt-1 block w-full p-2 border border-zinc-300 rounded-md dark:bg-zinc-700 dark:border-zinc-600"
            />
          </label>
          
          <div className="flex space-x-4">
            <label className="block flex-1">
              <span className="text-zinc-700 dark:text-zinc-300">Orden (≥ 0):</span>
              <input
                type="number"
                name="orden"
                value={formData.orden}
                onChange={handleChange}
                required
                min="0"
                step="1"
                className="mt-1 block w-full p-2 border border-zinc-300 rounded-md dark:bg-zinc-700 dark:border-zinc-600"
              />
            </label>
            <label className="block flex-1">
              <span className="text-zinc-700 dark:text-zinc-300">Coord. X (0-1):</span>
              <input
                type="number"
                name="x"
                value={formData.x}
                onChange={handleChange}
                required
                min="0"
                max="1"
                step="0.01"
                className="mt-1 block w-full p-2 border border-zinc-300 rounded-md dark:bg-zinc-700 dark:border-zinc-600"
              />
            </label>
            <label className="block flex-1">
              <span className="text-zinc-700 dark:text-zinc-300">Coord. Y (0-1):</span>
              <input
                type="number"
                name="y"
                value={formData.y}
                onChange={handleChange}
                required
                min="0"
                max="1"
                step="0.01"
                className="mt-1 block w-full p-2 border border-zinc-300 rounded-md dark:bg-zinc-700 dark:border-zinc-600"
              />
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-700 border border-zinc-300 rounded-lg hover:bg-zinc-100 dark:text-zinc-300 dark:border-zinc-600 dark:hover:bg-zinc-700"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50`}
              disabled={loading}
            >
              {loading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Ubicación')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// Componente de Login
// =========================================================================
const LoginScreen = ({ onLogin, onDisplayError, error }: { onLogin: () => void, onDisplayError: (msg: string) => void, error: string }) => {
    const [loading, setLoading] = useState(false);

    const handleGoogleSignIn = async () => {
      setLoading(true);
      onDisplayError('');
      try {
        await signInWithPopup(auth, googleProvider);
        onLogin(); 
      } catch (err: any) {
        console.error("Error de inicio de sesión:", err);
        const message = err.code === 'auth/popup-closed-by-user' 
          ? 'Inicio de sesión cancelado.' 
          : (err.code === 'auth/unauthorized-domain' ? 'Error de configuración de Firebase.' : '');
          
        if (message) {
          onDisplayError(message);
        }
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <div className="p-8 bg-white dark:bg-zinc-800 rounded-xl shadow-2xl w-full max-w-sm text-center">
          <h1 className="text-3xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">
            Login de Administrador
          </h1>
          
          {error && <p className="text-red-500 mb-4">{error}</p>}
  
          <button
            onClick={handleGoogleSignIn}
            className="w-full px-4 py-2 bg-white text-zinc-700 border border-zinc-300 font-semibold rounded-lg shadow-md hover:bg-zinc-100 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            disabled={loading}
          >
            {loading ? (
              <span>Conectando...</span>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.5-.2-2.22H12v4.26h6.39c-.28 1.45-1.17 2.76-2.5 3.63v3.1h4v-3.1c1.8-.93 3.01-2.9 3.01-5.32z" fill="#4285f4"></path><path d="M12 23c3.21 0 5.95-1.07 7.93-2.9l-4-3.1c-1.12.76-2.58 1.21-4.93 1.21-3.79 0-7.02-2.55-8.15-6.02H0v3.1h4C5.07 20.25 8.16 23 12 23z" fill="#34a853"></path><path d="M3.85 14.54c-.16-.48-.25-.98-.25-1.54s.09-1.06.25-1.54V8.4H0v3.1c0 1.05.18 2.05.51 3z" fill="#fbbc05"></path><path d="M12 4.19c1.78 0 3.3.61 4.54 1.76l3.44-3.37C17.95.84 15.21 0 12 0 8.16 0 5.07 2.75 3.85 6.22l4 3.1c1.13-3.47 4.36-6.03 8.15-6.03z" fill="#ea4335"></path></svg>
                <span>Iniciar sesión con Google</span>
              </>
            )}
          </button>
          <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">Solo el administrador autorizado puede acceder.</p>
        </div>
      </div>
    );
};

// =========================================================================
// Componente Principal Home
// =========================================================================
export default function Home() {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ubicacionToEdit, setUbicacionToEdit] = useState<Ubicacion | null>(null);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const fetchUbicaciones = async () => {
    setLoading(true);
    try {
      const data = await getUbicaciones();
      setUbicaciones(data);
      setAuthError('');
    } catch (error: any) {
      if (error.code === 'permission-denied' || error.code === 'unavailable') {
        console.warn("Acceso denegado por reglas de seguridad. Redirigiendo a Login...");
        await signOut(auth);
        setCurrentUser(null);
        setAuthError('');
      } else {
        console.error("Error al cargar ubicaciones:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setAuthLoading(false);
      
      if (user && user.email === AUTHORIZED_EMAIL) {
        setCurrentUser(user);
        fetchUbicaciones();
      } else {
        setCurrentUser(null);
        if (user) {
             signOut(auth).catch(e => console.error("Error signing out non-authorized user:", e));
             setAuthError('Acceso denegado. Este email no está autorizado para la gestión.');
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setAuthError('');
      setUbicaciones([]);
      console.log("Sesión cerrada correctamente.");
    } catch (e) {
      console.error("Error al cerrar sesión:", e);
      alert("Hubo un error al cerrar sesión.");
    }
  }

  const handleOpenNew = () => {
    setUbicacionToEdit(null); 
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ubicacion: Ubicacion) => {
    setUbicacionToEdit(ubicacion); 
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, nombre: string) => {
    const confirmed = window.confirm(`¿Estás seguro de que quieres eliminar la ubicación "${nombre.toUpperCase()}"? Esta acción es irreversible.`);
    
    if (confirmed) {
      setLoading(true);
      try {
        await deleteUbicacion(id);
        fetchUbicaciones();
      } catch (error) {
        console.error("Error al eliminar la ubicación:", error);
        alert("Hubo un error al intentar eliminar la ubicación."); 
      } finally {
        setLoading(false);
      }
    }
  };
  
  if (authLoading) {
      return (
          <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-900">
              <p className="text-lg text-zinc-600 dark:text-zinc-400">Cargando sesión...</p>
          </div>
      );
  }

  if (!currentUser) {
    return (
      <LoginScreen 
        error={authError}
        onLogin={() => {}}
        onDisplayError={setAuthError} 
      />
    );
  }
  
  return (
    <div className="flex min-h-screen items-start justify-center p-4 md:p-10 bg-gray-50 dark:bg-zinc-900">
      
      <main className="w-full md:w-3/4 flex flex-col gap-8 bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-xl mx-auto">
        
        <header className="flex justify-between items-center border-b pb-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50">
            Ubicaciones
          </h1>
          <div className="flex items-center space-x-4">
            <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors"
            >
                Cerrar Sesión
            </button>

            <button
                onClick={handleOpenNew}
                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors disabled:opacity-50"
                disabled={loading}
            >
                Nueva Ubicación
            </button>
          </div>
        </header>
        
        {loading ? (
          <p className="text-center text-lg text-zinc-600 dark:text-zinc-400 p-10">Cargando ubicaciones...</p>
        ) : ubicaciones.length === 0 ? (
          <p className="text-center text-lg text-zinc-600 dark:text-zinc-400 p-10">
            Aún no hay ubicaciones.
          </p>
        ) : (
          <div className="space-y-6">
            {ubicaciones.map((ubicacion) => (
              <article 
                key={ubicacion.id} 
                className="p-5 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm hover:shadow-lg transition-shadow flex flex-col md:flex-row gap-5"
              >
                <div className="w-full md:w-1/4 flex-none"> 
                  {ubicacion.foto_url ? (
                    <Image 
                      src={ubicacion.foto_url} 
                      alt={`Foto de ${ubicacion.nombre}`}
                      width={200}
                      height={150}
                      className="w-full h-36 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-36 bg-gray-200 dark:bg-zinc-700 rounded-lg flex items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
                      Sin Imagen
                    </div>
                  )}
                </div>

                <div className="md:w-3/4 flex flex-col justify-between"> 
                  <div>
                    {/* Encabezado con Nombre y Badge de Tipo */}
                    <div className="flex justify-between items-start">
                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{ubicacion.nombre.toUpperCase()}</h3>
                        
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full border 
                            ${ubicacion.tipo === 'Común' ? 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300' : ''}
                            ${ubicacion.tipo === 'Infantil' ? 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/30 dark:text-pink-300' : ''}
                            ${ubicacion.tipo === 'Primaria' ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300' : ''}
                            ${ubicacion.tipo === 'ESO' ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300' : ''}
                        `}>
                            {ubicacion.tipo}
                        </span>
                    </div>

                    <p className="text-zinc-600 dark:text-zinc-300 mt-2">{ubicacion.descripcion}</p>
                    
                    <div className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 border-t pt-3">
                      <p>
                        Orden de Aparición: <span className="font-semibold">{ubicacion.orden}</span>
                      </p>
                      <p>
                        Coordenadas (X, Y): ({ubicacion.x}, {ubicacion.y})
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 mt-4">
                    <button
                      onClick={() => handleOpenEdit(ubicacion)}
                      className="px-3 py-1 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition-colors"
                      disabled={loading}
                    >
                      Modificar
                    </button>
                    <button
                      onClick={() => handleDelete(ubicacion.id, ubicacion.nombre)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                      disabled={loading}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <UbicacionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ubicacionToEdit={ubicacionToEdit}
        refreshList={fetchUbicaciones}
        existingUbicaciones={ubicaciones}
      />
    </div>
  );
}