/* =========================================================
   SISTEMA DE PROCEDIMENTOS

   Este arquivo controla:
   1. A tela inicial com todas as anotações salvas.
   2. A navegação entre início e formulários.
   3. A montagem da anotação pelo botão FINALIZAR.
   4. O salvamento no navegador pelo botão SALVAR.
   5. A cópia de uma anotação ou de todas.
   6. A exportação do histórico para um arquivo .txt.

   Para adicionar um procedimento, copie um formulário no i.html.
   A lógica de preenchimento e salvamento é reutilizada.
========================================================= */

const CHAVE_ANOTACOES = "anotacoesSistemaProcedimentos";

// Elementos da tela de formulário.
const textoAnotacao = document.getElementById("textoAnotacao");
const botaoSalvar = document.getElementById("salvarAnotacao");
const botaoCopiar = document.getElementById("copiarAnotacao");
const statusAnotacao = document.getElementById("annotationStatus");
const indicadorPrevia = document.getElementById("previewIndicator");
const listaAnotacoes = document.getElementById("listaAnotacoes");
const contadorAnotacoes = document.getElementById("savedCount");
const breadcrumb = document.getElementById("breadcrumb");
const telaVazia = document.getElementById("emptyScreen");

// Elementos da tela inicial.
const homeScreen = document.getElementById("homeScreen");
const procedureWorkspace = document.getElementById("procedureWorkspace");
const botaoInicio = document.getElementById("botaoInicio");
const homeAnnotations = document.getElementById("homeAnnotations");
const homeCount = document.getElementById("homeCount");
const botaoCopiarTodas = document.getElementById("copiarTodasAnotacoes");
const botaoBaixarAnotacoes = document.getElementById("baixarAnotacoes");
const sidebar = document.getElementById("sidebar");
const mobileMenuToggle = document.getElementById("mobileMenuToggle");

// Abre e fecha o menu de categorias em telas menores.
mobileMenuToggle.addEventListener("click", () => {
    const menuAberto = sidebar.classList.toggle("mobile-open");

    mobileMenuToggle.setAttribute("aria-expanded", String(menuAberto));
    mobileMenuToggle.textContent = menuAberto ? "✕ Fechar categorias" : "☰ Categorias";
});

function fecharMenuMobile() {
    sidebar.classList.remove("mobile-open");
    mobileMenuToggle.setAttribute("aria-expanded", "false");
    mobileMenuToggle.textContent = "☰ Categorias";
}

let formularioAtual = null;
let anotacaoFinalizada = false;
let anotacaoJaSalva = false;
let textoFinalAtual = "";


/* =========================================================
   DATA E HORA
========================================================= */

function preencherDataAtual(formulario) {
    const campoData = formulario.querySelector("[data-date-field]");

    if (!campoData || campoData.value) {
        return;
    }

    const agora = new Date();
    const diferencaFuso = agora.getTimezoneOffset() * 60000;
    const dataLocal = new Date(agora.getTime() - diferencaFuso);

    campoData.value = dataLocal.toISOString().slice(0, 16);
}

function formatarData(dataHora) {
    if (!dataHora) {
        return "";
    }

    const partes = dataHora.split("T");
    const data = partes[0].split("-");
    const hora = partes[1] || "00:00";

    return `${data[2]}/${data[1]}/${data[0]} ${hora}`;
}


/* =========================================================
   NAVEGAÇÃO LATERAL
========================================================= */

document.querySelectorAll("[data-toggle]").forEach(botao => {
    botao.addEventListener("click", () => {
        const area = document.getElementById(botao.dataset.toggle);

        if (!area) return;

        area.classList.toggle("open");

        const estaAberta = area.classList.contains("open");
        botao.setAttribute("aria-expanded", String(estaAberta));

        const seta = botao.querySelector(".tree-arrow");
        if (seta) seta.textContent = estaAberta ? "▼" : "▶";
    });
});

function marcarMenuAtivo(botaoAtivo) {
    document.querySelectorAll(".tree-procedure, .home-nav-button").forEach(botao => {
        botao.classList.remove("active");
    });

    if (botaoAtivo) {
        botaoAtivo.classList.add("active");
    }
}

function abrirInicio() {
    fecharMenuMobile();
    formularioAtual = null;

    document.querySelectorAll(".procedure-screen").forEach(formulario => {
        formulario.classList.remove("active");
    });

    procedureWorkspace.hidden = true;
    homeScreen.hidden = false;

    marcarMenuAtivo(botaoInicio);
    carregarAnotacoesInicio();
}

botaoInicio.addEventListener("click", abrirInicio);


/* =========================================================
   ABRIR FORMULÁRIOS
========================================================= */

function abrirProcedimento(idFormulario, botaoMenu) {
    fecharMenuMobile();
    document.querySelectorAll(".procedure-screen").forEach(formulario => {
        formulario.classList.remove("active");
    });

    formularioAtual = document.getElementById(`form-${idFormulario}`);

    homeScreen.hidden = true;
    procedureWorkspace.hidden = false;

    marcarMenuAtivo(botaoMenu);

    if (!formularioAtual) {
        telaVazia.hidden = false;
        limparPrevia();
        breadcrumb.textContent = "Início › Procedimento não configurado";
        return;
    }

    telaVazia.hidden = true;
    formularioAtual.classList.add("active");

    preencherDataAtual(formularioAtual);
    atualizarBreadcrumb(formularioAtual.dataset.breadcrumb);
    limparPrevia();
}

function atualizarBreadcrumb(caminho) {
    const partes = caminho.split("›").map(parte => parte.trim());
    const ultimoItem = partes.pop();

    breadcrumb.replaceChildren();

    const inicio = document.createElement("span");
    inicio.textContent = "Início";
    breadcrumb.appendChild(inicio);

    partes.forEach(parte => {
        const separador = document.createElement("span");
        separador.textContent = "›";

        const item = document.createElement("span");
        item.textContent = parte;

        breadcrumb.append(separador, item);
    });

    const separadorFinal = document.createElement("span");
    separadorFinal.textContent = "›";

    const atual = document.createElement("strong");
    atual.textContent = ultimoItem;

    breadcrumb.append(separadorFinal, atual);
}

document.querySelectorAll("[data-procedure]").forEach(botao => {
    botao.addEventListener("click", () => {
        abrirProcedimento(botao.dataset.procedure, botao);
    });
});

// Itens de menu ainda sem formulário exibem uma mensagem de orientação.
document.querySelectorAll("[data-coming-soon]").forEach(botao => {
    botao.addEventListener("click", () => {
        fecharMenuMobile();

        if (botao.classList.contains("tree-procedure")) {
            marcarMenuAtivo(botao);
        }

        document.querySelectorAll(".procedure-screen").forEach(formulario => {
            formulario.classList.remove("active");
        });

        formularioAtual = null;
        homeScreen.hidden = true;
        procedureWorkspace.hidden = false;
        telaVazia.hidden = false;
        limparPrevia();
        breadcrumb.textContent = "Início › Em construção";
    });
});


/* =========================================================
   PESQUISA DO MENU DE PROCEDIMENTOS
========================================================= */

const pesquisa = document.getElementById("pesquisaProcedimento");

pesquisa.addEventListener("input", () => {
    const termo = pesquisa.value.trim().toLocaleLowerCase("pt-BR");

    document.querySelectorAll("[data-search-item]").forEach(item => {
        const nome = item.textContent.toLocaleLowerCase("pt-BR");
        item.classList.toggle("search-hidden", !nome.includes(termo));
    });

    if (termo) {
        document.querySelectorAll(".children").forEach(area => {
            area.classList.add("open");
        });
    }
});


/* =========================================================
   MONTAGEM DA ANOTAÇÃO
========================================================= */

function lerLinhaAnotacao(linha) {
    let texto = "";

    linha.childNodes.forEach(no => {
        if (no.nodeType === Node.TEXT_NODE) {
            texto += no.textContent;
            return;
        }

        if (no.nodeType === Node.ELEMENT_NODE) {
            if (no.matches("select, input")) {
                texto += no.value;
            } else {
                texto += no.textContent;
            }
        }
    });

    return texto.replace(/\s+/g, " ").trim();
}

function montarAnotacao(formulario) {
    const campoData = formulario.querySelector("[data-date-field]");
    const dataFormatada = formatarData(campoData.value);

    const linhas = Array.from(formulario.querySelectorAll(".annotation-line"));
    const textoLinhas = linhas
        .map(lerLinhaAnotacao)
        .filter(linha => linha.length > 0);

    return `** ${dataFormatada} ${textoLinhas.join(" ")} **`;
}

document.querySelectorAll("[data-finalize]").forEach(botao => {
    botao.addEventListener("click", () => {
        const formulario = botao.closest(".procedure-screen");

        if (!formulario.reportValidity()) {
            mostrarStatus("Preencha todos os campos antes de finalizar.", "error");
            return;
        }

        formularioAtual = formulario;
        textoFinalAtual = montarAnotacao(formulario);
        textoAnotacao.value = textoFinalAtual;

        anotacaoFinalizada = true;
        anotacaoJaSalva = false;

        botaoSalvar.disabled = false;
        botaoCopiar.disabled = false;

        indicadorPrevia.textContent = "Finalizada";
        indicadorPrevia.classList.add("ready");

        mostrarStatus("Anotação preparada. Confira o texto e clique em SALVAR para registrar.", "success");
    });
});


/* =========================================================
   ALTERAÇÃO DOS CAMPOS E LIMPEZA
========================================================= */

document.querySelectorAll(".procedure-screen input, .procedure-screen select").forEach(campo => {
    campo.addEventListener("input", invalidarPrevia);
    campo.addEventListener("change", invalidarPrevia);
});

function invalidarPrevia() {
    if (!formularioAtual || !anotacaoFinalizada) return;

    anotacaoFinalizada = false;
    anotacaoJaSalva = false;

    botaoSalvar.disabled = true;
    botaoCopiar.disabled = true;

    indicadorPrevia.textContent = "Desatualizada";
    indicadorPrevia.classList.remove("ready");

    mostrarStatus("Os campos foram alterados. Clique em FINALIZAR para atualizar a anotação.", "error");
}

document.querySelectorAll(".procedure-screen").forEach(formulario => {
    formulario.addEventListener("reset", () => {
        window.setTimeout(() => {
            preencherDataAtual(formulario);

            if (formulario === formularioAtual) {
                limparPrevia();
                mostrarStatus("Campos limpos. Preencha novamente e clique em FINALIZAR.", "");
            }
        }, 0);
    });
});

function limparPrevia() {
    textoAnotacao.value = "";
    textoFinalAtual = "";
    anotacaoFinalizada = false;
    anotacaoJaSalva = false;

    botaoSalvar.disabled = true;
    botaoCopiar.disabled = true;

    indicadorPrevia.textContent = "Aguardando";
    indicadorPrevia.classList.remove("ready");

    mostrarStatus("Preencha os campos e clique em FINALIZAR.", "");
}

function mostrarStatus(mensagem, tipo) {
    statusAnotacao.textContent = mensagem;
    statusAnotacao.className = "annotation-status";

    if (tipo) statusAnotacao.classList.add(tipo);
}


/* =========================================================
   COPIAR TEXTO
========================================================= */

async function copiarTexto(texto) {
    // A Clipboard API pode exigir localhost ou HTTPS.
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(texto);
        return true;
    }

    // Alternativa para abrir o projeto diretamente como arquivo local.
    const campoTemporario = document.createElement("textarea");
    campoTemporario.value = texto;
    campoTemporario.style.position = "fixed";
    campoTemporario.style.opacity = "0";
    document.body.appendChild(campoTemporario);
    campoTemporario.select();

    const copiou = document.execCommand("copy");
    campoTemporario.remove();
    return copiou;
}

botaoCopiar.addEventListener("click", async () => {
    if (!textoFinalAtual || botaoCopiar.disabled) return;

    try {
        const copiou = await copiarTexto(textoFinalAtual);
        mostrarStatus(
            copiou ? "Anotação copiada para a área de transferência." : "Não foi possível copiar automaticamente.",
            copiou ? "success" : "error"
        );
    } catch (erro) {
        console.error("Erro ao copiar anotação:", erro);
        mostrarStatus("Não foi possível copiar a anotação.", "error");
    }
});


/* =========================================================
   ARMAZENAMENTO DAS ANOTAÇÕES
========================================================= */

function obterAnotacoesSalvas() {
    try {
        const dados = localStorage.getItem(CHAVE_ANOTACOES);
        const anotacoes = dados ? JSON.parse(dados) : [];
        return Array.isArray(anotacoes) ? anotacoes : [];
    } catch (erro) {
        console.error("Não foi possível ler as anotações salvas:", erro);
        return [];
    }
}

function salvarListaDeAnotacoes(anotacoes) {
    try {
        localStorage.setItem(CHAVE_ANOTACOES, JSON.stringify(anotacoes));
        return true;
    } catch (erro) {
        console.error("Não foi possível salvar as anotações:", erro);
        mostrarStatus("Não foi possível salvar. Verifique o armazenamento do navegador.", "error");
        return false;
    }
}

botaoSalvar.addEventListener("click", () => {
    if (!anotacaoFinalizada || anotacaoJaSalva || !formularioAtual) return;

    const anotacoes = obterAnotacoesSalvas();
    const caminho = (formularioAtual.dataset.breadcrumb || "").split("›");
    const categoria = formularioAtual.dataset.category || caminho[0]?.trim() || "Categoria não informada";

    const novoRegistro = {
        id: Date.now(),
        categoria: categoria,
        procedimento: formularioAtual.dataset.formName,
        texto: textoFinalAtual,
        dataSalvamento: new Date().toLocaleString("pt-BR")
    };

    anotacoes.unshift(novoRegistro);

    if (!salvarListaDeAnotacoes(anotacoes)) return;

    anotacaoJaSalva = true;
    botaoSalvar.disabled = true;

    mostrarStatus("Anotação salva neste navegador.", "success");
    carregarHistorico();
    carregarAnotacoesInicio();
});


/* =========================================================
   HISTÓRICO RESUMIDO NO PAINEL LATERAL DO FORMULÁRIO
========================================================= */

function carregarHistorico() {
    const anotacoes = obterAnotacoesSalvas();

    listaAnotacoes.replaceChildren();
    contadorAnotacoes.textContent = String(anotacoes.length);

    if (anotacoes.length === 0) {
        const mensagem = document.createElement("p");
        mensagem.className = "empty-history";
        mensagem.textContent = "Nenhuma anotação salva neste navegador.";
        listaAnotacoes.appendChild(mensagem);
        return;
    }

    anotacoes.slice(0, 5).forEach(registro => {
        const item = document.createElement("div");
        item.className = "saved-item";

        const titulo = document.createElement("strong");
        titulo.textContent = `${registro.procedimento || "Procedimento"} • ${registro.dataSalvamento || "Data não informada"}`;

        const texto = document.createElement("p");
        texto.textContent = registro.texto || "";

        const botaoVisualizar = document.createElement("button");
        botaoVisualizar.type = "button";
        botaoVisualizar.textContent = "Visualizar anotação";
        botaoVisualizar.addEventListener("click", () => {
            textoAnotacao.value = registro.texto || "";
            textoFinalAtual = registro.texto || "";
            anotacaoFinalizada = false;
            anotacaoJaSalva = true;

            botaoSalvar.disabled = true;
            botaoCopiar.disabled = !textoFinalAtual;

            indicadorPrevia.textContent = "Registro salvo";
            indicadorPrevia.classList.add("ready");

            mostrarStatus("Exibindo uma anotação já salva. Este registro não será alterado.", "success");
        });

        item.append(titulo, texto, botaoVisualizar);
        listaAnotacoes.appendChild(item);
    });
}


/* =========================================================
   TELA INICIAL: TODOS OS REGISTROS, SEM FILTRO DE CATEGORIA
========================================================= */

function criarTextoElemento(tag, classe, texto) {
    const elemento = document.createElement(tag);
    if (classe) elemento.className = classe;
    elemento.textContent = texto;
    return elemento;
}

function carregarAnotacoesInicio() {
    const anotacoes = obterAnotacoesSalvas();

    homeAnnotations.replaceChildren();
    homeCount.textContent = String(anotacoes.length);

    botaoCopiarTodas.disabled = anotacoes.length === 0;
    botaoBaixarAnotacoes.disabled = anotacoes.length === 0;

    if (anotacoes.length === 0) {
        const mensagem = document.createElement("p");
        mensagem.className = "empty-home";
        mensagem.textContent = "Nenhuma anotação salva neste navegador. Depois de preencher um procedimento e clicar em SALVAR, o registro aparecerá aqui.";
        homeAnnotations.appendChild(mensagem);
        return;
    }

    anotacoes.forEach(registro => {
        const cartao = document.createElement("article");
        cartao.className = "home-note";

        const cabecalho = document.createElement("div");
        cabecalho.className = "home-note-header";

        const identificacao = document.createElement("div");
        identificacao.appendChild(criarTextoElemento("h3", "home-note-title", registro.procedimento || "Procedimento"));

        const metadados = document.createElement("div");
        metadados.className = "home-note-meta";
        metadados.appendChild(criarTextoElemento("span", "home-note-category", registro.categoria || "Categoria não informada"));
        metadados.appendChild(criarTextoElemento("span", "", `Salvo em: ${registro.dataSalvamento || "Data não informada"}`));

        identificacao.appendChild(metadados);
        cabecalho.appendChild(identificacao);

        const texto = criarTextoElemento("p", "home-note-text", registro.texto || "");

        const acoes = document.createElement("div");
        acoes.className = "home-note-actions";

        const botaoCopiarRegistro = document.createElement("button");
        botaoCopiarRegistro.type = "button";
        botaoCopiarRegistro.textContent = "📋 Copiar esta anotação";
        botaoCopiarRegistro.addEventListener("click", async () => {
            try {
                const copiou = await copiarTexto(registro.texto || "");
                botaoCopiarRegistro.textContent = copiou ? "✓ Copiada" : "Não foi possível copiar";
            } catch (erro) {
                console.error("Erro ao copiar anotação:", erro);
                botaoCopiarRegistro.textContent = "Erro ao copiar";
            }
        });

        acoes.appendChild(botaoCopiarRegistro);
        cartao.append(cabecalho, texto, acoes);
        homeAnnotations.appendChild(cartao);
    });
}


/* =========================================================
   COPIAR TODAS AS ANOTAÇÕES
========================================================= */

function montarTextoDoHistorico(anotacoes) {
    return anotacoes.map((registro, indice) => {
        const categoria = registro.categoria || "Categoria não informada";
        const procedimento = registro.procedimento || "Procedimento";
        const data = registro.dataSalvamento || "Data não informada";

        return [
            `${indice + 1}. ${procedimento}`,
            `Categoria: ${categoria}`,
            `Salvo em: ${data}`,
            "",
            registro.texto || "",
            "",
            "------------------------------------------------------------"
        ].join("\n");
    }).join("\n\n");
}

botaoCopiarTodas.addEventListener("click", async () => {
    const anotacoes = obterAnotacoesSalvas();
    if (anotacoes.length === 0) return;

    try {
        const copiou = await copiarTexto(montarTextoDoHistorico(anotacoes));
        botaoCopiarTodas.textContent = copiou ? "✓ COPIADAS" : "ERRO AO COPIAR";
        window.setTimeout(() => {
            botaoCopiarTodas.textContent = "📋 COPIAR TODAS";
        }, 1800);
    } catch (erro) {
        console.error("Erro ao copiar histórico:", erro);
        botaoCopiarTodas.textContent = "ERRO AO COPIAR";
    }
});


/* =========================================================
   EXPORTAR HISTÓRICO PARA ARQUIVO .TXT
========================================================= */

botaoBaixarAnotacoes.addEventListener("click", () => {
    const anotacoes = obterAnotacoesSalvas();
    if (anotacoes.length === 0) return;

    const conteudo = "HISTÓRICO DE ANOTAÇÕES\n\n" + montarTextoDoHistorico(anotacoes);
    const arquivo = new Blob(["\uFEFF", conteudo], { type: "text/plain;charset=utf-8" });
    const endereco = URL.createObjectURL(arquivo);

    const link = document.createElement("a");
    const hoje = new Date().toISOString().slice(0, 10);
    link.href = endereco;
    link.download = `anotacoes-procedimentos-${hoje}.txt`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(endereco);
});


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

carregarHistorico();
carregarAnotacoesInicio();
abrirInicio();
