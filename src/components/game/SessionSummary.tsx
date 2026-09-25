import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowCounterClockwise, Flame, House, Sparkle, Target, Trophy } from '@phosphor-icons/react';
import type { EstadoPartida } from '../../hooks/useGameSession';
import { ejemplar, portada } from '../../content';
import { useProgressStore } from '../../store/useProgressStore';
import { claveDia, hechasHoy, rachaVigente } from '../../logic/daily';
import { nivelDesdeXp, rangoDeNivel, siguienteRango } from '../../logic/levels';
import { SpecimenImage } from '../specimen/SpecimenImage';
import { SpecimenLabel } from '../specimen/SpecimenLabel';
import { ProgressRing } from '../ui/ProgressRing';
import { SEGUNDOS_VELOZ } from '../../logic/session';
import { RouteResult } from './RouteResult';
import styles from './SessionSummary.module.css';

/** Contador que sube hasta `hasta` (sin animación si se prefiere movimiento reducido). */
function useCuenta(hasta: number) {
  const [reducido] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [v, setV] = useState(reducido ? hasta : 0);
  useEffect(() => {
    if (reducido) return;
    let raf = 0; const t0 = performance.now();
    const paso = (t: number) => {
      const k = Math.min(1, (t - t0) / 900);
      setV(Math.round(hasta * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [hasta, reducido]);
  return reducido ? hasta : v;
}

export function SessionSummary({ st, onOtra }: { st: EstadoPartida; onOtra: () => void }) {
  const perfil = useProgressStore((s) => s.perfil);
  const velozMejor = useProgressStore((s) => s.estadisticas.velozMejor);
  const xp = useCuenta(st.xpSesion);
  const hoy = claveDia();
  const nivel = nivelDesdeXp(perfil.xp);
  const primeras = st.respuestas.filter((r) => !r.reintento);
  const aciertos = primeras.filter((r) => r.ok).length;
  const fallados = [...new Set(primeras.filter((r) => !r.ok).map((r) => r.ejemplarId))];
  const hechas = hechasHoy(perfil, hoy);
  const racha = rachaVigente(perfil, hoy);
  const perfecta = primeras.length > 0 && aciertos === primeras.length;

  return (
    <div className={styles.page}>
      <header className={`${styles.hero} rise`}>
        <Trophy size={44} weight="duotone" className={styles.trophy} aria-hidden="true" />
        <h1 className={styles.title}>
          {st.origen.tipo === 'examen' ? 'Examen terminado' : st.origen.tipo === 'leccion' ? '¡Lección terminada!' : st.modo === 'veloz' ? '¡Tiempo!' : st.modo === 'repaso' || st.origen.tipo === 'repaso-ruta' ? 'Repaso completado' : st.practica ? 'Práctica completada' : perfecta ? '¡Sesión perfecta!' : '¡Sesión completada!'}
        </h1>
        <p className={styles.xp} aria-label={`${st.xpSesion} XP ganados`}>+{xp} <span>XP</span></p>
        <ul className={styles.stats}>
          {st.modo === 'veloz'
            ? <li><strong>{aciertos}</strong> aciertos en {SEGUNDOS_VELOZ} s{aciertos >= velozMejor && aciertos > 0 ? ' · ¡récord!' : ` · récord ${velozMejor}`}</li>
            : <li><strong>{aciertos}/{primeras.length}</strong> a la primera</li>}
          <li><strong>×{st.comboMax}</strong> mejor combo</li>
          <li><strong>+{st.xpFin}</strong> por terminar{perfecta ? ' (perfecta)' : ''}</li>
        </ul>
      </header>

      <RouteResult st={st} />

      {nivel.nivel > st.nivelInicial && (
        <div className={`${styles.levelUp} rise`} style={{ animationDelay: '120ms' }}>
          <span className={styles.levelBadge}>{nivel.nivel}</span>
          <div>
            <strong>¡Subes a nivel {nivel.nivel}!</strong>
            <p>{rangoDeNivel(nivel.nivel) !== rangoDeNivel(st.nivelInicial)
              ? `Nuevo rango: ${rangoDeNivel(nivel.nivel)}.`
              : siguienteRango(nivel.nivel) ? `Próximo rango, ${siguienteRango(nivel.nivel)!.nombre}, en el nivel ${siguienteRango(nivel.nivel)!.desde}.` : ''}</p>
          </div>
        </div>
      )}

      <div className={`${styles.today} rise`} style={{ animationDelay: '160ms' }}>
        <ProgressRing value={hechas / perfil.objetivoDiario} size={64} stroke={8} color="var(--reward)" label={`${hechas} de ${perfil.objetivoDiario} hoy`}>
          <Target size={22} weight="bold" aria-hidden="true" />
        </ProgressRing>
        <div>
          <strong>{hechas >= perfil.objetivoDiario ? 'Objetivo de hoy cumplido' : `${hechas} de ${perfil.objetivoDiario} identificaciones hoy`}</strong>
          <p><Flame size={16} weight="fill" className={racha > 0 ? styles.flameOn : styles.flameOff} aria-hidden="true" /> Racha: {racha} {racha === 1 ? 'día' : 'días'}</p>
        </div>
      </div>

      {st.descubiertos.length > 0 && (
        <section className="rise" style={{ animationDelay: '200ms' }} aria-labelledby="nuevos-t">
          <h2 id="nuevos-t" className={styles.h2}><Sparkle size={18} weight="fill" aria-hidden="true" /> Nuevos en tu colección · {st.descubiertos.length}</h2>
          <ul className={styles.grid}>
            {st.descubiertos.map((id) => {
              const e = ejemplar(id); if (!e) return null;
              return (
                <li key={id}>
                  <Link to={`/ejemplar/${id}`} className={styles.card}>
                    <div className={styles.thumb}><SpecimenImage imagen={portada(e)} alt={e.nombre.principal} /></div>
                    <SpecimenLabel nombre={e.nombre} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {fallados.length > 0 && (
        <section className="rise" style={{ animationDelay: '240ms' }} aria-labelledby="repasar-t">
          <h2 id="repasar-t" className={styles.h2}>Para repasar · {fallados.length}</h2>
          <p className={styles.note}>Volverán a salir en tus próximas sesiones hasta que los domines. Toca uno para ver su ficha.</p>
          <ul className={styles.list}>
            {fallados.map((id) => {
              const e = ejemplar(id); if (!e) return null;
              return (
                <li key={id}>
                  <Link to={`/ejemplar/${id}`} className={styles.row}>
                    <div className={styles.rowThumb}><SpecimenImage imagen={portada(e)} alt={e.nombre.principal} /></div>
                    <SpecimenLabel nombre={e.nombre} kicker={e.album} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={onOtra}><ArrowCounterClockwise size={20} weight="bold" aria-hidden="true" /> {st.origen.tipo === 'libre' || st.origen.tipo === 'bloque' ? 'Otra sesión' : 'Repetir'}</button>
        <Link to="/" className={styles.secondary}><House size={20} weight="bold" aria-hidden="true" /> Volver al inicio</Link>
      </div>
    </div>
  );
}
