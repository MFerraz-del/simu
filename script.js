// Elementos do DOM
const lista = document.getElementById("lista-transacoes");
const saldoSpan = document.getElementById("saldo");

const selectTipo = document.getElementById("tipo");
const selectCategoria = document.getElementById("categoria");
const filtroTipo = document.getElementById("filtroTipo");
const filtroCategoria = document.getElementById("filtroCategoria");
const dataInicio = document.getElementById("dataInicio");
const dataFim = document.getElementById("dataFim");
const btnAplicarFiltro = document.getElementById("aplicarFiltro");
const btnLimparFiltro = document.getElementById("limparFiltro");
const btnDarkMode = document.getElementById("toggleDarkMode");

const inputDataTransacao = document.getElementById("dataTransacao");

const categoriasEntrada = ["Mesada", "Salário", "Outros"];
const categoriasSaida = ["Uber", "Alimentação", "Transporte", "Lazer", "Outros"];

let transacoes = [];
let grafico;
const ctx = document.getElementById('graficoFinancas').getContext('2d');

window.addEventListener("DOMContentLoaded", () => {
  carregarTransacoes();
  atualizarCategorias();
  atualizarFiltroCategorias();
  carregarTema();
  atualizarInterface();
});


// Atualiza categorias do select de categoria conforme tipo escolhido
function atualizarCategorias() {
  const tipoSelecionado = selectTipo.value;
  let categorias = tipoSelecionado === "entrada" ? categoriasEntrada : categoriasSaida;

  selectCategoria.innerHTML = "";
  categorias.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat.toLowerCase();
    option.textContent = cat;
    selectCategoria.appendChild(option);
  });
}

// Atualiza as categorias do filtro (união de entradas e saídas, sem repetição)
function atualizarFiltroCategorias() {
  const todasCategorias = [...new Set([...categoriasEntrada, ...categoriasSaida])];

  filtroCategoria.innerHTML = '<option value="todos">Todas Categorias</option>';
  todasCategorias.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat.toLowerCase();
    option.textContent = cat;
    filtroCategoria.appendChild(option);
  });
}

// Salvar e carregar tema escuro
function carregarTema() {
  const temaSalvo = localStorage.getItem("tema");
  if (temaSalvo === "dark") {
    document.body.classList.add("dark-mode");
  }
}

function alternarTema() {
  document.body.classList.toggle("dark-mode");
  if (document.body.classList.contains("dark-mode")) {
    localStorage.setItem("tema", "dark");
  } else {
    localStorage.setItem("tema", "light");
  }
}

// Filtrar transações conforme filtros
function filtrarTransacoes() {
  let filtradas = [...transacoes];

  const tipoSelecionado = filtroTipo.value;
  if (tipoSelecionado !== "todos") {
    filtradas = filtradas.filter(t => t.tipo === tipoSelecionado);
  }

  const categoriaSelecionada = filtroCategoria.value;
  if (categoriaSelecionada !== "todos") {
    filtradas = filtradas.filter(t => t.categoria === categoriaSelecionada);
  }

  const inicio = dataInicio.value; // yyyy-mm-dd ou ""
  const fim = dataFim.value;       // yyyy-mm-dd ou ""

  if (inicio && fim) {
    filtradas = filtradas.filter(t => t.data >= inicio && t.data <= fim);
  } else if (inicio) {
    filtradas = filtradas.filter(t => t.data >= inicio);
  } else if (fim) {
    filtradas = filtradas.filter(t => t.data <= fim);
  }

  return filtradas;
}

function salvarTransacoes() {
  localStorage.setItem("transacoes", JSON.stringify(transacoes));
}

function carregarTransacoes() {
  const dadosSalvos = localStorage.getItem("transacoes");
  if (dadosSalvos) {
    transacoes = JSON.parse(dadosSalvos);
  }
}

function limparCampos() {
  document.getElementById("descricao").value = "";
  document.getElementById("valor").value = "";
  inputDataTransacao.value = "";
}

function removerTransacao(id) {
  transacoes = transacoes.filter(t => t.id !== id);
  salvarTransacoes();
  atualizarInterface();
}

function atualizarGrafico(transacoesParaMostrar) {
  const totalEntradas = transacoesParaMostrar
    .filter(t => t.tipo === 'entrada')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalSaidas = transacoesParaMostrar
    .filter(t => t.tipo === 'saida')
    .reduce((acc, t) => acc + Math.abs(t.valor), 0);

  const dataGrafico = {
    labels: ['Entradas', 'Saídas'],
    datasets: [{
      data: [totalEntradas, totalSaidas],
      backgroundColor: ['#4caf50', '#c62828'],
      hoverOffset: 10
    }]
  };

  if (grafico) {
    grafico.data = dataGrafico;
    grafico.update();
  } else {
    grafico = new Chart(ctx, {
      type: 'pie',
      data: dataGrafico,
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: ctx => {
                const label = ctx.label || '';
                const value = ctx.parsed || 0;
                return `${label}: R$ ${value.toFixed(2)}`;
              }
            }
          }
        }
      }
    });
  }
}

function atualizarInterface(transacoesParaMostrar = transacoes) {
  lista.innerHTML = "";
  let saldo = 0;

  transacoesParaMostrar.forEach((t) => {
    saldo += t.valor;

    const li = document.createElement("li");
    li.classList.add("transacao", t.tipo);

    const descricao = document.createElement("span");
    descricao.textContent = t.descricao;

    const categoriaSpan = document.createElement("span");
    categoriaSpan.textContent = ` (${t.categoria})`;
    categoriaSpan.style.fontStyle = "italic";
    categoriaSpan.style.marginLeft = "6px";

    descricao.appendChild(categoriaSpan);

    const dataSpan = document.createElement("span");
    dataSpan.textContent = ` [${t.data}]`;
    dataSpan.style.color = "#666";
    dataSpan.style.marginLeft = "6px";

    descricao.appendChild(dataSpan);

    const valor = document.createElement("span");
    valor.textContent = `R$ ${t.valor.toFixed(2)}`;

    const botaoRemover = document.createElement("button");
    botaoRemover.textContent = "x";
    botaoRemover.classList.add("remover");
    botaoRemover.addEventListener("click", () => {
      removerTransacao(t.id);
    });

    li.appendChild(descricao);
    li.appendChild(valor);
    li.appendChild(botaoRemover);

    lista.appendChild(li);
  });

  saldoSpan.textContent = saldo.toFixed(2);
  atualizarGrafico(transacoesParaMostrar);
}

// ----- NOVAS FUNÇÕES PARA EXPORTAÇÃO -----

// Exportar CSV
function exportarCSV() {
  if (transacoes.length === 0) {
    alert("Não há transações para exportar.");
    return;
  }
  const headers = ['Descrição', 'Tipo', 'Categoria', 'Valor', 'Data'];
  const rows = transacoes.map(t => [
    `"${t.descricao.replace(/"/g, '""')}"`, 
    t.tipo, 
    t.categoria, 
    t.valor.toFixed(2), 
    t.data
  ]);

  let csvContent = headers.join(",") + "\n";
  rows.forEach(row => {
    csvContent += row.join(",") + "\n";
  });

  const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transacoes_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Exportar PDF (precisa do jsPDF incluído no HTML)
function exportarPDF() {
  if (transacoes.length === 0) {
    alert("Não há transações para exportar.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Relatório de Transações", 10, 10);

  doc.setFontSize(12);
  let y = 20;
  const linhaAltura = 8;

  doc.text("Descrição", 10, y);
  doc.text("Tipo", 70, y);
  doc.text("Categoria", 110, y);
  doc.text("Valor (R$)", 150, y);
  doc.text("Data", 180, y);

  y += linhaAltura;

  transacoes.forEach(t => {
    if(y > 280){
      doc.addPage();
      y = 20;
    }
    doc.text(t.descricao, 10, y);
    doc.text(t.tipo, 70, y);
    doc.text(t.categoria, 110, y);
    doc.text(t.valor.toFixed(2), 150, y, {align: 'right'});
    doc.text(t.data, 180, y);
    y += linhaAltura;
  });

  doc.save(`transacoes_${new Date().toISOString().slice(0,10)}.pdf`);
}

// Exportar imagem do gráfico
function exportarImagemGrafico() {
  const canvas = document.getElementById('graficoFinancas');
  const urlImagem = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = urlImagem;
  a.download = `grafico_financas_${new Date().toISOString().slice(0,10)}.png`;
  a.click();
}

// Eventos
selectTipo.addEventListener("change", atualizarCategorias);
btnDarkMode.addEventListener("click", alternarTema);

document.getElementById("adicionar").addEventListener("click", () => {
  const descricao = document.getElementById("descricao").value.trim();
  const valor = parseFloat(document.getElementById("valor").value);
  const tipo = selectTipo.value;
  const categoria = selectCategoria.value;
  const data = inputDataTransacao.value;

  if (!descricao || isNaN(valor) || !data) {
    alert("Preencha a descrição, valor válido e a data da transação.");
    return;
  }

  const transacao = {
    id: Date.now(),
    descricao,
    valor: tipo === "saida" ? -valor : valor,
    tipo,
    categoria,
    data
  };

  transacoes.push(transacao);
  salvarTransacoes();
  atualizarInterface();
  limparCampos();
});

btnAplicarFiltro.addEventListener("click", () => {
  const filtradas = filtrarTransacoes();
  atualizarInterface(filtradas);
});

btnLimparFiltro.addEventListener("click", () => {
  filtroTipo.value = "todos";
  filtroCategoria.value = "todos";
  dataInicio.value = "";
  dataFim.value = "";
  atualizarInterface(transacoes);
});

// Eventos para exportação (botões precisam existir no HTML)
document.getElementById("exportCsv").addEventListener("click", exportarCSV);
document.getElementById("exportPdf").addEventListener("click", exportarPDF);
document.getElementById("exportImg").addEventListener("click", exportarImagemGrafico);
