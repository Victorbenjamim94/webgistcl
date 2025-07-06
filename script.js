// Variáveis globais
let map;
let currentBasemap = 'osm';
let layers = { soloClasses: {} };
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
    loadPontos();
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
    if (layers.limiteTotal && map.hasLayer(layers.limiteTotal)) {
        layers.limiteTotal.bringToFront();
    }
    if (layers.limiteZonas && map.hasLayer(layers.limiteZonas)) {
        layers.limiteZonas.bringToFront();
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
                    map.addLayer(layers.limiteTotal);
                    bringDataLayersToFront();
                } else {
                    map.removeLayer(layers.limiteTotal);
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
            if (this.checked) {
                if (layers.pontos && !map.hasLayer(layers.pontos)) map.addLayer(layers.pontos);
            } else {
                if (layers.pontos && map.hasLayer(layers.pontos)) map.removeLayer(layers.pontos);
            }
            updatePointLabels();
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
    if (!document.fullscreenElement) {
        if (container.requestFullscreen) {
            container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) { // Safari
            container.webkitRequestFullscreen();
        } else if (container.msRequestFullscreen) { // IE11
            container.msRequestFullscreen();
        }
        btn.innerHTML = '<i class="fas fa-compress"></i> Sair da Tela Cheia';
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { // Safari
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { // IE11
            document.msExitFullscreen();
        }
        btn.innerHTML = '<i class="fas fa-expand"></i> Tela Cheia';
    }
    // Redimensionar mapa
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
}

// Atualizar botão ao sair do modo tela cheia manualmente
if (document.fullscreenEnabled) {
    document.addEventListener('fullscreenchange', function() {
        const btn = document.getElementById('fullscreen-btn');
        if (!document.fullscreenElement) {
            btn.innerHTML = '<i class="fas fa-expand"></i> Tela Cheia';
            setTimeout(() => { map.invalidateSize(); }, 100);
        }
    });
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando WebGIS...');
    initMap();
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
            layers.limiteTotal = L.geoJSON(data, {
                style: {
                    color: '#ff0000',
                    weight: 3,
                    fill: false
                }
            });
            if (document.getElementById('layer-limite-total').checked) {
                layers.limiteTotal.addTo(map);
            }
        })
        .catch(err => {
            alert('Erro ao carregar Limite Total: ' + err.message);
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
            // Criar layers para cada região
            layers.zonas = {};
            layers.zonasLabels = {};
            Object.keys(regioes).forEach(nome => {
                // Polígono
                layers.zonas[nome] = L.geoJSON({type: 'FeatureCollection', features: regioes[nome]}, {
                    style: {
                        color: '#000',
                        weight: 1.5,
                        fill: false
                    }
                });
                // Centroide para o nome
                const feature = regioes[nome][0];
                let center = null;
                if (feature.geometry.type === 'Polygon') {
                    const coords = feature.geometry.coordinates[0];
                    let x = 0, y = 0;
                    coords.forEach(c => { x += c[0]; y += c[1]; });
                    x /= coords.length; y /= coords.length;
                    center = [y, x];
                } else if (feature.geometry.type === 'MultiPolygon') {
                    // Pega o maior polígono
                    let maxPoly = feature.geometry.coordinates[0];
                    feature.geometry.coordinates.forEach(poly => {
                        if (poly[0].length > maxPoly[0].length) maxPoly = poly;
                    });
                    const coords = maxPoly[0];
                    let x = 0, y = 0;
                    coords.forEach(c => { x += c[0]; y += c[1]; });
                    x /= coords.length; y /= coords.length;
                    center = [y, x];
                }
                if (center) {
                    layers.zonasLabels[nome] = L.marker(center, {
                        icon: L.divIcon({
                            className: '',
                            html: `<span style=\"color:#fff;font-size:12px;font-weight:bold;\">${nome}</span>`,
                            iconSize: [120, 24],
                            iconAnchor: [60, 12]
                        })
                    });
                }
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
                            if (layers.zonasLabels[nome]) map.addLayer(layers.zonasLabels[nome]);
                        } else {
                            if (layers.zonas[nome]) map.removeLayer(layers.zonas[nome]);
                            if (layers.zonasLabels[nome]) map.removeLayer(layers.zonasLabels[nome]);
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

// Carregar Pontos
function loadPontos() {
    fetch('data/pontos_tcl.geojson')
        .then(resp => resp.json())
        .then(data => {
            layers.pontos = L.geoJSON(data, {
                pointToLayer: function (feature, latlng) {
                    return L.circleMarker(latlng, {
                        radius: 3.5,
                        fillColor: '#ff0000',
                        color: '#ff0000',
                        weight: 0.5,
                        opacity: 1,
                        fillOpacity: 1
                    });
                },
                onEachFeature: function (feature, layer) {
                    if (feature.properties) {
                        layer.bindPopup(`<div class='popup-content'><h4>Ponto</h4><p><strong>Código:</strong> ${feature.properties.Codigo || 'N/A'}</p></div>`);
                    }
                }
            });
            // Rótulos dos pontos (texto preto, sem fundo, sem classe)
            layers.pointLabels = [];
            data.features.forEach(feature => {
                if (feature.properties && feature.properties.Codigo && feature.geometry) {
                    const coords = feature.geometry.coordinates;
                    const label = L.marker([coords[1], coords[0]], {
                        icon: L.divIcon({
                            className: '',
                            html: `<span style=\"color:#000;font-size:11px;font-weight:bold;\">${feature.properties.Codigo}</span>`,
                            iconSize: [60, 20],
                            iconAnchor: [30, 25]
                        })
                    });
                    layers.pointLabels.push(label);
                }
            });
            updatePointLabels();
        })
        .catch(err => {
            alert('Erro ao carregar Pontos: ' + err.message);
            console.error(err);
        });
}

function updatePointLabels() {
    const pontosChecked = document.getElementById('layer-pontos').checked;
    if (layers.pointLabels) {
        layers.pointLabels.forEach(label => {
            if (pontosChecked) {
                if (!map.hasLayer(label)) map.addLayer(label);
            } else {
                if (map.hasLayer(label)) map.removeLayer(label);
            }
        });
    }
}

L.tileLayer('https://tiles.opendem.info/tiles/asterh/{z}/{x}/{y}.png', {
    attribution: 'ASTER GDEM, OpenDEM',
    maxZoom: 15
}).addTo(map);

// NÃO expandir o painel de zonas por padrão
// Desmarcar todas as zonas ao iniciar
['sisal','baixo-sul','vale-jiquirica','piemonte-paraguacu','bacia-jacuipe','litoral-norte','portal-sertao','reconcavo','medio-rio-contas','metropolitano-salvador'].forEach(zona => {
    const cb = document.getElementById(`layer-zona-${zona}`);
    if (cb) cb.checked = false;
});

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