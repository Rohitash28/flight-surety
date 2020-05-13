import DOM from "./dom";

const STATUS = {
  0: "UNKNOWN",
  10: "ON_TIME",
  20: "LATE_AIRLINE",
  30: "LATE_WEATHER",
  40: "LATE_TECHNICAL",
  50: "LATE_OTHER",
};

export default class UIHelpers {
  static updateStatus(data) {
    DOM.elid("status: " + data.timestamp).innerHTML = STATUS[data.status];
  }

  static updateInsurancePayout(data) {
    DOM.elid("Insurance Payout: " + data.timestamp).innerHTML =
      data.insurancePayoutValue + "ETH";
  }

  static updatePassengerBalance(balance = 0) {
    DOM.elid("Balance Value: ").innerHTML = balance + "ETH";
  }
}
