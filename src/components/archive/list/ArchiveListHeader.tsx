import { styles } from '../../../utils/styleConstants';

export default function ArchiveListHeader() {
  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-3">
      {/* Name - 40% */}
      <div className="col-span-5">
        <div className={`${styles.text.tableHeader}`}>НАИМЕНОВАНИЕ</div>
      </div>

      {/* Protocol Number - 30% */}
      <div className="col-span-3 flex justify-center">
        <div className={`${styles.text.tableHeader}`}>НОМЕР ПРОТОКОЛА</div>
      </div>

      {/* Date - 15% */}
      <div className="col-span-2 flex justify-center">
        <div className={`${styles.text.tableHeader}`}>ДАТА</div>
      </div>

      {/* Documents - 15% */}
      <div className="col-span-2 flex justify-center">
        <div className={`${styles.text.tableHeader}`}>ДОКУМЕНТЫ</div>
      </div>
    </div>
  );
}