const NodeHelper = {
  init() {
  },
  loaded() {
  },
  start() {
  },
  stop() {
  },
  socketNotificationReceived(_notification: any, _payload: any) { },
  create(classDef) {
    const newClass = function () { return { ...NodeHelper, ...classDef }; };
    return newClass;
  },
};


export = NodeHelper;