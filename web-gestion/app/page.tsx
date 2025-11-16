// web-gestion/app/page.tsx
import Image from "next/image";
// 1. Importa la función de carga de datos y la interfaz
import { getUbicaciones, Ubicacion } from "@/lib/firebase";

// El componente de la página es async en el App Router de Next.js.
// Esto permite que la función 'getUbicaciones' se ejecute en el servidor (durante la construcción o la petición).
export default async function Home() {
  
  let ubicaciones: Ubicacion[] = [];
  try {
    // 2. Llama a la función para obtener los datos de Firestore
    ubicaciones = await getUbicaciones();
  } catch (error) {
    console.error("Error al cargar ubicaciones:", error);
    // En producción, aquí podrías devolver una página de error o un mensaje
    return <p className="text-red-600 text-center p-10">Error al conectar con la base de datos.</p>;
  }
  
  return (
    <div className="flex min-h-screen items-start justify-center p-4 md:p-10 bg-gray-50 dark:bg-zinc-900">
      {/* Cajas contenedoras, width al 75% (w-3/4) y centrado (mx-auto) */}
      <main className="w-full md:w-3/4 flex flex-col gap-8 bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-xl mx-auto">
        
        <h1 className="text-3xl md:text-4xl font-extrabold text-center text-zinc-900 dark:text-zinc-50 border-b pb-4">
          Catálogo de Ubicaciones
        </h1>
        
        {ubicaciones.length === 0 ? (
          <p className="text-center text-lg text-zinc-600 dark:text-zinc-400 p-10">
            Aún no hay ubicaciones registradas en la base de datos.
          </p>
        ) : (
          <div className="space-y-6">
            {ubicaciones.map((ubicacion) => (
              <article 
                key={ubicacion.id} 
                // Contenedor Flex para la Foto y la Info
                className="p-5 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-5"
              >
                <div className="w-full md:w-1/2 flex-none"> 
                  {ubicacion.urlFotoSupabase ? (
                    <Image 
                      src={ubicacion.urlFotoSupabase} 
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

                {/* 5. Mostrar la Información de Firestore - Ocupa 75% restante (md:w-3/4) */}
                <div className="md:w-1/2"> 
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{ubicacion.nombre.toUpperCase()}</h3>
                  <p className="text-zinc-600 dark:text-zinc-300 mt-2">{ubicacion.descripcion}</p>
                  
                  <div className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 border-t pt-3">
                    <p>
                      Orden de Aparición: <span className="font-semibold">{ubicacion.orden}</span>
                    </p>
                    <p>
                      Coordenadas (X, Y): ({ubicacion.coordenadaX}, {ubicacion.coordenadaY})
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}