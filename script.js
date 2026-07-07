// Variáveis globais







let map;







let currentBasemap = 'osm';







let layers = { soloClasses: {}, geomorf: {}, geologia: {}, xrf: {} };







let isFullscreen = false;















// Configuração dos mapas de fundo (apenas 3)







const basemaps = {







    osm: {







        name: 'OpenStreetMap',







        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',







        attribution: '© OpenStreetMap contributors',







        maxZoom: 19







    },







    satellite: {







        name: 'Satélite',







        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',







        attribution: '© Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',







        maxZoom: 19







    },







    topo: {







        name: 'Topográfico',







        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',







        attribution: '© Esri — Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012',







        maxZoom: 19







    },







    newpaper: {







        name: 'NewPaper Maps',







        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',







        attribution: '© CartoDB, © OpenStreetMap contributors',







        maxZoom: 19







    },







    modernantique: {







        name: 'Modern Antique Map',







        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',







        attribution: '© Esri — Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012',







        maxZoom: 19







    },







    streetnight: {







        name: 'Street (night)',







        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',







        attribution: '© CartoDB, © OpenStreetMap contributors',







        maxZoom: 19







    }







};















// Inicialização do mapa







function initMap() {







    console.log('Inicializando mapa...');







    







    // Criar o mapa sem nenhum basemap ativo inicialmente







    map = L.map('map', {







        center: [-12.5, -39.5],







        zoom: 7,







        zoomControl: true,







        attributionControl: true







    });















    console.log('Mapa criado:', map);















    // Pane só para pontos (z-index acima de overlayPane ~400 e markerPane ~600; rasters GeoTIFF não cobrem)







    map.createPane('panePontos');







    map.getPane('panePontos').style.zIndex = 650;















    // Adicionar controles de zoom personalizados







    L.control.zoom({







        position: 'bottomright'







    }).addTo(map);















    // Adicionar controle de escala







    L.control.scale({







        position: 'bottomleft',







        metric: true,







        imperial: false







    }).addTo(map);















    // Adicionar todos os basemaps marcados por padrão







    addInitialBasemaps();















    // Carregar camadas GeoJSON







    loadLimiteTotal();







    loadLimiteZonas();







    loadBahia();







    loadPontos();







    loadGeomorf();







    loadGeologia();







    loadXRF();







    loadSolos();















    // Event listeners







    setupEventListeners();







    







    console.log('WebGIS inicializado com sucesso!');







}















function addInitialBasemaps() {







    document.querySelectorAll('.basemap-checkbox').forEach(cb => {







        if (cb.checked) {







            addBasemap(cb.dataset.basemap);







        }







    });







}















// Adicionar/remover basemap







function addBasemap(basemapKey) {







    const basemap = basemaps[basemapKey];







    if (basemap) {







        if (!layers[basemapKey]) {







            layers[basemapKey] = L.tileLayer(basemap.url, {







                attribution: basemap.attribution,







                maxZoom: basemap.maxZoom







            });







        }







        if (!map.hasLayer(layers[basemapKey])) {







            layers[basemapKey].addTo(map);







        }







        // Re-adiciona as camadas de dados para garantir que fiquem acima







        bringDataLayersToFront();







    }







}















function removeBasemap(basemapKey) {







    if (layers[basemapKey] && map.hasLayer(layers[basemapKey])) {







        map.removeLayer(layers[basemapKey]);







        // Re-adiciona as camadas de dados para garantir que fiquem acima







        bringDataLayersToFront();







    }







}















function bringDataLayersToFront() {







    if (layers.limiteTotalShadow && map.hasLayer(layers.limiteTotalShadow)) {







        layers.limiteTotalShadow.bringToFront();







    }



    if (layers.limiteTotal && map.hasLayer(layers.limiteTotal)) {







        layers.limiteTotal.bringToFront();







    }







    if (layers.limiteZonas && map.hasLayer(layers.limiteZonas)) {







        layers.limiteZonas.bringToFront();







    }







    if (layers.bahia && map.hasLayer(layers.bahia)) {







        layers.bahia.bringToFront();







    }







    if (layers.geomorf && typeof layers.geomorf === 'object') {







        Object.keys(layers.geomorf).forEach(function (nomeDominio) {







            const lyr = layers.geomorf[nomeDominio];







            if (lyr && map.hasLayer(lyr)) lyr.bringToFront();







        });







    }







    if (layers.geologia && typeof layers.geologia === 'object') {







        Object.keys(layers.geologia).forEach(function (nomeUnidade) {







            const lyr = layers.geologia[nomeUnidade];







            if (lyr && map.hasLayer(lyr)) lyr.bringToFront();







        });







    }







    if (layers.xrf && map.hasLayer(layers.xrf)) {







        layers.xrf.bringToFront();







    }







    if (layers.pontos && map.hasLayer(layers.pontos)) {







        layers.pontos.bringToFront();







    }







}















// Configurar event listeners







function setupEventListeners() {







    console.log('Configurando event listeners...');







    







    // Controles de mapa de fundo (checkboxes)







    document.querySelectorAll('.basemap-checkbox').forEach(cb => {







        cb.addEventListener('change', function() {







            if (this.checked) {







                addBasemap(this.dataset.basemap);







            } else {







                removeBasemap(this.dataset.basemap);







            }







        });







    });















    // Controles de camadas







    const limiteTotalEl = document.getElementById('layer-limite-total');







    if (limiteTotalEl) {







        limiteTotalEl.addEventListener('change', function() {







            if (layers.limiteTotal) {







                if (this.checked) {







                    if (layers.limiteTotalShadow) map.addLayer(layers.limiteTotalShadow);



                    map.addLayer(layers.limiteTotal);







                    bringDataLayersToFront();







                } else {







                    map.removeLayer(layers.limiteTotal);



                    if (layers.limiteTotalShadow) map.removeLayer(layers.limiteTotalShadow);







                }







            }







        });







    }







    const limiteZonasEl = document.getElementById('layer-limite-zonas');







    if (limiteZonasEl) {







        limiteZonasEl.addEventListener('change', function() {







            if (layers.limiteZonas) {







                if (this.checked) {







                    map.addLayer(layers.limiteZonas);







                    bringDataLayersToFront();







                } else {







                    map.removeLayer(layers.limiteZonas);







                }







            }







        });







    }







    







    // Event listeners individuais para cada zona







    ['sisal','baixo-sul','vale-jiquirica','piemonte-paraguacu','bacia-jacuipe','litoral-norte','portal-sertao','reconcavo','medio-rio-contas','metropolitano-salvador'].forEach(zona => {







        const cb = document.getElementById(`layer-zona-${zona}`);







        if (cb) {







            cb.addEventListener('change', function() {







                const key = `zona-${zona}`;







                if (this.checked) {







                    if (layers[key]) map.addLayer(layers[key]);







                } else {







                    if (layers[key]) map.removeLayer(layers[key]);







                }







            });







        }







    });







    







    // Controle dos pontos







    const pontosEl = document.getElementById('layer-pontos');







    if (pontosEl) {







        pontosEl.addEventListener('change', function() {







            syncPontosLayerWithCheckbox();







        });







    }















    // Controle do XRF







    const xrfEl = document.getElementById('layer-xrf');







    if (xrfEl) {







        xrfEl.addEventListener('change', function() {







            if (this.checked) {







                if (layers.xrf && !map.hasLayer(layers.xrf)) {







                    layers.xrf.addTo(map);







                    bringDataLayersToFront();







                }







            } else {







                if (layers.xrf && map.hasLayer(layers.xrf)) {







                    map.removeLayer(layers.xrf);







                }







            }







        });







    }















    // Controles do mapa







    document.getElementById('zoom-in').addEventListener('click', function() {







        map.zoomIn();







    });















    document.getElementById('zoom-out').addEventListener('click', function() {







        map.zoomOut();







    });















    document.getElementById('home-btn').addEventListener('click', function() {







        // Retornar à visualização inicial (Brasília)







        map.setView([-15.7801, -47.9292], 5);







    });















    // Botão de tela cheia







    document.getElementById('fullscreen-btn').addEventListener('click', function() {







        toggleFullscreen();







    });







    // Funcionalidade de Pesquisa



    const searchInput = document.getElementById('search-input');



    const searchBtn = document.getElementById('search-btn');



    const searchResults = document.getElementById('search-results');







    console.log('Elementos de pesquisa:', { searchInput, searchBtn, searchResults });







    if (searchBtn && searchInput && searchResults) {







        searchBtn.addEventListener('click', function() {



            console.log('Botão de busca clicado');



            performSearch();



        });







        searchInput.addEventListener('keypress', function(e) {







            if (e.key === 'Enter') {



                console.log('Enter pressionado no campo de busca');



                performSearch();



            }







        });







        console.log('Eventos de pesquisa adicionados');



    } else {



        console.error('Elementos de pesquisa não encontrados');



    }







        // A função de pesquisa de pontos está definida globalmente fora de setupEventListeners.
    // Isso garante que event listeners adicionados em DOMContentLoaded também possam chamá-la.

// Eventos do mapa







    map.on('mousemove', function(e) {







        const lat = e.latlng.lat.toFixed(6);







        const lng = e.latlng.lng.toFixed(6);







        document.getElementById('coordinates').textContent = `${lat}, ${lng}`;







    });















    map.on('zoomend', function() {







        const zoom = map.getZoom();







        document.getElementById('zoom-level').textContent = zoom;







        







        
// Calcular escala aproximada







        const scale = calculateScale(zoom);







        document.getElementById('scale').textContent = scale;







    });















    // Evento de clique no mapa







    map.on('click', function(e) {







        const lat = e.latlng.lat.toFixed(6);







        const lng = e.latlng.lng.toFixed(6);







        document.getElementById('coordinates').textContent = `${lat}, ${lng}`;







    });







    







    console.log('Event listeners configurados!');







}















// Função global de pesquisa de pontos
function performSearch() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    if (!searchInput || !searchResults) {
        console.error('Elementos de pesquisa não encontrados.');
        return;
    }

    const searchTerm = searchInput.value.trim().toLowerCase();
    const pontosCheckbox = document.getElementById('layer-pontos');

    if (!pontosCheckbox || !pontosCheckbox.checked) {
        searchResults.innerHTML = '<p style="color: #666; font-size: 11px;">Ative a camada "Pontos" para buscar.</p>';
        return;
    }

    if (!searchTerm) {
        searchResults.innerHTML = '<p style="color: #666; font-size: 11px;">Digite um termo para buscar.</p>';
        return;
    }

    searchResults.innerHTML = '<p style="color: #666; font-size: 11px;">Buscando...</p>';

    const results = [];
    if (layers.pontos && layers.pontos.getLayers) {
        layers.pontos.getLayers().forEach(function(layer) {
            let searchText = '';
            let pontoNumero = '';
            if (layer.feature && layer.feature.properties) {
                const props = layer.feature.properties;
                pontoNumero = pontoIdentificador(props) || '';
                searchText = Object.values(props)
                    .filter(v => v !== null && v !== undefined)
                    .map(v => String(v))
                    .join(' ')
                    .toLowerCase();
            }
            if (!searchText && layer.getPopup) {
                searchText = String(layer.getPopup().getContent() || '').toLowerCase();
            }
            if (!pontoNumero && layer.feature && layer.feature.properties) {
                pontoNumero = pontoIdentificador(layer.feature.properties) || '';
            }
            if (searchText.includes(searchTerm)) {
                const latlng = layer.getLatLng();
                results.push({ name: pontoNumero || 'Ponto', latlng: latlng, layer: layer });
            }
        });
    }

    if (results.length === 0) {
        searchResults.innerHTML = '<p style="color: #666; font-size: 11px;">Nenhum resultado encontrado.</p>';
    } else {
        let html = '<div style="display: flex; flex-direction: column; gap: 4px;">';
        results.forEach(function(result, index) {
            html += '<button class="search-result-btn" data-index="' + index + '" style="padding: 6px; background: #f0f0f0; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; text-align: left; font-size: 11px; transition: background 0.2s;">' +
                '<i class="fas fa-map-marker-alt" style="color: #667eea;"></i> <strong>' + result.name + '</strong>' +
                '</button>';
        });
        html += '</div>';
        searchResults.innerHTML = html;
        document.querySelectorAll('.search-result-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                const result = results[index];
                if (result && result.latlng) {
                    map.setView(result.latlng, 16);
                    result.layer.openPopup();
                }
            });
            btn.addEventListener('mouseenter', function() { this.style.background = '#e0e7ff'; });
            btn.addEventListener('mouseleave', function() { this.style.background = '#f0f0f0'; });
        });
    }
}

// Calcular escala aproximada







function calculateScale(zoom) {







    const scales = {







        1: '1:500000000',







        2: '1:250000000',







        3: '1:150000000',







        4: '1:70000000',







        5: '1:35000000',







        6: '1:15000000',







        7: '1:10000000',







        8: '1:4000000',







        9: '1:2000000',







        10: '1:1000000',







        11: '1:400000',







        12: '1:200000',







        13: '1:100000',







        14: '1:50000',







        15: '1:25000',







        16: '1:12000',







        17: '1:6000',







        18: '1:3000',







        19: '1:1500'







    };







    







    return scales[zoom] || '1:1000000';







}















// Toggle tela cheia







function toggleFullscreen() {







    const container = document.querySelector('.container');







    const btn = document.getElementById('fullscreen-btn');







    







    if (!container) {







        console.error('Container não encontrado');







        return;







    }







    







    if (!btn) {







        console.error('Botão fullscreen não encontrado');







        return;







    }







    







    if (!document.fullscreenElement) {







        if (container.requestFullscreen) {







            container.requestFullscreen().then(() => {







                btn.innerHTML = '<i class="fas fa-compress"></i> Sair da Tela Cheia';







            }).catch(err => {







                console.error('Erro ao entrar em tela cheia:', err);







                alert('Não foi possível ativar o modo tela cheia. Verifique as permissões do navegador.');







            });







        } else if (container.webkitRequestFullscreen) { // Safari







            container.webkitRequestFullscreen();







            btn.innerHTML = '<i class="fas fa-compress"></i> Sair da Tela Cheia';







        } else if (container.msRequestFullscreen) { // IE11







            container.msRequestFullscreen();







            btn.innerHTML = '<i class="fas fa-compress"></i> Sair da Tela Cheia';







        }







    } else {







        if (document.exitFullscreen) {







            document.exitFullscreen().then(() => {







                btn.innerHTML = '<i class="fas fa-expand"></i> Tela Cheia';







            });







        } else if (document.webkitExitFullscreen) { // Safari







            document.webkitExitFullscreen();







            btn.innerHTML = '<i class="fas fa-expand"></i> Tela Cheia';







        } else if (document.msExitFullscreen) { // IE11







            document.msExitFullscreen();







            btn.innerHTML = '<i class="fas fa-expand"></i> Tela Cheia';







        }







    }







    // Redimensionar mapa







    setTimeout(() => {







        if (typeof map !== 'undefined' && map) map.invalidateSize();







    }, 100);







}















// Atualizar botão ao sair do modo tela cheia manualmente







if (document.fullscreenEnabled) {







    document.addEventListener('fullscreenchange', function() {







        const btn = document.getElementById('fullscreen-btn');







        if (!document.fullscreenElement) {







            btn.innerHTML = '<i class="fas fa-expand"></i> Tela Cheia';







            setTimeout(() => {







                if (typeof map !== 'undefined' && map) map.invalidateSize();







            }, 100);







        }







    });







}















// Inicializar quando o DOM estiver carregado







document.addEventListener('DOMContentLoaded', function() {







    console.log('DOM carregado, inicializando WebGIS...');







    initMap();



    // Adicionar event listener para fullscreen-btn diretamente

    const fullscreenBtn = document.getElementById('fullscreen-btn');

    if (fullscreenBtn) {

        fullscreenBtn.addEventListener('click', function(e) {

            e.preventDefault();

            console.log('Botão fullscreen clicado');

            toggleFullscreen();

        });

    } else {

        console.error('Botão fullscreen não encontrado no DOMContentLoaded');

    }



    







    // Garante que o painel de zonas inicie recolhido







    const zonasPanel = document.querySelector('.sidebar-section.collapsible');







    if (zonasPanel) {







        const content = zonasPanel.querySelector('.collapsible-content');







        const icon = zonasPanel.querySelector('.fa-chevron-up, .fa-chevron-down');







        if (content) content.style.display = 'none';







        if (icon) {







            icon.classList.remove('fa-chevron-up');







            icon.classList.add('fa-chevron-down');







        }







    }







    // Garante que todos os checkboxes das zonas estejam desmarcados







    [







        'sisal','baixo-sul','vale-jiquirica','piemonte-paraguacu','bacia-jacuipe',







        'litoral-norte','portal-sertao','reconcavo','medio-rio-contas','metropolitano-salvador'







    ].forEach(zona => {







        const cb = document.getElementById(`layer-zona-${zona}`);







        if (cb) cb.checked = false;







    });







    // Garante que os checkboxes de pontos e marcadores estejam desmarcados por padrão







    document.getElementById('layer-pontos').checked = false;







    loadSolos();







});















// Função para exportar dados (opcional)







function exportData() {







    console.log('Função de exportação não implementada');







}















// Função para imprimir mapa (opcional)







function printMap() {







    window.print();







}















// Controle de carregamento das camadas para garantir que hideAllExceptLimiteTotalAndSatelite só rode após todas carregarem







let loadedLimiteTotal = false;







let loadedLimiteZonas = false;







let loadedPontos = false;







function tryHideAllExceptLimiteTotalAndSatelite() {







    if (loadedLimiteTotal && loadedLimiteZonas && loadedPontos) {







        hideAllExceptLimiteTotalAndSatelite();







    }







}















// Carregar Limite Total







function loadLimiteTotal() {







    fetch('data/tcl_limite_total.geojson')







        .then(resp => resp.json())







        .then(data => {







            // Criar camada de sombra

            layers.limiteTotalShadow = L.geoJSON(data, {

                style: {

                    color: 'rgba(0, 0, 0, 0.5)',

                    weight: 4,

                    fill: false,

                    opacity: 1,

                    lineCap: 'round',

                    lineJoin: 'round'

                }

            });



            // Criar camada principal

            layers.limiteTotal = L.geoJSON(data, {

                style: {

                    color: '#203a43',

                    weight: 2,

                    fill: false,

                    opacity: 1,

                    lineCap: 'round',

                    lineJoin: 'round'

                }

            });







            if (document.getElementById('layer-limite-total').checked) {







                layers.limiteTotalShadow.addTo(map);



                layers.limiteTotal.addTo(map);







            }







        })







        .catch(err => {







            alert('Erro ao carregar Limite Total: ' + err.message);







            console.error(err);







        });







}















// Carregar Bahia







function loadBahia() {







    fetch('data/bahia.geojson')







        .then(resp => resp.json())







        .then(data => {







            layers.bahia = L.geoJSON(data, {







                style: {







                    color: '#888888',







                    weight: 2,







                    opacity: 0.8,







                    fillColor: '#888888',







                    fillOpacity: 0.12







                }







            }).addTo(map);







            bringDataLayersToFront();







            console.log('[Bahia] Camada carregada e exibida.');







        })







        .catch(err => {







            alert('Erro ao carregar Bahia: ' + err.message);







            console.error(err);







        });







}















// Carregar Limite Zonas







function loadLimiteZonas() {







    fetch('data/tcl_limite_zonas.geojson')







        .then(resp => resp.json())







        .then(data => {







            // Mapear regiões por NM_TI







            const regioes = {};







            data.features.forEach(feature => {







                const nome = feature.properties && feature.properties.NM_TI;







                if (nome) {







                    if (!regioes[nome]) regioes[nome] = [];







                    regioes[nome].push(feature);







                }







            });







            // Criar layers para cada região (apenas polígonos, sem marcadores em centroide)







            layers.zonas = {};







            Object.keys(regioes).forEach(nome => {







                layers.zonas[nome] = L.geoJSON({type: 'FeatureCollection', features: regioes[nome]}, {







                    style: {







                        color: '#000',







                        weight: 1.5,







                        fill: false







                    }







                });







            });







            // Gerar checkboxes dinamicamente







            const container = document.getElementById('zonas-checkbox-list');







            container.innerHTML = '';







            Object.keys(regioes).forEach(nome => {







                const id = `layer-zona-${nome.replace(/\s+/g, '-').toLowerCase()}`;







                const label = document.createElement('label');







                label.className = 'layer-checkbox';







                label.innerHTML = `<input type="checkbox" id="${id}"><span class="checkmark"></span>${nome}`;







                container.appendChild(label);







            });







            // Listeners para cada checkbox







            Object.keys(regioes).forEach(nome => {







                const id = `layer-zona-${nome.replace(/\s+/g, '-').toLowerCase()}`;







                const cb = document.getElementById(id);







                if (cb) {







                    cb.checked = false;







                    cb.addEventListener('change', function() {







                        if (this.checked) {







                            if (layers.zonas[nome]) map.addLayer(layers.zonas[nome]);







                        } else {







                            if (layers.zonas[nome]) map.removeLayer(layers.zonas[nome]);







                        }







                    });







                }







            });







        })







        .catch(err => {







            alert('Erro ao carregar Regiões Territoriais: ' + err.message);







            console.error(err);







        });







}















function pontoIdentificador(props) {







    if (!props) return '';







    return props.Ponto || props.Codigo || '';







}















/** Escapa texto para uso seguro no HTML do popup dos pontos. */







function escapeHtmlPontos(text) {







    if (text === null || text === undefined) return '';







    return String(text)







        .replace(/&/g, '&amp;')







        .replace(/</g, '&lt;')







        .replace(/>/g, '&gt;')







        .replace(/"/g, '&quot;');







}















const fotosDisponiveisPontos = {







    TCL01: 'data/imagens/TCL01.jpeg',







    TCL02: 'data/imagens/TCL02.jpeg',







    TCL03: 'data/imagens/TCL03.jpeg',







    TCL04: 'data/imagens/TCL04.jpeg',







    TCL05: 'data/imagens/TCL05.jpeg',







    TCL55: 'data/imagens/TCL55.jpeg',







    TCL055: 'data/imagens/TCL55.jpeg',







    TCL06: 'data/imagens/TCL06.jpeg',







    TCL07: 'data/imagens/TCL07.jpeg',







    TCL08: 'data/imagens/TCL08.jpeg',







    TCL09: 'data/imagens/TCL09.jpeg',







    TCL10: 'data/imagens/TCL10.jpeg',







    TCL11: 'data/imagens/TCL11.jpg',







    TCL12: 'data/imagens/TCL12.jpeg',







    TCL13: 'data/imagens/TCL13.jpeg',







    TCL14: 'data/imagens/TCL14.jpeg',







    TCL15: 'data/imagens/TCL15.jpeg',







    TCL16: 'data/imagens/TCL16.jpeg',







    TCL17: 'data/imagens/TCL17.jpg',







    TCL18: 'data/imagens/TCL18.jpg',







    TCL19: 'data/imagens/TCL19.jpeg',







    TCL20: 'data/imagens/TCL20.jpeg',







    TCL21: 'data/imagens/TCL21.jpeg',







    TCL22: 'data/imagens/TCL22.jpg',







    TCL23: 'data/imagens/TCL23.jpg',







    TCL24: 'data/imagens/TCL24.jpg',







    TCL25: 'data/imagens/TCL25.jpg',







    TCL26: 'data/imagens/TCL26.jpg',







    TCL27: 'data/imagens/TCL27.jpg',







    TCL28: 'data/imagens/TCL28.jpg',







    TCL29: 'data/imagens/TCL29.jpeg',







    TCL30: 'data/imagens/TCL30.jpeg',







    TCL31: 'data/imagens/TCL31.jpeg',







    TCL32: 'data/imagens/TCL32.jpg',







    TCL33: 'data/imagens/TCL33.jpg',







    TCL34: 'data/imagens/TCL34.jpg',







    TCL35: 'data/imagens/TCL35.jpeg',







    TCL36: 'data/imagens/TCL36.jpeg',







    TCL37: 'data/imagens/TCL37.jpeg',







    TCL38: 'data/imagens/TCL38.jpeg',







    TCL39: 'data/imagens/TCL39.jpeg',







    TCL40: 'data/imagens/TCL40.jpeg',







    TCL41: 'data/imagens/TCL41.jpeg',







    TCL42: 'data/imagens/TCL42.jpg',







    TCL43: 'data/imagens/TCL43.jpeg',







    TCL44: 'data/imagens/TCL44.jpeg',







    TCL45: 'data/imagens/TCL45.jpeg',







    TCL46: 'data/imagens/TCL46.jpeg',







    TCL47: 'data/imagens/TCL47.jpeg',







    TCL48: 'data/imagens/TCL48.jpeg',







    TCL49: 'data/imagens/TCL49.jpeg',







    TCL50: 'data/imagens/TCL50.jpeg',







    TCL51: 'data/imagens/TCL51.jpeg',







    TCL54: 'data/imagens/TCL54.jpg',







    TCL56: 'data/imagens/TCL56.jpeg',







    TCL57: 'data/imagens/TCL57.jpg',







    TCL58: 'data/imagens/TCL58.jpg',







    TCL59: 'data/imagens/TCL59.jpeg',







    TCL60: 'data/imagens/TCL60.jpeg',







    TCL61: 'data/imagens/TCL61.jpg',







    TCL62: 'data/imagens/TCL62.jpg',







    TCL63: 'data/imagens/TCL63.jpg',







    TCL64: 'data/imagens/TCL64.jpg',







    TCL65: 'data/imagens/TCL65.jpg',







    TCL66: 'data/imagens/TCL66.jpg',







    TCL67: 'data/imagens/TCL67.jpg',







    TCL68: 'data/imagens/TCL68.jpg',







    TCL69: 'data/imagens/TCL69.jpeg',







    TCL70: 'data/imagens/TCL70.jpeg',







    TCL71: 'data/imagens/TCL71.jpeg',







    TCL72: 'data/imagens/TCL72.jpeg',







    TCL73: 'data/imagens/TCL73.jpg',







    TCL74: 'data/imagens/TCL74.jpg',







    TCL75: 'data/imagens/TCL75.jpeg',







    TCL76: 'data/imagens/TCL76.jpg',







    TCL77: 'data/imagens/TCL77.jpeg',







    TCL79: 'data/imagens/TCL79.jpeg',







    TCL80: 'data/imagens/TCL80.jpeg',







    TCL81: 'data/imagens/TCL81.jpeg',







    TCL82: 'data/imagens/TCL82.jpeg',







    TCL84: 'data/imagens/TCL84.jpeg',







    TCL86: 'data/imagens/TCL86.jpeg',







    TCL52: 'data/imagens/TCL52.jpeg',







    TCL53: 'data/imagens/TCL53.jpeg',







    TCL78: 'data/imagens/TCL78.jpeg',







    TCL83: 'data/imagens/TCL83.jpeg',







    TCL85: 'data/imagens/TCL85.jpeg'







};















function getFotoPathParaPonto(pontoId) {







    if (!pontoId) return null;







    const direto = fotosDisponiveisPontos[pontoId];







    if (direto) return direto;







    const altTlc = pontoId.replace(/^TCL/, 'TLC');







    if (altTlc !== pontoId && fotosDisponiveisPontos[altTlc]) return fotosDisponiveisPontos[altTlc];







    const altTcl = pontoId.replace(/^TLC/, 'TCL');







    if (altTcl !== pontoId && fotosDisponiveisPontos[altTcl]) return fotosDisponiveisPontos[altTcl];







    return null;







}















/** Popup do ponto: só campos pedidos (sem OBJECTID nem título “Atributos”). */







function buildPopupPontosHtml(properties) {







    if (!properties || typeof properties !== 'object') {







        return '<div class="popup-content popup-pontos-resumo"><p><em>Sem dados</em></p></div>';







    }







    







    // Usar coordenadas UTM diretas do arquivo







    let coordUtm = 'Indisponível';







    if (properties.LONGITUDE !== null && properties.LONGITUDE !== undefined && 







        properties.LATITUDE !== null && properties.LATITUDE !== undefined) {







        coordUtm = 'E: ' + Math.round(properties.LONGITUDE) + ' m, N: ' + Math.round(properties.LATITUDE) + ' m';







    }







    







    const pontoId = properties.Ponto ? String(properties.Ponto).replace(/\s+/g, '') : null;







    const fotoPath = pontoId ? getFotoPathParaPonto(pontoId) : null;







    const imagemHtml = fotoPath







        ? '<div style="margin-bottom:8px;display:inline-block;">' +







          '<img src="' + escapeHtmlPontos(fotoPath) + '" style="max-width:280px;height:auto;border-radius:4px;display:block;" alt="Foto" onerror="this.style.display=\'none\'" />' +







          '</div>'







        : '';







    







    const linhas = [







        { chave: 'Ponto', rotulo: 'Ponto' },







        { chave: 'coordUtm', rotulo: 'Coordenadas (UTM)', valor: coordUtm },







        { chave: 'Elev', rotulo: 'Elevação (m)' },







        { chave: 'Mesoregiao', rotulo: 'Mesorregião' },







        { chave: 'Municipio', rotulo: 'Município' },







        { chave: 'Solo', rotulo: 'Classe de Solo' }







    ];







    const corpo = linhas







        .map(function (linha) {







            const v = linha.valor !== undefined ? linha.valor : properties[linha.chave];







            const texto = v === null || v === undefined || v === '' ? '—' : String(v);







            return (







                '<tr><th scope="row" style="text-align:left;padding:3px 10px 3px 0;vertical-align:top;white-space:nowrap;font-weight:600;">' +







                escapeHtmlPontos(linha.rotulo) +







                '</th><td style="padding:3px 0;">' +







                escapeHtmlPontos(texto) +







                '</td></tr>'







            );







        })







        .join('');







    return (







        '<div class="popup-content popup-pontos-resumo">' +







        imagemHtml +







        '<table style="border-collapse:collapse;font-size:12px;max-width:300px;"><tbody>' +







        corpo +







        '</tbody></table></div>'







    );







}















/** Resolve função proj4 (UMD global ou default export). */







function getProj4Transform() {







    const p = typeof window.proj4 === 'function' ? window.proj4 : window.proj4 && window.proj4.default;







    return typeof p === 'function' ? p : null;







}















/**







 * Converte geometrias Point para WGS84 (EPSG:4326) em memória.







 * GeoJSON final usa sempre [longitude, latitude] em graus.







 */







function clonePontosGeoJsonEmWgs84(src) {







    const crsName = src.crs && src.crs.properties && src.crs.properties.name;







    const projFn = getProj4Transform();







    const usarProj4 = Boolean(crsName && /31984/i.test(crsName) && projFn);







    if (usarProj4) {







        try {







            projFn.defs(







                'EPSG:31984',







                '+proj=utm +zone=24 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'







            );







        } catch (e) {







            /* definição já existente */







        }







    }







    const features = (src.features || []).map(function (f) {







        const feat = JSON.parse(JSON.stringify(f));







        if (







            usarProj4 &&







            feat.geometry &&







            feat.geometry.type === 'Point' &&







            Array.isArray(feat.geometry.coordinates)







        ) {







            const x = feat.geometry.coordinates[0];







            const y = feat.geometry.coordinates[1];







            const ll = projFn('EPSG:31984', 'EPSG:4326', [x, y]);







            feat.geometry.coordinates = [ll[0], ll[1]];







        }







        return feat;







    });







    return { type: 'FeatureCollection', features: features };







}















/** Liga ou desliga a camada de pontos e rótulos conforme o checkbox (e após o fetch terminar). */







function syncPontosLayerWithCheckbox() {







    const el = document.getElementById('layer-pontos');







    if (!map || !el || !layers.pontos) return;







    if (el.checked) {







        if (!map.hasLayer(layers.pontos)) {







            layers.pontos.addTo(map);







        }







        if (typeof layers.pontos.bringToFront === 'function') {







            layers.pontos.bringToFront();







        }







        bringDataLayersToFront();







        if (layers.pontos.getBounds && layers.pontos.getLayers().length > 0) {







            const b = layers.pontos.getBounds();







            if (b.isValid() && !map.getBounds().intersects(b)) {







                map.fitBounds(b, { maxZoom: 10, padding: [56, 56] });







            }







        }







    } else if (map.hasLayer(layers.pontos)) {







        map.removeLayer(layers.pontos);







    }







    updatePointLabels();







}















// Carregar Pontos: LayerGroup + circleMarker no panePontos (sempre visível por cima de rasters).







function loadPontos() {







    fetch('data/point_a.geojson')







        .then(function (resp) {







            if (!resp.ok) throw new Error(resp.status + ' ' + resp.statusText);







            return resp.json();







        })







        .then(function (data) {







            const geoWgs = clonePontosGeoJsonEmWgs84(data);







            const grp = L.featureGroup();







            let ok = 0;







            let skipped = 0;







            geoWgs.features.forEach(function (feature) {







                if (!feature.geometry || feature.geometry.type !== 'Point') return;







                const c = feature.geometry.coordinates;







                const lng = c[0];







                const lat = c[1];







                if (







                    !isFinite(lat) ||







                    !isFinite(lng) ||







                    Math.abs(lat) > 90 ||







                    Math.abs(lng) > 180







                ) {







                    skipped++;







                    console.warn(







                        '[Pontos] Coordenada inválida (CRS/proj4?):',







                        pontoIdentificador(feature.properties),







                        lat,







                        lng







                    );







                    return;







                }







                const cm = L.circleMarker([lat, lng], {







                    pane: 'panePontos',







                    radius: 4,







                    fillColor: '#e60000',







                    fillOpacity: 0.92,







                    stroke: false,







                    interactive: true







                });







                const props = feature.properties || {};
                cm.feature = feature;







                cm.bindPopup(buildPopupPontosHtml(props), { maxWidth: 340 });







                grp.addLayer(cm);







                ok++;







            });







            layers.pontos = grp;







            if (ok === 0) {







                console.error(







                    '[Pontos] Nenhum marcador válido. Proj4 disponível?',







                    !!getProj4Transform(),







                    'CRS no ficheiro:',







                    data.crs







                );







            } else {







                console.log('[Pontos] Marcadores criados:', ok, 'ignorados:', skipped);







            }







            layers.pointLabels = [];







            geoWgs.features.forEach(function (feature) {







                const id = pontoIdentificador(feature.properties);







                if (!id || !feature.geometry || feature.geometry.type !== 'Point') return;







                const c = feature.geometry.coordinates;







                const lat = c[1];







                const lng = c[0];







                if (!isFinite(lat) || !isFinite(lng)) return;







                const label = L.marker([lat, lng], {







                    pane: 'panePontos',







                    icon: L.divIcon({







                        className: 'ponto-rotulo-divicon',







                        html:







                            '<span style="color:#111;font-size:9px;font-weight:bold;text-shadow:0 0 2px #fff,0 0 2px #fff;">' +







                            escapeHtmlPontos(id) +







                            '</span>',







                        iconSize: [56, 14],







                        iconAnchor: [28, 16]







                    })







                });







                layers.pointLabels.push(label);







            });







            







            // Adicionar pontos por padrão e marcar checkbox







            if (layers.pontos && layers.pontos.getLayers().length > 0) {







                layers.pontos.addTo(map);







                const checkboxEl = document.getElementById('layer-pontos');







                if (checkboxEl && !checkboxEl.checked) {







                    checkboxEl.checked = true;







                }







                bringDataLayersToFront();







            }







            







            syncPontosLayerWithCheckbox();







        })







        .catch(function (err) {







            alert('Erro ao carregar Pontos: ' + err.message);







            console.error(err);







        });







}















/** Carrega `data/resultados.geojson`, agrupa por ID e profundidade, cria camada com abas e preenche Teores Totais. */







function loadXRF() {







    fetch('data/resultados.geojson')







        .then(function (resp) {







            if (!resp.ok) throw new Error(resp.status + ' ' + resp.statusText);







            return resp.json();







        })







        .then(function (data) {







            const grupos = {};







            const campos = ['Mg', 'Al', 'K', 'Ca', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'As_', 'Se', 'Mo', 'Ag', 'Cd', 'Sb', 'Ba', 'Hg', 'Pb'];







            







            // Agrupar por ID e Profundidade







            (data.features || []).forEach(function (feature) {







                const props = feature.properties || {};







                const id = props.ID;







                const prof = props.Prof || 'desconhecida';







                







                if (!id) return;







                if (!grupos[id]) {







                    grupos[id] = {







                        profundidades: [],







                        dados: {}







                    };







                }







                grupos[id].dados[prof] = props;







                if (!grupos[id].profundidades.includes(prof)) {







                    grupos[id].profundidades.push(prof);







                }







            });







            







            const ids = Object.keys(grupos).sort();







            layers.xrf = L.featureGroup();







            







            ids.forEach(function (id) {







                const feature = data.features.find(f => f.properties && f.properties.ID === id);







                if (!feature || !feature.geometry) return;







                







                const coords = feature.geometry.coordinates;







                const lng = coords[0];







                const lat = coords[1];







                const pointKey = sanitizeXrfId(id);







                const profs = grupos[id].profundidades;







                







                const sectionButtons =







                    '<div class="xrf-tabs">' +







                    '<button type="button" id="xrf-btn-' + pointKey + '-fisicos" class="xrf-tab-button" onclick="showXrfSection(\'' + pointKey + '\', \'' + 'fisicos' + '\')">Resultados Físicos</button>' +







                    '<button type="button" id="xrf-btn-' + pointKey + '-totais" class="xrf-tab-button active" onclick="showXrfSection(\'' + pointKey + '\', \'' + 'totais' + '\')">Teores Totais</button>' +







                    '<button type="button" id="xrf-btn-' + pointKey + '-parciais" class="xrf-tab-button" onclick="showXrfSection(\'' + pointKey + '\', \'' + 'parciais' + '\')">Teores Parciais</button>' +







                    '</div>';







                







                const fisicosHtml = buildXrfSectionHtml(pointKey, 'fisicos', [], grupos, id, profs);







                const totaisHtml = buildXrfSectionHtml(pointKey, 'totais', campos, grupos, id, profs);







                const parciaisHtml = buildXrfSectionHtml(pointKey, 'parciais', [], grupos, id, profs);







                







                const actionButtons = '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;gap:8px;">' +







                    '<button onclick="closeXrfPopup()" style="background:#d9534f;color:white;border:none;padding:4px 8px;border-radius:3px;cursor:pointer;font-size:12px;flex:1;">' +







                    'Fechar' +







                    '</button>' +







                    '<button onclick="downloadXRFData(\'' + escapeHtmlAttr(id) + '\')" style="background:#007bff;color:white;border:none;padding:4px 8px;border-radius:3px;cursor:pointer;font-size:12px;flex:1;">' +







                    '<i class="fas fa-download"></i> Baixar' +







                    '</button>' +







                    '</div>';







                







                const marker = L.circleMarker([lat, lng], {







                    radius: 3,







                    fillColor: '#ff6b6b',







                    fillOpacity: 0.8,







                    stroke: true,







                    color: '#c92a2a',







                    weight: 2,







                    interactive: true







                });







                







                marker.bindTooltip(id, {







                    permanent: true,







                    direction: 'top',







                    className: 'xrf-label'







                });







                







                marker.bindPopup(







                    '<div class="popup-content popup-xrf">' +







                    sectionButtons +







                    fisicosHtml +







                    totaisHtml +







                    parciaisHtml +







                    actionButtons +







                    '</div>',







                    { maxWidth: 420, closeButton: false }







                );







                







                layers.xrf.addLayer(marker);







            });







            







            console.log('[Resultados] Pontos carregados:', ids.length);







        })







        .catch(function (err) {







            alert('Erro ao carregar Resultados: ' + err.message);







            console.error(err);







        });







}















function sanitizeXrfId(text) {







    return String(text || '')







        .replace(/\s+/g, '_')







        .replace(/[^a-zA-Z0-9_-]/g, '')







        .toLowerCase();







}















/** Formata valor com 2 casas decimais, mantendo < LOD ou valores string como estão. */







function formatXrfValue(val) {







    if (val === null || val === undefined) return '—';







    const str = String(val).trim();







    if (str === '' || str === '< LOD' || str === '0') return str;







    const num = parseFloat(str.replace(',', '.'));







    if (!isFinite(num)) return str;







    return num.toFixed(2).replace('.', ',');







}















function buildXrfSectionHtml(pointKey, sectionKey, fields, grupos, id, profs) {







    let html = '<div id="xrf-' + pointKey + '-' + sectionKey + '" class="xrf-section" style="display:' + (sectionKey === 'totais' ? 'block' : 'none') + '; margin-top: 8px;">';







    







    if (fields.length === 0) {







        html += '<p style="text-align:center;color:#999;font-size:11px;padding:10px;"><em>Sem dados disponíveis</em></p>';







    } else if (!profs || profs.length === 0) {







        html += '<p style="text-align:center;color:#999;font-size:11px;padding:10px;"><em>Sem profundidades disponíveis</em></p>';







    } else {







        // Usar as profundidades disponíveis







        const prof1 = profs[0];







        const prof2 = profs.length > 1 ? profs[1] : profs[0];







        const data1 = grupos[id].dados[prof1] || {};







        const data2 = grupos[id].dados[prof2] || {};







        







        html += '<table style="width:100%;border-collapse:collapse;font-size:11px;">';







        html += '<thead><tr style="border-bottom:2px solid #333;"><th style="padding:5px 6px;text-align:left;font-weight:bold;">Elemento</th>';







        html += '<th style="padding:5px 6px;text-align:center;font-weight:bold;line-height:1.2;">Superficial<br><span style="font-weight:400;font-size:10px;">' + escapeHtmlPontos(prof1) + '</span></th>';







        html += '<th style="padding:5px 6px;text-align:center;font-weight:bold;line-height:1.2;">Subsuperficial<br><span style="font-weight:400;font-size:10px;">' + escapeHtmlPontos(prof2) + '</span></th></tr></thead>';







        html += '<tbody>';







        fields.forEach(function (campo) {







            const val1 = formatXrfValue(data1[campo]);







            const val2 = formatXrfValue(data2[campo]);







            html += '<tr style="border-bottom:1px solid #ddd;"><td style="padding:4px 6px;font-weight:500;">' + escapeHtmlPontos(campo) + '</td>';







            html += '<td style="padding:4px 6px;text-align:center;">' + escapeHtmlPontos(val1) + '</td>';







            html += '<td style="padding:4px 6px;text-align:center;">' + escapeHtmlPontos(val2) + '</td></tr>';







        });







        html += '</tbody></table>';







    }







    html += '</div>';







    return html;







}















function showXrfSection(pointKey, sectionKey) {







    ['fisicos', 'totais', 'parciais'].forEach(function (key) {







        const section = document.getElementById('xrf-' + pointKey + '-' + key);







        const button = document.getElementById('xrf-btn-' + pointKey + '-' + key);







        if (section) section.style.display = key === sectionKey ? 'block' : 'none';







        if (button) button.classList.toggle('active', key === sectionKey);







    });







}















function closeXrfPopup() {







    if (map && typeof map.closePopup === 'function') {







        map.closePopup();







    }







}















/** Escapa HTML para atributos (quote-safe). */







function escapeHtmlAttr(text) {







    if (!text) return '';







    return String(text)







        .replace(/&/g, '&amp;')







        .replace(/</g, '&lt;')







        .replace(/>/g, '&gt;')







        .replace(/"/g, '&quot;')







        .replace(/'/g, '&#x27;');







}















/** Baixa dados de Resultados em formato CSV. */







function downloadXRFData(id) {







    fetch('data/resultados.geojson')







        .then(function (resp) {







            if (!resp.ok) throw new Error(resp.status);







            return resp.json();







        })







        .then(function (data) {







            const features = (data.features || []).filter(f => f.properties && f.properties.ID === id);







            if (features.length === 0) {







                alert('Dados não encontrados para: ' + id);







                return;







            }







            







            // Extrair elementos das propriedades







            const allKeys = new Set();







            features.forEach(f => {







                Object.keys(f.properties || {}).forEach(k => allKeys.add(k));







            });







            







            // Remover colunas auxiliares







            const cols = Array.from(allKeys).filter(k => !['OBJECTID', 'X', 'Y'].includes(k)).sort();







            







            // Montar CSV







            let csv = cols.join(';') + '\n';







            features.forEach(f => {







                const row = cols.map(col => {







                    const val = f.properties[col];







                    if (val === null || val === undefined) return '';







                    return String(val).replace(/;/g, ',').replace(/\n/g, ' ');







                });







                csv += row.join(';') + '\n';







            });







            







            // Download







            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });







            const link = document.createElement('a');







            const url = URL.createObjectURL(blob);







            link.setAttribute('href', url);







            link.setAttribute('download', 'XRF_' + id + '.csv');







            link.style.visibility = 'hidden';







            document.body.appendChild(link);







            link.click();







            document.body.removeChild(link);







        })







        .catch(function (err) {







            alert('Erro ao baixar dados: ' + err.message);







            console.error(err);







        });







}







function geomorfCheckboxId(nomeDominio) {







    let h = 0;







    for (let i = 0; i < nomeDominio.length; i++) {







        h = (h * 31 + nomeDominio.charCodeAt(i)) | 0;







    }







    return 'layer-geomorf-' + Math.abs(h).toString(36);







}















/** Cores distintas por domínio (paleta fixa; repete se houver mais domínios). */







const GEOMORF_PALETA_CORES = [







    '#1f78b4',







    '#33a02c',







    '#e31a1c',







    '#ff7f00',







    '#6a3d9a',







    '#a6cee3',







    '#b2df8a',







    '#fb9a99',







    '#fdbf6f',







    '#cab2d6',







    '#ffff99',







    '#b15928'







];















function corGeomorfPorIndice(i) {







    return GEOMORF_PALETA_CORES[i % GEOMORF_PALETA_CORES.length];







}



function corGeomorfPorNome(nome) {

    const nomeLower = nome.toLowerCase();

    

    // Depositos sedimentares quaternário - Amarelo (prioridade alta)

    if (nomeLower.includes('deposito') && nomeLower.includes('quaternario') || 

        nomeLower.includes('deposito') && nomeLower.includes('quaternário') ||

        nomeLower.includes('quaternario') && nomeLower.includes('sedimentar') ||

        nomeLower.includes('quaternário') && nomeLower.includes('sedimentar')) {

        return '#FFD700'; // Amarelo

    }

    

    // Crátons Neoproterozóicos - Rosa (prioridade alta) - nome exato do GeoJSON

    if (nomeLower.includes('crátons') && nomeLower.includes('neoproterozóicos') ||

        nomeLower.includes('cratons') && nomeLower.includes('neoproterozóicos') ||

        nomeLower.includes('craton') && nomeLower.includes('neoproterozóico') ||

        nomeLower.includes('cratons') && nomeLower.includes('neoproterozoico') ||

        nomeLower.includes('craton') && nomeLower.includes('neoproterozoicos') ||

        nomeLower.includes('cratons') && nomeLower.includes('neoproterozóico')) {

        return '#FF69B4'; // Rosa

    }

    

    // Bacias e coberturas Sedimentares - Verde escuro

    if (nomeLower.includes('bacias') && nomeLower.includes('sedimentares') || 

        nomeLower.includes('coberturas') && nomeLower.includes('sedimentares')) {

        return '#006400'; // Verde escuro

    }

    

    // Corpo de agua - Azul

    if (nomeLower.includes('agua') || nomeLower.includes('água')) {

        return '#0000FF'; // Azul

    }

    

    // Cinturoes - Castanho

    if (nomeLower.includes('cinturoes') || nomeLower.includes('cinturões')) {

        return '#8B4513'; // Castanho

    }

    

    // Fallback para paleta genérica

    return GEOMORF_PALETA_CORES[0];

}















/** Paleta de cores estável para as unidades geológicas. */







const GEOLOGIA_PALETA_CORES = [







    '#8c510a', '#d8b365', '#f6e8c3', '#c7eae5', '#5ab4ac', '#01665e',







    '#c51b7d', '#de77ae', '#f1b6da', '#4d4d4d', '#762a83', '#af8dc3',







    '#e7d4e8', '#1b7837', '#a6dba0', '#d9f0d3', '#b2182b', '#ef8a62'







];















function corGeologiaPorIndice(i) {







    return GEOLOGIA_PALETA_CORES[i % GEOLOGIA_PALETA_CORES.length];







}















function geologiaCheckboxId(nomeUnidade) {







    let h = 0;







    for (let i = 0; i < nomeUnidade.length; i++) {







        h = (h * 31 + nomeUnidade.charCodeAt(i)) | 0;







    }







    return 'layer-geologia-' + Math.abs(h).toString(36);







}















/** Carrega `data/geologiatcl.geojson`, agrupa por SIGLA_UNID e cria controles dinâmicos. */







function loadGeologia() {







    fetch('data/geologiatcl.geojson')







        .then(function (resp) {







            if (!resp.ok) throw new Error(resp.status + ' ' + resp.statusText);







            return resp.json();







        })







        .then(function (data) {







            const grupos = {};







            (data.features || []).forEach(function (feature) {







                const props = feature.properties || {};







                const sigla = props.SIGLA_UNID || props.sigla_unid || '—';







                if (!sigla) return;







                if (!grupos[sigla]) grupos[sigla] = [];







                grupos[sigla].push(feature);







            });







            const siglas = Object.keys(grupos).sort(function (a, b) {







                return a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });







            });







            layers.geologia = {};







            siglas.forEach(function (sigla, indice) {







                const fill = corGeologiaPorIndice(indice);







                layers.geologia[sigla] = L.geoJSON(







                    { type: 'FeatureCollection', features: grupos[sigla] },







                    {







                        style: {







                            color: fill,







                            weight: 0.1,







                            opacity: 0,







                            fillColor: fill,







                            fillOpacity: 0.65







                        },







                        onEachFeature: function (feature, layer) {







                            const props = feature.properties || {};







                            



                            const siglaUnid = escapeHtmlPontos(props.SIGLA_UNID || props.sigla_unid || '—');



                            const nomeUnidade = escapeHtmlPontos(props.NOME_UNIDA || props.nome_unida || '—');



                            const eonIdadeMax = escapeHtmlPontos(props.EON_IDAD_M || props.eon_idad_m || '—');



                            const eraMax = escapeHtmlPontos(props.ERA_MAXIMA || props.era_maxima || '—');



                            const periodoMax = escapeHtmlPontos(props.PERIODO_MA || props.periodo_ma || '—');



                            const epocaMax = escapeHtmlPontos(props.EPOCA_MAX || props.epoca_max || '—');



                            const eraMin = escapeHtmlPontos(props.ERA_MINIMA || props.era_minima || '—');



                            const periodoMin = escapeHtmlPontos(props.PERIODO_MI || props.periodo_mi || '—');



                            const epocaMin = escapeHtmlPontos(props.EPOCA_MIN || props.epoca_min || '—');



                            const classeRocha = escapeHtmlPontos(props.CLASSE_ROC || props.classe_roc || '—');



                            const litotipo1 = escapeHtmlPontos(props.LITOTIPO1_ || props.litotipo1_ || '—');



                            const litotipo2 = escapeHtmlPontos(props.LITOTIPO2_ || props.litotipo2_ || '—');







                            layer.bindPopup(







                                '<div class="popup-content popup-geologia" style="background: rgba(255, 255, 255, 0.95); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); border-radius: 8px; padding: 16px; max-width: 350px;">' +



                                '<h3 style="color: #333; margin-bottom: 12px; font-size: 16px; font-weight: 600;">' + siglaUnid + ' - ' + nomeUnidade + '</h3>' +



                                '<div style="margin-bottom: 12px;">' +



                                '<p style="color: #666; font-size: 13px; margin: 4px 0;"><strong style="color: #333;">Eon Idade Max:</strong> ' + eonIdadeMax + '</p>' +



                                '<p style="color: #666; font-size: 13px; margin: 4px 0;"><strong style="color: #333;">Era Max:</strong> ' + eraMax + '</p>' +



                                '<p style="color: #666; font-size: 13px; margin: 4px 0;"><strong style="color: #333;">Periodo:</strong> ' + periodoMax + '</p>' +



                                '<p style="color: #666; font-size: 13px; margin: 4px 0;"><strong style="color: #333;">Epoca Max:</strong> ' + epocaMax + '</p>' +



                                '<p style="color: #666; font-size: 13px; margin: 4px 0;"><strong style="color: #333;">Era Min:</strong> ' + eraMin + '</p>' +



                                '<p style="color: #666; font-size: 13px; margin: 4px 0;"><strong style="color: #333;">Periodo Min:</strong> ' + periodoMin + '</p>' +



                                '<p style="color: #666; font-size: 13px; margin: 4px 0;"><strong style="color: #333;">Epoca Min:</strong> ' + epocaMin + '</p>' +



                                '<p style="color: #666; font-size: 13px; margin: 4px 0;"><strong style="color: #333;">Classe da Rocha:</strong> ' + classeRocha + '</p>' +



                                '</div>' +



                                '<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee;">' +



                                '<p style="color: #666; font-size: 13px; margin: 8px 0;"><strong style="color: #333;">Litologia 1:</strong></p>' +



                                '<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;">' +



                                (litotipo1 !== '—' ? litotipo1.split(',').map(function(l) { return '<span style="background: #667eea; color: white; padding: 4px 10px; border-radius: 16px; font-size: 11px; display: inline-block;">' + l.trim() + '</span>'; }).join('') : '<span style="color: #999; font-size: 12px;">—</span>') +



                                '</div>' +



                                '<p style="color: #666; font-size: 13px; margin: 8px 0;"><strong style="color: #333;">Litologia 2:</strong></p>' +



                                '<div style="display: flex; flex-wrap: wrap; gap: 6px;">' +



                                (litotipo2 !== '—' ? litotipo2.split(',').map(function(l) { return '<span style="background: #764ba2; color: white; padding: 4px 10px; border-radius: 16px; font-size: 11px; display: inline-block;">' + l.trim() + '</span>'; }).join('') : '<span style="color: #999; font-size: 12px;">—</span>') +



                                '</div>' +



                                '</div>' +



                                '</div>'







                            );







                        }







                    }







                );







            });







            const container = document.getElementById('geologia-checkbox-list');







            if (!container) return;







            container.innerHTML = '';







            const selectAllLabel = document.createElement('label');







            selectAllLabel.className = 'layer-checkbox';







            selectAllLabel.innerHTML =







                '<input type="checkbox" id="layer-geologia-select-all">' +







                '<span class="checkmark"></span>' +







                '<strong>Ativar todas</strong>';







            container.appendChild(selectAllLabel);















            siglas.forEach(function (sigla, indice) {







                const id = geologiaCheckboxId(sigla);







                const cor = corGeologiaPorIndice(indice);







                const label = document.createElement('label');







                label.className = 'layer-checkbox';







                label.innerHTML =







                    '<input type="checkbox" id="' + id + '">' +







                    '<span class="checkmark"></span>' +







                    '<span class="geomorf-swatch" style="background:' + cor + '"></span>' +







                    escapeHtmlPontos(sigla);







                container.appendChild(label);







            });















            const selectAllCb = document.getElementById('layer-geologia-select-all');







            if (selectAllCb) {







                selectAllCb.checked = false;







                selectAllCb.addEventListener('change', function () {







                    siglas.forEach(function (sigla) {







                        const cb = document.getElementById(geologiaCheckboxId(sigla));







                        if (!cb) return;







                        cb.checked = selectAllCb.checked;







                        if (selectAllCb.checked) {







                            if (layers.geologia[sigla] && !map.hasLayer(layers.geologia[sigla])) {







                                layers.geologia[sigla].addTo(map);







                            }







                        } else {







                            if (layers.geologia[sigla] && map.hasLayer(layers.geologia[sigla])) {







                                map.removeLayer(layers.geologia[sigla]);







                            }







                        }







                    });







                    bringDataLayersToFront();







                });







            }















            siglas.forEach(function (sigla) {







                const id = geologiaCheckboxId(sigla);







                const cb = document.getElementById(id);







                if (cb) {







                    cb.checked = false;







                    cb.addEventListener('change', function () {







                        if (this.checked) {







                            if (layers.geologia[sigla]) {







                                layers.geologia[sigla].addTo(map);







                                bringDataLayersToFront();







                            }







                        } else if (layers.geologia[sigla]) {







                            map.removeLayer(layers.geologia[sigla]);







                        }















                        if (selectAllCb) {







                            const allChecked = siglas.every(function (siglaAtual) {







                                const cbAtual = document.getElementById(geologiaCheckboxId(siglaAtual));







                                return cbAtual && cbAtual.checked;







                            });







                            selectAllCb.checked = allChecked;







                        }







                    });







                }







            });















            console.log('[Geologia] Unidades carregadas:', siglas.length);







        })







        .catch(function (err) {







            alert('Erro ao carregar Geologia: ' + err.message);







            console.error(err);







        });







}















/** Carrega `data/geomorf.geojson`, agrupa por `nm_dominio` e preenche a lista expansível. */







function loadGeomorf() {







    fetch('data/geomorf.geojson')







        .then(function (resp) {







            if (!resp.ok) throw new Error(resp.status + ' ' + resp.statusText);







            return resp.json();







        })







        .then(function (data) {







            const grupos = {};







            (data.features || []).forEach(function (feature) {







                const nm = feature.properties && feature.properties.nm_dominio;







                if (!nm) return;







                if (!grupos[nm]) grupos[nm] = [];







                grupos[nm].push(feature);







            });







            const nomes = Object.keys(grupos).sort();







            layers.geomorf = {};







            nomes.forEach(function (nome, indice) {







                const fill = corGeomorfPorNome(nome);







                const estilo = {







                    color: fill,







                    weight: 0.1,







                    opacity: 0,







                    fillColor: fill,







                    fillOpacity: 0.5







                };







                layers.geomorf[nome] = L.geoJSON(







                    { type: 'FeatureCollection', features: grupos[nome] },







                    {







                        style: estilo,







                        onEachFeature: function (feature, layer) {







                            const p = feature.properties || {};







                            const nm = p.nm_dominio || nome;







                            const area = p.Shape_Area != null ? p.Shape_Area : '—';







                            const comp = p.Shape_Leng != null ? p.Shape_Leng : '—';







                            layer.bindPopup(







                                '<div class="popup-content popup-geomorf">' +







                                '<p><strong>Domínio:</strong> ' +







                                escapeHtmlPontos(nm) +







                                '</p>' +







                                '<p><strong>Área (Shape_Area):</strong> ' +







                                escapeHtmlPontos(area) +







                                '</p>' +







                                '<p><strong>Comprimento (Shape_Leng):</strong> ' +







                                escapeHtmlPontos(comp) +







                                '</p>' +







                                '</div>'







                            );







                        }







                    }







                );







            });







            const container = document.getElementById('geomorf-checkbox-list');







            if (!container) return;







            container.innerHTML = '';

            const selectAllLabel = document.createElement('label');
            selectAllLabel.className = 'layer-checkbox';
            selectAllLabel.innerHTML =
                '<input type="checkbox" id="layer-geomorf-select-all">' +
                '<span class="checkmark"></span>' +
                '<strong>Ativar todas</strong>';
            container.appendChild(selectAllLabel);



            nomes.forEach(function (nome, indice) {







                const id = geomorfCheckboxId(nome);







                const cor = corGeomorfPorNome(nome);







                const label = document.createElement('label');







                label.className = 'layer-checkbox';







                label.innerHTML =







                    '<input type="checkbox" id="' +







                    id +







                    '">' +







                    '<span class="checkmark"></span>' +







                    '<span class="geomorf-swatch" style="background:' +







                    cor +







                    '"></span>' +







                    escapeHtmlPontos(nome);







                container.appendChild(label);







            });

            const selectAllCb = document.getElementById('layer-geomorf-select-all');
            if (selectAllCb) {
                selectAllCb.checked = false;
                selectAllCb.addEventListener('change', function () {
                    nomes.forEach(function (nome) {
                        const cb = document.getElementById(geomorfCheckboxId(nome));
                        if (!cb) return;
                        cb.checked = selectAllCb.checked;
                        if (selectAllCb.checked) {
                            if (layers.geomorf[nome] && !map.hasLayer(layers.geomorf[nome])) {
                                layers.geomorf[nome].addTo(map);
                            }
                        } else {
                            if (layers.geomorf[nome] && map.hasLayer(layers.geomorf[nome])) {
                                map.removeLayer(layers.geomorf[nome]);
                            }
                        }
                    });
                    bringDataLayersToFront();
                });
            }

            nomes.forEach(function (nome) {







                const id = geomorfCheckboxId(nome);







                const cb = document.getElementById(id);







                if (cb) {







                    cb.checked = false;







                    cb.addEventListener('change', function () {







                        if (this.checked) {







                            if (layers.geomorf[nome]) {







                                layers.geomorf[nome].addTo(map);







                                bringDataLayersToFront();







                            }







                        } else if (layers.geomorf[nome]) {







                            map.removeLayer(layers.geomorf[nome]);







                        }







                        if (selectAllCb) {
                            const allChecked = nomes.every(function (nomeAtual) {
                                const cbAtual = document.getElementById(geomorfCheckboxId(nomeAtual));
                                return cbAtual && cbAtual.checked;
                            });
                            selectAllCb.checked = allChecked;
                        }







                    });







                }







            });







            console.log('[Geomorf] Domínios carregados:', nomes.length);







        })







        .catch(function (err) {







            alert('Erro ao carregar Geomorfologia: ' + err.message);







            console.error(err);







        });







}















function updatePointLabels() {







    if (!map) return;







    const el = document.getElementById('layer-pontos');







    const pontosChecked = el && el.checked;







    if (!layers.pointLabels) return;







    layers.pointLabels.forEach(function (label) {







        if (pontosChecked) {







            if (!map.hasLayer(label)) label.addTo(map);







        } else if (map.hasLayer(label)) {







            map.removeLayer(label);







        }







    });







}















function loadSolos() {







    fetch('data/solos_tcl.geojson')







        .then(resp => resp.json())







        .then(data => {







            // Mapear por ordem e subordem







            const solos = {};







            data.features.forEach(feature => {







                const ordem = feature.properties && feature.properties.ordem;







                const subordem = feature.properties && feature.properties.subordem;







                if (ordem && subordem) {







                    if (!solos[ordem]) solos[ordem] = {};







                    if (!solos[ordem][subordem]) solos[ordem][subordem] = [];







                    solos[ordem][subordem].push(feature);







                }







            });







            // Criar layers para cada subordem







            layers.solos = {};







            console.log('=== INICIANDO PROCESSAMENTO DE SOLOS ===');







            Object.keys(solos).forEach(ordem => {







                console.log(`Processando ordem: ${ordem}`);







                Object.keys(solos[ordem]).forEach(subordem => {







                    const key = `${ordem}||${subordem}`;







                    const ordemNorm = ordem.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[-\s]/g, '').toUpperCase();







                    const subordemNorm = subordem.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[-\s]/g, '').toUpperCase();







                    console.log('Testando bloco:', ordem, subordem, '|', ordemNorm, subordemNorm);







                    console.log('Criando layer para:', ordem, subordem);







                    // Bloco ESPECÍFICO: PLANOSSOLO HÁPLICO







                    if (ordemNorm === 'PLANOSSOLO' && subordemNorm === 'HAPLICO') {







                        const style = {







                            fill: true,







                            fillColor: '#FFE6B4', // Bege claro







                            fillOpacity: 1,







                            color: 'transparent',







                            weight: 0







                        };







                        console.log('>> BLOCO PLANOSSOLO HÁPLICO', ordem, subordem);







                        console.log(`  ✓ Aplicando cor ESPECIAL para PLANOSSOLO HÁPLICO | Style:`, style);







                        layers.solos[key] = L.geoJSON({type: 'FeatureCollection', features: solos[ordem][subordem]}, {







                            style: style,







                            onEachFeature: function (feature, layer) {







                                layer.setStyle(style);







                            }







                        });







                    }







                    // Bloco ESPECÍFICO: PLANOSSOLO NÁTRICO







                    else if (ordemNorm === 'PLANOSSOLO' && subordemNorm === 'NATRICO') {







                        const style = {







                            fill: true,







                            fillColor: '#E0E0E0', // Cinza claro







                            fillOpacity: 1,







                            color: 'transparent',







                            weight: 0







                        };







                        console.log('>> BLOCO PLANOSSOLO NÁTRICO', ordem, subordem);







                        console.log(`  ✓ Aplicando cor ESPECIAL para PLANOSSOLO NÁTRICO | Style:`, style);







                        layers.solos[key] = L.geoJSON({type: 'FeatureCollection', features: solos[ordem][subordem]}, {







                            style: style,







                            onEachFeature: function (feature, layer) {







                                layer.setStyle(style);







                            }







                        });







                    }







                    // Bloco ESPECÍFICO: GLEISSOLO HÁPLICO







                    else if (ordemNorm === 'GLEISSOLO' && subordemNorm === 'HAPLICO') {







                        const style = {







                            fill: true,







                            fillColor: '#99CCFF', // Azul claro







                            fillOpacity: 1,







                            color: 'transparent',







                            weight: 0







                        };







                        console.log('>> BLOCO GLEISSOLO HÁPLICO', ordem, subordem);







                        console.log(`  ✓ Aplicando cor ESPECIAL para GLEISSOLO HÁPLICO | Style:`, style);







                        layers.solos[key] = L.geoJSON({type: 'FeatureCollection', features: solos[ordem][subordem]}, {







                            style: style,







                            onEachFeature: function (feature, layer) {







                                layer.setStyle(style);







                            }







                        });







                    }







                    // Bloco ESPECÍFICO: GLEISSOLO SÁLICO







                    else if (ordemNorm === 'GLEISSOLO' && subordemNorm === 'SALICO') {







                        const style = {







                            fill: true,







                            fillColor: '#CCFFFF', // Azul muito claro







                            fillOpacity: 1,







                            color: 'transparent',







                            weight: 0







                        };







                        console.log('>> BLOCO GLEISSOLO SÁLICO', ordem, subordem);







                        console.log(`  ✓ Aplicando cor ESPECIAL para GLEISSOLO SÁLICO | Style:`, style);







                        layers.solos[key] = L.geoJSON({type: 'FeatureCollection', features: solos[ordem][subordem]}, {







                            style: style,







                            onEachFeature: function (feature, layer) {







                                layer.setStyle(style);







                            }







                        });







                    }







                    // Bloco ESPECÍFICO: GLEISSOLO TIOMÓRFICO







                    else if (ordemNorm === 'GLEISSOLO' && subordemNorm === 'TIOMORFICO') {







                        const style = {







                            fill: true,







                            fillColor: '#606080', // Cinza azulado escuro







                            fillOpacity: 1,







                            color: 'transparent',







                            weight: 0







                        };







                        console.log('>> BLOCO GLEISSOLO TIOMÓRFICO', ordem, subordem);







                        console.log(`  ✓ Aplicando cor ESPECIAL para GLEISSOLO TIOMÓRFICO | Style:`, style);







                        layers.solos[key] = L.geoJSON({type: 'FeatureCollection', features: solos[ordem][subordem]}, {







                            style: style,







                            onEachFeature: function (feature, layer) {







                                layer.setStyle(style);







                            }







                        });







                    }







                    // Bloco de decisão único para simbologia dos solos







                    else if (ordemNorm === 'ESPODOSSOLO' && subordemNorm === 'FERRIHUMILUVICO') {







                        console.log('>> BLOCO ESPODOSSOLO FERRI-HUMILÚVICO');







                        const style = {







                            fill: true,







                            fillColor: '#A52A2A', // Marrom







                            fillOpacity: 1,







                            color: 'transparent',







                            weight: 0







                        };







                        console.log(`  ✓ Aplicando cor ESPECIAL para ESPODOSSOLO FERRI-HUMILÚVICO | Style:`, style);







                        layers.solos[key] = L.geoJSON({type: 'FeatureCollection', features: solos[ordem][subordem]}, {







                            style: style,







                            onEachFeature: function (feature, layer) {







                                layer.setStyle(style);







                            }







                        });







                    } else if (ordemNorm === 'ESPODOSSOLO' && subordemNorm === 'HUMILUVICO') {







                        const style = {







                            fill: true,







                            fillColor: '#404040', // Cinza escuro







                            fillOpacity: 1,







                            color: 'transparent',







                            weight: 0







                        };







                        console.log('>> BLOCO ESPODOSSOLO HUMILÚVICO', ordem, subordem);







                        console.log(`  ✓ Aplicando cor ESPECIAL para ESPODOSSOLO HUMILÚVICO | Style:`, style);







                        layers.solos[key] = L.geoJSON({type: 'FeatureCollection', features: solos[ordem][subordem]}, {







                            style: style,







                            onEachFeature: function (feature, layer) {







                                layer.setStyle(style);







                            }







                        });







                    } else if (ordemNorm === 'ARGISSOLO' && subordemNorm === 'VERMELHOAMARELO') {







                        const style = {







                            fill: true,







                            fillColor: '#FFB266', // Laranja claro







                            fillOpacity: 1,







                            color: 'transparent',







                            weight: 0







                        };







                        console.log('>> BLOCO ARGISSOLO VERMELHO-AMARELO', ordem, subordem);







                        console.log(`  ✓ Aplicando cor ESPECIAL para ARGISSOLO VERMELHO-AMARELO | Style:`, style);







                        layers.solos[key] = L.geoJSON({type: 'FeatureCollection', features: solos[ordem][subordem]}, {







                            style: style,







                            onEachFeature: function (feature, layer) {







                                layer.setStyle(style);







                            }







                        });







                    } else if (ordemNorm === 'ARGISSOLO' && subordemNorm === 'AMARELO') {







                        const style = {







                            fill: true,







                            fillColor: '#FFFF66', // Amarelo







                            fillOpacity: 1,







                            color: 'transparent',







                            weight: 0







                        };







                        console.log('>> BLOCO ARGISSOLO AMARELO', ordem, subordem);







                        console.log(`  ✓ Aplicando cor ESPECIAL para ARGISSOLO AMARELO | Style:`, style);







                        layers.solos[key] = L.geoJSON({type: 'FeatureCollection', features: solos[ordem][subordem]}, {







                            style: style,







                            onEachFeature: function (feature, layer) {







                                layer.setStyle(style);







                            }







                        });







                    } else if (ordemNorm === 'ARGISSOLO' && subordemNorm === 'VERMELHO') {







                        const style = {







                            fill: true,







                            fillColor: '#CC6666', // Vermelho







                            fillOpacity: 1,







                            color: 'transparent',







                            weight: 0







                        };







                        console.log('>> BLOCO ARGISSOLO VERMELHO', ordem, subordem);







                        console.log(`  ✓ Aplicando cor ESPECIAL para ARGISSOLO VERMELHO | Style:`, style);







                        layers.solos[key] = L.geoJSON({type: 'FeatureCollection', features: solos[ordem][subordem]}, {







                            style: style,







                            onEachFeature: function (feature, layer) {







                                layer.setStyle(style);







                            }







                        });







                    } else if (ordemNorm === 'ARGISSOLO') {







                        const style = {







                            color: 'transparent',







                            weight: 0,







                            fill: true,







                            fillColor: '#008000', // Verde padrão







                            fillOpacity: 1







                        };







                        console.log('>> BLOCO ARGISSOLO GENÉRICO', ordem, subordem);







                        console.log(`  ✓ Aplicando cor VERDE para ARGISSOLO (${subordem}) | Style:`, style);







                        layers.solos[key] = L.geoJSON({type: 'FeatureCollection', features: solos[ordem][subordem]}, {







                            style: style







                        });







                    } else if (subordemNorm === 'LITOLICO') {







                        const style = {







                            color: 'transparent',







                            weight: 0,







                            fill: true,







                            fillColor: '#4D4D4D',







                            fillOpacity: 1







                        };







                        console.log('>> BLOCO LITÓLICO', ordem, subordem);







                        layers.solos[key] = L.geoJSON({type: 'FeatureCollection', features: solos[ordem][subordem]}, {







                            style: style







                        });







                    } else if (subordemNorm === 'QUARTZARENICO') {







                        const style = {







                            color: 'transparent',







                            weight: 0,







                            fill: true,







                            fillColor: '#FFFF99',







                            fillOpacity: 1







                        };







                        console.log('>> BLOCO QUARTZARÊNICO', ordem, subordem);







                        layers.solos[key] = L.geoJSON({type: 'FeatureCollection', features: solos[ordem][subordem]}, {







                            style: style







                        });







                    } else if (subordemNorm === 'REGOLITICO') {







                        const style = {







                            color: 'transparent',







                            weight: 0,







                            fill: true,







                            fillColor: '#D2B48C',







                            fillOpacity: 1







                        };







                        console.log('>> BLOCO REGOLÍTICO', ordem, subordem);







                        layers.solos[key] = L.geoJSON({type: 'FeatureCollection', features: solos[ordem][subordem]}, {







                            style: style







                        });







                    } else if (subordemNorm === 'VERMELHOAMARELO') {







                        const style = {







                            color: 'transparent',







                            weight: 0,







                            fill: true,







                            fillColor: '#FFB266', // Laranja claro







                            fillOpacity: 1







                        };







                        console.log('>> BLOCO VERMELHO-AMARELO GERAL', ordem, subordem);







                        layers.solos[key] = L.geoJSON({type: 'FeatureCollection', features: solos[ordem][subordem]}, {







                            style: style







                        });







                    } else if (subordemNorm === 'VERMELHO') {







                        const style = {







                            color: 'transparent',







                            weight: 0,







                            fill: true,







                            fillColor: '#CC3300',







                            fillOpacity: 1







                        };







                        console.log('>> BLOCO VERMELHO GERAL', ordem, subordem);







                        layers.solos[key] = L.geoJSON({type: 'FeatureCollection', features: solos[ordem][subordem]}, {







                            style: style







                        });







                    } else if (subordemNorm === 'AMARELO') {







                        const style = {







                            color: 'transparent',







                            weight: 0,







                            fill: true,







                            fillColor: '#FFFF66', // Amarelo claro







                            fillOpacity: 1







                        };







                        console.log('>> BLOCO AMARELO GERAL', ordem, subordem);







                        layers.solos[key] = L.geoJSON({type: 'FeatureCollection', features: solos[ordem][subordem]}, {







                            style: style







                        });







                    } else {







                        const style = {







                            color: '#008000',







                            weight: 1.5,







                            fill: false







                        };







                        console.log('>> BLOCO PADRÃO', ordem, subordem);







                        layers.solos[key] = L.geoJSON({type: 'FeatureCollection', features: solos[ordem][subordem]}, {







                            style: style







                        });







                    }







                    // Bloco ESPECÍFICO: LUVISSOLO CRÔMICO







                    if (ordemNorm === 'LUVISSOLO' && subordemNorm === 'CROMICO') {







                        const style = {







                            fill: true,







                            fillColor: '#CC3300', // Vermelho escuro







                            fillOpacity: 1,







                            color: 'transparent',







                            weight: 0







                        };







                        console.log('>> BLOCO LUVISSOLO CRÔMICO', ordem, subordem);







                        console.log(`  ✓ Aplicando cor ESPECIAL para LUVISSOLO CRÔMICO | Style:`, style);







                        layers.solos[key] = L.geoJSON({type: 'FeatureCollection', features: solos[ordem][subordem]}, {







                            style: style,







                            onEachFeature: function (feature, layer) {







                                layer.setStyle(style);







                            }







                        });







                    }







                    // Bloco ESPECÍFICO: LUVISSOLO HÁPLICO







                    else if (ordemNorm === 'LUVISSOLO' && subordemNorm === 'HAPLICO') {







                        const style = {







                            fill: true,







                            fillColor: '#D28C69', // Bege avermelhado







                            fillOpacity: 1,







                            color: 'transparent',







                            weight: 0







                        };







                        console.log('>> BLOCO LUVISSOLO HÁPLICO', ordem, subordem);







                        console.log(`  ✓ Aplicando cor ESPECIAL para LUVISSOLO HÁPLICO | Style:`, style);







                        layers.solos[key] = L.geoJSON({type: 'FeatureCollection', features: solos[ordem][subordem]}, {







                            style: style,







                            onEachFeature: function (feature, layer) {







                                layer.setStyle(style);







                            }







                        });







                    }







                    // Bloco ESPECÍFICO: VERTISSOLO HÁPLICO







                    if (ordemNorm === 'VERTISSOLO' && subordemNorm === 'HAPLICO') {







                        const style = {







                            fill: true,







                            fillColor: '#808080', // Cinza







                            fillOpacity: 1,







                            color: 'transparent',







                            weight: 0







                        };







                        console.log('>> BLOCO VERTISSOLO HÁPLICO', ordem, subordem);







                        console.log(`  ✓ Aplicando cor ESPECIAL para VERTISSOLO HÁPLICO | Style:`, style);







                        layers.solos[key] = L.geoJSON({type: 'FeatureCollection', features: solos[ordem][subordem]}, {







                            style: style,







                            onEachFeature: function (feature, layer) {







                                layer.setStyle(style);







                            }







                        });







                    }







                    // Bloco ESPECÍFICO: VERTISSOLO ÉBÂNICO







                    else if (ordemNorm === 'VERTISSOLO' && subordemNorm === 'EBANICO') {







                        const style = {







                            fill: true,







                            fillColor: '#333333', // Cinza escuro







                            fillOpacity: 1,







                            color: 'transparent',







                            weight: 0







                        };







                        console.log('>> BLOCO VERTISSOLO ÉBÂNICO', ordem, subordem);







                        console.log(`  ✓ Aplicando cor ESPECIAL para VERTISSOLO ÉBÂNICO | Style:`, style);







                        layers.solos[key] = L.geoJSON({type: 'FeatureCollection', features: solos[ordem][subordem]}, {







                            style: style,







                            onEachFeature: function (feature, layer) {







                                layer.setStyle(style);







                            }







                        });







                    }







                    // Bloco ESPECÍFICO: CAMBISSOLO HÁPLICO







                    if (ordemNorm === 'CAMBISSOLO' && subordemNorm === 'HAPLICO') {







                        const style = {







                            fill: true,







                            fillColor: '#BE8C64', // Bege médio







                            fillOpacity: 1,







                            color: 'transparent',







                            weight: 0







                        };







                        console.log('>> BLOCO CAMBISSOLO HÁPLICO', ordem, subordem);







                        console.log(`  ✓ Aplicando cor ESPECIAL para CAMBISSOLO HÁPLICO | Style:`, style);







                        layers.solos[key] = L.geoJSON({type: 'FeatureCollection', features: solos[ordem][subordem]}, {







                            style: style,







                            onEachFeature: function (feature, layer) {







                                layer.setStyle(style);







                            }







                        });







                    }







                    // Bloco ESPECÍFICO: CHERNOSSOLO ARGILÚVICO







                    if (ordemNorm === 'CHERNOSSOLO' && subordemNorm === 'ARGILUVICO') {







                        const style = {







                            fill: true,







                            fillColor: '#553C28', // Marrom escuro







                            fillOpacity: 1,







                            color: 'transparent',







                            weight: 0







                        };







                        console.log('>> BLOCO CHERNOSSOLO ARGILÚVICO', ordem, subordem);







                        console.log(`  ✓ Aplicando cor ESPECIAL para CHERNOSSOLO ARGILÚVICO | Style:`, style);







                        layers.solos[key] = L.geoJSON({type: 'FeatureCollection', features: solos[ordem][subordem]}, {







                            style: style,







                            onEachFeature: function (feature, layer) {







                                layer.setStyle(style);







                            }







                        });







                    }







                });







            });







            console.log('=== FIM DO PROCESSAMENTO DE SOLOS ===');







            // Gerar painel dinâmico







            let container = document.getElementById('solos-checkbox-list');







            if (!container) {







                // Criar painel se não existir







                const sidebar = document.querySelector('.sidebar .layer-controls');







                const section = document.createElement('div');







                section.className = 'sidebar-section collapsible';







                section.innerHTML = `







                    <h4 class=\"collapsible-header\" style=\"font-size: 1rem; margin: 0; padding: 5px 0 5px 0; cursor: pointer; text-align: left; font-weight: 500; display: flex; align-items: center; gap: 8px; justify-content: flex-start;\">







                        <i class=\"fas fa-tree\"></i>

                        <i class=\"fas fa-chevron-down\"></i>







                        <span>Classes de Solos</span>







                    </h4>







                    <div class=\"collapsible-content\" id=\"solos-checkbox-list\" style=\"display: none; flex-direction: column; gap: 8px; margin-left: 10px;\"></div>







                `;







                sidebar.appendChild(section);







                // Ativar expansão/retração do painel geral







                section.querySelector('.collapsible-header').addEventListener('click', function() {







                    const content = section.querySelector('.collapsible-content');







                    const icon = section.querySelector('.fa-chevron-down, .fa-chevron-up');







                    if (content.style.display === 'none' || content.style.display === '') {







                        content.style.display = 'flex';







                        icon.classList.remove('fa-chevron-down');







                        icon.classList.add('fa-chevron-up');







                    } else {







                        content.style.display = 'none';







                        icon.classList.remove('fa-chevron-up');







                        icon.classList.add('fa-chevron-down');







                    }







                });







                container = section.querySelector('#solos-checkbox-list');







            }







            container.innerHTML = '';







            // Para cada ordem, criar painel expansível







            Object.keys(solos).forEach(ordem => {







                const ordemId = `ordem-${ordem.replace(/\s+/g, '-').toLowerCase()}`;







                const ordemSection = document.createElement('div');







                ordemSection.className = 'sidebar-section collapsible';







                ordemSection.innerHTML = `







                    <h5 class=\"collapsible-header\" style=\"font-size: 0.98rem; margin: 0; padding: 4px 0 4px 0; cursor: pointer; text-align: left; font-weight: 500; display: flex; align-items: center; gap: 8px; justify-content: flex-start;\">







                        <i class=\"fas fa-chevron-down\"></i>







                        <span>${ordem}</span>







                    </h5>







                    <div class=\"collapsible-content\" id=\"subordens-list-${ordemId}\" style=\"display: none; flex-direction: column; gap: 6px; margin-left: 10px;\"></div>







                `;







                container.appendChild(ordemSection);







                // Ativar expansão/retração da ordem







                ordemSection.querySelector('.collapsible-header').addEventListener('click', function() {







                    const content = ordemSection.querySelector('.collapsible-content');







                    const icon = ordemSection.querySelector('.fa-chevron-down, .fa-chevron-up');







                    if (content.style.display === 'none' || content.style.display === '') {







                        content.style.display = 'flex';







                        icon.classList.remove('fa-chevron-down');







                        icon.classList.add('fa-chevron-up');







                    } else {







                        content.style.display = 'none';







                        icon.classList.remove('fa-chevron-up');







                        icon.classList.add('fa-chevron-down');







                    }







                });







                // Adicionar checkbox 'Selecionar todos'







                const subContainer = ordemSection.querySelector('.collapsible-content');







                const selectAllId = `select-all-${ordemId}`;







                const selectAllLabel = document.createElement('label');







                selectAllLabel.className = 'layer-checkbox';







                selectAllLabel.innerHTML = `<input type="checkbox" id="${selectAllId}"><span class="checkmark"></span><strong>Selecionar todos</strong>`;







                subContainer.appendChild(selectAllLabel);







                // Adicionar checkboxes das subordens







                Object.keys(solos[ordem]).forEach(subordem => {







                    const key = `${ordem}||${subordem}`;







                    const id = `layer-solo-${ordem.replace(/\s+/g, '-').toLowerCase()}-${subordem.replace(/\s+/g, '-').toLowerCase()}`;







                    const label = document.createElement('label');







                    label.className = 'layer-checkbox';







                    label.innerHTML = `<input type="checkbox" id="${id}"><span class="checkmark"></span>${subordem}`;







                    subContainer.appendChild(label);







                });







            });







            // Listeners para cada subordem e para o 'Selecionar todos'







            Object.keys(solos).forEach(ordem => {







                const ordemId = `ordem-${ordem.replace(/\s+/g, '-').toLowerCase()}`;







                const selectAllId = `select-all-${ordemId}`;







                const subordemIds = Object.keys(solos[ordem]).map(subordem => `layer-solo-${ordem.replace(/\s+/g, '-').toLowerCase()}-${subordem.replace(/\s+/g, '-').toLowerCase()}`);







                // Listener do 'Selecionar todos'







                const selectAllCb = document.getElementById(selectAllId);







                if (selectAllCb) {







                    selectAllCb.checked = false;







                    selectAllCb.addEventListener('change', function() {







                        subordemIds.forEach(id => {







                            const cb = document.getElementById(id);







                            if (cb) {







                                cb.checked = selectAllCb.checked;







                                const key = cb.getAttribute('id').replace('layer-solo-', '').split('-');







                                // Reconstruir ordem e subordem a partir do id







                                let ordemKey = ordem.replace(/\s+/g, '-').toLowerCase();







                                let subordemKey = key.slice(ordemKey.split('-').length).join('-');







                                // Procurar subordem original







                                let subordemOriginal = Object.keys(solos[ordem]).find(s => s.replace(/\s+/g, '-').toLowerCase() === subordemKey);







                                let fullKey = `${ordem}||${subordemOriginal}`;







                                if (selectAllCb.checked) {







                                    if (layers.solos[fullKey] && !map.hasLayer(layers.solos[fullKey])) map.addLayer(layers.solos[fullKey]);







                                } else {







                                    if (layers.solos[fullKey] && map.hasLayer(layers.solos[fullKey])) map.removeLayer(layers.solos[fullKey]);







                                }







                            }







                        });







                    });







                }







                // Listeners para cada subordem







                Object.keys(solos[ordem]).forEach(subordem => {







                    const key = `${ordem}||${subordem}`;







                    const id = `layer-solo-${ordem.replace(/\s+/g, '-').toLowerCase()}-${subordem.replace(/\s+/g, '-').toLowerCase()}`;







                    const cb = document.getElementById(id);







                    if (cb) {







                        cb.checked = false;







                        cb.addEventListener('change', function() {







                            if (this.checked) {







                                if (layers.solos[key]) map.addLayer(layers.solos[key]);







                            } else {







                                if (layers.solos[key]) map.removeLayer(layers.solos[key]);







                            }







                            // Atualizar o 'Selecionar todos' conforme o estado das subordens







                            const allChecked = subordemIds.every(id2 => document.getElementById(id2).checked);







                            selectAllCb.checked = allChecked;







                        });







                    }







                });







            });







        })







        .catch(err => {







            alert('Erro ao carregar Classes de Solos: ' + err.message);







            console.error(err);







        });







}