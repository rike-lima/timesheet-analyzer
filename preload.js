const path = require("path");
const fs = require("fs");
const xlsx = require("xlsx");
const PDFDocument = require("pdfkit");
const { eachDayOfInterval, isSaturday, isSunday } = require("date-fns");
const configPath = path.join(__dirname, "config.json");
const { dialog } = require("electron");
const { contextBridge, ipcRenderer } = require("electron");

const planilhaDestino = path.join(
  __dirname,
  "Relatorio_pessoas_horas_trabalhadas.xls"
);

function copiarPlanilha(origem) {
  try {
    fs.copyFileSync(origem, planilhaDestino);
    return true;
  } catch (e) {
    console.error("Erro ao copiar a planilha:", e);
    return false;
  }
}

contextBridge.exposeInMainWorld("api", {
  carregarPlanilha: (caminho) => copiarPlanilha(caminho),

  listarFuncionarios: () => {
  try {
    const workbook = xlsx.readFile(planilhaDestino);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const allCells = Object.entries(sheet);
    const nomes = new Set();

    const isentosPath = path.join(__dirname, "isentos.json");
    const isentosRaw = fs.readFileSync(isentosPath, "utf-8");
    const isentos = new Set(JSON.parse(isentosRaw).isentos);

    let nomeAtual = null;

    for (let i = 0; i < allCells.length; i++) {
      const [cell, value] = allCells[i];
      if (
        value &&
        typeof value.v === "string" &&
        value.v.toLowerCase().includes("empregado")
      ) {
        const col = cell.replace(/[0-9]/g, "");
        const row = parseInt(cell.replace(/[A-Z]/g, ""));
        const nextCol = String.fromCharCode(col.charCodeAt(0) + 1);
        const nomeCell = `${nextCol}${row}`;
        nomeAtual = sheet[nomeCell] ? sheet[nomeCell].v : null;

        // 👇 Aqui é onde você faz a verificação e adiciona apenas se não for isento
        if (nomeAtual && !isentos.has(nomeAtual)) {
          nomes.add(nomeAtual);
        }
      }
    }

    return Array.from(nomes);
  } catch (e) {
    console.error("Erro ao listar funcionários:", e);
    return [];
  }
},


  lerCargasHorarias: () => {
    const jsonPath = path.join(__dirname, "cargas-horarias.json");
    try {
      return JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    } catch {
      return {};
    }
  },

  salvarCargasHorarias: (dados) => {
    const jsonPath = path.join(__dirname, "cargas-horarias.json");
    try {
      fs.writeFileSync(jsonPath, JSON.stringify(dados, null, 2));
      return true;
    } catch (e) {
      console.error("Erro ao salvar JSON:", e);
      return false;
    }
  },

  gerarRelatorio: (mes, ano, feriados, ajustes = {}) => {
    return new Promise((resolve) => {
      const jsonPath = path.join(__dirname, "cargas-horarias.json");
      let cargasHorarias = {};
      try {
        cargasHorarias = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      } catch (e) {}

      // 🔽 Adiciona aqui a leitura dos isentos
      let isentos = new Set();
      try {
        const isentosPath = path.join(__dirname, "isentos.json");
        const isentosRaw = fs.readFileSync(isentosPath, "utf-8");
        isentos = new Set(JSON.parse(isentosRaw).isentos);
      } catch (e) {
        console.warn("Arquivo isentos.json não encontrado ou inválido");
      }

      const inicio = new Date(ano, mes - 1, 1);
      const fim = new Date(ano, mes, 0);
      const totalDiasUteis = eachDayOfInterval({
        start: inicio,
        end: fim,
      }).filter((d) => !isSaturday(d) && !isSunday(d)).length;

      const diasUteis = totalDiasUteis - feriados;

      const workbook = xlsx.readFile(planilhaDestino);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const allCells = Object.entries(sheet);
      const entries = [];
      let nomeAtual = null;

      function horasParaMinutos(horasStr) {
        const [h, m] = horasStr.split(":").map(Number);
        return h * 60 + m;
      }

      function minutosParaHoras(min) {
        const h = Math.floor(min / 60);
        const m = String(min % 60).padStart(2, "0");
        return `${h}:${m}`;
      }

      for (let i = 0; i < allCells.length; i++) {
        const [cell, value] = allCells[i];

        if (
          value &&
          typeof value.v === "string" &&
          value.v.toLowerCase().includes("empregado")
        ) {
          const col = cell.replace(/[0-9]/g, "");
          const row = parseInt(cell.replace(/[A-Z]/g, ""));
          const nextCol = String.fromCharCode(col.charCodeAt(0) + 1);
          const nomeCell = `${nextCol}${row}`;
          nomeAtual = sheet[nomeCell] ? sheet[nomeCell].v : "Desconhecido";
        }

        if (
          value &&
          typeof value.v === "string" &&
          value.v.toLowerCase().includes("total de horas")
        ) {
          const col = cell.replace(/[0-9]/g, "");
          const row = parseInt(cell.replace(/[A-Z]/g, ""));
          const nextCol = String.fromCharCode(col.charCodeAt(0) + 1);
          const horasCell = `${nextCol}${row}`;
          const totalHoras = sheet[horasCell] ? sheet[horasCell].v : "00:00";

          // 🔽 Pula os isentos
          if (nomeAtual && !isentos.has(nomeAtual)) {
            entries.push({ nome: nomeAtual, total: totalHoras });
          }

          nomeAtual = null;
        }
      }

      const resultado = entries.map((emp) => {
        const ajustesFuncionario = ajustes[emp.nome] || {};
        const carga =
          ajustesFuncionario.carga ?? cargasHorarias[emp.nome] ?? 8.45;
        const faltas = ajustesFuncionario.faltas ?? 0;

        const diasParaCalculo = Math.max(diasUteis - faltas, 0);
        const idealMin = Math.round(diasParaCalculo * carga * 60);
        const realMin = horasParaMinutos(emp.total);
        const diff = realMin - idealMin;

        return {
          nome: emp.nome,
          carga,
          trabalhadas: emp.total,
          ideais: minutosParaHoras(idealMin),
          diferenca: (diff > 0 ? "+" : "-") + minutosParaHoras(Math.abs(diff)),
          status: diff === 0 ? "✅" : diff > 0 ? "🟢" : "🔴",
          faltas,
        };
      });

      resolve(resultado);
    });
  },

  salvarArquivo: async (defaultName, conteudo) => {
    try {
      const filePath = await ipcRenderer.invoke("salvar-dialogo", {
        padrao: defaultName,
        extensao: "csv",
      });

      if (!filePath) return false;

      fs.writeFileSync(filePath, conteudo, "utf-8");
      return true;
    } catch (e) {
      console.error("Erro ao salvar CSV:", e);
      return false;
    }
  },
  gerarPDF: async (dados, mes, ano) => {
    try {
      const filePath = await window.api.escolherLocalSalvar(
        `relatorio-${mes}-${ano}.pdf`,
        "pdf"
      );
      if (!filePath) return false;

      const doc = new PDFDocument();
      doc.pipe(fs.createWriteStream(filePath));

      doc.fontSize(18).text(`Relatório de Horas Trabalhadas - ${mes}/${ano}`, {
        align: "center",
      });
      doc.moveDown();

      doc.fontSize(12);
      dados.forEach((emp) => {
        doc.text(`${emp.nome}`);
        doc.text(`  Carga Diária       : ${emp.carga}h`);
        doc.text(`  Faltas Justificadas: ${emp.faltas ?? 0}`);
        doc.text(`  Trabalhadas        : ${emp.trabalhadas}`);
        doc.text(`  Ideais             : ${emp.ideais}`);
        doc.text(`  Diferença          : ${emp.diferenca} ${emp.status}`);
        doc.moveDown();
      });

      doc.end();
      return true;
    } catch (e) {
      console.error("Erro ao gerar PDF:", e);
      return false;
    }
  },

  lerConfiguracoes: () => {
    const configPath = path.join(__dirname, "config.json");
    try {
      if (!fs.existsSync(configPath)) {
        return { mes: "", ano: "", feriados: "" };
      }
      return JSON.parse(fs.readFileSync(configPath, "utf-8"));
    } catch {
      return { mes: "", ano: "", feriados: "" };
    }
  },

  salvarConfiguracoes: (config) => {
    try {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      return true;
    } catch (e) {
      console.error("Erro ao salvar config:", e);
      return false;
    }
  },

  escolherLocalSalvar: async (padrao, extensao) => {
    return await ipcRenderer.invoke("salvar-dialogo", { padrao, extensao });
  },
});
