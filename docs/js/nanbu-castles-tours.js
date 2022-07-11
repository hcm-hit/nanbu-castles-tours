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
        const url = "../castles/" + id + ".html";
        return () => {
            location.href = url;
        };
    })());
}

function getId() {
    const pathname = document.location.pathname;
    // 「/」で区切った最後の要素がファイル名
    const filename = pathname.split("/").pop();
    // ファイル名の後ろの5文字「.html」を削除
    const id = filename.slice(0, -5);
    return id;
}

function getAction() {
    const pathname = document.location.pathname;
    let action;
    if (pathname.startsWith("/nanbu-castles-tours/castles/") || pathname.startsWith("/castles/")) {
        action = mainCastlesShow;
    } else if (pathname === "/nanbu-castles-tours/map/" || pathname === "/map/") {
        action = mainMap;
    }
    return action;
}

// /castles/show 地図→IDチェック→CSV→マーカー1つ追加→個別表
function mainCastlesShow() {
    const id = getId();
    if (!id) {
        location.href = "../castles/";
    }
    const map = initMap("map");
    getCSV().then((castles) => {
        const castle = castles[id];
        addMarker(map, castle);
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
