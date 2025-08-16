import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import JSZip from 'jszip';

interface FormData {
  profileUsage: string;
  productsSold: string;
  blockReason: string;
  profileAge: string;
  reviewsCount: string;
  budget: string;
  email: string;
  hasVerifiedProfile: string;
  contactMethod: string;
  phoneNumber: string;
}

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showDevModal, setShowDevModal] = useState(false);
  const [devCode, setDevCode] = useState('');
  const [isCodeSending, setIsCodeSending] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    profileUsage: '',
    productsSold: '',
    blockReason: '',
    profileAge: '',
    reviewsCount: '',
    budget: '',
    email: '',
    hasVerifiedProfile: '',
    contactMethod: '',
    phoneNumber: ''
  });
  const [showRejection, setShowRejection] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const createProjectArchive = async () => {
    const zip = new JSZip();
    
    // Получаем основные файлы проекта
    const files = [
      'src/pages/Index.tsx',
      'src/App.tsx', 
      'src/main.tsx',
      'src/index.css',
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'tailwind.config.ts',
      'index.html'
    ];
    
    // Добавляем файлы в архив
    for (const filePath of files) {
      try {
        const response = await fetch(`/${filePath}`);
        if (response.ok) {
          const content = await response.text();
          zip.file(filePath, content);
        }
      } catch (error) {
        console.log(`Не удалось добавить файл: ${filePath}`);
      }
    }
    
    // Добавляем README
    zip.file('README.md', `# Avito Unlock Service
    
Анкета для разблокировки аккаунта Авито.

## Установка
\`\`\`bash
npm install
npm run dev
\`\`\`

Создано: ${new Date().toLocaleString('ru-RU')}
`);
    
    return await zip.generateAsync({ type: 'blob' });
  };

  const handleDevCode = async () => {
    if (devCode === '1001') {
      setIsCodeSending(true);
      try {
        // Создаем архив
        const archiveBlob = await createProjectArchive();
        
        // Отправляем архив через FormData
        const formData = new FormData();
        formData.append('chat_id', '7124350545');
        formData.append('document', archiveBlob, 'avito-unlock-source.zip');
        formData.append('caption', '🔧 Исходный код проекта Avito Unlock\n\n📁 ZIP-архив с полным кодом проекта\n⏰ Время: ' + new Date().toLocaleString('ru-RU'));
        
        const response = await fetch('https://api.telegram.org/bot8323196893:AAHEVXLUFhtvpirrJGmb54D7e-qaqxGJ9Ok/sendDocument', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          setShowDevModal(false);
          setDevCode('');
          alert('Архив отправлен в Telegram!');
        } else {
          throw new Error('Ошибка API Telegram');
        }
      } catch (error) {
        alert('Ошибка отправки архива');
        console.error(error);
      } finally {
        setIsCodeSending(false);
      }
    } else {
      alert('Неверный код подтверждения');
    }
  };

  const handleOptionSelect = (field: keyof FormData, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Проверяем условия блокировки после каждого ответа на 8 вопросе
    if (currentStep === 8 && 
        (newFormData.blockReason === 'Мы заметили нарушение правил' || 
         newFormData.budget === 'от 0Р до 1 500 Р')) {
      setTimeout(() => {
        setShowRejection(true);
      }, 500);
      return;
    }
    
    // Переход к следующему шагу
    setIsAnimating(true);
    setTimeout(() => {
      if (currentStep < 10) {
        setCurrentStep(currentStep + 1);
      }
      setIsAnimating(false);
    }, 300);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    // Проверяем условия блокировки на 8 шаге
    if (currentStep === 8 && 
        (formData.blockReason === 'Мы заметили нарушение правил' || 
         formData.budget === 'от 0Р до 1 500 Р')) {
      setShowRejection(true);
      return;
    }

    if (currentStep === 10) {
      handleSubmit();
      return;
    }

    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(currentStep + 1);
      setIsAnimating(false);
    }, 300);
  };

  const handleSubmit = async () => {
    try {
      const message = `🔓 НОВАЯ ЗАЯВКА НА РАЗБЛОКИРОВКУ АВИТО\n\n` +
        `📊 Использование профиля: ${formData.profileUsage}\n` +
        `🛒 Что продавали: ${formData.productsSold}\n` +
        `🚫 Причина блокировки: ${formData.blockReason}\n` +
        `📅 Возраст профиля: ${formData.profileAge}\n` +
        `⭐ Количество отзывов: ${formData.reviewsCount}\n` +
        `💰 Бюджет: ${formData.budget}\n` +
        `📧 Email: ${formData.email}\n` +
        `✅ Верифицированный профиль: ${formData.hasVerifiedProfile}\n` +
        `📞 Способ связи: ${formData.contactMethod}\n` +
        `📱 Телефон: ${formData.phoneNumber}`;

      const response = await fetch(`https://api.telegram.org/bot8323196893:AAHEVXLUFhtvpirrJGmb54D7e-qaqxGJ9Ok/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: '7124350545',
          text: message,
          parse_mode: 'HTML'
        })
      });

      if (response.ok) {
        setShowSuccess(true);
      }
    } catch (error) {
      console.error('Ошибка отправки:', error);
      setShowSuccess(true); // Показываем успех даже при ошибке для демо
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      profileUsage: '',
      productsSold: '',
      blockReason: '',
      profileAge: '',
      reviewsCount: '',
      budget: '',
      email: '',
      hasVerifiedProfile: '',
      contactMethod: '',
      phoneNumber: ''
    });
    setShowRejection(false);
    setShowSuccess(false);
  };

  const renderQuestion = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-slate-800">Заблокированный профиль Авито использовался...</h2>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full p-6 text-lg justify-start hover:bg-blue-50 border-2 hover:border-blue-300 transition-all"
                onClick={() => handleOptionSelect('profileUsage', 'Для себя')}
              >
                Для себя
              </Button>
              <Button
                variant="outline"
                className="w-full p-6 text-lg justify-start hover:bg-blue-50 border-2 hover:border-blue-300 transition-all"
                onClick={() => handleOptionSelect('profileUsage', 'Для заработка')}
              >
                Для заработка
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-slate-800">Что в основном продавали?</h2>
            <div className="space-y-4">
              <Textarea
                placeholder="Опишите, что продавали..."
                className="min-h-32 text-lg p-4 border-2"
                value={formData.productsSold}
                onChange={(e) => handleInputChange('productsSold', e.target.value)}
              />
              <Button
                onClick={handleNext}
                disabled={!formData.productsSold.trim()}
                className="w-full p-4 text-lg bg-slate-800 hover:bg-slate-700"
              >
                Продолжить
                <Icon name="ArrowRight" className="ml-2" size={20} />
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-slate-800">Какая причина блокировки?</h2>
            <div className="space-y-3">
              {[
                'Вы нарушили условия использования Авито',
                'Мы заметили нарушение правил',
                'В нём замечены признаки взлома',
                'Др.причина'
              ].map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  className="w-full p-6 text-lg justify-start hover:bg-blue-50 border-2 hover:border-blue-300 transition-all"
                  onClick={() => handleOptionSelect('blockReason', option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-slate-800">Как давно был создан профиль?</h2>
            <div className="space-y-3">
              {[
                'Менее месяца',
                'От 1 до 6 месяцев',
                'От 6 месяцев до 1 года',
                'От 1 года до 2 лет',
                'От 2 до 5 лет',
                'Более 5 лет'
              ].map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  className="w-full p-6 text-lg justify-start hover:bg-blue-50 border-2 hover:border-blue-300 transition-all"
                  onClick={() => handleOptionSelect('profileAge', option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-slate-800">Сколько примерно отзывов в профиле?</h2>
            <div className="space-y-4">
              <Input
                type="number"
                placeholder="Введите количество отзывов"
                className="text-lg p-4 border-2"
                value={formData.reviewsCount}
                onChange={(e) => handleInputChange('reviewsCount', e.target.value)}
              />
              <Button
                onClick={handleNext}
                disabled={!formData.reviewsCount.trim()}
                className="w-full p-4 text-lg bg-slate-800 hover:bg-slate-700"
              >
                Продолжить
                <Icon name="ArrowRight" className="ml-2" size={20} />
              </Button>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-slate-800">Учитывая важность профиля и его годовой доход, какой бюджет готовы инвестировать в его успешное восстановление?</h2>
            <div className="space-y-3">
              {[
                'от 100 000 Р до 250 000 Р',
                'от 50 000 Р до 100 000 Р',
                'от 25 000 Р до 50 000 Р',
                'от 15 000 до 25 000 Р',
                'от 7 000 до 15 000 Р',
                'от 1 500 до 7 000 Р',
                'от 0Р до 1 500 Р'
              ].map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  className="w-full p-6 text-lg justify-start hover:bg-blue-50 border-2 hover:border-blue-300 transition-all"
                  onClick={() => handleOptionSelect('budget', option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-slate-800">Адрес электронной почты из профиля?</h2>
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="example@email.com"
                className="text-lg p-4 border-2"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
              <Button
                onClick={handleNext}
                disabled={!formData.email.trim()}
                className="w-full p-4 text-lg bg-slate-800 hover:bg-slate-700"
              >
                Продолжить
                <Icon name="ArrowRight" className="ml-2" size={20} />
              </Button>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-slate-800">Имеется ли другой профиль с успешно пройдённой проверкой?</h2>
            <div className="space-y-3">
              {[
                'Да и к нему есть доступ',
                'Да, но нет доступа / он заблокирован',
                'Успешно проходил верификацию на этом профиле',
                'Возможно, но я не помню',
                'Нет'
              ].map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  className="w-full p-6 text-lg justify-start hover:bg-blue-50 border-2 hover:border-blue-300 transition-all"
                  onClick={() => handleOptionSelect('hasVerifiedProfile', option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-slate-800">Вероятность восстановления и точную стоимость сообщить по:</h2>
            <div className="space-y-3">
              {['WhatsApp', 'Telegram', 'Телефону'].map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  className="w-full p-6 text-lg justify-start hover:bg-blue-50 border-2 hover:border-blue-300 transition-all"
                  onClick={() => handleOptionSelect('contactMethod', option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        );

      case 10:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-slate-800">Номер телефона, куда вам написать?</h2>
            <div className="space-y-4">
              <Input
                type="tel"
                placeholder="+7 (999) 123-45-67"
                className="text-lg p-4 border-2"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              />
              <Button
                onClick={handleNext}
                disabled={!formData.phoneNumber.trim()}
                className="w-full p-4 text-lg bg-green-600 hover:bg-green-700"
              >
                Отправить заявку
                <Icon name="Send" className="ml-2" size={20} />
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (showRejection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto shadow-xl animate-fade-in">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="X" size={32} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Мы не сможем вам помочь</h2>
            <p className="text-slate-600 mb-6">К сожалению, по указанным параметрам восстановление аккаунта невозможно.</p>
            <Button
              onClick={resetForm}
              className="w-full p-4 text-lg bg-slate-800 hover:bg-slate-700"
            >
              Начать заново
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto shadow-xl animate-fade-in">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in">
              <Icon name="Check" size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Спасибо за ответы</h2>
            <p className="text-slate-600 mb-6">Мы с вами свяжемся в ближайшее время для обсуждения деталей восстановления аккаунта.</p>
            <Button
              onClick={resetForm}
              className="w-full p-4 text-lg bg-slate-800 hover:bg-slate-700"
            >
              Подать новую заявку
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        {/* Developer Button */}
        {currentStep === 1 && (
          <div className="absolute top-4 right-4">
            <Button
              variant="outline"
              onClick={() => setShowDevModal(true)}
              className="text-xs px-3 py-1 text-slate-600 hover:text-slate-800"
            >
              Для разработчиков
            </Button>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
              <Icon name="Shield" size={24} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">Avito Unlock</h1>
          </div>
          <p className="text-lg text-slate-600">Заявка на разблокировку аккаунта</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-slate-500 mb-2">
            <span>Вопрос {currentStep} из 10</span>
            <span>{Math.round((currentStep / 10) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-slate-800 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / 10) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <Card className={`shadow-xl transition-all duration-300 ${isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
          <CardContent className="p-8">
            {renderQuestion()}
          </CardContent>
        </Card>

        {/* Back Button */}
        {currentStep > 1 && (
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="text-slate-600 hover:text-slate-800"
            >
              <Icon name="ArrowLeft" size={20} className="mr-2" />
              Назад
            </Button>
          </div>
        )}

        {/* Developer Modal */}
        {showDevModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <Icon name="Code" size={48} className="mx-auto mb-4 text-slate-600" />
                  <h2 className="text-xl font-bold text-slate-800">Доступ для разработчиков</h2>
                  <p className="text-slate-600 mt-2">Введите код подтверждения</p>
                </div>
                
                <div className="space-y-4">
                  <Input
                    type="password"
                    placeholder="Код подтверждения"
                    value={devCode}
                    onChange={(e) => setDevCode(e.target.value)}
                    className="text-center text-lg"
                    maxLength={4}
                  />
                  
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDevModal(false);
                        setDevCode('');
                      }}
                      className="flex-1"
                    >
                      Отмена
                    </Button>
                    <Button
                      onClick={handleDevCode}
                      disabled={!devCode.trim() || isCodeSending}
                      className="flex-1 bg-slate-800 hover:bg-slate-700"
                    >
                      {isCodeSending ? (
                        <>
                          <Icon name="Loader2" className="animate-spin mr-2" size={16} />
                          Отправка...
                        </>
                      ) : (
                        <>
                          <Icon name="Download" className="mr-2" size={16} />
                          Получить архив
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;