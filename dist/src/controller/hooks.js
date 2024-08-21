"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControllerHook = void 0;
class ControllerHook {
    constructor(controllerClassName, methodName, { isStatic = false, only = [], except = [], }) {
        this.controllerClassName = controllerClassName;
        this.methodName = methodName;
        this.isStatic = isStatic;
        this.only = only;
        this.except = except;
    }
    shouldFireForAction(actionName) {
        if (!!this.only.length && this.only.includes(actionName))
            return true;
        if (!!this.only.length && !this.only.includes(actionName))
            return false;
        if (!!this.except.length && this.except.includes(actionName))
            return false;
        if (!!this.except.length && !this.except.includes(actionName))
            return true;
        return true;
    }
}
exports.ControllerHook = ControllerHook;
