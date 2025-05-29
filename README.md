# Timesheet Analyzer

Aplicativo local feito com Electron e Node.js para leitura de planilhas de ponto (`.xls`) e geração de relatórios personalizados com base em jornadas de trabalho ideais.

## 📦 Funcionalidades

- 📂 Leitura de planilhas Excel com dados de entrada/saída
- ⏱️ Cálculo automático de horas trabalhadas por funcionário
- 📅 Comparação com carga horária ideal diária (ex: 8h30 por dia)
- 🚫 Desconsidera finais de semana e feriados (com cadastro manual)
- 📊 Exportação de relatórios em **PDF** e **CSV**
- 💾 Persistência de configurações entre sessões (mês, ano, feriados)
- 📁 Escolha de diretório na exportação de arquivos
- 📦 Empacotamento como aplicativo `.exe` com Electron Builder

## 🛠️ Tecnologias

- [Electron](https://www.electronjs.org/)
- [Node.js](https://nodejs.org/)
- [XLSX (SheetJS)](https://sheetjs.com/)
- [JavaScript](https://developer.mozilla.org/docs/Web/JavaScript)
- HTML/CSS

## 🚀 Como usar

1. Instale as dependências:

```bash
npm install
```

2. Rode a aplicação localmente:

```bash
npm start
```

3. Após aberto, use a interface para:
   - Selecionar e carregar a planilha de ponto
   - Informar o mês, ano e feriados
   - Gerar o relatório e exportar se desejado

## 📂 Estrutura Esperada da Planilha

> ⚠️ O sistema espera colunas como: `Funcionário`, `Data`, `Hora Entrada`, `Hora Saída` — conforme o modelo usado internamente.

## 📌 Roadmap

- [ ] Interface para edição de feriados e faltas diretamente pela aplicação
- [ ] Análise gráfica dos dados
- [ ] Integração com API externa para feriados nacionais

## 📝 Licença

Este projeto está licenciado sob a licença MIT.
