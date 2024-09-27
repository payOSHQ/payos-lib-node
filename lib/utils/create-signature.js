"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSignatureFromObj = createSignatureFromObj;
exports.createSignatureOfPaymentRequest = createSignatureOfPaymentRequest;
var sort_obj_by_key_1 = __importDefault(require("./sort-obj-by-key"));
var convert_obj_to_query_str_1 = __importDefault(require("./convert-obj-to-query-str"));
var crypto_1 = require("crypto");
function createSignatureFromObj(data, key) {
    if (!data || !key.length) {
        return null;
    }
    var sortedDataByKey = (0, sort_obj_by_key_1.default)(data);
    var dataQueryStr = (0, convert_obj_to_query_str_1.default)(sortedDataByKey);
    var dataToSignature = (0, crypto_1.createHmac)("sha256", key)
        .update(dataQueryStr)
        .digest("hex");
    return dataToSignature;
}
;
function createSignatureOfPaymentRequest(data, key) {
    if (!data || !key.length) {
        return null;
    }
    var amount = data.amount, cancelUrl = data.cancelUrl, description = data.description, orderCode = data.orderCode, returnUrl = data.returnUrl;
    var dataStr = "amount=".concat(amount, "&cancelUrl=").concat(cancelUrl, "&description=").concat(description, "&orderCode=").concat(orderCode, "&returnUrl=").concat(returnUrl);
    var dataToSignature = (0, crypto_1.createHmac)("sha256", key)
        .update(dataStr)
        .digest("hex");
    return dataToSignature;
}
;
