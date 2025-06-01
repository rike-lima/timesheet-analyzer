async function gerar() {
  const arquivoInput = document.getElementById("arquivo");
  const arquivoSelecionado = arquivoInput.files[0];

  if (arquivoSelecionado) {
    const sucesso = await window.api.carregarPlanilha(arquivoSelecionado.path);
    if (!sucesso) {
      alert("Erro ao carregar a planilha.");
      return;
    } else {
      alert("Planilha carregada com sucesso!");
      document.getElementById("btnEditarCargas").disabled = false;
    }
  }

  const mes = parseInt(document.getElementById("mes").value);
  const ano = parseInt(document.getElementById("ano").value);
  const feriados = parseInt(document.getElementById("feriados").value);

  const cargasInputs = document.querySelectorAll(".input-carga");
  const faltasInputs = document.querySelectorAll(".input-falta");
  const ajustes = {};

  cargasInputs.forEach((inputCarga, index) => {
    const nome = inputCarga.dataset.nome;
    const carga = parseFloat(inputCarga.value);
    const faltas = parseInt(faltasInputs[index].value) || 0;
    if (nome && !isNaN(carga)) {
      ajustes[nome] = { carga, faltas };
    }
  });

  const resultado = await window.api.gerarRelatorio(
    mes,
    ano,
    feriados,
    ajustes
  );

  const div = document.getElementById("resultado");
  if (!resultado || resultado.length === 0) {
    div.innerHTML = "<p>Nenhum dado encontrado.</p>";
    return;
  }

  let html = `<table>
    <thead><tr>
      <th>Funcionário</th>
      <th>Carga Diária</th>
      <th>Trabalhadas</th>
      <th>Ideais</th>
      <th>Diferença</th>
      <th>Status</th>
    </tr></thead><tbody>`;

  resultado.forEach((emp) => {
    html += `<tr>
      <td>${emp.nome}</td>
      <td>${emp.carga.toFixed(2)}h</td>
      <td>${emp.trabalhadas}</td>
      <td>${emp.ideais}</td>
      <td>${emp.diferenca}</td>
      <td>${emp.status}</td>
    </tr>`;
  });

  html += "</tbody></table>";
  div.innerHTML = html;

  document.getElementById("acoesExportacao").style.display = "block";
  document.getElementById("btnEditarCargas").disabled = false;

  await window.api.salvarConfiguracoes({ mes, ano, feriados });
}

async function abrirEditorCargas() {
  console.log("🔍 Chamando listarFuncionarios...");
  const nomes = await window.api.listarFuncionarios();
  console.log("✅ Funcionários encontrados:", nomes);

  const cargas = await window.api.lerCargasHorarias();
  const tabela = document.querySelector("#tabelaCargas tbody");
  tabela.innerHTML = "";

  nomes.forEach((nome) => {
    const tr = document.createElement("tr");

    const tdNome = document.createElement("td");
    tdNome.textContent = nome;

    // Campo de carga horária
    const tdCarga = document.createElement("td");
    const inputCarga = document.createElement("input");
    inputCarga.type = "number";
    inputCarga.step = "0.25";
    inputCarga.value = cargas[nome] || "";
    inputCarga.dataset.nome = nome;
    inputCarga.classList.add("input-carga");
    tdCarga.appendChild(inputCarga);

    // Campo de faltas justificadas
    const tdFaltas = document.createElement("td");
    const inputFaltas = document.createElement("input");
    inputFaltas.type = "number";
    inputFaltas.min = "0";
    inputFaltas.step = "1";
    inputFaltas.value = 0;
    inputFaltas.dataset.nome = nome;
    inputFaltas.classList.add("input-falta");
    tdFaltas.appendChild(inputFaltas);

    tr.appendChild(tdNome);
    tr.appendChild(tdCarga);
    tr.appendChild(tdFaltas);
    tabela.appendChild(tr);
  });

  document.getElementById("editorCargas").style.display = "block";
}

async function salvarCargas() {
  const cargasInputs = document.querySelectorAll("#tabelaCargas .input-carga");
  const novasCargas = {};

  cargasInputs.forEach((input) => {
    const nome = input.dataset.nome;
    const carga = parseFloat(input.value);
    if (nome && !isNaN(carga)) {
      novasCargas[nome] = carga;
    }
  });

  const sucesso = await window.api.salvarCargasHorarias(novasCargas);
  if (sucesso) {
    alert("Cargas salvas com sucesso!");
    document.getElementById("editorCargas").style.display = "none";
    await gerar();
  } else {
    alert("Erro ao salvar.");
  }
}

async function exportarCSV() {
  const mes = parseInt(document.getElementById("mes").value);
  const ano = parseInt(document.getElementById("ano").value);
  const feriados = parseInt(document.getElementById("feriados").value);

  const cargasInputs = document.querySelectorAll(".input-carga");
  const faltasInputs = document.querySelectorAll(".input-falta");
  const ajustes = {};

  cargasInputs.forEach((inputCarga, index) => {
    const nome = inputCarga.dataset.nome;
    const carga = parseFloat(inputCarga.value);
    const faltas = parseInt(faltasInputs[index].value) || 0;
    if (nome && !isNaN(carga)) {
      ajustes[nome] = { carga, faltas };
    }
  });

  const dados = await window.api.gerarRelatorio(mes, ano, feriados, ajustes);

  const linhas = [
    "Nome,Carga Diária,Faltas Justificadas,Trabalhadas,Ideais,Diferença,Status",
  ];
  dados.forEach((emp) => {
    const faltas = ajustes[emp.nome]?.faltas ?? 0;
    linhas.push(
      [
        emp.nome,
        emp.carga,
        faltas,
        emp.trabalhadas,
        emp.ideais,
        emp.diferenca,
        emp.status,
      ].join(",")
    );
  });

  const conteudo = linhas.join("\n");
  const sucesso = await window.api.salvarArquivo("relatorio.csv", conteudo);
  if (sucesso) {
    alert("Relatório CSV exportado com sucesso.");
  } else {
    alert("Exportação cancelada ou falhou.");
  }
}

async function exportarPDF() {
  const mes = parseInt(document.getElementById("mes").value);
  const ano = parseInt(document.getElementById("ano").value);
  const feriados = parseInt(document.getElementById("feriados").value);

  const cargasInputs = document.querySelectorAll(".input-carga");
  const faltasInputs = document.querySelectorAll(".input-falta");
  const ajustes = {};

  cargasInputs.forEach((inputCarga, index) => {
    const nome = inputCarga.dataset.nome;
    const carga = parseFloat(inputCarga.value);
    const faltas = parseInt(faltasInputs[index].value) || 0;
    if (nome && !isNaN(carga)) {
      ajustes[nome] = { carga, faltas };
    }
  });

  const dados = await window.api.gerarRelatorio(mes, ano, feriados, ajustes);
  const sucesso = await window.api.gerarPDF(
    dados.map((emp) => ({
      ...emp,
      faltas: ajustes[emp.nome]?.faltas ?? 0,
    })),
    mes,
    ano
  );

  if (sucesso) {
    alert("Relatório PDF exportado com sucesso.");
  } else {
    alert("Exportação cancelada ou falhou.");
  }
}

function calcularDiasUteisDoMes(mes, ano) {
  const inicio = new Date(ano, mes - 1, 1);
  const fim = new Date(ano, mes, 0);

  const diasUteis = Array.from({ length: fim.getDate() }, (_, i) => {
    const data = new Date(ano, mes - 1, i + 1);
    const dia = data.getDay();
    return dia !== 0 && dia !== 6; // 0 = domingo, 6 = sábado
  }).filter(Boolean).length;

  return diasUteis;
}

window.onload = async () => {
  function atualizarInfoDiasUteis() {
    const mes = parseInt(document.getElementById("mes").value);
    const ano = parseInt(document.getElementById("ano").value);

    if (!isNaN(mes) && !isNaN(ano)) {
      const dias = calcularDiasUteisDoMes(mes, ano);
      document.getElementById("diasUteisTotal").textContent = dias;
    }
  }

  document
    .getElementById("mes")
    .addEventListener("change", atualizarInfoDiasUteis);
  document
    .getElementById("ano")
    .addEventListener("change", atualizarInfoDiasUteis);

  const config = await window.api.lerConfiguracoes();
  if (config) {
    document.getElementById("mes").value = config.mes || "";
    document.getElementById("ano").value = config.ano || "";
    document.getElementById("feriados").value = config.feriados || "";
  }

  atualizarInfoDiasUteis();

  document.getElementById("btnEditarCargas").disabled = true;
  document.getElementById("acoesExportacao").style.display = "none";
};
