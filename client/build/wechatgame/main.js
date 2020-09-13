"use strict";

window.boot = function () {
  var settings = window._CCSettings;
  window._CCSettings = undefined;

  var onStart = function onStart() {
    cc.view.enableRetina(true);
    cc.view.resizeWithBrowserSize(true);
    var launchScene = settings.launchScene; // load scene

    cc.director.loadScene(launchScene, null, function () {
      console.log('Success to load scene: ' + launchScene);
    });
  };

  var isSubContext = cc.sys.platform === cc.sys.WECHAT_GAME_SUB;
  var option = {
    id: 'GameCanvas',
    debugMode: settings.debug ? cc.debug.DebugMode.INFO : cc.debug.DebugMode.ERROR,
    showFPS: !isSubContext && settings.debug,
    frameRate: 60,
    groupList: settings.groupList,
    collisionMatrix: settings.collisionMatrix
  };
  cc.assetManager.init({
    bundleVers: settings.bundleVers,
    subpackages: settings.subpackages,
    remoteBundles: settings.remoteBundles,
    server: settings.server,
    subContextRoot: settings.subContextRoot
  });
  var _cc$AssetManager$Buil = cc.AssetManager.BuiltinBundleName,
      RESOURCES = _cc$AssetManager$Buil.RESOURCES,
      INTERNAL = _cc$AssetManager$Buil.INTERNAL,
      MAIN = _cc$AssetManager$Buil.MAIN,
      START_SCENE = _cc$AssetManager$Buil.START_SCENE;
  var bundleRoot = [INTERNAL, MAIN];
  settings.hasStartSceneBundle && bundleRoot.push(START_SCENE);
  settings.hasResourcesBundle && bundleRoot.push(RESOURCES);
  var count = 0;

  function cb(err) {
    if (err) return console.error(err.message, err.stack);
    count++;

    if (count === bundleRoot.length + 1) {
      cc.game.run(option, onStart);
    }
  } // load plugins


  cc.assetManager.loadScript(settings.jsList.map(function (x) {
    return 'src/' + x;
  }), cb); // load bundles

  for (var i = 0; i < bundleRoot.length; i++) {
    cc.assetManager.loadBundle(bundleRoot[i], cb);
  }
};