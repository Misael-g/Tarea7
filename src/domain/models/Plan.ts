export interface Plan {
  id: string;
  nombre: string;
  descripcion?: string;
  entrenador_id: string;
  usuario_id: string;
  fecha_inicio: string;
  fecha_fin?: string;
  objetivo?: string;
  notas?: string;
  activo: boolean;
  created_at: string;
  // Datos relacionados
  entrenador?: {
    email: string;
    nombre?: string;
  };
  usuario?: {
    email: string;
    nombre?: string;
  };
}