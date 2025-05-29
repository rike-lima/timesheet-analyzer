const xlsx = require('xlsx');
const { eachDayOfInterval, isSaturday, isSunday } = require('date-fns');
const readline = require('readline');

// Funções utilitárias
function horasParaMinutos(horasStr) {
  const [h, m] = horasStr.split(':').map(Number);
  return h * 60 + m;
}

function minutosParaHoras(min) {
  const h = Math.floor(min / 60);
  const m = String(min % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function calcularDiasUteis(mes, ano) {
  const inicio = new Date(ano, mes - 1, 1);
  const fim = new Date(ano, mes, 0);
  const dias = eachDayOfInterval({ start: inicio, end: fim });

  return dias.filter(dia => !isSaturday(dia) && !isSunday(dia)).length;
}

// Interface para receber mês, ano e feriados
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('📅 Informe o mês (1-12): ', (mesStr) => {
  const mes = parseInt(mesStr);

  rl.question('📅 Informe o ano (ex: 2024): ', (anoStr) => {
    const ano = parseInt(anoStr);
    const diasUteis = calcularDiasUteis(mes, ano);

    rl.question(`🗓️ ${diasUteis} dias úteis encontrados. Quantos foram feriados? `, (feriadoStr) => {
      const feriados = parseInt(feriadoStr);
      const diasUteisReal = diasUteis - feriados;
      


function obterCargaFuncionario(nome) {
  return cargasHorarias[nome] || 8.45; 
}

      // Local onde efetuo a leitura da planilha
      const workbook = xlsx.readFile('Relatorio_pessoas_horas_trabalhadas.xls');
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const entries = [];
      let nomeAtual = null;

      const allCells = Object.entries(sheet);
      for (let i = 0; i < allCells.length; i++) {
        const [cell, value] = allCells[i];

        if (value && typeof value.v === 'string' && value.v.toLowerCase().includes('empregado')) {
          const col = cell.replace(/[0-9]/g, '');
          const row = parseInt(cell.replace(/[A-Z]/g, ''));
          const nextCol = String.fromCharCode(col.charCodeAt(0) + 1);
          const nomeCell = `${nextCol}${row}`;
          nomeAtual = sheet[nomeCell] ? sheet[nomeCell].v : 'Desconhecido';
        }

        if (value && typeof value.v === 'string' && value.v.toLowerCase().includes('total de horas')) {
          const col = cell.replace(/[0-9]/g, '');
          const row = parseInt(cell.replace(/[A-Z]/g, ''));
          const nextCol = String.fromCharCode(col.charCodeAt(0) + 1);
          const horasCell = `${nextCol}${row}`;
          const totalHoras = sheet[horasCell] ? sheet[horasCell].v : '00:00';

          if (nomeAtual) {
            entries.push({ nome: nomeAtual, total: totalHoras });
            nomeAtual = null;
          }
        }
      }

      // Comparação de horas ideais e as que foram trabalhadas
      const comparativo = entries.map((item) => {
        const trabalhadoMin = horasParaMinutos(item.total);
        const diferencaMin = trabalhadoMin - cargaIdealMin;
        const status = diferencaMin === 0 ? '✅' : (diferencaMin > 0 ? '🟢' : '🔴');

        return {
          nome: item.nome,
          totalTrabalhado: item.total,
          ideal: minutosParaHoras(cargaIdealMin),
          diferenca: (diferencaMin > 0 ? '+' : '') + minutosParaHoras(Math.abs(diferencaMin)),
          status
        };
      });

      console.log("\n📊 Comparativo de Horas Trabalhadas vs Ideais\n----------------------------------------------");
      console.log(`🗓️  Mês: ${mes.toString().padStart(2, '0')}/${ano} | Dias úteis: ${diasUteisReal} | Carga Ideal: ${minutosParaHoras(cargaIdealMin)}\n`);

      comparativo.forEach((c, i) => {
        console.log(`${(i + 1).toString().padStart(2, '0')}. ${c.nome}`);
        console.log(`   Trabalhadas: ${c.totalTrabalhado}`);
        console.log(`   Ideais     : ${c.ideal}`);
        console.log(`   Diferença  : ${c.diferenca} ${c.status}\n`);
      });

      rl.close();
    });
  });
});
