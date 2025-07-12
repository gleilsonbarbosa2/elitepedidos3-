import { useState } from "react";
import { supabase } from "../lib/supabase";

// Armazenar o último peso lido em cache para evitar múltiplas consultas
let lastWeightCache = {
  weight: null as number | null,
  timestamp: 0
};

/**
 * Hook para ler o peso da balança via tabela Supabase
 * Requer uma tabela pesagem_temp com campos id, peso e criado_em
 */
export function useWeightFromScale() {
  const [loading, setLoading] = useState(false);

  const fetchWeight = async (): Promise<number | null> => {
    setLoading(true);
    try {
      // Verificar se temos um peso em cache recente (menos de 5 segundos)
      const now = Date.now();
      if (lastWeightCache.weight !== null && (now - lastWeightCache.timestamp) < 5000) {
        console.log("✅ Usando peso em cache:", lastWeightCache.weight);
        return lastWeightCache.weight;
      }
      
      // Check if we're in a restricted environment (like StackBlitz)
      const isRestrictedEnvironment = window.location.hostname.includes('webcontainer') || 
                                     window.location.hostname.includes('stackblitz');
      
      if (isRestrictedEnvironment) {
        console.log("⚠️ Ambiente com restrição de CSP detectado.");
        return null;
      }
      
      // Tentar ler diretamente da API local primeiro (mais rápido)
      try {
        const response = await fetch('http://localhost:4000/peso', { 
          signal: AbortSignal.timeout(1500),
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.peso) {
            console.log("✅ Peso obtido diretamente da API:", data.peso);
            // Atualizar cache
            lastWeightCache = {
              weight: data.peso,
              timestamp: now
            };
            return data.peso;
          }
        }
      } catch (directError) {
        console.log("⚠️ Não foi possível obter peso diretamente, tentando via Supabase...");
      }
      
      // Try to fetch from Supabase
      const { data, error } = await supabase
        .from("pesagem_temp")
        .select("id, peso, criado_em")
        .order("criado_em", { ascending: false })
        .limit(1);

      if (error) {
        console.error("❌ Erro ao buscar peso:", error);
        return null;
      }

      if (data && data.length) {
        const pesagem = data[0];
        const tempo = new Date(pesagem.criado_em).getTime();
        const agora = Date.now();
        const dif = agora - tempo;

        if (dif < 10000) { // Aumentado para 10 segundos para permitir mais tempo para leitura
          const peso = pesagem.peso;
          console.log("✅ Peso válido:", peso);
          
          // Atualizar cache
          lastWeightCache = {
            weight: peso,
            timestamp: now
          };
          
          // Não apaga o registro após uso para permitir pesagens contínuas
          // Mas limpa registros antigos para não acumular no banco
          try {
            // Limpa registros mais antigos que 1 minuto
            const umMinutoAtras = new Date();
            umMinutoAtras.setMinutes(umMinutoAtras.getMinutes() - 1);
            
            await supabase
              .from("pesagem_temp")
              .delete()
              .lt("criado_em", umMinutoAtras.toISOString());
              
            console.log("🧹 Registros antigos limpos do Supabase.");
          } catch (cleanupErr) {
            console.warn("⚠️ Não foi possível limpar registros antigos:", cleanupErr);
          }
          
          return peso;
        } else {
          console.log("⏱️ Peso expirado (mais de 10s).");
          return null;
        }
      } else {
        console.log("⚠️ Nenhum peso registrado.");
        return null;
      }
    } catch (err) {
      console.error("❌ Erro ao acessar a balança:", err);
      
      // If we get a CSP error, return null
      if (err instanceof TypeError && 
          (err.message.includes("Content Security Policy") || 
           err.message.includes("Failed to fetch"))) {
        console.log("⚠️ Erro de CSP detectado. Balança não disponível.");
        return null;
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { fetchWeight, loading };
}