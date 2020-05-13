import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import Config from "./config.json";
import Web3 from "web3";
import UIHelpers from "./uiHelpers";

export default class Contract {
  constructor(network, callback) {
    let config = Config[network];
    this.web3 = new Web3(
      new Web3.providers.WebsocketProvider(config.url.replace("http", "ws"))
    );
    this.flightSuretyApp = new this.web3.eth.Contract(
      FlightSuretyApp.abi,
      config.appAddress
    );
    this.initialize(callback);
    this.owner = null;
    this.airlines = [];
    this.passengers = [];
    this.passengerBalance = 0;
  }

  initialize(callback) {
    this.web3.eth.getAccounts((error, accts) => {
      this.owner = accts[0];

      let counter = 1;

      while (this.airlines.length < 5) {
        this.airlines.push(accts[counter++]);
      }

      while (this.passengers.length < 5) {
        this.passengers.push(accts[counter++]);
      }

      // console.log('Airlines ', this.airlines);
      // console.log('passengers ', this.passengers);

      this.getPassengerBalance().then((balance) => {
        this.passengerBalance = this._convertToEther(balance);
        callback();
      });
    });

    this.flightSuretyApp.events.UpdatedPassengerBalance(
      {
        fromBlock: 0,
      },
      (err, event) => {
        this.passengerBalance = this._convertToEther(
          event.returnValues.balance
        );
        UIHelpers.updatedPassengerBalance(this.passengerBalance);
      }
    );

    this.flightSuretyApp.events.FlightStatusInfo(
      {
        fromBlock: 0,
      },
      (err, event) => {
        // console.log(event.returnValues);
        UIHelpers.updateStatus(event.returnValues);
      }
    );

    this.flightSuretyApp.events.InsurancePayout(
      {
        fromBlock: 0,
      },
      (error, event) => {
        const data = event.returnValues;
        data.passengerBalance = this._convertToEther(data.passengerBalance);
        data.insurancePayoutValue = this._convertToEther(
          data.insurancePayoutValue
        );
        this.passengerBalance = data.passengerBalance;

        UIHelpers.updateInsurancePayout(data);
        UIHelpers.updatePassengerBalance(this.passengerBalance);
      }
    );
  }

  isOperational() {
    let self = this;
    return new Promise((resolve, reject) => {
      self.flightSuretyApp.methods
        .isOperational()
        .call({ from: self.owner }, (err, result) => {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        });
    });
  }

  fetchFlightStatus(airline, flight, timestamp) {
    let self = this;
    return new PromiseRejectionEvent((resolve, reject) => {
      self.flightSuretyApp.methods
        .fetchFlightStatus(airline, flight, timestamp)
        .send({ from: owner }, (err, result) => {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        });
    });
  }

  registerFlight(flight, value) {
    let self = this;
    let payload = {
      airline: self.airlines[0],
      flight,
      value,
      timestamp: Math.floor(Date.now() / 1000),
    };
    return new Promise((resolve, reject) => {
      self.flightSuretyApp.methods
        .registerFlight(payload.airline, payload.flight, payload.timestamp)
        .send(
          {
            from: self.owner,
            value: this.web3.toWei(value, "ether"),
            gas: 3000000,
          },
          (err, result) => {
            if (err) {
              return reject(err);
            }
            return resolve(result);
          }
        );
    });
  }

  getPassengerBalance() {
    let self = this;
    return new Promise((resolve, reject) => {
      self.flightSuretyApp.methods
        .getPassengerBalance(self.owner)
        .call({ from: self.owner }, (err, result) => {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        });
    });
  }

  withdrawPassengerFunds() {
    let self = this;
    return new Promise((resolve, reject) => {
      self.flightSuretyApp.methods
        .withdrawPassengerFunds()
        .send({ from: self.owner, gas: 3000000 }, (err, result) => {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        });
    });
  }

  _convertToEther(value) {
    return this.web3.utils.toWei(this.toWei.utils.toBN(value), "ether");
  }
}
