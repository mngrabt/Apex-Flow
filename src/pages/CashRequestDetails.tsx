import { useParams } from 'react-router-dom';
import ProtocolDetailsComponent from '../components/protocols/ProtocolDetails';
import { styles } from '../utils/styleConstants';

export default function CashRequestDetails() {
  const { id } = useParams();

  if (!id) {
    return null;
  }

  return (
    <div className={`${styles.padding.section}`}>
      <ProtocolDetailsComponent protocolId={id} onBack={() => window.history.back()} />
    </div>
  );
} 