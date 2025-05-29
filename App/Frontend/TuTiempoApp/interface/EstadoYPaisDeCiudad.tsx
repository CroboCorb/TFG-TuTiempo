import { State, City } from 'country-state-city';

export interface RegionDeCiudad {
  ciudad: string;
  nombreRegion: string | null;
}

export function indexarCiudades(): Map<string, RegionDeCiudad[]> {
  const index = new Map<string, RegionDeCiudad[]>();

  for (const region of State.getStatesOfCountry('ES')) {
    const ciudades = City.getCitiesOfState('ES', region.isoCode);
    for (const ciudad of ciudades) {
      const key = ciudad.name.toLowerCase();
      const resultado: RegionDeCiudad = {
        ciudad: ciudad.name,
        nombreRegion: region.name,
      };
      if (!index.has(key)) 
        index.set(key, []);
      index.get(key)?.push(resultado);
    }
  }

  return index;
}

export function buscarCiudad(index: Map<string, RegionDeCiudad[]>, cityName: string): RegionDeCiudad[] {
  return index.get(cityName.toLowerCase()) ?? [];
}