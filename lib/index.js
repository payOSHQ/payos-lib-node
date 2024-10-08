"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var axios_1 = __importDefault(require("axios"));
var create_signature_1 = require("./utils/create-signature");
var custom_error_1 = require("./custom-error");
var constants_1 = require("./constants");
var PAYOS_BASE_URL = "https://api-merchant.payos.vn";
var PayOS = /** @class */ (function () {
    /**
     * Create a payOS object to use payment channel methods. Credentials are fields provided after creating a payOS payment channel
     * @param {string} clientId Client ID of the payOS payment channel
     * @param {string} apiKey Api Key of the payOS payment channel
     * @param {string} checksumKey Checksum Key of the payOS payment channel
     * @param {string} partnerCode Your partner code
     */
    function PayOS(clientId, apiKey, checksumKey, partnerCode) {
        this.clientId = clientId;
        this.apiKey = apiKey;
        this.checksumKey = checksumKey;
        if (partnerCode) {
            this.partnerCode = partnerCode;
        }
    }
    /**
     * Create a payment link for the order data passed in the parameter
     * @param {CheckoutRequestType} paymentData Payment data
     */
    PayOS.prototype.createPaymentLink = function (paymentData) {
        return __awaiter(this, void 0, void 0, function () {
            var orderCode, amount, returnUrl, cancelUrl, description, requiredPaymentData_1, requiredKeys, keysError, msgError, url, signaturePaymentRequest, headers, paymentLinkRes, paymentLinkResSignature, error_1, errorMessage;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        orderCode = paymentData.orderCode, amount = paymentData.amount, returnUrl = paymentData.returnUrl, cancelUrl = paymentData.cancelUrl, description = paymentData.description;
                        if (!(paymentData && orderCode && amount && returnUrl && cancelUrl && description)) {
                            requiredPaymentData_1 = {
                                orderCode: orderCode,
                                amount: amount,
                                returnUrl: returnUrl,
                                cancelUrl: cancelUrl,
                                description: description,
                            };
                            requiredKeys = Object.keys(requiredPaymentData_1);
                            keysError = requiredKeys.filter(function (key) {
                                return (requiredPaymentData_1[key] == undefined ||
                                    requiredPaymentData_1[key] == null);
                            });
                            msgError = "".concat(constants_1.ERROR_MESSAGE.INVALID_PARAMETER, " ").concat(keysError.join(", "), " must not be undefined or null.");
                            throw new Error(msgError);
                        }
                        url = "".concat(PAYOS_BASE_URL, "/v2/payment-requests");
                        signaturePaymentRequest = (0, create_signature_1.createSignatureOfPaymentRequest)(paymentData, this.checksumKey);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        headers = {
                            "x-client-id": this.clientId,
                            "x-api-key": this.apiKey,
                            "Content-Type": "application/json",
                        };
                        if (this.partnerCode) {
                            headers["x-partner-code"] = this.partnerCode;
                        }
                        return [4 /*yield*/, (0, axios_1.default)({
                                method: "POST",
                                url: url,
                                headers: headers,
                                data: __assign(__assign({}, paymentData), { signature: signaturePaymentRequest }),
                            }).then(function (resp) { return resp.data; })];
                    case 2:
                        paymentLinkRes = _b.sent();
                        if (paymentLinkRes.code == "00") {
                            paymentLinkResSignature = (0, create_signature_1.createSignatureFromObj)(paymentLinkRes.data, this.checksumKey);
                            if (paymentLinkResSignature !== paymentLinkRes.signature) {
                                throw new Error(constants_1.ERROR_MESSAGE.DATA_NOT_INTEGRITY);
                            }
                            if (paymentLinkRes.data) {
                                return [2 /*return*/, paymentLinkRes.data];
                            }
                        }
                        throw new custom_error_1.PayOSError({ code: paymentLinkRes.code, message: paymentLinkRes.desc });
                    case 3:
                        error_1 = _b.sent();
                        errorMessage = ((_a = error_1 === null || error_1 === void 0 ? void 0 : error_1.response) === null || _a === void 0 ? void 0 : _a.message) || (error_1 === null || error_1 === void 0 ? void 0 : error_1.message) || error_1;
                        throw new Error(errorMessage);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get payment information of an order that has created a payment link
     * @param {number | string} orderId Order Id
     */
    PayOS.prototype.getPaymentLinkInformation = function (orderId) {
        return __awaiter(this, void 0, void 0, function () {
            var url, paymentLinkInfoRes, paymentLinkInfoResSignature, error_2, errorMessage;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!orderId ||
                            (typeof orderId == "number" && (!Number.isInteger(orderId) || orderId <= 0)) ||
                            (typeof orderId == "string" && orderId.length == 0)) {
                            throw new Error(constants_1.ERROR_MESSAGE.INVALID_PARAMETER);
                        }
                        url = "".concat(PAYOS_BASE_URL, "/v2/payment-requests/").concat(orderId);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, axios_1.default)({
                                method: "GET",
                                url: url,
                                headers: {
                                    "x-client-id": this.clientId,
                                    "x-api-key": this.apiKey,
                                    "Content-Type": "application/json",
                                },
                            }).then(function (response) { return response.data; })];
                    case 2:
                        paymentLinkInfoRes = _b.sent();
                        if (paymentLinkInfoRes.code == "00") {
                            paymentLinkInfoResSignature = (0, create_signature_1.createSignatureFromObj)(paymentLinkInfoRes.data, this.checksumKey);
                            if (paymentLinkInfoResSignature !== paymentLinkInfoRes.signature) {
                                throw new Error(constants_1.ERROR_MESSAGE.DATA_NOT_INTEGRITY);
                            }
                            if (paymentLinkInfoRes.data) {
                                return [2 /*return*/, paymentLinkInfoRes.data];
                            }
                        }
                        throw new custom_error_1.PayOSError({ code: paymentLinkInfoRes.code, message: paymentLinkInfoRes.desc });
                    case 3:
                        error_2 = _b.sent();
                        errorMessage = ((_a = error_2 === null || error_2 === void 0 ? void 0 : error_2.response) === null || _a === void 0 ? void 0 : _a.message) || (error_2 === null || error_2 === void 0 ? void 0 : error_2.message) || error_2;
                        throw new Error(errorMessage);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Validate the Webhook URL of a payment channel and add or update the Webhook URL for that Payment Channel if successful.
     * @param {string} webhookUrl Your Webhook URL
     */
    PayOS.prototype.confirmWebhook = function (webhookUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var url, data, error_3, errorMessage;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (!webhookUrl || webhookUrl.length == 0) {
                            throw new Error(constants_1.ERROR_MESSAGE.INVALID_PARAMETER);
                        }
                        url = "".concat(PAYOS_BASE_URL, "/confirm-webhook");
                        data = {
                            webhookUrl: webhookUrl,
                        };
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, axios_1.default)({
                                method: "POST",
                                url: url,
                                headers: {
                                    "x-client-id": this.clientId,
                                    "x-api-key": this.apiKey,
                                    "Content-Type": "application/json",
                                },
                                data: data,
                            }).then(function (response) { return response.data; })];
                    case 2:
                        _e.sent();
                        return [2 /*return*/, webhookUrl];
                    case 3:
                        error_3 = _e.sent();
                        // const errorData = error?.response?.data || error?.response || error;
                        // console.error(errorData);
                        if (((_a = error_3.response) === null || _a === void 0 ? void 0 : _a.status) === 400)
                            throw new custom_error_1.PayOSError({
                                code: constants_1.ERROR_CODE.INTERNAL_SERVER_ERROR,
                                message: constants_1.ERROR_MESSAGE.WEBHOOK_URL_INVALID,
                            });
                        else if (((_b = error_3.response) === null || _b === void 0 ? void 0 : _b.status) === 401)
                            throw new custom_error_1.PayOSError({
                                code: constants_1.ERROR_CODE.UNAUTHORIZED,
                                message: constants_1.ERROR_MESSAGE.UNAUTHORIZED,
                            });
                        else if (String((_c = error_3.response) === null || _c === void 0 ? void 0 : _c.status).startsWith("5")) {
                            throw new custom_error_1.PayOSError({
                                code: constants_1.ERROR_CODE.INTERNAL_SERVER_ERROR,
                                message: constants_1.ERROR_MESSAGE.INTERNAL_SERVER_ERROR,
                            });
                        }
                        errorMessage = ((_d = error_3 === null || error_3 === void 0 ? void 0 : error_3.response) === null || _d === void 0 ? void 0 : _d.message) || (error_3 === null || error_3 === void 0 ? void 0 : error_3.message) || error_3;
                        throw new Error(errorMessage);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Cancel the payment link of the order
     * @param {number | string} orderId Order ID
     * @param {string} cancellationReason Reason for canceling payment link (optional)
     */
    PayOS.prototype.cancelPaymentLink = function (orderId, cancellationReason) {
        return __awaiter(this, void 0, void 0, function () {
            var url, data, cancelPaymentLinkResponse, paymentLinkInfoResSignature, error_4, errorMessage;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!orderId ||
                            (typeof orderId == "number" && (!Number.isInteger(orderId) || orderId <= 0)) ||
                            (typeof orderId == "string" && orderId.length == 0)) {
                            throw new Error(constants_1.ERROR_MESSAGE.INVALID_PARAMETER);
                        }
                        url = "".concat(PAYOS_BASE_URL, "/v2/payment-requests/").concat(orderId, "/cancel");
                        data = cancellationReason
                            ? { cancellationReason: cancellationReason }
                            : undefined;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, axios_1.default)({
                                method: "POST",
                                url: url,
                                headers: {
                                    "x-client-id": this.clientId,
                                    "x-api-key": this.apiKey,
                                    "Content-Type": "application/json",
                                },
                                data: data,
                            }).then(function (response) { return response.data; })];
                    case 2:
                        cancelPaymentLinkResponse = _b.sent();
                        if (cancelPaymentLinkResponse.code == "00") {
                            paymentLinkInfoResSignature = (0, create_signature_1.createSignatureFromObj)(cancelPaymentLinkResponse.data, this.checksumKey);
                            if (paymentLinkInfoResSignature !== cancelPaymentLinkResponse.signature) {
                                throw new Error(constants_1.ERROR_MESSAGE.DATA_NOT_INTEGRITY);
                            }
                            if (cancelPaymentLinkResponse.data) {
                                return [2 /*return*/, cancelPaymentLinkResponse.data];
                            }
                        }
                        throw new custom_error_1.PayOSError({
                            code: cancelPaymentLinkResponse.code,
                            message: cancelPaymentLinkResponse.desc,
                        });
                    case 3:
                        error_4 = _b.sent();
                        errorMessage = ((_a = error_4 === null || error_4 === void 0 ? void 0 : error_4.response) === null || _a === void 0 ? void 0 : _a.message) || (error_4 === null || error_4 === void 0 ? void 0 : error_4.message) || error_4;
                        throw new Error(errorMessage);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Verify data received via webhook after payment
     * @param webhookBody Request body received from webhook
     * @return {WebhookDataType} Payment data if payment data is valid, otherwise returns null
     */
    PayOS.prototype.verifyPaymentWebhookData = function (webhookBody) {
        var data = webhookBody.data, signature = webhookBody.signature;
        if (!data) {
            throw new Error(constants_1.ERROR_MESSAGE.NO_DATA);
        }
        if (!signature) {
            throw new Error(constants_1.ERROR_MESSAGE.NO_SIGNATURE);
        }
        var signData = (0, create_signature_1.createSignatureFromObj)(data, this.checksumKey);
        if (signData !== signature) {
            throw new Error(constants_1.ERROR_MESSAGE.DATA_NOT_INTEGRITY);
        }
        return data;
    };
    return PayOS;
}());
module.exports = PayOS;
