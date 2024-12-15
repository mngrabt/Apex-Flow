import { useNavigate, useParams, useLocation } from 'react-router-dom';
import CashRequestDetailsComponent from '../components/requests/CashRequestDetails';
import { styles } from '../utils/styleConstants';

export default function CashRequestDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { from, view } = location.state || {};
  const { id } = useParams();

  if (!id) {
    return null;
  }

  return (
    <div className={`${styles.padding.section}`}>
      <CashRequestDetailsComponent 
        backState={{ from, view }}
      />
    </div>
  );
} 