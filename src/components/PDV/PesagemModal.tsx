import { useState } from "react";
import { useWeightFromScale } from "../../hooks/useWeightFromScale";

export function PesagemModal({ produto, onConfirmar }: { produto: any, onConfirmar: (pesoGramas: number) => void }) {
  const [pesoManual, setPesoManual] = useState<number>(0);
  const { fetchWeight, loading } = useWeightFromScale();

  const usarBalanca = async () => {
    const peso = await fetchWeight();
    if (peso === null || isNaN(peso) || peso <= 0) {
      alert("❌ Balança não disponível. Por favor, use o modo manual.");
      return;
    }
    const pesoGramas = Math.round(peso * 1000);
    setPesoManual(pesoGramas);
    console.log("✅ Peso lido:", pesoGramas, "g");
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">Pesagem de Produto</h2>
      <p className="mb-4">{produto.name || produto.nome}</p>

      <div className="space-y-2">
        <button
          onClick={usarBalanca}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2 w-full"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Pesando...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
              Usar Balança
            </>
          )}
        </button>

        <p className="text-sm text-gray-500">Ou insira o peso manualmente:</p>

        <input
          type="number"
          value={pesoManual}
          onChange={(e) => setPesoManual(parseInt(e.target.value))}
          placeholder="Peso em gramas"
          className="border px-2 py-1 rounded w-full"
        />

        <div className="flex gap-2 flex-wrap text-sm">
          {[100, 200, 300, 400, 500, 1000].map((g) => (
            <button
              key={g}
              onClick={() => setPesoManual(g)}
              className="bg-gray-200 px-3 py-1 rounded"
            >
              {g}g
            </button>
          ))}
        </div>

        <button
          onClick={() => onConfirmar(pesoManual)}
          className="bg-blue-600 text-white px-4 py-2 rounded mt-3"
        >
          Confirmar Peso
        </button>
      </div>
    </div>
  );
}