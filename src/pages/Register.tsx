import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, ArrowLeft, HelpCircle, Upload, Trash2, Check, ChevronDown, X, Download } from 'lucide-react';
import { styles } from '../utils/styleConstants';
import { verifyTelegramChatId } from '../services/telegram';
import { setupWebhook } from '../services/telegramWebhook';
import { sendNotification } from '../services/notificationService';

// Categories for selection
const CATEGORIES = [
  'Строительные материалы',
  'Электрооборудование',
  'Сантехника',
  'Инструменты',
  'Спецодежда',
  'Металлопрокат',
  'Химическая продукция',
  'Транспортные услуги',
  'Ремонтные работы',
  'Прочее'
].sort();

interface FormData {
  username: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  companyName: string;
  phoneNumber: string;
  categories: string[];
  isVatPayer: boolean;
  inn: string;
  vatCertificate: File | null;
  license: File | null;
  passport: File | null;
  form: File | null;
  telegramNumber: string;
  isTelegramSame: boolean;
  verificationCode: string;
  telegramChatId: number | null;
}

export default function Register() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    companyName: '',
    phoneNumber: '',
    categories: [],
    isVatPayer: false,
    inn: '',
    vatCertificate: null,
    license: null,
    passport: null,
    form: null,
    telegramNumber: '',
    isTelegramSame: true,
    verificationCode: '',
    telegramChatId: null
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [hasDownloadedForm, setHasDownloadedForm] = useState(false);

  // Start Telegram bot polling when component mounts
  useEffect(() => {
    setupWebhook().catch(console.error);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };

    if (isCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryDropdownOpen]);

  // Filter categories based on search
  const filteredCategories = CATEGORIES.filter(category =>
    category.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ 
        ...prev, 
        [name]: checked,
        telegramNumber: checked ? prev.phoneNumber : prev.telegramNumber 
      }));
    } else if (name === 'phoneNumber') {
      // Remove any non-digits
      let digitsOnly = value.replace(/\D/g, '');
      
      // Format the digits
      let formatted = '';
      if (digitsOnly.length > 0) formatted += digitsOnly.slice(0, 2);
      if (digitsOnly.length > 2) formatted += ' ' + digitsOnly.slice(2, 5);
      if (digitsOnly.length > 5) formatted += ' ' + digitsOnly.slice(5, 7);
      if (digitsOnly.length > 7) formatted += ' ' + digitsOnly.slice(7, 9);

      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else if (name === 'inn') {
      // Only allow digits and limit to 9 characters
      const digitsOnly = value.replace(/\D/g, '').slice(0, 9);
      
      // Format with spaces after every 3 digits
      let formatted = '';
      if (digitsOnly.length > 0) formatted += digitsOnly.slice(0, 3);
      if (digitsOnly.length > 3) formatted += ' ' + digitsOnly.slice(3, 6);
      if (digitsOnly.length > 6) formatted += ' ' + digitsOnly.slice(6, 9);
      
      setFormData(prev => ({ ...prev, [name]: formatted }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setError('');
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleFormDownload = () => {
    setHasDownloadedForm(true);
  };

  const handleFileChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        [field]: file
      }));
    }
  };

  const handleFileRemove = (field: keyof FormData) => {
    setFormData(prev => ({
      ...prev,
      [field]: null
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('[SUBMIT] Starting submission:', {
        telegramChatId: formData.telegramChatId,
        formState: formData
      });

      if (!formData.telegramChatId) {
        console.log('[SUBMIT] Missing telegramChatId');
        setError('Пожалуйста, подтвердите свой Telegram');
        return;
      }

      setIsVerifying(true);
      setError('');

      console.log('[SUBMIT] Creating supplier application:', formData);

      // Create the supplier application
      const { data, error } = await supabase
        .from('supplier_applications')
        .insert({
          username: formData.username.toLowerCase(),
          password: formData.password,
          company_name: formData.companyName,
          contact_person: `${formData.firstName} ${formData.lastName}`,
          contact_number: formData.phoneNumber.replace(/\D/g, ''),
          telegram_number: formData.isTelegramSame ? formData.phoneNumber.replace(/\D/g, '') : formData.telegramNumber.replace(/\D/g, ''),
          is_telegram_same: formData.isTelegramSame,
          telegram_chat_id: formData.telegramChatId,
          is_vat_payer: formData.isVatPayer,
          categories: formData.categories,
          inn: formData.inn.replace(/\D/g, ''),
          status: 'pending',
          email: '',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('[SUBMIT] Error creating application:', error);
        throw error;
      }

      console.log('[SUBMIT] Application created successfully:', data);

      // Upload documents and update URLs
      const documents = [
        { file: formData.vatCertificate, type: 'vat_certificate' },
        { file: formData.license, type: 'license' },
        { file: formData.passport, type: 'passport' },
        { file: formData.form, type: 'company_form' }
      ];

      const documentUrls: Record<string, string> = {};

      for (const doc of documents) {
        if (doc.file) {
          const fileExt = doc.file.name.split('.').pop();
          const fileName = `${data.id}/${doc.type}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, doc.file);

          if (uploadError) {
            console.error(`[SUBMIT] Error uploading ${doc.type}:`, uploadError);
            throw uploadError;
          }

          const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(fileName);

          documentUrls[`${doc.type}_url`] = urlData.publicUrl;
        }
      }

      // Update the application with document URLs
      const { error: updateError } = await supabase
        .from('supplier_applications')
        .update({
          vat_certificate_url: documentUrls['vat_certificate_url'],
          license_url: documentUrls['license_url'],
          passport_url: documentUrls['passport_url'],
          form_url: documentUrls['company_form_url']
        })
        .eq('id', data.id);

      if (updateError) {
        console.error('[SUBMIT] Error updating document URLs:', updateError);
        throw updateError;
      }

      // Send notification to Abdurauf about new application
      await sendNotification('NEW_APPLICATION', {
        companyName: formData.companyName,
        userIds: [
          '00000000-0000-0000-0000-000000000001' // Abdurauf
        ]
      });

      // Show success message
      setIsSuccess(true);
      
      // Redirect after a delay
      setTimeout(() => {
        navigate('/login');
      }, 5000); // 5 second delay

    } catch (error: any) {
      console.error('[SUBMIT] Registration error:', error);
      setError(error.message || 'Произошла ошибка при регистрации');
    } finally {
      setIsVerifying(false);
    }
  };

  const validateStep1 = () => {
    if (!formData.username || !formData.password || !formData.confirmPassword) {
      setError('Пожалуйста, заполните все поля');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.firstName || !formData.lastName || !formData.companyName || !formData.phoneNumber || formData.categories.length === 0) {
      setError('Пожалуйста, заполните все обязательные поля');
      return false;
    }
    
    // Add phone number length validation
    if (formData.phoneNumber.replace(/\D/g, '').length !== 9) {
      setError('Номер телефона должен содержать 9 цифр');
      return false;
    }

    return true;
  };

  const validateStep3 = () => {
    const requiredDocs = [
      formData.license,
      formData.passport,
      formData.form
    ];

    if (formData.isVatPayer) {
      requiredDocs.push(formData.vatCertificate);
    }

    // Check INN length without spaces
    const innDigits = formData.inn.replace(/\D/g, '');
    if (!formData.inn || innDigits.length !== 9 || requiredDocs.some(doc => !doc)) {
      setError(innDigits.length !== 9 ? 'ИНН должен содержать ровно 9 цифр' : 'Пожалуйста, загрузите все необходимые документы');
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (!formData.telegramNumber || !formData.verificationCode) {
      setError('Пожалуйста, заполните все поля');
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    } else if (step === 3 && validateStep3()) {
      setStep(4);
    }
  };

  const handleTelegramVerification = async () => {
    try {
      setIsVerifying(true);
      setVerificationError(null);
      setError('');

      // Clean the phone number to just digits and add +998 prefix
      const phoneNumber = '+998' + formData.phoneNumber.replace(/\D/g, '');
      
      console.log('[REGISTER] Starting verification:', {
        phoneNumber,
        currentTelegramChatId: formData.telegramChatId,
        formState: formData
      });

      const chatId = await verifyTelegramChatId(phoneNumber);

      console.log('[REGISTER] Verification result:', {
        chatId,
        success: !!chatId
      });

      if (chatId) {
        console.log('[REGISTER] Phone number verified, proceeding with submission');
        
        // Create a new form state with the chat ID
        const updatedFormData = { ...formData, telegramChatId: chatId };
        
        // Update the state
        setFormData(updatedFormData);

        console.log('[REGISTER] Submitting with updated data:', {
          telegramChatId: chatId,
          formData: updatedFormData
        });

        // Use the updated form data directly
        const fakeEvent = { preventDefault: () => {} } as React.FormEvent<HTMLFormElement>;
        
        // Create a wrapped version of handleSubmit that uses the updated data
        const wrappedSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          try {
            console.log('[SUBMIT] Starting submission with updated data');
            
            // Use the updated form data instead of the state
            if (!chatId) {
              console.log('[SUBMIT] Missing telegramChatId');
              setError('Пожалуйста, подтвердите свой Telegram');
              return;
            }

            console.log('[SUBMIT] Creating supplier application');

            const { data, error } = await supabase
              .from('supplier_applications')
              .insert({
                username: updatedFormData.username.toLowerCase(),
                password: updatedFormData.password,
                company_name: updatedFormData.companyName,
                contact_person: `${updatedFormData.firstName} ${updatedFormData.lastName}`,
                contact_number: updatedFormData.phoneNumber.replace(/\D/g, ''),
                telegram_number: updatedFormData.isTelegramSame ? updatedFormData.phoneNumber.replace(/\D/g, '') : updatedFormData.telegramNumber.replace(/\D/g, ''),
                is_telegram_same: updatedFormData.isTelegramSame,
                telegram_chat_id: chatId,
                is_vat_payer: updatedFormData.isVatPayer,
                categories: updatedFormData.categories,
                inn: updatedFormData.inn.replace(/\D/g, ''),
                status: 'pending',
                email: '',
                created_at: new Date().toISOString()
              })
              .select()
              .single();

            if (error) {
              console.error('[SUBMIT] Error creating application:', error);
              throw error;
            }

            console.log('[SUBMIT] Application created successfully:', data);

            // Upload documents and update URLs
            const documents = [
              { file: updatedFormData.vatCertificate, type: 'vat_certificate' },
              { file: updatedFormData.license, type: 'license' },
              { file: updatedFormData.passport, type: 'passport' },
              { file: updatedFormData.form, type: 'company_form' }
            ];

            const documentUrls: Record<string, string> = {};

            for (const doc of documents) {
              if (doc.file) {
                const fileExt = doc.file.name.split('.').pop();
                const fileName = `${data.id}/${doc.type}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                  .from('documents')
                  .upload(fileName, doc.file);

                if (uploadError) {
                  console.error(`[SUBMIT] Error uploading ${doc.type}:`, uploadError);
                  throw uploadError;
                }

                const { data: urlData } = supabase.storage
                  .from('documents')
                  .getPublicUrl(fileName);

                documentUrls[`${doc.type}_url`] = urlData.publicUrl;
              }
            }

            // Update the application with document URLs
            const { error: updateError } = await supabase
              .from('supplier_applications')
              .update({
                vat_certificate_url: documentUrls['vat_certificate_url'],
                license_url: documentUrls['license_url'],
                passport_url: documentUrls['passport_url'],
                form_url: documentUrls['company_form_url']
              })
              .eq('id', data.id);

            if (updateError) {
              console.error('[SUBMIT] Error updating document URLs:', updateError);
              throw updateError;
            }

            // Send notification to Abdurauf about new application
            await sendNotification('NEW_APPLICATION', {
              companyName: updatedFormData.companyName,
              userIds: [
                '00000000-0000-0000-0000-000000000001' // Abdurauf
              ]
            });

            // Show success message
            setIsSuccess(true);
            
            // Redirect after a delay
            setTimeout(() => {
              navigate('/login');
            }, 5000); // 5 second delay

          } catch (error: any) {
            console.error('[SUBMIT] Registration error:', error);
            setError(error.message || 'Произошла ошибка при регистрации');
          }
        };

        await wrappedSubmit(fakeEvent);
      } else {
        console.log('[REGISTER] Verification failed - number not found or mismatch');
        setVerificationError(
          'Не удалось подтвердить Telegram. Пожалуйста:\n' +
          '1. Убедитесь, что номер телефона в форме совпадает с номером в Telegram\n' +
          '2. Начните диалог с ботом @ApexFlowBot\n' +
          '3. Отправьте свой контакт через кнопку "Поделиться контактом"'
        );
      }
    } catch (err) {
      console.error('[REGISTER] Verification error:', err);
      setVerificationError('Произошла ошибка при проверке Telegram');
    } finally {
      setIsVerifying(false);
    }
  };

  // Add countdown effect
  useEffect(() => {
    if (isSuccess && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isSuccess && countdown === 0) {
      navigate('/login');
    }
  }, [isSuccess, countdown, navigate]);

  // Add effect to clear error messages after 5 seconds
  useEffect(() => {
    if (error || verificationError) {
      const timer = setTimeout(() => {
        setError(null);
        setVerificationError(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error, verificationError]);

  return (
    <div className="grid lg:grid-cols-[1fr_500px] h-screen">
      {/* Left Side - Hero Section */}
      <div className="relative hidden lg:block bg-gradient-to-br from-primary/5 via-primary/10 to-transparent">
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-30" />
        
        <div className="relative h-full flex flex-col items-center justify-start pt-[230px] p-20">
          {/* Logo */}
          <img
            src={`${supabase.storage.from('logos').getPublicUrl('vertical orange.svg').data.publicUrl}`}
            alt="ApexFlow"
            className="h-[110px] mb-10"
          />

          {/* Hero Text */}
          <h1 className="text-4xl font-bold text-gray-900 text-center mb-4 leading-[1.2]">
            Добро пожаловать в <br/> ApexFlow
          </h1>
          <p className="text-lg text-gray-600 text-center max-w-lg leading-relaxed">
            Создайте аккаунт, чтобы полуить доступ к системе управления закупками
          </p>

          {/* Steps */}
          <div className="flex items-center gap-4 text-sm font-medium mt-12">
            <div className={`
              h-10 w-10 rounded-xl flex items-center justify-center
              ${step === 1 ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}
            `}>
              1
            </div>
            <div className="w-12 h-0.5 bg-primary/20" />
            <div className={`
              h-10 w-10 rounded-xl flex items-center justify-center
              ${step === 2 ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}
            `}>
              2
            </div>
            <div className="w-12 h-0.5 bg-primary/20" />
            <div className={`
              h-10 w-10 rounded-xl flex items-center justify-center
              ${step === 3 ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}
            `}>
              3
            </div>
            <div className="w-12 h-0.5 bg-primary/20" />
            <div className={`
              h-10 w-10 rounded-xl flex items-center justify-center
              ${step === 4 ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}
            `}>
              4
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="flex flex-col justify-between p-8 bg-white overflow-y-auto">
        <div className="flex-1 flex flex-col max-w-sm mx-auto w-full">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-12">
            <img
              src={`${supabase.storage.from('logos').getPublicUrl('vertical orange.svg').data.publicUrl}`}
              alt="ApexFlow"
              className="h-24 mx-auto"
            />
          </div>

          {/* Form Content */}
          {isSuccess ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-full bg-primary/5 rounded-2xl p-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Заявка успешно отправлена!
                </h3>
                <p className="text-gray-600 mb-6">
                  Ваша заявка на регистрацию принята. После проверки документов мы отправим вам уведомление в Telegram.
                </p>
                <div className="text-sm text-gray-500">
                  Вы будете перенаправлены на страницу входа через {countdown} {countdown === 1 ? 'секунду' : 'секунд'}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Back Button */}
              <div className="mb-8">
                {step === 1 ? (
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Вернуться к входу</span>
                  </Link>
                ) : (
                  <button
                    onClick={() => setStep(prev => prev - 1)}
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Назад</span>
                  </button>
                )}
              </div>

              {/* Form Header */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {step === 1 && 'Создание аккаунта'}
                  {step === 2 && 'Информация о компании'}
                  {step === 3 && 'Документы'}
                  {step === 4 && 'Подключение Telegram'}
                </h2>
                <p className="text-sm text-gray-500">
                  {step === 1 && 'Введите данные для создания аккаунта'}
                  {step === 2 && 'Расскажите о вашей компании'}
                  {step === 3 && 'Загрузите необходимые документы'}
                  {step === 4 && 'Подключите Telegram для уведомлений'}
                </p>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 animate-shake">
                    {error}
                  </div>
                )}

                {step === 1 && (
                  <>
                    {/* Step 1: Account Details */}
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Имя пользователя
                        </label>
                        <input
                          type="text"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="Введите имя пользователя"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Пароль
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className={styles.input}
                            placeholder="Минимум 8 символов"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Подтверждение пароля
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className={styles.input}
                            placeholder="Повторите пароль"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-8">
                      <button
                        type="button"
                        onClick={handleNext}
                        className={`w-full ${styles.buttonPrimary}`}
                      >
                        Продолжить
                      </button>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    {/* Step 2: Company Details */}
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Имя
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className={styles.input}
                            placeholder="Введите имя"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Фамилия
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className={styles.input}
                            placeholder="Введите фамилию"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Название компании
                        </label>
                        <input
                          type="text"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="Введите название компании"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Категории
                        </label>
                        <div className="relative" ref={categoryDropdownRef}>
                          {/* Selected Categories Display */}
                          {formData.categories.length > 0 && (
                            <div className="mb-2 flex flex-wrap gap-2">
                              {formData.categories.map(category => (
                                <span
                                  key={category}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-sm"
                                >
                                  {category}
                                  <button
                                    type="button"
                                    onClick={() => handleCategoryToggle(category)}
                                    className="p-0.5 hover:bg-primary/10 rounded-full"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Dropdown Button */}
                          <button
                            type="button"
                            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                            className={styles.dropdownButton}
                          >
                            <span className={formData.categories.length === 0 ? 'text-gray-400' : ''}>
                              {formData.categories.length === 0 
                                ? 'Выберите категори' 
                                : `Выбрано: ${formData.categories.length}`}
                            </span>
                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {/* Dropdown Menu */}
                          {isCategoryDropdownOpen && (
                            <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg">
                              <div className="p-2">
                                <input
                                  type="text"
                                  value={categorySearch}
                                  onChange={(e) => setCategorySearch(e.target.value)}
                                  placeholder="Поиск категорий..."
                                  className={styles.inputSmall}
                                />
                              </div>
                              <div className="max-h-60 overflow-y-auto">
                                {filteredCategories.length === 0 ? (
                                  <div className="px-4 py-3 text-sm text-gray-500">
                                    Ничего не найдено
                                  </div>
                                ) : (
                                  filteredCategories.map(category => (
                                    <button
                                      key={category}
                                      type="button"
                                      onClick={() => handleCategoryToggle(category)}
                                      className={styles.dropdownOption}
                                    >
                                      <span>{category}</span>
                                      {formData.categories.includes(category) && (
                                        <Check className="w-4 h-4 text-primary" />
                                      )}
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Телефон
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 select-none">
                            +998
                          </span>
                          <input
                            type="tel"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            className={`${styles.input} pl-16`}
                            placeholder="99 825 37 19"
                            maxLength={13}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Плательщик НДС
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, isVatPayer: true }))}
                              className={`relative h-[4.5rem] rounded-xl transition-all duration-200
                                ${formData.isVatPayer
                                  ? 'bg-primary/10 border-primary text-primary'
                                  : 'bg-gray-50/50 hover:bg-white border border-gray-200 text-gray-600'
                                }`}
                            >
                              <div className="flex items-center px-4 h-full">
                                <div className={`p-2 rounded-lg transition-colors duration-200 
                                  ${formData.isVatPayer ? 'bg-primary/10' : 'bg-gray-100'}`}>
                                  <Check className="w-5 h-5" />
                                </div>
                                <div className="ml-4 text-left">
                                  <div className="text-sm font-medium">
                                    Да
                                  </div>
                                  <div className="mt-0.5 text-xs text-gray-400">
                                    Плательщик НДС
                                  </div>
                                </div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, isVatPayer: false }))}
                              className={`relative h-[4.5rem] rounded-xl transition-all duration-200
                                ${!formData.isVatPayer
                                  ? 'bg-primary/10 border-primary text-primary'
                                  : 'bg-gray-50/50 hover:bg-white border border-gray-200 text-gray-600'
                                }`}
                            >
                              <div className="flex items-center px-4 h-full">
                                <div className={`p-2 rounded-lg transition-colors duration-200 
                                  ${!formData.isVatPayer ? 'bg-primary/10' : 'bg-gray-100'}`}>
                                  <X className="w-5 h-5" />
                                </div>
                                <div className="ml-4 text-left">
                                  <div className="text-sm font-medium">
                                    Нет
                                  </div>
                                  <div className="mt-0.5 text-xs text-gray-400">
                                    Не плательщик НДС
                                  </div>
                                </div>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleNext}
                      className={`w-full ${styles.buttonPrimary}`}
                    >
                      Продолжить
                    </button>
                  </>
                )}

                {step === 3 && (
                  <>
                    {/* Step 3: Documents */}
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ИНН
                        </label>
                        <input
                          type="text"
                          name="inn"
                          value={formData.inn}
                          onChange={handleInputChange}
                          className={styles.input}
                          placeholder="Введите ИНН"
                          minLength={11}
                          maxLength={11}
                          required
                        />
                      </div>

                      {/* Document Upload Fields */}
                      {[
                        ...(formData.isVatPayer ? [{ name: 'vatCertificate' as const, label: 'Свидетельство о постановке на учет в налоговом органе' }] : []),
                        { name: 'license' as const, label: 'Лицензия' },
                        { name: 'passport' as const, label: 'Паспорт руководителя' },
                        { name: 'form' as const, label: 'Анкета' }
                      ].map(({ name, label }) => (
                        <div key={name} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {label}
                          </label>
                          <div className="flex items-center gap-4">
                            {name === 'form' ? (
                              formData[name] ? (
                                <label
                                  className="flex-1 flex items-center gap-4 px-4 py-3 rounded-xl border border-dashed
                                    border-primary/50 bg-primary/5 cursor-pointer transition-colors"
                                >
                                  <div className="p-2 rounded-lg bg-primary/10">
                                    <Upload className="w-5 h-5 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">
                                      {formData[name]?.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      PDF, максимум 10MB
                                    </div>
                                  </div>
                                  <input
                                    type="file"
                                    onChange={handleFileChange(name)}
                                    accept=".pdf"
                                    className="hidden"
                                    required
                                  />
                                </label>
                              ) : (
                                <a
                                  href="/supplier-form.html"
                                  download="anketa.html"
                                  onClick={handleFormDownload}
                                  className={`flex-1 flex items-center gap-4 px-4 py-3 rounded-xl
                                    ${hasDownloadedForm ? 'border border-dashed border-gray-200 bg-gray-50/50 hover:bg-white' : 'bg-primary hover:bg-primary/90'}
                                    cursor-pointer transition-colors`}
                                >
                                  <div className={`p-2 rounded-lg ${hasDownloadedForm ? 'bg-gray-100' : 'bg-primary/10'}`}>
                                    {hasDownloadedForm ? (
                                      <Upload className="w-5 h-5 text-gray-500" />
                                    ) : (
                                      <Download className="w-5 h-5 text-white" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-medium ${hasDownloadedForm ? 'text-gray-900' : 'text-white'}`}>
                                      {hasDownloadedForm ? 'Загрузить анкету' : 'Скачать анкету'}
                                    </div>
                                    <div className={`text-xs ${hasDownloadedForm ? 'text-gray-500' : 'text-white/80'}`}>
                                      {hasDownloadedForm ? 'PDF, максимум 10MB' : 'Заполните и загрузите'}
                                    </div>
                                  </div>
                                  {hasDownloadedForm && (
                                    <input
                                      type="file"
                                      onChange={handleFileChange(name)}
                                      accept=".pdf"
                                      className="absolute inset-0 opacity-0 cursor-pointer"
                                      required
                                    />
                                  )}
                                </a>
                              )
                            ) : (
                              <label
                                className={`flex-1 flex items-center gap-4 px-4 py-3 rounded-xl border border-dashed
                                  ${formData[name] ? 'border-primary/50 bg-primary/5' : 'border-gray-200 bg-gray-50/50 hover:bg-white'}
                                  cursor-pointer transition-colors`}
                              >
                                <div className={`p-2 rounded-lg ${formData[name] ? 'bg-primary/10' : 'bg-gray-100'}`}>
                                  <Upload className="w-5 h-5 text-gray-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {formData[name]?.name || 'Выберите файл'}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    PDF, максимум 10MB
                                  </div>
                                </div>
                                <input
                                  type="file"
                                  onChange={handleFileChange(name)}
                                  accept=".pdf"
                                  className="hidden"
                                  required
                                />
                              </label>
                            )}
                            {formData[name] && (
                              <button
                                type="button"
                                onClick={() => handleFileRemove(name)}
                                className="p-2 text-gray-400 hover:text-gray-500"
                                aria-label="Удалить файл"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleNext}
                      className={`w-full ${styles.buttonPrimary}`}
                    >
                      Продолжить
                    </button>
                  </>
                )}

                {step === 4 && (
                  <>
                    {/* Step 4: Telegram */}
                    <div className="space-y-5">
                      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 mb-6">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">
                          Подтверждение через Telegram:
                        </h3>
                        <ol className="text-sm text-gray-600 space-y-2">
                          <li className="flex items-start gap-2">
                            <span className="flex-none bg-primary/10 rounded-full w-5 h-5 flex items-center justify-center text-xs text-primary font-medium">
                              1
                            </span>
                            <span>
                              Перейдите в Telegram и найдите нашего бота:
                              <a 
                                href="https://t.me/ApexFlowBot" 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-primary hover:underline mt-1"
                              >
                                @ApexFlowBot
                              </a>
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="flex-none bg-primary/10 rounded-full w-5 h-5 flex items-center justify-center text-xs text-primary font-medium">
                              2
                            </span>
                            <span>
                              Нажмите кнопку "Start" или отправьте команду /start
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="flex-none bg-primary/10 rounded-full w-5 h-5 flex items-center justify-center text-xs text-primary font-medium">
                              3
                            </span>
                            <span>
                              Нажмите кнопку "Поделиться контактом" и разрешите боту доступ к вашему номеру телефона
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="flex-none bg-primary/10 rounded-full w-5 h-5 flex items-center justify-center text-xs text-primary font-medium">
                              4
                            </span>
                            <span>
                              После подтверждения номера вернитесь сюда и нажмите "Создать аккаунт"
                            </span>
                          </li>
                        </ol>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Номер телефона для верификации
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 select-none pointer-events-none">
                            +998 
                          </span>
                          <input
                            type="text"
                            value={formData.phoneNumber}
                            className="w-full h-12 pl-[72px] bg-gray-100 border border-gray-200 rounded-xl text-gray-800 opacity-60 cursor-not-allowed select-none pointer-events-none shadow-inner"
                            placeholder="90 123 45 67"
                            disabled
                          />
                        </div>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500">или</span>
                        </div>
                      </div>

                      <div className="space-y-4 mt-8">
                        <a
                          href="https://t.me/ApexFlowBot"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full h-12 text-center px-6 py-3 bg-white text-primary font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors inline-flex items-center justify-center"
                          onClick={() => {
                            // Reset verification error when opening Telegram
                            setVerificationError(null);
                          }}
                        >
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.2,4.4L2.9,10.7c-1.1,0.4-1.1,1.1-0.2,1.3l4.1,1.3l1.6,4.8c0.2,0.5,0.1,0.7,0.6,0.7c0.4,0,0.6-0.2,0.8-0.4 c0.1-0.1,1-1,2-2l4.2,3.1c0.8,0.4,1.3,0.2,1.5-0.7l2.8-13.1C20.6,4.6,19.9,4,19.2,4.4z M17.1,7.4l-7.8,7.1L9,17.8L7.4,13l9.2-5.8 C17,6.9,17.4,7.1,17.1,7.4z" />
                          </svg>
                          Открыть Telegram
                        </a>
                        {verificationError && (
                          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 whitespace-pre-line">
                            {verificationError}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={step === 4 ? handleTelegramVerification : handleNext}
                          disabled={isVerifying}
                          className={`w-full ${styles.buttonPrimary}`}
                        >
                          {step === 4 ? (isVerifying ? 'Проверка...' : 'Создать аккаунт') : 'Продолжить'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </form>
            </>
          )}
        </div>

        {/* Support Link */}
        <div className="mt-8 text-center">
          <a
            href="https://t.me/ApexFlowSupportBot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Нужна помощь?</span>
          </a>
        </div>
      </div>
    </div>
  );
}