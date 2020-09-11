"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mgobexsInterface;
(function (mgobexsInterface) {
    let CreateRoomType;
    (function (CreateRoomType) {
        CreateRoomType[CreateRoomType["COMMON_CREATE"] = 0] = "COMMON_CREATE";
        CreateRoomType[CreateRoomType["MATCH_CREATE"] = 1] = "MATCH_CREATE";
    })(CreateRoomType = mgobexsInterface.CreateRoomType || (mgobexsInterface.CreateRoomType = {}));
    let FrameSyncState;
    (function (FrameSyncState) {
        FrameSyncState[FrameSyncState["STOP"] = 0] = "STOP";
        FrameSyncState[FrameSyncState["START"] = 1] = "START";
    })(FrameSyncState = mgobexsInterface.FrameSyncState || (mgobexsInterface.FrameSyncState = {}));
    let NetworkState;
    (function (NetworkState) {
        NetworkState[NetworkState["COMMON_OFFLINE"] = 0] = "COMMON_OFFLINE";
        NetworkState[NetworkState["COMMON_ONLINE"] = 1] = "COMMON_ONLINE";
        NetworkState[NetworkState["RELAY_OFFLINE"] = 2] = "RELAY_OFFLINE";
        NetworkState[NetworkState["RELAY_ONLINE"] = 3] = "RELAY_ONLINE";
    })(NetworkState = mgobexsInterface.NetworkState || (mgobexsInterface.NetworkState = {}));
})(mgobexsInterface = exports.mgobexsInterface || (exports.mgobexsInterface = {}));
