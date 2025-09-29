import { useEffect, useState } from "react";
import { FiThermometer, FiZap, FiWifi, FiClock, FiAlertCircle, FiPower } from "react-icons/fi";
import './App.css'

const tanques = [
  { nome: "Tilápias", sensorIP: "192.168.0.30", controlIP: "192.168.0.32" },
  { nome: "Carpas", sensorIP: "192.168.0.31", controlIP: "192.168.0.33" },
];

function App() {
  const [statuses, setStatuses] = useState({});
  const [logs, setLogs] = useState({});
  const [activeTab, setActiveTab] = useState("status");
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchWithTimeout = async (url, timeout = 10000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return res.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  const updateTankData = async (tanque) => {
    try {
      // Atualiza status com timeout de 10s
      const status = await fetchWithTimeout(`http://${tanque.controlIP}/status`);
      setStatuses(prev => ({ ...prev, [tanque.nome]: status }));
      
      // Aguarda 1 segundo antes de buscar os logs
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Atualiza logs com timeout de 10s
      const logs = await fetchWithTimeout(`http://${tanque.controlIP}/logs`);
      setLogs(prev => ({ ...prev, [tanque.nome]: logs }));
      
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error(`Erro ao atualizar dados do tanque ${tanque.nome}:`, error);
    }
  };

  useEffect(() => {
    // Função para atualizar todos os tanques em sequência
    const updateAllTanks = async () => {
      for (const tanque of tanques) {
        await updateTankData(tanque);
        // Intervalo de 10s entre cada tanque
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    };

    // Executa imediatamente a primeira vez
    updateAllTanks();
    
    // Configura o intervalo para rodar a cada 60 segundos
    const interval = setInterval(updateAllTanks, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const toggleResistencia = async (tanque, ligar) => {
    try {
      await fetchWithTimeout(
        `http://${tanque.controlIP}/control?state=${ligar ? "on" : "off"}`,
        10000
      );
      await updateTankData(tanque);
    } catch (err) {
      console.error("Erro ao controlar resistência", tanque.nome);
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>🐟 Monitoramento de Tanques</h1>
        <div className="update-time">
          Última atualização: {lastUpdate || "Aguardando..."}
        </div>
      </header>

      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab-button ${activeTab === "status" ? "active" : ""}`}
            onClick={() => setActiveTab("status")}
          >
            📊 Status
          </button>
          <button 
            className={`tab-button ${activeTab === "logs" ? "active" : ""}`}
            onClick={() => setActiveTab("logs")}
          >
            📋 Logs
          </button>
        </div>
      </div>

      <div className="tanks-container">
        {tanques.map((t) => {
          const status = statuses[t.nome];
          const tanqueLogs = logs[t.nome] || [];

          return (
            <div key={t.nome} className="tank-card">
              <div className="tank-header">
                <h2 className="tank-name">
                  <span className="fish-icon">🐟</span>
                  {t.nome}
                </h2>
                <div className={`status-indicator ${status ? "online" : "offline"}`}></div>
              </div>

              {activeTab === "status" ? (
                <>
                  <div className="status-grid">
                    <div className="status-item">
                      <div className="status-icon-wrapper">
                        <FiThermometer className="status-icon" />
                      </div>
                      <div className="status-content">
                        <div className="status-label">Temperatura</div>
                        <div className="status-value temperature">
                          {status?.temperatura ?? "--"} °C
                        </div>
                      </div>
                    </div>

                    <div className="status-item">
                      <div className="status-icon-wrapper">
                        <FiZap className="status-icon" />
                      </div>
                      <div className="status-content">
                        <div className="status-label">Resistência</div>
                        <div className={`status-value ${status?.resistencia ? "on" : "off"}`}>
                          {status?.resistencia ? "Ligada" : "Desligada"}
                        </div>
                      </div>
                    </div>

                    <div className="status-item">
                      <div className="status-icon-wrapper">
                        <FiWifi className="status-icon" />
                      </div>
                      <div className="status-content">
                        <div className="status-label">Conexão</div>
                        <div className="status-value connection">
                          {status?.pingsOk ?? 0} OK
                        </div>
                      </div>
                    </div>

                    <div className="status-item">
                      <div className="status-icon-wrapper">
                        <FiClock className="status-icon" />
                      </div>
                      <div className="status-content">
                        <div className="status-label">Última leitura</div>
                        <div className="status-value time">
                          {status ? status.ultimoSensor.toFixed(1) : "--"} s
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="control-section">
                    <div className="control-buttons">
                      <button 
                        className="control-button power-on"
                        onClick={() => toggleResistencia(t, true)}
                      >
                        <FiPower /> Ligar
                      </button>
                      <button 
                        className="control-button power-off"
                        onClick={() => toggleResistencia(t, false)}
                      >
                        <FiPower /> Desligar
                      </button>
                    </div>
                  </div>

                  <div className="alert-section">
                    <div className="current-alert">
                      <FiAlertCircle className="alert-icon" />
                      <span className="alert-message">
                        {status?.log || "Aguardando dados..."}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="logs-section">
                  <h3 className="logs-title">📝 Histórico de Eventos</h3>
                  <div className="logs-list">
                    {tanqueLogs.length > 0 ? (
                      tanqueLogs.map((log, i) => (
                        <div key={i} className="log-entry">
                          <div className="log-time">
                            {new Date().toLocaleTimeString()}
                          </div>
                          <div className="log-message">{log}</div>
                        </div>
                      ))
                    ) : (
                      <div className="empty-logs">
                        <div className="empty-icon">📭</div>
                        <div>Nenhum log disponível</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
