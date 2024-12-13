  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Цена за единицу (сум)
          </label>
          <input
            type="number"
            value={pricePerUnit}
            onChange={(e) => {
              onChange('pricePerUnit', e.target.value);
              const newPrice = (parseFloat(e.target.value) || 0) * quantity;
              onChange('price', newPrice.toString());
            }}
            required
            disabled={disabled}
            placeholder="Введите цену за единицу"
            min="0"
            step="0.1"
            className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-lg
                     text-gray-900 placeholder-gray-400
                     focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary
                     disabled:bg-gray-100 disabled:text-gray-500
                     transition-colors duration-200"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Общая сум��а (сум)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => onChange('price', e.target.value)}
            required
            disabled={true}
            placeholder="Общая сумма"
            className="w-full h-11 px-4 bg-gray-100 border border-gray-200 rounded-lg
                     text-gray-500 placeholder-gray-400
                     cursor-not-allowed
                     transition-colors duration-200"
          />
          <p className="text-xs text-gray-500">
            Рассчитывается автоматически: {quantity} × {parseFloat(pricePerUnit).toLocaleString() || 0} сум
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="includeTax"
          checked={includeTax}
          onChange={(e) => onChange('includeTax', e.target.checked)}
          disabled={disabled}
          className="w-4 h-4 text-primary bg-gray-50 border-gray-200 rounded
                   focus:ring-primary focus:ring-2
                   disabled:bg-gray-100 disabled:text-gray-400
                   transition-colors duration-200"
        />
        <label htmlFor="includeTax" className="text-sm font-medium text-gray-700">
          Включить НДС в стоимость
        </label>
      </div>
    </div>
  ); 