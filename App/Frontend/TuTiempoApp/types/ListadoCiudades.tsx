import { InfoMeteorologia } from "./InfoMeteorologia";

export type Ciudad = {
  nombre: string,
  usaUbicacion: boolean;
  ultimaActualizacion: Date;
  meteorologia: InfoMeteorologia;
};