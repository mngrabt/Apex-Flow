interface RegistrationStepsProps {
  currentStep: number;
}

export default function RegistrationSteps({ currentStep }: RegistrationStepsProps) {
  const steps = [
    'Информация',
    'Документы',
    'Telegram',
    'Аккаунт'
  ];

  return (
    <div className="flex items-center space-x-4">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <div key={step} className="flex items-center">
            {index > 0 && (
              <div className={`h-px w-8 mx-4 ${
                isCompleted ? 'bg-primary' : 'bg-gray-200'
              }`} />
            )}
            <div className="flex items-center">
              <div className={`
                h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium
                ${isActive ? 'bg-primary text-white' : 
                  isCompleted ? 'bg-primary/10 text-primary' : 
                  'bg-gray-100 text-gray-500'}
              `}>
                {stepNumber}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                isActive ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {step}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}