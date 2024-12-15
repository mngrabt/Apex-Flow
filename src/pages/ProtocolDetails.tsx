import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProtocolStore } from '../store/protocol';
import ProtocolDetails from '../components/protocols/ProtocolDetails';
import { styles } from '../utils/styleConstants';

export default function ProtocolDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { protocols, fetchProtocols } = useProtocolStore();

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchProtocols();
      } catch (error) {
        console.error('Error loading protocol data:', error);
      }
    };
    loadData();
  }, [fetchProtocols]);

  useEffect(() => {
    if (protocols && id) {
      const protocol = protocols.find(p => p.id === id);
      if (protocol?.type === 'cash') {
        // Redirect cash protocols to CashRequestDetails
        navigate(`/cash-requests/${id}`, { replace: true });
      }
    }
  }, [protocols, id, navigate]);

  if (!id) return null;

  return (
    <div className={styles.padding.section}>
      <ProtocolDetails />
    </div>
  );
}
