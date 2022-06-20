/*global google, markerWithLabel */

let north;
let south;
let east;
let west;

async function getCSV() {
    const url = "../castles.csv";

    const castles = await fetch(url)
        .then(response => {
            // 応答がOKでなければ
            if (!response.ok) {
                // 例外を投げる
                throw new Error("応答がOKではありません。");
            }
            // テキストデータを返す
            return response.text();
        })
        .then(text => {
            // csvの処理結果を返す
            return processText(text);
        })
        .catch(error => {
            // エラーをコンソールに表示
            console.error("取得する操作でエラーが発生しました: ", error);
        });

    return castles;
}

function processText(text) {
    let castles = {};
    let lines = text.split(/\r\n|\r|\n/);

    let i = 0;
    while (i < lines.length) {
        if (i >= 2) {
            let castle = processLine(lines[i]);
            castles[castle["No."]] = castle;
        }
        i = i + 1;
    }
    return castles;
}

function processLine(line) {
    if (line.length > 0) {
        const items = line.split(",");
        let castle = {};
        castle["No."] = parseInt(items[1], 10);
        castle["城館"] = {};
        castle["城館"]["名称"] = items[2];
        castle["城館"]["ヨミ"] = items[3];
        castle["城館"]["所在地"] = items[4];
        castle["破却書"] = {};
        castle["破却書"]["記載"] = items[5];
        castle["破却書"]["名称"] = items[6];
        castle["破却書"]["郡名"] = items[7];
        castle["破却書"]["分類"] = items[8];
        castle["破却書"]["存廃"] = items[9];
        castle["破却書"]["城主・代官"] = items[10];
        castle["城主"] = items[11];
        castle["年代"] = items[12];
        castle["概要"] = items[13];
        castle["現況"] = items[14];
        castle["指定"] = items[15];
        castle["所在地"] = items[16];
        castle["緯度"] = parseFloat(items[17]);
        castle["経度"] = parseFloat(items[18]);
        castle["写真"] = items[19];
        return castle;
    }
}

function escapeSpecialChars(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeHTML(strings, ...values) {
    return strings.reduce((result, str, i) => {
        const value = values[i - 1];
        if (typeof value === "string") {
            return result + escapeSpecialChars(value) + str;
        } else {
            return result + String(value) + str;
        }
    });
}

function createCastlesTable(element, castles, abandoned) {
    const view1 = escapeHTML`
<table class="table table-striped table-bordered">
    <thead>
        <tr><th>No</th><th>名称</th><th>ヨミ</th><th>所在地</th></tr>
    </thead>
    <tbody>
`;
    let html = view1;

    for (let index of Object.keys(castles)) {
        if (abandoned === "abandoned" && index > 48) {
            break;
        }
        let castle = castles[index];
        let view = escapeHTML`
<tr>
    <td>${castle["No."]}</td>
    <td><a href="../castles/show.html?id=${castle["No."]}">${castle["城館"]["名称"]}</a></td>
    <td>${castle["城館"]["ヨミ"]}</td>
    <td>${castle["城館"]["所在地"]}</td>
</tr>
`;
        html += view;
    }

    const view2 = escapeHTML`
    </tbody>
</table>
`;
    html += view2;

    element.innerHTML = html;
}

function createCastleTable(element, castle) {
    document.title = castle["城館"]["名称"] + ": 戦国南部氏の城めぐりアプリ";
    document.querySelector("meta[property=\"og:title\"]").content = castle["城館"]["名称"] + ": 戦国南部氏の城めぐりアプリ";
    document.querySelector("meta[property=\"og:url\"]").content += "?id=" + getId();
    
    const view1 = escapeHTML`
<h1 id="page-name">${castle["城館"]["名称"]} <small class="h3">(${castle["城館"]["ヨミ"]})</small></h1>
<div class="table-responsive">
      <table class="table table-striped table-bordered">
        <tbody>
          <tr><th scope="row" style="width: 7em;">名称</th><td>${castle["城館"]["名称"]}</td></tr>
          <tr><th scope="row">所在地</th><td>${castle["城館"]["所在地"]}</td></tr>
          <tr><th scope="row">城主</th><td>${castle["城主"]}</td></tr>
          <tr><th scope="row">年代</th><td>${castle["年代"]}</td></tr>
          <tr><th scope="row">概要</th><td>${castle["概要"]}</td></tr>
          <tr><th scope="row">現況</th><td>${castle["現況"]}</td></tr>
          <tr><th scope="row">指定</th><td>${castle["指定"]}</td></tr>  
        </tbody>
      </table>
    </div>
`;

    const view2 = escapeHTML`
    <h2>諸城破却書上の記載</h2>
    <div class="table-responsive">
      <table class="table table-striped table-bordered">
        <tbody>
          <tr><th scope="row" style="width: 7em;">名称</th><td>${castle["破却書"]["名称"]}</td></tr>
          <tr><th scope="row">郡名</th><td>${castle["破却書"]["郡名"]}</td></tr>
          <tr><th scope="row">分類</th><td>${castle["破却書"]["分類"]}</td></tr>
          <tr><th scope="row">存廃</th><td>${castle["破却書"]["存廃"]}</td></tr>
          <tr><th scope="row">城主・代官</th><td>${castle["破却書"]["城主・代官"]}</td></tr>
        </tbody>
      </table>
    </div>
</div>
`;

    element.innerHTML = view1 + view2;
}

function createCastleFigure(element, castle) {
    if (castle["写真"]) {
        const view = escapeHTML`
        <figure class="figure" style="margin: 0 auto;">
            <img src="../images/${castle["写真"]}" class="figure-img img-fluid rounded" alt="${castle["城館"]["名称"]}">
            <figcaption class="figure-caption text-center">${castle["城館"]["名称"]}</figcaption>
        </figure>
`;
        element.innerHTML = view;
        element.style.display = "block";
    }
}

function initMap(id) {
    // マップの生成
    const map = new google.maps.Map(document.getElementById(id), {
        zoom: 7,
        center: {
            lat: 40.284735,
            lng: 141.049935
        }
    });
    return map;
}

function addMarkers(map, castles) {
    for (let index of Object.keys(castles)) {
        const castle = castles[index];
        addMarker(map, castle);
    }

    map.fitBounds({east: east, west: west, south: south, north: north});
}

function refreshLatLngBounds(lat, lng) {
    if (typeof north === "undefined" || north < lat) {
        north = lat;
    }
    if (typeof south === "undefined" || south > lat) {
        south = lat;
    }
    if (typeof east === "undefined" || east < lng) {
        east = lng;
    }
    if (typeof west === "undefined" || west > lng) {
        west = lng;
    }  
}

function addMarker(map, castle) {
    const id = parseInt(castle["No."], 10);
    const lat = parseFloat(castle["緯度"]);
    const lng = parseFloat(castle["経度"]);
  
    refreshLatLngBounds(lat, lng);
  
    const marker = new markerWithLabel.MarkerWithLabel({
        position: {
            lat: lat,
            lng: lng
        },
        labelContent: castle["城館"]["名称"],
        labelAnchor: new google.maps.Point(15, -30),
        labelClass: "labels",
        map: map
    });

    google.maps.event.addListener(marker, "click", (() => {
        const url = "../castles/show.html?id=" + id;
        return () => {
            location.href = url;
        };
    })());
}

function getId() {
    const params = new URLSearchParams(document.location.search.substring(1));
    const id = parseInt(params.get("id"), 10);
    return id;
}

function getAction() {
    const pathname = document.location.pathname;
    let action;
    switch (pathname) {
        case "/nanbu-castles-tours/castles/":
        case "/castles/":
                action = mainCastlesIndex;
            break;
        case "/nanbu-castles-tours/castles/show.html":
        case "/castles/show.html":
            action = mainCastlesShow;
            break;
        case "/nanbu-castles-tours/map/":
        case "/map/":
                action = mainMap;
                break;    
        default:
            break;
    }
    return action;
}

// /castles/index CSV→一覧表
function mainCastlesIndex() {
    const element = document.getElementById("castles");
    getCSV().then((castles) => {
        createCastlesTable(element, castles);
    });
}

// /castles/show 地図→IDチェック→CSV→マーカー1つ追加→個別表
function mainCastlesShow() {
    const id = getId();
    if (!id) {
        location.href = "../castles/";
    }
    const map = initMap("map");
    const tableElement = document.getElementById("castle");
    const figureElement = document.getElementById("castle-figure");
    getCSV().then((castles) => {
        const castle = castles[id];
        addMarker(map, castle);
        createCastleTable(tableElement, castle);
        createCastleFigure(figureElement, castle);
    });
}

// /map 地図→CSV→マーカー全部追加→一覧表
function mainMap() {
    const map = initMap("map");
    getCSV().then((castles) => {
        addMarkers(map, castles);
    });
}

function main() {
    const action = getAction();
    if (action) {
        action();
    }
}

if (!document.getElementById("map")) {
    main();
}
