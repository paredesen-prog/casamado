(function () {
  var WALLS = [
    "M40 800 H0 V0 H1000 V800 H180",
    "M260 0 V120 M260 190 V300 H0",
    "M700 0 V110 M700 180 V300 H1000",
    "M700 300 V380 M700 450 V540 H1000",
    "M260 520 H420 M500 520 H700 V800 M260 520 V800",
    "M700 540 V800",
    "M180 800 V740"
  ];
  var FURNITURE =
    '<rect x="30" y="30" width="70" height="90" rx="30"/><rect x="30" y="170" width="70" height="90" rx="30"/><rect x="160" y="30" width="70" height="60"/>' +
    '<rect x="730" y="30" width="240" height="60"/><circle cx="850" cy="210" r="45"/>' +
    '<rect x="310" y="60" width="150" height="80"/><rect x="500" y="60" width="150" height="80"/><rect x="310" y="210" width="150" height="80"/><rect x="500" y="210" width="150" height="80"/><rect x="310" y="360" width="150" height="80"/><rect x="500" y="360" width="150" height="80"/>' +
    '<rect x="740" y="330" width="220" height="70"/><rect x="740" y="440" width="100" height="70"/>' +
    '<rect x="290" y="560" width="390" height="40"/><rect x="290" y="740" width="390" height="40"/><rect x="730" y="570" width="40" height="200"/><rect x="40" y="360" width="160" height="70"/>';
  var LABELS = [
    ["BAÑO", 130, 290, "middle"], ["ESCRITORIOS", 480, 470, "middle"], ["COCINA", 850, 290, "middle"],
    ["SALA TI", 850, 530, "middle"], ["BODEGA", 280, 690, "start"], ["DE ASEO", 280, 715, "start"],
    ["MANTENCIÓN", 850, 768, "middle"], ["RECEPCIÓN", 130, 520, "middle"]
  ];

  // Product base points (plan units) and visual height (plan units).
  var PRODUCTS = {
    tork:     { src: "assets/cutouts/image-66.png", x: 92, y: 205, h: 70, w: 156 },
    disp:     { src: "assets/cutouts/dispensador-jabon-multiflex-plastico-neg.png", x: 196, y: 222, h: 112, w: 62 },
    cafe:     { src: "assets/cutouts/haiti-cafe-molido-super-moka-bolsa-250gr.png", x: 780, y: 205, h: 118, w: 72 },
    galleta:  { src: "assets/cutouts/galleta-coco-120-gr.png", x: 905, y: 222, h: 48, w: 128 },
    papel:    { src: "assets/cutouts/papel-fotocopia-a4-500-hjs-75-gr-excelle.png", x: 420, y: 335, h: 118, w: 75 },
    cuaderno: { src: "assets/cutouts/cuaderno-universitario-7-mm100-hjs-1.png", x: 560, y: 318, h: 102, w: 85 },
    teclado:  { src: "assets/cutouts/image-69.png", x: 850, y: 478, h: 56, w: 136 },
    guantes:  { src: "assets/cutouts/image-33.png", x: 850, y: 718, h: 112, w: 91 },
    jabon:    { src: "assets/cutouts/jabn-lquido.png", x: 490, y: 722, h: 122, w: 79 },
    toallitas:{ src: "assets/cutouts/image-67.png", x: 605, y: 735, h: 92, w: 54 }
  };
  var CHIPS = {
    tissue:   { x: 140, y: 222, f: 142, label: "PAPEL TISSUE", n: "124" },
    cafeteria:{ x: 845, y: 222, f: 148, label: "CAFETERÍA", n: "146" },
    oficina:  { x: 490, y: 335, f: 148, label: "OFICINA", n: "259" },
    tecno:    { x: 850, y: 478, f: 88, label: "TECNOLOGÍA", n: "80" },
    ferre:    { x: 850, y: 718, f: 140, label: "FERRETERÍA", n: "62" },
    aseo:     { x: 545, y: 735, f: 152, label: "ASEO Y LIMPIEZA", n: "540" }
  };
  var ROOMS = {
    bano: [130, 150], cocina: [850, 150], escritorios: [480, 260], ti: [850, 420],
    mantencion: [850, 670], bodega: [480, 660], recepcion: [130, 550]
  };
  var HOME = { t: 50, r: -10, s: 0.74, cx: 520, cy: 420, ox: 540, oy: 600 };
  var FLAT = { t: 0, r: 0, s: 0.88, cx: 500, cy: 400, ox: 540, oy: 532 };
  var WALL_LAYERS = 10, WALL_STEP = 4;

  function el(tag, cls, parent) { var e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; }
  var NS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }

  window.Office3D = function (mount, prefix) {
    var css = el("style", null, mount);
    var p = prefix;
    css.textContent =
      "." + p + "o3-stage{position:absolute;inset:0;perspective:1700px;perspective-origin:540px 380px;overflow:hidden}" +
      "." + p + "o3-world{position:absolute;left:0;top:0;width:1000px;height:800px;transform-origin:0 0;transform-style:preserve-3d}" +
      "." + p + "o3-floor{position:absolute;inset:0;background:#FBFCFD;outline:2px solid rgba(26,58,92,0.25);box-shadow:0 0 0 14px rgba(26,58,92,0.04),0 40px 80px rgba(26,58,92,0.18);" +
        "background-image:linear-gradient(rgba(26,58,92,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(26,58,92,0.07) 1px,transparent 1px);background-size:25px 25px}" +
      "." + p + "o3-layer{position:absolute;left:0;top:0;width:1000px;height:800px;overflow:visible;pointer-events:none}" +
      "." + p + "o3-bb{position:absolute;left:0;top:0;transform-origin:50% 100%;transform-style:preserve-3d}" +
      "." + p + "o3-drop{position:absolute;left:0;bottom:0;width:100%;height:100%}" +
      "." + p + "o3-drop img{position:absolute;left:0;bottom:0;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 3px 2px rgba(26,58,92,0.25))}" +
      "." + p + "o3-shadow{position:absolute;border-radius:50%;background:radial-gradient(closest-side,rgba(26,58,92,0.38),rgba(26,58,92,0))}" +
      "." + p + "o3-chip{display:flex;align-items:center;gap:7px;padding:7px 13px;border-radius:999px;background:#1A3A5C;color:#F3F5F7;white-space:nowrap;box-shadow:0 6px 14px rgba(26,58,92,0.25)}" +
      "." + p + "o3-chip b{font-family:'Rubik',sans-serif;font-weight:600;font-size:16px;letter-spacing:0.12em}" +
      "." + p + "o3-chip span{font-family:'DM Mono',monospace;font-weight:500;font-size:16px;color:#F5A623}" +
      "." + p + "o3-tag{font-family:'DM Mono',monospace;font-weight:500;font-size:19px;letter-spacing:0.08em;padding:8px 13px;border:2px solid #1A3A5C;background:#F3F5F7;color:#1A3A5C;white-space:nowrap;box-shadow:0 6px 14px rgba(26,58,92,0.2)}";

    var stage = el("div", p + "o3-stage", mount);
    var world = el("div", p + "o3-world", stage);
    var floor = el("div", p + "o3-floor", world);

    var flat = svgEl("svg", { viewBox: "0 0 1000 800", width: 1000, height: 800, "class": p + "o3-layer" }, world);
    var furn = svgEl("g", { fill: "none", stroke: "#5E849E", "stroke-width": 3 }, flat);
    furn.innerHTML = FURNITURE;
    var labels = svgEl("g", { fill: "#1A3A5C", "font-family": "DM Mono, monospace", "font-size": 20, "letter-spacing": 2 }, flat);
    LABELS.forEach(function (l) { var t = svgEl("text", { x: l[1], y: l[2], "text-anchor": l[3] }, labels); t.textContent = l[0]; });

    var wallLayers = [];
    for (var i = 0; i < WALL_LAYERS; i++) {
      var top = i === WALL_LAYERS - 1;
      var svg = svgEl("svg", { viewBox: "0 0 1000 800", width: 1000, height: 800, "class": p + "o3-layer" }, world);
      var g = svgEl("g", { fill: "none", stroke: top ? "#1A3A5C" : (i === 0 ? "#1A3A5C" : "#3E6488"), "stroke-width": 10, "stroke-linecap": "square" }, svg);
      var paths = WALLS.map(function (d) { return svgEl("path", { d: d }, g); });
      svg.style.transform = "translateZ(0px)";
      wallLayers.push({ svg: svg, paths: paths, z: (i + 1) * WALL_STEP });
    }

    var billboards = [];
    function billboard(x, y, w, h, inner) {
      var bb = el("div", p + "o3-bb", world);
      bb.style.width = w + "px"; bb.style.height = h + "px";
      bb.style.left = (x - w / 2) + "px"; bb.style.top = (y - h) + "px";
      var drop = el("div", p + "o3-drop", bb);
      if (inner) drop.appendChild(inner);
      billboards.push(bb);
      return { bb: bb, drop: drop };
    }

    var products = {};
    Object.keys(PRODUCTS).forEach(function (k) {
      var d = PRODUCTS[k];
      var sh = el("div", p + "o3-shadow", world);
      sh.style.width = (d.w * 1.15) + "px"; sh.style.height = (d.w * 0.42) + "px";
      sh.style.left = (d.x - d.w * 0.575) + "px"; sh.style.top = (d.y - d.w * 0.21) + "px";
      var img = el("img"); img.src = d.src; img.alt = "";
      var b = billboard(d.x, d.y, d.w, d.h, img);
      products[k] = { bb: b.bb, drop: b.drop, shadow: sh };
    });

    var chips = {};
    Object.keys(CHIPS).forEach(function (k) {
      var c = CHIPS[k];
      var chip = el("div", p + "o3-chip");
      chip.innerHTML = "<b>" + c.label + "</b><span>· " + c.n + "</span>";
      var b = billboard(c.x, c.y, 300, c.f + 36, null);
      b.drop.style.display = "flex"; b.drop.style.justifyContent = "center"; b.drop.style.alignItems = "flex-start";
      b.drop.appendChild(chip);
      chips[k] = { bb: b.bb, drop: b.drop, chip: chip };
    });

    var tags = {};
    [["papel", "SIN PAPEL", 130, 170], ["cafe", "SIN CAFÉ", 850, 170], ["toner", "SIN TÓNER", 480, 310]].forEach(function (t) {
      var tag = el("div", p + "o3-tag"); tag.textContent = t[1];
      var b = billboard(t[2], t[3], 240, 46, null);
      b.drop.style.display = "flex"; b.drop.style.justifyContent = "center"; b.drop.style.alignItems = "flex-end";
      b.drop.appendChild(tag);
      tags[t[0]] = { bb: b.bb, drop: b.drop, tag: tag };
    });

    var cam = { t: HOME.t, r: HOME.r, s: HOME.s, cx: HOME.cx, cy: HOME.cy, ox: HOME.ox, oy: HOME.oy, wall: 1 };
    function apply() {
      world.style.transform = "translate(" + cam.ox + "px," + cam.oy + "px) rotateX(" + cam.t + "deg) rotateZ(" + cam.r + "deg) scale(" + cam.s + ") translate(" + (-cam.cx) + "px," + (-cam.cy) + "px)";
      var bbT = "rotateZ(" + (-cam.r) + "deg) rotateX(" + (-cam.t) + "deg)";
      for (var i = 0; i < billboards.length; i++) billboards[i].style.transform = bbT;
      for (var j = 0; j < wallLayers.length; j++) {
        wallLayers[j].svg.style.transform = "translateZ(" + (wallLayers[j].z * cam.wall) + "px)";
        wallLayers[j].svg.style.opacity = j === wallLayers.length - 1 ? 1 : cam.wall;
      }
    }
    function set(state) { for (var k in state) cam[k] = state[k]; apply(); }
    function room(name, extra) { var r = ROOMS[name]; var o = { cx: r[0], cy: r[1] }; for (var k in extra) o[k] = extra[k]; return o; }
    apply();

    return {
      cam: cam, apply: apply, set: set, room: room, HOME: HOME, FLAT: FLAT,
      stage: stage, world: world, floor: floor, flatLayer: flat, furniture: furn, labels: labels,
      wallLayers: wallLayers, topWallPaths: wallLayers[wallLayers.length - 1].paths,
      products: products, chips: chips, tags: tags
    };
  };
})();
