import { Link } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import styles from './Study.module.css';

export function BackLink() {
  return <Link to="/estudiar" className={styles.back}><ArrowLeft size={18} weight="bold" aria-hidden="true" /> Estudiar</Link>;
}
