# WebGIS - Sistema de Informação Geográfica

Um sistema WebGIS moderno e responsivo desenvolvido com Leaflet, contendo 3 mapas de fundo funcionais.

## 🗺️ Características

### Mapas de Fundo Disponíveis
1. **OpenStreetMap** - Mapa base padrão com informações detalhadas
2. **Satélite** - Imagens de satélite de alta resolução (Esri World Imagery)
3. **Topográfico** - Mapa topográfico detalhado (Esri World Topo Map)

### Funcionalidades
- ✅ Interface moderna e responsiva
- ✅ 3 mapas de fundo totalmente funcionais
- ✅ Modo tela cheia
- ✅ Informações de coordenadas e escala
- ✅ Controles de zoom personalizados
- ✅ Debugging com console logs

## 📁 Estrutura do Projeto

```
Teste_01/
├── index.html          # Arquivo principal HTML
├── styles.css          # Estilos CSS
├── script.js           # JavaScript principal
├── README.md           # Documentação
├── data/               # Dados GeoJSON (não utilizados atualmente)
│   ├── tcl_limite_total.geojson
│   ├── tcl_limite_zonas.geojson
│   └── pontos_tcl.geojson
└── Projeto_WebGIS_Piloto.qgz
```

## 🚀 Como Usar

### 1. Abrir o Projeto
Abra o arquivo `index.html` em um navegador web moderno.

### 2. Navegar pelos Mapas de Fundo
- Use os botões na barra lateral para alternar entre os 3 mapas de fundo
- Cada mapa tem características específicas para diferentes tipos de análise

### 3. Ferramentas Disponíveis
- **Zoom In/Out**: Botões de zoom personalizados
- **Home**: Retorna à visualização inicial (Brasília)
- **Tela Cheia**: Modo de visualização em tela cheia

### 4. Informações do Mapa
- Coordenadas do cursor em tempo real
- Nível de zoom atual
- Escala aproximada

### 5. Debugging
- Abra o Console do navegador (F12) para ver logs detalhados
- Os logs mostram o progresso de inicialização

## 🛠️ Tecnologias Utilizadas

- **Leaflet 1.9.4** - Biblioteca JavaScript para mapas interativos
- **Font Awesome 6.4.0** - Ícones
- **CSS Grid** - Layout responsivo
- **JavaScript ES6+** - Funcionalidades interativas

## 🎨 Personalização

### Estilo Visual
- Interface moderna com gradientes
- Animações suaves
- Design responsivo para dispositivos móveis

## 🔧 Configuração Avançada

### Adicionar Novos Mapas de Fundo
Para adicionar um novo mapa de fundo, edite o objeto `basemaps` no arquivo `script.js`:

```javascript
const basemaps = {
    // ... mapas existentes ...
    novoMapa: {
        name: 'Nome do Mapa',
        url: 'URL_DO_TILE_SERVER/{z}/{x}/{y}.png',
        attribution: '© Atribuição',
        maxZoom: 19
    }
};
```

### Adicionar Camadas de Dados
Para adicionar camadas de dados GeoJSON, você pode implementar a função `loadGeoJSONData()` no arquivo `script.js`:

```javascript
async function loadGeoJSONData() {
    // Implementar carregamento de dados GeoJSON
    const response = await fetch('caminho/para/dados.geojson');
    const data = await response.json();
    
    const layer = L.geoJSON(data, {
        style: {
            color: '#cor_da_linha',
            weight: espessura,
            fillColor: '#cor_preenchimento',
            fillOpacity: opacidade
        }
    });
    
    layer.addTo(map);
}
```

## 🐛 Solução de Problemas

### Se o mapa não carregar:
1. Verifique se todos os arquivos estão na mesma pasta
2. Abra o Console do navegador (F12) para ver mensagens de erro
3. Certifique-se de que está usando um servidor web (não apenas abrindo o arquivo HTML)

### Para usar com servidor local:
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js
npx http-server
```

## 🌐 Compatibilidade

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Dispositivos móveis

## 📝 Licença

Este projeto é de uso livre para fins educacionais e de pesquisa.

## 🤝 Contribuições

Para contribuir com o projeto:
1. Faça um fork do repositório
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou problemas, entre em contato através dos canais disponíveis.

---

**Desenvolvido com ❤️ para análise geográfica e espacial** 