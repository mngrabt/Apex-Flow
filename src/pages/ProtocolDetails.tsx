import { useParams } from 'react-router-dom';
import ProtocolDetails from '../components/protocols/ProtocolDetails';
import { styles } from '../utils/styleConstants';

export default function ProtocolDetailsPage() {
  const { id } = useParams();

  if (!id) return null;

  return (
    <div className={styles.padding.section}>
      <ProtocolDetails />
    </div>
  );
}
