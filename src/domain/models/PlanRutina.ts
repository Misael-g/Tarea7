export interface PlanRutina {
  id: string;
  plan_id: string;
  rutina_id: string;
  dia_semana: number; // 1=Lunes, 7=Domingo
  orden: number;
  created_at: string;
  rutina?: Rutina;
}