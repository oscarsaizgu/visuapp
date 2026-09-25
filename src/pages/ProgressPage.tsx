import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CaretRight, DownloadSimple, Flame, Lock, Trash, UploadSimple } from '@phosphor-icons/react';
import { EJEMPLARES, categoriasActivas, ejemplaresDe } from '../content';
import { insigniasVisibles } from '../content/achievements';
import { useProgressStore } from '../store/useProgressStore';
import { claveDia, rachaVigente } from '../logic/daily';
import { nivelDesdeXp, rangoDeNivel } from '../logic/levels';
import { distribucionDominio, dominioMedio, nivelDominio } from '../logic/mastery';
import { construirSnapshot } from '../logic/snapshot';
import { formatoTiempo } from '../logic/stats';
import { listaRepaso, TEXTO_MOTIVO } from '../logic/study';
import { ActivityChart } from '../components/progress/ActivityChart';
import { ChallengesCard } from '../components/progress/ChallengesCard';
import { MasteryBar } from '../components/progress/MasteryBar';
import { SpecimenCard } from '../components/specimen/SpecimenCard';
import styles from './ProgressPage.module.css';

const OBJETIVOS = [5, 10, 15, 20];

function ultimosDias(n: number): string[] {
  const hoy = new Date();
  return Array.from({ length: n }, (_, i) => claveDia(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - (n - 1 - i))));
}

export function ProgressPage() {
  const s = useProgressStore();
  const [confirmar, setConfirmar] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const fichero = useRef<HTMLInputElement>(null);
  const hoy = claveDia();

  const d = useMemo(() => {
    const snap = construirSnapshot(EJEMPLARES, s.progreso, s.perfil, s.estadisticas);
    const categorias = categoriasActivas().map((c) => {
      const lista = ejemplaresDe(c.id);
      const ids = lista.map((e) => e.id);
      const aciertos = lista.reduce((n, e) => n + (s.progreso[e.id]?.aciertos ?? 0), 0);
      const errores = lista.reduce((n, e) => n + (s.progreso[e.id]?.errores ?? 0), 0);
      return { ...c, dominio: dominioMedio(ids, s.progreso), distribucion: distribucionDominio(ids, s.progreso), aciertos, intentos: aciertos + errores };
    }).sort((a, b) => b.dominio - a.dominio || b.aciertos - a.aciertos);
    const conDatos = categorias.filter((c) => c.intentos > 0);
    return {
      snap,
      categorias,
      fuerte: conDatos[0]?.id,
      debil: conDatos.length > 1 ? conDatos.at(-1)!.id : undefined,
      dias: ultimosDias(14).map((dia) => ({ dia, datos: s.estadisticas.porDia[dia] })),
      repaso: listaRepaso(EJEMPLARES, s.progreso, hoy),
      insignias: insigniasVisibles(snap),
    };
  }, [s.progreso, s.perfil, s.estadisticas, hoy]);

  const nivel = nivelDesdeXp(s.perfil.xp);
  const e = s.estadisticas;
  const precision = e.respuestas ? Math.round((e.aciertos / e.respuestas) * 100) : null;

  const exportar = () => {
    const datos = localStorage.getItem('visu-game:progreso') ?? '{}';
    const url = URL.createObjectURL(new Blob([datos], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = `visu-game-progreso-${hoy}.json`; a.click();
    URL.revokeObjectURL(url);
  };
  const importar = async (f: File | undefined) => {
    if (!f) return;
    try {
      setAviso(s.importar(JSON.parse(await f.text())) ? 'Progreso importado.' : 'Ese archivo no es un progreso de visu-game.');
    } catch { setAviso('No se pudo leer el archivo.'); }
    if (fichero.current) fichero.current.value = '';
  };

  return (
    <div className={styles.page}>
      <header className="rise">
        <h1 className={styles.title}>Progreso</h1>
        <p className={styles.lead}>Nivel {nivel.nivel} · {rangoDeNivel(nivel.nivel)} · {s.perfil.xp} XP</p>
      </header>

      <ul className={`${styles.tiles} rise`}>
        <li><Flame size={20} weight="fill" className={styles.flame} aria-hidden="true" /><strong>{rachaVigente(s.perfil, hoy)}</strong><span>días de racha · mejor {s.perfil.mejorRacha}</span></li>
        <li><strong>{e.respuestas}</strong><span>identificaciones</span></li>
        <li><strong>{precision === null ? '—' : `${precision}%`}</strong><span>de aciertos a la primera</span></li>
        <li><strong>{formatoTiempo(e.tiempoMs)}</strong><span>de estudio en el juego</span></li>
        <li><strong>{d.snap.estudiados}<small>/{d.snap.totalActivos}</small></strong><span>ejemplares practicados</span></li>
        <li><strong>{d.snap.dominados}</strong><span>dominados</span></li>
        <li><strong>{e.sesiones}</strong><span>sesiones · {e.sesionesPerfectas} perfectas</span></li>
        <li><strong>×{e.comboMax}</strong><span>mejor combo · Veloz {e.velozMejor}</span></li>
      </ul>

      <div className={styles.cols}>
        <section className={styles.card} aria-labelledby="evo-t">
          <h2 id="evo-t" className={styles.h2}>Identificaciones · últimos 14 días</h2>
          <ActivityChart dias={d.dias} />
        </section>
        <ChallengesCard />
      </div>

      <section className={styles.card} aria-labelledby="cat-t">
        <h2 id="cat-t" className={styles.h2}>Por categoría</h2>
        <ul className={styles.cats}>
          {d.categorias.map((c) => {
            const Ico = c.icono;
            return (
              <li key={c.id}>
                <Link to={`/coleccion/${c.id}`} className={styles.catRow}>
                  <span className={styles.catIcon} style={{ background: c.color }}><Ico size={16} weight="fill" aria-hidden="true" /></span>
                  <span className={styles.catName}>
                    {c.nombre}
                    {c.id === d.fuerte && <em className={styles.tagStrong}>Más fuerte</em>}
                    {c.id === d.debil && <em className={styles.tagWeak}>Más débil</em>}
                  </span>
                  <span className={styles.catNums}>{Math.round(c.dominio * 100)}% dominio{c.intentos ? ` · ${Math.round((c.aciertos / c.intentos) * 100)}% aciertos` : ''}</span>
                  <span className={styles.catBar}><MasteryBar distribucion={c.distribucion} alto={6} /></span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="rep-t">
        <div className={styles.secHead}>
          <h2 id="rep-t" className={styles.h2big}>Necesitas repasar</h2>
          {d.repaso.length > 0 && <Link to="/estudiar/repasar" className={styles.more}>Ver todos ({d.repaso.length}) <CaretRight size={14} weight="bold" aria-hidden="true" /></Link>}
        </div>
        {d.repaso.length ? (
          <ul className={styles.grid}>
            {d.repaso.slice(0, 4).map(({ ejemplar, motivo }) => (
              <li key={ejemplar.id}><SpecimenCard ejemplar={ejemplar} nivel={nivelDominio(s.progreso[ejemplar.id])} nota={TEXTO_MOTIVO[motivo]} /></li>
            ))}
          </ul>
        ) : <p className={styles.empty}>Nada pendiente. Los ejemplares aparecerán aquí cuando los falles o toque repasarlos.</p>}
      </section>

      <section aria-labelledby="ins-t">
        <div className={styles.secHead}>
          <h2 id="ins-t" className={styles.h2big}>Insignias</h2>
          <span className={styles.count}>{Object.keys(s.logros.insignias).length}/{d.insignias.length}</span>
        </div>
        <ul className={styles.badges}>
          {d.insignias.map((i) => {
            const [a, o] = i.progreso(d.snap);
            const fecha = s.logros.insignias[i.id];
            const Ico = i.icono;
            return (
              <li key={i.id} className={fecha ? styles.badgeOn : styles.badgeOff}>
                <span className={styles.badgeIcon}>{fecha ? <Ico size={24} weight="fill" aria-hidden="true" /> : <Lock size={20} weight="bold" aria-hidden="true" />}</span>
                <strong>{i.titulo}</strong>
                <span className={styles.badgeDesc}>{i.descripcion}</span>
                {fecha
                  ? <span className={styles.badgeDate}>Conseguida el {fecha.split('-').reverse().join('/')}</span>
                  : <span className={styles.badgeProg}><span className={styles.track}><i style={{ transform: `scaleX(${Math.min(1, a / o)})` }} /></span><b>{Math.min(a, o)}/{o}</b></span>}
              </li>
            );
          })}
        </ul>
      </section>

      <section className={styles.card} aria-labelledby="aj-t">
        <h2 id="aj-t" className={styles.h2}>Ajustes</h2>
        <div className={styles.setting}>
          <span>Objetivo diario</span>
          <div className={styles.segmented} role="group" aria-label="Objetivo diario">
            {OBJETIVOS.map((n) => (
              <button key={n} type="button" aria-pressed={s.perfil.objetivoDiario === n} className={s.perfil.objetivoDiario === n ? styles.segOn : ''}
                onClick={() => s.setObjetivoDiario(n)}>{n}</button>
            ))}
          </div>
        </div>
        <p className={styles.note}>Tu progreso se guarda en este dispositivo. Para pasarlo a otro, expórtalo aquí e impórtalo allí.</p>
        <div className={styles.actions}>
          <button type="button" className={styles.btn} onClick={exportar}><DownloadSimple size={18} weight="bold" aria-hidden="true" /> Exportar progreso</button>
          <button type="button" className={styles.btn} onClick={() => fichero.current?.click()}><UploadSimple size={18} weight="bold" aria-hidden="true" /> Importar progreso</button>
          <input ref={fichero} type="file" accept="application/json,.json" hidden onChange={(ev) => importar(ev.target.files?.[0])} />
          <button type="button" className={`${styles.btn} ${styles.danger}`}
            onClick={() => { if (confirmar) { s.reiniciar(); setConfirmar(false); setAviso('Progreso borrado.'); } else setConfirmar(true); }}
            onBlur={() => setConfirmar(false)}>
            <Trash size={18} weight="bold" aria-hidden="true" /> {confirmar ? '¿Seguro? Pulsa otra vez' : 'Borrar progreso'}
          </button>
        </div>
        {aviso && <p className={styles.aviso} role="status">{aviso}</p>}
      </section>
    </div>
  );
}
