import "babel-polyfill";
import chai, { expect } from "chai"; // assertions
// import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";
import sinonChai from "sinon-chai"; // assertions for sinon
import sinonTest from "sinon-test";

chai.use(sinonChai);
// chai.use(chaiAsPromised);
global.expect = expect;

global.sinon = sinon;
sinon.test = sinonTest(sinon, { useFakeTimers: false });