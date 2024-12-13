import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Download, Edit2 } from 'lucide-react';
import { ArchivedProtocol } from '../../types';
import { styles } from '../../utils/styleConstants';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Input } from '../shared';
import { supabase } from '../../lib/supabase';
import { useArchiveStore } from '../../store/archive';

interface ArchiveListItemProps {
  protocol: ArchivedProtocol;
  requestName: string;
}

export default function ArchiveListItem({ 
  protocol, 
  requestName
}: ArchiveListItemProps) {
  const navigate = useNavigate();
  const { downloadArchive } = useArchiveStore();
  const [isEditingNumber, setIsEditingNumber] = useState(false);
  const [protocolNumber, setProtocolNumber] = useState(protocol.number || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      const date = parseISO(dateString);
      return format(date, 'dd.MM.yyyy');
    } catch (error) {
      return '-';
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await downloadArchive(protocol, `protocol_${protocol.id}.zip`);
    } catch (error) {
      console.error('Error downloading archive:', error);
    }
  };

  const handleUpdateNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('archived_protocols')
        .update({ number: protocolNumber })
        .eq('protocol_id', protocol.id);

      if (error) throw error;

      setIsEditingNumber(false);
    } catch (error) {
      console.error('Error updating protocol number:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCreationDate = () => {
    if (protocol.type === 'cash' && protocol.request) {
      return formatDate(protocol.request.createdAt);
    } else if (protocol.tender?.request) {
      return formatDate(protocol.tender.request.createdAt);
    }
    return '-';
  };

  return (
    <>
      <div 
        className={`${styles.components.card} hover:bg-gray-50 transition-colors cursor-pointer`}
        onClick={() => navigate(`/protocols/${protocol.id}`)}
      >
        <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
          {/* Name - 40% */}
          <div className="col-span-5">
            <h3 className={`${styles.text.cardTitle} text-left pl-2 truncate`}>{requestName}</h3>
          </div>

          {/* Protocol Number - 30% */}
          <div className="col-span-3 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <span className={`${styles.text.cardBody} text-center`}>
                {protocol.number || 'Без номера'}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingNumber(true);
                }}
                aria-label="Изменить номер"
                className="p-1.5 text-gray-400 hover:text-primary transition-colors rounded-lg hover:bg-gray-100"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Date - 15% */}
          <div className="col-span-2">
            <p className={`${styles.text.cardSubtitle} text-center`}>
              {getCreationDate()}
            </p>
          </div>

          {/* Documents - 15% */}
          <div className="col-span-2 flex justify-center">
            <button
              onClick={handleDownload}
              aria-label="Скачать документы"
              className="p-2 text-gray-400 hover:text-primary transition-colors rounded-lg hover:bg-gray-100"
            >
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {isEditingNumber && (
        <Modal 
          title="Изменить номер протокола" 
          onClose={() => setIsEditingNumber(false)}
        >
          <form onSubmit={handleUpdateNumber} className="space-y-6">
            <Input
              label="Номер протокола"
              value={protocolNumber}
              onChange={(e) => setProtocolNumber(e.target.value)}
              placeholder="Введите номер протокола"
            />

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditingNumber(false)}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

```</rewritten_file>