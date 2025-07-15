import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

const PDVPrintSettings: React.FC = () => {
  const [printerSettings, setPrinterSettings] = useState({
    paper_width: '80mm',
    page_size: 300,
    font_size: 2,
    delivery_font_size: 14,
    scale: 1,
    margin_left: 0,
    margin_top: 1,
    margin_bottom: 1,
    autoPrintOnDelivery: false,
    autoPrintOnDelivery: false,
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('pdv_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.printer_layout) {
          setPrinterSettings(prev => ({
            ...prev,
            ...parsed.printer_layout,
            autoPrintOnDelivery: parsed.autoPrintOnDelivery ?? false,
            autoPrintOnDelivery: parsed.autoPrintOnDelivery ?? false,
          }));
        }
      } catch (e) {
        console.error('Erro ao carregar configurações:', e);
      }
    }
  }, []);

  const handleSave = () => {
    const current = localStorage.getItem('pdv_settings');
    const parsed = current ? JSON.parse(current) : {};
    parsed.printer_layout = printerSettings;
    parsed.autoPrintOnDelivery = printerSettings.autoPrintOnDelivery;
    parsed.autoPrintOnDelivery = printerSettings.autoPrintOnDelivery;
    localStorage.setItem('pdv_settings', JSON.stringify(parsed));

    const successMessage = document.createElement('div');
    successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
    successMessage.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      Configurações de impressora salvas com sucesso!
    `;
    document.body.appendChild(successMessage);
    setTimeout(() => document.body.removeChild(successMessage), 3000);
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Largura do Papel</label>
          <select
            value={printerSettings.paper_width}
            onChange={(e) => setPrinterSettings(prev => ({ ...prev, paper_width: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg"
          >
            <option value="58mm">58mm</option>
            <option value="80mm">80mm</option>
            <option value="A4">A4</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho da Fonte</label>
          <input
            type="number"
            value={printerSettings.font_size}
            onChange={(e) => setPrinterSettings(prev => ({ ...prev, font_size: parseInt(e.target.value) }))}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Escala</label>
          <input
            type="number"
            value={printerSettings.scale}
            onChange={(e) => setPrinterSettings(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Margem Esquerda</label>
          <input
            type="number"
            value={printerSettings.margin_left}
            onChange={(e) => setPrinterSettings(prev => ({ ...prev, margin_left: parseInt(e.target.value) }))}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Margem Superior</label>
          <input
            type="number"
            value={printerSettings.margin_top}
            onChange={(e) => setPrinterSettings(prev => ({ ...prev, margin_top: parseInt(e.target.value) }))}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Margem Inferior</label>
          <input
            type="number"
            value={printerSettings.margin_bottom}
            onChange={(e) => setPrinterSettings(prev => ({ ...prev, margin_bottom: parseInt(e.target.value) }))}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>
        <div className="md:col-span-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={printerSettings.autoPrintOnDelivery}
              onChange={(e) => setPrinterSettings(prev => ({ ...prev, autoPrintOnDelivery: e.target.checked }))}
              className="h-4 w-4 text-purple-600 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Imprimir automaticamente ao receber pedido do delivery</span>
          </label>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white"
        >
          <Save size={20} />
          Salvar Configurações
        </button>
      </div>
    </div>
  );
};

export default PDVPrintSettings;
