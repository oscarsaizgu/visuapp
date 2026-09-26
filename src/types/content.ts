// Esquema de contenido propio de visu-game (ver scripts/build-content.mjs).

export type Dominio = 'biologia' | 'geologia';

export type CategoriaId =
  | 'botanica' | 'zoologia' | 'hongos' | 'microscopia'
  | 'minerales' | 'rocas' | 'fosiles' | 'geomorfologia';

export interface Nombre {
  /** Nombre que se muestra en grande. */
  principal: string;
  comun?: string;
  cientifico?: string;
  variantes?: string[];
  /** Cómo se escribe el principal: los científicos van en cursiva. */
  formato: 'comun' | 'cientifico';
}

export interface Imagen {
  id: string;
  archivo: string;
  ancho: number;
  alto: number;
  marcas: string[];
  /** Se puede usar para preguntar en una partida. */
  juego: boolean;
  /** Se puede mostrar en la ficha de estudio. */
  ficha: boolean;
  vista?: string;
  fuente?: string;
  deExamen?: boolean;
  pie?: string;
  autor?: string;
  licencia?: string;
  /** Papel de la foto según la curación: principal (aprender), identificación o solo ficha. */
  uso?: 'principal' | 'identificacion' | 'ficha';
  /** Solo en fotos con licencia verificada. Sin crédito = licencia no verificada. */
  credito?: Credito;
}

export interface Credito { autor: string; licencia: string; url: string; fuente: string }

export interface Taxonomia {
  reino?: string; filo?: string; clase?: string; orden?: string; familia?: string; genero?: string;
}

export interface Confusion { id: string; diferencia: string }

export interface Ejemplar {
  id: string;
  dominio: Dominio;
  categoria: CategoriaId;
  album: string;
  nombre: Nombre;
  aceptados: string[];
  prioridad: 'A' | 'B';
  visu: { anios: number[]; otros: string[] };
  taxonomia?: Taxonomia;
  estatus?: string;
  rasgos?: string;
  notas?: string;
  referencia?: string;
  confusiones?: Confusion[];
  imagenes: Imagen[];
  portada?: string;
}

export interface PackActivo { id: string; nombre: string; descripcion: string; ejemplares: number }

export interface GameContent {
  version: number;
  catalogo: { ejemplares: number; fotos: number; porCategoria: Record<string, number> };
  packs: PackActivo[];
  ejemplares: Ejemplar[];
}

// ---------- Ruta de aprendizaje ----------

export interface NodoRuta {
  id: string;
  tipo: 'leccion' | 'repaso';
  titulo: string;
  ejemplares: string[];
}

export interface Submundo {
  id: string;
  categoria: CategoriaId;
  total: number;
  nodos: NodoRuta[];
}

export interface Mundo {
  id: string;
  numero: number;
  total: number;
  submundos: Submundo[];
  examen: { preguntas: number };
}

export interface Ruta {
  version: number;
  config: { aprobado: number };
  catalogo: { ejemplares: number; fotos: number; enRuta: number; fueraDeRuta: number };
  mundos: Mundo[];
}
