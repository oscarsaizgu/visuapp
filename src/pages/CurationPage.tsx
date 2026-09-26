import { useEffect, useMemo, useState } from 'react';
import { BookOpenText, Crosshair, Archive, Prohibit, Warning, Question, type Icon } from '@phosphor-icons/react';
import { CATEGORIAS, CATEGORIA_POR_ID } from '../content/categories';
import { SpecimenLabel } from '../components/specimen/SpecimenLabel';
import { Link } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import studyStyles from './study/Study.module.css';
import type { CategoriaId, Nombre } from '../types/content';
import styles from './CurationPage.module.css';

// Datos de src/content/generated/curacion.json (se cargan solo al abrir esta página).
interface Procedencia { fuente: string; licencia: string; distribuible: boolean; autor?: string; url?: string; licenciaUrl?: string; fechaIncorporacion?: string; cambios?: string; taxonFuente?: string }
interface FotoCurada {
  id: string; archivo: string; ancho: number; alto: number; uso: string; marcas: string[]; motivo: string;
  procedencia: Procedencia; auditoria?: { nitidez?: number; texto?: string[] | null; error?: string };
}
interface EjemplarCurado { id: string; nombre: Nombre; categoria: CategoriaId; album: string; estado: string; fecha: string; nota: string; fotos: FotoCurada[] }
interface Discrepancia { ejemplares: string[]; tipo: string; detalle: string; propuesta: string; fuente: string; estado: string }
interface Curacion {
  ejemplares: EjemplarCurado[];
  nombres: { discrepancias: Discrepancia[]; noDistractor: { par: string[]; motivo: string }[] };
  resumen: { fotos: number; externas: number; licenciaVerificada: number; auditadas: number; duplicadosEntreEjemplares: { a: string; b: string; ea: string; eb: string }[] };
}

const USOS: Record<string, { nombre: string; icono: Icon; clase: string; ayuda: string }> = {
  principal: { nombre: 'Principal', icono: BookOpenText, clase: styles.usoPrincipal, ayuda: 'La que se ve al aprender' },
  identificacion: { nombre: 'Identificación', icono: Crosshair, clase: styles.usoId, ayuda: 'Se usa para preguntar' },
  ficha: { nombre: 'Solo ficha', icono: Archive, clase: styles.usoFicha, ayuda: 'Útil para estudiar, no para preguntar' },
  excluida: { nombre: 'Excluida', icono: Prohibit, clase: styles.usoExcluida, ayuda: 'No se muestra' },
  'sin-decidir': { nombre: 'Sin decidir', icono: Question, clase: styles.usoFicha, ayuda: '' },
};

const MARCAS: Record<string, string> = {
  'da-pistas': 'Da el nombre', rotulada: 'Rotulada', ilustracion: 'Ilustración', calidad: 'Calidad baja', 'marca-agua': 'Marca de agua',
  duplicada: 'Duplicada', 'taxon-dudoso': 'Taxón dudoso', 'otra-especie': 'Otra especie', 'sin-contenido': 'Sin contenido',
  'archivo-danado': 'Archivo dañado', 'poco-diagnostica': 'Poco diagnóstica', 'baja-resolucion': 'Baja resolución', borde: 'Borde añadido',
};
const MARCAS_GRAVES = new Set(['taxon-dudoso', 'otra-especie', 'sin-contenido', 'archivo-danado', 'da-pistas']);

function Foto({ f }: { f: FotoCurada }) {
  const uso = USOS[f.uso] ?? USOS['sin-decidir'];
  const p = f.procedencia;
  const texto = f.auditoria?.texto;
  return (
    <li className={`${styles.foto} ${f.uso === 'excluida' ? styles.fotoExcluida : ''}`}>
      <a className={styles.fotoImg} href={f.archivo} target="_blank" rel="noreferrer" aria-label={`Abrir ${f.id} a tamaño completo`}>
        <img src={f.archivo} alt="" loading="lazy" />
        <span className={`${styles.uso} ${uso.clase}`}><uso.icono size={13} weight="bold" aria-hidden="true" /> {uso.nombre}</span>
      </a>
      <div className={styles.fotoInfo}>
        <p className={styles.fotoId}>{f.id.replace(/^.*-(ext\d+|\d+)$/, '#$1')} <span>{f.ancho}×{f.alto}{f.auditoria?.nitidez !== undefined ? ` · nitidez ${Math.round(f.auditoria.nitidez)}` : ''}</span></p>
        {f.motivo && <p className={styles.motivo}>{f.motivo}</p>}
        {f.marcas.length > 0 && (
          <ul className={styles.marcas} aria-label="Marcas">
            {f.marcas.map((m) => <li key={m} className={MARCAS_GRAVES.has(m) ? styles.marcaGrave : undefined}>{MARCAS[m] ?? m}</li>)}
          </ul>
        )}
        <p className={styles.proc}>
          {p.distribuible
            ? <>{p.autor} · {p.url ? <a href={p.url} target="_blank" rel="noreferrer">{p.licencia}</a> : p.licencia} · {p.fuente}</>
            : <><Warning size={13} weight="fill" className={styles.warn} aria-hidden="true" /> Licencia no verificada · {p.fuente}</>}
        </p>
        {texto && texto.length > 0 && <p className={styles.ocr}>Texto detectado: «{texto.slice(0, 6).join(' ')}»</p>}
        {f.auditoria?.error && <p className={styles.ocr}>No se puede abrir: {f.auditoria.error}</p>}
      </div>
    </li>
  );
}

/** Revisión del piloto de curación: qué foto se usa para qué, por qué y de dónde sale. */
export function CurationPage() {
  const [datos, setDatos] = useState<Curacion | null>(null);
  const [cat, setCat] = useState<CategoriaId | 'todas'>('todas');
  useEffect(() => { import('../content/generated/curacion.json').then((m) => setDatos(m.default as Curacion)); }, []);

  const lista = useMemo(() => (datos?.ejemplares ?? []).filter((e) => cat === 'todas' || e.categoria === cat), [datos, cat]);
  if (!datos) return <div className={styles.page}><p className={styles.lead}>Cargando…</p></div>;
  const r = datos.resumen;
  const fotosPiloto = datos.ejemplares.flatMap((e) => e.fotos);
  const cuenta = (uso: string) => fotosPiloto.filter((f) => f.uso === uso).length;

  return (
    <div className={styles.page}>
      <Link to="/progreso" className={studyStyles.back}><ArrowLeft size={18} weight="bold" aria-hidden="true" /> Progreso</Link>
      <header>
        <h1 className={styles.h1}>Curación de fotos</h1>
        <p className={styles.lead}>
          Piloto: {datos.ejemplares.length} ejemplares de las 8 disciplinas revisados a mano. Cada foto tiene un papel, un motivo y su procedencia.
          Nada de esto cambia el catálogo: las dudas científicas quedan registradas abajo para revisarlas.
        </p>
      </header>

      <section className={styles.stats} aria-label="Resumen">
        <div><b>{fotosPiloto.length}</b><span>fotos revisadas</span></div>
        <div><b>{cuenta('principal')}</b><span>principales</span></div>
        <div><b>{cuenta('identificacion')}</b><span>para identificar</span></div>
        <div><b>{cuenta('ficha')}</b><span>solo ficha</span></div>
        <div><b>{cuenta('excluida')}</b><span>excluidas</span></div>
        <div><b>{r.externas}</b><span>externas con licencia</span></div>
      </section>

      <section className={styles.card} aria-labelledby="lic-t">
        <h2 id="lic-t" className={styles.h2}>Licencias</h2>
        <p>
          De las {r.fotos.toLocaleString('es-ES')} fotos, <b>{r.licenciaVerificada}</b> tienen licencia verificada (todas de Wikimedia Commons).
          Las {(r.fotos - r.licenciaVerificada).toLocaleString('es-ES')} del catálogo original no documentan autor ni licencia: quedan
          marcadas como <b>licencia no verificada</b> y la versión distribuible (<code>npm run build:distribuible</code>) no las incluye.
        </p>
      </section>

      <div className={styles.filtros} role="group" aria-label="Disciplina">
        <button type="button" aria-pressed={cat === 'todas'} onClick={() => setCat('todas')}>Todas</button>
        {CATEGORIAS.map((c) => (
          <button key={c.id} type="button" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>{c.nombre}</button>
        ))}
      </div>

      <ul className={styles.leyenda} aria-label="Papeles de una foto">
        {(['principal', 'identificacion', 'ficha', 'excluida'] as const).map((u) => {
          const x = USOS[u];
          return <li key={u}><span className={`${styles.uso} ${x.clase}`}><x.icono size={13} weight="bold" aria-hidden="true" /> {x.nombre}</span> {x.ayuda}</li>;
        })}
      </ul>

      {lista.map((e) => (
        <section key={e.id} className={styles.card} aria-label={e.nombre.cientifico ?? e.nombre.principal}>
          <div className={styles.cabecera}>
            <SpecimenLabel nombre={e.nombre} kicker={`${CATEGORIA_POR_ID[e.categoria].nombre} · ${e.album}`} />
            <Link className={styles.ficha} to={`/ejemplar/${e.id}`}>Ver ficha</Link>
          </div>
          <p className={styles.nota}>{e.nota}</p>
          <ul className={styles.fotos}>{e.fotos.map((f) => <Foto key={f.id} f={f} />)}</ul>
        </section>
      ))}

      <section className={styles.card} aria-labelledby="nom-t">
        <h2 id="nom-t" className={styles.h2big}>Revisión de nombres</h2>
        <p className={styles.nota}>El catálogo manda. Esto es lo que habría que decidir; no se ha corregido nada.</p>
        <ul className={styles.discrepancias}>
          {datos.nombres.discrepancias.map((d, k) => (
            <li key={k}>
              <p><span className={d.estado === 'pendiente' ? styles.pendiente : styles.cerrada}>{d.estado}</span> <b>{d.ejemplares.join(' · ')}</b> <span className={styles.tipo}>{d.tipo}</span></p>
              <p>{d.detalle}</p>
              <p className={styles.nota}>Propuesta: {d.propuesta} · Fuente: {d.fuente.startsWith('http') ? <a href={d.fuente} target="_blank" rel="noreferrer">{d.fuente}</a> : d.fuente}</p>
            </li>
          ))}
        </ul>
        <h3 className={styles.h3}>Nunca como distractor el uno del otro</h3>
        <ul className={styles.discrepancias}>
          {datos.nombres.noDistractor.map((n) => <li key={n.par.join()}><b>{n.par.join(' · ')}</b>: {n.motivo}</li>)}
        </ul>
      </section>

      <section className={styles.card} aria-labelledby="dup-t">
        <h2 id="dup-t" className={styles.h2big}>Fotos repetidas en ejemplares distintos</h2>
        <p className={styles.nota}>
          Detección automática (huella perceptual) sobre las {r.auditadas.toLocaleString('es-ES')} fotos. La misma foto no puede ser de dos taxones:
          o una está mal asignada o la foto es ambigua. Pendiente de revisar fuera del piloto.
        </p>
        <ul className={styles.duplicados}>
          {r.duplicadosEntreEjemplares.map((d) => (
            <li key={`${d.a}-${d.b}`}>
              <img src={`/img/${d.ea}/${d.a.slice(d.ea.length + 1)}.webp`} alt="" loading="lazy" />
              <span><Link to={`/ejemplar/${d.ea}`}>{d.ea}</Link> = <Link to={`/ejemplar/${d.eb}`}>{d.eb}</Link></span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
