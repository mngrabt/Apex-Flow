import { Protocol, Tender, Request } from '../../types';
import { formatDate, formatMoney } from '../formatters';

const SIGNATURE_URLS: Record<string, string> = {
  '00000000-0000-0000-0000-000000000001': 'https://mnhpdlwlwycdcexcelaf.supabase.co/storage/v1/object/public/signatures/abdurauf.png',
  '00000000-0000-0000-0000-000000000003': 'https://mnhpdlwlwycdcexcelaf.supabase.co/storage/v1/object/public/signatures/fozil.png',
  '00000000-0000-0000-0000-000000000004': 'https://mnhpdlwlwycdcexcelaf.supabase.co/storage/v1/object/public/signatures/aziz.png',
  '00000000-0000-0000-0000-000000000005': 'https://mnhpdlwlwycdcexcelaf.supabase.co/storage/v1/object/public/signatures/umar.png' 
};

// Individual position controls for each signature
interface SignaturePosition {
  x: number;
  y: number;
}

const SIGNATURE_POSITIONS: Record<string, SignaturePosition> = {
  '00000000-0000-0000-0000-000000000001': { x: 0, y: -40 },  
  '00000000-0000-0000-0000-000000000003': { x: 0, y: -40 },  
  '00000000-0000-0000-0000-000000000004': { x: 0, y: -40 },  
  '00000000-0000-0000-0000-000000000005': { x: 0, y: -40 }  
};

export function generateProtocolTemplate(protocol: Protocol & { number?: string }, tender: Tender, request: Request): string {
  try {
    const winner = tender.suppliers.find(s => s.id === tender.winnerId);
    const reserveWinner = tender.suppliers
      .filter(s => s.id !== tender.winnerId)
      .sort((a, b) => (a.price || 0) - (b.price || 0))[0];
    const item = request.items[0];
    if (!winner || !item) return '';

    // Get signed users
    const signedUsers = protocol.signatures?.map(sig => sig.userId) || [];

    // Function to generate signature image if user has signed
    const getSignatureHtml = (userId: string) => {
      if (signedUsers.includes(userId) && SIGNATURE_URLS[userId]) {
        const position = SIGNATURE_POSITIONS[userId];
        return `<div class="signature-image" style="position: absolute; left: calc(50% + ${position.x}px); top: ${position.y}px; z-index: 1; pointer-events: none; transform: translate(-50%, 0);">
          <img src="${SIGNATURE_URLS[userId]}" alt="Подпись" style="height: 50px; margin: 0; padding: 0; display: block;">
        </div>`;
      }
      return '';
    };

    const formatSupplierTable = (supplier: typeof winner) => {
      const items = request.items.map(item => {
        const name = item.name.padEnd(30, ' ');
        const quantity = `${item.quantity} ${item.unitType}`.padEnd(13, ' ');
        const price = formatMoney(supplier.pricePerUnit).padEnd(15, ' ');
        const total = formatMoney(supplier.price).padEnd(16, ' ');
        const tax = (supplier.includeTax ? 'С НДС' : 'без НДС');
        
        return `${name}${quantity}${price}${total}${tax}`;
      }).join('\n');

      const separator = '-'.repeat(81);

      return `${separator}
Наименование                Количество        Цена           Сумма        С НДС/
                                                                          без НДС
${separator}
${items}
${separator}
ИТОГО: ${formatMoney(supplier.price)} ${supplier.includeTax ? 'С НДС' : 'без НДС'}
${separator}

на следующих основных условиях:

Условия оплаты: 30% предоплата
Срок исполнения: ${supplier.deliveryTime} календарных дней`;
    };

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    .signature-line {
      position: relative;
      border-bottom: 1px solid black;
      width: 200px;
      display: inline-block;
      margin: 0 10px;
      height: 0px;
    }
    .signature-container {
      position: relative;
      margin-bottom: 1px;
      white-space: nowrap;
      line-height: 0;
    }
    .signature-image {
      position: absolute;
      z-index: 1;
      pointer-events: none;
      transform: translate(-50%, 0);
    }
    .signature-image img {
      margin: 0;
      padding: 0;
      display: block;
    }
  </style>
</head>
<body style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; max-width: 794px; margin: 0 auto;">
<pre style="white-space: pre-wrap;">
                                  ПРОТОКОЛ № ${protocol.number || 'б/н'}

              закупочной комиссии по поставке товаров (выполнению работ,  
                                    оказанию услуг)

«${formatDate(protocol.createdAt)}»                                                                      г. Ташкент

Объект «MIRABAD SQUARE» по адресу: Мирабадский р-н., ул. Авлиё-ота, 126.

Заявка Маркетинга № ${request.number || 'б/н'} от ${formatDate(request.date)} г.

Согласование изменений -- нет.

На рассмотрение закупочной комиссии поступили коммерческие предложения от ${tender.suppliers.length} (${tender.suppliers.length === 2 ? 'двух' : tender.suppliers.length === 3 ? 'трех' : 'четырех'}) организаций по каждому наименованию товара:

${tender.suppliers.map(s => `${s.companyName} № б/н от ${formatDate(s.createdAt)}`).join('\n')}

По результатам проведенной закупочной процедуры, переговоров с потенциальными поставщиками (товаров, работ, услуг),

Закупочная комиссия решила:

1. Признать победителем: ${winner.companyName}

${formatSupplierTable(winner)}

${reserveWinner ? `
2. Признать резервным победителем: ${reserveWinner.companyName}

${formatSupplierTable(reserveWinner)}

3. Внести в наблюдательный совет ООО «APEX DEVELOPMENT» предложение по заключению контракта с ${winner.companyName} по поставке ${item.name} в указанных количествах на указанных условиях в течение 3 (трех) дней с даты принятия настоящего решения и в случае отказа или уклонения от подписания контракта, заключить контракт с резервным победителем -- ${reserveWinner.companyName}.` : 
`
2. Внести в наблюдательный совет ООО «APEX DEVELOPMENT» предложение по заключению контракта с ${winner.companyName} по поставке ${item.name} в указанных количествах на указанных условиях в течение 3 (трех) дней с даты принятия настоящего решения.`}

${tender.winnerReason ? `\nПричина выбора победителя: ${tender.winnerReason}\n` : ''}

<div class="signature-container">
Председатель закупочной комиссии <span class="signature-line">${getSignatureHtml('00000000-0000-0000-0000-000000000005')}</span> У.А. Умаров</div>

<div class="signature-container">
Продакшен менеджер               <span class="signature-line">${getSignatureHtml('00000000-0000-0000-0000-000000000001')}</span> А.Гани</div>

<div class="signature-container">
Член закупочной комиссии        <span class="signature-line">${getSignatureHtml('00000000-0000-0000-0000-000000000003')}</span> Ф.А. Бабаджанов</div>

<div class="signature-container">
Генеральный директор            <span class="signature-line">${getSignatureHtml('00000000-0000-0000-0000-000000000004')}</span> А.Р. Раимжонов</div></pre>
</body>
</html>`;
  } catch (error) {
    console.error('Error generating protocol template:', error);
    return '';
  }
}
