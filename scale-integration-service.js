const axios = require("axios");
const express = require("express");
const cors = require("cors");
const SerialPort = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// Configuration
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co/rest/v1/pesagem_temp";
const SUPABASE_KEY = "YOUR_SUPABASE_KEY";
const PORT = 4000;
const SCALE_PORT = "COM1"; // Change to your scale's port
const SCALE_BAUD_RATE = 4800; // Common for Toledo scales

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Setup serial port for scale
let port;
let lastWeight = 0;

try {
  port = new SerialPort({ path: SCALE_PORT, baudRate: SCALE_BAUD_RATE });
  const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
  
  parser.on('data', (data) => {
    try {
      // Parse weight data from scale (format depends on your scale model)
      // This example assumes Toledo Prix 3 Fit format
      const match = data.match(/([ST|US]),([GS|NT]),([+-])(\d+\.?\d*)(kg|g)/i);
      
      if (match) {
        const [, status, type, sign, value, unit] = match;
        const weight = parseFloat(value) * (sign === '-' ? -1 : 1);
        const isStable = status.toUpperCase() === 'ST';
        
        if (isStable && weight > 0) {
          lastWeight = weight;
          console.log(`✅ Peso estável: ${weight}${unit}`);
          
          // Send to Supabase
          sendWeightToSupabase(weight);
        }
      }
    } catch (err) {
      console.error("❌ Erro ao processar dados da balança:", err);
    }
  });
  
  console.log(`✅ Conectado à balança na porta ${SCALE_PORT}`);
} catch (err) {
  console.error(`❌ Erro ao conectar à balança: ${err.message}`);
  console.log("⚠️ Continuando sem conexão com a balança");
}

// Function to send weight to Supabase
async function sendWeightToSupabase(weight) {
  try {
    await axios.post(SUPABASE_URL, {
      peso: weight,
      criado_em: new Date().toISOString()
    }, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      }
    });
    console.log("✅ Peso enviado para Supabase:", weight);
  } catch (err) {
    console.error("❌ Erro ao enviar peso para Supabase:", err.message);
  }
}

// API endpoint to get current weight
app.get("/peso", (req, res) => {
  if (lastWeight > 0) {
    res.json({ peso: lastWeight });
  } else {
    res.status(404).json({ error: "Nenhum peso disponível" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Endpoint de peso disponível em http://localhost:${PORT}/peso`);
});