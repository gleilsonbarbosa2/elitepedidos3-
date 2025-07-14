import { useState } from "react";
import { useWeightFromScale } from "../../hooks/useWeightFromScale";
import { useEffect, useRef } from "react";

export function PesagemModal({ produto, onConfirmar, useDirectScale = false }: { 
  produto: any, 
  onConfirmar: (pesoGramas: number) => void,
  useDirectScale?: boolean 
}) {
  const [pesoManual, setPesoManual] = useState<number>(0);
  const [tentativas, setTentativas] = useState<number>(0);
  const { fetchWeight, loading, isWeightDuplicate, confirmWeight } = useWeightFromScale();
  const [isDuplicate, setIsDuplicate] = useState<boolean>(false);
  const confirmedRef = useRef<boolean>(false);
  
  // Tentar ler o peso automaticamente quando o modal abrir
  useEffect(() => {
    // Pequeno delay para dar tempo da balança se estabilizar
    const timer = setTimeout(() => {
      usarBalanca();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const usarBalanca = async () => {
    setTentativas(prev => prev + 1);
    console.log(`🔄 Tentativa ${tentativas + 1} de leitura da balança`);
    
    const peso = await fetchWeight();
    if (peso === null || isNaN(peso) || peso <= 0) {
      // Se for a primeira tentativa, tenta novamente automaticamente
      if (tentativas === 0) {
        console.log("⚠️ Primeira tentativa falhou, tentando novamente...");
        setTimeout(() => usarBalanca(), 800);
      } else {
        console.log("❌ Não foi possível obter o peso após múltiplas tentativas");
        alert("Não foi possível obter o peso. Verifique se o produto está posicionado corretamente na balança.");
      }
      return;
    }
    const pesoGramas = Math.round(peso * 1000);
    setPesoManual(pesoGramas);
    setIsDuplicate(isWeightDuplicate(peso));
    console.log("✅ Peso lido:", pesoGramas, "g");
  };

  const handleConfirmarPeso = () => {
    if (pesoManual <= 0) return;
    
    // Verificar se é um peso duplicado e ainda não foi confirmado
    if (isDuplicate && !confirmedRef.current) {
      if (confirm("Esse peso é igual ao anterior. Tem certeza que deseja confirmar novamente?")) {
        // Marcar como confirmado para evitar múltiplas confirmações
        confirmedRef.current = true;
        // Registrar o peso como confirmado
        confirmWeight(pesoManual / 1000); // Converter para kg
        // Chamar o callback de confirmação
        onConfirmar(pesoManual);
      }
    } else {
      confirmWeight(pesoManual / 1000); // Converter para kg
      onConfirmar(pesoManual);
    }
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
          title="Ler peso da balança"
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

        {pesoManual > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 my-2">
            <p className="text-green-700 font-medium flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Peso lido: {pesoManual}g
            </p>
          </div>
        )}

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

        {isDuplicate && (
          <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded mt-3">
            <p className="text-sm">⚠️ Atenção: Este peso é igual ao último confirmado.</p>
          </div>
        )}

        <button
          onClick={handleConfirmarPeso}
          className={`${isDuplicate ? 'bg-yellow-600' : 'bg-blue-600'} text-white px-4 py-2 rounded mt-3`}
          title="Confirmar peso manual"
        >
          Confirmar Peso
        </button>
      </div>
    </div>
  );
}