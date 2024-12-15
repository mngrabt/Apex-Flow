import { Protocol } from '../../types';
import { formatDate } from '../formatters';
import { supabase } from '../../lib/supabase';

const SIGNATURE_URLS: Record<string, string> = {
  '00000000-0000-0000-0000-000000000001': 'https://mnhpdlwlwycdcexcelaf.supabase.co/storage/v1/object/public/signatures/abdurauf.png', 
  '00000000-0000-0000-0000-000000000003': 'https://mnhpdlwlwycdcexcelaf.supabase.co/storage/v1/object/public/signatures/fozil.png',    
  '00000000-0000-0000-0000-000000000004': 'https://mnhpdlwlwycdcexcelaf.supabase.co/storage/v1/object/public/signatures/aziz.png'    
};

export async function generateCashRequestTemplate(protocol: Protocol): Promise<string> {
  try {
    const item = protocol.request?.items[0];
    if (!item) throw new Error('No items found in request');
    if (!protocol.request?.id) throw new Error('No request ID found');

    // Fetch signatures directly from the database
    const { data: signatures, error } = await supabase
      .from('request_signatures')
      .select('*')
      .eq('request_id', protocol.request.id);

    if (error) {
      console.error('Error fetching signatures:', error);
      throw error;
    }

    console.log('Fetched signatures from database:', signatures);

    // Format date
    const date = new Date(protocol.request?.date || '').toLocaleDateString('ru-RU');

    // Function to generate signature image if user has signed
    const getSignatureHtml = (userId: string) => {
      const hasSignature = signatures?.some(sig => sig.user_id === userId);
      
      console.log(`Checking signatures for user ${userId}:`, {
        signatures,
        hasSignature
      });

      if (hasSignature && SIGNATURE_URLS[userId]) {
        console.log(`Found signature for user ${userId}, adding image from ${SIGNATURE_URLS[userId]}`);
        return `<div class="signature-image">
          <img src="${SIGNATURE_URLS[userId]}" alt="Подпись">
        </div>`;
      }
      return '';
    };

    // Read the template
    const template = `<!DOCTYPE html>
<html>
<head>
    <style>
        @page {
            size: A4;
            margin: 0;
        }
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            width: auto;
            height: 297mm;
            margin: 20mm 20mm;
            padding: 0;
        }
        .header {
            text-align: right;
            margin-bottom: 30px;
        }
        .title {
            text-align: center;
            font-weight: bold;
            margin: 20px 0;
        }
        .subtitle {
            text-align: center;
            margin-bottom: 30px;
        }
        .content {
            margin: 20px 0;
        }
        .item {
            margin-bottom: 15px;
            padding-left: 15px;
        }
        .item::before {
            content: "•";
            margin-left: -15px;
            margin-right: 5px;
        }
        .signature {
            margin-top: 60px;
        }
        .sign-line {
            display: inline-block;
            width: 200px;
            border-bottom: 1px solid black;
            margin: 0 10px;
        }
        .bold {
            font-weight: bold;
        }
        .signature-container {
            position: relative;
            margin: 10px 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .signature-image {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            z-index: 1;
            pointer-events: none;
        }
        .signature-image img {
            height: 55px;
            margin: 0;
            padding: 5;
            opacity: 0.9;
        }
        .signature-label {
            min-width: 200px;
        }
        .signature-name {
            min-width: 120px;
        }
    </style>
</head>
<body>
    <div class="header">
        {{date}}<br>
        Наблюдательный совет<br>
        ООО APEX DEVELOPMENT
    </div>

    <div class="title">
        Заявка
    </div>
    <div class="subtitle">
        о выдаче наличных средств
    </div>

    <div class="content">
        <p>Просим выделить наличные средства на следующие расходы:</p>

        <div class="item">
            <span class="bold">{{item_name}}</span><br>
            Сумма: <span class="bold">{{total_sum}}</span><br>
            Количество: <span class="bold">{{quantity}}</span><br>
            Цель: {{description}}
        </div>
    </div>

    <div class="signature">
        <p>Подотчетное лицо Гани А.</p>
        
        {{production_manager_signature}}
        
        {{commission_member_signature}}
        
        {{general_director_signature}}
    </div>
</body>
</html>`;

    // Replace placeholders in template
    let html = template
      .replace('{{date}}', date)
      .replace('{{item_name}}', item.name)
      .replace('{{quantity}}', `${item.quantity} шт.`)
      .replace('{{total_sum}}', `${item.totalSum?.toLocaleString('ru-RU')} сум`)
      .replace('{{description}}', item.description || '');

    // Add signature images
    html = html
      .replace('{{production_manager_signature}}', 
        `<div class="signature-container">
          <div class="signature-label">Продакшен Менеджер</div>
          <div style="position: relative;">
            <span class="sign-line"></span>
            ${getSignatureHtml('00000000-0000-0000-0000-000000000001')}
          </div>
          <div class="signature-name">А. Гани</div>
        </div>`)
      .replace('{{commission_member_signature}}', 
        `<div class="signature-container">
          <div class="signature-label">Член закупочной комиссии</div>
          <div style="position: relative;">
            <span class="sign-line"></span>
            ${getSignatureHtml('00000000-0000-0000-0000-000000000003')}
          </div>
          <div class="signature-name">Ф.А. Бабаджанов</div>
        </div>`)
      .replace('{{general_director_signature}}', 
        `<div class="signature-container">
          <div class="signature-label">Генеральный директор</div>
          <div style="position: relative;">
            <span class="sign-line"></span>
            ${getSignatureHtml('00000000-0000-0000-0000-000000000004')}
          </div>
          <div class="signature-name">А.Р. Раимжонов</div>
        </div>`);

    return html;
  } catch (error) {
    console.error('Error generating cash request template:', error);
    throw error;
  }
} 