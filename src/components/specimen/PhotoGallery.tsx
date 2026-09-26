import { useState } from 'react';
import type { Imagen } from '../../types/content';
import { QuestionPhoto } from '../game/QuestionPhoto';
import styles from './PhotoGallery.module.css';

/** Pie de una foto con lo que diga el catálogo (vista, pie o fuente). */
function pie(i: Imagen): string | null {
  const partes: string[] = [];
  if (i.vista) partes.push(i.vista);
  if (i.pie) partes.push(i.pie);
  if (i.fuente) partes.push(i.deExamen ? `Foto de examen: ${i.fuente}` : `Fuente: ${i.fuente}`);
  return partes.length ? partes.join(' · ') : null;
}

/** Galería de la ficha: foto grande ampliable y miniaturas con todas las fotos de estudio. */
export function PhotoGallery({ imagenes, alt }: { imagenes: Imagen[]; alt: string }) {
  const [i, setI] = useState(0);
  const actual = imagenes[i];
  if (!actual) return null;
  const rotulada = actual.marcas.some((m) => m === 'rotulada' || m === 'da-pistas');
  const soloEstudio = rotulada || actual.uso === 'ficha';
  const c = actual.credito;
  return (
    <div className={styles.gallery}>
      <div className={styles.stage}>
        <QuestionPhoto imagen={actual} alt={`${alt}, foto ${i + 1} de ${imagenes.length}`}>
          <span className={styles.count}>{i + 1} / {imagenes.length}</span>
        </QuestionPhoto>
      </div>
      {(pie(actual) || soloEstudio || c) && (
        <p className={styles.caption}>
          {pie(actual)}
          {soloEstudio && <span className={styles.tag}>{rotulada ? 'Con rótulos · solo para estudiar' : 'Solo para estudiar'}</span>}
          {c && (
            <span className={styles.credit}>
              Foto: {c.autor} · {c.url ? <a href={c.url} target="_blank" rel="noreferrer">{c.licencia}</a> : c.licencia} · {c.fuente}
            </span>
          )}
        </p>
      )}
      {imagenes.length > 1 && (
        <ul className={styles.thumbs} aria-label="Fotos del ejemplar">
          {imagenes.map((img, k) => (
            <li key={img.id}>
              <button type="button" className={`${styles.thumb} ${k === i ? styles.on : ''}`} onClick={() => setI(k)}
                aria-label={`Ver foto ${k + 1}`} aria-current={k === i}>
                <img src={img.archivo} alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
