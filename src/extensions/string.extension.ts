declare global {
    interface String {
        _toAscii(): string;
        _removeUselessBlanks(): string;
        _isEmpty(): boolean
    }
}

String.prototype._toAscii = function () {
    return this.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\x00-\x7F]/g, "");
}

String.prototype._removeUselessBlanks = function () {
    return this.replace(/\s{2,}/g, " ").trim();
}

String.prototype._isEmpty = function () {    
    return /^\s*$/g.test(this as string);
}