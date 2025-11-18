"use client";

import Image from "next/image";
import { useState, useEffect } from 'react';
import { 
  getUbicaciones, 
  createUbicacion, 
  updateUbicacion, 
  deleteUbicacion, 
  Ubicacion, 
  UbicacionData 
} from "@/lib/firebase";

type FormData = UbicacionData & { id?: string };

// =========================================================================
// Componente de Formulario Modal (Crear y Modificar)
// =========================================================================
const UbicacionModal = ({ isOpen, onClose, ubicacionToEdit, refreshList }: { 
  isOpen: boolean, 
  onClose: () => void, 
  ubicacionToEdit: Ubicacion | null,
  refreshList: () => void,
}) => {
  const isEditing = !!ubicacionToEdit;
  // Inicialización del estado del formulario, usando valores existentes si se está editando
  const initialState: FormData = {
    nombre: ubicacionToEdit?.nombre || '',
    descripcion: ubicacionToEdit?.descripcion || '',
    foto_url: ubicacionToEdit?.foto_url || '',
    orden: ubicacionToEdit?.orden || 0,
    x: ubicacionToEdit?.x || 0,
    y: ubicacionToEdit?.y || 0,
    id: ubicacionToEdit?.id,
  };

  const [formData, setFormData] = useState<FormData>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sincroniza el estado del formulario cuando cambia la ubicación a editar o se abre el modal
  useEffect(() => {
    setFormData(initialState);
    setError('');
  }, [ubicacionToEdit, isOpen]);
  
  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      // ANTES: const { id, ...dataToSave } = formData;
      // ANTES: const dataWithoutId = dataToSave as UbicacionData;
      
      // DESPUÉS: Construir el objeto de datos de forma explícita para forzar
      // la eliminación de cualquier propiedad antigua residual.
      const dataWithoutId: UbicacionData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        foto_url: formData.foto_url,
        orden: formData.orden,
        x: formData.x,
        y: formData.y,
      };

      if (isEditing && formData.id) {
        // Operación de MODIFICAR (Update)
        await updateUbicacion(formData.id, dataWithoutId);
      } else {
        // Operación de CREAR (Create)
        await createUbicacion(dataWithoutId);
      }
      
      refreshList(); // Recarga la lista principal
      onClose();
    } catch (err: any) {
      setError(`Error al guardar: ${err.message || 'Desconocido'}`);
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
        
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-zinc-700 dark:text-zinc-300">Nombre:</span>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              className="mt-1 block w-full p-2 border border-zinc-300 rounded-md dark:bg-zinc-700 dark:border-zinc-600"
            />
          </label>
          
          <label className="block">
            <span className="text-zinc-700 dark:text-zinc-300">Descripción:</span>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full p-2 border border-zinc-300 rounded-md dark:bg-zinc-700 dark:border-zinc-600"
            />
          </label>

          {/* Campo de URL Foto Supabase */}
          <label className="block">
            <span className="text-zinc-700 dark:text-zinc-300">URL Foto Supabase:</span>
            <input
              type="text"
              name="foto_url"
              value={formData.foto_url}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-zinc-300 rounded-md dark:bg-zinc-700 dark:border-zinc-600"
            />
          </label>
          
          {/* Orden y Coordenadas */}
          <div className="flex space-x-4">
            <label className="block flex-1">
              <span className="text-zinc-700 dark:text-zinc-300">Orden:</span>
              <input
                type="number"
                name="orden"
                value={formData.orden}
                onChange={handleChange}
                required
                className="mt-1 block w-full p-2 border border-zinc-300 rounded-md dark:bg-zinc-700 dark:border-zinc-600"
              />
            </label>
            <label className="block flex-1">
              <span className="text-zinc-700 dark:text-zinc-300">Coord. X:</span>
              <input
                type="number"
                name="x"
                value={formData.x}
                onChange={handleChange}
                required
                className="mt-1 block w-full p-2 border border-zinc-300 rounded-md dark:bg-zinc-700 dark:border-zinc-600"
              />
            </label>
            <label className="block flex-1">
              <span className="text-zinc-700 dark:text-zinc-300">Coord. Y:</span>
              <input
                type="number"
                name="y"
                value={formData.y}
                onChange={handleChange}
                required
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
              // Uso de Tailwind dinámico para color del botón: ambar para editar, verde para crear
              className={`px-4 py-2 rounded-lg text-white ${isEditing ? 'bg-amber-500 hover:bg-amber-600' : 'bg-green-600 hover:bg-green-700'} disabled:opacity-50`}
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
// Componente Principal Home (Convertido a Cliente)
// =========================================================================
export default function Home() {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ubicacionToEdit, setUbicacionToEdit] = useState<Ubicacion | null>(null);

  // Función para cargar los datos y usarla en useEffect y después de CRUD
  const fetchUbicaciones = async () => {
    setLoading(true);
    try {
      const data = await getUbicaciones();
      setUbicaciones(data);
    } catch (error) {
      console.error("Error al cargar ubicaciones:", error);
      // Aquí podrías mostrar un error global al usuario
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial de datos
  useEffect(() => {
    fetchUbicaciones();
  }, []);

  // Handlers para las acciones CRUD

  const handleOpenNew = () => {
    setUbicacionToEdit(null); // Establece null para forzar el modo "Crear"
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ubicacion: Ubicacion) => {
    setUbicacionToEdit(ubicacion); // Pasa la ubicación a editar
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, nombre: string) => {
    const confirmed = window.confirm(`¿Estás seguro de que quieres eliminar la ubicación "${nombre}"? Esta acción es irreversible.`);
    
    if (confirmed) {
      setLoading(true);
      try {
        await deleteUbicacion(id);
        fetchUbicaciones(); // Recarga la lista después de eliminar
      } catch (error) {
        console.error("Error al eliminar la ubicación:", error);
        alert("Hubo un error al intentar eliminar la ubicación."); 
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Renderizado principal
  return (
    <div className="flex min-h-screen items-start justify-center p-4 md:p-10 bg-gray-50 dark:bg-zinc-900">
      
      {/* Contenedor principal: 75% de ancho (md:w-3/4) */}
      <main className="w-full md:w-3/4 flex flex-col gap-8 bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-xl mx-auto">
        
        <header className="flex justify-between items-center border-b pb-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-zinc-50">
            Catálogo de Ubicaciones
          </h1>
          {/* Botón para crear nueva ubicación (Verde) */}
          <button
            onClick={handleOpenNew}
            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            Nueva Ubicación
          </button>
        </header>
        
        {loading ? (
          <p className="text-center text-lg text-zinc-600 dark:text-zinc-400 p-10">Cargando ubicaciones...</p>
        ) : ubicaciones.length === 0 ? (
          <p className="text-center text-lg text-zinc-600 dark:text-zinc-400 p-10">
            Aún no hay ubicaciones registradas en la base de datos.
          </p>
        ) : (
          <div className="space-y-6">
            {ubicaciones.map((ubicacion) => (
              <article 
                key={ubicacion.id} 
                // Contenedor Flex para la Foto y la Info (Horizontal en escritorio)
                className="p-5 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm hover:shadow-lg transition-shadow flex flex-col md:flex-row gap-5"
              >
                {/* 4. Mostrar la Imagen de Supabase - Ocupa 25% en escritorio (md:w-1/4) */}
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

                {/* 5. Contenedor de la Información y Botones - Ocupa 75% restante (md:w-3/4) */}
                <div className="md:w-3/4 flex flex-col justify-between"> 
                  <div>
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{ubicacion.nombre.toUpperCase()}</h3>
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
                  
                  {/* Contenedor de Botones (Alineado a la derecha/abajo) */}
                  <div className="flex justify-end space-x-3 mt-4">
                    {/* Botón Modificar (Ambar) */}
                    <button
                      onClick={() => handleOpenEdit(ubicacion)}
                      className="px-3 py-1 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition-colors"
                      disabled={loading}
                    >
                      Modificar
                    </button>
                    {/* Botón Eliminar (Rojo) */}
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

      {/* Modal para Crear y Modificar */}
      <UbicacionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ubicacionToEdit={ubicacionToEdit}
        refreshList={fetchUbicaciones}
      />
    </div>
  );
}