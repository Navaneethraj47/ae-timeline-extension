// =============================================
// AE Timeline Adjuster — Host Script (ExtendScript)
// =============================================

/**
 * Get info about the active composition
 */
function getCompInfo() {
  var comp = app.project.activeItem;
  if (!comp || !(comp instanceof CompItem)) {
    return JSON.stringify({ error: "No active composition found." });
  }
  return JSON.stringify({
    name: comp.name,
    duration: comp.duration,
    frameRate: comp.frameRate,
    workAreaStart: comp.workAreaStart,
    workAreaDuration: comp.workAreaDuration,
    numLayers: comp.numLayers
  });
}

/**
 * Set work area in/out points (in seconds)
 */
function setWorkArea(inPoint, outPoint) {
  var comp = app.project.activeItem;
  if (!comp || !(comp instanceof CompItem)) {
    return JSON.stringify({ error: "No active composition." });
  }
  try {
    app.beginUndoGroup("Set Work Area");
    comp.workAreaStart = parseFloat(inPoint);
    comp.workAreaDuration = parseFloat(outPoint) - parseFloat(inPoint);
    app.endUndoGroup();
    return JSON.stringify({ success: true, inPoint: inPoint, outPoint: outPoint });
  } catch (e) {
    return JSON.stringify({ error: e.message });
  }
}

/**
 * Trim composition to work area
 */
function trimCompToWorkArea() {
  var comp = app.project.activeItem;
  if (!comp || !(comp instanceof CompItem)) {
    return JSON.stringify({ error: "No active composition." });
  }
  try {
    app.beginUndoGroup("Trim Comp to Work Area");
    var newDuration = comp.workAreaDuration;
    var offset = comp.workAreaStart;
    // Shift all layers
    for (var i = 1; i <= comp.numLayers; i++) {
      var layer = comp.layer(i);
      layer.startTime -= offset;
    }
    comp.duration = newDuration;
    comp.workAreaStart = 0;
    app.endUndoGroup();
    return JSON.stringify({ success: true });
  } catch (e) {
    return JSON.stringify({ error: e.message });
  }
}

/**
 * Move current time indicator
 */
function setCurrentTime(seconds) {
  var comp = app.project.activeItem;
  if (!comp || !(comp instanceof CompItem)) {
    return JSON.stringify({ error: "No active composition." });
  }
  comp.time = parseFloat(seconds);
  return JSON.stringify({ success: true, time: comp.time });
}

/**
 * Get all layer names and their time info
 */
function getLayerInfo() {
  var comp = app.project.activeItem;
  if (!comp || !(comp instanceof CompItem)) {
    return JSON.stringify({ error: "No active composition." });
  }
  var layers = [];
  for (var i = 1; i <= comp.numLayers; i++) {
    var l = comp.layer(i);
    layers.push({
      index: i,
      name: l.name,
      inPoint: l.inPoint,
      outPoint: l.outPoint,
      startTime: l.startTime
    });
  }
  return JSON.stringify({ layers: layers });
}

/**
 * Shift selected layers by seconds
 */
function shiftSelectedLayers(seconds) {
  var comp = app.project.activeItem;
  if (!comp || !(comp instanceof CompItem)) {
    return JSON.stringify({ error: "No active composition." });
  }
  try {
    app.beginUndoGroup("Shift Layers");
    var shifted = 0;
    for (var i = 1; i <= comp.numLayers; i++) {
      if (comp.layer(i).selected) {
        comp.layer(i).startTime += parseFloat(seconds);
        shifted++;
      }
    }
    app.endUndoGroup();
    return JSON.stringify({ success: true, shifted: shifted });
  } catch (e) {
    return JSON.stringify({ error: e.message });
  }
}