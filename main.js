document.documentElement.classList.add('js-ready');
var yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var hasFinePointer = window.matchMedia('(pointer:fine)').matches;

/* ============================================================
   PROGRESSIVE REVEAL — safe by construction.
   Elements are visible by default (plain CSS). We only ever
   ADD the hidden state right before we're able to also observe
   and reveal it. If this script fails for any reason, nothing
   on the page is ever left invisible.
============================================================= */
(function reveal() {
  try {
    var els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    els.forEach(function (el) { el.classList.add('reveal-armed'); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    els.forEach(function (el) { io.observe(el); });
  } catch (e) { console.warn('reveal init skipped:', e); }
})();

/* ============================================================
   NAV — solidify on scroll
============================================================= */
(function nav() {
  try {
    var navEl = document.getElementById('nav');
    if (!navEl) return;
    function onScroll() { navEl.classList.toggle('is-solid', window.scrollY > 40); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  } catch (e) { console.warn('nav init skipped:', e); }
})();

/* ============================================================
   PHOTOS — fade in on load, graceful fallback on error
============================================================= */
(function photos() {
  try {
    document.querySelectorAll('.photo img').forEach(function (img) {
      function markLoaded() { img.classList.add('is-loaded'); }
      function markFailed() { img.closest('.photo').classList.add('load-failed'); }
      if (img.complete && img.naturalWidth > 0) markLoaded();
      else {
        img.addEventListener('load', markLoaded);
        img.addEventListener('error', markFailed);
      }
    });
  } catch (e) { console.warn('photo init skipped:', e); }
})();

/* ============================================================
   CUSTOM CURSOR + MAGNETIC BUTTONS (pure CSS/JS, no libs)
============================================================= */
(function cursorAndMagnets() {
  try {
    if (!hasFinePointer) return;
    var cursor = document.getElementById('cursor');
    if (cursor) {
      var cx = 0, cy = 0, tx = 0, ty = 0;
      window.addEventListener('pointermove', function (e) {
        tx = e.clientX; ty = e.clientY;
        cursor.classList.add('is-visible');
      });
      (function raf() {
        cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
        cursor.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
        requestAnimationFrame(raf);
      })();
      document.querySelectorAll('[data-hover]').forEach(function (el) {
        el.addEventListener('mouseenter', function () { cursor.classList.add('is-big'); });
        el.addEventListener('mouseleave', function () { cursor.classList.remove('is-big'); });
      });
    }

    document.querySelectorAll('.btn').forEach(function (btn) {
      var strength = 0.3;
      btn.style.transition = 'transform .4s cubic-bezier(.22,1,.36,1), background .4s cubic-bezier(.22,1,.36,1)';
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var mx = e.clientX - (r.left + r.width / 2);
        var my = e.clientY - (r.top + r.height / 2);
        btn.style.transform = 'translate(' + (mx * strength) + 'px,' + (my * strength) + 'px)';
      });
      btn.addEventListener('mouseleave', function () { btn.style.transform = 'translate(0,0)'; });
    });
  } catch (e) { console.warn('cursor/magnet init skipped:', e); }
})();

/* ============================================================
   SVG DRAW-INS (chart line, workflow paths) — CSS transition
   on stroke-dashoffset, triggered by IntersectionObserver.
   Falls back to fully-drawn (no animation) if IO is unavailable.
============================================================= */
(function svgDrawIns() {
  try {
    var targets = [];
    var chartLine = document.getElementById('chartLine');
    if (chartLine) targets.push(chartLine);
    document.querySelectorAll('.flow-path').forEach(function (p) { targets.push(p); });
    if (!targets.length) return;

    targets.forEach(function (path) {
      var len = path.getTotalLength();
      path.style.strokeDasharray = len;
      if (reduceMotion || !('IntersectionObserver' in window)) {
        path.style.strokeDashoffset = 0;
        return;
      }
      path.style.strokeDashoffset = len;
      path.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)';
    });

    if (reduceMotion || !('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.strokeDashoffset = 0;
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    targets.forEach(function (t) { io.observe(t); });
  } catch (e) { console.warn('svg draw-in skipped:', e); }
})();

/* ============================================================
   FLOW DOTS — small dots traveling along the workflow paths
============================================================= */
(function flowDots() {
  try {
    if (reduceMotion) return;
    var paths = document.querySelectorAll('.flow-path');
    if (!paths.length) return;
    var runners = [];
    paths.forEach(function (path, i) {
      var len = path.getTotalLength();
      var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('r', '3.2');
      dot.setAttribute('class', 'flow-dot');
      path.parentNode.appendChild(dot);
      runners.push({ path: path, dot: dot, len: len, offset: i * 0.33, speed: 0.00028 });
    });
    function loop(now) {
      runners.forEach(function (r) {
        var v = (now * r.speed + r.offset) % 1;
        var pt = r.path.getPointAtLength(v * r.len);
        r.dot.setAttribute('cx', pt.x);
        r.dot.setAttribute('cy', pt.y);
      });
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  } catch (e) { console.warn('flow dots skipped:', e); }
})();

/* ============================================================
   BROWSER STACK — light scroll parallax
============================================================= */
(function browserParallax() {
  try {
    if (reduceMotion) return;
    var stack = document.querySelector('.browser-stack');
    if (!stack) return;
    var layers = [
      { el: stack.querySelector('.browser.b1'), depth: 6 },
      { el: stack.querySelector('.browser.b2'), depth: 14 },
      { el: stack.querySelector('.browser.b3'), depth: 22 }
    ].filter(function (l) { return l.el; });
    if (!layers.length) return;
    function onScroll() {
      var rect = stack.getBoundingClientRect();
      var vh = window.innerHeight;
      var progress = 1 - (rect.top + rect.height / 2) / (vh + rect.height);
      layers.forEach(function (l) {
        var base = l.el.classList.contains('b2') ? 'translate(28px,26px) rotate(2deg)' :
                   l.el.classList.contains('b3') ? 'translate(56px,52px) rotate(4deg)' : '';
        l.el.style.transform = base + ' translateY(' + (-progress * l.depth) + 'px)';
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  } catch (e) { console.warn('parallax skipped:', e); }
})();

/* ============================================================
   WORK ITEM EXPAND/COLLAPSE
============================================================= */
(function workItems() {
  try {
    document.querySelectorAll('[data-work]').forEach(function (item) {
      var plus = document.createElement('span');
      plus.className = 'work-plus';
      item.appendChild(plus);

      var reveal = item.querySelector('.work-reveal');
      if (!reveal) return;
      var open = false;
      item.addEventListener('click', function () {
        open = !open;
        item.classList.toggle('is-open', open);
        reveal.style.height = open ? reveal.scrollHeight + 'px' : '0px';
      });
    });
  } catch (e) { console.warn('work items skipped:', e); }
})();

/* ============================================================
   FLUID TIDE — a real 3D displaced ocean surface, raw WebGL,
   zero external dependencies (no three.js). A grid mesh is
   displaced per-vertex with layered noise, lit with a simple
   directional + fresnel term, and viewed with a perspective
   camera that dollies gently as the page scrolls.
============================================================= */
(function fluidTide() {
  var mat4 = {
    perspective: function (fovy, aspect, near, far) {
      var f = 1.0 / Math.tan(fovy / 2), nf = 1 / (near - far);
      return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, 2 * far * near * nf, 0
      ]);
    },
    lookAt: function (eye, center, up) {
      var ex = eye[0], ey = eye[1], ez = eye[2];
      var cx = center[0], cy = center[1], cz = center[2];
      var ux = up[0], uy = up[1], uz = up[2];
      var zx = ex - cx, zy = ey - cy, zz = ez - cz;
      var zl = Math.sqrt(zx * zx + zy * zy + zz * zz) || 1; zx /= zl; zy /= zl; zz /= zl;
      var xx = uy * zz - uz * zy, xy = uz * zx - ux * zz, xz = ux * zy - uy * zx;
      var xl = Math.sqrt(xx * xx + xy * xy + xz * xz) || 1; xx /= xl; xy /= xl; xz /= xl;
      var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
      return new Float32Array([
        xx, yx, zx, 0,
        xy, yy, zy, 0,
        xz, yz, zz, 0,
        -(xx * ex + xy * ey + xz * ez), -(yx * ex + yy * ey + yz * ez), -(zx * ex + zy * ey + zz * ez), 1
      ]);
    }
  };

  function buildGrid(segX, segZ) {
    var positions = [];
    var indices = [];
    for (var iz = 0; iz <= segZ; iz++) {
      for (var ix = 0; ix <= segX; ix++) {
        positions.push((ix / segX) * 2 - 1, (iz / segZ) * 2 - 1);
      }
    }
    for (iz = 0; iz < segZ; iz++) {
      for (ix = 0; ix < segX; ix++) {
        var a = iz * (segX + 1) + ix;
        var b = a + 1;
        var c = a + (segX + 1);
        var d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
    return { positions: new Float32Array(positions), indices: new Uint16Array(indices) };
  }

  var VERT = [
    'attribute vec2 aXZ;',
    'uniform mat4 uProjection;',
    'uniform mat4 uView;',
    'uniform float uTime;',
    'uniform float uScrollT;',
    'uniform float uExtentX;',
    'uniform float uExtentZ;',
    'uniform float uHeightScale;',
    'varying vec3 vNormal;',
    'varying float vHeight;',
    'varying float vFog;',
    'varying float vSideFog;',

    'float hash(vec2 p){',
    '  p = fract(p*vec2(123.34,456.21));',
    '  p += dot(p,p+45.32);',
    '  return fract(p.x*p.y);',
    '}',
    'float noise(vec2 p){',
    '  vec2 i = floor(p); vec2 f = fract(p);',
    '  float a = hash(i);',
    '  float b = hash(i+vec2(1.0,0.0));',
    '  float c = hash(i+vec2(0.0,1.0));',
    '  float d = hash(i+vec2(1.0,1.0));',
    '  vec2 u = f*f*(3.0-2.0*f);',
    '  return mix(a,b,u.x) + (c-a)*u.y*(1.0-u.x) + (d-b)*u.x*u.y;',
    '}',
    'float fbm(vec2 p){',
    '  float v = 0.0; float amp = 0.5;',
    '  for(int i=0;i<4;i++){ v += amp*noise(p); p *= 2.05; amp *= 0.5; }',
    '  return v;',
    '}',
    'float wave(vec2 pos, float t){',
    '  vec2 q = vec2(fbm(pos*0.6 + t*0.06), fbm(pos*0.6 - t*0.05 + 4.1));',
    '  return fbm(pos*0.6 + q*1.6 + t*0.1) * 0.55 + sin(pos.x*0.35 + t*0.5)*0.05;',
    '}',

    'void main(){',
    '  vec2 worldXZ = aXZ * vec2(uExtentX, uExtentZ);',
    '  worldXZ.y += uScrollT * 6.0;',

    '  float h = wave(worldXZ, uTime);',
    '  float e = 0.35;',
    '  float hX = wave(worldXZ + vec2(e,0.0), uTime);',
    '  float hZ = wave(worldXZ + vec2(0.0,e), uTime);',
    '  vec3 tangentX = vec3(e, hX - h, 0.0);',
    '  vec3 tangentZ = vec3(0.0, hZ - h, e);',
    '  vNormal = normalize(cross(tangentZ, tangentX));',

    '  vHeight = h;',
    '  vec3 pos = vec3(worldXZ.x, h * uHeightScale, worldXZ.y);',
    '  vFog = clamp((-pos.z + 4.0) / (uExtentZ * 1.05), 0.0, 1.0);',
    '  vSideFog = smoothstep(uExtentX*0.62, uExtentX, abs(pos.x));',

    '  gl_Position = uProjection * uView * vec4(pos, 1.0);',
    '}'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    'varying vec3 vNormal;',
    'varying float vHeight;',
    'varying float vFog;',
    'varying float vSideFog;',
    'uniform vec3 uColorBase;',
    'uniform vec3 uColorMist;',
    'uniform vec3 uColorDeep;',
    'uniform vec2 uMouse;',
    'uniform float uMouseStrength;',
    'uniform vec2 uResolution;',

    'void main(){',
    '  vec3 N = normalize(vNormal);',
    '  vec3 L = normalize(vec3(0.25, 0.85, 0.35));',
    '  float diffuse = max(dot(N,L), 0.0);',
    '  vec3 V = vec3(0.0,1.0,0.15);',
    '  float fresnel = pow(1.0 - max(dot(N,V),0.0), 3.0);',

    '  vec3 col = mix(uColorBase, uColorMist, clamp(vHeight*1.3 + 0.25, 0.0, 1.0));',
    '  col = mix(col, uColorDeep, clamp((1.0-diffuse)*0.5, 0.0, 0.45));',
    '  col += fresnel * 0.16;',
    '  col += pow(diffuse,6.0) * 0.14;',

    '  vec2 sc = gl_FragCoord.xy / uResolution;',
    '  float md = distance(sc, uMouse);',
    '  col += smoothstep(0.28,0.0,md) * 0.12 * uMouseStrength;',

    '  col = mix(col, uColorBase, clamp(vFog + vSideFog, 0.0, 1.0));',

    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function hexToRgb01(hex) {
    return [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
  }

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('Tide shader compile error:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  function createOceanScene(canvas, opts) {
    var gl = canvas.getContext('webgl', { antialias: true, alpha: false }) ||
             canvas.getContext('experimental-webgl', { antialias: true, alpha: false });
    if (!gl) return null;

    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Tide program link error:', gl.getProgramInfoLog(prog));
      return null;
    }
    gl.useProgram(prog);
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.98, 0.98, 0.97, 1);

    var grid = buildGrid(opts.segX, opts.segZ);
    var posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, grid.positions, gl.STATIC_DRAW);
    var aXZ = gl.getAttribLocation(prog, 'aXZ');
    gl.enableVertexAttribArray(aXZ);
    gl.vertexAttribPointer(aXZ, 2, gl.FLOAT, false, 0, 0);

    var idxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, grid.indices, gl.STATIC_DRAW);

    var u = {};
    ['uProjection', 'uView', 'uTime', 'uScrollT', 'uExtentX', 'uExtentZ', 'uHeightScale',
     'uColorBase', 'uColorMist', 'uColorDeep', 'uMouse', 'uMouseStrength', 'uResolution'
    ].forEach(function (name) { u[name] = gl.getUniformLocation(prog, name); });

    var colorBase = hexToRgb01(opts.colorBase);
    var colorMist = hexToRgb01(opts.colorMist);
    var colorDeep = hexToRgb01(opts.colorDeep);
    var maxPR = opts.maxPR || 1.5;

    var targetMouse = [0.5, 0.5], mouseVal = [0.5, 0.5];
    var targetStrength = 0, strengthVal = 0;
    var scrollVal = 0;

    function resize() {
      var w = canvas.clientWidth || canvas.parentElement.clientWidth || 1;
      var h = canvas.clientHeight || canvas.parentElement.clientHeight || 1;
      var dpr = Math.min(window.devicePixelRatio || 1, maxPR);
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
    }
    resize();

    return {
      canvas: canvas,
      resize: resize,
      setMouse: function (nx, ny, strength) { targetMouse[0] = nx; targetMouse[1] = ny; targetStrength = strength; },
      setScroll: function (v) { scrollVal = v; },
      render: function (t) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        mouseVal[0] += (targetMouse[0] - mouseVal[0]) * 0.06;
        mouseVal[1] += (targetMouse[1] - mouseVal[1]) * 0.06;
        strengthVal += (targetStrength - strengthVal) * 0.05;

        var aspect = canvas.width / canvas.height;
        var proj = mat4.perspective(opts.fov, aspect, 0.1, 60);
        var scrollT = Math.min(scrollVal * opts.scrollDolly, 1.6);
        var eye = [0, opts.eyeY - scrollT * 1.1, opts.eyeZ + scrollT * 1.8];
        var view = mat4.lookAt(eye, [0, 0, -3], [0, 1, 0]);

        gl.uniformMatrix4fv(u.uProjection, false, proj);
        gl.uniformMatrix4fv(u.uView, false, view);
        gl.uniform1f(u.uTime, t * opts.speed);
        gl.uniform1f(u.uScrollT, scrollT);
        gl.uniform1f(u.uExtentX, opts.extentX);
        gl.uniform1f(u.uExtentZ, opts.extentZ);
        gl.uniform1f(u.uHeightScale, opts.heightScale);
        gl.uniform3f(u.uColorBase, colorBase[0], colorBase[1], colorBase[2]);
        gl.uniform3f(u.uColorMist, colorMist[0], colorMist[1], colorMist[2]);
        gl.uniform3f(u.uColorDeep, colorDeep[0], colorDeep[1], colorDeep[2]);
        gl.uniform2f(u.uMouse, mouseVal[0], mouseVal[1]);
        gl.uniform1f(u.uMouseStrength, strengthVal);
        gl.uniform2f(u.uResolution, canvas.width, canvas.height);
        gl.drawElements(gl.TRIANGLES, grid.indices.length, gl.UNSIGNED_SHORT, 0);
      }
    };
  }

  try {
    var canvases = document.querySelectorAll('[data-fluid]');
    if (!canvases.length) return;

    var scenes = [];
    var isMobile = window.innerWidth < 760;

    canvases.forEach(function (canvas) {
      var kind = canvas.getAttribute('data-fluid');
      var big = kind === 'hero';
      var opts = {
        segX: isMobile ? 46 : (big ? 90 : 60),
        segZ: isMobile ? 56 : (big ? 110 : 74),
        extentX: 13, extentZ: 20, heightScale: 0.9,
        fov: 45 * Math.PI / 180,
        eyeY: big ? 5.4 : 4.6, eyeZ: big ? 9.5 : 8.2,
        scrollDolly: big ? 0.0022 : 0.0009,
        speed: reduceMotion ? 0 : (big ? 1.0 : 0.65),
        maxPR: isMobile ? 1.2 : (big ? 1.5 : 1.35),
        colorBase: 0xFAFAF8,
        colorMist: big ? 0xCFE6FF : 0xE3F0FF,
        colorDeep: big ? 0x8FBBEE : 0xBFDCFA
      };
      var scene = createOceanScene(canvas, opts);
      if (scene) scenes.push(scene);
    });

    if (!scenes.length) {
      document.body.classList.add('no-webgl');
      return;
    }

    window.addEventListener('resize', function () {
      scenes.forEach(function (s) { s.resize(); });
    });

    if (hasFinePointer && !reduceMotion) {
      window.addEventListener('pointermove', function (e) {
        scenes.forEach(function (s) {
          var rect = s.canvas.getBoundingClientRect();
          if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
            var nx = (e.clientX - rect.left) / rect.width;
            var ny = 1.0 - (e.clientY - rect.top) / rect.height;
            s.setMouse(nx, ny, 1.0);
          }
        });
      });
    }

    window.addEventListener('scroll', function () {
      scenes.forEach(function (s) {
        var rect = s.canvas.getBoundingClientRect();
        var localScroll = Math.max(0, -rect.top);
        s.setScroll(localScroll);
      });
    }, { passive: true });

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          entry.target.dataset.visible = entry.isIntersecting ? '1' : '0';
        });
      }, { threshold: 0.01 });
      scenes.forEach(function (s) { io.observe(s.canvas); });
    }

    var start = null;
    function loop(now) {
      if (start === null) start = now;
      var t = (now - start) / 1000;
      scenes.forEach(function (s) {
        if (s.canvas.dataset.visible !== '0') s.render(t);
      });
      if (!reduceMotion) requestAnimationFrame(loop);
    }
    if (reduceMotion) {
      scenes.forEach(function (s) { s.render(0.4); });
    } else {
      requestAnimationFrame(loop);
    }
  } catch (e) {
    console.warn('fluid tide skipped:', e);
    document.body.classList.add('no-webgl');
  }
})();
