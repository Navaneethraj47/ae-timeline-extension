// =============================================
// AE Timeline Adjuster — Main UI Script
// =============================================

var csInterface = new CSInterface();

// ─── Helpers ──────────────────────────────────
function setStatus(msg, type) {
  var bar = document.getElementById("status-bar");
  bar.textContent = msg;
  bar.className = "status-bar " + (type || "");
  if (type === "success" || type === "info") {
    setTimeout(function () {
      bar.textContent = "Ready";
      bar.className = "status-bar";
    }, 3000);
  }
}

function formatTime(seconds) {
  var s = parseFloat(seconds);
  if (isNaN(s)) return "—";
  return s.toFixed(2) + "s";
}

function evalScript(script, callback) {
  csInterface.evalScript(script, function (result) {
    try {
      var data = JSON.parse(result);
      if (data.error) {
        setStatus("Error: " + data.error, "error");
        return;
      }
      if (callback) callback(data);
    } catch (e) {
      setStatus("Parse error: " + e.message, "error");
    }
  });
}

// ─── Load Comp Info ────────────────────────────
function loadCompInfo() {
  setStatus("Loading composition...", "info");
  evalScript("getCompInfo()", function (data) {
    document.getElementById("comp-name").textContent = data.name;
    document.getElementById("info-duration").textContent = formatTime(data.duration);
    document.getElementById("info-fps").textContent = data.frameRate.toFixed(2);
    document.getElementById("info-workin").textContent = formatTime(data.workAreaStart);
    document.getElementById("info-workout").textContent = formatTime(
      data.workAreaStart + data.workAreaDuration
    );
    document.getElementById("info-layers").textContent = data.numLayers;

    // Pre-fill work area inputs
    document.getElementById("work-in").value = parseFloat(data.workAreaStart).toFixed(2);
    document.getElementById("work-out").value = (
      parseFloat(data.workAreaStart) + parseFloat(data.workAreaDuration)
    ).toFixed(2);

    setStatus("Loaded: " + data.name, "success");
    loadLayerInfo();
  });
}

// ─── Load Layer Info ───────────────────────────
function loadLayerInfo() {
  evalScript("getLayerInfo()", function (data) {
    var list = document.getElementById("layer-list");
    if (!data.layers || data.layers.length === 0) {
      list.innerHTML = '<div class="empty-state">No layers in composition</div>';
      return;
    }
    list.innerHTML = "";
    data.layers.forEach(function (layer) {
      var item = document.createElement("div");
      item.className = "layer-item";
      item.innerHTML =
        '<span class="layer-name">' + layer.index + ". " + layer.name + "</span>" +
        '<span class="layer-time">' +
          formatTime(layer.inPoint) + " → " + formatTime(layer.outPoint) +
        "</span>";
      list.appendChild(item);
    });
  });
}

// ─── Set Work Area ─────────────────────────────
document.getElementById("btn-set-work").addEventListener("click", function () {
  var inPt = document.getElementById("work-in").value;
  var outPt = document.getElementById("work-out").value;
  if (parseFloat(inPt) >= parseFloat(outPt)) {
    setStatus("In point must be less than out point", "error");
    return;
  }
  setStatus("Setting work area...", "info");
  evalScript("setWorkArea(" + inPt + ", " + outPt + ")", function () {
    setStatus("Work area set: " + formatTime(inPt) + " → " + formatTime(outPt), "success");
    loadCompInfo();
  });
});

// ─── Trim to Work Area ─────────────────────────
document.getElementById("btn-trim").addEventListener("click", function () {
  if (!confirm("Trim composition to work area? This cannot be undone easily.")) return;
  setStatus("Trimming composition...", "info");
  evalScript("trimCompToWorkArea()", function () {
    setStatus("Composition trimmed to work area", "success");
    loadCompInfo();
  });
});

// ─── Jump to Time ──────────────────────────────
document.getElementById("btn-jump").addEventListener("click", function () {
  var t = document.getElementById("jump-time").value;
  evalScript("setCurrentTime(" + t + ")", function () {
    setStatus("Jumped to " + formatTime(t), "success");
  });
});

// ─── Shift Layers ──────────────────────────────
document.getElementById("btn-shift-forward").addEventListener("click", function () {
  var offset = parseFloat(document.getElementById("shift-amount").value);
  evalScript("shiftSelectedLayers(" + offset + ")", function (data) {
    if (data.shifted === 0) {
      setStatus("No layers selected in After Effects", "error");
    } else {
      setStatus("Shifted " + data.shifted + " layer(s) forward by " + formatTime(offset), "success");
      loadLayerInfo();
    }
  });
});

document.getElementById("btn-shift-back").addEventListener("click", function () {
  var offset = parseFloat(document.getElementById("shift-amount").value);
  evalScript("shiftSelectedLayers(" + (-offset) + ")", function (data) {
    if (data.shifted === 0) {
      setStatus("No layers selected in After Effects", "error");
    } else {
      setStatus("Shifted " + data.shifted + " layer(s) back by " + formatTime(offset), "success");
      loadLayerInfo();
    }
  });
});

// ─── Refresh ───────────────────────────────────
document.getElementById("btn-refresh").addEventListener("click", loadCompInfo);

// ─── Auto-load on panel open ───────────────────
loadCompInfo();