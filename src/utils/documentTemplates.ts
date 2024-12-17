import { Protocol, Tender, Request } from '../types';
import { format, parseISO } from 'date-fns';

export function formatDate(date: string | Date | null): string {
  if (!date) return '-';
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return format(parsedDate, 'dd.MM.yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
}

export function formatMoney(amount: number | null | undefined): string {
  if (amount == null) return '-';
  try {
    return amount.toLocaleString('ru-RU');
  } catch (error) {
    console.error('Error formatting money:', error);
    return '-';
  }
}

export function generateProtocolTemplate(protocol: Protocol, tender: Tender, request: Request): string {
  try {
    const winner = tender.suppliers.find(s => s.id === tender.winnerId);
    const reserveWinner = tender.suppliers
      .filter(s => s.id !== tender.winnerId)
      .sort((a, b) => (a.price || 0) - (b.price || 0))[0];
    const item = request.items[0];
    if (!winner || !item) return '';

    const formatSupplierTable = (supplier: typeof winner) => {
      const items = request.items.map(item => `${item.name}                          ${item.quantity} ${item.unitType}     ${formatMoney(supplier.pricePerUnit)}    ${formatMoney(supplier.price)}   ${supplier.includeTax ? 'С НДС' : 'без НДС'}`).join('\n');

      return `------------------------------------------------------------------------------
Наименование                      Количество    Цена        Сумма      С НДС/
                                                                      без НДС
------------------------------------------------------------------------------
${items}
------------------------------------------------------------------------------
ИТОГО:                                                   ${formatMoney(supplier.price)}   ${supplier.includeTax ? 'С НДС' : 'без НДС'}
------------------------------------------------------------------------------

на следующих основных условиях:

условия оплаты: 30% предоплата
срок исполнения: ${supplier.deliveryTime} календарных дней`;
    };

    const suppliersList = tender.suppliers.map(s => 
      `${s.companyName} № ${s.proposalUrl ? s.proposalUrl.split('/').pop()?.split('.')[0] : 'б/н'} от ${formatDate(s.createdAt)}`
    ).join('\n');

    return `<!DOCTYPE html>
<html>
<body style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; max-width: 794px; margin: 0 auto;">
<pre style="white-space: pre-wrap;">
                                  ПРОТОКОЛ № ${protocol.id}

              закупочной комиссии по поставке товаров (выполнению работ,  
                                    оказанию услуг)

«${formatDate(protocol.createdAt)}»                                                                      г. Ташкент

Объект «MIRABAD SQUARE» по адресу: Мирабадский р-н., ул. Авлиё-ота, 126.

Заявка Маркетинга № ${request.number || 'б/н'} от ${formatDate(request.date)} г.

Согласование изменений -- нет.

На рассмотрение закупочной комиссии поступили коммерческие предложения от ${tender.suppliers.length} (${tender.suppliers.length === 2 ? 'двух' : tender.suppliers.length === 3 ? 'трех' : 'четырех'}) организаций по каждому наименованию товара:

${suppliersList}

По результатам проведенной закупочной процедуры, переговоров с потенциальными поставщиками (товаров, работ, услуг),

<b>Закупочная комиссия решила:</b>

1. <b>Признать победителем: ${winner.companyName}</b>

${formatSupplierTable(winner)}

${reserveWinner ? `2. <b>Признать резервным победителем: ${reserveWinner.companyName}</b>

${formatSupplierTable(reserveWinner)}` : ''}

3. Внести в наблюдательный совет ООО «APEX DEVELOPMENT» предложение по заключению контракта с <b>${winner.companyName}</b> по поставке ${item.name} в указанных количествах на указанных условиях в течение 3 (трех) дней с даты принятия настоящего решения${reserveWinner ? ` и в случае отказа или уклонения от подписания контракта, заключить контракт с резервным победителем -- <b>${reserveWinner.companyName}</b>` : ''}.

${tender.winnerReason ? `\nПричина выбора победителя: ${tender.winnerReason}\n` : ''}

Председатель закупочной комиссии _________________  У.А. Умаров

Продакшен менеджер               _________________  А.Гани

Член закупочной комиссии        _________________  Ф.А. Бабаджанов

Генеральный директор            _________________  А.Р. Раимжонов</pre>
</body>
</html>`;
  } catch (error) {
    console.error('Error generating protocol template:', error);
    return '';
  }
}

export function generateRequestTemplate(request: Request): string {
  try {
    const item = request.items[0];
    if (!item) return '';

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page {
            size: A4 landscape;
            margin: 10px;
        }
        body {
            width: 287mm;
            height: 190mm;
            margin: 0;
            padding: 10px;
            font-family: Arial, sans-serif;
            font-size: 11pt;
            max-height: 190mm;
            overflow: hidden;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 30px;
        }
        th, td {
            border: 1px solid black;
            padding: 4px;
            text-align: center;
        }
        .signatures {
            position: relative;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div style="text-align: center; margin: 5px 0;">
        <div style="font-weight: bold;">ЗАЯВКА</div>
        <div>на закупку Товаров (Работ, Услуг)</div>
    </div>

    <div style="display: flex; justify-content: space-between; margin: 10px 0;">
        <div style="width: 45%;">
            Наименование подразделения/должности инициатора:<br>
            <span style="border-bottom: 1px solid black;">Отдел маркетинга / Продакшен менеджер</span>
        </div>
        <div style="width: 45%; text-align: right;">
            Отделу закупок и снабжения<br>
            ООО «APEX DEVELOPMENT»
        </div>
    </div>

    <div style="margin: 10px 0;">
        <span>Заявка № ${request.number || '_'}</span> от ${formatDate(request.date)}г.
    </div>

    <table>
        <tr>
            <th style="width: 5%;">№</th>
            <th style="width: 35%;">Наименование необходимых<br>товаров (работ, услуг),<br>их технические характеристики и условия</th>
            <th style="width: 15%;">Лот (описание)<br>Объекта</th>
            <th style="width: 15%;">начальный срок<br>(периоды)<br>поставки<br>(выполнения<br>работ, услуг)</th>
            <th style="width: 10%;">ед.изм</th>
            <th style="width: 15%;">Объем<br>(количество)</th>
        </tr>
        ${request.items.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${item.description || item.name}</td>
            <td>${item.objectType === 'office' ? 'Офис' : 'Стройка'}</td>
            <td>${item.deadline} дней</td>
            <td>${item.unitType}</td>
            <td>${item.quantity}</td>
        </tr>`).join('')}
    </table>

    <div class="signatures">
        <div style="width: 100%;">
            <div style="display: flex; margin-bottom: 15px;">
                <div style="width: 40%;">Генеральный директор</div>
                <div style="width: 25%; border-bottom: 1px solid black;"></div>
                <div style="margin-left: 10px;">А.Р. Раимжонов</div>
            </div>
            <div style="display: flex; margin-bottom: 15px;">
                <div style="width: 40%;">Член закупочной комиссии</div>
                <div style="width: 25%; border-bottom: 1px solid black;"></div>
                <div style="margin-left: 10px;">Ф.А. Бабаджанов</div>
            </div>
            <div style="display: flex;">
                <div style="width: 40%;">Продакшен менеджер</div>
                <div style="width: 25%; border-bottom: 1px solid black;"></div>
                <div style="margin-left: 10px;">А.Гани</div>
            </div>
        </div>
    </div>
</body>
</html>`;
  } catch (error) {
    console.error('Error generating request template:', error);
    return '';
  }
}