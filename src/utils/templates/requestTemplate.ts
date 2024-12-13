import { Request } from '../../types';
import { formatDate } from '../formatters';

const SIGNATURE_URLS: Record<string, string> = {
  '00000000-0000-0000-0000-000000000001': 'https://mnhpdlwlwycdcexcelaf.supabase.co/storage/v1/object/public/signatures/abdurauf.png', // Abdurauf
  '00000000-0000-0000-0000-000000000003': 'https://mnhpdlwlwycdcexcelaf.supabase.co/storage/v1/object/public/signatures/fozil.png',    // Fozil
  '00000000-0000-0000-0000-000000000004': 'https://mnhpdlwlwycdcexcelaf.supabase.co/storage/v1/object/public/signatures/aziz.png'      // Aziz
};

interface SignaturePosition {
  x: number;
  y: number;
}

const SIGNATURE_POSITIONS: Record<string, SignaturePosition> = {
  '00000000-0000-0000-0000-000000000001': { x: 0, y: -35 },   // Abdurauf (General Director)
  '00000000-0000-0000-0000-000000000003': { x: 0, y: -40 },   // Fozil (Commission Member)
  '00000000-0000-0000-0000-000000000004': { x: 0, y: -40 }    // Aziz (Production Manager)
};

export function generateRequestTemplate(request: Request): string {
  try {
    const item = request.items[0];
    if (!item) return '';

    // Function to generate signature image
    const getSignatureHtml = (userId: string) => {
      if (SIGNATURE_URLS[userId]) {
        const position = SIGNATURE_POSITIONS[userId];
        return `<div class="signature-image" style="position: absolute; left: calc(50% + ${position.x}px); top: ${position.y}px; z-index: 1; pointer-events: none; transform: translate(-50%, 0);">
          <img src="${SIGNATURE_URLS[userId]}" alt="Подпись" style="height: 50px; margin: 0; padding: 0; display: block;">
        </div>`;
      }
      return '';
    };

    // Use request's createdAt field for the date
    const requestDate = formatDate(new Date(request.createdAt));

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
        .signature-container {
            position: relative;
            margin-bottom: 5px;
            white-space: nowrap;
            line-height: 2;
        }
        .signature-line {
            position: relative;
            border-bottom: 1px solid black;
            width: 200px;
            display: inline-block;
            margin: 0 10px;
            height: 1px;
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
            <span style="border-bottom: 1px solid black;">Отдел маркетинга / Продакшн менеджер</span>
        </div>
        <div style="width: 45%; text-align: right;">
            Отделу закупок и снабжения<br>
            ООО «APEX DEVELOPMENT»
        </div>
    </div>

    <div style="margin: 10px 0;">
        <span>Заявка № ${request.number || '_'}</span> от ${requestDate}г.
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

    <div class="signature-container">
        Генеральный директор <span class="signature-line">${getSignatureHtml('00000000-0000-0000-0000-000000000004')}</span> А.Р. Раимжонов
    </div>

    <div class="signature-container">
        Член закупочной комиссии <span class="signature-line">${getSignatureHtml('00000000-0000-0000-0000-000000000003')}</span> Ф.А. Бабаджанов
    </div>

    <div class="signature-container">
        Продакшн менеджер <span class="signature-line">${getSignatureHtml('00000000-0000-0000-0000-000000000001')}</span> А.Гани
    </div>
</body>
</html>`;
  } catch (error) {
    console.error('Error generating request template:', error);
    return '';
  }
}
