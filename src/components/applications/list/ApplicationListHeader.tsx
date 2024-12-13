import { styles } from '../../../utils/styleConstants';

interface ApplicationListHeaderProps {}

export default function ApplicationListHeader({}: ApplicationListHeaderProps) {
  return (
    <div className="relative space-y-8">
      {/* Title with gradient */}
      <div className="relative">
        <h1 className={styles.text.heading}>
          Заявления
        </h1>
        <div className={styles.effects.gradientUnderline} />
      </div>
    </div>
  );
}