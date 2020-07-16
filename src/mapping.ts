import { BigInt, Bytes, Address } from '@graphprotocol/graph-ts';
import {
  Contract,
  Deposited,
  Withdrawn,
  WithdrawalRequested,
  FeeSet,
  WithdrawalLockDurationSet,
  WithdrawalUnlockDurationSet,
  TotalSupplyFactorSet,
  SigmoidParametersSet,
} from '../generated/Contract/Contract';
import { Deposit, CommonData } from '../generated/schema';

export function handleDeposited(event: Deposited): void {
  let id = event.params.sender.toHex() + '-' + event.params.id.toHex();
  let deposit = Deposit.load(id);
  if (deposit == null) {
    deposit = new Deposit(id);
    deposit.user = event.params.sender;
    deposit.depositId = event.params.id;
    deposit.amount = BigInt.fromI32(0);
    deposit.timestamp = BigInt.fromI32(0);
    deposit.withdrawalRequestTimestamp = BigInt.fromI32(0);
  }
  deposit.amount = event.params.balance;
  deposit.timestamp = event.block.timestamp;
  deposit.save();
  updateTotalDeposited(event.address);
}

export function handleWithdrawn(event: Withdrawn): void {
  let id = event.params.sender.toHex() + '-' + event.params.id.toHex();
  let deposit = Deposit.load(id);
  deposit.amount = event.params.balance;
  if (deposit.amount.isZero()) {
    deposit.timestamp = BigInt.fromI32(0);
  }
  let contract = Contract.bind(event.address);
  deposit.withdrawalRequestTimestamp = contract.withdrawalRequestsDates(event.params.sender, event.params.id);
  deposit.save();
  updateTotalDeposited(event.address);
}

export function handleWithdrawalRequested(event: WithdrawalRequested): void {
  let id = event.params.sender.toHex() + '-' + event.params.id.toHex();
  let deposit = Deposit.load(id);
  deposit.withdrawalRequestTimestamp = event.block.timestamp;
  deposit.save();
}

function getCommonDataEntity(): CommonData | null {
  let commonData = CommonData.load('common');
  if (commonData == null) {
    commonData = new CommonData('common');
    commonData.sigmoidParamA = BigInt.fromI32(0);
    commonData.sigmoidParamB = BigInt.fromI32(0);
    commonData.sigmoidParamC = BigInt.fromI32(0);
    commonData.fee = BigInt.fromI32(0);
    commonData.withdrawalLockDuration = BigInt.fromI32(0);
    commonData.withdrawalUnlockDuration = BigInt.fromI32(0);
    commonData.totalSupplyFactor = BigInt.fromI32(0);
    commonData.totalStaked = BigInt.fromI32(0);
  }
  return commonData;
}

function updateTotalDeposited(contractAddress: Address): void {
  let commonData = getCommonDataEntity();
  let contract = Contract.bind(contractAddress);
  commonData.totalStaked = contract.totalStaked();
  commonData.save();
}

export function handleFeeSet(event: FeeSet): void {
  let commonData = getCommonDataEntity();
  commonData.fee = event.params.value;
  commonData.save();
}

export function handleWithdrawalLockDurationSet(event: WithdrawalLockDurationSet): void {
  let commonData = getCommonDataEntity();
  commonData.withdrawalLockDuration = event.params.value;
  commonData.save();
}

export function handleWithdrawalUnlockDurationSet(event: WithdrawalUnlockDurationSet): void {
  let commonData = getCommonDataEntity();
  commonData.withdrawalUnlockDuration = event.params.value;
  commonData.save();
}

export function handleTotalSupplyFactorSet(event: TotalSupplyFactorSet): void {
  let commonData = getCommonDataEntity();
  commonData.totalSupplyFactor = event.params.value;
  commonData.save();
}

export function handleSigmoidParametersSet(event: SigmoidParametersSet): void {
  let commonData = getCommonDataEntity();
  commonData.sigmoidParamA = event.params.a;
  commonData.sigmoidParamB = event.params.b;
  commonData.sigmoidParamC = event.params.c;
  commonData.save();
}
