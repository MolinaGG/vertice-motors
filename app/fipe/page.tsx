import FipeConsultation from './FipeConsultation';
import './fipe.css';

export const metadata = {
  title: 'Consulta Tabela FIPE gratuita | Vértice Motors',
  description: 'Consulte o preço médio de referência de carros por marca, modelo e ano, com código FIPE e mês de referência. Consulta gratuita, sem cadastro.',
};

export default function FipePage() {
  return <FipeConsultation />;
}
