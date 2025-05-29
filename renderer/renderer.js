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

  const resultado = await window.api.gerarRelatorio(mes, ano, feriados);

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

    const tdCarga = document.createElement("td");
    const input = document.createElement("input");
    input.type = "number";
    input.step = "0.25";
    input.value = cargas[nome] || "";
    input.dataset.nome = nome;

    tdCarga.appendChild(input);
    tr.appendChild(tdNome);
    tr.appendChild(tdCarga);
    tabela.appendChild(tr);
  });

  document.getElementById("editorCargas").style.display = "block";
}

async function salvarCargas() {
  const inputs = document.querySelectorAll("#tabelaCargas tbody input");
  const novasCargas = {};

  inputs.forEach((input) => {
    const nome =
      input.dataset.nome || document.getElementById("novoNome").value;
    const carga = parseFloat(input.value);
    if (nome && !isNaN(carga)) {
      novasCargas[nome] = carga;
    }
  });

  const sucesso = await window.api.salvarCargasHorarias(novasCargas);
  if (sucesso) {
    alert("Cargas salvas com sucesso!");
  } else {
    alert("Erro ao salvar.");
  }

  document.getElementById("editorCargas").style.display = "none";
}

async function exportarCSV() {
  const mes = parseInt(document.getElementById("mes").value);
  const ano = parseInt(document.getElementById("ano").value);
  const feriados = parseInt(document.getElementById("feriados").value);
  const dados = await window.api.gerarRelatorio(mes, ano, feriados);

  const linhas = ["Nome,Carga Diária,Trabalhadas,Ideais,Diferença,Status"];
  dados.forEach((emp) => {
    linhas.push(
      [
        emp.nome,
        emp.carga,
        emp.trabalhadas,
        emp.ideais,
        emp.diferenca,
        emp.status,
      ].join(",")
    );
  });

  const conteudo = linhas.join("\n");
  await window.api.salvarArquivo("relatorio.csv", conteudo);
  alert("Relatório CSV exportado com sucesso.");

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
  const dados = await window.api.gerarRelatorio(mes, ano, feriados);

  await window.api.gerarPDF(dados, mes, ano);
  alert("Relatório PDF exportado com sucesso.");

  const sucesso = await window.api.gerarPDF(dados, mes, ano);
  if (sucesso) {
    alert("Relatório PDF exportado com sucesso.");
  } else {
    alert("Exportação cancelada ou falhou.");
  }
}

window.onload = async () => {
  const config = await window.api.lerConfiguracoes();
  if (config) {
    document.getElementById("mes").value = config.mes || "";
    document.getElementById("ano").value = config.ano || "";
    document.getElementById("feriados").value = config.feriados || "";
  }

  // Inicialmente: desativa ações até o upload da planilha
  document.getElementById("btnEditarCargas").disabled = true;
  document.getElementById("acoesExportacao").style.display = "none";
};
