const NodeHelper = {
  init: function () {
  },
  loaded: function () {
  },
  start: function () {
  },
  stop: function () {
  },
  socketNotificationReceived: function (_notification, _payload) { },
  create: function (classDef) {
    const newClass = function () {
      return { ...NodeHelper, ...classDef };
    };
    return newClass;
  },
};


module.exports = NodeHelper;